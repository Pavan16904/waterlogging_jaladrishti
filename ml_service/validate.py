"""
JalaDrishti AI — Validation & Explainability Pipeline (Phase 4 Parts B & C)
============================================================================
Usage:
    python ml_service/validate.py

Outputs written to results/:
    metrics_validation.csv
    confusion_matrices.png
    ablation_bar.png
    calibration_curve.png
    shap_summary.png
    README.md

IMPORTANT: Label files in data/labels/labels_<district>.csv must exist.
           If a file is missing the district is skipped — no labels are invented.
           All label_source values in the demo files are "demo_synthetic";
           this script reports that prominently in results/README.md.
"""

import os
import sys
import json
import csv
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from collections import defaultdict

warnings.filterwarnings("ignore")

# ── Optional heavy deps — imported lazily so the script reports clearly if missing
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.calibration import CalibratedClassifierCV, calibration_curve
    from sklearn.metrics import (
        precision_score, recall_score, f1_score, roc_auc_score,
        average_precision_score, confusion_matrix, brier_score_loss,
    )
    from sklearn.preprocessing import StandardScaler
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False
    print("[!] scikit-learn not installed. Install: pip install scikit-learn", file=sys.stderr)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.gridspec as gridspec
    MPL_OK = True
except ImportError:
    MPL_OK = False
    print("[!] matplotlib not installed. Install: pip install matplotlib", file=sys.stderr)

try:
    import shap
    SHAP_OK = True
except ImportError:
    SHAP_OK = False
    print("[!] shap not installed. SHAP plots will be skipped. Install: pip install shap", file=sys.stderr)

# ── Paths
ROOT = Path(__file__).parent.parent
LABELS_DIR = ROOT / "data" / "labels"
RESULTS_DIR = ROOT / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# ── Validation districts (those with verified=true in waterlogService)
VALIDATION_DISTRICTS = {
    "bengaluru_urban": "Bengaluru Urban",
    "ballari":         "Ballari",
    "dharwad":         "Dharwad",
}

FEATURES = [
    "rainfall_3d_mm",
    "rainfall_7d_mm",
    "twi_mean",
    "slope_deg_mean",
    "drainage_class",
    "cropland_fraction",
]
OPTIONAL_FEATURE = "rainfall_observed_3d_mm"  # included if present

# ── Physics baseline score (mirrors Phase 2 risk model weights)
PHYSICS_WEIGHTS = {
    "rainfall_3d_mm": 0.45 / 75.0,    # normalised by 75 mm threshold
    "twi_mean":       0.35 / 9.0,     # normalised by TWI range 5–14
    "slope_deg_mean": -0.20 / 4.0,    # inverted slope contribution
}


def physics_score(row: pd.Series) -> float:
    rain_score = min(1.0, max(0.0, row["rainfall_3d_mm"] / 75.0))
    twi_score  = min(1.0, max(0.0, (row["twi_mean"] - 5.0) / 9.0))
    slope_score = min(1.0, max(0.0, 1.0 - row["slope_deg_mean"] / 4.0))
    return round(0.45 * rain_score + 0.35 * twi_score + 0.20 * slope_score, 4)


def load_district_labels(district_id: str) -> pd.DataFrame | None:
    path = LABELS_DIR / f"labels_{district_id}.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path)
    required = {"date", "block_id", "waterlogged"}
    missing = required - set(df.columns)
    if missing:
        print(f"[!] {path.name}: missing columns {missing} — skipping")
        return None
    df["waterlogged"] = df["waterlogged"].astype(int)
    return df


def spatial_cv_folds(df: pd.DataFrame, n_folds: int = 5):
    """Group by block_id and assign fold indices. No random splits."""
    blocks = sorted(df["block_id"].unique())
    fold_assignments = {}
    for i, block in enumerate(blocks):
        fold_assignments[block] = i % n_folds
    df = df.copy()
    df["_fold"] = df["block_id"].map(fold_assignments)
    return df, n_folds


