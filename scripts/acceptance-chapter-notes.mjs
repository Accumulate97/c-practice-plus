/**
 * 阶段 2.2 专项验收：章节导言 / 重点与难点 / 知识点清单 / 章节小结。
 *
 * 任务书的教训是「验收套件通过 ≠ 用户真看得到」，所以这个脚本**不看源码、不看数据文件里的字段有没有**，
 * 只在真浏览器里跑 dist 产物，逐项验「用户打开知识列表页选中一章之后眼睛看到的东西」：
 *   ① 章节面板出现，且导言/难点/小结三块都有非空文字（文字直接从 DOM 取，长度按 DOM 里的算）
 *   ② 知识点清单条数 == 该章在索引里的卡片数（一一对应，不是「大概列了几条」）
 *   ③ 清单里的链接点得开：点第一条真的跳到卡片详情页，且详情页标题与清单文字一致
 *   ④ 没写章节说明的章（C 语言各章）面板整块不出现，不渲染空壳
 *   ⑤ 375px 窄屏不横向溢出；清单第一条链接键盘 Tab 可达且焦点环可见
 *   ⑥ 全程控制台 0 error 0 warning 0 pageerror
 * 期望值一律从 index.json 现算（章节数、卡片数都不写死），以后加章不用改这个脚本。
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { freePort, pickPort } from './lib/free-port.mjs'

const ROOT = process.cwd()
const PORT = await pickPort('CHAPNOTE_PORT')
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

const K = JSON.parse(readFileSync(join(ROOT, 'public/data/knowledge/index.json'), 'utf8'))
const chapters = Array.isArray(K.chapters) ? K.chapters : []
const hasNotes = (c) =>
  (c.intro || '').trim().length > 0 ||
  (c.summary || '').trim().length > 0 ||
  Array.isArray(c.keyDifficulties) && c.keyDifficulties.length > 0
const noted = chapters.filter(hasNotes)
const bare = chapters.filter((c) => !hasNotes(c))
/** 每章卡片数按索引现算，不信 chapters[].count */
const cardCount = (key) =>
  K.cards.filter((c) => `${c.category}|${c.chapter}` === key).length

