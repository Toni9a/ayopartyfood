"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/lib/types";
import { PROTEINS, SOUPS } from "@/lib/menu";

type Step = "info" | "meal" | "addon" | "confirm" | "done";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("lf_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lf_device_id", id);
  }
  return id;
}

function hasOrdered(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("lf_ordered") === "true";
}

function markOrdered() {
  localStorage.setItem("lf_ordered", "true");
}

export default function GuestOrderingApp({
  initialTable,
}: {
  initialTable?: number;
}) {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [table, setTable] = useState<number | "">(initialTable ?? "");
  const [mains, setMains] = useState<MenuItem[]>([]);
  const [selectedMain, setSelectedMain] = useState<MenuItem | null>(null);
  const [addon, setAddon] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);

  useEffect(() => {
    if (hasOrdered()) setAlreadyOrdered(true);
    fetch("/api/state")
      .then((r) => r.json())
      .then((data) => {
        const mainItems = (data.menu as MenuItem[]).filter(
          (m) => m.category === "main" && m.stock > 0
        );
        setMains(mainItems);
      });
  }, []);

  async function submit() {
    setSubmitting(true);
    setError("");
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
      if (res.status === 409) {
        markOrdered();
        setAlreadyOrdered(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }
      markOrdered();
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyOrdered && step !== "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">Order Received!</h2>
        <p className="text-gray-600">Your order has been sent to the kitchen. Enjoy the celebration!</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Step: name + table */}
      {step === "info" && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-amber-900">Enter your details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adaeze"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table number</label>
            <input
              type="number"
              value={table}
              onChange={(e) => setTable(e.target.value ? Number(e.target.value) : "")}
              placeholder="e.g. 5"
              min={1}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            onClick={() => {
              if (!name.trim()) return setError("Please enter your name");
              if (!table) return setError("Please enter your table number");
              setError("");
              setStep("meal");
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl text-base transition"
          >
            Continue
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* Step: choose main */}
      {step === "meal" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-amber-900">Choose your main meal</h2>
          <p className="text-sm text-gray-500">Plantain is included with every order.</p>
          <div className="space-y-3">
            {mains.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setSelectedMain(item);
                  setAddon("");
                  if (item.requiresProtein || item.requiresSoup) {
                    setStep("addon");
                  } else {
                    setStep("confirm");
                  }
                }}
                className="w-full text-left border border-gray-200 rounded-xl px-4 py-4 hover:border-amber-400 hover:bg-amber-50 transition"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                {item.requiresProtein && (
                  <span className="ml-2 text-xs text-gray-400">+ protein</span>
                )}
                {item.requiresSoup && (
                  <span className="ml-2 text-xs text-gray-400">+ soup</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("info")} className="text-sm text-gray-400 underline">
            Back
          </button>
        </div>
      )}

      {/* Step: choose addon (protein or soup) */}
      {step === "addon" && selectedMain && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-amber-900">
            {selectedMain.requiresProtein ? "Choose your protein" : "Choose your soup"}
          </h2>
          <p className="text-sm text-gray-500">With {selectedMain.name}</p>
          <div className="space-y-3">
            {(selectedMain.requiresProtein ? PROTEINS : SOUPS).map((choice) => (
              <button
                key={choice}
                onClick={() => {
                  setAddon(choice);
                  setStep("confirm");
                }}
                className="w-full text-left border border-gray-200 rounded-xl px-4 py-4 hover:border-amber-400 hover:bg-amber-50 transition font-medium text-gray-800"
              >
                {choice}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("meal")} className="text-sm text-gray-400 underline">
            Back
          </button>
        </div>
      )}

      {/* Step: confirm */}
      {step === "confirm" && selectedMain && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-amber-900">Confirm your order</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 space-y-2">
            <p className="text-sm text-gray-500">Guest</p>
            <p className="font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-500 mt-2">Table</p>
            <p className="font-semibold text-gray-800">{table}</p>
            <p className="text-sm text-gray-500 mt-2">Order</p>
            <p className="font-semibold text-gray-800">{selectedMain.name}{addon ? ` + ${addon}` : ""}</p>
            <p className="font-semibold text-gray-800">Plantain</p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-base transition"
          >
            {submitting ? "Sending order…" : "Place order"}
          </button>
          <button onClick={() => setStep("meal")} className="text-sm text-gray-400 underline w-full text-center">
            Change meal
          </button>
        </div>
      )}

      {/* Step: done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-amber-800">Order placed!</h2>
          <p className="text-gray-600">
            Thank you, {name}! Your food is on its way. Enjoy the celebration!
          </p>
        </div>
      )}
    </div>
  );
}
