/**
 * 阶段4 追加的 3D 演示 —— 批次 A（内存沙盘：DS 结构的内存模型）。
 *
 * 由独立子代理撰写，只新增本文件，禁止改动 generators.ts / catalog.ts / 既有语料。
 * 契约与 generators.ts 完全一致：snapshot.kind 恒为 'memory'（不改 schema），
 * 用 generators.ts 导出的 cell/region/step 助手拼快照。
 *
 * 8 个演示都把「数据结构的内存形态」当成主角：
 *   1. mem3d-seq-stack       顺序栈：数组 + top，入栈出栈
 *   2. mem3d-circular-queue  循环队列：数组 + front/rear，判空判满
 *   3. mem3d-singly-list     单链表：堆区结点 + next 链
 *   4. mem3d-doubly-list     双向链表：prior + next 双向
 *   5. mem3d-hash-open       散列开放定址（线性探测）
 *   6. mem3d-hash-chain      散列链地址法（槽 + 链）
 *   7. mem3d-bst-node        二叉排序树：堆区结点 + 左右孩子指针
 *   8. mem3d-adjmatrix       邻接矩阵 vs 邻接表
 */
import { cell, region, step, STACK_ADDR } from './generators'
import type { Viz3DSpec } from './generators'
import type { MemoryCell, MemoryRegion, VizStep } from '../viz/types'

/* ================================================================== *
 * 1. 顺序栈：数组 + top 指针
 * ================================================================== */
const SEQ_CODE = `#include <stdio.h>
#define MAXSIZE 5

typedef struct {
    int data[MAXSIZE];   /* 栈底在 data[0]，栈顶在 data[top] */
    int top;
} SqStack;

int main(void) {
    SqStack S;
    S.top = -1;                  /* 初始化空栈 */
    S.data[++S.top] = 10;        /* push(10) */
    S.data[++S.top] = 20;        /* push(20) */
    S.data[++S.top] = 30;        /* push(30) */
    S.top--;                     /* pop 出栈 */
    S.top--;                     /* pop 出栈 */
    return 0;
}
`

const SEQ_MAXLEN = 5
const SEQ_BASE = 0x7ff0

function seqStack(): VizStep[] {
  const steps: VizStep[] = []
  // values[i] 是槽 i 的当前内容；top 是栈顶下标（-1 = 空栈）
  const values: (number | '')[] = ['', '', '', '', '']
  let top = -1

  const build = (active: number | null): MemoryRegion[] => {
    const cells: MemoryCell[] = []
    for (let i = 0; i < SEQ_MAXLEN; i += 1) {
      cells.push(cell(
        'data' + i,
        '0x' + (SEQ_BASE + i * 4).toString(16),
        values[i]! === '' ? '空' : String(values[i]!),
        active === i ? 'active' : (values[i]! !== '' ? 'sorted' : 'idle'),
        i === top ? '栈顶元素（top 指向这里）' : (values[i]! === '' ? '空闲槽' : i < top ? '栈内元素' : undefined),
      ))
    }
    cells.push(cell('top', '0x' + (SEQ_BASE + SEQ_MAXLEN * 4).toString(16), String(top), 'pivot', '栈顶指针 top = ' + top))
    cells.push(cell('max', '0x' + (SEQ_BASE + SEQ_MAXLEN * 4 + 4).toString(16), String(SEQ_MAXLEN), 'idle', '栈容量 MAXSIZE'))
    return [region('stack', '顺序栈 SqStack（data[0..' + (SEQ_MAXLEN - 1) + '] + top）', cells, '数组在栈区连续存放，top 记住栈顶下标')]
  }

  steps.push(step(
    '初始化空栈：S.top = -1。data[0..4] 五个槽在栈区连续占好，但没有一个元素 —— 空栈的判据不是「数组是空的」，而是 top = -1。',
    build(null), { top }, 6,
  ))

  top = 0; values[0] = 10
  steps.push(step(
    '入栈 push(10)：先执行 ++top 让 top 变成 0，再把 10 写进 data[0]。顺序栈入栈固定两步 —— 「先移栈顶指针、再写元素」；出栈则反过来，先取元素、再退 top。',
    build(0), { top }, 7,
  ))

  top = 1; values[1] = 20
  steps.push(step(
    '入栈 push(20)：top 上移到 1，20 落在 data[1]。栈顶元素永远是最新压入的那个，数组端在物理上不断向上增长；被压在下面的元素只能等上面全部弹出后才触手可及。',
    build(1), { top }, 8,
  ))

  top = 2; values[2] = 30
  steps.push(step(
    '入栈 push(30)：top 上移到 2，data[2] = 30。此刻栈里自底向顶是 10 / 20 / 30，栈顶是 30。10 最早进来，压在栈底，最后才能出去 —— 这叫后进先出（LIFO）。',
    build(2), { top }, 9,
  ))

  top = 1; values[2] = ''
  steps.push(step(
    '出栈 pop()：弹出栈顶 data[2] = 30，随后 top 退到 1。注意下标回退即可，30 从逻辑栈里消失，但**槽位还在** —— 数组里仍是旧值，只是 top 不再覆盖它，成了「逻辑上不可访问」的残留。',
    build(2), { top }, 10,
  ))

  top = 0; values[1] = ''
  steps.push(step(
    '再出栈 pop()：弹出 20，top 退到 0。30 与 20 的槽位仍写着旧值，但都被 top 甩到栈外。顺序栈唯一关注的只有 top —— 「top 以下都是栈内、top 以上都是栈外」。',
    build(1), { top }, 11,
  ))

  steps.push(step(
    '总结：顺序栈用一块连续数组 + 一个 top 下标表达「栈」。入栈 = ++top 再写值，出栈 = 退 top。因为插入删除都只在表的一端进行，所以两种操作都只要 O(1) 时间，这是它比链栈快的原因。',
    build(null), { top }, 12,
  ))

  return steps
}

