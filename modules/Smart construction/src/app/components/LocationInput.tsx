import { MapPin } from 'lucide-react';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';

interface LocationInputProps {
  data: {
    country: string;
    province: string;
    district: string;
  };
  onChange: (data: { country: string; province: string; district: string }) => void;
}

const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'Gilgit-Baltistan',
  'Islamabad Capital Territory',
];

function provinceLabel(f: Record<string, string>, value: string): string {
  const key = `province_${value.replace(/[-\s]+/g, '_')}`;
  return f[key] ?? value;
}

export default function LocationInput({ data, onChange }: LocationInputProps) {
  const { form: t } = useSmartConstructionStrings();

  const handleChange = (field: string, value: string) => {
    onChange({ ...data, country: 'Pakistan', [field]: value });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.loc_title}</h2>
          <p className="text-gray-600">{t.loc_subtitle}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.loc_province}
          </label>
          <select
            value={data.province}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            required
          >
            <option value="">{t.loc_selectProvince}</option>
            {PAKISTAN_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {provinceLabel(t, province)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.loc_district}
          </label>
          <input
            type="text"
            value={data.district}
            onChange={(e) => handleChange('district', e.target.value)}
            placeholder={t.loc_districtPh}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 {t.loc_noteBold}</span> {t.loc_note}
          </p>
        </div>
      </div>
    </div>
  );
}
