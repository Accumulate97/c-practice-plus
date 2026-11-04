/**
 * 参考答案面板（任务 05-阶段 5）。
 *
 * 规则（任务书 §2）：
 *   1. 默认折叠；提交判分后自动展开；可手动展开 / 收起；
 *   2. 展开/收起状态打进 localStorage（按题目 id 记住）；
 *   3. 顶部固定标注「参考答案仅供参考，判分以实机运行为准」；
 *   4. 参考代码展示：等宽 / 语法高亮 / 保留缩进与空行 / 一键复制；
 *   5. 描述型无标准答案题（answerIsDescription === true 且无 answer）如实说明，
 *      绝不编造。
 *
 * 数据的「参考答案」散落在不同字段里（宽类型 ProblemRecord），按题型归集：
 *   · 有完整参考解代码：reference / solution / fixed_code；
 *   · 读代码写结果：code + answer（预期输出），描述型则如实标注；
 *   · 概念/自评题：reviewPoints / keyPoints / reference_answer / grading_points /
 *     options+answer / blanks / correct_order / pairs 等。
 */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { ProblemRecord } from '../data/loader'
import { statusOf, useProgress } from '../progress/store'
import { CodeBlock } from '../../../components/common/CodeBlock'

const panel: CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg-elev)' }
const muted: CSSProperties = { color: 'var(--fg-muted)' }

const pad = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const padArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [])

/**
 * 有「完整参考代码」的题型 → 取哪个字段作为答案代码（学生可复制去对照 / 在游乐场跑）。
 * 程序阅读写结果（code_reading / pointer_trace）走 code + answer，不进这张表。
 */
const CODE_SOLUTION_FIELD: Record<string, string> = {
  programming: 'reference',
  algorithm_impl: 'reference',
  timed_impl: 'reference',
  stdlib_reimpl: 'reference',
  api_drill: 'reference',
  code_optimization: 'reference',
  code_completion: 'solution',
  multi_blank: 'solution',
  debug: 'fixed_code',
  multi_bug_debug: 'fixed_code',
}

/** localStorage 展开状态键 */
function storageKey(problemId: string): string {
  return `ref-answer-open:${problemId}`
}

export function ReferenceAnswerPanel({ problem }: { problem: ProblemRecord }) {
  const id = problem.id
  const record = useProgress((s) => s.records[id])
  const submitted = statusOf(record) !== 'todo'

  const [open, setOpen] = useState<boolean>(() => {
    if (submitted) return true
    try {
      return localStorage.getItem(storageKey(id)) === '1'
    } catch {
      return false
    }
  })

  // 提交判分后自动展开（某次判分落盘，submitted 翻真）。
  // 用 ref 记录是否已自动展开过，避免用户手动收起后又立刻被强制展开。
  const autoOpened = useRef(false)
  useEffect(() => {
    if (submitted && !autoOpened.current) {
      autoOpened.current = true
      setOpen(true)
      persistOpen(id, true)
    }
  }, [submitted, id])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      persistOpen(id, next)
      return next
    })
  }

  return (
    <section
      className="rounded-xl border"
      style={panel}
      data-role="reference-answer"
      data-open={open ? 'true' : 'false'}
    >
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        data-role="reference-answer-toggle"
      >
        <span className="text-sm font-semibold">
          📖 参考答案
          <span className="ml-2 text-xs font-normal" style={muted}>
            {open ? '点击收起' : '作答后再对照，点击展开'}
          </span>
        </span>
        <span className="text-xs" style={muted}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="mb-3 rounded-md border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--color-viz-swap)', background: 'var(--bg-elev)' }}>
            参考答案仅供参考，判分以实机运行为准。
          </p>
          <ReferenceBody problem={problem} />
        </div>
      )}
    </section>
  )
}

function persistOpen(id: string, v: boolean): void {
  try {
    localStorage.setItem(storageKey(id), v ? '1' : '0')
  } catch {
    /* localStorage 不可用时静默 */
  }
}

