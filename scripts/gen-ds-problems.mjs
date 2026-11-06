#!/usr/bin/env node
/**
 * 阶段3：DS 题库批量生成器（程序库 → 多题型派生）
 *
 * 输入  tmp/ds-bank/ds-chNN.mjs     手写的「程序库」，每条 = 一个 ≤40 行的正确 C 程序 + 派生规则
 * 输出  public/data/problems/ds-chNN.json   幂等追加/替换
 *       tmp/ds-checkpoint.ds-chNN.json      已生成的 bankKey 清单，支持 --resume
 *
 * 用法  node scripts/gen-ds-problems.mjs --chapter=ds-ch03 [--dry] [--resume]
 *
 * ── 三条不可让步的保证（每一条都在代码里强制，不是写在注释里的愿望）───────────
 * 1. **所有 expected 都由本地 gcc 实跑生成，一个都不手写。**
 *    「参考答案 == 实机输出」因此是构造性成立的；judge:verify 走 Godbolt 只是用
 *    另一条工具链独立复核一遍。手抄 expected 是历史上最容易出错的一步。
 * 2. **派生出来的错误版本必须真的产生不同输出**，否则整条 fail。
 *    暴露不出 bug 的改错题没有教学价值，而且学生怎么改都「对」。
 * 3. **题干代码 ≤40 行**（任务书红线⑥），超了整条 fail。
 *
 * ── 为什么用「程序库 + 机械派生」而不是逐题手写 ─────────────────────────────
 * 同一个正确程序天然是四种题的答案：
 *   · 原样给出去问输出        → code_reading
 *   · 挖掉一个关键表达式      → code_completion（solution 就是原程序）
 *   · 把一个表达式改错        → ds_debug（fixed_code 就是原程序）
 *   · 同时改错两处            → multi_bug_debug
 * 四道题共用一份**已被实机验证过**的程序，答案之间不可能互相矛盾；
 * 而手写四道题就会出现「改错题的正确版本和填空题的答案不是同一份代码」这种漂移。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const GCC = 'D:/mingw/mingw64/bin/gcc.exe'
const TMP = join(ROOT, 'tmp', 'kcode')
const BANK = join(ROOT, 'scripts', 'ds-bank')
const PROB = join(ROOT, 'public', 'data', 'problems')

const args = process.argv.slice(2)
const argOf = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : ''
}
const DRY = args.includes('--dry')
const RESUME = args.includes('--resume')
const CHAPTER = argOf('chapter')
if (!/^ds-ch\d{2}$/.test(CHAPTER)) {
  console.error('用法：node scripts/gen-ds-problems.mjs --chapter=ds-chNN [--dry] [--resume]')
  process.exit(2)
}

/* 题型 → id 缩写。必须与 schema/Problem.schema.json 的 id pattern 里那一组一致，
   否则 verify:data 的「id 前缀 ↔ type」双向检查会报 SHARD-ID-TYPE。 */
const ABBR = {
  code_reading: 'cr',
  code_completion: 'cc',
  ds_debug: 'dsdbg',
  multi_bug_debug: 'mdb',
  algorithm_impl: 'alg',
  code_optimization: 'opt',
  pointer_trace: 'pt',
  multi_blank: 'mb',
  complexity_analysis: 'cxa',
  structure_trace: 'str',
  term_explanation: 'te',
}
/* 走 Godbolt 实机判分的题型：verified 只能由 judge:verify 置位，生成时一律 false。
   （与 scripts/lib/problem-code.ts 的 CODE_TYPES 保持一致；complexity_analysis 与
   structure_trace 是前端即时判定，不在其中，所以可以直接 verified:true。） */
const CODE_JUDGED = new Set([
  'code_reading', 'code_completion', 'ds_debug', 'multi_bug_debug',
  'algorithm_impl', 'code_optimization', 'pointer_trace', 'multi_blank',
])
const MAX_STEM_LINES = 40
const MIN_EXPLAIN = 150

/* ── 编译 + 运行（与 tmp/fill-expected.mjs、scripts/judge-verify.ts 同一套口径）── */
const normalizeText = (s) =>
  String(s ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\n+$/, '')

