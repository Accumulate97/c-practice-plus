/**
 * 阶段 3.0 专项验收：ds_debug / complexity_analysis / structure_trace 三种新题型。
 *
 * 任务书的教训是「验收套件通过 ≠ 用户真看得到」，所以这个脚本**不看源码、不看数据文件里的字段有没有**，
 * 只在真浏览器里跑 dist 产物，逐题验「学生点开这道题之后眼睛看到、手上做得到的东西」：
 *   ① 三型的题数与索引一致（题数从 problems/index.json 现算，不写死）
 *   ② 每道题深链 /#/p/<id> 无上下文直接打开，对应渲染器的 data-role 齐全、行数与数据字段条数一致
 *   ③ 填正确答案必须判对（verdict tone=good）
 *   ④ 填错误答案必须判错（verdict tone=bad）
 *   ⑤ 等价写法必须判对（49/15 → 3.2667；遍历序列混用逗号、顿号、分号、空格）—— 这是 trace-match 归一化的真验收
 *   ⑥ 重置按钮真的清空所有输入并撤掉判定横幅
 *   ⑦ ds_debug 的三级提示阶梯逐级出现，且第 3 级的文案与题目 bugs[0] 逐字相同
 *   ⑧ ds_debug 编辑器为空时提交按钮禁用（宁可判不出来也不判通过）
 *   ⑨ 三型的 explanation 都非空且长度 > 150（任务书红线）
 *   ⑩ ds_debug 底部参考源代码与 fixed_code 去空白后一致
 *   ⑪ 375px 窄屏不横向溢出、输入框可 focus 且焦点环可见
 *   ⑫ 全程控制台 0 error 0 warning 0 pageerror
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const PORT = Number(process.env.NEWTYPES_PORT ?? 4194)
const BASE = `http://127.0.0.1:${PORT}/`

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ｜ ' + detail : ''}`)
}

if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  console.error('dist 不存在，请先 npm run build')
  process.exit(1)
}

/* 期望值一律从索引与分片现算，不写死任何题号或题量 */
const IDX = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/index.json'), 'utf8'))
const byId = new Map(IDX.problems.map((p) => [p.id, p]))
const idsOf = (type) => IDX.problems.filter((p) => p.type === type).map((p) => p.id).sort()
const DBG = idsOf('ds_debug')
const CXA = idsOf('complexity_analysis')
const STR = idsOf('structure_trace')

/* ds_debug 走 DebugRenderer → 共享的 CodeEditor（受控 textarea，不是 CodeMirror），
   编辑器没有 data-role，只能按 aria-label 定位（DebugRenderer.tsx:203 传的就是这个串）。 */
const DBG_ANCHOR = 'textarea[aria-label*="程序改错"]'
if (DBG.length + CXA.length + STR.length === 0) {
  console.error('✗ 索引里没有任何新题型的题 —— 先跑 tmp/add-dsdbg-samples.mjs 与 tmp/add-noncode-samples.mjs 再跑 npm run build:index')
  process.exit(1)
}

/* 分片里的完整题目数据（索引是精简版，asks / traversalOrder / fixed_code 只在分片里） */
const shardCache = new Map()
function fullProblem(id) {
  const entry = byId.get(id)
  if (!entry) throw new Error('索引里查不到 ' + id)
  const file = entry.file ?? `${entry.shard ?? ''}.json`
  if (!shardCache.has(file)) {
    shardCache.set(file, JSON.parse(readFileSync(join(ROOT, 'public/data/problems', file), 'utf8')))
  }
  const shard = shardCache.get(file)
  const found = (shard.problems ?? []).find((p) => p.id === id)
  if (!found) throw new Error(`${file} 里查不到 ${id}`)
  return found
}

