export default function Card({ title, children, footer }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      {title && <div className="mb-2 text-sm text-slate-300">{title}</div>}
      <div>{children}</div>
      {footer && <div className="mt-3 text-xs text-slate-400">{footer}</div>}
    </div>
  );
}
