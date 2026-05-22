/**
 * @file CommandDispatchStatusPanel.tsx
 * @description 指令下发与执行状态监控面板。
 */

import type { FC } from 'react'
import { useMemo, useState } from 'react'

/**
 * 单条指令执行状态。
 */
type CommandStatus = 'ok' | 'delayed' | 'timeout'

/**
 * 单个逆变器的一次下发时间轴条目。
 */
interface DispatchTimelineItem {
  /** 逆变器 ID */
  id: string
  /** 发送时间（相对毫秒，用于演示） */
  sendAt: number
  /** 确认时间（相对毫秒），超时时为 null */
  ackAt: number | null
  /** 此次下发状态 */
  status: CommandStatus
}

/**
 * 未确认指令的异常信息。
 */
interface ExceptionItem {
  /** 逆变器 ID */
  id: string
  /** 异常原因 */
  reason: string
  /** 持续时长（毫秒） */
  durationMs: number
}

/**
 * 构造演示用时间轴数据。
 */
const createMockTimeline = (): DispatchTimelineItem[] => [
  { id: 'INV-001', sendAt: 0, ackAt: 250, status: 'ok' },
  { id: 'INV-004', sendAt: 200, ackAt: 720, status: 'delayed' },
  { id: 'INV-007', sendAt: 400, ackAt: null, status: 'timeout' },
  { id: 'INV-010', sendAt: 600, ackAt: 860, status: 'ok' },
  { id: 'INV-012', sendAt: 800, ackAt: 1400, status: 'delayed' },
]

/**
 * 构造演示用异常列表。
 */
const createMockExceptions = (): ExceptionItem[] => [
  { id: 'INV-007', reason: '通信中断', durationMs: 3000 },
  { id: 'INV-015', reason: '本地保护动作', durationMs: 5200 },
  { id: 'INV-021', reason: '逆变器自检未通过', durationMs: 7800 },
]

/**
 * CommandDispatchStatusPanel 组件。
 * 展示下发成功率、平均延迟、执行时间轴和异常列表。
 * 顶部右侧提供“执行指令”按钮，用于模拟重新获取并刷新当前面板数据。
 */
const CommandDispatchStatusPanel: FC = () => {
  /**
   * 刷新键，每次点击“执行指令”按钮都会自增，从而触发所有 useMemo 重新计算。
   */
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * 模拟下发成功率与平均延迟指标。
   * 每次 refreshKey 变化时重新生成，范围控制在合理区间。
   */
  const { successRate, avgLatencyMs } = useMemo(() => {
    const success = 96 + Math.random() * 4 // 96% ~ 100%
    const latency = 300 + Math.random() * 250 // 300ms ~ 550ms
    return {
      successRate: Number(success.toFixed(1)),
      avgLatencyMs: Number(latency.toFixed(0)),
    }
  }, [refreshKey])

  /**
   * 指令执行时间轴与异常列表数据。
   * 目前为固定结构，refreshKey 变化时重新生成一份用于模拟“重新拉取”。
   */
  const timeline = useMemo(() => createMockTimeline(), [refreshKey])
  const exceptions = useMemo(() => createMockExceptions(), [refreshKey])

  const maxTime = useMemo(
    () =>
      Math.max(
        ...timeline.map((t) =>
          t.ackAt === null ? t.sendAt + 1500 : t.ackAt,
        ),
      ),
    [timeline],
  )

  /**
   * 将毫秒格式化为简短字符串。
   */
  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${ms} ms`
    return `${(ms / 1000).toFixed(1)} s`
  }

  return (
    <section className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            指令下发与执行状态
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            监视下发成功率、通信延迟和执行反馈，提供甘特图和异常列表视图。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/25"
        >
          执行指令（刷新）
        </button>
      </header>

      <div className="space-y-4 text-xs">
        {/* 仪表盘统计 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  backgroundImage: `conic-gradient(#22c55e ${
                    successRate * 3.6
                  }deg, #1f2937 ${successRate * 3.6}deg)`,
                }}
              />
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-slate-950">
                <span className="text-[11px] font-semibold text-emerald-300">
                  {successRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-400">下发成功率</p>
              <p className="text-xs text-slate-200">
                最近 5 min 内指令下发成功率。建议保持 &gt; 95%。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-900" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-slate-950">
                <span className="text-[11px] font-semibold text-sky-300">
                  {avgLatencyMs.toFixed(0)} ms
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-400">平均通信延迟</p>
              <p className="text-xs text-slate-200">
                包含调度主站到逆变器执行反馈的端到端往返时间。
              </p>
            </div>
          </div>
        </div>

        {/* 时间轴甘特图 */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-100">
              指令执行时间轴（示意）
            </span>
            <span className="text-slate-400">
              横轴：发送-确认时间；颜色：状态
            </span>
          </div>
          <div className="space-y-2 text-[11px]">
            {timeline.map((item) => {
              const startPercent = (item.sendAt / maxTime) * 100
              const endTime = item.ackAt ?? maxTime
              const widthPercent = ((endTime - item.sendAt) / maxTime) * 100
              let barColor = 'bg-emerald-500/70'
              if (item.status === 'delayed') barColor = 'bg-amber-400/80'
              if (item.status === 'timeout') barColor = 'bg-rose-500/80'
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-16 shrink-0 font-mono text-[11px] text-slate-200">
                    {item.id}
                  </div>
                  <div className="relative h-3 flex-1 rounded-full bg-slate-800">
                    <div
                      className={`absolute h-3 rounded-full ${barColor}`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${Math.max(widthPercent, 3)}%`,
                      }}
                    />
                  </div>
                  <div className="w-14 shrink-0 text-right text-[11px] text-slate-300">
                    {item.status === 'timeout'
                      ? '超时'
                      : formatMs((item.ackAt ?? 0) - item.sendAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 异常列表 */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
            <span className="font-medium text-slate-100">异常指令列表</span>
            <span className="text-[11px] text-slate-400">
              未确认指令设备及原因（近 5 min）
            </span>
          </div>
          <div className="max-h-40 overflow-auto text-xs">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                    逆变器 ID
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                    原因
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                    已持续
                  </th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="border-b border-slate-800/60">
                    <td className="px-2 py-1.5 font-mono text-[11px] text-slate-100">
                      {ex.id}
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-100">
                      {ex.reason}
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-200">
                      {formatMs(ex.durationMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommandDispatchStatusPanel
