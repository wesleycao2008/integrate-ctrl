/**
 * @file MultiObjectiveWeightsPanel.tsx
 * @description 多目标权重配置面板，支持 FAHP 自动权重与手动权重模式。
 */

import type { FC } from 'react'
import { useMemo, useState } from 'react'

/**
 * 四个目标的权重状态。
 */
interface WeightState {
  /** 经济性权重 */
  economic: number
  /** 公平性权重 */
  fairness: number
  /** 控制品质权重 */
  quality: number
  /** 设备寿命权重 */
  lifetime: number
}

/**
 * 权重配置对应的场景类型。
 */
type ScenarioType = '逆功率治理' | '电压越限' | '计划性控制'

/**
 * 权重配置模式。
 */
type WeightMode = 'auto' | 'manual'

/**
 * 归一化权重，使四个目标权重和为 1。
 */
const normalizeWeights = (weights: WeightState): WeightState => {
  const sum =
    weights.economic + weights.fairness + weights.quality + weights.lifetime
  if (sum === 0) {
    return { economic: 0.25, fairness: 0.25, quality: 0.25, lifetime: 0.25 }
  }
  return {
    economic: weights.economic / sum,
    fairness: weights.fairness / sum,
    quality: weights.quality / sum,
    lifetime: weights.lifetime / sum,
  }
}

/**
 * 模拟 FAHP 权重推荐逻辑（示意），基于预测误差与负荷率。
 */
const simulateFahpWeights = (
  forecastError: number,
  loadRatio: number,
): WeightState => {
  const errorLevel = Math.min(Math.max(forecastError, 0), 1)
  const loadLevel = Math.min(Math.max(loadRatio, 0), 1)

  // 简单启发式：误差越大越强调控制品质，负荷率越高越强调公平性。
  const economic = 0.4 - 0.2 * errorLevel
  const quality = 0.2 + 0.4 * errorLevel
  const fairness = 0.2 + 0.2 * loadLevel
  const lifetime = 0.2 + 0.2 * (1 - loadLevel)

  return normalizeWeights({ economic, fairness, quality, lifetime })
}

/**
 * MultiObjectiveWeightsPanel 组件。
 * 支持查看 / 调整 FAHP 动态权重，手动模式下可用滑块与数字输入调整，并提供场景模拟入口。
 */
const MultiObjectiveWeightsPanel: FC = () => {
  const [mode, setMode] = useState<WeightMode>('auto')
  const [scenario, setScenario] = useState<ScenarioType>('逆功率治理')
  const [weights, setWeights] = useState<WeightState>(
    normalizeWeights({
      economic: 0.35,
      fairness: 0.25,
      quality: 0.25,
      lifetime: 0.15,
    }),
  )

  const [simVisible, setSimVisible] = useState(false)
  const [simForecastError, setSimForecastError] = useState(0.2)
  const [simLoadRatio, setSimLoadRatio] = useState(0.6)

  const simResult = useMemo(
    () => simulateFahpWeights(simForecastError, simLoadRatio),
    [simForecastError, simLoadRatio],
  )

  /**
   * 更新单个权重，并重新归一化保证总和为 1。
   */
  const handleWeightChange = (key: keyof WeightState, value: number) => {
    setWeights((prev) => {
      const raw: WeightState = { ...prev, [key]: value }
      return normalizeWeights(raw)
    })
  }

  return (
    <section className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            多目标权重配置
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            支持 FAHP 自动权重与人工权重模式，用于不同调控场景及试验。权重自动保持和为 1。
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <label className="flex items-center gap-2 text-slate-400">
            场景：
            <select
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as ScenarioType)}
            >
              <option value="逆功率治理">逆功率治理</option>
              <option value="电压越限">电压越限</option>
              <option value="计划性控制">计划性控制</option>
            </select>
          </label>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">模式：</span>
            <button
              type="button"
              onClick={() => setMode('auto')}
              className={`rounded-full px-2 py-0.5 ${
                mode === 'auto'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              自动（FAHP）
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-full px-2 py-0.5 ${
                mode === 'manual'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              手动
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3 text-xs">
        {(
          [
            ['经济性 w1', 'economic'],
            ['公平性 w2', 'fairness'],
            ['控制品质 w3', 'quality'],
            ['设备寿命 w4', 'lifetime'],
          ] as const
        ).map(([label, key]) => {
          const value = weights[key]
          const percent = (value * 100).toFixed(0)
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{label}</span>
                <span className="font-mono text-slate-100">
                  {value.toFixed(2)}（{percent}%）
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  disabled={mode === 'auto'}
                  value={Math.round(value * 100)}
                  onChange={(e) =>
                    handleWeightChange(
                      key,
                      Number.parseInt(e.target.value, 10) / 100,
                    )
                  }
                  className="h-1 flex-1 cursor-pointer accent-sky-400"
                />
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={mode === 'auto'}
                  value={value.toFixed(2)}
                  onChange={(e) =>
                    handleWeightChange(
                      key,
                      Number.isNaN(Number.parseFloat(e.target.value))
                        ? 0
                        : Number.parseFloat(e.target.value),
                    )
                  }
                  className="w-16 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-right text-[11px] text-slate-100"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
        <div className="text-slate-400">
          <span>当前生效场景：</span>
          <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-slate-100">
            {scenario}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSimVisible(true)}
          className="rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-[11px] text-sky-200 hover:bg-sky-500/20"
        >
          场景模拟（FAHP 推荐权重）
        </button>
      </div>

      {simVisible && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-50">
              FAHP 场景模拟
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              输入预测误差与负荷率，预览 FAHP 推荐权重（仅示意逻辑，可与实际算法对接）。
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-slate-300">预测误差（0–1）</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={simForecastError.toFixed(2)}
                  onChange={(e) =>
                    setSimForecastError(
                      Math.min(
                        1,
                        Math.max(
                          0,
                          Number.isNaN(Number.parseFloat(e.target.value))
                            ? 0
                            : Number.parseFloat(e.target.value),
                        ),
                      ),
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-[11px] text-slate-100"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-300">负荷率（0–1）</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={simLoadRatio.toFixed(2)}
                  onChange={(e) =>
                    setSimLoadRatio(
                      Math.min(
                        1,
                        Math.max(
                          0,
                          Number.isNaN(Number.parseFloat(e.target.value))
                            ? 0
                            : Number.parseFloat(e.target.value),
                        ),
                      ),
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-[11px] text-slate-100"
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-2">
              <div className="text-[11px] text-slate-400">FAHP 推荐权重</div>
              <div className="text-right text-[11px] text-slate-400">
                （可一键应用）
              </div>
              {(
                [
                  ['经济性 w1', 'economic'],
                  ['公平性 w2', 'fairness'],
                  ['控制品质 w3', 'quality'],
                  ['设备寿命 w4', 'lifetime'],
                ] as const
              ).map(([label, key]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-[11px] text-slate-200"
                >
                  <span>{label}</span>
                  <span className="font-mono">
                    {simResult[key].toFixed(2)}（
                    {(simResult[key] * 100).toFixed(0)}%）
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800"
                onClick={() => setSimVisible(false)}
              >
                关闭
              </button>
              <button
                type="button"
                className="rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-emerald-200 hover:bg-emerald-500/25"
                onClick={() => {
                  setWeights(simResult)
                  setMode('auto')
                  setSimVisible(false)
                }}
              >
                应用为当前权重
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default MultiObjectiveWeightsPanel
