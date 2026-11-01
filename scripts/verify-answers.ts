/**
 * 任务05 阶段4 · 参考答案可验证性核查闸门（verify:answers）。
 *
 * 任务书 1.4「参考答案可验证性核查」：
 *   - 对每道有 testCases 的题，把 answer 填入 code 对应位置，编译并跑全部用例，
 *     比对输出与 expected 是否完全一致。
 *   - 不一致三类处理：答案错误→修正 answer / 用例错误→修正 testCases.expected /
 *     题意歧义→重写题干。严禁为了「通过」放宽比对规则或删掉跑不过的用例。
 *   - 7 道历史描述型 code_reading：能补 answer 的补齐；确实无标准答案的，如实标注
 *     type 说明，前端显示「本题为描述型，无标准代码答案」，不得编造答案充数。
 *   - 输出逐题结果，error 0 才允许进入下一阶段。
 *
 * 引擎选择：本脚本用**本地 gcc（-std=c99）**做离线编译+运行，快速、不消耗 Godbolt 配额，
 * 作为每次闸门都可跑的「参考答案正确性」干净检查。真正置 verified 的实机证明（Godbolt
 * cg132）由 npm run judge:verify 完成并写入 verification-report.json，本脚本同时交叉核对
 * 每条新增题在该报告里都有 ok:true 证据，避免「本地能跑但从未在真机证明」。
 *
 * 平台口径说明：本地 gcc（MinGW-W64，LLP64，long=32 位）的 printf 浮点格式与 long 宽度
 * 可能与 Godbolt cg132（LP64，long=64 位）略有差异。凡涉及 %ld/%lu/long 或浮点格式
 * （%f/%e/%g）的题，若本地 gcc 结果与 expected 不一致，**不判 error**——以
 * verification-report.json 的真机证据为权威（真机 ok:true 即认为答案正确）；
 * 只有确定性不一致（本地 gcc 稳定输出且与 expected 不符、且不涉平台依赖特性）才判 error。
 *
 * 用法：
 *   node scripts/verify-answers.ts             校验全部代码题参考答案（新增题违规=error）
 *   node scripts/verify-answers.ts --all      连历史 C 题一起查（历史违规=warn，不拦闸门）
 *   node scripts/verify-answers.ts --skip-gcc 只交叉核对报告证据，不做本地 gcc 编译
 *
 * 脚本禁止写死题量：数量一律从分片 JSON 现算。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildRunnableSource } from './lib/problem-code.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROBLEM_DIR = join(ROOT, 'public', 'data', 'problems')
const NON_SHARD = new Set(['index.json', 'verification-report.json'])
const isShardName = (name: string): boolean =>
  name.endsWith('.json') && !name.startsWith('_') && !NON_SHARD.has(name)

type Level = 'error' | 'warn'
interface Issue { level: Level; code: string; where: string; msg: string }

/** 是否为新增题：从任务04提交区间提取的 new-problem-ids.json（仅开发期区分历史/新增） */
function loadNewIds(): Set<string> {
  const p = join(ROOT, 'tmp', 'new-problem-ids.json')
  if (!existsSync(p)) return new Set<string>()
  const raw = JSON.parse(readFileSync(p, 'utf8')) as unknown
  const ids = Array.isArray(raw) ? raw : ((raw as { ids?: string[] }).ids ?? [])
  return new Set(ids.filter((x): x is string => typeof x === 'string'))
}

interface ShardFile { file: string; problems: Array<Record<string, unknown>> }
function loadShards(): ShardFile[] {
  const out: ShardFile[] = []
  for (const name of readdirSync(PROBLEM_DIR).sort()) {
    if (!isShardName(name)) continue
    const parsed = JSON.parse(readFileSync(join(PROBLEM_DIR, name), 'utf8')) as Record<string, unknown>
    out.push({ file: name, problems: Array.isArray(parsed.problems) ? (parsed.problems as Array<Record<string, unknown>>) : [] })
  }
  return out
}

/** 读取 verification-report.json 的证据（last_known_good 只增不减，后端抖动抹不掉） */
function loadReportProofs(): Map<string, { ok: boolean; at?: string }> {
  const map = new Map<string, { ok: boolean; at?: string }>()
  const p = join(PROBLEM_DIR, 'verification-report.json')
  if (!existsSync(p)) return map
  const r = JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>
  const results = Array.isArray(r.results) ? (r.results as Array<Record<string, unknown>>) : []
  const lkg = (r.last_known_good ?? {}) as Record<string, { at?: string }>
  for (const row of results) {
    const id = typeof row.id === 'string' ? row.id : ''
    if (!id) continue
    map.set(id, { ok: row.ok === true })
  }
  // 只增不减：last_known_good 里出现过即视为真机证据，即便本轮末梢结果被抖动抹掉
  for (const id of Object.keys(lkg)) {
    if (!map.has(id)) map.set(id, { ok: true, at: lkg[id]?.at })
  }
  return map
}

