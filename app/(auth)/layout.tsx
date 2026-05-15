export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <h1 className="text-display-sm font-semibold tracking-tight">VenturePath</h1>
          <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
            Sharia-compliant cap table for KSA founders.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