let serial = 0
function compileRun(code, stdin) {
  serial += 1
  const base = join(TMP, `gen-${CHAPTER}-${serial}`)
  const cPath = `${base}.c`
  const exePath = `${base}.exe`
  writeFileSync(cPath, code, 'utf8')
  const cc = spawnSync(GCC, ['-std=c99', '-Wall', '-Wextra', '-o', exePath, cPath], {
    encoding: 'utf8', timeout: 60000,
  })
  const ccOut = `${cc.stdout ?? ''}${cc.stderr ?? ''}`.trim()
  if (cc.status !== 0 || ccOut.length > 0) {
    return { ok: false, why: `编译未通过（本项目要求 -std=c99 -Wall -Wextra 零警告）：${ccOut.slice(0, 400)}` }
  }
  const run = spawnSync(exePath, { input: stdin ?? '', encoding: 'utf8', timeout: 20000 })
  if (run.error) return { ok: false, why: `运行失败：${run.error.message}` }
  if (typeof run.status === 'number' && run.status !== 0) {
    return { ok: false, why: `退出码 ${run.status}（非 0）` }
  }
  return { ok: true, out: normalizeText(run.stdout) }
}

/* ── 小工具 ─────────────────────────────────────────────────────────────── */
const strip = (s) => String(s ?? '').replace(/\s+/g, '')
const rawLines = (s) => String(s ?? '').replace(/\s+$/, '').split('\n').length
const today = new Date().toISOString().slice(0, 10)

/** 把 code 里唯一一处 find 换成 repl。命中数不是 1 就抛错 —— 静默换错地方比不换更糟。 */
function swapOnce(code, find, repl, what) {
  const parts = code.split(find)
  if (parts.length !== 2) {
    throw new Error(`${what}：锚点命中 ${parts.length - 1} 次（必须恰好 1 次）→ ${JSON.stringify(find.slice(0, 60))}`)
  }
  return parts[0] + repl + parts[1]
}

/** 每种题型的「提问方式」不同，详解的开头必须跟着变，否则同一个程序派生出来的
 *  几道题会共用一段几乎一样的详解 —— 那就是变相的自我查重不过关。 */
const LEAD = {
  code_reading: '本题要求直接写出运行结果，所以不能凭印象猜，必须把每一条语句对变量的影响逐步跟踪到底。',
  code_completion: '本题要求补全空位，所以先要判断「这一行在整个算法里承担什么职责」，再反推缺了它会发生什么。',
  ds_debug: '本题要求找出并改正一处错误，所以先要确认程序「本该做什么」，再逐个语句检查它「实际做了什么」。',
  multi_bug_debug: '本题有两处错误，且它们可能互相掩盖，所以不能改完一处就交卷，必须两处都改完再整体复核。',
  code_optimization: '本题要求在输出完全不变的前提下降低复杂度，所以先要认出重复计算发生在哪一层循环。',
  pointer_trace: '本题考的是指针与它所指向的存储单元之间的关系，跟踪时要盯住「谁的地址、谁的值」。',
  algorithm_impl: '本题要求从零写出实现，所以先把题面的不变量写清楚，再决定用哪种存储结构与遍历次序。',
  complexity_analysis: '本题要求算出精确数值而不是渐近记号，所以必须把计数口径先定死（数什么、数到什么时候为止）。',
  structure_trace: '本题要求给出构造完成后的结构，所以最稳妥的办法是在草稿上真的把它一步步画出来，而不是凭记忆。',
  term_explanation: '本题要求系统概括概念，所以答题要有层次：先给定义，再说它解决什么问题，最后点出与相邻概念的区别。',
}

/** 每种题型可以在 e.explain[type] 里覆盖 steps / pitfalls / idea / complexity */
function notesFor(e, type, subNotes) {
  const over = (e.explain ?? {})[type] ?? {}
  /* subNotes：t.notes / o.notes / a.notes / s.notes 这类「子对象自带的详解」，优先于 entry 级的 e.notes */
  const base = subNotes ?? e.notes ?? {}
  return {
    idea: over.idea ?? base.idea ?? '',
    steps: over.steps ?? base.steps ?? [],
    complexity: over.complexity ?? base.complexity ?? '',
    pitfalls: over.pitfalls ?? base.pitfalls ?? [],
  }
}

/** 结构化详解。任务书红线④：思路/步骤/复杂度/易错点≥2条/关联，且 ≥150 字、禁复述题干。 */
function buildExplain(e, type, extraPitfalls = [], relate = [], subNotes = null) {
  const n = notesFor(e, type, subNotes)
  const idea = [LEAD[type] ?? '', n.idea].filter((s) => s.length > 0).join('')
  const steps = n.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const pits = [...n.pitfalls, ...extraPitfalls].map((s, i) => `${i + 1}. ${s}`).join('\n')
  const parts = [
    `【思路】${idea}`,
    steps ? `【步骤】\n${steps}` : '',
    `【复杂度】${n.complexity}`,
    pits ? `【易错点】\n${pits}` : '',
    relate.length > 0 ? `【关联】知识点卡片 ${relate.join('、')}` : '',
  ]
  return parts.filter((s) => s.length > 0).join('\n')
}

