// 使用 Web Audio API 播放完成提示音（无需音频文件）
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

// 播放完成提示音：两段上升音
export function playCompletionSound(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // 第一段：880Hz，80ms
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.08)

    // 第二段：1320Hz，80ms（更高，形成"叮咚"效果）
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320, now + 0.08)
    gain2.gain.setValueAtTime(0.3, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.18)
  } catch {
    // 静默失败 - 音频不是核心功能
  }
}
