/**
 * 体验轮 1.1 验收：白名单编程型「空白起始」+ 占位提示 + IO 约定渲染，
 * 非白名单型骨架原样保留（一刀切会毁题，本套件就是防回归的闸）。
 *
 *   B1 programming 深链：编辑器 value===''、placeholder 提示在位、io-spec
 *      （输入/输出格式，数据字段此前零渲染）显示、starter 不泄露进编辑器
 *   B2 algorithm_impl：同 B1
 *   B3 timed_impl（无 input/output_format 字段）：编辑器空白 + 首组用例作
 *      样例（io-sample），样例内容与 testCases[0] 一致
 *   B4 api_drill：starter 原样保留（题干承诺「main 已给出，请不要改动」），
 *      textarea 值 === 数据 code_starter
 *   B5 code_optimization：SCAFFOLD 空模板保留（题干低效代码不被清空）
 *   B6 白名单题输入代码后点「重置代码」回到空白
 *   B7 全程控制台 error/warn/pageerror 为零
 *
 * 期望值一律从 public/data 现读，脚本不写死。端口动态分配（4176 曾被占用教训）。
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const SCAFFOLD = ['#include <stdio.h>', '', 'int main(void) {', '', '    return 0;', '}', ''].join('\n')
const PLACEHOLDER = '从零编写完整程序，需含 main 与 return 0；提交后按 stdin / stdout 比对'

async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
  })
}
const PORT = await freePort()
const BASE = `http://127.0.0.1:${PORT}/`

const index = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/index.json'), 'utf8'))
const shardCache = new Map()
function loadShard(file) {
  if (!shardCache.has(file)) shardCache.set(file, JSON.parse(readFileSync(join(ROOT, 'public/data/problems', file), 'utf8')))
  return shardCache.get(file)
}
function getProblem(id) {
  const entry = index.problems.find((p) => p.id === id)
  if (!entry) return null
  return loadShard(entry.file).problems.find((p) => p.id === id)
}
function pickByType(type, pred) {
  for (const e of index.problems) {
    if (e.type !== type) continue
    const full = getProblem(e.id)
    if (full && (!pred || pred(full))) return full
  }
  return null
}

const hasIO = (p) => typeof p.input_format === 'string' && p.input_format.trim().length > 0
const PG = pickByType('programming', (p) => hasIO(p) && typeof p.code_starter === 'string' && p.code_starter.trim())
const ALG = pickByType('algorithm_impl', (p) => hasIO(p) && typeof p.code_starter === 'string' && p.code_starter.trim())
const TI = pickByType('timed_impl', (p) => !hasIO(p) && Array.isArray(p.testCases) && p.testCases.length > 0)
const AD = pickByType('api_drill', (p) => typeof p.code_starter === 'string' && p.code_starter.includes('int main'))
const CO = pickByType('code_optimization')

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ｜ ' + detail : ''}`)
}

if (!existsSync(join(ROOT, 'dist', 'index.html'))) { console.error('dist 不存在，请先 npm run build'); process.exit(1) }
for (const [label, p] of [['programming', PG], ['algorithm_impl', ALG], ['timed_impl', TI], ['api_drill', AD], ['code_optimization', CO]]) {
  if (!p) { console.error(`数据里找不到可用的 ${label} 样例题`); process.exit(1) }
}

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
  console.log(`  样例题：pg=${PG.id} alg=${ALG.id} ti=${TI.id} ad=${AD.id} co=${CO.id}`)
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const editor = page.locator('textarea[data-role="code-editor-input"]')
  async function openProblem(id) {
    await page.goto(`${BASE}#/problems/p/${id}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('textarea[data-role="code-editor-input"]', { timeout: 30000 })
  }

  // ── B1 programming：空白 + 占位 + io-spec ──
  await openProblem(PG.id)
  const v1 = await editor.inputValue()
  check(`B1a ${PG.id}（programming）编辑器空白起始`, v1 === '', `len=${v1.length}`)
  const ph1 = await editor.getAttribute('placeholder')
  check('B1b 占位提示在位（placeholder 属性，非 value，不参与编译）', ph1 === PLACEHOLDER, String(ph1).slice(0, 40))
  const io1 = page.locator('[data-role="io-spec"]')
  const io1Text = (await io1.count()) > 0 ? await io1.innerText() : ''
  check('B1c io-spec 渲染输入/输出格式（与数据一致）',
    io1Text.includes('输入格式') && io1Text.includes('输出格式')
      && io1Text.includes(String(PG.input_format).trim().slice(0, 12))
      && io1Text.includes(String(PG.output_format).trim().slice(0, 12)),
    io1Text.replace(/\s+/g, ' ').slice(0, 80))

  // ── B6 重置回空白（在 B1 同页顺手做）──
  await editor.fill('int main(void) { return 0; }')
  check('B6a 输入后编辑器有内容', (await editor.inputValue()).length > 0)
  await page.getByRole('button', { name: '重置代码' }).click()
  await page.waitForTimeout(300)
  check('B6b 点「重置代码」回到空白（白名单初值恒为空串）', (await editor.inputValue()) === '')

  // ── B2 algorithm_impl ──
  await openProblem(ALG.id)
  const v2 = await editor.inputValue()
  const io2 = page.locator('[data-role="io-spec"]')
  check(`B2 ${ALG.id}（algorithm_impl）空白 + io-spec`, v2 === '' && (await io2.count()) > 0, `len=${v2.length}`)

  // ── B3 timed_impl：空白 + 首组用例样例 ──
  await openProblem(TI.id)
  const v3 = await editor.inputValue()
  const sample = page.locator('[data-role="io-sample"]')
  const sampleText = (await sample.count()) > 0 ? await sample.innerText() : ''
  const tc0 = TI.testCases[0]
  const stdin0 = String(tc0.stdin ?? tc0.input ?? '').trim().slice(0, 12)
  check(`B3a ${TI.id}（timed_impl）编辑器空白`, v3 === '', `len=${v3.length}`)
  check('B3b io-sample 显示首组用例且与数据一致',
    sampleText.includes('样例') && (stdin0.length === 0 || sampleText.includes(stdin0)),
    sampleText.replace(/\s+/g, ' ').slice(0, 80))

  // ── B4 api_drill：starter 保留 ──
  await openProblem(AD.id)
  const v4 = await editor.inputValue()
  check(`B4 ${AD.id}（api_drill）starter 原样保留（题干承诺 main 已给出）`, v4 === AD.code_starter, `len=${v4.length}`)

  // ── B5 code_optimization：SCAFFOLD 保留 ──
  await openProblem(CO.id)
  const v5 = await editor.inputValue()
  check(`B5 ${CO.id}（code_optimization）SCAFFOLD 空模板保留`, v5 === SCAFFOLD, JSON.stringify(v5.slice(0, 60)))

  // ── B7 控制台 ──
  const bad = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning')
  check('B7 全程控制台 error/warn/pageerror 为空', bad.length === 0 && pageErrors.length === 0,
    bad.length === 0 && pageErrors.length === 0 ? `共 ${consoleMsgs.length} 条其它消息`
      : JSON.stringify({ bad: bad.slice(0, 6), pageErrors: pageErrors.slice(0, 3) }).slice(0, 800))

  await browser.close()
}

try { await main() } catch (e) { check('空白起始验收流程未抛异常', false, (e instanceof Error ? e.stack : String(e)).split('\n').slice(0, 4).join(' | ')) } finally { preview.kill() }

const failed = checks.filter((c) => !c.ok)
console.log('\n════ 体验轮 1.1 空白起始验收汇总 ════')
console.log(`  ${checks.length} 项检查，失败 ${failed.length} 项`)
for (const f of failed) console.log('  FAIL ' + f.name + ' ← ' + f.detail)
process.exitCode = failed.length > 0 ? 1 : 0

setTimeout(() => process.exit(process.exitCode ?? 0), 3000).unref()
