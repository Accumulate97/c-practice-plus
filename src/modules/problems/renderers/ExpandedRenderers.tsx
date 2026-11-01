/**
 * 任务04 · 第0批新增概念题型渲染器（term_explanation / essay_answer / code_review）。
 *
 * 三类都**不联网、不编译**，纯前端即时判定，与阶段5七类辅助型同构。
 *   · term_explanation：术语解释。判分口径 = 学生作答命中 keyPoints 的个数 ≥ 总数-1 即通过。
 *   · code_review：代码评审。判分口径 = 命中 reviewPoints 的个数 ≥ 总数-1 即通过。
 *   · essay_answer：论述题。**不自动判分**，给参考论述与评分要点让学生自评（同 short_answer）。
 *
 * ── keyPoints / reviewPoints 的命中算法（诚实性说明）────────────────────────
 * 文本语义匹配无法做到 100% 准确（AGENTS.md 二·7 只禁止伪造「通过」，不禁止近似判分）。
 * 这里用**关键词包含**做近似：一个要点被「命中」当且仅当它的任一内容词
 * （中文 2+ 字串 / 英文词，剔除常见虚词）出现在学生作答里，或要点整体作为子串出现。
 * 学生用自己的话说、但提到了核心概念即可计入；没提到该概念则不计。判定结果在
 * UI 上标注「关键词比对」，并展示每一条要点的命中情况，学生可据此自纠。
 * 数据缺陷（keyPoints 为空）一律不判分，显示 DefectPanel，绝不空串当期望判「通过」。
 */
import { useCallback, useMemo, useState } from 'react'
import type { ProblemRecord } from '../data/loader'
import { recordAttempt, recordSelfAssessment } from '../progress/store'
import { normalizeConceptText } from '../grading/text-match'
import {
  ActionRow, Button, CodeBlock, DefectPanel, ExplanationBlock, StemBlock, VerdictBanner,
  TONE, control, muted, panel, splitStem,
} from './concept-shared'

interface Props {
  problem: ProblemRecord
}

/** 中文虚词/常见连接词，抽要点关键词时剔除，避免「指针」被「的」淹没 */
const STOPWORDS = new Set(['的', '了', '是', '在', '中', '与', '和', '或', '指', '一个', '一种', '就是', '可以', '表示', '用来'])

/** 抽取一个要点里的内容词：中文 2+ 字连续串，或 ASCII 字母数字 token */
function contentTokens(point: string): string[] {
  const tokens: string[] = []
  const norm = point.replace(/\s+/g, ' ')
  // 中文连续段
  const cjk = /[\u4e00-\u9fff]+/g
  let m: RegExpExecArray | null
  while ((m = cjk.exec(norm)) !== null) {
    const seg = m[0]
    if (seg.length >= 2 && !STOPWORDS.has(seg)) tokens.push(seg)
  }
  // ASCII 词（含下划线）
  const ascii = /[A-Za-z_][A-Za-z0-9_]*/g
  while ((m = ascii.exec(norm)) !== null) {
    const seg = m[0]
    if (seg.length >= 2) tokens.push(seg)
  }
  return tokens
}

/** 要点是否被命中：要点整体作为子串，或任一内容词出现 */
export function keypointHit(text: string, point: string): boolean {
  const t = normalizeConceptText(text)
  const p = normalizeConceptText(point)
  if (p.length === 0) return false
  if (t.length === 0) return false
  if (t.includes(p)) return true
  const tokens = contentTokens(point)
  return tokens.some((tok) => t.includes(tok.toLowerCase()))
}

/** 计算命中数；空要点列表返回 0 */
export function keypointHits(text: string, points: string[]): number {
  let hits = 0
  for (const p of points) if (keypointHit(text, p)) hits += 1
  return hits
}

export function keypointPassed(text: string, points: string[]): boolean {
  const total = points.length
  if (total === 0) return false
  return keypointHits(text, points) >= total - 1
}

/* ─────────────────────────────── 通用：关键词比对型 ─────────────────────────────── */

interface KeypointProps extends Props {
  /** 判分要点数组（keyPoints / reviewPoints） */
  points: string[]
  /** 参考正文（reference_answer），可选 */
  reference: string
  /** 要点区标题 */
  pointsTitle: string
  /** 输入框 label */
  inputLabel: string
  /** 提交按钮文字 */
  submitLabel: string
  /** 存疑提示 */
  dataRole: string
  /** 空缺陷文案 */
  defectTitle: string
  defectBody: string
}

