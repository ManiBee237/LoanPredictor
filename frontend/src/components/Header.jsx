export default function Header() {
  return (
    <header className="sticky top-0 z-30 mb-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-300" />
          <h1 className="text-lg font-semibold">Loan Default Prediction — UI</h1>
        </div>
        <nav className="text-sm text-slate-300">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="underline decoration-dotted">
            Docs (later)
          </a>
        </nav>
      </div>
    </header>
  );
}
