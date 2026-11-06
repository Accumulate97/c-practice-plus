/**
 * 结构构造追踪题（structure_trace）渲染器 —— 阶段 3.0 新增三型之一。
 *
 * 题目给一个输入序列（或一组边），要求写出**构造出来的数据结构长什么样**：
 * BST / AVL 的括号表示法、哈夫曼树的编码表与 WPL、堆排序某趟之后的数组、
 * 最小生成树的边集、拓扑序列、散列表的最终格局……以及它的各种遍历序列。
 *
 * ── 判分口径 ────────────────────────────────────────────────────────────
 * 三类判分目标（schema 里都是可选，至少有一个非空）：
 *   · nodeSpec           最终结构的括号表示法 / 堆的数组形式
 *   · traversalOrder[]   逐条遍历序列（先序 / 中序 / 后序 / 层序），每条独立判分
 *   · constructionResult 构造结果（MST 边集与总权值 / 编码表 / WPL / 拓扑序列 / 关键路径）
 * 全部走 grading/trace-match.ts：分隔符（空白、逗号、顿号、分号、箭头）统一后全等比对，
 * 所以 `13 27 38` 与 `13,27,38` 与 `13 → 27 → 38` 是同一个答案；
 * 但**元素次序必须完全一致**，`27 13 38` 不算对 —— 结构题的答案就是次序本身。
 * 纯数值（如 WPL=224）自动走数值精确比对。
 *
 * ── 为什么 traceSteps 不参与判分 ─────────────────────────────────────────
 * 分步快照是「构造过程」的展示（每插入一个元素后的形态），它对学生是提示、对判分是噪声：
 * 让学生逐趟填空会把一道结构题变成十几道小题，且每趟的写法歧义太大（数组？括号？画图？）。
 * 所以它只渲染在折叠面板里，判分只认上面三类目标。
 *
 * ── 边集这类「次序可等价」的答案怎么办 ───────────────────────────────────
 * 不做集合比对（那需要判分层理解算法语义，属于猜答案）。约定由**题干**规定书写次序，
 * 例如「按 Kruskal 考虑边的先后次序写出被选中的边集」。数据里 traceSteps 给出过程，
 * 学生照着过程写就不会有歧义。
 */
import { useCallback, useMemo, useState } from 'react'
import type { ProblemRecord } from '../data/loader'
import { recordAttempt } from '../progress/store'
import { askMatches, readAsks, type GradedAsk } from '../grading/trace-match'
import {
  ActionRow, Button, CodeBlock, DefectPanel, ExplanationBlock, StemBlock, VerdictBanner,
  TONE, control, muted, panel,
} from './concept-shared'

/** structureKind → 中文名（只用于展示，不参与判分；表外的值原样显示） */
const KIND_LABEL: Record<string, string> = {
  bst: '二叉排序树',
  avl: '平衡二叉树（AVL）',
  huffman: '哈夫曼树',
  heap: '堆',
  mst: '最小生成树',
  shortest_path: '最短路径',
  topo: '拓扑序列',
  critical_path: '关键路径',
  hash_table: '散列表',
  btree: 'B-树 / B+树',
  forest: '树与森林',
  general_list: '广义表',
  other: '其他结构',
}

/** 把 nodeSpec / constructionResult 这类裸字符串包装成一条 gradedAsk，好用同一套判分 */
function plainAsk(label: string, answer: string): GradedAsk {
  return { label, answer, accepted: [], tolerance: 0, unit: '', hint: '' }
}

type TraceTarget =
  | { kind: 'ok'; sequence: string; kindRaw: string; kindLabel: string; code: string; rows: GradedAsk[]; steps: string[] }
  | { kind: 'defect'; sequence: string; kindRaw: string; kindLabel: string; code: string; rows: GradedAsk[]; steps: string[]; reason: string }

