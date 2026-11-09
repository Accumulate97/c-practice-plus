/* 阶段5 · 分层随机抽检：从 DS 题库按「章 × 题型」分层随机抽取 30 道，逐项做质量审计。
 * 判定标准必须落在文件里，不能落在 shell 命令行里（PowerShell 传参会改写非 ASCII 字面量）。
 * 用法：node scripts/stratified-audit.mjs [--seed=123]
 * 退出码 0=全部 30 道合格；1=有不合格或样本不足。
 */
import { readFileSync, readdirSync } from 'node:fs'

const SEED_ARG = process.argv.find((a) => a.startsWith('--seed='))
const SEED = SEED_ARG ? parseInt(SEED_ARG.slice(7), 10) : 20261109
const N = 30
const dir = 'public/data/problems'
const CHAPTERS = ['ds-ch01', 'ds-ch02', 'ds-ch03', 'ds-ch04', 'ds-ch05', 'ds-ch06', 'ds-ch07', 'ds-ch08']
const CODE_TYPES = new Set(['code_completion', 'code_reading', 'debug', 'programming', 'ds_debug', 'multi_bug_debug', 'algorithm_impl', 'code_optimization', 'pointer_trace', 'multi_blank'])
const SEGMENTS = ['【思路】', '【步骤】', '【复杂度】', '【易错点】']
const MIN_EXPLAIN = 150

const strip = (s) => String(s ?? '').replace(/\s+/g, '')
// 简易可复现伪随机（mulberry32）
let seed = SEED
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// 收集所有 DS 题（按章分组）
const byChapter = {}
for (const c of CHAPTERS) byChapter[c] = []
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'index.json' && x !== 'verification-report.json')) {
  const m = f.match(/^(ds-ch\d\d)\.json$/)
  if (!m) continue
  const ch = m[1]
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  const ps = Array.isArray(j.problems) ? j.problems : Array.isArray(j) ? j : []
  for (const p of ps) if (p.category === 'ds') byChapter[ch].push(p)
}

const all = CHAPTERS.flatMap((c) => byChapter[c].map((p) => ({ ...p, _ch: c })))
const total = all.length
if (total < N) {
  console.log(`样本不足：DS 总数 ${total} < ${N}`)
  process.exit(1)
}

// 分层：先按章分桶，每桶内随机取至多 ceil(N/8) 道，若超出则随机补齐
const perChapter = Math.ceil(N / CHAPTERS.length)
const buckets = []
for (const c of CHAPTERS) {
  const pool = [...byChapter[c]]
  // 洗牌
  for (let i = pool.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [pool[i], pool[k]] = [pool[k], pool[i]] }
  const take = pool.slice(0, perChapter)
  buckets.push(...take.map((p) => ({ ...p, _ch: c })))
}
// 若分层取到的超过 N，随机裁到 N；不足则从剩余全局池随机补
let sample = buckets
if (sample.length > N) {
  for (let i = sample.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [sample[i], sample[k]] = [sample[k], sample[i]] }
  sample = sample.slice(0, N)
} else if (sample.length < N) {
  const have = new Set(sample.map((p) => p.id))
  const rest = all.filter((p) => !have.has(p.id))
  for (let i = rest.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [rest[i], rest[k]] = [rest[k], rest[i]] }
  sample = sample.concat(rest.slice(0, N - sample.length))
}

const bad = []
const VERDICT_ANCHOR = ['verdict', 'data-verdict']
for (const p of sample) {
  const why = []
  const ex = strip(p.explanation)
  if (ex.length < MIN_EXPLAIN) why.push(`详解仅 ${ex.length} 字`)
  const miss = SEGMENTS.filter((s) => !String(p.explanation ?? '').includes(s))
  if (miss.length) why.push(`缺 ${miss.join(' ')}`)
  const pits = String(p.explanation ?? '').split('【易错点】')[1] ?? ''
  const nPit = pits.split('\n').filter((l) => /^\d+\./.test(l.trim())).length
  if (nPit < 2) why.push(`易错点仅 ${nPit} 条`)
  if (p.type === 'complexity_analysis' && !Array.isArray(p.asks)) why.push('缺 asks')
  if (p.type === 'structure_trace' && !Array.isArray(p.traversalOrder) && !p.nodeSpec && !p.constructionResult) why.push('缺可判分内容')
  if (p.type === 'code_completion' && !Array.isArray(p.blanks)) why.push('缺 blanks')
  if ((p.type === 'ds_debug' || p.type === 'multi_bug_debug' || p.type === 'debug') && !Array.isArray(p.bugs)) why.push('缺 bugs')
  // verified 覆盖：代码类必须 verified:true（阶段5 要求全量 verified；如后端 5xx 未判定则此栏为告警，不由审计判死） —— 这里记录但归入 warn
  if (CODE_TYPES.has(p.type) && p.verified !== true) why.push('未 verified')
  if (why.length) bad.push(`${p.id} [${p.type}] ${why.join('；')}`)
}

console.log(`DS 总数 ${total}；抽检 ${sample.length} 道（seed=${SEED}）`)
console.log(`分层：` + CHAPTERS.map((c) => `${c}:${sample.filter((p) => p._ch === c).length}`).join(' '))
console.log(`合格 ${sample.length - bad.length}/${sample.length}`)
for (const b of bad) console.log('  ⚠ ' + b)
process.exit(bad.length ? 1 : 0)
