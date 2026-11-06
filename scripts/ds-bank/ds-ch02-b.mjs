/* ds-ch02 线性表 · 程序库（第 2 批：顺序表就地去重 / 循环链表约瑟夫环）
   规则同 ds-ch02.mjs 头部注释。★ 本批两段程序都刻意把「自检」写成真的算出来的 %d，
   而不是把答案写进格式串 —— 自检的价值在于它可能失败。 */
export default {
  shard: 'ds-ch02',
  chapter: '第2章 线性表',
  category: 'ds',
  entries: [
    {
      key: 'dedup-sorted-seq',
      section: '2.2 线性表的顺序表示（顺序表）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['顺序表', '就地去重', '双下标', '有序表'],
      knowledgeIds: ['ds-ch02-11', 'ds-ch02-05', 'ds-ch02-02'],
      code: `#include <stdio.h>
#define MAXLEN 32
typedef struct { int data[MAXLEN]; int len; } SqList;
static void show(const char *lb, const SqList *L) { int i; printf("%s", lb); for (i = 0; i < L->len; i++) printf(" %d", L->data[i]); printf("（len=%d）\\n", L->len); }
/* 有序顺序表就地去重：i 停在「已去重段」的最后一个元素上，j 逐个扫描后面的元素。
   因为表本身有序，重复元素一定相邻，所以只需和 data[i] 比一次就能判断。 */
static int dedup(SqList *L, int *cmp) {
    int i = 0, j, removed; *cmp = 0;
    if (L->len <= 1) return 0;
    for (j = 1; j < L->len; j++) {
        (*cmp)++;
        if (L->data[j] != L->data[i]) { i++; L->data[i] = L->data[j]; }
    }
    removed = L->len - (i + 1);
    L->len = i + 1;
    return removed;
}
/* 自检用：去重后必须严格递增，且原表里每个不同的值都还在 */
static int strictlyUp(const SqList *L) { int i; for (i = 1; i < L->len; i++) if (L->data[i - 1] >= L->data[i]) return 0; return 1; }
static int contains(const SqList *L, int x) { int i; for (i = 0; i < L->len; i++) if (L->data[i] == x) return 1; return 0; }
int main(void) {
    SqList L = { { 0 }, 0 };
    int n, i, v, cmp = 0, removed, allKept = 1, backup[MAXLEN];
    if (scanf("%d", &n) != 1 || n < 0 || n > MAXLEN) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) { if (scanf("%d", &v) != 1) { printf("输入有误\\n"); return 0; } L.data[i] = v; }
    L.len = n;
    show("原表：", &L);
    for (i = 0; i < n; i++) backup[i] = L.data[i];
    removed = dedup(&L, &cmp);
    show("去重后：", &L);
    for (i = 1; i < n; i++) if (backup[i] != backup[i - 1] && !contains(&L, backup[i])) allKept = 0;
    if (n > 0 && !contains(&L, backup[0])) allKept = 0;
    printf("删掉了 %d 个元素，做了 %d 次关键字比较（表长 %d，扫描了 %d 个）\\n", removed, cmp, n, n > 1 ? n - 1 : 0);
    printf("自检：去重后严格递增 ? %d；原表的每个不同值都还在 ? %d；len + removed == n ? %d\\n",
           strictlyUp(&L), allKept, L.len + removed == n);
    return 0;
}`,
      inputs: [
        { stdin: '8\n1 2 2 3 3 3 4 5\n', note: '常规：3 个值有重复', why: '删掉 3 个、比较 7 次（= n−1），能看出「比较次数只与 n 有关、与重复多少无关」' },
        { stdin: '6\n7 7 7 7 7 7\n', note: '全部相同', why: '去重后只剩 1 个元素，i 全程停在 0，是最极端的情形' },
        { stdin: '5\n1 2 3 4 5\n', note: '没有重复', why: '每个元素都要往前搬一格（i 与 j 始终差 1），removed = 0 但赋值做了 n−1 次' },
        { stdin: '1\n9\n', note: '只有一个元素', why: 'dedup 在 len <= 1 时直接返回 0，一次比较都不做' },
        { stdin: '0\n', note: '空表', why: 'len = 0，strictlyUp 与 contains 的循环一轮都不走，三条自检都必须仍然成立' },
      ],
      blanks: [
        { find: 'if (L->data[j] != L->data[i]) { i++; L->data[i] = L->data[j]; }', accepted: ['if (L->data[j] != L->data[i]) { i++; L->data[i] = L->data[j]; }', 'if (L->data[j] != L->data[i]) { ++i; L->data[i] = L->data[j]; }'], hint: '发现一个新值时要做两件事：先把已去重段的尾部往后挪一格，再把新值写到那一格', pitfall: '顺序不能反 —— 先写 L->data[i] = L->data[j] 再 i++ 会把新值写到「上一个已保留元素」的位置上，把它覆盖掉' },
        { find: '    L->len = i + 1;', accepted: ['    L->len = i + 1;', '    L->len = i+1;'], hint: 'i 是已去重段最后一个元素的下标，所以元素个数是 i + 1', pitfall: '写成 L->len = i 会少一个元素（i 是下标不是个数），空表时还会把 len 变成 −1' },
      ],
      defects: [
        { kind: '循环边界错误', find: 'for (j = 1; j < L->len; j++) {', replace: 'for (j = 1; j < L->len - 1; j++) {', why: 'j 只扫到 len−2，最后一个元素从来没被检查过：它既不会被保留也不会被跳过，最后被 L->len = i + 1 直接截掉了', pitfall: '★ 这个错误的后果不是「少去一个重复」而是「丢一个数据」—— 表 {1,2,2,3} 会被去成 {1,2}，值 3 整个消失。写去重/删除类循环时，上界到底是 len 还是 len−1，取决于「这一轮要不要处理最后一个元素」，去重要处理（它可能是新值），而「相邻比较」类算法才用 len−1' },
        { kind: '赋值顺序错误', find: 'if (L->data[j] != L->data[i]) { i++; L->data[i] = L->data[j]; }', replace: 'if (L->data[j] != L->data[i]) { L->data[i] = L->data[j]; i++; }', why: '先写后挪，新值被写到了上一个已保留元素的位置上，把它覆盖掉；随后 i++ 又让「已去重段的尾部」指向一个还没写入的格子', pitfall: '覆盖之后原值就找不回来了，而且表看起来仍然「像」是对的（长度正确、也大致递增），只有逐元素比对才能发现。双下标就地算法的口诀是「先挪指针，再写数据」，与链表插入的「先接后面，再接前面」是同一类顺序依赖' },
      ],
      cxas: [
        {
          stem: '下面这段程序对**有序**顺序表做就地去重（表本身升序，重复元素一定相邻）。请回答后面几个问题，答案都要求精确整数。\n\n约定：n 是原表长度；「关键字比较」指 `L->data[j] != L->data[i]` 这一次比较；「赋值」指 `L->data[i] = L->data[j]` 这一次写入。',
          code: `/* 有序顺序表就地去重（与上面完全相同的算法，只保留核心循环） */
static int dedup(SqList *L, int *cmp) {
    int i = 0, j, removed;
    *cmp = 0;
    if (L->len <= 1) return 0;
    for (j = 1; j < L->len; j++) {
        (*cmp)++;
        if (L->data[j] != L->data[i]) { i++; L->data[i] = L->data[j]; }
    }
    removed = L->len - (i + 1);
    L->len = i + 1;
    return removed;
}`,
          asks: [
            { label: '原表 {1,2,2,3,3,3,4,5}（n=8）去重后删掉了几个元素', answer: '3', unit: '个' },
            { label: '同一组输入做了多少次关键字比较', answer: '7', unit: '次' },
            { label: '同一组输入做了多少次赋值 L->data[i] = L->data[j]', answer: '4', hint: 'i 一共往前挪了几次，赋值就做了几次（含 j=1 那一次）', unit: '次' },
            { label: '原表 {7,7,7,7,7,7}（n=6，全部相同）去重后的表长', answer: '1' },
            { label: '原表 {1,2,3,4,5}（n=5，没有重复）做了多少次赋值', answer: '4', hint: '没有重复时 i 与 j 始终差 1，每个 j 都会触发一次赋值（其中一次是自我赋值）', unit: '次' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶', '线性'],
          askSpace: true,
          notes: {
            idea: '有序表里重复元素一定相邻，所以只需把每个元素与「已去重段的最后一个元素」比一次；不需要两两比较，也不需要额外数组。',
            steps: ['i = 0：已去重段暂时只有 data[0]', 'j 从 1 扫到 n−1，每个元素比一次', 'data[j] 与 data[i] 不同 ⇒ 它是一个新值：i++ 后写入 data[i]', 'data[j] 与 data[i] 相同 ⇒ 它是重复值，什么也不做（i 不动，下一个新值仍与它比）', '循环结束后已去重段是 data[0..i]，所以 len = i + 1，删掉 n − (i+1) 个'],
            complexity: '比较次数恰好 n−1（n ≥ 2 时），与重复多少完全无关；赋值次数 = 不同值的个数 − 1，在 0 到 n−1 之间。时间 O(n)，空间 O(1)（就地）。',
            pitfalls: ['★ 比较次数恒为 n−1，但赋值次数取决于数据：全相同时 0 次，全不同时 n−1 次。「就地去重是 O(n)」这句话里，n 指的是比较，赋值的常数因子会随数据变化', '没有重复时算法仍然做 n−1 次赋值（其中大部分是 data[i]=data[i] 的自我赋值），所以「输入本来就没有重复」并不能让它变快', '★ 这个算法的前提是**表有序**。无序表就地去重要么先排序（O(n log n)），要么用双重循环两两比较（O(n²)），要么用散列表记已见过的值（O(n) 但要 O(n) 额外空间）—— 三种代价完全不同，不能混为一谈', '删掉的元素只是「不再属于表」，data[i+1..n−1] 里的旧值还留在数组里。如果这个数组之后要被别的代码整体读取（而不是按 len 读），就会读到脏数据'],
          },
        },
        {
          stem: '同一个就地去重算法，这次问的是它与「另开一个新表、把不重复的值复制过去」这种做法的差别，以及它在**无序表**上还能不能用。',
          code: `/* 做法 A：就地双下标（本题程序用的做法） */
static int dedup(SqList *L, int *cmp);        /* 空间 O(1)，要求表有序 */

/* 做法 B：另开一个新表复制过去 */
static void dedupCopy(const SqList *src, SqList *dst, int *cmp) {
    int i, j, found;
    dst->len = 0;
    *cmp = 0;
    for (i = 0; i < src->len; i++) {
        found = 0;
        for (j = 0; j < dst->len; j++) { (*cmp)++; if (dst->data[j] == src->data[i]) { found = 1; break; } }
        if (!found) { dst->data[dst->len++] = src->data[i]; }
    }
}`,
          asks: [
            { label: '做法 A 在 n=8 的有序表上做了多少次关键字比较', answer: '7', unit: '次' },
            { label: '做法 B 在同样这 8 个元素（1 2 2 3 3 3 4 5）上做了多少次关键字比较', answer: '18', hint: '每个元素都要与「新表里已有的元素」逐个比，比到相同就 break；新表长度依次是 0,1,2,2,3,3,3,4，比较次数依次是 0,1,2,2,3,3,3,4', unit: '次' },
            { label: '做法 B 需要多少额外空间（以元素个数计，n=8）', answer: '8', unit: '个' },
            { label: '做法 A 需要多少额外空间（以元素个数计）', answer: '0', unit: '个' },
            { label: '把做法 A 直接用在无序表 {3,1,1,2,1} 上，去重后表里有几个元素', answer: '4', hint: '它只会消掉**相邻**的重复；这个表里只有一对相邻的 1，另两个 1 隔着别的元素' },
          ],
          complexity: 'O(n)',
          accepted: ['O(n)', 'O（n）', '线性阶'],
          askSpace: false,
          notes: {
            idea: '同一件事有三种做法，代价差一个数量级：有序表就地双下标 O(n) 且空间 O(1)；无序表用「新表 + 逐个查重」是 O(n²)；无序表先排序再做法 A 是 O(n log n)。选哪个取决于表是否已经有序、能不能改动原表、有没有额外空间。',
            steps: ['做法 A：比较 n−1 次，与数据无关', '做法 B：第 i 个元素要与新表里已有的元素比，新表长度是「前 i−1 个元素里不同值的个数」，比到相同就停', '对 1 2 2 3 3 3 4 5 逐个算：新表长度依次 0,1,2,2,3,3,3,4，比较次数依次 0,1,2,2,3,3,3,4，合计 18', '做法 B 的额外空间是整个新表，最多 n 个元素'],
            complexity: '做法 A 是 O(n)；做法 B 最坏 O(n²)（全部不同时每个元素都要扫完新表），最好 O(n)（全部相同时每个元素只比 1 次就 break）。',
            pitfalls: ['★ 做法 A **只对有序表正确**。用在无序表 {3,1,3,2,1} 上，它只消掉相邻的重复，结果仍有 4 个元素（两个 1 与两个 3 都不相邻），看起来「跑通了」但答案是错的 —— 这类「不崩溃但结果错」的缺陷最难发现', '做法 B 的比较次数与「重复元素出现的位置」有关：重复元素越靠前，break 得越早，比较越少。所以它的最坏情况恰恰是**没有重复**的时候', '题目问「额外空间」时要说清单位：做法 A 是 O(1)（只有 i、j 两个下标），做法 B 是 O(n)（整个新表）。答「做法 B 空间更大」不给量级，等于没答'],
          },
        },
      ],
      notes: {
        idea: '有序顺序表的就地去重是「双下标」套路的第一个例子：i 维护已处理段的边界，j 负责扫描。理解它的关键是明白 i 与 j 之间的差值恰好等于「已经删掉的元素个数」。',
        steps: ['读入 n 与 n 个升序整数，先原样打印', '备份一份原表用于自检', 'dedup 用 i/j 双下标就地压缩，返回删掉的个数并统计比较次数', '自检三件事：去重后严格递增、原表每个不同值都还在、len + removed == n'],
        complexity: '时间 O(n)（比较恰好 n−1 次），空间 O(1)。',
        pitfalls: ['★ i 与 j 的差值恒等于「已删掉的元素个数」，这是双下标就地算法的通用不变量，用它可以在跑之前就预测最终表长', 'n ≤ 1 时必须提前返回，否则 j 从 1 开始而 len 是 0，循环一轮都不走虽然不会崩，但 removed = len − (i+1) = 0 − 1 = −1 会算出负数', '空表时 strictlyUp 与 contains 的循环都不执行，函数返回 1 与 0，自检表达式必须在这种退化情况下仍然成立'],
      },
      explain: {
        code_reading: { steps: ['先数出原表里有几个不同的值 —— 那就是去重后的表长', '比较次数不用数，它恒等于 n−1（n ≥ 2）', '删掉的个数 = n − 不同值个数', '赋值次数 = 不同值个数 − 1', '自检三行在正常输入下都是 1；空表那一组要单独确认 strictlyUp 返回 1、allKept 返回 1'] },
        ds_debug: { steps: ['先确认表是有序的（题目保证），所以重复元素一定相邻', '手动跑 {1,2,2,3}：j=1 时 2 != 1，i 变 1 并写入；j=2 时 2 == data[1]，跳过；j=3 时 3 != 2，i 变 2 并写入 ⇒ len=3', '再跑错误版本，看它是「少去一个重复」还是「丢一个数据」—— 这两种后果的严重性完全不同', '第二处错误要看清 i++ 与赋值的先后：先写后挪会覆盖掉上一个已保留的值'] },
      },
    },

    {
      key: 'josephus-circle',
      section: '2.4 循环链表与双向链表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['循环链表', '约瑟夫环', '结点删除', '报数'],
      knowledgeIds: ['ds-ch02-08', 'ds-ch02-12', 'ds-ch02-06'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct CNode { int no; struct CNode *next; } CNode;
/* 建 n 个人的循环链表（无头结点，编号 1..n）；n=0 返回 NULL */
static CNode *buildCircle(int n) {
    CNode *head = NULL, *tail = NULL, *p; int i;
    for (i = 1; i <= n; i++) {
        p = (CNode *)malloc(sizeof(CNode)); p->no = i;
        if (head == NULL) head = p; else tail->next = p; tail = p;
    }
    if (head != NULL) tail->next = head;
    return head;
}
/* 约瑟夫环：从 1 号开始报数，数到 m 的人出列，再从他的下一个人重新从 1 报数；出列编号依次写进 out，改写 next 指针的次数写进 unlink。 */
static void josephus(int n, int m, int *out, int *olen, int *unlink) {
    CNode *head = buildCircle(n), *prev, *cur, *t; int k = 0, cnt = 0;
    *olen = 0; *unlink = 0; if (head == NULL || m < 1) { free(head); return; }
    prev = head; while (prev->next != head) prev = prev->next;   /* prev 先停在尾结点上 */
    cur = head; while (cnt < n) {
        k++;
        if (k < m) { prev = cur; cur = cur->next; continue; }
        out[(*olen)++] = cur->no; cnt++;
        k = 0;
        if (cur->next == cur) { free(cur); break; }              /* 只剩最后一个人 */
        prev->next = cur->next;
        (*unlink)++; t = cur; cur = cur->next; free(t);
    }
}
int main(void) {
    int n, m, out[128], olen = 0, unlink = 0, i, perm = 1, seen[129] = { 0 };
    if (scanf("%d %d", &n, &m) != 2 || n < 0 || n > 128 || m < 0) { printf("输入有误\\n"); return 0; }
    josephus(n, m, out, &olen, &unlink);
    printf("n=%d m=%d 的出列次序：", n, m); for (i = 0; i < olen; i++) printf(" %d", out[i]);
    printf("%s\\n", olen == 0 ? "（没有人出列）" : "");
    for (i = 0; i < olen; i++) { if (out[i] < 1 || out[i] > n || seen[out[i]]) perm = 0; else seen[out[i]] = 1; }
    if (olen != n) perm = 0;
    printf("出列 %d 人（应等于 n=%d）；改写了 %d 次 next 指针；自检：出列次序是 1..%d 的一个排列 ? %d\\n", olen, n, unlink, n, perm);
    return 0;
}`,
      inputs: [
        { stdin: '5 3\n', note: '教材经典例 n=5 m=3', why: '出列次序 3 1 5 2 4，是约瑟夫环最常被拿来考的一组' },
        { stdin: '10 1\n', note: 'm=1：每报一个就出列', why: '退化成「按编号顺序出列」，改写 next 指针 n−1 次，是检查 k 重置逻辑的最简单情形' },
        { stdin: '6 2\n', note: 'n=6 m=2', why: '出列次序 2 4 6 3 1 5；m=2 时第一轮把所有偶数号一次扫完，最能看出「环」的作用' },
        { stdin: '7 7\n', note: 'm 恰好等于 n', why: '第一次报数就绕回起点，出列的第一个是 7 号' },
        { stdin: '1 1\n', note: '只有一个人', why: 'cur->next == cur 成立，走的是「只剩最后一个人」那个分支，不做 next 改写' },
        { stdin: '0 3\n', note: 'n=0：空环', why: 'buildCircle 返回 NULL，josephus 直接 return，出列 0 人；自检里 olen != n 是 0 != 0 为假，所以 perm 仍应是 1' },
      ],
      blanks: [
        { find: '        prev->next = cur->next;', accepted: ['prev->next = cur->next;', 'prev->next=cur->next;'], hint: '摘掉一个结点，就是让它的前驱越过它直接连到它的后继', pitfall: '写成 cur->next = prev->next 是把方向弄反了，会让 cur 指向自己形成自环，随后的报数永远出不去（死循环）' },
        { find: '        k = 0;', accepted: ['k = 0;', 'k = 0 ;'], hint: '一个人出列之后，报数要从下一个人重新从 1 开始', pitfall: '写成 k = 1 等于「下一个人已经报过 1 了」，整圈的报数会错一位；这个错误不会崩溃，只会让出列次序整体偏移，很难靠肉眼发现' },
      ],
      defects: [
        { kind: '赋值顺序错误', find: '        k = 0;', replace: '        k = 1;', why: '出列之后没有把报数计数器清零，而是置成 1，等于替下一个人先报了一次数', pitfall: '★ 这类「差一位」的错误不会让程序崩溃，也不会让长度对不上（仍然出列 n 人、仍然是 1..n 的一个排列），所以「自检通过」根本发现不了它 —— 只有把出列次序与手算结果逐个比对才能发现。这也是为什么约瑟夫环这类题必须给出完整的出列序列作为期望输出，而不能只判「出列人数」' },
        { kind: '循环边界错误', find: 'while (cnt < n) {', replace: 'while (cnt < n - 1) {', why: '最后一个人不出列：循环在还剩一个人时就退出了', pitfall: '后果有两层 —— 输出少一个人，而且那个结点从来没被 free（内存泄漏）。★ 判题只看 stdout 的话第二层是看不见的，但它正是「循环边界写错」在链表题里最典型的连带后果：漏掉的不只是逻辑，还有资源回收' },
      ],
      cxas: [
        {
          stem: '下面这段程序用**循环链表**解约瑟夫环：n 个人围成一圈，从 1 号开始报数，数到 m 的人出列，然后从他的下一个人重新从 1 报数，直到全部出列。请回答后面几个问题，答案都要求精确整数。\n\n约定：「报数」指 `k++` 执行的次数；「改写 next 指针」指 `prev->next = cur->next;` 执行的次数。',
          code: `static void josephus(int n, int m, int *out, int *olen, int *unlink) {
    CNode *head = buildCircle(n), *prev, *cur;
    int k = 0, cnt = 0;
    *olen = 0;
    *unlink = 0;
    if (head == NULL || m < 1) { free(head); return; }
    prev = head;
    while (prev->next != head) prev = prev->next;
    cur = head;
    while (cnt < n) {
        k++;
        if (k < m) { prev = cur; cur = cur->next; continue; }
        out[(*olen)++] = cur->no;
        cnt++;
        k = 0;
        if (cur->next == cur) { free(cur); break; }
        prev->next = cur->next;
        (*unlink)++;
        { CNode *t = cur; cur = cur->next; free(t); }
    }
}`,
          asks: [
            { label: 'n=5 m=3 时的出列人数', answer: '5', unit: '人' },
            { label: 'n=5 m=3 时改写了多少次 next 指针', answer: '4', hint: '只剩最后一个人时走的是 break 那个分支，不做改写', unit: '次' },
            { label: 'n=5 m=3 时 buildCircle 一共 malloc 了几个结点', answer: '5', unit: '个' },
            { label: 'n=10 m=1 时改写了多少次 next 指针', answer: '9', unit: '次' },
            { label: 'n=1 m=1 时改写了多少次 next 指针', answer: '0', unit: '次' },
            { label: 'n=0 m=3 时 buildCircle 返回什么（填 NULL 或 结点地址）', answer: 'NULL', accepted: ['NULL', '空指针', '0'] },
          ],
          complexity: 'O(n*m)',
          accepted: ['O(n*m)', 'O(n·m)', 'O(nm)', 'O(m*n)', 'O(n×m)'],
          askSpace: false,
          notes: {
            idea: '每出列一个人要报 m 次数，一共出列 n 个人，所以报数总次数是 n·m 量级；用循环链表实现时「找前驱」是 O(1)（prev 一直跟着走），这是它比顺序表做法省事的地方。',
            steps: ['报数总次数 ≈ n·m（m 远小于 n 时是主导项）', '改写 next 指针恰好 n−1 次（最后一个人走 break 分支）', 'malloc 与 free 各 n 次', 'm=1 是退化情形：每次 k++ 之后立刻满足 k == m，报数总次数恰好 n'],
            complexity: '时间 O(n·m)；空间 O(n)（n 个结点）。若用数学递推式 `f(n,m) = (f(n−1,m) + m) mod n` 可以做到 O(n) 时间 O(1) 空间，但那就求不出「中间过程」，只能得到最后一个幸存者。',
            pitfalls: ['★ 改写 next 指针是 n−1 次而不是 n 次：只剩一个人时 `cur->next == cur`，走 break 分支直接 free，不需要摘除', '用数组模拟（每次真的删掉一个元素）也是 O(n·m)，但删除要把后面的元素整体前移，常数因子比链表大得多；链表的代价全在 malloc/free 上', '如果题目只要「最后一个幸存者的编号」，用递推式是 O(n)，比模拟快 m 倍 —— 先看清题目要的是过程还是结果', '循环链表判空是 `head == NULL`，判「只剩一个结点」是 `p->next == p`；带头结点的循环链表判空则是 `head->next == head`。三套条件不能混用'],
          },
        },
        {
          stem: '同一个约瑟夫环问题，这次比较三种实现方式的代价：循环链表模拟、顺序表模拟（每次真的删除元素）、以及数学递推式。',
          asks: [
            { label: '循环链表模拟解 n=100 m=3 的报数总次数（每人报 m 次，共 n 人出列）', answer: '300', unit: '次' },
            { label: '数学递推式解 n=100 m=3 需要循环多少轮（i 从 2 到 n）', answer: '99', hint: 'f(i,m) = (f(i−1,m) + m) mod i，边界是 f(1,m) = 0', unit: '轮' },
            { label: '顺序表模拟解 n=100 m=3，一共执行多少次「删除元素」操作', answer: '100', unit: '次' },
            { label: '循环链表模拟解 n=100 m=3 改写了多少次 next 指针', answer: '99', hint: '只剩最后一个人时不需要摘除', unit: '次' },
            { label: '顺序表模拟解 n=100 m=3 的报数总次数（与链表做法相比）', answer: '300', hint: '报数次数只取决于 n 与 m，与用什么存储结构无关', unit: '次' },
          ],
          complexity: 'O(n*m)',
          accepted: ['O(n*m)', 'O(n·m)', 'O(nm)'],
          askSpace: false,
          notes: {
            idea: '三种实现的复杂度分别是 O(n·m)、O(n²·?)、O(n)。差别不在「能不能做」，而在 n 与 m 都很大时差出几个数量级。',
            steps: ['循环链表：报数 n·m 次 + 摘除 n−1 次，摘除是 O(1) 因为 prev 一直跟着', '顺序表：报数 n·m 次 + 每次删除搬移约「当前表长的一半」，合计约 n²/4 到 n²/2', '递推式：只有 n−1 轮，每轮 O(1)，但只能得到最后一个幸存者'],
            complexity: '循环链表 O(n·m)；顺序表 O(n·m + n²)；递推式 O(n)。',
            pitfalls: ['★ 顺序表模拟的致命伤是「删除要搬移」，而约瑟夫环恰好要删 n 次，所以搬移总数是 n² 量级 —— 即使 m 很小也躲不掉', '递推式 `f(n,m) = (f(n−1,m) + m) mod n` 的边界是 f(1,m) = 0（编号从 0 开始时），若题目编号从 1 开始，最后结果要 +1；这个 ±1 是约瑟夫环最常见的错处', 'm 很大时（比如 m > n）循环链表的报数会绕圈很多轮，可以先取 `m % 当前人数` 优化；但「当前人数」在变，取模要每轮重算，实现起来容易错'],
          },
        },
      ],
      notes: {
        idea: '约瑟夫环是循环链表最经典的应用：它同时考「建环」「找前驱」「摘结点」「判只剩一个」四件事，而且出列次序是唯一确定的，非常适合做逐字符比对的判分题。',
        steps: ['buildCircle 建 n 个结点的环，尾结点的 next 指回头', 'josephus 先把 prev 走到尾结点（这样第一次报数时 prev 正好在 head 前面）', '报数：k 从 0 开始，每走一步 k++；k 达到 m 就让 cur 出列', '出列后 k 清 0、cnt++，从 cur 的后继重新报数', '只剩一个结点时（cur->next == cur）直接 free 并 break，不需要摘除'],
        complexity: '时间 O(n·m)，空间 O(n)。',
        pitfalls: ['★ prev 的初值必须是**尾结点**而不是 head。若写成 prev = head、cur = head，则第一个人出列时 prev 与 cur 是同一个结点，`prev->next = cur->next` 会变成 `head->next = head->next`（什么也没摘掉），随后 free 掉 head 再往下走就是 use-after-free', '「只剩一个人」的分支不能省：省了之后 prev 与 cur 是同一个结点，`prev->next = cur->next` 让它指向自己，循环永远退不出去', 'free 之后必须马上把 cur 移到后继（这里用一个块级临时变量 t 完成「先存后继再 free」），顺序写反就是 use-after-free'],
      },
      explain: {
        code_reading: { steps: ['先手算前两个出列的人：从 1 号开始报 1、2、3，第三个出列', '出列之后从他的下一个人重新报 1，继续数 m 个', '环里人数在减少，但报数永远是 1..m', '最后一个人走 break 分支，所以改写 next 指针的次数是 n−1 而不是 n'] },
        ds_debug: { steps: ['先确认出列人数是否仍等于 n —— 两处错误里只有一处会影响人数', '再逐个比对出列次序：k = 1 那处错误人数与排列自检都会通过，只有次序不同', '★ 这说明「自检通过」不等于「程序正确」：自检只能验证结构性不变量（人数、是否为排列），验证不了具体次序'] },
        complexity_analysis: { idea: '报数总次数是 n·m 量级，摘除结点是 O(1)（prev 一直跟着 cur 走），所以总时间 O(n·m)；空间是 n 个结点。' },
      },
      trace: {
        stem: '下面这段程序把 n=4、m=2 的约瑟夫环**每一步的环状态**都打印出来：先打印当前环里还有哪些编号（从 cur 开始沿 next 走一圈），再打印谁出列。请写出它的完整输出。\n\n★ 提示：程序里 `ringOf` 会从 cur 出发走一圈，遇到回到 cur 就停，所以打印出来的第一个编号永远是 cur 本人。',
        stdin: '',
        code: `#include <stdio.h>
#include <stdlib.h>
typedef struct CNode { int no; struct CNode *next; } CNode;
static CNode *buildCircle(int n) {
    CNode *head = NULL, *tail = NULL;
    int i;
    for (i = 1; i <= n; i++) {
        CNode *p = (CNode *)malloc(sizeof(CNode));
        p->no = i;
        if (head == NULL) head = p; else tail->next = p;
        tail = p;
    }
    if (head != NULL) tail->next = head;
    return head;
}
/* 从 cur 出发打印一圈（不含已出列的人），用来观察环的状态变化 */
static void ringOf(CNode *cur, int left) {
    CNode *p = cur;
    int i;
    printf("  环（共 %d 人，从报数起点开始）：", left);
    for (i = 0; i < left; i++) { printf(" %d", p->no); p = p->next; }
    printf("\\n");
}
int main(void) {
    int n = 4, m = 2, left, k = 0, step = 0;
    CNode *head = buildCircle(n), *prev, *cur;
    prev = head;
    while (prev->next != head) prev = prev->next;
    cur = head;
    for (left = n; left >= 1; left--) {
        printf("第%d轮开始：\\n", step + 1);
        ringOf(cur, left);
        for (k = 1; k < m; k++) { prev = cur; cur = cur->next; }
        printf("  报数到 %d，出列的是 %d 号\\n", m, cur->no);
        step++;
        if (cur->next == cur) { free(cur); break; }
        prev->next = cur->next;
        { CNode *t = cur; cur = cur->next; free(t); }
    }
    printf("全部出列完毕\\n");
    return 0;
}`,
        expect: `第1轮开始：
  环（共 4 人，从报数起点开始）： 1 2 3 4
  报数到 2，出列的是 2 号
第2轮开始：
  环（共 3 人，从报数起点开始）： 3 4 1
  报数到 2，出列的是 4 号
第3轮开始：
  环（共 2 人，从报数起点开始）： 1 3
  报数到 2，出列的是 3 号
第4轮开始：
  环（共 1 人，从报数起点开始）： 1
  报数到 2，出列的是 1 号
全部出列完毕`,
        notes: {
          idea: '把「环里还剩谁、从谁开始报数」逐步打出来，就能看清循环链表删除结点的实质：每次只是改一个 next 指针，环的形状随之缩短，但「从 cur 出发走一圈」这个遍历方式始终不变。',
          steps: ['初始环 1→2→3→4→1，prev 先被走到尾结点 4，cur = 1', '第1轮：k 从 1 数到 m−1=1，走一步 ⇒ prev=1、cur=2，出列 2；改 1->next = 3，环变成 1→3→4→1，cur=3', '第2轮：从 3 开始走一圈打印 3 4 1；数到 2 ⇒ cur=4，出列 4；改 3->next = 1，环变成 3→1→3，cur=1', '第3轮：从 1 开始打印 1 3；数到 2 ⇒ cur=3，出列 3；改 1->next = 1，环只剩 1，cur=1', '第4轮：cur->next == cur 成立，出列 1 并 break'],
          complexity: '每轮打印与报数都是 O(left)，总时间 O(n²)（因为要打印）；纯求解是 O(n·m)。',
          pitfalls: ['★ 每轮打印的第一个编号永远是 cur 本人，不是 1 号 —— 因为出列之后 cur 已经移到了后继。看输出时若以为「环总是从 1 号开始打印」，第 2 轮就会抄错', '第 4 轮走的是 break 分支，没有改写 next 指针；所以 4 个人一共只改了 3 次 next', '「环（共 X 人）」里的 X 是用外层循环变量 left 传进去的，不是数出来的；如果 left 的初值或递减写错，打印的人数会与实际环长不符 —— 这也是一个可以用来出题的错误点'],
        },
      },
    },
  ],
};
