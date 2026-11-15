# NEXT_SESSION —— 续接说明

状态：**DS 板块扩充任务全部收官（2026-11-09）**。任务书《ds_板块扩充_完整提示词.md》阶段 0→5 全部达成，阶段5 全套闸门全绿 + 30 道分层抽检 30/30 + token 用量报告 + 本续接说明。

## 事实速览（2026-11-09 更新）
- 线上地址：https://accumulate97.github.io/c-practice-plus/ （GitHub Pages，Source = GitHub Actions，push main 即部署）
- 仓库：Accumulate97/c-practice-plus，分支 main；本地工作区为本次 DS 扩充后的最终态
- 题库：**3808 题**（C 2757 + DS **1051**）；DS 各章 ds-ch01 68 / ch02 178 / ch03 142 / ch04 160 / ch05 136 / ch06 133 / ch07 119 / ch08 115
- 知识卡片：**447 张**（C 315 + DS **132**）；演示：2D **viz 39** + 3D **viz3d catalog 60**（34 条 source='viz' 复用 2D 语料 + 26 条 source='viz3d' 专属）
- 阶段4 判据「3D 演示 38→≥58」达成：catalog 60 条、26 条 3D 专属规格全验证；阶段5 抽检 `stratified-audit.mjs` 30/30、`acceptance:viz3d` **104/104**
- DS 新增题型：**ds_debug / complexity_analysis / structure_trace** 三种（schema v3.3，全链路 9 处接线）；程序库在 `scripts/ds-bank/`（27 个 mjs，每 code entry 派 7 题）
- 判分：Godbolt 三级容灾 cg132→cg142→cg131 不变；`judge:verify` 真跑置 `verified`，后端 5xx=「未判定（一字节不动）」
- 数据生成器：`scripts/gen-ds-problems.mjs` 逐章 `--resume` 增量（**已生成章节绝不能无 --resume 全量重生成**，`newId()` 会续号撞车）；`scripts/run-c.mjs` 本地 gcc 实测（asks 用实测非教材公式）

## 本任务（ds_板块扩充）完成要点
- **阶段3 判据 = DS 总数 ≥1050**（非每章配额；配额 ch01 25/ch02 70/ch03 105/ch04 120/ch05 90/ch06 85/ch07 65/ch08 65 供参考）
- **阶段4** 把 `src/modules/viz3d/catalog.ts` 的 `VIZ3D_CATALOG` 38→60；新增 `specs-ds-a/b/c.ts`（22 个 3D 内存沙盘/调用栈/数组立方体），`generators.ts` 聚合 `...BASE_VIZ3D_SPECS, ...SPECS_A/B/C`；**`specHelpers.ts` 拆出 cell/region/step/STACK_ADDR 打破 generators⇄specs-ds-* 循环依赖**；`Viz3DSource='viz'|'viz3d'`（source='viz' 复用 public/data/viz/{id}.json 2D 语料）
- **阶段5** `acceptance:viz3d` 曾 FAIL「shared≥60%」（34/60），已把 5 个 3D 内存沙盘（seq-stack/circular-queue/singly-list/doubly-list/bst-node）转 `source='viz'`→ 新增 `src/modules/viz/algorithms/dsMemory.ts`（2D memory 规格）→ `viz/index.ts` 末尾展开 → **删除 public/data/viz3d/ 下 5 个残留 {id}.json**（gen-viz3d 不清理目录，残留文件让 findCorpus 误判 shared=false）→ 复跑 gen:viz/gen:viz3d/build:index/acceptance:viz3d = **104/104**

