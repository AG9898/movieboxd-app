import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "icon" | "unstyled";
type ButtonSize = "sm" | "md" | "lg" | "none";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]/60 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--app-primary)] text-white shadow-lg shadow-blue-900/30 hover:bg-[var(--app-primary-hover)]",
  secondary: "bg-white/10 text-white hover:bg-white/20",
  outline:
    "border border-[var(--app-border-strong)] text-slate-300 hover:border-[var(--app-primary)] hover:text-white",
  ghost: "text-slate-300 hover:text-white hover:bg-[var(--app-border)]",
  icon: "rounded-full text-slate-300 hover:bg-[var(--app-border)] hover:text-white",
  unstyled: "",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-[var(--app-button-h-sm)] px-[var(--app-button-px-sm)] text-[var(--app-font-size-xs)]",
  md: "h-[var(--app-button-h-md)] px-[var(--app-button-px-md)] text-[var(--app-font-size-sm)]",
  lg: "h-[var(--app-button-h-lg)] px-[var(--app-button-px-lg)] text-[var(--app-font-size-base)]",
  none: "",
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClass = variant === "icon" ? "h-9 w-9 p-0" : sizeClasses[size];
  return (
    <button
      type={type}
      className={cn(baseClasses, variantClasses[variant], sizeClass, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: ButtonLinkProps) {
  const sizeClass = variant === "icon" ? "h-9 w-9 p-0" : sizeClasses[size];
  return (
    <Link
      href={href}
      className={cn(baseClasses, variantClasses[variant], sizeClass, className)}
      {...props}
    />
  );
}
