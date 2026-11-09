/**
 * 阶段4 追加的 3D 演示 —— 批次 B（函数调用栈：7 个递归算法在内存中的压栈/回退）。
 *
 * 由独立子代理撰写，只新增本文件，禁止改动 generators.ts / catalog.ts / 既有语料。
 * 契约与 generators.ts 完全一致：snapshot.kind 恒为 'memory'（不改 schema），
 * 用 generators.ts 导出的 cell/region/step 助手拼快照。
 *
 * 每个演示都用「调用栈」视角：一个栈帧 = 一个 memory region（形参/局部变量/返回地址 cell），
 * 「压栈」= 新增 region，「弹栈」= 移除 region，返回时更新返回值。
 * 栈区地址取高位 STACK_ADDR（0x7ff0），栈帧向下每层减 0x20，与真实 x86-64 布局方向一致。
 * 前进用快照生成，后退只靠下标回退 —— 每步都是完整状态快照，绝不写逆运算。
 */
import { cell, region, step } from './specHelpers'
import type { Viz3DSpec } from './generators'
import type { MemoryRegion, VizRole, VizStep } from '../viz/types'

/* ------------------------------------------------------------------ *
 * 通用小工具：栈帧 → region。每个栈帧是一个 region，含形参/局部变量、
 * 返回值、返回地址三种 cell。参数个数按算法不同而变。
 * ------------------------------------------------------------------ */
const STACK_BASE = 0x7ff0 // 栈区基址（高位），main 栈帧落在这

interface Param { label: string; value: string; role?: VizRole; note?: string }
interface CallFrame { name: string; role: VizRole; addr: number; params: Param[]; ret?: string }

/** depth 为 1 起的层号（main = 1）。地址 = 基址 - (depth-1)*0x20，向下递减。 */
function frame(name: string, role: VizRole, depth: number, params: Param[], ret?: string): CallFrame {
  return { name, role, addr: STACK_BASE - (depth - 1) * 0x20, params, ...(ret ? { ret } : {}) }
}

/** regions[0] = 栈底（main）。CallStack3D 按数组顺序自下而上堆叠。 */
function frameRegions(frames: CallFrame[]): MemoryRegion[] {
  return frames.map((f) => {
    const key = f.name.replace(/\W/g, '')
    const paramCells = f.params.map((p, i) =>
      cell(`${key}-${p.label}`, '0x' + (f.addr + i * 4).toString(16), p.value, p.role ?? f.role, p.note),
    )
    const retAddr = f.addr + f.params.length * 4
    const retCell = cell(
      `${key}-ret`, '0x' + retAddr.toString(16), f.ret ?? '待定',
      f.role === 'active' ? 'compare' : f.role, '返回值',
    )
    const raCell = cell(
      `${key}-ra`, '0x' + (retAddr + 4).toString(16),
      f.name === 'main' ? '← OS' : '← 上层', 'idle', '返回地址',
    )
    return region(
      key, f.name, [...paramCells, retCell, raCell],
      f.role === 'active' ? '当前正在执行的栈帧（栈顶）' : undefined,
    )
  })
}

/** 数据区数组：低位连续排布，基址 0x1000，元素按下标递增。highlight 可高亮某个下标。 */
function arrRegion(title: string, vals: number[], highlight?: number | null): MemoryRegion {
  return region(
    'array', title,
    vals.map((v, i) =>
      cell(
        'a' + i, '0x' + (0x1000 + i * 4).toString(16), String(v),
        i === highlight ? 'compare' : 'idle',
        i === highlight ? '枢轴/当前比较位' : undefined,
      ),
    ),
    '基址 0x1000，每格 int 占 4 字节',
  )
}

/* ================================================================== *
 * 1. 快速排序的递归划分：quicksort(lo, hi)
 * ================================================================== */
const QS_CODE = `#include <stdio.h>

void quicksort(int a[], int lo, int hi) {
    if (lo >= hi) return;          /* 递归出口 */
    int pivot = a[lo];             /* 取第一个元素作枢轴 */
    int i = lo, j = hi;
    while (i < j) {                /* 划分：左小右大 */
        while (i < j && a[j] >= pivot) j--;
        if (i < j) { a[i] = a[j]; i++; }
        while (i < j && a[i] <= pivot) i++;
        if (i < j) { a[j] = a[i]; j--; }
    }
    a[i] = pivot;                  /* 枢轴就位 */
    quicksort(a, lo, i - 1);       /* 递归左半 */
    quicksort(a, i + 1, hi);       /* 递归右半 */
}

int main(void) {
    int a[6] = {4, 2, 6, 1, 3, 5};
    quicksort(a, 0, 5);
    printf("%d %d %d %d %d %d\\n", a[0], a[1], a[2], a[3], a[4], a[5]);
    return 0;
}
`

function quicksortRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 的栈帧先行落地：没有形参，只有返回地址。数组 {4,2,6,1,3,5} 躺在数据区。接下来要做的是把这 6 个数升序排好。',
    [frameRegions([main])[0]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5])],
    { stackDepth: 1 }, 16,
  ))
  const qs01 = frame('quicksort(0,5)', 'active', 2, [
    { label: 'lo', value: '0', note: '左界' },
    { label: 'hi', value: '5', note: '右界' },
    { label: 'pivot', value: '4', note: 'pivot = a[0]' },
  ])
  const r2 = frameRegions([main, qs01])
  steps.push(step(
    'main 调用 quicksort(0,5)：新栈帧被压下，装好形参 lo=0、hi=5，并当场选枢轴 pivot = a[0] = 4。栈深变为 2 —— 注意 quicksort 此刻还「算不出返回值」，它先要去做划分。',
    [r2[0]!, r2[1]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5], 0)],
    { stackDepth: 2 }, 9,
  ))
  steps.push(step(
    '一趟划分结束：i、j 从两端向中间扫描，凡是比 4 小的甩到左边、比 4 大的留在右边，最后把枢轴 4 放到下标 3。数组变成 {3,2,1,4,6,5}，枢轴 4 已经就位，但它左右两边还没排好 —— quicksort(0,5) 还没返回。',
    [r2[0]!, r2[1]!, arrRegion('划分后的数组 a[]', [3, 2, 1, 4, 6, 5], 3)],
    { stackDepth: 2 }, 11,
  ))
  const qs02 = frame('quicksort(0,2)', 'active', 3, [
    { label: 'lo', value: '0', note: '左界' },
    { label: 'hi', value: '2', note: '右界' },
    { label: 'pivot', value: '3', note: 'pivot = a[0]' },
  ])
  const live4 = [main, { ...qs01, role: 'idle' as VizRole }, qs02]
  const r4 = frameRegions(live4)
  steps.push(step(
    'quicksort(0,5) 先递归左半：调用 quicksort(0,2)，新栈帧压上，lo=0、hi=2，枢轴取 a[0]=3。此刻栈深 3 —— 每压一层，栈就向下多占 0x20 字节的真实空间，这正是「递归深度不能无限」的物理来源。',
    [r4[0]!, r4[1]!, r4[2]!, arrRegion('待排序数组 a[]', [3, 2, 1, 4, 6, 5])],
    { stackDepth: 3 }, 17,
  ))
  steps.push(step(
    'quicksort(0,2) 对 {3,2,1} 做划分：枢轴 3 被放到下标 1，左子区间 {1} 与右子区间 {2} 各自只剩一个元素，下一层递归一旦进入就在 lo>=hi 处触发出口。数组整体变成 {1,2,3,4,6,5}，左半已经基本就位。',
    [r4[0]!, r4[1]!, r4[2]!, arrRegion('左半划分后的数组 a[]', [1, 2, 3, 4, 6, 5], 1)],
    { stackDepth: 3 }, 12,
  ))
  const live5 = [main, { ...qs01, role: 'active' as VizRole }]
  const r5 = frameRegions(live5)
  steps.push(step(
    'quicksort(0,2) 执行完毕，栈帧被弹出销毁，栈深回到 2。控制权交还给 quicksort(0,5)，它已拿到排好的左半部分，接下来去处理右半。这就是递归的「回」阶段：一层一层地把子问题的结果交还给上层。',
    [r5[0]!, r5[1]!, arrRegion('左半完成后的数组 a[]', [1, 2, 3, 4, 6, 5])],
    { stackDepth: 2 }, 18,
  ))
  const qs45 = frame('quicksort(4,5)', 'active', 3, [
    { label: 'lo', value: '4', note: '左界' },
    { label: 'hi', value: '5', note: '右界' },
    { label: 'pivot', value: '6', note: 'pivot = a[4]' },
  ])
  const live6 = [main, { ...qs01, role: 'idle' as VizRole }, qs45]
  const r6 = frameRegions(live6)
  steps.push(step(
    'quicksort(0,5) 接着递归右半：调用 quicksort(4,5)，栈帧压在同样的深度 3 上，lo=4、hi=5，枢轴取 a[4]=6。栈的地址被复用 —— 弹掉的 quicksort(0,2) 占的就是这个位置，现在 quicksort(4,5) 用回同一块内存：这就是栈「同一块区域反复进出」。',
    [r6[0]!, r6[1]!, r6[2]!, arrRegion('待排序数组 a[]', [1, 2, 3, 4, 6, 5])],
    { stackDepth: 3 }, 19,
  ))
  steps.push(step(
    'quicksort(4,5) 对 {6,5} 做一趟划分：5 比 6 小被换到左边，枢轴 6 落到下标 5，{6,5} 变成 {5,6}。右子区间也排好，quicksort(4,5) 随即返回并弹栈。数组整体已是 {1,2,3,4,5,6}。',
    [r6[0]!, r6[1]!, r6[2]!, arrRegion('右半划分后的数组 a[]', [1, 2, 3, 4, 5, 6], 5)],
    { stackDepth: 3 }, 12,
  ))
  const r7 = frameRegions([main])
  steps.push(step(
    'quicksort(0,5) 左右两个子问题都完成，自己也 return，栈被清到只剩 main 一层。压栈、弹栈对称。数组已完全升序 {1,2,3,4,5,6}。这也说明：快排的平均递归深度约 log₂n，最坏（每次划分极不均衡）会退化到 n 层 —— 栈深才是判断递归开销的关键。',
    [r7[0]!, arrRegion('排好序的数组 a[]', [1, 2, 3, 4, 5, 6])],
    { stackDepth: 1 }, 16,
  ))
  return steps
}

/* ================================================================== *
 * 2. 归并排序递归：ms(lo, hi)
 * ================================================================== */
const MS_CODE = `#include <stdio.h>

void merge(int a[], int lo, int mid, int hi) {
    int t[100], i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi)
        t[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i <= mid) t[k++] = a[i++];
    while (j <= hi)  t[k++] = a[j++];
    for (i = lo, k = 0; i <= hi; i++) a[i] = t[k++];
}

void ms(int a[], int lo, int hi) {
    if (lo >= hi) return;          /* 递归出口：单元素 */
    int mid = (lo + hi) / 2;
    ms(a, lo, mid);                /* 递归左半 */
    ms(a, mid + 1, hi);            /* 递归右半 */
    merge(a, lo, mid, hi);         /* 回时归并 */
}

int main(void) {
    int a[6] = {4, 2, 6, 1, 3, 5};
    ms(a, 0, 5);
    printf("%d %d %d %d %d %d\\n", a[0], a[1], a[2], a[3], a[4], a[5]);
    return 0;
}
`

function mergeSortRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 先落地。数组 {4,2,6,1,3,5} 待排。归并排序的策略是「先拆到底、再归并回来」—— 拆的时候只记录区间，真正的排序动作发生在返回路上的 merge。',
    [frameRegions([main])[0]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5])],
    { stackDepth: 1 }, 20,
  ))
  const ms1 = frame('ms(0,5)', 'active', 2, [
    { label: 'lo', value: '0' }, { label: 'hi', value: '5' },
    { label: 'mid', value: '2', note: '(0+5)/2' },
  ])
  const m1 = frameRegions([main, ms1])
  steps.push(step(
    'ms(0,5) 压栈：lo=0、hi=5，算出 mid=(0+5)/2=2。它先递归左半 [0..2] —— 注意此刻数组还没变，只是把区间切了一份。',
    [m1[0]!, m1[1]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5])],
    { stackDepth: 2 }, 23,
  ))
  const ms2 = frame('ms(0,2)', 'active', 3, [
    { label: 'lo', value: '0' }, { label: 'hi', value: '2' },
    { label: 'mid', value: '1', note: '(0+2)/2' },
  ])
  const live2 = [main, { ...ms1, role: 'idle' as VizRole }, ms2]
  const m2 = frameRegions(live2)
  steps.push(step(
    'ms(0,2) 压栈：lo=0、hi=2，mid=1。继续往左拆 [0..1]。栈深 3 —— 归并的递归树深度是 log₂n，6 个数最多 3 层。',
    [m2[0]!, m2[1]!, m2[2]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5])],
    { stackDepth: 3 }, 24,
  ))
  const ms3 = frame('ms(0,1)', 'active', 4, [
    { label: 'lo', value: '0' }, { label: 'hi', value: '1' },
    { label: 'mid', value: '0', note: '(0+1)/2' },
  ])
  const live3 = [main, { ...ms1, role: 'idle' as VizRole }, { ...ms2, role: 'idle' as VizRole }, ms3]
  const m3 = frameRegions(live3)
  steps.push(step(
    'ms(0,1) 压栈：lo=0、hi=1，mid=0。再拆到 [0..0] 与 [1..1] 两个单元素区间。递归在这里一直往深走，每一层都在等下一层返回，所以一路的返回值都是「待定」。',
    [m3[0]!, m3[1]!, m3[2]!, m3[3]!, arrRegion('待排序数组 a[]', [4, 2, 6, 1, 3, 5])],
    { stackDepth: 4 }, 25,
  ))
  const live4 = [main, { ...ms1, role: 'idle' as VizRole }, { ...ms2, role: 'idle' as VizRole }, { ...ms3, role: 'active' as VizRole }]
  const m4 = frameRegions(live4)
  steps.push(step(
    '触底：ms(0,0) 与 ms(1,1) 都是单元素，直接触发 lo>=hi 出口返回。回来后执行 merge(0,1)：把 {4} 和 {2} 归并成 {2,4}，写回下标 0..1。数组变成 {2,4,6,1,3,5}。这是「回」阶段第一次真正的排序动作。',
    [m4[0]!, m4[1]!, m4[2]!, m4[3]!, arrRegion('归并 [0..1] 后', [2, 4, 6, 1, 3, 5])],
    { stackDepth: 4 }, 26,
  ))
  const live5 = [main, { ...ms1, role: 'idle' as VizRole }, { ...ms2, role: 'active' as VizRole }]
  const m5 = frameRegions(live5)
  steps.push(step(
    'ms(0,1) 返回并弹栈。ms(0,2) 现在拿到左半 [0..1]={2,4}，右半 [2..2]={6}，执行 merge(0,2) 归并成 {2,4,6}。数组变成 {2,4,6,1,3,5}。栈深回到 3。',
    [m5[0]!, m5[1]!, m5[2]!, arrRegion('归并 [0..2] 后', [2, 4, 6, 1, 3, 5])],
    { stackDepth: 3 }, 27,
  ))
  const m1b = frameRegions([main, ms1])
  steps.push(step(
    'ms(0,2) 完成，弹出栈帧，栈深回到 2。左半 [0..2] 已排好 {2,4,6}。ms(0,5) 现在去处理右半 [3..5]。注意整个数组目前是 {2,4,6,1,3,5} —— 左右两个半区各自独立，尚未合拢。',
    [m1b[0]!, m1b[1]!, arrRegion('左半就绪', [2, 4, 6, 1, 3, 5])],
    { stackDepth: 2 }, 24,
  ))
  const ms4 = frame('ms(3,5)', 'active', 3, [
    { label: 'lo', value: '3' }, { label: 'hi', value: '5' },
    { label: 'mid', value: '4', note: '(3+5)/2' },
  ])
  const live6 = [main, { ...ms1, role: 'idle' as VizRole }, ms4]
  const m6 = frameRegions(live6)
  steps.push(step(
    'ms(0,5) 递归右半：ms(3,5) 压栈，lo=3、hi=5，mid=4。它把 [3..5]={1,3,5} 继续拆成 [3..4] 与 [5..5]，然后归并成 {1,3,5}。右半也排好了。',
    [m6[0]!, m6[1]!, m6[2]!, arrRegion('右半就绪', [2, 4, 6, 1, 3, 5])],
    { stackDepth: 3 }, 25,
  ))
  const live7 = [main, { ...ms1, role: 'active' as VizRole }]
  const m7 = frameRegions(live7)
  steps.push(step(
    'ms(3,5) 弹栈，控制权回到 ms(0,5)。此时左半 {2,4,6} 与右半 {1,3,5} 都已有序，执行最后一次 merge(0,5)：双指针比较，逐元素归并成 {1,2,3,4,5,6}。这是整次递归的收尾。',
    [m7[0]!, m7[1]!, arrRegion('最终归并 [0..5]', [1, 2, 3, 4, 5, 6])],
    { stackDepth: 2 }, 28,
  ))
  const m8 = frameRegions([main])
  steps.push(step(
    'ms(0,5) 返回，栈只剩 main 一层。数组完全升序。归并排序的递归栈深恒为 log₂n（这里约 3 层），但 merge 每层都要一块与原序列等长的辅助数组 —— 所以归并的空间复杂度是 O(n)，这来自「辅助空间」，不是递归栈本身。',
    [m8[0]!, arrRegion('排好序的数组 a[]', [1, 2, 3, 4, 5, 6])],
    { stackDepth: 1 }, 20,
  ))
  return steps
}

/* ================================================================== *
 * 3. 汉诺塔递归：hanoi(n, from, to, aux)
 * ================================================================== */
const HANOI_CODE = `#include <stdio.h>

void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {                  /* 递归出口 */
        printf("move %d: %c -> %c\\n", n, from, to);
        return;
    }
    hanoi(n - 1, from, aux, to);   /* 先把上面 n-1 片挪到辅助柱 */
    printf("move %d: %c -> %c\\n", n, from, to);
    hanoi(n - 1, aux, to, from);   /* 再把 n-1 片从辅助柱挪到目标柱 */
}

int main(void) {
    hanoi(3, 'A', 'C', 'B');
    return 0;
}
`

function hanoiRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 落地。三片圆盘在 A 柱，要借助 B 柱全部移到 C 柱，条件是每次只能挪一片、大盘不能压在小盘上。解法不是「一步步怎么挪」，而是一个递归：把上面 n-1 片当作一个整体。',
    [frameRegions([main])[0]!],
    { stackDepth: 1 }, 16,
  ))
  const h1 = frame('hanoi(3,A,C,B)', 'active', 2, [
    { label: 'n', value: '3', note: '盘数' },
    { label: 'from', value: 'A' }, { label: 'to', value: 'C' }, { label: 'aux', value: 'B' },
  ])
  const hn1 = frameRegions([main, h1])
  steps.push(step(
    'hanoi(3,A,C,B) 压栈：n=3、from=A、to=C、aux=B。它要挪 3 片，于是先递归 hanoi(2,A,B,C) —— 把上面两片先挪到辅助柱 B，才能腾出最下面那一片。栈深 2。',
    [hn1[0]!, hn1[1]!],
    { stackDepth: 2 }, 19,
  ))
  const h2 = frame('hanoi(2,A,B,C)', 'active', 3, [
    { label: 'n', value: '2' }, { label: 'from', value: 'A' },
    { label: 'to', value: 'B' }, { label: 'aux', value: 'C' },
  ])
  const live2 = [main, { ...h1, role: 'idle' as VizRole }, h2]
  const hn2 = frameRegions(live2)
  steps.push(step(
    'hanoi(2,A,B,C) 压栈：它要把 A 上 2 片挪到 B（借 C）。再递归一层 hanoi(1,A,C,B) —— 只剩 1 片时是出口，直接搬。递归树在这里延伸，栈深 3。',
    [hn2[0]!, hn2[1]!, hn2[2]!],
    { stackDepth: 3 }, 20,
  ))
  const h3 = frame('hanoi(1,A,C,B)', 'active', 4, [
    { label: 'n', value: '1' }, { label: 'from', value: 'A' },
    { label: 'to', value: 'C' }, { label: 'aux', value: 'B' },
  ])
  const live3 = [main, { ...h1, role: 'idle' as VizRole }, { ...h2, role: 'idle' as VizRole }, h3]
  const hn3 = frameRegions(live3)
  steps.push(step(
    'hanoi(1,A,C,B) 压栈：n=1 命中出口 —— 把第 1 片从 A 挪到 C。这是最深一层，栈深 4。越到叶子，移动就越简单：不用再拆。',
    [hn3[0]!, hn3[1]!, hn3[2]!, hn3[3]!],
    { stackDepth: 4 }, 12,
  ))
  const live4 = [main, { ...h1, role: 'idle' as VizRole }, { ...h2, role: 'active' as VizRole }]
  const hn4 = frameRegions(live4)
  steps.push(step(
    'hanoi(1,A,C,B) 弹栈。回到 hanoi(2,A,B,C)：现在把第 2 片从 A 挪到 B，然后递归 hanoi(1,C,B,A) 把刚才挪到 C 的第 1 片再挪到 B。栈深回到 3。',
    [hn4[0]!, hn4[1]!, hn4[2]!],
    { stackDepth: 3 }, 21,
  ))
  const h4 = frame('hanoi(1,C,B,A)', 'active', 4, [
    { label: 'n', value: '1' }, { label: 'from', value: 'C' },
    { label: 'to', value: 'B' }, { label: 'aux', value: 'A' },
  ])
  const live5 = [main, { ...h1, role: 'idle' as VizRole }, { ...h2, role: 'idle' as VizRole }, h4]
  const hn5 = frameRegions(live5)
  steps.push(step(
    'hanoi(1,C,B,A) 压栈：把第 1 片从 C 挪到 B。至此 A 上 2 片全部到了 B，hanoi(2,A,B,C) 使命完成，弹栈。',
    [hn5[0]!, hn5[1]!, hn5[2]!, hn5[3]!],
    { stackDepth: 4 }, 12,
  ))
  const live6 = [main, { ...h1, role: 'active' as VizRole }]
  const hn6 = frameRegions(live6)
  steps.push(step(
    '回到 hanoi(3,A,C,B)：此时 B 柱已摞好 2 片，最下面的第 3 片可以直接从 A 挪到 C。这一步没有递归 —— 它正是递归体里「拆到一半」时记录下来的那次移动。栈深回到 2。',
    [hn6[0]!, hn6[1]!],
    { stackDepth: 2 }, 21,
  ))
  const h5 = frame('hanoi(2,B,C,A)', 'active', 3, [
    { label: 'n', value: '2' }, { label: 'from', value: 'B' },
    { label: 'to', value: 'C' }, { label: 'aux', value: 'A' },
  ])
  const live7 = [main, { ...h1, role: 'idle' as VizRole }, h5]
  const hn7 = frameRegions(live7)
  steps.push(step(
    'hanoi(3,A,C,B) 再递归 hanoi(2,B,C,A)：把 B 上的 2 片挪到 C（借 A）。递归的最后一个子问题开始 —— 栈又一次向下长。',
    [hn7[0]!, hn7[1]!, hn7[2]!],
    { stackDepth: 3 }, 22,
  ))
  const h6 = frame('hanoi(1,B,A,C)', 'active', 4, [
    { label: 'n', value: '1' }, { label: 'from', value: 'B' },
    { label: 'to', value: 'A' }, { label: 'aux', value: 'C' },
  ])
  const live8 = [main, { ...h1, role: 'idle' as VizRole }, { ...h5, role: 'idle' as VizRole }, h6]
  const hn8 = frameRegions(live8)
  steps.push(step(
    'hanoi(1,B,A,C) 压栈：把第 1 片从 B 挪到 A；随后 hanoi(2,B,C,A) 把第 2 片从 B 挪到 C，再 hanoi(1,A,C,B) 把第 1 片从 A 挪到 C。三片全部到位。',
    [hn8[0]!, hn8[1]!, hn8[2]!, hn8[3]!],
    { stackDepth: 4 }, 12,
  ))
  const hn9 = frameRegions([main])
  steps.push(step(
    '所有子问题完成，栈逐层弹空，回到 main。观察：3 片时总共 2³−1 = 7 次移动，递归树有 7 个叶子；栈的**最大深度**是 3（等于盘数），但**总调用次数**是 7 —— 汉诺塔的时间复杂度 O(2ⁿ) 由调用次数决定，空间 O(n) 由栈深决定，二者不是一回事。',
    [hn9[0]!],
    { stackDepth: 1 }, 16,
  ))
  return steps
}

/* ================================================================== *
 * 4. 二叉排序树查找递归：bstSearch(t, key)
 * ================================================================== */
