# 项目代码结构与技术栈分析

## 项目概述

**项目名称**: integrate-ctrl（集成控制平台）  
**npm 包名**: web-creator  
**项目类型**: 单页 Web 应用（SPA）  
**业务领域**: 分布式光伏控制指令解聚合监控看板  

本项目为调度与运行人员提供一体化监控界面，涵盖聚合目标跟踪、多目标权重配置、逆变器指令监视、LSTM 前馈修正以及指令下发执行状态等功能。

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | ^18.3.1 | UI 框架 |
| **TypeScript** | ^5.x (via tsconfig) | 类型安全 |
| **React Router** | ^7.5.3 | 客户端路由（Hash 模式） |

### 构建工具链

| 技术 | 版本 | 用途 |
|------|------|------|
| **esbuild** | 0.25.4 | 打包构建（非 Vite） |
| **esbuild-style-plugin** | ^1.6.3 | CSS 处理插件 |
| **PostCSS** | ^8.5.3 | CSS 后处理 |
| **Autoprefixer** | ^10.4.21 | CSS 自动前缀 |
| **rimraf** | ^6.0.1 | 构建前清理 dist 目录 |

### UI 与样式

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | ^3.4.17 | 原子化 CSS 框架 |
| **tailwindcss-animate** | ^1.0.7 | Tailwind 动画插件 |
| **shadcn/ui** (Radix UI) | 各组件独立版本 | 无头 UI 组件库（45+ 组件） |
| **lucide-react** | ^0.503.0 | 图标库 |
| **class-variance-authority** | ^0.7.1 | 组件变体管理 |
| **clsx** | ^2.1.1 | 类名拼接工具 |
| **tailwind-merge** | ^3.2.0 | Tailwind 类名合并 |
| **motion** | ^12.17.0 | 动画库（原 framer-motion） |

### 数据可视化

| 技术 | 版本 | 用途 |
|------|------|------|
| **recharts** | ^2.15.3 | 图表库（基于 React + D3） |

### 表单与验证

| 技术 | 版本 | 用途 |
|------|------|------|
| **react-hook-form** | ^7.56.1 | 表单状态管理 |
| **@hookform/resolvers** | ^5.0.1 | 表单验证解析器 |
| **zod** | ^3.24.3 | Schema 声明式验证 |

### 状态管理与工具

| 技术 | 版本 | 用途 |
|------|------|------|
| **zustand** | ^5.0.5 | 轻量级状态管理 |
| **date-fns** | ^3.6.0 | 日期工具库 |

### 国际化

| 技术 | 版本 | 用途 |
|------|------|------|
| **i18next** | ^25.1.2 | 国际化框架 |
| **react-i18next** | ^15.5.1 | React 国际化绑定 |

### 其他 UI 增强

| 技术 | 版本 | 用途 |
|------|------|------|
| **sonner** | ^2.0.3 | Toast 通知组件 |
| **cmdk** | ^1.1.1 | 命令面板组件 |
| **embla-carousel-react** | ^8.6.0 | 轮播组件 |
| **input-otp** | ^1.4.2 | OTP 输入组件 |
| **react-day-picker** | ^8.10.1 | 日期选择器 |
| **react-resizable-panels** | ^2.1.9 | 可调整大小面板 |
| **vaul** | ^1.1.2 | Drawer 抽屉组件 |
| **next-themes** | ^0.4.6 | 主题切换（暗色/亮色模式） |

---

## 目录结构

