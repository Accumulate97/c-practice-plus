/**
 * 数值型复杂度与 ASL 分析题（complexity_analysis）渲染器 —— 阶段 3.0 新增三型之一。
 *
 * 与既有 complexity 型的区别：complexity 只问**一个渐近结论**（O(n log n)），
 * 这一型问的是**一组具体数值**（ASL成功 49/15、比较次数 27、递归深度 4、WPL 224），
 * 全部数值精确比对（tolerance 缺省 0）。一道题最多 6 问，逐问独立给对错，
 * 全对才算通过 —— 与 code_reading 那种「一个字符都不能差」的口径一致。
 *
 * 判分走 grading/trace-match.ts 的纯函数，不联网、不消耗 Godbolt 额度。
 * 期望值缺失 → 数据缺陷、禁用提交（用空串当期望会把交白卷判成通过）。
 *
 * code 字段是可选的：有的题给程序让学生数比较次数，有的题只给一句文字描述
 * （「对长度为 15 的有序表做折半查找，求成功时的 ASL」），所以 code 为空不算缺陷。
 */
import { useCallback, useMemo, useState } from 'react'
import type { ProblemRecord } from '../data/loader'
import { recordAttempt } from '../progress/store'
import { complexityMatches } from '../grading/text-match'
import { askMatches, readAsks, type GradedAsk } from '../grading/trace-match'
import {
  ActionRow, Button, CodeBlock, DefectPanel, ExplanationBlock, StemBlock, VerdictBanner,
  TONE, control, muted, panel,
} from './concept-shared'

type AnalysisTarget =
  | { kind: 'ok'; code: string; asks: GradedAsk[]; complexity: string; complexityAccepted: string[]; askSpace: boolean }
  | { kind: 'defect'; code: string; reason: string }

export function complexityAnalysisTarget(problem: ProblemRecord): AnalysisTarget {
  const code = typeof problem.code === 'string' ? problem.code : ''
  const askSpace = problem.askSpace === true
  const asks = readAsks(problem.asks)
  const complexity = typeof problem.complexity === 'string' ? problem.complexity.trim() : ''
  const complexityAccepted = Array.isArray(problem.accepted)
    ? problem.accepted.filter((a): a is string => typeof a === 'string')
    : []
  if (asks.length === 0 && complexity.length === 0) {
    return {
      kind: 'defect',
      code,
      reason: 'asks 与 complexity 都是空的：没有任何期望值就无法判分（用空串当期望会把交白卷判成「通过」），故禁用提交。',
    }
  }
  return { kind: 'ok', code, asks, complexity, complexityAccepted, askSpace }
}

interface Props {
  problem: ProblemRecord
}

