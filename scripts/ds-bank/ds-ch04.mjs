/**
 * ds-ch04「第4章 串」程序库 —— 由 scripts/gen-ds-problems.mjs 批量派生题目。
 *
 * 写库规则（生成器会强制检查，不满足直接 exit 1 且不写任何文件）：
 *   1. code 必须是完整可编译的 C 程序，`gcc -std=c99 -Wall -Wextra` **零警告**。
 *   2. 所有 testCases 的 expected 由生成器**实跑得到**，库文件里不要手写 expected。
 *   3. code 去掉空行后 ≤ 40 行（红线⑥）。
 *   4. inputs 至少 2 组，且各组输出必须互不相同。
 *   5. defects[i].find / blanks[i].find 必须在 code 中**恰好出现一次**。
 *   6. 派生出的错误版本必须在**至少一组**输入上与正确版本输出不同。
 *   7. 概念题（term）详解素材一律写在 entry 级 notes；term 子对象内别再放 notes，
 *      否则 buildExplain 的 subNotes 会把 entry 级 base 整个盖掉。
 *   8. 本批程序的 main 都带「真的算出来的自检」（相符=%d），defect 一旦改动计数，
 *      expected 里就会出现 0，不需要靠人比对序列。
 *
 * section 只能取本分片既有的六个值之一（同章内必须一致）：
 *   '4.1 串的定义与存储结构' / '4.2 串的模式匹配（BF 与 KMP）'
 *   / '4.3 数组的顺序存储与地址计算' / '4.4 特殊矩阵的压缩存储'
 *   / '4.5 稀疏矩阵的三元组与十字链表' / '4.6 广义表'
 */
