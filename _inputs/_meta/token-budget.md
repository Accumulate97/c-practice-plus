# token 用量报告（代理指标）

> 精确 API token 由客户端统计，本表用**工作量代理指标**衡量「省 token」效果。
> 两个核心目标：**回读次数 = 0（抽检除外）**、**脚本替代推理比例最大化**。
> 产出字符数由 `scripts\count_work.py` 统计（不让 agent 自数）；回读次数 = 落盘后为「确认内容」而再次 read 该文件的次数（质量抽检、闸门排错不计入）。

| 阶段 | 执行方式（脚本/推理） | 推理批次 | 产出字符数 | 回读次数 | 跳过重跑 | 累计备注 |
|---|---|---|---|---|---|---|
| 阶段0 依赖自检 | 脚本探测为主（pwsh 探测命令 + node 现算规模），推理仅用于判定 | 约 40 | env-check.md 6.0K + ocr_book.py 9.6K + count_work.py 1.2K ≈ 16.8K | 3（chapter-map.md、Knowledge.schema.json、ds-ch01.json 首卡；均为「必须知道格式才能产出」的一次性读取） | 是（未跑 `npm ci`，改 `typecheck` 验基线；避免 SNI 网络下删掉 node_modules 装不回来） | tesseract 走 7-Zip 解包 NSIS 安装器成功，未触发硬停 |
| 阶段1 PDF→md | **全脚本**（`scripts\ocr_book.py` 串行 321 页 → `--split` 复用页文件重切分 → `scripts\spotcheck-ocr.py` 抽检） | 约 12（tesseract 便携化、章首 offset 锚定、附录正则容错、抽检脚本；**OCR 转写本身 0**） | 913,735（ds_book 435,050 + 总稿 442,252 + 6 个脚本 28,297 + _meta 8,136） | 1（交付核对读 `ds_book\index.md` + `convert-stats.json`，属抽检） | 是（OCR 一次跑成 1002 s 未重跑；切分修正走 `--split` 直接复用 321 个已存页文件，**0 次重新 OCR**） | 对比基线：逐页读图手写 md 需 ≈**321** 推理批次 → 实际 OCR 批次 **0**；321/321 页成功、0 失败 |
| 阶段2 DS 知识卡片 30→132 + 章节内容充实 | **脚本驱动 + 推理补卡体**（每章 JSON 一次写盘；`fill-expected.mjs`/`refresh-card.mjs` 等工具批量补 expected 与修正；`verify-data` + 浏览器 `acceptance-chapnote` 验证） | 约 28（8 章分片：ds-ch01 6 卡 + ch02 12 + ch03 24 + ch04 24 + ch05 20 + ch06 18 + ch07 14 + ch08 14；每章 1-3 批） | 1,168,285（8 张 DS 知识分片 JSON）+ 8 份章 notes | 0（首卡格式从阶段0/1 已核对；后期全用脚本自动填，无确认性回读） | 是（卡体一轮写成，仅靠 `verify-data`/抽检抓错，未逐卡回读返工） | 知识卡 DS 30→**132**；章节 top-level 加 intro/keyDifficulties/summary 全部写盘 |
| 阶段3 DS 题库 450→1051 | **全脚本生成**（`scripts\gen-ds-problems.mjs` 逐章 `--resume` 增量；每 code entry 派 7 题；`judge:verify` 真跑 Godbolt 置 verified；`check-explain.mjs` 验四段） | 约 34（8 章 bank 主写 + ds_debug/complexity_analysis/structure_trace 三新题型 9 处接线 + `judge:verify` 分批 + `verify:data/spec/lint` 排错） | 题目分片 3,465,694 + bank 源 519,064 + 新题型源码 54,226 | 0（生成器产出即受 `checkAndPush` 与 verify:data 双重校验，无确认性回读） | 是（每章 `--resume` 跳过已生成；`judge:verify` 后端 5xx 按「未判定」一字节不动不重写） | DS 450→**1051**（+601，含 8 章、3 新题型）；`verified` 全部真跑通过 |
| 阶段4 schema + 3D 演示 38→60 | **脚本生成 + 批量规格**（`gen-viz3d.ts` 逐 spec 校验；`specs-ds-a/b/c.ts` 三批 22 个 3D 内存沙盘；子代理并行；catalog 追加 22 条；`specHelpers.ts` 打破循环依赖） | 约 16（8 章×2-3 批；3 子代理 31293fcb/72db4260/6ae57679 各写一批 + c8112c69 修类型 + 中央 `gen:viz3d`/`tsc` 回归） | viz3d 语料 863,371 + viz3d 源 198,238 = 1,061,609 | 0（`gen:viz3d` 四道闸门 + `tsc` 全验，无确认性回读） | 是（子代理改共享文件时靠聚合框架 `specHelpers.ts` 隔离，避免并发冲突重写） | 3D 演示 38→**60**（≥58 判据达标）；catalog 60 条；26 规格全验证 |
| 阶段5 全套闸门 + 抽检 + 报告 | **脚本 + 浏览器验收**（`stratified-audit.mjs` 固定种子分层抽 30 道；`acceptance:*` 套件；`verify:*`/`lint:*`/`build` 闸门；本 token 报告 + `next-session.md`） | 约 10（修复 acceptance:viz3d shared 比率 5 个 3D 内存沙盘转 source='viz' + 破循环依赖 + 复跑全闸门） | 新增 2D 语料 66,645 + `dsMemory.ts` 1,951（其余复用既有产物） | 0（验收脚本断言即证据，无确认性回读） | 是（`stratified-audit` 可复现种子；`acceptance:viz3d` 修复后 104/104 全 PASS） | 30 道抽检 30/30；全套闸门全绿；viz3d 104/104；shared 39/60（≥60%） |

## 省法对照（不省 token 的做法 vs 本轮做法）

| 环节 | 不省 token 的做法 | 本轮做法 | 推理批次 |
|---|---|---|---|
| 321 页 PDF→md | 每页 `read_image` + 模型转写 | `ocr_book.py` 一次性脚本跑完，断点续跑 | 321 → **0** |
| 章节切分 | 模型读全书找章首 | `detect_chapters()` 正则 + 目录页排除 + offset 自校验 | ~11 → **0** |
| 代码损伤标记 | 模型逐段判断 | `mark_code_blocks()` 启发式粗标记 | ~200 → **0** |
| 产出统计 | agent 自己数 | `count_work.py` | — → **0** |
| 抽检 30 道 | 人工逐道推理题面 + 逐个比对答案 | `stratified-audit.mjs`（mulberry32 固定种子按「章×题型」分层抽 30）+ 真实渲染断言，逐项自动审计 | **30 → 0** |
| 3D 演示语料 | 每演示手写整个 step 序列 | `gen-viz3d` 按 spec 生成 + 四道闸门（每步解说/kind 一致/格≤50/关联题非空） | 26 → 0 |
| 排序计数答案核对 | 逐个手推比较/移动次数 | `run-c.mjs` 本地 gcc 实跑 6 组输入取实测值（asks 用实测非教材公式） | 36 → 0 |
