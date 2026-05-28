/**
 * @file ResponseCapabilityPanel.tsx
 * @description 低压分布式光伏功率控制响应能力在线评估面板，包含配网调度员视图与台区运维人员视图。
 */

import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  } from 'recharts'

/**
 * 子 Tab 标识。
 */
type SubTabId = 'dispatcher' | 'feeder'

/**
 * 台区聚合能力摘要。
 */
interface FeederArea {
  /** 台区 ID */
  id: string
  /** 台区名称 */
  name: string
  /** 可增能力 (kW) */
  upCapacityKw: number
  /** 可减能力 (kW) */
  downCapacityKw: number
  /** 不确定性区间半宽 (kW)，展示为 ±uncertaintyKw */
  uncertaintyKw: number
}

/**
 * 台区聚合能力时间序列点。
 */
interface FeederCapabilityPoint {
  /** 时间标签，例如 "10:30" */
  time: string
  /** 最大可增能力 (kW) */
  upMax: number
  /** 最大可减能力 (kW，取正数表示绝对值) */
  downMax: number
  /** 当前实际出力 (kW) */
  actual: number
  /** 不确定性区间 [下边界, 上边界] (kW) */
  band: [number, number]
}

/**
 * 响应能力排名表条目。
 */
interface FeederRankingRow {
  /** 台区名称 */
  name: string
  /** 可增能力 (kW) */
  upCapacityKw: number
  /** 裕度百分比 (0-100) */
  upMarginPercent: number
}

/**
 * 逆变器能力行。
 */
interface InverterCapabilityRow {
  /** 逆变器 ID */
  id: string
  /** 物理位置/支路 */
  location: string
  /** 当前有功出力 (kW) */
  pCur: number
  /** 可用有功上限 (kW) */
  pAvail: number
  /** 可增能力 ΔP_up (kW) */
  deltaUp: number
  /** 可减能力 ΔP_down (kW) */
  deltaDown: number
  /** 无功下限 (kVar) */
  qMin: number
  /** 无功上限 (kVar) */
  qMax: number
  /** 爬坡率 (kW/min) */
  rampRate: number
  /** 综合响应评分 (0-100) */
  score: number
  /** 通信 / 响应状态 */
  status: '正常' | '通信异常' | '长期不响应'
}

/**
 * 等值机组信息。
 */
interface EquivalentGroup {
  /** 机组 ID */
  id: string
  /** 机组名称 */
  name: string
  /** 包含的逆变器数量 */
  inverterCount: number
  /** 总可增能力 (kW) */
  totalUp: number
  /** 总可减能力 (kW) */
  totalDown: number
}

/**
 * 响应性能历史点。
 */
interface HistoryPoint {
  /** 时间标签，例如 "01:00" */
  time: string
  /** 响应精度（实际调节量 / 指令量，0-1） */
  accuracy: number
  /** 平均延迟时间 (ms) */
  delayMs: number
}

/**
 * 误差分布直方图 bin。
 */
interface ErrorBin {
  /** 区间标签，例如 "-10~-5" */
  bin: string
  /** 频次 */
  count: number
}

/**
 * 不确定性概率分布点。
 */
interface UncertaintyPoint {
  /** 能力值 (kW) */
  valueKw: number
  /** 概率密度（归一化后仅用于相对比较） */
  probability: number
}

/**
 * 构造演示用台区列表。
 */
const createMockFeeders = (): FeederArea[] => [
  { id: 'F01', name: '台区 A1', upCapacityKw: 260, downCapacityKw: 180, uncertaintyKw: 40 },
  { id: 'F02', name: '台区 B3', upCapacityKw: 120, downCapacityKw: 90, uncertaintyKw: 30 },
  { id: 'F03', name: '台区 C5', upCapacityKw: 80, downCapacityKw: 70, uncertaintyKw: 25 },
  { id: 'F04', name: '台区 D2', upCapacityKw: 40, downCapacityKw: 60, uncertaintyKw: 20 },
  { id: 'F05', name: '台区 E4', upCapacityKw: 200, downCapacityKw: 150, uncertaintyKw: 35 },
]

/**
 * 基于台区 ID 生成时间序列（仅为演示，简单扰动）。
 */
