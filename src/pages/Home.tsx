/**
 * @file Home.tsx
 * @description 应用首页，承载分布式光伏控制指令解聚合看板。
 */

import type { FC } from 'react'
import DistributedPvDashboard from '../features/distributed-pv/DistributedPvDashboard'

/**
 * Home 组件。
 * 渲染首页布局与分布式光伏指令解聚合功能模块入口。
 */
const Home: FC = () => {
  return (
    <main className="relative min-h-screen bg-[#0a0e1a] text-slate-50">
      {/* 中心径向光晕 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1b2a]/50 via-transparent to-transparent" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        <header className="space-y-2">
          <h1 className="text-lg font-semibold text-slate-50">
            分布式光伏控制指令解聚合监控看板
          </h1>
          <p className="text-sm text-blue-200/60">
            通过聚合目标跟踪、多目标权重配置、逆变器指令监视、LSTM 前馈修正以及指令下发执行状态，
            为调度与运行人员提供一体化监控界面。
          </p>
        </header>

        <DistributedPvDashboard />
      </div>
    </main>
  )
}

export default Home