/* ================================================================== *
 * 2. 循环队列：数组 + front/rear（牺牲一格判满）
 * ================================================================== */
const CIRC_CODE = `#include <stdio.h>
#define MAXSIZE 5

typedef struct {
    char data[MAXSIZE];
    int front;   /* 队头元素的下标 */
    int rear;    /* 队尾元素「下一个」位置 */
} SqQueue;

int main(void) {
    SqQueue Q;
    Q.front = Q.rear = 0;                      /* 初始空队 */
    Q.data[Q.rear] = 'A'; Q.rear = (Q.rear + 1) % MAXSIZE;
    Q.data[Q.rear] = 'B'; Q.rear = (Q.rear + 1) % MAXSIZE;
    Q.front = (Q.front + 1) % MAXSIZE;         /* 出队一个 */
    Q.data[Q.rear] = 'C'; Q.rear = (Q.rear + 1) % MAXSIZE;
    Q.data[Q.rear] = 'D'; Q.rear = (Q.rear + 1) % MAXSIZE;
    Q.data[Q.rear] = 'E'; Q.rear = (Q.rear + 1) % MAXSIZE;  /* 环绕到下标 0 */
    return 0;
}
`

const CIRC_MAXLEN = 5
const CIRC_BASE = 0x7ff0

function circularQueue(): VizStep[] {
  const steps: VizStep[] = []
  const values: (string | '')[] = ['', '', '', '', '']
  let front = 0
  let rear = 0

  const size = (): number => (rear - front + CIRC_MAXLEN) % CIRC_MAXLEN

  const build = (active: number | null, note: string): MemoryRegion[] => {
    const cells: MemoryCell[] = []
    for (let i = 0; i < CIRC_MAXLEN; i += 1) {
      cells.push(cell(
        'data' + i,
        '0x' + (CIRC_BASE + i * 4).toString(16),
        values[i]! === '' ? '空' : values[i]!,
        active === i ? 'active' : (values[i]! !== '' ? 'sorted' : 'idle'),
        i === front && values[i]! !== '' ? '队头元素' : (i === rear ? '下一个入队位置' : undefined),
      ))
    }
    cells.push(cell('front', '0x' + (CIRC_BASE + CIRC_MAXLEN * 4).toString(16), String(front), 'pivot', '队头下标 front'))
    cells.push(cell('rear', '0x' + (CIRC_BASE + CIRC_MAXLEN * 4 + 4).toString(16), String(rear), 'pivot', '队尾下标 rear'))
    return [region('queue', '循环队列 SqQueue（data[0..' + (CIRC_MAXLEN - 1) + '] + front/rear）', cells, note)]
  }

  steps.push(step(
    '初始化空队：front = rear = 0，五个槽全空。判空条件就是 front === rear。此时队列里一个元素都没有。',
    build(null, '数组长度 MAXSIZE=5，下标用取模 % 实现环绕'), { front, rear, size: size() }, 6,
  ))

  // 入队 A
  values[rear] = 'A'; rear = (rear + 1) % CIRC_MAXLEN
  steps.push(step(
    '入队 A：把 A 写进 data[0]，rear 前进到 1。front 不动。队列的插入只在队尾进行，删除只在队头进行。',
    build(0, '入队：front 不动，rear 前进'), { front, rear, size: size() }, 7,
  ))

  // 入队 B
  values[rear] = 'B'; rear = (rear + 1) % CIRC_MAXLEN
  steps.push(step(
    '入队 B：把 B 写进 data[1]，rear 前进到 2。现在队列里是 A、B，队头是 A。先进先出（FIFO）。',
    build(1, '入队：front 不动，rear 前进'), { front, rear, size: size() }, 8,
  ))

  // 出队一个
  front = (front + 1) % CIRC_MAXLEN
  steps.push(step(
    '出队一个：front 前进到 1，逻辑上丢弃了原本的 A。注意 A 的槽位还在、内容还是 A，只是 front 越过了它 —— 队列里现在只剩 B。',
    build(1, '出队：只动 front，被删除元素留在原地'), { front, rear, size: size() }, 9,
  ))

  // 入队 C
  values[rear] = 'C'; rear = (rear + 1) % CIRC_MAXLEN
  steps.push(step(
    '入队 C：把 C 写进 data[2]，rear 前进到 3。此刻队列是 B、C，队头 data[1]=B，队尾 data[2]=C。',
    build(2, '入队：front 不动，rear 前进'), { front, rear, size: size() }, 10,
  ))

  // 入队 D
  values[rear] = 'D'; rear = (rear + 1) % CIRC_MAXLEN
  steps.push(step(
    '入队 D：把 D 写进 data[3]，rear 前进到 4。队列为 B、C、D，还剩一个槽 data[4] 可用。',
    build(3, '入队：front 不动，rear 前进'), { front, rear, size: size() }, 11,
  ))

  // 入队 E —— 环绕回 0
  values[rear] = 'E'; rear = (rear + 1) % CIRC_MAXLEN
  steps.push(step(
    '入队 E：data[4] = E，rear = (4+1)%5 = 0 —— 环绕回表头！这正是「循环」的由来：数组物理上到头，逻辑上却形成了一个环。此时队列是 B、C、D、E，占满 4 个元素。',
    build(4, 'rear 环绕回 0，逻辑上首尾相接'), { front, rear, size: size() }, 12,
  ))

  steps.push(step(
    '结论：循环队列靠「取模」让下标环绕，从而不浪费数组空间。但正因为 front === rear 既是「空」又是「满」，常规实现必须「牺牲一个格子」—— 队列最多放 MAXSIZE-1 个元素，判满条件 (rear+1)%MAXSIZE === front。',
    build(null, '常规判满：牺牲一格，最多存 MAXSIZE-1 个'), { front, rear, size: size() }, 12,
  ))

  return steps
}

