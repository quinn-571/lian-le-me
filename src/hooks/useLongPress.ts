import { useRef, useEffect, useCallback } from 'react'

export function useLongPress(
  onLongPress: () => void,
  threshold = 600
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const movedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      movedRef.current = false
      clear()
      timerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          onLongPress()
        }
      }, threshold)
    },
    onPointerMove: (e: React.PointerEvent) => {
      // 移动超过5px视为取消长按
      if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) {
        movedRef.current = true
        clear()
      }
    },
    onPointerUp: () => {
      clear()
    },
    onPointerCancel: () => {
      clear()
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
    },
  }

  useEffect(() => {
    return () => clear()
  }, [clear])

  return handlers
}