const fails = []
const fail = (msg) => { fails.push(msg); return null }

/* ── 读程序库 ───────────────────────────────────────────────────────────── */
/* 程序库可以拆成多个文件：ds-chNN.mjs、ds-chNN-b.mjs、ds-chNN-c.mjs …
   大章（ds-ch04 要 120 道）一个文件写不下也不好维护，拆开后可以一章一章地推进、
   每写完一个文件就 --resume 生成一次，不必等整章写完。所有文件的 entries 合并，
   key 冲突直接报错（两个文件用同一个 key 会让 checkpoint 的 --resume 记不清谁跑过了）。 */
const bankFiles = readdirSync(BANK)
  .filter((f) => f === `${CHAPTER}.mjs` || (f.startsWith(`${CHAPTER}-`) && f.endsWith('.mjs')))
  .sort()
  .map((f) => join(BANK, f))
if (bankFiles.length === 0) {
  console.error(`找不到程序库：${join(BANK, `${CHAPTER}.mjs`)}（或 ${CHAPTER}-*.mjs）`)
  process.exit(2)
}
const entries = []
let chapterName = ''
const seenKeys = new Map()
for (const bankFile of bankFiles) {
  const mod = await import(pathToFileURL(bankFile).href)
  const bankDef = mod.default ?? mod
  if (bankDef.shard !== CHAPTER) {
    console.error(`${bankFile} 的 shard 是 ${bankDef.shard}，与 --chapter=${CHAPTER} 不一致`)
    process.exit(2)
  }
  if (bankDef.chapter && chapterName && bankDef.chapter !== chapterName) {
    console.error(`${bankFile} 的 chapter 是「${bankDef.chapter}」，与已读到的「${chapterName}」不一致`)
    process.exit(2)
  }
  if (bankDef.chapter) chapterName = String(bankDef.chapter)
  for (const e of Array.isArray(bankDef.entries) ? bankDef.entries : []) {
    if (seenKeys.has(e.key)) {
      console.error(`entry key「${e.key}」在 ${seenKeys.get(e.key)} 与 ${bankFile} 里重复`)
      process.exit(2)
    }
    seenKeys.set(e.key, bankFile)
    entries.push(e)
  }
  console.log(`读入 ${basename(bankFile)}：${(bankDef.entries ?? []).length} 条 entry`)
}

/* ── checkpoint（--resume 用）──────────────────────────────────────────── */
const ckFile = join(ROOT, 'tmp', `ds-checkpoint.${CHAPTER}.json`)
let ck = { chapter: CHAPTER, generatedKeys: [], generatedIds: [], at: '' }
if (RESUME && existsSync(ckFile)) {
  try { ck = JSON.parse(readFileSync(ckFile, 'utf8')) } catch { /* 坏了就重来 */ }
}
const doneKeys = new Set(ck.generatedKeys ?? [])

/* ── 读分片、算下一个 id ───────────────────────────────────────────────── */
const shardFile = join(PROB, `${CHAPTER}.json`)
const shard = JSON.parse(readFileSync(shardFile, 'utf8'))
const problems = Array.isArray(shard.problems) ? shard.problems : []
const usedIds = new Set(problems.map((p) => String(p.id)))
const nextSerial = {}
for (const id of usedIds) {
  const m = /^ds-ch\d{2}-([a-z]+)-(\d{3})$/.exec(id)
  if (m) nextSerial[m[1]] = Math.max(nextSerial[m[1]] ?? 0, Number(m[2]))
}
function newId(type) {
  const ab = ABBR[type]
  if (!ab) throw new Error(`未登记的题型缩写：${type}`)
  nextSerial[ab] = (nextSerial[ab] ?? 0) + 1
  const id = `${CHAPTER}-${ab}-${String(nextSerial[ab]).padStart(3, '0')}`
  if (usedIds.has(id)) throw new Error(`id 撞车：${id}`)
  usedIds.add(id)
  return id
}