/* ================================================================== *
 * 3. 单链表：堆区结点 + next 链
 * ================================================================== */
const SINGLY_CODE = `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

int main(void) {
    Node *head = NULL;              /* 空表：头指针先为空 */
    Node *n1 = malloc(sizeof(Node)); n1->data = 10; n1->next = head; head = n1;
    Node *n2 = malloc(sizeof(Node)); n2->data = 20; n2->next = head; head = n2;
    Node *n3 = malloc(sizeof(Node)); n3->data = 30; n3->next = head; head = n3;
    /* 头插法：每次新结点都插在表头，next 永远指向原来的头 */
    return 0;
}
`

function singlyList(): VizStep[] {
  const steps: VizStep[] = []
  // 结点地址：n1 0x9000, n2 0x9008, n3 0x9010（每个结点 8 字节）
  const ADDR: Record<string, number> = { n1: 0x9000, n2: 0x9008, n3: 0x9010 }
  const NODE_KEYS = ['n1', 'n2', 'n3']
  // 每个结点的 data；next 指向的结点 key（null = 链尾）
  let head: string | null = null
  const nodeData: Record<string, number> = {}
  const nextOf: Record<string, string | null> = {}

  const count = (): number => Object.keys(nodeData).length

  const build = (): MemoryRegion[] => {
    const cells: MemoryCell[] = []
    for (const key of NODE_KEYS) {
      if (!(key in nodeData)) continue
      const addr = ADDR[key]!
      const isHead = key === head
      cells.push(cell(
        key + '-data', '0x' + addr.toString(16), String(nodeData[key]!),
        isHead ? 'active' : 'sorted',
        isHead ? '头结点，head 指向这里' : '普通结点',
      ))
      cells.push(cell(
        key + '-next', '0x' + (addr + 4).toString(16),
        nextOf[key]! === null ? 'NULL' : '→ 0x' + ADDR[nextOf[key]!]!.toString(16),
        'idle', 'next 指针：指向后继结点',
      ))
    }
    cells.push(cell('head', STACK_ADDR, head === null ? 'NULL' : '→ 0x' + ADDR[head]!.toString(16), 'pivot', '头指针 head'))
    return [region('head', '头指针', [cells[cells.length - 1]!]), region('heap', '堆区（malloc 的结点）', cells.slice(0, -1), '每个结点含 data + next，在堆区离散分配')]
  }

  steps.push(step(
    '空表：int *head = NULL。还没有任何结点，链表为空。头指针是链表的唯一入口，所有查找/插入都必须从它出发。',
    build(), { count: count() }, 4,
  ))

  // 插入 n1
  nodeData.n1 = 10; nextOf.n1 = null; head = 'n1'
  steps.push(step(
    '头插法插入第一个结点：malloc 一块 8 字节的空间，把 10 写进 data，next 置为原 head(NULL)，最后 head 指向它。此时链表只有一个结点，next 指向 NULL 即链尾。',
    build(), { count: count() }, 6,
  ))

  // 插入 n2
  nodeData.n2 = 20; nextOf.n2 = 'n1'; head = 'n2'
  steps.push(step(
    '再头插一个结点 n2=20：malloc 出新结点，data=20，next 指向前一个头结点 n1，head 改指 n2。链表变成 n2 → n1 → NULL。',
    build(), { count: count() }, 7,
  ))

  // 插入 n3
  nodeData.n3 = 30; nextOf.n3 = 'n2'; head = 'n3'
  steps.push(step(
    '再头插 n3=30：data=30，next 指向原头 n2，head 改为 n3。链表现在 n3 → n2 → n1 → NULL。注意 head 只存「第一个结点地址」，后续结点全靠 next 一个接一个串起来。',
    build(), { count: count() }, 8,
  ))

  steps.push(step(
    '总结：单链表把「数据的先后顺序」编码进每个结点的 next 指针，而非连续下标。因此插入只需改两个指针（新结点的 next 与原头指针），代价是查找必须从 head 一路 next 数过去 —— 时间 O(n)，空间上每个结点多占一个指针。',
    build(), { count: count() }, 10,
  ))

  return steps
}

/* ================================================================== *
 * 4. 双向链表：prior + next 双向
 * ================================================================== */
const DOUBLY_CODE = `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *prior;   /* 指向前驱 */
    struct Node *next;    /* 指向后继 */
} Node;

int main(void) {
    Node *head = NULL;
    Node *n1 = malloc(sizeof(Node)); n1->data = 10; n1->prior = NULL; n1->next = NULL; head = n1;
    Node *n2 = malloc(sizeof(Node)); n2->data = 20; n2->prior = n1; n1->next = n2; n2->next = NULL;
    Node *n3 = malloc(sizeof(Node)); n3->data = 30; n3->prior = n2; n2->next = n3; n3->next = NULL;
    /* 在 n2 之后插入 s */
    Node *s  = malloc(sizeof(Node)); s->data = 25;
    s->prior = n2; s->next = n2->next; n2->next->prior = s; n2->next = s;
    return 0;
}
`

