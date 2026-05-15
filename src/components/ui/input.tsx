import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-charcoal">{label}</label>}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ash group-focus-within:text-forest transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={cn(
              "w-full h-10 bg-warm-white border border-stone rounded-xl px-4 text-sm font-body text-charcoal placeholder:text-ash/70",
              "focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all",
              "disabled:bg-stone/20 disabled:text-ash disabled:cursor-not-allowed",
              error && "border-error focus:border-error focus:ring-error bg-error/5",
              leftIcon && "pl-11",
              className
            )}
            {...props}
          />
        </div>
        {error && <p id={errorId} className="text-xs text-error ml-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, leftIcon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-charcoal">{label}</label>}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ash group-focus-within:text-forest transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full h-10 bg-warm-white border border-stone rounded-xl px-4 text-sm font-body text-charcoal appearance-none",
              "focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all",
              "disabled:bg-stone/20 disabled:text-ash disabled:cursor-not-allowed",
              error && "border-error focus:border-error focus:ring-error bg-error/5",
              leftIcon && "pl-11",
              className
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ash">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        {error && <p className="text-xs text-error ml-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-charcoal">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-warm-white border border-stone rounded-xl px-4 py-3 text-sm font-body text-charcoal placeholder:text-ash/70 min-h-[80px]",
            "focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all resize-none",
            "disabled:bg-stone/20 disabled:text-ash disabled:cursor-not-allowed",
            error && "border-error focus:border-error focus:ring-error bg-error/5",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error ml-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