const createMockCapabilitySeries = (areaId: string): FeederCapabilityPoint[] => {
  const points: FeederCapabilityPoint[] = []
  const baseUp = areaId.charCodeAt(0) % 40 + 120
  const baseDown = areaId.charCodeAt(1) % 30 + 80

  for (let i = 0; i < 24; i += 1) {
    const hour = 9 + Math.floor(i / 6)
    const minute = (i % 6) * 10
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    const factor = 0.4 + 0.6 * Math.sin((Math.PI * i) / 24) ** 2
    const upMax = Math.round(baseUp * factor + (Math.random() - 0.5) * 10)
    const downMax = Math.round(baseDown * factor + (Math.random() - 0.5) * 10)
    const actual = Math.round((upMax - downMax) * 0.3 + (Math.random() - 0.5) * 20)
    const bandHigh = Math.round(upMax + 0.15 * upMax)
    const bandLow = Math.round(upMax - 0.15 * upMax)

    points.push({
      time,
      upMax,
      downMax,
      actual,
      band: [bandLow, bandHigh],
    })
  }

  return points
}

/**
 * 构造响应能力排名列表。
 */
const createMockRanking = (feeders: FeederArea[]): FeederRankingRow[] => {
  return feeders
    .map((f) => {
      const base = 300 // 假定 300kW 为“充裕”基准
      const upMarginPercent = Math.max(0, Math.min(100, (f.upCapacityKw / base) * 100))
      return {
        name: f.name,
        upCapacityKw: f.upCapacityKw,
        upMarginPercent,
      }
    })
    .sort((a, b) => a.upMarginPercent - b.upMarginPercent)
    .slice(0, 5)
}

/**
 * 构造演示用逆变器能力列表。
 */
const createMockInverterCapabilities = (): InverterCapabilityRow[] => {
  const rows: InverterCapabilityRow[] = []
  const statusPool: InverterCapabilityRow['status'][] = ['正常', '通信异常', '长期不响应']

  for (let i = 1; i <= 20; i += 1) {
    const pAvail = 25 + Math.random() * 35
    const pCur = pAvail * (0.4 + Math.random() * 0.4)
    const deltaUp = pAvail - pCur
    const deltaDown = pCur * 0.6
    const score = 70 + Math.random() * 30
    const status =
      Math.random() < 0.08 ? '长期不响应' : Math.random() < 0.15 ? '通信异常' : '正常'

    rows.push({
      id: `INV-${String(i).padStart(3, '0')}`,
      location: `支路 ${Math.ceil(i / 4)}`,
      pCur: Math.round(pCur),
      pAvail: Math.round(pAvail),
      deltaUp: Math.round(deltaUp),
      deltaDown: Math.round(deltaDown),
      qMin: -20 - Math.round(Math.random() * 20),
      qMax: 20 + Math.round(Math.random() * 20),
      rampRate: Number((3 + Math.random() * 4).toFixed(1)),
      score: Math.round(score),
      status,
    })
  }

  return rows
}

/**
 * 构造演示用等值机组。
 */
const createMockGroups = (): EquivalentGroup[] => [
  { id: 'G1', name: '等值机组 #1', inverterCount: 6, totalUp: 160, totalDown: 90 },
  { id: 'G2', name: '等值机组 #2', inverterCount: 5, totalUp: 130, totalDown: 70 },
  { id: 'G3', name: '等值机组 #3', inverterCount: 9, totalUp: 220, totalDown: 140 },
]

/**
 * 构造演示用历史响应性能。
 */
const createMockHistorySeries = (): HistoryPoint[] => {
  const points: HistoryPoint[] = []
  for (let i = 0; i < 24; i += 1) {
    const hour = (i + 1) % 24
    const time = `${String(hour).padStart(2, '0')}:00`
    const accuracy = 0.9 + (Math.random() - 0.5) * 0.08
    const delayMs = 350 + (Math.random() - 0.5) * 120
    points.push({
      time,
      accuracy: Math.max(0.75, Math.min(1, Number(accuracy.toFixed(3)))),
      delayMs: Math.round(delayMs),
    })
  }
  return points
}

/**
 * 构造演示用误差分布。
 */
const createMockErrorDistribution = (): ErrorBin[] => [
  { bin: '<-10%', count: 6 },
  { bin: '-10~-5%', count: 12 },
  { bin: '-5~0%', count: 20 },
  { bin: '0~5%', count: 24 },
  { bin: '5~10%', count: 10 },
  { bin: '>10%', count: 4 },
]

/**
 * 构造演示用未来可增能力概率分布。
 */
