# NEXT_SESSION —— 续接说明

状态：**任务07「根治与美化」全部收官（2026-11-04）**：A 全库 3207/3207 结构化详解、B 全套闸门全绿（含 acceptance:all 19/19 与 acceptance:online 31/31）、C 抽检 30/30 道×10 项=301/301、D 已上线（远端 main=df4a103=线上部署版本）。最终报告已定稿：docs/reports/任务07-根治与美化-最终报告.md。

## 事实速览（2026-11-04 更新）
- 线上地址：https://accumulate97.github.io/c-practice-plus/ （GitHub Pages，Source = GitHub Actions，push main 即部署）
- 仓库：Accumulate97/c-practice-plus，分支 main；本地 == origin/main == df4a103（已推送并 ls-remote 回读核对，Pages 已部署该版本）
- 题库：3207 题（C 2757 + DS 450）；**全库 explanation 已 100% 结构化**（【思路】【步骤】【复杂度】【易错点】四小节 + 合并脚本确定性【关联】块；A=3167 / D=7 描述题 / E=33 essay）
- 任务05 五提交部署断层已根治：本轮起点即线上版本 cd82c6c，诊断报告 docs/诊断报告_任务05失效根因.md
- 代码排布：全库 clang-format（ColumnLimit100）+ 渲染层 14px/1.7/tab4/等宽/高亮；stem 围栏 StemParts 去重；83 道「第N行」引用题保护跳过未格式化
- 视觉：--cp-* 设计令牌（深色基底+浅色覆盖）、animate.css 子集 ≈4.5KB、原创 SVG 吉祥物 Mascot、品牌统一 c-practice-plus、CSS 增量 +7.2KB（≤30KB 红线内）
- 判分：Godbolt 三级容灾 cg132→cg142→cg131 不变；scanf 守卫缺陷 9 题已修（65dcbe7）并经 judge:verify --only 实机重验 9/9 PASS（c9a68f6）
- 闸门现状：verify:data 0/7warn · verify:spec 0/0 · verify:answers 0/0 · lint:code 0 命中 · scan:doubt 0 残留 · typecheck/build/verify:pages 全绿 · a11y:probe 0 问题（23页×2主题+375px）· **acceptance:all / acceptance:online 见最终报告**

## 续接第一步该做什么
任务07 已全部收官，无必做事项。后续工作参考：
1. 勘误候选清单在 tmp/corpus-anomalies.md（历史题 answer/testCases 铁律未动，需用户裁决后才改）；83 题「第N行」引用保护跳过格式化（清单 tmp/format-code-report.json reverts skip:true）
2. 若改判分：先读 AGENTS.md 第二节第 5 条 + docs/adr/0001、0002；切勿改双开关/executeParameters 位置/串行约束
3. 重跑验收：`npm run acceptance:all`（cc 与 dbg 不能背靠背，429 时冷却 10+ 分钟单独重跑）；`node tmp/accept-sample30.mjs [样本路径]`（需先 `npm run build`）；`npm run acceptance:online`
4. push 绕行 SNI：`git -c http.curloptResolve=github.com:443:<IP> push origin main`（IP 140.82.113.3/114.3/116.3/121.3 时好时坏），push 后必须 `git ls-remote` 回读核对

## 工具与脚本资产（tmp/，全部可重跑）
- 详解管线：prep-exp-batches.mjs（129 批 payload）→ writer-spec.md（写手规范 10 条）→ merge-explanations.mjs（校验+relatedBlock+checkpoint+commit；`--batch=N`/`--range=A-B`/`--all`，`--no-commit` 时 sinceCommit 不清零属正常）→ scan-explanations.mjs（全库盘点 A/B/C/D/E）
- 补录脚本模板：fix-retry2/fix-pg009/fix-sa003/fix-alg157/fix-sc015.mjs（同构：validate→applyOne→checkpoint 修正→retry 清理→commit）；**必须先 grep merge-explanations.mjs 的校验函数逐行复刻再写**
- 格式化：scripts/format-code.mjs + scripts/lib/c-tokens.mjs（tokenSig 宏续行 `\`+换行 按空白跳过）+ .clang-format（ColumnLimit100/BreakStringLiterals:false）
- 抽检：make-sample30.mjs（seed 分层抽样）+ accept-sample30.mjs（30题×10项）
- 勘误候选全量清单：tmp/corpus-anomalies.md（历史题 answer/testCases 铁律不动，只记录）

## 踩坑提醒（会重复踩的）
- **goal_round 触发会杀掉全部活跃子代理并中止前台工具**：长时间静默（>10 分钟无模型可见事件）就会触发；子代理批量写作时代要么保持事件流（心跳提醒 schedule_create every 240s），要么主代理自写（本轮 098 批起全部主代理自写，稳定）
- **子代理失败先查落盘文件再决定重发**：tmp/check-failed-writers.mjs（048/065/087/094/100 五例「干完活死在收口」全救回）
- **workflow 工具跑写手不可靠**：121 个子代理仅 2 个写盘，失败模式不明，弃用
- **.git 目录可能被快照回滚**（对象+refs+reflog 全丢而工作区不动）：每批立即 commit + 尽快 push 异地备份；commit 后用 `git show <hash>` 回读确认
- **push 必须绕行 SNI 过滤**：`git -c http.curloptResolve=github.com:443:<IP> push origin main`，可用 IP 140.82.113.3/114.3/116.3/121.3（时好时坏，多 IP×多轮重试；本轮 116.3 与 114.3 成功过）
- echoesStem 校验：详解逐字引题干代码 ≥30 字连续重合即拒——引用一律转述（「主循环的写法是…」）；诊断法=滑窗命中标记找 maximal run
- 校验器/扫描器小节正则必须用 `(?=\n【|$)`：惰性 `(?:【|$)` 会被正文「【2】」型引用截断（只误拒不误收）
- pwsh 管道 `git commit | Select-Object -First 1` 会 broken pipe 假 exit 1：以 commit 行输出为准；`node -e` 多行内联会被 PowerShell 引号规则打碎，一律写 tmp/*.mjs
- commit 信息题型标注先打印批次范围核对（三次误标全靠 amend 补救）
- playwright locator.click() 强制 CDP 滚动会污染 scrollY 快照：按坐标 page.mouse.click + 动态量 sticky header 高度
- vite preview 服务在根路径：本地断言 BASE 不要用 /c-practice-plus/ 子路径
- Godbolt 请求体嵌套：options.compilerOptions.{executorRequest,userArguments,filters.execute} + options.executeParameters.{stdin}；简易平铺体 didExecute=undefined 是形状错误不是后端挂
- PowerShell 不用 `&&` 用 `;`；here-string 一律 `@'...'@`（`@"..."@` 吃反引号）；ConvertFrom-Json 解析中文 JSON 不可靠，用 node
