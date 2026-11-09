export default {
  shard: 'ds-ch02',
  chapter: '第2章 线性表',
  category: 'ds',
  source: '自撰（依据《第2章 线性表》教材考点变式：查找/双向插入/回文/去重/环检测/逆置）',
  entries: [
    {
      key: 'seq-search-list',
      cxaStem: '阅读下面的带头结点单链表顺序查找程序，回答下列问题。',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['单链表', '顺序查找', '比较次数'],
      knowledgeIds: ['ds-ch02-07', 'ds-ch02-06', 'ds-ch02-01'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static void freeList(LinkList L) { LNode *p = L, *q; while (p != NULL) { q = p->next; free(p); p = q; } }
static int seqSearch(LinkList L, int key, int *cmp) {
    LNode *p = L->next; int pos = 1; *cmp = 0;
    while (p != NULL) { (*cmp)++; if (p->data == key) return pos; p = p->next; pos++; }
    return 0;
}
int main(void) {
    int n, i, v, key, cmp, pos, a[64];
    LinkList L;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    if (scanf("%d", &key) != 1) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n);
    printf("查找 %d：", key);
    pos = seqSearch(L, key, &cmp);
    if (pos == 0) printf("未找到（比较 %d 次）\\n", cmp);
    else printf("位置 %d（比较 %d 次）\\n", pos, cmp);
    freeList(L);
    return 0;
}`,
      stem: '带头结点的单链表采用顺序查找，返回元素位置并统计比较次数。',
      inputs: [
        { stdin: '5\n10 20 30 40 50\n30\n', note: '长度为5，查找中间元素30', why: 'key 在第3个数据结点命中，比较3次返回位置3。' },
        { stdin: '4\n2 4 6 8\n6\n', note: '长度为4，查找6' },
        { stdin: '3\n1 2 3\n9\n', note: '查找不存在的9', why: '遍历完所有结点仍未命中，返回0。' },
        { stdin: '1\n7\n7\n', note: '单结点，查找命中', why: '首元素即命中，比较1次返回位置1。' },
        { stdin: '0\n5\n', note: '空表（只有头结点）', why: '头结点next为空，循环体不执行，比较0次。' }
      ],
      blanks: [
        { find: 'p = p->next; pos++;', accepted: ['p = p->next; pos++;'], hint: '每比较一个结点后要移动到后继结点，并使位置计数器加一。', pitfall: '若漏掉前移或位置计数，会导致位置错误或死循环。' },
        { find: 'if (p->data == key) return pos;', accepted: ['if (p->data == key) return pos;'], hint: '比较命中时返回当前结点位置。', pitfall: '位置从1开始编号，头结点（哑元）不计入。' }
      ],
      defects: [
        { kind: '循环边界错误', find: 'int pos = 1; *cmp = 0;', replace: 'int pos = 0; *cmp = 0;', why: '位置初值从1改成0，导致命中时返回的位置比实际小1，位于第1个位置的元素会被误判为“未找到”。', pitfall: '位置编号应从1开始，初始化为1才能正确对应首个数据结点。' },
        { kind: '条件判断错误', find: 'if (p->data == key) return pos;', replace: 'if (p->data == key) return 0;', why: '命中时返回0，被主程序当作“未找到”处理，命中元素被误报为未找到。', pitfall: '返回值0专门表示查找失败，命中时必须返回真实位置。' }
      ],
      asks: [
        { label: '长度为 n 的带头结点单链表，查找失败（key 不在表中）时要比较多少次？', answer: 'n 次' },
        { label: 'key 恰好在第1个数据结点时，程序返回的位置是几？', answer: '1' },
        { label: '查找成功且等概率时，平均比较次数（近似）是多少？', answer: '(n+1)/2 次' },
        { label: '该顺序查找的时间复杂度是多少？', answer: 'O(n)' },
        { label: '除了返回位置，程序还额外输出了什么信息？', answer: '比较次数' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '带头结点的单链表顺序查找：从首个数据结点开始逐结点比较，用比较次数刻画查找代价，位置从1开始编号，未找到返回0。',
        steps: ['用数组建立带头结点的单链表', '查找函数从 L->next 出发逐结点比较', '每比较一次计数器加一', '命中返回当前数据结点位置', '循环结束仍未见则返回0'],
        complexity: '时间 O(n)（最坏比较 n 次），空间 O(1)（除链表本身外只用常数辅助空间）。',
        pitfalls: [
          '头结点是哑元，不存储有效数据，查找必须从 L->next 开始，位置也从1编号。',
          '返回0表示查找失败，与第一个数据结点的位置1截然不同，不能混淆。',
          '比较次数包括最后一次与“未命中”的那次比较。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及 n 个整数建表', '读取 key', '调 seqSearch 逐结点比较', '按是否命中输出位置或未找到并给出比较次数'] },
        ds_debug: { idea: '位置计数初值错误导致命中位置整体减一，首个位置元素被当成未找到。', steps: ['定位到 seqSearch 的位置初始化行', '发现 pos 从1被改成0', '命中第一个元素时返回0被主程序判为未找到', '改回 pos=1 后输出位置正确'] },
        complexity_analysis: { idea: '线性查找每次比较一个结点，最坏、平均、最好复杂度均为 O(n) 量级；额外空间只用于计数，为 O(1)。' }
      }
    },
    {
      key: 'dlist-insert-pos',
      cxaStem: '阅读下面的带头结点双向链表按位置插入程序，回答下列问题。',
      section: '2.4 循环链表与双向链表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['双向链表', '按位置插入', '四指针改向'],
      knowledgeIds: ['ds-ch02-09', 'ds-ch02-04', 'ds-ch02-01'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct DNode { int data; struct DNode *prior, *next; } DNode, *DList;
static DList buildFrom(const int *a, int n) {
    DList head = (DList)malloc(sizeof(DNode)); DNode *tail = head; int i;
    head->data = 0; head->prior = NULL; head->next = NULL;
    for (i = 0; i < n; i++) { DNode *s = (DNode *)malloc(sizeof(DNode)); s->data = a[i]; s->prior = tail; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static void freeList(DList L) { DNode *p = L, *q; while (p != NULL) { q = p->next; free(p); p = q; } }
static void showF(DList L) { DNode *p; printf("正序:"); for (p = L->next; p != NULL; p = p->next) printf(" %d", p->data); printf("\\n"); }
static void showB(DList L) { DNode *p = L, *t = L; printf("倒序:"); while (t->next != NULL) t = t->next; for (p = t; p != L; p = p->prior) printf(" %d", p->data); printf("\\n"); }
static DNode *locate(DList L, int pos) {
    DNode *p = L; int k;
    for (k = 1; k < pos; k++) p = p->next;
    return p;
}
static void insAt(DList L, int pos, int x) {
    DNode *p = locate(L, pos), *s = (DNode *)malloc(sizeof(DNode));
    s->data = x; s->prior = p; s->next = p->next;
    if (p->next != NULL) p->next->prior = s;
    p->next = s;
}
int main(void) {
    int n, i, v, pos, x, a[64];
    DList L;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    if (scanf("%d %d", &pos, &x) != 2 || pos < 1 || pos > n + 1) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n);
    printf("插入前\\n"); showF(L);
    insAt(L, pos, x);
    printf("插入后\\n"); showF(L); showB(L);
    freeList(L);
    return 0;
}`,
      stem: '带头结点的双向链表按给定位置插入一个元素，插入后正序、倒序打印。',
      inputs: [
        { stdin: '3\n1 2 3\n2 99\n', note: '插入到位置2', why: '新值99成为第2个数据结点，正序为1 99 2 3。' },
        { stdin: '3\n1 2 3\n4 88\n', note: '插入到末尾之后' },
        { stdin: '3\n1 2 3\n1 7\n', note: '插入到位置1（最前）', why: '99...新值7成为新首结点，倒序末尾变为7。' },
        { stdin: '0\n1 5\n', note: '空表插入到位置1' },
        { stdin: '2\n8 9\n2 4\n', note: '插入中间' }
      ],
      blanks: [
        { find: 's->next = p->next;', accepted: ['s->next = p->next;'], hint: '新结点先连上后继（p 的当前后继）。', pitfall: '必须先保存 p->next 到 s->next，否则后续改 p->next 会丢链。' },
        { find: 'if (p->next != NULL) p->next->prior = s;', accepted: ['if (p->next != NULL) p->next->prior = s;'], hint: '让原后继的 prior 回指新结点（注意 p 是最后一个结点时为空）。', pitfall: 'p->next 为 NULL（末尾插入）时不能解引用，须先判空。' }
      ],
      defects: [
        { kind: '指针丢失', find: 'p->next = s;', replace: 's->data = x;', why: '丢掉了把新结点接入正向链的一行，新结点未真正插入，正序/倒序都看不到它。', pitfall: '插入是“接入链表”而非只改结点自身，p->next=s 是接入正向链的关键。' },
        { kind: '循环边界错误', find: 'for (k = 1; k < pos; k++) p = p->next;', replace: 'for (k = 1; k < pos - 1; k++) p = p->next;', why: 'locate 少前进一个结点，导致插入位置整体前移一位（插入在其正确位置的前一个位置）。', pitfall: '在带头结点链表中，locate 需前进 pos-1 步才能定位到第 pos 个数据结点的前驱。' }
      ],
      asks: [
        { label: '长度为 n 的带头结点双向链表，合法的插入位置共有多少个？', answer: 'n+1 个' },
        { label: '插入到第 i 个数据结点前，locate 函数要从头结点前进多少步？', answer: 'i-1 步' },
        { label: '一个结点插入到非末尾位置，通常需要改动多少个指针？', answer: '4 个' },
        { label: '该按位置插入的时间复杂度是多少？', answer: 'O(n)' },
        { label: '与单链表相比，双向链表删除结点时可省去什么操作？', answer: '查找前驱结点' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '带头结点双向链表按位置插入：先定位到插入位的前驱结点，再用四指针改向把新结点接入，插入到末尾时对空指针判空。',
        steps: ['用数组建立带头结点的双向链表', 'locate 定位到第 pos 个数据结点的前驱 p', '新建结点并赋 data', '接入正向链：s->next=p->next, p->next=s', '接入反向链：s->prior=p，非空时 p->next->prior=s', '正序和倒序打印核对'],
        complexity: '时间 O(n)（locate 需线性定位），空间 O(1)（除新结点外只用常数辅助）。',
        pitfalls: [
          'locate 需前进 pos-1 步，位置从1开始计数，头结点不计入。',
          '插入到末尾（p->next==NULL）时不能写 p->next->prior=s，须判空。',
          '四指针改向的顺序很关键：先接正向、再接反向，否则会丢链或指向错误。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及元素建双向链表', '读取插入位置 pos 与值 x', 'locate 定位前驱', 'insAt 完成四指针改向', '正序与倒序打印结果'] },
        ds_debug: { idea: '正向接入行被丢掉，新结点没有接入链表，正序/倒序都看不到它。', steps: ['定位到 insAt 的 p->next=s; 行', '发现被替换成 s->data=x;', '运行后链表长度未变，新值缺失', '恢复 p->next=s; 后插入正常'] },
        complexity_analysis: { idea: '按位置插入要先线性定位到插入点，故时间复杂度为 O(n)；除新建结点外只用常数辅助空间 O(1)。' }
      }
    },
    {
      key: 'list-palindrome',
      cxaStem: '阅读下面的单链表回文判断程序，回答下列问题。',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '回文', '逆置复本比较'],
      knowledgeIds: ['ds-ch02-01', 'ds-ch02-06', 'ds-ch02-07'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static void show(const char *lb, LinkList L) { LNode *p; printf("%s", lb); for (p = L->next; p != NULL; p = p->next) printf(" %d", p->data); printf("\\n"); }
static LinkList reverseCopy(LinkList L) {
    LinkList R = (LinkList)malloc(sizeof(LNode)); LNode *p; R->data = 0; R->next = NULL;
    for (p = L->next; p != NULL; p = p->next) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = p->data; s->next = R->next; R->next = s; }
    return R;
}
static int isPalindrome(LinkList L, LinkList R) {
    LNode *p = L->next, *q = R->next;
    while (p != NULL && q != NULL) { if (p->data != q->data) return 0; p = p->next; q = q->next; }
    return 1;
}
static void freeList(LinkList L) { LNode *p = L, *q; while (p != NULL) { q = p->next; free(p); p = q; } }
int main(void) {
    int n, i, v, a[64]; LinkList L, R;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    L = buildFrom(a, n); R = reverseCopy(L);
    show("原表:", L); show("逆置:", R);
    printf((isPalindrome(L, R)) ? "判断：是回文\\n" : "判断：不是回文\\n");
    freeList(L); freeList(R);
    return 0;
}`,
      stem: '将单链表逆序复制一份，再两表逐结点比较以判断回文，并打印两表。',
      inputs: [
        { stdin: '5\n1 2 3 2 1\n', note: '回文序列', why: '逆置后与原表完全相同，判断为回文。' },
        { stdin: '4\n1 2 3 4\n', note: '非回文序列' },
        { stdin: '6\n3 1 2 2 1 3\n', note: '对称回文', why: '逐位对应相等，判断为回文。' },
        { stdin: '3\n1 2 2\n', note: '非回文' },
        { stdin: '1\n9\n', note: '单元素即回文', why: '单个元素无论正读倒读都一样，判断为回文。' }
      ],
      blanks: [
        { find: 's->next = R->next;', accepted: ['s->next = R->next;'], hint: '用头插法复制，新结点指向上次的头（从而实现逆置）。', pitfall: '头插法必须让 s->next 先指向当前 R 的头，否则顺序就与原表一致而非逆置。' },
        { find: 'R->next = s;', accepted: ['R->next = s;'], hint: '把新结点接到逆置表的头部。', pitfall: '漏掉这一行则新结点无法挂到 R 表，逆置表只有最后一个元素。' }
      ],
      defects: [
        { kind: '条件判断错误', find: 'if (p->data != q->data) return 0;', replace: 'if (p->data != q->data) return 1;', why: '不相等时应判“不是回文”，却返回1，导致非回文序列被误判为回文。', pitfall: '“发现不等即返回不是回文”是正确判断；写成返回1则结论恰好颠倒。' },
        { kind: '条件判断错误', find: 'q = q->next;', replace: 'q = R->next;', why: '比较指针 q 没有沿逆置表前进，每轮都被重置为逆置表头，只能重复比较首尾两个元素。', pitfall: 'q 必须随 p 同步前移，否则无法逐位对应比较整个序列。' }
      ],
      asks: [
        { label: '逆置复制一个有 n 个数据结点的单链表，需要新建多少个数据结点？', answer: 'n 个' },
        { label: '该“逆置复制 + 比较”判断回文的时间复杂度是多少？', answer: 'O(n)' },
        { label: '为什么单链表判断回文不能像数组那样直接用两个下标？', answer: '单链表不能随机访问/无法从后向前遍历' },
        { label: '若原表为 1 2 3 2 1，程序输出“判断”后面的结果是？', answer: '是回文' },
        { label: '判断回文时，程序额外打印了逆置表，这属于哪一种辅助手段？', answer: '占用 O(n) 空间的逆置复本' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '单链表不能从后向前遍历，故先把原表逆序复制成新表，再让两表逐结点同步比较，全部相等即回文。',
        steps: ['建立带头结点的单链表并打印原表', '头插法复制出一张逆置表', '双指针 p、q 分别沿原表与逆置表前进', '任一位置不等即判非回文', '全部对应相等则判回文'],
        complexity: '时间 O(n)（一次复制 O(n) + 一次比较 O(n)），空间 O(n)（新建逆置复本）。',
        pitfalls: [
          '逆置必须用头插法（s->next 先指当前头再挂到头部），尾插法会得到与原表一样的顺序。',
          '判回文要逐位比较整个序列，不能只看首尾一对。',
          '空表或单元素表都应判为回文（循环自然结束返回1）。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及元素建表并打印原表', '头插法复制逆置表', '打印逆置表', '双指针逐结点比较', '输出“是回文/不是回文”'] },
        ds_debug: { idea: '不相等分支的返回值写反，非回文序列被误判为回文。', steps: ['定位 isPalindrome 中的 if (p->data != q->data) return 0;', '发现被改成 return 1;', '对非回文输入输出被误判为“是回文”', '恢复 return 0; 后结论正确'] },
        complexity_analysis: { idea: '两次线性扫描各 O(n)，总时间 O(n)；因新建逆置复本需 O(n) 辅助空间。' }
      }
    },
    {
      key: 'seq-reverse-inplace',
      cxaStem: '阅读下面的顺序表就地逆置程序，回答下列问题。',
      section: '2.2 线性表的顺序表示（顺序表）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['顺序表', '就地逆置', '对称交换'],
      knowledgeIds: ['ds-ch02-12', 'ds-ch02-02', 'ds-ch02-05'],
      code: `#include <stdio.h>
#define MAXLEN 64
int main(void) {
    int a[MAXLEN], n, i, t, swaps = 0;
    if (scanf("%d", &n) != 1 || n < 0 || n > MAXLEN) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; } }
    printf("逆置前:"); for (i = 0; i < n; i++) printf(" %d", a[i]); printf("\\n");
    for (i = 0; i < n / 2; i++) { t = a[i]; a[i] = a[n - 1 - i]; a[n - 1 - i] = t; swaps++; }
    printf("逆置后:"); for (i = 0; i < n; i++) printf(" %d", a[i]); printf("\\n");
    printf("交换次数：%d（n/2=%d）相符=%d\\n", swaps, n / 2, swaps == n / 2);
    return 0;
}`,
      stem: '顺序表就地逆置：对称位置元素交换，并统计交换次数与其理论值比对。',
      inputs: [
        { stdin: '5\n1 2 3 4 5\n', note: '奇数长度', why: '中间元素不用交换，交换次数2。' },
        { stdin: '4\n1 2 3 4\n', note: '偶数长度' },
        { stdin: '6\n3 1 2 2 1 3\n', note: '偶数长度且回文' },
        { stdin: '1\n9\n', note: '单元素', why: 'n/2=0，无需交换。' },
        { stdin: '3\n7 8 9\n', note: '奇数长度' }
      ],
      blanks: [
        { find: 'a[n - 1 - i] = t;', accepted: ['a[n - 1 - i] = t;'], hint: '把暂存的 a[i] 写回对称位置，完成一次交换。', pitfall: '必须用临时变量 t 保留 a[i]，否则覆盖后会丢失原值。' },
        { find: 'i < n / 2', accepted: ['i < n / 2'], hint: '只需交换前一半与后一半，循环到 n/2 即可。', pitfall: '循环边界写成 <= n/2 会在偶数长度时把已交换的元素又换回去。' }
      ],
      defects: [
        { kind: '循环边界错误', find: 'for (i = 0; i < n / 2; i++)', replace: 'for (i = 0; i <= n / 2; i++)', why: '循环多执行一轮，偶数长度时中间一对被交换两次，结果回到原始顺序（等于没逆置）。', pitfall: '涉偶数长度时 i<=n/2 多一轮，把对称元素换回去；应坚持 i<n/2。' },
        { kind: '赋值顺序错误', find: 'a[i] = a[n - 1 - i]; a[n - 1 - i] = t;', replace: 'a[i] = a[n - 1 - i]; a[i] = t;', why: '交换时把暂存值 t 写回到 a[i] 而不是对称位置 a[n-1-i]，于是 a[i] 被恢复成原值、a[n-1-i] 保持原值，顺序表等于没有逆置。', pitfall: '三步交换的最后一步必须把 t 写回对称位置 a[n-1-i]；写回 a[i] 会让一次交换前后不变。' }
      ],
      asks: [
        { label: '长度为 n 的顺序表就地逆置，共需交换多少次（用 n 表示）？', answer: 'n/2（向下取整）' },
        { label: 'n=5 时程序输出的交换次数是多少？', answer: '2' },
        { label: '为什么交换循环的边界取 n/2 而不是 n？', answer: '对称位置成对交换，交换前一半即同时完成后一半' },
        { label: '就地逆置的空间复杂度是多少？', answer: 'O(1)' },
        { label: '若表长为偶数 n，逆置后首元素来自原表的哪个位置？', answer: '第 n 个位置（a[n-1]）' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '顺序表就地逆置：对前一半元素与其对称位置元素交换，交换次数为 n/2 且原地完成，不需额外数组。',
        steps: ['读取 n 及元素并打印原表', '对 i 从 0 到 n/2-1 逐个交换 a[i] 与 a[n-1-i]', '用临时变量 t 完成三步交换并计数', '打印逆置结果与交换次数', '用 swaps==n/2 自检'],
        complexity: '时间 O(n)（交换约 n/2 次），空间 O(1)（只用临时变量 t）。',
        pitfalls: [
          '交换必须三步（暂存→覆盖→回写），缺一步会丢失数据。',
          '循环上界为 n/2，写成 <= 会在偶数长度时“换回去”。',
          '奇数长度时中间元素不动，交换次数恰为 floor(n/2)。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及元素并打印逆置前', '循环交换对称元素并累计 swaps', '打印逆置后序列', '打印交换次数并与 n/2 比较'] },
        ds_debug: { idea: '循环多跑一轮导致偶数长度的表被“换回去”，输出仍是原始顺序。', steps: ['定位到 for (i = 0; i < n / 2; i++)', '发现被改成 i <= n / 2', '对偶数长度输入，中间一对被换两次而回到原序', '改回 i < n / 2 后逆置正确'] },
        complexity_analysis: { idea: '只需扫描前一半元素做对称交换，时间 O(n)；只用一个临时变量，辅助空间 O(1)。' }
      }
    },
    {
      key: 'list-cycle-detect',
      cxaStem: '阅读下面的快慢指针检测链表环程序，回答下列问题。',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 4,
      bloom: 'analyze',
      tags: ['单链表', '环的检测', '快慢指针'],
      knowledgeIds: ['ds-ch02-03', 'ds-ch02-01', 'ds-ch02-12'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static LNode *nodeAt(LinkList L, int pos) { LNode *p = L->next; int k; for (k = 1; k < pos; k++) p = p->next; return p; }
static int hasCycle(LinkList L) {
    LNode *slow = L->next, *fast = L->next;
    while (fast != NULL && fast->next != NULL) { slow = slow->next; fast = fast->next->next; if (slow == fast) return 1; }
    return 0;
}
int main(void) {
    int n, i, v, k, a[64]; LinkList L; LNode *p;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    if (scanf("%d", &k) != 1) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n);
    if (k >= 1 && k <= n) { p = L; while (p->next != NULL) p = p->next; p->next = nodeAt(L, k); }
    printf("k=%d，", k);
    printf(hasCycle(L) ? "存在环\\n" : "无环（线性链）\\n");
    return 0;
}`,
      stem: '读入 n 个元素建表，若 k 在 [1,n] 内则把末尾结点接到第 k 个数据结点上成环，再用快慢指针判环。',
      inputs: [
        { stdin: '5\n1 2 3 4 5\n0\n', note: 'k=0，不建环', why: '末尾不接入任何结点，为无环线性链。' },
        { stdin: '4\n1 2 3 4\n2\n', note: '环入口为第2个结点', why: '末尾指向第2个数据结点形成环。' },
        { stdin: '3\n1 2 3\n3\n', note: '末尾自成环（只含尾结点）', why: '末尾结点 next 指向自身，形成单结点环。' },
        { stdin: '2\n8 9\n0\n', note: '无环' },
        { stdin: '1\n7\n1\n', note: '单结点自成环', why: '唯一结点的 next 指向自身。' }
      ],
      blanks: [
        { find: 'fast = fast->next->next;', accepted: ['fast = fast->next->next;'], hint: '快指针每次前进两步。', pitfall: '快指针每次走两步才能与慢指针形成速度差从而相遇；走一步则可能始终同行。' },
        { find: 'if (slow == fast) return 1;', accepted: ['if (slow == fast) return 1;'], hint: '两指针相遇说明链表存在环。', pitfall: '相遇即判有环，但前提是快慢指针速度不同，否则永远无法拉开差距。' }
      ],
      defects: [
        { kind: '条件判断错误', find: 'fast = fast->next->next;', replace: 'fast = fast->next;', why: '快指针改成一进走一步，与慢指针同速，始终并行；在无环且长度≥2 的表上会误判为“存在环”。', pitfall: '快指针必须每次走两步形成速度差，才能与慢指针相遇，否则无环表也会误报。' },
        { kind: '条件判断错误', find: 'if (slow == fast) return 1;', replace: 'if (slow == fast) return 0;', why: '相遇时本应判“有环”，却返回0，导致有环表被判成无环。', pitfall: '相遇返回1代表“存在环”；返回0则结论相反。' }
      ],
      asks: [
        { label: '快慢指针检测环，为什么快指针每次要走两步？', answer: '与慢指针形成速度差，保证有环时一定能追上' },
        { label: '无环单链表（长度 n）用快慢指针检测，循环最多执行约多少次？', answer: '约 n/2 次' },
        { label: '检测环的辅助空间复杂度是多少？', answer: 'O(1)' },
        { label: '若把快指针也改为每次一步，对长度为2的无环表会输出什么？', answer: '“存在环”（错误）' },
        { label: '一个长度为 1 且末尾自环（k=1）的链表，程序输出是？', answer: '存在环' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '快慢指针：快指针每次走2步、慢指针每次走1步，若链表有环两者必在环内相遇；若无环，快指针先到表尾结束。',
        steps: ['建表，并在 [1,n] 内时把末尾接到第 k 个数据结点成环', '初始化慢 slow、快 fast 都指向首数据结点', '快指针非空且 next 非空时快走2、慢走1', '若 slow==fast 返回“有环”', '快指针先到空则返回“无环”'],
        complexity: '时间 O(n)（快指针至多走约 2n 步即遇空或相遇），空间 O(1)。',
        pitfalls: [
          '快指针每次必须走两步，否则与慢指针同速，无环表也可能误判有环。',
          '判环前要判断 fast 与 fast->next 非空，避免解引用空指针。',
          '末尾自环（k=n）与自环（k=1）都属有环，程序应输出“存在环”。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及元素建表', '根据 k 决定是否把末尾接到第 k 个结点成环', '初始 slow 与 fast 都指向首结点', '快慢指针不等速前进，相遇则输出存在环', '快指针先到空则输出无环'] },
        ds_debug: { idea: '快指针误改为每次一步，与慢指针同速，无环表（长度≥2）被误判为存在环。', steps: ['定位 hasCycle 中的 fast = fast->next->next;', '发现被改成 fast = fast->next;', '对无环且长度≥2 的表，两指针始终同行并相遇', '改回 fast->next->next 后判环正确'] },
        complexity_analysis: { idea: '快指针至多走约2n步，慢指针约n步，时间 O(n)；只用了两个指针，辅助空间 O(1)。' }
      }
    },
    {
      key: 'seq-delete-dups',
      cxaStem: '阅读下面的顺序表去重程序，回答下列问题。',
      section: '2.2 线性表的顺序表示（顺序表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['顺序表', '去重', '保持首次出现'],
      knowledgeIds: ['ds-ch02-05', 'ds-ch02-02', 'ds-ch02-11'],
      code: `#include <stdio.h>
#define MAXLEN 64
static int dedup(int a[], int n) {
    int i, j, k = 0;
    for (i = 0; i < n; i++) {
        for (j = 0; j < k; j++) if (a[j] == a[i]) break;
        if (j == k) a[k++] = a[i];
    }
    return k;
}
int main(void) {
    int a[MAXLEN], n, i, newlen;
    if (scanf("%d", &n) != 1 || n < 0 || n > MAXLEN) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; } }
    printf("原表:"); for (i = 0; i < n; i++) printf(" %d", a[i]); printf("\\n");
    newlen = dedup(a, n);
    printf("去重后:"); for (i = 0; i < newlen; i++) printf(" %d", a[i]); printf("\\n");
    printf("新长度：%d（原 %d）\\n", newlen, n);
    return 0;
}`,
      stem: '顺序表去重，保留每个值首次出现的位置，就地返回去重后的长度。',
      inputs: [
        { stdin: '7\n2 3 2 1 3 4 1\n', note: '含重复的元素', why: '保留首次出现，去重后为 2 3 1 4。' },
        { stdin: '5\n1 1 1 1 1\n', note: '全部相同', why: '只保留一个，新长度为1。' },
        { stdin: '4\n1 2 3 4\n', note: '无重复', why: '全部保留，新长度为4。' },
        { stdin: '6\n5 5 4 4 3 3\n', note: '成对重复' },
        { stdin: '1\n9\n', note: '单元素', why: '无重复，新长度为1。' }
      ],
      blanks: [
        { find: 'a[k++] = a[i];', accepted: ['a[k++] = a[i];'], hint: '当 a[i] 在已保留区未出现时，把它写入保留区并让长度加一。', pitfall: '必须同时写 k 增一，否则长度计数不更新导致结果错误。' },
        { find: 'for (j = 0; j < k; j++)', accepted: ['for (j = 0; j < k; j++)'], hint: '在已保留的 k 个元素中逐个查找是否出现过 a[i]。', pitfall: '内层只需在已保留的 k 个元素中查找，而不是整个数组。' }
      ],
      defects: [
        { kind: '条件判断错误', find: 'if (j == k) a[k++] = a[i];', replace: 'if (j == k) a[k] = a[i];', why: '把 a[i] 写入保留区却没让 k 增一，k 恒为0，最终返回长度0。', pitfall: '写入保留区后必须 k++，否则长度计数不增长。' },
        { kind: '条件判断错误', find: 'return k;', replace: 'return n;', why: '直接返回原表长 n，去重后的实际长度被忽略，输出去重后含未被处理的位置。', pitfall: '应返回实际保留的元素个数 k，而不是原始长度 n。' }
      ],
      asks: [
        { label: '长度 n 且全部互异的顺序表去重，最坏情况比较多少次（用 n 表示）？', answer: 'n(n-1)/2 次' },
        { label: '该去重算法的时间复杂度是多少？', answer: 'O(n^2)' },
        { label: '为什么能只用 O(1) 辅助空间完成去重？', answer: '把已保留区当作查询区，覆盖式写回原表' },
        { label: '若输入 n 个完全相同的元素，去重后的长度是？', answer: '1' },
        { label: '“保留首次出现”意味着去重后各元素出现的顺序？', answer: '与原表首次出现顺序一致' }
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', '平方阶'],
      notes: {
        idea: '顺序表去重（保持首次出现）：用一个 k 记录已保留的个数，对每个 a[i] 在 a[0..k-1] 中查找，未出现过则写入保留区；就地完成，不需新数组。',
        steps: ['读取 n 及元素并打印原表', '置 k=0 表示已保留区为空', '对每个 a[i] 在保留区中查找是否出现过', '未出现过则 a[k++]=a[i]', '返回 k 作为去重后长度并打印'],
        complexity: '时间 O(n^2)（最坏全部互异时约 n(n-1)/2 次比较），空间 O(1)（就地覆盖）。',
        pitfalls: [
          '内层只需在已保留的 k 个元素中查找，而不是整个数组。',
          '写入保留区后必须 k++，否则长度计数不更新。',
          '“保留首次出现”保证顺序，去重结果与原表首次出现顺序一致。'
        ]
      },
      explain: {
        code_reading: { steps: ['读取 n 及元素并打印原表', 'dedup 用 k 记录保留区大小', '对每个元素在保留区查找', '未出现则写入并 k++', '打印去重表与新长度'] },
        ds_debug: { idea: '写入保留区时漏掉 k++，k 恒为0，最终返回长度0。', steps: ['定位 dedup 中的 if (j == k) a[k++] = a[i];', '发现被改成 a[k] = a[i]（无 k++）', '去重后长度变为0且去重区基本为空', '恢复 a[k++] 后长度正确'] },
        complexity_analysis: { idea: '每个元素都在已保留区做线性查找，最坏全部互异时约 n(n-1)/2 次比较，时间 O(n^2)，辅助空间 O(1)。' }
      }
    }
  ]
};
