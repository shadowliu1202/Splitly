import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-line-green text-white active:bg-line-dark disabled:bg-gray-300',
  secondary: 'bg-white text-gray-700 border border-gray-200 active:bg-gray-50',
  ghost: 'bg-transparent text-gray-600 active:bg-gray-100',
  danger: 'bg-red-500 text-white active:bg-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-4 py-3 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'font-medium transition-colors flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size={16} />}
      {children}
    </button>
  )
}
