"""一次性探针：验证 offset=8 推出的各章期望首页是否真的含章首，并定位附录A/B。"""
import io, os, re, sys, glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
D = r"D:\C-practice\_inputs\ocr_pages"
CH = {1: 1, 2: 16, 3: 44, 4: 77, 5: 99, 6: 113, 7: 133, 8: 147, 9: 186, 10: 224, 11: 249}
OFF = 8

def load(p):
    f = os.path.join(D, "p%04d.txt" % p)
    if not os.path.exists(f):
        return ""
    with open(f, encoding="utf-8", errors="replace") as fh:
        return fh.read()

print("=== 期望章首页（CH_BOOKPAGE + 8）前 2 行 ===")
for c in range(1, 12):
    exp = CH[c] + OFF
    ok = "NOFILE"
    for delta in (0, -1, 1, -2, 2):
        t = load(exp + delta)
        head = "\n".join([l for l in t.split("\n") if l.strip()][:2])
        if re.search(r"第\s*%d\s*章" % c, head):
            ok = "HIT@PDF%d(+%d) :: %s" % (exp + delta, delta, head.replace("\n", " | ")[:70])
            break
        if delta == 0:
            ok = "MISS@PDF%d :: %s" % (exp, head.replace("\n", " | ")[:70])
    print("ch%02d 期望PDF%-4d %s" % (c, exp, ok))

print("\n=== 附录定位（扫 PDF 280-321，输出含『附』的行 + 页码） ===")
for p in range(280, 322):
    t = load(p)
    for i, line in enumerate(t.split("\n")):
        s = line.strip()
        if re.search(r"附\s*[录灵]", s) and len(s) < 60:
            print("PDF%-4d L%-3d %s" % (p, i, s[:60]))