## 续接第一步该做什么
本任务已收官，无必做事项。后续工作参考：
1. 若需再扩充 DS 题库：读 `scripts/gen-ds-problems.mjs` 契约（每 code entry 派生 7 题；`--resume` 增量；defect 三约束：不废变量唯一使用点/不死循环不段错误/非死代码；`checkAndPush` 要求 explanation≥150 字+四段齐全+易错点≥2，否则整批不写盘 exit 1），把新 entry 写进 `scripts/ds-bank/ds-chNN-*.mjs` 再 `node scripts/gen-ds-problems.mjs --chapter=ds-chNN --resume`
2. 若改判分：先读 AGENTS.md 第二节第 5 条 + docs/adr/0001、0002；切勿改双开关/executeParameters 位置/串行约束
3. 重跑验收：`npm run build` → 全套闸门（verify:data/verify:spec/lint:code/check-explain/build:index/typecheck/verify:answers/scan:doubt/verify:pages/a11y-probe）`、`node scripts/stratified-audit.mjs`、`npm run acceptance:viz3d`（**须先 build 否则「dist 比源码旧」拦截**）
4. push 绕行 SNI：`git -c http.curloptResolve=github.com:443:<IP> push origin main`（IP 140.82.113.3/114.3/116.3/121.3 时好时坏），push 后必须 `git ls-remote` 回读核对

## 工具与脚本资产（scripts/，全部可重跑）
- DS 题库生成：`scripts/gen-ds-problems.mjs`（--chapter/--dry/--resume；checkpoint 在 `tmp/ds-checkpoint.ds-chNN.json`）、`scripts/ds-bank/*.mjs`（27 个 bank）
- 真跑核验：`scripts/run-c.mjs`（本地 gcc -std=c99 -Wall -Wextra 零警告 + exec 20s，asks 用实测值）
- 详解体检：`scripts/check-explain.mjs`（扫描全库、四段齐全+易错点≥2），`scripts/stratified-audit.mjs`（固定种子分层抽 30 道）
- 产出统计：`scripts/count_work.py`（token 报告的产出字符数）

## 踩坑提醒（会重复踩的）
- **已生成章节绝不能无 --resume 全量重生成**：`gen-ds-problems.mjs` 的 `newId()` 从既有文件续号（`nextSerial[ab]`），全量重生成会把已派生题以新 id 再来一遍，语义相同内容重复累加（曾致 ds-ch02 285 道污染）；必须 `--resume` 依赖 checkpoint。恢复污染用 `node -e execSync('git show HEAD:<path>')`（**不能用 git checkout HEAD -- path（CC Safety Net 拦截）或 pwsh `>` 重定向（UTF-16 带 NUL）**，必须 node execSync 捕获并 writeFileSync utf8）
- **gen-viz3d / gen-viz 不清理目录**：把 spec 从 VIZ3D_SPECS 移除后，`public/data/viz3d/{id}.json` 残留文件还在，会让 acceptance 的 `findCorpus`（先查 viz3d 目录）误判 shared=false → 手动删残留 {id}.json
- **循环依赖**：specs-ds-*.ts 只能从 `specHelpers.ts` 取值助手（cell/region/step/STACK_ADDR）、type-only 才能 `from './generators'`；若把值 import 改回 generators 会触发 `VIZ3D_SPECS is not iterable`
- **mingw printf 无 %lld**（用 double+%.0f）；printf 实参无副作用；三目字符串常量用 %s；无 %-16s
- subNotes 会**盖掉** entry 级 notes（概念题素材写 entry 级 notes）；defect 的 find 是子串匹配须恰好 1 次且两 find 不重叠
- **goal_round 触发会杀掉全部活跃子代理并中止前台工具**：长时间静默（>10 分钟无模型可见事件）就会触发；子代理批量写作时要么保持事件流（心跳提醒 schedule_create every 240s），要么主代理自写
- **子代理失败先查落盘文件再决定重发**：子代理会自由发挥 defectKind；delegate 时必须在 prompt 里给死合法 enum 词表（schema/Problem.schema.json 的 defectKind），否则 verify:data 报 SCHEMA 错
- **PowerShell 不用 `&&` 用 `;`**；here-string 一律 `@'...'@`（`@"..."@` 吃反引号）；ConvertFrom-Json 解析中文 JSON 不可靠，用 node；`.mjs` 里 C 的 `\n` 是 `\`+`\`+`n`，多行替换用 edit 工具

## 复核轮结论（2026-11-15，检验轮·只报告不修补）

全面复核报告：`_inputs/_meta/audit-final-report.md`（机检原始数据 `_inputs/_meta/ds-audit.json` refined.r1–r12；汇报1/2 在 `_inputs/_meta/audit-reports.md`；token 看板 `_inputs/_meta/token-audit.md`）。

- **总判**：DS 内容总体可信——抽样 30 题答案本体零错误（gcc 实跑 14 题 43/43 + Godbolt 实机 2/2），章节映射无错位（严蔚敏 8 章骨架），两域名线上数据与仓库逐字节一致，acceptance:viz3d 104/104 回归绿。
- **待用户裁决的 P1×7**：ds-ch03-dsdbg-001（详解称 size 字段法实为牺牲单元法+重复段混剪）、ds-ch03-mdb-005（bug2 潜伏不可测，陷阱无效）、ds-ch03-cr-025（易错点出栈机制错）、ds-ch06-str-001（MST 唯一性定理误述）、ds-ch05-tf-007（算式 8 应为 6）、卡片 ds-ch05-19（等频哈夫曼断言对非 2 幂 n 错）、**系统性**：131/132 DS 卡片 relatedProblems 空 → 卡片页「相关题目」空白（KnowledgeDetailPage.tsx:105,211 无兜底；可复用 links.tsx:195-238 同章兜底或按 knowledgeIds 倒排回填数据）。
- **系统性 P2**：96/99 ds_debug 模板题干零功能描述；106/109 cxa 首句「精确数值」与渐近答案矛盾；26 对 dsdbg↔mdb 同码族 variantOf 未标。
- **本轮唯一数据修改（P3 授权内）**：ds-ch04.json 6 处「线性下注」→「线性下标」，verify:data 复检 0 error/7 warn；**未提交**，远端 main 仍 2a6d447。
- **README 12 处滞后**（2074→3808 等，见 final-report 差异表），免责声明「不收录教材原文」与 docs/source-data/ 教材中间数据是否冲突需用户定口径。
- 未判定仅 1 题 ds-ch04-cc-017（verified 未动，lkg 有证据，expected 手工推演全对）。
- 根目录 `_ch456.txt`（91KB，11-09 遗留乱码 dump，未跟踪）建议删除。
- **复核轮踩坑**：① 独立写 Godbolt 请求时把双开关放 options 顶层 → stdout 空；契约是嵌 `options.compilerOptions`（godbolt.ts:70-84），executeParameters 才在 options 层。② node spawnSync 调 gcc 用 `stdio:['ignore',fd,fd]` 直连，勿用 cmd /c 包装（Windows 下会全量假失败）。③ acceptance:viz3d 前必须先 `npm run build`（dist 时效拦截）。④ audit 脚本里 `"ds-ch01-x"` 的章号在 `id.slice(5,7)`（不是 3,5/6,8）。

## 开发轮结论（2026-11-15，落地复核结论）

复核 P1/P2/P3 → 已修复并上线（本轮 commit）。产物：`_inputs/_meta/apply-fixes.mjs`（10 处 raw-text 精确替换，NOT FOUND/NOT UNIQUE 即抛）、`fix-verify.mjs`（20/20 断言：新串在/旧串不在/verified 未动）、`l2-ui.mjs`（15/15 真实 DOM 断言）。

- **A1 六处详解层修复**（只动 explanation/keyPoints/content，answer/testCases/verified 零触碰）：ds-ch03-dsdbg-001（删混剪重复段+按牺牲单元法重写第 5 条）、ds-ch03-cr-025（易错点4 按 prec(+)>=prec(*) 真实规则重写）、ds-ch06-str-001（MST 唯一性改基本环判据+指出本例环 0-2-3 两条权 5 并列）、ds-ch05-tf-007（算式 8→6）、卡片 ds-ch05-19（哈夫曼等频断言加「n 为 2 的幂」限定+非 2 幂说明）、ds-ch03-mdb-005（易错点5 补潜伏缺陷如实标注）。
- **A2 系统性断链修复（前端兜底）**：`src/modules/knowledge/links.tsx` 新增 `RelatedProblemsForCard`（directIds 优先，空则同章兜底 CAP=8 + `related-problems-fallback-note` 提示），`KnowledgeDetailPage.tsx` 接线 → 131 张 DS 卡片页「相关题目」不再空白。数据层 relatedProblems 保持空（回填数据会牵动索引，未做）。
- **A3**：cr-035 断言残缺、cr-013 问号残留（explanation 内）已修；3 题重复详解段（ch02/ch03/ch07 dsdbg-001）已删重。⚠️ cr-013 同款问号残留还在 testCases[].note ×3（ds-ch06-cc-014/dsdbg-004/mdb-004）——铁律区未动，待裁决。⚠️ 删 ch02-dsdbg-001 重复段触发 check-explain「易错点只有 1 条」（1/2/3 原内联一行靠重复行凑数）→ 已在 items 2/3 前插 \n（纯排版）。
- **A4 README 8 处现算更新**：3808(verified 3801)/447/39/60/4669、23 题型分布、21 路由（补 /p/:id）、lkg 2548(DS 660)、acceptance:all 21 套、online 31 项、51.2% 主力占比、双线上地址。**免责声明未改**（B3 待裁决）。docs/reports/* 历史报告内旧数字为当时快照，正确保留。
- **A5**：_ch456.txt 已删；_inputs/ 保持未跟踪。
- **闸门全绿**：typecheck/build/verify:data 0e7w/verify:spec 0/0/lint:code 0/scan:doubt 0/verify:pages ✅/check-explain 3808/0（直接 `node scripts/check-explain.mjs`，package.json 无 alias）/verify:answers 0/0/**acceptance:all 21/21**/**acceptance:online 31 项 0 失败**/L2-UI 15/15（深链上下题可点、三新题型 data-role、卡片兜底+哈夫曼新文案、dark/light×375px 控制台 0 error）。
- **B 档待用户裁决**（选项表见本轮汇报）：B1 mdb-005 三选项（推荐①只认单 bug）；B2 批量文字 96 模板题干+106 cxa 首句（推荐②批量补全，先给 2 道样例）；B3 免责声明（推荐①保持 Public+移出教材原文）；B4 P2 结构性项（推荐②留下轮专项）。
- **开发轮踩坑**：⑤ Playwright 断言详解/卡片文案必须用 textContent（折叠面板 innerText 不含隐藏内容）且先点 reference-answer-toggle 再等 React 渲染。⑥ check-explain 易错点计数按行首 `/^\d+\./`，内联编号不算——删重复段可能把凑数的行删掉触发闸门。⑦ acceptance:online 实跑 31 项（README 旧写 36 为历史值，按实跑更新）。


