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
import ResponseCapabilityPanel from './components/ResponseCapabilityPanel'

/**
 * Tab 标识类型。
 */
type TabId =
  | 'aggregation'
  | 'weights'
  | 'inverters'
  | 'lstm'
  | 'dispatch'
  | 'response'

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
    id: 'response',
    label: '响应能力评估',
    description:
      '低压分布式光伏功率控制响应能力在线评估（调度员 / 运维视图）。',
  },
]

/**
 * DistributedPvDashboard 组件。
 * 使用 Tab 将各功能面板分离，每次仅展示一个面板，便于聚焦查看。
 */
const DistributedPvDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('aggregation')

  const activeMeta = DASHBOARD_TABS.find((t) => t.id === activeTab)

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/40">
      {/* Tab 标题与说明 */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-50">
            分布式光伏控制指令解聚合
          </h2>
          <p className="text-xs text-slate-400">
            通过选项卡切换查看聚合目标跟踪、多目标权重、逆变器指令、LSTM 修正、指令下发执行状态及响应能力评估。
          </p>
        </div>
        {activeMeta && (
          <div className="mt-1 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 md:mt-0">
            当前视图：
            <span className="text-sky-300">{activeMeta.label}</span>
            <span className="ml-1 text-slate-500">
              — {activeMeta.description}
            </span>
          </div>
        )}
      </header>

      {/* Tab 切换条 */}
      <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-1 text-xs">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 transition-colors ${
                isActive
                  ? 'border-sky-500/80 bg-sky-500/20 text-sky-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Tab 内容区域：每次仅渲染一个面板 */}
      <div className="pt-1">
        {activeTab === 'aggregation' && <AggregationTrackingPanel />}
        {activeTab === 'weights' && <MultiObjectiveWeightsPanel />}
        {activeTab === 'inverters' && <InverterCommandsPanel />}
        {activeTab === 'lstm' && <LSTMCorrectionPanel />}
        {activeTab === 'dispatch' && <CommandDispatchStatusPanel />}
        {activeTab === 'response' && <ResponseCapabilityPanel />}
      </div>
    </section>
  )
}

export default DistributedPvDashboard