def fit_rule_threshold(X_train: pd.DataFrame, y_train: np.ndarray):
    """
    Rule baseline: waterlogged if rainfall_3d_mm > T1 AND twi_mean > T2.
    Thresholds are fit inside the training fold by grid search on F1.
    """
    best_f1, best_t1, best_t2 = 0.0, 40.0, 10.0
    for t1 in np.percentile(X_train["rainfall_3d_mm"], [25, 50, 60, 70, 80]):
        for t2 in np.percentile(X_train["twi_mean"], [25, 40, 50, 60]):
            preds = ((X_train["rainfall_3d_mm"] > t1) & (X_train["twi_mean"] > t2)).astype(int)
            if preds.sum() == 0:
                continue
            f1 = f1_score(y_train, preds, zero_division=0)
            if f1 > best_f1:
                best_f1, best_t1, best_t2 = f1, t1, t2
    return best_t1, best_t2


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> dict:
    if len(np.unique(y_true)) < 2:
        return {"precision": None, "recall": None, "f1": None, "roc_auc": None, "pr_auc": None}
    return {
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_true, y_pred, zero_division=0), 4),
        "f1":        round(f1_score(y_true, y_pred, zero_division=0), 4),
        "roc_auc":   round(roc_auc_score(y_true, y_prob), 4),
        "pr_auc":    round(average_precision_score(y_true, y_prob), 4),
        "brier":     round(brier_score_loss(y_true, y_prob), 4),
    }


