/* 一次性体检：确认「红线④ 结构化详解」在数据里真的成立。
   为什么不用 node -e：PowerShell 传参时会改写命令行里的非 ASCII 字面量，
   上一轮就因此把 4 道 code_reading 误报成「四段全缺」，而文件里其实一段不缺。
   判定标准必须落在文件里，不能落在 shell 命令行里。 */
import { readFileSync, readdirSync } from 'node:fs'

const SEGMENTS = ['【思路】', '【步骤】', '【复杂度】', '【易错点】']
const MIN_EXPLAIN = 150
const dir = 'public/data/problems'
const strip = (s) => String(s ?? '').replace(/\s+/g, '')

let total = 0
const bad = []
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'index.json' && x !== 'verification-report.json')) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  const ps = Array.isArray(j.problems) ? j.problems : Array.isArray(j) ? j : []
  for (const p of ps) {
    total += 1
    const ex = strip(p.explanation)
    const miss = SEGMENTS.filter((s) => !String(p.explanation ?? '').includes(s))
    const pits = String(p.explanation ?? '').split('【易错点】')[1] ?? ''
    const nPit = pits.split('\n').filter((l) => /^\d+\./.test(l.trim())).length
    const why = []
    if (ex.length < MIN_EXPLAIN) why.push(`详解只有 ${ex.length} 字`)
    if (miss.length) why.push(`缺 ${miss.join(' ')}`)
    if (nPit < 2) why.push(`易错点只有 ${nPit} 条`)
    if (p.type === 'complexity_analysis' && !Array.isArray(p.asks)) why.push('缺 asks')
    if (p.type === 'structure_trace' && !Array.isArray(p.traversalOrder) && !p.nodeSpec && !p.constructionResult) why.push('缺可判分内容')
    if (why.length) bad.push(`${p.id} [${p.type}] ${why.join('；')}`)
  }
}
console.log(`扫描 ${total} 道题，不合格 ${bad.length} 道`)
for (const b of bad) console.log('  ✗ ' + b)
process.exit(bad.length ? 1 : 0)