/* 难度与 Bloom 层级：程序库既可以写标量（整条 entry 一个值），也可以写 { 题型: 值 } 的映射。
   ★ 难度再叠一个「题型加成」：找 bug / 改两处 bug / 分析复杂度 / 优化 / 写完整算法 / 构造结构
     的认知层级天然高于「读程序写输出」和「补一个空」，所以基准难度 +1（钳到 1..5）。
     这样同一个程序派生出的 6 道题不会全挤在同一难度上，也让「易30%/中50%/难20%」的
     全局分布有可能达标 —— 靠人肉给 600 道题逐个标难度既容易漂也做不到前后一致。
   ★ Bloom 一律按题型定，不读 entry 上的标量：一道题的认知层级取决于「问它什么」，
     而不取决于「这段程序有多难」。entry 里若要覆盖，必须写成 { 题型: bloom } 的映射。 */
const TYPE_BUMP = {
  ds_debug: 1,
  multi_bug_debug: 1,
  complexity_analysis: 1,
  code_optimization: 1,
  algorithm_impl: 1,
  structure_trace: 1,
}
/* ★ Bloom 只能用 schema 的四个值：Problem.schema.json:39 的 enum 是
   ["remember","understand","apply","analyze"]，没有 evaluate 也没有 create。
   第一版按完整 Bloom 六层写了 code_optimization:'evaluate' 与 algorithm_impl:'create'，
   结果 verify:data 报 `/bloom must be equal to one of the allowed values`。
   映射原则：本项目的 taxonomy 到 analyze 封顶，所以
   「评价两种实现孰优孰劣」归 analyze（要拆解权衡，不是单纯套用），
   「从零写出一段算法」归 apply（把已知方法用到新数据上）。 */
const TYPE_BLOOM = {
  code_reading: 'understand',
  code_completion: 'apply',
  pointer_trace: 'apply',
  structure_trace: 'apply',
  term_explanation: 'understand',
  ds_debug: 'analyze',
  multi_bug_debug: 'analyze',
  complexity_analysis: 'analyze',
  code_optimization: 'analyze',
  algorithm_impl: 'apply',
}
const pickByType = (v, type, dflt) => {
  if (v && typeof v === 'object') return v[type] ?? dflt
  return v ?? dflt
}
const levelOf = (e, type) => {
  const base = pickByType(e.difficulty ?? e.diff, type, 3)
  return Math.min(5, Math.max(1, base + (TYPE_BUMP[type] ?? 0)))
}
const bloomOf = (e, type) => {
  const m = e.bloom
  if (m && typeof m === 'object') return m[type] ?? TYPE_BLOOM[type] ?? 'apply'
  return TYPE_BLOOM[type] ?? 'apply'
}

/* ── 派生：每种题型一个函数，全部返回「完整题目对象」或 null ───────────── */
const baseFields = (e, type, over = {}) => ({
  id: newId(type),
  type,
  category: 'ds',
  chapter: chapterName,
  section: e.section,
  difficulty: levelOf(e, type),
  bloom: bloomOf(e, type),
  tags: e.tags ?? [],
  source: `自撰变式（依据 ${chapterName} 知识点体系）`,
  variantOf: '',
  knowledgeIds: e.knowledgeIds ?? [],
  vizIds: [],
  ai_generated: true,
  generated_at: today,
  verified: !CODE_JUDGED.has(type),
  bankKey: e.key,
  ...over,
})

/** 挖空：把 find 换成 / *__BLANK_n__* /，answer 就是 find 本身 */
function deriveCompletion(e, code, inputs, cases) {
  if (!Array.isArray(e.blanks) || e.blanks.length === 0) return null
  let blanked = code
  const blanks = []
  e.blanks.forEach((b, i) => {
    blanked = swapOnce(blanked, b.find, `/*__BLANK_${i + 1}__*/`, `${e.key} 空位${i + 1}`)
    blanks.push({
      index: i + 1,
      answer: b.find,
      accepted: Array.isArray(b.accepted) ? b.accepted : [],
      hint: b.hint ?? '',
    })
  })
  return baseFields(e, 'code_completion', {
    stem: `${e.ccStem ?? '把下列程序中的空位补全，使它对所有测试输入都给出正确输出。'}\n\`\`\`c\n${blanked}\n\`\`\``,
    code: blanked,
    blanks,
    solution: code,
    testCases: cases,
    explanation: buildExplain(e, 'code_completion', (e.blanks ?? []).map((b) => b.pitfall).filter(Boolean), e.knowledgeIds),
  })
}

