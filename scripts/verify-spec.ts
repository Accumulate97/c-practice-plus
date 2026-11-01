/**
 * 任务05 阶段3 · 规格完整性校验闸门（verify:spec）。
 *
 * 任务书 1.1「规格补齐」要求新增题每道必须齐全：
 *   id / chapter / type / difficulty(1-5) / tags[]/≥1 非空 / title / stem /
 *   题目可判分内容(code/answer/testCases各自按题型) / explanation
 *   constraints —— algorithm_impl 与熟练度专项(timed_impl)必填
 *   source 必须标注「自撰」或「自撰变式（依据<章节>知识点体系）」
 *   variantOf —— 有母题指向母题id，无母题留空串
 *   knowledgeIds / vizIds —— 缺失走空数组，不得省略字段
 *
 * 设计原则（任务书铁律）：
 *   - 脚本禁止写死题量；数量一律从 index.json 现算。
 *   - 无母题 variantOf="", 有母题指向真实存在的 id（REF-DANGLING 由 verify:data 把关）。
 *   - 口径：任务05 = 任务04新增的 C 题（清单 tmp/new-problem-ids.json，由 git 区间自动提取）。
 *     历史题与 DS 题不在本轮范围（任务书「本轮不做 DS 内容」），verify:data 已对全量做
 *     schema 完整性（含 constraints 必填）把关，这里不再对历史缺字段刷噪音。
 *
 * 用法：
 *   node scripts/verify-spec.ts            校验新增题（规格字段，违规记 error）
 *   node scripts/verify-spec.ts --all      连历史 C 题一起查（违规记 warn，不拦闸门）
 *   node scripts/verify-spec.ts --strict   把 --all 里的 warn 升级为 error
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'public', 'data')
const PROBLEM_DIR = join(DATA, 'problems')
const NON_SHARD = new Set(['index.json', 'verification-report.json'])
const isShardName = (name: string): boolean =>
  name.endsWith('.json') && !name.startsWith('_') && !NON_SHARD.has(name)

type Level = 'error' | 'warn'
interface Issue { level: Level; code: string; where: string; msg: string }

/** 是否为新增题：从任务04提交区间提取的 new-problem-ids.json（仅在开发期用于区分历史/新增） */
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

