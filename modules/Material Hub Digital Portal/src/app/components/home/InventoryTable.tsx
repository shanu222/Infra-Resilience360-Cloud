import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";

type InventoryRow = {
  id: string;
  material: string;
  imageUrl: string;
  gilgitQty: number;
  muzaffargarhQty: number;
  sukkurQty: number;
};

type InventoryTableProps = {
  rows: InventoryRow[];
};

export function InventoryTable({ rows }: InventoryTableProps) {
  const t = useMaterialHubStrings();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">{t.tableTitle}</h2>
        <p className="text-sm text-slate-600">{t.tableSubtitle}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{t.colMaterial}</th>
              <th className="px-4 py-3 text-right font-semibold">{t.colGilgit}</th>
              <th className="px-4 py-3 text-right font-semibold">{t.colMuzaffargarh}</th>
              <th className="px-4 py-3 text-right font-semibold">{t.colSukkur}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={row.imageUrl}
                      alt={row.material}
                      className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="font-medium text-slate-900">{row.material}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-emerald-700">{row.gilgitQty.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-blue-700">{row.muzaffargarhQty.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{row.sukkurQty.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