function deriveDsDebug(e, code, cases, inputs) {
  const d = (e.defects ?? [])[0]
  if (!d) return null
  const buggy = swapOnce(code, d.find, d.replace, `${e.key} 缺陷「${d.kind}」`)
  /* 保证 2：错误版本必须真的至少在一组输入上给出不同输出 */
  const diff = []
  for (const inp of inputs) {
    const r = compileRun(buggy, inp.stdin)
    if (!r.ok) return fail(`${e.key} 的 ds_debug 错误版本编译/运行失败：${r.why}`)
    if (r.out !== inp.expected) diff.push(inp.note ?? inp.stdin.slice(0, 12))
  }
  if (diff.length === 0) {
    return fail(`${e.key} 的缺陷「${d.kind}」在所有 ${inputs.length} 组输入上输出都与正确版本相同 ⇒ 暴露不出 bug，不能出改错题`)
  }
  return baseFields(e, 'ds_debug', {
    defectKind: d.kind,
    stem: `${e.dbgStem ?? '下面的程序本应完成题面描述的功能，但有一处错误。请找出并改正，使它对全部测试输入都给出正确输出。'}\n\`\`\`c\n${buggy}\n\`\`\``,
    code: buggy,
    bugs: [d.why],
    fixed_code: code,
    testCases: cases,
    explanation: buildExplain(e, 'ds_debug', [d.pitfall ?? d.why], e.knowledgeIds),
    _diffGroups: diff.length,
  })
}

function deriveMultiBug(e, code, cases, inputs) {
  const ds = e.defects ?? []
  if (ds.length < 2) return null
  let buggy = code
  for (const d of ds.slice(0, 2)) buggy = swapOnce(buggy, d.find, d.replace, `${e.key} 缺陷「${d.kind}」`)
  const diff = []
  for (const inp of inputs) {
    const r = compileRun(buggy, inp.stdin)
    if (!r.ok) return fail(`${e.key} 的 multi_bug_debug 错误版本编译/运行失败：${r.why}`)
    if (r.out !== inp.expected) diff.push(inp.note ?? '')
  }
  if (diff.length === 0) return fail(`${e.key} 的两处缺陷合起来仍然暴露不出 bug`)
  return baseFields(e, 'multi_bug_debug', {
    stem: `${e.mdbStem ?? '下面的程序有两处错误。请把修正后的完整程序写出来，使它对全部测试输入都给出正确输出。'}\n\`\`\`c\n${buggy}\n\`\`\``,
    code: buggy,
    bugs: ds.slice(0, 2).map((d) => d.why),
    fixed_code: code,
    testCases: cases,
    explanation: buildExplain(e, 'multi_bug_debug', ds.slice(0, 2).map((d) => d.pitfall ?? d.why), e.knowledgeIds),
  })
}

function deriveReading(e, code, inputs, idx) {
  const inp = inputs[idx]
  if (!inp) return null
  return baseFields(e, 'code_reading', {
    stem: `写出下列程序在给定输入下的运行结果（逐行抄写，空格与换行都要一致）。\n\n输入：\n\`\`\`\n${String(inp.stdin).replace(/\n$/, '')}\n\`\`\`\n\n程序：\n\`\`\`c\n${code}\n\`\`\``,
    code,
    stdin: inp.stdin,
    answer: inp.expected,
    explanation: buildExplain(e, 'code_reading', inp.why ? [`这一组输入（${inp.note ?? ''}）的关键在于：${inp.why}`] : [], e.knowledgeIds),
  })
}

function derivePointerTrace(e) {
  if (!e.trace) return null
  const t = e.trace
  const r = compileRun(t.code, t.stdin ?? '')
  if (!r.ok) return fail(`${e.key} 的 pointer_trace 程序跑不通：${r.why}`)
  if (t.expect !== undefined && r.out !== t.expect) {
    return fail(`${e.key} 的 pointer_trace 实跑「${r.out}」与库里写的「${t.expect}」不一致 —— 以实跑为准，请修正程序库`)
  }
  return baseFields(e, 'pointer_trace', {
    stem: `${t.stem}\n\`\`\`c\n${t.code}\n\`\`\``,
    code: t.code,
    stdin: t.stdin ?? '',
    answer: r.out,
    explanation: buildExplain(e, 'pointer_trace', [], e.knowledgeIds, t.notes),
  })
}

