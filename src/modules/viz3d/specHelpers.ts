/**
 * 3D 馆共用的纯值助手 —— 拆分出来以打破「generators ⇄ specs-ds-*」的循环依赖。
 *
 * generators.ts 原先同时「定义助手」与「聚合 VIZ3D_SPECS」；而 specs-ds-a/b/c.ts
 * 又从 generators.ts import 这些助手。当 2D 馆（viz/algorithms/dsMemory.ts）也引入
 * specs-ds-a.ts 时，会先触发 specs-ds-a → generators 的循环，此时 generators 尚未
 * 重组好 SPECS 数组，`...SPECS_A` 便拿到 undefined。
 *
 * 把 cell/region/step/STACK_ADDR 移到本模块后：
 *   specs-ds-*.ts 只在本模块取「值助手」（不反向 import generators），
 *   generators.ts 仍聚合 VIZ3D_SPECS（单向 import specs-ds-*），
 *   依赖方向变成 generators → specs-ds-* → specHelpers，无环。
 *
 * 以下函数/常量与 generators.ts 原样一致（纯函数、无 React / three / DOM）。
 */
import type { MemoryCell, MemoryRegion, MemorySnapshot, VizRole, VizStep } from '../viz/types'

export function cell(key: string, address: string, value: string, role?: VizRole, note?: string): MemoryCell {
  const c: MemoryCell = { key, address, value }
  if (role) c.role = role
  if (note) c.note = note
  return c
}
export function region(key: string, title: string, cells: MemoryCell[], note?: string): MemoryRegion {
  const r: MemoryRegion = { key, title, cells }
  if (note) r.note = note
  return r
}
export function step(
  description: string,
  regions: MemoryRegion[],
  counters?: Record<string, number>,
  codeLine?: number,
): VizStep {
  const snapshot: MemorySnapshot = { kind: 'memory', regions, ...(counters ? { counters } : {}) }
  return { description, ...(codeLine ? { codeLine } : {}), snapshot }
}

/** 栈区地址刻意取高位（0x7ff0…）、堆区取低位（0x9000…），与真实进程布局方向一致 */
export const STACK_ADDR = '0x7ff0'
