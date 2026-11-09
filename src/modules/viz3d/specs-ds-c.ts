/**
 * 阶段4 追加的 3D 演示 —— 批次 C（数组/矩阵内存立方体：逻辑下标 ↔ 物理地址、压缩存储）。
 *
 * 由独立子代理撰写，只新增本文件，禁止改动 generators.ts / catalog.ts / 既有语料。
 * 契约与 generators.ts 完全一致：snapshot.kind 恒为 'memory'（不改 schema），
 * 用 generators.ts 导出的 cell/region/step 助手拼快照。
 *
 * 7 个演示都围绕「逻辑下标 ↔ 物理地址」的映射或「压缩存储」：
 *   1. mem3d-2d-rowmajor   二维数组行优先   addr(i,j)=base+(i*N+j)*size
 *   2. mem3d-2d-colmajor   二维数组列优先   addr(i,j)=base+(j*M+i)*size
 *   3. mem3d-symmetric-store  对称矩阵下三角压缩   k=i(i+1)/2+j
 *   4. mem3d-triangle-store  三对角/上三角压缩存储
 *   5. mem3d-sparse-triplet  稀疏矩阵三元组顺序表
 *   6. mem3d-array-base      一维数组基址+下标   a[k]=base+k*size
 *   7. mem3d-3d-array        三维数组行优先   addr=base+(i*n*p+j*p+k)*size
 */
import { cell, region, step } from './specHelpers'
import type { Viz3DSpec } from './generators'

/* ================================================================== *
 * 1. 二维数组行优先：addr(i,j) = base + (i*N + j)*sizeof
 * ================================================================== */
const RM_CODE = `#include <stdio.h>

int main(void) {
    int a[3][4] = { {1,2,3,4}, {5,6,7,8}, {9,10,11,12} };
    /* 行优先：a[i][j] 的地址 = 基址 + (i*列数 + j) * sizeof(int) */
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 4; j++)
            printf("a[%d][%d]=%d addr=%p\\n", i, j, a[i][j], (void *)&a[i][j]);
    return 0;
}
`

const RM_BASE = 0x1000
const RM_M = 3
const RM_N = 4
const rmAddr = (i: number, j: number): string => '0x' + (RM_BASE + (i * RM_N + j) * 4).toString(16)

function rmCells(activeKey: string | null, visited: Set<string>): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < RM_M; i += 1) {
    for (let j = 0; j < RM_N; j += 1) {
      const key = `a${i}${j}`
      const linear = i * RM_N + j
      if (activeKey === key) {
        cells.push(cell(key, rmAddr(i, j), String(linear + 1), 'active', `线性序号 ${linear} = i×列数 + j = ${i}×${RM_N}+${j}`))
      } else if (visited.has(key)) {
        cells.push(cell(key, rmAddr(i, j), String(linear + 1), 'sorted', `已访问，地址随行递增`))
      } else {
        cells.push(cell(key, rmAddr(i, j), String(linear + 1), 'idle', `待访问`))
      }
    }
  }
  return cells
}

function rowMajor(): ReturnType<Viz3DSpec['generate']> {
  const steps: ReturnType<typeof step>[] = []
  const visited = new Set<string>()
  steps.push(step(
    `int a[3][4] 在 C 里不是「3×4 的方块」，而是**连续的 12 个 int**，按行优先一字排开：先 a[0][0..3]，再 a[1][0..3]，最后 a[2][0..3]。3D 视图上层是逻辑二维网格，下层是物理一维内存条；蓝色 = 尚未访问。`,
    [region('matrix', 'int a[3][4] —— 逻辑二维 / 物理一维', rmCells(null, visited), '基址 0x1000，每格 sizeof(int)=4，共 48 字节')],
    { visited: 0 }, 4,
  ))
  for (let i = 0; i < RM_M; i += 1) {
    for (let j = 0; j < RM_N; j += 1) {
      const key = `a${i}${j}`
      const linear = i * RM_N + j
      steps.push(step(
        `a[${i}][${j}] = ${linear + 1}，地址 = 0x${(RM_BASE + linear * 4).toString(16)}。套公式：0x1000 + (i×列数 + j)×4 = 0x1000 + (${i}×${RM_N} + ${j})×4。线性序号 ${linear} 正是上层网格与下层内存条对齐的槽位。`,
        [region('matrix', 'int a[3][4] —— 逻辑二维 / 物理一维', rmCells(key, visited), '行优先：遍历顺序 = 地址递增顺序，缓存友好')],
        { visited: linear + 1 }, 8,
      ))
      visited.add(key)
    }
  }
  steps.push(step(
    `结论：行优先公式 addr(i,j)=base+(i×列数+j)×size 解释了三件事 —— ① 二维数组传参可退化成 int (*p)[4] 甚至 int *；② 按列遍历（外层 j、内层 i）会跳着访问内存，缓存命中率骤降；③ a[i][j] 与 a[j][i] 地址不同，转置必须真的搬数据。`,
    [region('matrix', 'int a[3][4] —— 逻辑二维 / 物理一维', rmCells(null, visited), 'addr(i,j) = base + (i*cols + j)*sizeof(elem)')],
    { visited: 12 }, 4,
  ))
  return steps
}

