// ds-ch07 查找 扩充题库 — 程序库
// 规则：每个带 code 的 entry 派生 7 道题（cr×2 + cc + ds_debug + multi_bug_debug + complexity_analysis）
// 每个代码一律 -std=c99 -Wall -Wextra 零警告；expected 由生成器实跑得到，禁止手写。
// 所有查找程序都打印「是否找到 + 比较次数」—— expected 里固有断言，defect 一改结果立刻变化。
export default {
  shard: 'ds-ch07',
  chapter: '第7章 查找',
  category: 'ds',
  source: '自撰（依据《第7章 查找》教材考点变式）',
  entries: [
    {
      key: 'seq-search',
      section: '7.2 线性表的查找（顺序查找与折半查找）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['顺序查找', '哨兵', '比较次数', 'ASL'],
      knowledgeIds: ['ds-ch07-05', 'ds-ch07-04'],
      cxaStem: '阅读下面这段带哨兵的顺序查找算法（统计比较次数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int seqSearch(int a[], int n, int key, int *cmp){
    int i;
    a[0] = key;
    for (i = n; i >= 0 && a[i] != key; i--) (*cmp)++;
    (*cmp)++;
    return i;
}
int main(void){
    int a[MAXN], n, key, i, cmp = 0, pos;
    scanf("%d %d", &n, &key);
    for (i = 1; i <= n; i++) scanf("%d", &a[i]);
    pos = seqSearch(a, n, key, &cmp);
    if (pos == 0) printf("未找到 %d：比较 %d 次\\n", key, cmp);
    else printf("找到 %d，位置 %d：比较 %d 次\\n", key, pos, cmp);
    return 0;
}`,
      stem: '阅读下面这段带哨兵的顺序查找算法（数组元素存于 a[1..n]，a[0] 作哨兵），它返回关键字的位置并统计比较次数。请填空补全算法，然后回答：对给定输入，找到的位置与比较次数各是多少？',
      inputs: [
        { stdin: '5 49\n38 65 97 49 76\n', note: '关键字位于中间', why: '验证正确位置与比较次数=2' },
        { stdin: '5 99\n38 65 97 49 76\n', note: '关键字不存在', why: '验证未找到、比较次数=n+1=6' },
        { stdin: '4 97\n38 65 97 49\n', note: '关键字位于 a[3]', why: '验证比较次数=2' },
        { stdin: '2 5\n5 3\n', note: '关键字位于 a[1]', why: '验证比较次数=2（从右向左数）' },
        { stdin: '1 9\n9\n', note: '单元素', why: '关键字即唯一元素，比较 1 次' }
      ],
      blanks: [
        {
          find: '    a[0] = key;',
          accepted: ['    a[0] = key;'],
          hint: '在表头放入哨兵，其值等于待查关键字',
          pitfall: '哨兵必须等于 key（不是 0 或 -1），否则下标 0 处永远匹配不上，查找会越界。哨兵省去了循环内每次 i>=0 的判断。'
        },
        {
          find: '    for (i = n; i >= 0 && a[i] != key; i--) (*cmp)++;',
          accepted: ['    for (i = n; i >= 0 && a[i] != key; i--) (*cmp)++;'],
          hint: '从表尾向表头扫描，遇 key 或哨兵停',
          pitfall: '必须从 i=n 倒着扫（否则位置编号对应关系错）；循环条件里 a[i] != key 保证遇到哨兵（i==0 时 a[0]==key）才停，此时 i 为 0 表示未找到。'
        }
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: 'for (i = n; i >= 0 && a[i] != key; i--) (*cmp)++;',
          replace: 'for (i = n - 1; i >= 0 && a[i] != key; i--) (*cmp)++;',
          why: '把扫描起点从 i=n 改成 i=n-1，跳过最后一个元素；当关键字恰好在最后一个位置时找不到，返回「未找到」。',
          pitfall: '顺序查找从 a[n] 起倒着扫，终点是哨兵 a[0]；把起点写成 n-1 会漏查表尾元素，尤其当 key 在最末位时结果错误。'
        },
        {
          kind: '条件判断错误',
          find: 'a[i] != key',
          replace: 'a[i] == key',
          why: '把循环继续条件 a[i]!=key 反写成 a[i]==key，扫描在遇到「不等于 key 的元素」就停；结果返回的是某个不等于 key 的元素下标（可能为 -1，即越过哨兵）。',
          pitfall: '顺序查找要「继续扫直到碰到 key」；写成 a[i]==key 会「扫到一个不是 key 的元素就停」，语义完全反了。'
        }
      ],
      asks: [
        { label: '对输入 n=5、key=49、数组 38 65 97 49 76，找到的位置', answer: '4', unit: '' },
        { label: '同样输入，比较次数', answer: '2', unit: '次' },
        { label: '对 n=5、key=99（不在表中），比较次数', answer: '6', unit: '次' },
        { label: '带哨兵顺序查找，key 位于位置 p 时（1≤p≤n）的比较次数', answer: 'n-p+1', unit: '次' },
        { label: '带哨兵顺序查找的平均查找长度（等概率）', answer: '(n+1)/2', unit: '次' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性', 'n'],
      askSpace: '带哨兵顺序查找把边界判断移到循环外，比较次数与无哨兵版相同：成功时为 n-p+1 次（p 是位置），平均成功 ASL=(n+1)/2，失败为 n+1 次。',
      notes: {
        idea: '顺序查找从表尾向表头逐个比较，把关键字复制到 a[0] 作哨兵，避免每次循环内都要判断下标越界。',
        steps: [
          '把 key 存入 a[0] 作为哨兵',
          '从 i=n 开始倒着扫描，碰到 a[i]==key 就停',
          '返回下标 i：i==0 表示未找到，否则 i 就是位置'
        ],
        complexity: '时间 O(n)，成功平均 ASL=(n+1)/2，失败 n+1 次；空间 O(1)，对顺序表与链表都适用。',
        pitfalls: [
          '哨兵 a[0] 的值必须是 key，否则查找可能越界',
          '成功比较次数 = n-p+1，失败总比 n+1 次（含哨兵那次）',
          '适用于无序表或链表；有序表用折半查找更快'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n、key 与 n 个元素', '执行带哨兵的倒序扫描', '按返回的 i 输出找到/未找到与比较次数'] },
        code_completion: { steps: ['在 a[0] 放哨兵', '从表尾倒扫，遇 key 停'] },
        ds_debug: { steps: ['对比扫描起点 i=n 与哨兵 a[0]', '检查循环条件与返回下标对应关系'] },
        complexity_analysis: { steps: ['数出每次被比较的元素', '区分成功与失败两种情况', '用位置 p 导出 n-p+1'] }
      }
    },
    {
      key: 'binary-search',
      section: '7.2 线性表的查找（顺序查找与折半查找）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['折半查找', '有序表', '比较次数', '判定树'],
      knowledgeIds: ['ds-ch07-06', 'ds-ch07-04'],
      cxaStem: '阅读下面这段折半查找算法（统计比较次数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int binSearch(int a[], int n, int key, int *cmp){
    int lo = 0, hi = n - 1, mid;
    while (lo <= hi) {
        mid = (lo + hi) / 2;
        (*cmp)++;
        if (a[mid] == key) return mid;
        else if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
int main(void){
    int a[MAXN], n, key, i, cmp = 0, pos;
    scanf("%d %d", &n, &key);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    pos = binSearch(a, n, key, &cmp);
    if (pos < 0) printf("未找到 %d：比较 %d 次\\n", key, cmp);
    else printf("找到 %d，下标 %d：比较 %d 次\\n", key, pos, cmp);
    return 0;
}`,
      stem: '阅读下面这段折半查找算法（对有序数组 a[0..n-1] 查找 key，统计比较次数）。请填空补全算法，然后回答：对给定输入，找到的下标与比较次数各是多少？',
      inputs: [
        { stdin: '8 47\n5 13 19 21 37 56 64 75\n', note: '关键字不存在', why: '验证未找到、比较 3 次' },
        { stdin: '8 21\n5 13 19 21 37 56 64 75\n', note: '关键字位于中点', why: '验证第一次就命中，比较 1 次' },
        { stdin: '8 75\n5 13 19 21 37 56 64 75\n', note: '关键字位于末尾', why: '验证比较 4 次、下标 7' },
        { stdin: '1 9\n9\n', note: '单元素', why: '边界：n=1，比较 1 次' },
        { stdin: '5 49\n5 13 21 37 56\n', note: '关键字不存在', why: '验证未找到、比较 3 次' }
      ],
      blanks: [
        {
          find: '        mid = (lo + hi) / 2;',
          accepted: ['        mid = (lo + hi) / 2;'],
          hint: '取中间位置下标',
          pitfall: '折半查找 mid 必须取 (lo+hi)/2（向下取整）。若写成 (lo+hi) 会越界或错位；写成 lo+(hi-lo)/2 更稳（防溢出）。'
        },
        {
          find: '        else if (a[mid] < key) lo = mid + 1;',
          accepted: ['        else if (a[mid] < key) lo = mid + 1;'],
          hint: '中值小于 key，说明 key 在右半区，缩小下界',
          pitfall: 'a[mid] < key 时说明 key 在右半，lo 必须取 mid+1（不是 mid）；a[mid] > key 时 hi 取 mid-1。写成 lo=mid 或 hi=mid 会死循环。'
        }
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: 'while (lo <= hi) {',
          replace: 'while (lo < hi) {',
          why: '把折半查找边界从 lo<=hi 改成 lo<hi，当 lo==hi 时（区间只剩一个元素）循环不再执行，该元素永远不会被比较，关键字落在最后一个区间时查不到。',
          pitfall: '折半查找必须允许 lo==hi（区间只有一个元素仍要比较）；写成 lo<hi 会漏掉单元素区间。'
        },
        {
          kind: '条件判断错误',
          find: 'else if (a[mid] < key) lo = mid + 1;',
          replace: 'else if (a[mid] > key) lo = mid + 1;',
          why: '把「中值小于 key 则向右」错写成「中值大于 key 也向右」，当 key 在左半区时反而向右缩，划掉的是错误的一半，结果找不到。',
          pitfall: '折半查找的收缩方向：a[mid] < key → 向右（lo=mid+1），a[mid] > key → 向左（hi=mid-1）。方向写反会划掉正确的一半。'
        }
      ],
      asks: [
        { label: '对输入 n=8、key=21、数组 5 13 19 21 37 56 64 75，比较次数', answer: '1', unit: '次' },
        { label: '同样数组，key=75 时比较次数', answer: '4', unit: '次' },
        { label: 'key=47（不在表）时比较次数', answer: '3', unit: '次' },
        { label: 'n=15 的判定树，折半查找成功的最大比较次数', answer: '4', unit: '次' },
        { label: '折半查找的时间复杂度（n 个有序元素）', answer: 'O(log n)', unit: '' }
      ],
      complexity: 'O(log n)',
      complexityAccepted: ['O(log n)', 'O(logn)', 'log n', 'logn'],
      askSpace: '折半查找每次把查找区间缩小一半，n 个元素最多比较 ⌊log2(n)⌋+1 次；时间 O(log n)，要求表必须有序且能随机存取（顺序表）。',
      notes: {
        idea: '折半查找每次取中间元素与 key 比较，据比较结果把查找区间缩小一半，适用于有序顺序表。',
        steps: [
          '置 lo=0、hi=n-1',
          '取 mid=(lo+hi)/2，与 key 比较',
          '相等则返回；key 大于 a[mid] 则 lo=mid+1，否则 hi=mid-1',
          'lo>hi 时查找失败，返回 -1'
        ],
        complexity: '时间 O(log n)，成功 ASL≈log2(n+1)-1；空间 O(1)。',
        pitfalls: [
          '边界必须是 lo<=hi，且收缩为 mid±1，否则漏元素或死循环',
          '只适用于随机存取的顺序表，链表无法 O(1) 定位中间元素',
          '相等元素顺序不重要，但表必须有序'
        ]
      },
      explain: {
        code_reading: { steps: ['读入有序数组与 key', '折半缩小区间并计数', '输出下标与比较次数'] },
        code_completion: { steps: ['取中间下标', '据比较结果收缩左右边界'] },
        ds_debug: { steps: ['核对 lo<=hi 的循环边界', '检查左右收缩方向与 mid±1'] },
        complexity_analysis: { steps: ['数出每层区间缩小次数', '用 log 关系解释最多比较次数'] }
      }
    },
    {
      key: 'bst-insert',
      section: '7.3 二叉排序树',
      difficulty: 3,
      bloom: 'apply',
      tags: ['二叉排序树', '插入', '中序遍历', '查找'],
      knowledgeIds: ['ds-ch07-08', 'ds-ch07-02'],
      cxaStem: '阅读下面这段二叉排序树插入与查找程序（中序输出 + 查找比较计数），回答各问。',
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct TNode { int data; struct TNode *l, *r; } TNode;
TNode *insert(TNode *t, int x){
    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }
    if (x < t->data) t->l = insert(t->l, x);
    else if (x > t->data) t->r = insert(t->r, x);
    return t;
}
void inorder(TNode *t){
    if (t == NULL) return;
    inorder(t->l); printf("%d ", t->data); inorder(t->r);
}
int search(TNode *t, int key, int *cmp){
    while (t != NULL) { (*cmp)++; if (key < t->data) t = t->l; else if (key > t->data) t = t->r; else return 1; }
    return 0;
}
int main(void){
    int n, i, x, key, cmp = 0, found; TNode *root = NULL;
    scanf("%d", &n);
    for (i = 0; i < n; i++) { scanf("%d", &x); root = insert(root, x); }
    scanf("%d", &key);
    inorder(root); printf("\\n");
    found = search(root, key, &cmp);
    printf("%s 比较 %d 次\\n", found ? "找到" : "未找到", cmp);
    return 0;
}`,
      stem: '阅读下面这段二叉排序树程序：用插入法建树，中序遍历输出，再查找 key 并统计比较次数。请填空补全算法，然后回答：给定插入序列，中序遍历结果与查找比较次数各是多少？',
      inputs: [
        { stdin: '7\n45 24 53 12 37 37 93\n57\n', note: '教材例（含重复 37）', why: '验证中序为升序、重复值不重复插入' },
        { stdin: '7\n45 24 53 12 37 37 93\n24\n', note: '查找已存在值', why: '验证查找比较次数=2' },
        { stdin: '3\n2 1 3\n4\n', note: '查找不存在值', why: '验证未找到比较次数=2' },
        { stdin: '1\n9\n9\n', note: '单结点', why: '查找即根，比较 1 次' },
        { stdin: '2\n5 3\n3\n', note: '查找左孩子', why: '验证比较次数=2' }
      ],
      blanks: [
        {
          find: '    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }',
          accepted: ['    if (t == NULL) { TNode *p = malloc(sizeof(TNode)); p->data = x; p->l = p->r = NULL; return p; }'],
          hint: '空子树时新建一个结点保存 x',
          pitfall: '新结点必须把左右孩子都置 NULL 并返回；若漏置 r=l=NULL 会读到野指针。这里对重复值（既不小于也不大于）直接返回原结点，不插入。'
        },
        {
          find: '    if (x < t->data) t->l = insert(t->l, x);',
          accepted: ['    if (x < t->data) t->l = insert(t->l, x);'],
          hint: '小于根值则递归插入左子树',
          pitfall: '小于走左、大于走右；方向写反会使中序输出不再是升序。重复值（x==data）不插入、直接返回，保证树中无重复值。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'if (x < t->data) t->l = insert(t->l, x);',
          replace: 'if (x <= t->data) t->l = insert(t->l, x);',
          why: '把「小于则走左」改成「小于等于则走左」，重复值 37 会被作为新结点插入到原 37 的左子树，中序输出出现两个 37，不再是严格升序。',
          pitfall: '二叉排序树的插入规则是「小于走左、大于走右、相等不插」；把 < 写成 <= 会让等于根值的元素也插入，树中出现重复值。'
        },
        {
          kind: '条件判断错误',
          find: 'else if (key > t->data) t = t->r;',
          replace: 'else if (key >= t->data) t = t->r;',
          why: '查找时把「大于则走右」改成「大于等于则走右」，关键字等于某个结点时不再返回 1，而是一直往右走，最终把存在的 key 误判为「未找到」。',
          pitfall: '查找时 key==t->data 应立即返回；写成 >= 会漏掉命中，继续向右走到空才返回 0。'
        }
      ],
      asks: [
        { label: '对插入序列 45 24 53 12 37 37 93，中序遍历结果是否升序且无重复', answer: '是', unit: '' },
        { label: '查找 key=24 的比较次数', answer: '2', unit: '次' },
        { label: '查找 key=57 的比较次数', answer: '3', unit: '次' },
        { label: '对该二叉排序树，中序遍历输出的第一个元素', answer: '12', unit: '' },
        { label: 'n 个结点的理想二叉排序树，查找成功平均复杂度', answer: 'O(log n)', unit: '' }
      ],
      complexity: 'O(log n) 平均',
      complexityAccepted: ['O(log n)', 'O(logn)', 'log n'],
      askSpace: '二叉排序树查找等价于在「有序序列的判定树」上走一条从根到叶的路径；平均 O(log n)，最坏（单支树）退化为 O(n)。',
      notes: {
        idea: '二叉排序树（BST）：左子树所有值小于根，右子树所有值大于根；中序遍历得到有序序列。',
        steps: [
          '逐个元素调用 insert：小于走左、大于走右，遇到空位创建新结点',
          '重复值不插入，直接返回',
          '中序遍历输出升序序列',
          '查找沿一条从根到叶的路径比较，命中即停'
        ],
        complexity: '插入与查找平均 O(log n)，最坏 O(n)（退化单支）；中序 O(n)。',
        pitfalls: [
          '重复值不插入（严格大于/小于），否则中序出现重复',
          '插入顺序决定树形：有序输入会退化成单支链',
          '中序遍历结果总是升序，可作为验证树结构是否正确的手段'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与插入序列', '逐个插入建 BST', '中序输出', '查找并输出比较次数'] },
        code_completion: { steps: ['空位建新结点', '小于走左、大于走右递归'] },
        ds_debug: { steps: ['检查 < 与 > 的方向', '核对查找命中即 return 1'] },
        complexity_analysis: { steps: ['统计从根到命中结点的层数', '用对数关系解释平均 O(log n)'] }
      }
    }
  ]
};
