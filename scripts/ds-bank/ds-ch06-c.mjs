// ds-ch06 图 第 3 批（7 个 code entry）。坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次；错误版不能崩/超时。
// 规范全名 chapter='第6章 图'；section 必须是 ds-ch06 已存在的节名。
export default {
  shard: 'ds-ch06',
  chapter: '第6章 图',
  category: 'ds',
  source: '自撰（依据《数据结构》第6章 图 知识点体系）',
  entries: [
    {
      key: 'graph-adjmatrix-deg',
      cxaStem: '阅读下面的邻接矩阵求度程序，回答下列问题。',
      section: '6.2 图的存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['邻接矩阵', '出度', '入度', '有向图'],
      knowledgeIds: ['ds-ch06-07', 'ds-ch06-05', 'ds-ch06-01'],
      code: `#include <stdio.h>
#define MAXV 20
int main(void) {
    int g[MAXV][MAXV], n, i, j, out, in;
    scanf("%d", &n);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++)
            scanf("%d", &g[i][j]);
    for (i = 0; i < n; i++) {
        out = 0; in = 0;
        for (j = 0; j < n; j++) {
            out += g[i][j];
            in += g[j][i];
        }
        printf("%d %d\\n", out, in);
    }
    return 0;
}`,
      stem: '用邻接矩阵表示有向图，计算并输出每个顶点的出度与入度（第 i 行之和 = 出度，第 i 列之和 = 入度）。',
      inputs: [
        { stdin: '3\n0 1 1\n0 0 1\n0 0 0\n', note: '上三角：0→1、0→2、1→2。', why: '出度 2/1/0，入度 0/1/2。' },
        { stdin: '3\n0 1 1\n1 0 1\n1 1 0\n', note: '完全有向图（无自环）。', why: '每点出度 2、入度 2。' },
        { stdin: '4\n0 1 0 1\n1 0 1 0\n0 1 0 1\n1 0 1 0\n', note: '无向图（对称）的度 = 行和 = 列和。', why: '每点度 2。' },
      ],
      blanks: [
        {
          find: '            out += g[i][j];\n            in += g[j][i];',
          accepted: ['            out += g[i][j];\n            in += g[j][i];'],
          hint: '第 i 行累加得出度，第 i 列累加得入度。',
          pitfall: '★ 有向图出度 = 第 i 行的和，入度 = 第 i 列的和（g[j][i]）。无向图邻接矩阵对称，所以行和 == 列和 == 度。若把入度写成 g[i][j] 想加，会得到与出度相同的值，无法区分出入度。',
        },
      ],
      defects: [
        {
          kind: '数组下标错误',
          find: '            out += g[i][j];',
          replace: '            out += g[i][i];',
          why: '把出度累加写成只加对角线 g[i][i]，结果每个顶点的出度都变成对角线值（自环边），真正的出度丢失。',
          pitfall: '★ 出度应累加第 i 行所有列 g[i][j]。写成 g[i][i] 后只统计自环（通常为 0），出度恒为对角线值，对无自环的有向图全为 0，明显错误。',
        },
        {
          kind: '数组下标错误',
          find: '            in += g[j][i];',
          replace: '            in += g[j][j];',
          why: '把入度累加写成只加对角线 g[j][j]，结果每个顶点的入度都变成对角线值，真正的入度丢失。',
          pitfall: '★ 入度应累加第 i 列所有行 g[j][i]。写成 g[j][j] 后只统计对角线（通常为 0），入度恒为对角线值，无法反映真实入度。',
        },
      ],
      asks: [
        { label: '有向图邻接矩阵的第 i 行之和表示', answer: '出度', unit: '' },
        { label: '第 i 列之和表示', answer: '入度', unit: '' },
        { label: '无向图对称矩阵中一个顶点的度', answer: '行和', unit: '' },
        { label: '对 n=3 上三角图 0→1 0→2 1→2，顶点 0 的出度', answer: '2', unit: '' },
        { label: '邻接矩阵的空间复杂度', answer: 'O(n^2)', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: '邻接矩阵用 n×n 矩阵存图，g[i][j]=1 表示 i→j 有边；有向图出度 = 行和，入度 = 列和。',
        steps: [
          '读入 n 与矩阵。',
          '对每个 i 累加第 i 行得出度、第 i 列得入度。',
          '输出出度与入度。',
        ],
        complexity: '存储 O(n²)，求每点度 O(n²)。',
        pitfalls: [
          '出度用行、入度用列。',
          '无向图对称，度 = 行和。',
          '矩阵法空间 O(n²)，稀疏图浪费。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读入邻接矩阵。', '逐行累加出入度。', '输出每点出度与入度。'],
        },
        complexity_analysis: {
          steps: ['矩阵法空间 O(n²)。', '双层循环 O(n²)。'],
        },
        ds_debug: {
          steps: ['检查出度用行、入度用列。', '修正后正确。'],
        },
      },
    },
    {
      key: 'graph-adjlist-topsort',
      cxaStem: '阅读下面的邻接表拓扑排序（Kahn 算法）程序，回答下列问题。',
      section: '6.6 拓扑排序与关键路径',
      difficulty: 3,
      bloom: 'apply',
      tags: ['拓扑排序', 'Kahn', '入度', '有向无环图'],
      knowledgeIds: ['ds-ch06-17', 'ds-ch06-08'],
      code: `#include <stdio.h>
#define MAXV 100
int main(void) {
    int g[MAXV][MAXV] = {0}, indeg[MAXV] = {0}, q[MAXV];
    int n, m, u, v, i, front = 0, rear = 0, cnt = 0;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) { scanf("%d %d", &u, &v); g[u][v] = 1; indeg[v]++; }
    for (i = 0; i < n; i++) if (indeg[i] == 0) q[rear++] = i;
    while (front < rear) {
        int cur = q[front++]; cnt++;
        printf("%d ", cur);
        for (i = 0; i < n; i++)
            if (g[cur][i] && --indeg[i] == 0) q[rear++] = i;
    }
    printf("\\n共 %d 个\\n", cnt);
    return 0;
}`,
      stem: '用 Kahn 算法对邻接矩阵表示的有向图做拓扑排序：统计入度，把入度为 0 的顶点入队，逐个输出并递减后继入度。',
      inputs: [
        { stdin: '5 4\n0 1\n0 2\n1 3\n2 3\n', note: 'DAG：0→1→3、0→2→3。', why: '入度 0 的是 0；输出 0 1 2 3，共 4。' },
        { stdin: '4 3\n1 0\n1 2\n2 3\n', note: 'DAG：1→0、1→2→3。', why: '入度 0 的是 1；输出 1 0 2 3 或 1 2 0 3，共 4。' },
        { stdin: '3 3\n0 1\n1 2\n2 0\n', note: '有环 0→1→2→0。', why: '无入度 0 顶点？实际没有，共 0 个。' },
        { stdin: '2 1\n0 1\n', note: '单边 0→1。', why: '输出 0 1，共 2。' },
      ],
      blanks: [
        {
          find: '    for (i = 0; i < n; i++) if (indeg[i] == 0) q[rear++] = i;',
          accepted: ['    for (i = 0; i < n; i++) if (indeg[i] == 0) q[rear++] = i;'],
          hint: '把所有入度为 0 的顶点入队作为起点。',
          pitfall: '★ Kahn 先找「入度为 0」的顶点（没有前驱的），全部入队。若写成入度 != 0 或把入度判断放错位置，会漏掉起点或把有环边顶点也当作起点。当前一个入度为 0 的都不存在时队列为空，说明图有环。',
        },
        {
          find: '            if (g[cur][i] && --indeg[i] == 0) q[rear++] = i;',
          accepted: ['            if (g[cur][i] && --indeg[i] == 0) q[rear++] = i;'],
          hint: '对 cur 的每个后继 i，先递减其入度，减到 0 才入队。',
          pitfall: '★ 只能对「cur 的后继」递减入度；且必须是先减再判（递减后为 0 才入队）。若先判再减或对非后继递减，会把入度减错、队列进错顶点，拓扑序列错乱；若漏掉 `g[cur][i]` 判定（对所有 i 都减），则非后继顶点入度被错误清零，会提前入队，序列不再合法。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '            if (g[cur][i] && --indeg[i] == 0) q[rear++] = i;',
          replace: '            if (g[cur][i] && --indeg[i] < 0) q[rear++] = i;',
          why: '把「减到 0 才入队」改成「减到负数才入队」，后继入度减到 0 后不会入队，最终只有初始入度为 0 的顶点被输出，其余全部丢失。',
          pitfall: '★ 入度递减到 0 才说明「所有前驱已处理完」才可入队。写成 `< 0` 后，任何顶点减到 0 都不入队（除非真的变负，而 DAG 里不会），于是只剩初始入度为 0 的顶点被输出。',
        },
        {
          kind: '循环边界错误',
          find: '    for (i = 0; i < n; i++) if (indeg[i] == 0) q[rear++] = i;',
          replace: '    for (i = 0; i < n; i++) if (indeg[i] != 0) q[rear++] = i;',
          why: '找入度为 0 的顶点反写成找「入度非 0」，把有前驱的顶点全当作起点入队，拓扑序列完全错误。',
          pitfall: '★ Kahn 起点必须是「入度为 0」的顶点；写成 `indeg[i] != 0` 会把仍依赖别人的顶点也当作起始点，立即破坏拓扑序（且无向/环图可能死循环，本输入为 DAG 不会死循环，但序列非法）。',
        },
      ],
      asks: [
        { label: 'Kahn 算法的输入约束', answer: 'DAG', unit: '' },
        { label: '拓扑排序的复杂度（邻接矩阵）', answer: 'O(n^2)', unit: '' },
        { label: '入度为 0 的顶点能作什么', answer: '拓扑序列起点', unit: '' },
        { label: '有环时拓扑排序能排完所有顶点吗', answer: '不能', unit: '' },
        { label: '入度递增 a 表示什么（g[a][b] 加边）', answer: 'b 的入度加1', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: '拓扑排序把「入度为 0」的顶点入队，逐个输出后对其所有后继递减入度，减到 0 再入队；能排完 n 个 ⇔ 图无环（DAG）。',
        steps: [
          '统计每个顶点入度。',
          '把所有入度为 0 的顶点入队。',
          '出队输出并递减后继入度，减到 0 入队。',
          '输出顶点总数判断是否排完。',
        ],
        complexity: '邻接矩阵 O(n²)，邻接表 O(n+e)。',
        pitfalls: [
          '只对后继递减入度。',
          '只有入度减到 0 才入队。',
          '排不完 n 个说明有环。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读图并统计入度。', '入度为 0 的入队。', 'Kahn 逐个输出。'],
        },
        complexity_analysis: {
          steps: ['邻接矩阵 O(n²)。', '邻接表 O(n+e)。'],
        },
        ds_debug: {
          steps: ['检查入度递减与入队条件。', '修正后正确。'],
        },
      },
    },
    {
      key: 'graph-floyd',
      cxaStem: '阅读下面的 Floyd 全源最短路径程序，回答下列问题。',
      section: '6.5 最短路径',
      difficulty: 3,
      bloom: 'apply',
      tags: ['Floyd', '全源最短路径', '邻接矩阵', '动态规划'],
      knowledgeIds: ['ds-ch06-16', 'ds-ch06-07'],
      code: `#include <stdio.h>
#define INF 32767
#define MAXV 100
int main(void) {
    int g[MAXV][MAXV], n, i, j, k;
    scanf("%d", &n);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) scanf("%d", &g[i][j]);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++)
            if (g[i][j] == 0 && i != j) g[i][j] = INF;
    for (k = 0; k < n; k++)
        for (i = 0; i < n; i++)
            for (j = 0; j < n; j++)
                if (g[i][k] < INF && g[k][j] < INF && g[i][k] + g[k][j] < g[i][j])
                    g[i][j] = g[i][k] + g[k][j];
    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) printf("%d ", g[i][j] == INF ? -1 : g[i][j]);
        printf("\\n");
    }
    return 0;
}`,
      stem: '用 Floyd 算法求全源最短路径：0 表示无直达边（除对角线外先换成 INF），经过中间顶点 k 松弛，输出最终距离矩阵（不可达用 -1）。',
      inputs: [
        { stdin: '3\n0 1 10\n1 0 2\n10 2 0\n', note: '三条边构成环，0-2 直达 10，经 1 为 3。', why: 'dist[0][2]=3，dist[2][0]=3。' },
        { stdin: '4\n0 2 0 0\n2 0 3 0\n0 3 0 4\n0 0 4 0\n', note: '无向带权路径 0-1-2-3。', why: 'dist[0][3]=2+3+4=9。' },
        { stdin: '2\n0 5\n5 0\n', note: '单边。', why: 'dist[0][1]=5, dist[1][0]=5。' },
      ],
      blanks: [
        {
          find: '            if (g[i][k] < INF && g[k][j] < INF && g[i][k] + g[k][j] < g[i][j])',
          accepted: ['            if (g[i][k] < INF && g[k][j] < INF && g[i][k] + g[k][j] < g[i][j])'],
          hint: '若经 k 中转能缩短 i→j，则更新。',
          pitfall: '★ Floyd 三重循环的中间顶点 k 必须在**最外层**（固定 k 后松弛所有 i,j）。若 k 放内层，则每个 i,j 只考虑了部分中间顶点，结果错误。松弛式 `g[i][k]+g[k][j] < g[i][j]` 是核心，且更新的是同一边 i→j。',
        },
        {
          find: '    for (i = 0; i < n; i++)\n        for (j = 0; j < n; j++)\n            if (g[i][j] == 0 && i != j) g[i][j] = INF;',
          accepted: ['    for (i = 0; i < n; i++)\n        for (j = 0; j < n; j++)\n            if (g[i][j] == 0 && i != j) g[i][j] = INF;'],
          hint: '把「无直边(0)」换成无穷，但保留对角线 0。',
          pitfall: '★ 不能把对角线也换成 INF，因为 g[i][i]=0 表示到自己距离 0。若把 i!=j 条件漏掉，对角线变成 INF，Floyd 会把 i→i 也当作不可达，输出 -1。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '                if (g[i][k] < INF && g[k][j] < INF && g[i][k] + g[k][j] < g[i][j])',
          replace: '                if (g[i][k] < INF && g[k][j] < INF && g[i][k] + g[k][j] > g[i][j])',
          why: '把松弛条件 `<` 反成 `>`，现在只在「经 k 更长」才更新，结果所有距离都是直边或最大，失去中转优化作用。',
          pitfall: '★ Floyd 松弛是「经 k 更短才更新」，即 `<`。写成 `>` 后只会把更长的路径写进去（实际上 < 不成立就不更新，这里写了 > 又会把更长路径也写进去），导致距离比正确值更大或等于直边。',
        },
        {
          kind: '初始化错误',
          find: '            if (g[i][j] == 0 && i != j) g[i][j] = INF;',
          replace: '            if (g[i][j] == 0) g[i][j] = INF;',
          why: '漏掉 `i != j`，把对角线（值为 0）也换成 INF，导致每个顶点到自己的距离变成无穷大。',
          pitfall: '★ 对角线 g[i][i] 必须保持 0。若也换成 INF，则 i→i 不可达，最终矩阵对角线输出 -1；且可能影响 INF 参与松弛。（这里 i==j 时 g[i][k]=g[i][i]=INF，松弛被短路，不影响其它对，但对角线错了。）',
        },
      ],
      asks: [
        { label: 'Floyd 的三重循环最外层应是', answer: '中间顶点 k', unit: '' },
        { label: 'Floyd 的时间复杂度', answer: 'O(n^3)', unit: '' },
        { label: '对角线 g[i][i] 的正确值', answer: '0', unit: '' },
        { label: 'Floyd 能否处理负权边（无负环）', answer: '能', unit: '' },
        { label: '输入 0-1=1,1-2=2 时 dist[0][2]', answer: '3', unit: '' },
      ],
      complexity: 'O(n^3)',
      complexityAccepted: ['O(n^3)', 'O(n^3) 立方'],
      notes: {
        idea: 'Floyd 用「中间顶点 k」做动态规划：每次允许经过顶点 k，松弛所有 i→j。三重循环 k 必须最外层。',
        steps: [
          '把无直边(0)换成 INF，对角线保持 0。',
          'k 从 0..n-1 最外层，松弛所有 i,j。',
          '输出距离矩阵，不可达用 -1。',
        ],
        complexity: '时间 O(n³)，空间 O(n²)。',
        pitfalls: [
          'k 必须最外层。',
          '对角线保持 0。',
          '可处理负权（无负环）。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读邻接矩阵并换 INF。', 'Floyd 松弛。', '输出距离矩阵。'],
        },
        complexity_analysis: {
          steps: ['三重循环 O(n³)。', '空间 O(n²)。'],
        },
        ds_debug: {
          steps: ['检查 k 是否最外层。', '检查松弛符号与对角线。'],
        },
      },
    },
    {
      key: 'graph-prim',
      cxaStem: '阅读下面的 Prim 最小生成树程序，回答下列问题。',
      section: '6.4 最小生成树',
      difficulty: 3,
      bloom: 'apply',
      tags: ['Prim', '最小生成树', 'lowcost', '邻接矩阵'],
      knowledgeIds: ['ds-ch06-13', 'ds-ch06-04'],
      code: `#include <stdio.h>
#define INF 32767
#define MAXV 100
int main(void) {
    int g[MAXV][MAXV], lowcost[MAXV], n, i, j, k, min, sum = 0;
    scanf("%d", &n);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) scanf("%d", &g[i][j]);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) if (g[i][j] == 0 && i != j) g[i][j] = INF;
    for (j = 0; j < n; j++) lowcost[j] = g[0][j];
    for (i = 1; i < n; i++) {
        min = INF; k = -1;
        for (j = 0; j < n; j++)
            if (lowcost[j] != 0 && lowcost[j] < min) { min = lowcost[j]; k = j; }
        sum += min;
        lowcost[k] = 0;
        for (j = 0; j < n; j++)
            if (g[k][j] < lowcost[j]) lowcost[j] = g[k][j];
    }
    printf("最小生成树权值和 = %d\\n", sum);
    return 0;
}`,
      stem: '用 Prim 算法（以 0 为起点）求无向带权图的最小生成树，用 lowcost 记录每个顶点到已选集合的最小边权，输出总权。',
      inputs: [
        { stdin: '4\n0 1 3 0\n1 0 2 4\n3 2 0 5\n0 4 5 0\n', note: '教材图：0-1=1,0-2=3,1-2=2,1-3=4,2-3=5。', why: 'MST 边 0-1(1)、1-2(2)、1-3(4) 权 7。' },
        { stdin: '3\n0 2 4\n2 0 3\n4 3 0\n', note: '三角图。', why: 'MST 选 0-1(2)、1-2(3)，总权 5。' },
        { stdin: '2\n0 5\n5 0\n', note: '单边。', why: 'MST 总权 5。' },
      ],
      blanks: [
        {
          find: '            if (lowcost[j] != 0 && lowcost[j] < min) { min = lowcost[j]; k = j; }',
          accepted: ['            if (lowcost[j] != 0 && lowcost[j] < min) { min = lowcost[j]; k = j; }'],
          hint: '在未选顶点（lowcost!=0）中找最小边权。',
          pitfall: '★ 每次选「未加入集合且 lowcost 最小」的顶点 v，这是 Prim 的贪心核心。`lowcost[j] != 0` 用来排除已选顶点（其 lowcost 被置 0）。若漏掉 `!= 0`，会反复选已确定的顶点。',
        },
        {
          find: '            if (g[k][j] < lowcost[j]) lowcost[j] = g[k][j];',
          accepted: ['            if (g[k][j] < lowcost[j]) lowcost[j] = g[k][j];'],
          hint: '用新顶点 k 到每个未选顶点的边权松弛 lowcost。',
          pitfall: '★ 加入顶点 k 后，要更新所有 j 的 lowcost（k 到 j 的边更短就更新）。方向是 `g[k][j] < lowcost[j]`。若写反成 `g[k][j] > lowcost[j]`，MST 会选错权重。',
        },
      ],
      defects: [
        {
          kind: '赋值顺序错误',
          find: '        sum += min;',
          replace: '        (void)min;',
          why: '把累加边权的语句替换为空语句，sum 恒为 0，最小生成树总权输出为 0。',
          pitfall: '★ `sum += min` 是累加 MST 每步选出的最小边权；删掉后 sum 不累加，输出恒 0，但算法其余部分（选点、更新 lowcost）仍正确。',
        },
        {
          kind: '初始化错误',
          find: '        lowcost[k] = 0;',
          replace: '        lowcost[k] = 1;',
          why: '把「标记 k 已选」的 lowcost[k]=0 改成 1，顶点 k 不会被排除，可能被重复选成下一步最小点。',
          pitfall: '★ 选中的顶点 k 要把 lowcost[k] 置 0（表示已加入集合，不再被当作候选）。置成 1 后 k 仍是候选，下一步可能再次被选中（若它的低值边仍是最小），导致错误（重复选点、权值偏大）。',
        },
      ],
      asks: [
        { label: 'Prim 算法的时间复杂度（邻接矩阵）', answer: 'O(n^2)', unit: '' },
        { label: 'lowcost 数组记录什么', answer: '到已选集合的最小边权', unit: '' },
        { label: '把顶点加入集合后 lowcost 置为', answer: '0', unit: '' },
        { label: '对教材图 0-1=1,1-2=2,1-3=4 的 MST 总权', answer: '7', unit: '' },
        { label: 'Prim 适用稠密图还是稀疏图', answer: '稠密图', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: 'Prim 从一个顶点开始，每次选「到已选集合边权最小」的顶点加入，用 lowcost 维护每个顶点到集合的最小边权；稠密图用邻接矩阵 O(n²)。',
        steps: [
          '初始化 lowcost 为源到各点边权。',
          '重复选 lowcost 最小且未选的顶点 k。',
          '累加边权、置 lowcost[k]=0、用 k 松弛其它点。',
        ],
        complexity: 'O(n²)，适合稠密图。',
        pitfalls: [
          '选未在集合中的最小 lowcost。',
          '加入后置 0 并松弛。',
          '最短边权累计。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读图并初始化 lowcost。', 'Prim 循环选点。', '输出权值和。'],
        },
        complexity_analysis: {
          steps: ['外层 n 次内层 n 次 O(n²)。'],
        },
        ds_debug: {
          steps: ['检查 lowcost 选点与松弛。', '修正后正确。'],
        },
      },
    },
    {
      key: 'graph-adjlist-convert',
      cxaStem: '阅读下面的邻接矩阵转邻接表程序，回答下列问题。',
      section: '6.2 图的存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['邻接表', '邻接矩阵', '转换', '头插法'],
      knowledgeIds: ['ds-ch06-08', 'ds-ch06-07'],
      code: `#include <stdio.h>
#include <stdlib.h>
#define MAXV 100
typedef struct Arc { int to; struct Arc *next; } Arc;
typedef struct { Arc *head; } VNode;
int main(void) {
    VNode g[MAXV] = {0}; int a[MAXV][MAXV], n, i, j; Arc *p;
    scanf("%d", &n);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) scanf("%d", &a[i][j]);
    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++)
            if (a[i][j]) {
                p = (Arc *)malloc(sizeof(Arc));
                p->to = j; p->next = g[i].head; g[i].head = p;
            }
    for (i = 0; i < n; i++) {
        printf("%d:", i);
        for (p = g[i].head; p != NULL; p = p->next) printf(" %d", p->to);
        printf("\\n");
    }
    return 0;
}`,
      stem: '把邻接矩阵转换成邻接表（头插法建链）：对每个 i，把其所有邻接点 j 依次头插到 g[i].head，再逐行输出每个顶点的邻接表。',
      inputs: [
        { stdin: '3\n0 1 1\n0 0 1\n0 0 0\n', note: '有向图 0→1、0→2、1→2。', why: '头插使 0 的邻接顺序为 2 1（逆序）。' },
        { stdin: '3\n0 1 0\n1 0 1\n0 1 0\n', note: '无向图路径 0-1-2。', why: '0 的链为 1；1 的链为 2 0；2 的链为 1。' },
        { stdin: '2\n0 1\n0 0\n', note: '单边 0→1。', why: '0 的链为 1。' },
      ],
      blanks: [
        {
          find: '                p->to = j; p->next = g[i].head; g[i].head = p;',
          accepted: ['                p->to = j; p->next = g[i].head; g[i].head = p;'],
          hint: '头插法：把 j 插到 i 的邻接链头。',
          pitfall: '★ 头插法把新弧插在表头，所以最终邻接表顺序与输入顺序相反（后插入的在前）。p->next 必须接当前表头（g[i].head），再让 g[i].head 指向 p。漏接旧链（写成 NULL）会丢邻接点。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: '                p->to = j; p->next = g[i].head; g[i].head = p;',
          replace: '                p->to = j; p->next = NULL; g[i].head = p;',
          why: '头插法漏接旧链（p->next 赋 NULL），每个顶点只保留最后一个插入的邻接点，其余全部丢失。',
          pitfall: '★ 头插法必须 `p->next = g[i].head` 接上旧表头，再把 g[i].head 指向新节点。写成 `p->next = NULL` 后，每个顶点只剩最后一个插入的邻接点，邻接表严重缺失。',
        },
        {
          kind: '条件判断错误',
          find: '            if (a[i][j]) {',
          replace: '            if (a[i][j] && i < j) {',
          why: '只处理上三角（i<j）的边，使邻接表只保留「小下标到当下标」方向的边，漏掉反向边。',
          pitfall: '★ 对无向图对称矩阵，i<j 会让每个顶点只记录「到更大下标」的邻居，反向边不建；对连通性/遍历有影响。这里本应遍历整个矩阵（含对称方向），加上 i<j 会漏掉一半邻接点。',
        },
      ],
      asks: [
        { label: '邻接表（无向图）的空间复杂度', answer: 'O(n+2e)', unit: '' },
        { label: '邻接表用头插法，邻接点顺序与输入顺序', answer: '相反', unit: '' },
        { label: '邻接矩阵转邻接表的时间复杂度', answer: 'O(n^2)', unit: '' },
        { label: '有向图邻接表存储多少条弧', answer: 'e', unit: '' },
        { label: '邻接表找入度困难还是出度困难', answer: '入度困难', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: '邻接表为每个顶点建一条链存其邻接点；头插法使顺序反转。矩阵转邻接表：遍历矩阵，凡 a[i][j]=1 就头插 j 到 i 的链。',
        steps: [
          '读入矩阵。',
          '对每个 i 遍历 j，出现边就头插。',
          '逐行输出邻接表。',
        ],
        complexity: '转换时间 O(n²)，存储无向图 O(n+2e)。',
        pitfalls: [
          '头插使邻接点逆序。',
          '必须接旧链否则丢点。',
          '只扫上三角会漏反向边。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读矩阵。', '头插建表。', '输出邻接表。'],
        },
        complexity_analysis: {
          steps: ['O(n²) 转换。', 'O(n+2e) 存储。'],
        },
        ds_debug: {
          steps: ['检查头插是否接链。', '检查是否遍历整个矩阵。'],
        },
      },
    },
    {
      key: 'graph-connected',
      cxaStem: '阅读下面的 BFS 求连通分量程序，回答下列问题。',
      section: '6.3 图的遍历',
      difficulty: 2,
      bloom: 'apply',
      tags: ['连通分量', 'BFS', '无向图'],
      knowledgeIds: ['ds-ch06-12', 'ds-ch06-06'],
      code: `#include <stdio.h>
#define MAXV 100
int main(void) {
    int g[MAXV][MAXV] = {0}, vis[MAXV] = {0}, q[MAXV];
    int n, m, u, v, i, front, rear, s, comps = 0;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) { scanf("%d %d", &u, &v); g[u][v] = 1; g[v][u] = 1; }
    for (s = 0; s < n; s++) {
        if (vis[s]) continue;
        comps++;
        front = rear = 0; q[rear++] = s; vis[s] = 1;
        while (front < rear) {
            int cur = q[front++];
            for (i = 0; i < n; i++)
                if (g[cur][i] && !vis[i]) { vis[i] = 1; q[rear++] = i; }
        }
    }
    printf("连通分量数 = %d\\n", comps);
    return 0;
}`,
      stem: '用 BFS（共享 visited 数组）统计无向图的连通分量数：对每个未访问顶点起一次 BFS，把该分量所有顶点标记。',
      inputs: [
        { stdin: '5 4\n0 1\n1 2\n0 3\n3 4\n', note: '一个连通分量。', why: 'comps=1。' },
        { stdin: '4 2\n0 1\n2 3\n', note: '两个分量。', why: 'comps=2。' },
        { stdin: '3 1\n0 1\n', note: '分量 {0,1} 与孤立点 2。', why: 'comps=2。' },
        { stdin: '2 0\n', note: '无边，两个孤立点。', why: 'comps=2。' },
      ],
      blanks: [
        {
          find: '            if (g[cur][i] && !vis[i]) { vis[i] = 1; q[rear++] = i; }',
          accepted: ['            if (g[cur][i] && !vis[i]) { vis[i] = 1; q[rear++] = i; }'],
          hint: '对未访问的邻居标记并入队。',
          pitfall: '★ BFS 必须「入队时标记」visited。若出队时才标记，同一顶点会被多次入队。而且这里用共享 vis 标记整个分量，确保后续起点跳过已访问顶点。',
        },
        {
          find: '        if (vis[s]) continue;',
          accepted: ['        if (vis[s]) continue;'],
          hint: '外层对每个顶点判断是否已访问，已访问则跳过。',
          pitfall: '★ 连通分量 = 外层对每个未访问顶点起一次 BFS 计数。用共享 vis，一个 BFS 标记整个分量，所以后续该分量其它顶点被跳过。若漏掉 continue 或重新分配 vis，会重复计数。',
        },
      ],
      defects: [
        {
          kind: '赋值顺序错误',
          find: '            if (g[cur][i] && !vis[i]) { vis[i] = 1; q[rear++] = i; }',
          replace: '            if (g[cur][i] && !vis[i]) { vis[i] = 1; }',
          why: '标记了 `vis[i]=1` 但不入队，BFS 只处理起点，不再扩散，每个顶点几乎各成一个分量。',
          pitfall: '★ BFS 必须把邻居入队才会继续扩散。这里只标记不入队，队列只有起点，一层都不往下走，导致连通分量数错误（接近每个顶点一个分量）。',
        },
        {
          kind: '条件判断错误',
          find: '        if (vis[s]) continue;',
          replace: '        if (!vis[s]) continue;',
          why: '把「已访问跳过」写成「未访问跳过」，所有未访问起点都被跳过，BFS 从不执行，连通分量数输出 0。',
          pitfall: '★ 外层循环应跳过「已访问」的顶点（vis[s] 为 1 时 continue）。写成 `!vis[s]` 后所有未访问顶点反而被跳过，BFS 完全不执行，comps 恒为 0。',
        },
      ],
      asks: [
        { label: 'BFS 用什么数据结构', answer: '队列', unit: '' },
        { label: '连通分量计数的核心', answer: '外层循环+共享 visited', unit: '' },
        { label: 'BFS 求连通分量的复杂度（邻接矩阵）', answer: 'O(n^2)', unit: '' },
        { label: '孤立顶点算几个连通分量', answer: '1', unit: '' },
        { label: '无向图连通分量的边数关系（n 个顶点 k 分量）', answer: 'n-k', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: '用 BFS 求连通分量：外层遍历每个未访问顶点起一次 BFS，用共享 visited 标记整个分量并计数。',
        steps: [
          '读图，建对称邻接矩阵。',
          '外层对每个未访问顶点起 BFS。',
          'BFS 用队列标记整个分量。',
          '统计分量数。',
        ],
        complexity: '邻接矩阵 O(n²)，邻接表 O(n+e)。',
        pitfalls: [
          '入队时标记。',
          '共享 visited。',
          '外层跳过已访问。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读图。', '逐顶点 BFS 计数。', '输出分量数。'],
        },
        complexity_analysis: {
          steps: ['邻接矩阵 O(n²)。', '邻接表 O(n+e)。'],
        },
        ds_debug: {
          steps: ['检查入队标记与 visited 共享。', '修正后正确。'],
        },
      },
    },
    {
      key: 'graph-dfs-cycle',
      cxaStem: '阅读下面的 DFS 检测环程序，回答下列问题。',
      section: '6.3 图的遍历',
      difficulty: 3,
      bloom: 'apply',
      tags: ['DFS', '环检测', '颜色标记', '有向图'],
      knowledgeIds: ['ds-ch06-10', 'ds-ch06-17'],
      code: `#include <stdio.h>
#define MAXV 100
static int g[MAXV][MAXV], color[MAXV], n;
static int dfs(int u) {
    int v;
    color[u] = 1;
    for (v = 0; v < n; v++)
        if (g[u][v]) {
            if (color[v] == 1) return 1;
            if (color[v] == 0 && dfs(v)) return 1;
        }
    color[u] = 2;
    return 0;
}
int main(void) {
    int m, u, v, i, cyc = 0;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) { scanf("%d %d", &u, &v); g[u][v] = 1; }
    for (i = 0; i < n; i++)
        if (color[i] == 0 && dfs(i)) { cyc = 1; break; }
    printf("%s\\n", cyc ? "有环" : "无环");
    return 0;
}`,
      stem: '用 DFS 三色标记检测有向图是否有环：0=未访问、1=正在访问（路径上）、2=访问完。某邻接点处于灰色(1)说明遇到回边 ⇒ 有环。',
      inputs: [
        { stdin: '3 3\n0 1\n1 2\n2 0\n', note: '环 0→1→2→0。', why: '有环。' },
        { stdin: '4 3\n0 1\n1 2\n2 3\n', note: '路径无环。', why: '无环。' },
        { stdin: '2 1\n0 1\n', note: '单边无环。', why: '无环。' },
      ],
      blanks: [
        {
          find: '            if (color[v] == 1) return 1;',
          accepted: ['            if (color[v] == 1) return 1;'],
          hint: '邻接点处于灰色表示遇到回边，有环。',
          pitfall: '★ 三色标记：灰(1)表示「当前递归栈中」，遇到灰色邻居说明从该点能回到它自身（回边），有环。若用黑色(2)或只判未访问，会漏检跨边导致的环。',
        },
        {
          find: '        if (color[i] == 0 && dfs(i)) { cyc = 1; break; }',
          accepted: ['        if (color[i] == 0 && dfs(i)) { cyc = 1; break; }'],
          hint: '对每个未访问顶点递归 DFS，只要递归返回 1（发现环）就置 cyc 并退出。',
          pitfall: '★ 必须对每个「未访问(0)」的顶点调用 DFS（保证覆盖所有连通分量），且用 color==0 判断。若只对一个起点调用，会漏检其它分量的环。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '            if (color[v] == 1) return 1;',
          replace: '            if (color[v] == 2) return 1;',
          why: '把「遇灰色算环」改成「遇黑色算环」，而黑色说明已访问完，正常无环也不会触发回边，环被漏检。',
          pitfall: '★ 只有灰色(正在递归栈中)才说明有环；黑色是已退出递归的点，遇到黑色只是跨边，不算环。改成 `color[v]==2` 后，所有环都被漏检（因为回边指向的是灰色点），无环图也能被误判为有环时机不确定，本输入下会全部输出无环。',
        },
        {
          kind: '条件判断错误',
          find: '        if (color[i] == 0 && dfs(i)) { cyc = 1; break; }',
          replace: '        if (color[i] == 0 && !dfs(i)) { cyc = 1; break; }',
          why: '把「发现环才置 cyc」反写成「没发现环就置 cyc」，结果无环图被判为有环、有环图被判为无环。',
          pitfall: '★ 递归返回 1 表示发现环才应置 cyc；写成 !dfs(i) 会在递归返回 0（无环）时反而置 cyc，完全颠倒。',
        },
      ],
      asks: [
        { label: 'DFS 环检测中灰色(1)表示', answer: '递归栈中', unit: '' },
        { label: '遇到灰色邻接点说明', answer: '有环', unit: '' },
        { label: 'DFS 环检测的复杂度（邻接矩阵）', answer: 'O(n^2)', unit: '' },
        { label: '回边指向的颜色', answer: '灰色', unit: '' },
        { label: '拓扑排序能排完 n 个顶点 ⇔ 图', answer: '无环', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: 'DFS 三色标记：白(0)未访问、灰(1)在递归栈、黑(2)已回溯。遇到灰邻居说明有回边 ⇒ 有环。',
        steps: [
          '对每个未访问顶点调 dfs。',
          'dfs 标记灰、递归访问、遇灰邻居返回 1。',
          '回溯后标黑。',
          '任一 dfs 返回 1 则判有环。',
        ],
        complexity: '邻接矩阵 O(n²)，邻接表 O(n+e)。',
        pitfalls: [
          '灰=在栈中。',
          '遇灰才有环。',
          '要覆盖所有连通分量。',
        ],
      },
      explain: {
        code_reading: {
          steps: ['读图。', 'DFS 三色标记。', '判环并输出。'],
        },
        complexity_analysis: {
          steps: ['邻接矩阵 O(n²)。', '邻接表 O(n+e)。'],
        },
        ds_debug: {
          steps: ['检查灰色判定。', '检查外层覆盖。'],
        },
      },
    },
  ],
};