/* ================================================================== *
 * 2. 二维数组列优先：addr(i,j) = base + (j*M + i)*sizeof
 * ================================================================== */
const CM_CODE = `#include <stdio.h>

int main(void) {
    int a[3][4] = { {1,2,3,4}, {5,6,7,8}, {9,10,11,12} };
    /* 列优先（FORTRAN 风格）：a[i][j] 的地址 = 基址 + (j*行数 + i) * sizeof(int) */
    for (int j = 0; j < 4; j++)
        for (int i = 0; i < 3; i++)
            printf("a[%d][%d] offset=(%d*3+%d)*4\\n", i, j, j, i);
    return 0;
}
`

const CM_BASE = 0x1000
const CM_M = 3
const CM_N = 4
const cmAddr = (i: number, j: number): string => '0x' + (CM_BASE + (j * CM_M + i) * 4).toString(16)

function cmCells(activeKey: string | null, visited: Set<string>): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < CM_M; i += 1) {
    for (let j = 0; j < CM_N; j += 1) {
      const key = `a${i}${j}`
      const linear = j * CM_M + i
      if (activeKey === key) {
        cells.push(cell(key, cmAddr(i, j), String(linear + 1), 'active', `线性序号 ${linear} = j×行数 + i = ${j}×${CM_M}+${i}`))
      } else if (visited.has(key)) {
        cells.push(cell(key, cmAddr(i, j), String(linear + 1), 'sorted', `已访问，地址随列递增`))
      } else {
        cells.push(cell(key, cmAddr(i, j), String(linear + 1), 'idle', `待访问`))
      }
    }
  }
  return cells
}

function colMajor(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  const visited = new Set<string>()
  steps.push(step(
    `若改用列优先（FORTRAN 风格），同样 12 个 int 但铺法不同：先 a[0..2][0]，再 a[0..2][1]，最后 a[0..2][3]。**地址递增方向沿列走**，而不是沿行。看 3D 沙盘：内存条上按列编号，与直觉的「逐行」相反。`,
    [region('matrix', 'int a[3][4] —— 列优先铺排', cmCells(null, visited), '基址 0x1000，addr(i,j)=base+(j*行数+i)*4')],
    { visited: 0 }, 4,
  ))
  for (let j = 0; j < CM_N; j += 1) {
    for (let i = 0; i < CM_M; i += 1) {
      const key = `a${i}${j}`
      const linear = j * CM_M + i
      steps.push(step(
        `a[${i}][${j}] = ${linear + 1}，地址 = 0x${(CM_BASE + linear * 4).toString(16)}。套列优先公式：0x1000 + (j×行数 + i)×4 = 0x1000 + (${j}×${CM_M} + ${i})×4。注意此时同一列（固定 j、i 递增）的地址才是连续的。`,
        [region('matrix', 'int a[3][4] —— 列优先铺排', cmCells(key, visited), '列优先：同一列的地址连续')],
        { visited: linear + 1 }, 8,
      ))
      visited.add(key)
    }
  }
  steps.push(step(
    `结论：同一维面，仅「哪个维度连续」不同，地址公式就完全不同 —— row-major 用 (i×N+j)，column-major 用 (j×M+i)。这也解释了为什么 C 用行优先，而 FORTRAN 用列优先：主维度不同，缓存友好方向就相反；若用 C 按列遍历二维数组，实际是在跨行跳着访问内存。`,
    [region('matrix', 'int a[3][4] —— 列优先铺排', cmCells(null, visited), 'addr(i,j) = base + (j*rows + i)*sizeof(elem)')],
    { visited: 12 }, 4,
  ))
  return steps
}

/* ================================================================== *
 * 3. 对称矩阵下三角压缩存储：k = i(i+1)/2 + j
 * ================================================================== */
const SYM_CODE = `#include <stdio.h>
#define N 5

int main(void) {
    int A[N][N];            /* 对称矩阵：A[i][j] == A[j][i] */
    int sa[N*(N+1)/2];      /* 只存下三角，共 15 个元素 */
    for (int i = 0; i < N; i++)
        for (int j = 0; j <= i; j++)
            sa[i*(i+1)/2 + j] = A[i][j];   /* k = i(i+1)/2 + j */
    return 0;
}
`

const SYM_BASE = 0x2000
const SYM_STORE_BASE = 0x3000
const SYM_N = 5
const SYM_K = (i: number, j: number): number => (i * (i + 1)) / 2 + j
const SYM_TOTAL = (SYM_N * (SYM_N + 1)) / 2
const symVal: number[][] = [
  [1, 2, 3, 4, 5],
  [2, 6, 7, 8, 9],
  [3, 7, 10, 11, 12],
  [4, 8, 11, 13, 14],
  [5, 9, 12, 14, 15],
]
const symMatAddr = (i: number, j: number): string => '0x' + (SYM_BASE + (i * SYM_N + j) * 4).toString(16)
const symStoreAddr = (k: number): string => '0x' + (SYM_STORE_BASE + k * 4).toString(16)

function symMatrixCells(activeKey: string | null, alreadyStored: number): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < SYM_N; i += 1) {
    for (let j = 0; j < SYM_N; j += 1) {
      const key = `A${i}${j}`
      if (i >= j) {
        const k = SYM_K(i, j)
        if (activeKey === key) {
          cells.push(cell(key, symMatAddr(i, j), String(symVal[i]![j]), 'active', `下三角，压缩到 sa[${k}]`))
        } else if (k < alreadyStored) {
          cells.push(cell(key, symMatAddr(i, j), String(symVal[i]![j]), 'sorted', `已压缩到 sa[${k}]`))
        } else {
          cells.push(cell(key, symMatAddr(i, j), String(symVal[i]![j]), 'idle', `待压缩到 sa[${k}]`))
        }
      } else {
        cells.push(cell(key, symMatAddr(i, j), String(symVal[i]![j]), 'idle', `上三角 A[${j}][${i}] 对称，不存储`))
      }
    }
  }
  return cells
}

function symStoreCells(activeKey: string | null, storedCount: number): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let k = 0; k < storedCount; k += 1) {
    let i = 0
    while ((i * (i + 1)) / 2 <= k) i += 1
    i -= 1
    const j = k - (i * (i + 1)) / 2
    const activeHere = activeKey === `A${i}${j}`
    cells.push(
      activeHere
        ? cell(`sa${k}`, symStoreAddr(k), String(symVal[i]![j]), 'active', `存 A[${i}][${j}] = A[${j}][${i}]`)
        : cell(`sa${k}`, symStoreAddr(k), String(symVal[i]![j]), 'sorted', `存 A[${i}][${j}]`),
    )
  }
  return cells
}

