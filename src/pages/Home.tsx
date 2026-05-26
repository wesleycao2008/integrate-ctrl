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
    <main className="relative h-screen flex flex-col overflow-hidden bg-[#0a0e1a] text-slate-50">
      {/* 中心径向光晕 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1b2a]/50 via-transparent to-transparent" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 min-h-0">
        <DistributedPvDashboard />
      </div>
    </main>
  )
}

export default Home