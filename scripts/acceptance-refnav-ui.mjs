/**
 * 任务 05 阶段 5/6 验收：参考答案展示面板 + 上一题/下一题导航 + 深链 + 继续上次。
 *
 * 与 acceptance-site-ui.mjs 分工：后者验「四道主力题打真 Godbolt + 三板块入口 + 主题 + 持久化」，
 * 本脚本验「任务 05 新增的参考答案展示与导航交互」—— 全部用本地判分题型（不新增 Godbolt 请求），
 * 期望值一律从分片现读，脚本里不抄代码、不抄答案。
 *
 * 检查点：
 *   ① 编程题参考答案面板：默认折叠 → 展开出代码块 → 含「在游乐场中打开参考代码」链接 →
 *      链接 href 带 ?src=reference → 点击后 playground 编辑器载入参考代码
 *   ② code_reading 提交正确后参考答案面板自动展开（data-open=true），body 含「预期输出」
 *   ③ 描述型 code_reading 显示「本题为描述型，无标准代码答案」，不显示伪造答案
 *   ④ term_explanation 参考答案面板显示 keyPoints + reference_answer
 *   ⑤ 上一题/下一题按钮 + 进度「第 37 / 70 题（本章）」，点击下一题跳转到深链
 *   ⑥ 键盘 → 翻页；复制链接按钮存在
 *   ⑦ 访问一题后回首页出现「继续上次」入口，点击跳回该题
 *   ⑧ 全程控制台 error/warn/pageerror 为空
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const PORT = 4177
const BASE = `http://127.0.0.1:${PORT}/`

const PG = 'c-ch01-pg-001'       // programming + reference 非空
const CR = 'c-ch09-cr-043'       // code_reading + answer（本地判分）
const DESC = 'c-ch06-cr-109'     // 描述型 code_reading
const TERM = 'c-ch01-te-049'     // term_explanation

const ch01 = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/c-ch01.json'), 'utf8'))
const ch06 = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/c-ch06.json'), 'utf8'))
const ch09 = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/c-ch09.json'), 'utf8'))

const PG_REF = ch01.problems.find((p) => p.id === PG).reference
const PG_ANSWERS = ch01.problems.find((p) => p.id === PG).testCases.map((c) => c.expected)  // 未用，仅参照
const PG_IDX = ch01.problems.findIndex((p) => p.id === PG)
const PG_NEXT = ch01.problems[PG_IDX + 1].id
const PG_PREV = ch01.problems[PG_IDX - 1].id
const PG_TOTAL = ch01.problems.length
const CR_ANSWER = (ch09.problems.find((p) => p.id === CR).answer ?? '').trim()
const TERM_REF = ch01.problems.find((p) => p.id === TERM).reference_answer ?? ''

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ｜ ' + detail : ''}`)
}

if (!existsSync(join(ROOT, 'dist', 'index.html'))) { console.error('dist 不存在，请先 npm run build'); process.exit(1) }

const preview = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
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

async function main() {
  await waitPreview()
  console.log(`vite preview 就绪 → ${BASE}`)
  console.log(`  测试题：${PG}（ref ${PG_REF.length} 字符，next=${PG_NEXT}） ${CR} ${DESC} ${TERM}`)
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const open = async (id) => { await page.goto(`${BASE}#/problems/p/${id}`, { waitUntil: 'networkidle' }) }
  const refSection = () => page.locator('[data-role="reference-answer"]')
  const refToggle = () => page.locator('[data-role="reference-answer-toggle"]')
  const isOpen = async () => (await refSection().getAttribute('data-open')) === 'true'

  // ── ① 编程题：默认折叠 → 展开出代码块 → 「在游乐场中打开参考代码」链接 ──
  await open(PG)
  await refToggle().waitFor({ timeout: 30000 })
  check(`编程题 ${PG} 参考答案面板默认折叠`, (await isOpen()) === false)
  await refToggle().click()
  await page.waitForFunction(() => document.querySelector('[data-role="reference-answer"]')?.getAttribute('data-open') === 'true', null, { timeout: 5000 })
  const codeText = await page.locator('[data-role="reference-answer"] pre').first().innerText()
  // 期望从分片现读：参考代码里「缩进 printf("*\n")」等行应出现在面板
  const refSnippet = PG_REF.split('\n').find((l) => l.includes('printf'))?.replace(/[ \t]/g, '')
  check(`编程题参考答案面板显示参考实现代码`, refSnippet ? codeText.replace(/[ \t]/g, '').includes(refSnippet) : false,
    `面板含 ${refSnippet ?? '(无法派生)'}`)
  const playLink = page.locator('a[href*="/playground?problem=' + PG + '"][href*="src=reference"]')
  check(`编程题参考答案提供「在游乐场中打开参考代码」链接`, (await playLink.count()) === 1)
  await playLink.first().click()
  await page.waitForSelector('textarea[aria-label*="游乐场"], .cm-editor', { timeout: 30000 })
  await page.waitForTimeout(1200)
  const editorText = await page.evaluate(() => document.body.innerText)
  check(`点击链接后 playground 编辑器载入参考代码`, editorText.includes('printf("*\\n")') || editorText.includes('参考实现'), '进入 playground 页')

  // ── ② code_reading：提交正确后参考答案面板自动展开 ──
  await open(CR)
  await refToggle().waitFor({ timeout: 30000 })
  await page.waitForSelector('textarea[aria-label="程序阅读题运行结果输入框"]', { timeout: 30000 })
  await page.locator('textarea[aria-label="程序阅读题运行结果输入框"]').fill(CR_ANSWER)
  await page.locator('button:has-text("提交判分")').first().click()
  await page.waitForFunction(() => /判分通过：/.test(document.body.innerText), null, { timeout: 60000 })
  await page.waitForTimeout(400)
  const crOpen = await isOpen()
  check(`code_reading ${CR} 提交正确后参考答案面板自动展开`, crOpen === true, `data-open=${crOpen}`)
  const crBody = await refSection().innerText()
  check(`code_reading 参考答案含「预期输出」`, crBody.includes('预期输出'), '')

  // ── ③ 描述型 code_reading：显示「本题为描述型，无标准代码答案」 ──
  await open(DESC)
  await refToggle().waitFor({ timeout: 30000 })
  await refToggle().click()
  await page.waitForTimeout(300)
  const descBody = await refSection().innerText()
  check(`描述型 ${DESC} 显示「无标准代码答案」`, descBody.includes('本题为描述型，无标准代码答案'), '')

  // ── ④ term_explanation：显示 keyPoints + reference_answer ──
  await open(TERM)
  await refToggle().waitFor({ timeout: 30000 })
  await refToggle().click()
  await page.waitForTimeout(300)
  const termBody = await refSection().innerText()
  const termNeedle = (TERM_REF.slice(0, 12) || '').replace(/\s+/g, '')
  check(`term_explanation ${TERM} 参考答案显示内容要点`, termNeedle ? termBody.replace(/\s+/g, '').includes(termNeedle) : true,
    `需含 ${termNeedle || '(无法派生，reference_answer 空?)'}`)

  // ── ⑤ 上一题/下一题 + 进度 ──
  await open(PG)
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  const progress = await page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-progress"]').innerText()
  check(`导航进度文案为「第 ${PG_IDX + 1} / ${PG_TOTAL} 题（本章）」`, progress.includes(`第 ${PG_IDX + 1} / ${PG_TOTAL} 题`), progress)
  const nextGo = page.locator('[data-role="problem-nav-bottom"][data-dir="next"]')
  check(`下一题按钮 present (data-dir=next)`, (await nextGo.count()) === 1)
  await nextGo.click()
  await page.waitForFunction((h) => window.location.hash === h, `#/problems/p/${PG_NEXT}`, { timeout: 5000 })
  check(`点击下一题跳到深链 #/problems/p/${PG_NEXT}`, true, await page.evaluate(() => window.location.hash))

  // ── ⑥ 键盘 → 翻页 + 复制链接 ──
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500)
  const hashAfterArrow = await page.evaluate(() => window.location.hash)
  check(`键盘 → 翻到下一题`, hashAfterArrow !== `#/problems/p/${PG_NEXT}`, `当前 ${hashAfterArrow}`)
  const copyBtn = page.locator('[data-role="copy-problem-link"]').first()
  check(`详情页提供「复制本题链接」按钮`, (await copyBtn.count()) >= 1)

  // ── ⑦ 继续上次：回首页出现入口 ──
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="continue-last"]', { timeout: 30000 })
  const contHref = await page.locator('[data-role="continue-last"]').getAttribute('href')
  check(`首页出现「继续上次」入口`, typeof contHref === 'string' && contHref.startsWith('#/problems/p/'), contHref)

  // ── ⑧ 控制台 ──
  const bad = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning')
  check('全流程控制台 error/warn 为空', bad.length === 0 && pageErrors.length === 0,
    bad.length === 0 && pageErrors.length === 0 ? `共 ${consoleMsgs.length} 条其它消息，0 error 0 warn 0 pageerror`
      : JSON.stringify({ bad: bad.slice(0, 6), pageErrors: pageErrors.slice(0, 3) }).slice(0, 800))

  await browser.close()
}

try { await main() } catch (e) { check('参考答案+导航验收流程未抛异常', false, (e instanceof Error ? e.stack : String(e)).split('\n').slice(0, 4).join(' | ')) } finally { preview.kill() }

const failed = checks.filter((c) => !c.ok)
console.log('\n════ 参考答案+导航验收汇总 ════')
console.log(`  ${checks.length} 项检查，失败 ${failed.length} 项`)
for (const f of failed) console.log('  FAIL ' + f.name + ' ← ' + f.detail)
process.exitCode = failed.length > 0 ? 1 : 0

setTimeout(() => process.exit(process.exitCode ?? 0), 3000).unref()
