"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/lib/types";
import { PROTEINS_RICE, PROTEINS_SWALLOW, SOUPS } from "@/lib/menu";

type Step = "info" | "meal" | "soup" | "protein_req" | "protein_opt" | "plantain" | "confirm" | "done";

const FOOD_PHOTO: Record<string, string> = {
  "Jollof Rice":             "/food/jollof-rice.jpg",
  "Fried Rice":              "/food/fried-rice.jpg",
  "Ofada and Ayamase Sauce": "/food/ofada.jpg",
  "Amala / Abula":           "/food/amala.jpg",
  "Pound Yam":               "/food/pounded-yam.jpg",
  "Yam Porridge":            "/food/yam-porridge.jpg",
  "Mixed protein (Beef, shaki, ponmo, Inu eran)": "/food/mixed-protein.jpg",
  "Chicken":                 "/food/chicken.jpg",
  "Turkey":                  "/food/turkey.jpg",
  "Croaker Fish":            "/food/croaker-fish.jpg",
  "Hake Fish":               "/food/hake-fish.jpg",
  "Plantain":                "/food/plantain.jpg",
  "Efo Riro":                "/food/efo-riro.jpg",
  "Egusi":                   "/food/egusi.jpg",
  "Ewedu and Gbegiri":       "/food/ewedu-gbegiri.jpg",
};

const FOOD_EMOJI: Record<string, string> = {};

function FoodIcon({ name, size = "text-3xl" }: { name: string; size?: string }) {
  const photo = FOOD_PHOTO[name];
  if (photo) {
    const px = size === "text-2xl" ? 44 : 56;
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: px, height: px }}
      />
    );
  }
  return <span className={`${size} leading-none`}>{FOOD_EMOJI[name] ?? "🍽️"}</span>;
}

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

// Build the ordered step queue after a main is picked
function buildQueue(item: MenuItem): Step[] {
  const q: Step[] = [];
  if (item.requiresSoup)     q.push("soup");
  if (item.requiresProtein)  q.push("protein_req");
  if (item.optionalProtein)  q.push("protein_opt");
  if (item.optionalPlantain) q.push("plantain");
  q.push("confirm");
  return q;
}

