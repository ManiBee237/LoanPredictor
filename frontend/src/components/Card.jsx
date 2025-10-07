import React from "react";
export default function Card({ title, children, footer }) {
  return (
    <section className="card">
      {title && <div className="card-title">{title}</div>}
      {children}
      {footer && <div className="help" style={{marginTop: ".5rem"}}>{footer}</div>}
    </section>
  );
}
