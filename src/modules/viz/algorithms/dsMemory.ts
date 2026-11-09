/**
 * 阶段5 追加的 2D 内存格演示 —— 数据结构的内存形态（与 3D 馆共享语料）。
 *
 * 这些演示复用 3D 馆（specs-ds-a.ts）已经写好并验证过的内存快照生成函数，
 * 让同一个「内存沙盘」语料既在 2D 内存格渲染器里画、也在 3D 场景里画 ——
 * 对应 catalog.ts 中 source='viz' 的「换个视角看同一个算法」设计意图。
 *
 * 纯函数、无副作用；snapshot.kind 恒为 'memory'，与 renderer='memory' 一致。
 * codeLine 指向对应的 C 源码（VIZ3D 侧的 SEQ_CODE / CIRC_CODE 等），学生在
 * 2D 视图里也能看到每步对应到哪一行 C 代码。
 */
import type { VizGenSpec } from './index'
import { bstNode, BST_CODE, circularQueue, CIRC_CODE, doublyList, DOUBLY_CODE, seqStack, SEQ_CODE, singlyList, SINGLY_CODE } from '../../viz3d/specs-ds-a'

/** 2D 内存格视图的 DS 结构演示（与 3D 馆共享同一份语料） */
export const DS_MEMORY_VIZ_SPECS: VizGenSpec[] = [
  {
    id: 'mem3d-seq-stack',
    title: '顺序栈的入栈与出栈（内存沙盘）',
    category: 'memory',
    chapter: '第3章 栈和队列',
    renderer: 'memory',
    algorithm: 'seqStack',
    counterKeys: ['top'],
    code: SEQ_CODE,
    generate: () => seqStack(),
  },
  {
    id: 'mem3d-circular-queue',
    title: '循环队列的入队出队与判空判满（内存沙盘）',
    category: 'memory',
    chapter: '第3章 栈和队列',
    renderer: 'memory',
    algorithm: 'circularQueue',
    counterKeys: ['front', 'rear', 'size'],
    code: CIRC_CODE,
    generate: () => circularQueue(),
  },
  {
    id: 'mem3d-singly-list',
    title: '单链表结点的内存与 next 指针（内存沙盘）',
    category: 'memory',
    chapter: '第2章 线性表',
    renderer: 'memory',
    algorithm: 'singlyList',
    counterKeys: ['count'],
    code: SINGLY_CODE,
    generate: () => singlyList(),
  },
  {
    id: 'mem3d-doubly-list',
    title: '双向链表的 prior 与 next 双向链接（内存沙盘）',
    category: 'memory',
    chapter: '第2章 线性表',
    renderer: 'memory',
    algorithm: 'doublyList',
    counterKeys: ['count'],
    code: DOUBLY_CODE,
    generate: () => doublyList(),
  },
  {
    id: 'mem3d-bst-node',
    title: '二叉排序树结点的内存与孩子指针（内存沙盘）',
    category: 'memory',
    chapter: '第5章 树和二叉树',
    renderer: 'memory',
    algorithm: 'bstNode',
    counterKeys: ['count'],
    code: BST_CODE,
    generate: () => bstNode(),
  },
]
