// 预设运动项目
export interface Exercise {
  id: string
  name: string
  type: 'cardio' | 'strength'
  icon: string
  isPreset: boolean
  isSweaty: boolean
  isGentle: boolean
}

export const PRESET_EXERCISES: Exercise[] = [
  { id: 'running', name: '跑步', type: 'cardio', icon: '🏃', isPreset: true, isSweaty: true, isGentle: false },
  { id: 'swimming', name: '游泳', type: 'cardio', icon: '🏊', isPreset: true, isSweaty: true, isGentle: false },
  { id: 'badminton', name: '羽毛球', type: 'cardio', icon: '🏸', isPreset: true, isSweaty: false, isGentle: false },
  { id: 'shoulder-back', name: '肩背', type: 'strength', icon: '💪', isPreset: true, isSweaty: false, isGentle: false },
  { id: 'glutes-legs', name: '臀腿', type: 'strength', icon: '🦵', isPreset: true, isSweaty: true, isGentle: false },
  { id: 'chest', name: '胸', type: 'strength', icon: '🏋️', isPreset: true, isSweaty: false, isGentle: false },
]

// 运动类常用emoji列表（供自定义项目选择）
export const SPORT_EMOJIS = [
  '🏃', '🏊', '🏸', '💪', '🦵', '🏋️',
  '🚴', '🧘', '🤸', '⛹️', '🤾', '🏌️',
  '🧗', '🚶', '🏄', '🎾', '⚽', '🏀',
  '🏈', '⚾', '🥊', '🎯', '🔥', '💦',
  '🫁', '❤️', '⭐', '✨',
]

// 主题定义
export interface Theme {
  id: string
  name: string
  emoji: string
  colors: {
    primary: string
    primaryLight: string
    primaryDark: string
    cardio: string
    strength: string
    bg: string
  }
}

export const THEMES: Theme[] = [
  { id: 'orange', name: '暖橙', emoji: '🍊', colors: { primary: '#FF6B35', primaryLight: '#FF8C5A', primaryDark: '#E55A2B', cardio: '#FF6B35', strength: '#2EC4B6', bg: '#FFF8F5' } },
  { id: 'ocean', name: '海洋蓝', emoji: '🌊', colors: { primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#2563EB', cardio: '#3B82F6', strength: '#F59E0B', bg: '#F0F7FF' } },
  { id: 'forest', name: '森林绿', emoji: '🌿', colors: { primary: '#22C55E', primaryLight: '#4ADE80', primaryDark: '#16A34A', cardio: '#22C55E', strength: '#8B5CF6', bg: '#F4FFF6' } },
  { id: 'berry', name: '浆果紫', emoji: '🫐', colors: { primary: '#8B5CF6', primaryLight: '#A78BFA', primaryDark: '#7C3AED', cardio: '#8B5CF6', strength: '#F97316', bg: '#F9F5FF' } },
  { id: 'sakura', name: '樱花粉', emoji: '🌸', colors: { primary: '#F472B6', primaryLight: '#F9A8D4', primaryDark: '#EC4899', cardio: '#F472B6', strength: '#06B6D4', bg: '#FFF5F9' } },
]

// 默认设置
export const DEFAULT_SETTINGS = {
  gender: 'female' as const,
  cardioFreq: 2,
  strengthFreq: 2,
  exerciseFreqs: {} as Record<string, number>,
  hairWashInterval: 2,
  lastHairWashDate: '', // 上次洗头日期
  lastPeriodDate: '',
  periodDuration: 5,
  periodCycle: 28,
}
