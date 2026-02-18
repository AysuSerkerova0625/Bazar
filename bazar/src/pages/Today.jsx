import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ---------------- helpers ---------------- */

function getBakuDateISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(
    new Date(),
  );
}

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function newRow() {
  return { product_id: "", qty: "", price: "" };
}

function useDebouncedEffect(effect, deps, delayMs) {
  useEffect(() => {
    const t = setTimeout(() => effect(), delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs]);
}

/* ---------------- component ---------------- */

export default function Today() {
  const [dateISO] = useState(getBakuDateISO());

  const [products, setProducts] = useState([]);
  const [buys, setBuys] = useState([newRow()]);
  const [sells, setSells] = useState([newRow()]);
  const [availableMap, setAvailableMap] = useState(new Map());

  const [loading, setLoading] = useState(true);
  const [buyMsg, setBuyMsg] = useState("");
  const [sellMsg, setSellMsg] = useState("");
  const [readyToAutosave, setReadyToAutosave] = useState(false);

  const productNameById = useMemo(() => {
    const m = {};
    for (const p of products) m[p.id] = p.name;
    return m;
  }, [products]);

  function rowsToSave(rows) {
    return rows
      .map((r) => ({
        product_id: r.product_id,
        qty: toNum(r.qty),
        price: toNum(r.price),
      }))
      .filter((r) => r.product_id && r.qty > 0 && r.price > 0);
  }

  function hasIncompleteSelected(rows) {
    return rows.some((r) => {
      if (!r.product_id) return false;
      return !(toNum(r.qty) > 0 && toNum(r.price) > 0);
    });
  }

  /* ---------------- load ---------------- */

  async function load() {
    setLoading(true);
    setReadyToAutosave(false);
    setBuyMsg("");
    setSellMsg("");

    const { data: prodData } = await supabase
      .from("products")
      .select("id, name")
      .eq("active", true)
      .order("name");

    setProducts(prodData || []);

    const { data: buyData } = await supabase
      .from("daily_buys")
      .select("product_id, qty, price")
      .eq("entry_date", dateISO);

    const { data: sellData } = await supabase
      .from("daily_sells")
      .select("product_id, qty, price")
      .eq("entry_date", dateISO);

    setBuys(
      buyData?.length
        ? buyData.map((r) => ({
            product_id: r.product_id,
            qty: String(r.qty),
            price: String(r.price),
          }))
        : [newRow()],
    );

    setSells(
      sellData?.length
        ? sellData.map((r) => ({
            product_id: r.product_id,
            qty: String(r.qty),
            price: String(r.price),
          }))
        : [newRow()],
    );

    setLoading(false);
    setTimeout(() => setReadyToAutosave(true), 0);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- stock ---------------- */

  async function loadAvailableStock() {
    const { data: prevBuys } = await supabase
      .from("daily_buys")
      .select("product_id, qty")
      .lt("entry_date", dateISO);

    const { data: prevSells } = await supabase
      .from("daily_sells")
      .select("product_id, qty")
      .lt("entry_date", dateISO);

    const stock = new Map();

    for (const r of prevBuys || [])
      stock.set(r.product_id, (stock.get(r.product_id) || 0) + toNum(r.qty));

    for (const r of prevSells || [])
      stock.set(r.product_id, (stock.get(r.product_id) || 0) - toNum(r.qty));

    for (const r of rowsToSave(buys))
      stock.set(r.product_id, (stock.get(r.product_id) || 0) + r.qty);

    setAvailableMap(stock);
  }

  useEffect(() => {
    if (!loading) loadAvailableStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buys, loading]);

  /* ---------------- autosave ---------------- */

  async function autoSaveBuys() {
    if (loading || !readyToAutosave) return;

    if (hasIncompleteSelected(buys)) {
      setBuyMsg("Məhsul, miqdar və qiyməti doldurun.");
      return;
    } else setBuyMsg("");

    const rows = rowsToSave(buys);

    await supabase.from("daily_buys").delete().eq("entry_date", dateISO);

    if (rows.length) {
      await supabase
        .from("daily_buys")
        .insert(rows.map((r) => ({ entry_date: dateISO, ...r })));
    }

    await loadAvailableStock();
  }

  async function autoSaveSells() {
    if (loading || !readyToAutosave) return;

    if (hasIncompleteSelected(sells)) {
      setSellMsg("Məhsul, miqdar və qiyməti doldurun.");
      return;
    } else setSellMsg("");

    const rows = rowsToSave(sells);

    for (const r of rows) {
      if (r.qty > (availableMap.get(r.product_id) || 0)) {
        setSellMsg(
          `"${productNameById[r.product_id]}" üçün kifayət qədər məhsul yoxdur.`,
        );
        return;
      }
    }

    await supabase.from("daily_sells").delete().eq("entry_date", dateISO);

    if (rows.length) {
      await supabase
        .from("daily_sells")
        .insert(rows.map((r) => ({ entry_date: dateISO, ...r })));
    }

    await loadAvailableStock();
  }

  useDebouncedEffect(autoSaveBuys, [buys, readyToAutosave], 700);
  useDebouncedEffect(
    autoSaveSells,
    [sells, availableMap, readyToAutosave],
    700,
  );

  /* ---------------- summary table ---------------- */

  const todayByProduct = useMemo(() => {
    const map = new Map();

    for (const r of rowsToSave(buys)) {
      const cur = map.get(r.product_id) || {
        product_id: r.product_id,
        boughtKg: 0,
        boughtAmount: 0,
        soldKg: 0,
        soldAmount: 0,
      };
      cur.boughtKg += r.qty;
      cur.boughtAmount += r.qty * r.price;
      map.set(r.product_id, cur);
    }

    for (const r of rowsToSave(sells)) {
      const cur = map.get(r.product_id) || {
        product_id: r.product_id,
        boughtKg: 0,
        boughtAmount: 0,
        soldKg: 0,
        soldAmount: 0,
      };
      cur.soldKg += r.qty;
      cur.soldAmount += r.qty * r.price;
      map.set(r.product_id, cur);
    }

    return Array.from(map.values()).map((r) => ({
      ...r,
      profit: r.soldAmount - r.boughtAmount,
    }));
  }, [buys, sells]);

  /* ---------------- UI ---------------- */

  function renderTable(title, rows, setRows, message, mode) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex justify-between px-4 py-3 bg-slate-50 border-b">
          <div className="font-semibold">{title}</div>
          <button
            onClick={() => setRows((p) => [...p, newRow()])}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-100"
          >
            + Sətir əlavə et
          </button>
        </div>

        {message && (
          <div className="m-4 rounded-xl bg-rose-50 text-rose-700 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <table className="w-full">
          <thead className="text-xs border-b">
            <tr>
              <th className="px-4 py-3">Məhsul</th>
              <th className="px-4 py-3">Miqdar (kg)</th>
              <th className="px-4 py-3">Qiymət (AZN)</th>
              <th className="px-4 py-3 text-right">Cəmi</th>
              <th className="px-4 py-3 text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3">
                  <select
                    value={r.product_id}
                    onChange={(e) =>
                      setRows((p) => {
                        const c = [...p];
                        c[i] = { ...c[i], product_id: e.target.value };
                        return c;
                      })
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Seçin…</option>
                    {products.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={
                          mode === "sell" && (availableMap.get(p.id) || 0) <= 0
                        }
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={r.qty}
                    onChange={(e) =>
                      setRows((p) => {
                        const c = [...p];
                        c[i] = { ...c[i], qty: e.target.value };
                        return c;
                      })
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={r.price}
                    onChange={(e) =>
                      setRows((p) => {
                        const c = [...p];
                        c[i] = { ...c[i], price: e.target.value };
                        return c;
                      })
                    }
                    className="border rounded px-2 py-1 w-24"
                  />
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {(toNum(r.qty) * toNum(r.price)).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (!window.confirm("Silmək istədiyinizə əminsiniz?"))
                        return;
                      setRows((p) =>
                        p.length === 1
                          ? [newRow()]
                          : p.filter((_, x) => x !== i),
                      );
                    }}
                    className="text-rose-600 hover:underline text-sm"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Bu gün</h1>
      <div className="mt-2 bg-slate-100 inline-block px-3 py-2 rounded-xl">
        Tarix: {dateISO}
      </div>

      <div className="mt-6 grid gap-6">
        {renderTable("Alınan məhsullar", buys, setBuys, buyMsg, "buy")}
        {renderTable("Satılan məhsullar", sells, setSells, sellMsg, "sell")}
      </div>

      {/* THIRD TABLE */}
      <div className="mt-6 rounded-2xl border bg-white shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b font-semibold">
          Bu gün üzrə xülasə
        </div>

        <table className="w-full">
          <thead className="text-xs border-b">
            <tr>
              <th className="px-4 py-3">Məhsul</th>
              <th className="px-4 py-3 text-right">Alınan (kg)</th>
              <th className="px-4 py-3 text-right">Satılan (kg)</th>
              <th className="px-4 py-3 text-right">Mənfəət</th>
            </tr>
          </thead>
          <tbody>
            {todayByProduct.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  Bu gün məlumat yoxdur
                </td>
              </tr>
            ) : (
              todayByProduct.map((r) => (
                <tr key={r.product_id} className="border-b">
                  <td className="px-4 py-3">{productNameById[r.product_id]}</td>
                  <td className="px-4 py-3 text-right">
                    {r.boughtKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.soldKg.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      r.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {r.profit.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
