/**
 * 知识卡片懒加载（纯静态、无后端）。口径完全对齐 problems / viz 两个 loader：
 *   knowledge/index.json（唯一索引入口，scripts/build-index.ts 生成）→ 章节分片 {file} → 单卡片。
 *
 * 索引里放的是列表页要用的字段（title / summary / keyPoints / 关联 id），
 * 正文 content、示例代码、易错点仍在分片里，由详情页按 entry.file 懒加载。
 * 新增分片重跑 build:index 即自动收录 —— 这里没有任何写死的章数或卡片 id。
 */
import { dataUrl } from '../../../app/config'

/** index.json 的卡片条目 */
export interface KnowledgeIndexEntry {
  id: string
  /** 详情页据此定位分片；不靠 id 前缀猜文件名 */
  file: string
  category: string
  chapter: string
  section: string
  order: number
  title: string
  summary: string
  keyPoints: string[]
  relatedProblems: string[]
  relatedViz: string[]
}

/**
 * 阶段 2.2：章节说明。随 index.json 下发（列表页只 fetch 索引、不碰分片）。
 * 目前只有 DS 八章写了内容；C 章节 intro/summary 为空串、keyDifficulties 为空数组，
 * 前端据此判断「这一章没有章节说明」并整块不渲染，而不是渲染一个空面板。
 */
export interface KnowledgeChapterMeta {
  file: string
  category: string
  chapter: string
  count: number
  intro: string
  keyDifficulties: string[]
  summary: string
}

export interface KnowledgeIndex {
  count: number
  shard_count?: number
  /** 章节说明；旧索引没有这个字段，所以是可选的 */
  chapters?: KnowledgeChapterMeta[]
  cards: KnowledgeIndexEntry[]
  content_sha?: string
}

/** 卡片示例（与 schema/Knowledge.schema.json 的 examples 同构） */
export interface KnowledgeExample {
  title: string
  code: string
  runnable?: boolean
  stdin?: string
  expected?: string
  note?: string
}

/** 分片里的完整卡片记录。除强类型字段外允许扩展，后续新增字段不必改这里 */
export interface KnowledgeCard {
  id: string
  title: string
  category?: string
  chapter?: string
  section?: string
  order?: number
  summary?: string
  content?: string
  keyPoints?: string[]
  pitfalls?: string[]
  examples?: KnowledgeExample[]
  relatedProblems?: string[]
  relatedKnowledge?: string[]
  relatedViz?: string[]
  [key: string]: unknown
}

export interface LoadedCard {
  entry: KnowledgeIndexEntry
  card: KnowledgeCard
}

/** 索引里没有 / 分片里查无此卡片 —— 数据不一致，不是网络故障，不该重试 */
export class KnowledgeNotFound extends Error {
  constructor(id: string, file?: string) {
    super(file ? `索引把 ${id} 指向 ${file}，但该分片里没有这张卡片` : `知识卡片索引里没有 ${id}`)
    this.name = 'KnowledgeNotFound'
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`数据文件加载失败：${url}（HTTP ${res.status}）`)
  return (await res.json()) as T
}

let indexPromise: Promise<KnowledgeIndex> | null = null
const shardCache = new Map<string, Promise<KnowledgeCard[]>>()

/** 单飞：并发调用只发一次请求；失败后清掉缓存，下次点击可以重试 */
export function loadKnowledgeIndex(): Promise<KnowledgeIndex> {
  if (!indexPromise) {
    indexPromise = getJson<KnowledgeIndex>(dataUrl('knowledge/index.json')).catch((error: unknown) => {
      indexPromise = null
      throw error
    })
  }
  return indexPromise
}

export function loadKnowledgeShard(file: string): Promise<KnowledgeCard[]> {
  let pending = shardCache.get(file)
  if (!pending) {
    pending = getJson<{ cards: KnowledgeCard[] }>(dataUrl(`knowledge/${file}`))
      .then((json) => (Array.isArray(json.cards) ? json.cards : []))
      .catch((error: unknown) => {
        shardCache.delete(file)
        throw error
      })
    shardCache.set(file, pending)
  }
  return pending
}

export async function loadCard(id: string): Promise<LoadedCard> {
  const index = await loadKnowledgeIndex()
  const entry = index.cards.find((c) => c.id === id)
  if (!entry) throw new KnowledgeNotFound(id)
  const cards = await loadKnowledgeShard(entry.file)
  const card = cards.find((c) => c.id === id)
  if (!card) throw new KnowledgeNotFound(id, entry.file)
  return { entry, card }
}

