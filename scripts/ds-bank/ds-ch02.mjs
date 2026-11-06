/* ds-ch02 线性表 · 程序库（第 1 批：顺序表 + 单链表基础）
 *
 * 写库规则（与 ds-ch01.mjs 完全一致，生成器会强校验）：
 *   ① code 必须能用 gcc -std=c99 -Wall -Wextra 编译且零警告
 *   ② expected 不要手写，由生成器实跑得到
 *   ③ code 去掉空行后 ≤ 40 行
 *   ④ inputs ≥ 2 组，且各组输出互不相同（否则派生不出两道 code_reading）
 *   ⑤ defects[i].find / blanks[i].find 必须在 code 中恰好出现一次
 *   ⑥ 派生出的错误版本必须在至少一组输入上输出不同
 *
 * ★ 顺序表/链表这类题最容易踩的坑是「未初始化内存导致输出不确定」。
 *   凡是被派生成 ds_debug / multi_bug_debug 的程序，所有可能被错误版本读到的
 *   数组单元都必须显式初始化（本批一律用 `= { { 0 }, 0 }` 或 malloc 后立即赋值），
 *   否则 judge:verify 今天过了明天就挂。
 */
export default {
  shard: 'ds-ch02',
  chapter: '第2章 线性表',
  category: 'ds',

  entries: [
    // ─────────────────────────────────────────────────────────────
    // 1. 顺序表的插入与删除：搬移次数的两个精确公式
    // ─────────────────────────────────────────────────────────────
    {
      key: 'seq-insert-delete',
      cxaStem:
        '下面这个程序在**顺序表**上做一次插入和一次删除，并且把两个操作各自搬移了多少个元素数了出来。\n\n' +
        '输入格式：第一行是 n，第二行是 n 个整数（表的初始内容，下标 0..n−1），' +
        '第三行是三个整数 `pos x dpos`（在下标 pos 处插入 x，然后删除下标 dpos 的元素）。\n\n' +
        '请回答后面几个问题。涉及「平均移动次数」的问题一律按**等概率**假设计算，答案写成小数。',
      section: '2.2 线性表的顺序表示（顺序表）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['顺序表', '插入删除', '元素移动次数', '线性表'],
      knowledgeIds: ['ds-ch02-05', 'ds-ch02-02', 'ds-ch02-01'],
      code: `#include <stdio.h>

#define MAXLEN 32
typedef struct { int data[MAXLEN]; int len; } SqList;
static void show(const char *lb, const SqList *L) { int i; printf("%s", lb); for (i = 0; i < L->len; i++) printf(" %d", L->data[i]); printf("\\n"); }

static int seqInsert(SqList *L, int pos, int x, int *mv) {
    int i; *mv = 0;
    if (pos < 0 || pos > L->len || L->len >= MAXLEN) return -1;
    for (i = L->len - 1; i >= pos; i--) { L->data[i + 1] = L->data[i]; (*mv)++; }
    L->data[pos] = x;
    L->len++;
    return *mv;
}

static int seqDelete(SqList *L, int pos, int *out, int *mv) {
    int i; *mv = 0;
    if (pos < 0 || pos >= L->len) return -1;
    *out = L->data[pos];
    for (i = pos; i < L->len - 1; i++) { L->data[i] = L->data[i + 1]; (*mv)++; }
    L->len--;
    return *mv;
}
int main(void) {
    SqList L = { { 0 }, 0 };
    int n, i, x, pos, dpos, mvA = 0, mvB = 0, r1, r2, del = 0;
    if (scanf("%d", &n) != 1 || n < 0 || n > MAXLEN - 1) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &x) != 1) { printf("输入有误\\n"); return 0; } L.data[L.len++] = x; }
    if (scanf("%d %d %d", &pos, &x, &dpos) != 3) { printf("输入有误\\n"); return 0; }
    show("初始表:", &L);
    r1 = seqInsert(&L, pos, x, &mvA);
    if (r1 < 0) printf("插入失败（pos=%d 越界或表已满）\\n", pos);
    else { show("插入后:", &L); printf("插入移动 %d 个元素（插入后 len-1-pos = %d）相符=%d\\n", mvA, L.len - 1 - pos, mvA == L.len - 1 - pos); }
    r2 = seqDelete(&L, dpos, &del, &mvB);
    if (r2 < 0) printf("删除失败（dpos=%d 越界）\\n", dpos);
    else { show("删除后:", &L); printf("删除下标 %d 的值 %d，移动 %d 个元素（删除后 len-dpos = %d）相符=%d\\n", dpos, del, mvB, L.len - dpos, mvB == L.len - dpos); }
    return 0;
}
`,
      stem:
        '下面这个程序在**顺序表**（`int data[32]` + `int len`）上先做一次插入、再做一次删除，' +
        '并且把两次操作各自**搬移了多少个元素**数了出来，最后用两条恒等式自检。\n\n' +
        '输入格式：第一行是 n；第二行是 n 个整数（表的初始内容）；' +
        '第三行是三个整数 `pos x dpos`（先在下标 pos 处插入 x，再删除下标 dpos 的元素）。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，包括中文括号、等号与空格）。',
      inputs: [
        {
          stdin: '5\n10 20 30 40 50\n2 99 0\n',
          note: 'n=5，中间插入 + 删表头',
          why:
            '插入在下标 2，要把原来的 data[2..4] 三个元素各往后挪一格，所以移动 3 次；' +
            '删除下标 0 时表长已经是 6，要把 data[1..5] 五个元素各往前挪一格，所以移动 5 次。' +
            '**同样长度的表，删表头是最坏的、删表尾是最好的，差 n−1 次。**',
        },
        {
          stdin: '3\n7 8 9\n3 100 3\n',
          note: 'n=3，插入位置恰好等于表长（追加到末尾）',
          why:
            'pos == len 是**合法**的插入位置（追加到末尾），此时一个元素都不用搬，移动 0 次。' +
            '这一组专门用来暴露「把 `pos > L->len` 误写成 `pos >= L->len`」那个经典错误 —— ' +
            '写错之后合法的追加会被判成越界。',
        },
        {
          stdin: '1\n42\n0 5 1\n',
          note: 'n=1（最小非空表）',
          why:
            'n=1 时插入到下标 0 要搬 1 个元素、删除下标 1（此时表长 2 的最后一个）搬 0 个元素。' +
            '这一组也是**唯一能让「循环写成 i > pos」露馅**的用例之一：写错之后 data[1] 从来没被赋过值，' +
            '打印出来就是初始化的 0（本程序把整个数组清零了，所以结果是确定的、不会读到随机内存）。',
        },
        { stdin: '4\n1 2 3 4\n9 0 0\n', note: '插入位置越界（走失败分支）' },
        { stdin: '0\n5 5 0\n', note: 'n=0（空表插入再删空）' },
      ],
      blanks: [
        {
          find: 'i >= pos',
          accepted: ['i >= pos', 'i>=pos', 'pos <= i', 'pos<=i'],
          hint: '插入时后面的元素要整体往后挪一格，挪到哪个下标为止？注意 pos 位置上原来的那个元素也必须被挪走。',
          pitfall:
            '写成 `i > pos` 就少挪一格：data[pos] 上原来的元素没有被复制到 data[pos+1]，' +
            '紧接着 `L->data[pos] = x` 又把它覆盖掉，于是**那个元素彻底丢失、而后一个元素被重复了一次**。' +
            '这个错误不会崩溃、也不会让长度算错，只会让内容悄悄少一个 —— 是顺序表插入里最难发现的一种错。',
        },
        {
          find: 'L->data[pos] = x;',
          accepted: ['L->data[pos] = x;', 'L->data[pos]=x;', 'L->data[pos] = x'],
          hint: '后面的元素都挪完以后，空出来的那个位置该放什么？',
          pitfall:
            '这一句必须写在挪动循环**之后**。写在之前就会被循环里 `L->data[i+1] = L->data[i]` 的搬运覆盖掉，' +
            '结果是新元素丢失、表里多出一个重复值。',
        },
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: 'for (i = L->len - 1; i >= pos; i--) { L->data[i + 1] = L->data[i]; (*mv)++; }',
          replace: 'for (i = L->len - 1; i > pos; i--) { L->data[i + 1] = L->data[i]; (*mv)++; }',
          why:
            '后移循环的终止条件从 `i >= pos` 改成了 `i > pos`，于是 data[pos] 这个元素没有被搬到 data[pos+1]，' +
            '而下一句 `L->data[pos] = x` 直接把它覆盖了。表长仍然正确地加 1，但内容少了一个元素、多了一个重复值。',
          pitfall:
            '这个错误在 **pos == len（追加到末尾）时完全看不出来**，因为那种情况本来就不需要搬任何元素；' +
            'n=0 的空表插入也看不出来。所以只测「往末尾追加」会误判程序正确，' +
            '必须有一组「插在中间」或「插在表头」的用例。',
        },
        {
          kind: '条件判断错误',
          find: 'if (pos < 0 || pos > L->len || L->len >= MAXLEN) return -1;',
          replace: 'if (pos < 0 || pos >= L->len || L->len >= MAXLEN) return -1;',
          why:
            '合法性检查把 `pos > L->len` 写成了 `pos >= L->len`，于是「在下标 len 处插入」（也就是追加到末尾）' +
            '这个**完全合法**的位置被判成越界，函数直接返回 −1。',
          pitfall:
            '顺序表插入的合法位置是 **0 ≤ pos ≤ len 共 len+1 个**，比删除的 0 ≤ pos ≤ len−1 多一个。' +
            '两者差一个端点，是顺序表这一章最常考、也最容易写错的地方：' +
            '插入用闭区间右端点 len，删除用开区间右端点 len。',
        },
      ],
      asks: [
        { label: '第一组输入（n=5、pos=2）插入时搬移的元素个数', answer: '3', unit: '个' },
        { label: '第一组输入插入之后表长为 6，删除下标 0 时搬移的元素个数', answer: '5', unit: '个' },
        { label: '等概率下，长度 n=5 的顺序表插入一个元素的平均搬移次数（写成小数）', answer: '2.5', tolerance: 0.001, unit: '个' },
        { label: '等概率下，长度 n=6 的顺序表删除一个元素的平均搬移次数（写成小数）', answer: '2.5', tolerance: 0.001, unit: '个' },
        { label: '长度 n=5 的顺序表，插入位置一共有多少个合法取值', answer: '6', unit: '个' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶', 'n'],
      notes: {
        idea:
          '顺序表用一段**连续**内存按下标存元素，所以「按位置访问」是 O(1)，但「按位置插入/删除」必须先把后面的元素整体挪动，' +
          '代价是 O(n)。这段程序把挪动次数显式数了出来，并用两条恒等式自检：插入时下标 pos 处插入要挪 `len − pos` 个，' +
          '删除时下标 pos 处删除要挪 `len − pos − 1` 个。',
        steps: [
          '插入：从最后一个元素开始**倒着**往后挪（`for (i = len-1; i >= pos; i--) data[i+1] = data[i]`），挪完再放下新元素、len++。倒着挪是为了不覆盖还没搬走的元素。',
          '删除：先把 data[pos] 取出来，再从 pos 开始**正着**往前挪（`for (i = pos; i < len-1; i++) data[i] = data[i+1]`），挪完 len--。正着挪同样是为了不覆盖。',
          '两个方向的循环不能弄反：插入倒着、删除正着，弄反了就会用还没搬走的值覆盖掉要搬的值。',
          '合法性：插入允许 0 ≤ pos ≤ len（共 len+1 个位置），删除只允许 0 ≤ pos ≤ len−1（共 len 个位置）。',
          '自检恒等式：插入完成后 `mv == len − 1 − pos`（这里的 len 已经加过 1），删除完成后 `mv == len − pos`（这里的 len 已经减过 1）。',
        ],
        complexity:
          '插入与删除都是 **O(n)**：最坏（插表头/删表头）挪 n 个，最好（插表尾/删表尾）挪 0 个。' +
          '等概率下插入平均挪 n/2 个、删除平均挪 (n−1)/2 个，两者都是 n/2 量级。空间是 O(1)（不算表本身）。' +
          '★ 注意「平均 n/2」是**渐近结论**，本程序数出来的是精确值，两者不要混为一谈。',
        pitfalls: [
          '插入的合法位置比删除**多一个**（0..len 对 0..len−1）。写成 `pos >= L->len` 就把「追加到末尾」这个最常用的操作判成了越界。',
          '后移循环写成 `i > pos` 会**静默丢一个元素**：表长照样加 1、程序照样不崩，只有内容错。这种错比崩溃更难查。',
          '插入必须**倒着**挪、删除必须**正着**挪。方向弄反会覆盖尚未搬走的数据。',
          '表满（len == MAXLEN）时插入必须失败而不是越界写。本程序用 `L->len >= MAXLEN` 挡住，漏掉这一条就是缓冲区溢出。',
          '★ 本题把 `SqList L = { { 0 }, 0 };` 整个清零了，所以即使错误版本读到没被赋值的单元，输出也是确定的 0。' +
            '出题时如果不做这一步，错误版本会读到栈上的随机字节，**同一份代码今天判对明天判错**，判分系统直接失效。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先读三个输入：n、n 个元素、然后 `pos x dpos`。',
            '插入：数一下 data[pos..len−1] 有几个元素，那就是搬移次数（= len − pos）。',
            '删除：此时表长已经变成 len+1，数一下 data[dpos+1..len] 有几个元素（= len − dpos）。',
            '两个失败分支要看清：插入失败打印「插入失败（pos=… 越界或表已满）」并且**不改变表**，' +
              '所以后面的删除仍然是在原表上做的。',
            '自检行里的 `相符=` 一定是 1，因为两个恒等式是从代码推出来的；如果你手算出来是 0，说明你数错了搬移个数。',
          ],
        },
        ds_debug: {
          idea:
            '这类题的突破口是**先确定「合法位置区间」**。顺序表插入允许 pos == len（追加），删除不允许；' +
            '一旦把这两个区间记混，就能立刻定位到是范围检查写错还是搬移循环写错。',
          steps: [
            '先看输出里有没有「插入失败」或「删除失败」：本该成功的操作报了失败，说明是**范围检查**写错了（`>` 与 `>=` 之差）。',
            '如果操作都成功了但表的内容少了一个元素/多了一个重复值，说明是**搬移循环**写错了（`>=` 与 `>` 之差）。',
            '定位之后代入一组小数据（比如 n=1、pos=0）手工模拟一遍，确认修改后的搬移个数与 `len − pos` 一致。',
          ],
        },
        complexity_analysis: {
          idea:
            '本题要的不是 O(n) 这个结论，而是**精确的搬移个数**与**等概率下的平均值**。' +
            '平均值要按「合法位置一共有几个」来除：插入是 len+1 个位置、删除是 len 个位置，两个分母不同，' +
            '所以 n=5 的插入平均与 n=6 的删除平均恰好都是 2.5 并不是巧合，而是 n/2 与 (n−1)/2 分别代进去的结果。',
        },
      },
    },

    // ─────────────────────────────────────────────────────────────
    // 2. 单链表就地逆置：三指针法与「先存后继」
    // ─────────────────────────────────────────────────────────────
    {
      key: 'list-reverse',
      cxaStem:
        '下面这个程序用**三指针法**把一条带头结点的单链表就地逆置，并且逆置两次以验证能否回到原表。\n\n' +
        '输入格式：第一行是 n（0 ≤ n ≤ 64），第二行是 n 个整数。\n\n' +
        '请回答后面几个问题。',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '就地逆置', '三指针', '头结点'],
      knowledgeIds: ['ds-ch02-12', 'ds-ch02-06', 'ds-ch02-07'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;   /* ★ n=0 时下面的循环一轮都不走，head->next 必须在这里就置空，否则它是未初始化的野指针 */
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static void show(const char *lb, LinkList L) { LNode *p; printf("%s", lb); for (p = L->next; p != NULL; p = p->next) printf(" %d", p->data); printf("\\n"); }
static int listLen(LinkList L) { int c = 0; LNode *p; for (p = L->next; p != NULL; p = p->next) c++; return c; }
static void freeList(LinkList L) { LNode *p = L, *q; while (p != NULL) { q = p->next; free(p); p = q; } }

static void reverse(LinkList L) {
    LNode *prev = NULL, *cur = L->next, *nxt;
    while (cur != NULL) { nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; }
    L->next = prev;
}

int main(void) {
    int n, i, v, len0, len1, len2, same, a[64];
    LinkList L;
    LNode *p;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    L = buildFrom(a, n);
    len0 = listLen(L); show("原表:", L);
    reverse(L); len1 = listLen(L); show("逆置后:", L);
    reverse(L); len2 = listLen(L); show("再逆置:", L);
    p = L->next; same = 1;
    for (i = 0; i < n; i++) { if (p == NULL || p->data != a[i]) same = 0; if (p != NULL) p = p->next; }
    if (p != NULL) same = 0;
    printf("自检：三次长度 %d/%d/%d 都等于 n=%d ? %d；两次逆置与原表逐元素相同 ? %d\\n", len0, len1, len2, n, len0 == n && len1 == n && len2 == n, same);
    freeList(L);
    return 0;
}
`,
      stem:
        '下面这个程序把一条**带头结点**的单链表就地逆置（不新建任何结点，只改指针），' +
        '然后再逆置一次，用「两次逆置应当回到原表」来自检。\n\n' +
        '输入格式：第一行是 n（0 ≤ n ≤ 64），第二行是 n 个整数（按输入顺序建表）。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，包括中文冒号与问号）。',
      inputs: [
        {
          stdin: '5\n1 2 3 4 5\n',
          note: 'n=5（常规）',
          why: '逆置后是 5 4 3 2 1，再逆置回到 1 2 3 4 5，自检两个 ? 都应该是 1。',
        },
        {
          stdin: '1\n7\n',
          note: 'n=1（单结点）',
          why:
            '只有一个结点时 while 循环只走一轮：nxt = NULL、该结点的 next 改成 NULL（本来就是）、prev 指向它。' +
            '**逆置前后表完全一样**，这一组用来验证「单结点表不该被搞坏」。',
        },
        { stdin: '0\n\n', note: 'n=0（只有头结点的空表）' },
        {
          stdin: '4\n3 3 3 3\n',
          note: 'n=4，四个相同值',
          why:
            '四个元素全相同时**逆置后的输出与逆置前一模一样**，光看打印根本看不出程序有没有真的逆置 —— ' +
            '只能靠自检行的「两次逆置与原表逐元素相同 ? 1」以及结点个数来确认链表没有被搞断。' +
            '这组数据专门提醒：输出相同不等于程序没做事。',
        },
        { stdin: '6\n10 20 30 40 50 60\n', note: 'n=6' },
      ],
      blanks: [
        {
          find: 'nxt = cur->next;',
          accepted: ['nxt = cur->next;', 'nxt=cur->next;', 'nxt = cur->next'],
          hint: '改 cur->next 之前必须先把它的后继存下来，否则这一步之后就再也找不到后面的结点了。',
          pitfall:
            '这一句是单链表逆置的**命门**。漏掉它，`cur->next = prev` 一执行，cur 后面那半条链就彻底丢了 —— ' +
            '既不能继续遍历也不能 free，既是逻辑错误又是内存泄漏。' +
            '同样的「先存后继」套路在单链表删除、约瑟夫环、快慢指针里都会再用一次。',
        },
        {
          find: 'L->next = prev;',
          accepted: ['L->next = prev;', 'L->next=prev;', 'L->next = prev'],
          hint: '循环结束时 prev 指向什么？头结点的 next 应该指向它。',
          pitfall:
            '循环退出时 cur 已经是 NULL、prev 指向**原来最后一个结点**，也就是新表的第一个数据结点。' +
            '写成 `L->next = cur` 会让整张表变成空表（数据全丢但结点还挂在内存里）；' +
            '忘了这一句则头结点仍然指向原来的第一个结点，而那个结点的 next 已经指向 NULL，表被截成只剩一个元素。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: 'while (cur != NULL) { nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; }',
          replace: 'while (cur != NULL) { nxt = cur->next; cur->next = prev; cur = nxt; }',
          why:
            '漏掉了 `prev = cur` 这一步。每轮仍然把 cur->next 改成指向 prev，但 prev 永远停在初始值 NULL，' +
            '于是**每个结点的 next 都被写成了 NULL**；循环结束后 `L->next = prev` 也还是 NULL，整张表变成空表。',
          pitfall:
            '这个错误不崩溃、不报警告、也不会死循环，只是安静地打印出三行空表和「三次长度 0/0/0」。' +
            '原来那条链和想翻出来的那条链**同时消失**：所有 next 都成了 NULL，n 个结点虽然还在堆上，' +
            '但从头结点出发一个也走不到（最后 freeList 只释放了头结点，其余全部泄漏）。' +
            '★ 这正是自检行要数三次长度的原因 —— 只看「逆置后:」那一行是空的话，你分不清是表本来就空还是被搞坏了。',
        },
        {
          kind: '链表断链',
          find: '    L->next = prev;\n}',
          replace: '    L->next = cur;\n}',
          why:
            '循环退出时 cur 是 NULL、prev 才是新表的第一个数据结点。把头结点的 next 指向 cur，' +
            '等于把整张表变成空表。',
          pitfall:
            '后果很隐蔽：结点一个都没丢（还都挂在 prev 那条链上），但**从头结点出发一个也走不到**，' +
            '于是打印出来是空行、listLen 返回 0、freeList 只释放了头结点，剩下 n 个结点全部泄漏。' +
            '自检行会把三个长度都打成 0，这正是它存在的意义。',
        },
      ],
      asks: [
        { label: 'n=5 时，reverse 里 while 循环执行的轮数', answer: '5', unit: '轮' },
        { label: 'n=5 时，逆置过程一共新建了多少个结点', answer: '0', unit: '个' },
        { label: 'n=0（只有头结点）时，while 循环执行的轮数', answer: '0', unit: '轮' },
        { label: '逆置一条长度 n 的单链表，需要几个指针变量（prev/cur/nxt）', answer: '3', unit: '个' },
        { label: '把长度为 n 的单链表逆置后再逆置一次，一共改写了多少次 next 域（不算头结点那一行）', answer: '2n', unit: '次' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶', 'n'],
      notes: {
        idea:
          '单链表逆置的标准做法是**三指针法**：prev 记录「已经翻好的那半条链的表头」，cur 是「正在翻的结点」，' +
          'nxt 提前存下 cur 的后继。每轮把 cur->next 指向 prev（翻转一条边），然后三个指针整体前移一格。' +
          'n 轮之后所有边都翻了向，最后把头结点的 next 指向 prev 即可。',
        steps: [
          '初始：prev = NULL，cur = L->next（第一个数据结点）。',
          '每轮四步：`nxt = cur->next`（存后继）→ `cur->next = prev`（翻边）→ `prev = cur` → `cur = nxt`。',
          '这四步的**顺序不能变**：存后继必须在翻边之前，翻边必须在 prev 前移之前。',
          '循环退出时 cur == NULL、prev 指向原来的最后一个结点，执行 `L->next = prev` 收尾。',
          '自检用了两条：三次 listLen 都等于 n（证明没有断链也没有丢结点）、两次逆置后与原表逐元素相同（证明翻转是可逆的）。',
        ],
        complexity:
          '时间 **O(n)**：每个结点恰好被访问一次、恰好改写一次 next。' +
          '空间 **O(1)**：只用三个指针，**不新建任何结点** —— 这正是「就地」的含义。' +
          '★ 对比「新建一条表逐个头插」的做法：时间同为 O(n) 但要 O(n) 额外空间，' +
          '而且如果新表是另外 malloc 的，还要负责释放旧表，容易漏。',
        pitfalls: [
          '**必须先存后继再翻边**。写成 `cur->next = prev; cur = cur->next;` 就是往回走，循环永不结束。' +
            '这个 bug 的表现是程序卡死，不是输出错误。',
          '收尾那一行是 `L->next = prev` 而**不是** `= cur`（cur 此时是 NULL）。写错会让整张表变成空表，' +
            '结点还在内存里但从头结点一个也走不到 —— 既丢数据又漏内存。',
          '带头结点时 reverse 的参数是头结点 L，循环从 `L->next` 开始，**头结点自己不参与翻转**、位置也不变。' +
            '不带头结点（head 直接指向第一个数据）的写法要额外处理「新的表头是谁」，代码更啰嗦 —— 这正是头结点的价值之一。',
          'n=0 时 while 一轮都不走，prev 保持 NULL，`L->next = NULL` 正好是空表，**不需要特判**。' +
            '如果代码里为 n=0 写了特判分支，反而要检查那个分支是不是多余的。',
          '四个元素全相同时逆置前后输出完全一样，**光看打印无法判断程序是否正确**，必须靠长度自检或逐元素比对。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建表是**尾插**（tail 指针跟着走），所以表内顺序与输入顺序一致。',
            '第一次 reverse 得到输入的逆序；第二次 reverse 得到原序。',
            '三次 listLen 都应该等于 n；只要有一次不等，就说明链表被搞断或被搞成环了。',
            '最后的逐元素比对是拿 `a[]`（原始输入副本）与链表内容对照，两个方向都要查：' +
              '前 n 个逐个相等，且走完 n 个之后 p 必须正好是 NULL（多出来也算不同）。',
          ],
        },
        ds_debug: {
          idea:
            '链表题的调试要点是**先判断症状属于哪一类**：卡死 = 指针改向顺序错（往回走了）；' +
            '输出变空 = 收尾指错（L->next 指向了 NULL）；长度对不上 = 中途断链。' +
            '三类症状对应三个不同的错误位置，不要一上来就逐行读代码。',
          steps: [
            '看程序有没有输出：完全没有输出且卡住，说明 while 循环退不出去，问题在 `cur = ...` 那一句。',
            '有输出但「逆置后:」是空行，说明收尾那一行指错了对象。',
            '有输出但三次长度不相等，说明翻转过程中有结点的 next 被改坏了。',
            '定位后用手画的三个方块（prev/cur/nxt）代一轮，确认每一步之后三个指针各指向谁。',
          ],
        },
      },
      trace: {
        stem:
          '下面这个程序在一条**固定的三结点链表**（head → 1 → 2 → 3 → NULL）上跑三指针逆置，' +
          '每一步之后分别打印「从 head 出发还能走到哪些结点」与「从 prev 出发能走到哪些结点」。\n\n' +
          '程序不读任何输入。请写出它运行后的**完整输出**（一个字符都不能差）。',
        code: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode { int data; struct LNode *next; } LNode;

int main(void)
{
    LNode *head = (LNode *)malloc(sizeof(LNode)), *a1 = (LNode *)malloc(sizeof(LNode));
    LNode *a2 = (LNode *)malloc(sizeof(LNode)), *a3 = (LNode *)malloc(sizeof(LNode));
    LNode *prev, *cur, *nxt, *p;
    int step = 0;
    head->data = 0; head->next = a1;
    a1->data = 1; a1->next = a2;
    a2->data = 2; a2->next = a3;
    a3->data = 3; a3->next = NULL;
    printf("初始：head 侧:");
    for (p = head->next; p != NULL; p = p->next) printf(" %d", p->data);
    printf("\\n");
    prev = NULL; cur = head->next;
    while (cur != NULL) {
        nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
        step++;
        printf("第%d步后：head 侧:", step);
        for (p = head->next; p != NULL; p = p->next) printf(" %d", p->data);
        printf(" | prev 侧:");
        for (p = prev; p != NULL; p = p->next) printf(" %d", p->data);
        printf("\\n");
    }
    head->next = prev;
    printf("收尾 head->next = prev 之后，从表头往后走:");
    for (p = head->next; p != NULL; p = p->next) printf(" %d", p->data);
    printf("\\n");
    while (head != NULL) { LNode *q = head->next; free(head); head = q; }
    return 0;
}
`,
        stdin: '',
        expect:
          '初始：head 侧: 1 2 3\n' +
          '第1步后：head 侧: 1 | prev 侧: 1\n' +
          '第2步后：head 侧: 1 | prev 侧: 2 1\n' +
          '第3步后：head 侧: 1 | prev 侧: 3 2 1\n' +
          '收尾 head->next = prev 之后，从表头往后走: 3 2 1',
        notes: {
          idea:
            '这段程序把三指针逆置的**中间状态**全部打印出来，重点是观察「head 侧」与「prev 侧」两条链此消彼长：' +
            'head->next 一直指向 a1，而 a1 的 next 在第 1 步就被改成了 NULL，所以 head 侧永远只剩一个 1；' +
            '真正在变长的是 prev 侧。这也解释了为什么收尾必须写 `head->next = prev` —— ' +
            '翻好的那半条链挂在 prev 上，不挂在 head 上。',
          steps: [
            '初始：head → 1 → 2 → 3 → NULL，所以 head 侧是 1 2 3。',
            '第 1 步：nxt = a2；a1->next = NULL；prev = a1；cur = a2。head 侧从 a1 出发只有 1；prev 侧从 a1 出发也只有 1。',
            '第 2 步：nxt = a3；a2->next = a1；prev = a2；cur = a3。head 侧仍是 1（a1->next 已是 NULL）；prev 侧是 2 1。',
            '第 3 步：nxt = NULL；a3->next = a2；prev = a3；cur = NULL 退出循环。head 侧仍是 1；prev 侧是 3 2 1。',
            '收尾：head->next = prev = a3，于是从表头往后走是 3 2 1。',
            '最后的 while 从 head 开始逐个 free（head 本身也要释放，它是 malloc 出来的头结点）。',
          ],
          pitfalls: [
            '★ 观察「head 侧一直是 1」这一点很关键：它说明**翻转过过程中头结点已经够不到大部分结点了**，' +
              '如果这时程序出错退出，那些结点就再也释放不掉。所以链表算法必须一次跑完，不能中途 return。',
            '第 3 步之后 cur 是 NULL，所以循环里不能再解引用 cur（比如打印 cur->data 就会段错误）。',
            '释放链表也要「先存后继」：`q = head->next; free(head); head = q;`，顺序写反就是 use-after-free。',
          ],
        },
      },
    },

    // ─────────────────────────────────────────────────────────────
    // 3. 两个递增有序链表的双指针归并（含 algorithm_impl 编程题）
    // ─────────────────────────────────────────────────────────────
    {
      key: 'merge-sorted-lists',
      cxaStem:
        '下面这个程序用**双指针归并**把两条递增有序的单链表合成一条递增有序表，' +
        '并且**不新建任何数据结点**（只把 B 的头结点释放掉，数据结点全部接到 A 的头结点后面），' +
        '同时数出关键字比较的次数。\n\n' +
        '输入格式：第一行是 m，第二行是 m 个递增整数；第三行是 n，第四行是 n 个递增整数。\n\n' +
        '请回答后面几个问题。',
      section: '2.3 线性表的链式表示（单链表）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['单链表', '有序表合并', '双指针', '归并'],
      knowledgeIds: ['ds-ch02-11', 'ds-ch02-06', 'ds-ch02-03'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct LNode { int data; struct LNode *next; } LNode, *LinkList;
static LinkList buildFrom(const int *a, int n) {
    LinkList head = (LinkList)malloc(sizeof(LNode)); LNode *tail = head; int i;
    head->data = 0; head->next = NULL;   /* ★ n=0 时下面的循环一轮都不走，head->next 必须在这里就置空，否则它是未初始化的野指针 */
    for (i = 0; i < n; i++) { LNode *s = (LNode *)malloc(sizeof(LNode)); s->data = a[i]; s->next = NULL; tail->next = s; tail = s; }
    return head;
}
static void show(const char *lb, LinkList L) { LNode *p; printf("%s", lb); for (p = L->next; p != NULL; p = p->next) printf(" %d", p->data); printf("\\n"); }
static void freeList(LinkList L) { LNode *p = L, *q; while (p != NULL) { q = p->next; free(p); p = q; } }
static LinkList mergeSorted(LinkList A, LinkList B, int *cmp) {
    LNode *pa = A->next, *pb = B->next, *tail = A; *cmp = 0;
    A->next = NULL;
    while (pa != NULL && pb != NULL) {
        (*cmp)++;
        if (pa->data <= pb->data) { tail->next = pa; tail = pa; pa = pa->next; }
        else { tail->next = pb; tail = pb; pb = pb->next; }
    }
    tail->next = (pa != NULL) ? pa : pb;
    free(B);
    return A;
}
int main(void) {
    int m, n, i, v, cmp = 0, resLen = 0, a[64], b[64];
    LinkList A, B, C; LNode *p;
    if (scanf("%d", &m) != 1 || m < 0 || m > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < m; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } a[i] = v; }
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } b[i] = v; }
    A = buildFrom(a, m); B = buildFrom(b, n);
    show("A:", A); show("B:", B);
    C = mergeSorted(A, B, &cmp);
    show("合并后:", C);
    for (p = C->next; p != NULL; p = p->next) resLen++;
    printf("自检：关键字比较 %d 次；结果长度 %d == m+n = %d ? %d\\n", cmp, resLen, m + n, resLen == m + n);
    freeList(C);
    return 0;
}
`,
      stem:
        '下面这个程序用**双指针归并**把两条递增有序的单链表合成一条递增有序表。' +
        '它**不新建任何数据结点**：A 的头结点被复用为结果表的头结点，B 的数据结点逐个接过来，' +
        '最后只 `free(B)` 释放 B 的头结点。程序还会数出关键字比较的次数并自检结果长度。\n\n' +
        '输入格式：第一行是 m，第二行是 m 个递增整数；第三行是 n，第四行是 n 个递增整数。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差）。',
      inputs: [
        {
          stdin: '3\n1 3 5\n3\n2 4 6\n',
          note: 'm=3 n=3 完全交错',
          why:
            '完全交错时每一次比较都只消耗一个结点，比较次数达到上界 **m+n−1 = 5**：' +
            '1<2 取 1、3>2 取 2、3<4 取 3、5>4 取 4、5<6 取 5，此时 A 空了，B 剩下的 6 直接接上不再比较。',
        },
        {
          stdin: '3\n1 2 3\n3\n10 20 30\n',
          note: 'm=3 n=3，A 整体小于 B',
          why:
            '这是**比较次数最少**的情形之一：1<10 取 1、2<10 取 2、3<10 取 3，A 一空循环就退出，' +
            '一共只比较 **min(m,n) = 3** 次，B 的三个结点整段接上去。' +
            '与上一组对照可以看出：比较次数在 min(m,n) 到 m+n−1 之间，取决于两条链的交错程度。',
        },
        {
          stdin: '0\n\n4\n7 8 9 10\n',
          note: 'm=0（A 是空表）',
          why:
            'A 为空时 while 一轮都不走，`tail->next = (pa != NULL) ? pa : pb` 直接把 B 的四个结点整段接上，' +
            '**比较 0 次**。这一组专门验证「空表不能被漏掉」。',
        },
        {
          stdin: '4\n5 5 5 5\n4\n5 5 5 5\n',
          note: 'm=4 n=4，全部相等',
          why:
            '八个元素全是 5。因为比较用的是 `<=`，相等时**总是先取 A 的结点**，' +
            '所以结果里 A 的四个 5 全在 B 的四个 5 前面 —— 这正是「归并排序稳定」的微观机制。' +
            '本程序没有标记，所以输出看不出区别，但比较次数是 7（= m+n−1）。',
        },
        { stdin: '1\n-5\n2\n-10 0\n', note: '含负数、长度不等' },
      ],
      blanks: [
        {
          find: 'if (pa->data <= pb->data) { tail->next = pa; tail = pa; pa = pa->next; }',
          accepted: [
            'if (pa->data <= pb->data) { tail->next = pa; tail = pa; pa = pa->next; }',
            'if (pa->data <= pb->data) {tail->next = pa; tail = pa; pa = pa->next;}',
          ],
          hint: '取较小的那个结点接到 tail 后面，然后 tail 和那个指针都要往前走一格。相等时取哪一边？',
          pitfall:
            '两处要命：① 条件必须用 `<=` 而不是 `<`，相等时先取 A 的结点才能保证**稳定性**' +
            '（写成 `<` 结果仍然有序，但 A、B 中相等的元素会互换先后，归并排序就不稳定了）；' +
            '② 接上之后 **tail 必须跟着前移**，漏掉 `tail = pa` 会让下一次接入覆盖掉刚接上的那个结点，' +
            '结果表里只剩最后一个元素。',
        },
        {
          find: 'tail->next = (pa != NULL) ? pa : pb;',
          accepted: [
            'tail->next = (pa != NULL) ? pa : pb;',
            'tail->next = pa != NULL ? pa : pb;',
            'tail->next = (pa != NULL) ? pa : pb',
          ],
          hint: '循环退出时至少有一条链已经走完，另一条可能还剩一截。剩下那一截要怎么办？',
          pitfall:
            '这一句是链表归并与数组归并最大的区别：**剩下的那一截可以整段接上，不需要再逐个搬**。' +
            '因为 pa/pb 本身就是指针，剩下的部分已经是一条有序的链，`tail->next` 指过去就完事了。' +
            '写成 `while (pa != NULL) { tail->next = pa; ... }` 也不算错但白费劲；' +
            '完全漏掉这一句则会丢掉剩余的所有元素（结果长度对不上，自检立刻打出 0）。',
        },
      ],
      defects: [
        {
          kind: '链表断链',
          find: 'tail->next = (pa != NULL) ? pa : pb;',
          replace: 'tail->next = pa;',
          why:
            '「把没走完的那半条链整段接上」被写成了只接 A 的剩余部分。归并循环是因为**某一条链先走完**才退出的，' +
            '如果先走完的是 A（pa == NULL），那么 B 剩下的那一截就被整段丢弃了。',
          pitfall:
            '★ 这个错误在**五条测试数据上全都暴露**（结果长度都不等于 m+n），但它有一个更隐蔽的变体值得警惕：' +
            '如果两条链**恰好同时走完**（例如 m=n=3 且完全交错，第 5 次比较后 pa 与 pb 同时为 NULL），' +
            '写 `tail->next = pa` 与写正确的三目**输出完全一样** —— 所以只测「等长完全交错」这一组是发现不了它的。' +
            '必须有一组「一条链明显比另一条长」或「一条链为空」的用例。',
        },
        {
          kind: '条件判断错误',
          find: 'if (pa->data <= pb->data) { tail->next = pa; tail = pa; pa = pa->next; }',
          replace: 'if (pa->data <= pb->data) { tail->next = pa; pa = pa->next; }',
          why: '接上一个结点之后忘了让 tail 跟着前移，于是 tail 永远停在头结点上。',
          pitfall:
            '每次循环都执行 `tail->next = ...`，而 tail 始终是头结点，所以**后接的结点会覆盖先接的**，' +
            '最终结果表只剩「最后接上的那一段」。长度自检会打出 0（因为 resLen 远小于 m+n），' +
            '但程序不会崩溃 —— 这是典型的「静默错误」。',
        },
      ],
      asks: [
        { label: 'm=3、n=3 且完全交错（1 3 5 与 2 4 6）时的关键字比较次数', answer: '5', unit: '次' },
        { label: 'm=3、n=3 且 A 整体小于 B（1 2 3 与 10 20 30）时的比较次数', answer: '3', unit: '次' },
        { label: '一般地，合并长度 m 与 n 的两条递增链表，比较次数的上界（用 m、n 表示，写成 m+n-1 的形式）', answer: 'm+n-1', accepted: ['m+n−1', 'm + n - 1', 'm+n−1'] },
        { label: '一般地，比较次数的下界（用 m、n 表示，写成 min(m,n) 的形式）', answer: 'min(m,n)', accepted: ['min(m, n)', 'min(m,n)'] },
        { label: '本程序在归并过程中新建的数据结点个数', answer: '0', unit: '个' },
      ],
      complexity: 'O(m+n)',
      complexityAccepted: ['O(m+n)', 'O(m + n)', 'O(n)', '线性阶'],
      notes: {
        idea:
          '两条链各自有序，所以每次只需要比较**两个当前队头**，把小的那个摘下来接到结果表尾部。' +
          '这就是双指针归并。链表版本比数组版本更省：数组要把元素逐个搬到第三个数组里（O(m+n) 次赋值），' +
          '链表只需要改指针，剩下的那一段还能整段接上。',
        steps: [
          'pa、pb 分别指向 A、B 的第一个数据结点，tail 指向结果表的最后一个结点（初始是 A 的头结点）。',
          '`A->next = NULL` 把头结点摘干净，否则第一次接入会形成自环。',
          '循环条件 `pa != NULL && pb != NULL`：只要有一条走完就退出。每轮比较一次、接入一个结点、tail 与该指针各前移一格。',
          '退出后 `tail->next = (pa != NULL) ? pa : pb;` 把剩下的那半条链**整段**接上。',
          '`free(B)` 只释放 B 的头结点（数据结点已经归 A 的头结点管了），返回 A 作为结果表。',
        ],
        complexity:
          '时间 **O(m+n)**：每个结点恰好被接入一次。比较次数在 **min(m,n) 到 m+n−1** 之间，' +
          '取决于两条链的交错程度（完全交错取上界、一条整体小于另一条取下界）。' +
          '空间 **O(1)**：不新建任何数据结点，只用三个指针 —— 这是链表归并相对数组归并的核心优势。',
        pitfalls: [
          '`A->next = NULL` 不能省。少了它，tail（就是 A）的 next 还指向 A 的第一个数据结点，' +
            '第一次 `tail->next = pa` 会让那个结点的 next 指向自己，形成自环 → 遍历死循环。',
          '接入之后 **tail 必须前移**。漏掉 `tail = pa` 会让每次接入都覆盖上一次的结果，最终只剩最后一段。',
          '比较用 `<=` 而不是 `<`：相等时先取 A 的结点，这是归并排序**稳定性**的来源。' +
            '写成 `<` 结果仍然有序，但相等元素的相对次序会反过来。',
          '`free(B)` 只能释放 B 的**头结点**。写成 `freeList(B)` 会把已经接到结果表里的数据结点全部释放掉，' +
            '之后 show(C) 就是 use-after-free。',
          'm=0 或 n=0 时 while 一轮都不走，全靠最后那句「整段接上」兜底。**不要为「某条链为空」写特判**，' +
            '通用写法已经覆盖了。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先把两条链画出来，标出 pa、pb 的起点。',
            '每轮比较 pa->data 与 pb->data，把小的接到 tail 后面，然后 tail 和那个指针各前移一格。',
            '数比较次数：每轮恰好一次，循环在「某一条链走完」时退出。',
            '退出后剩下的那半条链整段接上，不再比较。',
            '自检行的 `结果长度 == m+n` 一定是 1；如果不是 1，说明有结点被覆盖或被丢掉了。',
          ],
        },
        ds_debug: {
          idea:
            '链表归并的两个致命错误都会**改变结果长度**，所以先看自检行：' +
            '`结果长度 == m+n ? 0` 就说明有结点被丢掉或被覆盖了。' +
            '两种丢法要分清：剩下的半条链没接上（丢一段）与 tail 没有前移（互相覆盖，只剩最后一段）。',
          steps: [
            '如果程序没有任何输出就卡住，先怀疑结果表里出现了环（例如把 `tail = pa` 写成了 `tail = tail->next`）。',
            '如果「合并后:」打印出来的元素个数少于 m+n，先查最后那句「整段接上」有没有漏、再查 `tail` 有没有跟着前移。',
            '如果结果不是递增的，检查比较的方向与 `<=` 的位置有没有写反。',
            '最后确认释放的是 B 的头结点而不是整条 B —— 后者会在 show 之后才崩，症状是「输出对了但程序异常退出」。',
          ],
        },
        complexity_analysis: {
          idea:
            '本题的重点是**比较次数的上下界都要求出来**，而不是只给一个 O(m+n)。' +
            '上界 m+n−1 出现在两条链完全交错时（每比较一次只消耗一个结点，直到某一条只剩最后一个）；' +
            '下界 min(m,n) 出现在一条链整体小于另一条时（短的那条一走完循环立刻退出）。' +
            '空间是 O(1) 因为不新建数据结点，这一点与数组版归并（需要 O(m+n) 辅助数组）形成对照。',
        },
      },
      task: {
        stem:
          '读入两个**递增有序**的整数序列，把它们合并成一个递增有序序列输出。\n\n' +
          '要求：\n' +
          '- 只能用**一次遍历**（双指针归并），不允许先拼在一起再调用排序函数；\n' +
          '- 时间复杂度 O(m+n)，比较次数的上界是 m+n−1；\n' +
          '- 相等时**先取第一个序列的元素**（保持稳定性）；\n' +
          '- 必须正确处理 m=0、n=0、两者都为 0 的情形；\n' +
          '- 输出格式必须与下面给出的模板完全一致。',
        input_format:
          '第一行一个整数 m（0 ≤ m ≤ 128）；第二行 m 个递增整数。' +
          '第三行一个整数 n（0 ≤ n ≤ 128）；第四行 n 个递增整数。' +
          'm 或 n 为 0 时对应那一行是空行（也可以没有那一行）。',
        output_format:
          '一行：`合并结果:` 后面依次是合并后的每个整数，每个前面一个空格，' +
          '最后紧跟 `（共 k 个）` 与换行，其中 k = m + n。k 为 0 时输出 `合并结果:（共 0 个）`。' +
          '输入不合法时输出 `输入有误`。',
        code_starter: `#include <stdio.h>