const createMockUncertainty = (): UncertaintyPoint[] => {
  const points: UncertaintyPoint[] = []
  const center = 180
  for (let i = -5; i <= 5; i += 1) {
    const valueKw = center + i * 15
    const prob = Math.exp(-(i * i) / 6)
    points.push({ valueKw, probability: Number(prob.toFixed(3)) })
  }
  return points
}

/**
 * 根据可增能力计算颜色（绿色=充裕，黄色=紧张，红色=极低）。
 */
const upCapacityToColorClass = (upCapacityKw: number): string => {
  if (upCapacityKw >= 200) return 'bg-emerald-500/15 text-emerald-200'
  if (upCapacityKw >= 80) return 'bg-amber-500/15 text-amber-200'
  return 'bg-rose-500/20 text-rose-200'
}

/**
 * 响应能力评估总面板组件。
 * 封装子 Tab：配网调度员视图与台区运维人员视图。
 */
const ResponseCapabilityPanel: FC = () => {
  const [subTab, setSubTab] = useState<SubTabId>('dispatcher')

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#1e3a5f]/60 bg-[#0f172a]/60 p-4 shadow-lg shadow-black/40 h-full">
      <header className="shrink-0 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-50">
            低压分布式光伏响应能力评估
          </h2>
          <p className="text-xs text-blue-200/60">
            从配网调度与台区运维两个视角评估各台区及逆变器的实时可调能力，为聚合指令下达与异常排查提供支撑。
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-blue-200/60">视图：</span>
          <button
            type="button"
            onClick={() => setSubTab('dispatcher')}
            className={`rounded-full px-3 py-1 ${
              subTab === 'dispatcher'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/70'
                : 'bg-[#1e293b] text-blue-200/80 border border-[#1e3a5f]/40'
            }`}
          >
            响应能力评估 - 配网调度员视图
          </button>
          <button
            type="button"
            onClick={() => setSubTab('feeder')}
            className={`rounded-full px-3 py-1 ${
              subTab === 'feeder'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/70'
                : 'bg-[#1e293b] text-blue-200/80 border border-[#1e3a5f]/40'
            }`}
          >
            响应能力评估 - 台区运维人员视图
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        {subTab === 'dispatcher' ? <DispatcherView /> : <FeederView />}
      </div>
    </section>
  )
}

/**
 * 配网调度员视图组件。
 * 展示台区聚合能力列表、未来 4 小时能力曲线、排名与预警以及下达指令辅助检查。
 */
