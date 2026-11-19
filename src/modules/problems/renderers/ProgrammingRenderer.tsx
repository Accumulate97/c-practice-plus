/**
 * 编程题渲染器（阶段 4 模块 1）：写代码 → 逐组串行跑 stdin 用例 → 用例级判分结果。
 *
 * 判分逻辑全部来自 src/judge（阶段 2 交付），本文件只负责呈现，一行判分规则都不重写：
 *   · 串行 / 节流 / 缓存 / 降级 → JudgeClient.runTests
 *   · 归一化与比对 / firstDiffLine → backends/base.ts
 *   · 事实分类 → backends/godbolt.ts（含 didExecute 断言）
 *   · 结论文案 → client.ts 的 verdict()
 *
 * 诚实性红线（AGENTS.md 二·5）：后端抖动 = 「未判定」，不是「答错」；
 * 降级自评只给构建期预存的真实 stdout，不计正确率、不置 verified，绝不显示「通过」。
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { CodeEditor, MONO_FONT } from '../../../components/common/CodeEditor'
import { StemParts } from './concept-shared'
import { judge } from '../../../app/config'
import { firstDiffLine, formatDiagnostics } from '../../../judge/backends/base'
import type { JudgeClient } from '../../../judge/client'
import { backendIdForCode } from '../../../judge/math-lib'
import type { BatchReport, TestCaseResult } from '../../../judge/types'
import type { ProblemRecord } from '../data/loader'
import { createJudgeClient, runStdinTests, toProblemTestCases } from '../grading/stdin-run'
import type { RunProgress } from '../grading/stdin-run'
import { STATE_COLOR, STATE_LABEL, isInconclusive } from '../verdict-meta'
import { recordBatchAttempt } from '../progress/store'

/**
 * 无 code_starter 题（如 code_optimization）的空脚手架兜底：这是模板不是答案 ——
 * 刻意不预填 reference，免得把参考解直接摊在编辑器里。
 */
const SCAFFOLD = ['#include <stdio.h>', '', 'int main(void) {', '', '    return 0;', '}', ''].join('\n')

/**
 * 1.1 空白起始白名单（体验轮）：这三型要求「从零写出完整程序」，判分是学生代码
 * 整体编译（judge/client.ts runTests 只发 { code, stdin }，不拼任何隐藏骨架），
 * 所以编辑器初值恒为空串。数据里的 code_starter 原样保留不删（不牵动 index.json /
 * 搜索语料 / verified 证据），只是渲染层不再注入。
 *
 * ⚠️ 刻意排除（清空会毁题，判断依据见 _inputs/_meta/诊断报告_编程题空白起始与返回章节.md）：
 *   · api_drill / stdlib_reimpl —— 题干 81/81 承诺「main 已给出，请不要改动」，
 *     要求的函数签名与 IO 骨架就在 starter 里，清空即与题干矛盾；
 *   · code_optimization —— 题目是优化题干围栏里的低效代码，编辑器初值本就是 SCAFFOLD 空模板；
 *   · debug / code_completion / multi_blank 等骨架型 —— 带错/带空代码就是题目本体（不走本渲染器）。
 */
const BLANK_START_TYPES: ReadonlySet<string> = new Set(['programming', 'algorithm_impl', 'timed_impl'])

/** 空白起始的占位提示（原生 placeholder，不进 value、不参与编译） */
const BLANK_PLACEHOLDER = '从零编写完整程序，需含 main 与 return 0；提交后按 stdin / stdout 比对'

const panel: CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg-elev)' }
const muted: CSSProperties = { color: 'var(--fg-muted)' }

const TONE_COLOR = {
  good: 'var(--fg-ok)',
  bad: 'var(--fg-bad)',
  unknown: 'var(--fg-warn)',
} as const

interface Overall {
  tone: keyof typeof TONE_COLOR
  label: string
  detail: string
}

