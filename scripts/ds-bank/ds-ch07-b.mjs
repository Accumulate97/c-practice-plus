// ds-ch07 查找 第 2 批（7 个 code entry）。坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次；错误版不能崩/超时。
// 规范全名 chapter='第7章 查找'；section 必须是 ds-ch07 已存在的节名。
export default {
  shard: 'ds-ch07',
  chapter: '第7章 查找',
  category: 'ds',
  source: '自撰（依据《第7章 查找》教材考点变式）',
  entries: [
    {
      key: 'hash-linear',
      cxaStem: '阅读下面的线性探测散列表程序（H(key)=key mod 13，开放定址），回答各问。',
      section: '7.5 散列表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['散列表', '线性探测', '开放定址', '除留余数法'],
      knowledgeIds: ['ds-ch07-14', 'ds-ch07-03'],
      code: `#include <stdio.h>
#define M 13
int main(void){
    int h[M], n, x, i, p, cmp;
    for (i = 0; i < M; i++) h[i] = -1;
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        scanf("%d", &x); p = x % M;
        while (h[p] != -1) p = (p + 1) % M;
        h[p] = x;
    }
    scanf("%d", &x);
    p = x % M; cmp = 0;
    while (h[p] != -1 && h[p] != x) { cmp++; p = (p + 1) % M; }
    if (h[p] == x) printf("找到 %d 位置 %d 比较 %d 次\\n", x, p, cmp + 1);
    else printf("未找到 %d 比较 %d 次\\n", x, cmp);
    return 0;
}`,
      stem: '用除留余数法 H(key)=key mod 13 与线性探测法建立散列表并查找 key，输出找到的位置与比较次数（-1 表示空位）。',
      inputs: [
        { stdin: '5\n18 12 47 25 37\n25\n', note: '教材例：25 与 12 冲突，线性探测到下标 0。', why: '找到 25 位置 0 比较 2 次。' },
        { stdin: '5\n18 12 47 25 37\n47\n', note: '47 落在下标 8，无冲突。', why: '找到 47 位置 8 比较 1 次。' },
        { stdin: '6\n0 1 2 3 4 5\n6\n', note: '6 之散列地址为空。', why: '未找到 6 比较 0 次。' },
        { stdin: '3\n13 26 39\n13\n', note: '13 26 39 都落下标 0，线性探测到 0 1 2。', why: '找到 13 位置 0 比较 1 次。' },
        { stdin: '4\n3 16 29 42\n29\n', note: '3 16 29 42 都落下标 3，依次探测 3 4 5 6。', why: '找到 29 位置 5 比较 3 次。' },
      ],
      blanks: [
        {
          find: '        while (h[p] != -1) p = (p + 1) % M;',
          accepted: ['        while (h[p] != -1) p = (p + 1) % M;'],
          hint: '发生冲突就线性探测下一个位置。',
          pitfall: '★ 线性探测：位置被占就依次往后找（p=(p+1)%M 循环）。若写成 p=p+1 不做取模，会越界访问；若写成 p=(p-1+M)%M 则是反向探测，与查找方向不一致。',
        },
        {
          find: '    while (h[p] != -1 && h[p] != x) { cmp++; p = (p + 1) % M; }',
          accepted: ['    while (h[p] != -1 && h[p] != x) { cmp++; p = (p + 1) % M; }'],
          hint: '查找时逐个探测，直到找到 x 或遇到空位。',
          pitfall: '★ 查找停止条件：遇到 x（成功）或空位 -1（失败）。若把 && 写成 ||，会在 h[p]==x 时也继续走；若忘判空位，会无限循环。cmp 统计探测次数，找到时共 cmp+1 次（含命中那次）。',
        },
      ],
      defects: [
        {
          kind: '初始化错误',
          find: '        scanf("%d", &x); p = x % M;',
          replace: '        scanf("%d", &x); p = x % (M - 1);',
          why: '把插入时的散列函数从 key mod 13 改成 key mod 12，键落位位置全变。',
          pitfall: '★ 插入与查找必须用同一个散列函数 H(key)=key mod m。这里只改了插入用 mod 12、查找仍用 mod 13，键被放到与查找不一致的位置，导致查找失败。',
        },
        {
          kind: '初始化错误',
          find: '    p = x % M; cmp = 0;',
          replace: '    p = x % M; cmp = 1;',
          why: '把查找比较计数器初值从 0 改成 1，比较次数多记 1 次。',
          pitfall: '★ 查找前 cmp 应初始化为 0，探测一次加 1。初始化为 1 会让所有结果多 1 次，且命中时的 cmp+1 也多 1。',
        },
      ],
      asks: [
        { label: 'H(key)=key mod 13，key=18 的散列地址', answer: '5', unit: '' },
        { label: '线性探测的冲突处理方式', answer: '向后找下一个空位', unit: '' },
        { label: '装填因子 α 的定义', answer: 'n/m', unit: '' },
        { label: '教材例 18 12 47 25 37 插入后，25 的地址', answer: '0', unit: '' },
        { label: '线性探测的缺点', answer: '堆积', unit: '' },
      ],
      complexity: 'O(1) 平均',
      complexityAccepted: ['O(1)', 'O(1) 平均'],
      askSpace: '线性探测把发生冲突的元素放到下一个空位，查找也按同样顺序探测。装填因子 α=n/m 越大越易堆积、平均查找长度越大；α 在 0.5~0.75 时性能较好。',
      notes: {
        idea: '除留余数法 H(key)=key mod m 计算地址，线性探测（开放定址法）在冲突时向后找下一个空位，查找按同样顺序探测到空位即失败。',
        steps: [
          'H(key)=key mod 13 定位。',
          '位置被占就 p=(p+1)%M 向后探测。',
          '查找时逐个探测到 x 或空位停。',
          '统计比较次数。',
        ],
        complexity: '平均 O(1)（α 合适时），最坏 O(n)。',
        pitfalls: [
          '插入与查找须同函数同探测顺序。',
          '必须判空位 -1 防死循环。',
          '装填因子决定性能。',
        ],
      },
      explain: {
        code_reading: { steps: ['读 n 与 n 个键，线性探测插入。', '读待查 key，探测查找。', '输出位置与比较次数。'] },
        code_completion: { steps: ['线性探测找空位。', '查找探测到 x 或空位停。'] },
        ds_debug: { steps: ['检查散列函数与探测方向一致。', '检查查找停止条件与计数。'] },
        complexity_analysis: { steps: ['数出探测次数。', '用 α 解释平均性能。'] },
      },
    },
    {
      key: 'hash-chain',
      cxaStem: '阅读下面的链地址法散列表程序，回答各问。',
      section: '7.5 散列表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['散列表', '链地址法', '拉链法', '除留余数法'],
      knowledgeIds: ['ds-ch07-14', 'ds-ch07-03'],
      code: `#include <stdio.h>
#include <stdlib.h>
#define M 13
typedef struct N { int key; struct N *next; } N;
int main(void){
    N *head[M] = {0}, *p, *q; int n, x, i, pos;
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        scanf("%d", &x); pos = x % M;
        p = (N *)malloc(sizeof(N)); p->key = x; p->next = head[pos]; head[pos] = p;
    }
    scanf("%d", &x);
    pos = x % M; q = head[pos];
    while (q != NULL && q->key != x) q = q->next;
    if (q != NULL) printf("找到 %d\\n", x);
    else printf("未找到 %d\\n", x);
    return 0;
}`,
      stem: '用除留余数法 H(key)=key mod 13 与链地址法（拉链法）建立散列表并查找 key：把冲突的键用头插法挂在同一桶的链上，输出是否找到。',
      inputs: [
        { stdin: '5\n18 12 47 25 37\n25\n', note: '25 与 12 同桶（下标 12）。', why: '找到 25。' },
        { stdin: '5\n18 12 47 25 37\n44\n', note: '44 落桶 5（桶里只有 18）。', why: '未找到 44。' },
        { stdin: '3\n13 26 39\n26\n', note: '三个键都落桶 0。', why: '找到 26。' },
        { stdin: '2\n5 18\n18\n', note: '5 与 18 同桶。', why: '找到 18。' },
        { stdin: '1\n7\n7\n', note: '单键。', why: '找到 7。' },
      ],
      blanks: [
        {
          find: '        p = (N *)malloc(sizeof(N)); p->key = x; p->next = head[pos]; head[pos] = p;',
          accepted: ['        p = (N *)malloc(sizeof(N)); p->key = x; p->next = head[pos]; head[pos] = p;'],
          hint: '头插法：新结点插到桶链头。',
          pitfall: '★ 链地址法用头插法把冲突键挂到桶链上。p->next 必须接旧表头（head[pos]）再让 head[pos] 指向新结点，顺序不能反（先接后面再接前面）。漏接旧链会丢元素。',
        },
        {
          find: '    while (q != NULL && q->key != x) q = q->next;',
          accepted: ['    while (q != NULL && q->key != x) q = q->next;'],
          hint: '在桶链上顺序查找 key。',
          pitfall: '★ 链地址法查找在当前桶的链表上顺序比较，直到命中或链尾（q 为 NULL）。若把 `&&` 写成 `||`，q 为 NULL 时也试图访问 q->key 会段错误。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: 'p->next = head[pos]; head[pos] = p;',
          replace: 'p->next = NULL; head[pos] = p;',
          why: '头插法漏接旧链（p->next=NULL），每个桶只保留最后插入的结点，链上先插入的键全部丢失。',
          pitfall: '★ 头插法必须 `p->next = head[pos]` 接上旧桶链，再让 head[pos] 指向新结点。写成 NULL 后每个桶只剩最后一个键，查找其它键失败。',
        },
        {
          kind: '初始化错误',
          find: '    pos = x % M; q = head[pos];',
          replace: '    pos = x % M; q = head[0];',
          why: '查找时把链表头 q 初始化为 head[0]（而非 head[pos]），永远只查 0 号桶，其它桶的键都查不到。',
          pitfall: '★ 查找应 q = head[pos] 从「key 所在桶」的链头开始；写成 head[0] 后无论键在哪个桶都从 0 号桶找，其它桶的键全部查不到（head[0] 为空时还会误判未找到）。',
        },
      ],
      asks: [
        { label: '链地址法处理冲突的基本思路', answer: '同桶键挂成链', unit: '' },
        { label: '链地址法的平均查找长度相关因素', answer: '装填因子 α', unit: '' },
        { label: '链地址法查找在某桶链上的复杂度', answer: 'O(链长)', unit: '' },
        { label: '链地址法需删除键时用什么标记', answer: '直接删结点', unit: '' },
        { label: 'α=n/m，链地址法成功查找 ASL 约为', answer: '1+α/2', unit: '' },
      ],
      complexity: 'O(1) 平均',
      complexityAccepted: ['O(1)', 'O(1) 平均'],
      askSpace: '链地址法把冲突的键用链表挂在同一桶下，查找只扫描该桶的链。成功 ASL≈1+α/2，失败 ASL≈α，解除开放定址的堆积问题；删除只需摘链，无需懒删除。',
      notes: {
        idea: '链地址法：把散列到同一地址的键用单链串起来，表头数组 head[M] 每个元素指向一条链；查找只在对应桶的链上顺序比较。',
        steps: [
          'H(key)=key mod 13 定位桶。',
          '头插法把新键挂到桶链头。',
          '查找从桶链头顺序比较到命中或链尾。',
        ],
        complexity: '平均 O(1)（链长≈α），最坏 O(n)。',
        pitfalls: [
          '头插法先接旧链再改头指针。',
          '查找 q 从 head[pos] 起、判 q 为 NULL 结束。',
          '删除直接摘链，不堆积。',
        ],
      },
      explain: {
        code_reading: { steps: ['读 n 与 n 个键，头插挂链。', '读待查 key，在桶链上查找。', '输出是否找到。'] },
        code_completion: { steps: ['头插法挂链。', '桶链上顺序查找。'] },
        ds_debug: { steps: ['检查头插是否接链。', '检查查找起点与判空。'] },
        complexity_analysis: { steps: ['链长≈α。', '比较 1+α/2 次。'] },
      },
    },
    {
      key: 'block-search',
      cxaStem: '阅读下面的分块查找程序（索引顺序查找），回答各问。',
      section: '7.2 线性表的查找（顺序查找与折半查找）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['分块查找', '索引顺序查找', '索引表', 'ASL'],
      knowledgeIds: ['ds-ch07-07', 'ds-ch07-04'],
      code: `#include <stdio.h>
#define MAXN 30
int main(void){
    int a[MAXN], idx[10], n, s, nb, x, i, b, cmp = 0;
    scanf("%d %d", &n, &s);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    nb = (n + s - 1) / s;
    for (b = 0; b < nb; b++) { i = (b + 1) * s - 1; if (i > n - 1) i = n - 1; idx[b] = a[i]; }
    scanf("%d", &x);
    for (b = 0; b < nb; b++) { cmp++; if (x <= idx[b]) break; }
    if (b == nb) { printf("未找到 %d 比较 %d 次\\n", x, cmp); return 0; }
    for (i = b * s; i <= (b + 1) * s - 1 && i < n; i++) { cmp++; if (a[i] == x) { printf("找到 %d 位置 %d 比较 %d 次\\n", x, i, cmp); return 0; } }
    printf("未找到 %d 比较 %d 次\\n", x, cmp);
    return 0;
}`,
      stem: '分块查找（索引顺序查找）：把表分成若干块，每块内有序、块间按块最大关键字有序，建立索引表（每块最大值），先查索引确定块，再在块内顺序查找，统计比较次数。',
      inputs: [
        { stdin: '8 3\n22 30 45 40 51 68 79 90\n51\n', note: '块[22 30 45][40 51 68][79 90]，查 51。', why: '找到 51 位置 4。' },
        { stdin: '8 3\n22 30 45 40 51 68 79 90\n90\n', note: '查最大关键字。', why: '找到 90 位置 7。' },
        { stdin: '8 3\n22 30 45 40 51 68 79 90\n100\n', note: '超出所有块。', why: '未找到 100。' },
        { stdin: '6 2\n1 3 2 4 5 6\n5\n', note: '块[1 3][2 4][5 6]。', why: '找到 5 位置 4。' },
        { stdin: '4 2\n10 20 30 40\n30\n', note: '块[10 20][30 40]。', why: '找到 30 位置 2。' },
      ],
      blanks: [
        {
          find: '    for (b = 0; b < nb; b++) { i = (b + 1) * s - 1; if (i > n - 1) i = n - 1; idx[b] = a[i]; }',
          accepted: ['    for (b = 0; b < nb; b++) { i = (b + 1) * s - 1; if (i > n - 1) i = n - 1; idx[b] = a[i]; }'],
          hint: '索引表存每块的最大关键字（块有序时即块尾元素）。',
          pitfall: '★ 分块要求「块内可无序、块间有序」，索引表记录每块的最大关键字。这里取块尾（b 块最后一个元素）作最大值，前提是每块升序；若块内无序，块尾不一定是最大值，索引失效。',
        },
        {
          find: '    for (b = 0; b < nb; b++) { cmp++; if (x <= idx[b]) break; }',
          accepted: ['    for (b = 0; b < nb; b++) { cmp++; if (x <= idx[b]) break; }'],
          hint: '在索引表上顺序找「最大关键字 ≥ x」的块。',
          pitfall: '★ 先在索引表上确定 x 所在的块（第一个 idx[b]≥x 的块 b，表示 x 可能在该块）。若所有块最大关键字都 < x，则 x 不存在。索引表查找可用顺序或折半。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    for (b = 0; b < nb; b++) { cmp++; if (x <= idx[b]) break; }',
          replace: '    for (b = 0; b < nb; b++) { cmp++; if (x < idx[b]) break; }',
          why: '把索引查找条件 x<=idx[b] 改成 x<idx[b]，当 x 恰好等于某块最大关键字时，会跳过该块，查到下一块去。',
          pitfall: '★ 若 x 等于块的最大关键字 idx[b]，该块应被选中（x<=idx[b]）。写成严格 < 会跳过整块，导致找不到或查错块。',
        },
        {
          kind: '循环边界错误',
          find: '    for (i = b * s; i <= (b + 1) * s - 1 && i < n; i++) { cmp++; if (a[i] == x) { printf("找到 %d 位置 %d 比较 %d 次\\n", x, i, cmp); return 0; } }',
          replace: '    for (i = b * s; i < (b + 1) * s && i < n; i++) { cmp++; if (a[i] == x) { printf("找到 %d 位置 %d 比较 %d 次\\n", x, i, cmp); return 0; } }',
          why: '把块内查找上界从 (b+1)*s-1 改成 (b+1)*s（少查最后一个元素），块尾元素永远不会被检查。',
          pitfall: '★ 块 b 的范围是 [b*s, (b+1)*s-1]（含端点）。写成 i<(b+1)*s 会漏掉块尾元素（若它就是要找的 x 则查不到）。',
        },
      ],
      asks: [
        { label: '分块查找的平均查找长度（n 个元素、块长 s）', answer: '根号n加1', unit: '' },
        { label: '分块查找对块内与块间的有序性要求', answer: '块内无序块间有序', unit: '' },
        { label: '索引表存储什么', answer: '每块最大关键字', unit: '' },
        { label: '分块查找先查什么', answer: '索引表', unit: '' },
        { label: '把表分成 n 个元素、每块 sqrt(n) 时 ASL 约为', answer: 'sqrt(n)+1', unit: '' },
      ],
      complexity: 'O(sqrt(n))',
      complexityAccepted: ['O(sqrt(n))', 'O(sqrt n)', 'sqrt(n)'],
      askSpace: '分块查找 ASL = 查索引的 ASL + 块内查找的 ASL。若每块长度 s、共 n/s 块，总 ASL≈(n/s+s)/2+1，在 s=√n 时最小为 √n+1。插入只需在对应块内移动，比折半查找更灵活。',
      notes: {
        idea: '分块查找先查索引表（每块最大关键字，块间有序）确定块，再在该块内顺序查找。块内可无序，适合「插入频繁、查找也频繁」的动态表。',
        steps: [
          '分块并建索引表（每块最大值）。',
          '在索引表上找第一个 idx[b]≥x 的块。',
          '在块内顺序查找 x。',
        ],
        complexity: 'ASL≈√n+1（s=√n 时最优）。',
        pitfalls: [
          '索引表存每块最大关键字。',
          '索引表与块内查找各计一部分 ASL。',
          's=√n 时性能最优。',
        ],
      },
      explain: {
        code_reading: { steps: ['分块建索引。', '索引上定位块。', '块内顺序查找 x。'] },
        code_completion: { steps: ['索引表记录块最大。', '索引上找块。'] },
        ds_debug: { steps: ['检查索引查找条件。', '检查块内边界。'] },
        complexity_analysis: { steps: ['索引 ASL + 块内 ASL。', 's=√n 时最优 √n+1。'] },
      },
    },
    {
      key: 'bst-search',
      cxaStem: '阅读下面的二叉排序树递归查找程序（统计比较次数），回答各问。',
      section: '7.3 二叉排序树',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉排序树', '递归查找', '比较次数'],
      knowledgeIds: ['ds-ch07-08', 'ds-ch07-04'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct TNode { int data; struct TNode *l, *r; } TNode;
TNode *insert(TNode *t, int x){
    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }
    if (x < t->data) t->l = insert(t->l, x);
    else if (x > t->data) t->r = insert(t->r, x);
    return t;
}
int search(TNode *t, int key, int *cmp){
    (*cmp)++;
    if (t == NULL) return 0;
    if (key == t->data) return 1;
    if (key < t->data) return search(t->l, key, cmp);
    return search(t->r, key, cmp);
}
int main(void){
    int n, i, x, key, cmp = 0; TNode *root = NULL;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &x); root = insert(root, x); }
    scanf("%d", &key);
    if (search(root, key, &cmp)) printf("找到 %d 比较 %d 次\\n", key, cmp);
    else printf("未找到 %d 比较 %d 次\\n", key, cmp);
    return 0;
}`,
      stem: '用递归实现对二叉排序树的查找并统计比较次数：每次进入结点先计数，命中返回 1，小于走左、大于走右，空子树返回 0。',
      inputs: [
        { stdin: '6\n45 24 53 12 37 93\n24\n', note: '查 24（根左孩子）。', why: '找到 24 比较 2 次。' },
        { stdin: '6\n45 24 53 12 37 93\n53\n', note: '查 53（根右孩子）。', why: '找到 53 比较 2 次。' },
        { stdin: '6\n45 24 53 12 37 93\n100\n', note: '查不存在值。', why: '未找到 100 比较 4 次。' },
        { stdin: '1\n9\n9\n', note: '单结点。', why: '找到 9 比较 1 次。' },
      ],
      blanks: [
        {
          find: '    (*cmp)++;\n    if (t == NULL) return 0;',
          accepted: ['    (*cmp)++;\n    if (t == NULL) return 0;'],
          hint: '每次进入结点就计数；空子树返回未找到。',
          pitfall: '★ 每次递归进入一个结点都要把比较次数 +1（包括空子树那次，表示「比较后确定为空」）。若计数放错位置，比较次数会少计或不便于区分成功/失败。',
        },
        {
          find: '    if (key < t->data) return search(t->l, key, cmp);\n    return search(t->r, key, cmp);',
          accepted: ['    if (key < t->data) return search(t->l, key, cmp);\n    return search(t->r, key, cmp);'],
          hint: '小于走左、大于（含等于已被命中拦截）走右递归。',
          pitfall: '★ 递归查找：小于走左、大于走右。**必须先把命中（key==t->data）判掉**再决定左右；否则等于时也会递归下去。空子树（t==NULL）返回 0 结束。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (key < t->data) return search(t->l, key, cmp);\n    return search(t->r, key, cmp);',
          replace: '    if (key < t->data) return search(t->l, key, cmp);\n    return search(t->l, key, cmp);',
          why: '把大于时走右改成也走左，查找永远只往左子树走，等于把查找方向搞错。',
          pitfall: '★ 大于应走右子树；两个分支都走左会漏掉右子树，永远找不到右半的值（或对不存在的键持续走左直到空）。',
        },
        {
          kind: '循环边界错误',
          find: '    if (t == NULL) return 0;',
          replace: '    if (t == NULL) return 1;',
          why: '把空子树当作「找到」返回 1，查找永远成功，非空树上的 key 全被误判为找到。',
          pitfall: '★ 空子树说明沿该路径没有该 key，应返回 0（未找到）。返回 1 会让所有查找都报「找到」，语义完全反了。',
        },
      ],
      asks: [
        { label: '对插入 45 24 53 12 37 93，查 24 的比较次数', answer: '2', unit: '次' },
        { label: '查 53 的比较次数', answer: '2', unit: '次' },
        { label: '查 100（不存在）的比较次数', answer: '4', unit: '次' },
        { label: 'n 个结点理想 BST 的查找平均复杂度', answer: 'O(log n)', unit: '' },
        { label: 'BST 查找最坏退化成什么复杂度', answer: 'O(n)', unit: '' },
      ],
      complexity: 'O(log n) 平均',
      complexityAccepted: ['O(log n)', 'O(logn)', 'log n'],
      askSpace: 'BST 查找等价于在一条从根到叶的路径上比较，平均 O(log n)；若是退化成单支树（有序序列插入）则最坏 O(n)。比较次数等于命中结点的深度+1。',
      notes: {
        idea: 'BST 查找：小于根走左、大于根走右、相等命中；每次进入结点计数，空子树返回未找到。',
        steps: [
          '先判空子树返回未找到。',
          '命中返回 1。',
          '小于走左、大于走右递归。',
        ],
        complexity: '平均 O(log n)，最坏 O(n)。',
        pitfalls: [
          '先判命中再走左右。',
          '每次进入结点计数。',
          '有序输入退化单支。',
        ],
      },
      explain: {
        code_reading: { steps: ['建 BST。', '递归查找并计数。', '输出结果与比较次数。'] },
        code_completion: { steps: ['判空返回 0。', '命中返回 1，否则走左右。'] },
        ds_debug: { steps: ['检查命中判定与左右方向。', '检查空子树返回。'] },
        complexity_analysis: { steps: ['路径长即比较次数。', '平均 O(log n)。'] },
      },
    },
    {
      key: 'bst-minmax',
      cxaStem: '阅读下面的二叉排序树求最值与范围统计程序，回答各问。',
      section: '7.3 二叉排序树',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉排序树', '最小值', '最大值', '中序'],
      knowledgeIds: ['ds-ch07-08', 'ds-ch07-06'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct TNode { int data; struct TNode *l, *r; } TNode;
TNode *insert(TNode *t, int x){
    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }
    if (x < t->data) t->l = insert(t->l, x);
    else if (x > t->data) t->r = insert(t->r, x);
    return t;
}
int minof(TNode *t){ while (t->l != NULL) t = t->l; return t->data; }
int maxof(TNode *t){ while (t->r != NULL) t = t->r; return t->data; }
int main(void){
    int n, i, x; TNode *root = NULL;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &x); root = insert(root, x); }
    printf("最小值 %d 最大值 %d\\n", minof(root), maxof(root));
    return 0;
}`,
      stem: '对二叉排序树求最小值与最大值：最小值沿左子树一直走到最左，最大值沿右子树一直走到最右。',
      inputs: [
        { stdin: '6\n50 30 70 20 40 60\n', note: '教材序列。', why: '最小值 20 最大值 70。' },
        { stdin: '5\n1 2 3 4 5\n', note: '有序输入退化为右单支。', why: '最小值 1 最大值 5。' },
        { stdin: '3\n5 3 7\n', note: '平衡树。', why: '最小值 3 最大值 7。' },
      ],
      blanks: [
        {
          find: 'int minof(TNode *t){ while (t->l != NULL) t = t->l; return t->data; }',
          accepted: ['int minof(TNode *t){ while (t->l != NULL) t = t->l; return t->data; }'],
          hint: '最小值在左子树的最左端。',
          pitfall: '★ BST 最小值 = 一直往左走到最左的结点，最大值 = 一直往右走到最右的结点。这是 BST 中序有序性的直接推论。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'int minof(TNode *t){ while (t->l != NULL) t = t->l; return t->data; }',
          replace: 'int minof(TNode *t){ while (t->r != NULL) t = t->r; return t->data; }',
          why: '求最小值时误用右子树（t->r），返回的其实是最大值。',
          pitfall: '★ 最小值走左、最大值走右。把最小值写成走右，返回的是最大关键字，语义颠倒。',
        },
        {
          kind: '条件判断错误',
          find: 'int maxof(TNode *t){ while (t->r != NULL) t = t->r; return t->data; }',
          replace: 'int maxof(TNode *t){ while (t->l != NULL) t = t->l; return t->data; }',
          why: '求最大值时误用左子树（t->l），返回的其实是最小值。',
          pitfall: '★ 最大值走右；写成走左会返回最小关键字。',
        },
      ],
      asks: [
        { label: 'BST 的最小值位于', answer: '最左结点', unit: '' },
        { label: 'BST 的最大值位于', answer: '最右结点', unit: '' },
        { label: '对 50 30 70 20 40 60 的最小值', answer: '20', unit: '' },
        { label: '该树的最大值', answer: '70', unit: '' },
        { label: 'BST 中序遍历的结果', answer: '升序', unit: '' },
      ],
      complexity: 'O(h)',
      complexityAccepted: ['O(h)', 'O(log n) 平均'],
      askSpace: '求最值沿单一路径走到尽头，复杂度 O(h)，h 为树高。平衡时 O(log n)，退化为单支时 O(n)。',
      notes: {
        idea: 'BST 的中序有序性保证：最小值沿左子树走到最左端，最大值沿右子树走到最右端。',
        steps: [
          'minof 一直走 t->l。',
          'maxof 一直走 t->r。',
          '输出最值。',
        ],
        complexity: 'O(h)。',
        pitfalls: [
          '最左最右即最值。',
          '退化单支时 O(n)。',
        ],
      },
      explain: {
        code_reading: { steps: ['建 BST。', '取最左与最右。', '输出最小值最大值。'] },
        code_completion: { steps: ['最左即最小。', '最右即最大。'] },
        ds_debug: { steps: ['检查走左还是走右。', '修正后正确。'] },
        complexity_analysis: { steps: ['单路径 O(h)。'] },
      },
    },
    {
      key: 'avl-check',
      cxaStem: '阅读下面的平衡因子计算程序（判定 AVL 树），回答各问。',
      section: '7.4 平衡二叉树',
      difficulty: 3,
      bloom: 'apply',
      tags: ['平衡二叉树', '平衡因子', 'AVL', '树高'],
      knowledgeIds: ['ds-ch07-10', 'ds-ch07-02'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct TNode { int data; struct TNode *l, *r; } TNode;
TNode *insert(TNode *t, int x){
    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }
    if (x < t->data) t->l = insert(t->l, x);
    else if (x > t->data) t->r = insert(t->r, x);
    return t;
}
int height(TNode *t){ int hl, hr; if (t == NULL) return 0; hl = height(t->l); hr = height(t->r); return (hl > hr ? hl : hr) + 1; }
int bf(TNode *t){ return height(t->l) - height(t->r); }
void pp(TNode *t){ if (t == NULL) return; pp(t->l); printf("%d(%d) ", t->data, bf(t)); pp(t->r); }
int main(void){
    int n, i, x; TNode *root = NULL;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &x); root = insert(root, x); }
    pp(root); printf("\\n");
    return 0;
}`,
      stem: '建立一棵二叉排序树，计算每个结点的平衡因子（bf = 左子树高度 − 右子树高度），按中序输出「数据(平衡因子)」。',
      inputs: [
        { stdin: '5\n1 2 3 4 5\n', note: '有序输入退化为右单支。', why: '各结点 bf 为负。' },
        { stdin: '6\n50 30 70 20 40 60\n', note: '教材序列。', why: '各结点 bf 适中。' },
        { stdin: '3\n5 3 7\n', note: '平衡树。', why: '各结点 bf 为 0。' },
      ],
      blanks: [
        {
          find: 'int bf(TNode *t){ return height(t->l) - height(t->r); }',
          accepted: ['int bf(TNode *t){ return height(t->l) - height(t->r); }'],
          hint: '平衡因子 = 左子树高度 − 右子树高度。',
          pitfall: '★ AVL 平衡因子定义为「左子树高度 − 右子树高度」，取值 -1、0、+1 三种。若定义反（右−左），判定公式会随之反。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'int bf(TNode *t){ return height(t->l) - height(t->r); }',
          replace: 'int bf(TNode *t){ return height(t->r) - height(t->l); }',
          why: '把平衡因子定义为「右 − 左」，符号全反，左高变成负。',
          pitfall: '★ AVL 平衡因子约定为左−右；定义反了会导致原本 +2 的左失衡被算成 -2，旋转方向判定出错。',
        },
        {
          kind: '循环边界错误',
          find: 'int height(TNode *t){ int hl, hr; if (t == NULL) return 0; hl = height(t->l); hr = height(t->r); return (hl > hr ? hl : hr) + 1; }',
          replace: 'int height(TNode *t){ int hl, hr; if (t == NULL) return 0; hl = height(t->l); hr = height(t->r); return (hl < hr ? hl : hr) + 1; }',
          why: '树高取最小子树高度而非最大，树高算错，平衡因子随之错。',
          pitfall: '★ 树高 = 左右子树较大者 + 1；取较小者会把树高算小，平衡因子随之失真。',
        },
      ],
      asks: [
        { label: 'AVL 平衡因子的定义', answer: '左高减右高', unit: '' },
        { label: 'AVL 平衡因子允许的取值', answer: '-1、0、+1', unit: '' },
        { label: '对有序插入 1 2 3 4 5，根结点 1 的 bf', answer: '-4', unit: '' },
        { label: 'AVL 树高 h 与结点数 n 的关系', answer: 'h<=1.44log2(n+2)', unit: '' },
        { label: '树高函数返回什么', answer: 'max(左,右)+1', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n log n)'],
      askSpace: '平衡因子=左高−右高，AVL 树任意结点 |bf|≤1。树高 h≤1.44·log2(n+2)，保证了查找平衡的 O(log n)。',
      notes: {
        idea: 'AVL 树每个结点平衡因子 |bf|≤1。计算 bf=左高−右高可判定是否平衡；树高取左右较高者+1。',
        steps: [
          '递归求树高。',
          'bf = 左高 − 右高。',
          '中序输出每个结点及其 bf。',
        ],
        complexity: 'O(n) 求所有 bf（n 个结点，每结点 O(n) 若每次重算）。',
        pitfalls: [
          'bf=左−右。',
          '树高取 max+1。',
          '|bf|≤1 为平衡。',
        ],
      },
      explain: {
        code_reading: { steps: ['建 BST。', '递归求高。', '中序输出数据与 bf。'] },
        code_completion: { steps: ['bf=左高−右高。', '树高 max+1。'] },
        ds_debug: { steps: ['检查 bf 方向。', '检查树高取 max。'] },
        complexity_analysis: { steps: ['每结点算高 O(n)。'] },
      },
    },
    {
      key: 'bsearch-rec',
      cxaStem: '阅读下面的递归折半查找程序（统计比较次数），回答各问。',
      section: '7.2 线性表的查找（顺序查找与折半查找）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['折半查找', '递归', '有序表', '比较次数'],
      knowledgeIds: ['ds-ch07-06', 'ds-ch07-04'],
      code: `#include <stdio.h>