const DispatcherView: FC = () => {
  const feeders = useMemo(() => createMockFeeders(), [])
  const [selectedFeederId, setSelectedFeederId] = useState<string>(() => feeders[0]?.id ?? 'F01')
  const [timeWindowHours, setTimeWindowHours] = useState<number>(4)
  const [plannedTarget, setPlannedTarget] = useState<number>(150)
  const selectedFeeder = feeders.find((f) => f.id === selectedFeederId) ?? feeders[0]
  const capabilitySeries = useMemo(() => createMockCapabilitySeries(selectedFeederId), [selectedFeederId])
  const ranking = useMemo(() => createMockRanking(feeders), [feeders])

  const visibleSeries = useMemo(() => {
    const count = Math.max(6, timeWindowHours * 6)
    return capabilitySeries.slice(0, count)
  }, [capabilitySeries, timeWindowHours])

  const totalUpCapacity = useMemo(() => feeders.reduce((sum, f) => sum + f.upCapacityKw, 0), [feeders])

  const minUpFeeder = useMemo(
    () => feeders.reduce((min, f) => (f.upCapacityKw < min.upCapacityKw ? f : min)),
    [feeders],
  )

  const isTargetExceeded = plannedTarget > totalUpCapacity
  const suggestedTarget = Math.round(totalUpCapacity)

  return (
    <div className="min-h-full flex flex-col gap-4">
      {/* 上半部分：台区聚合能力列表 + 未来 4 小时能力曲线 */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,3fr)] shrink-0">
        {/* 台区聚合能力地图 / 列表模式 */}
        <section className="rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs">
          <header className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">台区聚合可调能力概览</h3>
              <p className="mt-0.5 text-[11px] text-blue-200/60">
                列表展示各台区当前可增/可减能力及不确定性区间，点击查看右侧详细曲线。
              </p>
            </div>
          </header>
          <div className="space-y-2">
            {feeders.map((f) => {
              const isActive = f.id === selectedFeederId
              const labelClass = upCapacityToColorClass(f.upCapacityKw)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFeederId(f.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition ${
                    isActive
                      ? 'border-cyan-500/70 bg-cyan-500/10'
                      : 'border-[#1e3a5f]/60 bg-[#0f172a] hover:border-[#1e3a5f]/40 hover:bg-[#0f172a]/80'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-100">{f.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${labelClass}`}>可增 {f.upCapacityKw} kW</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-blue-200/80">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                        <span>{f.upCapacityKw} kW</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3 text-rose-400" />
                        <span>{f.downCapacityKw} kW</span>
                      </span>
                      <span className="text-blue-200/60">不确定性：±{f.uncertaintyKw} kW</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400/60">ID: {f.id}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 聚合能力时间曲线（未来 4 小时） */}
        <section className="flex flex-col rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs">
          <header className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">
                {selectedFeeder?.name ?? '台区'} 聚合能力时间曲线（未来 4 小时）
              </h3>
              <p className="mt-0.5 text-[11px] text-blue-200/60">
                展示最大上调 / 下调能力、当前实际出力及不确定性带，支持滑块调节时间范围。
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-blue-200/60">时间窗口：</span>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={timeWindowHours}
                onChange={(e) =>
                  setTimeWindowHours(
                    Number.isNaN(Number.parseInt(e.target.value, 10)) ? 4 : Number.parseInt(e.target.value, 10),
                  )
                }
                className="h-1 w-24 accent-cyan-400"
              />
              <span className="w-10 text-right text-slate-100">{timeWindowHours} h</span>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visibleSeries} margin={{ top: 10, left: 0, right: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis
                  yAxisId="power"
                  stroke="#64748b"
                  fontSize={11}
                  label={{
                    value: '功率 (kW)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e3a5f',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area yAxisId="power" type="monotone" dataKey="band" stroke="none" fill="#64748b" fillOpacity={0.15} name="不确定性区间" />
                <Line yAxisId="power" type="monotone" dataKey="upMax" stroke="#22c55e" strokeWidth={2.5} dot={false} name="最大上调能力" />
                <Line yAxisId="power" type="monotone" dataKey="downMax" stroke="#fb7185" strokeWidth={2.5} dot={false} name="最大下调能力" />
                <Line yAxisId="power" type="monotone" dataKey="actual" stroke="#38bdf8" strokeWidth={2} dot={false} name="当前实际出力" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 下半部分：排名与预警 + 下达指令辅助 */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.5fr)] flex-1 min-h-0">
        {/* 排名与预警 */}
        <section className="h-full overflow-auto rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs">
          <header className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">台区可增能力排名与预警</h3>
              <p className="mt-0.5 text-[11px] text-blue-200/60">
                按可增能力裕度排序，标出可能成为瓶颈的台区并给出预警提示。
              </p>
            </div>
          </header>
          <div className="max-h-44 overflow-auto rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80">
            <table className="min-w-full border-separate border-spacing-0 text-[11px]">
              <thead className="sticky top-0 bg-[#0f172a]">
                <tr>
                  {['排名', '台区', '可增能力 (kW)', '裕度 (%)', '状态'].map((col) => (
                    <th key={col} className="border-b border-[#1e3a5f]/60 px-2 py-1.5 text-left font-medium text-blue-200/80">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, idx) => {
                  const isLow = row.upCapacityKw < 50
                  const isWarn = row.upCapacityKw < 80
                  return (
                    <tr key={row.name} className="border-b border-[#1e3a5f]/40 hover:bg-[#0f172a]/60">
                      <td className="px-2 py-1.5 text-blue-100/90">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-slate-100">{row.name}</td>
                      <td className="px-2 py-1.5 text-slate-100">{row.upCapacityKw}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-100">{row.upMarginPercent.toFixed(0)}%</td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                            isLow ? 'bg-rose-500/15 text-rose-200' : isWarn ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
                          }`}
                        >
                          {isLow ? '极低' : isWarn ? '紧张' : '充裕'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 预警条 */}
          {ranking.some((r) => r.upCapacityKw < 50) && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/70 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                检测到部分台区可增能力低于 50 kW，可能成为负荷上升场景下的瓶颈。建议优先核实：
                {ranking.filter((r) => r.upCapacityKw < 50).map((r) => r.name).join('、')}。
              </p>
            </div>
          )}
        </section>

        {/* 下达指令辅助 */}
        <section className="flex flex-col h-full rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs overflow-auto">
          <h3 className="shrink-0 text-xs font-semibold text-slate-100">下达聚合指令辅助检查</h3>
          <p className="shrink-0 mt-0.5 text-[11px] text-blue-200/60">
            输入计划目标值，系统自动检查各台区聚合能力是否满足，并在超出能力时给出建议修正值。
          </p>

          <div className="shrink-0 mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-blue-200/80">计划上调目标 ΔP_up (kW)</span>
              <input
                type="number"
                min={0}
                value={plannedTarget}
                onChange={(e) =>
                  setPlannedTarget(Number.isNaN(Number.parseFloat(e.target.value)) ? 0 : Number.parseFloat(e.target.value))
                }
                className="w-full rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-2 py-1 text-right text-[11px] text-slate-100"
              />
            </label>
            <div className="space-y-1">
              <span className="text-blue-200/80">全网总可增能力</span>
              <div className="rounded-lg border border-[#1e3a5f]/60 bg-[#0f172a] px-2 py-1.5">
                <p className="text-[11px] text-slate-100">{totalUpCapacity.toFixed(0)} kW</p>
                <p className="mt-0.5 text-[11px] text-blue-400/60">最薄弱台区：{minUpFeeder.name}（{minUpFeeder.upCapacityKw} kW）</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 mt-3 overflow-auto rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-2.5 text-[11px]">
            {!isTargetExceeded ? (
              <p className="text-emerald-200">计划目标在当前全网可增能力范围内，可下达聚合指令。建议关注台区 {minUpFeeder.name} 的运行裕度。</p>
            ) : (
              <div className="space-y-1 text-amber-100">
                <p>目标 {plannedTarget.toFixed(0)} kW 超出当前全网总可调上限 {totalUpCapacity.toFixed(0)} kW。</p>
                <p>建议将目标修正为 ≤ <span className="font-semibold">{suggestedTarget.toFixed(0)} kW</span>，或对下列台区进行容量优化：</p>
                <ul className="ml-4 list-disc space-y-0.5">
                  {ranking.slice(0, 3).map((r) => (
                    <li key={r.name}>{r.name}（当前可增 {r.upCapacityKw} kW）</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="shrink-0 mt-3 text-[11px] leading-relaxed text-blue-200/60">
            说明：辅助检查仅基于当前预测可调能力，未考虑后续时段的约束与运行风险。正式下达指令前，建议结合计划曲线与调峰需求做进一步校核。
          </p>
        </section>
      </div>
    </div>
  )
}

/**
 * 台区运维人员视图组件。
 * 展示台区拓扑与热力图、逆变器能力列表、等值机组、历史响应性能、不确定性分析及手动评估触发。
 */
const FeederView: FC = () => {
  const [showReactive, setShowReactive] = useState(false)
  const [selectedInverterId, setSelectedInverterId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'abnormal'>('all')
  const [minScore, setMinScore] = useState<number>(0)
  const [sortDesc, setSortDesc] = useState<boolean>(true)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>('G1')
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [lastEvalAt, setLastEvalAt] = useState<string>('2026-05-18 04:30:00')
  const [lastDurationMs, setLastDurationMs] = useState<number>(950)

  const inverters = useMemo(() => createMockInverterCapabilities(), [refreshKey])
  const groups = useMemo(() => createMockGroups(), [])
  const historySeries = useMemo(() => createMockHistorySeries(), [refreshKey])
  const errorDist = useMemo(() => createMockErrorDistribution(), [refreshKey])
  const uncertainty = useMemo(() => createMockUncertainty(), [refreshKey])

  const filteredInverters = useMemo(() => {
    return [...inverters]
      .filter((inv) => {
        if (statusFilter === 'normal') {
          return inv.status === '正常'
        }
        if (statusFilter === 'abnormal') {
          return inv.status !== '正常'
        }
        return true
      })
      .filter((inv) => inv.score >= minScore)
      .sort((a, b) => (sortDesc ? b.deltaUp - a.deltaUp : a.deltaUp - b.deltaUp))
  }, [inverters, statusFilter, minScore, sortDesc])

  const selectedInverter =
    selectedInverterId && inverters.find((inv) => inv.id === selectedInverterId)

  /**
   * 触发一次手动评估，更新时间与耗时并刷新数据。
   */
  const triggerReEval = () => {
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0',
    )} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds(),
    ).padStart(2, '0')}`
    setLastEvalAt(ts)
    setLastDurationMs(Math.round(800 + Math.random() * 700))
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="h-full grid grid-rows-[minmax(0,0.38fr)_minmax(0,1fr)] gap-4">
      {/* 上半部分：拓扑热力图 + 逆变器能力列表 */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-h-0 overflow-hidden">
        {/* 台区单线拓扑与热力图 */}
        <section className="h-full flex flex-col rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs overflow-hidden">
          <header className="shrink-0 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">台区单线图与可调能力热力图</h3>
              <p className="mt-0.5 text-[11px] text-blue-200/60">
                节点大小表示装机容量，颜色表示可增 / 可减能力比例。点击节点可在右侧列表中联动高亮。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReactive((v) => !v)}
              className="rounded-full border border-[#1e3a5f]/40 bg-[#0f172a] px-2.5 py-1 text-[11px] text-blue-200/80 hover:bg-[#1e293b]"
            >
              {showReactive ? '隐藏无功能力' : '显示无功能力'}
            </button>
          </header>
          <div className="flex-1 min-h-0 flex flex-col gap-3 md:flex-row overflow-hidden">
            {/* 简化单线拓扑，使用圆点表示节点 */}
            <div className="flex-1 min-h-0 rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/90 p-3 overflow-auto">
              <div className="mb-2 text-[11px] text-blue-200/60">
                悬停查看节点 P_cur / P_avail / ΔP_up / ΔP_down，点击可在逆变器表中选中。
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {inverters.slice(0, 12).map((inv) => {
                  const ratio = inv.deltaUp / Math.max(inv.pAvail, 1)
                  const size = 26 + Math.min(inv.pAvail, 60) * 0.4
                  let color =
                    'bg-emerald-500/40 border-emerald-400/80 shadow-emerald-500/40'
                  if (ratio < 0.25)
                    color =
                      'bg-rose-500/40 border-rose-400/80 shadow-rose-500/40'
                  else if (ratio < 0.5)
                    color =
                      'bg-amber-500/40 border-amber-400/80 shadow-amber-500/40'

                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => setSelectedInverterId(inv.id)}
                      title={`P_cur=${inv.pCur} kW, P_avail=${inv.pAvail} kW, ΔP_up=${inv.deltaUp} kW, ΔP_down=${inv.deltaDown} kW`}
                      className={`flex items-center justify-center rounded-full border text-[10px] font-mono text-slate-900 shadow ${color} ${
                        selectedInverterId === inv.id ? 'ring-2 ring-cyan-300' : ''
                      }`}
                      style={{ width: size, height: size }}
                    >
                      {inv.id.replace('INV-', '')}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* 选中节点详情 */}
            <div className="w-full max-w-xs min-h-0 rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/90 p-3 text-[11px] overflow-auto">
              <h4 className="mb-1 font-medium text-slate-100">节点详情</h4>
              {selectedInverter ? (
                <dl className="space-y-1.5 text-blue-100/90">
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">逆变器 ID</dt>
                    <dd className="font-mono">{selectedInverter.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">位置</dt>
                    <dd>{selectedInverter.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">P_cur / P_avail</dt>
                    <dd>
                      {selectedInverter.pCur} / {selectedInverter.pAvail} kW
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">ΔP_up / ΔP_down</dt>
                    <dd>
                      {selectedInverter.deltaUp} / {selectedInverter.deltaDown} kW
                    </dd>
                  </div>
                  {showReactive && (
                    <div className="flex justify-between">
                      <dt className="text-blue-200/60">无功范围 Q_min~Q_max</dt>
                      <dd>
                        {selectedInverter.qMin} ~ {selectedInverter.qMax} kVar
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">响应评分</dt>
                    <dd>{selectedInverter.score}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-200/60">状态</dt>
                    <dd>{selectedInverter.status}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-blue-200/60">请在左侧单线图或下方表格中选择一个逆变器查看详细能力信息。</p>
              )}
            </div>
          </div>
        </section>

        {/* 逆变器能力列表与筛选 */}
        <section className="h-full flex flex-col rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs overflow-hidden">
          <header className="shrink-0 mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-100">逆变器能力列表与筛选</h3>
              <p className="mt-0.5 text-[11px] text-blue-200/60">
                支持按能力大小排序、按通信状态与评分筛选，对异常设备可一键标记维修。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'normal' | 'abnormal')
                }
                className="rounded border border-[#1e3a5f]/40 bg-[#0f172a] px-2 py-1 text-slate-100"
              >
                <option value="all">全部状态</option>
                <option value="normal">仅正常</option>
                <option value="abnormal">仅异常</option>
              </select>
              <label className="flex items-center gap-1 text-blue-200/60">
                评分 ≥
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={minScore}
                  onChange={(e) =>
                    setMinScore(Number.isNaN(Number.parseInt(e.target.value, 10)) ? 0 : Number.parseInt(e.target.value, 10))
                  }
                  className="w-14 rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-1 py-0.5 text-right text-[11px] text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setSortDesc((v) => !v)}
                className="rounded-full border border-[#1e3a5f]/40 bg-[#0f172a] px-2 py-1 text-[11px] text-blue-200/80 hover:bg-[#1e293b]"
              >
                ΔP_up 排序：{sortDesc ? '降序' : '升序'}
              </button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80">
            <table className="min-w-full border-separate border-spacing-0 text-[11px]">
              <thead className="sticky top-0 bg-[#0f172a]">
                <tr>
                  {[
                    'ID',
                    '位置',
                    'P_cur / P_avail (kW)',
                    'ΔP_up (kW)',
                    'ΔP_down (kW)',
                    'Q_min~Q_max (kVar)',
                    '爬坡率 (kW/min)',
                    '评分',
                    '状态',
                    '操作',
                  ].map((col) => (
                    <th key={col} className="border-b border-[#1e3a5f]/60 px-2 py-1.5 text-left font-medium text-blue-200/80">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInverters.map((inv) => {
                  const isAbnormal = inv.status !== '正常'
                  return (
                    <tr key={inv.id} className={`border-b border-[#1e3a5f]/40 hover:bg-[#0f172a]/70 ${selectedInverterId === inv.id ? 'bg-cyan-500/10' : ''}`}>
                      <td className="px-2 py-1.5 font-mono text-slate-100">{inv.id}</td>
                      <td className="px-2 py-1.5 text-slate-100">{inv.location}</td>
                      <td className="px-2 py-1.5 text-slate-100">{inv.pCur} / {inv.pAvail}</td>
                      <td className="px-2 py-1.5"><span className="rounded-full bg-[#1e293b] px-2 py-0.5 font-mono text-emerald-300">{inv.deltaUp}</span></td>
                      <td className="px-2 py-1.5 font-mono text-slate-100">{inv.deltaDown}</td>
                      <td className="px-2 py-1.5 text-slate-100">{inv.qMin} ~ {inv.qMax}</td>
                      <td className="px-2 py-1.5 text-slate-100">{inv.rampRate.toFixed(1)}</td>
                      <td className="px-2 py-1.5 text-slate-100">{inv.score}</td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${inv.status === '正常' ? 'bg-emerald-500/10 text-emerald-300' : inv.status === '通信异常' ? 'bg-amber-500/10 text-amber-200' : 'bg-rose-500/15 text-rose-200'}`}>{inv.status}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        {isAbnormal ? (
                          <button type="button" className="rounded-full border border-rose-500/70 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-500/20">标记维修</button>
                        ) : (
                          <button type="button" onClick={() => setSelectedInverterId(inv.id)} className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20">查看详情</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 下半部分：等值机组 + 历史趋势 + 不确定性 & 重新评估 */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,3fr)] min-h-0 overflow-hidden">
        {/* 等值机组分组可视化 */}
        <section className="h-full flex flex-col rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs overflow-hidden">
          <h3 className="shrink-0 text-xs font-semibold text-slate-100">等值机组分组可视化</h3>
          <p className="shrink-0 mt-0.5 text-[11px] text-blue-200/60">通过等值机组聚类查看逆变器分组与总调节能力，点击机组可展开成员列表。</p>
          <div className="flex-1 min-h-0 mt-2 space-y-2 overflow-auto">
            {groups.map((g) => {
              const isExpanded = expandedGroupId === g.id
              const total = g.totalUp + g.totalDown
              const upPercent = (g.totalUp / Math.max(total, 1)) * 100
              return (
                <div key={g.id} className="rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-2.5">
                  <button type="button" onClick={() => setExpandedGroupId((prev) => (prev === g.id ? null : g.id))} className="flex w-full items-center justify-between text-left">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-100">{g.name}</span>
                        <span className="rounded-full bg-[#1e293b] px-2 py-0.5 text-[10px] text-blue-100/90">{g.inverterCount} 台逆变器</span>
                      </div>
                      <p className="text-[11px] text-blue-200/80">ΔP_up={g.totalUp} kW，ΔP_down={g.totalDown} kW，增能力占比 {upPercent.toFixed(0)}%</p>
                    </div>
                    <span className="text-[10px] text-blue-400/60">{isExpanded ? '收起' : '展开'}</span>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 text-[11px] text-blue-200/80">
                      <p className="mb-1 text-blue-200/60">机组内逆变器（示意）：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: g.inverterCount }).map((_, idx) => (
                          <span key={`${g.id}-${idx + 1}`} className="rounded-full bg-[#1e293b] px-2 py-0.5 font-mono text-[10px] text-slate-100">
                            INV-{g.id.replace('G', '')}{String(idx + 1).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 历史趋势 + 不确定性 + 重新评估 */}
        <section className="h-full flex flex-col rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/70 p-3 text-xs overflow-hidden">
          {/* 历史响应趋势 */}
          <div className="flex-[1.2] min-h-0 flex flex-col">
            <h3 className="shrink-0 text-xs font-semibold text-slate-100">响应性能历史趋势（过去 24 小时）</h3>
            <p className="shrink-0 mt-0.5 text-[11px] text-blue-200/60">折线图展示台区整体响应精度与平均延迟，直方图展示指令误差分布，可用于对比不同设备的响应质量。</p>
            <div className="flex-1 min-h-0 mt-2 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] grid-rows-[minmax(0,1fr)]">
              <div className="min-h-0 rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historySeries} margin={{ top: 10, left: 0, right: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis
                      yAxisId="acc"
                      stroke="#22c55e"
                      fontSize={11}
                      domain={[0.7, 1.05]}
                      label={{
                        value: '响应精度',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#22c55e',
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      yAxisId="delay"
                      orientation="right"
                      stroke="#38bdf8"
                      fontSize={11}
                      label={{
                        value: '平均延迟 (ms)',
                        angle: 90,
                        position: 'insideRight',
                        fill: '#38bdf8',
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e3a5f',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="acc" type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="响应精度" />
                    <Line yAxisId="delay" type="monotone" dataKey="delayMs" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} name="平均延迟" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="min-h-0 rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorDist} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={40} />
                    <YAxis stroke="#64748b" fontSize={11} label={{ value: '出现次数', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e3a5f', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="count" fill="#f97373" name="误差频次" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 不确定性分析与预测 + 手动评估触发 */}
          <div className="flex-1 min-h-0 mt-3 flex flex-col">
            <div className="flex-1 min-h-0 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] grid-rows-[minmax(0,1fr)]">
              <div className="min-h-0 rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-2">
                <h4 className="mb-1 text-xs font-medium text-slate-100">未来 1 小时可增能力不确定性分析</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uncertainty} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="valueKw" stroke="#64748b" fontSize={11} label={{ value: 'ΔP_up (kW)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" fontSize={11} label={{ value: '相对概率', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e3a5f', borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="probability" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} name="概率密度" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="min-h-0 flex flex-col justify-between rounded-lg border border-[#1e3a5f]/60 bg-[#0a0e1a]/80 p-3 text-[11px] overflow-auto">
                <div className="shrink-0">
                  <h4 className="mb-1 text-xs font-medium text-slate-100">不确定性来源说明</h4>
                  <ul className="list-disc space-y-1 pl-4 text-blue-200/80">
                    <li>辐照度与气象预测误差导致光伏可用能力波动。</li>
                    <li>终端通信时延与丢包造成指令执行反馈抖动。</li>
                    <li>部分逆变器长期不响应或限功运行，等值能力降低。</li>
                  </ul>
                </div>
                <div className="shrink-0 mt-3 rounded-md border border-[#1e3a5f]/60 bg-[#0a0e1a] px-2.5 py-2 text-blue-200/60">
                  <p>
                    当前估计 1 小时内 ΔP_up 的 10%~90% 分位区间约为图中主峰附近区域，建议在制定精细控制计划时预留安全裕度。
                  </p>
                </div>
                <div className="shrink-0 mt-3 flex items-center justify-between text-blue-200/60">
                  <span>上次评估：{lastEvalAt}（耗时 {lastDurationMs} ms）</span>
                  <button type="button" onClick={triggerReEval} className="rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/25">
                    立即重新评估
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export { DispatcherView, FeederView }
export default ResponseCapabilityPanel
