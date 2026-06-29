# 排课算法说明

## 算法签名
纯函数，确定性输出：
```ts
function generateSchedule(params: {
  settings: UserSettings
  startDate: Date
  dayCount: number           // 通常 60 天
  historicalSchedules: Schedule[]
  periodRecords: PeriodRecord[]
  hairWashRecords: HairWashRecord[]
  lockedDates: Set<string>
  lockedDaySchedules: Map<string, ScheduleItem[]>
}): Schedule[]
```

## 三阶段流程

### 阶段1：构建约束地图
对每一天标记：
- `isLocked` — 用户手动锁定日
- `isForcedRest` — 经期1-3天
- `isGentleOnly` — 经期4天+
- `isHairWashDay` — 洗头日
- （男性用户：所有经期/洗头约束为 false）

### 阶段2：初始化配额
- 每周有氧配额 = `cardioFreq`
- 每周无氧配额 = `strengthFreq`
- 各项目配额 = `exerciseFreqs`
- 从历史+锁定日数据推算连续训练天数和上次训练日

### 阶段3：逐日贪心排课
```
FOR each day:
  0. 锁定日 → 跳过，但更新配额状态
  1. 跨周 → 重置配额
  2. 连续≥3天 → 休息
  3. 连续=2天 且 非洗头日 → 休息
  4. 经期约束检查
  5. 选项目：候选=配额>0，排除昨天做过的，按最久没练排序
     洗头日优先2个项目 + isSweaty
  6. 更新配额和状态
```

## 关键策略
- **均匀间隔**：贪心选"最久没练" → 天然均匀
- **洗头日例外**：可打破2天休息规则
- **锁定日传导**：锁定日课表作为固定约束影响配额
- **合并保留**：重新排课时保留已完成的勾选状态