/** 整批结论。优先级：全对 > 有真实失败 > 全部未判定（后端抖动不算答错） */
function summarize(report: BatchReport): Overall {
  const total = report.results.length
  const states = report.results.map((r) => r.response.state)
  const idle = `串行执行总耗时 ${report.totalMs} ms，缓存命中 ${report.cacheHits} 组`
  if (total > 0 && states.every((s) => s === 'accepted')) {
    return { tone: 'good', label: `判分通过：${total}/${total} 组用例全部正确`, detail: idle }
  }
  const firstBad = report.results.find((r) => !isInconclusive(r.response.state) && r.response.state !== 'accepted')
  const unknownCount = states.filter((s) => isInconclusive(s)).length
  if (firstBad) {
    const suffix = unknownCount > 0 ? `；另有 ${unknownCount} 组未判定（后端不可用）` : ''
    return {
      tone: 'bad',
      label: `未通过：${report.acceptedCount}/${total} 组正确，首个失败是第 ${firstBad.index} 组`,
      detail: `${STATE_LABEL[firstBad.response.state]} —— ${firstBad.response.summary}${suffix}`,
    }
  }
  return {
    tone: 'unknown',
    label: `本次未判定：${unknownCount}/${total} 组无法判分`,
    detail: '判分后端不可用，这属「未判定」而非「答错」，不计正确率、不置 verified。',
  }
}

function initialCode(problem: ProblemRecord): string {
  // 1.1：白名单题型空白起始（starter 数据保留，仅不注入编辑器）
  if (BLANK_START_TYPES.has(String(problem.type))) return ''
  const starter = problem.code_starter
  return typeof starter === 'string' && starter.trim().length > 0 ? starter : SCAFFOLD
}

interface Props {
  problem: ProblemRecord
}

