/* ds-ch02 线性表 · 程序库（第 4 批：快慢指针找倒数第 k / 一元多项式相加 / 顺序表与链表的选型）
   规则同 ds-ch02.mjs 头部注释：
   ① 每段程序必须能用 gcc -std=c99 -Wall -Wextra 编译通过且零警告（生成器会真编译）
   ② expected 一律不要手写，由生成器实跑得到；pointer_trace 的 expect 是例外，写错会被逐字比对拦下
   ③ code 的物理行数 ≤ 40 行（含空行与注释行，红线⑥）
   ④ inputs 至少 2 组且输出互不相同，尽量覆盖 n=0 / n=1 / 极值 / 重复值 / 越界
   ⑤ defects[i].find 与 blanks[i].find 必须在 code 中恰好出现一次
   ⑥ 派生出的错误版本必须在至少一组输入上输出不同，且不能死循环、不能崩溃、不能让任何变量失去使用点
   ★ 本批两段程序都带「算出来的自检」（相符=%d / merged / freed），让 expected 里就含有可判定的断言，
     这样 defect 一旦改变了计数，输出立刻就变，不需要靠人去比对序列。 */
export default {
  shard: 'ds-ch02',
  chapter: '第2章 线性表',
  category: 'ds',
  entries: [
    {
      key: 'nth-from-end',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '快慢指针', '倒数第k个', '一趟遍历'],
      knowledgeIds: ['ds-ch02-06', 'ds-ch02-12', 'ds-ch02-03'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode));
        s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head; }
static void freeList(LinkList L) { LNode *p = L, *t; while (p != NULL) { t = p; p = p->next; free(t); } }
static void show(const char *lb, LinkList L) {
    LNode *p = L->next; printf("%s", lb);
    while (p != NULL) { printf(" %d", p->data); p = p->next; }
    printf("\\n"); }
/* 快慢指针找倒数第 k 个结点：fast 先从表头走 k 步，再与 slow 同步走，
   fast 走到 NULL 时 slow 恰好停在倒数第 k 个。找到返回 1 并把值写进 *out，
   表长不足 k 返回 0；*steps 记 slow 走的步数（应当等于 n-k）。全程只遍历一遍。 */
static int nthFromEnd(LinkList L, int k, int *out, int *steps) {
    LNode *fast = L->next, *slow = L->next; int i = 0;
    *steps = 0;
    for (i = 0; i < k && fast != NULL; i++) fast = fast->next;
    if (i < k) return 0;
    while (fast != NULL) { fast = fast->next; slow = slow->next; (*steps)++; }
    *out = slow->data; return 1; }
