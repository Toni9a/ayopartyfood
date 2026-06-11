import KitchenDashboard from "@/components/KitchenDashboard";

export const dynamic = "force-dynamic";

export default function KitchenPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gray-800 text-white px-4 py-5">
        <h1 className="text-xl font-bold">Kitchen Dashboard</h1>
        <p className="text-sm text-gray-400">Pastor Joseph &amp; Olukemi Oluniyi — 60th Birthday</p>
      </div>
      <KitchenDashboard />
    </main>
  );
}