function symmetricStore(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  // 下三角按行遍历的顺序（i 0..4，j 0..i）正好对应 k 递增
  const order: [number, number][] = []
  for (let i = 0; i < SYM_N; i += 1) for (let j = 0; j <= i; j += 1) order.push([i, j])
  steps.push(step(
    `n 阶对称矩阵满足 A[i][j] == A[j][i]，所以没必要存满 n² 个元素 —— 上三角完全由下三角镜像得到。压缩策略：只存下三角（含对角线），共 n(n+1)/2 = 15 个元素。看 3D 沙盘：上层是 5×5 对称矩阵，深色格 = 下三角（真正要存的），浅色格 = 上三角（不存）。`,
    [
      region('matrix', '逻辑 A[5][5] 对称矩阵', symMatrixCells(null, 0), '上三角不存储，由下三角对称得出'),
      region('store', '下三角压缩一维数组 sa[0..14]', symStoreCells(null, 0), 'k = i(i+1)/2 + j'),
    ],
    { stored: 0 }, 5,
  ))
  for (const [i, j] of order) {
    const k = SYM_K(i, j)
    steps.push(step(
      `A[${i}][${j}] = ${symVal[i]![j]}，映射到一维下标 k = ${i}(i+1)/2 + ${j} = ${i}×${i + 1}÷2 + ${j} = ${k}，地址 = 0x${(SYM_STORE_BASE + k * 4).toString(16)}。这就是节省的空间：上三角的 A[${j}][${i}] = ${symVal[j]![i]} 只读不存。`,
      [
        region('matrix', '逻辑 A[5][5] 对称矩阵', symMatrixCells(`A${i}${j}`, k), '上三角不存储，由下三角对称得出'),
        region('store', '下三角压缩一维数组 sa[0..14]', symStoreCells(`A${i}${j}`, k + 1), `已存入 ${k + 1} / ${SYM_TOTAL} 个下三角元素`),
      ],
      { stored: k + 1 }, 6,
    ))
  }
  steps.push(step(
    `结论：压缩把占用从 n² 降到 n(n+1)/2，5 阶从 25 降到 15，省 40%。查找 A[i][j] 时，若 i≥j 直接取 sa[i(i+1)/2+j]；若 i<j 则交换下标取 sa[j(j+1)/2+i]。代价是下标的映射不再是简单的 i×列数+j，但换来近一半的存储——这就是「压缩存储」的本质：用公式换空间。`,
    [
      region('matrix', '逻辑 A[5][5] 对称矩阵', symMatrixCells(null, SYM_TOTAL), '上三角不存储'),
      region('store', '下三角压缩一维数组 sa[0..14]', symStoreCells(null, SYM_TOTAL), 'k = i(i+1)/2 + j，全 15 个下三角元素已存入'),
    ],
    { stored: SYM_TOTAL }, 6,
  ))
  return steps
}

/* ================================================================== *
 * 4. 三对角 / 上三角矩阵压缩存储
 * ================================================================== */
const TRI_CODE = `#include <stdio.h>
#define N 5

int main(void) {
    int A[N][N];            /* 三对角矩阵：|i-j| <= 1 处非零 */
    int b[3*N-2];           /* 压缩存储，共 13 个元素 */
    int k = 0;
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            if ((i-j)*(i-j) <= 1)   /* 只取三条对角线 */
                b[k++] = A[i][j];
    return 0;
}
`

const TRI_BASE = 0x2000
const TRI_STORE_BASE = 0x3000
const TRI_N = 5
const triVal: number[][] = [
  [1, 2, 0, 0, 0],
  [3, 4, 5, 0, 0],
  [0, 6, 7, 8, 0],
  [0, 0, 9, 10, 11],
  [0, 0, 0, 12, 13],
]
const triMatAddr = (i: number, j: number): string => '0x' + (TRI_BASE + (i * TRI_N + j) * 4).toString(16)
const triStoreAddr = (k: number): string => '0x' + (TRI_STORE_BASE + k * 4).toString(16)

function triMatrixCells(activeKey: string | null, _alreadyStored: number): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < TRI_N; i += 1) {
    for (let j = 0; j < TRI_N; j += 1) {
      const key = `A${i}${j}`
      if ((i - j) * (i - j) <= 1) {
        if (activeKey === key) {
          cells.push(cell(key, triMatAddr(i, j), String(triVal[i]![j]), 'active', `三条对角线之一，压缩`))
        } else {
          cells.push(cell(key, triMatAddr(i, j), String(triVal[i]![j]), 'idle', `三条对角线之一，待压缩`))
        }
      } else {
        cells.push(cell(key, triMatAddr(i, j), String(triVal[i]![j]), 'idle', `远离对角线，恒为 0，不存`))
      }
    }
  }
  return cells
}

function triStoreCells(activeKey: string | null, storedCount: number): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  // 记录每个 k 对应的 (i,j)：按行优先只取 |i-j|<=1 的格子
  const seq: [number, number][] = []
  for (let i = 0; i < TRI_N; i += 1) for (let j = 0; j < TRI_N; j += 1) if ((i - j) * (i - j) <= 1) seq.push([i, j])
  for (let k = 0; k < storedCount; k += 1) {
    const [i, j] = seq[k]!
    cells.push(
      activeKey === `A${i}${j}`
        ? cell(`b${k}`, triStoreAddr(k), String(triVal[i]![j]), 'active', `存 A[${i}][${j}]`)
        : cell(`b${k}`, triStoreAddr(k), String(triVal[i]![j]), 'sorted', `存 A[${i}][${j}]`),
    )
  }
  return cells
}

