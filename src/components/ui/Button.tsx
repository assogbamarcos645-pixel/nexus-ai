import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-nexus-600 hover:bg-nexus-500 text-white shadow-sm glow-purple transition-all',
  ghost:
    'bg-transparent hover:bg-white/8 text-white/70 hover:text-white transition-colors',
  danger:
    'bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 transition-colors',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'ghost', size = 'md', isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexus-400',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