function KeypointGradedRenderer({ problem, points, reference, pointsTitle, inputLabel, submitLabel, dataRole, defectTitle, defectBody }: KeypointProps) {
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const total = points.length
  const hits = useMemo(() => keypointHits(draft, points), [draft, points])
  const passed = total > 0 && hits >= total - 1

  const submit = useCallback(() => {
    if (total === 0) return
    setSubmitted(true)
    recordAttempt(problem.id, passed, { text: draft, kind: 'choice' })
  }, [problem.id, draft, passed, total])

  const reset = useCallback(() => {
    setDraft('')
    setSubmitted(false)
  }, [])

  return (
    <div className="space-y-4">
      <StemBlock stem={problem.stem} />

      <section className="rounded-xl border p-4" style={panel} data-role={dataRole}>
        <h2 className="text-sm font-semibold" style={muted}>{inputLabel}</h2>
        <textarea
          className="mt-2 w-full resize-y rounded-lg border p-3 text-sm outline-none"
          style={control}
          rows={6}
          value={draft}
          placeholder="用自己的话写完整。要点是关键词比对，提到核心概念即计入，不必照抄原话。"
          onChange={(e) => setDraft(e.target.value)}
          data-role={dataRole + '-input'}
          aria-label={inputLabel}
        />
        <div className="mt-2 text-xs" style={muted}>
          <ActionRow>
            <Button onClick={submit} disabled={total === 0} role={dataRole + '-submit'}>{submitLabel}</Button>
            <Button onClick={reset} role={dataRole + '-reset'}>清空重来</Button>
            <span>{total === 0 ? '（无要点数据）' : `${hits}/${total} 个要点已命中`}</span>
          </ActionRow>
        </div>
      </section>

      {total === 0 && (
        <DefectPanel title={defectTitle} body={defectBody} />
      )}

      {submitted && total > 0 && (
        <VerdictBanner
          tone={passed ? 'good' : 'bad'}
          title={passed ? `✓ 通过：命中 ${hits}/${total} 个要点` : `◐ 未通过：命中 ${hits}/${total} 个要点（需 ≥ ${total - 1} 个）`}
          detail={passed
            ? '关键词比对判定通过。可对照下方要点自查是否还有遗漏。'
            : '关键词比对判定未通过。对照下方要点，把漏掉的概念补进作答里再提交一次。'}
        />
      )}

      {submitted && total > 0 && (
        <section className="rounded-xl border p-4" style={panel} data-role={dataRole + '-points'}>
          <h2 className="text-sm font-semibold" style={{ color: TONE.warn }}>{pointsTitle}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {points.map((pt, i) => {
              const hit = keypointHit(draft, pt)
              return (
                <li key={i} data-hit={hit ? 'true' : 'false'} style={{ color: hit ? 'var(--fg-ok)' : 'var(--fg-muted)' }}>
                  {hit ? '✓ ' : '○ '}{pt}
                </li>
              )
            })}
          </ul>
          {reference.trim().length > 0 && (
            <div className="mt-3">
              <div className="text-xs" style={muted}>参考完整解释（关键词比对不计入，仅对照）</div>
              <div className="mt-1 space-y-2">
                {splitStem(reference).map((part, i) =>
                  part.kind === 'code' ? <CodeBlock key={i} code={part.body} /> : (
                    <p key={i} className="text-sm whitespace-pre-wrap">{part.body}</p>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <ExplanationBlock text={typeof problem.explanation === 'string' ? problem.explanation : ''} />
    </div>
  )
}

/* ─────────────────────────────── 术语解释 ─────────────────────────────── */

export function TermExplanationRenderer({ problem }: Props) {
  const points = useMemo(() => {
    const raw = problem.keyPoints
    return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string' && p.trim().length > 0) : []
  }, [problem])
  const reference = typeof problem.reference_answer === 'string' ? problem.reference_answer : ''
  return (
    <KeypointGradedRenderer
      problem={problem}
      points={points}
      reference={reference}
      pointsTitle="判定要点（命中 ≥ 总数-1 即通过）"
      inputLabel="我的解释（只存本机，不联网）"
      submitLabel="判分"
      dataRole="te"
      defectTitle="题库没有给出这一题的关键点（数据缺口）"
      defectBody="本题 keyPoints 为空，无法做关键词比对，故不判分。属数据缺陷，请对照题干/知识点汇总自行推导。"
    />
  )
}

/* ─────────────────────────────── 代码评审 ─────────────────────────────── */

export function CodeReviewRenderer({ problem }: Props) {
  const points = useMemo(() => {
    const raw = problem.reviewPoints
    return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string' && p.trim().length > 0) : []
  }, [problem])
  const reference = typeof problem.reference_answer === 'string' ? problem.reference_answer : ''
  const code = typeof problem.code === 'string' ? problem.code : ''
  return (
    <div className="space-y-4">
      <StemBlock stem={problem.stem} />
      {code.trim().length > 0 && (
        <section className="rounded-xl border p-4" style={panel} data-role="cr-code">
          <h2 className="text-sm font-semibold" style={muted}>待评审代码</h2>
          <div className="mt-2"><CodeBlock code={code} /></div>
        </section>
      )}
      <KeypointGradedRenderer
        problem={problem}
        points={points}
        reference={reference}
        pointsTitle="应指出的问题（命中 ≥ 总数-1 即通过）"
        inputLabel="列出你发现的问题（每行一个，只存本机，不联网）"
        submitLabel="判分"
        dataRole="cr"
        defectTitle="题库没有给出这一题的评审要点（数据缺口）"
        defectBody="本题 reviewPoints 为空，无法做关键词比对，故不判分。属数据缺陷，请对照代码自行推敲。"
      />
    </div>
  )
}

/* ─────────────────────────────── 论述题（自评） ─────────────────────────────── */

export function EssayAnswerRenderer({ problem }: Props) {
  const keyPoints = useMemo(() => {
    const raw = problem.keyPoints
    return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string' && p.trim().length > 0) : []
  }, [problem])
  const reference = typeof problem.reference_answer === 'string' ? problem.reference_answer : ''
  const [draft, setDraft] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null)

  const hasReference = reference.trim().length > 0
  const hasPoints = keyPoints.length > 0

  const reveal = useCallback(() => setRevealed(true), [])
  const selfAssess = useCallback((ok: boolean) => {
    setVerdict(ok ? 'pass' : 'fail')
    recordSelfAssessment(problem.id, ok, {
      text: `自评：${ok ? '我答对了' : '还没答对'}\n\n我的作答：\n${draft.trim().length > 0 ? draft.trim() : '（没有写下作答内容）'}`,
      kind: 'self',
    })
  }, [draft, problem.id])
  const reset = useCallback(() => {
    setDraft('')
    setRevealed(false)
    setVerdict(null)
  }, [])

  return (
    <div className="space-y-4">
      <StemBlock stem={problem.stem} />

      <section className="rounded-xl border p-4" style={panel} data-role="ea-answer">
        <h2 className="text-sm font-semibold" style={muted}>我的论述（只存本机，不上传、不自动判分）</h2>
        <textarea
          className="mt-2 w-full resize-y rounded-lg border p-3 text-sm outline-none"
          style={control}
          rows={8}
          value={draft}
          placeholder="先完整写一遍，再对照参考论述与评分要点自评。论述题不联网判分，写不写都不影响判题额度。"
          onChange={(e) => setDraft(e.target.value)}
          data-role="ea-input"
          aria-label="论述题作答区"
        />
        <div className="mt-2 text-xs" style={muted}>
          <ActionRow>
            <Button onClick={reveal} disabled={revealed} role="ea-reveal">显示参考论述与评分要点</Button>
            <Button onClick={reset} role="ea-reset">清空重来</Button>
            <span>{draft.trim().length > 0 ? `已写 ${draft.trim().length} 字` : '还没有作答内容'}</span>
          </ActionRow>
        </div>
      </section>

      {!hasReference && !hasPoints && (
        <DefectPanel
          title="题库没有给出这一题的参考论述（数据缺口）"
          body="本题 reference_answer 与 keyPoints 均为空，无法对照。请依据题干与知识点汇总自行论述后再自评。"
        />
      )}

      {revealed && (
        <section className="rounded-xl border p-4" style={panel} data-role="ea-reference">
          <h2 className="text-sm font-semibold" style={{ color: TONE.warn }}>参考论述（供自评，不是机器判分依据）</h2>
          {hasReference ? (
            <div className="mt-2 space-y-3">
              {splitStem(reference).map((part, i) =>
                part.kind === 'code' ? <CodeBlock key={i} code={part.body} /> : (
                  <p key={i} className="text-sm whitespace-pre-wrap">{part.body}</p>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm" style={muted}>（数据里没有参考论述正文）</p>
          )}
          {hasPoints && (
            <div className="mt-3">
              <div className="text-xs" style={muted}>评分要点（逐条对照，缺一条就还没答全）</div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm" data-role="ea-points">
                {keyPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-3">
            <ActionRow>
              <Button onClick={() => selfAssess(true)} role="ea-self-pass" tone="good">✓ 对照后我答对了</Button>
              <Button onClick={() => selfAssess(false)} role="ea-self-fail" tone="bad">✗ 还没答对</Button>
              <span className="text-xs" style={muted}>自评结论会记进进度，但标注为「来自你的自评」，不计入机器判分正确率。</span>
            </ActionRow>
          </div>
        </section>
      )}

      {verdict !== null && (
        <VerdictBanner
          tone={verdict === 'pass' ? 'good' : 'bad'}
          title={verdict === 'pass' ? '✓ 你自评「答对了」' : '◐ 你自评「还没答对」'}
          detail={verdict === 'pass'
            ? '本题在「📈 我的进度」里会显示为已通过，并标注结论来自自评。'
            : '本题会进错题本并标注为自评结论；重新自评一次即可更新。'}
        />
      )}

      <ExplanationBlock text={typeof problem.explanation === 'string' ? problem.explanation : ''} />
    </div>
  )
}
