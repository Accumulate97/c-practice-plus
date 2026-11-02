/**
 * C 词法签名工具（任务07-阶段2）。
 * 从 scripts/format-code.mjs 抽出，供格式化器与诊断脚本共用。
 *
 * tokenSig：C 源码 → token 签名字符串。空白（字符串/字符常量外）全部丢弃；
 * 字符串与字符常量保留原文（含转义）；注释保留归一文本。
 * 签名一致 = 词法流一致 = 语义一致（编译产物必然相同的必要条件）。
 */

/** 注释内容归一：剥每行行首 * 装饰、折叠空白 */
export function normComment(s) {
  return s
    .split('\n')
    .map((l) => l.replace(/^\s*\*+\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenSig(src) {
  const out = []
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v') { i += 1; continue }
    // 行拼接（line splice）：字符串/字符常量外的 `\`+换行在 C 语义中等价于空白
    // （clang-format 重排多行宏定义时会合法地增删续行符），按空白丢弃。
    if (c === '\\' && (src[i + 1] === '\n' || src[i + 1] === '\r')) {
      i += src[i + 1] === '\r' && src[i + 2] === '\n' ? 3 : 2
      continue
    }
    if (c === '/' && src[i + 1] === '/') {
      let j = i + 2
      while (j < n && src[j] !== '\n') j += 1
      out.push('C:' + normComment(src.slice(i + 2, j)))
      i = j
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2)
      let content
      if (j < 0) { content = src.slice(i + 2); i = n } else { content = src.slice(i + 2, j); i = j + 2 }
      out.push('C:' + normComment(content))
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue }
        if (src[j] === c) { j += 1; break }
        if (src[j] === '\n') break
        j += 1
      }
      out.push('S:' + src.slice(i, Math.min(j, n)))
      i = Math.min(j, n)
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j += 1
      out.push('I:' + src.slice(i, j))
      i = j
      continue
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i
      while (j < n) {
        const ch = src[j]
        if (/[A-Za-z0-9_.]/.test(ch)) { j += 1; continue }
        if ((ch === '+' || ch === '-') && /[eEpP]/.test(src[j - 1] ?? '')) { j += 1; continue }
        break
      }
      out.push('N:' + src.slice(i, j))
      i = j
      continue
    }
    out.push('P:' + c)
    i += 1
  }
  return out.join('|')
}

/** 占位符与文本标记的有序序列 */
export function markers(src) {
  return [...String(src).matchAll(/__BLANK_\d+__/g)].map((m) => m[0]).join(',')
}
export function cnCount(src) {
  return (String(src).match(/【/g) ?? []).length
}
