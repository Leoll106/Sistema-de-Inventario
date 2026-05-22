import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─── Button ─────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:  'bg-brand hover:bg-brand-light text-white shadow-sm shadow-brand/20',
  success:  'bg-success-muted hover:bg-success/20 text-success border border-success/20',
  danger:   'bg-danger-muted  hover:bg-danger/20  text-danger  border border-danger/20',
  warning:  'bg-warning-muted hover:bg-warning/20 text-warning border border-warning/20',
  ghost:    'bg-transparent hover:bg-surface-2 text-slate-400 hover:text-slate-200 border border-white/8',
  outline:  'bg-transparent border border-white/14 hover:border-white/22 text-slate-300 hover:text-white',
}
const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'outline', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant], buttonSizes[size], className,
      )}
      {...props}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

// ─── Input ───────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600',
            'focus:outline-none focus:ring-1 transition-all duration-150',
            error
              ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
              : 'border-white/8 focus:border-brand/60 focus:ring-brand/15',
            leftIcon && 'pl-9',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  ),
)
Input.displayName = 'Input'

// ─── Select ──────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full bg-surface-2 border rounded-lg px-3 py-2 text-sm text-slate-200',
          'focus:outline-none focus:ring-1 transition-all duration-150 cursor-pointer',
          error
            ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
            : 'border-white/8 focus:border-brand/60 focus:ring-brand/15',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  ),
)
Select.displayName = 'Select'

// ─── Textarea ────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          'w-full bg-surface-2 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-y',
          'focus:outline-none focus:ring-1 transition-all duration-150',
          error
            ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
            : 'border-white/8 focus:border-brand/60 focus:ring-brand/15',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger flex items-center gap-1">⚠ {error}</p>}
    </div>
  ),
)
Textarea.displayName = 'Textarea'

// ─── Badge ───────────────────────────────────────────────────
type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'gray'

const badgeColors: Record<BadgeColor, string> = {
  blue:   'bg-brand/10 text-brand-light border border-brand/15',
  green:  'bg-success-muted text-success border border-success/20',
  yellow: 'bg-warning-muted text-warning border border-warning/20',
  red:    'bg-danger-muted  text-danger  border border-danger/20',
  purple: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
  teal:   'bg-teal-500/10 text-teal-300 border border-teal-500/20',
  gray:   'bg-white/5 text-slate-400 border border-white/8',
}

export const Badge = ({ color = 'gray', children, className }: {
  color?: BadgeColor; children: ReactNode; className?: string
}) => (
  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', badgeColors[color], className)}>
    {children}
  </span>
)

// ─── Card ────────────────────────────────────────────────────
export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('bg-surface-1 border border-white/8 rounded-xl overflow-hidden', className)}>
    {children}
  </div>
)

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-between px-5 py-3.5 border-b border-white/8', className)}>
    {children}
  </div>
)

export const CardBody = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('p-5', className)}>{children}</div>
)

// ─── Modal ───────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode
}) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-1 border border-white/14 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/8 bg-surface-2/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────
export const EmptyState = ({ icon, title, description }: {
  icon?: ReactNode; title: string; description?: string
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-4xl mb-3">{icon}</div>}
    <p className="text-sm font-medium text-slate-400">{title}</p>
    {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
  </div>
)

// ─── Spinner ─────────────────────────────────────────────────
export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn('w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin', className)} />
)

// ─── StockBar ────────────────────────────────────────────────
export const StockBar = ({ stock, min }: { stock: number; min: number }) => {
  const pct = min === 0 ? 100 : Math.min(100, Math.round((stock / (min * 2)) * 100))
  const color = stock === 0 ? 'bg-danger' : stock <= min ? 'bg-warning' : 'bg-success'
  return (
    <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden mt-1">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── PageHeader ──────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode
}) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5 font-light">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
)