function triangleStore(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  const seq: [number, number][] = []
  for (let i = 0; i < TRI_N; i += 1) for (let j = 0; j < TRI_N; j += 1) if ((i - j) * (i - j) <= 1) seq.push([i, j])
  steps.push(step(
    `三对角矩阵只有三条对角线（主对角线 + 上下各一条）非零，|i-j| ≤ 1 之外全是 0。5 阶矩阵有 25 个格子，但真正要存的非零元素只有 3n-2 = 13 个。压缩策略：按行优先只把这 13 个非零元收进一维数组 b[0..12]。`,
    [
      region('matrix', '逻辑 A[5][5] 三对角矩阵', triMatrixCells(null, 0), '|i-j| ≤ 1 处非零，其余恒 0'),
      region('store', '三对角压缩数组 b[0..12]', triStoreCells(null, 0), '只存三条对角线'),
    ],
    { stored: 0 }, 5,
  ))
  for (let k = 0; k < seq.length; k += 1) {
    const [i, j] = seq[k]!
    steps.push(step(
      `A[${i}][${j}] = ${triVal[i]![j]} 落在主顶/次对角线上，按行优先第 ${k + 1} 个非零元，存入 b[${k}]，地址 = 0x${(TRI_STORE_BASE + k * 4).toString(16)}。远离对角线的那一大片 0 根本没进数组——这就是压缩省下的空间。`,
      [
        region('matrix', '逻辑 A[5][5] 三对角矩阵', triMatrixCells(`A${i}${j}`, k), '|i-j| ≤ 1 处非零'),
        region('store', '三对角压缩数组 b[0..12]', triStoreCells(`A${i}${j}`, k + 1), `已存入 ${k + 1} / ${seq.length} 个非零元`),
      ],
      { stored: k + 1 }, 6,
    ))
  }
  steps.push(step(
    `结论：压缩把 5×5=25 个格子缩到 13 个，节省近一半（n 越大越省：三对角恒为 O(n) 存储而非 O(n²)）。上三角矩阵同理——只存 i≤j 那半边，也是 n(n+1)/2 个。这类矩阵在数值计算里极常见，压缩存储 + 稀疏配合，是「空间换出错率」的经典手法。`,
    [
      region('matrix', '逻辑 A[5][5] 三对角矩阵', triMatrixCells(null, seq.length), '非零元已全部压缩'),
      region('store', '三对角压缩数组 b[0..12]', triStoreCells(null, seq.length), '共 13 个非零元'),
    ],
    { stored: seq.length }, 5,
  ))
  return steps
}

/* ================================================================== *
 * 5. 稀疏矩阵三元组顺序表
 * ================================================================== */
const SP_CODE = `#include <stdio.h>

typedef struct { int i, j, v; } Triple;

int main(void) {
    int M[4][4] = { {5,0,0,8}, {0,0,3,0}, {7,6,0,0}, {0,0,0,9} };
    Triple t[6];            /* 非零元三元组顺序表 */
    int k = 0;
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            if (M[i][j] != 0) { t[k].i = i; t[k].j = j; t[k].v = M[i][j]; k++; }
    return 0;
}
`

const SP_MAT_BASE = 0x1000
const SP_TRIP_BASE = 0x2000
const spVal: number[][] = [
  [5, 0, 0, 8],
  [0, 0, 3, 0],
  [7, 6, 0, 0],
  [0, 0, 0, 9],
]
const spMatAddr = (i: number, j: number): string => '0x' + (SP_MAT_BASE + (i * 4 + j) * 4).toString(16)
const spTripleAddr = (k: number): string => '0x' + (SP_TRIP_BASE + k * 12).toString(16)

function spMatrixCells(activeKey: string | null): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const key = `M${i}${j}`
      if (activeKey === key) {
        cells.push(cell(key, spMatAddr(i, j), String(spVal[i]![j]), 'active', `非零元，收入三元组`))
      } else if (spVal[i]![j] !== 0) {
        cells.push(cell(key, spMatAddr(i, j), String(spVal[i]![j]), 'idle', `非零元`))
      } else {
        cells.push(cell(key, spMatAddr(i, j), String(spVal[i]![j]), 'idle', `0，不存`))
      }
    }
  }
  return cells
}

