import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import az from "../i18n/az";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select("id, name, active")
      .order("name");

    if (error) setError("Məhsullar yüklənmədi");
    else setProducts(data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct() {
    const name = newName.trim();
    if (!name) {
      setError("Məhsul adı boş ola bilməz");
      return;
    }

    setError("");
    const { error } = await supabase.from("products").insert({ name });

    if (error) setError("Bu adda məhsul artıq mövcuddur");
    else {
      setNewName("");
      loadProducts();
    }
  }

  async function renameProduct(id, currentName) {
    const name = prompt("Yeni məhsul adı:", currentName);
    if (!name || !name.trim()) return;

    setError("");
    const { error } = await supabase
      .from("products")
      .update({ name: name.trim() })
      .eq("id", id);

    if (error) setError("Ad dəyişdirilə bilmədi");
    else loadProducts();
  }

  async function toggleActive(id, active) {
    const confirmMsg = active
      ? "Bu məhsulu gizlətmək istədiyinizə əminsiniz?"
      : "Bu məhsulu yenidən aktiv etmək istədiyinizə əminsiniz?";

    if (!window.confirm(confirmMsg)) return;

    setError("");
    const { error } = await supabase
      .from("products")
      .update({ active: !active })
      .eq("id", id);

    if (error) setError("Status dəyişdirilə bilmədi");
    else loadProducts();
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          {az.products.title}
        </h1>
        <p className="text-slate-600 mt-1">
          Məhsulları əlavə edin, adını dəyişin və ya gizlədin.
        </p>

        {/* Add product */}
        <div className="mt-6 flex gap-3">
          <input
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Yeni məhsul adı (məs. Alma)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={addProduct}
            className="rounded-xl bg-sky-500 text-slate-950 font-semibold px-4 py-2 hover:bg-sky-400"
          >
            Əlavə et
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-100 text-rose-700 px-4 py-2">
            {error}
          </div>
        )}

        {/* Products table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Məhsul
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Yüklənir...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Hələ məhsul yoxdur
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          p.active ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {p.active ? "Aktiv" : "Gizli"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => renameProduct(p.id, p.name)}
                        className="text-sm font-medium text-sky-600 hover:underline"
                      >
                        Adı dəyiş
                      </button>
                      <button
                        onClick={() => toggleActive(p.id, p.active)}
                        className="text-sm font-medium text-slate-600 hover:underline"
                      >
                        {p.active ? "Gizlət" : "Bərpa et"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
