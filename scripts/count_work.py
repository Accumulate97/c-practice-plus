# -*- coding: utf-8 -*-
"""统计产出字符数与文件数，供 _meta/token-budget.md 使用（避免 agent 自己数）。

用法：python scripts/count_work.py <目录或文件> [<目录或文件> ...]
"""
import os
import sys
import json

EXTS = (".md", ".json", ".ts", ".tsx", ".css", ".c", ".mjs", ".py")


def scan(paths):
    files, chars = 0, 0
    per = {}
    for p in paths:
        f0, c0 = files, chars
        if os.path.isfile(p):
            files += 1
            try:
                chars += len(open(p, encoding="utf-8").read())
            except Exception:
                pass
        elif os.path.isdir(p):
            for root, _, names in os.walk(p):
                if "node_modules" in root or os.sep + ".git" in root:
                    continue
                for nm in names:
                    if nm.endswith(EXTS):
                        fp = os.path.join(root, nm)
                        files += 1
                        try:
                            chars += len(open(fp, encoding="utf-8").read())
                        except Exception:
                            pass
        per[p] = {"files": files - f0, "chars": chars - c0}
    return {"total": {"files": files, "chars": chars}, "per_path": per}


if __name__ == "__main__":
    print(json.dumps(scan(sys.argv[1:]), ensure_ascii=False, indent=2))