const preview = spawn(
  'node',
  ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
)
let previewErr = ''
preview.stderr.on('data', (d) => { previewErr += d.toString() })
async function waitPreview() {
  for (let i = 0; i < 100; i += 1) {
    try { const r = await fetch(BASE); if (r.ok) return } catch { /* 还没起来 */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('vite preview 起不来：' + previewErr.slice(0, 400))
}

const consoleMsgs = []
const pageErrors = []
const strip = (s) => String(s ?? '').replace(/\s+/g, '')

/** 打开一道题的深链并等渲染器锚点出现。
 *  ★ 不能用 waitUntil:'networkidle' —— 详情页会持续轮询判分后端与写进度，
 *    networkidle 在这种页面上永远不触发，会把整套验收挂死（实测 >20 分钟无输出）。
 *    正确做法是 domcontentloaded 之后显式等自己那个 data-role 锚点。
 *  ★ 每一步都打日志并 flush —— 卡住时要能从最后一行看出卡在哪道题的哪一步，
 *    而不是只有一个「still running」。（pwsh 的管道会缓冲子进程 stdout，
 *    所以这里直接写 stderr，它不经过 Select-Object 的缓冲。） */
function step(msg) {
  process.stderr.write(`  · ${msg}\n`)
}
async function openProblem(page, id, anchor) {
  step(`打开 ${id}，等 ${anchor}`)
  await page.goto(`${BASE}#/p/${id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector(anchor, { timeout: 30000 })
}

/* 模块级：main() 中途抛异常时，finally 里也要能把 chrome 关掉。
   否则残留的 chrome 子进程一直占着 stdio 句柄，node 事件循环永不退出，
   只能靠看门狗强杀 —— 而看门狗强杀会把「失败」伪装成「跑完了」。 */
let browser = null

async function main() {
  await waitPreview()
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  /* ── ① 题数与索引一致 ── */
  check('① 三型题数与索引一致',
    DBG.length > 0 && CXA.length > 0 && STR.length > 0,
    `ds_debug=${DBG.length} complexity_analysis=${CXA.length} structure_trace=${STR.length}`)

  /* ── ② 逐题深链打开，data-role 齐全、行数与数据条数一致 ── */
  const openFails = []
  for (const id of CXA) {
    const p = fullProblem(id)
    const asks = Array.isArray(p.asks) ? p.asks : []
    const wantRows = asks.length + (String(p.complexity ?? '').trim().length > 0 ? 1 : 0)
    await openProblem(page, id, '[data-role="cxa-input"]')
    const got = await page.evaluate(() => ({
      rows: document.querySelectorAll('[data-role="cxa-row"]').length,
      fields: document.querySelectorAll('[data-role="cxa-field"]').length,
      answerable: document.querySelector('[data-role="cxa-input"]')?.dataset.answerable ?? '',
      dataRows: Number(document.querySelector('[data-role="cxa-input"]')?.dataset.rows ?? -1),
      explanation: (document.querySelector('[data-role="explanation"]')?.textContent ?? '').replace(/\s+/g, '').length,
      verdict: document.querySelectorAll('[data-role="verdict"]').length,
    }))
    if (got.rows !== wantRows || got.fields !== wantRows || got.dataRows !== wantRows) {
      openFails.push(`${id} 行数 ${got.rows}/${got.fields}/${got.dataRows} 应为 ${wantRows}`)
    }
    if (got.answerable !== 'true') openFails.push(`${id} data-answerable=${got.answerable}（期望 true，false 意味着数据被判成缺陷）`)
    if (got.verdict !== 0) openFails.push(`${id} 未作答就有判定横幅`)
    if (got.explanation <= 150) openFails.push(`${id} explanation 只有 ${got.explanation} 字（红线 >150）`)
  }
  for (const id of STR) {
    const p = fullProblem(id)
    const order = Array.isArray(p.traversalOrder) ? p.traversalOrder : []
    const steps = Array.isArray(p.traceSteps) ? p.traceSteps : []
    const wantRows = (String(p.nodeSpec ?? '').trim() ? 1 : 0) + order.length + (String(p.constructionResult ?? '').trim() ? 1 : 0)
    await openProblem(page, id, '[data-role="str-input"]')
    const got = await page.evaluate(() => ({
      rows: document.querySelectorAll('[data-role="str-row"]').length,
      fields: document.querySelectorAll('[data-role="str-field"]').length,
      dataRows: Number(document.querySelector('[data-role="str-input"]')?.dataset.rows ?? -1),
      answerable: document.querySelector('[data-role="str-input"]')?.dataset.answerable ?? '',
      kind: document.querySelector('[data-role="str-given"]')?.dataset.kind ?? '',
      stepCount: document.querySelector('[data-role="str-steps"]')?.dataset.count ?? '',
      seq: (document.querySelector('[data-role="str-sequence"]')?.textContent ?? '').replace(/\s+/g, ''),
      explanation: (document.querySelector('[data-role="explanation"]')?.textContent ?? '').replace(/\s+/g, '').length,
    }))
    if (got.rows !== wantRows || got.fields !== wantRows || got.dataRows !== wantRows) {
      openFails.push(`${id} 行数 ${got.rows}/${got.fields}/${got.dataRows} 应为 ${wantRows}`)
    }
    if (got.answerable !== 'true') openFails.push(`${id} data-answerable=${got.answerable}`)
    if (got.kind !== String(p.structureKind ?? '')) openFails.push(`${id} data-kind=${got.kind} 应为 ${p.structureKind}`)
    if (steps.length > 0 && Number(got.stepCount) !== steps.length) {
      openFails.push(`${id} 分步快照 data-count=${got.stepCount} 应为 ${steps.length}`)
    }
    if (strip(p.sequence ?? '') !== got.seq) openFails.push(`${id} 给定序列没照原文渲染`)
    if (got.explanation <= 150) openFails.push(`${id} explanation 只有 ${got.explanation} 字（红线 >150）`)
  }
  for (const id of DBG) {
    const p = fullProblem(id)
    /* DebugRenderer 全文只有一个 data-role（explanation）—— 编辑器是共享的 CodeEditor，
       而 CodeEditor 是「受控 textarea + 行号槽」的最简实现（不是 CodeMirror，.cm-content 只在
       程序填空的 BlankCodeEditor 与游乐场里才有），所以锚点用 aria-label；
       提交/重置按钮没有 data-role 只能按文案找，提示正文用 data-hint 而不是 data-role。
       这些是 grep + read 真实源码得到的契约，不是猜的。 */
    await openProblem(page, id, DBG_ANCHOR)
    const cases = Array.isArray(p.testCases) ? p.testCases : []
    const got = await page.evaluate((anchor) => ({
      editor: document.querySelectorAll(anchor).length,
      refPanel: document.querySelectorAll('[data-role="reference-answer"]').length,
      refToggle: document.querySelectorAll('[data-role="reference-answer-toggle"]').length,
      hintButtons: Array.from(document.querySelectorAll('button')).filter((b) => /提示 [123]/.test(b.textContent ?? '')).length,
      buttons: Array.from(document.querySelectorAll('button')).map((b) => (b.textContent ?? '').replace(/\s+/g, '')),
    }), DBG_ANCHOR)
    if (got.editor === 0) openFails.push(`${id} 代码编辑器（CodeEditor 的受控 textarea）没渲染出来`)
    /* 提交按钮的文案里带着测试用例组数，对不上说明渲染器读到的 testCases 与数据不一致 */
    const wantLabel = `提交判分（${cases.length}组）`
    if (!got.buttons.includes(wantLabel)) {
      openFails.push(`${id} 找不到「${wantLabel}」按钮（实际按钮：${got.buttons.slice(0, 6).join(' / ')}）`)
    }
    if (got.hintButtons !== 1) openFails.push(`${id} 三级提示是互斥渲染，初始应恰好 1 个提示按钮，实际 ${got.hintButtons} 个`)
    /* 底部完整参考源代码 + 结构化详解（任务书红线⑤）。
       ⚠️ DebugRenderer 自己的 [data-role="explanation"] 只在「判分通过之后」才渲染，
       未作答时页面上根本没有它 —— 所以详解必须从展开后的参考答案面板里读，不能在点开之前读。 */
    if (got.refPanel === 0 || got.refToggle === 0) {
      openFails.push(`${id} 底部没有参考答案面板（reference-answer=${got.refPanel} toggle=${got.refToggle}）`)
    } else {
      await page.click('[data-role="reference-answer-toggle"]')
      await page.waitForSelector('[data-role="reference-answer"][data-open="true"]', { timeout: 15000 })
      const want = strip(p.fixed_code ?? '')
      /* 代码块外层 div 还含标题与「复制」按钮的文字，逐字比对要取里面的 <code> */
      const opened = await page.evaluate(() => ({
        blocks: Array.from(document.querySelectorAll('[data-role="reference-answer"] [data-role="code-block"] code'))
          .map((e) => e.textContent.replace(/\s+/g, '')),
        explanation: (document.querySelector('[data-role="reference-answer"] [data-role="explanation"]')?.textContent ?? '')
          .replace(/\s+/g, '').length,
      }))
      if (want.length > 0 && !opened.blocks.some((b) => b === want)) {
        openFails.push(`${id} 展开参考答案后 ${opened.blocks.length} 个代码块里没有一个与 fixed_code 逐字相同（${want.length} 字符）`)
      }
      if (opened.explanation <= 150) openFails.push(`${id} 参考答案里的 explanation 只有 ${opened.explanation} 字（红线 >150）`)
    }
  }
  check(`② ${DBG.length + CXA.length + STR.length} 道题深链打开、data-role 与数据条数齐全`,
    openFails.length === 0, openFails.slice(0, 6).join(' ｜ ') || '全部通过')

  /* ── ③④⑤⑥ 数值/结构题的判分闭环 ── */
  const gradeFails = []
  let equivOk = 0
  let equivTotal = 0
  /* 必须用 Playwright 的 fill()：受控 input 直接改 el.value 再派发 input 事件，
     React 的 value tracker 认为「值没变」会把这次事件丢掉，state 不更新
     ⇒ filled 一直是 false ⇒ 提交按钮永远 disabled，click 直接超时。 */
  const fillRows = async (fieldSel2, vals) => {
    const handles = await page.$$(fieldSel2)
    for (let i = 0; i < vals.length && i < handles.length; i += 1) await handles[i].fill(vals[i])
    return handles.length
  }
  for (const id of [...CXA, ...STR]) {
    const p = fullProblem(id)
    const isCxa = p.type === 'complexity_analysis'
    const rowSel = isCxa ? '[data-role="cxa-row"]' : '[data-role="str-row"]'
    const fieldSel = isCxa ? '[data-role="cxa-field"]' : '[data-role="str-field"]'
    const submitSel = isCxa ? '[data-role="cxa-submit"]' : '[data-role="str-submit"]'
    const resetSel = isCxa ? '[data-role="cxa-reset"]' : '[data-role="str-reset"]'
    /* 把数据里的判分目标按渲染器的拼装顺序还原成「正确答案数组」 */
    const answers = isCxa
      ? [...(Array.isArray(p.asks) ? p.asks : []).map((a) => String(a.answer ?? '')),
         ...(String(p.complexity ?? '').trim() ? [String(p.complexity)] : [])]
      : [...(String(p.nodeSpec ?? '').trim() ? [String(p.nodeSpec)] : []),
         ...(Array.isArray(p.traversalOrder) ? p.traversalOrder : []).map((a) => String(a.answer ?? '')),
         ...(String(p.constructionResult ?? '').trim() ? [String(p.constructionResult)] : [])]

    /* ③ 填正确答案必须判对 */
    await openProblem(page, id, isCxa ? '[data-role="cxa-input"]' : '[data-role="str-input"]')
    const rows = await page.$$(rowSel)
    if (rows.length !== answers.length) gradeFails.push(`${id} 渲染 ${rows.length} 行而数据有 ${answers.length} 个判分目标`)
    await fillRows(fieldSel, answers)
    /* 等按钮真的解禁再点：filled 是从 state 推出来的，state 没更新按钮就一直 disabled */
    await page.waitForSelector(`${submitSel}:not([disabled])`, { timeout: 10000 })
    await page.click(submitSel)
    await page.waitForSelector('[data-role="verdict"]', { timeout: 15000 })
    const good = await page.evaluate(() => document.querySelector('[data-role="verdict"]')?.dataset.tone ?? '')
    if (good !== 'good') gradeFails.push(`${id} 填正确答案却判成 ${good || '(无 tone)'}`)

    /* ④ 把第一格改成错答案必须判错（fillRows 只填 vals 长度那么多个，这里就是第 1 格） */
    await fillRows(fieldSel, ['__wrong__'])
    await page.click(submitSel)
    await page.waitForSelector('[data-role="verdict"]', { timeout: 15000 })
    const badTone = await page.evaluate(() => document.querySelector('[data-role="verdict"]')?.dataset.tone ?? '')
    if (badTone !== 'bad') gradeFails.push(`${id} 填错答案却判成 ${badTone || '(无 tone)'}`)

    /* ⑤ 等价写法必须判对：数值题用小数替分数，结构题把分隔符换成逗号/顿号/分号混用 */
    const equiv = answers.map((a, i) => {
      if (/^\d+\s*\/\s*\d+$/.test(a.trim())) return a.trim().replace(/\s+/g, '')
        .split('/').reduce((x, y) => String(Number(x) / Number(y)).slice(0, 8))
      if (i === 0 && /^[\d\s,，、;；()\-]+$/.test(a)) return a.replace(/[\s,，、;；]+/g, '；')
      if (/^[\d\s,，、;；]+$/.test(a.trim())) return a.trim().replace(/[\s,，、;；]+/g, ', ')
      return a
    })
    if (equiv.join('|') !== answers.join('|')) {
      equivTotal += 1
      await fillRows(fieldSel, equiv)
      await page.click(submitSel)
      await page.waitForSelector('[data-role="verdict"]', { timeout: 15000 })
      const eqTone = await page.evaluate(() => document.querySelector('[data-role="verdict"]')?.dataset.tone ?? '')
      if (eqTone === 'good') equivOk += 1
      else gradeFails.push(`${id} 等价写法（${equiv.slice(0, 2).join(' / ')}）被判成 ${eqTone || '(无 tone)'}`)
    }

    /* ⑥ 重置真的清空 */
    await page.click(resetSel)
    const afterReset = await page.evaluate((f) => ({
      empty: Array.from(document.querySelectorAll(f)).every((el) => el.value === ''),
      verdicts: document.querySelectorAll('[data-role="verdict"]').length,
      rowResults: Array.from(document.querySelectorAll('[data-role="cxa-row-result"],[data-role="str-row-result"]'))
        .filter((el) => el.textContent.trim().length > 0).length,
    }), fieldSel)
    if (!afterReset.empty || afterReset.verdicts !== 0 || afterReset.rowResults !== 0) {
      gradeFails.push(`${id} 重置后 输入框清空=${afterReset.empty} 横幅=${afterReset.verdicts} 残留行结果=${afterReset.rowResults}`)
    }
  }
  check(`③④⑤⑥ ${CXA.length + STR.length} 道数值/结构题：正确答案判对、错答案判错、等价写法判对、重置清空`,
    gradeFails.length === 0, gradeFails.slice(0, 6).join(' ｜ ') || `等价写法 ${equivOk}/${equivTotal} 判对`)

  /* ── ⑦ ds_debug 三级提示阶梯 ── */
  const hintFails = []
  for (const id of DBG) {
    const p = fullProblem(id)
    await openProblem(page, id, DBG_ANCHOR)
    const bugs = (Array.isArray(p.bugs) ? p.bugs : []).map((b) => strip(b))
    const clickHint = async (label) => {
      const btn = await page.$(`button:has-text("${label}")`)
      if (!btn) return false
      await btn.click()
      return true
    }
    /* ⚠️ evaluate 的回调在浏览器里跑，拿不到 Node 侧的 strip —— 必须内联写正则 */
    const before = await page.evaluate(() => document.body.innerText.replace(/\s+/g, '').length)
    if (!(await clickHint('有几处错'))) hintFails.push(`${id} 找不到第 1 级提示按钮`)
    if (!(await clickHint('错在哪几行'))) hintFails.push(`${id} 找不到第 2 级提示按钮`)
    if (!(await clickHint('错误原因'))) hintFails.push(`${id} 找不到第 3 级提示按钮`)
    const after = await page.evaluate(() => document.body.innerText.replace(/\s+/g, '').length)
    if (after <= before) hintFails.push(`${id} 点了三级提示页面文字没有变多（${before} → ${after}）`)
    /* 第 3 级展开后，bugs[0] 的原文必须能在页面上找到 */
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ''))
    if (bugs.length > 0 && !bodyText.includes(bugs[0])) {
      hintFails.push(`${id} 第 3 级提示里没有 bugs[0] 原文`)
    }
  }
  check(`⑦ ${DBG.length} 道 ds_debug 的三级提示阶梯逐级展开、第 3 级含 bugs[0] 原文`,
    hintFails.length === 0, hintFails.slice(0, 4).join(' ｜ ') || '全部通过')

  /* ── ⑪ 375px 窄屏 ── */
  const narrow = await browser.newPage({ viewport: { width: 375, height: 812 } })
  narrow.on('pageerror', (e) => pageErrors.push('[375] ' + e.message))
  const narrowFails = []
  for (const [id, anchor, fieldSel, submitSel] of [
    [CXA[0], '[data-role="cxa-input"]', '[data-role="cxa-field"]', '[data-role="cxa-submit"]'],
    [STR[0], '[data-role="str-input"]', '[data-role="str-field"]', '[data-role="str-submit"]'],
    [DBG[0], DBG_ANCHOR, DBG_ANCHOR, 'button:has-text("提交判分")'],
  ]) {
    if (!id) continue
    await narrow.goto(`${BASE}#/p/${id}`, { waitUntil: 'domcontentloaded' })
    step(`375px 打开 ${id}`)
    await narrow.waitForSelector(anchor, { timeout: 30000 })
    const info = await narrow.evaluate((f, s) => {
      const el = document.querySelector(f)
      if (el) el.focus()
      /* 焦点环可能画在元素自己（.cp-focus-ring 的 outline）上，也可能画在外壳
         （.cp-focus-ring-wrap 的 box-shadow，因为 textarea 被 overflow-hidden 裁）上，两处都要看 */
      const ring = (c) => !!c && ((c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none')
      const cs = el ? getComputedStyle(el) : null
      const wrap = el && el.closest ? el.closest('.cp-focus-ring-wrap') : null
      return {
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        focused: document.activeElement === el,
        ringVisible: ring(cs) || ring(wrap ? getComputedStyle(wrap) : null),
      }
    }, fieldSel)
    /* 提交按钮用 Playwright 的 :has-text 定位（ds_debug 的按钮没有 data-role），
       而 :has-text 不是合法 CSS，不能塞进 document.querySelector —— 会抛 SyntaxError。 */
    const submitEl = await narrow.$(submitSel)
    if (info.scrollW > info.innerW + 1) narrowFails.push(`${id} 横向溢出 scrollWidth=${info.scrollW} > ${info.innerW}`)
    if (!submitEl) narrowFails.push(`${id} 窄屏下找不到提交按钮`)
    if (!(info.focused && info.ringVisible)) {
      narrowFails.push(`${id} 窄屏下输入框 focused=${info.focused} 焦点环=${info.ringVisible}`)
    }
  }
  check('⑪ 375px 窄屏：三型各一道都不横向溢出、输入框可 focus 且焦点环可见、提交按钮可达',
    narrowFails.length === 0, narrowFails.slice(0, 4).join(' ｜ ') || 'scrollWidth=375 全部通过')

  /* ── ⑫ 控制台 ── */
  const bad = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning')
  check('⑫ 全程控制台 error/warning/pageerror 为空',
    bad.length === 0 && pageErrors.length === 0,
    bad.length === 0 && pageErrors.length === 0
      ? `共 ${consoleMsgs.length} 条其它消息`
      : JSON.stringify({ bad: bad.slice(0, 4), pageErrors: pageErrors.slice(0, 3) }).slice(0, 700))

  await browser.close()
}

/* 看门狗：只在 main() 抛异常导致 browser.close() 被跳过时兜底退出。
   正常路径下 process.exitCode 在末尾汇总时就已经确定，这里不做任何提前退出，
   否则会把还在跑的检查截断成「只剩第 ① 项」。
   10 分钟是刻意小于 acceptance-all.mjs 的 HARD_TIMEOUT_MS（12 分钟）——
   让本脚本自己先带着汇总退出，而不是被外层 taskkill 掉、连失败原因都留不下。 */
const watchdog = setTimeout(() => {
  console.error('⏱ 看门狗触发：验收流程超过 10 分钟未结束，强制退出')
  process.exit(1)
}, 10 * 60 * 1000)
watchdog.unref()

try { await main() } catch (e) {
  check('新题型验收流程未抛异常', false,
    (e instanceof Error ? e.stack : String(e)).split('\n').slice(0, 4).join(' | '))
} finally {
  /* 失败路径也要把 chrome 与 preview 都收掉，否则句柄不释放、进程不退出 */
  if (browser) await browser.close().catch(() => {})
  preview.kill()
}

const failed = checks.filter((c) => !c.ok)
console.log('\n════ 阶段 3.0 三种新题型验收汇总 ════')
console.log(`  ${checks.length} 项检查，失败 ${failed.length} 项`)
for (const f of failed) console.log('  FAIL ' + f.name + ' ← ' + f.detail)
if (previewErr.trim().length > 0) console.log('\npreview stderr（末 800 字）：\n' + previewErr.slice(-800))
process.exitCode = failed.length > 0 ? 1 : 0