export function structureTraceTarget(problem: ProblemRecord): TraceTarget {
  const sequence = typeof problem.sequence === 'string' ? problem.sequence : ''
  const rawKind = typeof problem.structureKind === 'string' ? problem.structureKind : ''
  const kindLabel = KIND_LABEL[rawKind] ?? (rawKind.length > 0 ? rawKind : '（未标注结构类别）')
  const code = typeof problem.code === 'string' ? problem.code : ''
  const steps = Array.isArray(problem.traceSteps)
    ? problem.traceSteps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : []
  const nodeSpec = typeof problem.nodeSpec === 'string' ? problem.nodeSpec.trim() : ''
  const constructionResult = typeof problem.constructionResult === 'string' ? problem.constructionResult.trim() : ''
  const rows: GradedAsk[] = []
  if (nodeSpec.length > 0) rows.push(plainAsk('最终结构', nodeSpec))
  for (const ask of readAsks(problem.traversalOrder)) rows.push(ask)
  if (constructionResult.length > 0) rows.push(plainAsk('构造结果', constructionResult))
  if (rows.length === 0) {
    return {
      kind: 'defect',
      sequence, kindRaw: rawKind, kindLabel, code, rows: [], steps,
      reason: 'nodeSpec / traversalOrder / constructionResult 全是空的：没有任何期望答案就无法判分（用空串当期望会把交白卷判成「通过」），故禁用提交。',
    }
  }
  return { kind: 'ok', sequence, kindRaw: rawKind, kindLabel, code, rows, steps }
}

interface Props {
  problem: ProblemRecord
}

