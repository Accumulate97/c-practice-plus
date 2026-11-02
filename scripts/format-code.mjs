/**
 * 任务07 阶段2 · 全库代码排版格式化（数据层）。
 *
 * 范围（提示词§一「对所有 UI 实际渲染的代码承载字段统一格式化」+ B 项映射结论）：
 *   · 完整程序字段：code / solution / reference / fixed_code / code_starter
 *   · stem 内嵌 ``` 围栏代码（786 题含围栏；渲染层已会切分展示，数据同步格式化）
 *   · 不碰：blanks[].answer（判分等价串）、lines[]（排序题碎片）、answer（stdout 文本，非 C 源码）、
 *     options/pairs/bugs/keyPoints/reviewPoints/reference_answer（散文）、testCases（IO 数据）
 *
 * 安全网（格式化只改排版不改语义，三重防护）：
 *   1. token 签名比对：自写 C 词法切分（字符串/字符常量按原文、注释按归一文本、空白丢弃），
 *      格式化前后签名不一致 → 该字段回退并记录，绝不落盘；
 *   2. /*__BLANK_n__*​/ 占位符序列（有序）前后必须一致；
 *   3. 改动过的 solution/reference/fixed_code（判分参考解）用 gcc 8.1 双跑：
 *      原题代码与格式化代码分别编译，逐组 testCases 喂相同 stdin 比对 stdout，
 *      任何不一致 → 回退该字段并记录。
 *
 * 行号引用保护（文本写死「第N行」的题，排版重排会让行号漂移）：
 *   · debug / multi_bug_debug：bugs[]/stem/explanation 任一含「第N行」→ 整题跳过（提示阶梯依赖行号）；
 *   · 其它题型：stem 含「第N行」→ 整题跳过；仅 explanation 含 → 照常格式化，
 *     但 id 记入 tmp/format-line-ref-ids.json（阶段3 重写详解时按格式化后的代码复核行号）。
 *
 * 断点续跑与提交节奏：
 *   · checkpoint：tmp/format-code-checkpoint.json（按分片记 done，--resume 跳过）；
 *   · 每处理满 100 题写盘一次分片并 git commit（--no-commit 可关）；
 *   · 报告：tmp/format-code-report.json（改动/回退/跳过/gcc 对照全量明细）。
 *
 * 用法：
 *   node scripts/format-code.mjs --dry                 只报告不落盘不提交
 *   node scripts/format-code.mjs --shard=c-ch05.json   只处理一个分片
 *   node scripts/format-code.mjs --resume              跳过 checkpoint 里已完成的分片
 *   node scripts/format-code.mjs --no-gcc              跳过 gcc 双跑（不推荐）
 *   node scripts/format-code.mjs                       全库执行（写盘+分段提交）
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DATA = join(ROOT, 'public', 'data', 'problems')
const CF_BIN = join(ROOT, 'node_modules', 'clang-format', 'bin', 'win32', 'clang-format.exe')
const CHECKPOINT = join(ROOT, 'tmp', 'format-code-checkpoint.json')
const REPORT = join(ROOT, 'tmp', 'format-code-report.json')
const LINE_REF_OUT = join(ROOT, 'tmp', 'format-line-ref-ids.json')
const GCC_DIR = join(ROOT, 'tmp', 'gccchk')
const CHUNK = 100
const NON_SHARD = new Set(['index.json', 'verification-report.json'])
const isShardName = (n) => n.endsWith('.json') && !n.startsWith('_') && !NON_SHARD.has(n)

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const RESUME = args.includes('--resume')
const NO_GCC = args.includes('--no-gcc')
const NO_COMMIT = args.includes('--no-commit')
const shardArg = (args.find((a) => a.startsWith('--shard=')) ?? '').slice('--shard='.length)

/* ═══════════════ C 词法签名（共用模块，见 scripts/lib/c-tokens.mjs） ═══════════════ */

import { tokenSig, markers, cnCount } from './lib/c-tokens.mjs'

/* ═══════════════ clang-format 封装 ═══════════════ */