function doublyList(): VizStep[] {
  const steps: VizStep[] = []
  // 每个结点 12 字节：prior / data / next
  const ADDR: Record<string, number> = { n1: 0x9000, n2: 0x900c, n3: 0x9018, s: 0x9024 }
  const NODE_KEYS = ['n1', 'n2', 'n3', 's']
  const nodeData: Record<string, number> = {}
  const priorOf: Record<string, string | null> = {}
  const nextOf: Record<string, string | null> = {}
  let head: string | null = null

  const count = (): number => Object.keys(nodeData).length

  const cellsFor = (active: string | null): MemoryCell[] => {
    const cells: MemoryCell[] = []
    for (const key of NODE_KEYS) {
      if (!(key in nodeData)) continue
      const addr = ADDR[key]!
      const isActive = key === active
      cells.push(cell(key + '-prior', '0x' + addr.toString(16), (priorOf[key]! ?? null) === null ? 'NULL' : '← 0x' + ADDR[priorOf[key]!]!.toString(16), isActive ? 'active' : 'idle', '前驱指针'))
      cells.push(cell(key + '-data', '0x' + (addr + 4).toString(16), String(nodeData[key]!), isActive ? 'active' : 'sorted', 'data'))
      cells.push(cell(key + '-next', '0x' + (addr + 8).toString(16), (nextOf[key]! ?? null) === null ? 'NULL' : '→ 0x' + ADDR[nextOf[key]!]!.toString(16), isActive ? 'active' : 'idle', '后继指针'))
    }
    cells.push(cell('head', STACK_ADDR, head === null ? 'NULL' : '→ 0x' + ADDR[head]!.toString(16), 'pivot', '头指针 head'))
    return cells
  }

  const build = (active: string | null): MemoryRegion[] => {
    const all = cellsFor(active)
    return [
      region('head', '头指针', [all[all.length - 1]!]),
      region('heap', '堆区（每个结点：prior + data + next）', all.slice(0, -1), '双向链表每个结点有两个指针，可双向遍历'),
    ]
  }

  steps.push(step(
    '空双向链表：head = NULL。双向链表与单链表的差别只在结点多了一个 prior 指针，用于指向前驱。',
    build(null), { count: count() }, 5,
  ))

  nodeData.n1 = 10; priorOf.n1 = null; nextOf.n1 = null; head = 'n1'
  steps.push(step(
    '插入第一个结点 n1=10：prior = NULL（它是表头）、next = NULL（它是表尾），head 指向它。单结点时前驱后继都悬空。',
    build('n1'), { count: count() }, 7,
  ))

  nodeData.n2 = 20; priorOf.n2 = 'n1'; nextOf.n1 = 'n2'; nextOf.n2 = null
  steps.push(step(
    '在表尾追加 n2=20：n2->prior = n1，n1->next = n2，n2->next = NULL。现在 n1 ↔ n2：从 n1 能通过 next 到 n2，从 n2 能通过 prior 回 n1 —— 这是双向链表的核心能力。',
    build('n2'), { count: count() }, 8,
  ))

  nodeData.n3 = 30; priorOf.n3 = 'n2'; nextOf.n2 = 'n3'; nextOf.n3 = null
  steps.push(step(
    '再追加 n3=30 到表尾：n3->prior = n2，n2->next = n3。链表变成 n1 ↔ n2 ↔ n3，每个结点既知道后继也知道前驱。',
    build('n3'), { count: count() }, 9,
  ))

  // 在 n2 之后插入 s
  nodeData.s = 25; priorOf.s = 'n2'; nextOf.s = 'n3'; nextOf.n2 = 's'; priorOf.n3 = 's'
  steps.push(step(
    '在 n2 之后插入新结点 s=25，四步改针：s->prior = n2；s->next = n2->next(即 n3)；n2->next->prior = s；n2->next = s。因为双向链表有 prior，插入时能把「后继的前驱」也一起改对 —— 这正是它比单链表便于插入删除的地方。',
    build('s'), { count: count() }, 11,
  ))

  steps.push(step(
    '总结：双向链表每个结点多存一个 prior 指针，换来可在两个方向上遍历、以及在已知结点处 O(1) 插入/删除的能力。代价是每个结点多占 4 字节，且改指针的操作数是单链表的两倍。',
    build(null), { count: count() }, 15,
  ))

  return steps
}

/* ================================================================== *
 * 5. 散列开放定址（线性探测）
 * ================================================================== */
const HASH_OPEN_CODE = `#include <stdio.h>
#define M 8

int main(void) {
    int table[M] = {0};            /* 散列表，0 表示空槽 */
    /* 散列函数 H(key) = key % M */
    int keys[] = {15, 23, 31};     /* 三者 H 值都是 7 → 冲突 */
    table[15 % M] = 15;            /* H(15)=7 */
    int h = 23 % M; while (table[h] != 0) h = (h + 1) % M; table[h] = 23;  /* 探测到 0 */
    h = 31 % M; while (table[h] != 0) h = (h + 1) % M; table[h] = 31;      /* 探测 0、1 */
    return 0;
}
`

const HASH_OPEN_M = 8