function spTripleCells(activeKey: string | null, storedCount: number): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  const seq: [number, number][] = []
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) if (spVal[i]![j] !== 0) seq.push([i, j])
  for (let k = 0; k < storedCount; k += 1) {
    const [i, j] = seq[k]!
    const label = `(${i},${j},${spVal[i]![j]})`
    cells.push(
      activeKey === `M${i}${j}`
        ? cell(`t${k}`, spTripleAddr(k), label, 'active', `行 ${i} / 列 ${j} / 值 ${spVal[i]![j]}`)
        : cell(`t${k}`, spTripleAddr(k), label, 'sorted', `行 ${i} / 列 ${j} / 值 ${spVal[i]![j]}`),
    )
  }
  return cells
}

function sparseTriplet(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  const seq: [number, number][] = []
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) if (spVal[i]![j] !== 0) seq.push([i, j])
  steps.push(step(
    `稀疏矩阵 = 非零元极少。这个 4×4 里只有 ${seq.length} 个非零元，其余 10 个都是 0。若仍按 n² 存储就白白浪费。三元组顺序表只存「行、列、值」这三个信息，把 ${seq.length} 个非零元装进一条连续数组 t[0..${seq.length - 1}]。`,
    [
      region('matrix', '逻辑 M[4][4] 稀疏矩阵', spMatrixCells(null), '16 格，仅少量非零'),
      region('store', '三元组顺序表 t[0..5]', spTripleCells(null, 0), '每格一个三元组 (行,列,值)，12 字节'),
    ],
    { nonZero: 0 }, 5,
  ))
  for (let k = 0; k < seq.length; k += 1) {
    const [i, j] = seq[k]!
    steps.push(step(
      `扫描到 M[${i}][${j}] = ${spVal[i]![j]} ≠ 0，记录第 ${k + 1} 个三元组 (${i},${j},${spVal[i]![j]})，地址 = 0x${(SP_TRIP_BASE + k * 12).toString(16)}。注意：只有非零元进表，那些 0 全部跳过。`,
      [
        region('matrix', '逻辑 M[4][4] 稀疏矩阵', spMatrixCells(`M${i}${j}`), '16 格，仅少量非零'),
        region('store', '三元组顺序表 t[0..5]', spTripleCells(`M${i}${j}`, k + 1), `已记录 ${k + 1} / ${seq.length} 个非零元`),
      ],
      { nonZero: k + 1 }, 6,
    ))
  }
  steps.push(step(
    `结论：存储量从 n² 降到 3×非零元个数。本例 16 格 → 6 个三元组。代价是访问不再是 O(1) 下标，得先在三元组里查位置——这就是「用时间换空间」。配套的普通转置、快速转置、十字链表，都是在这个顺序表/链结构上做文章。`,
    [
      region('matrix', '逻辑 M[4][4] 稀疏矩阵', spMatrixCells(null), '16 格，仅少量非零'),
      region('store', '三元组顺序表 t[0..5]', spTripleCells(null, seq.length), `已记录全部 ${seq.length} 个非零元`),
    ],
    { nonZero: seq.length }, 5,
  ))
  return steps
}

/* ================================================================== *
 * 6. 一维数组基址 + 下标：a[k] = base + k*sizeof
 * ================================================================== */
const AB_CODE = `#include <stdio.h>

int main(void) {
    int a[6] = {10,20,30,40,50,60};
    int *p = a;             /* p 指向 a[0]，即基址 */
    for (int k = 0; k < 6; k++)
        printf("a[%d]=%d addr=%p\\n", k, a[k], (void *)&a[k]);
    return 0;
}
`

const AB_BASE = 0x3000
const AB_N = 6
const abAddr = (k: number): string => '0x' + (AB_BASE + k * 4).toString(16)
const abVal = [10, 20, 30, 40, 50, 60]

function abCells(activeKey: string | null, visited: Set<string>): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let k = 0; k < AB_N; k += 1) {
    const key = `a${k}`
    if (activeKey === key) {
      cells.push(cell(key, abAddr(k), String(abVal[k]), 'active', `基址 + ${k}×4 = 0x${(AB_BASE + k * 4).toString(16)}`))
    } else if (visited.has(key)) {
      cells.push(cell(key, abAddr(k), String(abVal[k]), 'sorted', `已访问`))
    } else {
      cells.push(cell(key, abAddr(k), String(abVal[k]), 'idle', `待访问`))
    }
  }
  return cells
}

