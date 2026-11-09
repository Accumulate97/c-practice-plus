/* ds-ch02 线性表 · 程序库（第 5 批：双向链表插入删除 / 删除单链表指定值结点 / 顺序表循环左移）
   规则同 ds-ch02.mjs 头部注释。
   ★ 本批三段程序的 main 都带「真的算出来的自检」（相符=%d / 相同?%d），
     这样 defect 一旦改变了计数或结果，expected 里就会出现 0，不需要靠人比对序列。
   ★ 双向链表那一段刻意把「正向 + 反向 + 结点数」三件事都打印出来：
     反向遍历是检验 prior 链的唯一手段，只打正向的话「少改一条 prior」这类缺陷完全暴露不出来。 */
export default {
  shard: 'ds-ch02',
  chapter: '第2章 线性表',
  category: 'ds',
  entries: [
    {
      key: 'dlist-insert-delete',
      section: '2.4 循环链表与双向链表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['双向链表', '插入删除', 'prior与next', '指针改写顺序'],
      knowledgeIds: ['ds-ch02-09', 'ds-ch02-08', 'ds-ch02-12'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct DNode { int data; struct DNode *prior, *next; } DNode, *DList;
static DList buildFrom(const int *a, int n) {
    DList h = (DList)malloc(sizeof(DNode)); DNode *t = h, *s; int i;
    h->data = 0; h->prior = NULL; h->next = NULL;   /* ★ 空表时下面的循环一轮都不走，next 必须在这里就置空 */
    for (i = 0; i < n; i++) { s = (DNode *)malloc(sizeof(DNode));
        s->data = a[i]; s->prior = t; s->next = NULL; t->next = s; t = s; }
    return h; }
static void show(const char *lb, DList L) {           /* 正向与反向都打出来：反向遍历是检验 prior 链的唯一手段 */
    DNode *p = L->next, *q = L; int c = 0; printf("%s正向:", lb);
    while (p != NULL) { printf(" %d", p->data); c++; p = p->next; }
    while (q->next != NULL) q = q->next;
    printf(" | 反向:"); while (q != L) { printf(" %d", q->data); q = q->prior; }
    printf("（%d 个）\\n", c); }
static int dInsert(DList L, int pos, int x) {
    DNode *p = L, *s; int i;
    for (i = 0; i < pos && p != NULL; i++) p = p->next;
    if (p == NULL) return 0;
    s = (DNode *)malloc(sizeof(DNode)); s->data = x; s->next = p->next; s->prior = p;
    if (p->next != NULL) p->next->prior = s;
    p->next = s; return 1; }
static int dDelete(DList L, int pos) {
    DNode *p = L->next; int i, v;
    for (i = 1; i < pos && p != NULL; i++) p = p->next;
    if (p == NULL) return -1;
    v = p->data; p->prior->next = p->next;
    if (p->next != NULL) p->next->prior = p->prior;
    free(p); return v; }
static void freeList(DList L) { DNode *p = L, *t; while (p != NULL) { t = p; p = p->next; free(t); } }
int main(void) {
    int n, a[32], i, pos, x, dpos, v, ok; DList L;
    if (scanf("%d", &n) != 1 || n < 0 || n > 32) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; }
    if (scanf("%d %d %d", &pos, &x, &dpos) != 3) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n); show("初始 ", L);
    ok = dInsert(L, pos, x); printf("在第 %d 个结点之后插入 %d：%s\\n", pos, x, ok ? "成功" : "失败（位置越界）");
    show("插入后 ", L); v = dDelete(L, dpos);
    if (v == -1) printf("删除第 %d 个数据结点：失败（该位置不存在）\\n", dpos); else printf("删除第 %d 个数据结点：成功，被删的值是 %d\\n", dpos, v);
    show("删除后 ", L); freeList(L); return 0; }`,
      inputs: [
        { stdin: '5\n10 20 30 40 50\n2 25 4\n', note: '常规', why: '在 20 之后插 25，再删掉第 4 个数据结点；插入与删除都发生在表的中间，四条指针改写全都要做' },
        { stdin: '3\n7 8 9\n3 100 1\n', note: '插在表尾、删表头', why: '插入时 p->next 是 NULL，所以改后继 prior 的那一句要跳过；删除时 p 是第一个数据结点，p->prior 正好是头结点' },
        { stdin: '1\n42\n0 5 1\n', note: '只有一个结点', why: 'pos=0 表示插在头结点之后，删完之后表就空了；反向遍历的循环一轮都不走' },
        { stdin: '4\n1 2 3 4\n9 0 5\n', note: '两个位置都越界', why: 'pos=9 超过表长所以插入失败，dpos=5 也超过表长所以删除失败返回 -1；这一组检验两处边界判断' },
        { stdin: '0\n\n0 1 1\n', note: '空表', why: '只有头结点。★ buildFrom 里必须显式写 h->next = NULL，否则空表时循环一轮都不走、h->next 是 malloc 出来的野指针，show 会沿着它无限走下去' },
      ],
      blanks: [
        { find: '    if (p->next != NULL) p->next->prior = s;', accepted: ['    if (p->next != NULL) p->next->prior = s;', '    if (p->next) p->next->prior = s;'], hint: '新结点插进 p 与 p 的后继之间，那个后继的 prior 必须改成指向新结点；但 p 可能本来就是尾结点，那时没有后继要改', pitfall: '★ 这一句必须写在 p->next = s 之前，因为它要用到 p->next 的旧值。顺序一颠倒，p->next 已经是 s 了，这句就变成 s->prior = s，新结点自己指向自己，反向遍历会走进死循环' },
        { find: '    p->prior->next = p->next;', accepted: ['    p->prior->next = p->next;', '    p->prior->next = p->next ;'], hint: '删除 p 要先让 p 的前驱跳过 p 直接指向 p 的后继', pitfall: '双向链表里 p->prior 一定存在（头结点的 prior 是 NULL，但数据结点的 prior 至少是头结点），所以这一句不用判空；要判空的是下一句改后继 prior 的那一句，因为 p 可能是尾结点' },
      ],
      defects: [
        { kind: '指针丢失', find: '    if (p->next != NULL) p->next->prior = s;', replace: '', why: '少改了后继的 prior，它仍然指着 p；于是正向遍历完全正常，只有反向遍历会从后继直接跳回 p，把新插入的结点整个跳过', pitfall: '★ 这是双向链表最隐蔽的一类错误：程序不崩溃、不死循环、正向输出的序列与结点数全对，只有把反向序列也打出来才发现少了一个结点。所以双向链表的测试输出必须同时包含两个方向 —— 只测正向等于没测 prior 链' },
        { kind: '循环边界错误', find: '    for (i = 1; i < pos && p != NULL; i++) p = p->next;', replace: '    for (i = 0; i < pos && p != NULL; i++) p = p->next;', why: '定位循环多走了一步，于是删掉的是第 pos+1 个数据结点而不是第 pos 个', pitfall: 'p 的初值是 L->next（第 1 个数据结点），所以 i 要从 1 开始数；从 0 开始就等于把起点当成了第 0 个。这类「起点算第 0 个还是第 1 个」的差一位错误在带头结点的链表里特别常见，而且它不崩溃、结果也是个合法的值，只有和期望值比对才发现' },
      ],
      cxas: [
        {
          stem: '下面这段程序在**带头结点的双向链表**上做插入与删除。请回答后面几个问题，答案都要求精确整数。\n\n约定：「改写指针」指对某个结点的 prior 或 next 域做一次赋值；「malloc 的结点」包含头结点。\n\n```c\nstatic int dInsert(DList L, int pos, int x) {\n    DNode *p = L, *s; int i;\n    for (i = 0; i < pos && p != NULL; i++) p = p->next;\n    if (p == NULL) return 0;\n    s = (DNode *)malloc(sizeof(DNode)); s->data = x;\n    s->next = p->next; s->prior = p;\n    if (p->next != NULL) p->next->prior = s;\n    p->next = s; return 1;\n}\nstatic int dDelete(DList L, int pos) {\n    DNode *p = L->next; int i, v;\n    for (i = 1; i < pos && p != NULL; i++) p = p->next;\n    if (p == NULL) return -1;\n    v = p->data; p->prior->next = p->next;\n    if (p->next != NULL) p->next->prior = p->prior;\n    free(p); return v;\n}\n```\n\n第 1 组输入：n=5（表为 10 20 30 40 50）、pos=2、x=25、dpos=4。',
          code: '',
          asks: [
            { label: '在表的中间插入一个结点，一共改写了几个指针域', answer: '4', hint: 's->next、s->prior、后继的 prior、p->next' },
            { label: '删除一个中间结点，一共改写了几个指针域', answer: '2', hint: '前驱的 next 与后继的 prior' },
            { label: '删除表尾结点，一共改写了几个指针域', answer: '1', hint: 'p->next 是 NULL，改后继 prior 的那一句被跳过了' },
            { label: '第 1 组输入中一共 malloc 了几个结点（含头结点）', answer: '6', hint: '建表时头结点加 5 个数据结点，插入时再 malloc 1 个' },
            { label: '第 1 组输入中一共 free 了几个结点（不含程序结束时释放整表）', answer: '1', hint: '只有被删除的那个数据结点' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '双向链表的插入要改 4 条指针、删除中间结点要改 2 条，都比单链表多一条 —— 多出来的那一条就是为了维护 prior 链。',
            steps: [
              '插入：先把新结点 s 自己的两条接好（s->next = p->next、s->prior = p），再用 p->next 的旧值改后继的 prior，最后才改 p->next。',
              '★ 最后一步会覆盖 p->next，所以它必须放在最后；顺序一颠倒，第三步就读到一个已经被改掉的值。',
              '删除中间结点：前驱的 next 指向 p->next，后继的 prior 指向 p->prior，两条。',
              '删除表尾结点：p->next 是 NULL，没有后继要改，只剩一条。这就是那句 if 判空的作用。',
              '结点数：建表 malloc 了 1 + n 个，插入再 malloc 1 个，删除 free 1 个，程序结束时 freeList 把剩下的全放掉。',
            ],
            complexity: '时间 O(n)：定位要走 pos 步。★ 但「已经握着结点指针 p 时删除 p」是 O(1) —— 这正是双向链表相对单链表的核心优势：单链表删 p 必须从头找 p 的前驱。空间 O(n)。',
            pitfalls: [
              '★ 插入的四条指针改写有严格顺序，记法是「先接好自己，再改别人，最后才覆盖要用的那个值」。写成 `p->next = s;` 先执行，后面那句 `p->next->prior = s;` 就变成了 `s->prior = s;`，新结点自环，反向遍历死循环。',
              '删除表尾结点时 `p->next` 是 NULL，改后继 prior 的那一句必须判空，否则解引用空指针。但改前驱 next 的那一句不用判空 —— 数据结点的 prior 至少是头结点。',
              '定位循环的起点容易差一位：dInsert 的 p 从 L（头结点）出发、i 从 0 数；dDelete 的 p 从 L->next（第一个数据结点）出发、i 从 1 数。两者的初值不同，所以计数起点也不同。',
              '测试输出必须同时包含正向与反向序列。只打正向的话，「少改一条 prior」这类缺陷完全暴露不出来 —— 正向链是对的，只有反向链断了。',
            ],
          },
        },
        {
          stem: '接上题。请比较双向链表与单链表在存储密度与访问代价上的差别，答案都要求精确整数。\n\n约定：数据域是 int（4 字节），指针域是 8 字节（64 位机），不考虑 malloc 的管理开销与内存对齐。',
          code: '',
          asks: [
            { label: '单链表的每个结点占多少字节', answer: '12', hint: '一个 int 加一个 next 指针' },
            { label: '双向链表的每个结点占多少字节', answer: '20', hint: '一个 int 加 prior 与 next 两个指针' },
            { label: '存同样 n 个数据，双向链表的指针开销是单链表的几倍', answer: '2', hint: '8×2 比 8×1' },
            { label: '已经握着结点指针 p 时，双向链表删除 p 要访问几个其它结点', answer: '2', hint: 'p->prior 与 p->next' },
            { label: '同样情况下单链表删除 p，n=10 且 p 是最后一个数据结点时要访问几个结点', answer: '10', hint: '必须从头结点开始找 p 的前驱' },
          ],
          complexity: 'O(1)',
          accepted: ['O(1)', 'O（1）', '常数阶', '常数'],
          notes: {
            idea: '双向链表用「每个结点多存一个指针」换来了「握着结点就能 O(1) 删除它」。这笔交易划不划算，取决于元素本身有多大、以及删除时手里有没有那个结点。',
            steps: [
              '存储密度：单链表每结点 4 + 8 = 12 字节，双向 4 + 8 + 8 = 20 字节。存 int 时指针占了大头，双向链表比单链表多花 67%。',
              '但如果元素是一个 200 字节的结构体，单链表 208、双向 216，多出来的 8 字节只占 3.8% —— ★ 元素越大，prior 指针的相对开销越小，双向链表越划算。',
              '访问代价：单链表删除 p 必须先找到 p 的前驱，而找前驱只能从头走，O(n)；双向链表 p->prior 一步就到，O(1)。',
              '这就是为什么 LRU 缓存、浏览器历史、文本编辑器的撤销栈都用双向链表：它们的共同点是「手里握着要删的那个结点」。',
              '反过来，如果只是顺序遍历（例如打印整表），prior 指针一次都用不上，纯属浪费 —— 这种场景单链表更好。',
            ],
            complexity: '握着结点删除：双向 O(1)、单链 O(n)。存储：双向每结点多 8 字节，元素越小相对开销越大。',
            pitfalls: [
              '★ 「双向链表删除是 O(1)」的前提是已经握着那个结点的指针。如果给的是「删除第 i 个」，两种链表都得先走 i 步定位，都是 O(n)，双向链表一点便宜都占不到。',
              '存 int 这类小元素时不要无脑用双向链表：指针开销占三分之二，缓存也不友好（每个缓存行装不下几个结点）。',
              '循环双向链表还要多维护一条：头结点的 prior 指向尾结点、尾结点的 next 指向头结点。漏掉任何一条，「从尾部往前走」就会走出链表外面。',
            ],
          },
        },
      ],
      notes: {
        idea: '双向链表在每个结点多存一个 prior 指针，代价是插入要多改两条指针、每结点多 8 字节，好处是「握着结点就能 O(1) 删掉它」以及可以反向遍历。',
        steps: [
          '建表时头结点的 prior 与 next 都要显式置 NULL —— 空表时循环一轮都不走，野指针会让遍历无限走下去。',
          '插入的四条指针改写有严格顺序：先接好 s 自己的两条，再用 p->next 的旧值改后继的 prior，最后才改 p->next（它会覆盖上面要用的旧值）。',
          '删除要改两条：前驱的 next、后继的 prior；删表尾结点时后继不存在，那条要判空跳过。',
          '两个定位循环的起点不同：dInsert 的 p 从头结点 L 出发、i 从 0 数；dDelete 的 p 从第一个数据结点 L->next 出发、i 从 1 数。',
          '输出必须同时打正向与反向：反向遍历是检验 prior 链的唯一手段。',
        ],
        complexity: '定位 O(n)；「已经握着结点指针 p 时删除 p」是 O(1)，这是双向链表相对单链表的核心优势。空间 O(n)，每结点比单链表多一个指针。',
        pitfalls: [
          '★ 插入时把 `p->next = s;` 写在 `p->next->prior = s;` 之前，后者就变成 `s->prior = s;` —— 新结点自环，正向遍历完全正常，反向遍历死循环。这是双向链表插入最经典的错误。',
          '少改后继的 prior 不会崩溃也不会死循环，只是反向遍历时新结点被跳过。程序看起来一切正常，只有把两个方向都打出来才发现。',
          '删除表尾结点时 `p->next` 是 NULL，改后继 prior 的那一句必须判空；但改前驱 next 的那一句不用判空（数据结点的 prior 至少是头结点）。',
          '定位循环差一位（i 从 0 还是从 1 开始）会删错结点，而且删掉的也是个合法值，只有和期望比对才发现。',
          '建表时忘写 `h->next = NULL`：空表（n=0）时它是 malloc 出来的野指针，遍历会读随机内存，可能今天跑对明天跑错。',
        ],
      },
      explain: {
        code_reading: {
          idea: '读双向链表程序要把两个方向都跟一遍：正向靠 next、反向靠 prior，任何一条链断了都会在对应的输出里露出来。',
          steps: [
            '先按输入建表，注意头结点不存数据，所以「第 pos 个结点」是从头结点开始数的（pos=0 就是头结点）。',
            '插入后先看正向序列对不对，再看反向序列 —— 反向序列里少一个结点就说明某条 prior 没接上。',
            '删除时注意 dpos 是从 1 开始数的数据结点序号，与插入用的 pos 不是同一套编号。',
            '两次越界（pos 超过表长、dpos 超过表长）分别走「插入失败」与「返回 -1」两条分支。',
          ],
        },
        ds_debug: {
          idea: '两个缺陷一个是「少改一条指针」，一个是「定位差一位」，都不会让程序崩溃，所以只能靠输出里的序列与数值发现。',
          steps: [
            '先把正确的插入顺序写出来：s 的两条 → 后继的 prior → 最后 p->next。',
            '再检查删除的定位循环：p 从 L->next 出发，i 就应该从 1 开始数。',
            '验算方法是「正向序列 + 反向序列 + 结点数」三件事一起看，任何一件对不上就说明结构被破坏了。',
          ],
        },
      },
    },
    {
      key: 'list-delete-node',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '删除结点', '双指针', '内存释放'],
      knowledgeIds: ['ds-ch02-10', 'ds-ch02-06', 'ds-ch02-12'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList h = (LinkList)malloc(sizeof(LNode)); LNode *t = h, *s; int i;
    h->data = 0; h->next = NULL;
    for (i = 0; i < n; i++) { s = (LNode *)malloc(sizeof(LNode));
        s->data = a[i]; s->next = NULL; t->next = s; t = s; }
    return h; }
static int listLen(LinkList L) { LNode *p = L->next; int c = 0; while (p != NULL) { c++; p = p->next; } return c; }
static void show(const char *lb, LinkList L) {
    LNode *p = L->next; printf("%s", lb);
    while (p != NULL) { printf(" %d", p->data); p = p->next; }
    printf("\\n"); }
/* 删掉表里所有值等于 x 的结点。prev 始终停在 cur 的前一个结点上，
   所以摘掉 cur 只需要改 prev->next 一条指针；*freed 记释放掉的结点个数。 */
static void delAll(LinkList L, int x, int *freed) {
    LNode *prev = L, *cur = L->next, *t;
    *freed = 0;
    while (cur != NULL) {
        if (cur->data == x) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }
        else { prev = cur; cur = cur->next; }
    }
}
int main(void) {
    int n, a[32], i, x, freed, before, after; LinkList L;
    if (scanf("%d", &n) != 1 || n < 0 || n > 32) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; }
    if (scanf("%d", &x) != 1) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n); before = listLen(L); show("删除前：", L);
    delAll(L, x, &freed); after = listLen(L);
    show("删除后：", L);
    printf("删掉 %d 个值为 %d 的结点，释放了 %d 个结点（两者应相等 ? %d）\\n",
           before - after, x, freed, before - after == freed);
    printf("表长从 %d 变成 %d，减少量与释放数相符 ? %d\\n", before, after, before - after == freed);
    while (L != NULL) { LNode *q = L; L = L->next; free(q); }
    return 0; }`,
      inputs: [
        { stdin: '7\n1 2 3 2 4 2 5\n2\n', note: '删掉 3 个', why: 'x 在表里出现 3 次且分散在各处，能看出 prev 与 cur 必须一起前进' },
        { stdin: '5\n2 2 2 2 2\n2\n', note: '全部相同、全删空', why: '★ 连续相同值是最容易写错的情形：删掉一个之后 cur 已经在下一个上了，此时绝不能再 cur = cur->next（那会跳过一个），也绝不能先 free 再用 cur（use-after-free）' },
        { stdin: '4\n1 2 3 4\n9\n', note: '一个都不删', why: 'x 不在表里，每一轮都走 else 分支，prev 与 cur 一路走到底；释放数应是 0' },
        { stdin: '1\n7\n7\n', note: '删唯一的数据结点', why: '删完之后表只剩头结点，listLen 返回 0，before-after == freed == 1' },
        { stdin: '0\n\n3\n', note: '空表', why: 'L->next 是 NULL，delAll 的循环一轮都不走；★ 三条自检在退化情况下仍须成立，否则说明自检写成了恒真式' },
      ],
      blanks: [
        { find: '        if (cur->data == x) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }', accepted: ['        if (cur->data == x) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }'], hint: '摘掉 cur 要做四件事：让前驱跳过它、把 cur 存起来、把 cur 移到后继、再释放存起来的那个', pitfall: '★ 顺序不能乱。先 free(cur) 再 cur = cur->next 是 use-after-free（读已释放内存）；写成 cur = cur->next; free(cur) 则是把后继释放掉了、cur 本身还挂在链上。必须用第三个指针 t 暂存' },
        { find: '        else { prev = cur; cur = cur->next; }', accepted: ['        else { prev = cur; cur = cur->next; }', '        else { prev = cur; cur = cur->next ; }'], hint: 'cur 没有被删掉，所以 prev 要跟上：prev 必须始终是 cur 的前一个结点', pitfall: '★ 漏掉 prev = cur 是本函数最致命的错误：prev 会永远停在头结点上，于是第二次删除时 prev->next 直接把头结点接到被删结点的后继上，中间那些结点全被孤立（既不在链上也没被 free，整段内存泄漏），输出的表会莫名其妙地短一大截' },
      ],
      defects: [
        { kind: '链表断链', find: '        else { prev = cur; cur = cur->next; }', replace: '        else { cur = cur->next; }', why: 'prev 不再跟着前进，永远停在头结点上；第二次遇到要删的结点时，prev->next = cur->next 就把头结点直接接到了那个结点的后继上，中间所有结点被整段跳过', pitfall: '★ 后果是双重的：输出的表短了一大截（{1,2,3,2,4,2,5} 删 2 会得到 [5] 而不是 [1 3 4 5]），而且被跳过的那些结点既不在链上也没被 free，是内存泄漏。判题只看 stdout 的话第二层看不见，但它正是「双指针忘记同步前进」在链表题里最典型的连带后果。自检行 before-after == freed 也会变成 0，因为 listLen 数到的结点数与释放数对不上' },
        { kind: '条件判断错误', find: '        if (cur->data == x) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }', replace: '        if (cur->data == x && cur->next != NULL) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }', why: '多加了一个 cur->next != NULL 的条件，于是尾结点即使值等于 x 也永远不会被删掉', pitfall: '这个错误在「x 不在表尾」的输入上完全看不出来，只有 x 恰好是最后一个元素时才暴露 —— 所以测试用例里必须有一组「删唯一的数据结点」或「全表都是 x」。★ 它也不会崩溃、也不会死循环，表长与释放数还恰好相等（都只是少删了一个），只有把删除后的序列打出来才发现尾巴还在' },
      ],
      cxas: [
        {
          stem: '下面这段程序删掉带头结点单链表里**所有**值等于 x 的结点。请回答后面几个问题，答案都要求精确整数。\n\n```c\nstatic void delAll(LinkList L, int x, int *freed) {\n    LNode *prev = L, *cur = L->next, *t;\n    *freed = 0;\n    while (cur != NULL) {\n        if (cur->data == x) { prev->next = cur->next; t = cur; cur = cur->next; free(t); (*freed)++; }\n        else { prev = cur; cur = cur->next; }\n    }\n}\n```\n\n第 1 组输入：表为 1 2 3 2 4 2 5（n=7），x=2。',
          code: '',
          asks: [
            { label: '第 1 组输入中 free 被调用的次数', answer: '3', hint: '表里有 3 个 2' },
            { label: '第 1 组输入中 `prev->next = cur->next;` 执行的次数', answer: '3', hint: '每删一个结点执行一次' },
            { label: '第 1 组输入中 else 分支（prev 跟着前进）执行的次数', answer: '4', hint: '保留下来的结点有 1、3、4、5 共 4 个' },
            { label: '第 2 组输入（表为 2 2 2 2 2，x=2）中 free 被调用的次数', answer: '5' },
            { label: '第 3 组输入（表为 1 2 3 4，x=9）中 free 被调用的次数', answer: '0' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: 'prev 与 cur 一前一后走一遍表：cur 指向待检查的结点，prev 指向它的前驱。删掉 cur 只需要改 prev->next 一条指针。',
            steps: [
              'prev 的初值是 L（头结点）而不是 NULL —— 因为第一个数据结点也可能要删，那时改的就是头结点的 next。这是带头结点链表的好处：不用为「删第一个」写特例。',
              'cur 命中时做四件事，顺序是：prev->next = cur->next（摘链）→ t = cur（暂存）→ cur = cur->next（前进）→ free(t)（释放）。',
              '★ 命中时 prev 不动！因为下一个结点现在紧挨着 prev，还要继续检查它。这正是「连续相同值」能一次删干净的原因。',
              '没命中时 prev 与 cur 一起前进一步。',
              '每轮循环 cur 一定前进一步，所以循环恰好走 n 轮，时间 O(n)。',
            ],
            complexity: '时间 O(n)：只走一遍表，每轮 cur 必前进。空间 O(1)：三个指针。★ 命中次数 = free 次数 = prev->next 赋值次数；保留结点数 = else 分支次数 = prev 前进次数。这两条等式可以用来验算。',
            pitfalls: [
              '★ 释放顺序必须是「先暂存、再前进、最后 free」。写成 `free(cur); cur = cur->next;` 是 use-after-free（cur 指向的内存已经还给分配器，读它的 next 是未定义行为）；写成 `cur = cur->next; free(cur);` 则是把后继释放了、cur 本身还挂在链上。',
              '命中时多写一句 prev = cur 会让 prev 跟着被删的结点一起走，结果 prev 指向一个已经 free 掉的结点，下一轮 prev->next 就是 use-after-free。',
              '没命中时漏写 prev = cur 会让 prev 永远停在头结点上，第二次删除直接把中间一大段跳过（那些结点既不在链上也没被 free）。',
              'prev 的初值写成 NULL 而不是 L：删第一个数据结点时 prev->next 就是解引用空指针。带头结点的链表里，「第一个数据结点的前驱」就是头结点本身。',
            ],
          },
        },
        {
          stem: '接上题。同样的「删掉所有等于 x 的元素」，如果改用**顺序表**来做，代价完全不同。请回答后面几个问题，答案都要求精确整数。\n\n约定：顺序表用 `int data[32]` 加 `int len` 表示，下标从 0 开始；「搬移」指一次 `data[j] = data[j+1]` 这样的赋值。',
          code: '',
          asks: [
            { label: '单链表删掉一个已知位置的结点要改写几条指针', answer: '1', hint: '只有前驱的 next' },
            { label: '顺序表删掉下标 2 的元素要搬移几个元素（n=7）', answer: '4', hint: '下标 3..6 各往前挪一格，共 n-i-1 个' },
            { label: '顺序表在 n=7 的表里删掉随机一个元素，平均搬移几个', answer: '3', hint: '(n-1)/2' },
            { label: '用「先标记后一次性压缩」的做法删掉所有 x，n=7 删掉 3 个时压缩阶段做几次赋值', answer: '4', hint: '压缩就是把保留下来的 4 个元素依次写到前面' },
            { label: '单链表删掉所有 x（n=7 删 3 个）时改写指针的次数', answer: '3' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '链表删除的便宜是「只改一条指针」，顺序表删除的贵是「后面全部往前搬」。但两者都要先找到位置，而找位置都是 O(n)。',
            steps: [
              '顺序表边删边搬：每删一个就把后面全部往前挪一格，删 k 个最坏是 O(n·k)。',
              '顺序表更好的写法是「双下标一次压缩」：i 停在已保留段的末尾、j 扫描全表，不等于 x 就 data[++i] = data[j]，最后 len = i+1。这样只做 O(n) 次赋值，与删掉几个无关。',
              '链表不需要压缩这一步，摘一个结点就改一条指针，但每个结点要多存一个 next 指针。',
              '★ 「删掉所有 x」这个具体任务上，顺序表的一次压缩法与链表的双指针法都是 O(n) 时间、O(1) 空间，差别只在常数项（链表每步要多一次指针跳转，可能 cache miss）。',
              '真正的分水岭在「只删一个」：链表若已握着前驱是 O(1)，顺序表无论如何都要搬 n/2 个。',
            ],
            complexity: '两者都是 O(n)。顺序表的代价在「搬移元素」（元素越大越贵），链表的代价在「指针跳转」（cache 不友好）。',
            pitfalls: [
              '★ 单链表「删除是 O(1)」的前提是已经站在待删结点的前驱上。题目若说「删除第 i 个」，找前驱本身就要 O(n)，总代价还是 O(n) —— 这时链表相对顺序表的优势只剩下「不搬移大元素」。',
              '顺序表边删边搬是 O(n·k)，很多人以为「删除是 O(n)」就够了，实际上删掉一半元素时会退化到 O(n²)。要写成一次压缩。',
              '链表删除必须 free，否则每删一个就漏一个结点。顺序表删除只是改 len，被删的元素还留在数组里（成了脏数据），若之后按整个数组读会读到旧值。',
            ],
          },
        },
      ],
      notes: {
        idea: '删除单链表结点的难点不在「摘下来」，而在「摘下来之后 prev 该不该跟着走」。用 prev/cur 双指针走一遍就能删掉所有匹配项，命中时 prev 原地不动是关键。',
        steps: [
          'prev 初值是头结点 L（不是 NULL），这样删第一个数据结点也不需要特例。',
          'cur 命中：改 prev->next 跳过它 → 用 t 暂存 cur → cur 前进 → free(t) → 计数加一。prev 不动。',
          'cur 没命中：prev 与 cur 一起前进一步。',
          '主函数里两条自检都是真的算出来再比对的：before-after 与 freed 必须相等，否则说明有结点被跳过或者被重复释放。',
        ],
        complexity: '时间 O(n)：只走一遍，每轮 cur 必前进。空间 O(1)。',
        pitfalls: [
          '★ free 与前进的顺序：必须「先暂存 t = cur，再 cur = cur->next，最后 free(t)」。先 free 再读 cur->next 是 use-after-free，先前进再 free 会释放掉错误的结点。',
          '命中时 prev 不能动（下一个结点现在紧挨着 prev，还要继续检查）；没命中时 prev 必须动（否则 prev 会永远停在头结点上，第二次删除把中间一大段跳过）。这两条正好相反，是最容易记混的地方。',
          '多写一个 `cur->next != NULL` 的条件会让尾结点永远删不掉。这个错误只在「x 恰好在表尾」时暴露，所以测试用例里必须有一组全表都是 x 或者只删唯一结点。',
          '删完之后表长与释放数应当相等，这是一条很好的自检；但要注意它只能查出「数量对不上」，查不出「删错了哪一个」—— 那还得看删除后的序列。',
        ],
      },
      explain: {
        code_reading: {
          idea: '要读出结果，得逐个结点跟一遍 prev 与 cur 的位置，特别注意「命中时 prev 不动」这条规则。',
          steps: [
            '先把表写出来，标出哪些位置的值等于 x。',
            '从头走：命中就摘掉并释放、prev 留在原地；没命中就两个指针一起前进。',
            '走完之后剩下的序列就是删除后的表，释放次数等于命中次数。',
            '两条自检都是算出来的：before-after 与 freed 相等才打 1。',
          ],
        },
        ds_debug: {
          idea: '两个缺陷一个动了 else 分支（prev 不前进），一个动了 if 条件（多加一个判断），都不崩溃、都还能输出一张合法的表，只有序列与计数会露馅。',
          steps: [
            '先确认正确行为：命中时 prev 不动，没命中时 prev 跟着 cur 一起走。',
            '再逐个检查两个分支里的语句有没有多、有没有少。',
            '验算用「删除后的序列 + 释放数」两件事，缺一不可：只看释放数会漏掉「删错了哪一个」，只看序列会漏掉「有没有泄漏」。',
          ],
        },
      },
    },
    {
      key: 'seq-rotate',
      section: '2.2 线性表的顺序表示（顺序表）',
      difficulty: 3,
      bloom: 'analyze',
      tags: ['顺序表', '循环左移', '三次逆置', '就地算法'],
      knowledgeIds: ['ds-ch02-05', 'ds-ch02-02', 'ds-ch02-04'],
      code: `#include <stdio.h>
static void show(const char *lb, const int *a, int n) { int i; printf("%s", lb); for (i = 0; i < n; i++) printf(" %d", a[i]); printf("\\n"); }
static int revCnt;                                   /* 三次逆置法做了多少次元素交换 */
static void rev(int *a, int lo, int hi) {
    while (lo < hi) { int t = a[lo]; a[lo] = a[hi]; a[hi] = t; lo++; hi--; revCnt++; } }
/* 三次逆置法把 a[0..n-1] 循环左移 k 位：先逆置前 k 个，再逆置后 n-k 个，最后整体逆置。
   时间 O(n)、空间 O(1)，而且交换次数与 k 几乎无关；逐个搬移法要做 k 轮、每轮搬 n 次。 */
static void rotate(int *a, int n, int k) {
    if (n <= 1) return;
    k %= n;
    if (k == 0) return;
    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1); }
static int sameArr(const int *a, const int *b, int n) { int i; for (i = 0; i < n; i++) if (a[i] != b[i]) return 0; return 1; }
static void rotateNaive(int *a, int n, int k, int *moves) {
    int i, j, t; *moves = 0;
    for (i = 0; i < k; i++) {
        t = a[0];
        for (j = 0; j < n - 1; j++) { a[j] = a[j + 1]; (*moves)++; }
        a[n - 1] = t; (*moves)++; } }
int main(void) {
    int n, k, kk, a[32], b[32], i, moves, expect;
    if (scanf("%d", &n) != 1 || n < 0 || n > 32) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; }
    if (scanf("%d", &k) != 1 || k < 0) { printf("输入有误\\n"); return 0; }
    show("原序列：", a, n);
    kk = (n > 0) ? k % n : 0;
    for (i = 0; i < n; i++) b[i] = a[i];
    revCnt = 0; rotate(a, n, k);
    printf("三次逆置法左移 %d 位：", kk); show("", a, n);
    expect = (kk == 0) ? 0 : kk / 2 + (n - kk) / 2 + n / 2;
    printf("做了 %d 次交换（三段长度各自折半 = %d）相符=%d\\n", revCnt, expect, revCnt == expect);
    moves = 0; rotateNaive(b, n, kk, &moves);
    printf("逐个搬移法左移同样位数："); show("", b, n);
    printf("搬移了 %d 次（应等于 k*n = %d）相符=%d；两种方法结果相同 ? %d\\n",
           moves, kk * n, moves == kk * n, sameArr(a, b, n));
    return 0; }`,
      inputs: [
        { stdin: '8\n1 2 3 4 5 6 7 8\n3\n', note: '常规', why: '左移 3 位得 4 5 6 7 8 1 2 3；三次逆置做 1+2+4=7 次交换，逐个搬移做 3×8=24 次' },
        { stdin: '8\n1 2 3 4 5 6 7 8\n0\n', note: 'k=0', why: 'kk=0，rotate 直接返回、一次交换都不做，逐个搬移也一轮都不走；这一组检验「什么都不做」的退化路径' },
        { stdin: '8\n1 2 3 4 5 6 7 8\n9\n', note: 'k 大于表长', why: 'kk = 9%8 = 1，结果与左移 1 位相同；★ 少了 k %= n 这一步就会白转一整圈甚至越界' },
        { stdin: '5\n10 20 30 40 50\n7\n', note: 'k 大于表长且不是整数倍', why: 'kk = 7%5 = 2，结果 30 40 50 10 20；交换 1+1+2=4 次，搬移 2×5=10 次' },
        { stdin: '1\n42\n5\n', note: 'n=1', why: 'rotate 在 n<=1 时直接返回；kk = 5%1 = 0，两种方法都不动，结果仍是 42' },
        { stdin: '0\n\n3\n', note: '空序列', why: 'n=0 时 kk 直接取 0（★ 不能算 k%n，那是除零），两个循环一轮都不走，sameArr 在 n=0 时返回 1' },
      ],
      blanks: [
        { find: '    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1);', accepted: ['    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1);', '    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1) ;'], hint: '三段逆置：先把前 k 个翻过来，再把后 n-k 个翻过来，最后把整段翻过来', pitfall: '★ 三段的边界是 [0, k-1]、[k, n-1]、[0, n-1]，前两段刚好不重不漏地覆盖整表。写成 [0,k] 与 [k+1,n-1] 会让下标 k 那个元素被翻两次，结果等于左移了 k+1 位' },
        { find: '    while (lo < hi) { int t = a[lo]; a[lo] = a[hi]; a[hi] = t; lo++; hi--; revCnt++; }', accepted: ['    while (lo < hi) { int t = a[lo]; a[lo] = a[hi]; a[hi] = t; lo++; hi--; revCnt++; }'], hint: '两端向中间靠拢，每轮交换一对，直到两个下标相遇或交错', pitfall: '循环条件必须是 lo < hi 而不是 lo <= hi：lo == hi 时中间那个元素和自己交换，虽然结果不变但白做一次，revCnt 也会多算一次（奇数长度那一段就会与「长度折半」的公式对不上）' },
      ],
      defects: [
        { kind: '循环边界错误', find: '    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1);', replace: '    rev(a, 0, k); rev(a, k + 1, n - 1); rev(a, 0, n - 1);', why: '前两段各多算一个下标，等于把 k+1 个元素当成前段来翻，于是结果变成了循环左移 k+1 位', pitfall: '★ 这个错误的隐蔽之处在于它仍然是一个合法的循环移位，只是移的位数不对：n=8、k=3 时会得到左移 4 位的结果。程序不崩溃、输出看起来也完全合理，只有和「逐个搬移法」的结果比对（或者和期望序列比对）才发现。自检行 revCnt == expect 同时会变成 0，等于把错误暴露了两次' },
        { kind: '条件判断错误', find: '    if (k == 0) return;', replace: '    if (k < 0) return;', why: 'k 已经被主函数保证非负，所以这个提前返回永远不会触发；k == 0 时程序会继续做三段逆置', pitfall: '后果分两层：结果其实还是对的（rev(0,-1) 一轮都不走，后两段各整体翻一次、翻两次等于没翻），但 revCnt 会变成 2×⌊n/2⌋ 而不是 0，自检行相符=0。★ 这是一类很值得记住的错误：删掉一个「看起来只是优化」的提前返回，功能可能仍然正确，但计数器、缓存、日志这类副作用会全部错位' },
      ],
      cxas: [
        {
          stem: '下面这段程序用**三次逆置法**把顺序表循环左移 k 位，并同时用「逐个搬移法」做同一个任务以便对比。请回答后面几个问题，答案都要求精确整数。\n\n约定：「交换」指 `rev` 里一次 `t = a[lo]; a[lo] = a[hi]; a[hi] = t;`；「搬移」指 `rotateNaive` 里一次 `a[j] = a[j+1]` 或一次 `a[n-1] = t`；kk = k mod n。\n\n```c\nstatic void rev(int *a, int lo, int hi) {\n    while (lo < hi) { int t = a[lo]; a[lo] = a[hi]; a[hi] = t; lo++; hi--; revCnt++; } }\nstatic void rotate(int *a, int n, int k) {\n    if (n <= 1) return;\n    k %= n;\n    if (k == 0) return;\n    rev(a, 0, k - 1); rev(a, k, n - 1); rev(a, 0, n - 1); }\nstatic void rotateNaive(int *a, int n, int k, int *moves) {\n    int i, j, t; *moves = 0;\n    for (i = 0; i < k; i++) {\n        t = a[0];\n        for (j = 0; j < n - 1; j++) { a[j] = a[j + 1]; (*moves)++; }\n        a[n - 1] = t; (*moves)++; } }\n```',
          code: '',
          asks: [
            { label: 'n=8、k=3 时三次逆置法做的交换次数', answer: '7', hint: '三段长度是 3、5、8，各自折半：1+2+4' },
            { label: 'n=8、k=3 时逐个搬移法做的搬移次数', answer: '24', hint: '每轮搬 n 次，一共 k 轮' },
            { label: 'n=8、k=1 时三次逆置法做的交换次数', answer: '7', hint: '三段长度是 1、7、8：0+3+4' },
            { label: 'n=8、k=1 时逐个搬移法做的搬移次数', answer: '8' },
            { label: 'n=5、k=7（即 kk=2）时三次逆置法做的交换次数', answer: '4', hint: '三段长度是 2、3、5：1+1+2' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '三次逆置法的交换次数只与三段长度有关（各段折半），合计约等于 n；逐个搬移法是 k×n。k 越大两者差距越大。',
            steps: [
              '三段长度分别是 kk、n-kk、n，每段逆置做「长度除以 2 向下取整」次交换，合计 kk/2 + (n-kk)/2 + n/2。',
              '这个和恒在 ⌊n/2⌋ 与 n 之间，也就是 O(n)，与 k 基本无关（n=8 时 kk=1 与 kk=3 都是 7 次）。',
              '逐个搬移法每轮把 a[0] 存起来、后面全部往前挪一格、再把存的那个放到末尾，一轮 n 次，一共 kk 轮 = kk×n 次。',
              '★ n=8、k=3 时是 7 对 24，差 3.4 倍；若 k = n/2 = 4，就是 8 对 32，差 4 倍；k 越大差距越大，最坏差 n/2 倍。',
              '两者的空间都是 O(1)（只用一个临时变量），这是三次逆置法相对「开一个新数组 b[(i+k)%n] = a[i]」的优势 —— 后者要 O(n) 额外空间。',
            ],
            complexity: '三次逆置法：时间 O(n)、空间 O(1)、交换约 n 次且与 k 无关。逐个搬移法：时间 O(k·n)、空间 O(1)。新开数组法：时间 O(n)、空间 O(n)。',
            pitfalls: [
              '★ 三段的边界必须不重不漏：[0, kk-1] 与 [kk, n-1]。写成 [0, kk] 与 [kk+1, n-1] 会让下标 kk 那个元素被翻两次，结果变成左移 kk+1 位 —— 而且它仍然是一个合法的循环移位，只是位数不对，非常难发现。',
              'k %= n 不能省：k 大于 n 时白转好几圈，k 恰好是 n 的整数倍时应该完全不动。',
              'n=0 时绝不能算 k % n（除零）。主函数里要先判 n > 0。',
              '删掉 `if (k == 0) return;` 这个提前返回，结果居然还是对的（rev(0,-1) 不走、后两段翻两次等于没翻），但交换计数会变成 2×⌊n/2⌋。★ 功能正确不等于副作用正确，计数器错位同样是 bug。',
            ],
          },
        },
        {
          stem: '接上题。请比较三种「把顺序表循环左移 k 位」的做法，答案都要求精确整数。\n\n做法 A：三次逆置法（就地）。做法 B：逐个搬移法（每轮整体前移一格，做 k 轮）。做法 C：开一个新数组，令 `b[i] = a[(i + k) % n]`，再整体拷回 a。\n\n下面统一取 n = 8。',
          code: '',
          asks: [
            { label: '做法 B 的搬移次数公式是 kk×n，kk=3 时是多少', answer: '24' },
            { label: '做法 C 需要额外多少个 int 的存储空间（n=8）', answer: '8' },
            { label: '做法 A 需要额外多少个 int 的存储空间', answer: '0', hint: '只用一个临时变量做交换，不随 n 增长' },
            { label: '做法 C 一共要做多少次「读 a 加写 b」的赋值（n=8）', answer: '8' },
            { label: '做法 A 在 kk=4 时做的交换次数', answer: '8', hint: '三段长度是 4、4、8：2+2+4' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '三种做法的时间都是 O(n)（做法 B 是 O(k·n)，k 视为常数时也是 O(n)），真正的分水岭在空间与常数因子。',
            steps: [
              '做法 A：时间 O(n)、空间 O(1)、约 n 次交换。就地、不额外分配，是最优解。',
              '做法 B：时间 O(k·n)、空间 O(1)。k 很小时（例如 1 或 2）它其实比 A 还快（8 次或 16 次搬移对 7 次交换），但 k 一大就线性恶化。',
              '做法 C：时间 O(n)、空间 O(n)。最好写、最不容易错，但要多一块 n 个 int 的内存。',
              '★ 所以「哪个最好」取决于 k 与 n 的关系、以及能不能接受额外空间。答题时要把这三个维度都说到，只说「A 最好」是不完整的。',
              '工程上还有一条：做法 A 与 B 都是就地修改，如果原序列还要用就必须先备份；做法 C 天然保留原序列。',
            ],
            complexity: 'A：O(n) 时间 / O(1) 空间。B：O(k·n) 时间 / O(1) 空间。C：O(n) 时间 / O(n) 空间。',
            pitfalls: [
              '★ 做法 B 在 k 很小时并不慢：kk=1 时它只搬 8 次，而做法 A 要交换 7 次，两者几乎打平。「三次逆置一定更快」只在 k 与 n 同量级时成立。',
              '做法 C 的 `b[i] = a[(i + k) % n]` 里那个取模不能省，也不能写成 `a[i + k]`（会越界）。取模每次都是一次除法，n 很大时这个常数因子不可忽略，可以改成「先拷前 n-kk 个再拷后 kk 个」避免取模。',
              '三种做法都要求 kk = k mod n 先算好。k 可能是负数（表示右移），C 语言里负数取模的结果符号与被除数相同，要先加 n 再取模，否则会得到负下标。',
            ],
          },
        },
      ],
      notes: {
        idea: '循环移位是顺序表上「看着简单、写对不容易」的经典题。三次逆置法用 O(1) 空间 O(n) 时间解决它，靠的是「翻两次等于没翻」这个性质。',
        steps: [
          '把表看成前后两段：前段 a[0..k-1]、后段 a[k..n-1]，目标是把两段交换位置。',
          '先各自把两段翻过来：前段变成逆序、后段变成逆序，此时整表是「后段逆序 + 前段逆序」的排列。',
          '再把整表翻一次，两段各自的逆序被翻回来，位置也交换了 —— 正好是循环左移 k 位。',
          '主函数里同时跑一遍「逐个搬移法」，用 sameArr 比对两种方法的结果，这是一条真的算出来的自检。',
          '交换次数与搬移次数都与公式比对（expect 与 kk*n），所以任何一段边界写错都会当场暴露。',
        ],
        complexity: '三次逆置法 O(n) 时间、O(1) 空间，交换约 n 次且与 k 几乎无关；逐个搬移法 O(k·n) 时间、O(1) 空间。',
        pitfalls: [
          '★ 三段的边界必须不重不漏。前两段写成 [0,k] 与 [k+1,n-1] 会让下标 k 被翻两次，结果变成左移 k+1 位 —— 仍然是一个合法的循环移位，只是位数不对。',
          'k %= n 不能省，n=0 时更不能算 k%n（除零）。主函数里 kk 的求法是 `(n > 0) ? k % n : 0`。',
          'rev 的循环条件用 lo < hi 而不是 lo <= hi：lo == hi 时中间元素自交换，结果不变但计数会多一次，与「长度折半」的公式对不上。',
          '删掉 `if (k == 0) return;` 之后结果居然还是对的，但交换计数变成 2×⌊n/2⌋。★ 功能正确不等于副作用正确。',
          '负数 k（表示右移）要先加 n 再取模，C 语言里 -3 % 8 等于 -3 而不是 5。',
        ],
      },
      explain: {
        code_reading: {
          idea: '读这段程序要先算出 kk = k mod n，再分别推两种方法的结果与计数。',
          steps: [
            'kk = (n > 0) ? k % n : 0，所以 k=9、n=8 与 k=1 完全等价。',
            '三次逆置法：前段 [0, kk-1] 翻一次、后段 [kk, n-1] 翻一次、整表翻一次，交换次数是三段长度各自折半之和。',
            '逐个搬移法：kk 轮，每轮 n 次搬移（n-1 次前移加 1 次放到末尾）。',
            '最后两行自检都是算出来的：expect 与 kk*n 是公式值，sameArr 是两种方法的结果比对。',
          ],
        },
        ds_debug: {
          idea: '两个缺陷一个改了三段逆置的边界、一个删掉了 k==0 的提前返回；前者会移位错位数，后者结果对但计数错。',
          steps: [
            '先确认三段的边界：[0, kk-1]、[kk, n-1]、[0, n-1]，前两段不重不漏。',
            '再确认 kk == 0 时应该一次交换都不做。',
            '验算靠两条自检：revCnt == expect 与 sameArr(a, b, n)。前者查计数、后者查结果，两条一起看才能区分「移错位数」与「只是计数错了」。',
          ],
        },
      },
    },
  ],
};