export default function GuestOrderingApp({ initialTable }: { initialTable?: number }) {
  const [step, setStep]     = useState<Step>("info");
  const [queue, setQueue]   = useState<Step[]>([]);
  const [name, setName]     = useState("");
  const [table, setTable]   = useState(initialTable ?? 1);
  const [mains, setMains]   = useState<MenuItem[]>([]);
  const [main, setMain]     = useState<MenuItem | null>(null);
  const [soup, setSoup]     = useState("");
  const [protein, setProtein] = useState("");
  const [plantain, setPlantain] = useState(false);
  const [error, setError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch("/api/state").then(r => r.json()).then(data => {
      setMains((data.menu as MenuItem[]).filter(m => m.category === "main"));
      if (hasOrdered()) {
        const exists = (data.orders as { deviceId: string }[]).some(o => o.deviceId === deviceId);
        if (exists) setAlreadyOrdered(true);
        else localStorage.removeItem("lf_ordered");
      }
    });
  }, []);

  function pickMain(item: MenuItem) {
    setMain(item); setSoup(""); setProtein(""); setPlantain(false);
    const q = buildQueue(item);
    setQueue(q);
    setStep(q[0]);
  }

  function advance(from: Step) {
    const idx = queue.indexOf(from);
    setStep(queue[idx + 1] ?? "confirm");
  }

  function goBack(from: Step) {
    if (from === "meal") { setStep("info"); return; }
    const idx = queue.indexOf(from);
    if (idx <= 0) setStep("meal");
    else setStep(queue[idx - 1]);
  }

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
          mainName: main!.name,
          addon: soup || protein || undefined,
          protein: main!.optionalProtein ? (protein || undefined) : undefined,
          plantain,
        }),
      });
      if (res.status === 409) { markOrdered(); setAlreadyOrdered(true); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error || "Something went wrong"); return; }
      markOrdered(); setStep("done");
    } finally { setSubmitting(false); }
  }

  const BackBtn = ({ from }: { from: Step }) => (
    <button onClick={() => goBack(from)}
      className="flex items-center gap-1 text-xs text-gray-400 font-semibold py-2 -ml-1 mb-5">
      ← Back
    </button>
  );

  const ChoiceList = ({
    choices, onPick, skipLabel,
  }: { choices: string[]; onPick: (c: string) => void; skipLabel?: string }) => (
    <div className="space-y-3 pb-8">
      {choices.map(c => (
        <button key={c} onClick={() => onPick(c)}
          className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-4 transition-all group shadow-sm"
          style={{ minHeight: 72 }}>
          <div className="flex items-center gap-4">
            <FoodIcon name={c} />
            <span className="font-bold text-gray-900 text-base flex-1">{c}</span>
            <span className="text-xl text-gray-200 group-hover:text-[#0a3d20] transition-colors">›</span>
          </div>
        </button>
      ))}
      {skipLabel && (
        <button onClick={() => onPick("")}
          className="w-full text-center text-sm text-gray-400 underline py-3">
          {skipLabel}
        </button>
      )}
    </div>
  );

  if (alreadyOrdered && step !== "done") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="text-6xl mb-5">🍽️</div>
        <h2 className="text-2xl font-bold text-[#0a3d20] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Order received!
        </h2>
        <p className="text-gray-400 text-base leading-relaxed">Your food is on its way.<br />Enjoy the celebration!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">

      {/* ── Info ── */}
      {step === "info" && (
        <div className="px-5 pt-8 pb-safe space-y-5">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-6 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c9a84c] mb-1">Food Menu</p>
              <h2 className="text-4xl font-black text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                Table {table}
              </h2>
              <p className="text-sm text-gray-400 mt-2">Please choose your name and table number</p>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Guest name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aisha"
                autoComplete="given-name"
                className="w-full bg-[#fdf8ef] border-2 border-[#e8c96a]/50 focus:border-[#c9a84c] rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-300 outline-none transition-colors"
                style={{ fontSize: 18 }}
              />
            </div>

            {/* Table picker */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Table number</label>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setTable(t => Math.max(1, t - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-[#0a3d20] hover:text-[#0a3d20] active:scale-95 transition-all flex-shrink-0">
                  −
                </button>
                <div className="flex-1 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center font-bold text-gray-900">
                  Table {table}
                </div>
                <button onClick={() => setTable(t => Math.min(10, t + 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-[#0a3d20] hover:text-[#0a3d20] active:scale-95 transition-all flex-shrink-0">
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setTable(n)}
                    className="w-11 h-11 rounded-full font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                    style={table === n
                      ? { background: "#0a3d20", color: "#fff" }
                      : { background: "#fdf8ef", color: "#374151", border: "2px solid #e5e7eb" }
                    }>
                    {n}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>}

          <button
            onClick={() => { if (!name.trim()) return setError("Please enter your name"); setError(""); setStep("meal"); }}
            className="w-full text-white font-bold rounded-2xl transition-all active:scale-[0.97] shadow-lg"
            style={{ background: "linear-gradient(135deg, #0a3d20 0%, #155d36 100%)", padding: "18px 0", fontSize: 17, minHeight: 56 }}>
            Choose your meal →
          </button>
        </div>
      )}

      {/* ── Meal list ── */}
      {step === "meal" && (
        <div className="px-5 pt-8 pb-safe">
          <BackBtn from="meal" />
          <h2 className="text-[1.6rem] font-bold text-gray-900 leading-tight mb-1">Choose your meal</h2>
          <p className="text-sm text-gray-400 mb-6">What are you having today?</p>
          <div className="space-y-3 pb-8">
            {mains.map(item => {
              const soldOut = item.stock <= 0;
              return soldOut ? (
                <div key={item.name}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 opacity-60"
                  style={{ minHeight: 72 }}>
                  <div className="flex items-center gap-4">
                    <FoodIcon name={item.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-400 text-base line-through">{item.name}</p>
                      <p className="text-xs text-red-400 mt-0.5">Sorry, out of stock — speak to a server</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button key={item.name} onClick={() => pickMain(item)}
                  className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-4 transition-all group shadow-sm"
                  style={{ minHeight: 72 }}>
                  <div className="flex items-center gap-4">
                    <FoodIcon name={item.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base leading-snug">{item.name}</p>
                      {item.requiresProtein && <p className="text-xs text-gray-400 mt-0.5">Choose a protein →</p>}
                      {item.requiresSoup && item.optionalProtein && <p className="text-xs text-gray-400 mt-0.5">Choose a soup + optional protein →</p>}
                      {item.requiresSoup && !item.optionalProtein && <p className="text-xs text-gray-400 mt-0.5">Choose a soup →</p>}
                      {item.optionalPlantain && <p className="text-xs text-gray-400 mt-0.5">Optional plantain →</p>}
                    </div>
                    <span className="text-xl text-gray-200 group-hover:text-[#0a3d20] transition-colors">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Soup (required) ── */}
      {step === "soup" && main && (
        <div className="px-5 pt-8 pb-safe">
          <BackBtn from="soup" />
          <h2 className="text-[1.6rem] font-bold text-gray-900 mb-1">Pick your soup</h2>
          <p className="text-sm text-gray-400 mb-6">Goes with your {main.name}</p>
          <ChoiceList choices={SOUPS} onPick={s => { setSoup(s); advance("soup"); }} />
        </div>
      )}

      {/* ── Protein (required for rice) ── */}
      {step === "protein_req" && main && (
        <div className="px-5 pt-8 pb-safe">
          <BackBtn from="protein_req" />
          <h2 className="text-[1.6rem] font-bold text-gray-900 mb-1">Pick your protein</h2>
          <p className="text-sm text-gray-400 mb-6">Goes with your {main.name}</p>
          <ChoiceList choices={PROTEINS_RICE} onPick={p => { setProtein(p); advance("protein_req"); }} />
        </div>
      )}

      {/* ── Protein (optional for amala / pounded yam) ── */}
      {step === "protein_opt" && main && (
        <div className="px-5 pt-8 pb-safe">
          <BackBtn from="protein_opt" />
          <h2 className="text-[1.6rem] font-bold text-gray-900 mb-1">Add a protein?</h2>
          <p className="text-sm text-gray-400 mb-6">Optional — skip if you don't want one</p>
          <ChoiceList
            choices={PROTEINS_SWALLOW}
            onPick={p => { setProtein(p); advance("protein_opt"); }}
            skipLabel="No protein, thanks"
          />
        </div>
      )}

      {/* ── Plantain (optional for rice) ── */}
      {step === "plantain" && main && (
        <div className="px-5 pt-8 pb-safe">
          <BackBtn from="plantain" />
          <h2 className="text-[1.6rem] font-bold text-gray-900 mb-1">Add plantain?</h2>
          <p className="text-sm text-gray-400 mb-6">Optional side with your {main.name}</p>
          <div className="space-y-3 pb-8">
            <button onClick={() => { setPlantain(true); advance("plantain"); }}
              className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-5 font-bold text-gray-900 transition-all shadow-sm flex items-center gap-4"
              style={{ minHeight: 64 }}>
              <FoodIcon name="Plantain" />
              <span>Yes, add plantain</span>
            </button>
            <button onClick={() => { setPlantain(false); advance("plantain"); }}
              className="w-full text-left bg-white border-2 border-gray-100 hover:border-[#0a3d20] active:scale-[0.98] rounded-2xl px-5 py-5 font-bold text-gray-900 transition-all shadow-sm"
              style={{ minHeight: 64 }}>
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm ── */}
      {step === "confirm" && main && (
        <div className="px-5 pt-8 pb-safe space-y-6">
          <div>
            <button onClick={() => { const idx = queue.indexOf("confirm"); setStep(queue[idx - 1] ?? "meal"); }}
              className="flex items-center gap-1 text-xs text-gray-400 font-semibold py-2 -ml-1 mb-1">
              ← Back
            </button>
            <h2 className="text-[1.6rem] font-bold text-gray-900">Confirm order</h2>
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
              <div className="flex items-start gap-3">
                <FoodIcon name={main.name} size="text-2xl" />
                <div>
                  <p className="font-bold text-gray-900">{main.name}</p>
                  {soup    && <p className="text-sm text-gray-500">Soup: {soup}</p>}
                  {protein && <p className="text-sm text-gray-500">Protein: {protein}</p>}
                  {main.optionalPlantain && (
                    <p className="text-sm text-gray-500">{plantain ? "With plantain" : "No plantain"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>}

          <button onClick={submit} disabled={submitting}
            className="w-full text-white font-bold rounded-2xl transition-all active:scale-[0.97] shadow-lg disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0a3d20 0%, #155d36 100%)", padding: "18px 0", fontSize: 17, minHeight: 56 }}>
            {submitting ? "Sending order…" : "Place order"}
          </button>

          <button onClick={() => setStep("meal")}
            className="w-full text-center text-sm text-gray-400 underline py-2">
            Change meal
          </button>
        </div>
      )}

      {/* ── Done ── */}
      {step === "done" && main && (
        <div className="px-5 pt-10 pb-safe space-y-6">
          <div>
            <h2 className="text-3xl font-black text-[#0a3d20]" style={{ fontFamily: "var(--font-playfair)" }}>
              Order placed
            </h2>
            <p className="text-gray-400 text-sm mt-1">Your order is with the kitchen</p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="px-5 py-5" style={{ background: "linear-gradient(135deg, #0a3d20, #0f5530)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c] mb-1">Guest</p>
              <p className="text-white font-bold text-xl">{name}</p>
              <p className="text-green-300 text-sm mt-0.5">Table {table}</p>
            </div>
            <div className="bg-white px-5 py-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Your order</p>
              <div className="flex items-start gap-3">
                <FoodIcon name={main.name} size="text-2xl" />
                <div>
                  <p className="font-bold text-gray-900">{main.name}</p>
                  {soup    && <p className="text-sm text-gray-500">Soup: {soup}</p>}
                  {protein && <p className="text-sm text-gray-500">Protein: {protein}</p>}
                  {main.optionalPlantain && (
                    <p className="text-sm text-gray-500">{plantain ? "Plantain: yes" : "Plantain: no"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center">Enjoy the celebration!</p>
        </div>
      )}
    </div>
  );
}
