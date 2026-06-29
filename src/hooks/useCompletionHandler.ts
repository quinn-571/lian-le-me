import { useState, useCallback } from 'react'
import { playCompletionSound } from '../utils/sound'
import confetti from 'canvas-confetti'

export function useCompletionHandler() {
  const [showCelebration, setShowCelebration] = useState(false)

  const triggerCelebration = useCallback(() => {
    playCompletionSound()
    setShowCelebration(true)

    // 撒花
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#2EC4B6', '#FFD700', '#FF8C5A', '#22C55E'],
    })

    // 2秒后自动隐藏
    setTimeout(() => setShowCelebration(false), 2000)
  }, [])

  return { showCelebration, triggerCelebration, setShowCelebration }
}
