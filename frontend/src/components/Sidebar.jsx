import { NavLink } from "react-router-dom";

const link =
  "block px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition";
export default function Sidebar() {
  return (
    <div className="border border-slate-800 rounded-2xl p-3 sticky top-20">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Menu</div>
      <nav className="space-y-1">
        <NavLink to="/" className={link}>Dashboard</NavLink>
        <NavLink to="/dataset" className={link}>Dataset</NavLink>
        <NavLink to="/predict" className={link}>Predict</NavLink>
        <NavLink to="/about" className={link}>About</NavLink>
      </nav>
    </div>
  );
}
