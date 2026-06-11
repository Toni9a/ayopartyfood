import GuestOrderingApp from "@/components/GuestOrderingApp";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Hero ── */}
      <div
        className="hero-pattern relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0a3d20 0%, #0f5530 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }} />

        <div className="relative z-10 text-center px-6 py-12">
          {/* Top rule */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-[#c9a84c] opacity-60" />
            <span style={{ color: "#c9a84c" }} className="text-base">✦</span>
            <div className="h-px w-10 bg-[#c9a84c] opacity-60" />
          </div>

          <p
            className="text-xs uppercase tracking-[0.3em] font-semibold mb-4"
            style={{ color: "#e8c96a" }}
          >
            In celebration of
          </p>

          <h1
            className="text-white leading-tight"
            style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 6vw, 2.8rem)", fontWeight: 900 }}
          >
            Pastor Joseph<br />
            <span style={{ color: "#e8c96a" }}>&amp;</span> Olukemi Oluniyi
          </h1>

          <p
            className="mt-3 font-semibold text-lg tracking-wide"
            style={{ color: "#c9a84c", fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
          >
            60th Birthday Celebration
          </p>

          {/* Bottom rule */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px w-10 bg-[#c9a84c] opacity-60" />
            <span style={{ color: "#c9a84c" }} className="text-base">✦</span>
            <div className="h-px w-10 bg-[#c9a84c] opacity-60" />
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="relative h-8 -mb-1">
          <svg viewBox="0 0 375 32" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path d="M0,0 Q187.5,32 375,0 L375,32 L0,32 Z" fill="#fdf8ef" />
          </svg>
        </div>
      </div>

      {/* ── Order form ── */}
      <div className="flex-1 px-0">
        <GuestOrderingApp />
      </div>
    </main>
  );
}
