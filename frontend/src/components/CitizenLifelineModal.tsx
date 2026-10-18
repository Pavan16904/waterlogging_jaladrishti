import React, { useState } from 'react';
import { 
  HeartHandshake, 
  X, 
  AlertTriangle, 
  PhoneCall, 
  MapPin, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Sparkles, 
  ExternalLink,
  Droplets,
  LifeBuoy,
  Home,
  Flame,
  Zap,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';

interface CitizenLifelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LangType = 'en' | 'kn' | 'hi';

export const CitizenLifelineModal: React.FC<CitizenLifelineModalProps> = ({
  isOpen,
  onClose
}) => {
  const { lang } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'sos' | 'shelters' | 'health' | 'farmer'>('sos');

  // SOS Form state
  const [selectedDistrictId, setSelectedDistrictId] = useState('ballari');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [waterDepth, setWaterDepth] = useState('knee');
  const [urgency, setUrgency] = useState<'moderate' | 'high' | 'critical'>('high');
  const [sosPrepared, setSosPrepared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landmark.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    const activeDist = KARNATAKA_31_DISTRICTS_WEATHER.find((d) => d.id === selectedDistrictId) || KARNATAKA_31_DISTRICTS_WEATHER[0];
    const sev = waterDepth === 'submerged' || waterDepth === 'waist' ? 'Severe' : waterDepth === 'knee' ? 'High' : 'Moderate';

    try {
      const res = await api.submitIncident({
        district_id: activeDist.id,
        district_name: activeDist.displayName,
        reporter_name: reporterName.trim() || 'Anonymous Citizen',
        reporter_phone: reporterPhone.trim() || 'Not Provided',
        landmark: landmark.trim(),
        water_depth: waterDepth,
        urgency: urgency,
        status: 'SUBMITTED_UNVERIFIED',
        assigned_agency: 'KSDMA / District Monsoon Control Cell',
        recommended_action: 'Ground validation inspection and drainage outfall clearance',
        lat: activeDist.lat,
        lng: activeDist.lng,
        severity: sev,
      });

      if (res && res.success) {
        setSubmittedIncident(res.incident || {
          id: `inc_${Date.now()}`,
          district_name: activeDist.displayName,
          landmark: landmark.trim(),
          water_depth: waterDepth,
          status: 'SUBMITTED_UNVERIFIED'
        });
        setSosPrepared(true);
      } else {
        setSubmitError(res?.error || 'Failed to record report. Please try again or call 112 for emergency response.');
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || err.message || 'Submission failed. Backend service unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const t = {
    en: {
      title: 'Citizen Lifeline & Community Resilience Hub',
      subtitle: 'Safety information and local report drafting; no verified incident or shelter feed is connected',
      sosTab: '🚨 Report Waterlogging / SOS',
      shelterTab: '🏕️ Relief Shelters & Camps',
      healthTab: '🩺 Epidemic & Public Health',
      farmerTab: '🌾 Farmer Flood Recovery',
      hotlines: 'Emergency contact references (verify locally)',
      stateDisaster: 'Karnataka Disaster Mgmt',
      districtDisaster: 'District Collector Control Room',
      policeEmergency: 'Police & First Responders',
      civicFloods: 'Municipal Monsoon Control Room',
      bescomElec: 'BESCOM Electrical Danger Helpline',
      reportTitle: 'Citizen Hazard & Rescue Request',
      reportDesc: 'Prepare a local report draft. No verified emergency intake or dispatch service is connected, so this form cannot contact responders.',
      nameLabel: 'Your Name (or Anonymous Volunteer)',
      phoneLabel: 'Mobile Number for Rescue Callback',
      locationLabel: 'Specific Landmark / Street / Cross',
      waterDepthLabel: 'Observed Water Depth',
      ankle: 'Ankle Level (15-30 cm) - Slow Traffic',
      knee: 'Knee Level (30-60 cm) - Vehicles Stalling',
      waist: 'Waist Level (60-120 cm) - Flooded Homes',
      submerged: 'Submerged Vehicles / Extreme (> 1.2 m)',
      urgencyLabel: 'Urgency Priority',
      submitBtn: 'Prepare report (not sent)',
      submittedMsg: 'Report draft prepared — not sent',
      submittedSub: 'No emergency service received this report. Call 112 for urgent assistance.',
      sheltersTitle: 'Relief shelters',
      sheltersDesc: 'No verified shelter availability or capacity feed is connected.',
      openNow: 'OPEN & OPERATIONAL',
      bedsAvail: 'beds available',
      healthTitle: 'Post-Flood Waterborne Disease Prevention',
      healthDesc: 'Stagnant floodwater breeds bacterial infections and vector-borne diseases within 48 hours.',
      farmerTitle: 'Agro-Flood Recovery & PMFBY Insurance Support',
      farmerDesc: 'General flood-recovery guidance only. No verified satellite damage assessment is connected.',
      downloadProof: 'Satellite flood assessment unavailable',
      certDesc: 'No verified Sentinel-1 inundation product or official certificate integration is connected.'
    },
    kn: {
      title: 'ನಾಗರಿಕ ಜೀವರಕ್ಷಾ & ಸಮುದಾಯ ಸಹಾಯ ಕೇಂದ್ರ (Citizen Lifeline)',
      subtitle: 'ಸುರಕ್ಷತಾ ಮಾಹಿತಿ ಮತ್ತು ಸ್ಥಳೀಯ ವರದಿ ಕರಡು; ಪರಿಶೀಲಿತ ಘಟನೆ ಅಥವಾ ಶಿಬಿರದ ಮಾಹಿತಿ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ',
      sosTab: '🚨 ನೀರು ನಿಂತ ವರದಿ / ತುರ್ತು SOS',
      shelterTab: '🏕️ ಪರಿಹಾರ ಶಿಬಿರಗಳು',
      healthTab: '🩺 ಆರೋಗ್ಯ & ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ತಡೆ',
      farmerTab: '🌾 ರೈತರ ನೆರೆ ಪರಿಹಾರ & ಬೆಳೆ ಚೇತರಿಕೆ',
      hotlines: 'ತುರ್ತು ಸಂಪರ್ಕ ಸಂಖ್ಯೆಗಳು (ಸ್ಥಳೀಯವಾಗಿ ಪರಿಶೀಲಿಸಿ)',
      stateDisaster: 'ರಾಜ್ಯ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಪ್ರಾಧಿಕಾರ',
      districtDisaster: 'ಜಿಲ್ಲಾಧಿಕಾರಿಗಳ ಕಂಟ್ರೋಲ್ ರೂಂ',
      policeEmergency: 'ತುರ್ತು ರಕ್ಷಣಾ ಪಡೆ (ಪೊಲೀಸ್)',
      civicFloods: 'ಮಹಾನಗರ ಪಾಲಿಕೆ ನೆರೆ ಕಂಟ್ರೋಲ್ ರೂಂ',
      bescomElec: 'ಬೆಸ್ಕಾಂ ವಿದ್ಯುತ್ ಅವಘಡ ಸಹಾಯವಾಣಿ',
      reportTitle: 'ನೀರು ನಿಂತ ಪ್ರದೇಶದ ತುರ್ತು ವರದಿ',
      reportDesc: 'ಇದು ಸ್ಥಳೀಯ ವರದಿ ಕರಡು ಮಾತ್ರ. ಪರಿಶೀಲಿತ ತುರ್ತು ಸ್ವೀಕಾರ ಅಥವಾ ರವಾನೆ ಸೇವೆ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.',
      nameLabel: 'ನಿಮ್ಮ ಹೆಸರು (ಅಥವಾ ಸ್ವಯಂಸೇವಕ)',
      phoneLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      locationLabel: 'ನಿಖರ ಸ್ಥಳ / ರಸ್ತೆ / ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್',
      waterDepthLabel: 'ನೀರಿನ ಆಳದ ಮಟ್ಟ',
      ankle: 'ಪಾದದ ಮಟ್ಟ (15-30 ಸೆಂ.ಮೀ) - ವಾಹನ ನಿಧಾನ',
      knee: 'ಮೊಣಕಾಲು ಮಟ್ಟ (30-60 ಸೆಂ.ಮೀ) - ಅಪಾಯ',
      waist: 'ಸೊಂಟದ ಮಟ್ಟ (60-120 ಸೆಂ.ಮೀ) - ಮನೆಗಳಿಗೆ ನೀರು',
      submerged: 'ವಾಹನಗಳು ಮುಳುಗಡೆ / ತೀವ್ರ ಅಪಾಯ (> 1.2 ಮೀ)',
      urgencyLabel: 'ತುರ್ತು ಆದ್ಯತೆ',
      submitBtn: 'ವರದಿ ಕರಡು ಸಿದ್ಧಪಡಿಸಿ (ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ)',
      submittedMsg: 'ವರದಿ ಕರಡು ಸಿದ್ಧವಾಗಿದೆ — ಕಳುಹಿಸಲಾಗಿಲ್ಲ',
      submittedSub: 'ಯಾವುದೇ ತುರ್ತು ಸೇವೆಗೆ ವರದಿ ತಲುಪಿಲ್ಲ. ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ 112ಕ್ಕೆ ಕರೆಮಾಡಿ.',
      sheltersTitle: 'ಪರಿಹಾರ ಶಿಬಿರಗಳು',
      sheltersDesc: 'ಪರಿಶೀಲಿತ ಶಿಬಿರ ಲಭ್ಯತೆ ಅಥವಾ ಸಾಮರ್ಥ್ಯದ ಮಾಹಿತಿ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.',
      openNow: 'ಸ್ಥಿತಿ ಲಭ್ಯವಿಲ್ಲ',
      bedsAvail: 'ಸಾಮರ್ಥ್ಯ ಲಭ್ಯವಿಲ್ಲ',
      healthTitle: 'ನೆರೆ ನಂತರ ಸಾಂಕ್ರಾಮಿಕ ರೋಗಗಳ ತಡೆಗಟ್ಟುವಿಕೆ',
      healthDesc: 'ನಿಂತ ನೀರಿನಿಂದ ಲೆಪ್ಟೊಸ್ಪೈರೋಸಿಸ್ (ಇಲಿ ಜ್ವರ), ಡೆಂಗ್ಯೂ ಮತ್ತು ಕಾಲರಾ ಹರಡುವ ಅಪಾಯವಿದೆ.',
      farmerTitle: 'ರೈತರ ಬೆಳೆ ರಕ್ಷಣೆ ಮತ್ತು ಬೆಳೆ ವಿಮೆ ಪರಿಹಾರ (ಪರಿಹಾರ / PMFBY)',
      farmerDesc: 'ಸಾಮಾನ್ಯ ನೆರೆ-ಚೇತರಿಕೆ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ಪರಿಶೀಲಿತ ಉಪಗ್ರಹ ಹಾನಿ ಮೌಲ್ಯಮಾಪನ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.',
      downloadProof: 'ಉಪಗ್ರಹ ನೆರೆ ಮೌಲ್ಯಮಾಪನ ಲಭ್ಯವಿಲ್ಲ',
      certDesc: 'ಪರಿಶೀಲಿತ Sentinel-1 ನೆರೆ ಉತ್ಪನ್ನ ಅಥವಾ ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರ ಸೇವೆ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.'
    },
    hi: {
      title: 'नागरिक जीवनरक्षा एवं सामुदायिक केंद्र (Citizen Lifeline)',
      subtitle: 'सुरक्षा जानकारी और स्थानीय रिपोर्ट मसौदा; सत्यापित घटना या आश्रय डेटा जुड़ा नहीं है',
      sosTab: '🚨 जलभराव रिपोर्ट / SOS',
      shelterTab: '🏕️ राहत शिविर',
      healthTab: '🩺 स्वास्थ्य एवं महामारी रोकथाम',
      farmerTab: '🌾 किसान फसल पुनर्वास',
      hotlines: 'आपातकालीन संपर्क (स्थानीय रूप से सत्यापित करें)',
      stateDisaster: 'राज्य आपदा प्रबंधन प्राधिकरण',
      districtDisaster: 'जिलाधिकारी नियंत्रण कक्ष',
      policeEmergency: 'पुलिस एवं प्रथम प्रतिक्रिया दल',
      civicFloods: 'नगर निगम बाढ़ नियंत्रण कक्ष',
      bescomElec: 'विद्युत दुर्घटना हेल्पलाइन',
      reportTitle: 'जलभराव व आपातकालीन सहायता रिपोर्ट',
      reportDesc: 'यह केवल स्थानीय रिपोर्ट का मसौदा है। कोई सत्यापित आपातकालीन प्राप्ति या डिस्पैच सेवा जुड़ी नहीं है।',
      nameLabel: 'आपका नाम',
      phoneLabel: 'मोबाइल नंबर',
      locationLabel: 'सटीक स्थान / लैंडमार्क',
      waterDepthLabel: 'जलभराव की गहराई',
      ankle: 'टखने तक (15-30 सेमी)',
      knee: 'घुटने तक (30-60 सेमी) - गाड़ियां बंद',
      waist: 'कमर तक (60-120 सेमी) - घरों में पानी',
      submerged: 'अत्यधिक (> 1.2 मी) - गाड़ियां जलमग्न',
      urgencyLabel: 'आपात स्थिति प्राथमिकता',
      submitBtn: 'रिपोर्ट का मसौदा तैयार करें (भेजा नहीं जाएगा)',
      submittedMsg: 'रिपोर्ट का मसौदा तैयार — भेजा नहीं गया',
      submittedSub: 'यह रिपोर्ट किसी आपातकालीन सेवा तक नहीं पहुँची। तत्काल सहायता के लिए 112 पर कॉल करें।',
      sheltersTitle: 'राहत आश्रय',
      sheltersDesc: 'आश्रय की सत्यापित उपलब्धता या क्षमता का डेटा जुड़ा नहीं है।',
      openNow: 'स्थिति अनुपलब्ध',
      bedsAvail: 'क्षमता अनुपलब्ध',
      healthTitle: 'बाढ़ उपरांत जलजनित रोग रोकथाम',
      healthDesc: 'रुके हुए पानी से लेप्टोस्पायरोसिस, डेंगू और हैजा फैलने का खतरा रहता है।',
      farmerTitle: 'कृषि बाढ़ पुनर्वास एवं फसल बीमा (PMFBY)',
      farmerDesc: 'केवल सामान्य बाढ़-पुनर्प्राप्ति मार्गदर्शन। सत्यापित उपग्रह क्षति आकलन जुड़ा नहीं है।',
      downloadProof: 'उपग्रह बाढ़ आकलन अनुपलब्ध',
      certDesc: 'कोई सत्यापित Sentinel-1 बाढ़ उत्पाद या आधिकारिक प्रमाणपत्र एकीकरण उपलब्ध नहीं है।'
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Top Header with Multilingual Switcher */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-cyan-400">
                <LifeBuoy className="w-6 h-6 animate-spin-slow text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t.title}
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  No verified incident feed
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language is now controlled globally from the Header */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Emergency contact references; the application does not dispatch reports. */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>{t.hotlines}:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono font-bold text-[11px]">
            <a href="tel:112" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors">
              <span className="text-[10px] font-sans text-slate-400">{t.policeEmergency}:</span>
              <span>112</span>
            </a>
            <a href="tel:1070" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
              <span className="text-[10px] font-sans text-slate-400">{t.stateDisaster}:</span>
              <span>1070</span>
            </a>
            <a href="tel:1077" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors">
              <span className="text-[10px] font-sans text-slate-400">{t.districtDisaster}:</span>
              <span>1077</span>
            </a>
            <a href="tel:1533" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
              <span className="text-[10px] font-sans text-slate-400">{t.civicFloods}:</span>
              <span>1533</span>
            </a>
            <a href="tel:1912" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-sans text-slate-400">{t.bescomElec}:</span>
              <span>1912</span>
            </a>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('sos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
              activeSubTab === 'sos'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.sosTab}
          </button>
          <button
            onClick={() => setActiveSubTab('shelters')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
              activeSubTab === 'shelters'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.shelterTab}
          </button>
          <button
            onClick={() => setActiveSubTab('health')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
              activeSubTab === 'health'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.healthTab}
          </button>
          <button
            onClick={() => setActiveSubTab('farmer')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
              activeSubTab === 'farmer'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.farmerTab}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: CROWDSOURCED SOS & HAZARD REPORTING */}
          {activeSubTab === 'sos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>{t.reportTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {t.reportDesc}
                  </p>
                </div>

                {sosPrepared ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-base font-black text-white">Report Transmitted & Persisted</h4>
                        <p className="text-xs text-emerald-300/80 mt-0.5">
                          Successfully recorded in operational incident database.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                      <div><strong>Incident ID:</strong> {submittedIncident?.id}</div>
                      <div><strong>District:</strong> {submittedIncident?.district_name || selectedDistrictId}</div>
                      <div><strong>Location:</strong> {landmark}</div>
                      <div><strong>Reported Depth:</strong> {waterDepth.toUpperCase()}</div>
                      <div><strong>Verification Status:</strong> <span className="text-amber-400 font-bold">SUBMITTED_UNVERIFIED (Pending Review)</span></div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Observation stored in local database. It remains marked as pending until validated by field engineers. For urgent life-safety situations, call 112 directly.
                    </p>
                    <button
                      onClick={() => {
                        setSosPrepared(false);
                        setLandmark('');
                        setReporterName('');
                        setReporterPhone('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                    >
                      Report Another Location
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSosSubmit} className="space-y-4">
                    {submitError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
                        {submitError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {t.nameLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          {t.phoneLabel}
                        </label>
                        <input
                          type="tel"
                          required
                          value={reporterPhone}
                          onChange={(e) => setReporterPhone(e.target.value)}
                          placeholder="e.g. 9845012345"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Karnataka District ({KARNATAKA_31_DISTRICTS_WEATHER.length} Districts Supported)
                      </label>
                      <select
                        value={selectedDistrictId}
                        onChange={(e) => setSelectedDistrictId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      >
                        {KARNATAKA_31_DISTRICTS_WEATHER.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.displayName} ({d.zone.split('(')[0].trim()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {t.locationLabel}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Silk Board Junction underpass, or Bellandur Lake road"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        {t.waterDepthLabel}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: 'ankle', label: t.ankle, color: 'border-yellow-500/40 text-yellow-300' },
                          { id: 'knee', label: t.knee, color: 'border-orange-500/40 text-orange-300' },
                          { id: 'waist', label: t.waist, color: 'border-rose-500/40 text-rose-300' },
                          { id: 'submerged', label: t.submerged, color: 'border-red-600/60 text-red-400 font-bold' }
                        ].map((d) => (
                          <button
                            type="button"
                            key={d.id}
                            onClick={() => setWaterDepth(d.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              waterDepth === d.id
                                ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-md'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-red-600 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transmitting to Incident Database...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Report to Control Room</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* No incident or traffic feed is connected. */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Verified incident feed unavailable</span>
                  </h4>
                  <div className="rounded-xl bg-slate-900 border border-amber-500/30 p-3 text-[11px] text-slate-300">
                    No official incident, road-closure, shelter, or dispatch feed is connected. Do not use this dashboard as emergency confirmation.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Citizen Safety Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Never attempt to walk or drive through flowing water. 15 cm (6 inches) of moving water can knock you down; 60 cm (2 feet) can float cars. Stay away from fallen electrical wires and contact BESCOM (1912).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RELIEF CAMPS & SHELTERS */}
          {activeSubTab === 'shelters' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{t.sheltersTitle}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{t.sheltersDesc}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Availability feed unavailable</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 border border-amber-500/30 p-4 text-sm text-amber-100">
                {t.sheltersDesc} Confirm shelter status and capacity directly with local authorities before traveling.
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC HEALTH & EPIDEMIC PRECAUTIONS */}
          {activeSubTab === 'health' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <span>Drinking Water Decontamination</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>1. Boil All Water:</strong> Boil municipal or borewell water vigorously for at least 3 minutes before drinking or cooking.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>2. Halogen / Chlorine Tablets:</strong> Use 1 chlorine tablet (0.5g) per 20 Litres of clear water. Allow 30 minutes contact time before consumption.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>3. Sump Contamination:</strong> If floodwater entered underground sumps, pump them out completely, scrub with bleaching powder (50g/1000L), and flush.
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  <span>Leptospirosis & Vector Control</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>Rat Fever (Leptospirosis) Warning:</strong> Do not wade bare-foot into stagnant muddy water. Rodent urine carries bacteria that penetrates through skin abrasions.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>Doxycycline Prophylaxis:</strong> High-risk rescue workers and flood-exposed citizens should consult primary health centers (PHCs) for preventive doxycycline 200mg single dose.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong>Mosquito Larvicidal Spraying:</strong> Spray Temephos (Abate) in puddles and stagnant drains within 48 hours to abort Dengue/Aedes mosquito breeding cycles.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FARMER FLOOD SALVAGE & PMFBY INSURANCE */}
          {activeSubTab === 'farmer' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{t.farmerTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {t.farmerDesc}
                  </p>
                </div>
                <div className="max-w-xs text-[11px] text-amber-200">
                  <div className="font-bold">{t.downloadProof}</div>
                  <p className="mt-1">{t.certDesc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">STAGE 1: 0-48 HOURS</span>
                  <h4 className="font-bold text-white text-sm">Emergency Field Dewatering</h4>
                  <p className="text-slate-300">
                    Breach lower perimeter field bunds immediately to drain standing water. Crop roots suffocate irreversibly after 72 hours of waterlogging due to soil anoxia.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">STAGE 2: POST-DRAINAGE</span>
                  <h4 className="font-bold text-white text-sm">Foliar Nutrition Spray</h4>
                  <p className="text-slate-300">
                    Since roots cannot absorb ground nutrients, spray 1% Urea + 1% Potassium Nitrate (13-0-45) foliar solution to prevent yellowing (chlorosis) and accelerate foliage recovery.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">STAGE 3: 72 HOURS</span>
                  <h4 className="font-bold text-white text-sm">PMFBY Insurance Intimation</h4>
                  <p className="text-slate-300">
                    Intimate insurance company within 72 hours via the Crop Insurance App or Karnataka Parihara portal. Attach the JalaDrishti Satellite Verification Certificate as prima facie proof.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Information and local report drafting only — no official dispatch integration</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