def run_validation():
    if not SKLEARN_OK:
        print("[-] scikit-learn required. Aborting.")
        return

    all_results = []
    confusion_data = {}   # district -> {model -> (y_true, y_pred)}
    shap_data = {}        # district -> (rf_model, X_val_df, feature_cols)
    ablation_results = defaultdict(list)  # district -> list of {config, f1}

    for district_id, district_name in VALIDATION_DISTRICTS.items():
        print(f"\n{'='*60}")
        print(f"  Validating: {district_name} ({district_id})")
        print(f"{'='*60}")

        df = load_district_labels(district_id)
        if df is None:
            print(f"  [SKIP] No label file found at data/labels/labels_{district_id}.csv")
            all_results.append({
                "district": district_name, "status": "skipped",
                "n_pos": None, "n_neg": None,
            })
            continue

        n_pos = int(df["waterlogged"].sum())
        n_neg = int((df["waterlogged"] == 0).sum())
        label_sources = df["label_source"].unique().tolist() if "label_source" in df.columns else ["unknown"]
        print(f"  Labels: {n_pos} positive, {n_neg} negative | sources: {label_sources}")

        # Build feature list
        feature_cols = [c for c in FEATURES if c in df.columns]
        if OPTIONAL_FEATURE in df.columns and df[OPTIONAL_FEATURE].notna().any():
            feature_cols.append(OPTIONAL_FEATURE)
            df[OPTIONAL_FEATURE] = df[OPTIONAL_FEATURE].fillna(df["rainfall_3d_mm"] * 0.9)

        df_clean = df[feature_cols + ["waterlogged", "block_id"]].dropna()
        if len(df_clean) < 10:
            print(f"  [SKIP] Too few clean rows: {len(df_clean)}")
            continue

        df_folds, n_folds = spatial_cv_folds(df_clean)
        n_folds = min(n_folds, df["block_id"].nunique())

        # Per-fold accumulators
        phy_true_all, phy_pred_all, phy_prob_all = [], [], []
        rule_true_all, rule_pred_all, rule_prob_all = [], [], []
        rf_true_all,   rf_pred_all,   rf_prob_all   = [], [], []
        rf_calib_true_all, rf_calib_prob_all = [], []
        ablation_acc = defaultdict(lambda: {"y_true": [], "y_prob": []})

        shap_X_parts, shap_model_last = [], None

        for fold_idx in range(n_folds):
            mask_val   = df_folds["_fold"] == fold_idx
            mask_train = ~mask_val

            X_train = df_folds.loc[mask_train, feature_cols].values
            y_train = df_folds.loc[mask_train, "waterlogged"].values
            X_val   = df_folds.loc[mask_val,   feature_cols].values
            y_val   = df_folds.loc[mask_val,   "waterlogged"].values
            X_val_df = df_folds.loc[mask_val, feature_cols]

            if len(y_val) == 0 or y_train.sum() == 0:
                continue

            scaler = StandardScaler()
            X_train_s = scaler.fit_transform(X_train)
            X_val_s   = scaler.transform(X_val)

            # Physics baseline (no training needed)
            phy_prob = df_folds.loc[mask_val].apply(physics_score, axis=1).values
            phy_pred = (phy_prob >= 0.5).astype(int)
            phy_true_all.extend(y_val); phy_pred_all.extend(phy_pred); phy_prob_all.extend(phy_prob)

            # Rule baseline — thresholds fit inside fold
            train_df_fold = df_folds.loc[mask_train]
            t1, t2 = fit_rule_threshold(train_df_fold[feature_cols], y_train)
            val_df_fold = df_folds.loc[mask_val]
            rule_pred = ((val_df_fold["rainfall_3d_mm"] > t1) & (val_df_fold["twi_mean"] > t2)).astype(int).values
            rule_prob = np.clip(
                (val_df_fold["rainfall_3d_mm"] / 75.0 * 0.5 + val_df_fold["twi_mean"] / 14.0 * 0.5).values,
                0.0, 1.0
            )
            rule_true_all.extend(y_val); rule_pred_all.extend(rule_pred); rule_prob_all.extend(rule_prob)

            # Random Forest (calibrated with isotonic regression inside fold)
            rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
            rf.fit(X_train_s, y_train)
            rf_pred = rf.predict(X_val_s)
            rf_prob = rf.predict_proba(X_val_s)[:, 1]
            rf_true_all.extend(y_val); rf_pred_all.extend(rf_pred); rf_prob_all.extend(rf_prob)

            # Calibrated RF (isotonic, within fold)
            if len(y_train) >= 10 and y_train.sum() >= 2:
                try:
                    calib_rf = CalibratedClassifierCV(
                        RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1),
                        cv=min(3, len(np.unique(y_train))),
                        method="isotonic"
                    )
                    calib_rf.fit(X_train_s, y_train)
                    calib_prob = calib_rf.predict_proba(X_val_s)[:, 1]
                    rf_calib_true_all.extend(y_val)
                    rf_calib_prob_all.extend(calib_prob)
                except Exception as e:
                    pass

            # Ablation study (4 configs)
            ablation_configs = {
                "rainfall_only": ["rainfall_3d_mm", "rainfall_7d_mm"],
                "terrain_only":  ["twi_mean", "slope_deg_mean"],
                "soil_only":     ["drainage_class", "cropland_fraction"],
                "all_features":  feature_cols,
            }
            for config_name, cols in ablation_configs.items():
                valid_cols = [c for c in cols if c in feature_cols]
                if not valid_cols:
                    continue
                col_idx = [feature_cols.index(c) for c in valid_cols]
                X_tr_abl = X_train_s[:, col_idx]
                X_vl_abl = X_val_s[:, col_idx]
                abl_rf = RandomForestClassifier(n_estimators=60, max_depth=8, random_state=42, n_jobs=-1)
                abl_rf.fit(X_tr_abl, y_train)
                abl_prob = abl_rf.predict_proba(X_vl_abl)[:, 1]
                ablation_acc[config_name]["y_true"].extend(y_val)
                ablation_acc[config_name]["y_prob"].extend(abl_prob)

            # SHAP: collect last fold's model + validation data
            shap_X_parts.append((X_val_s, X_val_df))
            shap_model_last = rf

        # Aggregate metrics
        y_t = np.array(phy_true_all); y_pp = np.array(phy_pred_all); y_pb = np.array(phy_prob_all)
        y_rt = np.array(rule_true_all); y_rp = np.array(rule_pred_all); y_rb = np.array(rule_prob_all)
        y_ft = np.array(rf_true_all); y_fp = np.array(rf_pred_all); y_fb = np.array(rf_prob_all)

        phy_metrics  = evaluate_model(y_t,  y_pp, y_pb)
        rule_metrics = evaluate_model(y_rt, y_rp, y_rb)
        rf_metrics   = evaluate_model(y_ft, y_fp, y_fb)

        # Calibrated Brier score
        if rf_calib_prob_all:
            calib_brier = round(brier_score_loss(np.array(rf_calib_true_all), np.array(rf_calib_prob_all)), 4)
            rf_metrics["brier_calibrated"] = calib_brier

        print(f"\n  Physics baseline  — F1: {phy_metrics['f1']}, ROC-AUC: {phy_metrics['roc_auc']}")
        print(f"  Rule baseline     — F1: {rule_metrics['f1']}, ROC-AUC: {rule_metrics['roc_auc']}")
        print(f"  Random Forest     — F1: {rf_metrics['f1']}, ROC-AUC: {rf_metrics['roc_auc']}")

        rf_beat_physics = (
            rf_metrics["f1"] is not None and phy_metrics["f1"] is not None
            and rf_metrics["f1"] > phy_metrics["f1"]
        )
        print(f"  RF beats physics: {rf_beat_physics}")

        for model, m in [("physics_baseline", phy_metrics), ("rule_baseline", rule_metrics), ("random_forest", rf_metrics)]:
            row = {
                "district": district_name,
                "district_id": district_id,
                "label_sources": "|".join(label_sources),
                "n_pos": n_pos,
                "n_neg": n_neg,
                "model": model,
                "status": "evaluated",
                **{k: v for k, v in m.items()},
                "rf_beats_physics": rf_beat_physics if model == "random_forest" else None,
            }
            all_results.append(row)

        # Save confusion matrix data
        confusion_data[district_name] = {
            "Physics Baseline":  (y_t,  y_pp),
            "Rule Baseline":     (y_rt, y_rp),
            "Random Forest":     (y_ft, y_fp),
        }

        # Ablation results
        for config_name, acc in ablation_acc.items():
            y_t_abl = np.array(acc["y_true"])
            y_p_abl = np.array(acc["y_prob"])
            if len(y_t_abl) > 0 and len(np.unique(y_t_abl)) >= 2:
                f1 = round(f1_score(y_t_abl, (y_p_abl >= 0.5).astype(int), zero_division=0), 4)
                ablation_results[district_name].append({"config": config_name, "f1": f1})

        # SHAP
        if SHAP_OK and shap_model_last and shap_X_parts:
            shap_data[district_name] = (shap_model_last, shap_X_parts[-1][0], feature_cols)

        # Calibration curve data (store)
        if rf_calib_prob_all:
            shap_data[f"__calib_{district_name}"] = (
                np.array(rf_calib_true_all), np.array(rf_calib_prob_all)
            )

    # ── Write CSV
    csv_path = RESULTS_DIR / "metrics_validation.csv"
    if all_results:
        df_out = pd.DataFrame(all_results)
        df_out.to_csv(csv_path, index=False)
        print(f"\n[+] Metrics written to {csv_path}")

    if not MPL_OK:
        print("[!] matplotlib missing — skipping plots")
        _write_readme(all_results, ablation_results, [])
        return

    # ── Confusion matrices plot
    _plot_confusion_matrices(confusion_data)

    # ── Ablation bar chart
    _plot_ablation_bar(ablation_results)

    # ── Calibration curve
    _plot_calibration_curve(shap_data)

    # ── SHAP summary
    shap_feature_importances = _plot_shap(shap_data, feature_cols if feature_cols else FEATURES)

    # ── README
    _write_readme(all_results, ablation_results, shap_feature_importances)


