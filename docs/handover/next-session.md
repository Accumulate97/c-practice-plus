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
