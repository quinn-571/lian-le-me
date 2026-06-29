# 数据模型

## Exercise (运动项目)
```ts
interface Exercise {
  id: string          // 唯一标识
  name: string        // 项目名称
  type: 'cardio' | 'strength'
  icon: string        // emoji
  isPreset: boolean   // 是否预设
  isSweaty: boolean   // 大出汗
  isGentle: boolean   // 舒缓（经期可用）
}
```

## ScheduleItem (课表条目)
```ts
interface ScheduleItem {
  id: number          // Dexie 自增主键
  date: string        // 'yyyy-MM-dd'
  exerciseId: string
  completed: boolean
  isManuallyAdded: boolean
}
```

## PeriodRecord (经期记录)
```ts
interface PeriodRecord {
  id: number
  startDate: string
  duration: number
  isPredicted: boolean
}
```

## HairWashRecord (洗头记录)
```ts
interface HairWashRecord {
  id: number
  date: string
}
```

## UserSettings (用户设置)
```ts
interface UserSettings {
  gender: 'male' | 'female'
  cardioFreq: number
  strengthFreq: number
  exerciseFreqs: Record<string, number>
  hairWashDays: number[]
  lastPeriodDate: string
  periodDuration: number
  periodCycle: number
  onboardingComplete: boolean
}
```

## Dexie 数据库
- DB name: `LianLeMeDB`
- Tables: `schedules`, `exercises`, `periodRecords`, `hairWashRecords`
- Indexed by: date, exerciseId