export default {
  shard: 'ds-ch04',
  chapter: '第4章 串、数组和广义表',
  category: 'ds',
  source: '自撰（依据《数据结构》第4章 串 知识点体系）',
  entries: [
    // ─────────────────────────────────────────────────────────────
    // 1. BF 模式匹配：主串指针回溯的代价
    // ─────────────────────────────────────────────────────────────
    {
      key: 'bf-match',
      cxaStem:
        '下面这段程序实现 BF（暴力）模式匹配：返回子串 t 在主串 s 中第一次出现的起始下标（0 起），' +
        '找不到返回 -1，并统计一共做了多少次字符比较。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['模式匹配', 'BF算法', '字符串', '指针回溯'],
      knowledgeIds: ['ds-ch04-07', 'ds-ch04-04', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100

/* BF 匹配：返回 t 在 s 中首次出现的起始下标（0 起），找不到返回 -1 */
static int bf(const char *s, const char *t, int *cmp)
{
    int i = 0, j = 0, n = (int)strlen(s), m = (int)strlen(t);
    *cmp = 0;
    if (m == 0) return 0;
    while (i < n && j < m) {
        (*cmp)++;
        if (s[i] == t[j]) { i++; j++; }
        else { i = i - j + 1; j = 0; }
    }
    return (j == m) ? i - m : -1;
}

int main(void)
{
    char s[MAXS], t[MAXS];
    int p, cmp;
    if (scanf("%s %s", s, t) != 2) { printf("输入有误\\n"); return 0; }
    p = bf(s, t, &cmp);
    printf("匹配位置=%d 比较次数=%d\\n", p, cmp);
    return 0;
}
`,
      stem:
        '下面的程序实现 **BF（暴力）模式匹配**：`bf(s, t, &cmp)` 返回子串 t 在主串 s 中' +
        '第一次出现的起始下标（从 0 起），找不到返回 -1，同时用 `cmp` 统计一共做了多少次字符比较。\n\n' +
        '程序读入两个字符串 s 与 t，调用 bf 并输出**匹配位置**与**比较次数**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意逗号与等号）。',
      inputs: [
        {
          stdin: 'ababc abc\n',
          note: 't 在 s 中间匹配成功（位置 2）',
          why: 's=ababc, t=abc。BF 从起点 0 比到 s[2] 失配、回退到起点 1 又失配、再从起点 2 成功，匹配位置 2（0 起）。比较次数 7：起点0 比 3 次、起点1 比 1 次、起点2 比 3 次。',
        },
        {
          stdin: 'aaaaab aab\n',
          note: '最坏情形：每个起点都比到 t 末尾附近才失配',
          why: 's=aaaaab, t=aab。位置 3 匹配成功。每个起点都要比到 t[2]=b 才失配，共 12 次比较，展示 BF 回溯代价比朴素直觉大得多。',
        },
        {
          stdin: 'abc def\n',
          note: 't 不在 s 中（未匹配）',
          why: 's=abc, t=def。每个起点第一个字符就失配，返回 -1，比较次数 3（等于主串长度 n）。',
        },
        {
          stdin: 'hello lo\n',
          note: '普通成功',
          why: 's=hello, t=lo。匹配位置 3，比较次数 6：起点0、1 各失配 1 次，起点2 比到 s[3] 失配（2 次），起点3 连续成功 2 次。',
        },
      ],
      blanks: [
        {
          find: '        (*cmp)++;',
          accepted: ['        (*cmp)++;', '        (*cmp) = *cmp + 1;'],
          hint: '每次「拿主串一个字符和模式串一个字符比」都是一次比较，必须计数。',
          pitfall:
            '这一行必须放在 `if (s[i] == t[j])` 的**外面**（每次比较都计数），而不是只在失配分支里。' +
            '如果把 `(*cmp)++` 写进 if 里面，就只统计了「相等」的次数，失配那一次没算，`cmp` 会少计。',
        },
        {
          find: '        else { i = i - j + 1; j = 0; }',
          accepted: [
            '        else { i = i - j + 1; j = 0; }',
            '        else { i = i - j + 1; j = 0; }',
            '        else { i = i - j + 1; j = 0; }',
          ],
          hint: '失配时主串指针要回溯到「本次起点」的下一位，模式串指针归零重新开始。',
          pitfall:
            '`i = i - j + 1` 是 BF 的核心：`i - j` 是本次匹配的起点，加 1 就是下一个待试起点。' +
            '常见错误是写成 `i = i + 1`（j 没有归零前，i 只回退一格）或 `i = i - j`（回到本次起点重新比，死循环）。',
        },
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: '        else { i = i - j + 1; j = 0; }',
          replace: '        else { i = i + 1; j = 0; }',
          why:
            '失配后主串指针只前进一格，而不是回退到「本次起点+1」。' +
            '假设 s=ababc, t=abc：起点 0 比到 s[2]=a vs t[2]=c 失配，i 应回退到 1。' +
            '写成 i=i+1 后 i 停在 2，漏掉了从位置 1 开始的匹配。',
          pitfall:
            'BF 的回溯量是「本次起点 + 1」，不是「当前 i + 1」。`i = i - j + 1` 中的 `- j` 才是把 i 拉回本次起点的关键。' +
            '漏掉 `- j` 会 **miss 掉从中间某个位置开始的匹配**，而且程序不报错、结果看起来「只是个没匹配到的位置」，很难查。',
        },
        {
          kind: '条件判断错误',
          find: '    return (j == m) ? i - m : -1;',
          replace: '    return (j == m) ? i - m + 1 : -1;',
          why:
            '匹配成功后返回的是「起始下标 + 1」（1 起），而不是 0 起的下标。' +
            'BF 标准返回 0 起下标，改成 +1 会让所有成功用例的结果都偏大 1。',
          pitfall:
            '下标口径（0 起还是 1 起）是字符串题最经典的混淆点。本题返回**0 起下标**（与数组下标一致），' +
            '所以找到匹配后返回 `i - m`。写成 `i - m + 1` 就是 1 起口径，全部结果偏移 1。',
        },
      ],
      asks: [
        { label: 's=ababc, t=abc 的匹配位置（0 起）', answer: '2', unit: '位置' },
        { label: 's=ababc, t=abc 的比较次数', answer: '7', unit: '次' },
        { label: 's=aaaaab, t=aab 的比较次数', answer: '12', unit: '次' },
        { label: 's=hello, t=lo 的比较次数', answer: '6', unit: '次' },
        { label: 'BF 算法最坏时间复杂度（用 n,m 表示）', answer: 'O(n*m)' },
      ],
      complexity: 'O(n*m)',
      complexityAccepted: ['O(n×m)', 'O(nm)', 'O(n*m)', 'O(n²)'],
      notes: {
        idea:
          'BF 的原理是「一个起点一个起点地试」。每个起点从模式串第 0 个字符开始逐字符比对，' +
          '一旦失配就把主串指针回退到本次起点的下一位、模式串归零。这个「回溯」就是它慢的根源：' +
          '已比较过的字符被重复比较，最坏 O(n×m)。',
        steps: [
          'i 指向主串当前位置，j 指向模式串当前位置，初值都是 0。',
          '每次循环先 `cmp++` 记录一次比较，再比较 s[i] 与 t[j]。',
          '相等则 i、j 同步前进；不等则 i 回退到本次起点+1（`i = i - j + 1`）、j 归零。',
          '循环结束有两种可能：j == m（匹配成功，返回 i - m 即起点下标）或 i == n（主串走完没匹配，返回 -1）。',
          '★ 最坏情形是主串里每个起点都比到模式串最后一个字符才失配，比如 s=aaaa…ab、t=aa…ab，' +
            '此时比较次数接近 n×m。',
        ],
        complexity:
          '时间最坏 O(n×m)（主串每个起点都比到模式串末尾才失配），平均约 O(n+m)，最好 O(m)（第一次就匹配上）。' +
          '空间 O(1)。KMP 正是靠让主串指针**永不回溯**把最坏降到 O(n+m)。',
        pitfalls: [
          '失配时 `i = i - j + 1` 的 `- j` 是关键，漏写成 `i = i + 1` 会漏掉中间起点的匹配且不报错。',
          '比较次数的计数口径：是「任意一次字符比较」都算，不是只算相等那次。',
          '返回值口径 0 起下标；若题目要求 1 起，答案需要 +1。',
          'BF 的 O(n×m) 是**最坏**情况；模式串很短或者只匹配一次时，BF 的常数比 KMP 更小，反而更快。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先固定 s 与 t，从起点 0 开始逐字符逐行手工跑一遍。',
            '每轮先记 cmp 加 1，再比较。失配时把 i 回退到本次起点+1、j 归零。',
            '特别注意「起点 0 比到哪失配」以及「失配后 i 回到哪个位置再试」。',
            '对数比较次数：把每一次字符比较都数上，包括失配的那一次。',
          ],
        },
        ds_debug: {
          steps: [
            '明确正确的 BF 行为：失配时 i 回退到「本次起点+1」，j 归零。',
            '用 s=ababc、t=abc 手工运行，看两个分支各自的 i、j 变化。',
            '对比错误版：`i = i + 1` 会跳过起点 1，导致本该在位置 1 的匹配找不到。',
          ],
        },
        complexity_analysis: {
          idea:
            '本题要给的是**精确比较次数**，不是渐进记号。关键是逐起点模拟 BF 流程，' +
            '数清「每个起点各比了多少次」再求和。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 2. KMP next 数组求解：递推过程与代码实现
    // ─────────────────────────────────────────────────────────────
    {
      key: 'kmp-next',
      cxaStem:
        '下面这段程序实现 KMP 算法中 next 数组的求解：`getNext(t, next)` 求出模式串 t 的 next 数组并打印。' +
        'next[j] 的约定是：next[0]=-1，其余 next[j] 为「t[0..j-1] 这段前缀的最长相等真前后缀长度」。' +
        '请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['KMP', 'next数组', '模式匹配', '字符串'],
      knowledgeIds: ['ds-ch04-09', 'ds-ch04-08', 'ds-ch04-10'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100

/* KMP 求 next 数组：next[0]=-1，next[j] 为 t[0..j-1] 最长相等真前后缀长度 */
static void getNext(const char *t, int next[])
{
    int i = 0, j = -1, m = (int)strlen(t);
    next[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }
        else j = next[j];
    }
}

int main(void)
{
    char t[MAXS];
    int next[MAXS], m, i;
    if (scanf("%s", t) != 1) { printf("输入有误\\n"); return 0; }
    getNext(t, next);
    m = (int)strlen(t);
    printf("%s\\n", t);
    for (i = 0; i < m; i++) printf("%d ", next[i]);
    printf("\\n");
    return 0;
}
`,
      stem:
        '下面的程序实现 **KMP 的 next 数组求解**。`getNext(t, next)` 用递推法求出模式串 t 的 next 数组：' +
        '约定 `next[0] = -1`，其余 `next[j]` 为「t[0..j-1] 这段前缀的最长相等真前后缀长度」。\n\n' +
        '程序读入一个模式串 t，调用 getNext 并**输出两行**：第一行是 t 本身，第二行是 next 数组（用空格分隔）。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差）。',
      inputs: [
        {
          stdin: 'abcabx\n',
          note: '教科书经典模式串',
          why: 't=abcabx。逐 j 推 next：next[0]=-1；t[0]a vs j=-1 → next[1]=0；t[1]b vs t[0]a 不等 → j=next[0]=-1 → next[2]=0；t[2]c vs t[0]a 不等 → j=-1 → next[3]=0；t[3]a vs t[0]a 等 → next[4]=1；t[4]b vs t[1]b 等 → next[5]=2。',
        },
        {
          stdin: 'aaaab\n',
          note: '前缀高度重复，展示 next 的递进',
          why: 't=aaaab。next 依次为 -1,0,1,2,3：next[1]=0（t[0]a vs j=-1）；next[2]=1（t[1]a==t[0]a）；next[3]=2；next[4]=3。这类「全相同前缀」是 next 数组最容易看出递进规律的模式串。',
        },
        {
          stdin: 'ababaca\n',
          note: 'KMP 教材 3.22 例题模式串',
          why: 't=ababaca。next 依次为 -1,0,0,1,2,3,0（可自行用递推验证）。模式串前后缀交替，next 值呈波浪形。',
        },
        {
          stdin: 'a\n',
          note: '单字符边界',
          why: 't=a。m=1，循环条件 while(i < m-1) 即 i<0 不进循环，next[0]=-1。输出只有 -1。',
        },
      ],
      blanks: [
        {
          find: '        else j = next[j];',
          accepted: ['        else j = next[j];', '        else j = next[j];'],
          hint: '失配时 j 要「回退到次长相等前后缀」，也就是 next[j]，继续尝试。',
          pitfall:
            '`j = next[j]` 是 KMP 求 next 的灵魂：当前前缀不匹配时，不是回到 0，而是回到「当前已匹配段的最长真前后缀」再试。' +
            '写成 `j = 0` 会退化成 BF 的粗暴回溯，求出的 next 全错。',
        },
        {
          find: '        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }',
          accepted: [
            '        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }',
            '        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }',
          ],
          hint: '匹配成功（或 j 已退到 -1）时，i、j 同步前进，并把 j 赋给 next[i]。',
          pitfall:
            '`j == -1` 分支必须 **先于** `t[i] == t[j]` 判断 —— 当 j = -1 时 `t[j]` 是 `t[-1]` 越界读。' +
            '写成 `if (t[i] == t[j] || j == -1)` 会在 j=-1 时先读 `t[-1]` 造成越界。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }',
          replace: '        if (j == -1 || t[i] != t[j]) { i++; j++; next[i] = j; }',
          why:
            '匹配条件从 `t[i] == t[j]` 改成了 `t[i] != t[j]`。于是「相等才前进」变成「不相等才前进」，' +
            'next 数组的值全部算错：本应因为前后缀相等才 +1 的位置现在反了过来。',
          pitfall:
            '求 next 的核心是「模式串与自己匹配」，所以**相等才 i++、j++**。写成 `!=` 就把整个递推关系颠倒。' +
            '这个 bug 不会崩、也不会死循环，程序正常跑完、输出格式也对，但 next 数组的每个值都和正确值不同，' +
            '必须逐个代回「最长相等真前后缀」的定义核对才能发现。',
        },
        {
          kind: '赋值顺序错误',
          find: '        if (j == -1 || t[i] != t[j]) { i++; j++; next[i] = j; }',
          replace: '        if (j == -1 || t[i] != t[j]) { i++; j++; next[i] = j - 1; }',
          why:
            '赋给 next 的值从 j 改成 j-1，于是每个 next[i] 都比正确值小 1。' +
            'j=0 时 next[i] 变成 -1，与「空前后缀」的 -1 混淆，后续递推全部错位。',
          pitfall:
            '匹配成功后 `next[i] = j` 表示「t[0..i-1] 的最长相等真前后缀长度」。写成 j-1 是经典的 off-by-one。' +
            '★ 注意：因为 next[i] 变小了，后续 `j = next[j]` 回退得更早，程序仍能终止、不会死循环，' +
            '但整个 next 数组都系统性偏小 1。',
        },
      ],
      asks: [
        { label: 't=abcabx 的 next[4] 值', answer: '1' },
        { label: 't=abcabx 的 next[5] 值', answer: '2' },
        { label: 't=aaaab 的所有 next 值（用逗号分隔）', answer: '-1,0,1,2,3' },
        { label: 't=ababaca 的 next[3] 值', answer: '1' },
        { label: '求 next 数组的时间复杂度（用 m 表示）', answer: 'O(m)' },
      ],
      complexity: 'O(m)',
      complexityAccepted: ['O(m)', 'O(m)线性', 'O(n+m)'],
      notes: {
        idea:
          '求 next 数组本质是「模式串与自己匹配」。变量 k（这里用 j）记录当前最长相等真前后缀的长度，' +
          'next[0] 约定为 -1。递推关系是：`t[i]==t[j]` 时 `next[i+1] = j+1`；不等时 `j = next[j]` 回退到次长，' +
          'j 退到 -1 则 `next[i+1] = 0`。',
        steps: [
          'j 初始为 -1（代表「空前后缀」），next[0] = -1，i 从 0 开始。',
          '循环条件 i < m-1：next[i+1] 依赖 t[i]，所以 i 最远到 m-2，写成 i<m 会越界写 next[m]。',
          '若 j == -1 或 t[i] == t[j]，则 i++、j++、next[i] = j（此时 next 的下标是 i，存的是 j）。',
          '否则 j = next[j]，回退到次长相等前后缀，继续尝试。',
          '★ 摊还分析：j 最多递增 m 次，每次失配至少减 1，回退总次数 ≤ m，所以循环体执行 ≤ 2m 次，O(m)。',
        ],
        complexity:
          '求 next 数组时间 O(m)（摊还：j 最多增 m 次、回退 ≤ m 次）、空间 O(m)。' +
          '存在两套差 1 的定义（国内 next[0]=-1 表示长度，部分国外 next[0]=0 表示长度+1），判断用哪套：' +
          '看失配时写 `j = next[j]` 还是 `j = next[j] - 1`。',
        pitfalls: [
          '循环条件必须是 `i < m-1`，写成 `i < m` 会越界写 next[m]。',
          '`j == -1` 判断必须在 `t[i] == t[j]` **之前**，否则 j=-1 时读 t[-1] 越界。',
          '`j = next[j]` 不能写成 `j = 0`，否则 KMP 退化为 BF、next 值全错。',
          '存在两套差 1 的 next 定义，代码里必须与失配时的 `j = next[j]` 配套，不能混用。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先手工列出 t 的所有下标与字符。',
            'next[0]=-1 直接写。然后模拟：j=-1 时 i++ 且 next[i]=0；t[i]==t[j] 时 i++、j++、next[i]=j。',
            '特别处理失配（t[i]!=t[j] 且 j!=-1）：j=next[j] 后重试，此时 i 不动。',
            '把每个 next[i] 依次写出，用「最长相等真前后缀」的定义核对。',
          ],
        },
        ds_debug: {
          steps: [
            '明确后 3 个 next 值应该逐个递推得到，而不是「偷懒」赋成 0 或 1。',
            '用 t=ababaca 手工推一遍 next，得到基准值 -1,0,0,1,2,3,0。',
            '对比错误版：`j = 0` 会使得采用次长前后缀的位置（如 next[3]、next[5]）算错。',
          ],
        },
        complexity_analysis: {
          idea:
            '求 next 数组是 O(m) 而不是 O(m²)。关键理解「j 只增不减的结构性保证」：' +
            '循环里 j 每次要么 +1（匹配），要么回退 `next[j]`（至少 -1）。因为 j 最多从 -1 增到 m-1，' +
            '而每次回退都消耗之前的增量，所以总操作 ≤ 2m。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 3. 稀疏矩阵快速转置：num 与 cpot 数组
    // ─────────────────────────────────────────────────────────────
    {
      key: 'sparse-transpose',
      cxaStem:
        '下面这段程序实现稀疏矩阵的**快速转置**：输入一个稀疏矩阵的三元组表，输出转置后的三元组表，' +
        '并打印 num（各列非零元素个数）与 cpot（各列在转置表中的起始位置）数组。' +
        '请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.5 稀疏矩阵的三元组与十字链表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['稀疏矩阵', '三元组', '快速转置', '数组'],
      knowledgeIds: ['ds-ch04-18', 'ds-ch04-17', 'ds-ch03-02'],
      code: `#include <stdio.h>
#define MAXS 100

/* 三元组：行、列、值 */
typedef struct { int r, c, v; } Triple;

/* 快速转置：把 A 的 M 行 N 列转置存到 B */
static int fastTranspose(const Triple A[], int m, int *N, Triple B[])
{
    int num[MAXS] = {0}, cpot[MAXS], i, t = 0;
    for (i = 0; i < m; i++) num[A[i].c]++;
    cpot[0] = 0;
    for (i = 1; i < *N; i++) cpot[i] = cpot[i - 1] + num[i - 1];
    for (i = 0; i < m; i++) {
        int p = cpot[A[i].c]++;
        B[p] = (Triple){ A[i].c, A[i].r, A[i].v };
        t++;
    }
    return t;
}

int main(void)
{
    int M, N, m, i, r, c, v, t;
    Triple A[MAXS], B[MAXS];
    if (scanf("%d %d %d", &M, &N, &m) != 3) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < m; i++) { scanf("%d %d %d", &r, &c, &v); A[i] = (Triple){ r, c, v }; }
    t = fastTranspose(A, m, &N, B);
    printf("转置后：\\n");
    for (i = 0; i < t; i++) printf("(%d,%d,%d) ", B[i].r, B[i].c, B[i].v);
    printf("\\n");
    return 0;
}
`,
      stem:
        '下面的程序实现稀疏矩阵的**快速转置**。输入依次是：原矩阵的行数 M、列数 N、非零元素个数 m，' +
        '随后 m 行每行三个整数表示一个三元组 `(r, c, v)`（行、列、值，均从 0 起）。\n\n' +
        '程序调用 `fastTranspose` 把矩阵转置（原行变新列、原列变新行），并输出**转置后的三元组表**（每个三元组用 `(r,c,v)` 空格分隔，最后换行）。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意括号、逗号与空格）。',
      inputs: [
        {
          stdin: '3 4 4\n0 1 5\n1 2 6\n2 0 7\n2 3 8\n',
          note: '4 个非零元的 3×4 矩阵',
          why: 'M=3,N=4,m=4。各列非零元个数 num=[1,1,1,1]（第0..3列各1个），cpot=[0,1,2,3]。转置后每个 (c,r,v) 依次放入。',
        },
        {
          stdin: '3 3 5\n0 0 1\n0 2 2\n1 0 3\n1 1 4\n2 2 5\n',
          note: '5 个非零元，含对角与重复列',
          why: 'M=3,N=3,m=5。num 统计各列，cpot 前缀和。转置后需保证按「新行（=原列）优先、同行内按原行」有序输出。',
        },
        {
          stdin: '2 5 3\n0 0 1\n0 4 2\n1 2 3\n',
          note: '列数大于行数',
          why: 'M=2,N=5,m=3。转置后变成 5×2。num=[1,0,1,0,1]，cpot=[0,1,1,2,2]。',
        },
        {
          stdin: '4 2 3\n0 0 1\n1 0 2\n3 1 3\n',
          note: '行数大于列数',
          why: 'M=4,N=2,m=3。转置后变成 2×4。num=[2,1]，cpot=[0,2]。',
        },
      ],
      blanks: [
        {
          find: '    cpot[0] = 0;',
          accepted: ['    cpot[0] = 0;', '    cpot[0] = 0;'],
          hint: '第 0 列的起始位置总是 0。',
          pitfall:
            'cpot 是「第 col 列在转置表中的起始位置」。cpot[0]=0，然后 `cpot[i] = cpot[i-1] + num[i-1]` 做前缀和。' +
            '漏掉 `cpot[0]=0` 会让 cpot[0] 是未初始化值，后续全部错位。',
        },
        {
          find: '        int p = cpot[A[i].c]++;',
          accepted: [
            '        int p = cpot[A[i].c]++;',
            '        int p = cpot[A[i].c]++;',
          ],
          hint: '每个元素放到「它所在列在转置表中的当前位置」，然后该列的起始位置后移一格。',
          pitfall:
            '`cpot[A[i].c]++` 是「每放一个元素，该列的位置后移一格」—— 后置自增保证先用旧值 p 再更新。' +
            '写成 `int p = ++cpot[A[i].c]` 会先自增导致每个元素放到后一格，第一个元素错位。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    for (i = 0; i < m; i++) num[A[i].c]++;',
          replace: '    for (i = 0; i < m; i++) num[A[i].r]++;',
          why:
            '统计 num 时用 A[i].r（原行）而不是 A[i].c（原列）。num 必须统计「各列的非零元个数」，' +
            '因为转置后这些列变成新矩阵的行。用行数会导致 cpot 前缀和完全错位。',
          pitfall:
            'num 的下标是**原矩阵列号**（转置后的行号），不是行号。' +
            '这个错误不会崩、也不会死循环，但转置后的三元组表会某个位置重复写入、另一个位置漏写，' +
            '结果看起来「少了一些元素」—— 非常隐蔽。',
        },
        {
          kind: '赋值顺序错误',
          find: '        B[p] = (Triple){ A[i].c, A[i].r, A[i].v };',
          replace: '        B[p] = (Triple){ A[i].r, A[i].c, A[i].v };',
          why:
            '转置时 r 和 c 要互换，写成不换就是把原矩阵原样复制进 B，等于没转置。' +
            'B 的每个元素应为 (原列, 原行, 值)。',
          pitfall:
            '转置是「行列交换」，必须是 (c, r, v)。写成 (r, c, v) 是**复制**不是**转置**。' +
            '这个错误极其隐蔽：程序正常跑、输出格式也对，只对应元素的行列没换 —— 必须和原矩阵核对每个值的位置。',
        },
      ],
      asks: [
        { label: '第 1 组（3×4,m=4）的 num 数组（用逗号分隔）', answer: '1,1,1,1' },
        { label: '第 1 组（3×4,m=4）的 cpot 数组（用逗号分隔）', answer: '0,1,2,3' },
        { label: '快速转置的时间复杂度（用 cols 与 t 表示）', answer: 'O(cols+t)' },
        { label: '普通转置的时间复杂度（用 cols 与 t 表示）', answer: 'O(cols*t)' },
        { label: '快速转置比普通转置多了什么辅助空间', answer: 'num[cols]+cpot[cols]' },
      ],
      complexity: 'O(cols+t)',
      complexityAccepted: ['O(cols+t)', 'O(M+t)', 'O(N+t)', 'O(cols + terms)'],
      notes: {
        idea:
          '快速转置 vs 普通转置：普通转置外层遍历新矩阵行号（=原矩阵列号）、内层扫全表，时间 O(cols×t)；' +
          '快速转置用两个辅助数组把每个元素的落点一次算好，时间 O(cols+t)。',
        steps: [
          '第一步统计 num[col]：原矩阵第 col 列的非零元个数 = 转置后第 col 行应有的元素数。',
          '第二步算 cpot[col]：第 col 行在转置表里的起始位置，`cpot[0]=0`，`cpot[i]=cpot[i-1]+num[i-1]`。',
          '第三步扫描原表：每个元素 (r,c,v) 放到 cpot[c] 处，然后把 cpot[c] 加一（为下一个同列元素腾位）。',
          '★ 由于 cpot 是递增的，先放的元素总是占据靠前的位置，转置后天然按「新行优先有序」。',
        ],
        complexity:
          '快速转置时间 O(cols + t)，辅助空间 O(cols)（num + cpot 两个数组）。' +
          '普通转置时间 O(cols × t)、辅助空间 O(1)。当 t 很小时普通转置的常数反而更小，' +
          't 与 cols 同量级时快速转置显著占优。',
        pitfalls: [
          'num 统计的是「列」（A[i].c），不是行 —— 转置后它变成新矩阵的行数。',
          '`cpot[i] = cpot[i-1] + num[i-1]` 是前缀和，下标是 i-1 不是 i。',
          '`cpot[A[i].c]++` 后置自增：先用旧位置 p，再后移。',
          '转置元素是 (c, r, v)，不是 (r, c, v)。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先算 num：扫一遍 A，统计每个「列号」出现的次数。',
            '再算 cpot：cpot[0]=0，cpot[i]=cpot[i-1]+num[i-1]。',
            '最后扫 A，把每个 (r,c,v) 放到 B[cpot[c]]，cpot[c] 加一。',
            '把 B 按顺序读出来，核对是否满足新行优先。',
          ],
        },
        ds_debug: {
          steps: [
            '明确转置后的每行应恰好有 num[新行] 个元素。',
            '用原矩阵核对转置后每个 (r,c,v) 的位置是否正确。',
            '对比 `num[A[i].r]` 的错误：cpot 前缀和用行数统计，转置结果某位置重复、某位置空缺。',
          ],
        },
        complexity_analysis: {
          idea:
            '快速转置是「空间换时间」的典型：用 O(cols) 的辅助数组把每行的落点一次算好，' +
            '避免普通转置里对每个新行号都扫一遍全表。关键复杂度是两趟扫描（num 一趟、放置一趟）均为 O(t)，' +
            '加 cpot 前缀和 O(cols)，合计 O(cols+t)。',
        },
      },
    },
  ],
};