def _plot_confusion_matrices(confusion_data: dict):
    n_districts = len(confusion_data)
    if n_districts == 0:
        return
    fig, axes = plt.subplots(n_districts, 3, figsize=(12, 4 * n_districts))
    if n_districts == 1:
        axes = [axes]
    model_names = ["Physics Baseline", "Rule Baseline", "Random Forest"]
    for row_i, (district, models) in enumerate(confusion_data.items()):
        for col_i, model_name in enumerate(model_names):
            ax = axes[row_i][col_i]
            if model_name not in models:
                ax.axis("off")
                continue
            y_true, y_pred = models[model_name]
            cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
            im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
            ax.set_title(f"{district}\n{model_name}", fontsize=9, fontweight="bold")
            ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
            ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
            ax.set_xticklabels(["Dry", "Wet"]); ax.set_yticklabels(["Dry", "Wet"])
            for ii in range(2):
                for jj in range(2):
                    ax.text(jj, ii, str(cm[ii, jj]), ha="center", va="center",
                            color="white" if cm[ii, jj] > cm.max() / 2 else "black", fontsize=11)
    plt.tight_layout()
    path = RESULTS_DIR / "confusion_matrices.png"
    plt.savefig(path, dpi=120, bbox_inches="tight")
    plt.close()
    print(f"[+] Confusion matrices saved to {path}")


def _plot_ablation_bar(ablation_results: dict):
    if not ablation_results:
        return
    configs = ["rainfall_only", "terrain_only", "soil_only", "all_features"]
    config_labels = ["Rainfall\nOnly", "Terrain\nOnly", "Soil\nOnly", "All\nFeatures"]
    districts = list(ablation_results.keys())
    x = np.arange(len(configs))
    width = 0.8 / max(len(districts), 1)
    fig, ax = plt.subplots(figsize=(10, 5))
    for i, district in enumerate(districts):
        f1s = []
        cfg_map = {r["config"]: r["f1"] for r in ablation_results[district]}
        for cfg in configs:
            f1s.append(cfg_map.get(cfg, 0.0))
        bars = ax.bar(x + i * width, f1s, width, label=district, alpha=0.85)
    ax.set_xticks(x + width * (len(districts) - 1) / 2)
    ax.set_xticklabels(config_labels)
    ax.set_ylabel("F1 Score"); ax.set_title("Random Forest Ablation Study — Feature Groups")
    ax.set_ylim(0, 1); ax.legend(); ax.grid(axis="y", alpha=0.3)
    path = RESULTS_DIR / "ablation_bar.png"
    plt.savefig(path, dpi=120, bbox_inches="tight")
    plt.close()
    print(f"[+] Ablation bar chart saved to {path}")


