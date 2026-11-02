/**
 * 题目导航上下文（任务 05-阶段 6 · §3.2/3.3）。
 *
 * 需求：题目详情页的「上一题 / 下一题」要跟「当前列表上下文」一致 ——
 *   学生从 /#/problems?type=code_completion&chapter=c-ch09 点进某道题，上一题/下一题
 *   也应当只在这一筛选题集里走；直接从深链 /#/problems/p/:id 进来（无上下文）时，
 *   则退到「同章（分片）内按 id 顺序」。
 *
 * 实现：
 *   · 列表页每次带着筛选条件点进题目时，把「当前筛选参数 + 当页筛选出的题目 id 序」
 *     snapshot 到 localStorage（cpractice:problems:nav-ctx）。
 *   · 详情页据此还原上下文序；找不到上下文（或当前题不在上下文里）就退化到同章 id 序。
 *   · 只存 last view（一题一份），所以「上一题」链进又链出后上下文保持稳定；
 *     返回列表时用这份 ctx 恢复筛选条件（§3.3 返回不丢上下文）。
 *
 * 纯静态 / 无后端：全在 localStorage。读不到 / 解析失败一律回退到 undefined，绝不抛错。
 */
import type { ProblemIndex, ProblemIndexEntry } from './data/loader'
import { shardKey } from './type-meta'

export interface NavContext {
  /** 列表页的筛选参数（与 URL query 同口径，缺省为空串） */
  chapter: string
  type: string
  difficulty: string
  status: string
  q: string
  sort: string
  /** 任务07-阶段3：标签筛选（列表 URL ?tag=，同口径进上下文） */
  tag: string
  /** 任务07-阶段3：页码/每页条数也进上下文 —— 返回列表时连翻页状态一起恢复（缺省为空串=第1页/默认条数） */
  page: string
  size: string
  /** 当时的筛选结果（已按 sort 排序）的题目 id 序列，用于上一题/下一题定位 */
  order: string[]
  /** 触发 snapshot 的当前题 id */
  from: string
}

const STORAGE_KEY = 'cpractice:problems:nav-ctx'

/** 最近浏览的题目 id（§3.3：首页 / 题库页「继续上次」入口）。单独一把键，避免与筛选上下文耦合。 */
export const LAST_VIEWED_KEY = 'cpractice:problems:last-viewed'

export function writeLastViewed(id: string): void {
  try {
    localStorage.setItem(LAST_VIEWED_KEY, id)
  } catch {
    /* 静默 */
  }
}

export function readLastViewed(): string | null {
  try {
    return localStorage.getItem(LAST_VIEWED_KEY)
  } catch {
    return null
  }
}

export function readNavContext(): NavContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as Partial<NavContext>
    if (!Array.isArray(o.order)) return null
    return {
      chapter: typeof o.chapter === 'string' ? o.chapter : '',
      type: typeof o.type === 'string' ? o.type : '',
      difficulty: typeof o.difficulty === 'string' ? o.difficulty : '',
      status: typeof o.status === 'string' ? o.status : '',
      q: typeof o.q === 'string' ? o.q : '',
      sort: typeof o.sort === 'string' ? o.sort : 'default',
      tag: typeof o.tag === 'string' ? o.tag : '',
      page: typeof o.page === 'string' ? o.page : '',
      size: typeof o.size === 'string' ? o.size : '',
      order: o.order,
      from: typeof o.from === 'string' ? o.from : '',
    }
  } catch {
    return null
  }
}

export function writeNavContext(ctx: NavContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx))
  } catch {
    /* localStorage 不可用则静默：导航上下文是锦上添花，不挡主流程 */
  }
}

export interface NavFilter {
  chapter: string
  type: string
  difficulty: string
  status: string
  q: string
  sort: string
  tag: string
  page: string
  size: string
}

/**
 * 把一组筛选参数还原成列表页的 URL query（§3.3：从详情页返回列表时恢复筛选条件）。
 * 空串一律剔除，避免 URL 里挂着 ?chapter=&type= 这类噪音。
 * page='1'/size='50' 是列表页默认值，同样剔除（与 ProblemListPage 的 DEFAULT_PAGE_SIZE/PAGE_SIZES 同口径）。
 */