```
e:\dev\integrate-ctrl\
├── index.html                          # HTML 入口文件
├── package.json                        # 项目依赖与脚本配置
├── package-lock.json                   # 依赖锁定文件
├── tsconfig.json                       # TypeScript 编译配置
├── tailwind.config.js                  # Tailwind CSS 配置（shadcn/ui 主题）
├── .gitignore                          # Git 忽略规则
├── CLAUDE.md                           # Claude AI 辅助开发说明
├── CODE_STRUCTURE.md                   # 本文件：代码结构与技术栈分析
├── DeploymentGuide.txt                 # 部署指南
├── FileDescription.txt                 # 文件描述说明
│
├── scripts/
│   └── build.mjs                       # esbuild 构建脚本（开发/生产模式）
│
└── src/
    ├── main.tsx                        # React 应用入口，挂载到 #app
    ├── App.tsx                         # 根组件，HashRouter 路由配置
    ├── shadcn.css                      # 全局样式（Tailwind 指令 + CSS 变量主题）
    │
    ├── components/
    │   └── ui/                         # shadcn/ui 组件库（48 个组件）
    │       ├── accordion.tsx           # 手风琴
    │       ├── alert.tsx               # 警告提示
    │       ├── alert-dialog.tsx        # 警告对话框
    │       ├── aspect-ratio.tsx        # 宽高比容器
    │       ├── avatar.tsx              # 头像
    │       ├── badge.tsx               # 徽章
    │       ├── breadcrumb.tsx          # 面包屑
    │       ├── button.tsx              # 按钮
    │       ├── calendar.tsx            # 日历
    │       ├── card.tsx                # 卡片
    │       ├── carousel.tsx            # 轮播
    │       ├── chart.tsx               # 图表容器
    │       ├── checkbox.tsx            # 复选框
    │       ├── collapsible.tsx         # 折叠面板
    │       ├── command.tsx             # 命令面板
    │       ├── context-menu.tsx        # 右键菜单
    │       ├── dialog.tsx              # 对话框
    │       ├── drawer.tsx              # 抽屉
    │       ├── dropdown-menu.tsx       # 下拉菜单
    │       ├── form.tsx                # 表单
    │       ├── hover-card.tsx          # 悬停卡片
    │       ├── input.tsx               # 输入框
    │       ├── input-otp.tsx           # OTP 输入
    │       ├── label.tsx               # 标签
    │       ├── menubar.tsx             # 菜单栏
    │       ├── navigation-menu.tsx     # 导航菜单
    │       ├── pagination.tsx          # 分页
    │       ├── popover.tsx             # 弹出框
    │       ├── progress.tsx            # 进度条
    │       ├── radio-group.tsx         # 单选组
    │       ├── resizable.tsx           # 可调整面板
    │       ├── scroll-area.tsx         # 滚动区域
    │       ├── select.tsx              # 选择器
    │       ├── separator.tsx           # 分隔线
    │       ├── sheet.tsx               # 侧边面板
    │       ├── sidebar.tsx             # 侧边栏
    │       ├── skeleton.tsx            # 骨架屏
    │       ├── slider.tsx              # 滑块
    │       ├── sonner.tsx              # Sonner Toast 封装
    │       ├── switch.tsx              # 开关
    │       ├── table.tsx               # 表格
    │       ├── tabs.tsx                # 选项卡
    │       ├── textarea.tsx            # 文本域
    │       ├── toast.tsx               # Toast 组件
    │       ├── toaster.tsx             # Toast 容器
    │       ├── toggle.tsx              # 切换按钮
    │       ├── toggle-group.tsx        # 切换按钮组
    │       └── tooltip.tsx             # 工具提示
    │
    ├── features/
    │   └── distributed-pv/             # 分布式光伏功能模块
    │       ├── DistributedPvDashboard.tsx   # 仪表板主组件（Tab 容器）
    │       └── components/
    │           ├── AggregationTrackingPanel.tsx    # 聚合目标与跟踪监视面板
    │           ├── MultiObjectiveWeightsPanel.tsx  # 多目标权重配置面板
    │           ├── InverterCommandsPanel.tsx       # 逆变器指令与调控图面板
    │           ├── LSTMCorrectionPanel.tsx         # LSTM 前馈修正监控面板
    │           ├── CommandDispatchStatusPanel.tsx  # 指令下发与执行状态面板
    │           └── ResponseCapabilityPanel.tsx     # 响应能力评估面板
    │
    ├── hooks/
    │   ├── use-mobile.tsx              # 移动端检测 Hook（断点 768px）
    │   └── use-toast.ts                # Toast 通知状态管理 Hook
    │
    ├── lib/
    │   └── utils.ts                    # cn() 工具函数（clsx + tailwind-merge）
    │
    └── pages/
        └── Home.tsx                    # 首页，承载分布式光伏看板
```

