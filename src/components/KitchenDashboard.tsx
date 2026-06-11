"use client";

import { useState, useEffect, useCallback } from "react";
import { Order, MenuItem, OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  queued: "Queued",
  preparing: "Preparing",
  ready: "Ready",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  queued: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  queued: "preparing",
  preparing: "ready",
  ready: null,
};

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tab, setTab] = useState<"orders" | "stock">("orders");
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [resetInput, setResetInput] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  const refresh = useCallback(async () => {
    const [oRes, mRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/kitchen/menu"),
    ]);
    setOrders(await oRes.json());
    setMenu(await mRes.json());
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
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
    setStockEdits((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    refresh();
  }

  async function resetDevice() {
    if (!resetInput.trim()) return;
    setResetMsg("");
    const res = await fetch("/api/kitchen/device", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: resetInput.trim() }),
    });
    const data = await res.json();
    setResetMsg(res.ok ? "Device reset. They can order again." : data.error);
    if (res.ok) setResetInput("");
  }

  const active = orders.filter((o) => o.status !== "ready");
  const done = orders.filter((o) => o.status === "ready");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTab("orders")}
          className={`font-semibold text-sm px-3 py-1.5 rounded-lg transition ${tab === "orders" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-800"}`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab("stock")}
          className={`font-semibold text-sm px-3 py-1.5 rounded-lg transition ${tab === "stock" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-800"}`}
        >
          Stock & Reset
        </button>
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {active.length === 0 && done.length === 0 && (
            <p className="text-gray-400 text-center py-12">No orders yet.</p>
          )}
          {active.map((order) => (
            <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />
          ))}
          {done.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-6">Ready</h3>
              {done.map((order) => (
                <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />
              ))}
            </>
          )}
        </div>
      )}

      {tab === "stock" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Adjust stock</h3>
            {menu.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                <input
                  type="number"
                  min={0}
                  value={stockEdits[item.name] ?? item.stock}
                  onChange={(e) =>
                    setStockEdits((prev) => ({ ...prev, [item.name]: Number(e.target.value) }))
                  }
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center"
                />
                {stockEdits[item.name] !== undefined && (
                  <button
                    onClick={() => saveStock(item.name)}
                    className="text-xs bg-amber-600 text-white px-2 py-1 rounded-lg"
                  >
                    Save
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Reset device</h3>
            <p className="text-xs text-gray-400">
              Enter a device ID to remove their order so they can order again.
            </p>
            <input
              type="text"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder="Device ID (UUID)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={resetDevice}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Reset device
            </button>
            {resetMsg && <p className="text-sm text-gray-600">{resetMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (o: Order) => void;
}) {
  const next = NEXT_STATUS[order.status];
  return (
    <div className={`border rounded-xl px-4 py-4 space-y-2 ${STATUS_COLORS[order.status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{order.guestName}</p>
          <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full border bg-white/60">
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <ul className="text-sm text-gray-700 space-y-0.5">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.name}
            {item.addon && ` + ${item.addon}`}
          </li>
        ))}
      </ul>
      {next && (
        <button
          onClick={() => onAdvance(order)}
          className="mt-1 text-xs font-semibold bg-white/70 hover:bg-white border border-current px-3 py-1.5 rounded-lg transition"
        >
          Mark as {STATUS_LABELS[next]}
        </button>
      )}
    </div>
  );
}