function hashOpen(): VizStep[] {
  const steps: VizStep[] = []
  const table: (number | null)[] = Array.from({ length: HASH_OPEN_M }, () => null)
  let probes = 0 // 当前这一步累计的探测次数（含命中槽位的那次）

  const build = (active: number | null): MemoryRegion[] => {
    const cells: MemoryCell[] = []
    for (let i = 0; i < HASH_OPEN_M; i += 1) {
      cells.push(cell(
        'slot' + i,
        '0x' + (0x9000 + i * 4).toString(16),
        table[i] === null ? '空' : String(table[i]),
        active === i ? 'active' : (table[i] !== null ? 'sorted' : 'idle'),
        i === active ? '本次探测/落位位置' : undefined,
      ))
    }
    return [region('hashtable', '散列表（线性探测，M=' + HASH_OPEN_M + '）', cells, 'H(key) = key % M，地址 0x9000 起，每槽 4 字节')]
  }

  steps.push(step(
    '初始化散列表：M = 8 个槽全空。散列函数 H(key) = key % M，把 key 映射到 0..7 的某个槽。',
    build(null), { probes }, 4,
  ))

  // 插入 15: H(15)=7
  const pos15 = 15 % HASH_OPEN_M
  probes = 1
  table[pos15] = 15
  steps.push(step(
    '插入 15：H(15) = 15 % 8 = 7，槽 7 空，直接落位，探测 1 次。散列查找的理想情况：一步到位。',
    build(pos15), { probes }, 6,
  ))

  // 插入 23: H(23)=7，冲突，线性探测到 0
  let h = 23 % HASH_OPEN_M
  probes = 0
  while (table[h] !== null) { h = (h + 1) % HASH_OPEN_M; probes += 1 }
  probes += 1
  table[h] = 23
  steps.push(step(
    '插入 23：H(23) = 23 % 8 = 7，但槽 7 已被 15 占住 —— 冲突。线性探测从 7 顺次往后找空槽：7 忙 → 0 空，于是 23 落在槽 0，共探测 2 次。',
    build(h), { probes }, 8,
  ))

  // 插入 31: H(31)=7，探测 0、1
  h = 31 % HASH_OPEN_M
  probes = 0
  while (table[h] !== null) { h = (h + 1) % HASH_OPEN_M; probes += 1 }
  probes += 1
  table[h] = 31
  steps.push(step(
    '插入 31：H(31) = 31 % 8 = 7，冲突；线性探测 7 忙 → 0 忙 → 1 空，落在槽 1，共探测 3 次。冲突聚集成「堆积」，探测次数随插入顺序增长 —— 这就是线性探测的代价。',
    build(h), { probes }, 10,
  ))

  steps.push(step(
    '总结：开放定址法把冲突的元素也放进同一张表里，用「向后探测」找空位。它节省空间（无需额外指针），但查找一个不存在的 key 时，可能要探测到空槽才知道失败；装填因子越高，探测次数越涨，所以散列表要控制装填因子（常留 30% 空槽）。',
    build(null), { probes }, 12,
  ))

  return steps
}

/* ================================================================== *
 * 6. 散列链地址法：槽 + 链表
 * ================================================================== */
const HASH_CHAIN_CODE = `#include <stdio.h>
#include <stdlib.h>
#define M 4

typedef struct HNode {
    int key;
    struct HNode *next;
} HNode;

int main(void) {
    HNode *slot[M] = {0};            /* 每个槽是一个链表的头指针 */
    int keys[] = {15, 23, 31};       /* H 值都是 3 → 同一槽 */
    /* 头插法：H(key) = key % M */
    HNode *n1 = malloc(sizeof(HNode)); n1->key = 15; n1->next = slot[3]; slot[3] = n1;
    HNode *n2 = malloc(sizeof(HNode)); n2->key = 23; n2->next = slot[3]; slot[3] = n2;
    HNode *n3 = malloc(sizeof(HNode)); n3->key = 31; n3->next = slot[3]; slot[3] = n3;
    return 0;
}
`

const HASH_CHAIN_M = 4

function hashChain(): VizStep[] {
  const steps: VizStep[] = []
  // slot[i] 是槽 i 的链表头结点 key；nodes 存每个结点的数据和 next
  const slotHead: (string | null)[] = Array.from({ length: HASH_CHAIN_M }, () => null)
  const nodeData: Record<string, number> = {}
  const nodeNext: Record<string, string | null> = {}
  // 结点地址：n1 0x9000, n2 0x9008, n3 0x9010
  const ADDR: Record<string, number> = { n1: 0x9000, n2: 0x9008, n3: 0x9010 }
  const order = ['n1', 'n2', 'n3']

  const count = (): number => Object.keys(nodeData).length

  const build = (active: string | null): MemoryRegion[] => {
    // 槽区域
    const slotCells: MemoryCell[] = []
    for (let i = 0; i < HASH_CHAIN_M; i += 1) {
      slotCells.push(cell(
        'slot' + i,
        '0x' + (0x9000 + i * 4).toString(16),
        slotHead[i] === null ? 'NULL' : '→ 0x' + ADDR[slotHead[i]!]!.toString(16),
        'idle',
        '槽 ' + i + ' 的链表头指针（H(key) = key % ' + HASH_CHAIN_M + '）',
      ))
    }
    // 结点区域
    const nodeCells: MemoryCell[] = []
    for (const key of order) {
      if (!(key in nodeData)) continue
      const addr = ADDR[key]!
      nodeCells.push(cell(
        key + '-key', '0x' + (addr + 4).toString(16), String(nodeData[key]!),
        key === active ? 'active' : 'sorted',
        'key',
      ))
      nodeCells.push(cell(
        key + '-next', '0x' + (addr + 8).toString(16),
        nodeNext[key]! === null ? 'NULL' : '→ 0x' + ADDR[nodeNext[key]!]!.toString(16),
        'idle', 'next 指针',
      ))
    }
    return [
      region('slots', '散列槽数组（链地址法）', slotCells, '每个槽是链表头指针，M=' + HASH_CHAIN_M),
      region('heap', '堆区（冲突结点用链串起来）', nodeCells, '同义词结点挂在同一个槽的链上'),
    ]
  }

  steps.push(step(
    '初始化：4 个槽，每个都是空链表（NULL）。链地址法与开放定址法的区别：冲突的 key 不挤进同一张表，而是各自挂到「同一个槽下的链表」里。',
    build(null), { count: count() }, 6,
  ))

  // 插入 15
  nodeData.n1 = 15; nodeNext.n1 = null; slotHead[3] = 'n1'
  steps.push(step(
    '插入 15：H(15) = 15 % 4 = 3，槽 3 是空链表，直接把结点 n1 挂上去，链尾 next = NULL。',
    build('n1'), { count: count() }, 9,
  ))

  // 插入 23
  nodeData.n2 = 23; nodeNext.n2 = 'n1'; slotHead[3] = 'n2'
  steps.push(step(
    '插入 23：H(23) = 23 % 4 = 3，同样落到槽 3。头插法把新结点 n2 放在链头：n2->next 指向原头 n1，slot[3] 改指 n2。链变成 n2 → n1 → NULL。',
    build('n2'), { count: count() }, 10,
  ))

  // 插入 31
  nodeData.n3 = 31; nodeNext.n3 = 'n2'; slotHead[3] = 'n3'
  steps.push(step(
    '插入 31：H(31) = 31 % 4 = 3，仍在槽 3，头插后链为 n3 → n2 → n1。三个冲突 key 都集中在槽 3 的链表里，其他槽仍空 —— 这就是「同义词链」。',
    build('n3'), { count: count() }, 11,
  ))

  steps.push(step(
    '总结：链地址法把冲突的 key 用链表串在同一个槽下。查找先算 H(key) 定位槽，再沿链线性查 —— 链越短越快。它不需要像开放定址那样预留空槽，装填因子可以 >1；代价是每个结点多一个 next 指针占空间。',
    build(null), { count: count() }, 13,
  ))

  return steps
}

