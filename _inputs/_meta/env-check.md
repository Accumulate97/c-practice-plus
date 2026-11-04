# 阶段0 依赖自检报告（env-check）

> 生成时间 2026-11-04 · 目录口径：任务书写 `_input`，仓库实际为 **`_inputs`**，本报告与所有产出均落在 `_inputs\`。

## 一、依赖与环境

| 项 | 结论 | 版本 / 路径 | 备注 |
|---|---|---|---|
| python | ✅ 已有 | 3.11.2 · `D:\python3.11` | — |
| pymupdf | ✅ 已有 | 2.1（MuPDF 1.28.6） | `import pymupdf` 可用；`import fitz` 亦可但报弃用告警 |
| tesseract | 🔧 **补装成功** | v5.4.0.20240606 · `D:\C-practice\_tools\tess\tesseract.exe` | 见「二、tesseract 获取路径」 |
| chi_sim / eng 语言包 | 🔧 **补装成功** | `_tools\tessdata\chi_sim.traineddata` 2.35 MB（tessdata_fast）、`eng` 3.92 MB，已复制进 `_tools\tess\tessdata\` | `--list-langs` = chi_sim / eng / osd |
| rapidocr-onnxruntime | 🔧 已装（**未使用**） | 1.4.4 + onnxruntime 1.31.1 + opencv-python 5.0.0.93 | 纯 pip 用户级安装，仅作 tesseract 失效兜底；不触发「新增 npm 运行时依赖」硬停 |
| gcc | ✅ 已有 | `D:\mingw\mingw64\bin\gcc.exe` | 供阶段2/3 代码 0 警告校验 |
| node / npm | ✅ 已有 | v24.19.0 / 11.17.0 | — |
| `npm ci` | ⚠️ **偏离** → 改跑 `npm run typecheck` | EXIT=0 | node_modules 已存在且 package-lock 未变；本机 GitHub 被 SNI 过滤，`npm ci` 会先删 node_modules，有「删了装不回来」的风险，故以 typecheck 验证基线可用 |
| 教材 PDF | ✅ 定位 | `_inputs\数据结构 使用C语言 第5版 (朱战立编著).pdf` · 68.0 MB · **321 页** | `get_text()` 长度 0、`get_images()` 长度 1 → 确认扫描件（符合任务书预期） |
| 7-Zip | ✅ 已有（不在 PATH） | `C:\Program Files\7-Zip\7z.exe` | 用于无交互解包 NSIS 安装器 |
| winget / choco / scoop | winget v1.29.380 有；choco、scoop、make 缺 | — | winget 下载源指向 GitHub，被 SNI 阻断，不可用 |

## 二、tesseract 获取路径（4 次失败后成功，留痕）

| # | 尝试 | 结果 |
|---|---|---|
| 1 | `winget install --id UB-Mannheim.TesseractOCR -e --silent` | ❌ 后台挂起 >10 min 无下载进程 → kill |
| 2 | winget 前台重试（找到 5.4.0.20240606） | ❌ 从 `github.com/UB-Mannheim/...` 下载，临时文件 **0 字节停滞 8 min**（GitHub SNI 过滤）→ kill |
| 3 | 官方站 `digi.bib.uni-mannheim.de/tesseract/*.exe`（3 个 URL，带浏览器 UA+Referer） | ❌ 全部 **HTTP 403 已禁止** |
| 4 | **`https://ghproxy.net/https://github.com/UB-Mannheim/tesseract/releases/download/v5.4.0.20240606/tesseract-ocr-w64-setup-5.4.0.20240606.exe`** | ✅ 47.85 MB / 494 s |
| 5 | 静默安装 `/VERYSILENT /LANG=English /DIR=用户目录` | ❌ 卡在 GUI「Installer Language」对话框，无人可点 → kill |
| 6 | innoextract 1.9 解包 | ❌ `Not a supported Inno Setup installer!`（该安装器是 **NSIS**，非 Inno Setup） |
| 7 | **`7z x` 解包 NSIS 安装器** | ✅ 139 文件 / 249 MB 解出到 `_tools\tess\`，`tesseract.exe --version` 正常，57 个 DLL 齐全 → 便携可用，无需管理员、不写注册表 |

## 三、基线闸门（改动前，全绿）

| 闸门 | 结果 |
|---|---|
| `verify:data` | 题目总数 **3207** · error **0** · warn **7** |
| `verify:spec` | error **0** · warn **0**（检查范围 1106 / 3207，默认仅新增题） |
| `lint:code` | 扫描代码段 3382 处 · **0 命中** |
| `scan:doubt` | 表面文本 **0 处 / 0 题**；元信息知情注记 156 处 / 69 题（设计内保留） |
| `typecheck` | EXIT **0** |

> 7 条 warn 全为历史 C 代码阅读题 `[NOT-VERIFIED]`：c-ch03-cr-017、c-ch03-cr-018、c-ch04-cr-004、c-ch04-cr-011、c-ch04-cr-012、c-ch06-cr-109、c-ch11-cr-016。**非本轮引入，不修。**

## 四、现有规模（node 现算，无写死常量）

| 资产 | 现状 | 目标 |
|---|---|---|
| 全库题目 | 3207（C 2757 / DS **450**，DS 全部 verified） | DS ≥1050（新增 ≥600） |
| DS 题分片 | ch01:30 ch02:70 ch03:60 ch04:40 ch05:80 ch06:60 ch07:50 ch08:60 | — |
| 知识卡片 | C 315 / DS **30**（ch01:4 ch02:4 ch03:4 ch04:3 ch05:4 ch06:4 ch07:3 ch08:4） | DS ≥120（本轮配额 ≥132） |
| 2D 演示 | 34（`public/data/viz/index.json`） | 不动 |
| 3D 演示 | **38**（`src/modules/viz3d/catalog.ts`；其中仅 4 个数据驱动 demo） | ≥58（新增 ≥20） |
| 三种新题型 | `ds_debug` / `complexity_analysis` / `structure_trace` 当前 **均为 0** | 需全新落地 schema+判分+渲染+验收 |

## 五、⚠️ 关键发现：网站 DS 章节是 **8 章**（严蔚敏骨架），不是教材 11 章

`docs\chapter-map.md` 是**全站章节编号唯一真源**，`scripts/verify-data.ts` 解析其末尾 ```json 机器可读块，强制三向一致：**id 前缀 `ds-chNN-` ↔ `chapter` 字符串 ↔ 分片文件名 `ds-chNN.json`**。任务书按教材 11 章给配额，必须映射到网站 8 章后执行，**且不新增网站章节、不改章节目录**。

| 网站章 id | `chapter` 字段（须逐字相同，不含 ★标注） | 分片 | 现有题 | 现有卡 |
|---|---|---|---|---|
| ds-ch01 | `第1章 绪论` | ds-ch01.json | 30 | 4 |
| ds-ch02 | `第2章 线性表` | ds-ch02.json | 70 | 4 |
| ds-ch03 | `第3章 栈和队列` | ds-ch03.json | 60 | 4 |
| ds-ch04 | `第4章 串、数组和广义表` | ds-ch04.json | 40 | 3 |
| ds-ch05 | `第5章 树和二叉树` | ds-ch05.json | 80 | 4 |
| ds-ch06 | `第6章 图` | ds-ch06.json | 60 | 4 |
| ds-ch07 | `第7章 查找` | ds-ch07.json | 50 | 3 |
| ds-ch08 | `第8章 排序` | ds-ch08.json | 60 | 4 |

### 教材 11 章 → 网站 8 章映射（据 chapter-map「主要考点」列判定）

| 教材章 | 教材章名 | → 网站章 | 判定依据 |
|---|---|---|---|
| ch01 | 绪论 | ds-ch01 | 数据结构概念/算法分析 |
| ch02 | 线性表 | ds-ch02 | 顺序表/链表 |
| ch03 | 堆栈和队列 | ds-ch03 | 栈/队列 |
| ch04 | 串 | ds-ch04 | chapter-map ds-ch04 含「串」 |
| ch05 | 数组 | ds-ch04 | chapter-map ds-ch04 章名即含「数组」 |
| ch06 | 递归算法 | **ds-ch03** | chapter-map 把「递归」列在 ds-ch03 主要考点（递归依赖运行时栈） |
| ch07 | 广义表 | ds-ch04 | chapter-map ds-ch04 含「广义表」 |
| ch08 | 树和二叉树 | ds-ch05 | 树 |
| ch09 | 图 | ds-ch06 | 图 |
| ch10 | 排序 | **ds-ch08** | 网站第8章是排序 |
| ch11 | 查找 | **ds-ch07** | 网站第7章是查找（**与教材章号顺序相反，勿弄错**） |

### 映射后的网站章配额（本轮新增下限）

| 网站章 | 新增题 ≥ | 教材来源 | 新增卡 ≥ | 教材来源 |
|---|---|---|---|---|
| ds-ch01 | 25 | 书ch01 | 6 | 书ch01 |
| ds-ch02 | 70 | 书ch02 | 12 | 书ch02 |
| ds-ch03 | 105 | 书ch03(65)+书ch06(40) | 24 | 书ch03(14)+书ch06(10) |
| ds-ch04 | 115 | 书ch04(45)+ch05(40)+ch07(30) | 24 | 书ch04(8)+ch05(8)+ch07(8) |
| ds-ch05 | 90 | 书ch08 | 20 | 书ch08 |
| ds-ch06 | 85 | 书ch09 | 18 | 书ch09 |
| ds-ch07 | 65 | 书ch11（查找） | 14 | 书ch11 |
| ds-ch08 | 65 | 书ch10（排序） | 14 | 书ch10 |
| **合计** | **≥620** | — | **≥132** | — |

## 六、大纲文件定位

- 任务书要求核对的 `02_知识大纲_数据结构.md` **不存在**；重组后为 **`docs\specs\02-ds-curriculum.md`**（396 行，标题「数据结构知识大纲」，三部分：教材C 严蔚敏 8 章主骨架 / 教材D 朱战立 11 章 / 教材E 大话数据结构 9 章 + 附出题建议）。
- 其第二部分逐节列出朱战立 11 章目录（含附录A 上机实习报告内容规范和实例、附录B 部分习题解答），**与任务书 2.0 节内嵌骨架一致** → 阶段1 章节切分以此为命名基准。
- 出题建议要点：章节权重（树22%/线性表20%/图15%/排序15%/查找12%/栈队列10%/串数组6%）；C 实现层 8 大常考点（头指针vs头结点、插入删除指针改向顺序、单链表删除需前驱、循环队列 front==rear 歧义、递归终止条件与栈开销、遍历递归↔非递归、malloc 未查 NULL/未 free、结构体值传递vs指针传递）；判题提醒（先给个数再给值、覆盖空表/单元素/表头/表尾、输出分隔符明确且 expected 精确匹配）。

## 七、OCR 可行性抽检（阶段1 前置验证，4 页）

| PDF 页 | 内容类型 | 耗时 | 结论 |
|---|---|---|---|
| 10 | 正文+代码（`typedef struct Student`） | 4.2 s | 中文完全可读；代码结构完整，`char sex([3]` 应为 `char sex[3]` |
| 46 | 纯代码（例2-4/2-5 顺序表删除） | 2.7 s | `L->size`→`L-size`、`j+1`→`j+l`、`L>list[j+1]`、缩进丢失 → **符合任务书预期损伤，阶段1 只标记不修** |
| 121 | 章首页（`第6章 递归算法` 在第 1 行） | 3.2 s | 章首正则可命中；数学公式区乱码（`nx (n-1)x eX 1`、`TEE RS BR AMY`）→ 公式属图像区，按损伤处理 |
| 251 | 代码（基数排序 `RadixSort`） | 2.1 s | `#include 《stdio. h>`、`j《n`、`alk]`/`alj]` → 同类损伤 |

- 平均 **3.07 s/页** → 321 页约 **16.4 分钟**（严格串行，并行度 1）。
- 交叉验证：探测到 `第6章 递归算法` 在 PDF 第 121 页，教材原书页码 113 → **前置页数 offset = 8**（PDF页 = 原书页码 + 8），已写入 `scripts\ocr_book.py` 的 `check_offset()` 做全书章首自校验。

## 八、补装项清单（交付前须复述）

1. tesseract v5.4.0 便携版 → `_tools\tess\`（7-Zip 解包 NSIS 安装器，非安装、无注册表写入）
2. `chi_sim.traineddata`(2.35 MB) + `eng.traineddata`(3.92 MB) → `_tools\tess\tessdata\`
3. `rapidocr-onnxruntime` 1.4.4（pip 用户级，兜底未启用）
4. `innoextract` 1.9 → `_tools\innoextract\`（对本安装器无效，保留备查）

> `_tools\` 是本轮新增的工具目录，含 47.85 MB 安装器与 249 MB 解包产物，**不应进 git**（提交时只 add `_inputs` 的 md 产出与 `scripts`，不 add `_tools`）。
