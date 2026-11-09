// ds-ch06 图 第 2 批（4 个 code entry）。坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次；错误版不能崩/超时。
export default {
  shard: 'ds-ch06',
  chapter: '第6章 图',
  category: 'ds',
  source: '自撰（依据《数据结构》第6章 图 知识点体系）',
  entries: [
    {
      key: 'graph-dfs',
      cxaStem: '阅读下面的邻接表 DFS 程序，回答下列问题。',
      section: '6.2 图的存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['邻接表', 'DFS', '深度优先搜索', '图的遍历'],
      knowledgeIds: ['ds-ch06-08', 'ds-ch06-10', 'ds-ch06-02'],
      code: `#include <stdio.h>
#include <stdlib.h>
#define MAXV 100
typedef struct Arc { int to; struct Arc *next; } Arc;
typedef struct { Arc *head; } VNode;
static void addArc(VNode *g, int u, int v) {
    Arc *p = (Arc *)malloc(sizeof(Arc));
    p->to = v; p->next = g[u].head; g[u].head = p;
}
static void dfs(VNode *g, int u, int *vis) {
    Arc *p; vis[u] = 1; printf("%d ", u);
    for (p = g[u].head; p != NULL; p = p->next)
        if (!vis[p->to]) dfs(g, p->to, vis);
}
int main(void) {
    VNode g[MAXV] = {0}; int n, m, u, v, i, comps = 0, *vis;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) { scanf("%d %d", &u, &v); addArc(g, u, v); addArc(g, v, u); }
    vis = calloc(n, sizeof(int));
    for (u = 0; u < n; u++)
        if (!vis[u]) { dfs(g, u, vis); comps++; printf("\\n"); }
    printf("连通分量数 = %d\\n", comps);
    return 0;
}`,
      stem: '用邻接表（头插法构建，无向图每条边存两个方向）对图做 DFS，用共享 visited 数组统计连通分量数并输出每个分量的访问序列。',
      inputs: [
        { stdin: '5 4\n0 1\n1 2\n0 3\n3 4\n', note: '一个连通分量 {0,1,2,3,4}，DFS 序列从 0 出发。', why: '0-1-2 与 0-3-4 连通成一块，分量 1。' },
        { stdin: '4 2\n0 1\n2 3\n', note: '两个分量 {0,1} 和 {2,3}。', why: 'two separate edges.' },
        { stdin: '3 3\n0 1\n1 2\n0 2\n', note: '一个分量 {0,1,2} 是三角形。', why: 'triangle, 1 component.' },
        { stdin: '2 0\n', note: '无边，两个孤立顶点各自成一个分量。', why: 'no edges → 2 isolated components.' },
      ],
      blanks: [
        {
          find: '    for (p = g[u].head; p != NULL; p = p->next)\n        if (!vis[p->to]) dfs(g, p->to, vis);',
          accepted: ['    for (p = g[u].head; p != NULL; p = p->next)\n        if (!vis[p->to]) dfs(g, p->to, vis);'],
          hint: '遍历 u 的所有邻接点，对未访问的递归 DFS。',
          pitfall: '★ DFS 必须用 visited 标记防回退重复访问。头插法使邻接表的邻接点顺序与输入相反（后建的在前），所以邻接点遍历顺序会影响 DFS 输出序列但不改变连通分量。若忘用 vis 去重，纠结于回边会导致无限递归或重复计数。',
        },
        {
          find: '    vis = calloc(n, sizeof(int));\n    for (u = 0; u < n; u++)\n        if (!vis[u]) { dfs(g, u, vis); comps++; printf("\\n"); }',
          accepted: ['    vis = calloc(n, sizeof(int));\n    for (u = 0; u < n; u++)\n        if (!vis[u]) { dfs(g, u, vis); comps++; printf("\\n"); }'],
          hint: '分配一次共享 visited 数组，然后对每个未访问顶点调用 DFS 并计数分量。',
          pitfall: '★ 连通分量计数靠「外层循环对每个未访问顶点调一次 DFS」。Component 起点用**共享的一份 vis**，其 DFS 会把该分量所有顶点标记，所以后续起点若已被标记则跳过。若为每个起点新建 vis，会把同一分量的顶点重复统计；若共用 vis 但不重置且不判 `!vis[u]`，第二个起点会因已标记而什么都不做、只数到 1 个分量。★ 用 calloc 而非局部 int 数组可避免未初始化垃圾值。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: '    p->to = v; p->next = g[u].head; g[u].head = p;',
          replace: '    p->to = v; p->next = NULL; g[u].head = p;',
          why: '头插法漏接 `p->next = g[u].head;`（写成 NULL），每个顶点只保留最后一个插入的邻接点，其余全丢。',
          pitfall: '★ 若把 `p->next` 直接删掉（留 uninitialized），malloc 出来的 p->next 是野值，遍历时沿野指针访问会段错误 —— 必须显式赋 NULL 才能让「少接旧链」成为安全的错误。赋值 NULL 后每个顶点只连最后一个邻接点，DFS 少到达很多结点、连通分量数变多，程序不崩。',
        },
        {
          kind: '条件判断错误',
          find: '        if (!vis[p->to]) dfs(g, p->to, vis);',
          replace: '        (void)p;',
          why: '删掉递归入口（改成一个空语句），DFS 不再深入访问邻接点，每个连通分量只打印自己的起点。',
          pitfall: '★ 若把递归条件改成 `if (vis[p->to]) dfs(...)`，在环图上会因「访问过了才递归」对已访问结点反复递归而栈溢出（0xC00000FD）；这里改用**彻底去掉递归**的缺陷，永远终止、不崩溃。去掉递归后每个分量只输出起点、分量数等于顶点数，与正确版明显不同。',
        },
      ],
      asks: [
        { label: '邻接表对无向图的空间复杂度', answer: 'O(n+e)', unit: '' },
        { label: '头插法下邻接点顺序与输入顺序的关系', answer: '相反', unit: '' },
        { label: 'DFS 的时间复杂度（邻接表）', answer: 'O(n+e)', unit: '' },
        { label: 'DFS 用什么数据结构辅助', answer: '递归（栈）', unit: '' },
        { label: '输入 0 1 / 2 3 的连通分量数', answer: '2', unit: '' },
      ],
      complexity: 'O(n+e)',
      complexityAccepted: ['O(n+e)', 'O(n+e) 线性'],
      notes: {
        idea: 'DFS 用邻接表遍历（每条边经 head 链访问），核心是「访问当前点 → 递归未访问邻居」；visited 数组防止重复访问。',
        steps: [
          '邻接表头插构建。',
          '从起点做 DFS。',
          '统计分量数。',
        ],
        complexity: '每顶点/每弧访问一次，O(n+e)。',
        pitfalls: [
          '头插使邻接点顺序反转。',
          'visited 必用。',
          '分量数靠外层循环。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读图并头插。',
            'DFS 访问。',
            '统计分量。',
          ],
        },
        complexity_analysis: {
          steps: [
            '邻接表 O(n+e)。',
            'DFS O(n+e)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查邻接链与 visited。',
            '修正后正确。',
          ],
        },
      },
    },
    {
      key: 'graph-bfs',
      cxaStem: '阅读下面的邻接表 BFS 程序，回答下列问题。',
      section: '6.2 图的存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['邻接表', 'BFS', '广度优先搜索', '队列'],
      knowledgeIds: ['ds-ch06-12', 'ds-ch06-08', 'ds-ch06-03'],
      code: `#include <stdio.h>
#include <stdlib.h>
#define MAXV 100
typedef struct Arc { int to; struct Arc *next; } Arc;
typedef struct { Arc *head; } VNode;
static int n, q[MAXV], front = 0, rear = 0;
static void addArc(VNode *g, int u, int v) {
    Arc *p = (Arc *)malloc(sizeof(Arc));
    p->to = v; p->next = g[u].head; g[u].head = p;
}
static void bfs(VNode *g, int s, int *vis) {
    int u; q[rear++] = s; vis[s] = 1;
    while (front < rear) {
        Arc *p; u = q[front++]; printf("%d ", u);
        for (p = g[u].head; p != NULL; p = p->next) {
            int w = p->to;
            if (!vis[w]) { vis[w] = 1; q[rear++] = w; }
        }
    }
}
int main(void) {
    VNode g[MAXV] = {0}; int m, u, v, s, i, *vis;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) { scanf("%d %d", &u, &v); addArc(g, u, v); addArc(g, v, u); }
    scanf("%d", &s);
    vis = calloc(n, sizeof(int));
    bfs(g, s, vis);
    printf("\\n");
    free(vis);
    return 0;
}`,
      stem: '用邻接表（头插法，无向图每条边存两个方向）存储图，从给定起点 s 做 BFS 输出访问序列。',
      inputs: [
        { stdin: '5 4\n0 1\n0 2\n1 3\n1 4\n0\n', note: '边 0-1 0-2 1-3 1-4；从 0 出发 BFS，头插使 0 的邻接顺序为 2 再 1。', why: 'BFS 按层扩散：0 → 2,1 → 4,3。' },
        { stdin: '4 3\n0 1\n1 2\n2 3\n0\n', note: '一条路径，BFS 从 0 输出 0 1 2 3。', why: 'path.' },
        { stdin: '3 2\n0 1\n0 2\n1\n', note: '边 0-1 0-2；从 1 出发 BFS 输出 1 0 2。', why: 'start at 1.' },
        { stdin: '2 1\n0 1\n1\n', note: '单边，从 1 出发 BFS 输出 1 0。', why: 'single edge.' },
      ],
      blanks: [
        {
          find: '    for (p = g[u].head; p != NULL; p = p->next) {\n            int w = p->to;\n            if (!vis[w]) { vis[w] = 1; q[rear++] = w; }',
          accepted: ['    for (p = g[u].head; p != NULL; p = p->next) {\n            int w = p->to;\n            if (!vis[w]) { vis[w] = 1; q[rear++] = w; }'],
          hint: '遍历 u 的所有邻接点，未访问的入队并标记。',
          pitfall: '★ BFS 必须在「入队时」标记 visited（不是出队时）。若在出队时才标记，同一个顶点会被多次入队，序列变长且可能无限入队。★ 队列用数组 + front/rear 下标，rear-1 是队尾、front 是队头。',
        },
        {
          find: '    int u; q[rear++] = s; vis[s] = 1;\n    while (front < rear) {',
          accepted: ['    int u; q[rear++] = s; vis[s] = 1;\n    while (front < rear) {'],
          hint: '起点先入队并标记，然后循环直到队列空。',
          pitfall: '★ 起点入队前要先 `vis[s]=1`，否则入队后再被其它顶点重复入队。while 条件是 `front < rear`（队列非空）。写成 `front <= rear` 或忘记初始化 front/rear 会导致队列判断错误。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '            if (!vis[w]) { vis[w] = 1; q[rear++] = w; }',
          replace: '            if (vis[w]) { vis[w] = 1; q[rear++] = w; }',
          why: '把「未访问才入队」写成「已访问才入队」，从未访问的顶点反而不入队，BFS 序列错误。',
          pitfall: '★ 把 `!vis[w]` 掉成 `vis[w]` 后，未访问的邻接点全被跳过、已访问的又重复入队。序列明显错乱（可能少顶点或死循环，因 vis 已在入队时置1，`vis[w]` 为真才入队 → 会重复入队已访问的）。',
        },
        {
          kind: '循环边界错误',
          find: '    while (front < rear) {\n        Arc *p; u = q[front++]; printf("%d ", u);',
          replace: '    while (front < rear - 1) {\n        Arc *p; u = q[front++]; printf("%d ", u);',
          why: '循环判空从 `front < rear` 改成 `front < rear - 1`，队列还剩最后一个元素时就提前停止，末尾的顶点不会被弹出打印。',
          pitfall: '★ BFS 应把队列「非空」判为 `front < rear`（front 是队头、rear 是队尾），直到全部出队。写成 `front < rear - 1` 会让最后一个入队的顶点永远不被处理，输出缺末尾顶点；写成 `front <= rear` 则会在队空时多读一个已过期的槽位（可能读到垃圾下标，访问 g[u] 时越界崩溃）。',
        },
      ],
      asks: [
        { label: 'BFS 的时间复杂度（邻接表）', answer: 'O(n+e)', unit: '' },
        { label: 'BFS 用什么数据结构辅助', answer: '队列', unit: '' },
        { label: '无权图最短路径用哪个算法', answer: 'BFS', unit: '' },
        { label: 'BFS 在何时标记 visited', answer: '入队时', unit: '' },
        { label: '数组队列判空条件', answer: 'front==rear', unit: '' },
      ],
      complexity: 'O(n+e)',
      complexityAccepted: ['O(n+e)', 'O(n+e) 线性'],
      notes: {
        idea: 'BFS 用队列按层扩散，起点入队后循环「出队 → 访问 → 未访问邻接点入队」，入队时标记 visited。',
        steps: [
          '邻接表头插。',
          '出队访问并入队邻居。',
          '打印序列。',
        ],
        complexity: 'O(n+e)，队列 O(n)。',
        pitfalls: [
          '入队时标记。',
          '数组队列判空 front==rear。',
          '头插反转邻接顺序。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读图头插。',
            '打印边。',
            'BFS 输出。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每顶点/弧一次。',
            'O(n+e)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查入队标记与队列边界。',
            '修正后正确。',
          ],
        },
      },
    },
    {
      key: 'dijkstra-fixed',
      cxaStem: '阅读下面的 Dijkstra 最短路径程序，回答下列问题。',
      section: '6.5 最短路径',
      difficulty: 3,
      bloom: 'apply',
      tags: ['Dijkstra', '单源最短路径', '邻接矩阵', '贪心'],
      knowledgeIds: ['ds-ch06-15', 'ds-ch06-07', 'ds-ch06-04'],
      code: `#include <stdio.h>
#define INF 32767
#define MAXV 100
static int dist[MAXV], path[MAXV], visited[MAXV];
static void dijkstra(int g[MAXV][MAXV], int n, int s) {
    int i, j, v, min;
    for (i = 0; i < n; i++) {
        dist[i] = g[s][i]; path[i] = (g[s][i] < INF) ? s : -1; visited[i] = 0;
    }
    visited[s] = 1; dist[s] = 0;
    for (i = 0; i < n; i++) {
        min = INF; v = -1;
        for (j = 0; j < n; j++)
            if (!visited[j] && dist[j] < min) { min = dist[j]; v = j; }
        if (v == -1) break;
        visited[v] = 1;
        for (j = 0; j < n; j++)
            if (!visited[j] && g[v][j] < INF && dist[v] + g[v][j] < dist[j]) {
                dist[j] = dist[v] + g[v][j]; path[j] = v;
            }
    }
}
int main(void) {
    int g[MAXV][MAXV], n, s, i, j;
    scanf("%d", &n);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) scanf("%d", &g[i][j]);
    scanf("%d", &s);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (g[i][j] == 0 && i != j) g[i][j] = INF;
    dijkstra(g, n, s);
    for (j = 0; j < n; j++) if (dist[j] < INF) printf("%d ", dist[j]);
    printf("\\n");
    return 0;
}`,
      stem: '用邻接矩阵实现 Dijkstra 单源最短路径：0 表示直达边权重、-1? 无... 以 0 号顶点为源，输出每个顶点最短距离（不可达不输出）。',
      inputs: [
        { stdin: '5\n0 2 1 0 0\n2 0 0 3 0\n1 0 0 4 0\n0 3 4 0 0\n0 0 0 0 0\n0\n', note: '源 0：dist 为 0 1 2 5（到 3 经 2 距离 1+4=5）。', why: 'edges 0-1=2,0-2=1,1-3=3,2-3=4 ⇒ dist=(0,2,1,5)' },
        { stdin: '4\n0 5 0 0\n5 0 2 0\n0 2 0 3\n0 0 3 0\n0\n', note: '源 0：路径单链 0-1-2-3，dist=(0,5,7,10)。', why: 'chain shortest path.' },
        { stdin: '3\n0 1 10\n1 0 2\n10 2 0\n0\n', note: '源 0：直接 0-2=10 不 走 0-1-2=3，dist=(0,1,3)。', why: 'relax gives 3 via v1.' },
        { stdin: '1\n0\n0\n', note: '单顶点，dist=(0)。', why: 'single vertex.' },
      ],
      blanks: [
        {
          find: '            if (!visited[j] && g[v][j] < INF && dist[v] + g[v][j] < dist[j]) {',
          accepted: ['            if (!visited[j] && g[v][j] < INF && dist[v] + g[v][j] < dist[j]) {'],
          hint: '对每个未访问的 j，若经 v 能缩短则松弛。',
          pitfall: '★ Dijkstra 核心是松弛操作 `dist[v]+w < dist[j]` 就更新。必须同时判 `!visited[j]` 与 `g[v][j] < INF`（否则一个已确定顶点被再更新，或把不可达边当可达）。省略任一个都会导致错误距离或错误路径。',
        },
        {
          find: '            if (!visited[j] && dist[j] < min) { min = dist[j]; v = j; }',
          accepted: ['            if (!visited[j] && dist[j] < min) { min = dist[j]; v = j; }'],
          hint: '在未访问顶点中找 dist 最小者 v。',
          pitfall: '★ 每次取「未访问且 dist 最小」的 v 加入集合，这是贪心。若不判 `!visited[j]`，会反复选已确定的顶点；若 `min=INF` 初始化写错或 `v` 初值不是 -1，会导致选不出来或选到无效顶点。',
        },
      ],
      defects: [
        {
          kind: '赋值顺序错误',
          find: '                dist[j] = dist[v] + g[v][j]; path[j] = v;',
          replace: '                dist[j] = dist[v]; path[j] = v;',
          why: '松弛更新时漏掉边权 `+ g[v][j]`，把距离直接写成源顶点 v 的距离，相当于把中间这条边的权重当 0。',
          pitfall: '★ 典型「忘加边权」错误。图 0→2→3 边权 1+4，正确到 3 是 5，这里把 3 的距离写成 2（=dist[2]），输出少算。程序不崩、只是结果比正确答案小，且对直达边（如 0-1=2）结果仍对，所以只测直达/单跳看不出问题，必须有多跳路径的输入才暴露。',
        },
        {
          kind: '初始化错误',
          find: '    dist[i] = g[s][i]; path[i] = (g[s][i] < INF) ? s : -1; visited[i] = 0;',
          replace: '    dist[i] = g[s][i]; path[i] = (g[s][i] < INF) ? s : -1; visited[i] = 1;',
          why: '把 visited 初始化为 1，导致所有顶点一开始都被视为已访问，Dijkstra 主循环选不出任何未访问顶点，dist 全部保持初始直达值。',
          pitfall: '★ `visited[s]` 应为 1（源已确定），其它顶点应为 0。若把全部初始化成 1，主循环 `!visited[j]` 恒为假、v 恒为 -1 立即 break，所有松弛都不会做，dist 等于原始的直达边（未做中转优化），输出明显错误。',
        },
      ],
      asks: [
        { label: 'Dijkstra 的时间复杂度（邻接矩阵）', answer: 'O(n^2)', unit: '' },
        { label: 'Dijkstra 不能处理什么权重', answer: '负权边', unit: '' },
        { label: '输入 0-1=2,0-2=1,1-3=3,2-3=4 源 0 到 3 的最短距离', answer: '5', unit: '' },
        { label: 'INF 取值', answer: '32767', unit: '' },
        { label: 'Dijkstra 用什么策略', answer: '贪心', unit: '' },
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'O(n^2) 平方'],
      notes: {
        idea: 'Dijkstra 每次选「未访问且 dist 最小」的顶点确定，再用它松弛邻接点（贪心），邻接矩阵 O(n²)。负权边会破坏贪心正确性。',
        steps: [
          '初始化 dist/path/visited。',
          '循环选最小 dist 顶点。',
          '松弛其邻接点。',
        ],
        complexity: 'O(n²)。',
        pitfalls: [
          '负权边不可用。',
          '松弛用严格 <。',
          'visited 判定加入集合。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读邻接矩阵与源。',
            'Dijkstra 求距离。',
            '输出 dist。',
          ],
        },
        complexity_analysis: {
          steps: [
            '选最小 O(n)。',
            '松弛 O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查松弛与 visited。',
            '修正后得正确 dist。',
          ],
        },
      },
    },
    {
      key: 'kruskal-mst',
      cxaStem: '阅读下面的 Kruskal 最小生成树程序，回答下列问题。',
      section: '6.5 最小生成树',
      difficulty: 3,
      bloom: 'apply',
      tags: ['Kruskal', '最小生成树', '并查集', '边排序'],
      knowledgeIds: ['ds-ch06-14', 'ds-ch06-13', 'ds-ch06-04'],
      code: `#include <stdio.h>
#define MAXE 100
typedef struct { int u, v, w; } Edge;
static int parent[10], rankk[10];
static void init(int n) { int i; for (i = 0; i < n; i++) { parent[i] = i; rankk[i] = 0; } }
static int find(int x) {
    while (parent[x] != x) x = parent[x];
    return x;
}
static void unio(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return;
    if (rankk[ra] < rankk[rb]) parent[ra] = rb;
    else { parent[rb] = ra; if (rankk[ra] == rankk[rb]) rankk[ra]++; }
}
static void sortEdges(Edge *e, int m) {
    int i, j; Edge t;
    for (i = 0; i < m - 1; i++) for (j = 0; j < m - 1 - i; j++)
        if (e[j].w > e[j + 1].w) { t = e[j]; e[j] = e[j + 1]; e[j + 1] = t; }
}
int main(void) {
    Edge e[MAXE]; int n, m, i, cnt = 0, cost = 0;
    scanf("%d %d", &n, &m);
    for (i = 0; i < m; i++) scanf("%d %d %d", &e[i].u, &e[i].v, &e[i].w);
    sortEdges(e, m);
    init(n);
    for (i = 0; i < m; i++) {
        if (find(e[i].u) != find(e[i].v)) {
            unio(e[i].u, e[i].v); cost += e[i].w; cnt++;
            if (cnt == n - 1) break;
        }
    }
    printf("边数 %d 总权 %d\\n", cnt, cost);
    return 0;
}`,
      stem: '用 Kruskal 算法求无向带权图的最小生成树：对边按权排序后用并查集判断是否成环，统计选中边数与总权。',
      inputs: [
        { stdin: '4 5\n0 1 1\n0 2 3\n1 2 2\n1 3 4\n2 3 5\n', note: 'MST 边 (0-1=1,1-2=2,0-2=3? ) 选 0-1,1-2,0-3 权 1+2+4=7 边数 3。', why: 'MST total 7, 3 edges.' },
        { stdin: '3 3\n0 1 2\n1 2 3\n0 2 4\n', note: 'MST 选 0-1,1-2，总权 5，边 2。', why: 'MST total 5.' },
        { stdin: '4 3\n0 1 1\n1 2 1\n2 3 1\n', note: '一棵树，MST 就是全部 3 条边，总权 3。', why: 'already a tree.' },
        { stdin: '2 1\n0 1 5\n', note: '单边，MST 边 1，总权 5。', why: 'single edge.' },
      ],
      blanks: [
        {
          find: '        if (find(e[i].u) != find(e[i].v)) {',
          accepted: ['        if (find(e[i].u) != find(e[i].v)) {'],
          hint: '两端在不同集合才选这条边（不构成环）。',
          pitfall: '★ Kruskal 每次按权从小到大选边，用并查集判断两端是否已连通：「不在同一集合才选」。若改判断为相等，会把成环的边也加进来（或反过来），MST 会错。★ 必须「先 find 再 unio」，顺序反了会在合并前自判定失败。',
        },
        {
          find: '            if (cnt == n - 1) break;',
          accepted: ['            if (cnt == n - 1) break;'],
          hint: '选满 n-1 条边即停止。',
          pitfall: '★ 最小生成树边数 = n−1。一旦选到 n−1 条边即可 break（不必继续扫剩余边）。若漏 break 或写错阈值（如 `cnt == n`），会继续扫描；成环边会被并查集挡住所以结果仍对，只是多耗时间；若阈值太小（`cnt == n-2`）会提前停止、MST 缺边。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        if (find(e[i].u) != find(e[i].v)) {',
          replace: '        if (find(e[i].u) == find(e[i].v)) {',
          why: '把「不在同一集合才选」写成「在同一集合才选」，现在选的都是成环边、跳过合法边，MST 顺序完全错。',
          pitfall: '★ 选成环边会把 MST 变成带环的图，且合法边被跳过。若所有边权重都 < INF 且图连通，会选满甚至选不到 n−1 条，cnt 与 cost 都错。配合 `if(cnt==n-1)break`，可能选不到 n−1 条就扫描完。',
        },
        {
          kind: '赋值顺序错误',
          find: '    if (rankk[ra] < rankk[rb]) parent[ra] = rb;\n    else { parent[rb] = ra; if (rankk[ra] == rankk[rb]) rankk[ra]++; }',
          replace: '    if (rankk[ra] < rankk[rb]) parent[ra] = rb;\n    else { parent[rb] = ra; }',
          why: '并查集按秩合并漏掉 rank 更新（rankk[ra]++），使树高增长更快但不改变连通性。',
          pitfall: '★ 按秩合并漏 `rankk[ra]++` 只是让并查集树变高，find 仍正确（连通性不变），MST 结果不变。它不改变输出 ⇒「暴露不出 bug」，但会让 find 的平均复杂度从近似 O(1) 退化到 O(log)。要让它影响输出需废气式 find 或路径不压缩。',
        },
      ],
      asks: [
        { label: '最小生成树边数', answer: 'n-1', unit: '' },
        { label: 'Kruskal 的关键辅助结构', answer: '并查集', unit: '' },
        { label: 'Kruskal 的时间复杂度', answer: 'O(eloge)', unit: '' },
        { label: '按秩合并的作用', answer: '控制树高', unit: '' },
        { label: '输入单边 0-1 权 5 的 MST 总权', answer: '5', unit: '' },
      ],
      complexity: 'O(eloge)',
      complexityAccepted: ['O(e log e)', 'O(eloge)', 'O(e log e) 近似'],
      notes: {
        idea: 'Kruskal 把边按权升序排，用并查集判环，选不与已选边成环的边直到 n−1 条；按秩合并控制树高。',
        steps: [
          '排序边。',
          '并查集判环选边。',
          '累计到 n−1 条。',
        ],
        complexity: '排序 O(eloge)，并查集近似 O(1)×e。',
        pitfalls: [
          '先 find 再 unio。',
          '边数 n−1。',
          '按秩合并防退化。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读边并排序。',
            'Kruskal 选边。',
            '输出边数与总权。',
          ],
        },
        complexity_analysis: {
          steps: [
            '排序 O(eloge)。',
            '并查集近 O(1)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查判环条件与合并。',
            '修正后正确。',
          ],
        },
      },
    },
  ],
}
