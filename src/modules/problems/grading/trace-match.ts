/**
 * 数值型 / 结构型答案的归一化与比对（阶段 3.0，服务 complexity_analysis 与 structure_trace）。
 *
 * ── 为什么不并进 text-match.ts ─────────────────────────────────────────────
 * text-match.ts 比的是**一个词**（「编译」/「O(n^2)」），归一化可以大胆剥标点、折大小写。
 * 这两型比的是**一串有结构的记号**：遍历序列 `13 27 38 49`、括号表示法 `45(24(12,37),53(-,93))`、
 * 以及 ASL `49/15` 这类**分数**。它们的归一化规则正好相反：
 *   · 小数点 `.` 必须保留（text-match 会把它当标点剥掉，`3.2667` 会变成 `32667`）；
 *   · 连字符 `-` 必须保留（括号表示法里 `-` 是「这个孩子为空」的记号，不是分隔符）；
 *   · 空白与逗号、顿号、分号、箭头要**统一成同一个分隔符**，因为学生写 `13 27` 与 `13,27`
 *     与 `13 → 27` 是同一个答案，但 `1327` 不是。
 * 所以独立一份，且只被这两型的渲染器 import；概念题与代码题的判分路径一行都不碰。
 *
 * ── 三条规矩（与 text-match.ts 同源，不会破例）──────────────────────────────
 *   1. 期望值为空 = 数据缺陷，一律 false：绝不用空串当期望，否则交白卷会被判「通过」；
 *   2. 归一化只做**无损的等价变形**（NFKC、上标转数字、分隔符统一、大小写不敏感），
 *      不做同义词猜测、不做单位换算、不把分数自动四舍五入成小数 —— 猜错的代价由学生承担；
 *   3. 数值题的「精确」由 tolerance 显式给出，缺省 0。期望写 `49/15` 而学生写 `3.27` 时，
 *      判分层不会替他四舍五入：要放宽就在数据里写 accepted 或 tolerance，让出题人负责。
 */
import { SUPERSCRIPTS, asText } from './text-match'

/** 一道「逐问」的判分目标（schema 的 #/definitions/gradedAsk） */
export interface GradedAsk {
  label: string
  answer: string
  accepted: string[]
  tolerance: number
  unit: string
  hint: string
}

/** 把 unknown 收窄成 GradedAsk[]：非法项直接丢弃，缺字段给安全默认值（绝不抛错） */
export function readAsks(value: unknown): GradedAsk[] {
  if (!Array.isArray(value)) return []
  const out: GradedAsk[] = []
  for (const raw of value) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const answer = asText(o.answer)
    if (answer.trim().length === 0) continue          // 没有期望值的问题不可判分，整条丢弃
    const tolRaw = o.tolerance
    const tol = typeof tolRaw === 'number' && Number.isFinite(tolRaw) && tolRaw > 0 ? tolRaw : 0
    out.push({
      label: asText(o.label),
      answer,
      accepted: Array.isArray(o.accepted) ? o.accepted.filter((a): a is string => typeof a === 'string') : [],
      tolerance: tol,
      unit: asText(o.unit),
      hint: asText(o.hint),
    })
  }
  return out
}

/** 纯数字（可带正负号与小数部分） */
const NUM_RE = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/
/** 分数 a/b：ASL 的标准写法就是分数，学生照抄分数形式必须能判对 */
const FRAC_RE = /^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/

/**
 * 取数值。支持 `49`、`3.2667`、`-7`、`49/15`、`25.3%`、`49 次`、`224 bit`。
 * 解析不出来（例如 `O(n log n)`）返回 null —— 调用方据此退回文本比对，判分层不猜。
 *
 * 尾随单位（次/bit/层/个/步/倍…）被剥掉：单位属于展示，不属于答案本身，
 * 所以「49」与「49 次」是同一个答案。但**不做单位换算**：「0.253」不会被当成「25.3%」。
 */
