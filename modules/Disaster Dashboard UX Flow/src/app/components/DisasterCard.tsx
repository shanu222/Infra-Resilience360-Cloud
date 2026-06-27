import { Link } from 'react-router';
import * as LucideIcons from 'lucide-react';

interface DisasterCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
}

type DisasterCardTheme = {
  gradient: string;
  iconColor: string;
  glow: string;
};

const DISASTER_CARD_THEMES: Record<string, DisasterCardTheme> = {
  flood: {
    gradient: 'from-blue-500 via-blue-600 to-cyan-500',
    iconColor: 'text-blue-700',
    glow: 'hover:shadow-blue-300/55 hover:border-blue-200/75'
  },
  earthquake: {
    gradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconColor: 'text-orange-700',
    glow: 'hover:shadow-orange-300/55 hover:border-orange-200/70'
  },
  'urban-fire': {
    gradient: 'from-red-500 via-rose-500 to-red-600',
    iconColor: 'text-red-700',
    glow: 'hover:shadow-red-300/55 hover:border-red-200/75'
  },
  'crop-fire': {
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    iconColor: 'text-amber-700',
    glow: 'hover:shadow-amber-300/55 hover:border-amber-200/70'
  },
  heatwave: {
    gradient: 'from-yellow-400 via-orange-400 to-orange-500',
    iconColor: 'text-orange-700',
    glow: 'hover:shadow-yellow-300/60 hover:border-yellow-200/75'
  },
  'load-shedding': {
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    iconColor: 'text-violet-700',
    glow: 'hover:shadow-violet-300/55 hover:border-violet-200/75'
  },
  'storm-cyclone': {
    gradient: 'from-indigo-500 via-blue-500 to-sky-500',
    iconColor: 'text-indigo-700',
    glow: 'hover:shadow-indigo-300/55 hover:border-indigo-200/75'
  },
  landslide: {
    gradient: 'from-stone-500 via-amber-700 to-zinc-600',
    iconColor: 'text-stone-700',
    glow: 'hover:shadow-stone-400/45 hover:border-stone-200/70'
  },
  'cold-wave': {
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    iconColor: 'text-cyan-700',
    glow: 'hover:shadow-cyan-300/55 hover:border-cyan-200/75'
  },
  smog: {
    gradient: 'from-slate-500 via-gray-500 to-zinc-500',
    iconColor: 'text-slate-700',
    glow: 'hover:shadow-slate-400/50 hover:border-slate-200/70'
  }
};

export function DisasterCard({ id, name, icon, color }: DisasterCardProps) {
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[
    icon.split('-').map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
  ] || LucideIcons.AlertTriangle;

  const colorStr = typeof color === 'string' ? color : String(color ?? '')
  const fallbackTheme: DisasterCardTheme = {
    gradient: colorStr.includes('bg-') ? 'from-slate-500 to-slate-600' : 'from-slate-500 to-slate-600',
    iconColor: 'text-slate-700',
    glow: 'hover:shadow-slate-300/45 hover:border-slate-200/70'
  };

  const theme = DISASTER_CARD_THEMES[id] ?? fallbackTheme;

  return (
    <Link 
      to={`/disaster/${id}`}
      className="block group"
    >
      <div
        className={`
          h-full rounded-2xl border border-white/55 bg-gradient-to-br ${theme.gradient}
          p-6 shadow-lg shadow-black/10 backdrop-blur-sm
          transition-all duration-300 ease-out
          group-hover:-translate-y-1.5 group-hover:scale-[1.02] group-hover:shadow-2xl
          ${theme.glow}
        `}
      >
        <div className="mb-5 flex items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110">
            <IconComponent className={`h-7 w-7 ${theme.iconColor}`} />
          </div>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">{name}</h3>
      </div>
    </Link>
  );
}
