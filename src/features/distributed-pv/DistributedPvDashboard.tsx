/**
 * @file DistributedPvDashboard.tsx
 * @description 分布式光伏控制指令解聚合综合看板的 Tab 容器，每个面板单独占一个选项卡。
 */

import type { FC } from 'react'
import { useState } from 'react'
import AggregationTrackingPanel from './components/AggregationTrackingPanel'
import MultiObjectiveWeightsPanel from './components/MultiObjectiveWeightsPanel'
import InverterCommandsPanel from './components/InverterCommandsPanel'
import LSTMCorrectionPanel from './components/LSTMCorrectionPanel'
import CommandDispatchStatusPanel from './components/CommandDispatchStatusPanel'
import { DispatcherView, FeederView } from './components/ResponseCapabilityPanel'

/**
 * Tab 标识类型。
 */
type TabId =
  | 'aggregation'
  | 'weights'
  | 'inverters'
  | 'lstm'
  | 'dispatch'
  | 'responseDispatcher'
  | 'responseFeeder'

/**
 * 单个 Tab 元数据。
 */
interface DashboardTab {
  /** Tab 唯一标识 */
  id: TabId
  /** Tab 显示名称 */
  label: string
  /** Tab 简要说明 */
  description: string
}

/**
 * 仪表板中包含的全部 Tab 配置。
 */
const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: 'aggregation',
    label: '聚合目标与跟踪监视',
    description: '上级有功目标曲线与台区关口功率及误差监视。',
  },
  {
    id: 'weights',
    label: '多目标权重配置',
    description: 'FAHP 动态权重与手动权重配置及场景模拟。',
  },
  {
    id: 'inverters',
    label: '逆变器指令与调控图',
    description: '逆变器指令、可用功率、调节裕度与手动干预。',
  },
  {
    id: 'lstm',
    label: 'LSTM 前馈修正监控',
    description: '误差对比曲线与各逆变器补偿系数 γ。',
  },
  {
    id: 'dispatch',
    label: '指令下发与执行状态',
    description: '下发成功率、通信延迟、执行时间轴与异常列表。',
  },
  {
    id: 'responseDispatcher',
    label: '响应能力评估 - 配网调度员视图',
    description:
      '从配网调度视角评估各台区实时可调能力与聚合指令下达支撑。',
  },
  {
    id: 'responseFeeder',
    label: '响应能力评估 - 台区运维人员视图',
    description:
      '从台区运维视角评估逆变器可调能力与历史响应性能。',
  },
]

/**
 * DistributedPvDashboard 组件。
 * 使用 Tab 将各功能面板分离，每次仅展示一个面板，便于聚焦查看。
 */
const DistributedPvDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('aggregation')

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#1e3a5f]/60 bg-[#0f172a]/80 p-4 shadow-lg shadow-black/40 flex-1 min-h-0">
      {/* Tab 标题与说明 */}
      <header className="shrink-0 flex flex-col items-center justify-center gap-2 text-center">
        <div className="w-full space-y-1">
          <h2 className="text-center text-lg font-semibold text-slate-50">
            低压分布式光伏聚合响应能力在线评估与提升系统
          </h2>
        </div>
      </header>

      {/* Tab 切换条 */}
      <nav className="shrink-0 -mx-1 flex gap-2 overflow-x-auto pb-1 pt-1 text-xs">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 transition-colors ${
                isActive
                  ? 'border-cyan-500/80 bg-cyan-500/20 text-cyan-100'
                  : 'border-[#1e3a5f]/60 bg-[#0f172a] text-blue-200/80 hover:border-blue-400/60 hover:bg-[#1e293b]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Tab 内容区域：每次仅渲染一个面板 */}
      <div className="flex-1 min-h-0 overflow-auto pt-1">
        {activeTab === 'aggregation' && <AggregationTrackingPanel />}
        {activeTab === 'weights' && <MultiObjectiveWeightsPanel />}
        {activeTab === 'inverters' && <InverterCommandsPanel />}
        {activeTab === 'lstm' && <LSTMCorrectionPanel />}
        {activeTab === 'dispatch' && <CommandDispatchStatusPanel />}
        {activeTab === 'responseDispatcher' && <DispatcherView />}
        {activeTab === 'responseFeeder' && <FeederView />}
      </div>
    </section>
  )
}

export default DistributedPvDashboard