function isBlank(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (typeof v === 'string' && v.trim() === '')
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** 每道题都必须有的基础字段（与 Problem.schema.json 根 required 对齐，另加任务书 1.1 的字段） */
const BASE_REQUIRED = ['id', 'type', 'category', 'chapter', 'section', 'difficulty', 'bloom', 'stem', 'explanation', 'source']
/** 任务书明说要「齐全」但 schema 根 required 未列的字段（tag/约束长在题目上的） */
const TASK_REQUIRED = ['tags']

/** 题型 → 它「可判分内容」落在哪个字段（用于这道题算不算「有答案可验证」） */
const CONTENT_FIELD: Record<string, string[]> = {
  code_completion: ['solution', 'blanks', 'testCases'],
  debug: ['fixed_code', 'testCases'],
  code_reading: ['code', 'answer'],
  programming: ['reference', 'testCases'],
  single_choice: ['options', 'answer'],
  true_false: ['answer'],
  fill_blank: ['blanks'],
  code_ordering: ['lines', 'correct_order', 'testCases'],
  short_answer: ['reference_answer', 'grading_points'],
  complexity: ['code', 'answer'],
  matching: ['pairs'],
  pointer_trace: ['code', 'answer'],
  multi_blank: ['solution', 'blanks', 'testCases'],
  timed_impl: ['reference', 'testCases'],
  stdlib_reimpl: ['reference', 'testCases'],
  api_drill: ['reference', 'testCases'],
  code_optimization: ['code', 'reference', 'testCases'],
  code_review: ['code', 'reviewPoints'],
  term_explanation: ['keyPoints'],
  essay_answer: ['reference_answer', 'keyPoints'],
  algorithm_impl: ['reference', 'testCases'],
  multi_bug_debug: ['code', 'bugs', 'fixed_code', 'testCases'],
}

/** 审核 constraints 必填的题型（任务书 1.1：algorithm_impl 与熟练度专项 timed_impl） */
const CONSTRAINTS_TYPES = new Set(['algorithm_impl', 'timed_impl'])

/** tags 至少 1 个非空字符串 */
function tagsGap(p: Record<string, unknown>): string | null {
  const tags = strArr(p.tags).filter((t) => !isBlank(t))
  if (tags.length === 0) return 'tags 为空或全部空白'
  return null
}

/** difficulty 需为 1..5 的整数 */
function difficultyGap(p: Record<string, unknown>): string | null {
  const d = p.difficulty
  if (typeof d !== 'number' || !Number.isInteger(d) || d < 1 || d > 5) {
    return 'difficulty=' + String(d) + ' 应为 1..5 的整数'
  }
  return null
}

/** constraints 字符串格式：数据规模 + 时间复杂度 + 空间复杂度 */
function constraintsGap(p: Record<string, unknown>): string | null {
  const c = p.constraints
  if (isBlank(c)) return 'constraints 缺失或为空'
  if (typeof c !== 'string') return 'constraints 应为字符串'
  if (!c.includes('时间复杂度')) return 'constraints 应含时间复杂度，当前：' + c
  if (!c.includes('空间复杂度')) return 'constraints 应含空间复杂度，当前：' + c
  if (!c.includes('数据规模') && !c.includes('n ≤') && !c.includes('规模')) {
    return 'constraints 应含输入/数据规模描述，当前：' + c
  }
  return null
}

/** variantOf：字符串；无母题 = 空串 */
function variantOfGap(p: Record<string, unknown>): string | null {
  const v = p.variantOf
  if (typeof v !== 'string') return 'variantOf 应为字符串（无母题留空串）'
  return null
}

/** knowledgeIds / vizIds 必须存在（可为空数组），且都是字符串数组 */
function listFieldGap(p: Record<string, unknown>, field: string): string | null {
  const v = p[field]
  if (v === undefined) return field + ' 字段缺失（任务书：缺失走空数组，不得省略字段）'
  if (!Array.isArray(v)) return field + ' 应为数组'
  const bad = v.filter((x) => typeof x !== 'string')
  if (bad.length > 0) return field + ' 含有非字符串元素'
  return null
}

function checkAll(shards: ShardFile[], all: boolean): { issues: Issue[]; checked: number; total: number } {
  const issues: Issue[] = []
  const add = (level: Level, code: string, where: string, msg: string): void => {
    issues.push({ level, code, where, msg })
  }
  const newIds = loadNewIds()
  let problemCount = 0
  let checkedCount = 0

  for (const shard of shards) {
    for (const p of shard.problems) {
      const id = typeof p.id === 'string' ? p.id : ''
      if (!id) continue
      problemCount += 1
      const isNew = newIds.has(id)
      /** 默认只查新增题（任务05范围）；--all 才连历史题一起。DS 题（ds- 前缀）始终不在范围 */
      const scoped = isNew || (all && !id.startsWith('ds-'))
      if (!scoped) continue
      checkedCount += 1
      const where = shard.file + ' ' + id
      /** 新增题违规 = error（硬门槛）；--all 的历史题违规 = warn（不拦闸门）。历史题本来就是「旧」口径 */
      const level: Level = isNew ? 'error' : 'warn'

      for (const f of BASE_REQUIRED) {        if (isBlank(p[f])) add(level, 'SPEC-REQUIRED', where, '缺必填字段 ' + f)
      }
      for (const f of TASK_REQUIRED) {
        if (isBlank(p[f])) add(level, 'SPEC-TAGS', where, '缺必填字段 ' + f)
      }
      const tg = tagsGap(p)
      if (tg) add(level, 'SPEC-TAGS', where, tg)
      const dg = difficultyGap(p)
      if (dg) add(level, 'SPEC-DIFFICULTY', where, dg)

      // 可判分内容（按题型查询预期落在哪些字段，至少命中一组）
      const fields = CONTENT_FIELD[String(p.type)]
      if (fields) {
        const present = fields.filter((f) => p[f] !== undefined)
        if (present.length === 0) {
          add(level, 'SPEC-CONTENT', where, '题型 ' + String(p.type) + ' 缺全部判分内容字段（需要 ' + fields.join('/') + ' 之一）')
        }
      }

      // constraints 必填题型
      if (CONSTRAINTS_TYPES.has(String(p.type))) {
        const cg = constraintsGap(p)
        if (cg) add(level, 'SPEC-CONSTRAINTS', where, cg)
      }

      // variantOf / knowledgeIds / vizIds
      const vg = variantOfGap(p)
      if (vg) add(level, 'SPEC-VARIANTOF', where, vg)
      const kg = listFieldGap(p, 'knowledgeIds')
      if (kg) add(level, 'SPEC-LIST', where, kg)
      const zg = listFieldGap(p, 'vizIds')
      if (zg) add(level, 'SPEC-LIST', where, zg)

      // source 必须标注「自撰」或「自撰变式」
      const src = typeof p.source === 'string' ? p.source : ''
      if (src.indexOf('自撰') < 0) {
        add(level, 'SPEC-SOURCE', where, 'source 应标注「自撰」或「自撰变式」，当前：' + src)
      }
    }
  }

  if (problemCount === 0) add('error', 'SPEC-NO-DATA', 'data/problems', '一道题都没有')
  return { issues, checked: checkedCount, total: problemCount }
}

/* ============================== 主流程 ============================== */

const args = process.argv.slice(2)
const all = args.includes('--all')
const shards = loadShards()
const { issues, checked, total } = checkAll(shards, all)

for (const shard of shards) {
  console.log('分片 ' + shard.file.padEnd(14) + ' 题数=' + shard.problems.length)
}
console.log('')
console.log('检查范围：' + checked + ' / ' + total + '（默认仅新增题；--all 加历史 C 题）')
if (issues.length === 0) console.log('无告警')
for (const i of issues) console.log((i.level === 'error' ? '✗ ERROR ' : '! WARN  ') + '[' + i.code + '] ' + i.where + ' —— ' + i.msg)

const issueErrs = issues.filter((i) => i.level === 'error').length
const warns = issues.length - issueErrs
console.log('')
console.log('题目总数 ' + total + ' · error ' + issueErrs + ' · warn ' + warns)
process.exit(issueErrs === 0 ? 0 : 1)
