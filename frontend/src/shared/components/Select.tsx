import { forwardRef, type SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options?: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id, children, options, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <label className="block text-left" htmlFor={selectId}>
        {label ? (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        ) : null}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`h-10 w-full rounded-lg border border-slate-200/80 bg-white px-3.5 pr-10 text-sm outline-none transition-all duration-200 appearance-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10 focus:shadow-xs ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error ? <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span> : null}
      </label>
    );
  },
);

Select.displayName = 'Select';