def _plot_calibration_curve(shap_data: dict):
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot([0, 1], [0, 1], "k--", label="Perfect calibration")
    found_any = False
    for key, val in shap_data.items():
        if not key.startswith("__calib_"):
            continue
        district_name = key.replace("__calib_", "")
        y_true, y_prob = val
        if len(np.unique(y_true)) < 2:
            continue
        prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=5, strategy="quantile")
        brier = round(brier_score_loss(y_true, y_prob), 4)
        ax.plot(prob_pred, prob_true, "s-", label=f"{district_name} (Brier={brier})")
        found_any = True
    if not found_any:
        # Draw a placeholder
        ax.text(0.5, 0.5, "Insufficient data for calibration curve\n(need ≥2 folds with both classes)",
                ha="center", va="center", transform=ax.transAxes, fontsize=10, color="gray")
    ax.set_xlabel("Mean Predicted Probability"); ax.set_ylabel("Fraction of Positives")
    ax.set_title("RF Calibration Curve (Isotonic, Inside Folds)")
    ax.legend(); ax.grid(alpha=0.3)
    path = RESULTS_DIR / "calibration_curve.png"
    plt.savefig(path, dpi=120, bbox_inches="tight")
    plt.close()
    print(f"[+] Calibration curve saved to {path}")


def _plot_shap(shap_data: dict, feature_cols: list) -> list:
    """Returns list of (feature, mean_abs_shap) for top features across all districts."""
    if not SHAP_OK:
        print("[!] shap not installed — using RF Gini/MDI feature importances as proxy")
        models = [val[0] for key, val in shap_data.items() if not key.startswith("__calib_") and len(val) == 3]
        if not models:
            return []
        importances = np.mean([m.feature_importances_ for m in models], axis=0)
        order = np.argsort(importances)[::-1]
        feat_names = feature_cols[:len(importances)]
        fig, ax = plt.subplots(figsize=(9, 5))
        ax.barh([feat_names[i] for i in order], importances[order], color="#3182bd")
        ax.set_xlabel("Mean Feature Importance (RF Gini / MDI)")
        ax.set_title("RF Feature Importance (Model Interpretation)\n"
                     "Note: explains the model — not the physical cause of flooding")
        ax.invert_yaxis()
        path = RESULTS_DIR / "shap_summary.png"
        plt.savefig(path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"[+] Feature importance summary saved to {path}")
        return [(feat_names[i], round(float(importances[i]), 4)) for i in order]

    all_shap_vals = []
    all_X = []
    for key, val in shap_data.items():
        if key.startswith("__calib_"):
            continue
        if len(val) != 3:
            continue
        model, X_val_s, feat_cols = val
        try:
            explainer = shap.TreeExplainer(model)
            sv = explainer.shap_values(X_val_s)
            # For binary RF, sv is list [neg_class, pos_class]
            if isinstance(sv, list) and len(sv) == 2:
                sv = sv[1]
            all_shap_vals.append(sv)
            all_X.append(X_val_s)
        except Exception as e:
            print(f"[!] SHAP failed for a district: {e}")
    if not all_shap_vals:
        return []
    try:
        combined_shap = np.vstack(all_shap_vals)
        if combined_shap.ndim == 3:
            combined_shap = combined_shap[:, :, 1]
        mean_abs = np.abs(combined_shap).mean(axis=0)
        if mean_abs.ndim > 1:
            mean_abs = mean_abs.squeeze()
        order = [int(idx) for idx in np.argsort(mean_abs)[::-1]]
        feat_names = feature_cols[:len(order)]
        sorted_names = [feat_names[i] for i in order if i < len(feat_names)]
        sorted_vals = [float(mean_abs[i]) for i in order if i < len(feat_names)]
        fig, ax = plt.subplots(figsize=(9, 5))
        ax.barh(sorted_names, sorted_vals, color="#3182bd")
        ax.set_xlabel("Mean |SHAP value|")
        ax.set_title("RF Feature Importance (SHAP)\n"
                     "Note: explains the model — not the physical cause of flooding")
        ax.invert_yaxis()
        path = RESULTS_DIR / "shap_summary.png"
        plt.savefig(path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"[+] SHAP summary saved to {path}")
        return [(sorted_names[i], round(sorted_vals[i], 4)) for i in range(len(sorted_names))]
    except Exception as e:

        print(f"[!] SHAP summary plot error: {e}")
        return []


