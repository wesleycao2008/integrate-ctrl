/**
 * @file LSTMCorrectionPanel.tsx
 * @description LSTM 前馈修正监控面板，展示误差对比与补偿系数 γ。
 */

import type { FC } from 'react'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * LSTM 模型健康度。
 */
type ModelHealth = 'normal' | 'retrain' | 'failed'

/**
 * 最近若干周期的误差样本。
 */
interface ErrorSample {
  /** 周期标签 */
  cycle: string
  /** 实际误差 (kW) */
  actualError: number
  /** 模型预测误差 (kW) */
  predictedError: number
}

/**
 * 每个逆变器的平均补偿系数 γ。
 */
interface GammaRow {
  /** 逆变器 ID */
  id: string
  /** 平均补偿系数 γ */
  gamma: number
}

/**
 * 生成最近 10 个周期的误差样本（示意）。
 */
const createMockErrorSamples = (): ErrorSample[] => {
  const samples: ErrorSample[] = []
  for (let i = 1; i <= 10; i += 1) {
    const actual = (Math.random() - 0.5) * 80
    const predicted = actual * (0.8 + Math.random() * 0.3)
    samples.push({
      cycle: `T-${10 - i}`,
      actualError: Number(actual.toFixed(1)),
      predictedError: Number(predicted.toFixed(1)),
    })
  }
  return samples
}

/**
 * 生成若干逆变器的 γ 值（示意）。
 */
const createMockGammas = (): GammaRow[] => {
  const rows: GammaRow[] = []
  for (let i = 1; i <= 8; i += 1) {
    const gamma = 0.2 + Math.random() * 0.6
    rows.push({
      id: `INV-${String(i).padStart(3, '0')}`,
      gamma: Number(gamma.toFixed(2)),
    })
  }
  return rows
}

/**
 * 将模型健康状态映射为颜色类名。
 */
const healthToColor = (health: ModelHealth): string => {
  if (health === 'normal') return 'bg-emerald-500'
  if (health === 'retrain') return 'bg-amber-400'
  return 'bg-rose-500'
}

/**
 * LSTMCorrectionPanel 组件。
 * 展示 LSTM 预测误差与实际误差曲线，以及各逆变器平均补偿系数 γ 表。
 */
const LSTMCorrectionPanel: FC = () => {
  const samples = useMemo(() => createMockErrorSamples(), [])
  const gammas = useMemo(() => createMockGammas(), [])
  const modelHealth: ModelHealth = 'normal'
  const lastTrainTime = '2026-05-18 02:30:00'

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            LSTM 前馈修正监控
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            展示模型预测误差曲线与实际误差对比，以及各逆变器平均补偿系数 γ。
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">模型健康度：</span>
            <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5">
              <span
                className={`h-2 w-2 rounded-full ${healthToColor(
                  modelHealth,
                )}`}
              />
              <span className="text-slate-100">
                {modelHealth === 'normal'
                  ? '正常'
                  : modelHealth === 'retrain'
                  ? '需重新训练'
                  : '失效'}
              </span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            最后训练时间：{lastTrainTime}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="h-52 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
          <h3 className="mb-1 text-xs font-medium text-slate-100">
            过去 10 个周期误差对比
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={samples}
              margin={{ top: 10, left: 0, right: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="cycle" stroke="#9ca3af" fontSize={11} />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                label={{
                  value: '误差 (kW)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9ca3af',
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#1f2937',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="actualError"
                stroke="#f97373"
                strokeWidth={2}
                dot={{ r: 2 }}
                name="实际误差"
              />
              <Line
                type="monotone"
                dataKey="predictedError"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
                name="模型预测误差"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-100">
              逆变器平均补偿系数 γ
            </div>
            <div className="max-h-40 overflow-auto text-xs">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                      逆变器 ID
                    </th>
                    <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                      γ
                    </th>
                    <th className="border-b border-slate-800 px-2 py-1 text-left text-[11px] font-medium text-slate-300">
                      强度
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gammas.map((row) => {
                    let level = '低'
                    let colorClass = 'bg-emerald-500/10 text-emerald-200'
                    if (row.gamma >= 0.6 && row.gamma < 0.8) {
                      level = '中'
                      colorClass = 'bg-amber-500/10 text-amber-200'
                    } else if (row.gamma >= 0.8) {
                      level = '高'
                      colorClass = 'bg-rose-500/10 text-rose-200'
                    }
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-800/60"
                      >
                        <td className="px-2 py-1.5 font-mono text-[11px] text-slate-100">
                          {row.id}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-slate-100">
                          {row.gamma.toFixed(2)}
                        </td>
                        <td className="px-2 py-1.5 text-[11px]">
                          <span
                            className={`rounded-full px-2 py-0.5 ${colorClass}`}
                          >
                            {level}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            γ 表示指令前馈修正强度，值越大表示模型对预测误差越敏感。建议在 γ
            持续偏高且健康度为“需重新训练”时，触发模型重训流程。
          </p>
        </div>
      </div>
    </section>
  )
}

export default LSTMCorrectionPanel