function deriveOptimization(e, code, inputs, cases) {
  if (!e.opt) return null
  const o = e.opt
  /* 慢版本必须与正确版本在所有输入上输出一致，否则「优化前后行为不变」这个前提是假的 */
  for (const inp of inputs) {
    const r = compileRun(o.code, inp.stdin)
    if (!r.ok) return fail(`${e.key} 的 code_optimization 慢版本跑不通：${r.why}`)
    if (r.out !== inp.expected) {
      return fail(`${e.key} 的慢版本在「${inp.note ?? ''}」上输出「${r.out}」，与正确版本「${inp.expected}」不一致`)
    }
  }
  /* ★ 字段名容错 + 显式校验。生成器读的是 o.baseline / o.target，写进题目时才叫
     baselineComplexity / targetComplexity；程序库里两种写法都常见，所以两个都认。
     但「一个都没有」必须硬失败：undefined 会被 JSON.stringify 整个丢掉，题目就少了两个字段，
     而旧 schema 的 code_optimization 分支没把它们列进 required，于是 ds-ch01-opt-001 曾带着
     缺失字段通过了全部七道闸门。schema 那边现在也补了 required（双重保险）。 */
  const baseline = o.baselineComplexity ?? o.baseline
  const target = o.targetComplexity ?? o.target
  if (!baseline || !target) {
    return fail(`${e.key} 的 opt 缺复杂度字段：要写 opt.baseline 与 opt.target（或 baselineComplexity / targetComplexity），两个都不能省`)
  }
  return baseFields(e, 'code_optimization', {
    stem: `${o.stem}\n\`\`\`c\n${o.code}\n\`\`\``,
    code: o.code,
    reference: code,
    baselineComplexity: baseline,
    targetComplexity: target,
    testCases: cases,
    explanation: buildExplain(e, 'code_optimization', [], e.knowledgeIds, o.notes),
  })
}

function deriveAlgorithm(e, inputs) {
  if (!e.task) return null
  const t = e.task
  const cases = []
  for (const inp of t.inputs) {
    const r = compileRun(t.reference, inp.stdin)
    if (!r.ok) return fail(`${e.key} 的 algorithm_impl 参考实现跑不通：${r.why}`)
    cases.push({ stdin: inp.stdin, expected: r.out, note: inp.note ?? '' })
  }
  if (cases.length < 8) return fail(`${e.key} 的 algorithm_impl 只有 ${cases.length} 组测试，红线要求 ≥8 组`)
  const p = baseFields(e, 'algorithm_impl', {
    stem: t.stem,
    input_format: t.input_format,
    output_format: t.output_format,
    code_starter: t.code_starter,
    reference: t.reference,
    testCases: cases,
    constraints: t.constraints,
    explanation: buildExplain(e, 'algorithm_impl', [], e.knowledgeIds, t.notes),
  })
  delete p.bankKey
  return p
}

function deriveCxas(e) {
  /* 一个 entry 可以出多道 complexity_analysis：e.cxas = [{ stem, asks, complexity, accepted, askSpace, code, notes }, …]
     每道问的是同一段程序的不同侧面（比较次数 / 移动次数 / 空间 / 递归深度 / ASL），
     题干与 gradedAsk 全不相同，所以不是「换个数值再问一遍」。
     单数形式 e.asks 仍然支持（向后兼容 ds-ch01 的程序库）。 */
  if (Array.isArray(e.cxas)) return e.cxas.map((a, i) => deriveCxa(e, a, i)).filter(Boolean)
  return e.asks ? [deriveCxa(e)].filter(Boolean) : []
}

function deriveCxa(e, override = null, seq = 0) {
  if (!override && !e.asks) return null
  /* 程序库可以写三种形状：
     ① 扁平（自然写法，一个 entry 本来就带着 code 与复杂度）：
        e.asks 是 gradedAsk 数组，题干另放 e.cxaStem，复杂度放 e.complexity，等价写法放 e.cxaAccepted
     ② 嵌套（这道题要单独给一段与 e.code 不同的代码时用）：
        e.asks = { stem, code, asks: [...], complexity, accepted, askSpace, notes }
     ③ 复数 e.cxas = [ ②那样的对象, … ]，一个 entry 派生多道
     ★ 第一版只认②，而程序库写的是①，于是 a.asks / a.stem 全是 undefined：
       stem 变成字面串 "undefined"、asks 键被 JSON.stringify 丢掉 ⇒ schema 报「缺 required 属性 asks」。
       undefined 不会报错、只会静默产出坏题，所以这里显式校验 list 是不是非空数组。 */
  const a = override ?? (Array.isArray(e.asks) ? {} : e.asks)
  const nested = override ? true : !Array.isArray(e.asks)
  const list = override ? override.asks : (nested ? a.asks : e.asks)
  const label = `${e.key}${override ? ` cxas[${seq}]` : ' asks'}`
  if (!Array.isArray(list) || list.length === 0) {
    return fail(`${label} 不是非空数组（扁平写法要直接给 gradedAsk 数组，嵌套写法要给 { asks: [...] }）`)
  }
  const code = nested ? (a.code ?? '') : (e.code ?? '')
  const stem = nested
    ? a.stem
    : (e.cxaStem ?? `阅读下面这段程序，然后回答后面的 ${list.length} 个问题。`)
  if (!stem || typeof stem !== 'string') return fail(`${label} 缺 stem（题干不能为空）`)
  return baseFields(e, 'complexity_analysis', {
    stem: stem + (code ? `\n\`\`\`c\n${code}\n\`\`\`` : ''),
    code,
    asks: list,
    complexity: (nested ? a.complexity : e.complexity) ?? '',
    accepted: (nested ? a.accepted : e.cxaAccepted) ?? [],
    askSpace: (nested ? a.askSpace : e.askSpace) === true,
    explanation: buildExplain(e, 'complexity_analysis', [], e.knowledgeIds, nested ? a.notes : null),
  })
}

