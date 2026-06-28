// Reusable atomic UI components

export function Badge({ children, variant = "default" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function VegDot({ veg }) {
  return (
    <span className={`veg-dot ${veg ? "veg" : "nonveg"}`} title={veg ? "Vegetarian" : "Non-Vegetarian"}>
      <span />
    </span>
  );
}

export function Button({ children, variant = "primary", onClick, disabled, className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, id, ...props }) {
  return (
    <div className="field">
      {label && <label htmlFor={id} className="field-label">{label}</label>}
      <input id={id} className={`field-input ${error ? "field-error" : ""}`} {...props} />
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  );
}