export function filterToQuery(f: NavFilter): string {
  const p = new URLSearchParams()
  if (f.chapter) p.set('chapter', f.chapter)
  if (f.type) p.set('type', f.type)
  if (f.difficulty) p.set('difficulty', f.difficulty)
  if (f.status) p.set('status', f.status)
  if (f.q) p.set('q', f.q)
  if (f.tag) p.set('tag', f.tag)
  if (f.sort && f.sort !== 'default') p.set('sort', f.sort)
  if (f.page && f.page !== '1') p.set('page', f.page)
  if (f.size && f.size !== '50') p.set('size', f.size)
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

export function contextToFilter(ctx: NavContext): NavFilter {
  return {
    chapter: ctx.chapter,
    type: ctx.type,
    difficulty: ctx.difficulty,
    status: ctx.status,
    q: ctx.q,
    sort: ctx.sort,
    tag: ctx.tag,
    page: ctx.page,
    size: ctx.size,
  }
}

/** 列表页 filter entry 的筛选逻辑（与 ProblemListPage 同口径） */
function narrow(index: ProblemIndex, f: NavFilter): ProblemIndexEntry[] {
  let arr = index.problems.filter(
    (p) =>
      (f.chapter.length === 0 || shardKey(p.file) === f.chapter) &&
      (f.type.length === 0 || p.type === f.type) &&
      (f.difficulty.length === 0 || String(p.difficulty) === f.difficulty) &&
      (f.tag.length === 0 || (p.tags ?? []).includes(f.tag)),
  )
  const terms = f.q.toLowerCase().split(/\s+/).filter((t) => t.length > 0)
  if (terms.length > 0) {
    const hay = (p: ProblemIndexEntry) =>
      [p.id, p.title, p.section, p.chapter, p.type, ...(p.tags ?? [])].join(' ').toLowerCase()
    arr = arr.filter((p) => terms.every((t) => hay(p).includes(t)))
  }
  // 排序只支持到列表页的 default / index / diff-asc / diff-desc；q 用于列表，这里排序按列表页口径
  return arr
}

function sortEntries(index: ProblemIndex, arr: ProblemIndexEntry[], sort: string): ProblemIndexEntry[] {
  if (sort === 'diff-asc') return [...arr].sort((a, b) => a.difficulty - b.difficulty)
  if (sort === 'diff-desc') return [...arr].sort((a, b) => b.difficulty - a.difficulty)
  const chapterOrder = new Map(index.shards.map((s, i) => [shardKey(s.file), i] as const))
  if (sort === 'default') {
    return [...arr].sort((a, b) => {
      const c = (chapterOrder.get(shardKey(a.file)) ?? Number.MAX_SAFE_INTEGER) - (chapterOrder.get(shardKey(b.file)) ?? Number.MAX_SAFE_INTEGER)
      if (c !== 0) return c
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    })
  }
  return arr // 'index' 原序
}

/** 按某组筛选参数还原上下文 id 序（供详情页上一题/下一题使用） */
export function contextOrderByFilter(index: ProblemIndex, f: NavFilter): string[] {
  return sortEntries(index, narrow(index, f), f.sort).map((p) => p.id)
}

/** 无上下文时的退化序：同章（分片）内按 id 升序 */
export function chapterOrderById(index: ProblemIndex, id: string): string[] {
  const entry = index.problems.find((p) => p.id === id)
  if (!entry) return []
  const file = entry.file
  return index.problems
    .filter((p) => p.file === file)
    .map((p) => p.id)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * 计算当前 id 在上下文中的位置。
 * 返回 { order, index, prev, next }；index 表示当前题在 order 中的下标（-1 = 不在其中）。
 */
export function locateInOrder(order: string[], id: string): { index: number; prev: string; next: string } {
  const index = order.indexOf(id)
  if (index < 0) return { index: -1, prev: '', next: '' }
  return {
    index,
    prev: index > 0 ? (order[index - 1] ?? '') : '',
    next: index < order.length - 1 ? (order[index + 1] ?? '') : '',
  }
}
