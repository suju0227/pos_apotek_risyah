import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md';
};

export function Button({
  className = '',
  variant = 'primary',
  fullWidth,
  size = 'md',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-linear-to-r from-teal-600 to-emerald-600 text-white shadow-sm hover:shadow hover:from-teal-700 hover:to-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 active:scale-[0.98]',
    secondary: 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-500/10 active:scale-[0.98]',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}
