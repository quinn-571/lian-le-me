# CLAUDE.md — 练了么项目工作指引

## 项目概述
练了么 — 运动日历 PWA。纯前端，React 19 + TypeScript + Vite 8 + Tailwind v4 + Zustand + Dexie.js。
数据本地存储（IndexedDB），离线可用，可添加到手机主屏幕。

## 关键文件路径
- 功能需求：docs/requirements.md
- 技术栈说明：docs/tech-stack.md
- UI设计规范：docs/design-spec.md
- 数据模型：docs/data-models.md
- 排课算法：docs/algorithm.md
- 开发计划：docs/development-plan.md
- PWA配置：docs/pwa-config.md
- 开发日志：devlog/YYYY-MM-DD.md

## 工作方式
1. 每次改动前先读 docs/development-plan.md 确认当前阶段
2. 完成改动后在 devlog/ 下写入当日日志
3. 每完成一个 Phase 停下来请用户确认
4. 不超前开发，不一口气做多个 Phase
5. 算法改动必须同步更新单元测试
6. 每次改动后运行 `npx tsc --noEmit` 和 `npx vite build` 确保零错误

## 项目目录
- src/components/ — UI组件
  - calendar/ — 日历视图组件
  - exercise/ — 运动项目组件
  - settings/ — 设置页组件
  - modals/ — 弹窗组件
  - ui/ — 通用UI组件
- src/stores/ — Zustand 状态管理
- src/engine/ — 排课算法（纯函数）
- src/db/ — Dexie 数据库
- src/hooks/ — 自定义 hooks
- src/utils/ — 工具函数
- docs/ — 项目文档
- devlog/ — 开发日志

## 常用命令
- 开发服务器：`npm run dev`
- 类型检查：`npx tsc --noEmit`
- 生产构建：`npm run build`
- 预览构建：`npm run preview`
