import { cn } from '@/lib/utils/cn'

interface Props {
  size?: number
  className?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 24,
  className,
  fullScreen = false,
}: Props) {
  const spinner = (
    <svg
      className={cn('animate-spin text-line-green', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