int binSearch(int a[], int lo, int hi, int key, int *cmp){
    int mid;
    if (lo > hi) return -1;
    mid = (lo + hi) / 2;
    (*cmp)++;
    if (a[mid] == key) return mid;
    if (a[mid] < key) return binSearch(a, mid + 1, hi, key, cmp);
    return binSearch(a, lo, mid - 1, key, cmp);
}
int main(void){
    int a[100], n, key, i, cmp = 0, pos;
    scanf("%d %d", &n, &key);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    pos = binSearch(a, 0, n - 1, key, &cmp);
    if (pos < 0) printf("未找到 %d 比较 %d 次\\n", key, cmp);
    else printf("找到 %d 下标 %d 比较 %d 次\\n", key, pos, cmp);
    return 0;
}`,
      stem: '用递归实现折半查找：每次取中间元素比较，命中返回下标，小于走右、大于走左，lo>hi 时未找到，统计比较次数。',
      inputs: [
        { stdin: '8 21\n5 13 19 21 37 56 64 75\n', note: 'key 恰好在中间。', why: '找到 21 下标 3 比较 1 次。' },
        { stdin: '8 75\n5 13 19 21 37 56 64 75\n', note: 'key 在末尾。', why: '找到 75 下标 7 比较 4 次。' },
        { stdin: '8 47\n5 13 19 21 37 56 64 75\n', note: 'key 不存在。', why: '未找到 47 比较 4 次。' },
        { stdin: '1 9\n9\n', note: '单元素。', why: '找到 9 下标 0 比较 1 次。' },
      ],
      blanks: [
        {
          find: '    if (lo > hi) return -1;',
          accepted: ['    if (lo > hi) return -1;'],
          hint: '查找区间为空则未找到。',
          pitfall: '★ 递归折半的出口是「区间为空」（lo>hi）时返回 -1。若写成 lo>=hi，会把「区间只剩一个元素」也当作未找到，导致漏查。',
        },
        {
          find: '    mid = (lo + hi) / 2;\n    (*cmp)++;',
          accepted: ['    mid = (lo + hi) / 2;\n    (*cmp)++;'],
          hint: '取中间下标并比较一次。',
          pitfall: '★ mid=(lo+hi)/2；比较后若中间值小于 key 则查右半（lo=mid+1），大于则查左半（hi=mid-1）。±1 绝不能省，否则可能死循环。',
        },
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: '    if (lo > hi) return -1;',
          replace: '    if (lo >= hi) return -1;',
          why: '把递归出口 lo>hi 改成 lo>=hi，区间只剩一个元素（lo==hi）时不再比较，该元素被跳过。',
          pitfall: '★ 折半查找必须允许 lo==hi（单元素区间仍要比较一次）。写成 lo>=hi 会漏掉最后一个可能的命中位置。',
        },
        {
          kind: '条件判断错误',
          find: '    if (a[mid] < key) return binSearch(a, mid + 1, hi, key, cmp);',
          replace: '    if (a[mid] > key) return binSearch(a, mid + 1, hi, key, cmp);',
          why: '把「小于走右」的比较条件反写成 a[mid]>key，查找方向完全颠倒：本应查右半时却走向错误分支，导致能查到一半却漏掉正确位置。',
          pitfall: '★ 折半查找分支条件必须与区间收缩方向匹配（小于走右、大于走左）。把 < 误写成 > 会让整个查找方向颠倒，能终止但结果错误。',
        },
      ],
      asks: [
        { label: '递归折半的出口条件', answer: 'lo>hi', unit: '' },
        { label: '对 8 个元素、key=21（中间）比较次数', answer: '1', unit: '' },
        { label: 'key=75（末尾）比较次数', answer: '4', unit: '' },
        { label: 'key=47（不存在）比较次数', answer: '4', unit: '' },
        { label: '折半查找要求表必须', answer: '有序且顺序存取', unit: '' },
      ],
      complexity: 'O(log n)',
      complexityAccepted: ['O(log n)', 'O(logn)', 'log n'],
      askSpace: '折半查找每次把区间减半，n 个元素最多 ⌊log2 n⌋+1 次比较；要求有序且可随机存取（顺序表）。',
      notes: {
        idea: '递归折半查找：取中间元素比较，小于则查右半（lo=mid+1），大于则查左半（hi=mid-1），空区间返回 -1。',
        steps: [
          'lo>hi 返回 -1。',
          '取 mid=(lo+hi)/2 比较。',
          '小于走右、大于走左递归。',
        ],
        complexity: 'O(log n)，空间 O(log n)（递归栈）。',
        pitfalls: [
          '出口 lo>hi。',
          '收缩必须 mid±1。',
          '要求有序顺序表。',
        ],
      },
      explain: {
        code_reading: { steps: ['读有序表与 key。', '递归折半。', '输出下标与比较次数。'] },
        code_completion: { steps: ['出口 lo>hi。', '取 mid 并递归收缩。'] },
        ds_debug: { steps: ['检查出口边界。', '检查收缩方向与 mid±1。'] },
        complexity_analysis: { steps: ['每次减半 O(log n)。'] },
      },
    },
  ],
};