/* ================================================================== *
 * 7. 二叉排序树：堆区结点 + 左右孩子指针
 * ================================================================== */
const BST_CODE = `#include <stdio.h>
#include <stdlib.h>

typedef struct BSTNode {
    int key;
    struct BSTNode *lchild;
    struct BSTNode *rchild;
} BSTNode;

int main(void) {
    BSTNode *root = NULL;
    /* 依次插入 50、30、70、40 —— 按二叉排序树规则 */
    BSTNode *n50 = malloc(sizeof(BSTNode)); n50->key = 50; n50->lchild = NULL; n50->rchild = NULL; root = n50;
    BSTNode *n30 = malloc(sizeof(BSTNode)); n30->key = 30; n30->lchild = NULL; n30->rchild = NULL; n50->lchild = n30;
    BSTNode *n70 = malloc(sizeof(BSTNode)); n70->key = 70; n70->lchild = NULL; n70->rchild = NULL; n50->rchild = n70;
    BSTNode *n40 = malloc(sizeof(BSTNode)); n40->key = 40; n40->lchild = NULL; n40->rchild = NULL; n30->rchild = n40;
    return 0;
}
`

function bstNode(): VizStep[] {
  const steps: VizStep[] = []
  // 每个结点 12 字节：key / lchild / rchild
  const ADDR: Record<string, number> = { n50: 0x9000, n30: 0x900c, n70: 0x9018, n40: 0x9024 }
  const NODE_KEYS = ['n50', 'n30', 'n70', 'n40']
  const nodeKey: Record<string, number> = {}
  const lchild: Record<string, string | null> = {}
  const rchild: Record<string, string | null> = {}
  let root: string | null = null

  const count = (): number => Object.keys(nodeKey).length

  const cellsFor = (active: string | null): MemoryCell[] => {
    const cells: MemoryCell[] = []
    for (const key of NODE_KEYS) {
      if (!(key in nodeKey)) continue
      const addr = ADDR[key]!
      const act = key === active
      cells.push(cell(key + '-key', '0x' + addr.toString(16), String(nodeKey[key]!), act ? 'active' : 'sorted', 'key'))
      cells.push(cell(key + '-lchild', '0x' + (addr + 4).toString(16), (lchild[key]! ?? null) === null ? 'NULL' : '→ 0x' + ADDR[lchild[key]!]!.toString(16), act ? 'active' : 'idle', '左孩子指针'))
      cells.push(cell(key + '-rchild', '0x' + (addr + 8).toString(16), (rchild[key]! ?? null) === null ? 'NULL' : '→ 0x' + ADDR[rchild[key]!]!.toString(16), act ? 'active' : 'idle', '右孩子指针'))
    }
    cells.push(cell('root', STACK_ADDR, root === null ? 'NULL' : '→ 0x' + ADDR[root]!.toString(16), 'pivot', '根指针 root'))
    return cells
  }

  const build = (active: string | null): MemoryRegion[] => {
    const all = cellsFor(active)
    return [
      region('root', '根指针', [all[all.length - 1]!]),
      region('heap', '堆区（每个结点：key + lchild + rchild）', all.slice(0, -1), '二叉排序树结点离散分布在堆区，孩子用指针连接'),
    ]
  }

  steps.push(step(
    '空树：root = NULL，还没有任何结点。',
    build(null), { count: count() }, 5,
  ))

  nodeKey.n50 = 50; lchild.n50 = null; rchild.n50 = null; root = 'n50'
  steps.push(step(
    '插入 50：第一个结点成为根。root = n50，左右孩子都为空。二叉排序树的性质：左子树所有结点 < 根，右子树所有结点 > 根。',
    build('n50'), { count: count() }, 8,
  ))

  nodeKey.n30 = 30; lchild.n30 = null; rchild.n30 = null; lchild.n50 = 'n30'
  steps.push(step(
    '插入 30：30 < 50，往左走，n50 的左孩子为空，于是 30 成为 n50 的左孩子。左子树保存比根小的值。',
    build('n30'), { count: count() }, 9,
  ))

  nodeKey.n70 = 70; lchild.n70 = null; rchild.n70 = null; rchild.n50 = 'n70'
  steps.push(step(
    '插入 70：70 > 50，往右走，成为 n50 的右孩子。右子树保存比根大的值。',
    build('n70'), { count: count() }, 10,
  ))

  nodeKey.n40 = 40; lchild.n40 = null; rchild.n40 = null; rchild.n30 = 'n40'
  steps.push(step(
    '插入 40：40 < 50 往左到 n30，40 > 30 往右，成为 n30 的右孩子。整棵树：n50 左孩子 n30、右孩子 n70，n30 右孩子 n40 —— 中序遍历可得有序序列 30、40、50、70。',
    build('n40'), { count: count() }, 11,
  ))

  steps.push(step(
    '总结：二叉排序树把「大小关系」编码进结点的左右孩子指针。插入/查找都从根出发，每层比较一次、缩小一半搜索范围，平均 O(log n)；但若插入次序恰好有序，会退化成一条「链」，退到 O(n)。内存形态上就是一堆用指针相连的堆区结点。',
    build(null), { count: count() }, 13,
  ))

  return steps
}

