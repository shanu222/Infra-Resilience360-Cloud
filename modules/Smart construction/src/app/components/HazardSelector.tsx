import { AlertTriangle, Waves, Flame, Sun, Wind, AlertCircle } from 'lucide-react';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';

interface HazardSelectorProps {
  selected: string[];
  onChange: (hazards: string[]) => void;
}

const HAZARD_DEFS = [
  { id: 'earthquake', icon: AlertTriangle, color: 'red' as const, nameKey: 'hz_earthquake', descKey: 'hz_earthquake_d' },
  { id: 'flood', icon: Waves, color: 'blue' as const, nameKey: 'hz_flood', descKey: 'hz_flood_d' },
  { id: 'fire', icon: Flame, color: 'amber' as const, nameKey: 'hz_fire', descKey: 'hz_fire_d' },
  { id: 'heatwave', icon: Sun, color: 'yellow' as const, nameKey: 'hz_heatwave', descKey: 'hz_heatwave_d' },
  { id: 'wind', icon: Wind, color: 'cyan' as const, nameKey: 'hz_wind', descKey: 'hz_wind_d' },
  { id: 'other', icon: AlertCircle, color: 'gray' as const, nameKey: 'hz_other', descKey: 'hz_other_d' },
];

const colorClasses = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    selectedBg: 'bg-red-500',
    selectedBorder: 'border-red-500',
    icon: 'text-red-600',
    selectedIcon: 'text-white',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    selectedBg: 'bg-blue-500',
    selectedBorder: 'border-blue-500',
    icon: 'text-blue-600',
    selectedIcon: 'text-white',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    selectedBg: 'bg-amber-500',
    selectedBorder: 'border-amber-500',
    icon: 'text-amber-600',
    selectedIcon: 'text-white',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    selectedBg: 'bg-amber-500',
    selectedBorder: 'border-amber-500',
    icon: 'text-amber-600',
    selectedIcon: 'text-white',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    selectedBg: 'bg-cyan-500',
    selectedBorder: 'border-cyan-500',
    icon: 'text-cyan-600',
    selectedIcon: 'text-white',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    selectedBg: 'bg-gray-500',
    selectedBorder: 'border-gray-500',
    icon: 'text-gray-600',
    selectedIcon: 'text-white',
  },
};

export default function HazardSelector({ selected, onChange }: HazardSelectorProps) {
  const { form: f } = useSmartConstructionStrings();

  const hazardName = (id: string): string => {
    const def = HAZARD_DEFS.find((h) => h.id === id);
    return def ? f[def.nameKey] : id;
  };

  const toggleHazard = (hazardId: string) => {
    if (selected.includes(hazardId)) {
      onChange(selected.filter((id) => id !== hazardId));
    } else {
      onChange([...selected, hazardId]);
    }
  };

  const selectedList = selected.map((id) => hazardName(id)).join(', ');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{f.hz_title}</h2>
          <p className="text-gray-600">{f.hz_subtitle}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {HAZARD_DEFS.map((hazard) => {
          const isSelected = selected.includes(hazard.id);
          const colors = colorClasses[hazard.color];
          const Icon = hazard.icon;
          const name = f[hazard.nameKey];
          const desc = f[hazard.descKey];

          return (
            <button
              key={hazard.id}
              type="button"
              onClick={() => toggleHazard(hazard.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `${colors.selectedBg} ${colors.selectedBorder} shadow-lg`
                  : `${colors.bg} ${colors.border} hover:shadow-md`
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-white/20' : 'bg-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isSelected ? colors.selectedIcon : colors.icon}`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      isSelected ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {name}
                  </h3>
                  <p
                    className={`text-sm ${
                      isSelected ? 'text-white/90' : 'text-gray-600'
                    }`}
                  >
                    {desc}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-white border-white'
                      : `border-gray-300 ${colors.bg}`
                  }`}
                >
                  {isSelected && (
                    <div className={`w-3 h-3 rounded-full ${colors.selectedBg}`} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ {f.hz_warnNoneBold}</span> {f.hz_warnNone}
          </p>
        </div>
      )}

      {selected.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <span className="font-semibold">
              {f.hz_selectedBold.replace('{n}', String(selected.length))}{' '}
            </span>
            {f.hz_selected.replace('{list}', selectedList)}
          </p>
        </div>
      )}
    </div>
  );
}