const BST_CODE = `#include <stdio.h>
#include <stdlib.h>

typedef struct node { int key; struct node *l, *r; } Node;

Node *bstSearch(Node *t, int key) {
    if (t == NULL) return NULL;             /* 走到空结点：没找到 */
    if (key == t->key)  return t;           /* 命中 */
    if (key < t->key)   return bstSearch(t->l, key);  /* 左子树 */
    return bstSearch(t->r, key);            /* 右子树 */
}

int main(void) {
    /* 依次插入 50 30 70 20 40 60 80 建成一棵二叉排序树 */
    Node *root = NULL;
    /* ...构造树省略... */
    Node *p = bstSearch(root, 60);
    printf("%d\\n", p ? p->key : -1);
    return 0;
}
`

function bstSearchRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 落地。二叉排序树满足左子树 < 根 < 右子树，因此查找可以像折半一样剪枝：从根出发，每走一层就排除一半。现在要找 key=60。',
    [frameRegions([main])[0]!],
    { stackDepth: 1 }, 20,
  ))
  const b1 = frame('bstSearch(50,60)', 'active', 2, [
    { label: 'node', value: '50', note: '当前结点 key' },
    { label: 'key', value: '60', note: '待查关键字' },
  ])
  const bf1 = frameRegions([main, b1])
  steps.push(step(
    'bstSearch(50,60) 压栈：当前结点 key=50，待查 key=60。比较 60 > 50，于是走右子树。栈深 2。每次只往一个方向走，这是「线性递归」—— 栈深等于树高。',
    [bf1[0]!, bf1[1]!],
    { stackDepth: 2 }, 13,
  ))
  const b2 = frame('bstSearch(70,60)', 'active', 3, [
    { label: 'node', value: '70' }, { label: 'key', value: '60' },
  ])
  const bf2 = frameRegions([main, b1, b2])
  steps.push(step(
    'bstSearch(70,60) 压栈：进入右子树的根 70。比较 60 < 70，走左子树。嵌套调用让栈向下长，每一层都记住「我是从哪个结点来的、下一步该回谁」。',
    [bf2[0]!, bf2[1]!, bf2[2]!],
    { stackDepth: 3 }, 15,
  ))
  const b3 = frame('bstSearch(60,60)', 'active', 4, [
    { label: 'node', value: '60' }, { label: 'key', value: '60' },
  ])
  const bf3 = frameRegions([main, b1, b2, b3])
  steps.push(step(
    'bstSearch(60,60) 压栈：进入左子树根 60。比较 60 == 60，命中！直接返回指向该结点的指针。栈深 4 —— 这是本次查找的最深处，也就是 BST 查找的「路径长度」。',
    [bf3[0]!, bf3[1]!, bf3[2]!, bf3[3]!],
    { stackDepth: 4 }, 15,
  ))
  const live4 = [main, { ...b1, role: 'idle' as VizRole }, { ...b2, role: 'idle' as VizRole }, { ...b3, role: 'active' as VizRole, ret: '&60' }]
  const bf4 = frameRegions(live4)
  steps.push(step(
    'bstSearch(60,60) 返回指针 &60，值传到 bstSearch(70,60)；bstSearch(70,60) 也随之返回，把结果原样往上抛。返回值不是新算出来的，而是顺着调用链一路传回 —— 这就是「返回时更新返回值」。',
    [bf4[0]!, bf4[1]!, bf4[2]!, bf4[3]!],
    { stackDepth: 4 }, 15,
  ))
  const live5 = [main, { ...b1, role: 'active' as VizRole }]
  const bf5 = frameRegions(live5)
  steps.push(step(
    '各层依次弹栈，最终 bstSearch(root,60) 把命中结点回传给 main。栈被清空，只剩 main。若查到的是最末端的叶子，路径长度 = 树高；若查一个不存在的值，会一直递归到 NULL 结点才返回 NULL —— 那条更长的路径就是「查找失败要走到底」。',
    [bf5[0]!, bf5[1]!],
    { stackDepth: 2 }, 20,
  ))
  const bf6 = frameRegions([main])
  steps.push(step(
    'main 打印结果 60 后结束。二叉排序树的平均成功查找长度 ≈ 1.4·log₂n，前提是树**平衡**；若按有序序列插入而退化成一棵单支树，查找就变成顺序查找，栈深 = n。这就是为什么后面要用平衡二叉树（AVL）。',
    [bf6[0]!],
    { stackDepth: 1 }, 20,
  ))
  return steps
}

/* ================================================================== *
 * 5. 图的深度优先遍历递归：dfs(v)
 * ================================================================== */
const DFS_CODE = `#include <stdio.h>

#define N 6
int adj[N][N] = {0};     /* 邻接矩阵，顶点 1..5 */
int visited[N] = {0};

void dfs(int v) {
    visited[v] = 1;                       /* 先标记再递归 */
    for (int u = 1; u < N; u++)
        if (adj[v][u] && !visited[u]) dfs(u);
}

int main(void) {
    /* 边：1-2, 1-3, 2-4, 4-5 */
    adj[1][2] = adj[2][1] = 1;
    adj[1][3] = adj[3][1] = 1;
    adj[2][4] = adj[4][2] = 1;
    adj[4][5] = adj[5][4] = 1;
    dfs(1);
    return 0;
}
`

function dfsRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const visitedRegion = (visited: number[]): MemoryRegion =>
    region(
      'visited', 'visited[] 访问标记',
      [1, 2, 3, 4, 5].map((v) =>
        cell(
          'v' + v, '0x' + (0x1000 + v * 4).toString(16),
          String(visited.includes(v) ? 1 : 0),
          visited.includes(v) ? 'compare' : 'idle',
          visited.includes(v) ? '已访问' : undefined,
        ),
      ),
      '0 = 未访问，1 = 已访问',
    )
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 落地。图有 5 个顶点、4 条边（1-2、1-3、2-4、4-5）。DFS 的策略是「一条路走到黑，走不通再回头」。关键是用 visited[] 数组防止重复访问 —— 没有它就会死循环。',
    [frameRegions([main])[0]!, visitedRegion([])],
    { stackDepth: 1 }, 25,
  ))
  const d1 = frame('dfs(1)', 'active', 2, [{ label: 'v', value: '1', note: '当前顶点' }])
  const df1 = frameRegions([main, d1])
  steps.push(step(
    'main 调 dfs(1)：栈帧压上，v=1。先标记 visited[1]=1，然后遍历 1 的邻居。第一个邻居是 2 且未访问，于是递归 dfs(2)。栈深 2。',
    [df1[0]!, df1[1]!, visitedRegion([1])],
    { stackDepth: 2 }, 26,
  ))
  const d2 = frame('dfs(2)', 'active', 3, [{ label: 'v', value: '2' }])
  const df2 = frameRegions([main, d1, d2])
  steps.push(step(
    'dfs(2) 压栈：v=2。标记 visited[2]=1，邻居 4 未访问，递归 dfs(4)。每一个邻居都是一次新的压栈 —— 图的递归深度就是「沿一条边走到头」的长度。',
    [df2[0]!, df2[1]!, df2[2]!, visitedRegion([1, 2])],
    { stackDepth: 3 }, 26,
  ))
  const d3 = frame('dfs(4)', 'active', 4, [{ label: 'v', value: '4' }])
  const df3 = frameRegions([main, d1, d2, d3])
  steps.push(step(
    'dfs(4) 压栈：v=4。标记 visited[4]=1，邻居 5 未访问，递归 dfs(5)。栈深 4 —— 从顶点 1 走到 4 已经用了 4 层栈。',
    [df3[0]!, df3[1]!, df3[2]!, df3[3]!, visitedRegion([1, 2, 4])],
    { stackDepth: 4 }, 26,
  ))
  const d4 = frame('dfs(5)', 'active', 5, [{ label: 'v', value: '5' }])
  const live4 = [main, { ...d1, role: 'idle' as VizRole }, { ...d2, role: 'idle' as VizRole }, { ...d3, role: 'idle' as VizRole }, d4]
  const df4 = frameRegions(live4)
  steps.push(step(
    'dfs(5) 压栈：v=5。标记 visited[5]=1。5 没有未访问的邻居，for 循环走完就直接返回 —— 这是本次递归的叶子。栈深 5，最深。',
    [df4[0]!, df4[1]!, df4[2]!, df4[3]!, df4[4]!, visitedRegion([1, 2, 4, 5])],
    { stackDepth: 5 }, 26,
  ))
  const live5 = [main, { ...d1, role: 'idle' as VizRole }, { ...d2, role: 'idle' as VizRole }, { ...d3, role: 'active' as VizRole }]
  const df5 = frameRegions(live5)
  steps.push(step(
    'dfs(5) 弹栈，回到 dfs(4)。4 的邻居 5 已访问、不再有新分支，dfs(4) 也返回并弹栈。这就是「回退」：一个分支走完，把控制权交回调用它的上一层，继续扫描那个顶点剩下的邻居。',
    [df5[0]!, df5[1]!, df5[2]!, df5[3]!, visitedRegion([1, 2, 4, 5])],
    { stackDepth: 4 }, 27,
  ))
  const live6 = [main, { ...d1, role: 'active' as VizRole }]
  const df6 = frameRegions(live6)
  steps.push(step(
    '一路回退到 dfs(2)、dfs(1)。dfs(1) 的 for 循环继续扫描：邻居 2 已访问、邻居 3 未访问，于是递归 dfs(3)。注意这一路（1→2→4→5）的栈已经全部弹空，这是全新的一条路径。',
    [df6[0]!, df6[1]!, visitedRegion([1, 2, 4, 5])],
    { stackDepth: 2 }, 27,
  ))
  const d7 = frame('dfs(3)', 'active', 3, [{ label: 'v', value: '3' }])
  const live7 = [main, { ...d1, role: 'idle' as VizRole }, d7]
  const df7 = frameRegions(live7)
  steps.push(step(
    'dfs(3) 压栈：v=3。标记 visited[3]=1，没有未访问邻居，随即返回。5 个顶点全部被访问，遍历完成。DFS 的访问序列是 1→2→4→5→3。',
    [df7[0]!, df7[1]!, df7[2]!, visitedRegion([1, 2, 3, 4, 5])],
    { stackDepth: 3 }, 25,
  ))
  const df8 = frameRegions([main])
  steps.push(step(
    'dfs(3) 弹栈，main 结束。整张图的遍历靠的就是「递归压栈 + visited 防重」：压栈代表深入，弹栈代表回溯。这也是为什么 DFS 天然用递归实现、而 BFS 用队列 —— 一个靠系统栈，一个靠显式队列。若图有多个连通分量，需要在主程序里对每个未访问顶点再调一次 dfs。',
    [df8[0]!, visitedRegion([1, 2, 3, 4, 5])],
    { stackDepth: 1 }, 25,
  ))
  return steps
}

/* ================================================================== *
 * 6. 折半查找递归：bs(lo, hi)
 * ================================================================== */
const BS_CODE = `#include <stdio.h>

int bs(int a[], int lo, int hi, int key) {
    if (lo > hi) return -1;        /* 区间空：没找到 */
    int mid = (lo + hi) / 2;
    if (key == a[mid]) return mid; /* 命中 */
    if (key < a[mid]) return bs(a, lo, mid - 1, key);  /* 左半 */
    return bs(a, mid + 1, hi, key);                     /* 右半 */
}

int main(void) {
    int a[11] = {5,13,19,21,37,56,64,75,80,88,92};
    int idx = bs(a, 0, 10, 37);
    printf("%d\\n", idx);
    return 0;
}
`

function binarySearchRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const ARR = [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92]
  const arrRegion = (active: number | null): MemoryRegion =>
    region(
      'array', '有序表 a[]（11 个元素）',
      ARR.map((v, i) =>
        cell(
          'a' + i, '0x' + (0x1000 + i * 4).toString(16), String(v),
          i === active ? 'compare' : 'idle',
          i === active ? `当前 mid 位置 ${i}` : undefined,
        ),
      ),
      '基址 0x1000，每格 int 4 字节',
    )
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 落地。表中 11 个元素已按升序排好，要查 key=37。折半查找的前提是「有序表 + 顺序存储」—— 只有这样才能靠下标直接跳到中间，像查字典一样每次砍掉一半。',
    [frameRegions([main])[0]!, arrRegion(null)],
    { stackDepth: 1 }, 21,
  ))
  const b1 = frame('bs(0,10,37)', 'active', 2, [
    { label: 'lo', value: '0' }, { label: 'hi', value: '10' },
    { label: 'mid', value: '5', note: '(0+10)/2' },
  ])
  const bf1 = frameRegions([main, b1])
  steps.push(step(
    'bs(0,10,37) 压栈：lo=0、hi=10，算 mid=(0+10)/2=5，a[5]=56。key=37 < 56，说明目标在左半区，于是递归 bs(0,4)。一趟比较就能把范围从 11 砍到 5，这就是折半的效率来源。',
    [bf1[0]!, bf1[1]!, arrRegion(5)],
    { stackDepth: 2 }, 12,
  ))
  const b2 = frame('bs(0,4,37)', 'active', 3, [
    { label: 'lo', value: '0' }, { label: 'hi', value: '4' },
    { label: 'mid', value: '2', note: '(0+4)/2' },
  ])
  const bf2 = frameRegions([main, b1, b2])
  steps.push(step(
    'bs(0,4,37) 压栈：lo=0、hi=4，mid=2，a[2]=19。key=37 > 19，目标在右半区，递归 bs(3,4)。栈深 3。',
    [bf2[0]!, bf2[1]!, bf2[2]!, arrRegion(2)],
    { stackDepth: 3 }, 12,
  ))
  const b3 = frame('bs(3,4,37)', 'active', 4, [
    { label: 'lo', value: '3' }, { label: 'hi', value: '4' },
    { label: 'mid', value: '3', note: '(3+4)/2' },
  ])
  const bf3 = frameRegions([main, b1, b2, b3])
  steps.push(step(
    'bs(3,4,37) 压栈：lo=3、hi=4，mid=3，a[3]=21。key=37 > 21，递归 bs(4,4)。查找范围缩到只剩一个元素。',
    [bf3[0]!, bf3[1]!, bf3[2]!, bf3[3]!, arrRegion(3)],
    { stackDepth: 4 }, 12,
  ))
  const b4 = frame('bs(4,4,37)', 'active', 5, [
    { label: 'lo', value: '4' }, { label: 'hi', value: '4' },
    { label: 'mid', value: '4', note: '(4+4)/2' },
  ])
  const bf4 = frameRegions([main, b1, b2, b3, b4])
  steps.push(step(
    'bs(4,4,37) 压栈：lo=4、hi=4，mid=4，a[4]=37。key == 37，命中！返回下标 4。栈深 5 —— 对 11 个元素最多比较 ⌈log₂(11)⌉≈4 次，这就是折半查找的效率。',
    [bf4[0]!, bf4[1]!, bf4[2]!, bf4[3]!, bf4[4]!, arrRegion(4)],
    { stackDepth: 5 }, 13,
  ))
  const live4 = [main, { ...b1, role: 'idle' as VizRole }, { ...b2, role: 'idle' as VizRole }, { ...b3, role: 'idle' as VizRole }, { ...b4, role: 'active' as VizRole, ret: '4' }]
  const bf5 = frameRegions(live4)
  steps.push(step(
    'bs(4,4,37) 返回下标 4，各层依次弹栈，把结果顺着调用链传回 main。整个过程不存在「回算」—— 折半查找是线性递归，命中后一路原样返回，栈深等于比较次数，即 O(log n)。',
    [bf5[0]!, bf5[1]!, bf5[2]!, bf5[3]!, bf5[4]!, arrRegion(4)],
    { stackDepth: 5 }, 14,
  ))
  const bf6 = frameRegions([main])
  steps.push(step(
    '栈只剩 main 一层，main 打印下标 4。补充：若查 key=40（表里没有），会一路递归到 lo>hi —— 区间为空才返回 -1，那条路径的深度同样是 O(log n)。这也解释了折半查找**为什么不能用于链表**：链表无法 O(1) 跳到 mid，即使逻辑上折半，每次定位都要从头走。',
    [bf6[0]!, arrRegion(null)],
    { stackDepth: 1 }, 21,
  ))
  return steps
}

/* ================================================================== *
 * 7. 数组求和递归：sum(a, n)
 * ================================================================== */
const SUM_CODE = `#include <stdio.h>

int sum(int a[], int n) {
    if (n == 0) return 0;              /* 递归出口 */
    return a[n - 1] + sum(a, n - 1);   /* 当前值 + 前 n-1 项和 */
}

int main(void) {
    int a[4] = {1, 2, 3, 4};
    printf("%d\\n", sum(a, 4));
    return 0;
}
`