function clangFormat(code) {
  const r = spawnSync(CF_BIN, ['--style=file', '--assume-filename=fmt.c'], {
    input: code,
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (r.status !== 0) throw new Error('clang-format failed: ' + String(r.stderr ?? r.error ?? '').slice(0, 300))
  let out = r.stdout ?? ''
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1)
  return out
}

/** 保持原字段的末尾换行约定（数据里 code 字段一律不带尾换行；stem 围栏内容带） */
function matchTrailing(formatted, original) {
  if (original.endsWith('\n')) return formatted.replace(/\n*$/, '\n')
  return formatted.replace(/\n+$/, '')
}

/* ═══════════════ gcc 双跑语义对照 ═══════════════ */

function gccCompare(id, field, origCode, newCode, testCases, stats, reverts) {
  if (NO_GCC) return true
  if (!Array.isArray(testCases) || testCases.length === 0) return true
  mkdirSync(GCC_DIR, { recursive: true })
  const safe = id.replace(/[^a-z0-9]/gi, '_')
  const srcO = join(GCC_DIR, safe + '_o.c')
  const srcN = join(GCC_DIR, safe + '_n.c')
  const exeO = join(GCC_DIR, safe + '_o.exe')
  const exeN = join(GCC_DIR, safe + '_n.exe')
  const cleanup = () => { for (const f of [srcO, srcN, exeO, exeN]) try { unlinkSync(f) } catch { /* 忽略 */ } }
  try {
    writeFileSync(srcO, origCode, 'utf8')
    writeFileSync(srcN, newCode, 'utf8')
    const co = spawnSync('gcc', ['-std=c99', '-w', '-o', exeO, srcO], { encoding: 'utf8', timeout: 60000 })
    if (co.status !== 0) { stats.gccOrigFail += 1; cleanup(); return true } // 原代码本就编译不过：无从对照，token 签名兜底
    const cn = spawnSync('gcc', ['-std=c99', '-w', '-o', exeN, srcN], { encoding: 'utf8', timeout: 60000 })
    if (cn.status !== 0) {
      stats.gccNewFail += 1
      reverts.push({ id, field, reason: 'gcc: 格式化后编译失败' })
      cleanup(); return false
    }
    for (const tc of testCases) {
      const stdin = typeof tc?.stdin === 'string' ? tc.stdin : ''
      // cwd 必须落在 tmp/gccchk：文件 I/O 题（fopen 写 stu.dat 之类）会在 cwd 产生杂物，
      // 首跑没设 cwd 把 ~40 个 .dat/.txt 拉在了仓库根目录（已清理）。
      const ro = spawnSync(exeO, [], { input: stdin, encoding: 'utf8', timeout: 10000, cwd: GCC_DIR })
      const rn = spawnSync(exeN, [], { input: stdin, encoding: 'utf8', timeout: 10000, cwd: GCC_DIR })
      stats.gccCases += 1
      if (ro.stdout !== rn.stdout) {
        stats.gccMismatch += 1
        reverts.push({ id, field, reason: 'gcc: stdout 不一致 stdin=' + JSON.stringify(stdin.slice(0, 30)) })
        cleanup(); return false
      }
    }
    cleanup()
    return true
  } catch (e) {
    stats.gccError += 1
    cleanup()
    return true // 对照本身出错不阻断（token 签名已兜底），如实计数
  }
}

/* ═══════════════ stem 围栏 ═══════════════ */

const FENCE_RE = /```([^\n`]*)\n?([\s\S]*?)(?:```|$)/g
const C_HINT = /#include|\bint\b|\bvoid\b|\bchar\b|\bfloat\b|\bdouble\b|\bstruct\b|printf|scanf|\bfor\b|\bwhile\b|\breturn\b|\bif\b/

function looksLikeC(s) {
  return C_HINT.test(s) && !s.includes('【')
}

/** 索引法：逐围栏定位 body 的 [start,end)，格式化后原位替换，其余字节（围栏标记/lang 行/正文）不动 */
function rebuildFences(stem, id, reverts, reportChanged) {
  let out = ''
  let last = 0
  let changed = 0
  FENCE_RE.lastIndex = 0
  for (const m of stem.matchAll(FENCE_RE)) {
    const at = m.index ?? 0
    const lang = m[1] ?? ''
    const body = m[2] ?? ''
    // body 起点 = ``` + lang + 可选换行（与 FENCE_RE 的 `\n?` 同口径）
    let bodyStart = at + 3 + lang.length
    if (stem[bodyStart] === '\n') bodyStart += 1
    out += stem.slice(last, bodyStart)
    last = bodyStart + body.length
    if (body.trim().length === 0 || !looksLikeC(body)) { out += body; continue }
    let formatted
    try { formatted = clangFormat(body) } catch { reverts.push({ id, field: 'stem-fence', reason: 'clang-format 失败' }); out += body; continue }
    formatted = matchTrailing(formatted, body)
    if (tokenSig(formatted) !== tokenSig(body) || markers(formatted) !== markers(body) || cnCount(formatted) !== cnCount(body)) {
      reverts.push({ id, field: 'stem-fence', reason: 'token 签名不一致' })
      out += body
      continue
    }
    if (formatted !== body) changed += 1
    out += formatted
  }
  out += stem.slice(last)
  reportChanged(changed)
  return out
}

