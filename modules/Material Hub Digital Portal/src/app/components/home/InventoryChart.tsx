import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";

type ChartRow = {
  id: string;
  material: string;
  gilgitQty: number;
  muzaffargarhQty: number;
  sukkurQty: number;
};

type InventoryChartProps = {
  rows: ChartRow[];
};

export function InventoryChart({ rows }: InventoryChartProps) {
  const t = useMaterialHubStrings();
  return (
    <section className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-sky-50/95 to-cyan-100/70 p-5 shadow-md shadow-cyan-500/10 sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">{t.inventoryChartTitle}</h2>
        <p className="text-sm text-slate-600">{t.inventoryChartSubtitle}</p>
      </div>

      <div className="h-[340px] w-full rounded-xl border border-cyan-200/70 bg-white/85 p-2 shadow-inner shadow-cyan-100/60 sm:p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="material"
              angle={-25}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 10, fill: "#334155" }}
            />
            <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="gilgitQty" name={t.colGilgit} fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="muzaffargarhQty" name={t.colMuzaffargarh} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sukkurQty" name={t.colSukkur} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
