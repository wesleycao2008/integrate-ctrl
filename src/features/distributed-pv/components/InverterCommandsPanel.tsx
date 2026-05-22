/**
 * @file InverterCommandsPanel.tsx
 * @description 逆变器指令列表与调控图面板，展示各逆变器指令值、实际出力、可用裕度及手动干预。
 */

import type { FC } from 'react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * 逆变器状态。
 */
type InverterStatus = '正常' | '通信中断' | '告警'

/**
 * 表格中展示的逆变器数据行。
 */
interface InverterRow {
  /** 逆变器 ID */
  id: string
  /** 有功指令值 (kW) */
  pCommand: number
  /** 实际有功 (kW) */
  pActual: number
  /** 可用最大有功 (kW) */
  pAvail: number
  /** 调节比例百分比 (0–100) */
  regulationRatio: number
  /** 当前状态 */
  status: InverterStatus
}

/**
 * 单个逆变器的手动干预配置。
 */
interface ManualIntervention {
  /** 干预模式：固定出力或上下限约束 */
  mode: 'fixed' | 'bounded'
  /** 固定出力值 (kW) */
  fixedPower?: number
  /** 下限 (kW) */
  lowerBound?: number
  /** 上限 (kW) */
  upperBound?: number
}

/**
 * 生成演示用逆变器数据。
 */
const createMockInverters = (): InverterRow[] => {
  const rows: InverterRow[] = []
  for (let i = 1; i <= 12; i += 1) {
    const pAvail = 50 + Math.random() * 50
    const pCommand = pAvail * (0.5 + Math.random() * 0.4)
    const pActual = pCommand * (0.9 + Math.random() * 0.2)
    const regulationRatio = ((pAvail - pActual) / pAvail) * 100
    let status: InverterStatus = '正常'
    if (Math.random() < 0.08) status = '通信中断'
    else if (Math.random() < 0.15) status = '告警'
    rows.push({
      id: `INV-${String(i).padStart(3, '0')}`,
      pCommand: Math.round(pCommand),
      pActual: Math.round(pActual),
      pAvail: Math.round(pAvail),
      regulationRatio: Math.round(regulationRatio),
      status,
    })
  }
  return rows
}

/**
 * InverterCommandsPanel 组件。
 * 表格展示逆变器指令与可用裕度，支持调节比例排序、筛选及手动干预弹窗，并提供条形图对比。
 */