function deriveStrs(e) {
  /* 同 deriveCxas：一个 entry 可以出多道 structure_trace（问树形 / 问遍历序列 / 问最终数组） */
  if (Array.isArray(e.structs)) return e.structs.map((s) => deriveStr(e, s)).filter(Boolean)
  return e.struct ? [deriveStr(e)].filter(Boolean) : []
}

function deriveStr(e, override = null) {
  const s = override ?? e.struct
  if (!s) return null
  return baseFields(e, 'structure_trace', {
    stem: s.stem + (s.code ? `\n\`\`\`c\n${s.code}\n\`\`\`` : ''),
    code: s.code ?? '',
    sequence: s.sequence,
    structureKind: s.structureKind,
    nodeSpec: s.nodeSpec ?? '',
    traversalOrder: s.traversalOrder ?? [],
    constructionResult: s.constructionResult ?? '',
    traceSteps: s.traceSteps ?? [],
    explanation: buildExplain(e, 'structure_trace', [], e.knowledgeIds, s.notes),
  })
}

function deriveTerm(e) {
  if (!e.term) return null
  const t = e.term
  return baseFields(e, 'term_explanation', {
    stem: t.stem,
    keyPoints: t.keyPoints,
    reference_answer: t.reference_answer,
    explanation: buildExplain(e, 'term_explanation', [], e.knowledgeIds, t.notes),
  })
}

/* ── 主循环 ─────────────────────────────────────────────────────────────── */
mkdirSync(TMP, { recursive: true })
const added = []
const skipped = []
let bankUsed = 0

/**
 * 逐题自检（红线④）：详解 ≥150 字（去空白）、四段齐全、易错点 ≥2 条。
 * 任一不过就记 fail 并且整个批次不写盘（见汇总处的 fails.length 判断）。
 * ★ 原来这段是内联在 for (const p of derived) 里的，用 break 只跳出内层循环、
 *   之后仍会走到 added.push(p)，靠「任何 fail 都不写盘」兜底才没出事；
 *   抽成函数后必须用 return —— 这才是「这道题不合格就丢掉它」的真语义。
 */
function checkAndPush(p) {
  const ex = strip(p.explanation)
  if (ex.length < MIN_EXPLAIN) { fails.push(`${p.id} 的 explanation 只有 ${ex.length} 字（红线 ≥${MIN_EXPLAIN}）`); return }
  for (const seg of ['【思路】', '【步骤】', '【复杂度】', '【易错点】']) {
    if (!p.explanation.includes(seg)) { fails.push(`${p.id} 的 explanation 缺 ${seg}`); return }
  }
  const nPit = (p.explanation.split('【易错点】')[1] ?? '').split('\n').filter((l) => /^\d+\./.test(l.trim())).length
  if (nPit < 2) { fails.push(`${p.id} 的易错点只有 ${nPit} 条（红线 ≥2 条）`); return }
  delete p._diffGroups
  delete p.bankKey
  added.push(p)
}