function ReferenceBody({ problem }: { problem: ProblemRecord }) {
  const rec = problem as unknown as Record<string, unknown>
  const type = String(problem.type ?? '')
  const explanation = pad(rec.explanation)

  // 1) 有完整参考解代码的题型
  const solutionField = CODE_SOLUTION_FIELD[type]
  if (solutionField) {
    const code = pad(rec[solutionField])
    return (
      <div className="space-y-3">
        {code.length > 0 ? (
          <div className="space-y-2">
            <CodeBlock code={code} title={solutionField === 'fixed_code' ? '修正后的完整代码' : '参考实现'} />
            <a
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs"
              style={{ borderColor: 'var(--border)' }}
              href={`#/playground?problem=${encodeURIComponent(String(problem.id))}&src=${encodeURIComponent(solutionField)}`}
              rel="noreferrer"
            >
              ▶️ 在游乐场中打开参考代码
            </a>
          </div>
        ) : (
          <p className="text-sm" style={muted}>本题暂未收录参考代码。</p>
        )}
        {explanation.length > 0 && (
          <div>
            <p className="text-sm font-semibold">💡 思路说明</p>
            <p className="mt-1 whitespace-pre-wrap text-sm" style={muted} data-role="explanation">{explanation}</p>
          </div>
        )}
      </div>
    )
  }

  // 2) 读代码写结果：code + answer（预期输出）；描述型如实标注
  if (type === 'code_reading' || type === 'pointer_trace') {
    const code = pad(rec.code)
    const answer = pad(rec.answer)
    const isDesc = rec.answerIsDescription === true
    if (isDesc || answer.length === 0) {
      return (
        <div className="space-y-3">
          <p className="text-sm" style={muted}>本题为描述型，无标准代码答案。</p>
          {code.length > 0 && <CodeBlock code={code} title="程序代码" />}
          {explanation.length > 0 && (
            <div>
              <p className="text-sm font-semibold">💡 思路说明</p>
              <p className="mt-1 whitespace-pre-wrap text-sm" style={muted} data-role="explanation">{explanation}</p>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {code.length > 0 && <CodeBlock code={code} title="程序代码" />}
        <div>
          <p className="text-sm font-semibold">🔍 预期输出</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-md border px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)' }}>{answer}</pre>
        </div>
        {explanation.length > 0 && (
          <div>
            <p className="text-sm font-semibold">💡 思路说明</p>
            <p className="mt-1 whitespace-pre-wrap text-sm" style={muted} data-role="explanation">{explanation}</p>
          </div>
        )}
      </div>
    )
  }

  // 3) 概念 / 自评 / 选择判断等：按字段展示
  return <ConceptBody problem={problem} />
}

function ConceptBody({ problem }: { problem: ProblemRecord }) {
  const rec = problem as unknown as Record<string, unknown>
  const type = String(problem.type ?? '')
  const explanation = pad(rec.explanation)
  const items: ReactNode[] = []

  // 单选：正确选项 + 解析；多选/判断等字段不同，按 type 分支
  if (type === 'single_choice') {
    const options = padArr(rec.options)
    const answer = rec.answer
    const idx = typeof answer === 'number' ? answer : -1
    items.push(
      <Field key="answer" label="正确答案">
        {idx >= 0 && idx < options.length
          ? `${String.fromCharCode(65 + idx)}. ${options[idx]}`
          : String(answer ?? '（未标注）')}
      </Field>,
    )
  } else if (type === 'true_false') {
    items.push(
      <Field key="answer" label="正确答案">{answerText(rec.answer)}</Field>,
    )
  } else if (type === 'fill_blank') {
    const blanks = Array.isArray(rec.blanks) ? rec.blanks : []
    items.push(
      <Field key="answer" label="填空答案">
        {blanks.length === 0
          ? '（未标注）'
          : blanks.map((b, i) => {
              const bb = b as { answer?: unknown; accepted?: unknown }
              const acc = Array.isArray(bb.accepted) ? (bb.accepted as unknown[]) : []
              const extra = acc.filter((x): x is string => typeof x === 'string').join(' / ')
              return (
                <div key={i} className="mb-1">
                  第 {i + 1} 空：{pad(bb.answer)}
                  {extra.length > 0 && <span className="ml-2 text-xs" style={muted}>（可接受：{extra}）</span>}
                </div>
              )
            })}
      </Field>,
    )
  } else if (type === 'complexity') {
    items.push(
      <Field key="answer" label="答案">{answerText(rec.answer)}</Field>,
    )
  } else if (type === 'short_answer') {
    const ra = pad(rec.reference_answer)
    if (ra) items.push(<Field key="ra" label="参考答案">{ra}</Field>)
    const gp = padArr(rec.grading_points)
    if (gp.length) items.push(<Field key="gp" label="评分要点">{gp.map((g, i) => <li key={i}>{g}</li>)}</Field>)
  } else if (type === 'matching') {
    const pairs = Array.isArray(rec.pairs) ? rec.pairs : []
    items.push(
      <Field key="answer" label="匹配关系">
        {pairs.length === 0
          ? '（未标注）'
          : pairs.map((p, i) => {
              const pp = p as { left?: unknown; right?: unknown }
              return <div key={i} className="mb-1">{pad(pp.left)} ↔ {pad(pp.right)}</div>
            })}
      </Field>,
    )
  } else if (type === 'code_ordering') {
    const lines = padArr(rec.lines)
    const order = Array.isArray(rec.correct_order) ? (rec.correct_order as unknown[]) : []
    items.push(
      <Field key="answer" label="正确顺序">
        {order.length === 0
          ? '（未标注）'
          : order.map((o, i) => {
              const n = typeof o === 'number' ? o : Number(o)
              const body = lines[n] ?? ''
              return <div key={i} className="mb-1">{i + 1}. {body}</div>
            })}
      </Field>,
    )
  } else if (type === 'code_review') {
    const rp = padArr(rec.reviewPoints)
    items.push(
      <Field key="answer" label="问题点与修正建议">
        {rp.length === 0 ? '（未标注）' : rp.map((r, i) => <li key={i}>{r}</li>)}
      </Field>,
    )
  } else if (type === 'term_explanation') {
    const kp = padArr(rec.keyPoints)
    if (kp.length) items.push(<Field key="answer" label="要点">{kp.map((k, i) => <li key={i}>{k}</li>)}</Field>)
    const ra = pad(rec.reference_answer)
    if (ra) items.push(<Field key="ra" label="参考解释">{ra}</Field>)
  } else if (type === 'essay_answer') {
    const ra = pad(rec.reference_answer)
    if (ra) items.push(<Field key="ra" label="参考作答">{ra}</Field>)
    const kp = padArr(rec.keyPoints)
    if (kp.length) items.push(<Field key="answer" label="要点">{kp.map((k, i) => <li key={i}>{k}</li>)}</Field>)
    items.unshift(
      <p key="note" className="text-xs" style={muted}>本题为自评题，无自动判分，请对照参考答案自行判断。</p>,
    )
  }

  if (items.length === 0 && explanation.length === 0) {
    return <p className="text-sm" style={muted}>本题暂未收录参考答案。</p>
  }

  return (
    <div className="space-y-3">
      {items}
      {explanation.length > 0 && (
        <div>
          <p className="text-sm font-semibold">💡 思路说明</p>
          <p className="mt-1 whitespace-pre-wrap text-sm" style={muted} data-role="explanation">{explanation}</p>
        </div>
      )}
    </div>
  )
}

function answerText(v: unknown): string {
  if (typeof v === 'boolean') return v ? '正确' : '错误'
  if (typeof v === 'number' || typeof v === 'string') return String(v)
  return '（未标注）'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">🔑 {label}</p>
      <div className="mt-1 whitespace-pre-wrap rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-elev)' }}>
        {children}
      </div>
    </div>
  )
}