/* ============================== 本地 gcc 编译+运行 ============================== */

function toLF(text: string): string { return text.replace(/\r\n?/g, '\n') }
function trimEnd(line: string): string { return line.replace(/[ \t]+$/, '') }
function stripTrailingBlankLines(text: string): string {
  let end = text.length
  while (end > 0 && (text[end - 1] === '\n' || text[end - 1] === ' ')) end -= 1
  return text.slice(0, end)
}
/** 判分归一化（与 src/judge/backends/base.ts 一致） */
function normalizeOutput(text: string): string {
  return stripTrailingBlankLines(toLF(text).split('\n').map(trimEnd).join('\n'))
}

interface CaseResult { stdin: string; expected: string; observed: string; match: boolean }
interface RunResult {
  compileFail: boolean
  compileStderr?: string
  cases?: CaseResult[]
}

/** 平台依赖特性探测：long 宽度或浮点格式，可能与主板 Godbolt 有差异 */
const PLATFORM_RE = /(%ld|%lu|%lld|%llu|\blong\b|sizeof\s*\(\s*long|%[.#0-9]*[eEfFgG])/

/** 编译并运行全部用例，返回逐条比对结果 */
function compileAndRun(code: string, cases: Array<{ stdin: string; expected: string }>): RunResult {
  const tmp = join(tmpdir(), 'va_' + Math.random().toString(36).slice(2) + '.c')
  const exe = tmp.slice(0, -2)
  writeFileSync(tmp, code, 'utf8')
  try {
    const comp = spawnSync('gcc', ['-std=c99', '-o', exe, tmp], { encoding: 'utf8', timeout: 30000 })
    if (comp.status !== 0) {
      return { compileFail: true, compileStderr: (comp.stderr || comp.stdout || '').slice(0, 300) }
    }
    // code_reading / pointer_trace：只用一条用例，stdin 取自题目 stdout（cases 里已是单条）
    const out: CaseResult[] = []
    for (const c of cases) {
      const run = spawnSync(exe, [], { input: c.stdin || '', encoding: 'utf8', timeout: 10000 })
      const observed = normalizeOutput(run.stdout || '')
      const expected = normalizeOutput(c.expected)
      out.push({ stdin: c.stdin, expected: c.expected, observed, match: observed === expected })
    }
    return { compileFail: false, cases: out }
  } finally {
    try { rmSync(tmp, { force: true }) } catch {}
    try { rmSync(exe, { force: true }) } catch {}
  }
}

/** 描述型 code_reading（无标准答案）：能补则补，确无标准则如实标注，不编造 */
function isDescriptiveReading(p: Record<string, unknown>): boolean {
  return p.type === 'code_reading' && p.answerIsDescription === true &&
    (p.answer === undefined || p.answer === null || String(p.answer).trim() === '')
}

/* ============================== 主校验 ============================== */

interface Bucket { runnable: number; compileFail: number; mismatch: number; match: number; descriptive: number; concept: number; noProof: number }

function checkAll(shards: ShardFile[], all: boolean, skipGcc: boolean): { issues: Issue[]; bucket: Bucket; total: number } {
  const issues: Issue[] = []
  const add = (level: Level, code: string, where: string, msg: string): void => { issues.push({ level, code, where, msg }) }
  const newIds = loadNewIds()
  const proof = loadReportProofs()
  const bucket: Bucket = { runnable: 0, compileFail: 0, mismatch: 0, match: 0, descriptive: 0, concept: 0, noProof: 0 }
  let total = 0

  for (const shard of shards) {
    for (const p of shard.problems) {
      const id = typeof p.id === 'string' ? p.id : ''
      if (!id || id.startsWith('ds-')) continue
      total += 1
      const isNew = newIds.has(id)
      const scoped = isNew || all
      if (!scoped) continue
      const where = shard.file + ' ' + id
      const level: Level = isNew ? 'error' : 'warn'

      const runnable = buildRunnableSource(p as never)

      // 描述型 code_reading：无标准代码答案，如实标注，不判错
      if (!runnable) {
        if (isDescriptiveReading(p)) {
          // 任务书 §1.4：确实无标准答案的，如实标注 type 说明、前端显示「本题为描述型，无标准代码答案」。
          // 这是被支持的类型（不编造即可），不是缺陷 —— 只计数供汇总，不产生 blocking 的 error/warn。
          bucket.descriptive += 1
          continue
        }
        // 概念/自评/选择/判断等无 testCases 的类型：不自动判分，由 verify:spec 检查 answer 字段
        bucket.concept += 1
        continue
      }

      const cases = runnable.cases ?? []
      if (!runnable.code || cases.length === 0) {
        // 有 reference 但无用例：应由 schema/verify:spec 把关，这里不重复报
        bucket.concept += 1
        continue
      }

      bucket.runnable += 1

      // （1）本地 gcc 编译+跑用例（除非 --skip-gcc）
      if (!skipGcc) {
        const res = compileAndRun(runnable.code, cases)
        if (res.compileFail) {
          bucket.compileFail += 1
          add(level, 'ANSWER-COMPILE', where, '参考答案编译失败：' + (res.compileStderr || '').trim())
          continue
        }
        const bad = (res.cases ?? []).filter((c) => !c.match)
        if (bad.length === 0) {
          bucket.match += 1
        } else {
          // 平台依赖特性（long 宽度 / 浮点格式）与主板可能有差异：此时以真机报告为权威，不判 error
          const platformDep = PLATFORM_RE.test(runnable.code)
          if (platformDep) {
            const proofOk = proof.get(id)?.ok === true
            if (!proofOk) {
              bucket.mismatch += 1
              add(level, 'ANSWER-MISMATCH', where, '参考答案与 expected 不一致（含平台依赖特性 long/浮点，且真机报告无 ok 证据）：' +
                (bad[0] ? 'stdin=' + JSON.stringify(bad[0].stdin) + ' 观测=' + JSON.stringify(bad[0].observed.slice(0, 50)) + ' 期望=' + JSON.stringify(bad[0].expected.slice(0, 50)) : ''))
            } else {
              // 平台差异但真机已证明，不判 error，仅提示
              add('warn', 'ANSWER-PLATFORM', where, '本地 gcc 与 expected 不一致，但涉 long/浮点平台特性且真机报告已证明 ok，以真机为准（不判错）')
            }
          } else {
            bucket.mismatch += 1
            add(level, 'ANSWER-MISMATCH', where, '参考答案与 expected 不一致：' +
              (bad[0] ? 'stdin=' + JSON.stringify(bad[0].stdin) + ' 观测=' + JSON.stringify(bad[0].observed.slice(0, 50)) + ' 期望=' + JSON.stringify(bad[0].expected.slice(0, 50)) : ''))
          }
        }
      } else {
        // --skip-gcc：只记存在，交给报告核对
        bucket.match += 0
      }

      // （2）真机报告证据交叉核对（新增题必须有 ok:true 证据）
      if (isNew) {
        const pr = proof.get(id)
        if (!pr) {
          bucket.noProof += 1
          add(level, 'ANSWER-NO-PROOF', where, '新增代码题在 verification-report.json 里没有真机证据（跑 npm run judge:verify）')
        } else if (pr.ok !== true) {
          bucket.noProof += 1
          add(level, 'ANSWER-NO-PROOF', where, '新增代码题真机证据 ok=false（跑 npm run judge:verify）')
        }
      }
    }
  }

  return { issues, bucket, total }
}

/* ============================== 主流程 ============================== */

const args = process.argv.slice(2)
const all = args.includes('--all')
const skipGcc = args.includes('--skip-gcc')
const shards = loadShards()
const { issues, bucket, total } = checkAll(shards, all, skipGcc)

for (const shard of shards) {
  console.log('分片 ' + shard.file.padEnd(14) + ' 题数=' + shard.problems.length)
}
console.log('')
console.log('参考答案核查统计：可运行=' + bucket.runnable + ' · 本地匹配=' + bucket.match +
  ' · 编译失败=' + bucket.compileFail + ' · 不一致=' + bucket.mismatch +
  ' · 描述型=' + bucket.descriptive + ' · 概念/自评(免跑)=' + bucket.concept + ' · 缺真机证据=' + bucket.noProof)
if (issues.length === 0) console.log('无告警')
for (const i of issues) console.log((i.level === 'error' ? '✗ ERROR ' : '! WARN  ') + '[' + i.code + '] ' + i.where + ' —— ' + i.msg)

const issueErrs = issues.filter((i) => i.level === 'error').length
const warns = issues.length - issueErrs
console.log('')
console.log('题目总数 ' + total + ' · error ' + issueErrs + ' · warn ' + warns)
process.exit(issueErrs === 0 ? 0 : 1)
