# token 用量报告（代理指标）

> 精确 API token 由客户端统计，本表用**工作量代理指标**衡量「省 token」效果。
> 两个核心目标：**回读次数 = 0（抽检除外）**、**脚本替代推理比例最大化**。
> 产出字符数由 `scripts\count_work.py` 统计（不让 agent 自数）；回读次数 = 落盘后为「确认内容」而再次 read 该文件的次数（质量抽检、闸门排错不计入）。

| 阶段 | 执行方式（脚本/推理） | 推理批次 | 产出字符数 | 回读次数 | 跳过重跑 | 累计备注 |
|---|---|---|---|---|---|---|
| 阶段0 依赖自检 | 脚本探测为主（pwsh 探测命令 + node 现算规模），推理仅用于判定 | 约 40 | env-check.md 6.0K + ocr_book.py 9.6K + count_work.py 1.2K ≈ 16.8K | 3（chapter-map.md、Knowledge.schema.json、ds-ch01.json 首卡；均为「必须知道格式才能产出」的一次性读取） | 是（未跑 `npm ci`，改 `typecheck` 验基线；避免 SNI 网络下删掉 node_modules 装不回来） | tesseract 走 7-Zip 解包 NSIS 安装器成功，未触发硬停 |
| 阶段1 PDF→md | **全脚本**（`scripts\ocr_book.py` 串行 321 页 → `--split` 复用页文件重切分 → `scripts\spotcheck-ocr.py` 抽检） | 约 12（tesseract 便携化、章首 offset 锚定、附录正则容错、抽检脚本；**OCR 转写本身 0**） | 913,735（ds_book 435,050 + 总稿 442,252 + 6 个脚本 28,297 + _meta 8,136） | 1（交付核对读 `ds_book\index.md` + `convert-stats.json`，属抽检） | 是（OCR 一次跑成 1002 s 未重跑；切分修正走 `--split` 直接复用 321 个已存页文件，**0 次重新 OCR**） | 对比基线：逐页读图手写 md 需 ≈**321** 推理批次 → 实际 OCR 批次 **0**；321/321 页成功、0 失败 |

## 省法对照（不省 token 的做法 vs 本轮做法）

| 环节 | 不省 token 的做法 | 本轮做法 | 推理批次 |
|---|---|---|---|
| 321 页 PDF→md | 每页 `read_image` + 模型转写 | `ocr_book.py` 一次性脚本跑完，断点续跑 | 321 → **0** |
| 章节切分 | 模型读全书找章首 | `detect_chapters()` 正则 + 目录页排除 + offset 自校验 | ~11 → **0** |
| 代码损伤标记 | 模型逐段判断 | `mark_code_blocks()` 启发式粗标记 | ~200 → **0** |
| 产出统计 | agent 自己数 | `count_work.py` | — → **0** |
| 抽检 30 道 | 人工逐道推理题面 | 固定种子分层抽样脚本 + 真实渲染断言 | 待填 |