/* 两个递增有序序列合并成一个递增有序序列（双指针归并，一次遍历） */
int main(void)
{
    int a[128], b[128], c[256];
    int m, n, i, j, k;
    if (scanf("%d", &m) != 1 || m < 0 || m > 128) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < m; i++) { if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; } }
    if (scanf("%d", &n) != 1 || n < 0 || n > 128) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &b[i]) != 1) { printf("输入有误\\n"); return 0; } }

    /* TODO: 用双指针把 a[0..m-1] 与 b[0..n-1] 归并进 c[]，k 记录结果长度。
             相等时先取 a 的元素。两个 while 之后还要把没走完的那条整段搬过去。 */
    i = 0; j = 0; k = 0;

    printf("合并结果:");
    for (i = 0; i < k; i++) printf(" %d", c[i]);
    printf("（共 %d 个）\\n", k);
    return 0;
}
`,
        reference: `#include <stdio.h>

int main(void)
{
    int a[128], b[128], c[256];
    int m, n, i, j, k;
    if (scanf("%d", &m) != 1 || m < 0 || m > 128) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < m; i++) { if (scanf("%d", &a[i]) != 1) { printf("输入有误\\n"); return 0; } }
    if (scanf("%d", &n) != 1 || n < 0 || n > 128) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &b[i]) != 1) { printf("输入有误\\n"); return 0; } }
    i = 0; j = 0; k = 0;
    while (i < m && j < n) {
        if (a[i] <= b[j]) { c[k] = a[i]; i++; }
        else { c[k] = b[j]; j++; }
        k++;
    }
    while (i < m) { c[k] = a[i]; i++; k++; }
    while (j < n) { c[k] = b[j]; j++; k++; }
    printf("合并结果:");
    for (i = 0; i < k; i++) printf(" %d", c[i]);
    printf("（共 %d 个）\\n", k);
    return 0;
}
`,
        constraints: '数据规模：0 ≤ m, n ≤ 128，元素为 int 范围内的整数（可以是负数）；时间复杂度：O(m+n)；空间复杂度：O(m+n)',
        inputs: [
          { stdin: '3\n1 3 5\n3\n2 4 6\n', note: '完全交错' },
          { stdin: '0\n4\n7 8 9 10\n', note: 'm=0（第一个序列为空）' },
          { stdin: '1\n5\n0\n', note: 'n=0（第二个序列为空）' },
          { stdin: '5\n1 1 1 1 1\n5\n1 1 1 1 1\n', note: '全部相等（测 <= 的稳定性）' },
          { stdin: '3\n10 20 30\n3\n1 2 3\n', note: '第二个整体在前' },
          { stdin: '2\n8 9\n4\n1 3 5 7\n', note: '长度不等、交错' },
          { stdin: '1\n-5\n3\n-10 0 10\n', note: '含负数' },
          { stdin: '6\n2 4 6 8 10 12\n6\n1 3 5 7 9 11\n', note: '完美交错，结果 1..12' },
          { stdin: '0\n0\n', note: '两个都为空' },
          { stdin: '8\n1 2 3 4 5 6 7 8\n1\n9\n', note: '第二个只有最大值' },
        ],
        notes: {
          idea:
            '双指针归并是「利用输入已经有序」这个前提的典型例子：因为两段各自有序，' +
            '所以每次只需要比较两个队头就能确定全局最小的那个元素，不必看其余的。' +
            '这也正是归并排序 O(n log n) 的基础操作。',
          steps: [
            'i、j 分别指向 a、b 的当前队头，k 指向结果 c 的写入位置。',
            '主循环条件 `i < m && j < n`：只要有一段走完就退出。每轮比较一次、写一个元素、对应的指针与 k 各加 1。',
            '相等时取 a[i]（`<=`），这样相同值的元素保持原来的先后次序 —— 稳定性就来自这一个字符。',
            '退出后还有两个收尾循环，把没走完的那一段整段搬过去。**这两个循环不能省**，' +
              '也不能只写一个（到底哪一段没走完取决于数据）。',
            '输出时 k 就是 m+n，可以直接用来打印「共 k 个」。',
          ],
          complexity:
            '时间 **O(m+n)**：每个元素恰好被写入一次，比较次数最多 m+n−1。' +
            '空间 **O(m+n)**（数组版必须开辅助数组 c）。' +
            '★ 对比链表版：链表版空间是 O(1)，因为可以直接改指针、剩下的整段接上；' +
            '数组版做不到这一点，元素必须逐个搬。这是「存储结构决定算法空间代价」最直接的例子。',
          pitfalls: [
            '收尾的两个 while 必须都写。只写 `while (i < m)` 会在 b 更长时丢掉 b 的尾部。',
            '`if (a[i] <= b[j])` 里的 `<=` 决定稳定性。写成 `<` 结果仍然有序，但相等元素会反过来。',
            '不要在主循环里写 `c[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];` —— ' +
              '虽然 C99 里三目的条件之后有一个顺序点、这个写法其实是合法的，' +
              '但它把三处副作用挤在一行，读者很难确认求值顺序，**判题时也不容易定位错误**。分开写更安全。',
            'm 或 n 为 0 时对应那一行可能是空行，`scanf("%d", …)` 会自动跳过空白，所以不需要特判；' +
              '但**必须检查 scanf 的返回值**，否则输入不足时会用未初始化的值继续算。',
          ],
        },
      },
    },
  ],
}
