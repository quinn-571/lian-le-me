import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, visible, onClose, duration = 2000 }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [visible, duration, onClose])

  if (!show) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] animate-fade-in">
      <div
        className="px-6 py-3 rounded-full text-sm font-medium shadow-lg"
        style={{
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-surface)',
        }}
      >
        {message}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
