import GuestOrderingApp from "@/components/GuestOrderingApp";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableNumber: string }>;
}) {
  const { tableNumber } = await params;
  const table = parseInt(tableNumber, 10);

  return (
    <main className="min-h-screen bg-amber-50">
      <div className="bg-amber-700 text-white text-center px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-amber-200 mb-1">In celebration of</p>
        <h1 className="text-2xl font-bold leading-snug">
          Pastor Joseph &amp; Olukemi Oluniyi
        </h1>
        <p className="mt-2 text-amber-100 font-semibold text-lg">60th Birthday Celebration</p>
        <div className="mt-3 w-12 h-0.5 bg-amber-400 mx-auto" />
      </div>
      <div className="py-6">
        <GuestOrderingApp initialTable={isNaN(table) ? undefined : table} />
      </div>
    </main>
  );
}