function arrayBase(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  const visited = new Set<string>()
  steps.push(step(
    `一维数组的核心是连续存储：只要记住首元素地址（基址），任意 a[k] 的地址 = 基址 + k×sizeof(int)。指针 p = a 正是让 p 记住这个基址。后面每一步都会看到「+k×4」这个固定增量。`,
    [
      region('array', 'int a[6] 一维数组', abCells(null, visited), '基址 0x3000，每格 sizeof(int)=4，共 24 字节'),
      region('ptr', 'int *p', [cell('p', '0x7ff0', '→ 0x3000', 'idle', 'p = a，保存基址')], 'p 指向数组首元素'),
    ],
    { visited: 0 }, 4,
  ))
  for (let k = 0; k < AB_N; k += 1) {
    steps.push(step(
      `a[${k}] = ${abVal[k]}，地址 = 0x${(AB_BASE + k * 4).toString(16)} = 基址 0x3000 + ${k}×4。编译器对 a[k] 的寻址，本质就是计算 base + k*sizeof。`,
      [
        region('array', 'int a[6] 一维数组', abCells(`a${k}`, visited), '基址 0x3000，每格 4 字节'),
        region('ptr', 'int *p', [cell('p', '0x7ff0', '→ 0x3000', 'idle', 'p = a，始终指向基址')], 'p 指向数组首元素'),
      ],
      { visited: k + 1 }, 8,
    ))
    visited.add(`a${k}`)
  }
  steps.push(step(
    `结论：一维数组的随机访问是 O(1)，因为地址是「基址 + 常数×下标」的线性算式中直接算出，不需要查找。这也正是数组「顺序存储」能支持 O(1) 下标访问、以及指针算术 p[k] ≡ *(p+k) 成立的物理基础。`,
    [
      region('array', 'int a[6] 一维数组', abCells(null, visited), '基址 0x3000'),
      region('ptr', 'int *p', [cell('p', '0x7ff0', '→ 0x3000', 'idle', 'p = a')], 'p 指向数组首元素'),
    ],
    { visited: 6 }, 4,
  ))
  return steps
}

/* ================================================================== *
 * 7. 三维数组行优先：addr = base + (i*n*p + j*p + k)*sizeof
 * ================================================================== */
const A3_CODE = `#include <stdio.h>

int main(void) {
    int a[2][3][4];
    /* 行优先：a[i][j][k] 的偏移 = (i*3*4 + j*4 + k) * sizeof(int) */
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 3; j++)
            for (int k = 0; k < 4; k++)
                printf("a[%d][%d][%d] offset=(%d*12+%d*4+%d)*4\\n",
                       i, j, k, i, j, k);
    return 0;
}
`

const A3_BASE = 0x4000
const A3_D0 = 2
const A3_D1 = 3
const A3_D2 = 4
const a3Addr = (i: number, j: number, k: number): string => '0x' + (A3_BASE + (i * A3_D1 * A3_D2 + j * A3_D2 + k) * 4).toString(16)
const a3Val = (i: number, j: number, k: number): number => i * 12 + j * 4 + k + 1

function a3Cells(activeKey: string | null, visited: Set<string>): ReturnType<typeof cell>[] {
  const cells: ReturnType<typeof cell>[] = []
  for (let i = 0; i < A3_D0; i += 1) {
    for (let j = 0; j < A3_D1; j += 1) {
      for (let k = 0; k < A3_D2; k += 1) {
        const key = `a${i}${j}${k}`
        const linear = i * A3_D1 * A3_D2 + j * A3_D2 + k
        if (activeKey === key) {
          cells.push(cell(key, a3Addr(i, j, k), String(a3Val(i, j, k)), 'active', `线性序号 ${linear} = ${i}×12 + ${j}×4 + ${k}`))
        } else if (visited.has(key)) {
          cells.push(cell(key, a3Addr(i, j, k), String(a3Val(i, j, k)), 'sorted', `已访问`))
        } else {
          cells.push(cell(key, a3Addr(i, j, k), String(a3Val(i, j, k)), 'idle', `待访问`))
        }
      }
    }
  }
  return cells
}

