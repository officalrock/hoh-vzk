import "./ui.css";

/**
 * Button oder Link (wenn `href` gesetzt). Varianten: primary | default | ghost.
 * Handschuhtaugliche Mindesthöhe über --touch-min.
 */
export function Button({
  children,
  variant = "default",
  size,
  href,
  onClick,
  type = "button",
  className = "",
  ...rest
}) {
  const cls = [
    "btn",
    variant === "primary" && "btn--primary",
    variant === "ghost" && "btn--ghost",
    size === "lg" && "btn--lg",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
