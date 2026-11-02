/**
 * 「做完即继续」控制条（任务 05-阶段 6 · §3.4）。
 *
 * 放在题目详情页最底部，与渲染器解耦：它不读渲染器内部状态，而是观察进度 store。
 * 当本题有判分记录（statusOf !== 'todo'，即提交 / 自评过一次）后出现，提供：
 *   · 「下一题 →」主按钮：跳转到导航上下文顺序里的下一道题（no next 时禁用并提示）
 *   · 「连续作答」开关：开启后每通过一题自动跳下一题（存 localStorage）
 *
 * 依据：progress/store.ts 的结构 —— recordAttempt / recordBatchAttempt 会写
 * records[id].result / attempts / everPassed，statusOf(record) 据此返回
 * 'todo' | 'attempted' | 'passed'。auto-next 只在「通过」时触发，且用 ref 记住
 * 上一次状态，避免同一道题反复触发。
 */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { loadIndex } from './data/loader'
import { chapterOrderById, contextOrderByFilter, locateInOrder, readNavContext } from './nav-context'
import { statusOf, useProgress } from './progress/store'

const panel: CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg-elev)' }
const muted: CSSProperties = { color: 'var(--fg-muted)' }
const AUTO_NEXT_KEY = 'cpractice:auto-next'

export function NextProblemCTA({ id }: { id: string }) {
  const record = useProgress((s) => s.records[id])
  const status = statusOf(record)
  const [order, setOrder] = useState<string[] | null>(null)
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTO_NEXT_KEY) === '1' } catch { return false }
  })
  const prevStatus = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    loadIndex().then((index) => {
      if (!alive) return
      const ctx = readNavContext()
      const ord = ctx && ctx.order.includes(id)
        ? ctx.order
        : ctx && ctx.order.length > 0
          ? contextOrderByFilter(index, ctx)
          : chapterOrderById(index, id)
      if (alive) setOrder(ord)
    }).catch(() => { if (alive) setOrder([]) })
    return () => { alive = false }
  }, [id])

  const { next } = locateInOrder(order ?? [], id)

  // 连续作答：status 从非 passed → passed 时自动跳下一题；同一次通过只触发一次
  useEffect(() => {
    if (!autoNext || !next) return
    if (status === 'passed' && prevStatus.current !== 'passed') {
      const t = window.setTimeout(() => { window.location.hash = `#/problems/p/${next}` }, 600)
      return () => window.clearTimeout(t)
    }
  }, [status, autoNext, next])
  useEffect(() => { prevStatus.current = status }, [status])

  const toggleAuto = () => {
    const nextVal = !autoNext
    setAutoNext(nextVal)
    try { localStorage.setItem(AUTO_NEXT_KEY, nextVal ? '1' : '0') } catch { /* 静默 */ }
  }

  if (status === 'todo') return null

  return (
    <section className="rounded-xl border px-4 py-3" style={panel} data-role="next-problem" data-status={status}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">
          {status === 'passed'
            ? record?.selfAssessed
              ? '◑ 这一题已自评「答对」（无自动判分）'
              : '✅ 这一题已通过'
            : '◐ 这一题已作答（未通过 / 未判定）'}
        </span>
        <button
          type="button"
          onClick={() => { if (next) window.location.hash = `#/problems/p/${next}` }}
          disabled={!next}
          data-role="next-problem-go"
          className="rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--color-brand)', color: '#fff' }}
        >
          {next ? '下一题 →' : '已到最后一题'}
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs" style={muted}>
          <input
            type="checkbox"
            checked={autoNext}
            onChange={toggleAuto}
            data-role="auto-next-toggle"
          />
          连续作答（通过后自动跳下一题）
        </label>
      </div>
      {!next && (
        <p className="mt-1 text-xs" style={muted}>已是当前上下文里的最后一题，回列表页看看其他章节。</p>
      )}
    </section>
  )
}
