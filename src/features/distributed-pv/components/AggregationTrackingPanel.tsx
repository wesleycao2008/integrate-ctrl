/**
 * @file AggregationTrackingPanel.tsx
 * @description 聚合目标与跟踪监视面板，展示上级目标曲线与台区关口功率对比及误差监控。
 */

import type { FC } from 'react'
import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * 聚合功率时间序列数据点。
 */
interface AggregationPoint {
  /** 时间刻度标签（如 "12:05"） */
  time: string
  /** 目标有功功率 (kW) */
  target: number
  /** 实际有功功率 (kW) */
  actual: number
  /** 可行域下边界 (kW) */
  lower: number
  /** 可行域上边界 (kW) */
  upper: number
  /** 跟踪误差 (kW)，actual - target */
  error: number
  /** 可行运行域 [下边界, 上边界] (kW) */
  domain: [number, number]
}

/**
 * 生成用于演示的聚合时间序列数据。
 * @param hours 生成小时长度（例如 4 或 24）
 * @returns AggregationPoint[]
 */
const createMockAggregationData = (hours: number): AggregationPoint[] => {
  const points: AggregationPoint[] = []
  const now = new Date()
  const isDay = hours >= 24
  const stepMinutes = isDay ? 60 : 30
  const count = Math.max(1, Math.floor((hours * 60) / stepMinutes))

  const baseTarget = 500
  for (let i = 0; i < count; i += 1) {
    const dt = new Date(now.getTime() + i * stepMinutes * 60 * 1000)
    const hh = String(dt.getHours()).padStart(2, '0')
    const mm = String(dt.getMinutes()).padStart(2, '0')
    const timeLabel = `${hh}:${mm}`
    // Smooth diurnal shape with different amplitudes for long/short horizon
    const phase = (i / Math.max(1, count - 1)) * Math.PI * 2
    const amplitude = isDay ? 120 : 80
    const target = baseTarget + amplitude * Math.sin(phase)
    const noise = (Math.random() - 0.5) * (isDay ? 80 : 60)
    const actual = target + noise
    const lower = target - (isDay ? 120 : 100)
    const upper = target + (isDay ? 120 : 100)
    const error = actual - target
    points.push({
      time: timeLabel,
      target: Math.round(target),
      actual: Math.round(actual),
      lower: Math.round(lower),
      upper: Math.round(upper),
      error: Math.round(error),
      domain: [Math.round(lower), Math.round(upper)],
    })
  }
  return points
}

/**
 * 计算当前误差、最大绝对误差与 RMSE 等指标。
 * @param data 聚合时间序列
 */
const useErrorMetrics = (data: AggregationPoint[]) => {
  return useMemo(() => {
    if (!data.length) {
      return {
        currentError: 0,
        maxAbsError: 0,
        rmse: 0,
      }
    }
    const currentError = data[data.length - 1]?.error ?? 0
    let sumSquares = 0
    let maxAbsError = 0
    data.forEach((p) => {
      const abs = Math.abs(p.error)
      if (abs > maxAbsError) {
        maxAbsError = abs
      }
      sumSquares += p.error * p.error
    })
    const rmse = Math.sqrt(sumSquares / data.length)
    return {
      currentError,
      maxAbsError,
      rmse,
    }
  }, [data])
}

/**
 * 自定义 Tooltip，将可行运行域的上下界合并为区间展示。
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      className="rounded-lg border border-[#1e3a5f]/60 p-2 text-[11px]"
      style={{ backgroundColor: '#020617' }}
    >
      <p className="mb-1 font-medium text-blue-100/90">{label}</p>
      {payload.map((entry: any, index: number) => {
        if (entry.dataKey === 'domain') {
          const [dLower, dUpper] = Array.isArray(entry.value) ? entry.value : [entry.value, entry.value]
          return (
            <p key={index} className="text-blue-200/60">
              可行运行域：
              <span className="text-blue-100/90">{dLower} ~ {dUpper}</span>
            </p>
          )
        }
        return (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}：{entry.value}
          </p>
        )
      })}
    </div>
  )
}

/**
 * AggregationTrackingPanel 组件。
 * 提供”日前（未来24小时）/日内(未来4小时)”切换，切换时左侧曲线数据随之更新。
 */