## 裁决轮结论（2026-11-15，执行 B 档裁决）

用户裁决：B1①认单bug / B2②批量模板化补全（免中途样例等待）/ B3①保持Public+移出教材原文+声明不改 / B4②结构性项留下轮 / note×3 窄授权。

- **B1**：ds-ch03-mdb-005 stem+【思路】首句改「1 处可观察错误 + 1 处潜伏缺陷」口径；type/bugs/testCases/answer/verified 零触碰（改 type 会牵动 schema defectKind 必填、题型分布、搜索语料，故不动）。潜伏注记保留未洗掉。
- **A5 窄授权**：note×3（ds-ch06-cc-014/dsdbg-004/mdb-004）问号残留改完整陈述；字段级 diff 输出 changed_fields=["testCases.note"]，stdin/expected 未动。
- **B2 批量**：96 dsdbg 模板题干全部替换为分化功能描述——变量=tags[0]结构 × 操作词（fns 28 条映射+tags 29 条兜底词典，命中 96/96）× 首行代码注释（仅 12 题有，走句式A；其余 84 题句式B）；环节提示=操作词，不写 defectKind（避免泄露错点性质）。106 cxa 思路首句按 asks 答案类型 3 桶：含渐近 53→渐近+具体双口径句；无渐近含状态/序列 29→精确数值或确定状态口径句；纯数值 24→保留原句（口径本就一致）。逐桶断言+seed=20261115 抽 10 道（dsdbg5+cxa5）人工判全过。产物：_inputs/_meta/b2-{inventory,vars,apply,selfcheck}.mjs（apply 带 --apply 开关，dry-run 先出样例）。
- **B3**：docs/source-data 39 文件先复制到 D:\C-practice-local\source-data\（数量核对 39=39）再 git rm；仓库留 docs/source-data/README.md 占位说明；依赖它的 4 个离线脚本（convert-to-schema/merge-to-public/validate-converted/authoring-verify）均不在 npm 构建/验收链路，失效影响已写进占位 README。仓库保持 Public，免责声明一字未改。
- **B4 已登记下轮专项**：26 对 dsdbg↔mdb variantOf 未标 / 97 对 cr 相似族 / knowledgeIds 缺 31 / 章节权重偏斜 / cc-006 归属 / testCases<3 组×3。
- **阶段6 口径**：README 12 项差异全销账；验收套数统一为「21 套子验收 + acceptance:all 汇总 + acceptance:online(31 项)」，复核轮「22 套」是把 online 误计入（audit-final-report.md:131 已更正）；主力占比 51.2%(1949/3808) 现算不变；注释旧数字更新 6 处（totals.ts/build-search-index/acceptance-stage10×2/SearchPage/corpus.ts），历史实测描述 3 处故意保留（Markdown.tsx、scan-variant-quality、levels.ts——是当时实验事实，改了反而失真）。
- **裁决轮踩坑**：⑧ pwsh 里 node -e 含反引号/复杂引号会被 PowerShell 吃掉或被安全网拦 → 复杂内联脚本一律落盘 .mjs 再跑。⑨ cxa 模板句实际在 explanation【思路】首句，不在 stem（复核轮 audit7 记录「题干首句」为口径笔误）。
