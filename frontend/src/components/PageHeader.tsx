import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, ChevronDown, CloudRain, Construction, MapPin, Sprout, type LucideIcon } from 'lucide-react';
import { MainTabType } from './Header';

interface PageHeaderProps {
  activeTab: MainTabType;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const PAGE_INFO: Record<MainTabType, { title: string; subtitle: string; Icon: LucideIcon }> = {
  overview: {
    title: 'State Overview',
    subtitle: 'District-wide waterlogging intelligence and operational context.',
    Icon: Activity,
  },
  map: {
    title: 'Flood & Waterlogging Overview',
    subtitle: 'Monitoring rainfall, river levels and agricultural waterlogging for early action',
    Icon: MapPin,
  },
  weather: {
    title: 'Weather & Radar',
    subtitle: 'Real-time weather radar, rainfall forecast and river conditions for informed decision making',
    Icon: CloudRain,
  },
  'crop-water': {
    title: 'Crop Water & Irrigation Advisor',
    subtitle: 'Personalized irrigation guidance using weather forecast, soil, crop stage and local conditions',
    Icon: Sprout,
  },
  drainage: {
    title: 'Drainage Action Center',
    subtitle: 'Prioritized recommendations for field drainage and urban outfall management',
    Icon: Construction,
  },
};

export function getTodayInKolkata(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  activeTab,
  selectedDistrict,
  onDistrictChange,
  selectedDate,
  onDateChange,
}) => {
  const [districts, setDistricts] = useState<string[]>([]);
  const [districtInput, setDistrictInput] = useState(selectedDistrict);
  const { title, subtitle, Icon } = PAGE_INFO[activeTab];

  useEffect(() => {
    setDistrictInput(selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    let mounted = true;
    fetch('/data/karnataka_districts.geojson')
      .then((response) => {
        if (!response.ok) throw new Error(`District list request failed: ${response.status}`);
        return response.json();
      })
      .then((geojson: { features?: Array<{ properties?: { district_name?: string } }> }) => {
        const names = (geojson.features || [])
          .map((feature) => feature.properties?.district_name)
          .filter((name): name is string => Boolean(name));
        if (names.length !== 31) throw new Error(`Expected 31 Karnataka districts, received ${names.length}`);
        if (mounted) setDistricts(names);
      })
      .catch((error: unknown) => {
        console.error('Failed to load Karnataka district list:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleDistrictChange = (value: string) => {
    setDistrictInput(value);
    const match = districts.find((district) => district.toLocaleLowerCase() === value.toLocaleLowerCase());
    if (match) onDistrictChange(match);
  };

  return (
    <section className="jd-page-header mx-auto flex w-full max-w-[1600px] flex-col justify-between gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cfe2fa] bg-[#eaf3ff] text-[#1d6fd8] dark:border-[#274870] dark:bg-[#172e4c] dark:text-[#9bc8ff]">
          <Icon size={23} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-[190px] flex-1 items-center gap-2 rounded-xl border border-[#e5ebf3] bg-white px-3 py-2.5 text-slate-500 shadow-sm focus-within:border-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-400 sm:flex-none">
          <MapPin size={16} className="shrink-0 text-[#1d6fd8]" />
          <span className="sr-only">Search district</span>
          <input
            list="karnataka-district-options"
            value={districtInput}
            onChange={(event) => handleDistrictChange(event.target.value)}
            aria-label="Search district"
            placeholder="Search district"
            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-slate-100 sm:w-36"
          />
          <ChevronDown size={15} className="shrink-0" />
          <datalist id="karnataka-district-options">
            {districts.map((district) => <option key={district} value={district} />)}
          </datalist>
        </label>

        <label className="relative flex min-w-[190px] items-center gap-2 rounded-xl border border-[#e5ebf3] bg-white px-3 py-2.5 text-slate-500 shadow-sm focus-within:border-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-400">
          <CalendarDays size={16} className="shrink-0 text-[#1d6fd8]" />
          <span className="sr-only">Select date in Asia/Kolkata</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value || getTodayInKolkata())}
            aria-label="Select date in Asia/Kolkata"
            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none dark:text-slate-100"
            title="Date in Asia/Kolkata"
          />
        </label>
      </div>
    </section>
  );
}
