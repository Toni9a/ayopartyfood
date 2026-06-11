"use client";

import { useState, useEffect, useCallback } from "react";
import { Order, MenuItem, OrderStatus } from "@/lib/types";

const STATUS_META: Record<OrderStatus, { label: string; dot: string; action: string }> = {
  queued:    { label: "Queued",    dot: "bg-yellow-400", action: "Start preparing" },
  preparing: { label: "Preparing", dot: "bg-blue-400",   action: "Mark ready"      },
  ready:     { label: "Ready",     dot: "bg-green-400",  action: ""                },
};

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  queued: "preparing",
  preparing: "ready",
  ready: null,
};

type Tab = "orders" | "completed" | "groups" | "reset";

function waitingLabel(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min";
  return `${mins} mins`;
}

function waitingColor(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins >= 15) return "text-red-500";
  if (mins >= 8)  return "text-orange-500";
  return "text-gray-400";
}

export default function KitchenDashboard() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [menu, setMenu]           = useState<MenuItem[]>([]);
  const [tab, setTab]             = useState<Tab>("orders");
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [resetMsg, setResetMsg]   = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [stockOpen, setStockOpen] = useState(false);
  const [pulse, setPulse]         = useState(false);

  const refresh = useCallback(async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    const [oRes, mRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/kitchen/menu"),
    ]);
    setOrders(await oRes.json());
    setMenu(await mRes.json());
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  async function advanceStatus(order: Order) {
    const next = NEXT[order.status];
    if (!next) return;
    await fetch("/api/kitchen/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: next }),
    });
    refresh();
  }

  async function saveStock(name: string) {
    const stock = stockEdits[name];
    if (stock === undefined) return;
    await fetch("/api/kitchen/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stock }),
    });
    setStockEdits((prev) => { const n = { ...prev }; delete n[name]; return n; });
    refresh();
  }

  async function doReset(payload: object) {
    setResetMsg("");
    const res = await fetch("/api/kitchen/device", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setResetMsg(data.count !== undefined ? `Reset ${data.count} orders.` : "Done — they can order again.");
      setSelectedName("");
      refresh();
    } else {
      setResetMsg(data.error);
    }
  }

  const active    = orders.filter((o) => o.status !== "ready");
  const completed = orders.filter((o) => o.status === "ready");
  const guestNames = orders.map((o) => o.guestName);

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-safe">

      {/* ── Live indicator ── */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full transition-all ${pulse ? "bg-green-400 scale-125" : "bg-green-500"}`} />
        <span className="text-xs text-gray-400 font-medium">Live · refreshes every 3s</span>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
        {([
          ["orders",    `Live (${active.length})`],
          ["completed", `Done (${completed.length})`],
          ["groups",    "Groups"],
          ["reset",     "Reset"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Orders + Stock ── */}
      {tab === "orders" && (
        <div className="space-y-4">

          {/* Guest names strip */}
          {guestNames.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Guests ordered ({orders.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {orders.map((o) => (
                  <span key={o.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[o.status].dot}`} />
                    {o.guestName} · T{o.tableNumber}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active orders */}
          {active.length === 0 ? (
            <p className="text-gray-300 text-center py-12 text-sm">No active orders</p>
          ) : (
            <div className="space-y-3">
              {active.map((order) => (
                <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />
              ))}
            </div>
          )}

          {/* Stock section — collapsible */}
          <div className="border-t border-gray-100 pt-4 mt-6">
            <button
              onClick={() => setStockOpen((v) => !v)}
              className="w-full flex items-center justify-between py-1"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Stock levels
              </p>
              <span className="text-gray-400 text-sm">{stockOpen ? "▲ Hide" : "▼ Show"}</span>
            </button>

            {stockOpen && (
              <div className="mt-3 space-y-2">
                {menu.map((item) => {
                  const used = item.initialStock - item.stock;
                  return (
                    <div key={item.name} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {used > 0 && (
                            <span className="text-xs font-bold text-red-400">−{used}</span>
                          )}
                          <span className="text-sm font-bold text-gray-900">{item.stock}</span>
                          <span className="text-xs text-gray-300">/ {item.initialStock}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(item.stock / item.initialStock) * 100}%`,
                            background: item.stock / item.initialStock < 0.25
                              ? "#ef4444"
                              : item.stock / item.initialStock < 0.5
                              ? "#f59e0b"
                              : "#0a3d20",
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <input
                          type="number" min={0}
                          value={stockEdits[item.name] ?? item.stock}
                          onChange={(e) =>
                            setStockEdits((prev) => ({ ...prev, [item.name]: Number(e.target.value) }))
                          }
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0a3d20]"
                          style={{ fontSize: 14 }}
                        />
                        {stockEdits[item.name] !== undefined && (
                          <button onClick={() => saveStock(item.name)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                            style={{ background: "#0a3d20" }}>
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Completed orders ── */}
      {tab === "completed" && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <p className="text-gray-300 text-center py-12 text-sm">No completed orders yet</p>
          ) : (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {completed.length} order{completed.length !== 1 ? "s" : ""} ready
              </p>
              {completed.map((order) => (
                <div key={order.id}
                  className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{order.guestName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Table {order.tableNumber}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Ready
                    </span>
                  </div>
                  <ul className="space-y-1 mt-2">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                        <span>
                          {item.name}
                          {item.addon   ? ` + ${item.addon}`   : ""}
                          {item.protein ? ` + ${item.protein}` : ""}
                          {item.plantain ? " + Plantain"        : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-300 mt-3">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Groups ── */}
      {tab === "groups" && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Bulk view — all active + completed orders
          </p>
          {(() => {
            // Aggregate all orders by main dish
            const groups: Record<string, { count: number; addons: Record<string, number>; plantainCount: number }> = {};
            for (const o of orders) {
              for (const item of o.items) {
                if (!groups[item.name]) groups[item.name] = { count: 0, addons: {}, plantainCount: 0 };
                groups[item.name].count++;
                const addonKey = [item.addon, item.protein].filter(Boolean).join(" + ");
                if (addonKey) groups[item.name].addons[addonKey] = (groups[item.name].addons[addonKey] ?? 0) + 1;
                if (item.plantain) groups[item.name].plantainCount++;
              }
            }
            const entries = Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
            if (entries.length === 0) return <p className="text-gray-300 text-center py-12 text-sm">No orders yet</p>;
            return entries.map(([dish, data]) => (
              <div key={dish} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">{dish}</p>
                  <span className="text-2xl font-black text-[#0a3d20]">×{data.count}</span>
                </div>
                {Object.entries(data.addons).map(([addon, n]) => (
                  <p key={addon} className="text-sm text-gray-500 flex justify-between">
                    <span>{addon}</span><span className="font-semibold">×{n}</span>
                  </p>
                ))}
                {data.plantainCount > 0 && (
                  <p className="text-sm text-gray-500 flex justify-between">
                    <span>With plantain</span><span className="font-semibold">×{data.plantainCount}</span>
                  </p>
                )}
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Reset ── */}
      {tab === "reset" && (
        <div className="space-y-4">
          {/* Reset by name */}
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-5 space-y-3 shadow-sm">
            <div>
              <p className="font-bold text-gray-900 text-sm">Reset by name</p>
              <p className="text-xs text-gray-400 mt-0.5">Let a specific guest order again</p>
            </div>
            {guestNames.length === 0 ? (
              <p className="text-xs text-gray-300 italic">No orders yet</p>
            ) : (
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0a3d20]"
                style={{ fontSize: 15 }}
              >
                <option value="">Select a guest…</option>
                {guestNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => selectedName && doReset({ action: "name", guestName: selectedName })}
              disabled={!selectedName}
              className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#0a3d20", minHeight: 48 }}>
              Reset {selectedName || "guest"}
            </button>
          </div>

          {/* Reset all */}
          <div className="bg-white border border-red-50 rounded-2xl px-4 py-5 space-y-3 shadow-sm">
            <div>
              <p className="font-bold text-gray-900 text-sm">Reset all orders</p>
              <p className="text-xs text-gray-400 mt-0.5">Clears everyone — use for testing</p>
            </div>
            <button
              onClick={() => doReset({ action: "all" })}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98]"
              style={{ minHeight: 48 }}>
              Reset all {orders.length > 0 ? `(${orders.length})` : ""}
            </button>
          </div>

          {resetMsg && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600 font-medium">{resetMsg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: (o: Order) => void }) {
  const meta = STATUS_META[order.status];
  const next = NEXT[order.status];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-900 text-base">{order.guestName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Table {order.tableNumber}</p>
          <p className={`text-xs font-semibold mt-0.5 ${waitingColor(order.createdAt)}`}>
            Waiting: {waitingLabel(order.createdAt)}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <ul className="space-y-1">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
            <span>
              {item.name}
              {item.addon   ? ` + ${item.addon}`   : ""}
              {item.protein ? ` + ${item.protein}` : ""}
              {item.plantain ? " + Plantain"        : ""}
            </span>
          </li>
        ))}
      </ul>

      {next && (
        <button
          onClick={() => onAdvance(order)}
          className="w-full text-center text-sm font-bold py-3 rounded-xl border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all"
          style={{ minHeight: 48 }}>
          {meta.action}
        </button>
      )}
    </div>
  );
}