const InverterCommandsPanel: FC = () => {
  const [sortDesc, setSortDesc] = useState(true)
  const [filterThreshold, setFilterThreshold] = useState(0)
  const [selectedInverter, setSelectedInverter] = useState<InverterRow | null>(
    null,
  )
  const [manualConfig, setManualConfig] = useState<ManualIntervention>({
    mode: 'fixed',
    fixedPower: 30,
  })

  const inverters = useMemo(() => createMockInverters(), [])
  const filtered = useMemo(
    () =>
      [...inverters]
        .filter((row) => row.regulationRatio >= filterThreshold)
        .sort((a, b) =>
          sortDesc
            ? b.regulationRatio - a.regulationRatio
            : a.regulationRatio - b.regulationRatio,
        ),
    [filterThreshold, inverters, sortDesc],
  )

  return (
    <section className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0f172a]/60 p-4 shadow-lg shadow-black/40">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            逆变器指令列表与调控图
          </h2>
          <p className="mt-1 text-xs text-blue-200/60">
            展示各逆变器有功指令、实际出力、可用功率与调节裕度，支持排序筛选与手动干预。
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1 text-blue-200/60">
            调节裕度筛选 ≥
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={filterThreshold}
              onChange={(e) =>
                setFilterThreshold(
                  Number.isNaN(Number.parseInt(e.target.value, 10))
                    ? 0
                    : Number.parseInt(e.target.value, 10),
                )
              }
              className="w-14 rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-1 py-0.5 text-right text-[11px] text-slate-100"
            />
            %
          </label>
          <button
            type="button"
            onClick={() => setSortDesc((v) => !v)}
            className="rounded-full border border-[#1e3a5f]/40 bg-[#0f172a] px-2 py-1 text-[11px] text-blue-200/80 hover:bg-[#1e293b]"
          >
            调节比例排序：{sortDesc ? '降序' : '升序'}
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="max-h-72 overflow-auto rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/60">
          <table className="min-w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 bg-[#0f172a]">
              <tr>
                {[
                  '逆变器 ID',
                  'P_指令 (kW)',
                  'P_实际 (kW)',
                  'P_avail (kW)',
                  '调节比例 (%)',
                  '状态',
                  '操作',
                ].map((col) => (
                  <th
                    key={col}
                    className="border-b border-[#1e3a5f]/60 px-2 py-2 text-left text-[11px] font-medium text-blue-200/80"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1e3a5f]/30 hover:bg-[#0f172a]/60"
                >
                  <td className="px-2 py-1.5 font-mono text-[11px] text-slate-100">
                    {row.id}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-slate-100">
                    {row.pCommand}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-slate-100">
                    {row.pActual}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-slate-100">
                    {row.pAvail}
                  </td>
                  <td className="px-2 py-1.5 text-[11px]">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono ${
                        row.regulationRatio >= 40
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : row.regulationRatio >= 20
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-[#1e3a5f]/30 text-blue-100/90'
                      }`}
                    >
                      {row.regulationRatio}%
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[11px]">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        row.status === '正常'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : row.status === '告警'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInverter(row)
                        setManualConfig({
                          mode: 'fixed',
                          fixedPower: row.pActual,
                          lowerBound: Math.round(row.pActual * 0.8),
                          upperBound: Math.round(row.pAvail),
                        })
                      }}
                      className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-0.5 text-cyan-200 hover:bg-cyan-500/20"
                    >
                      手动干预
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 h-full">
          <div className="flex-1 min-h-0 rounded-xl border border-[#1e3a5f]/60 bg-[#0a0e1a]/60 p-2 flex flex-col">
            <h3 className="mb-1 text-xs font-medium text-slate-100">
              指令值与实际值对比
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inverters}
                  margin={{ top: 8, left: -20, right: 10, bottom: 0 }}
                >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis
                  dataKey="id"
                  stroke="#64748b"
                  fontSize={10}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
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
                <Bar
                  dataKey="pCommand"
                  fill="#38bdf8"
                  name="P_指令"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pActual"
                  fill="#f97373"
                  name="P_实际"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-200/60">
            调节比例 = (P_avail - P_实际) / P_avail，用于评估各逆变器的可用调节裕度。
            手动干预支持临时固定出力或设置上下限，为特殊试验或现场处置提供支撑。
          </p>
        </div>
      </div>

      {selectedInverter && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[#1e3a5f]/60 bg-[#0f172a] p-4 text-xs shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-50">
              逆变器 {selectedInverter.id} 手动干预
            </h3>
            <p className="mt-1 text-[11px] text-blue-200/60">
              可暂时覆盖自动解聚合指令，用于特殊试验或故障处置。建议设置合理的时间窗和限值。
            </p>

            <div className="mt-3 flex gap-3 text-[11px]">
              <button
                type="button"
                className={`flex-1 rounded-full border px-2 py-1 ${
                  manualConfig.mode === 'fixed'
                    ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200'
                    : 'border-[#1e3a5f]/40 bg-[#0f172a] text-blue-200/80'
                }`}
                onClick={() =>
                  setManualConfig((prev) => ({ ...prev, mode: 'fixed' }))
                }
              >
                固定出力
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full border px-2 py-1 ${
                  manualConfig.mode === 'bounded'
                    ? 'border-cyan-500/70 bg-sky-500/15 text-cyan-200'
                    : 'border-[#1e3a5f]/40 bg-[#0f172a] text-blue-200/80'
                }`}
                onClick={() =>
                  setManualConfig((prev) => ({
                    ...prev,
                    mode: 'bounded',
                    lowerBound:
                      prev.lowerBound ??
                      Math.round(selectedInverter.pActual * 0.8),
                    upperBound: prev.upperBound ?? selectedInverter.pAvail,
                  }))
                }
              >
                上下限约束
              </button>
            </div>

            <div className="mt-3 space-y-2 text-[11px]">
              {manualConfig.mode === 'fixed' ? (
                <label className="space-y-1">
                  <span className="text-blue-200/80">固定出力 P_fix (kW)</span>
                  <input
                    type="number"
                    value={
                      manualConfig.fixedPower ?? selectedInverter.pActual ?? 0
                    }
                    onChange={(e) =>
                      setManualConfig((prev) => ({
                        ...prev,
                        fixedPower: Number.isNaN(
                          Number.parseFloat(e.target.value),
                        )
                          ? 0
                          : Number.parseFloat(e.target.value),
                      }))
                    }
                    className="w-full rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-2 py-1 text-right text-[11px] text-slate-100"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-blue-200/80">下限 P_min (kW)</span>
                    <input
                      type="number"
                      value={manualConfig.lowerBound ?? ''}
                      onChange={(e) =>
                        setManualConfig((prev) => ({
                          ...prev,
                          lowerBound: Number.isNaN(
                            Number.parseFloat(e.target.value),
                          )
                            ? 0
                            : Number.parseFloat(e.target.value),
                        }))
                      }
                      className="w-full rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-2 py-1 text-right text-[11px] text-slate-100"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-blue-200/80">上限 P_max (kW)</span>
                    <input
                      type="number"
                      value={manualConfig.upperBound ?? ''}
                      onChange={(e) =>
                        setManualConfig((prev) => ({
                          ...prev,
                          upperBound: Number.isNaN(
                            Number.parseFloat(e.target.value),
                          )
                            ? 0
                            : Number.parseFloat(e.target.value),
                        }))
                      }
                      className="w-full rounded border border-[#1e3a5f]/40 bg-[#0a0e1a] px-2 py-1 text-right text-[11px] text-slate-100"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-between text-[11px] text-blue-200/60">
              <span>当前 P_指令：{selectedInverter.pCommand} kW</span>
              <span>当前 P_avail：{selectedInverter.pAvail} kW</span>
            </div>

            <div className="mt-3 flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                className="rounded-full border border-[#1e3a5f]/40 bg-[#0f172a] px-3 py-1 text-blue-200/80 hover:bg-[#1e293b]"
                onClick={() => setSelectedInverter(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-emerald-200 hover:bg-emerald-500/25"
                onClick={() => {
                  // 实际系统中，此处应下发生效临时指令到逆变器。
                  setSelectedInverter(null)
                }}
              >
                应用临时指令
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default InverterCommandsPanel
