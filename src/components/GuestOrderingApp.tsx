"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/lib/types";
import { PROTEINS, SOUPS } from "@/lib/menu";

type Step = "info" | "meal" | "addon" | "confirm" | "done";

const FOOD_EMOJI: Record<string, string> = {
  "Jollof Rice":             "🍚",
  "Fried Rice":              "🍛",
  "Ofada and Ayamase Sauce": "🌶️",
  "Amala / Abula":           "🫕",
  "Pound Yam":               "🍠",
  "Yam Porridge":            "🥘",
  "Beef":                    "🥩",
  "Chicken":                 "🍗",
  "Turkey":                  "🦃",
  "Croaker Fish":            "🐟",
  "Efo Riro":                "🥬",
  "Egusi":                   "🌿",
  "Ewedu and Gbegiri":       "🍵",
};

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("lf_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("lf_device_id", id); }
  return id;
}
function hasOrdered() {
  return typeof window !== "undefined" && localStorage.getItem("lf_ordered") === "true";
}
function markOrdered() { localStorage.setItem("lf_ordered", "true"); }

export default function GuestOrderingApp({ initialTable }: { initialTable?: number }) {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [table, setTable] = useState<number>(initialTable ?? 1);
  const [mains, setMains] = useState<MenuItem[]>([]);
  const [selectedMain, setSelectedMain] = useState<MenuItem | null>(null);
  const [addon, setAddon] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch("/api/state")
      .then((r) => r.json())
      .then((data) => {
        setMains((data.menu as MenuItem[]).filter((m) => m.category === "main" && m.stock > 0));
        if (hasOrdered()) {
          const stillExists = (data.orders as { deviceId: string }[]).some(
            (o) => o.deviceId === deviceId
          );
          if (stillExists) setAlreadyOrdered(true);
          else localStorage.removeItem("lf_ordered");
        }
      });
  }, []);

  async function submit() {
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          guestName: name,
          tableNumber: table,
          mainName: selectedMain!.name,
          addon: addon || undefined,
        }),
      });
      if (res.status === 409) { markOrdered(); setAlreadyOrdered(true); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error || "Something went wrong"); return; }
      markOrdered(); setStep("done");
    } finally { setSubmitting(false); }
  }

  if (alreadyOrdered && step !== "done") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="text-6xl mb-5">🍽️</div>
        <h2 className="text-2xl font-bold text-[#0a3d20] mb-2"
          style={{ fontFamily: "var(--font-playfair)" }}>
          Order received!
        </h2>
        <p className="text-gray-400 text-base leading-relaxed">
          Your food is on its way.<br />Enjoy the celebration!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">

      {/* ── Info ── */}
      {step === "info" && (
        <div className="px-5 pt-8 pb-safe space-y-8">
          <div>
            <h2 className="text-[1.6rem] font-bold text-gray-900 leading-tight">What's your name?</h2>
            <p className="text-sm text-gray-400 mt-1">We'll put this on your order</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[#0a3d20] uppercase tracking-[0.2em] mb-2">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adaeze"
                autoComplete="given-name"
                className="w-full bg-white border-2 border-gray-100 focus:border-[#0a3d20] rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-300 outline-none transition-colors"
                style={{ fontSize: 18 }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0a3d20] uppercase tracking-[0.2em] mb-4">
                Table number
              </label>
              <div className="flex items-center gap-5">
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-md select-none"
                  style={{
                    background: "linear-gradient(135deg, #0a3d20, #0f5530)",
                    fontSize: 26,
                  }}
                >
                  {table}
                </div>
                <input
                  type="range" min={1} max={10} value={table}
                  onChange={(e) => setTable(Number(e.target.value))}
                  className="flex-1 slider"
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-300 mt-2 px-0.5 font-semibold select-none">
                {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={() => {
              if (!name.trim()) return setError("Please enter your name");
              setError(""); setStep("meal");
            }}
            className="w-full text-white font-bold rounded-2xl transition-all active:scale-[0.97] shadow-lg"
            style={{
              background: "linear-gradient(135deg, #0a3d20 0%, #155d36 100%)",
              padding: "18px 0",
              fontSize: 17,
              minHeight: 56,
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Meal ── */}
      {step === "meal" && (
        <div className="px-5 pt-8 pb-safe">
          <button onClick={() => setStep("info")}
            className="flex items-center gap-1 text-xs text-gray-400 mb-5 font-semibold py-2 -ml-1">
            ← Back
          </button>

          <h2 className="text-[1.6rem] font-bold text-gray-900 leading-tight mb-1">Choose your meal</h2>
          <p className="text-sm text-gray-400 mb-6">Plantain is included with every order 🌴</p>

          <div className="space-y-3 pb-8">
            {mains.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setSelectedMain(item); setAddon("");
                  setStep(item.requiresProtein || item.requiresSoup ? "addon" : "confirm");
                }}
                className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-4 transition-all group shadow-sm"
                style={{ minHeight: 72 }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl leading-none">{FOOD_EMOJI[item.name] ?? "🍽️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base leading-snug">{item.name}</p>
                    {item.requiresProtein && (
                      <p className="text-xs text-gray-400 mt-0.5">Choose a protein →</p>
                    )}
                    {item.requiresSoup && (
                      <p className="text-xs text-gray-400 mt-0.5">Choose a soup →</p>
                    )}
                  </div>
                  <span className="text-xl text-gray-200 group-hover:text-[#0a3d20] transition-colors">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Addon ── */}
      {step === "addon" && selectedMain && (
        <div className="px-5 pt-8 pb-safe">
          <button onClick={() => setStep("meal")}
            className="flex items-center gap-1 text-xs text-gray-400 mb-5 font-semibold py-2 -ml-1">
            ← Back
          </button>

          <h2 className="text-[1.6rem] font-bold text-gray-900 leading-tight mb-1">
            {selectedMain.requiresProtein ? "Pick your protein" : "Pick your soup"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">Goes with your {selectedMain.name}</p>

          <div className="space-y-3 pb-8">
            {(selectedMain.requiresProtein ? PROTEINS : SOUPS).map((choice) => (
              <button
                key={choice}
                onClick={() => { setAddon(choice); setStep("confirm"); }}
                className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-4 transition-all group shadow-sm"
                style={{ minHeight: 72 }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl leading-none">{FOOD_EMOJI[choice] ?? "🍽️"}</span>
                  <span className="font-bold text-gray-900 text-base flex-1">{choice}</span>
                  <span className="text-xl text-gray-200 group-hover:text-[#0a3d20] transition-colors">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm ── */}
      {step === "confirm" && selectedMain && (
        <div className="px-5 pt-8 pb-safe space-y-6">
          <button
            onClick={() => setStep(selectedMain.requiresProtein || selectedMain.requiresSoup ? "addon" : "meal")}
            className="flex items-center gap-1 text-xs text-gray-400 font-semibold py-2 -ml-1">
            ← Back
          </button>

          <div>
            <h2 className="text-[1.6rem] font-bold text-gray-900 leading-tight">Confirm order</h2>
            <p className="text-sm text-gray-400 mt-1">Check the details then place your order</p>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-5 py-5" style={{ background: "linear-gradient(135deg, #0a3d20, #0f5530)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c] mb-1">Guest</p>
              <p className="text-white font-bold text-xl">{name}</p>
              <p className="text-green-300 text-sm mt-0.5">Table {table}</p>
            </div>
            <div className="bg-white px-5 py-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Your order</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{FOOD_EMOJI[selectedMain.name] ?? "🍽️"}</span>
                <div>
                  <p className="font-bold text-gray-900">{selectedMain.name}</p>
                  {addon && <p className="text-sm text-gray-500">with {addon}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌴</span>
                <p className="font-bold text-gray-900">Plantain</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full text-white font-bold rounded-2xl transition-all active:scale-[0.97] shadow-lg disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #0a3d20 0%, #155d36 100%)",
              padding: "18px 0",
              fontSize: 17,
              minHeight: 56,
            }}
          >
            {submitting ? "Sending order…" : "Place order 🎉"}
          </button>

          <button onClick={() => setStep("meal")}
            className="w-full text-center text-sm text-gray-400 underline py-2">
            Change meal
          </button>
        </div>
      )}

      {/* ── Done ── */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center space-y-4">
          <div className="text-6xl mb-2">🎉</div>
          <h2
            className="text-3xl font-black text-[#0a3d20] leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Order placed!
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Thank you, <strong className="text-gray-800">{name}</strong>!<br />
            Your food is heading to table <strong className="text-gray-800">{table}</strong>.<br />
            Enjoy the celebration!
          </p>
          <div className="flex justify-center gap-3 pt-2 text-3xl">
            <span>🍚</span><span>🍗</span><span>🌴</span>
          </div>
        </div>
      )}
    </div>
  );
}