/** 章节分组键：category 必须进键 —— c 与 ds 各自都有「第6章」，只按章名分会把两门课揉在一起 */
export const chapterKey = (category: string, chapter: string): string => `${category}|${chapter}`

export interface ChapterGroup {
  key: string
  category: string
  chapter: string
  items: KnowledgeIndexEntry[]
}

/** 列表页用：按 category + chapter 聚合，保持索引里的出现顺序，章内按 order 再按 id */
export function groupByChapter(index: KnowledgeIndex): ChapterGroup[] {
  const order: string[] = []
  const map = new Map<string, ChapterGroup>()
  for (const item of index.cards) {
    const key = chapterKey(item.category, item.chapter)
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { key, category: item.category, chapter: item.chapter, items: [] }
      map.set(key, bucket)
      order.push(key)
    }
    bucket.items.push(item)
  }
  for (const g of map.values()) {
    g.items.sort((a, b) => (a.order - b.order !== 0 ? a.order - b.order : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  }
  return order.map((key) => map.get(key) as ChapterGroup)
}

/**
 * 阶段 2.2：按 chapterKey 取章节说明。
 * 返回 undefined 的两种情况都要「整块不渲染」而不是渲染一个空壳面板：
 *   · 索引是旧版（没有 chapters 字段，比如构建产物没更新）
 *   · 这一章没写说明（目前只有 DS 八章写了，C 的 13 章三字段全空）
 */
export function chapterMeta(index: KnowledgeIndex, key: string): KnowledgeChapterMeta | undefined {
  if (!Array.isArray(index.chapters)) return undefined
  const meta = index.chapters.find((c) => chapterKey(c.category, c.chapter) === key)
  if (!meta) return undefined
  const hasContent =
    meta.intro.length > 0 || meta.summary.length > 0 || (meta.keyDifficulties?.length ?? 0) > 0
  return hasContent ? meta : undefined
}

/**
 * 阶段 2.2 的「知识点清单」：由卡片现算派生，不另存一份。
 * 这样「与卡片一一对应」是构造性成立的 —— 加一张卡、改一个标题，清单立刻跟着变，永远不会漂移。
 * 按 section 分组（同节的卡片聚在一起），组内沿用 groupByChapter 已经排好的 order。
 */
export interface TopicSection {
  section: string
  items: KnowledgeIndexEntry[]
}

export function topicsOfChapter(group: ChapterGroup): TopicSection[] {
  const order: string[] = []
  const map = new Map<string, KnowledgeIndexEntry[]>()
  for (const item of group.items) {
    const key = item.section.length > 0 ? item.section : '（未标小节）'
    let bucket = map.get(key)
    if (!bucket) {
      bucket = []
      map.set(key, bucket)
      order.push(key)
    }
    bucket.push(item)
  }
  return order.map((section) => ({ section, items: map.get(section) as KnowledgeIndexEntry[] }))
}

/** id → 条目。关联字段里存的是裸 id，标题要靠这张表解析（缺失就当没有，不报错） */
export function cardMap(index: KnowledgeIndex): Map<string, KnowledgeIndexEntry> {
  return new Map(index.cards.map((c) => [c.id, c] as const))
}

/** 反向索引：题目 id → 引用它的卡片。relatedProblems 是卡片侧单向写的，题目侧没有 knowledgeIds */
export function cardsByProblem(index: KnowledgeIndex): Map<string, KnowledgeIndexEntry[]> {
  const map = new Map<string, KnowledgeIndexEntry[]>()
  for (const card of index.cards) {
    for (const pid of card.relatedProblems) {
      const bucket = map.get(pid)
      if (bucket) bucket.push(card)
      else map.set(pid, [card])
    }
  }
  return map
}

/** 反向索引：演示 id → 引用它的卡片（backfill:viz 回填的 relatedViz） */
export function cardsByViz(index: KnowledgeIndex): Map<string, KnowledgeIndexEntry[]> {
  const map = new Map<string, KnowledgeIndexEntry[]>()
  for (const card of index.cards) {
    for (const vid of card.relatedViz) {
      const bucket = map.get(vid)
      if (bucket) bucket.push(card)
      else map.set(vid, [card])
    }
  }
  return map
}

export const categoryLabel = (category: string): string =>
  category === 'c' ? 'C 语言' : category === 'ds' ? '数据结构' : category || '未分类'
