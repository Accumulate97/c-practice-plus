# 第三方组件与许可声明（THIRD-PARTY-NOTICES）

本文件列出 c-practice-plus 使用的第三方代码及其许可。任务07 §四·4.2 要求新增本文件；
新增依赖或 vendor 代码时必须同步更新（AGENTS.md 红线：不得引入需要服务端运行时的方案，
以下全部为构建期/纯前端依赖）。

---

## 1. Animate.css（vendor 子集，手工转写）

- **用途**：答题反馈、页面切换、吉祥物等轻量动效的 12 个关键帧
  （fadeIn / fadeInUp / fadeInDown / fadeInLeft / fadeInRight / zoomIn /
  bounceIn / pulse / shakeX / heartBeat / tada / flipInX）与时长/延迟/重复工具类。
- **位置**：`src/styles/vendor/animate-subset.css`（≤5KB，手工转写子集，非整包拷贝）
- **来源**：Animate.css v4.1.1 — https://animate.style · https://github.com/animate-css/animate.css
- **许可**：Hippocratic License 2.1（https://firstdonoharm.dev/version/2_1/license.html）。
  允许自由使用、复制、修改、再分发；要求随附许可与版权声明，本文件与源文件头均已注明。
- **改动说明**：fades 系列位移量由原版的 100%（元素自身尺寸）调整为 24px，
  更适合站内小面积 UI 反馈；shakeX 幅度由 10px 调整为 8px。其余语义与原版一致。

## 2. npm 依赖（构建期打包进产物或仅开发期使用）

| 包 | 用途 | 许可 |
|---|---|---|
| react / react-dom | UI 框架 | MIT |
| react-router-dom | 客户端路由（HashRouter） | MIT |
| @codemirror/* (state/view/lang-cpp 等) | 代码编辑器与空位槽 | MIT |
| three | 3D 馆场景渲染（路由级 lazy，不进首屏包） | MIT |
| zustand | 进度/设置状态 + persist 到 localStorage | MIT |
| tailwindcss / @tailwindcss/vite | 原子类 CSS 框架（构建期） | MIT |
| vite / @vitejs/plugin-react | 构建工具（构建期，不进产物） | MIT |
| typescript | 类型检查（构建期） | Apache-2.0 |
| playwright-core | 验收脚本驱动本机 Chrome（开发期，不进产物） | Apache-2.0 |
| clang-format | 全库代码格式化脚本 scripts/format-code.mjs（开发期，不进产物） | Apache-2.0 with LLVM exception |

完整许可文本随各 npm 包分发于 `node_modules/<pkg>/LICENSE*`，构建产物不重分发其源码文本。

## 3. 编译器与判分服务（外部服务，非代码依赖）

- **Compiler Explorer（Godbolt）公共 API** — https://godbolt.org
  浏览器直连执行学生代码；仅传代码与编译参数，不传任何用户身份信息。
  服务条款见 https://godbolt.org/api/compilers.html 与其仓库
  https://github.com/compiler-explorer/compiler-explorer（BSD-2-Clause）。

## 4. 字体与图标

- 全站使用系统字体栈（system-ui / Segoe UI / Microsoft YaHei / ui-monospace 等），不内嵌、不分发任何字体文件。
- favicon 与吉祥物「C 灵」为本项目原创自绘 SVG（`public/favicon.svg`、`src/components/common/Mascot.tsx`），
  未使用任何版权 IP 形象；随仓库同许可开源。

## 5. 内容来源声明

题目依据教材**知识点体系**变式生成，`source` 字段如实注明出处；不收录教材原文或扫描页。
详见 README.md 免责声明与 `docs/specs/03-original-problems.md` 的风格参考约定。