function array3d(): ReturnType<typeof rowMajor> {
  const steps: ReturnType<typeof step>[] = []
  const visited = new Set<string>()
  steps.push(step(
    `int a[2][3][4] 在内存里是**连续的 24 个 int**，按行优先（C 语言）铺开：先 a[0][0][0..3]，再 a[0][1][0..3] … 最后 a[1][2][0..3]。3D 视图把最外层 i 分成两层，每层再是 3×4 网格。地址公式：base + (i×3×4 + j×4 + k)×4。`,
    [region('cube', 'int a[2][3][4] 三维数组', a3Cells(null, visited), '基址 0x4000，共 24 格连续')],
    { visited: 0 }, 4,
  ))
  for (let i = 0; i < A3_D0; i += 1) {
    for (let j = 0; j < A3_D1; j += 1) {
      for (let k = 0; k < A3_D2; k += 1) {
        const key = `a${i}${j}${k}`
        const linear = i * A3_D1 * A3_D2 + j * A3_D2 + k
        steps.push(step(
          `a[${i}][${j}][${k}] = ${a3Val(i, j, k)}，地址 = 0x${(A3_BASE + linear * 4).toString(16)}。套公式：0x4000 + (${i}×3×4 + ${j}×4 + ${k})×4 = 0x4000 + (${i}×12 + ${j}×4 + ${k})×4。线性序号 ${linear}。`,
          [region('cube', 'int a[2][3][4] 三维数组', a3Cells(key, visited), '行优先：i 层最外层，再 j，再 k')],
          { visited: linear + 1 }, 8,
        ))
        visited.add(key)
      }
    }
  }
  steps.push(step(
    `结论：三维数组只是在二维公式上再套一层 —— 第 i 层要跨过 j×p + k 前面所有元素，所以系数是 i×(n×p) + j×p + k。推而广之，任意维数组都可用「行优先=最后一维下标变化最快」的一元线性编号铺平。这解释了为什么固定中括号数、按 i→j→k 顺序访问才是最连续、最缓存友好的。`,
    [region('cube', 'int a[2][3][4] 三维数组', a3Cells(null, visited), 'addr(i,j,k) = base + (i*n*p + j*p + k)*sizeof')],
    { visited: 24 }, 5,
  ))
  return steps
}

/* ================================================================== *
 * 规格表
 * ================================================================== */
export const VIZ3D_SPECS: Viz3DSpec[] = [
  {
    id: 'mem3d-2d-rowmajor',
    title: '二维数组行优先：逻辑网格到一维地址（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'rowMajor2d',
    counterKeys: ['visited'],
    code: RM_CODE,
    n: 12,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['行优先', '二维数组', '地址'], max: 3 },
    generate: rowMajor,
  },
  {
    id: 'mem3d-2d-colmajor',
    title: '二维数组列优先：逻辑网格到一维地址（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'colMajor2d',
    counterKeys: ['visited'],
    code: CM_CODE,
    n: 12,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['列优先', '三维数组'], max: 3 },
    generate: colMajor,
  },
  {
    id: 'mem3d-symmetric-store',
    title: '对称矩阵下三角压缩存储（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'symmetricStore',
    counterKeys: ['stored'],
    code: SYM_CODE,
    n: 15,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['对称矩阵', '下三角'], max: 3 },
    generate: symmetricStore,
  },
  {
    id: 'mem3d-triangle-store',
    title: '三对角 / 上三角矩阵压缩存储（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'tridiagonalStore',
    counterKeys: ['stored'],
    code: TRI_CODE,
    n: 13,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['三对角', '上三角'], max: 3 },
    generate: triangleStore,
  },
  {
    id: 'mem3d-sparse-triplet',
    title: '稀疏矩阵三元组顺序表（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'sparseTriplet',
    counterKeys: ['nonZero'],
    code: SP_CODE,
    n: 6,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['稀疏矩阵', '三元组'], max: 3 },
    generate: sparseTriplet,
  },
  {
    id: 'mem3d-array-base',
    title: '一维数组基址与下标：a[k]=base+k*size（3D）',
    category: 'memory',
    chapter: '第6章 数组',
    renderer: 'memory',
    algorithm: 'arrayBase',
    counterKeys: ['visited'],
    code: AB_CODE,
    n: 6,
    related: { chapter: '第6章 数组', keywords: ['数组', '顺序存储'], max: 3 },
    generate: arrayBase,
  },
  {
    id: 'mem3d-3d-array',
    title: '三维数组行优先地址：A[2][3][4]（3D）',
    category: 'memory',
    chapter: '第4章 串、数组和广义表',
    renderer: 'memory',
    algorithm: 'array3d',
    counterKeys: ['visited'],
    code: A3_CODE,
    n: 24,
    related: { chapter: '第4章 串、数组和广义表', keywords: ['三维数组', '行优先'], max: 3 },
    generate: array3d,
  },
]
