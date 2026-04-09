import { useEffect, useRef, useState } from 'react'

export type ScrollDirection = 'up' | 'down'

export function useScrollDirection(threshold = 8): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up')
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 0) {
        setDirection('up')
        lastY.current = 0
        return
      }
      const diff = y - lastY.current
      if (Math.abs(diff) < threshold) return
      setDirection(diff > 0 ? 'down' : 'up')
      lastY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return direction
}
