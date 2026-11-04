# -*- coding: utf-8 -*-
"""朱战立《数据结构——使用C语言》第5版 扫描件 → Markdown

严格串行（并行度 1）；断点续跑（已完成页自动跳过）；按章切分；代码损伤区粗标记。
依赖：pip install pymupdf；tesseract 4.x/5.x + chi_sim 语言包

用法：
    python scripts/ocr_book.py            # 全流程（OCR → 切分 → 附录 → 总稿 → index）
    python scripts/ocr_book.py --split    # 跳过 OCR，只用已有单页 txt 重做切分/总稿/index
"""
import os
import re
import sys
import json
import time
import subprocess

try:
    import pymupdf as fitz
except ImportError:  # 旧版包名
    import fitz

# ---------------------------------------------------------------- 路径常量
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _find_input_dir():
    """用户口径为 `_input`，实际目录可能是 `_inputs`，两者都认。"""
    for name in ("_input", "_inputs"):
        d = os.path.join(ROOT, name)
        if os.path.isdir(d):
            return d
    raise SystemExit("找不到 _input / _inputs 目录")


BASE = _find_input_dir()


def _find_pdf():
    cands = [f for f in os.listdir(BASE) if f.lower().endswith(".pdf")]
    if not cands:
        raise SystemExit(f"{BASE} 下没有 PDF，实际内容：{os.listdir(BASE)}")
    cands.sort(key=lambda f: -os.path.getsize(os.path.join(BASE, f)))
    return os.path.join(BASE, cands[0])


PDF = _find_pdf()
OUT = os.path.join(BASE, "ocr_pages")
BOOK = os.path.join(BASE, "ds_book")
META = os.path.join(BASE, "_meta")

CH_NAMES = {
    1: "绪论", 2: "线性表", 3: "堆栈和队列", 4: "串", 5: "数组",
    6: "递归算法", 7: "广义表", 8: "树和二叉树", 9: "图", 10: "排序", 11: "查找",
}
CH_BOOKPAGE = {1: 1, 2: 16, 3: 44, 4: 77, 5: 99, 6: 113, 7: 133,
               8: 147, 9: 186, 10: 224, 11: 249}

# 代码行启发式：命中任一即认为该行像 C 代码
CODE_HINT = re.compile(
    r"#\s*include|#\s*define|\bmain\s*\(|\bprintf\s*\(|\bscanf\s*\("
    r"|\bfor\s*\(|\bwhile\s*\(|\btypedef\b|\bstruct\b|\breturn\b"
    r"|\bList(Insert|Delete|Get|Initiate|Length)\b|\bSeqList\b"
    r"|\bDataType\b|\bvoid\b|\bint\b|[{;]\s*$"
)
DAMAGE_TAG = "<!-- CODE_OCR_DAMAGED: 本区块 OCR 损伤，禁止直接复制，需按标准 C 重写 -->"

# 章首正则：容忍 OCR 把「第 8 章」识别成「第8章」「第 8 幸」等
CH_HEAD = re.compile(r"^第\s*([0-9一二三四五六七八九十]+)\s*[章幸幸]?\s*(\S{0,12})", re.M)
CN_NUM = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
          "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "十一": 11}


def _to_int(s):
    s = s.strip()
    if s.isdigit():
        return int(s)
    return CN_NUM.get(s, None)


# ---------------------------------------------------------------- OCR
TESS_CMD = os.environ.get("TESSERACT_CMD", "tesseract")


def ocr_page(doc, p):
    """单页 OCR；已存在且非空则直接复用（断点续跑）。"""
    t = os.path.join(OUT, "p%04d.txt" % p)
    if os.path.exists(t) and os.path.getsize(t) > 50:
        with open(t, encoding="utf-8") as fh:
            return fh.read()
    png = os.path.join(OUT, "p%04d.png" % p)
    txt = None
    try:
        doc[p].get_pixmap(dpi=220).save(png)
        r = subprocess.run(
            [TESS_CMD, png, "stdout", "-l", "chi_sim+eng", "--psm", "3",
             "-c", "preserve_interword_spaces=1"],
            capture_output=True, text=True, timeout=300, encoding="utf-8",
            errors="replace")
        txt = r.stdout or ""
        if not txt.strip():
            txt = "[OCR_FAIL p%d: empty stdout; stderr=%s]" % (p, (r.stderr or "")[:200])
    except Exception as e:
        txt = "[OCR_FAIL p%d: %s]" % (p, e)
    with open(t, "w", encoding="utf-8") as fh:
        fh.write(txt)
    if os.path.exists(png):
        try:
            os.remove(png)
        except OSError:
            pass
    return txt


