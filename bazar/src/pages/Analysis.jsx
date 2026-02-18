import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import az from "../i18n/az";

// Baku date helpers
function getBakuDateISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(d);
}
function addDays(dateISO, deltaDays) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return getBakuDateISO(d);
}
function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function Analysis() {
  const today = getBakuDateISO();
  const [fromDate, setFromDate] = useState(addDays(today, -30));
  const [toDate, setToDate] = useState(today);

  const [products, setProducts] = useState([]);
  const [buys, setBuys] = useState([]);
  const [sells, setSells] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");

    if (fromDate > toDate) {
      setMsg("Başlanğıc tarixi bitiş tarixindən sonra ola bilməz.");
      setLoading(false);
      return;
    }

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select("id, name")
      .eq("active", true)
      .order("name");

    if (prodErr) {
      setMsg(prodErr.message);
      setLoading(false);
      return;
    }

    const { data: buyData, error: buyErr } = await supabase
      .from("daily_buys")
      .select("product_id, qty, price")
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate);

    if (buyErr) {
      setMsg(buyErr.message);
      setLoading(false);
      return;
    }

    const { data: sellData, error: sellErr } = await supabase
      .from("daily_sells")
      .select("product_id, qty, price")
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate);

    if (sellErr) {
      setMsg(sellErr.message);
      setLoading(false);
      return;
    }

    setProducts(prodData || []);
    setBuys(buyData || []);
    setSells(sellData || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const rows = useMemo(() => {
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    const map = new Map();

    function ensure(pid) {
      if (!map.has(pid)) {
        map.set(pid, {
          product_id: pid,
          name: nameById.get(pid) ?? "Naməlum",
          total_bought_kg: 0,
          total_bought_amount: 0,
          total_sold_kg: 0,
          total_sold_amount: 0,
        });
      }
      return map.get(pid);
    }

    for (const r of buys) {
      const cur = ensure(r.product_id);
      cur.total_bought_kg += toNum(r.qty);
      cur.total_bought_amount += toNum(r.qty) * toNum(r.price);
    }

    for (const r of sells) {
      const cur = ensure(r.product_id);
      cur.total_sold_kg += toNum(r.qty);
      cur.total_sold_amount += toNum(r.qty) * toNum(r.price);
    }

    return Array.from(map.values())
      .map((x) => ({
        ...x,
        profit: x.total_sold_amount - x.total_bought_amount,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [products, buys, sells]);

  const totals = useMemo(() => {
    const boughtAmount = rows.reduce((s, r) => s + r.total_bought_amount, 0);
    const soldAmount = rows.reduce((s, r) => s + r.total_sold_amount, 0);
    return { boughtAmount, soldAmount, profit: soldAmount - boughtAmount };
  }, [rows]);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {az.analysis.title}
            </h1>
            <p className="mt-1 text-slate-600">{az.analysis.subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Başlanğıc
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Son
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => {
                setFromDate(addDays(today, -30));
                setToDate(today);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Son 30 gün
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 border px-4 py-3 text-sm">
            {msg}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label={az.analysis.boughtAmount}
            value={totals.boughtAmount}
          />
          <SummaryCard
            label={az.analysis.soldAmount}
            value={totals.soldAmount}
          />
          <SummaryCard
            label={az.analysis.profit}
            value={totals.profit}
            highlight
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b text-sm font-semibold">
            Məhsul üzrə yekun ({fromDate} → {toDate})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-xs font-semibold text-slate-600 border-b">
                  <th className="px-4 py-3">{az.analysis.product}</th>
                  <th className="px-4 py-3">{az.analysis.boughtKg}</th>
                  <th className="px-4 py-3">{az.analysis.boughtAmount}</th>
                  <th className="px-4 py-3">{az.analysis.soldKg}</th>
                  <th className="px-4 py-3">{az.analysis.soldAmount}</th>
                  <th className="px-4 py-3 text-right">{az.analysis.profit}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      {az.analysis.loading}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      {az.analysis.noData}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.product_id} className="border-b">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">
                        {r.total_bought_kg.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {r.total_bought_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {r.total_sold_kg.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {r.total_sold_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span
                          className={
                            r.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                          }
                        >
                          {r.profit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div
        className={`mt-1 text-lg font-bold ${
          highlight
            ? value >= 0
              ? "text-emerald-700"
              : "text-rose-700"
            : "text-slate-900"
        }`}
      >
        {value.toFixed(2)}
      </div>
    </div>
  );
}