for (const e of entries) {
  if (!e.key) { fails.push('程序库里有 entry 缺 key'); continue }
  if (doneKeys.has(e.key)) { skipped.push(e.key); continue }
  bankUsed += 1

  /* 纯概念 entry（没有 code，例如 term_explanation）：只派生不依赖实机的题型，
     跳过「编译正确版本 + 逐组实跑」这一段 —— 它既没有程序可编译，也没有 stdin 可读。 */
  if (String(e.code ?? '').trim() === '') {
    const nonCode = [deriveTerm(e), ...deriveCxas(e), ...deriveStrs(e)].filter(Boolean)
    if (nonCode.length === 0) {
      fails.push(`${e.key} 既没有 code，也没有 term/asks/struct，派生不出任何题`)
    }
    for (const p of nonCode) checkAndPush(p)
    continue
  }

  /* 保证 3：题干代码 ≤40 行 */
  const lines = rawLines(e.code)
  if (lines > MAX_STEM_LINES) {
    fails.push(`${e.key} 的程序有 ${lines} 行，超过红线 ${MAX_STEM_LINES} 行 —— 请精简后再入库`)
    continue
  }

  /* 先把正确版本在所有输入上跑一遍，expected 全部来自实机 */
  const inputs = []
  for (const inp of e.inputs ?? []) {
    const r = compileRun(e.code, inp.stdin)
    if (!r.ok) { fails.push(`${e.key} 的正确版本在「${inp.note ?? ''}」上跑不通：${r.why}`); break }
    inputs.push({ ...inp, expected: r.out })
  }
  if (inputs.length !== (e.inputs ?? []).length) continue
  if (inputs.length === 0) { fails.push(`${e.key} 没有任何输入用例`); continue }
  /* 用例之间必须能区分：两组不同输入给出完全相同的输出，说明程序没在读输入 */
  const uniq = new Set(inputs.map((i) => i.expected))
  if (uniq.size < 2 && inputs.length > 1) {
    fails.push(`${e.key} 的 ${inputs.length} 组输入全部输出「${[...uniq][0] ?? ''}」—— 程序可能根本没读输入`)
    continue
  }
  const cases = inputs.map((i) => ({ stdin: i.stdin, expected: i.expected, note: i.note ?? '' }))

  const derived = [
    deriveReading(e, e.code, inputs, 0),
    inputs.length > 2 ? deriveReading(e, e.code, inputs, 2) : null,
    deriveCompletion(e, e.code, inputs, cases),
    deriveDsDebug(e, e.code, cases, inputs),
    deriveMultiBug(e, e.code, cases, inputs),
    deriveOptimization(e, e.code, inputs, cases),
    derivePointerTrace(e),
    deriveAlgorithm(e, inputs),
    ...deriveCxas(e),
    ...deriveStrs(e),
    deriveTerm(e),
  ].filter(Boolean)

  for (const p of derived) checkAndPush(p)
}

/* ── 汇总 ───────────────────────────────────────────────────────────────── */
const byType = {}
for (const p of added) byType[p.type] = (byType[p.type] ?? 0) + 1
console.log(`程序库 ${entries.length} 条 · 本轮用到 ${bankUsed} 条 · --resume 跳过 ${skipped.length} 条`)
console.log(`派生出 ${added.length} 道题：`)
for (const t of Object.keys(byType).sort()) console.log(`    ${t} = ${byType[t]}`)

if (fails.length > 0) {
  console.error(`\n✗ ${fails.length} 条不合格，本次不写任何文件：`)
  for (const f of fails.slice(0, 30)) console.error(`    · ${f}`)
  if (fails.length > 30) console.error(`    …另有 ${fails.length - 30} 条`)
  process.exit(1)
}
if (added.length === 0) {
  console.log('没有新题（可能 --resume 已全部跳过）。')
  process.exit(0)
}

if (DRY) {
  console.log('\n[--dry] 未写盘。前 3 道预览：')
  for (const p of added.slice(0, 3)) console.log(`  ${p.id} ${p.type} difficulty=${p.difficulty} explanation=${strip(p.explanation).length}字`)
  process.exit(0)
}

const byId = new Map(problems.map((p) => [String(p.id), p]))
for (const p of added) byId.set(p.id, p)
shard.problems = [...byId.values()]
writeFileSync(shardFile, `${JSON.stringify(shard, null, 2)}\n`, 'utf8')

ck.generatedKeys = [...new Set([...(ck.generatedKeys ?? []), ...entries.filter((e) => !skipped.includes(e.key)).map((e) => e.key)])]
ck.generatedIds = [...new Set([...(ck.generatedIds ?? []), ...added.map((p) => p.id)])]
ck.at = new Date().toISOString()
ck.count = shard.problems.length
writeFileSync(ckFile, `${JSON.stringify(ck, null, 2)}\n`, 'utf8')

console.log(`\n✓ ${CHAPTER}.json 现有 ${shard.problems.length} 道（新增 ${added.length}）`)
console.log(`✓ checkpoint → tmp/ds-checkpoint.${CHAPTER}.json`)
console.log('下一步：npm run build:index && npm run verify:data && npm run verify:spec && npm run lint:code')
console.log(`        npm run judge:verify -- --only=${CHAPTER}-   （给本轮新增的代码题置 verified）`)
