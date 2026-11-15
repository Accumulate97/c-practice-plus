# 原始素材仅本地留存

本目录原存放教材转换的中间数据与原始素材（OCR 文本、扫描转录等）。
因版权敏感，自 2026-11-15 起**不再随仓库分发**，仅在维护者本地留存
（本地路径：`D:\C-practice-local\source-data\`）。

- 提炼改造后的产物（题目 JSON、知识卡片、章节内容）已全部进入
  `public/data/`，不受影响。
- 依赖本目录的离线脚本（`scripts/convert-to-schema.mjs`、
  `scripts/merge-to-public.mjs`、`scripts/validate-converted.mjs`、
  `scripts/authoring-verify.ts`）均为 C 库时代的历史 authoring 工具，
  不在 `npm run` 构建/验收链路中；如需重跑，请把本地素材目录
  复制回本路径后再执行。