---

## 组件层级关系

```
main.tsx
└── App.tsx (HashRouter)
    └── Routes
        └── Route "/" → Home.tsx
            └── DistributedPvDashboard.tsx (Tab 容器)
                ├── [Tab: aggregation]  → AggregationTrackingPanel.tsx
                │   └── 使用 recharts (ComposedChart, Line, Area, Tooltip...)
                ├── [Tab: weights]      → MultiObjectiveWeightsPanel.tsx
                ├── [Tab: inverters]    → InverterCommandsPanel.tsx
                ├── [Tab: lstm]         → LSTMCorrectionPanel.tsx
                ├── [Tab: dispatch]     → CommandDispatchStatusPanel.tsx
                └── [Tab: response]     → ResponseCapabilityPanel.tsx
```

---

## 架构设计特点

### 1. 路由设计
- 使用 **HashRouter**（`react-router` v7），适合静态部署场景
- 当前仅有一个路由 `/` → `Home.tsx`

### 2. 功能模块化
- 采用 **features/** 目录按业务领域组织代码
- `distributed-pv` 模块包含 1 个主容器组件 + 6 个功能面板组件
- 每个面板独立封装，通过 Tab 切换展示

### 3. UI 组件策略
- 基于 **shadcn/ui** 模式：组件源码直接存在于项目中（非 npm 包），可自由定制
- 48 个 UI 组件覆盖了大部分常见交互场景
- 使用 CSS 变量 + Tailwind 实现暗色主题

### 4. 构建方案
- 使用 **esbuild** 而非 Vite/Webpack，构建速度极快
- 开发模式支持 HMR（通过 EventSource 监听 esbuild 变更）
- 生产模式启用 minify + treeShaking

### 5. 数据可视化
- 使用 **recharts** 绘制时间序列曲线、误差分析图等
- AggregationTrackingPanel 中展示了 ComposedChart 的典型用法（多 Y 轴、Area 阴影域、Line 曲线）

### 6. 状态管理
- 组件内部状态使用 `useState` / `useMemo`
- 全局状态管理预留了 **zustand**（已安装依赖）
- Toast 通知使用自定义 `useToast` Hook + reducer 模式

### 7. 类型安全
- TypeScript 严格模式（`strict: true`）
- 路径别名 `@/*` 映射到 `./src/*`
- 使用 `type` 关键字导入类型（`import type { FC } from 'react'`）

---

## 构建与运行

```bash
# 开发模式（启动 esbuild dev server + watch）
npm run dev

# 生产构建
npm run build
```

- 开发服务器自动分配端口，支持热更新
- 构建产物输出到 `dist/` 目录
- 入口文件：`src/main.tsx` + `index.html`

---

## 业务功能说明

| 面板 | Tab ID | 功能描述 |
|------|--------|----------|
| 聚合目标与跟踪监视 | `aggregation` | 上级有功目标曲线与台区关口功率对比，可行域阴影及误差监视（RMSE、最大绝对误差） |
| 多目标权重配置 | `weights` | FAHP 动态权重与手动权重配置及场景模拟 |
| 逆变器指令与调控图 | `inverters` | 逆变器指令、可用功率、调节裕度与手动干预 |
| LSTM 前馈修正监控 | `lstm` | 误差对比曲线与各逆变器补偿系数 γ |
| 指令下发与执行状态 | `dispatch` | 下发成功率、通信延迟、执行时间轴与异常列表 |
| 响应能力评估 | `response` | 低压分布式光伏功率控制响应能力在线评估（调度员/运维视图） |

---

*文档更新时间: 2026-05-22*