/* ================================================================== *
 * 8. 邻接矩阵 vs 邻接表
 * ================================================================== */
const ADJMATRIX_CODE = `#include <stdio.h>
#define N 4   /* 顶点：0=a 1=b 2=c 3=d */

int main(void) {
    int matrix[N][N] = {0};   /* 邻接矩阵：无向图，对称 */
    /* 边：a-b, a-c, b-d */
    matrix[0][1] = matrix[1][0] = 1;   /* a-b */
    matrix[0][2] = matrix[2][0] = 1;   /* a-c */
    matrix[1][3] = matrix[3][1] = 1;   /* b-d */
    return 0;
}
`

const ADJ_N = 4
const VERTS = ['a', 'b', 'c', 'd']

function adjmatrix(): VizStep[] {
  const steps: VizStep[] = []
  const matrix: number[][] = Array.from({ length: ADJ_N }, () => Array.from({ length: ADJ_N }, () => 0))
  // 邻接表：每个顶点一个链表头 + 若干个邻接结点
  const adjHead: (string | null)[] = Array.from({ length: ADJ_N }, () => null)
  const adjData: Record<string, number> = {}   // 邻接结点 -> 顶点下标
  const adjNext: Record<string, string | null> = {} // 邻接结点 -> 下一个邻接结点
  const adjAddr: Record<string, number> = {}   // 邻接结点 -> 堆区地址

  let edgeCount = 0
  let nextNodeIdx = 0 // 用于给邻接结点分配 key/地址

  // 无向边列表
  const addEdge = (u: number, v: number): void => {
    matrix[u]![v] = 1; matrix[v]![u] = 1
    const kv = 'e' + nextNodeIdx; adjAddr[kv] = 0x9100 + nextNodeIdx * 8; adjData[kv] = v; adjNext[kv] = adjHead[u]!; adjHead[u] = kv; nextNodeIdx += 1
    const ku = 'e' + nextNodeIdx; adjAddr[ku] = 0x9100 + nextNodeIdx * 8; adjData[ku] = u; adjNext[ku] = adjHead[v]!; adjHead[v] = ku; nextNodeIdx += 1
    edgeCount += 1
  }

  const build = (activeCell: string | null): MemoryRegion[] => {
    const matrixCells: MemoryCell[] = []
    for (let i = 0; i < ADJ_N; i += 1) {
      for (let j = 0; j < ADJ_N; j += 1) {
        matrixCells.push(cell(
          'm' + i + j,
          '0x' + (0x8000 + (i * ADJ_N + j) * 4).toString(16),
          String(matrix[i]![j]),
          activeCell === ('m' + i + j) ? 'active' : (matrix[i]![j] === 1 ? 'sorted' : 'idle'),
          'matrix[' + VERTS[i] + '][' + VERTS[j] + ']',
        ))
      }
    }
    // 邻接表
    const adjCells: MemoryCell[] = []
    for (let v = 0; v < ADJ_N; v += 1) {
      adjCells.push(cell(
        'head' + v,
        '0x' + (0x9000 + v * 4).toString(16),
        adjHead[v] === null ? 'NULL' : '→ 0x' + adjAddr[adjHead[v]!]!.toString(16),
        'pivot',
        '顶点 ' + VERTS[v] + ' 的邻接表头',
      ))
      let cur: string | null = adjHead[v]!
      while (cur !== null) {
        adjCells.push(cell(
          cur + '-data', '0x' + adjAddr[cur]!.toString(16), VERTS[adjData[cur]!]!,
          activeCell === cur ? 'active' : 'sorted',
          '邻接结点',
        ))
        const nextKey: string | null = adjNext[cur]!
        cur = nextKey
      }
    }
    return [
      region('matrix', '邻接矩阵（N=' + ADJ_N + '）', matrixCells, '二维数组，无向图关于主对角线对称'),
      region('adjlist', '邻接表（每个顶点一条链）', adjCells, '只存实际存在的边，稀疏图省空间'),
    ]
  }

  steps.push(step(
    '给定无向图：4 个顶点 a、b、c、d，初始没有任何边。先看两种存储方式的内存形态 —— 邻接矩阵是 N×N 的二维数组（每个格子都占位，即使没边）；邻接表则是每个顶点挂一条链表，只存真正存在的边。',
    build(null), { edges: edgeCount }, 5,
  ))

  addEdge(0, 1)
  steps.push(step(
    '加边 a-b：矩阵里 matrix[a][b] 与 matrix[b][a] 同时置 1（无向图对称）；邻接表里 a 链头插 b、b 链头插 a。两种结构同时记录了这条边。',
    build('m01'), { edges: edgeCount }, 8,
  ))

  addEdge(0, 2)
  steps.push(step(
    '加边 a-c：矩阵置 matrix[a][c] = matrix[c][a] = 1；邻接表 a 的链上再头插 c。注意邻接表里 a 的链是 b → c（头插让后加的 c 在链头）。',
    build('m02'), { edges: edgeCount }, 9,
  ))

  addEdge(1, 3)
  steps.push(step(
    '加边 b-d：矩阵置 matrix[b][d] = matrix[d][b] = 1；邻接表 b 的链上头插 d（b 链变 d → a）。现在一共有 3 条边。',
    build('m13'), { edges: edgeCount }, 10,
  ))

  steps.push(step(
    '对比两组存储：邻接矩阵永远是 N×N 格，判断「u、v 是否相邻」是 O(1)，但无论图多稀疏都占 O(N²) 空间；邻接表只存边，空间 O(N+E)，可省一张大表，但要沿链找、判断相邻是 O(度)。稀疏图用邻接表，稠密图用邻接矩阵。',
    build(null), { edges: edgeCount }, 12,
  ))

  return steps
}

