"""阶段1 质量抽检：5 类页面（纯文字/含表格/含代码/章节首页/附录页）+ 产物完整性核对。"""
import io, os, re, sys, json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = r"D:\C-practice\_inputs"
P = os.path.join(ROOT, "ocr_pages")

def page(p):
    with open(os.path.join(P, "p%04d.txt" % (p - 1)), encoding="utf-8", errors="replace") as f:
        return f.read()

CASES = [(12, "纯文字（ch01 绪论正文）"), (233, "含表格（ch10 排序方法概述）"),
         (60, "含代码（ch02 链表操作）"), (155, "章节首页（ch08 标题OCR损毁）"),
         (292, "附录页（附录B 部分习题解答首页）")]

print("=== 5 页抽检（每页取前 380 字） ===")
for p, kind in CASES:
    t = page(p)
    body = re.sub(r"\n{2,}", "\n", t.strip())
    han = len(re.findall(r"[\u4e00-\u9fff]", t))
    print("\n--- PDF %-4d %s | 字符 %d · 汉字 %d · 空行 %d ---"
          % (p, kind, len(t), han, t.count("\n\n")))
    print(body[:380])

print("\n=== 全 321 页体检 ===")
blank, fail, tiny = [], [], []
for i in range(321):
    t = page(i + 1)
    if "[OCR_FAIL" in t:
        fail.append(i + 1)
    if len(t.strip()) == 0:
        blank.append(i + 1)
    elif len(t.strip()) < 40:
        tiny.append((i + 1, t.strip()[:30]))
print("整页 [OCR_FAIL]：%s" % (fail or "无"))
print("整页空白：%s" % (blank or "无"))
print("极短页(<40字)：%s" % (tiny or "无"))

print("\n=== index.md（产物索引，核对页数表） ===")
print(open(os.path.join(ROOT, "ds_book", "index.md"), encoding="utf-8").read())

print("=== convert-stats.json（用 python 读，避开 PowerShell 编码） ===")
print(json.dumps(json.load(open(os.path.join(ROOT, "_meta", "convert-stats.json"),
                               encoding="utf-8")), ensure_ascii=False))