def _write_readme(all_results: list, ablation_results: dict, shap_importance: list):
    evaluated = [r for r in all_results if r.get("status") == "evaluated" and r.get("model") == "random_forest"]
    skipped   = [r for r in all_results if r.get("status") == "skipped"]

    lines = [
        "# JalaDrishti AI — Validation Results",
        "",
        "## Method (10-line summary)",
        "",
        "Label files (`data/labels/labels_<district>.csv`) are read per district.",
        "Features are: rainfall_3d_mm, rainfall_7d_mm, TWI, slope, drainage class, cropland fraction,",
        "and rainfall_observed_3d_mm where available.",
        "Three models are compared: (a) physics rule score from Phase 2 (unchanged),",
        "(b) a rain+TWI threshold rule with thresholds fit inside each fold,",
        "(c) a Random Forest (100 trees, depth 10).",
        "Evaluation uses spatial block cross-validation with 5 folds grouped by block_id — no random splits.",
        "Scalers and thresholds are fit inside each training fold only.",
        "RF probabilities are calibrated with isotonic regression (inside folds); Brier score is reported.",
        "All numbers in this file come directly from running `python ml_service/validate.py`.",
        "",
        "## Validation Districts & Label Counts",
        "",
        "| District | N Positive | N Negative | Label Source |",
        "|----------|-----------|-----------|--------------|",
    ]

    for r in all_results:
        if r.get("model") == "random_forest" or r.get("status") == "skipped":
            district = r.get("district", "")
            n_pos = r.get("n_pos", "—")
            n_neg = r.get("n_neg", "—")
            src   = r.get("label_sources", "demo_synthetic")
            lines.append(f"| {district} | {n_pos} | {n_neg} | {src} |")

    lines += [
        "",
        "> **⚠ All labels marked `demo_synthetic` are generated for demonstration purposes only.**",
        "> They are NOT real field observations. Validation numbers do not represent real-world accuracy.",
        "",
        "## Metrics Summary",
        "",
        "| District | Model | F1 | ROC-AUC | PR-AUC | Brier | RF beats Physics? |",
        "|----------|-------|-----|---------|--------|-------|-------------------|",
    ]

    # Group by district
    metric_rows = [r for r in all_results if r.get("status") == "evaluated"]
    for r in metric_rows:
        f1 = r.get("f1", "—"); auc = r.get("roc_auc", "—")
        pr  = r.get("pr_auc", "—"); brier = r.get("brier", "—")
        beats = r.get("rf_beats_physics", "")
        beats_str = "✓ Yes" if beats else ("✗ No" if beats is False else "—")
        lines.append(
            f"| {r['district']} | {r['model']} | {f1} | {auc} | {pr} | {brier} | {beats_str} |"
        )

    if skipped:
        lines += ["", "## Skipped Districts (no label file found)", ""]
        for r in skipped:
            lines.append(f"- {r['district']} — `data/labels/labels_{r.get('district_id','?')}.csv` not found")

    if shap_importance:
        lines += ["", "## Top SHAP Feature Importances (all validation districts)", ""]
        for feat, imp in shap_importance[:6]:
            lines.append(f"- `{feat}`: {imp}")
        lines += ["", "_SHAP values explain the model output — not the physical cause of waterlogging._"]

    lines += [
        "",
        "## How to Reproduce",
        "",
        "```bash",
        "# Install deps",
        "pip install scikit-learn matplotlib shap pandas numpy",
        "# Run validation",
        "python ml_service/validate.py",
        "```",
        "All output files are written to `results/`.",
        "",
        "## Limitations",
        "",
        "- Validation covers **3 districts only**. No claim is made for the remaining 28.",
        "- Label files used here are **demo_synthetic** — not field-verified flood observations.",
        "- The model outputs waterlogging probability; it is **not an official flood alert**.",
        "- SHAP values describe the model behaviour, not the physical cause.",
    ]

    path = RESULTS_DIR / "README.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"[+] Validation README written to {path}")


if __name__ == "__main__":
    run_validation()
    print("\n[+] Validation pipeline complete. Check results/ directory.")