int main(void) {
    int n, a[64], i, k, v = 0, steps, found; LinkList L;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; }
    if (scanf("%d", &k) != 1 || k < 1) { printf("输入有误\\n"); return 0; }
    L = buildFrom(a, n); show("表内容：", L);
    found = nthFromEnd(L, k, &v, &steps);
    if (found) printf("倒数第 %d 个是 %d；slow 走了 %d 步（应等于 n-k = %d）相符=%d\\n", k, v, steps, n - k, steps == n - k);
    else printf("倒数第 %d 个不存在（表长只有 %d）\\n", k, n);
    freeList(L); return 0; }`,
      inputs: [
        { stdin: '8\n10 20 30 40 50 60 70 80\n3\n', note: '常规', why: '倒数第 3 个是 60，slow 走 5 步；自检那一行把 steps 与 n-k 都算出来比对' },
        { stdin: '8\n10 20 30 40 50 60 70 80\n8\n', note: 'k 等于表长', why: 'fast 走满 8 步后正好是 NULL，同步阶段一轮都不走，slow 停在第一个结点、steps=0' },
        { stdin: '8\n10 20 30 40 50 60 70 80\n1\n', note: 'k=1', why: '退化成「找最后一个结点」，slow 要走满 n-1 步' },
        { stdin: '8\n10 20 30 40 50 60 70 80\n9\n', note: 'k 超过表长', why: 'fast 走到 NULL 时 i 只有 8，i < k 成立所以返回 0；这一组专门检验越界判断' },
        { stdin: '1\n42\n1\n', note: 'n=1', why: '只有一个结点，倒数第 1 个就是它自己，steps=0' },
        { stdin: '0\n\n1\n', note: '空表', why: 'L->next 是 NULL，fast 与 slow 都是 NULL，第一轮 for 就因 fast==NULL 退出，i=0 < k=1 返回 0；★ 若把越界判断漏掉，后面 *out = slow->data 会解引用空指针' },
      ],
      blanks: [
        { find: 'for (i = 0; i < k && fast != NULL; i++) fast = fast->next;', accepted: ['for (i = 0; i < k && fast != NULL; i++) fast = fast->next;', 'for (i = 0; i < k && fast != NULL; ++i) fast = fast->next;'], hint: '让 fast 先单独往前走 k 步，但必须防止表长不足 k 时走出链表外面', pitfall: '条件里少了 fast != NULL 就会在表长不足 k 时对空指针取 next —— 这是本题最典型的段错误来源。i 也要留着，循环结束后要靠它判断「到底走满了 k 步没有」' },
        { find: 'while (fast != NULL) { fast = fast->next; slow = slow->next; (*steps)++; }', accepted: ['while (fast != NULL) { fast = fast->next; slow = slow->next; (*steps)++; }', 'while (fast) { fast = fast->next; slow = slow->next; (*steps)++; }'], hint: '两个指针一起往前走，直到 fast 走出链表；此时 slow 与表尾的距离正好是 k-1', pitfall: '循环条件写成 fast->next != NULL 会让 slow 少走一步，结果变成倒数第 k-1 个；这个差一位的错误在 k=1 时尤其隐蔽（会直接返回倒数第 0 个也就是表尾的后继）' },
      ],
      defects: [
        { kind: '循环边界错误', find: 'for (i = 0; i < k && fast != NULL; i++) fast = fast->next;', replace: 'for (i = 0; i < k - 1 && fast != NULL; i++) fast = fast->next;', why: 'fast 只先走了 k-1 步，两个指针之间的间距少了一格，于是同步阶段结束时 slow 停在倒数第 k-1 个而不是倒数第 k 个', pitfall: '★ 这类「差一位」的错误不会崩溃、也不会死循环，程序照常输出一串看起来合理的数字，只有把结果与期望值逐个比对才能发现。链表题里凡是用「先走几步」来建立两个指针的间距，那个步数就是最容易写错的地方；本例的自检行 steps == n-k 会同时变成 0，等于把错误暴露了两次' },
        { kind: '指针丢失', find: 'while (fast != NULL) { fast = fast->next; slow = slow->next; (*steps)++; }', replace: 'while (fast != NULL) { fast = fast->next; (*steps)++; }', why: '同步阶段忘了推进 slow，于是 slow 一直停在第一个数据结点上，函数永远返回表里的第一个元素', pitfall: '这个错误在 k 恰好等于表长时看不出来（那时同步阶段一轮都不走，slow 本来就该停在第一个结点），所以只测「k = n」这一组会误判程序是对的。★ 出题或自测时必须准备一组 k 明显小于 n 的用例' },
      ],
      cxas: [
        {
          stem: '下面这段程序用**快慢指针**在带头结点的单链表上找倒数第 k 个结点，全程只遍历一遍。请回答后面几个问题，答案都要求精确整数。\n\n约定：n 是数据结点个数（不含头结点）；「向后移动的次数」指对指针执行 `p = p->next` 的次数。\n\n```c\nstatic int nthFromEnd(LinkList L, int k, int *out, int *steps) {\n    LNode *fast = L->next, *slow = L->next; int i = 0;\n    *steps = 0;\n    for (i = 0; i < k && fast != NULL; i++) fast = fast->next;\n    if (i < k) return 0;\n    while (fast != NULL) { fast = fast->next; slow = slow->next; (*steps)++; }\n    *out = slow->data; return 1;\n}\n```',
          code: '',
          asks: [
            { label: 'n=8、k=3 时 fast 向后移动的总次数', answer: '8', hint: '先单独走 k 步，再和 slow 一起走 n-k 步，加起来正好是 n' },
            { label: 'n=8、k=3 时 slow 向后移动的总次数', answer: '5', hint: 'slow 只在同步阶段动，走的步数等于 n-k' },
            { label: 'n=8、k=8 时 slow 向后移动的总次数', answer: '0', hint: 'fast 走满 8 步就已经是 NULL，同步阶段的循环一轮都不进' },
            { label: 'n=8、k=1 时 fast 向后移动的总次数', answer: '8', hint: '与 k 无关，只要 k ≤ n，fast 总是恰好移动 n 次' },
            { label: 'n=8、k=9 时 nthFromEnd 的返回值', answer: '0', hint: 'fast 走到 NULL 时 i 只累加到 8，i < k 成立' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '先把「倒数第 k 个」翻译成「与表尾的距离是 k-1」。链表不能从尾部倒着走，所以要让一个指针先建立起这个距离，再让两个指针保持距离一起前进。',
            steps: [
              'fast 与 slow 都从第一个数据结点出发，此时两者相距 0。',
              'fast 先单独走 k 步，两者相距变成 k。走的过程中必须每步都判 fast != NULL，否则表长不足 k 时会解引用空指针。',
              '循环结束后 i 是实际走成的步数。i < k 说明表长不够，直接返回 0，绝不能继续往下走。',
              '然后 fast 与 slow 同步前进，直到 fast 变成 NULL。此时 fast 已经在表尾之外，slow 与表尾相距 k-1，正是倒数第 k 个。',
              'fast 一共移动 k + (n-k) = n 次，slow 移动 n-k 次，所以整趟的代价是 O(n)，而且只扫了一遍表。',
            ],
            complexity: '时间 O(n)：fast 移动 n 次、slow 移动 n-k 次，合计不超过 2n。空间 O(1)：只用 fast 与 slow 两个指针，不随 n 增长。',
            pitfalls: [
              '★ fast 先走的那一步循环里漏掉 fast != NULL：表长不足 k 时会对 NULL 取 next，直接段错误。这是本题最常见的崩溃点，而且只在「k 大于表长」那一组输入上才暴露。',
              '同步阶段的循环条件写成 fast->next != NULL 会让 slow 少走一步，答案变成倒数第 k-1 个。差一位的错误不崩溃、输出看起来也合理，只有与期望值逐个比对才能发现。',
              '把 slow 的初值写成 L（头结点）而不是 L->next：结果会差一个结点。带头结点的链表里，「第一个数据结点」永远是 L->next。',
              '忘了处理 k > n：这时函数必须返回「找不到」，而不是返回第一个结点。很多实现里 *out 保持调用方的初值，调用方若不检查返回值就会拿一个陈旧的值当答案。',
            ],
          },
        },
        {
          stem: '接上题。除了快慢指针，还有一种朴素做法是「两趟法」：第一趟从头走到尾数出表长 n，第二趟从头走 n-k 步定位。请比较两种做法的代价，答案都要求精确整数。\n\n```c\n/* 两趟法 */\nint len = 0; LNode *p = L->next;\nwhile (p != NULL) { len++; p = p->next; }        /* 第一趟：数表长 */\nif (k > len) return 0;\np = L->next;\nfor (i = 0; i < len - k; i++) p = p->next;      /* 第二趟：定位 */\n*out = p->data; return 1;\n```',
          code: '',
          asks: [
            { label: '两趟法第一趟（数表长）中 p 向后移动的次数（n=8）', answer: '8', hint: '从第一个数据结点走到 NULL，一共移动 n 次' },
            { label: '两趟法第二趟（定位）中 p 向后移动的次数（n=8、k=3）', answer: '5', hint: '走 n-k 步' },
            { label: '两趟法一共遍历链表几趟', answer: '2' },
            { label: '快慢指针法一共遍历链表几趟', answer: '1' },
            { label: '快慢指针法用到的链表指针变量个数（fast 与 slow）', answer: '2' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          notes: {
            idea: '两种做法的时间复杂度都是 O(n)，真正的差别在「扫几趟」与「能不能只扫一趟」。',
            steps: [
              '两趟法要先知道 n 才能算出走几步，所以必须完整扫一遍拿长度，再扫一遍定位，合计移动 n + (n-k) 次。',
              '快慢指针法用「两个指针的间距」代替「表长」这个信息，间距建立起来之后一次同步前进就到位，合计移动 n + (n-k) 次。',
              '★ 两者的移动次数完全一样，快慢指针并没有更快，它省的是「趟数」。',
              '趟数什么时候要紧？当链表只能顺序读一次的时候：数据流、只读一次的磁盘/网络缓冲、或者结点读完就被释放。这种场景下两趟法根本不可行。',
              '反过来，如果表长本来就已知（例如顺序表，或者链表另外维护了 len 字段），两趟法退化成 O(n-k) 的一步定位，比快慢指针还省。',
            ],
            complexity: '两者时间都是 O(n)、空间都是 O(1)。快慢指针的价值不是渐近更快，而是「单趟可完成」，这在只能顺序访问一次的数据上是硬性要求。',
            pitfalls: [
              '★ 最常见的错误结论是「快慢指针比两趟法快」。两者的指针移动次数是同一个数 n + (n-k)，快慢指针省的是遍历趟数不是操作次数；答题时要说清省在哪。',
              '顺序表上做同一件事根本不需要指针：`a[n-k]` 一步到位，O(1)。快慢指针是「链表不能随机访问」这个限制逼出来的技巧，不要把它当成通用解法。',
              '两趟法的第一趟可以省掉，前提是链表另外维护了长度字段 —— 代价是每次插入删除都要同步更新它，属于典型的空间/维护成本换查询成本。',
            ],
          },
        },
      ],
      notes: {
        idea: '单链表只能从头往尾走，「倒数第 k 个」看起来非要知道表长不可。快慢指针的办法是让两个指针之间先拉开 k 的距离，然后一起走 —— 前面那个到表尾时，后面那个自然就在倒数第 k 个上。',
        steps: [
          '两个指针都从 L->next 出发（带头结点的链表里第一个数据结点是 L->next，不是 L）。',
          'fast 先走 k 步，每步都要判 fast != NULL；走完用 i 与 k 比较判断表长够不够。',
          'fast 与 slow 同步走，直到 fast 变成 NULL。',
          '此时 slow 指向倒数第 k 个结点，取值返回。',
          '主函数里那一行 `steps == n - k` 是真的算出来再比对的，不是把答案写进格式串 —— 它同时校验了「定位对不对」与「步数对不对」。',
        ],
        complexity: '时间 O(n)：fast 移动 n 次、slow 移动 n-k 次。空间 O(1)：只有两个指针。只扫一趟表，这是它相对两趟法的唯一优势。',
        pitfalls: [
          '★ fast 先走 k 步的循环里必须有 fast != NULL：表长不足 k 时会解引用空指针。这个错误只在「k 大于表长」那一组输入上暴露，所以测试用例里必须有一组 k > n。',
          '走完 k 步之后要用 i < k 判断表长够不够，不能直接往下走。很多人写成 `if (fast == NULL) return 0;`，在 k 恰好等于 n 时会误判（那时 fast 确实是 NULL，但答案存在，就是第一个结点）。',
          '同步阶段漏掉 `slow = slow->next` 会让 slow 永远停在第一个结点上，函数变成「永远返回表头元素」。这个错误在 k == n 时完全看不出来，因为那时同步阶段一轮都不走。',
          '先走 k 步与后走 k 步的差别就是差一位：写成 k-1 步会得到倒数第 k-1 个。凡是靠「先走几步」建立指针间距的题，那个步数都是最容易错的地方。',
          '同样的技巧还能解「找链表中点」（fast 每次走两步、slow 每次走一步）与「判断有没有环」（fast 走两步，若与 slow 相遇则有环）。三题的共同点是「用两个指针的相对速度或间距换掉表长这个信息」。',
        ],
      },
      explain: {
        code_reading: {
          idea: '要读出结果，得先确定 fast 先走的 k 步会不会走出链表，再数同步阶段走了几轮。',
          steps: [
            '先数表长 n，再看 k 与 n 的关系：k > n 时 fast 会在第 n 步变成 NULL，i 停在 n，i < k 成立，函数返回 0，主函数打印「不存在」。',
            'k ≤ n 时 fast 走满 k 步，然后同步阶段走 n-k 轮，slow 从第一个数据结点前进 n-k 步，落在倒数第 k 个上。',
            '输出里那个 `相符=%d` 是把 steps 与 n-k 都算出来再比，正常输入下一定是 1；如果读到 0，说明定位错了。',
          ],
        },
        ds_debug: {
          idea: '两个缺陷一个在「先走 k 步」那一句、一个在同步循环里，都是少做了一点事，所以程序照样跑得完、照样打印出一串数字，只有数值不对。',
          steps: [
            '先把正确行为写出来：fast 先走 k 步，两者相距 k；同步走到 fast 为 NULL，slow 就在倒数第 k 个。',
            '再逐个检查那两句：先走的步数是不是 k，同步阶段是不是两个指针都在动。',
            '改完之后用一组 k 明显小于 n 的输入验算，因为 k == n 时同步阶段一轮都不走，两个缺陷都看不出来。',
          ],
        },
      },
    },
    {
      key: 'poly-add',
      section: '2.5 线性表的应用',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '一元多项式', '归并', '线性表应用'],
      knowledgeIds: ['ds-ch02-11', 'ds-ch02-06', 'ds-ch02-03'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct PNode { int coef; int exp; struct PNode *next; } PNode, *Poly;
static int readPoly(int *c, int *e) { int n, i;
    if (scanf("%d", &n) != 1 || n < 0 || n > 32) return -1;
    for (i = 0; i < n; i++) if (scanf("%d %d", &c[i], &e[i]) != 2) return -1;
    return n; }
static Poly buildPoly(const int *c, const int *e, int n) {
    Poly h = (Poly)malloc(sizeof(PNode)); PNode *t = h; int i; h->coef = 0; h->exp = 0; h->next = NULL;
    for (i = 0; i < n; i++) { PNode *s = (PNode *)malloc(sizeof(PNode));
        s->coef = c[i]; s->exp = e[i]; s->next = NULL; t->next = s; t = s; }
    return h; }
static int polyLen(Poly P) { PNode *p = P->next; int c = 0; while (p != NULL) { c++; p = p->next; } return c; }
static void showPoly(const char *lb, Poly P) {
    PNode *p = P->next; printf("%s", lb); if (p == NULL) printf(" 0");
    while (p != NULL) { printf(" %dx^%d", p->coef, p->exp); p = p->next; }
    printf("\\n"); }
/* 把 B 加到 A 上（就地）并返回结果表头。指数相等则系数相加、和为 0 就把两个结点都摘掉，
   否则把指数小的那个结点直接摘下来接到结果尾部 —— 全程不新建任何数据结点。 */
static Poly polyAdd(Poly A, Poly B, int *merged, int *freed) {
    PNode *tail = A, *pa = A->next, *pb = B->next, *t;
    *merged = 0; *freed = 0;
    while (pa != NULL && pb != NULL) {
        if (pa->exp < pb->exp) { tail->next = pa; tail = pa; pa = pa->next; }
        else if (pa->exp > pb->exp) { tail->next = pb; tail = pb; pb = pb->next; }
        else { pa->coef += pb->coef; (*merged)++; t = pb; pb = pb->next; free(t); (*freed)++;
            if (pa->coef == 0) { t = pa; pa = pa->next; free(t); (*freed)++; }
            else { tail->next = pa; tail = pa; pa = pa->next; } } }
    tail->next = (pa != NULL) ? pa : pb;
    free(B); return A; }
int main(void) {
    int n, m, c[32], e[32], merged, freed; Poly A, B, R;
    n = readPoly(c, e); if (n < 0) { printf("输入有误\\n"); return 0; }
    A = buildPoly(c, e, n);
    m = readPoly(c, e); if (m < 0) { printf("输入有误\\n"); return 0; }
    B = buildPoly(c, e, m); showPoly("A =", A); showPoly("B =", B);
    R = polyAdd(A, B, &merged, &freed); showPoly("A+B =", R);
    printf("A 有 %d 项、B 有 %d 项、结果有 %d 项；合并了 %d 对同类项，释放了 %d 个结点，新建了 0 个\\n", n, m, polyLen(R), merged, freed);
    while (R != NULL) { PNode *q = R; R = R->next; free(q); }
    return 0; }`,
      inputs: [
        { stdin: '3\n-5 0\n2 1\n3 2\n3\n1 0\n-2 1\n4 2\n', note: '三项指数全对上', why: 'A=-5+2x+3x²、B=1-2x+4x² → 三对同类项全合并，其中 x¹ 的系数 2+(-2)=0 要把两个结点都摘掉，结果只剩 -4x^0 与 7x^2 两项' },
        { stdin: '1\n1 0\n1\n1 3\n', note: 'A 先耗尽', why: '★ 专门暴露「循环结束后忘了接上另一条链的剩余段」：A 只有 x^0、B 只有 x^3，A 先走完，剩下的 1x^3 必须由 tail->next = pb 一次接上' },
        { stdin: '2\n3 1\n2 2\n1\n-2 2\n', note: '最高次项相消', why: '2x² 与 -2x² 系数和为 0，两个结点都要 free；此时 tail 还停在 A 的头结点上，结果表只剩 3x^1' },
        { stdin: '0\n\n1\n5 1\n', note: 'A 是零多项式', why: 'pa 一开始就是 NULL，while 一轮都不进，结果整条 B 直接接过来；这一组检验「空表」退化路径' },
        { stdin: '1\n1 1\n0\n\n', note: 'B 是零多项式', why: 'pb 一开始就是 NULL，结果就是 A 本身；★ free(B) 只释放 B 的头结点，不能漏也不能多释放' },
        { stdin: '3\n3 1\n2 3\n1 5\n2\n5 2\n4 4\n', note: '完全交错', why: '两条链的指数交替出现，while 循环走 4 轮，结束后 A 还剩 1x^5 由 tail->next 一次接上；这一组的比较次数达到上界 m+n-1' },
      ],
      blanks: [
        { find: 'pa->coef += pb->coef;', accepted: ['pa->coef += pb->coef;', 'pa->coef = pa->coef + pb->coef;'], hint: '指数相同就是同类项，把 B 的系数累加到 A 的结点上去，这样一个结点就代表了合并后的项', pitfall: '写成 pb->coef += pa->coef 也行，但后面接进结果表的必须是留着的那个结点；本程序保留 pa、释放 pb，所以只能加到 pa 上。加完还要判一次和是不是 0 —— 系数相消的项必须整个删掉，不能留一个 0x^k 在表里' },
        { find: '    tail->next = (pa != NULL) ? pa : pb;', accepted: ['    tail->next = (pa != NULL) ? pa : pb;', '    tail->next = pa != NULL ? pa : pb;'], hint: '循环退出时至少有一条链已经走完，另一条链剩下的整段直接挂到结果尾部就行（它本身已经有序）', pitfall: '★ 写成 tail->next = pa 会在「A 先耗尽」时把 B 的剩余段整个丢掉，而且程序不崩溃、结果看起来还是个合法多项式，只有项数对不上。这一句是三路归并的收尾，漏掉它是链表归并最常见的错误' },
      ],
      defects: [
        { kind: '条件判断错误', find: 'if (pa->exp < pb->exp) { tail->next = pa; tail = pa; pa = pa->next; }', replace: 'if (pa->exp <= pb->exp) { tail->next = pa; tail = pa; pa = pa->next; }', why: '指数相等时也走了「直接把 pa 接进结果」那条分支，同类项根本没有合并，两个同指数的项都留在结果表里', pitfall: '后果不是算错系数，而是结果表里出现两个同指数的项 —— 多项式的「规范形式」被破坏了。程序仍然终止、仍然升序，只有数项数或者逐项看指数才能发现。★ 归并类算法里 `<` 与 `<=` 的差别往往就是「合并」与「不合并」的差别' },
        { kind: '赋值顺序错误', find: '    tail->next = (pa != NULL) ? pa : pb;', replace: '    tail->next = pa;', why: '循环结束后只接上 A 的剩余段，B 的剩余段被整个丢掉', pitfall: '这一句只在「B 比 A 长且 B 的高次项更大」时才起作用，所以要有一组 A 先耗尽的输入才暴露得出来（本例第 2 组）。★ 更重要的是：被丢掉的那些结点从来没有被 free，它们既不在结果表里也不再被 B 的头结点指着，于是整段内存泄漏 —— 判题只看 stdout 的话这层看不见，但它正是链表题里最典型的连带后果' },
      ],
      cxas: [
        {
          stem: '下面这段程序用**带头结点的单链表**表示一元多项式（每个结点存系数 coef 与指数 exp，表按指数升序排列），并把 B 加到 A 上。请回答后面几个问题，答案都要求精确整数。\n\n约定：「合并的同类项对数」就是程序里 `*merged` 的值；「释放的结点个数」就是 `*freed` 的值（只数数据结点，不含最后 `free(B)` 释放的那个头结点）。\n\n```c\nstatic Poly polyAdd(Poly A, Poly B, int *merged, int *freed) {\n    PNode *tail = A, *pa = A->next, *pb = B->next, *t;\n    *merged = 0; *freed = 0;\n    while (pa != NULL && pb != NULL) {\n        if (pa->exp < pb->exp) { tail->next = pa; tail = pa; pa = pa->next; }\n        else if (pa->exp > pb->exp) { tail->next = pb; tail = pb; pb = pb->next; }\n        else { pa->coef += pb->coef; (*merged)++; t = pb; pb = pb->next; free(t); (*freed)++;\n            if (pa->coef == 0) { t = pa; pa = pa->next; free(t); (*freed)++; }\n            else { tail->next = pa; tail = pa; pa = pa->next; } } }\n    tail->next = (pa != NULL) ? pa : pb;\n    free(B); return A;\n}\n```\n\n第 1 组输入：A = -5x^0 + 2x^1 + 3x^2，B = 1x^0 + (-2)x^1 + 4x^2。',
          code: '',
          asks: [
            { label: '第 1 组输入中合并的同类项对数（merged）', answer: '3', hint: '两个多项式的指数都是 0、1、2，三对全都对得上' },
            { label: '第 1 组输入中释放的数据结点个数（freed）', answer: '4', hint: '每合并一对就释放 B 的那个结点（3 个）；x^1 的系数 2+(-2)=0，A 的那个结点也要释放（再加 1 个）' },
            { label: '第 1 组输入中结果多项式的项数', answer: '2', hint: '三对合并后 x^1 那一项整项消失，只剩 x^0 与 x^2' },
            { label: '整个相加过程中新建的数据结点个数', answer: '0', hint: '结果表完全由 A 与 B 原有的结点重新串起来，一次 malloc 都没调' },
            { label: '第 3 组输入（A=3x^1+2x^2、B=-2x^2）中释放的数据结点个数', answer: '2', hint: '只有 x^2 那一对合并，且系数和为 0，所以 A 与 B 的两个结点都被释放' },
          ],
          complexity: 'O(m+n)',
          accepted: ['O(m+n)', 'O(n+m)', 'O(m + n)', '线性阶'],
          notes: {
            idea: '两个升序链表求并，本质就是归并排序的 merge 那一步，只是「相等」时的动作从「二选一」变成「系数相加」。',
            steps: [
              'pa 与 pb 分别指向 A、B 的第一个数据结点，tail 指向结果表的最后一个结点（初始是 A 的头结点）。',
              '每轮比较 pa->exp 与 pb->exp：小的那个结点直接摘下来挂到 tail 后面，然后 tail 与那个指针各前进一步。',
              '指数相等时是同类项：把 pb 的系数加到 pa 上，pb 的结点立刻 free 掉；若加完系数为 0，pa 的结点也要 free，这一项整个消失。',
              '循环退出时至少一条链空了，另一条链剩下的整段本身已经有序，用 `tail->next = (pa != NULL) ? pa : pb` 一次接上。',
              '最后 `free(B)` 只释放 B 的头结点 —— B 的数据结点要么进了结果表、要么已经被 free，头结点成了唯一的垃圾。',
            ],
            complexity: '时间 O(m+n)：每轮循环至少让 pa 或 pb 前进一步，所以循环不超过 m+n 轮。空间 O(1)：不新建任何数据结点，只用四个指针。',
            pitfalls: [
              '★ 「不新建结点」是这个算法最值得记住的一点：结果表是 A 与 B 的结点重新串起来的，所以空间是 O(1) 而不是 O(m+n)。代价是 B 用完就废了（它的结点要么进了结果、要么被 free），调用方不能再拿 B 去做别的事。',
              '系数和为 0 时必须把 pa 的结点也 free 掉，否则结果表里会留一个 0x^k。这一项既占空间又破坏规范形式，后续再拿这个多项式去乘或去求值就会出错。',
              '收尾那句三目不能省也不能只写一边。写成 `tail->next = pa` 会在 A 先耗尽时丢掉 B 的整段剩余；而且被丢掉的结点从此谁都指不到，是内存泄漏。',
              '最后只能 `free(B)` 释放头结点，不能写 freePoly(B) 沿着链一路释放 —— B->next 早就被改成了 NULL 吗？不，本程序没有改 B->next，它只是从 pb 开始逐个摘走，所以 B->next 仍指向第一个数据结点，而那个结点现在在结果表里。★ 沿 B 释放会把结果表一起释放掉，这是 use-after-free 级别的错误。',
            ],
          },
        },
        {
          stem: '接上题。第 6 组输入是「完全交错」的情形：A = 3x^1 + 2x^3 + 1x^5，B = 5x^2 + 4x^4（都按指数升序）。请回答后面几个问题，答案都要求精确整数。',
          code: '',
          asks: [
            { label: '第 6 组输入中 while 循环执行的轮数', answer: '4', hint: '每轮至少让 pa 或 pb 前进一步，B 只有 2 项，走完 2 轮 B 就空了；实际是 4 轮' },
            { label: '第 6 组输入中在 while 循环里从 A 摘下来接进结果的结点个数', answer: '2', hint: '指数 1 与 3 的那两项' },
            { label: '第 6 组输入中在 while 循环里从 B 摘下来接进结果的结点个数', answer: '2' },
            { label: '第 6 组输入中循环结束后由 tail->next 一次性接上的结点个数', answer: '1', hint: 'A 还剩 1x^5' },
            { label: '第 6 组输入中结果多项式的项数', answer: '5', hint: '五个指数 1、2、3、4、5 互不相同，一项都不会相消' },
          ],
          complexity: 'O(m+n)',
          accepted: ['O(m+n)', 'O(n+m)', 'O(m + n)', '线性阶'],
          notes: {
            idea: '「完全交错」是这类归并的最坏情形：每一轮都只消耗掉一个结点，循环要走满 m+n-1 轮。',
            steps: [
              '第 1 轮：1 < 2，摘 A 的 3x^1；第 2 轮：3 > 2，摘 B 的 5x^2；第 3 轮：3 < 4，摘 A 的 2x^3；第 4 轮：5 > 4，摘 B 的 4x^4。',
              '此时 pb 已经是 NULL，循环退出，一共 4 轮 = m + n - 1 = 3 + 2 - 1。',
              'A 还剩 1x^5，由收尾那句一次接上，所以结果有 5 项。',
              '★ 4 轮里从 A 摘了 2 个、从 B 摘了 2 个，剩下 1 个是收尾接的 —— 2+2+1 = 5，正好等于结果项数，这是一条可以拿来验算的等式。',
              '反过来，如果 A 的所有指数都比 B 小（例如 A=x^0、B=x^3），循环只走 1 轮就退出，这是最好情形，轮数 = min(m,n)。',
            ],
            complexity: '循环轮数在 min(m,n) 与 m+n-1 之间，所以时间是 O(m+n)。完全交错取到上界，一条链整体小于另一条时取到下界。',
            pitfalls: [
              '★ 比较次数的上界是 m+n-1 而不是 m+n：最后一轮之后必有一条链空了，循环条件里的 `pb != NULL` 立刻为假，不需要再比一次指数。',
              '「完全交错」与「一条整体小于另一条」的差别很大（4 轮 vs 1 轮），但两者都是 O(m+n)，所以渐近记号看不出这个差别 —— 这正是为什么实测计数比背复杂度更有说服力。',
              '收尾接上的那一段不需要逐个结点搬，一条赋值就够，因为它本身已经有序。很多实现里会在这里再写一个 while 循环逐个接，那样虽然也对，但把 O(1) 的操作写成了 O(剩余长度)。',
            ],
          },
        },
      ],
      notes: {
        idea: '一元多项式是线性表最经典的应用：项的个数事先不知道、要频繁插入删除、还要按指数有序，用链表比用数组自然得多。相加就是两条有序链表的归并。',
        steps: [
          '每个结点存 (coef, exp)，整张表按 exp 升序，头结点不存数据。',
          '相加用三路归并：指数小的先接进结果、指数相等的合并系数、循环结束后把剩余段整段接上。',
          '合并时系数和为 0 要把两个结点都释放掉，这一项从结果里彻底消失。',
          '全程不 malloc 任何数据结点，结果表由 A 与 B 的原有结点重新串成。',
          '最后只 free(B) 释放 B 的头结点，A 的头结点被复用为结果表的头结点。',
        ],
        complexity: '时间 O(m+n)，空间 O(1)（不算结果表本身占的结点，因为那些结点是复用的）。',
        pitfalls: [
          '★ 不能沿 B 释放整条链：B->next 仍然指向它的第一个数据结点，而那个结点很可能已经在结果表里了。只能 free(B) 释放头结点。这是「复用结点」这种做法必须付的代价 —— 谁拥有哪些结点变得不直观。',
          '指数相等时的 `<` 写成 `<=` 会让同类项不合并，结果表里出现两个同指数的项。程序照样终止、照样升序，只有数项数才发现。',
          '收尾的三目只写一边（`tail->next = pa`）会在 A 先耗尽时丢掉 B 的剩余段，同时造成内存泄漏。',
          '输入必须约定有序（本程序约定按指数升序）。若输入无序，结果既不是升序也不是正确的多项式，而程序不会报任何错 —— 这是「算法依赖前置条件却不检查前置条件」的典型例子。',
          '零多项式要能表示：本程序用「只有头结点的空表」表示它，showPoly 遇到空表打印 0。若用「系数为 0 的结点」表示，相加时就会多出一堆 0x^k。',
        ],
      },
      explain: {
        code_reading: {
          idea: '读这类程序的关键是盯住 tail、pa、pb 三个指针，把每一轮「谁被摘下来、谁前进了」写出来。',
          steps: [
            '先确认输入约定：两条链都按指数升序，所以归并结果也升序。',
            '逐轮走：指数小的摘下来挂到 tail 后面；指数相等的合并系数，pb 的结点被 free，系数为 0 时 pa 的结点也被 free。',
            '循环退出后看 tail->next 接的是哪条链的剩余段。',
            '最后那一行统计把 n、m、结果项数、merged、freed 全打出来，可以拿「结果项数 == n + m - merged - 相消的项数」验算。',
          ],
        },
        ds_debug: {
          idea: '两个缺陷一个改了三路归并的分派条件、一个改了收尾那一句，都不会让程序崩溃，只会让结果表的项数或内容不对。',
          steps: [
            '先写出正确的三路归并：小于接 pa、大于接 pb、相等合并。',
            '再检查收尾：循环退出时必有一条链空了，另一条要整段接上。',
            '验算用「结果项数」这个数：完全不相消时它等于 n+m-merged，相消一项就再减 1。',
          ],
        },
      },
    },
    {
      key: 'term-seq-vs-list',
      section: '2.5 线性表的应用',
      difficulty: 2,
      bloom: 'understand',
      tags: ['顺序表', '链表', '存储结构选型', '线性表'],
      knowledgeIds: ['ds-ch02-05', 'ds-ch02-06', 'ds-ch02-01', 'ds-ch01-05'],
      code: '',
      inputs: [],
      term: {
        stem: '顺序表（顺序存储的线性表）与链表（链式存储的线性表）是同一个逻辑结构的两种存储实现。请回答：\n\n1. 两者在「按序号取元素」上的代价分别是多少？为什么会有这个差别？\n2. 两者在「插入 / 删除一个元素」上的代价分别是多少？链表那个 O(1) 是有前提的，前提是什么？\n3. 除了时间，两者在**空间**上各有什么额外开销或浪费？\n4. 什么叫「缓存局部性」？它为什么让顺序表在现代机器上比纸面分析更有优势？\n5. 给出至少三条选型判据，说明什么时候该用顺序表、什么时候该用链表。\n6. 举一个「必须用链表」的场景和一个「必须用顺序表」的场景，并说明为什么另一种不行。',
        keyPoints: [
          '按序号取元素：顺序表是 O(1)，因为第 i 个元素的地址 = 基址 + (i-1) × 每个元素的大小，一次算术就得到；链表是 O(i)，因为结点分散存放，只能从头结点开始沿着 next 一个一个走',
          '插入 / 删除：顺序表要搬移元素，平均搬 n/2 个，是 O(n)；链表只改 2~3 条指针，是 O(1) —— ★ 但这个 O(1) 的前提是「已经站在目标位置（或它的前驱）上」，如果还要先找位置，找位置本身就是 O(n)，总代价仍是 O(n)',
          '空间开销：顺序表要预先分配一个上限容量，用不满就浪费（或者动态扩容，扩容时要整体搬到一块更大的内存，均摊 O(1) 但单次 O(n)）；链表按需 malloc，不浪费容量，但每个结点多存一个（双向链表是两个）指针，而且 malloc 本身有管理开销',
          '缓存局部性：CPU 读内存是按「缓存行」（通常 64 字节）整块读的，顺序表的元素连续存放，读一个就顺带把旁边十几个也带进缓存；链表结点分散在堆上，每走一步都可能 cache miss，实测差距可以达到数倍 —— 这是纸面复杂度分析看不出来的一项',
          '选型判据：① 查得多改得少 → 顺序表 ② 改得多查得少、或者表长波动很大 → 链表 ③ 需要频繁在中间插入删除且已经持有位置 → 链表 ④ 需要 O(1) 的随机访问（例如二分查找、按下标访问的算法）→ 只能顺序表 ⑤ 需要把多张表串起来共享结点（例如多项式相加复用结点）→ 只能链表',
          '必须用链表的场景：约瑟夫环 / 循环队列的链式实现 / 多项式相加复用结点 —— 它们要么需要「尾结点指回头结点」这种数组做不到的连接方式，要么需要把结点从一张表摘下来挂到另一张表上；必须用顺序表的场景：二分查找、堆排序、任何需要 a[i] 一步到位的算法 —— 链表上做二分每折半一次都要走 n/2 步，反而比顺序查找还慢',
        ],
        reference_answer: '【一、按序号取元素】\n\n顺序表 O(1)。原因是元素在内存里连续存放，`LOC(a_i) = LOC(a_1) + (i-1) × sizeof(elem)`，一次乘加就得到地址，不需要遍历。\n\n链表 O(i)（最坏 O(n)）。结点是用 malloc 逐个申请的，散落在堆上，彼此之间只靠 next 指针联系，想知道第 i 个是谁就只能从头结点开始一步一步走。\n\n★ 这一条差别是根本性的：它决定了「二分查找只能在顺序表上做」。链表上做二分，每次折半都要走 n/2 步去找中点，总代价反而比顺序查找还高。\n\n【二、插入与删除】\n\n顺序表：在位置 i 插入要把 a_i..a_n 全部往后挪一格，平均挪 n/2 个；删除要往前挪，平均也是 n/2 个。所以是 O(n)。注意「平均 n/2」的前提是各个位置等概率，若总是在表尾操作就是 O(1)。\n\n链表：插入要改 2 条指针（新结点的 next、前驱的 next），删除要改 1 条（前驱的 next）；双向链表插入要改 4 条、删除中间结点改 2 条。所以是 O(1)。\n\n★ 但这个 O(1) 有前提：**已经站在目标位置或它的前驱上**。单链表插入必须拿到前驱（因为要改的是前驱的 next），而找前驱本身是 O(n)，所以「在单链表第 i 个位置插入」的完整代价仍是 O(n)。链表的 O(1) 只在「手里已经握着那个结点」时成立 —— 这正是双向链表存在的理由之一：它可以从结点本身直接拿到 prior，删除已知结点是真正的 O(1)。\n\n【三、空间】\n\n顺序表：① 要预先分配上限容量，用不满就浪费（静态数组尤其明显）② 动态扩容时要申请一块更大的内存并把全部元素搬过去，单次 O(n)、均摊 O(1) ③ 不存任何指针，每个元素只占数据本身的大小。\n\n链表：① 按需 malloc，不浪费容量 ② 每个结点多存一个指针（双向链表两个），在「元素本身很小」的场景里指针占比很高 —— 例如存 int 的单链表，数据 4 字节、指针 8 字节（64 位机），指针占了三分之二 ③ 每次 malloc 都有分配器的管理开销与碎片问题 ④ 释放要及时，漏掉就是内存泄漏。\n\n【四、缓存局部性】\n\nCPU 访问内存不是按字节取的，而是按「缓存行」（主流是 64 字节）整块取。顺序表的元素连续存放，读 a[0] 的时候 a[1]..a[15]（int 数组）已经被一起带进缓存了，后续访问几乎全部命中；链表结点分散在堆上，每走一步都可能是一次 cache miss，要去主存取，代价是命中缓存的几十到上百倍。\n\n★ 后果是：纸面上 O(n) 对 O(n) 打平的两个算法，实测顺序表版本可能快好几倍。这就是为什么现代 C++ 的 STL 里 vector 是默认容器、list 只在极少数场景用，也是为什么「链表插入是 O(1) 所以更快」这个结论在实测里经常不成立。\n\n【五、选型判据】\n\n| 场景 | 选谁 | 理由 |\n|---|---|---|\n| 查得多改得少（例如配置表、字典） | 顺序表 | 随机访问 O(1)，还能做二分 |\n| 改得多查得少、且手里已握着位置 | 链表 | 只改几条指针 |\n| 表长波动很大、无法预估上限 | 链表 | 按需分配，不会浪费也不会频繁扩容 |\n| 需要随机访问下标 | 只能顺序表 | 链表做不了 O(1) 下标访问 |\n| 需要把结点在多张表之间搬来搬去 | 只能链表 | 摘一个结点挂到另一张表上是 O(1)，数组做不到 |\n| 需要「尾接首」的环形结构 | 链表更自然 | 循环链表只要让尾结点的 next 指回头结点 |\n| 元素很大（例如几百字节的结构体） | 链表或「顺序表存指针」 | 搬移一个元素的成本太高，宁可搬指针 |\n\n【六、两个「必须」的场景】\n\n必须用链表：**约瑟夫环**。n 个人围成一圈，报到 m 的出列。循环链表只要让尾结点的 next 指回头结点，出列就是「改一条指针 + free 一个结点」；用数组模拟也能做，但每次出列都要搬移后面所有人，n 次出列合计 O(n²)。另一个例子是**多项式相加复用结点**：结果表的结点全部来自 A 与 B，一次 malloc 都不调，这在数组上做不到（数组必须新开一块空间）。\n\n必须用顺序表：**二分查找**。它要求「一步跳到中点」，链表上找中点要走 n/2 步，折半 log n 次合计 O(n)，比顺序查找的 O(n) 一点没省，还多了一堆指针跳转。同理，**堆排序**要求随时访问 a[i]、a[2i+1]、a[2i+2]，也只能在顺序存储上做。\n\n【七、一句话总结】\n\n顺序表用「连续内存」换来了 O(1) 随机访问与缓存友好，代价是插删要搬移、容量要预估；链表用「指针串联」换来了 O(1) 的结点摘挂与按需分配，代价是不能随机访问、每个结点多存指针、缓存不友好。★ 两者的时间复杂度差别只在「已经握着位置」时才体现出来；一旦把「找位置」算进去，插删都是 O(n)，链表的優勢就只剩下「不搬移大元素」与「结点可以在多张表之间复用」这两条了。',
      },
      /* ★ term 子对象里不要再放 notes：buildExplain 拿到的 subNotes 会盖掉 entry 级的 e.notes，
         而 term.notes 只有 pitfalls 没有 steps，于是【步骤】整段变空、被 checkAndPush 判不合格。
         概念题的详解素材一律写在下面这份 entry 级 notes 里。 */
      notes: {
        idea: '这道题考的是「同一个逻辑结构的两种存储实现各自付出什么代价」，答题要落到具体的操作与具体的数字上，不能只说「各有优缺点」。',
        steps: [
          '先分操作列代价：随机访问、插入、删除，各自在两种存储上是 O(几)，并说清差别从哪来（连续存放可以一次算出地址 vs 只能沿指针走）。',
          '再补两项容易被漏掉的：空间开销（顺序表的容量浪费与扩容搬迁 vs 链表每结点一个指针）与缓存局部性（CPU 按缓存行整块取内存）。',
          '然后给可操作的判据：查改比例、表长是否可预估、是否需要随机访问下标、是否要在多张表之间搬结点、元素本身有多大。',
          '最后各举一个「必须用某一种」的场景并说明另一种为什么做不到：约瑟夫环与多项式复用结点必须用链表，二分查找与堆排序必须用顺序表。',
        ],
        complexity: '顺序表：随机访问 O(1)、插入删除 O(n)（平均搬 n/2 个元素）。链表：随机访问 O(n)、插入删除 O(1)（★ 前提是已握着位置或它的前驱，否则找位置本身就是 O(n)）。两者的空间都是 O(n)，差别在常数项：顺序表可能浪费容量，链表每结点多存一个指针。',
        pitfalls: [
          '★ 最常见的错误答案是「链表插入删除是 O(1) 所以比顺序表快」。这句话漏掉了前提：单链表插入必须先找到前驱，而找前驱是 O(n)。链表的 O(1) 只在「手里已经握着那个结点（或它的前驱）」时成立 —— 这也正是双向链表存在的理由之一，它能从结点本身直接拿到 prior。',
          '把「平均搬移 n/2 个元素」当成「一定搬 n/2 个」：这个平均值的前提是各个位置等概率插入。若总是在表尾追加（例如顺序栈），搬移是 0 次；若总是在表头插入，搬移是 n 次。',
          '忽略缓存局部性：纸面复杂度相同时，顺序表因为内存连续往往实测快好几倍（CPU 按 64 字节的缓存行整块取，读一个 int 顺带把旁边十几个也带进缓存）。只背复杂度会得出「两者差不多」，而工程上的答案是「默认用顺序表」。',
          '把「链表省空间」当成普遍结论：只有元素本身很大时链表才省。存 int 的单链表在 64 位机上指针 8 字节、数据 4 字节，指针占了三分之二，比顺序表费空间得多。',
          '忘记顺序表的扩容代价：动态数组容量满了要申请一块更大的内存并整体搬过去，单次 O(n)、均摊 O(1)。「均摊」不等于「每次都快」，实时系统里这是要专门考虑的问题。',
          '混淆「逻辑结构」与「存储结构」：线性表是逻辑结构（元素之间一对一），顺序存储与链式存储是它的两种实现。同一个「栈」既可以用数组做也可以用链表做，栈本身不是存储结构。',
          '选型判据要可操作（查改比例、表长波动、是否需要下标访问、元素大小），不要只写「视情况而定」—— 那样等于没有回答。',
        ],
      },
    },
  ],
};
