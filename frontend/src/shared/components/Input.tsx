import { forwardRef, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block" htmlFor={inputId}>
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
        <input
          id={inputId}
          ref={ref}
          className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
          {...props}
        />
        {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