export function ComplexityAnalysisRenderer({ problem }: Props) {
  const target = useMemo(() => complexityAnalysisTarget(problem), [problem])
  const ok = target.kind === 'ok'
  // 输入框个数 = asks 条数 + （complexity 非空时多一格渐近结论）
  const rowCount = ok ? target.asks.length + (target.complexity.length > 0 ? 1 : 0) : 0
  const [values, setValues] = useState<string[]>(() => Array.from({ length: rowCount }, () => ''))
  const [results, setResults] = useState<Array<boolean | null>>(() => Array.from({ length: rowCount }, () => null))
  const [passed, setPassed] = useState<boolean | null>(null)

  const gradeable = ok && rowCount > 0
  const filled = values.some((v) => v.trim().length > 0)

  const submit = useCallback(() => {
    if (!ok || target.kind !== 'ok' || rowCount === 0) return
    const next: Array<boolean | null> = []
    const parts: string[] = []
    target.asks.forEach((ask, i) => {
      const v = (values[i] ?? '').trim()
      const hit = v.length > 0 && askMatches(v, ask)
      next.push(hit)
      parts.push(`${ask.label}=${v.length > 0 ? v : '(空)'}${hit ? '✓' : '✗'}`)
    })
    if (target.complexity.length > 0) {
      const v = (values[target.asks.length] ?? '').trim()
      const hit = v.length > 0 && complexityMatches(v, target.complexity, target.complexityAccepted)
      next.push(hit)
      parts.push(`${target.askSpace ? '空间复杂度' : '时间复杂度'}=${v.length > 0 ? v : '(空)'}${hit ? '✓' : '✗'}`)
    }
    const allOk = next.every((r) => r === true)
    setResults(next)
    setPassed(allOk)
    recordAttempt(problem.id, allOk, { text: parts.join('；'), kind: 'text' })
  }, [ok, problem.id, rowCount, target, values])

  const reset = useCallback(() => {
    setValues(Array.from({ length: rowCount }, () => ''))
    setResults(Array.from({ length: rowCount }, () => null))
    setPassed(null)
  }, [rowCount])

  const wrongCount = results.filter((r) => r === false).length
  const rightCount = results.filter((r) => r === true).length

  const row = (i: number, label: string, placeholder: string, unit: string, hint: string, result: boolean | null, expected: string) => (
    <div key={i} className="mt-3 first:mt-0" data-role="cxa-row" data-index={i}>
      <label className="text-sm font-semibold" style={muted} htmlFor={`cxa-${problem.id}-${i}`}>
        {label}
        {unit.length > 0 && <span className="ml-1 text-xs">（{unit}）</span>}
      </label>
      <input
        id={`cxa-${problem.id}-${i}`}
        className="cp-focus-ring mt-1 w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ ...control, fontFamily: 'var(--font-mono)' }}
        value={values[i] ?? ''}
        disabled={!gradeable}
        placeholder={placeholder}
        onChange={(e) => setValues((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        data-role="cxa-field"
        data-index={i}
      />
      {hint.length > 0 && <p className="mt-1 text-xs" style={muted}>{hint}</p>}
      {result !== null && (
        <p className="mt-1 text-xs" style={{ color: result ? TONE.good : TONE.bad }} data-role="cxa-row-result" data-index={i}>
          {result ? '✓ 这一问对了' : `✗ 这一问错了，正确答案是 ${expected}`}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <StemBlock stem={problem.stem} dedupeAgainst={ok ? [target.code] : []} />

      {target.kind === 'ok' && target.code.trim().length > 0 && (
        <section className="rounded-xl border p-4" style={panel}>
          <CodeBlock code={target.code} title="待分析的程序" />
        </section>
      )}
      {target.kind === 'defect' && (
        <>
          {target.code.trim().length > 0 && (
            <section className="rounded-xl border p-4" style={panel}>
              <CodeBlock code={target.code} title="待分析的程序" />
            </section>
          )}
          <DefectPanel title="本题无法在线判分（数据缺陷）" body={target.reason} />
        </>
      )}

      <section
        className="rounded-xl border p-4"
        style={panel}
        data-role="cxa-input"
        data-rows={rowCount}
        data-answerable={gradeable ? 'true' : 'false'}
      >
        <p className="text-sm font-semibold" style={muted}>
          逐问作答（共 {rowCount} 问，全部数值精确比对；分数就写分数，如 49/15）
        </p>
        {target.kind === 'ok' && (
          <>
            {target.asks.map((ask, i) => row(
              i,
              ask.label.length > 0 ? ask.label : `第 ${i + 1} 问`,
              ask.tolerance > 0 ? `允许误差 ±${ask.tolerance}` : '精确值',
              ask.unit,
              ask.hint,
              results[i] ?? null,
              ask.answer,
            ))}
            {target.complexity.length > 0 && row(
              target.asks.length,
              target.askSpace ? '空间复杂度' : '时间复杂度',
              '例如 O(n log n)',
              '',
              '写法宽松：O(n^2) / o (n²) / O(n**2) / 只写 n^2 都算同一个答案。',
              results[target.asks.length] ?? null,
              target.complexity,
            )}
          </>
        )}
        <div className="mt-3">
          <ActionRow>
            <Button onClick={submit} tone="good" disabled={!gradeable || !filled} role="cxa-submit">提交判分</Button>
            <Button onClick={reset} role="cxa-reset">清空重做</Button>
          </ActionRow>
        </div>
      </section>

      {passed !== null && (
        <VerdictBanner
          tone={passed ? 'good' : 'bad'}
          title={passed ? `✓ 全部 ${rowCount} 问都答对了` : `✗ 答对 ${rightCount} 问、答错 ${wrongCount} 问（共 ${rowCount} 问）`}
          detail={passed
            ? '已记入进度：本题标记为「已通过」。数值题不给部分分，全对才算过。'
            : '已记入错题本。数值分析题的常见错因是口径：ASL 的分母是「查找次数」还是「关键字个数」、失败时的分母是表长还是散列地址个数，两者能差出一倍。'}
        />
      )}

      <ExplanationBlock text={typeof problem.explanation === 'string' ? problem.explanation : ''} />
    </div>
  )
}
