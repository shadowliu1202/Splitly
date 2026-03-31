import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
}

export default function Avatar({
  src,
  name,
  size = 40,
  className,
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback: coloured initials circle
  return (
    <div
      className={cn(
        'rounded-full bg-line-green text-white font-semibold flex items-center justify-center flex-shrink-0',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}
