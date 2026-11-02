/**
 * 题目导航（任务 05-阶段 6 · §3.2/3.3/3.5）。
 *
 * 放在题目详情页顶部与底部各一组：
 *   · 面包屑：首页 / 在线刷题 / 第 N 章 / c-ch09-alg-108（每级可点）
 *   · 上一题 / 下一题：按「列表页上下文」顺序，无上下文退到同章 id 序；
 *     到首/尾置灰禁用并提示；顶部/底部按钮联动。
 *   · 进度：第 37 / 290 题（本章）
 *   · 复制本题链接（列表页与题目页各提供）
 *   · 键盘 ← / → 翻题（输入框聚焦时不触发）
 *   · 记录 last viewed，供首页/列表页「继续上次」
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from './data/loader'
import type { ProblemIndexEntry } from './data/loader'
import { chapterOrderById, contextOrderByFilter, contextToFilter, filterToQuery, locateInOrder, readNavContext, writeLastViewed } from './nav-context'
import { shortId } from './type-meta'

const panel: CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg-elev)' }
const muted: CSSProperties = { color: 'var(--fg-muted)' }

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // clipboard API 不可用（非 HTTPS / 权限）则退化到 execCommand
      const t = document.createElement('textarea')
      t.value = text
      document.body.appendChild(t)
      t.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(t)
      setCopied(true)
    }
    window.setTimeout(() => setCopied(false), 1200)
  }, [text])
  return (
    <button
      type="button"
      onClick={doCopy}
      data-role="copy-problem-link"
      className="rounded border px-2 py-1 text-xs no-underline"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)', color: 'var(--fg-link)', cursor: 'pointer' }}
    >
      {copied ? '✓ 已复制' : label}
    </button>
  )
}

/**
 * 上一题/下一题的导航条。props 里给当前 id 与 entry（来自 loader 的 index 条目）。
 * order 的推导：优先读列表页上下文（chapter/type/difficulty/status/q/sort），
 * 当前 id 在其中 → 按它定位；否则退到同章 id 序。
 */
export function ProblemNav({ id, position = 'bottom' }: { id: string; position?: 'top' | 'bottom' }) {
  const [state, setState] = useState<{ order: string[]; index: number; prev: string | null; next: string | null } | null>(null)

  useEffect(() => {
    let alive = true
    loadIndex()
      .then((index) => {
        if (!alive) return
        const ctx = readNavContext()
        const order =
          ctx && ctx.order.includes(id)
            ? ctx.order
            : ctx && ctx.order.length > 0
              ? contextOrderByFilter(index, ctx)
              : chapterOrderById(index, id)
        const loc = locateInOrder(order, id)
        setState({ ...loc, order })
        writeLastViewed(id)
      })
      .catch(() => {
        if (!alive) return
        // 索引都拉不到就不纠缠：不渲染导航（别让导航挡住作答主流程）
        setState(null)
      })
    return () => { alive = false }
  }, [id])

  // 键盘 ← / → 翻题：输入框/编辑器聚焦时不抢（判断 document.activeElement）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!state) return
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (typing) return
      if (e.key === 'ArrowLeft' && state.prev) {
        window.location.hash = `#/problems/p/${state.prev}`
        e.preventDefault()
      } else if (e.key === 'ArrowRight' && state.next) {
        window.location.hash = `#/problems/p/${state.next}`
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state])

  if (!state) return null
  const { prev, next, index, order } = state
  // 任务07-阶段3修复：locateInOrder 在首/尾返回 ''（空串）而非 null，
  // 旧代码 `prev === null` 永假 → 首尾按钮从不置灰、边界点击静默无反应。
  // 统一按 falsy 判断（null 与 '' 都视为「没有目标」）。
  const isFirst = !prev
  const isLast = !next
  const total = order.length
  const labelBase = '本章'

  const navButton = (disabled: boolean, target: string | null, emoji: string, label: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { if (target) window.location.hash = `#/problems/p/${target}` }}
      title={disabled ? (label.includes('上') ? '已是本章第一题，去看看上一章' : '已是本章最后一题，去看看下一章') : undefined}
      data-role={position === 'top' ? 'problem-nav-top' : 'problem-nav-bottom'}
      data-dir={label.includes('上') ? 'prev' : 'next'}
      data-disabled={disabled ? 'true' : 'false'}
      className="rounded border px-2.5 py-1 text-xs"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-elev)',
        color: 'var(--fg-link)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {emoji} {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={panel} data-role="problem-nav" data-position={position}>
      {navButton(isFirst, prev, '←', '上一题')}
      {navButton(isLast, next, '→', '下一题')}
      <span className="ml-1" style={muted} data-role="problem-nav-progress">
        第 {index + 1} / {total} 题（{labelBase}）
      </span>
      {isFirst && index === 0 && (
        <Link to="/problems" className="ml-1 hover:underline" style={{ color: 'var(--fg-link)' }} data-role="problem-nav-edge-hint">
          已是本章第一题，去看看上一章
        </Link>
      )}
      {isLast && index >= 0 && index === order.length - 1 && (
        <Link to="/problems" className="ml-1 hover:underline" style={{ color: 'var(--fg-link)' }} data-role="problem-nav-edge-hint">
          已是本章最后一题，去看看下一章
        </Link>
      )}
      <span className="ml-auto">
        <CopyButton text={`${window.location.origin}${window.location.pathname}#/problems/p/${id}`} label="复制本题链接" />
      </span>
    </div>
  )
}

/** 面包屑：首页 / 在线刷题 / 第 N 章 / c-ch09-alg-108（每级可点）。
 *  「在线刷题」用列表页导航上下文恢复当时的筛选条件（§3.3 返回不丢上下文）。 */
export function Breadcrumb({ entry }: { entry: ProblemIndexEntry }) {
  const listTo = useMemo(() => {
    const ctx = readNavContext()
    return ctx ? `/problems${filterToQuery(contextToFilter(ctx))}` : '/problems'
  }, [])
  return (
    <nav className="text-xs" style={muted} aria-label="面包屑" data-role="problem-breadcrumb">
      <Link to="/" className="hover:underline" style={{ color: 'var(--fg-link)' }}>🏠 首页</Link>
      <span className="px-1">/</span>
      <Link to={listTo} className="hover:underline" style={{ color: 'var(--fg-link)' }}>✍️ 在线刷题</Link>
      <span className="px-1">/</span>
      <Link to={`/problems?chapter=${encodeURIComponent(String(entry.chapter ?? ''))}`} className="hover:underline" style={{ color: 'var(--fg-link)' }}>
        {entry.chapter}
      </Link>
      <span className="px-1">/</span>
      <span>{shortId(entry.id)}</span>
    </nav>
  )
}
