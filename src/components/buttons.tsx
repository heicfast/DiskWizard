/**
 * Button primitives — the ink (gradient CTA), outline, and ghost
 * families used across the app. Press feedback is a subtle scale (the
 * `--press-scale` token) + ink glow on the primary.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "ink" | "outline" | "ghost" | "danger-ink";

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  compact?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Btn({
  variant = "outline",
  compact = false,
  leading,
  trailing,
  className = "",
  children,
  ...rest
}: BtnProps) {
  const v = variant === "ink" ? " dw-btn--ink" : variant === "danger-ink" ? " dw-btn--danger-ink" : variant === "ghost" ? " dw-btn--ghost" : "";
  return (
    <button
      type="button"
      className={`dw-btn${v}${compact ? " dw-btn--compact" : ""} ${className}`}
      {...rest}
    >
      {leading}
      {children != null ? <span className="dw-btn__label">{children}</span> : null}
      {trailing}
    </button>
  );
}

/** Icon-only button (toolbar glyphs). */
export function IconBtn({
  title,
  active = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`dw-iconbtn${active ? " is-active" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
