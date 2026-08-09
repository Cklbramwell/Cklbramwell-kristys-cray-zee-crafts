export function BuilderSection({ title, subtitle, children }) {
  return (
    <section className="builder-section">
      <div className="builder-section-heading">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="form">{children}</div>
    </section>
  );
}

export function Field({ label, full = false, children, hint }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export function Check({ checked, onChange, label, hint }) {
  return (
    <label className="check-card">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function PriceRow({ label, value, strong = false }) {
  return (
    <div className={`row space price-row ${strong ? "price-row-strong" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function TemplateChooser({ templates, value, onChange }) {
  return (
    <div className="template-grid full">
      {templates.map((template) => (
        <button
          type="button"
          key={template.id}
          className={`template-card ${value?.id === template.id ? "active" : ""}`}
          onClick={() => onChange(template)}
        >
          <span>{template.emoji}</span>
          <b>{template.label}</b>
        </button>
      ))}
    </div>
  );
}
