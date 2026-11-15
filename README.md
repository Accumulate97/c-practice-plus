# c-practice-plus · C 语言与数据结构学习平台

> **免责声明**：本项目为个人学习用途的开源项目，依据谭浩强《C程序设计》、严蔚敏《数据结构》等教材的**知识点体系**由 AI 生成题目、卡片与演示，并经人工校验。题目为非商业教学目的而编，`source` 字段如实注明出处；不收录任何教材原文或扫描页。教材版权归原作者所有，如涉及侵权请联系删除。

纯静态、可直接部署到 GitHub Pages 的 C 语言 + 数据结构在线学习平台。三大板块联动：📖 学（知识卡片）→ 🎬 懂（可视化演示）→ ✍️ 练（在线判分刷题），通过 `knowledgeIds` / `vizIds` / `relatedProblems` 双向关联。

- **线上访问**：https://c-practice.xyz （镜像：https://accumulate97.github.io/c-practice-plus/）
- **仓库**：https://github.com/Accumulate97/c-practice-plus （分支 `main`）

---

## 一、内容规模

| 语料 | 数量 |
|---|---|
| 题目 | 3808（verified 3801） |
| 知识卡片 | 447 |
| 2D 可视化演示 | 39 |
| 3D 可视化演示 | 60（catalog，含 21 个原生 3D spec） |
| 错误博物馆展品 | 10 |
| 速查手册条目 | 293 |
| 搜索语料 | 4669 |

题型（23 种）：`code_reading` 890、`single_choice` 664、`code_completion` 545、`algorithm_impl` 330、`fill_blank` 261、`multi_bug_debug` 199、`programming` 162、`complexity_analysis` 109、`ds_debug` 99、`pointer_trace` 65、`true_false` 63、`term_explanation` 56、`debug` 54、`multi_blank` 47、`timed_impl` 43、`api_drill` 43、`code_optimization` 39、`stdlib_reimpl` 38、`essay_answer` 33、`code_review` 33、`short_answer` 23、`complexity` 9、`structure_trace` 3。

## 二、技术栈

- **框架**：Vite + React + TypeScript
- **编辑器**：CodeMirror 6
- **可视化**：SVG + React（2D），three.js（3D，路由级懒加载）
- **编译判分**：Compiler Explorer（Godbolt）公共 API，浏览器直连
- **搜索**：MiniSearch（纯前端）
- **路由**：HashRouter（`base='./'`），纯静态无后端，进度存 `localStorage`

## 三、功能路由（21 条）

`/` 首页 · `/problems` 题库 · `/problems/p/:id` 做题页 · `/p/:id` 深链别名 · `/knowledge` 知识列表 · `/knowledge/:id` 卡片详情 · `/viz` 2D 演示 · `/viz/:demoId` 播放页 · `/viz/compare` 对比 · `/viz3d` 3D 馆 · `/viz3d/:demoId` · `/path` 学习路径 · `/playground` 代码游乐场 · `/cheatsheet` 速查手册 · `/bugs` 错误博物馆 · `/review` 错题重练 · `/search` 全站搜索 · `/progress` 学习进度 · `/judge-lab` 判分实验台 · `/errata` 勘误 · `*` 404。

## 四、判分与验证

- **Godbolt 契约**：`POST https://godbolt.org/api/compiler/cg132/compile`（免 Key），编译参数 `-std=c99 -Wall -Wextra`；取运行时 stdout 必须同时给 `executorRequest: true` 与 `filters.execute: true`（双执行开关）；多组测试用例**严格串行**（`maxConcurrency: 2` + FIFO 队列 + `minIntervalMs: 100`），软超时 25 s。
- **三级容灾**：`cg132 → cg142 → cg131`，仅对可重试的传输层错误换级；三级全挂才降级为读构建期预存 stdout 自评（不计正确率、不置 `verified`、绝不伪造通过）。开关 `VITE_JUDGE_FAILOVER=off` 可关闭。
- **verified 纪律**：只能由 `npm run judge:verify` 实机编译+执行+比对后置位，**禁止手工置 true**；证据存 `public/data/problems/verification-report.json`（`last_known_good` 累计 2548 道，其中 DS 代码题 660 道；后端抖动 = 未判定，`last_known_good` 只增不减）。

## 五、目录结构

```
├── public/data/        # 题目/卡片/演示/搜索语料（按章节分片 + index.json，懒加载）
├── src/                # 前端源码（pages / judge / modules / components / styles）
├── scripts/            # 数据闸门与验收脚本（verify、judge:verify、scan、acceptance）
├── schema/             # Problem / Knowledge JSON Schema
├── docs/
│   ├── specs/          # 规范文档（00-08 任务书/大纲/题型/变式/演示/知识点）
│   ├── adr/            # 架构决策记录（judge 后端、容灾）
│   ├── reports/        # 阶段验收与质量报告
│   ├── archive/        # 一次性过程文档
│   ├── handover/       # 交接说明
│   └── source-data/    # 教材转换中间数据（版权敏感，仅离线脚本消费）
└── AGENTS.md           # 项目铁律与 Godbolt 契约
```

## 六、本地开发与验证

```bash
npm ci
npm run dev            # 开发服务器
npm run build          # 构建到 dist/
npm run typecheck      # TS 类型检查
npm run verify:data    # 数据闸门（题量/章节/verified）
npm run scan:doubt     # 存疑标记残留扫描
npm run judge:verify   # Godbolt 实机判分验证（写 verification-report.json）
npm run acceptance:all # 21 套 Playwright UI 验收
npm run acceptance:online   # 线上抽样真判
```

## 七、验收情况

`acceptance:all` 21/21、`acceptance:online` 31 项 0 失败、`verify:data` error 0（warn 7 为 C 库历史遗留 7 道未实机验证的 code_reading）、`scan:doubt` 表面文本 0 残留、`a11y:probe` 23 页 × 2 主题 + 375px 窄屏 0 问题。

## 八、说明

- 主力题型（填空/改错/阅读/编程，含 DS 新增的 `ds_debug` / `multi_bug_debug`）合计占比约 51.2%，低于 AGENTS.md 的 80% 目标，这一比例为**主动保留**的取舍（详见 `docs/reports/网站完成报告.md` 第八节），不再追高。
- 部署由 `.github/workflows/deploy.yml` 在 push `main` 后自动触发（typecheck → build → verify:pages → verify:data → 上传 Pages）。
- 完整交接信息见 `docs/handover/next-session.md`。