export function ProgrammingRenderer({ problem }: Props) {
  const cases = useMemo(() => toProblemTestCases(problem.testCases), [problem.testCases])
  const [code, setCode] = useState<string>(() => initialCode(problem))
  const blankStart = BLANK_START_TYPES.has(String(problem.type))
  /**
   * 1.1：空白起始后 IO 约定必须可见，不能让学生猜接口。
   * programming / algorithm_impl 数据自带 input_format / output_format（此前 src 零渲染，
   * 学生全靠 starter 里的 scanf/printf 猜格式）；timed_impl 无这两字段 → 用第一组用例作样例。
   */
  const inputFormat = typeof problem.input_format === 'string' ? problem.input_format.trim() : ''
  const outputFormat = typeof problem.output_format === 'string' ? problem.output_format.trim() : ''
  const sampleCase = blankStart && inputFormat.length === 0 && outputFormat.length === 0 ? (cases[0] ?? null) : null
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<RunProgress | null>(null)
  const [report, setReport] = useState<BatchReport | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  /**
   * 阶段 5 · R5：按源码分流后端 —— 含 sqrt 一类数学函数的代码走 libm 支路
   * （默认 cg132 链不上 libm，选型证据见 src/judge/math-lib.ts 文件头）。
   * client.ts 的结果缓存键与跨标签页锁名都含 backend.id，所以每条支路必须各持一个
   * client 实例：这里用 Map 按后端 id 分桶，而不是单个 ref。
   */
  const clientsRef = useRef<Map<string, JudgeClient> | null>(null)

  /** 按学生当前编辑器里的代码挑后端；同一份代码重复提交仍命中缓存，不重复打网络 */
  const getClient = useCallback((source: string): JudgeClient => {
    const buckets = (clientsRef.current ??= new Map<string, JudgeClient>())
    const key = backendIdForCode(source)
    let client = buckets.get(key)
    if (!client) {
      client = createJudgeClient({ code: source })
      buckets.set(key, client)
    }
    return client
  }, [])

  const submit = useCallback(async () => {
    if (running || cases.length === 0) return
    setRunning(true)
    setFatal(null)
    setReport(null)
    setProgress({ caseIndex: 1, total: cases.length, status: { running: 0, waiting: 0, ahead: 0, concurrency: 0 } })
    const outcome = await runStdinTests(getClient(code), code, cases, (p) => setProgress(p))
    setRunning(false)
    setProgress(null)
    if (outcome.kind === 'done') {
      setReport(outcome.report)
      // 模块 5：判分结论落盘（全绿→已通过；确证失败→尝试过未通过；整批未判定→一个字节都不写）
      // 阶段 5：顺手存本次提交的源码，错题本 / 详情页能回看「上次写到哪里」
      recordBatchAttempt(problem.id, outcome.report.results, { text: code, kind: 'code' })
    } else setFatal(outcome.summary)
  }, [running, cases, code, getClient, problem.id])

  const reset = useCallback(() => {
    setCode(initialCode(problem))
    setReport(null)
    setFatal(null)
  }, [problem])

  const overall = useMemo(() => (report ? summarize(report) : null), [report])
  const unknownCount = useMemo(
    () => (report ? report.results.filter((r) => isInconclusive(r.response.state)).length : 0),
    [report],
  )

  return (
    <div className="space-y-4">
      <section className="rounded-xl border p-4" style={panel}>
        <h2 className="text-sm font-semibold" style={muted}>题目要求</h2>
        {/* 任务07 阶段2：stem 围栏切分渲染；围栏副本与起点代码/参考实现一致时去重 */}
        <div className="mt-2">
          <StemParts
            stem={String(problem.stem ?? '')}
            dedupeAgainst={[String(problem.code_starter ?? ''), String(problem.reference ?? '')]}
          />
        </div>
        {(inputFormat.length > 0 || outputFormat.length > 0) && (
          <div className="mt-2 space-y-1 text-xs" data-role="io-spec">
            {inputFormat.length > 0 && (
              <div>
                <span className="font-semibold" style={muted}>输入格式：</span>
                <span className="ml-1 whitespace-pre-wrap">{inputFormat}</span>
              </div>
            )}
            {outputFormat.length > 0 && (
              <div>
                <span className="font-semibold" style={muted}>输出格式：</span>
                <span className="ml-1 whitespace-pre-wrap">{outputFormat}</span>
              </div>
            )}
          </div>
        )}
        {sampleCase && (
          <div className="mt-2 text-xs" data-role="io-sample">
            <div className="font-semibold" style={muted}>样例（第 1 组测试用例，判分即按 stdin / stdout 比对）</div>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <Block title="样例输入 stdin" body={sampleCase.stdin} />
              <Block title="样例输出" body={sampleCase.expected} />
            </div>
          </div>
        )}
        {typeof problem.source === 'string' && problem.source.length > 0 && (
          <p className="mt-2 text-xs" style={muted}>出处：{problem.source}</p>
        )}
        <p className="mt-2 text-xs" style={muted}>
          共 {cases.length} 组测试用例，提交后逐组串行执行（Godbolt 公共实例并发越高吞吐越低）。
        </p>
      </section>

      <section className="rounded-xl border p-4" style={panel}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold" style={muted}>你的代码</h2>
          <span className="text-xs" style={muted}>
            {judge.godboltCompiler} · {judge.userArguments} · 软超时 {judge.timeoutMs / 1000} s
          </span>
        </div>
        <div className="mt-2">
          <CodeEditor
            value={code}
            onChange={setCode}
            disabled={running}
            rows={16}
            ariaLabel="编程题代码编辑器"
            placeholder={blankStart ? BLANK_PLACEHOLDER : undefined}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={running || cases.length === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--color-brand)', color: 'var(--cp-on-brand)' }}
          >
            {running ? '判分中…' : `提交判分（${cases.length} 组）`}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={running}
            className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
          >
            重置代码
          </button>
          {cases.length === 0 && (
            <span className="text-xs" style={{ color: 'var(--fg-bad)' }}>本题缺少测试用例，无法判分</span>
          )}
        </div>
      </section>

      {progress && (
        <section className="rounded-xl border p-4" style={panel}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">第 {progress.caseIndex}/{progress.total} 组用例执行中…</span>
            <span className="text-xs" style={muted}>
              并发上限 {progress.status.concurrency} · 队列前方 {progress.status.ahead} 个 · 运行中 {progress.status.running}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
            <div
              style={{
                width: `${Math.min(100, (progress.caseIndex / Math.max(1, progress.total)) * 100)}%`,
                height: '100%',
                background: 'var(--color-brand)',
                transition: 'width 200ms ease-out',
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={muted}>
            严格串行是硬约束：并发会把单请求耗时从 ~1.4 s 恶化到 22–38 s。请勿在判分期间刷新页面。
          </p>
        </section>
      )}

      {fatal && (
        <section className="rounded-xl border p-4" style={{ ...panel, borderColor: TONE_COLOR.unknown }}>
          <p className="text-sm font-semibold" style={{ color: TONE_COLOR.unknown }}>⚠ 本次未判定</p>
          <p className="mt-1 text-sm">{fatal}</p>
          <SelfCheck cases={cases} />
        </section>
      )}

      {overall && (
        <section className="rounded-xl border p-4" style={{ ...panel, borderColor: TONE_COLOR[overall.tone] }}>
          <p className="text-base font-semibold" style={{ color: TONE_COLOR[overall.tone] }}>{overall.label}</p>
          <p className="mt-1 text-sm" style={muted}>{overall.detail}</p>
          {unknownCount > 0 && (
            <p className="mt-2 text-xs" style={{ color: TONE_COLOR.unknown }}>
              其中 {unknownCount} 组走的是降级 / 未判定路径：不计正确率、不置 verified。
            </p>
          )}
          {unknownCount > 0 && <SelfCheck cases={cases} />}
        </section>
      )}

      {report && (
        <section className="space-y-3" role="status" aria-live="polite">
          <h2 className="text-sm font-semibold" style={muted}>
            用例级判分结果（{report.acceptedCount}/{report.results.length} 组通过）
          </h2>
          {report.results.map((r) => (
            <CaseCard key={r.index} result={r} />
          ))}
        </section>
      )}
    </div>
  )
}

/** 后端不可用时的自评材料：只给题目自带的期望输出，不伪造运行结果、不给「通过」 */
function SelfCheck({ cases }: { cases: { stdin: string; expected: string; note?: string }[] }) {
  return (
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer" style={{ color: 'var(--fg-warn)' }}>
        判分后端不可用：展开查看本题各组的输入与期望输出，自行在本地比对（不计正确率、不置 verified）
      </summary>
      <ol className="mt-2 space-y-3">
        {cases.map((c, i) => (
          <li key={i}>
            <div className="font-medium">第 {i + 1} 组{c.note ? `（${c.note}）` : ''}</div>
            <Block title="输入 stdin" body={c.stdin} />
            <Block title="期望输出（题目自带，非本次运行结果）" body={c.expected} />
          </li>
        ))}
      </ol>
    </details>
  )
}

function CaseCard({ result }: { result: TestCaseResult }) {
  const res = result.response
  const color = STATE_COLOR[res.state]
  const diff = res.state === 'wrong-answer' ? firstDiffLine(res.actual, res.expected) : null
  const diags = res.diagnostics.length > 0 ? formatDiagnostics(res.diagnostics) : ''
  return (
    <article className="rounded-xl border p-4" style={{ ...panel, borderColor: color }}>
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold" style={{ color }}>第 {result.index} 组 · {STATE_LABEL[res.state]}</span>
        {result.note && <span className="text-xs" style={muted}>{result.note}</span>}
        <span className="ml-auto text-xs" style={muted}>
          {result.ms} ms{result.cacheHit ? ' · 缓存命中' : ''}
          {typeof res.execTimeMs === 'number' ? ` · 执行 ${res.execTimeMs} ms` : ''}
          {typeof res.exitCode === 'number' ? ` · 退出码 ${res.exitCode}` : ''}
        </span>
      </header>

      <p className="mt-2 text-sm">{res.summary}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Block title="输入 stdin" body={result.stdin} />
        <Block title="期望输出（已归一化）" body={res.expected} />
        <Block title={res.degraded ? '预存输出（降级自评）' : '实际输出（已归一化）'} body={res.actual} tone={color} />
      </div>

      {diff !== null && (
        <p className="mt-2 text-xs" style={{ color: 'var(--fg-bad)' }}>
          首处差异在第 {diff} 行。归一化规则：CRLF→LF、逐行剥行尾空白、剥末尾换行；行中空行与行尾空格保留后再剥。
        </p>
      )}

      {res.degraded && (
        <p className="mt-2 text-xs" style={{ color: TONE_COLOR.unknown }}>
          降级自评：上面「预存输出」来自构建期存档的真实 stdout，不是本次运行结果，不计正确率、不置 verified。
        </p>
      )}

      {(diags || res.compilerMessage) && (
        <div className="mt-3">
          <div className="text-xs" style={muted}>编译诊断 / 后端说明</div>
          <pre
            className="mt-1 overflow-x-auto rounded-lg border p-2 text-xs"
            style={{ ...muted, borderColor: 'var(--border)', background: 'var(--bg)', fontFamily: MONO_FONT }}
          >
            {[diags, res.compilerMessage].filter((s) => s.trim().length > 0).join('\n') || '（无）'}
          </pre>
        </div>
      )}
    </article>
  )
}

function Block({ title, body, tone }: { title: string; body: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs" style={muted}>{title}</div>
      <pre
        className="mt-1 overflow-x-auto rounded-lg border p-2 text-xs whitespace-pre-wrap"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: tone ?? 'var(--fg)', fontFamily: MONO_FONT }}
      >
        {body.length === 0 ? <span style={muted}>（空）</span> : body}
      </pre>
    </div>
  )
}
