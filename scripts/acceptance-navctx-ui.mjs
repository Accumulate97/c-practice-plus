/**
 * 任务 07 阶段 3 验收：上下题导航「无上下文」四用例 + 首尾边界 + /#/p/:id 别名深链
 * + 列表 tag 参数 + 滚动位置恢复 + 键盘 ←。
 *
 * 与 acceptance-refnav-ui.mjs 分工：refnav 验「参考答案面板 + 有上下文导航 + 继续上次」，
 * 本脚本专验任务 07 提示词 §三 的验收口径 ——
 *   N1 无上下文深链直开：全新浏览器（无 localStorage）直接开 #/problems/p/:id，
 *      顶/底两组导航必须渲染，进度「第 X / Y 题（本章）」与分片实算一致，prev/next 可点
 *   N2 点击下一题 → 跳到同章 id 升序的下一题；点上一题跳回
 *   N3 刷新后导航仍在（不依赖任何存储）
 *   N4 375×812 视口导航可见（按钮盒子非零、进度文案存在）
 *   N5 首题 prev 置灰 + 「已是本章第一题」提示；尾题 next 置灰 + 「去看看下一章」链接
 *   N6 禁用态边界按钮点击后 hash 不变（不再静默无反应地假装可点）
 *   N7 键盘 ← 翻到上一题
 *   N8 别名深链 #/p/:id → replace 跳 #/problems/p/:id 且题目页渲染
 *   N9 列表 ?tag= 参数生效：行数与索引实算一致，行内标签全部命中
 *   N10 行内标签点击 → URL 加 tag 且过滤生效；激活 chip 点击 → 移除 tag
 *   N11 列表滚动到中部 → 点行进详情 → 面包屑返回列表 → scrollY 恢复（±150px）
 *   N12 全程控制台 error/warn/pageerror 为空
 *
 * 期望值一律从 public/data 现读，脚本不写死题量。
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const PORT = 4178
const BASE = `http://127.0.0.1:${PORT}/`
const SHARD = 'c-ch01.json'

const shard = JSON.parse(readFileSync(join(ROOT, 'public/data/problems', SHARD), 'utf8'))
const ids = shard.problems.map((p) => p.id).sort()
const FIRST = ids[0]
const LAST = ids[ids.length - 1]
const MID = ids[Math.floor(ids.length / 2)]
const MID_IDX = ids.indexOf(MID)
const TOTAL = ids.length

const index = JSON.parse(readFileSync(join(ROOT, 'public/data/problems/index.json'), 'utf8'))
// 选一个题量适中（20–400）的标签做 tag 参数验收
const tagCounts = new Map()
for (const p of index.problems) for (const t of p.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
const TAG = [...tagCounts.entries()].filter(([, n]) => n >= 20 && n <= 400).sort((a, b) => b[1] - a[1])[0]?.[0]
const TAG_COUNT = TAG ? tagCounts.get(TAG) : 0

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
  console.log(`  分片 ${SHARD}：共 ${TOTAL} 题，first=${FIRST} mid=${MID}(${MID_IDX + 1}) last=${LAST}；tag=${TAG}(${TAG_COUNT})`)
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const navBottom = (dir) => page.locator(`[data-role="problem-nav-bottom"][data-dir="${dir}"]`)
  const hash = () => page.evaluate(() => window.location.hash)

  // ── N1 无上下文深链直开（全新 page = 无任何 localStorage） ──
  await page.goto(`${BASE}#/problems/p/${MID}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="problem-nav-top"]', { timeout: 30000 })
  // 每组导航条上有 prev/next 两个按钮都挂 data-role=problem-nav-{top|bottom}，存在即 ≥2
  check('N1a 无上下文深链直开：顶部导航渲染', (await page.locator('[data-role="problem-nav-top"]').count()) >= 2)
  check('N1b 无上下文深链直开：底部导航渲染', (await page.locator('[data-role="problem-nav-bottom"]').count()) >= 2)
  const progress = await page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-progress"]').innerText()
  check(`N1c 进度文案「第 ${MID_IDX + 1} / ${TOTAL} 题（本章）」`, progress.includes(`第 ${MID_IDX + 1} / ${TOTAL} 题`), progress)
  check('N1d 中间题 prev/next 均可点', (await navBottom('prev').getAttribute('data-disabled')) === 'false' && (await navBottom('next').getAttribute('data-disabled')) === 'false')

  // ── N2 点击下一题 → 同章 id 升序下一题；上一题跳回 ──
  await navBottom('next').click()
  await page.waitForFunction((h) => window.location.hash === h, `#/problems/p/${ids[MID_IDX + 1]}`, { timeout: 5000 })
  check(`N2a 点下一题跳到 ${ids[MID_IDX + 1]}`, true, await hash())
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  await navBottom('prev').click()
  await page.waitForFunction((h) => window.location.hash === h, `#/problems/p/${MID}`, { timeout: 5000 })
  check('N2b 点上一题跳回', true, await hash())

  // ── N3 刷新存续 ──
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  const progress2 = await page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-progress"]').innerText()
  check('N3 刷新后导航与进度存续', progress2.includes(`第 ${MID_IDX + 1} / ${TOTAL} 题`), progress2)

  // ── N7 键盘 ← 翻上一题（→ 已由 refnav 套件覆盖） ──
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('ArrowLeft')
  await page.waitForFunction((h) => window.location.hash === h, `#/problems/p/${ids[MID_IDX - 1]}`, { timeout: 5000 })
  check('N7 键盘 ← 翻到上一题', true, await hash())

  // ── N5/N6 首尾边界 ──
  await page.goto(`${BASE}#/problems/p/${FIRST}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  check('N5a 首题 prev 置灰', (await navBottom('prev').getAttribute('data-disabled')) === 'true')
  check('N5b 首题 next 可点', (await navBottom('next').getAttribute('data-disabled')) === 'false')
  const hintFirst = page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-edge-hint"]')
  check('N5c 首题显示「已是本章第一题」提示链接', (await hintFirst.count()) >= 1 && (await hintFirst.first().innerText()).includes('第一题'))
  const hashBefore = await hash()
  await navBottom('prev').click({ force: true })
  await page.waitForTimeout(400)
  check('N6 禁用态 prev 点击后 hash 不变', (await hash()) === hashBefore, await hash())

  await page.goto(`${BASE}#/problems/p/${LAST}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  check('N5d 尾题 next 置灰', (await navBottom('next').getAttribute('data-disabled')) === 'true')
  const hintLast = page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-edge-hint"]')
  check('N5e 尾题显示「去看看下一章」链接', (await hintLast.count()) >= 1 && (await hintLast.first().innerText()).includes('下一章'))

  // ── N4 375px 视口 ──
  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  const boxes = await page.locator('[data-role="problem-nav-bottom"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height } }))
  check('N4a 375px 下导航按钮盒子非零', boxes.length >= 1 && boxes.every((b) => b.w > 0 && b.h > 0), JSON.stringify(boxes))
  const progress375 = await page.locator('[data-role="problem-nav"][data-position="bottom"] [data-role="problem-nav-progress"]').innerText()
  check('N4b 375px 下进度文案可见', progress375.includes('题'), progress375)
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── N8 别名深链 /#/p/:id ──
  await page.goto(`${BASE}#/p/${MID}`, { waitUntil: 'networkidle' })
  await page.waitForFunction((h) => window.location.hash === h, `#/problems/p/${MID}`, { timeout: 10000 })
  await page.waitForSelector('[data-role="problem-nav-bottom"]', { timeout: 30000 })
  check('N8 别名 #/p/:id replace 跳转到正式深链且题目页渲染', true, await hash())

  // ── N9 列表 tag 参数 ──
  if (TAG) {
    await page.goto(`${BASE}#/problems?tag=${encodeURIComponent(TAG)}&size=100`, { waitUntil: 'networkidle' })
    await page.waitForSelector('tr[data-role="row"]', { timeout: 30000 })
    const summary = await page.locator('[data-role="summary"]').getAttribute('data-filtered')
    check(`N9a ?tag=${TAG} 筛出数与索引实算一致（${TAG_COUNT}）`, Number(summary) === TAG_COUNT, `data-filtered=${summary}`)
    // 行内 chip 只展示每题前 3 个标签，命中标签可能排在第 4+ 位 → 用行 data-id 对索引核对
    const rowIds = await page.locator('tr[data-role="row"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-id')))
    const indexById = new Map(index.problems.map((p) => [p.id, p]))
    const allHaveTag = rowIds.length > 0 && rowIds.every((id) => (indexById.get(id)?.tags ?? []).includes(TAG))
    check(`N9b 首屏 ${rowIds.length} 行按索引核对全部含标签「${TAG}」`, allHaveTag, allHaveTag ? '' : JSON.stringify(rowIds.filter((id) => !(indexById.get(id)?.tags ?? []).includes(TAG)).slice(0, 5)))
    const rowTags = await page.locator('tr[data-role="row"] [data-role="row-tag"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tag')))
    check('N9c 行内标签 chip 已渲染', rowTags.length > 0, `${rowTags.length} 个`)
    const tagChip = page.locator(`button[data-tag="${TAG}"][aria-pressed="true"]`)
    check('N9d 激活标签 chip 存在（可移除）', (await tagChip.count()) >= 1)

    // ── N10 行内标签点击 → 过滤；chip 点击 → 移除 ──
    await page.goto(`${BASE}#/problems?size=20`, { waitUntil: 'networkidle' })
    await page.waitForSelector('tr[data-role="row"] [data-role="row-tag"]', { timeout: 30000 })
    const firstTagBtn = page.locator('tr[data-role="row"] [data-role="row-tag"]').first()
    const clickedTag = await firstTagBtn.getAttribute('data-tag')
    await firstTagBtn.click()
    await page.waitForTimeout(500)
    const hashTag = await hash()
    check('N10a 点行内标签 → URL 带上 tag 参数', hashTag.includes('tag=' + encodeURIComponent(clickedTag ?? '')), hashTag)
    const chip = page.locator(`button[data-tag="${clickedTag}"][aria-pressed="true"]`)
    if (clickedTag) {
      await chip.first().click()
      await page.waitForTimeout(500)
      check('N10b 点激活 chip → 移除 tag 过滤', !(await hash()).includes('tag='), await hash())
    }
  } else {
    check('N9/N10 找到可用标签', false, '索引里没有 20–400 题量级的标签')
  }

  // ── N11 滚动位置恢复 ──
  // 注意：必须用 mouse.click 按坐标点「视口内可见」的行 —— locator.click() 会先跑 CDP
  // scrollIntoViewIfNeeded 把页面滚走（实测 900→419，钩子证明非应用代码所为），
  // snapshotNav 存下的就是被污染的 scrollY。真实用户点可见行不会滚动，测试要模拟这一点。
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto(`${BASE}#/problems?size=100`, { waitUntil: 'networkidle' })
  await page.waitForSelector('tr[data-role="row"]', { timeout: 30000 })
  await page.evaluate(() => window.scrollTo({ top: 900 }))
  await page.waitForTimeout(300)
  const scrolled = await page.evaluate(() => window.scrollY)
  check('N11a 列表页可滚动到中部', scrolled > 500, `scrollY=${scrolled}`)
  const target = await page.evaluate(() => {
    // sticky header 实测 ~120px（品牌+搜索+导航两行），必须动态量：
    // 选完全落在 header 下方的链接，否则 mouse.click 会点在 header 上（探针4实测踩坑）
    const header = document.querySelector('header')
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0
    const links = [...document.querySelectorAll('tr[data-role="row"] a[href*="/problems/p/"]')]
    const i = links.findIndex((a) => { const r = a.getBoundingClientRect(); return r.top > headerBottom + 8 && r.bottom < window.innerHeight - 8 })
    if (i < 0) return null
    const r = links[i].getBoundingClientRect()
    return { href: links[i].getAttribute('href'), x: r.left + 4, y: r.top + r.height / 2 }
  })
  check('N11b 视口内找到可点的题目行', !!target, JSON.stringify(target))
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction((h) => window.location.hash === h, target.href, { timeout: 5000 })
  const crumb = page.locator('[data-role="problem-breadcrumb"] a[href*="/problems"]').first()
  await crumb.click()
  await page.waitForSelector('tr[data-role="row"]', { timeout: 30000 })
  await page.waitForTimeout(600)
  const restored = await page.evaluate(() => window.scrollY)
  check('N11c 面包屑返回列表后滚动位置恢复（±150px）', Math.abs(restored - scrolled) <= 150, `原 ${scrolled} → 恢复 ${restored}`)
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── N12 控制台 ──
  const bad = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning')
  check('N12 全程控制台 error/warn/pageerror 为空', bad.length === 0 && pageErrors.length === 0,
    bad.length === 0 && pageErrors.length === 0 ? `共 ${consoleMsgs.length} 条其它消息`
      : JSON.stringify({ bad: bad.slice(0, 6), pageErrors: pageErrors.slice(0, 3) }).slice(0, 800))

  await browser.close()
}

try { await main() } catch (e) { check('导航上下文验收流程未抛异常', false, (e instanceof Error ? e.stack : String(e)).split('\n').slice(0, 4).join(' | ')) } finally { preview.kill() }

const failed = checks.filter((c) => !c.ok)
console.log('\n════ 任务07 导航上下文验收汇总 ════')
console.log(`  ${checks.length} 项检查，失败 ${failed.length} 项`)
for (const f of failed) console.log('  FAIL ' + f.name + ' ← ' + f.detail)
process.exitCode = failed.length > 0 ? 1 : 0

setTimeout(() => process.exit(process.exitCode ?? 0), 3000).unref()