function arraySumRecursion(): VizStep[] {
  const steps: VizStep[] = []
  const arrRegion = (vals: number[]): MemoryRegion =>
    region(
      'array', '数组 a[]（4 个元素）',
      vals.map((v, i) => cell('a' + i, '0x' + (0x1000 + i * 4).toString(16), String(v), 'idle')),
      '基址 0x1000，每格 int 4 字节',
    )
  const main = frame('main', 'active', 1, [])
  steps.push(step(
    'main 落地，数组 {1,2,3,4}。sum(a,n) 定义为「前 n 项之和」= a[n-1] + sum(a,n-1)，即「当前这一项 + 前面已经算好的和」。这是一种**线性递归**，栈会一层层压到 n=0。',
    [frameRegions([main])[0]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 1 }, 18,
  ))
  const s1 = frame('sum(4)', 'active', 2, [{ label: 'n', value: '4', note: '当前项数' }])
  const sf1 = frameRegions([main, s1])
  steps.push(step(
    'main 调 sum(4)：栈帧压上，n=4。它要计算 a[3] + sum(3) —— 可 sum(3) 还没算出来，于是必须先递归。栈深 2，返回值仍是「待定」。',
    [sf1[0]!, sf1[1]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 2 }, 19,
  ))
  const s2 = frame('sum(3)', 'active', 3, [{ label: 'n', value: '3' }])
  const sf2 = frameRegions([main, s1, s2])
  steps.push(step(
    'sum(3) 压栈：n=3，要算 a[2] + sum(2)，又得先递归 sum(2)。栈深 3。每一层都在「等下一层返回」，所以化身成一座等待结算的塔。',
    [sf2[0]!, sf2[1]!, sf2[2]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 3 }, 19,
  ))
  const s3 = frame('sum(2)', 'active', 4, [{ label: 'n', value: '2' }])
  const sf3 = frameRegions([main, s1, s2, s3])
  steps.push(step(
    'sum(2) 压栈：n=2，要算 a[1] + sum(1)。栈深 4。',
    [sf3[0]!, sf3[1]!, sf3[2]!, sf3[3]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 4 }, 19,
  ))
  const s4 = frame('sum(1)', 'active', 5, [{ label: 'n', value: '1' }])
  const sf4 = frameRegions([main, s1, s2, s3, s4])
  steps.push(step(
    'sum(1) 压栈：n=1，要算 a[0] + sum(0)。栈深 5。',
    [sf4[0]!, sf4[1]!, sf4[2]!, sf4[3]!, sf4[4]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 5 }, 19,
  ))
  const s5 = frame('sum(0)', 'active', 6, [{ label: 'n', value: '0' }])
  const live5 = [main, { ...s1, role: 'idle' as VizRole }, { ...s2, role: 'idle' as VizRole }, { ...s3, role: 'idle' as VizRole }, { ...s4, role: 'idle' as VizRole }, s5]
  const sf5 = frameRegions(live5)
  steps.push(step(
    'sum(0) 压栈：n=0，命中出口 if(n==0) return 0，不再递归。这是本次递归的**最深处**，栈深 6。n=0 就是「空数组的和为 0」—— 递归必须有一个能直接结算的基准情形，否则会无限压栈直到栈溢出。',
    [sf5[0]!, sf5[1]!, sf5[2]!, sf5[3]!, sf5[4]!, sf5[5]!, arrRegion([1, 2, 3, 4])],
    { stackDepth: 6 }, 9,
  ))
  // 从底向上逐层结算：每层弹出后，下一层的返回值被填好
  const settle: { depth: number; ret?: string; desc: string }[] = [
    { depth: 5, ret: '1', desc: 'sum(0) 返回 0 —— 递归触底后的第一个回退。sum(1) 拿到操作数，算出 1 + 0 = 1；这一帧的返回值第一次不再是「待定」。栈深 5，栈顶是 sum(1)。' },
    { depth: 4, ret: '3', desc: 'sum(1) 弹栈，栈深回到 4。sum(2) 结算：2 + 1 = 3 。' },
    { depth: 3, ret: '6', desc: 'sum(2) 弹栈，栈深回到 3。sum(3) 结算：3 + 3 = 6 。' },
    { depth: 2, ret: '10', desc: 'sum(3) 弹栈，栈深回到 2。sum(4) 结算：4 + 6 = 10 。' },
    { depth: 1, desc: 'sum(4) 弹栈，栈深回到 1，main 打印结果 10。整个递归：压栈 6 层、弹栈 6 层，完全对称。若把 n 换成 100000，栈就要压 10 万层 —— 这就是「递归深度不能无限」的教训；很多递归（尤其这种线性递归）改写为迭代版本可彻底避免栈溢出。' },
  ]
  for (const st of settle) {
    const frames: CallFrame[] = []
    for (let d = 1; d <= st.depth; d += 1) {
      const isMain = d === 1
      const isTop = d === st.depth
      frames.push(frame(
        isMain ? 'main' : `sum(${6 - d})`,
        isTop ? 'active' : 'idle',
        d,
        isMain ? [] : [{ label: 'n', value: String(6 - d) }],
        isTop && st.ret !== undefined ? st.ret : undefined,
      ))
    }
    steps.push(step(
      st.desc,
      [...frameRegions(frames), arrRegion([1, 2, 3, 4])],
      { stackDepth: st.depth }, 10,
    ))
  }
  return steps
}

/* ================================================================== *
 * 规格表：scripts/gen-viz3d.ts 按此逐条生成 + 校验 + 落盘
 * ================================================================== */
export const VIZ3D_SPECS: Viz3DSpec[] = [
  {
    id: 'mem3d-quick-recursion',
    title: '快速排序的递归划分（3D 调用栈）',
    category: 'memory',
    chapter: '第8章 排序',
    renderer: 'memory',
    algorithm: 'quicksortRecursion',
    counterKeys: ['stackDepth'],
    code: QS_CODE,
    n: 6,
    related: { chapter: '第8章 排序', keywords: ['快速排序', '划分', '递归'], max: 3 },
    generate: quicksortRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-merge-recursion',
    title: '归并排序的递归拆合（3D 调用栈）',
    category: 'memory',
    chapter: '第8章 排序',
    renderer: 'memory',
    algorithm: 'mergeSortRecursion',
    counterKeys: ['stackDepth'],
    code: MS_CODE,
    n: 6,
    related: { chapter: '第8章 排序', keywords: ['归并', '递归'], max: 3 },
    generate: mergeSortRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-hanoi',
    title: '汉诺塔的递归树（3D 调用栈）',
    category: 'memory',
    chapter: '第3章 栈和队列',
    renderer: 'memory',
    algorithm: 'hanoiRecursion',
    counterKeys: ['stackDepth'],
    code: HANOI_CODE,
    n: 3,
    related: { chapter: '第3章 栈和队列', keywords: ['递归', '栈'], max: 3 },
    generate: hanoiRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-bst-search-recursion',
    title: '二叉排序树查找的递归（3D 调用栈）',
    category: 'memory',
    chapter: '第5章 树和二叉树',
    renderer: 'memory',
    algorithm: 'bstSearchRecursion',
    counterKeys: ['stackDepth'],
    code: BST_CODE,
    n: 5,
    related: { chapter: '第5章 树和二叉树', keywords: ['二叉树', '结点'], max: 3 },
    generate: bstSearchRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-dfs-recursion',
    title: '图的深度优先遍历的递归（3D 调用栈）',
    category: 'memory',
    chapter: '第6章 图',
    renderer: 'memory',
    algorithm: 'dfsRecursion',
    counterKeys: ['stackDepth'],
    code: DFS_CODE,
    n: 5,
    related: { chapter: '第6章 图', keywords: ['深度优先', '遍历'], max: 3 },
    generate: dfsRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-binary-search-recursion',
    title: '折半查找的递归（3D 调用栈）',
    category: 'memory',
    chapter: '第7章 查找',
    renderer: 'memory',
    algorithm: 'binarySearchRecursion',
    counterKeys: ['stackDepth'],
    code: BS_CODE,
    n: 11,
    related: { chapter: '第7章 查找', keywords: ['折半查找', 'ASL'], max: 3 },
    generate: binarySearchRecursion as unknown as Viz3DSpec['generate'],
  },
  {
    id: 'mem3d-array-sum-recursion',
    title: '数组求和的递归（3D 调用栈）',
    category: 'memory',
    chapter: '第6章 数组',
    renderer: 'memory',
    algorithm: 'arraySumRecursion',
    counterKeys: ['stackDepth'],
    code: SUM_CODE,
    n: 4,
    related: { chapter: '第6章 数组', keywords: ['数组'], max: 3 },
    generate: arraySumRecursion as unknown as Viz3DSpec['generate'],
  },
]