/* ================================================================== *
 * 规格表
 * ================================================================== */
export const VIZ3D_SPECS: Viz3DSpec[] = [
  {
    id: 'mem3d-seq-stack',
    title: '顺序栈的入栈与出栈（3D 内存沙盘）',
    category: 'memory',
    chapter: '第3章 栈和队列',
    renderer: 'memory',
    algorithm: 'seqStack',
    counterKeys: ['top'],
    code: SEQ_CODE,
    n: 5,
    related: { chapter: '第3章 栈和队列', keywords: ['栈顶', '入栈', '顺序栈'], max: 3 },
    generate: seqStack,
  },
  {
    id: 'mem3d-circular-queue',
    title: '循环队列的入队出队与判空判满（3D）',
    category: 'memory',
    chapter: '第3章 栈和队列',
    renderer: 'memory',
    algorithm: 'circularQueue',
    counterKeys: ['front', 'rear', 'size'],
    code: CIRC_CODE,
    n: 5,
    related: { chapter: '第3章 栈和队列', keywords: ['队尾', '队列', '循环队列'], max: 3 },
    generate: circularQueue,
  },
  {
    id: 'mem3d-singly-list',
    title: '单链表结点的内存与 next 指针（3D）',
    category: 'memory',
    chapter: '第2章 线性表',
    renderer: 'memory',
    algorithm: 'singlyList',
    counterKeys: ['count'],
    code: SINGLY_CODE,
    n: 3,
    related: { chapter: '第2章 线性表', keywords: ['单链表', '头结点'], max: 3 },
    generate: singlyList,
  },
  {
    id: 'mem3d-doubly-list',
    title: '双向链表的 prior 与 next 双向链接（3D）',
    category: 'memory',
    chapter: '第2章 线性表',
    renderer: 'memory',
    algorithm: 'doublyList',
    counterKeys: ['count'],
    code: DOUBLY_CODE,
    n: 4,
    related: { chapter: '第2章 线性表', keywords: ['双向链表', '插入结点'], max: 3 },
    generate: doublyList,
  },
  {
    id: 'mem3d-hash-open',
    title: '散列开放定址（线性探测）的冲突处理（3D）',
    category: 'memory',
    chapter: '第7章 查找',
    renderer: 'memory',
    algorithm: 'hashOpen',
    counterKeys: ['probes'],
    code: HASH_OPEN_CODE,
    n: 8,
    related: { chapter: '第7章 查找', keywords: ['散列', '查找'], max: 3 },
    generate: hashOpen,
  },
  {
    id: 'mem3d-hash-chain',
    title: '散列链地址法的槽与同义词链（3D）',
    category: 'memory',
    chapter: '第7章 查找',
    renderer: 'memory',
    algorithm: 'hashChain',
    counterKeys: ['count'],
    code: HASH_CHAIN_CODE,
    n: 4,
    related: { chapter: '第7章 查找', keywords: ['散列', '链地址', '查找'], max: 3 },
    generate: hashChain,
  },
  {
    id: 'mem3d-bst-node',
    title: '二叉排序树结点的内存与孩子指针（3D）',
    category: 'memory',
    chapter: '第5章 树和二叉树',
    renderer: 'memory',
    algorithm: 'bstNode',
    counterKeys: ['count'],
    code: BST_CODE,
    n: 4,
    related: { chapter: '第5章 树和二叉树', keywords: ['二叉树', '结点'], max: 3 },
    generate: bstNode,
  },
  {
    id: 'mem3d-adjmatrix',
    title: '邻接矩阵 vs 邻接表的内存形态（3D）',
    category: 'memory',
    chapter: '第6章 图',
    renderer: 'memory',
    algorithm: 'adjmatrix',
    counterKeys: ['edges'],
    code: ADJMATRIX_CODE,
    n: 4,
    related: { chapter: '第6章 图', keywords: ['邻接矩阵', '邻接表', '图'], max: 3 },
    generate: adjmatrix,
  },
]
