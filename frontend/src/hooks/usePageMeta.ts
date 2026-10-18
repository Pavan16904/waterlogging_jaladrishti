import { useEffect } from 'react';
import { MainTabType } from '../components/Header';

/**
 * PAGE_META — Per-tab SEO metadata.
 * These are unique titles and meta descriptions for each public section.
 * The base title is always suffixed with " | JalaDrishti AI".
 */
const PAGE_META: Record<MainTabType, { title: string; description: string }> = {
  overview: {
    title: 'Bento Dashboard Overview — Karnataka Waterlogging Platform | JalaDrishti AI',
    description:
      'Executive KPI tiles, live data pipeline health, model-based rainfall, and high-risk attention clusters across Karnataka.',
  },
  map: {
    title: 'Flood & Waterlogging Map — Forecast and Data Availability | JalaDrishti AI',
    description:
      'District weather-model forecasts and map references for Karnataka. Modelled waterlogging risk per H3 hex.',
  },
  weather: {
    title: 'Weather Forecasts and Data Availability — Karnataka Districts | JalaDrishti AI',
    description:
      'Open-Meteo numerical weather-model current conditions and forecasts for Karnataka districts.',
  },
  'crop-water': {
    title: 'Crop Water & Irrigation Advisor — FAO-56 Scheduling | JalaDrishti AI',
    description:
      'Precision FAO-56 irrigation scheduling and water balance for Karnataka crops.',
  },
  drainage: {
    title: 'Drainage Forecast Guidance — Infrastructure Data Availability | JalaDrishti AI',
    description:
      'Weather-model-based drainage guidance and prioritized local remediation actions.',
  },
};

/**
 * TAB_HASH — Maps each tab to its URL hash fragment.
 */
export const TAB_HASH: Record<MainTabType, string> = {
  overview: 'overview',
  map: '',
  weather: 'weather',
  'crop-water': 'crop-water',
  drainage: 'drainage',
};

/**
 * HASH_TO_TAB — Reverse lookup: hash fragment → tab id.
 */
export const HASH_TO_TAB: Record<string, MainTabType> = {
  '': 'map',
  'overview': 'overview',
  'weather': 'weather',
  'crop-water': 'crop-water',
  'drainage': 'drainage',
};

/**
 * LiveTelemetryContext — Optional live data passed to usePageMeta
 * to make the browser tab title reflect real-time system status.
 */
export interface LiveTelemetryContext {
  /** Number of sensors currently in critical alarm state */
  criticalAlerts?: number;
  /** Number of active (running) IoT sensors */
  activeSensors?: number;
  /** Name of the currently selected district / study area */
  activeDistrict?: string;
}

/**
 * usePageMeta — Updates the document title, meta description, and canonical
 * link tag whenever the active tab or live telemetry changes.
 *
 * When criticalAlerts > 0 on the map tab, the title becomes:
 *   "\u26a0\ufe0f 2 Alerts \u00b7 Flood Map | JalaDrishti AI"
 */
export function usePageMeta(activeTab: MainTabType, telemetry?: LiveTelemetryContext): void {
  useEffect(() => {
    const meta = PAGE_META[activeTab];

    // Build a dynamic prefix for the tab title based on live telemetry
    let livePrefix = '';
    if (activeTab === 'map' && telemetry?.criticalAlerts && telemetry.criticalAlerts > 0) {
      const count = telemetry.criticalAlerts;
      livePrefix = `\u26a0\ufe0f ${count} Alert${count > 1 ? 's' : ''} \u00b7 `;
    } else if (activeTab === 'map' && telemetry?.activeDistrict) {
      livePrefix = `${telemetry.activeDistrict} \u00b7 `;
    }

    const fullTitle = livePrefix ? `${livePrefix}${meta.title}` : meta.title;

    // Update document title
    document.title = fullTitle;

    // Update or create meta[name="description"]
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.setAttribute('name', 'description');
      document.head.appendChild(descEl);
    }
    descEl.setAttribute('content', meta.description);

    // Update Open Graph title & description
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);

    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

    const twitterDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', meta.description);
  }, [activeTab, telemetry?.criticalAlerts, telemetry?.activeDistrict]);
}

/**
 * useHashRouter — Syncs the URL hash with the active tab.
 * - On mount: reads the URL hash and returns the matching tab.
 * - On tab change: updates the URL hash without adding a history entry.
 */
export function useHashRouter(
  activeTab: MainTabType,
  setActiveTab: (tab: MainTabType) => void,
): void {
  // On mount, read hash from URL and set active tab accordingly
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase().trim();
    const tab = HASH_TO_TAB[hash];
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // When tab changes, update URL hash (no history push — use replaceState)
  useEffect(() => {
    const hash = TAB_HASH[activeTab];
    const newHash = hash ? `#${hash}` : '';
    const currentHash = window.location.hash;
    if (currentHash !== newHash) {
      window.history.replaceState(null, '', `/${newHash}`);
    }
  }, [activeTab]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase().trim();
      const tab = HASH_TO_TAB[hash];
      if (tab) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [setActiveTab]);
}