/* ═══════════════ 单题处理 ═══════════════ */

const CODE_FIELDS = ['code', 'solution', 'reference', 'fixed_code', 'code_starter']
const GCC_FIELDS = new Set(['solution', 'reference', 'fixed_code'])
const LINE_REF = /第\s*[0-9]+\s*行/

function problemLineRefSkip(p) {
  const isDebug = p.type === 'debug' || p.type === 'multi_bug_debug'
  if (isDebug) {
    const texts = [p.stem, p.explanation, ...(Array.isArray(p.bugs) ? p.bugs : [])]
    if (texts.some((t) => typeof t === 'string' && LINE_REF.test(t))) return 'debug 题文本含行号引用（提示阶梯依赖）'
  }
  if (typeof p.stem === 'string' && LINE_REF.test(p.stem)) return 'stem 含行号引用'
  return null
}

function formatProblem(p, stats, reverts, lineRefIds) {
  const skip = problemLineRefSkip(p)
  if (skip) { stats.skippedLineRef += 1; reverts.push({ id: p.id, field: '*', reason: '跳过：' + skip, skip: true }); return false }
  if (typeof p.explanation === 'string' && LINE_REF.test(p.explanation)) lineRefIds.add(p.id)

  let touched = false
  for (const f of CODE_FIELDS) {
    const v = p[f]
    if (typeof v !== 'string' || v.trim().length === 0) continue
    let formatted
    try { formatted = clangFormat(v) } catch (e) { reverts.push({ id: p.id, field: f, reason: 'clang-format 失败: ' + String(e.message).slice(0, 80) }); continue }
    formatted = matchTrailing(formatted, v)
    if (formatted === v) continue
    if (tokenSig(formatted) !== tokenSig(v)) { stats.sigFail += 1; reverts.push({ id: p.id, field: f, reason: 'token 签名不一致' }); continue }
    if (markers(formatted) !== markers(v)) { stats.sigFail += 1; reverts.push({ id: p.id, field: f, reason: '__BLANK 占位符序列变化' }); continue }
    if (cnCount(formatted) !== cnCount(v)) { stats.sigFail += 1; reverts.push({ id: p.id, field: f, reason: '【】标记数变化' }); continue }
    if (GCC_FIELDS.has(f) && !gccCompare(p.id, f, v, formatted, p.testCases, stats, reverts)) { stats.sigFail += 1; continue }
    p[f] = formatted
    stats.changedFields += 1
    touched = true
  }
  // stem 围栏
  if (typeof p.stem === 'string' && p.stem.includes('```')) {
    let fenceChanged = 0
    const newStem = rebuildFences(p.stem, p.id, reverts, (c) => { fenceChanged = c })
    if (fenceChanged > 0) { p.stem = newStem; stats.changedFences += fenceChanged; touched = true }
  }
  if (touched) stats.changedProblems += 1
  return touched
}

