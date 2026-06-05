import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
};

export function Button({
  className = '',
  variant = 'primary',
  fullWidth,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}
