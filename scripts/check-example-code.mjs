/**
 * 知识卡片示例代码编译/运行校验器（阶段2 用）。
 *
 * 任务书 2.3：每段代码单独存 .c 并 `gcc -std=c99 -Wall -Wextra -o /tmp/t xxx.c` **0 输出**才入库。
 * 本脚本把这条铁律自动化：遍历知识分片里所有 examples[].code → 落 .c → 本地 gcc 实编译
 * （不是 -fsyntax-only，要连链接一起过）→ 有任何 stderr 输出即判失败；
 * 若示例带 stdin + expected，再实跑一次并比对（判分口径与 judge 一致：逐行去行尾空白、去末尾空行）。
 *
 * 用法：
 *   node scripts/check-example-code.mjs                 # 只查 ds-* 分片
 *   node scripts/check-example-code.mjs --all           # 查全部知识分片
 *   node scripts/check-example-code.mjs --shard ds-ch05 # 只查指定分片
 *   node scripts/check-example-code.mjs --no-run        # 只编译不实跑
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KNOW_DIR = join(ROOT, 'public', 'data', 'knowledge')
const TMP = join(ROOT, 'tmp', 'kcode')
const CFLAGS = ['-std=c99', '-Wall', '-Wextra']

const argv = process.argv.slice(2)
const all = argv.includes('--all')
const noRun = argv.includes('--no-run')
const shardArg = argv.includes('--shard') ? argv[argv.indexOf('--shard') + 1] : null

mkdirSync(TMP, { recursive: true })

const shards = readdirSync(KNOW_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .map((f) => f.replace(/\.json$/, ''))
  .filter((n) => (shardArg ? n === shardArg : all ? true : n.startsWith('ds-')))
  .sort()

/** 判分口径的 stdout 规范化：逐行去行尾空白，再去掉末尾空行 */
function norm(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '')
}

let cards = 0, examples = 0, cok = 0, cfail = 0, rok = 0, rfail = 0, rskip = 0
const failures = []

for (const name of shards) {
  const json = JSON.parse(readFileSync(join(KNOW_DIR, `${name}.json`), 'utf8'))
  const list = Array.isArray(json.cards) ? json.cards : []
  let sc = 0, se = 0, sck = 0, scf = 0, srk = 0, srf = 0
  for (const card of list) {
    sc++
    const exs = Array.isArray(card.examples) ? card.examples : []
    exs.forEach((ex, i) => {
      const code = typeof ex?.code === 'string' ? ex.code : ''
      if (code.trim().length === 0) return
      se++
      const base = `${card.id}__ex${i}`.replace(/[^A-Za-z0-9_-]/g, '_')
      const src = join(TMP, `${base}.c`)
      const exe = join(TMP, `${base}.exe`)
      writeFileSync(src, code.endsWith('\n') ? code : code + '\n', 'utf8')
      if (existsSync(exe)) rmSync(exe)
      const cc = spawnSync('gcc', [...CFLAGS, '-o', exe, src], { encoding: 'utf8', timeout: 60000 })
      const stderr = ((cc.stderr ?? '') + (cc.stdout ?? '')).trim()
      if (cc.status !== 0 || stderr.length > 0) {
        scf++
        failures.push({ where: `${name} ${card.id} examples[${i}]${ex?.title ? ' 「' + ex.title + '」' : ''}`, kind: 'compile', detail: stderr.slice(0, 900) || `gcc exit ${cc.status}` })
        return
      }
      sck++
      if (noRun || ex.runnable === false || typeof ex.expected !== 'string') { rskip++; return }
      const run = spawnSync(exe, { input: ex.stdin ?? '', encoding: 'utf8', timeout: 20000 })
      const got = norm(run.stdout)
      if (run.status !== 0 || got !== norm(ex.expected)) {
        srf++
        failures.push({ where: `${name} ${card.id} examples[${i}]`, kind: 'run', detail: `exit=${run.status}\n期望:\n${norm(ex.expected).slice(0, 400)}\n实际:\n${got.slice(0, 400)}\nstderr: ${(run.stderr ?? '').slice(0, 200)}` })
      } else srk++
    })
  }
  cards += sc; examples += se; cok += sck; cfail += scf; rok += srk; rfail += srf
  if (se > 0) console.log(`${name.padEnd(10)} 卡 ${String(sc).padStart(3)} · 示例 ${String(se).padStart(3)} · 编译过 ${String(sck).padStart(3)} 失败 ${scf} · 实跑过 ${String(srk).padStart(3)} 失败 ${srf}`)
}

console.log(`\n分片 ${shards.length} 个 · 卡片 ${cards} 张 · 示例 ${examples} 段 · 编译 0 警告通过 ${cok} / 失败 ${cfail} · 实跑通过 ${rok} / 失败 ${rfail} / 跳过 ${rskip}`)
if (failures.length > 0) {
  console.log('\n===== 失败明细 =====')
  for (const f of failures.slice(0, 40)) console.log(`✗ [${f.kind}] ${f.where}\n${f.detail}\n`)
  if (failures.length > 40) console.log(`…另有 ${failures.length - 40} 条未列出`)
}
process.exit(cfail > 0 || rfail > 0 ? 1 : 0)
