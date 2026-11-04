/**
 * 知识卡片增量合并器（阶段2 用）。
 *
 * 为什么要有它：任务书要求「写盘即忘、不回读」。已有 30 张 DS 卡片必须原样保留，
 * 但主代理不该为了追加卡片而把整个分片读进上下文。于是：
 *   主代理只写「增量文件」（纯新增卡片，可省 id / order）→ 本脚本负责合并、编号、
 *   schema 校验、去重、计数回写。合并是幂等的：同 id 已存在则跳过并计数告警。
 *
 * 用法：
 *   node scripts/merge-knowledge.mjs tmp/knowledge-delta/ds-ch01.json [更多增量文件...]
 *   node scripts/merge-knowledge.mjs --check tmp/knowledge-delta/*.json   # 只校验不写盘
 *
 * 增量文件格式：
 *   { "shard": "ds-ch01", "cards": [ { title, section, summary, content, keyPoints,
 *      pitfalls?, examples?, tables?, complexity?, relatedProblems?, relatedViz?,
 *      relatedKnowledge?, id?, order? } ] }
 *   shard 缺省时从文件名推（ds-ch01.json → ds-ch01）。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KNOW_DIR = join(ROOT, 'public', 'data', 'knowledge')
const SCHEMA = join(ROOT, 'schema', 'Knowledge.schema.json')

const argv = process.argv.slice(2)
const checkOnly = argv.includes('--check')
const files = argv.filter((a) => !a.startsWith('--'))
if (files.length === 0) {
  console.error('用法：node scripts/merge-knowledge.mjs [--check] <增量文件...>')
  process.exit(2)
}

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(JSON.parse(readFileSync(SCHEMA, 'utf8')))

/** 分片顶层的 category / chapter 以已有分片为准 —— 章节名是 chapter-map.md 的真源，不许增量文件改写 */
function loadShard(name) {
  const p = join(KNOW_DIR, `${name}.json`)
  if (!existsSync(p)) throw new Error(`分片不存在：${p}（新章节需先手工建分片，本脚本不新建章节）`)
  return { path: p, json: JSON.parse(readFileSync(p, 'utf8')) }
}

/** 现有卡片 id 里 `ds-chNN-XX` 的最大序号，用于自动续号（已删号不复用：只往后接） */
function nextSerial(shardName, cards) {
  const re = new RegExp(`^${shardName}-(\\d+)$`)
  let max = 0
  for (const c of cards) {
    const m = re.exec(String(c.id ?? ''))
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

let totalNew = 0
let totalSkip = 0
let errors = 0
const touched = new Map()

for (const f of files) {
  const abs = resolve(f)
  if (!existsSync(abs)) { console.error(`✗ 增量文件不存在：${abs}`); errors++; continue }
  const delta = /\.(mjs|js)$/.test(abs)
    ? (await import(pathToFileURL(abs).href)).default
    : JSON.parse(readFileSync(abs, 'utf8'))
  const shardName = delta.shard ?? basename(abs).replace(/\.json$/i, '')
  if (!touched.has(shardName)) touched.set(shardName, loadShard(shardName))
  const { path: shardPath, json } = touched.get(shardName)
  const cards = Array.isArray(json.cards) ? json.cards : []
  const category = json.category ?? (shardName.startsWith('ds-') ? 'ds' : 'c')
  const chapter = json.chapter
  if (!chapter) { console.error(`✗ ${shardName} 分片没有 chapter 字段`); errors++; continue }

  let serial = nextSerial(shardName, cards)
  let maxOrder = cards.reduce((m, c) => Math.max(m, Number(c.order) || 0), 0)
  const seen = new Set(cards.map((c) => c.id))
  const incoming = Array.isArray(delta.cards) ? delta.cards : []
  let added = 0

  for (const raw of incoming) {
    const card = { ...raw }
    if (!card.id) {
      serial += 1
      card.id = `${shardName}-${String(serial).padStart(2, '0')}`
    }
    if (seen.has(card.id)) {
      console.log(`  = 跳过（id 已存在，幂等）：${card.id}`)
      totalSkip++
      continue
    }
    seen.add(card.id)
    if (!Number.isFinite(card.order)) { maxOrder += 1; card.order = maxOrder }
    card.category = category
    card.chapter = chapter
    // 任务书：关联字段无则空数组，不得省略
    card.relatedProblems = Array.isArray(card.relatedProblems) ? card.relatedProblems : []
    card.relatedViz = Array.isArray(card.relatedViz) ? card.relatedViz : []
    card.relatedKnowledge = Array.isArray(card.relatedKnowledge) ? card.relatedKnowledge : []
    if (!Array.isArray(card.pitfalls)) card.pitfalls = []
    if (!Array.isArray(card.examples)) card.examples = []

    // 字段顺序对齐现存卡片，diff 才可读
    const ordered = {
      id: card.id, title: card.title, section: card.section ?? '', summary: card.summary,
      content: card.content, keyPoints: card.keyPoints, pitfalls: card.pitfalls,
      examples: card.examples,
    }
    for (const k of ['tables', 'complexity']) if (card[k] !== undefined) ordered[k] = card[k]
    ordered.relatedProblems = card.relatedProblems
    ordered.relatedKnowledge = card.relatedKnowledge
    ordered.relatedViz = card.relatedViz
    ordered.category = category
    ordered.chapter = chapter
    ordered.order = card.order
    for (const k of Object.keys(card)) if (!(k in ordered)) ordered[k] = card[k]

    if (!validate(ordered)) {
      errors++
      console.error(`✗ ${ordered.id} schema 不通过：`)
      for (const e of validate.errors ?? []) console.error(`    ${e.instancePath || '/'} ${e.message}`)
      continue
    }
    cards.push(ordered)
    added++
  }

  if (added > 0) {
    cards.sort((a, b) => (a.order - b.order !== 0 ? a.order - b.order : a.id < b.id ? -1 : 1))
    json.cards = cards
    json.count = cards.length
    json.generated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
    if (!checkOnly) writeFileSync(shardPath, JSON.stringify(json, null, 2) + '\n', 'utf8')
  }
  // 重复计数校验（幂等铁律）
  const ids = cards.map((c) => c.id)
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i)
  if (dup.length > 0) { errors++; console.error(`✗ ${shardName} 出现重复 id：${[...new Set(dup)].join(', ')}`) }
  console.log(`${checkOnly ? '[check] ' : ''}${basename(f)} → ${shardName}.json  新增 ${added} / 跳过 ${totalSkip} / 分片现有 ${cards.length}`)
  totalNew += added
}

console.log(`\n合计新增 ${totalNew} 张 · 幂等跳过 ${totalSkip} 张 · error ${errors}`)
if (!checkOnly && totalNew > 0) console.log('下一步：npm run build:index && npm run verify:data')
process.exit(errors > 0 ? 1 : 0)
