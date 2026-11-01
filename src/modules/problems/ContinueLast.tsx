/**
 * 「继续上次」入口（任务 05-阶段 6 · §3.3）。
 *
 * 读 localStorage 里最近浏览的题目 id（写于题目详情页），有就渲染一个
 * 「继续上次：<短题号>」按钮链到该题；读不到（首次访问 / 没做过题）就渲染 null。
 * 首页与题库列表页各挂一个，入口一致。
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { readLastViewed } from './nav-context'
import { shortId } from './type-meta'

export function ContinueLast() {
  const [lastId] = useState<string | null>(() => readLastViewed())
  if (!lastId) return null
  return (
    <Link
      to={`/problems/p/${lastId}`}
      data-role="continue-last"
      className="rounded-lg border px-3 py-1.5"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--fg-link)', textDecoration: 'none' }}
    >
      ⏯️ 继续上次：{shortId(lastId)}
    </Link>
  )
}