export function StructureTraceRenderer({ problem }: Props) {
  const target = useMemo(() => structureTraceTarget(problem), [problem])
  const rowCount = target.rows.length
  const [values, setValues] = useState<string[]>(() => Array.from({ length: rowCount }, () => ''))
  const [results, setResults] = useState<Array<boolean | null>>(() => Array.from({ length: rowCount }, () => null))
  const [passed, setPassed] = useState<boolean | null>(null)

  const gradeable = target.kind === 'ok'
  const filled = values.some((v) => v.trim().length > 0)

  const submit = useCallback(() => {
    if (!gradeable || rowCount === 0) return
    const next: Array<boolean | null> = []
    const parts: string[] = []
    target.rows.forEach((ask, i) => {
      const v = (values[i] ?? '').trim()
      const hit = v.length > 0 && askMatches(v, ask)
      next.push(hit)
      parts.push(`${ask.label}=${v.length > 0 ? v : '(空)'}${hit ? '✓' : '✗'}`)
    })
    const allOk = next.every((r) => r === true)
    setResults(next)
    setPassed(allOk)
    recordAttempt(problem.id, allOk, { text: parts.join('；'), kind: 'text' })
  }, [gradeable, problem.id, rowCount, target.rows, values])

  const reset = useCallback(() => {
    setValues(Array.from({ length: rowCount }, () => ''))
    setResults(Array.from({ length: rowCount }, () => null))
    setPassed(null)
  }, [rowCount])

  const rightCount = results.filter((r) => r === true).length
  const wrongCount = results.filter((r) => r === false).length

  return (
    <div className="space-y-4">
      <StemBlock stem={problem.stem} dedupeAgainst={[target.code]} />

      {/* data-kind 放 schema 的原始枚举值（机器读，验收脚本按它断言），
          中文名只放在可见文本里 —— 两者混用会让「data-kind 应为 bst」这类断言永远对不上。 */}
      <section className="rounded-xl border p-4" style={panel} data-role="str-given" data-kind={target.kindRaw}>
        <p className="text-sm font-semibold" style={muted}>要构造的结构：{target.kindLabel}</p>
        {target.sequence.trim().length > 0 && (
          <p
            className="mt-2 overflow-x-auto rounded-lg border p-3 text-sm whitespace-pre"
            style={{ ...control, fontFamily: 'var(--font-mono)' }}
            data-role="str-sequence"
          >
            {target.sequence}
          </p>
        )}
      </section>

      {target.code.trim().length > 0 && (
        <section className="rounded-xl border p-4" style={panel}>
          <CodeBlock code={target.code} title="参考程序（构造过程的可运行实现）" />
        </section>
      )}

      {target.kind === 'defect' && (
        <DefectPanel title="本题无法在线判分（数据缺陷）" body={target.reason} />
      )}

      <section
        className="rounded-xl border p-4"
        style={panel}
        data-role="str-input"
        data-rows={rowCount}
        data-answerable={gradeable ? 'true' : 'false'}
      >
        <p className="text-sm font-semibold" style={muted}>
          逐问作答（共 {rowCount} 问；分隔符随意，空格 / 逗号 / 箭头都认，但元素次序必须完全一致）
        </p>
        {target.rows.map((ask, i) => (
          <div key={i} className="mt-3 first:mt-0" data-role="str-row" data-index={i}>
            <label className="text-sm font-semibold" style={muted} htmlFor={`str-${problem.id}-${i}`}>
              {ask.label.length > 0 ? ask.label : `第 ${i + 1} 问`}
              {ask.unit.length > 0 && <span className="ml-1 text-xs">（{ask.unit}）</span>}
            </label>
            <input
              id={`str-${problem.id}-${i}`}
              className="cp-focus-ring mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ ...control, fontFamily: 'var(--font-mono)' }}
              value={values[i] ?? ''}
              disabled={!gradeable}
              placeholder={ask.label.includes('结构') ? '例如 45(24(12,37),53(-,93))，空孩子写 -' : '例如 13 27 38 49 53 93'}
              onChange={(e) => setValues((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              data-role="str-field"
              data-index={i}
            />
            {ask.hint.length > 0 && <p className="mt-1 text-xs" style={muted}>{ask.hint}</p>}
            {results[i] !== null && (
              <p className="mt-1 text-xs" style={{ color: results[i] ? TONE.good : TONE.bad }} data-role="str-row-result" data-index={i}>
                {results[i] ? '✓ 这一问对了' : `✗ 这一问错了，正确答案是 ${ask.answer}`}
              </p>
            )}
          </div>
        ))}
        <div className="mt-3">
          <ActionRow>
            <Button onClick={submit} tone="good" disabled={!gradeable || !filled} role="str-submit">提交判分</Button>
            <Button onClick={reset} role="str-reset">清空重做</Button>
          </ActionRow>
        </div>
      </section>

      {passed !== null && (
        <VerdictBanner
          tone={passed ? 'good' : 'bad'}
          title={passed ? `✓ 全部 ${rowCount} 问都答对了` : `✗ 答对 ${rightCount} 问、答错 ${wrongCount} 问（共 ${rowCount} 问）`}
          detail={passed
            ? '已记入进度：本题标记为「已通过」。结构题不给部分分，全对才算过。'
            : '已记入错题本。先在草稿上把结构真画出来再写序列：凭记忆直接写遍历结果，最容易错的是「空孩子」和旋转之后子树的归属。'}
        />
      )}

      {target.steps.length > 0 && (
        <details className="rounded-xl border p-4" style={panel} data-role="str-steps" data-count={target.steps.length}>
          <summary className="cursor-pointer text-sm font-semibold" style={muted}>
            构造过程分步快照（{target.steps.length} 步）—— 打开就等于看答案，建议先自己做完
          </summary>
          <ol className="mt-3 space-y-1">
            {target.steps.map((s, i) => (
              <li key={i} className="overflow-x-auto text-sm whitespace-pre" style={{ fontFamily: 'var(--font-mono)' }}>
                <span style={muted}>{String(i + 1).padStart(2, '0')}.</span> {s}
              </li>
            ))}
          </ol>
        </details>
      )}

      <ExplanationBlock text={typeof problem.explanation === 'string' ? problem.explanation : ''} />
    </div>
  )
}
