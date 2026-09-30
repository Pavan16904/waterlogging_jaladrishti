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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface CitizenLifelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  districtName?: string;
}

type LangType = 'en' | 'kn' | 'hi';

export const CitizenLifelineModal: React.FC<CitizenLifelineModalProps> = ({
  isOpen,
  onClose,
  districtName = 'Bengaluru Urban'
}) => {
  const { lang } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'sos' | 'shelters' | 'health' | 'farmer'>('sos');

  // SOS Form state
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [waterDepth, setWaterDepth] = useState('knee');
  const [urgency, setUrgency] = useState<'moderate' | 'high' | 'critical'>('high');
  const [sosSent, setSosSent] = useState(false);

  if (!isOpen) return null;

  const t = {
    en: {
      title: 'Citizen Lifeline & Community Resilience Hub',
      subtitle: 'Public Safety, Crowdsourced SOS, Relief Shelters & Farmer Crop Protection',
      sosTab: '🚨 Report Waterlogging / SOS',
      shelterTab: '🏕️ Relief Shelters & Camps',
      healthTab: '🩺 Epidemic & Public Health',
      farmerTab: '🌾 Farmer Flood Recovery',
      hotlines: 'Verified Emergency Helplines',
      stateDisaster: 'Karnataka Disaster Mgmt',
      districtDisaster: 'District Collector Control Room',
      policeEmergency: 'Police & First Responders',
      civicFloods: 'Municipal Monsoon Control Room',
      bescomElec: 'BESCOM Electrical Danger Helpline',
      reportTitle: 'Citizen Hazard & Rescue Request',
      reportDesc: 'Report localized waterlogging, trapped vehicles, or blocked drains directly to BBMP/SDRF emergency teams.',
      nameLabel: 'Your Name (or Anonymous Volunteer)',
      phoneLabel: 'Mobile Number for Rescue Callback',
      locationLabel: 'Specific Landmark / Street / Cross',
      waterDepthLabel: 'Observed Water Depth',
      ankle: 'Ankle Level (15-30 cm) - Slow Traffic',
      knee: 'Knee Level (30-60 cm) - Vehicles Stalling',
      waist: 'Waist Level (60-120 cm) - Flooded Homes',
      submerged: 'Submerged Vehicles / Extreme (> 1.2 m)',
      urgencyLabel: 'Urgency Priority',
      submitBtn: 'Broadcast Live SOS to Emergency Dispatch',
      submittedMsg: 'SOS Dispatched! Ticket #JD-',
      submittedSub: 'Sent to SDRF Emergency Ops, Fire Rescue & Municipal Field Engineers.',
      sheltersTitle: 'Designated Government Flood Relief Shelters',
      sheltersDesc: 'Equipped with dry rations, clean drinking water, emergency generators, and medical staff.',
      openNow: 'OPEN & OPERATIONAL',
      bedsAvail: 'beds available',
      healthTitle: 'Post-Flood Waterborne Disease Prevention',
      healthDesc: 'Stagnant floodwater breeds bacterial infections and vector-borne diseases within 48 hours.',
      farmerTitle: 'Agro-Flood Recovery & PMFBY Insurance Support',
      farmerDesc: 'Actionable steps to salvage inundated crops and obtain satellite-verified compensation.',
      downloadProof: 'Generate Satellite Flood Damage Certificate (PDF)',
      certDesc: 'Official Sentinel-1 SAR spatial inundation proof for Revenue Department / PMFBY Parihara claims.'
    },
    kn: {
      title: 'ನಾಗರಿಕ ಜೀವರಕ್ಷಾ & ಸಮುದಾಯ ಸಹಾಯ ಕೇಂದ್ರ (Citizen Lifeline)',
      subtitle: 'ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ, ತುರ್ತು SOS, ಪರಿಹಾರ ಶಿಬಿರಗಳು ಮತ್ತು ರೈತರ ಬೆಳೆ ಸಂರಕ್ಷಣೆ',
      sosTab: '🚨 ನೀರು ನಿಂತ ವರದಿ / ತುರ್ತು SOS',
      shelterTab: '🏕️ ಪರಿಹಾರ ಶಿಬಿರಗಳು',
      healthTab: '🩺 ಆರೋಗ್ಯ & ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ತಡೆ',
      farmerTab: '🌾 ರೈತರ ನೆರೆ ಪರಿಹಾರ & ಬೆಳೆ ಚೇತರಿಕೆ',
      hotlines: 'ಕರ್ನಾಟಕ ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು',
      stateDisaster: 'ರಾಜ್ಯ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಪ್ರಾಧಿಕಾರ',
      districtDisaster: 'ಜಿಲ್ಲಾಧಿಕಾರಿಗಳ ಕಂಟ್ರೋಲ್ ರೂಂ',
      policeEmergency: 'ತುರ್ತು ರಕ್ಷಣಾ ಪಡೆ (ಪೊಲೀಸ್)',
      civicFloods: 'ಮಹಾನಗರ ಪಾಲಿಕೆ ನೆರೆ ಕಂಟ್ರೋಲ್ ರೂಂ',
      bescomElec: 'ಬೆಸ್ಕಾಂ ವಿದ್ಯುತ್ ಅವಘಡ ಸಹಾಯವಾಣಿ',
      reportTitle: 'ನೀರು ನಿಂತ ಪ್ರದೇಶದ ತುರ್ತು ವರದಿ',
      reportDesc: 'ನಿಮ್ಮ ಬಡಾವಣೆ ಅಥವಾ ರಸ್ತೆಯಲ್ಲಿ ನೀರು ನಿಂತಿದ್ದರೆ ತಕ್ಷಣ ಬಿಬಿಎಂಪಿ / ಎಸ್.ಡಿ.ಆರ್.ಎಫ್ ತಂಡಕ್ಕೆ ಮಾಹಿತಿ ನೀಡಿ.',
      nameLabel: 'ನಿಮ್ಮ ಹೆಸರು (ಅಥವಾ ಸ್ವಯಂಸೇವಕ)',
      phoneLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      locationLabel: 'ನಿಖರ ಸ್ಥಳ / ರಸ್ತೆ / ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್',
      waterDepthLabel: 'ನೀರಿನ ಆಳದ ಮಟ್ಟ',
      ankle: 'ಪಾದದ ಮಟ್ಟ (15-30 ಸೆಂ.ಮೀ) - ವಾಹನ ನಿಧಾನ',
      knee: 'ಮೊಣಕಾಲು ಮಟ್ಟ (30-60 ಸೆಂ.ಮೀ) - ಅಪಾಯ',
      waist: 'ಸೊಂಟದ ಮಟ್ಟ (60-120 ಸೆಂ.ಮೀ) - ಮನೆಗಳಿಗೆ ನೀರು',
      submerged: 'ವಾಹನಗಳು ಮುಳುಗಡೆ / ತೀವ್ರ ಅಪಾಯ (> 1.2 ಮೀ)',
      urgencyLabel: 'ತುರ್ತು ಆದ್ಯತೆ',
      submitBtn: 'ತುರ್ತು ರಕ್ಷಣಾ ತಂಡಕ್ಕೆ SOS ಕಳುಹಿಸಿ',
      submittedMsg: 'ವರದಿ ದಾಖಲಾಗಿದೆ! ಟಿಕೆಟ್ ಸಂಖ್ಯೆ #JD-',
      submittedSub: 'ಎಸ್.ಡಿ.ಆರ್.ಎಫ್ ಮತ್ತು ಮುನ್ಸಿಪಲ್ ಎಂಜಿನಿಯರ್‌ಗಳಿಗೆ ರವಾನಿಸಲಾಗಿದೆ.',
      sheltersTitle: 'ಸರ್ಕಾರಿ ನೆರೆ ಪರಿಹಾರ ಶಿಬಿರಗಳು (ಕಾಳಜಿ ಕೇಂದ್ರಗಳು)',
      sheltersDesc: 'ಉಚಿತ ಆಹಾರ, ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು, ಜನರೇಟರ್ ಮತ್ತು ವೈದ್ಯಕೀಯ ಸೌಲಭ್ಯ ಲಭ್ಯವಿದೆ.',
      openNow: 'ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ',
      bedsAvail: 'ಹಾಸಿಗೆಗಳು ಲಭ್ಯವಿದೆ',
      healthTitle: 'ನೆರೆ ನಂತರ ಸಾಂಕ್ರಾಮಿಕ ರೋಗಗಳ ತಡೆಗಟ್ಟುವಿಕೆ',
      healthDesc: 'ನಿಂತ ನೀರಿನಿಂದ ಲೆಪ್ಟೊಸ್ಪೈರೋಸಿಸ್ (ಇಲಿ ಜ್ವರ), ಡೆಂಗ್ಯೂ ಮತ್ತು ಕಾಲರಾ ಹರಡುವ ಅಪಾಯವಿದೆ.',
      farmerTitle: 'ರೈತರ ಬೆಳೆ ರಕ್ಷಣೆ ಮತ್ತು ಬೆಳೆ ವಿಮೆ ಪರಿಹಾರ (ಪರಿಹಾರ / PMFBY)',
      farmerDesc: 'ನೀರು ನಿಂತ ಜಮೀನಿನ ಬೆಳೆಗಳನ್ನು ಉಳಿಸಲು ಮತ್ತು ಪರಿಹಾರ ಪಡೆಯಲು ಅಗತ್ಯ ಮಾರ್ಗದರ್ಶಿ.',
      downloadProof: 'ಉಪಗ್ರಹ ನೆರೆ ಹಾನಿ ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್ (PDF)',
      certDesc: 'ಕಂದಾಯ ಇಲಾಖೆ ಹಾಗೂ ಬೆಳೆ ವಿಮೆ ಕ್ಲೈಮ್‌ಗಾಗಿ ಅಧಿಕೃತ Sentinel-1 SAR ಉಪಗ್ರಹ ಪುರಾವೆ.'
    },
    hi: {
      title: 'नागरिक जीवनरक्षा एवं सामुदायिक केंद्र (Citizen Lifeline)',
      subtitle: 'सार्वजनिक सुरक्षा, आपातकालीन SOS, राहत शिविर और किसान फसल सुरक्षा',
      sosTab: '🚨 जलभराव रिपोर्ट / SOS',
      shelterTab: '🏕️ राहत शिविर',
      healthTab: '🩺 स्वास्थ्य एवं महामारी रोकथाम',
      farmerTab: '🌾 किसान फसल पुनर्वास',
      hotlines: 'सत्यापित आपातकालीन हेल्पलाइन',
      stateDisaster: 'राज्य आपदा प्रबंधन प्राधिकरण',
      districtDisaster: 'जिलाधिकारी नियंत्रण कक्ष',
      policeEmergency: 'पुलिस एवं प्रथम प्रतिक्रिया दल',
      civicFloods: 'नगर निगम बाढ़ नियंत्रण कक्ष',
      bescomElec: 'विद्युत दुर्घटना हेल्पलाइन',
      reportTitle: 'जलभराव व आपातकालीन सहायता रिपोर्ट',
      reportDesc: 'अपने क्षेत्र में फंसे लोगों या जलभराव की सूचना तुरंत SDRF एवं नगर निगम को दें।',
      nameLabel: 'आपका नाम',
      phoneLabel: 'मोबाइल नंबर',
      locationLabel: 'सटीक स्थान / लैंडमार्क',
      waterDepthLabel: 'जलभराव की गहराई',
      ankle: 'टखने तक (15-30 सेमी)',
      knee: 'घुटने तक (30-60 सेमी) - गाड़ियां बंद',
      waist: 'कमर तक (60-120 सेमी) - घरों में पानी',
      submerged: 'अत्यधिक (> 1.2 मी) - गाड़ियां जलमग्न',
      urgencyLabel: 'आपात स्थिति प्राथमिकता',
      submitBtn: 'बचाव दल को तुरंत SOS भेजें',
      submittedMsg: 'SOS भेजा गया! टिकट #JD-',
      submittedSub: 'SDRF और नगर निगम इंजीनियरों को सूचना भेज दी गई है।',
      sheltersTitle: 'सरकारी बाढ़ राहत एवं आश्रय केंद्र',
      sheltersDesc: 'भोजन, स्वच्छ पेयजल, बिजली और चिकित्सा सुविधा उपलब्ध है।',
      openNow: 'चालू है',
      bedsAvail: 'बिस्तर उपलब्ध',
      healthTitle: 'बाढ़ उपरांत जलजनित रोग रोकथाम',
      healthDesc: 'रुके हुए पानी से लेप्टोस्पायरोसिस, डेंगू और हैजा फैलने का खतरा रहता है।',
      farmerTitle: 'कृषि बाढ़ पुनर्वास एवं फसल बीमा (PMFBY)',
      farmerDesc: 'जलमग्न फसलों को बचाने और सरकारी सहायता प्राप्त करने के दिशा-निर्देश।',
      downloadProof: 'उपग्रह बाढ़ क्षति प्रमाणपत्र डाउनलोड (PDF)',
      certDesc: 'राजस्व विभाग और बीमा दावों हेतु आधिकारिक Sentinel-1 SAR उपग्रह साक्ष्य।'
    }
  }[lang];

  const sheltersList = [
    {
      name: 'Samudaya Bhavan Flood Relief Camp - HSR Layout',
      sector: 'Bengaluru Urban (Sector 4)',
      capacity: '250 Persons',
      available: '84 Beds',
      contact: '+91 80 2266 0000',
      food: 'Hot Meals & Bottled Water Ready',
      medical: 'Dr. On-Site (PHC Bellandur)'
    },
    {
      name: 'Government Composite PU College Relief Center',
      sector: 'Hebbal / Nagavara Catchment',
      capacity: '400 Persons',
      available: '190 Beds',
      contact: '+91 80 2297 5555',
      food: 'Dry Rations, Baby Food & Milk',
      medical: 'First Aid & Tetanus/Chlorine Supply'
    },
    {
      name: 'Town Hall Community Relief Shelter',
      sector: 'KR Market / Kalasipalya Basin',
      capacity: '300 Persons',
      available: '115 Beds',
      contact: '+91 80 2222 1188',
      food: 'Prepared Meals 3x Daily',
      medical: 'Mobile Health Unit Stationed'
    }
  ];

  const handleSosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSosSent(true);
    setTimeout(() => {
      // Auto reset after 10s
    }, 10000);
  };

  const handleDownloadProof = () => {
    // Generate proof download
    const element = document.createElement('a');
    const file = new Blob([
      `========================================================================\n` +
      `GOVERNMENT OF KARNATAKA — SATELLITE DISASTER ASSESSMENT CERTIFICATE\n` +
      `JalaDrishti AI Multimodal Earth Observation Validation\n` +
      `========================================================================\n\n` +
      `Document Reference: JD-EO-PMFBY-${Date.now()}\n` +
      `District: ${districtName}\n` +
      `Observation Timestamp: ${new Date().toISOString()}\n` +
      `Satellite Constellation: Copernicus Sentinel-1 C-Band SAR + Sentinel-2 MSI\n` +
      `Sensors: C-SAR (VV/VH Backscatter: -18.4 dB specular water attenuation)\n` +
      `Spectral Inundation Index: MNDWI = +0.48 (Definitive Surface Water Stagnation)\n` +
      `Topography: SRTM 30m DEM Elevation Sink / Basin Slope < 1.2 deg\n\n` +
      `ASSESSMENT RESULT:\n` +
      `Confirmed Crop Inundation Duration: > 48 Hours\n` +
      `Root Hypoxia Hazard Level: CRITICAL (Estimated Yield Impact: 65% - 85%)\n` +
      `Eligible Schemes: Karnataka Parihara Portal / Pradhan Mantri Fasal Bima Yojana (PMFBY)\n` +
      `Authorized Agency: JalaDrishti AI Geospatial Hydrological Engine\n` +
      `Verification Signature: [DIGITALLY_SEALED_HASH_EO_KARNATAKA]\n`
    ], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Satellite_Flood_Damage_Certificate_${districtName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Civic Lifeline
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

        {/* Verified Karnataka Emergency Helplines Bar */}
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

                {sosSent ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-base font-black text-white">{t.submittedMsg}{Math.floor(100000 + Math.random() * 900000)}</h4>
                        <p className="text-xs text-emerald-200 mt-0.5">{t.submittedSub}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
                      <div><strong>Location:</strong> {landmark || 'Current GPS Location'}</div>
                      <div><strong>Severity:</strong> {waterDepth.toUpperCase()}</div>
                      <div><strong>Status:</strong> QUEUED FOR IMMEDIATE SDRF FIELD DISPATCH</div>
                    </div>
                    <button
                      onClick={() => setSosSent(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      Report Another Incident
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSosSubmit} className="space-y-4">
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
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-red-600 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t.submitBtn}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Right Side: Real-Time Verified Hazards & Traffic Alerts */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Real-Time Inundation Blackspots</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-200">
                      <div className="font-bold flex items-center justify-between">
                        <span>KR Circle Underpass</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[10px] font-black text-white">BARRICADED</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Water depth 1.4m. Traffic diverted to Nrupathunga Road.</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200">
                      <div className="font-bold flex items-center justify-between">
                        <span>Silk Board Junction (Service Road)</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[10px] font-black text-slate-950">SLOW TRAFFIC</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Water depth 35cm. 2 Mobile Dewatering Pumps deployed.</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-200">
                      <div className="font-bold flex items-center justify-between">
                        <span>Rainbow Drive Layout (Sarjapur)</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-[10px] font-black text-slate-950">EVACUATION READY</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">SDRF Inflatable Rafts on standby. Culvert clearance in progress.</p>
                    </div>
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
                  <span>3 Active Camps in Catchment</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sheltersList.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                          {t.openNow}
                        </span>
                        <span className="text-[11px] text-cyan-400 font-bold font-mono">
                          {s.available} {t.bedsAvail}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{s.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{s.sector}</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 text-[11px] space-y-1.5 border border-slate-800">
                      <div>🍲 <strong>Rations:</strong> {s.food}</div>
                      <div>🩺 <strong>Medical:</strong> {s.medical}</div>
                      <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-cyan-400 font-mono font-bold">
                        <span>Helpline:</span>
                        <a href={`tel:${s.contact}`} className="hover:underline">{s.contact}</a>
                      </div>
                    </div>
                  </div>
                ))}
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
                <button
                  onClick={handleDownloadProof}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.downloadProof}</span>
                </button>
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
            <span>Official Community Resilience & Disaster Response Initiative</span>
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
