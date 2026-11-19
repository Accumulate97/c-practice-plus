# README 口径销账（盘点轮 B3 · 2026-11-19）

三个历史数字是**各轮审计范围不同**所致，不互相矛盾，均为当轮如实记录；本轮以现算为准全部核销。

| 轮次 | 数字 | 出处 | 含义 |
|---|---|---|---|
| 复核轮 | 12 | docs/handover/next-session.md:79「README 12 项差异全销账」 | 当轮发现的 README 与现算差异 12 项，全部改 README 销账；同轮把「22 套」更正为「21 套子验收」（当时 online 被误计入子套件数） |
| 裁决轮 | 8 | _inputs/_meta/token-audit.md:28「README 8 处现算更新」 | 当轮改动涉及的 8 处数字更新（含全仓 grep 旧数字，残留仅历史报告） |
| 体验轮 | 14 | _inputs/_meta/readme-audit.mjs（commit 706f129） | 现算比对清单扩到 14 项；其中 1 项需改（验收套件数 21→22，因新增子套件 acceptance:blankstart-ui，非误计），其余 13 项一致 |

## 本轮现算核销结果（readme-audit.mjs，数字全部从 index.json / totals.json / package.json / acceptance-all.mjs 现算）

14/14 一致，README **无需改动**：

- 题目 3808 · verified 3801（盘点轮 probe 分片零字节变化，计数不变） · 卡片 447 · 2D 39 · 3D 60 · 语料 4669
- 验收套件 22（scripts/acceptance-all.mjs SUITES 现算） · 主力占比 51.2% · 题型 23 种及分布逐项 · 双域名在
- lkg 累计 2548 · DS 子集 660（本轮 judge probe 125/125 通过，lkg HEAD 2548 → 当前 2548，丢失 0）

## 口径说明（防下轮再误判）

1. 「验收套件数」= acceptance:all 的 SUITES 子套件数（当前 22），**不含** acceptance:online（31 项，单独闸门）。复核轮「22 是误计」的判断在当时正确（当时 SUITES=21）；体验轮新增 blankstart-ui 后 22 为实数。
2. lkg 核查方法：直接取报告顶层 `last_known_good` map 的键集比对（旧版树探测 heuristic 对 map 结构失效返回 0，readme-audit.mjs 已修）。
3. docs/reports/* 历史快照保留原样不改（其中的旧数字是当轮事实）。
4. 用户贴的 GitHub README 快照（commit 2a6d447）是旧版，与当前 HEAD（e8a74e4 之后）不一致属正常，勿照改。