def mark_code_blocks(text):
    """连续 ≥2 行像代码 → 前后插损伤标记。粗标记即可，边界不必精确。"""
    lines = text.split("\n")
    out, i, n, marks = [], 0, len(text.split("\n")), 0
    while i < n:
        if CODE_HINT.search(lines[i]):
            j = i
            while j < n and (CODE_HINT.search(lines[j]) or not lines[j].strip()):
                j += 1
            if j - i >= 2:
                out.append(DAMAGE_TAG)
                out.extend(lines[i:j])
                out.append("<!-- /CODE_OCR_DAMAGED -->")
                marks += 1
                i = j
                continue
        out.append(lines[i])
        i += 1
    return "\n".join(out), marks


def detect_chapters(pages):
    """返回 {章号: pdf_index(0-based)}。

    两道防线：
      1) 目录页排除 —— 单页在页顶 1/3 内命中 ≥4 个不同章号，必是目录/索引页；
      2) 严格递增 —— 章号顺序与页码顺序必须一致，否则丢弃该候选。
    正文页眉若含章名，setdefault 仍取到该章第一个匹配页 = 真实章首。
    """
    cand = {}
    toc_pages = []
    for i, t in enumerate(pages):
        hits = {}
        for m in CH_HEAD.finditer(t):
            c = _to_int(m.group(1))
            if c in CH_NAMES and c not in hits and m.start() < max(400, len(t) // 3):
                hits[c] = m.start()
        if len(hits) >= 4:
            toc_pages.append(i + 1)
            continue
        for c in sorted(hits):
            cand.setdefault(c, i)
    if toc_pages:
        print("  目录/索引页（已排除章首检测）：PDF %s" % toc_pages, flush=True)
    ch_start, cursor = {}, -1
    for c in sorted(cand):
        if cand[c] > cursor:
            ch_start[c] = cand[c]
            cursor = cand[c]
        else:
            print("  ⚠️ ch%02d 候选页 %d 不递增（上一页 %d），丢弃"
                  % (c, cand[c] + 1, cursor + 1), flush=True)
    return ch_start


def check_offset(ch_start):
    """用「原书页码 + 固定前置页数 = PDF 页」交叉验证章首检测。

    返回 (offset, bad_list)。offset 取各章 (pdf_index+1 - book_page) 的众数。
    """
    diffs = [(ch_start[c] + 1) - CH_BOOKPAGE[c] for c in ch_start]
    if not diffs:
        return None, []
    offset = max(set(diffs), key=diffs.count)
    bad = [(c, ch_start[c] + 1, CH_BOOKPAGE[c] + offset)
           for c in sorted(ch_start) if (ch_start[c] + 1) - CH_BOOKPAGE[c] != offset]
    return offset, bad


# OCR 常把章号数字认错：第5章→「第S章」、第8章→「BSH MA LH」、第1章→「第l章」
_OCR_DIGIT_FIX = str.maketrans({"S": "5", "O": "0", "D": "0", "l": "1", "I": "1",
                                "Z": "2", "B": "8", "q": "9", "G": "6", "T": "7"})


def _heading_hit(text, c):
    """页顶 400 字内是否出现「第c章」，容忍数字被 OCR 认成近形字母。"""
    for m in re.finditer(r"第\s*([0-9A-Za-z一二三四五六七八九十]{1,3})", text[:400]):
        if _to_int(m.group(1).translate(_OCR_DIGIT_FIX)) == c:
            return True
    return False


def anchor_by_offset(pages, ch_start, offset):
    """以「原书页码 + offset」直接定位每章首页，正则扫描结果仅作交叉验证。

    理由：本书扫描件对章首标题损伤严重（第5章 OCR 成「第S章 数 组」、
    第8章 整行成「BSH MA LH」），纯文本正则必然漏检；而 offset 已由多个
    成功识别的章共同投票确认，按此推出的 11 章页数又与教材各章实际篇幅
    逐章吻合，故以 offset 推算值为权威，并对每页做一次容忍式标题复核。
    """
    fixed, rows = {}, []
    for c in sorted(CH_NAMES):
        exp = CH_BOOKPAGE[c] + offset - 1                     # 0-based
        if not 0 <= exp < len(pages):
            print("  ⚠️ ch%02d 期望 PDF 页 %d 超出范围，沿用正则结果 %s"
                  % (c, exp + 1, ch_start.get(c)), flush=True)
            if c in ch_start:
                fixed[c] = ch_start[c]
            continue
        if _heading_hit(pages[exp], c):
            tag = "标题命中"
        else:
            near = next((exp + d for d in (-1, 1, -2, 2, -3, 3)
                         if 0 <= exp + d < len(pages) and _heading_hit(pages[exp + d], c)), None)
            if near is not None:
                exp, tag = near, "邻近命中(%+d)" % (near - exp)
            else:
                tag = "标题OCR损毁→按offset采用"
        fixed[c] = exp
        rows.append((c, exp + 1, tag, ch_start.get(c, -1) + 1 if c in ch_start else None))
    print("  offset 锚定章首 (章, PDF页, 复核, 正则原值):", flush=True)
    for r in rows:
        print("    ch%02d  PDF%-4d %-22s 正则=%s" % r, flush=True)
    ks = sorted(fixed)
    for a, b in zip(ks, ks[1:]):
        if fixed[b] <= fixed[a]:
            print("  ⚠️ ch%02d(%d) 与 ch%02d(%d) 页序颠倒，需回查图像"
                  % (a, fixed[a] + 1, b, fixed[b] + 1), flush=True)
    return fixed


def main():
    only_split = "--split" in sys.argv
    for d in (OUT, BOOK, META):
        os.makedirs(d, exist_ok=True)

    doc = fitz.open(PDF)
    n = doc.page_count
    print("PDF %s" % PDF, flush=True)
    print("总页数 %d" % n, flush=True)

    # ---- 阶段 1：OCR（严格串行，并行度 1）
    t0 = time.time()
    pages = []
    for p in range(n):
        if only_split:
            t = os.path.join(OUT, "p%04d.txt" % p)
            pages.append(open(t, encoding="utf-8").read() if os.path.exists(t) else "")
        else:
            pages.append(ocr_page(doc, p))
        if (p + 1) % 20 == 0:
            el = time.time() - t0
            print("  OCR %d/%d  用时 %.0fs  预计剩余 %.0fs"
                  % (p + 1, n, el, el / (p + 1) * (n - p - 1)), flush=True)
    doc.close()

    # ---- 阶段 2：按章切分
    ch_scan = detect_chapters(pages)
    print("  正则扫描章首：%s" % {c: v + 1 for c, v in sorted(ch_scan.items())}, flush=True)
    offset, bad = check_offset(ch_scan)
    print("  前置页数 offset=%s（PDF页 = 原书页码 + offset）" % offset, flush=True)
    if bad:
        print("  ⚠️ 正则结果与 offset 不符 (章, 实际PDF页, 期望PDF页): %s" % bad, flush=True)
    if offset is None:
        print("  ⚠️ 无法确定 offset，退回正则扫描结果", flush=True)
        ch_start = ch_scan
    else:
        ch_start = anchor_by_offset(pages, ch_scan, offset)
    missing = [c for c in CH_NAMES if c not in ch_start]
    if missing:
        print("  ⚠️ 章首仍缺: %s 需回查图像补正" % missing, flush=True)
    order = sorted(ch_start)
    if order and ch_start[order[0]] > 0:
        print("  前置页（封面/目录）PDF 1-%d" % ch_start[order[0]], flush=True)

    total_marks, stats = 0, []
    front = "\n\n".join(pages[:ch_start[order[0]]]) if order else ""
    if front:
        open(os.path.join(BOOK, "ch00_前置_目录.md"), "w", encoding="utf-8").write(front)

    for idx, c in enumerate(order):
        s = ch_start[c]
        e = ch_start[order[idx + 1]] if idx + 1 < len(order) else n
        body, mk = mark_code_blocks("\n\n".join(pages[s:e]))
        total_marks += mk
        name = "ch%02d_%s.md" % (c, CH_NAMES[c])
        open(os.path.join(BOOK, name), "w", encoding="utf-8").write(body)
        cnt = e - s
        warn = "  ⚠️页数异常" if cnt < 8 or cnt > 60 else ""
        stats.append({"ch": c, "name": CH_NAMES[c], "pdf_from": s + 1, "pdf_to": e,
                      "pages": cnt, "book_page": CH_BOOKPAGE[c], "code_marks": mk})
        print("  %s  PDF页 %d-%d  %d页  标记%d处%s"
              % (name, s + 1, e, cnt, mk, warn), flush=True)

    # ---- 阶段 3：附录（单独成文件，不并入第 11 章）
    tail_start = ch_start.get(11, max(0, n - 45))
    appx = {}
    for key in ("A", "B"):
        # 附录标题实测被 OCR 损伤：「附录 A ”上机实习报告…」/「附录了B 部分习题解答」
        # → 容忍「录」与字母之间夹 0-2 个杂字符；anchored 只看页顶 200 字，
        #   避免正文里「详见附录A」这类交叉引用把切点提前。
        for anchored in (True, False):
            pat = re.compile(r"^附\s*录\s*.{0,2}?%s" % key, re.M) if anchored \
                else re.compile(r"附\s*录\s*.{0,2}?%s" % key)
            hit = None
            for i in range(tail_start, n):
                if pat.search(pages[i][:200] if anchored else pages[i]):
                    hit = i
                    break
            if hit is not None:
                appx[key] = hit
                break
        if key not in appx:
            print("  ⚠️ 未定位 附录%s（需回查 PDF 页图像）" % key, flush=True)
    keys = sorted(appx, key=lambda k: appx[k])
    for i, key in enumerate(keys):
        s = appx[key]
        e = appx[keys[i + 1]] if i + 1 < len(keys) else n
        body = "\n\n".join(pages[s:e])
        fname = "附录A_上机实习.md" if key == "A" else "附录B_习题解答.md"
        open(os.path.join(BOOK, fname), "w", encoding="utf-8").write(body)
        print("  %s  PDF页 %d-%d" % (fname, s + 1, e), flush=True)
        # 第 11 章正文截到附录之前
        for st in stats:
            if st["ch"] == 11 and st["pdf_to"] > s:
                st["pdf_to"] = s
                st["pages"] = s - st["pdf_from"] + 1
                body, mk = mark_code_blocks("\n\n".join(pages[st["pdf_from"] - 1:s]))
                st["code_marks"] = mk
                open(os.path.join(BOOK, "ch11_%s.md" % CH_NAMES[11]), "w",
                     encoding="utf-8").write(body)
                print("  ↳ ch11_%s.md 已截到附录前：PDF页 %d-%d  %d页  标记%d处"
                      % (CH_NAMES[11], st["pdf_from"], st["pdf_to"],
                         st["pages"], mk), flush=True)

    # ---- 阶段 4：全书总稿（带标记）
    full, _ = mark_code_blocks("\n\n".join(pages))
    dst = os.path.join(BASE, "数据结构_朱战立_第5版.md")
    open(dst, "w", encoding="utf-8").write(full)

    # ---- 阶段 5：index 与统计
    fails = sum(1 for t in pages if "[OCR_FAIL" in t)
    total_marks = sum(s["code_marks"] for s in stats)
    idx = ["# 教材 md 转换索引", "",
           "- 源 PDF：%s" % os.path.basename(PDF),
           "- 总页数 %d / 成功 %d / 失败 %d" % (n, n - fails, fails),
           "- 代码损伤区粗标记 %d 处" % total_marks,
           "- 章首漏检：%s" % (missing if missing else "无"),
           "- 前置页数 offset=%s（PDF页 = 原书页码 + offset），不符章：%s"
           % (offset, [b[0] for b in bad] if bad else "无"),
           "- 附录起始 PDF 页：%s" % {("附录" + k): v + 1 for k, v in appx.items()}, "",
           "| 章 | 名称 | PDF起 | PDF止 | 页数 | 原书页码 | 损伤标记 |",
           "|---|---|---|---|---|---|---|"]
    for s in stats:
        idx.append("| ch%02d | %s | %d | %d | %d | %d | %d |"
                   % (s["ch"], s["name"], s["pdf_from"], s["pdf_to"],
                      s["pages"], s["book_page"], s["code_marks"]))
    idx += ["", "附录A 上机实习 / 附录B 习题解答 单独成文件。",
            "", "⚠️ 代码区块 OCR 损伤，禁止直接复制，需按标准 C 重写。"]
    open(os.path.join(BOOK, "index.md"), "w", encoding="utf-8").write("\n".join(idx))

    work = {"pages_total": n, "pages_ok": n - fails, "pages_fail": fails,
            "chapters": len(stats), "chapters_missing": missing,
            "front_offset": offset,
            "chapters_offset_mismatch": [b[0] for b in bad],
            "appendix_pdf_page": {("附录" + k): v + 1 for k, v in appx.items()},
            "code_marks": total_marks,
            "output_chars": sum(len(t) for t in pages),
            "files_written": len(stats) + 5,
            "elapsed_sec": round(time.time() - t0, 1)}
    open(os.path.join(META, "convert-stats.json"), "w", encoding="utf-8").write(
        json.dumps(work, ensure_ascii=False, indent=2))

    print("总稿 %s  %d 字符" % (dst, work["output_chars"]), flush=True)
    print("完成：成功 %d 页 / 失败 %d 页 / 标记 %d 处 / 用时 %.0fs"
          % (n - fails, fails, total_marks, work["elapsed_sec"]), flush=True)


if __name__ == "__main__":
    main()
