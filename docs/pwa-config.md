# PWA 配置说明

## manifest.json (自动生成)
- `name`: 练了么 - 运动日历
- `short_name`: 练了么
- `display`: standalone（全屏，无浏览器UI）
- `orientation`: portrait（竖屏）
- `theme_color`: #FF6B35
- `background_color`: #FFF8F5

## Service Worker
- 使用 Workbox `PrecacheAll` 策略
- 所有静态资源（JS/CSS/HTML/SVG/PNG）预缓存
- 首次加载后完全离线可用

## 图标
需要两个 PNG 图标：
- `public/icon-192.png` — 192×192
- `public/icon-512.png` — 512×512

## PWA 安装
- 监听 `beforeinstallprompt` 事件（暂未实现）
- 自定义安装按钮（暂未实现）
- iOS: 用户用 Safari 打开 → 分享 → 添加到主屏幕

## 验证方式
1. Chrome DevTools → Lighthouse → PWA 审计
2. 添加到主屏幕 → 打开飞行模式 → 验证可用
3. 检查 `dist/sw.js` 是否正确生成