const AggregationTrackingPanel: FC = () => {
  const [mode, setMode] = useState<'dayAhead' | 'intraDay'>('intraDay')
  const [intraHours, setIntraHours] = useState<number>(4)

  const hours = mode === 'dayAhead' ? 24 : intraHours
  const data = useMemo(() => createMockAggregationData(hours), [hours])
  const { currentError, maxAbsError, rmse } = useErrorMetrics(data)

  const errorThreshold = 80
  const isAlarm = Math.abs(currentError) > errorThreshold

  return (
    <section className="h-full rounded-2xl border border-[#1e3a5f]/60 bg-[#0f172a]/60 p-4 shadow-lg shadow-black/40">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">聚合目标与跟踪监视</h2>
          <p className="mt-1 text-xs text-blue-200/60">
            展示上级有功目标曲线与台区关口实时功率对比，可行域阴影及误差监视。
          </p>
        </div>

        {/* 切换：日前 / 日内 */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex flex-col text-right">
            <span className="text-blue-200/60">时间范围</span>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('dayAhead')}
                className={`rounded-full px-3 py-1 text-[11px] ${
                  mode === 'dayAhead'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/70'
                    : 'bg-[#1e293b] text-blue-200/80 border border-[#1e3a5f]/40'
                }`}
              >
                日前（未来24小时）
              </button>
              <button
                type="button"
                onClick={() => setMode('intraDay')}
                className={`rounded-full px-3 py-1 text-[11px] ${
                  mode === 'intraDay'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/70'
                    : 'bg-[#1e293b] text-blue-200/80 border border-[#1e3a5f]/40'
                }`}
              >
                日内（未来4小时）
              </button>
            </div>
          </div>

          {/* 日内模式下显示滑块选择小时数，日前模式不显示 */}
          {mode === 'intraDay' && (
            <div className="flex flex-col items-end">
              <p className="text-[11px] text-blue-200/60">可视范围（小时）</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={intraHours}
                  aria-label="可视范围小时数"
                  onChange={(e) =>
                    setIntraHours(
                      Number.isNaN(Number.parseInt(e.target.value, 10))
                        ? 4
                        : Number.parseInt(e.target.value, 10),
                    )
                  }
                  className="h-1 w-28 accent-cyan-400"
                />
                <span className="w-14 text-right font-medium text-slate-100">
                  未来 {intraHours} 小时（示意）
                </span>
              </div>
            </div>
          )}

          {mode === 'dayAhead' && (
            <div className="flex flex-col items-end">
              <p className="text-[11px] text-blue-200/60">视图</p>
              <p className="mt-1 font-medium text-slate-100">日前（未来 24 小时，示意）</p>
            </div>
          )}
        </div>
      </header>

      {isAlarm && (
        <div className="mb-3 rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          当前跟踪误差 {currentError.toFixed(0)} kW 已超过预设阈值 {errorThreshold.toFixed(0)} kW，请核查上级计划或现场运行状态。
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,1.1fr)]">
        <div className="h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, left: 0, right: 20, bottom: 0 }}>
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
              <YAxis
                yAxisId="error"
                orientation="right"
                stroke="#f97373"
                fontSize={11}
                label={{
                  value: '误差 (kW)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#fecaca',
                  fontSize: 10,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* 可行域阴影带：以每点的上下界作为带 */}
              <Area
                yAxisId="power"
                type="monotone"
                dataKey="domain"
                stroke="none"
                fill="#64748b"
                fillOpacity={0.15}
                name="可行运行域"
              />
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="target"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                name="目标曲线"
              />
              <Line
                yAxisId="power"
                type="monotone"
                dataKey="actual"
                stroke="#f97373"
                strokeWidth={2}
                dot={false}
                name="实际曲线"
              />
              <Line
                yAxisId="error"
                type="monotone"
                dataKey="error"
                stroke="#facc15"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                name="误差"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#1e3a5f]/60 bg-[#0f172a]/80 p-3 text-xs">
          <h3 className="mb-2 font-medium text-slate-100">实时误差监视</h3>
          <dl className="space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-blue-200/60">当前误差 ε(t)</dt>
              <dd className={`font-semibold ${isAlarm ? 'text-amber-300' : 'text-emerald-300'}`}>
                {currentError.toFixed(1)} kW
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-blue-200/60">最大绝对误差 max|ε|</dt>
              <dd className="font-semibold text-slate-100">{maxAbsError.toFixed(1)} kW</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-blue-200/60">均方根误差 RMSE</dt>
              <dd className="font-semibold text-slate-100">{rmse.toFixed(1)} kW</dd>
            </div>
          </dl>

          <div className="mt-3 border-t border-[#1e3a5f]/60 pt-2">
            <p className="text-[11px] leading-relaxed text-blue-200/60">
              蓝色为上级下发有功目标，红色为台区关口实际功率；灰色阴影为可行运行域。切换“日前 / 日内”以查看不同时间尺度下的预测与不确定性。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AggregationTrackingPanel