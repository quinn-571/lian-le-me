import { Check } from 'lucide-react'

interface CelebrationProps {
  visible: boolean
}

export function Celebration({ visible }: CelebrationProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      {/* 大勾号动画 */}
      <div
        className="flex items-center justify-center rounded-full animate-bounce-in"
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'var(--color-success)',
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
        }}
      >
        <Check size={56} color="white" strokeWidth={3} />
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