/* ═══════════════ 主流程 ═══════════════ */

const stats = { problems: 0, changedProblems: 0, changedFields: 0, changedFences: 0, skippedLineRef: 0, sigFail: 0, gccCases: 0, gccMismatch: 0, gccOrigFail: 0, gccNewFail: 0, gccError: 0 }
const reverts = []
const lineRefIds = new Set()
const perShard = {}

function loadCheckpoint() {
  if (!RESUME || !existsSync(CHECKPOINT)) return { shards: {} }
  try { return JSON.parse(readFileSync(CHECKPOINT, 'utf8')) } catch { return { shards: {} } }
}
function saveCheckpoint(cp) {
  if (DRY) return
  writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2) + '\n', 'utf8')
}
function gitCommit(msg) {
  if (DRY || NO_COMMIT) return
  const add = spawnSync('git', ['add', 'public/data/problems'], { cwd: ROOT, encoding: 'utf8' })
  if (add.status !== 0) throw new Error('git add 失败: ' + String(add.stderr).slice(0, 200))
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: ROOT })
  if (diff.status === 0) return // 无实际变化不产生空提交
  const c = spawnSync('git', ['commit', '-m', msg], { cwd: ROOT, encoding: 'utf8' })
  if (c.status !== 0) throw new Error('git commit 失败: ' + String(c.stderr).slice(0, 200))
  console.log('  · commit: ' + msg)
}

const cp = loadCheckpoint()
const shards = shardArg ? [shardArg] : readdirSync(DATA).filter(isShardName).sort()

for (const name of shards) {
  if (cp.shards[name]?.status === 'done') { console.log(`跳过（checkpoint done）：${name}`); continue }
  const path = join(DATA, name)
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const problems = Array.isArray(data.problems) ? data.problems : []
  console.log(`\n══ ${name} · ${problems.length} 题 ══`)
  const before = { ...stats }
  let done = 0
  for (let i = 0; i < problems.length; i += CHUNK) {
    const slice = problems.slice(i, i + CHUNK)
    for (const p of slice) { stats.problems += 1; formatProblem(p, stats, reverts, lineRefIds) }
    done += slice.length
    if (!DRY) writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
    gitCommit(`format(data): ${name} 排版格式化 ${done}/${problems.length} 题（clang-format 全库统一风格）`)
    console.log(`  ${done}/${problems.length} 题（字段改动累计 ${stats.changedFields - before.changedFields}）`)
  }
  perShard[name] = {
    status: 'done',
    problems: problems.length,
    changedProblems: stats.changedProblems - before.changedProblems,
    changedFields: stats.changedFields - before.changedFields,
    changedFences: stats.changedFences - before.changedFences,
    skippedLineRef: stats.skippedLineRef - before.skippedLineRef,
  }
  cp.shards[name] = perShard[name]
  saveCheckpoint(cp)
}

mkdirSync(join(ROOT, 'tmp'), { recursive: true })
if (!DRY) {
  writeFileSync(REPORT, JSON.stringify({ stats, perShard, reverts }, null, 2) + '\n', 'utf8')
  writeFileSync(LINE_REF_OUT, JSON.stringify([...lineRefIds].sort(), null, 2) + '\n', 'utf8')
}
console.log('\n══ 汇总 ══')
console.log(JSON.stringify(stats, null, 1))
console.log('回退/跳过明细 ' + reverts.length + ' 条（前 20）：')
for (const r of reverts.slice(0, 20)) console.log(' ', JSON.stringify(r))
console.log('explanation 含行号引用（阶段3 复核清单）：' + lineRefIds.size + ' 题')
console.log(DRY ? '\n--dry：未落盘未提交' : '\n报告：tmp/format-code-report.json · checkpoint：tmp/format-code-checkpoint.json')
process.exit(stats.gccMismatch > 0 || stats.gccNewFail > 0 ? 1 : 0)
