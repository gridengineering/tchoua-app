"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "indigo" | "terracotta";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      default: "bg-forest text-white hover:bg-forest-dark shadow-sm",
      secondary: "bg-gold text-charcoal hover:bg-gold-light shadow-sm",
      outline: "border border-stone bg-warm-white text-charcoal hover:bg-cream hover:text-forest hover:border-forest/30",
      ghost: "text-graphite hover:bg-stone/50 hover:text-charcoal",
      destructive: "bg-error text-white hover:bg-error/90 shadow-sm",
      success: "bg-success text-white hover:bg-success/90 shadow-sm",
      indigo: "bg-indigo text-white hover:opacity-90 shadow-sm",
      terracotta: "bg-terracotta text-white hover:bg-terracotta-light shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4",
      lg: "h-11 px-6",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant as keyof typeof variants] || variants.default, sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <RefreshCw className="animate-spin w-4 h-4" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
