# 技术栈说明

| 层级 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | React | 19 | 生态成熟，Hooks 模式 |
| 类型 | TypeScript | 6.0 | 严格模式 |
| 构建 | Vite | 8 | 快速 HMR，原生 ESM |
| PWA | vite-plugin-pwa | 1.3 | Workbox 底层，自动生成 SW |
| 样式 | Tailwind CSS | 4.3 | CSS变量主题切换，零运行时 |
| 状态管理 | Zustand | 5 | 轻量，内置 persist |
| 本地数据库 | Dexie.js | 4 | IndexedDB 封装，Promise API |
| 日期处理 | date-fns | 4 | Tree-shakeable，轻量 |
| 动画 | canvas-confetti | 1.9 | 高性能撒花 |
| 图标 | Lucide React | 1 | Tree-shakeable |
| 声音 | Web Audio API | - | 无需音频文件 |

## 为何选这些
- **不选 React Native**：需求明确是 PWA 网页
- **不选 fullcalendar**：太重型，自建格子日历更灵活
- **不选 Redux**：Zustand 更简单，满足需求
- **不选后端**：纯本地存储，离线可用