if (noted.length === 0) {
  console.error('✗ 索引里没有任何带章节说明的章 —— 先跑 tmp/add-chapter-notes.mjs 再跑 npm run build:index')
  process.exit(1)
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
const strip = (s) => s.replace(/\s+/g, '')

async function main() {
  await waitPreview()
  console.log(`vite preview 就绪 → ${BASE}`)
  console.log(`  带章节说明的章 ${noted.length} 个，未写的 ${bare.length} 个（应整块不渲染）`)

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const gotoChapter = async (c) => {
    const key = `${c.category}|${c.chapter}`
    await page.goto(`${BASE}#/knowledge?chapter=${encodeURIComponent(key)}`, { waitUntil: 'networkidle' })
  }
  /** 面板里的四块内容：文字全部从 DOM 取，不信数据文件 */
  const readPanel = () => page.evaluate(() => {
    const p = document.querySelector('[data-role="chapter-panel"]')
    if (!p) return null
    const q = (sel) => p.querySelector(sel)
    const text = (sel) => (q(sel)?.textContent ?? '').trim()
    const diffs = [...p.querySelectorAll('[data-role="chapter-difficulty"]')].map((d) => d.textContent.trim())
    const links = [...p.querySelectorAll('[data-role="chapter-topic-link"]')]
    return {
      chapter: p.dataset.chapter ?? '',
      topicCount: Number(p.dataset.topicCount ?? -1),
      ariaLabel: p.getAttribute('aria-label') ?? '',
      intro: text('[data-role="chapter-intro"]'),
      summary: text('[data-role="chapter-summary"]'),
      diffs,
      sections: [...p.querySelectorAll('[data-role="chapter-topics"] > div > p')].map((s) => s.textContent.trim()),
      linkCount: links.length,
      firstLink: links[0] ? { id: links[0].dataset.id ?? '', text: links[0].textContent.trim(), href: links[0].getAttribute('href') ?? '' } : null,
      heads: [...p.querySelectorAll('h2,h3')].map((h) => h.textContent.trim()),
      visible: p.getBoundingClientRect().height > 0,
    }
  })

  /* ── ①② 逐章验：面板三块文字非空 + 清单条数 == 卡片数 ── */
  const perChapter = []
  for (const c of noted) {
    await gotoChapter(c)
    await page.waitForSelector('[data-role="knowledge-list"]', { timeout: 30000 })
    const p = await readPanel()
    const key = `${c.category}|${c.chapter}`
    const expect = cardCount(key)
    if (!p) { perChapter.push({ file: c.file, ok: false, why: '面板没渲染出来' }); continue }
    const problems = []
    if (p.chapter !== key) problems.push(`data-chapter=${p.chapter} 应为 ${key}`)
    if (!p.visible) problems.push('面板高度为 0（被 CSS 藏起来了）')
    if (strip(p.intro).length < 80) problems.push(`导言 DOM 实测 ${strip(p.intro).length} 字 < 80`)
    if (strip(p.summary).length < 60) problems.push(`小结 DOM 实测 ${strip(p.summary).length} 字 < 60`)
    if (p.diffs.length < 3) problems.push(`难点 ${p.diffs.length} 条 < 3`)
    if (p.diffs.some((d) => strip(d).length < 10)) problems.push('有难点条目短于 10 字')
    if (p.topicCount !== expect) problems.push(`data-topic-count=${p.topicCount} 应为 ${expect}`)
    if (p.linkCount !== expect) problems.push(`清单链接 ${p.linkCount} 条 ≠ 该章卡片 ${expect} 张`)
    if (!p.firstLink || !p.firstLink.id) problems.push('清单第一条链接没有 data-id')
    if (p.heads.length < 3) problems.push(`面板里只有 ${p.heads.length} 个标题（导言/难点/清单/小结 至少要有 3 个）`)
    perChapter.push({
      file: c.file, ok: problems.length === 0, why: problems.join('；'),
      introLen: strip(p.intro).length, diffs: p.diffs.length, links: p.linkCount, expect, sumLen: strip(p.summary).length,
    })
  }
  const badChapters = perChapter.filter((x) => !x.ok)
  check(`① 逐章面板：${noted.length} 章的导言/难点/小结都非空且字数达标`, badChapters.length === 0,
    badChapters.length === 0
      ? perChapter.map((x) => `${x.file}(导言${x.introLen}字/${x.diffs}难点/小结${x.sumLen}字)`).join(' ')
      : JSON.stringify(badChapters).slice(0, 900))
  const mismatch = perChapter.filter((x) => x.links !== x.expect)
  check('② 知识点清单与卡片一一对应（每章清单条数 == 索引里该章卡片数）', mismatch.length === 0,
    mismatch.length === 0
      ? perChapter.map((x) => `${x.file}:${x.links}/${x.expect}`).join(' ')
      : JSON.stringify(mismatch.map((x) => ({ file: x.file, links: x.links, expect: x.expect }))))

  /* ── ③ 清单第一条链接真的能点开，且详情页标题与清单文字一致 ── */
  await gotoChapter(noted[0])
  await page.waitForSelector('[data-role="chapter-topic-link"]', { timeout: 30000 })
  const first = await page.evaluate(() => {
    const a = document.querySelector('[data-role="chapter-topic-link"]')
    return { id: a.dataset.id ?? '', text: a.textContent.trim() }
  })
  await page.locator('[data-role="chapter-topic-link"]').first().click()
  await page.waitForFunction((id) => location.hash.includes(`/knowledge/${id}`), first.id, { timeout: 30000 })
  /* 详情页是路由级 lazy + 还要 fetch 分片 JSON，hash 变了不等于渲染完了；
     只等 hash 会读到骨架屏（313 字、没有 h1）—— 必须等 data-role="knowledge-detail" 出现。 */
  await page.waitForSelector('[data-role="knowledge-detail"]', { timeout: 30000 })
  await page.waitForSelector('[data-role="card-title"]', { timeout: 30000 })
  const detail = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h1,h2')].map((x) => x.textContent.trim()).filter(Boolean)
    return {
      hash: location.hash,
      heads: h,
      cardTitle: (document.querySelector('[data-role="card-title"]')?.textContent ?? '').trim(),
      cardId: document.querySelector('[data-role="knowledge-detail"]')?.dataset.id ?? '',
      bodyLen: document.body.innerText.length,
    }
  })
  check(`③ 清单链接可点 → 跳进卡片详情页 ${first.id}`,
    detail.cardId === first.id && detail.bodyLen > 200,
    `data-id=${detail.cardId} 期望 ${first.id}，正文 ${detail.bodyLen} 字，hash=${detail.hash}`)
  const wantTitle = first.text.replace(/^\d+\s*/, '')
  check('③b 详情页 h1 与清单上那条标题逐字一致',
    detail.cardTitle === wantTitle && detail.heads.some((h) => h === wantTitle),
    `清单文字="${wantTitle}" 详情页 card-title="${detail.cardTitle}"`)

  /* ── ④ 没写说明的章：面板整块不出现（不渲染空壳） ── */
  if (bare.length > 0) {
    await gotoChapter(bare[0])
    await page.waitForSelector('[data-role="knowledge-list"]', { timeout: 30000 })
    const ghost = await page.evaluate(() => ({
      panel: document.querySelectorAll('[data-role="chapter-panel"]').length,
      intro: document.querySelectorAll('[data-role="chapter-intro"]').length,
      rows: document.querySelectorAll('[data-role="row"]').length,
    }))
    check(`④ 未写说明的章（${bare[0].file}）不渲染面板，卡片列表照常`,
      ghost.panel === 0 && ghost.intro === 0 && ghost.rows > 0, JSON.stringify(ghost))
  }
  /* 未选章时也不该出现面板（8 个面板堆在列表页上是噪声） */
  await page.goto(`${BASE}#/knowledge`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-role="knowledge-list"]', { timeout: 30000 })
  const noneSelected = await page.evaluate(() => document.querySelectorAll('[data-role="chapter-panel"]').length)
  check('④b 未选章时一个面板都不出现', noneSelected === 0, `面板数=${noneSelected}`)

  /* ── ⑤ 375px 窄屏：不横向溢出 + 清单链接 Tab 可达且焦点环可见 ── */
  const narrow = await browser.newPage({ viewport: { width: 375, height: 812 } })
  narrow.on('pageerror', (e) => pageErrors.push('[375] ' + e.message))
  const big = noted.reduce((a, b) => (cardCount(`${a.category}|${a.chapter}`) >= cardCount(`${b.category}|${b.chapter}`) ? a : b))
  await narrow.goto(`${BASE}#/knowledge?chapter=${encodeURIComponent(`${big.category}|${big.chapter}`)}`, { waitUntil: 'networkidle' })
  await narrow.waitForSelector('[data-role="chapter-topic-link"]', { timeout: 30000 })
  const narrowInfo = await narrow.evaluate(() => {
    const panel = document.querySelector('[data-role="chapter-panel"]')
    const first = document.querySelector('[data-role="chapter-topic-link"]')
    first.focus()
    const cs = getComputedStyle(first)
    const r = panel.getBoundingClientRect()
    return {
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      panelW: Math.round(r.width),
      focused: document.activeElement === first,
      outline: cs.outlineStyle + ' ' + cs.outlineWidth,
      ringVisible: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
      tagIsAnchor: first.tagName === 'A',
    }
  })
  check(`⑤ 375px 窄屏不横向溢出（${big.file}，卡片最多的一章）`,
    narrowInfo.scrollW <= narrowInfo.innerW + 1 && narrowInfo.panelW <= narrowInfo.innerW,
    `scrollWidth=${narrowInfo.scrollW} innerWidth=${narrowInfo.innerW} 面板宽=${narrowInfo.panelW}`)
  check('⑤b 清单链接是 <a> 且 Tab/focus 可达、焦点环可见',
    narrowInfo.tagIsAnchor && narrowInfo.focused && narrowInfo.ringVisible,
    `tag=${narrowInfo.tagIsAnchor ? 'A' : '?'} focused=${narrowInfo.focused} outline=${narrowInfo.outline}`)

  /* ── ⑥ 控制台 ── */
  const bad = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning')
  check('⑥ 全程控制台 error/warning/pageerror 为空',
    bad.length === 0 && pageErrors.length === 0,
    bad.length === 0 && pageErrors.length === 0
      ? `共 ${consoleMsgs.length} 条其它消息`
      : JSON.stringify({ bad: bad.slice(0, 4), pageErrors: pageErrors.slice(0, 3) }).slice(0, 700))

  await browser.close()
}

try { await main() } catch (e) {
  check('章节说明验收流程未抛异常', false,
    (e instanceof Error ? e.stack : String(e)).split('\n').slice(0, 4).join(' | '))
} finally { preview.kill() }

const failed = checks.filter((c) => !c.ok)
console.log('\n════ 阶段 2.2 章节说明验收汇总 ════')
console.log(`  ${checks.length} 项检查，失败 ${failed.length} 项`)
for (const f of failed) console.log('  FAIL ' + f.name + ' ← ' + f.detail)
process.exitCode = failed.length > 0 ? 1 : 0
setTimeout(() => process.exit(process.exitCode ?? 0), 3000).unref()