export function numericValue(input: unknown): number | null {
  let t = asText(input).normalize('NFKC').replace(/\s+/g, '')
  t = [...t].map((ch) => SUPERSCRIPTS[ch] ?? ch).join('')
  if (t.endsWith('%')) t = t.slice(0, -1)
  // 剥掉尾随的单位文字（中文或拉丁字母），数字与小数点、正负号、分数杠都保住
  t = t.replace(/[a-z\u4e00-\u9fa5]+$/i, '')
  if (t.length === 0) return null
  const frac = FRAC_RE.exec(t)
  if (frac !== null) {
    const num = Number(frac[1])
    const den = Number(frac[2])
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null
    return num / den
  }
  if (!NUM_RE.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}

/**
 * 浮点噪声容差：49/15 与 3.2666666666666666 在 IEEE754 下差 1e-16 量级，
 * 不给这一点余量，「精确相等」会因为二进制表示而误判。1e-9 远小于任何有意义的答题精度
 * （ASL 通常给到 4 位小数），所以它不是放宽判分，只是消掉表示误差。
 */
const FLOAT_EPS = 1e-9

/** 数值比对：期望解析不出数值一律 false（交回文本比对）；tolerance 缺省 0 = 必须精确相等 */
export function numericMatches(input: unknown, expected: unknown, tolerance?: number): boolean {
  const want = numericValue(expected)
  if (want === null) return false
  const got = numericValue(input)
  if (got === null) return false
  const tol = typeof tolerance === 'number' && Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 0
  return Math.abs(got - want) <= tol + FLOAT_EPS
}

/**
 * 结构型文本归一化：箭头与各种分隔符统一成 `,`，折叠重复分隔符、剥首尾分隔符、小写。
 * 保留 `.`（小数点）与 `-`（括号表示法里的空孩子记号）—— 这两个字符是答案的一部分。
 *
 *   `13 27 38`            → `13,27,38`
 *   `13, 27、38；49`      → `13,27,38,49`
 *   `13 → 27 -> 38`       → `13,27,38`
 *   `45(24(12, 37), 53(-, 93))` → `45(24(12,37),53(-,93))`
 */
export function normalizeTraceText(input: unknown): string {
  let t = asText(input).normalize('NFKC')
  t = [...t].map((ch) => SUPERSCRIPTS[ch] ?? ch).join('')
  // 箭头先转成分隔符，免得 `->` 里的 `-` 被当成正负号留下
  t = t.replace(/(-=+>|->|-->|→|⟶|⇒|=>)/g, ',')
  t = t.replace(/[\s,，、;；|]+/g, ',')
  t = t.replace(/,+/g, ',').replace(/^,+|,+$/g, '')
  return t.toLowerCase()
}

/** 结构型比对：与 answer 或 accepted 中任一项归一化后全等即算对；期望为空一律 false */
export function traceMatches(input: unknown, expected: unknown, accepted?: unknown): boolean {
  const want = normalizeTraceText(expected)
  if (want.length === 0) return false
  const got = normalizeTraceText(input)
  if (got.length === 0) return false
  if (got === want) return true
  if (!Array.isArray(accepted)) return false
  return accepted.some((alt) => {
    const a = normalizeTraceText(alt)
    return a.length > 0 && a === got
  })
}

/**
 * 一条 gradedAsk 的判分：期望是数值就按数值比（带 tolerance），
 * 否则按结构文本比；两条路都走一遍，因为「49/15」既是数值也是字面串，
 * 学生照抄分数形式（文本相等）与写成小数（数值相等）都该判对。
 */
export function askMatches(input: unknown, ask: GradedAsk): boolean {
  if (numericMatches(input, ask.answer, ask.tolerance)) return true
  if (traceMatches(input, ask.answer, ask.accepted)) return true
  return ask.accepted.some((alt) => numericMatches(input, alt, ask.tolerance))
}
