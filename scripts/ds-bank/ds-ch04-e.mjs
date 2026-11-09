/**
 * ds-ch04「第4章 串、数组和广义表」程序库 —— 由 scripts/gen-ds-problems.mjs 批量派生题目。
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
 *   8. 本批 main 都带输出，defect 一旦改动逻辑，expected 里就会变化，不需要靠人比对序列。
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
  source: '自撰（依据《数据结构》第4章 串、数组和广义表 知识点体系）',
  entries: [
    // ─────────────────────────────────────────────────────────────
    // 1. BF 统计出现次数（允许重叠）
    // ─────────────────────────────────────────────────────────────
    {
      key: 'bf-count',
      cxaStem:
        '下面这段程序实现 BF（暴力）模式匹配的**计数版**：`bfCount(s, t)` 统计子串 t 在主串 s 中一共出现多少次' +
        '（允许重叠，即每次匹配成功后主串指针只前进 1 格）。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['模式匹配', 'BF算法', '字符串', '计数'],
      knowledgeIds: ['ds-ch04-07', 'ds-ch04-02', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
/* BF：统计 t 在 s 中出现的所有位置（允许重叠），返回次数 */
static int bfCount(const char *s, const char *t)
{
    int n = (int)strlen(s), m = (int)strlen(t);
    int i = 0, cnt = 0;
    if (m == 0) return 0;
    while (i <= n - m) {
        int j = 0;
        while (j < m && s[i + j] == t[j]) j++;
        if (j == m) cnt++;
        i++;
    }
    return cnt;
}
int main(void)
{
    char s[MAXS], t[MAXS];
    if (scanf("%s %s", s, t) != 2) { printf("输入有误\\n"); return 0; }
    printf("出现次数 = %d\\n", bfCount(s, t));
    return 0;
}
`,
      stem:
        '下面的程序实现 **BF 模式匹配的计数版**：`bfCount(s, t)` 统计子串 t 在主串 s 中一共出现了多少次。' +
        '注意它**允许重叠** —— 每次匹配成功后主串指针 i 只前进 1 格（不是跳过整个 t），所以像 `ababab` 中的 `ab` 会被数出 3 次。\n\n' +
        '程序读入两个字符串 s 与 t，调用 bfCount 并输出 **出现次数**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: 'ababab ab\n',
          note: '允许重叠，ab 在 ababab 中出现 3 次',
          why: 's=ababab, t=ab。i 从 0 到 4 逐个起点尝试：起点 0 匹配（0-1）、起点 1 失配、起点 2 匹配（2-3）、起点 3 失配、起点 4 匹配（4-5）。共 3 次，重叠计数。',
        },
        {
          stdin: 'hello lo\n',
          note: '普通成功，出现 1 次',
          why: 's=hello, t=lo。t 只在位置 3（0 起）出现一次，bfCount 返回 1。',
        },
        {
          stdin: 'aaaaa aa\n',
          note: '高度重叠，aa 在 aaaaa 中出现 4 次',
          why: 's=aaaaa, t=aa。因为允许重叠，每次 i 前进 1 格，位置 0、1、2、3 各匹配一次，共 4 次。',
        },
        {
          stdin: 'abc def\n',
          note: '未匹配',
          why: 's=abc, t=def。任何一个起点都无法匹配，返回 0。',
        },
      ],
      blanks: [
        {
          find: '        while (j < m && s[i + j] == t[j]) j++;',
          accepted: ['        while (j < m && s[i + j] == t[j]) j++;', '        while (j < m && s[i + j] == t[j]) ++j;'],
          hint: '从起点 i 开始，逐字符比较 s 与 t，只要 j 没到头且对应字符相等就继续前进。',
          pitfall:
            '这是 BF 的「内部逐个字符比较」循环：条件是 `s[i + j] == t[j]`（相等就继续）且 `j < m`（没比较完）。' +
            '若把相等条件写反成 `!=`，整个匹配逻辑颠倒。',
        },
        {
          find: '        if (j == m) cnt++;',
          accepted: ['        if (j == m) cnt++;', '        if (j == m) cnt = cnt + 1;'],
          hint: '当 j 到达 m，说明起点 i 处 t 完整匹配成功，计数加一。',
          pitfall:
            '`j == m` 表示「t 全部 m 个字符都比对成功」。此时才 `cnt++`；之后 i 只前进 1 格（允许重叠）。' +
            '如果把 i 也前进 m，就变成不重叠计数，结果会偏小。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        while (j < m && s[i + j] == t[j]) j++;',
          replace: '        while (j < m && s[i + j] != t[j]) j++;',
          why:
            '匹配条件从 `==` 改成了 `!=`，「相等才前进」变成「不相等才前进」。' +
            '于是每个起点都在第一个字符就停下来（因为 s[i+0] != t[0] 通常成立），' +
            'j 到达不了 m，`cnt` 计数完全错误。',
          pitfall:
            'BF 内层是「字符相等才继续向右比」，所以必须是 `==`。' +
            '这个 bug 不会崩溃、不会死循环，程序照常跑完、输出格式也对，但每个起点的匹配结果都反了，`cnt` 全部算错，极隐蔽。',
        },
        {
          kind: '指针移动错误',
          find: '        i++;',
          replace: '        i += m;',
          why:
            '匹配成功后主串指针本应只前进 1 格（允许重叠），改成了前进 m 格（跳过整个 t）。' +
            '于是重叠的那些出现被漏掉，计数变少。',
          pitfall:
            '「允许重叠」的关键就是**每次 i 只加 1**。写成 `i += m` 就变成了「不重叠」版本。' +
            '对 `aaaaa` 找 `aa`：允许重叠得 4，不重叠只得到 2，结果直接偏小。',
        },
      ],
      asks: [
        { label: 's=ababab, t=ab 的出现次数', answer: '3', unit: '次' },
        { label: 's=aaaaa, t=aa 的出现次数', answer: '4', unit: '次' },
        { label: 's=abc, t=def 的出现次数', answer: '0', unit: '次' },
        { label: 'BF 计数最坏时间复杂度（用 n,m 表示）', answer: 'O(n*m)' },
        { label: 'BF 计数所需的辅助空间', answer: 'O(1)' },
      ],
      complexity: 'O(n*m)',
      complexityAccepted: ['O(n×m)', 'O(nm)', 'O(n*m)', 'O(n²)'],
      notes: {
        idea:
          'BF 计数版就是在「每个起点都试一次」的基础上统计成功次数。与「找第一次位置」不同，计数版在匹配成功后不能停，' +
          '而是继续向右尝试下一个起点；是否允许重叠，取决于匹配成功后 i 前进 1 格还是 m 格。',
        steps: [
          '外循环让 i 从 0 到 n-m 遍历每个可能的起点。',
          '内循环从起点 i 逐字符比较 s[i+j] 与 t[j]，不相等或 j 到头就停止。',
          '若 j == m，说明 t 在起点 i 完整出现，`cnt++`。',
          '每次 i 只前进 1 格 —— 这就是「允许重叠」的体现（重叠部分会被重复计数）。',
          '★ 若改成 `i += m`，就跳过重叠，变成不重叠计数。',
        ],
        complexity:
          '时间最坏 O(n×m)（每个起点都比到 t 末尾附近才失配），空间 O(1)。' +
          '计数版在最坏情况下比「找首次位置」访问的起点更多，因为匹配成功后还要继续扫。',
        pitfalls: [
          '「允许重叠」= 匹配成功后 i 只 +1；「不重叠」= i += m。两者对重叠输入（如 aaaaa 找 aa）结果不同。',
          '内层条件是 `==` 且 `j < m`；写反成 `!=` 会让所有起点在首字符就失败。',
          '计数在 `j == m` 分支里做，必须在每个起点成功时都加，而不是只在某个起点。',
          'BF 最坏 O(n×m)，但常数小；模式串短时比 KMP 更快。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '固定 s 与 t，从起点 0 开始手工模拟。',
            '每个起点用内层 while 逐字符比，失配就跳出内层。',
            '只要 j 到 m 就说明该起点匹配成功，计数 +1。',
            '特别注意 i 每次只前进 1 格，重叠的出现会被重复计数。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是「从起点 i 逐字符比较」的内层循环：`j < m` 保证不越界，`s[i+j] == t[j]` 保证相等才继续。',
            '空位 2 是「匹配成功则计数」：`j == m` 表示 t 全部比对成功。',
            '填完再确认 i 只前进 1 格（允许重叠语义）。',
          ],
        },
        ds_debug: {
          steps: [
            '明确正确 BF 语义：内层相等才前进，匹配成功后 i 只 +1。',
            '用 s=ababab、t=ab 手工跑，得到 3。',
            '对比错误 1（`!=`）：每个起点首字符即失配；错误 2（`i += m`）：跳过重叠计数变少。',
          ],
        },
        complexity_analysis: {
          idea:
            '本题要的是**精确出现次数**，不是渐进记号。关键在于判断「允许重叠」—— 每次匹配成功后 i 只前进 1 格。' +
            '对于高度重叠的输入（如 aaaaa 找 aa），允许重叠会把重叠部分重复计数，得到 4 而不是不重叠的 2。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 2. KMP 统计出现次数（不重叠）
    // ─────────────────────────────────────────────────────────────
    {
      key: 'kmp-count',
      cxaStem:
        '下面这段程序实现 **KMP 算法的不重叠计数版**：`kmpCount(s, t)` 统计子串 t 在主串 s 中一共出现多少次，' +
        '主串指针永不回溯，每次匹配成功后模式串指针归零重新匹配（因此不重叠）。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['KMP', '模式匹配', 'next数组', '计数'],
      knowledgeIds: ['ds-ch04-08', 'ds-ch04-09', 'ds-ch04-07'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static void getNext(const char *t, int next[]) {
    int i = 0, j = -1, m = (int)strlen(t);
    next[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }
        else j = next[j];
    }
}
/* KMP：统计 t 在 s 中出现的次数（不重叠），返回次数 */
static int kmpCount(const char *s, const char *t) {
    int next[MAXS], i = 0, j = 0, n = (int)strlen(s), m = (int)strlen(t);
    int cnt = 0;
    if (m == 0) return 0;
    getNext(t, next);
    while (i < n) {
        if (j == -1 || s[i] == t[j]) { i++; j++; }
        else j = next[j];
        if (j == m) { cnt++; j = 0; }
    }
    return cnt;
}
int main(void) {
    char s[MAXS], t[MAXS];
    if (scanf("%s %s", s, t) != 2) { printf("输入有误\\n"); return 0; }
    printf("出现次数 = %d\\n", kmpCount(s, t));
    return 0;
}
`,
      stem:
        '下面的程序实现 **KMP 匹配的计数版**：`kmpCount(s, t)` 统计子串 t 在主串 s 中出现的次数。' +
        '它用 `getNext` 求出 next 数组（`next[0] = -1`，其余为最长相等真前后缀长度），匹配时主串指针**永不回溯**。' +
        '每次匹配成功后 `j` 归零重新匹配，因此是**不重叠计数**。\n\n' +
        '程序读入两个字符串 s 与 t，调用 kmpCount 并输出 **出现次数**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: 'ababab ab\n',
          note: '不重叠计数，ab 在 ababab 中出现 3 次',
          why: 's=ababab, t=ab。KMP 不重叠计数：位置 0-1 匹配，j 归零后从位置 2 继续，再到位置 4，共 3 次。',
        },
        {
          stdin: 'hello lo\n',
          note: '普通成功，出现 1 次',
          why: 's=hello, t=lo。t 只在位置 3 出现一次，kmpCount 返回 1。',
        },
        {
          stdin: 'aaaaa aa\n',
          note: '不重叠，aa 在 aaaaa 中只出现 2 次',
          why: 's=aaaaa, t=aa。KMP 匹配成功后 j 归零，i 不回退，所以只有位置 0 和位置 2 两处匹配，共 2 次（不重叠）。',
        },
        {
          stdin: 'abc def\n',
          note: '未匹配',
          why: 's=abc, t=def。KMP 扫描全程无匹配，返回 0。',
        },
      ],
      blanks: [
        {
          find: '        if (j == -1 || s[i] == t[j]) { i++; j++; }',
          accepted: ['        if (j == -1 || s[i] == t[j]) { i++; j++; }', '        if (j == -1 || s[i] == t[j]) { i++; ++j; }'],
          hint: '匹配到（或 j 已退到 -1）时，主串与模式串指针同步前进。',
          pitfall:
            '`j == -1` 分支判断必须**先于** `s[i] == t[j]`，否则 j=-1 时读 t[-1] 越界。' +
            '写成 `s[i] == t[j] || j == -1` 就会在 j=-1 时先读越界位置。',
        },
        {
          find: '        if (j == m) { cnt++; j = 0; }',
          accepted: ['        if (j == m) { cnt++; j = 0; }', '        if (j == m) { cnt++; j = 0; }'],
          hint: 'j 到达 m 说明 t 匹配成功，计数并让 j 归零以尽快定位下一次匹配（不重叠）。',
          pitfall:
            '匹配成功后 `j = 0` 使得下一次匹配从模式串头开始；而主串指针 i 不回退。' +
            '若写成 `j = next[j - 1]`，则变为「允许重叠」的 KMP 计数，结果跟不重叠不同。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        if (j == -1 || s[i] == t[j]) { i++; j++; }',
          replace: '        if (j == -1 || s[i] != t[j]) { i++; j++; }',
          why:
            '匹配条件从 `==` 改成 `!=`，KMP 的匹配逻辑完全颠倒。' +
            '本应相等才前进，现在不相等才前进，导致 j 几乎到不了 m，计数全错。',
          pitfall:
            'KMP 匹配是「相等才 i++、j++」，写成 `!=` 刚好反过来。' +
            '这个 bug 不崩、不死循环，程序正常跑完，但计数全部错误，必须逐个输入核对 j 的走向才能发现。',
        },
        {
          kind: '重叠语义错误',
          find: '        if (j == m) { cnt++; j = 0; }',
          replace: '        if (j == m) { cnt++; j = next[j - 1]; }',
          why:
            '匹配成功后本应 `j = 0`（不重叠，j 归零从头再比），改成了 `j = next[j - 1]`（窗口滑动，允许重叠）。' +
            '于是重叠的出现也被计入，计数偏大。',
          pitfall:
            '`j = 0` 与 `j = next[j-1]` 的区别正是「不重叠 vs 允许重叠」。' +
            '对 s=aaaaa、t=aa：不重叠得 2，允许重叠得 4。这个 bug 改变的是语义，不报错。',
        },
      ],
      asks: [
        { label: 's=ababab, t=ab 的出现次数', answer: '3', unit: '次' },
        { label: 's=aaaaa, t=aa 的出现次数（不重叠）', answer: '2', unit: '次' },
        { label: '求 next 数组的时间复杂度（用 m 表示）', answer: 'O(m)' },
        { label: 'KMP 匹配的时间复杂度（用 n,m 表示）', answer: 'O(n+m)' },
        { label: 'KMP 相比 BF 的核心改进', answer: '主串指针永不回溯' },
      ],
      complexity: 'O(n+m)',
      complexityAccepted: ['O(n+m)', 'O(n + m)', 'O(n×m)最坏'],
      notes: {
        idea:
          'KMP 计数版用 next 数组保证主串指针 i 永不回溯，匹配失败时只把模式串指针 j 回退到 `next[j]`。' +
          '计数版在匹配成功后把 j 归零（不重叠），继续扫描主串剩余部分。',
        steps: [
          '先用 getNext 求模式串 t 的 next 数组（next[0] = -1）。',
          '主循环让 i 扫主串：`s[i] == t[j]` 则 i、j 同步前进；否则 j = next[j]。',
          '当 j == -1 时 i++、j++（重新开始）。',
          '当 j == m 时说明匹配成功，`cnt++` 且 `j = 0`（不重叠，从头再比）。',
          '★ 主串指针永不回溯是 KMP 的精华，复杂度由 O(n×m) 降到 O(n+m)。',
        ],
        complexity:
          '求 next 数组 O(m)，匹配 O(n)，合计 O(n+m)。空间 O(m)（next 数组）。' +
          '相比 BF 的最坏 O(n×m)，KMP 在含大量重复前缀的模式串上优势明显。',
        pitfalls: [
          '`j == -1` 的判断必须在 `s[i] == t[j]` 之前，否则 j=-1 越界。',
          '匹配成功后 `j = 0` 是不重叠计数；`j = next[j-1]` 是允许重叠计数，两者结果不同。',
          'getNext 的循环条件是 `i < m - 1`，写成 `i < m` 会越界写 next[m]。',
          'next[0] = -1 与失配时 `j = next[j]` 配套，不能混用「值 +1」的另一套定义。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先求 t 的 next 数组。',
            '模拟主循环：i 扫主串，j 指模式串。相等则 i、j 均 +1；不等则 j = next[j]。',
            'j == -1 时 i++、j++（相当于从主串下一个位置重新开始）。',
            'j == m 时计数并 j=0（不重叠），继续。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是 KMP 的主匹配分支：`j == -1` 或 `s[i] == t[j]` 时，i、j 同步前进。',
            '空位 2 是匹配成功处理：`j == m` 时计数并把 j 归零（不重叠）。',
            '填完用 aaaaa/aa 核对应得 2（不重叠）。',
          ],
        },
        ds_debug: {
          steps: [
            '明确 KMP 语义：相等才前进，j 回退用 next，匹配成功后 j=0（不重叠）。',
            '用 s=aaaaa、t=aa 手工跑正确版得 2。',
            '对比 `!=` 错误（全错）与 `j=next[j-1]` 错误（得 4，重叠语义）。',
          ],
        },
        complexity_analysis: {
          idea:
            'KMP 的关键是「i 永不回溯」。求 next 是 O(m)，匹配是 O(n)。' +
            '本题计数版要注意匹配成功后 j 归零会让一些匹配被跳过（不重叠），但 i 仍只前进一次，总操作仍 O(n+m)。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 3. 串的定位操作 Index（1 起位置）
    // ─────────────────────────────────────────────────────────────
    {
      key: 'str-index',
      cxaStem:
        '下面这段程序实现串的**定位（Index）操作**：`strIndex(s, t)` 返回子串 t 在主串 s 中**首次出现的位置**（从 1 起），' +
        '找不到返回 0。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.1 串的定义与存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['字符串', '定长顺序存储', '定位', 'Index'],
      knowledgeIds: ['ds-ch04-05', 'ds-ch04-02', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
/* Index：返回 t 在 s 中首次出现的位置（1 起），找不到返回 0 */
static int strIndex(const char *s, const char *t)
{
    int n = (int)strlen(s), m = (int)strlen(t), i, j;
    if (m == 0) return 1;
    for (i = 0; i <= n - m; i++) {
        for (j = 0; j < m; j++)
            if (s[i + j] != t[j]) break;
        if (j == m) return i + 1;
    }
    return 0;
}
int main(void)
{
    char s[MAXS], t[MAXS];
    if (scanf("%s %s", s, t) != 2) { printf("输入有误\\n"); return 0; }
    printf("首次出现位置 = %d\\n", strIndex(s, t));
    return 0;
}
`,
      stem:
        '下面的程序实现串的**定位操作**：`strIndex(s, t)` 返回子串 t 在主串 s 中**首次出现的位置**（从 1 起），' +
        '找不到返回 0。它逐起点尝试，只要内层逐字符比对完整匹配就返回该起点的 1 起下标。\n\n' +
        '程序读入两个字符串 s 与 t，调用 strIndex 并输出 **首次出现位置**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: 'helloworld world\n',
          note: 't 在 s 中间找到，位置 6',
          why: 's=helloworld, t=world。world 从主串下标 5 开始，1 起位置为 6。',
        },
        {
          stdin: 'aaaaaa aa\n',
          note: 't 在 s 开头找到，位置 1',
          why: 's=aaaaaa, t=aa。aa 从下标 0 开始，1 起位置为 1。',
        },
        {
          stdin: 'abc def\n',
          note: 't 不在 s 中，返回 0',
          why: 's=abc, t=def，找不到，返回 0。',
        },
        {
          stdin: 'mississippi ss\n',
          note: 's 中 ss 首次出现在位置 3',
          why: 's=mississippi, t=ss。ss 首次出现在下标 2，1 起位置为 3（下标 5 处是第二次出现，取首次）。',
        },
      ],
      blanks: [
        {
          find: '            if (s[i + j] != t[j]) break;',
          accepted: ['            if (s[i + j] != t[j]) break;', '            if (s[i + j] != t[j]) break;'],
          hint: '内层逐字符比对，只要有一个字符不相等就跳出，认为该起点不匹配。',
          pitfall:
            '这是「不相等就 break」的失配判定：`s[i+j] != t[j]` 时说明从起点 i 开始匹配不上。' +
            '若写反成 `==`，则相等就 break，逻辑完全颠倒。',
        },
        {
          find: '        if (j == m) return i + 1;',
          accepted: ['        if (j == m) return i + 1;', '        if (j == m) return i + 1;'],
          hint: 'j 到达 m（即内层完整比完没 break）说明匹配成功，返回该起点的 1 起位置。',
          pitfall:
            '返回的是 **1 起位置**：`i + 1`。若写成 `i` 就是 0 起下标，全题偏移 1。' +
            '下标口径（0 起 / 1 起）是串定位最常见的混淆点。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '            if (s[i + j] != t[j]) break;',
          replace: '            if (s[i + j] == t[j]) break;',
          why:
            '失配判定从 `!=` 改成 `==`，变成「相等才 break」。于是每个起点都在第一个字符（若与 t[0] 相等）就跳出，' +
            'j 永远到不了 m，几乎找不到匹配。',
          pitfall:
            '串的定位用「不相等即失配」来 break。写反成 `==` 会让匹配逻辑完全颠倒，' +
            '程序不崩、不报错，但定位结果全错，需用具体输入核对。',
        },
        {
          kind: '下标口径错误',
          find: '        if (j == m) return i + 1;',
          replace: '        if (j == m) return i;',
          why:
            '返回位置从 `i + 1`（1 起）改成 `i`（0 起），所有成功的定位结果都偏小 1。',
          pitfall:
            '本题要求**1 起**位置，所以返回 `i + 1`。`i` 是 0 起下标。' +
            '漏掉 +1 会让所有成功用例的结果都偏移 1，是一个典型的 off-by-one。',
        },
      ],
      asks: [
        { label: 's=helloworld, t=world 的首次出现位置（1 起）', answer: '6', unit: '位置' },
        { label: 's=mississippi, t=ss 的首次出现位置（1 起）', answer: '3', unit: '位置' },
        { label: 's=abc, t=def 的返回值', answer: '0' },
        { label: '该定位算法的时间复杂度（用 n,m 表示）', answer: 'O(n*m)' },
        { label: '返回 0 代表什么', answer: '子串不存在' },
      ],
      complexity: 'O(n*m)',
      complexityAccepted: ['O(n×m)', 'O(nm)', 'O(n*m)', 'O(n²)'],
      notes: {
        idea:
          '串的定位（Index）是最基础的 BF 变体：从主串的每个可能起点试一次，内部逐字符比对 t。' +
          '一旦某个起点完整匹配 t，就返回它的 1 起位置。找不到返回 0。',
        steps: [
          '外循环遍历每个可能起点 i（从 0 到 n-m）。',
          '内循环从起点 i 逐字符比对 s[i+j] 与 t[j]。',
          '只要发现 s[i+j] != t[j] 就 break，说明该起点不匹配。',
          '若 j 走完整个 m 都没 break，说明起点 i 处完整匹配，返回 i+1（1 起位置）。',
          '★ 若所有起点都试完仍未匹配，返回 0。',
        ],
        complexity:
          '最坏 O(n×m)（每个起点都比到 t 末尾），空间 O(1)。' +
          '若只求首次出现，往往很快命中；最坏情形是主串里每个起点都比到 t 末尾才失配。',
        pitfalls: [
          '返回位置是 **1 起**（i+1）；0 起下标需要 i。',
          '失配判定用 `!=`，写反成 `==` 逻辑颠倒。',
          '外循环上限是 `n - m`，写成 `n` 会越界读 s[n+j]。',
          't 为空串时按约定返回 1（空串出现在任意位置）。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '固定 s 与 t，从起点 0 开始。',
            '用内层循环逐字符比对 s[i+j] 与 t[j]，不等就 break。',
            '若 j 到达 m 说明该起点匹配成功，返回 i+1。',
            '注意 1 起口径，所以答案是 i+1 而非 i。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是失配判定：`s[i+j] != t[j]` 时 break。',
            '空位 2 是成功返回：`j == m` 返回 `i + 1`。',
            '核对 1 起口径，用 helloworld/world 验证得 6。',
          ],
        },
        ds_debug: {
          steps: [
            '明确正确语义：不相等即 break，j==m 返回 1 起位置。',
            '用 s=mississippi、t=ss 手工跑得 3。',
            '对比 `==` 错误（逻辑颠倒）与返回 i 错误（0 起偏移）。',
          ],
        },
        complexity_analysis: {
          idea:
            '串定位 Index 是典型的 O(n×m) 最坏。外层每个起点都可能比到 t 末尾，' +
            '最坏情形如 s=aaaa…ab、t=aa…ab。它与 BF 找位置同源，只是返回 1 起位置。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 4. 列主序地址计算
    // ─────────────────────────────────────────────────────────────
    {
      key: 'colmajor-addr',
      cxaStem:
        '下面这段程序按**列主序**（column-major）计算二维数组元素的存储地址：' +
        '给定矩阵行数 M、列数 N、元素下标 (i, j)（0 起）、基地址 base 与每个元素字节数 size，' +
        '用公式 `base + (j * M + i) * size` 输出该元素的地址。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.3 数组的顺序存储与地址计算',
      difficulty: 2,
      bloom: 'apply',
      tags: ['数组', '列主序', '地址计算', '顺序存储'],
      knowledgeIds: ['ds-ch04-12', 'ds-ch04-03'],
      code: `#include <stdio.h>
int main(void)
{
    int M, N, i, j, base, size;
    if (scanf("%d %d %d %d %d %d", &M, &N, &i, &j, &base, &size) != 6) { printf("输入有误\\n"); return 0; }
    int off = j * M + i;
    printf("列主序地址 = %d\\n", base + off * size);
    return 0;
}
`,
      stem:
        '下面的程序按**列主序**计算二维数组元素的地址。它读入 6 个整数：`M N i j base size`' +
        '（M 行 N 列矩阵、元素下标 i 与 j 从 0 起、基地址 base、每个元素 size 字节），' +
        '用 `base + (j * M + i) * size` 输出该元素的存储地址。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: '3 4 1 2 100 4\n',
          note: '3×4 矩阵中 a[1][2] 的列主序地址',
          why: 'M=3,N=4,i=1,j=2,base=100,size=4。列主序偏移 = j*M + i = 2*3+1 = 7，地址 = 100 + 7*4 = 128。',
        },
        {
          stdin: '3 4 0 0 100 4\n',
          note: '首元素地址',
          why: 'i=0,j=0 偏移为 0，地址 = base = 100。',
        },
        {
          stdin: '2 3 1 1 0 1\n',
          note: 'size=1 时地址即偏移量',
          why: 'M=2,N=3,i=1,j=1,base=0,size=1。偏移 = 1*2+1 = 3，地址 = 0 + 3*1 = 3。',
        },
      
      ],
      blanks: [
        {
          find: '    int off = j * M + i;',
          accepted: ['    int off = j * M + i;', '    int off = j * M + i;'],
          hint: '列主序存储时，第 j 列的元素全部连续存放，a[i][j] 之前有 j 个整列（每列 M 个）再加 i 个。',
          pitfall:
            '列主序偏移是 `j * M + i`（先跨 j 个完整列，每列 M 个，再跨 i 个）。' +
            '写反成 `i * M + j` 就变成了行主序，地址全错。',
        },
        {
          find: '    printf("列主序地址 = %d\\n", base + off * size);',
          accepted: ['    printf("列主序地址 = %d\\n", base + off * size);', '    printf("列主序地址 = %d\\n", base + off * size);'],
          hint: '最终地址 = 基地址 + 偏移量 × 单元素字节数。',
          pitfall:
            '地址 = `base + off * size`，`off * size` 是把元素个数换算成字节数。' +
            '若漏乘 size（写成 `base + off`），就把「元素个数」当成「字节地址」，结果偏小。',
        },
      ],
      defects: [
        {
          kind: '存储顺序错误',
          find: '    int off = j * M + i;',
          replace: '    int off = i * M + j;',
          why:
            '列主序的偏移应是 `j * M + i`（先跨越 j 个完整列，再在列内推进 i 个）。' +
            '改写成 `i * M + j` 就成了**行主序**的偏移，地址计算全部出错。',
          pitfall:
            '列主序 vs 行主序是数组地址计算的核心区别：行主序偏移 `i * N + j`，列主序偏移 `j * M + i`。' +
            '这个 bug 不崩溃、不报错，只是每个地址都按行主序算出来，必须核对「先列后行」的口径。',
        },
        {
          kind: '单位换算错误',
          find: 'base + off * size',
          replace: 'base + off',
          why:
            '把 `base + off * size` 改成 `base + off`，相当于把「元素个数偏移」当成「字节偏移」，' +
            '忽略了每个元素占 size 个字节。所有非零偏移的地址都偏小（少了 (size-1) 倍的偏移）。',
          pitfall:
            '地址=基地址+偏移×单元素大小。漏乘 size 只对 size=1 时碰巧正确，' +
            'size>1 时地址全部算小，这是一个隐蔽的「单位换算」错误。',
        },
      ],
      asks: [
        { label: '3×4 矩阵中 a[1][2] 的列主序偏移（0 起）', answer: '7', unit: '元素' },
        { label: '3×4 矩阵中 a[1][2] 的地址（base=100, size=4）', answer: '128', unit: '字节' },
        { label: '列主序存储时，M 行 N 列数组中 a[i][j] 的偏移公式', answer: 'j*M + i' },
        { label: '行主序存储时，a[i][j] 的偏移公式', answer: 'i*N + j' },
        { label: '该计算的时间复杂度', answer: 'O(1)' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1)常数'],
      notes: {
        idea:
          '顺序存储的二维数组可以按行主序或列主序连续存放。列主序把一列的元素连续存放，' +
          '所以 a[i][j] 的偏移 = 它前面有 j 个完整列（每列 M 个元素）+ 当前列内 i 个元素 = j*M + i。',
        steps: [
          '读入 M、N、i、j、base、size。',
          '列主序偏移 `off = j * M + i`：j 个整列，每列 M 个元素，再加列内 i 个。',
          '地址 = `base + off * size`：把元素偏移换算成字节偏移。',
          '★ 对比：行主序偏移为 `i * N + j`。',
        ],
        complexity:
          '该计算为常数时间 O(1)，只需几步算术即可算出地址，无需遍历数组。' +
          '空间 O(1)。这是顺序存储「随机访问」O(1) 的关键。',
        pitfalls: [
          '列主序偏移是 `j * M + i`；行主序是 `i * N + j`。两者不要混。',
          '地址一定要乘单元素大小 size，否则是「元素个数」而不是「字节」。',
          '下标口径：本题 0 起；若 1 起则偏移公式要相应调整。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先读入 M,N,i,j,base,size。',
            '按列主序算偏移：j*M + i。',
            '地址 = base + 偏移 × size。',
            '代入具体数值算出整数结果。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是列主序偏移：`j * M + i`。',
            '空位 2 是地址公式：`base + off * size`。',
            '核对：M=3,j=2,i=1 时 off=7，base+7×4=128。',
          ],
        },
        ds_debug: {
          steps: [
            '明确列主序偏移 `j*M + i` 且地址要乘 size。',
            '用 M=3,N=4,i=1,j=2,base=100,size=4 验证得 128。',
            '对比 `i*M+j`（行主序，得 120）与漏乘 size（得 107）。',
          ],
        },
        complexity_analysis: {
          idea:
            '顺序存储的地址计算是 O(1) 的随机访问，这是数组优于链表的根本。' +
            '列主序与行主序只是偏移公式不同（j*M+i 与 i*N+j），复杂度完全相同。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 5. 对称矩阵压缩下标
    // ─────────────────────────────────────────────────────────────
    {
      key: 'symmetric-loc',
      cxaStem:
        '下面这段程序把**对称矩阵**按行优先压缩存储到下三角一维数组：`symLoc(i, j)` 返回元素 a[i][j] 在这压缩数组中的下标 k（0 起）。' +
        '它利用对称性（a[i][j] = a[j][i]）把下三角元素按行优先排列。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.4 特殊矩阵的压缩存储',
      difficulty: 2,
      bloom: 'apply',
      tags: ['对称矩阵', '压缩存储', '行优先', '数组'],
      knowledgeIds: ['ds-ch04-15', 'ds-ch04-12'],
      code: `#include <stdio.h>
/* 对称矩阵按行优先压缩到下三角一维数组，返回 a[i][j] 的压缩下标 k（0 起） */
static int symLoc(int i, int j)
{
    if (i < j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */
    return i * (i + 1) / 2 + j;
}
int main(void)
{
    int i, j;
    if (scanf("%d %d", &i, &j) != 2) { printf("输入有误\\n"); return 0; }
    printf("压缩下标 = %d\\n", symLoc(i, j));
    return 0;
}
`,
      stem:
        '下面的程序把**对称矩阵**按行优先压缩到一个一维数组（只存下三角）。' +
        '`symLoc(i, j)` 返回元素 a[i][j]（i、j 从 0 起）在这压缩数组中的下标 k。' +
        '利用对称性，当 i < j 时先交换 i 与 j，使 i ≥ j，再用下三角行优先公式 `i*(i+1)/2 + j` 求 k。\n\n' +
        '程序读入两个整数 i 与 j，调用 symLoc 并输出 **压缩下标**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: '2 1\n',
          note: '下三角元素 a[2][1]',
          why: 'i=2,j=1，i>=j 不交换，k = 2*3/2 + 1 = 4。',
        },
        {
          stdin: '1 2\n',
          note: '上三角元素 a[1][2]，对称到 a[2][1]',
          why: 'i=1<j=2，交换为 i=2,j=1，k = 2*3/2 + 1 = 4。与 a[2][1] 同一位置（对称）。',
        },
        {
          stdin: '0 0\n',
          note: '对角线首元素',
          why: 'i=j=0，k = 0*1/2 + 0 = 0。',
        },
        {
          stdin: '3 2\n',
          note: '下三角元素 a[3][2]',
          why: 'i=3,j=2，k = 3*4/2 + 2 = 6 + 2 = 8。',
        },
      ],
      blanks: [
        {
          find: '    if (i < j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */',
          accepted: [
            '    if (i < j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */',
            '    if (i < j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */',
          ],
          hint: '对称矩阵 a[i][j] 与 a[j][i] 相等，所以可交换行列使 i ≥ j，统一按上/下三角处理。',
          pitfall:
            '对称矩阵压缩的关键是「只存一半」。当 i < j 时利用对称性把 (i,j) 交换成 (j,i)，' +
            '使所有下标统一到 i ≥ j（下三角）。漏掉交换，上三角元素会算出错误下标。',
        },
        {
          find: '    return i * (i + 1) / 2 + j;',
          accepted: ['    return i * (i + 1) / 2 + j;', '    return i * (i + 1) / 2 + j;'],
          hint: '下三角按行优先压缩：第 i 行（含对角线）前面有 i 行，每行行号 0..i-1 的元素个数之和为 i*(i+1)/2。',
          pitfall:
            '下三角行优先的下标 = 前面 `i` 行元素总数 `i*(i+1)/2` + 当前行内列号 `j`。' +
            '若把 `i*(i+1)/2` 写错（如用 `i*(i-1)/2`），所有下三角元素下标都会偏移。',
        },
      ],
      defects: [
        {
          kind: '对称处理错误',
          find: '    if (i < j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */',
          replace: '    if (i > j) { int t = i; i = j; j = t; } /* 利用对称性交换，使 i >= j */',
          why:
            '交换条件从 `i < j` 改成 `i > j`。于是当 i<j（上三角）时**不交换**，直接用下三角公式算，' +
            '而上三角元素的下标正确值应该等于它对称位置（j,i）的下标，结果算错。',
          pitfall:
            '对称矩阵压缩时，把「小行号」归一化到「大行号」（i ≥ j）才能套下三角公式。' +
            '写成 `i > j` 恰好颠倒：下三角反而被交换、上三角没被换，下标全部算错，且不报错。',
        },
        {
          kind: '公式错误',
          find: '    return i * (i + 1) / 2 + j;',
          replace: '    return i * (i - 1) / 2 + j;',
          why:
            '下三角行优先的前缀和从 `i*(i+1)/2` 改成 `i*(i-1)/2`，相当于少算了「前面 i 行」里的一行元素，' +
            '所有 i≥1 的下三角元素下标都偏小。',
          pitfall:
            '下三角行优先下标 `i*(i+1)/2 + j`：`i*(i+1)/2` 是第 0..i-1 行到对角线前的元素总数。' +
            '用 `i*(i-1)/2` 会漏掉一行，是典型的 off-by-one。',
        },
      ],
      asks: [
        { label: 'a[2][1] 的压缩下标（0 起）', answer: '4' },
        { label: 'a[1][2]（上三角）的压缩下标', answer: '4' },
        { label: '3×3 对称矩阵压缩后数组长度', answer: '6' },
        { label: 'n×n 对称矩阵压缩后数组长度', answer: 'n*(n+1)/2' },
        { label: '该下标计算的时间复杂度', answer: 'O(1)' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1)常数'],
      notes: {
        idea:
          '对称矩阵 a[i][j] = a[j][i]，只需存下三角（含对角线），压缩成一个一维数组。' +
          '按行优先存储时，a[i][j]（i≥j）前面有 i 行，第 0..i-1 行元素数之和为 0+1+…+i = i*(i+1)/2，' +
          '再在本行内前进 j 个，得下标 `i*(i+1)/2 + j`。',
        steps: [
          '读入 i、j。',
          '若 i < j，交换 i、j（利用对称性 a[i][j]=a[j][i]），使 i ≥ j，统一处理下三角。',
          '计算压缩下标：`i*(i+1)/2 + j`。',
          '★ n×n 对称矩阵压缩后数组长度为 `n*(n+1)/2`。',
        ],
        complexity:
          '下标计算为常数时间 O(1)，空间 O(1)。' +
          '压缩存储把 n×n 对称矩阵的存储量从 n² 降到 n(n+1)/2，节省近一半空间。',
        pitfalls: [
          '对称矩阵只存下三角，需保证 i ≥ j（用对称性交换）。',
          '行优先下三角下标 = `i*(i+1)/2 + j`，前缀和部分是 `i*(i+1)/2`。',
          '下标口径 0 起；若 1 起公式相应加 1。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 i、j。',
            '判断 i<j 时交换（只存下三角）。',
            '用 `i*(i+1)/2 + j` 计算下标。',
            '核对：a[2][1] 为 4，a[1][2] 对称也为 4。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是对称交换：`i < j` 时交换以统一到 i≥j。',
            '空位 2 是下三角行优先公式：`i*(i+1)/2 + j`。',
            '核对 i=2,j=1 得 4。',
          ],
        },
        ds_debug: {
          steps: [
            '明确对称矩阵只存下三角，用 `i < j` 交换归一化。',
            '用 i=2,j=1 与 i=1,j=2 都验证得 4。',
            '对比 `i > j` 交换错误与 `i*(i-1)/2` 公式错误。',
          ],
        },
        complexity_analysis: {
          idea:
            '对称矩阵压缩的关键是「只存一半」+「常数时间寻址」。' +
            '利用对称性把任意 (i,j) 归一到下三角，再用下三角行优先公式 O(1) 求出压缩下标，省一半空间且不牺牲访问速度。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 6. 稀疏矩阵三元组相加
    // ─────────────────────────────────────────────────────────────
    {
      key: 'sparse-add',
      cxaStem:
        '下面这段程序实现稀疏矩阵的三元组**相加**：读入两个同阶稀疏矩阵 A 和 B 的三元组表，' +
        '按行优先有序合并相加（相同位置值相加，和为 0 则丢弃），输出结果矩阵 C 的三元组表。' +
        '请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.5 稀疏矩阵的三元组与十字链表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['稀疏矩阵', '三元组', '相加', '归并'],
      knowledgeIds: ['ds-ch04-17', 'ds-ch04-18', 'ds-ch04-19'],
      code: `#include <stdio.h>
#define MAXS 100
typedef struct { int r, c, v; } Triple;
int main(void)
{
    int M, N, ma, mb, i, r, c, v;
    Triple A[MAXS], B[MAXS], C[MAXS];
    if (scanf("%d %d %d %d", &M, &N, &ma, &mb) != 4) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < ma; i++) { scanf("%d %d %d", &r, &c, &v); A[i].r = r; A[i].c = c; A[i].v = v; }
    for (i = 0; i < mb; i++) { scanf("%d %d %d", &r, &c, &v); B[i].r = r; B[i].c = c; B[i].v = v; }
    int p = 0, q = 0, t = 0;
    while (p < ma && q < mb) {
        if (A[p].r < B[q].r || (A[p].r == B[q].r && A[p].c < B[q].c)) { C[t] = A[p]; t++; p++; }
        else if (A[p].r > B[q].r || (A[p].r == B[q].r && A[p].c > B[q].c)) { C[t] = B[q]; t++; q++; }
        else { int sv = A[p].v + B[q].v; if (sv != 0) { C[t].r = A[p].r; C[t].c = A[p].c; C[t].v = sv; t++; } p++; q++; }
    }
    while (p < ma) { C[t] = A[p]; t++; p++; }
    while (q < mb) { C[t] = B[q]; t++; q++; }
    printf("稀疏矩阵之和：\\n");
    for (i = 0; i < t; i++) printf("(%d,%d,%d) ", C[i].r, C[i].c, C[i].v);
    printf("\\n");
    return 0;
}
`,
      stem:
        '下面的程序实现稀疏矩阵的**三元组相加**。输入第一行是 `M N ma mb`（行数、列数、A 的非零元个数、B 的非零元个数），' +
        '随后 ma 行是 A 的三元组 `(r,c,v)`，mb 行是 B 的三元组。两个矩阵都在三元组表中**按行优先有序**存放。\n\n' +
        '程序按归并方式相加：相同 (r,c) 位置的值相加，和为 0 则丢弃该元素；不同位置按序存入结果表 C。' +
        '最后输出**结果矩阵 C 的三元组表**（每个用 `(r,c,v)` 空格分隔，末尾换行）。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意括号、逗号与空格）。',
      inputs: [
        {
          stdin: '3 3 3 2\n0 0 1\n1 1 2\n2 2 4\n1 1 3\n2 2 4\n',
          note: '有相同位置相加（1,1）与（2,2）',
          why: 'A={(0,0,1),(1,1,2),(2,2,4)}，B={(1,1,3),(2,2,4)}。位置 (1,1) 和 (2,2) 相加得 5 和 8，(0,0) 只有 A 有。结果 (0,0,1),(1,1,5),(2,2,8)。',
        },
        {
          stdin: '2 2 1 1\n0 0 5\n1 1 3\n',
          note: '无相同位置，各自保留',
          why: 'A={(0,0,5)}，B={(1,1,3)}。位置不同，按行优先顺序输出 (0,0,5),(1,1,3)。',
        },
        {
          stdin: '2 2 2 1\n0 0 1\n1 1 2\n0 0 4\n',
          note: '相同位置相加且 A 位置靠前',
          why: 'A={(0,0,1),(1,1,2)}，B={(0,0,4)}。(0,0) 相加得 5，(1,1) 只来自 A。结果 (0,0,5),(1,1,2)。',
        },
        {
          stdin: '3 3 1 1\n1 1 1\n0 0 9\n',
          note: 'B 的位置在 A 之前',
          why: 'A={(1,1,1)}，B={(0,0,9)}。归并时 B 的 (0,0) 行号更小先输出，再输出 A 的 (1,1)。结果 (0,0,9),(1,1,1)。',
        },
      ],
      blanks: [
        {
          find: '        if (A[p].r < B[q].r || (A[p].r == B[q].r && A[p].c < B[q].c)) { C[t] = A[p]; t++; p++; }',
          accepted: [
            '        if (A[p].r < B[q].r || (A[p].r == B[q].r && A[p].c < B[q].c)) { C[t] = A[p]; t++; p++; }',
            '        if (A[p].r < B[q].r || (A[p].r == B[q].r && A[p].c < B[q].c)) { C[t] = A[p]; t++; p++; }',
          ],
          hint: '按行优先比较两个三元组：A 的行更小，或同行但 A 的列更小，则 A 的元素先存入结果并前进。',
          pitfall:
            '归并条件是「行优先有序」。当 A[p] 的 (r,c) 小于 B[q] 时取 A，且只有当行相等才比较列。' +
            '若漏判行相等、直接用列比较，会在不同行时出错。',
        },
        {
          find: '        else { int sv = A[p].v + B[q].v; if (sv != 0) { C[t].r = A[p].r; C[t].c = A[p].c; C[t].v = sv; t++; } p++; q++; }',
          accepted: [
            '        else { int sv = A[p].v + B[q].v; if (sv != 0) { C[t].r = A[p].r; C[t].c = A[p].c; C[t].v = sv; t++; } p++; q++; }',
            '        else { int sv = A[p].v + B[q].v; if (sv != 0) { C[t].r = A[p].r; C[t].c = A[p].c; C[t].v = sv; t++; } p++; q++; }',
          ],
          hint: '位置相同时把两个值相加，和不为 0 才存；无论是否存，都要同时前进 A、B 两指针。',
          pitfall:
            '同位置相加用 `+`，且 `p++; q++` 必须同时执行。' +
            '若只 `p++` 不 `q++`，B 的这个元素会被漏掉或重复，结果表出现重复位置。',
        },
      ],
      defects: [
        {
          kind: '运算错误',
          find: '        else { int sv = A[p].v + B[q].v;',
          replace: '        else { int sv = A[p].v - B[q].v;',
          why:
            '同位置相加本应 `A[p].v + B[q].v`，改成相减 `-`。结果矩阵中所有「两矩阵都有」的位置的值都算错，' +
            '还会把一些本应为 0 的按相减设成非 0。',
          pitfall:
            '稀疏矩阵相加是「对应位置值相加」。写成相减就变成「对应位置值相减」，' +
            '只在无同位置时才碰巧正确，一旦有重叠位置结果就错，且不报错。',
        },
        {
          kind: '指针移动错误',
          find: '} p++; q++;',
          replace: '} p++;',
          why:
            '同位置处理时本应 `p++; q++` 同时前进，改成只 `p++`。' +
            '于是 B 的这个元素没被消费，下一轮会被当作「行号更大」的元素独立输出，结果表出现**重复位置**，' +
            '且该位置的 B 值被多计一次。',
          pitfall:
            '同位置相加后两个指针都要前进。' +
            '漏掉 `q++` 会导致 B 的同一元素被重复处理，输出表里出现两个相同 (r,c) 且值错乱 —— 更容易暴露，但注意别把 `p++` 也去掉导致死循环。',
        },
      ],
      asks: [
        { label: '第 1 组（(1,1) 相加）结果中 (1,1) 的值', answer: '5' },
        { label: '第 1 组 (2,2) 相加的值', answer: '8' },
        { label: '稀疏矩阵相加的时间复杂度（用 ma、mb 表示）', answer: 'O(ma+mb)' },
        { label: '同位置相加和为 0 时如何处理', answer: '丢弃该元素' },
        { label: '三元组相加的辅助空间（最坏）', answer: 'O(ma+mb)' },
      ],
      complexity: 'O(ma+mb)',
      complexityAccepted: ['O(ma+mb)', 'O(ma + mb)', 'O(t)'],
      notes: {
        idea:
          '稀疏矩阵三元组相加本质是**归并**两个有序序列。两个三元组表都按行优先有序，' +
          '用双指针 p、q 比较当前位置：行小（或同行列小）的先存入结果，同行同列的相加（为零则丢弃），' +
          '一方遍历完就把另一方剩余全部拷贝。',
        steps: [
          '读入两个矩阵的行列数与非零元个数，并读入各自三元组。',
          '双指针 p、q 分别指向 A、B 当前元素。',
          '比较 (r,c)：A 小则取 A（p++），B 小则取 B（q++），相同则相加（为 0 丢弃）并 p++、q++。',
          '处理剩余元素（while p<ma / q<mb）。',
          '★ 结果仍按行优先有序。',
        ],
        complexity:
          '时间 O(ma + mb)（双指针各走一遍），最坏辅助空间 O(ma + mb)（结果表 C）。' +
          '与普通矩阵相加 O(M×N) 相比，当非零元很少时三元组加法更省。',
        pitfalls: [
          '归并比较必须「先比行，同行再比列」。',
          '同位置求和用 `+`，和为 0 要丢弃（否则破坏稀疏性）。',
          '同位置处理后 `p++` 和 `q++` 必须同时执行，漏一个会重复或漏元素。',
          '输入的三元组表必须按行优先有序，归并才正确。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先读入 M,N,ma,mb 及两个矩阵的三元组。',
            '双指针 p、q 从 0 开始归并。',
            '比较 (r,c)，小者先存，相同相加（为 0 丢弃）。',
            '处理剩余元素后按序读出 C。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是「A 当前位置更小则取 A」的归并分支。',
            '空位 2 是同位置相加处理：`A[p].v + B[q].v`，为 0 丢弃，`p++; q++`。',
            '核对第 1 组得 (0,0,1)(1,1,5)(2,2,8)。',
          ],
        },
        ds_debug: {
          steps: [
            '明确归并语义：行小先取，同行同列相加。',
            '用第 1 组（有重叠位置）核对。',
            '对比相减（值错）与漏 q++（重复位置）。',
          ],
        },
        complexity_analysis: {
          idea:
            '三元组相加用双指针归并，每个指针各走一遍，故 O(ma + mb)。' +
            '若不用双指针而逐个查找，会退化为 O(ma×mb)。关键在利用「三元组表已按行优先有序」这一前提。',
        },
      },
    },
    // ─────────────────────────────────────────────────────────────
    // 7. 广义表长度（第一层元素个数）
    // ─────────────────────────────────────────────────────────────
    {
      key: 'gl-length',
      cxaStem:
        '下面这段程序计算**广义表**的长度（第一层元素的个数）：`glLength(s, &i)` 从字符串 s 的第 i 个位置开始解析，' +
        '统计最外层（从那儿开始到匹配的右括号）由逗号分隔的元素个数。请阅读程序后回答后面的问题，答案都要求精确整数。',
      section: '4.6 广义表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['广义表', '长度', '递归', '字符串'],
      knowledgeIds: ['ds-ch04-22', 'ds-ch04-23', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
/* 广义表（字符串表示，如 (a,(b,c),d)）的长度：第一层元素个数 */
static int glLength(const char *s, int *i)
{
    int cnt = 0;
    while (s[*i] != '\\0' && s[*i] != ')') {
        if (s[*i] == '(') { (*i)++; glLength(s, i); cnt++; }
        else if (s[*i] == ',') { (*i)++; }
        else { (*i)++; cnt++; }
    }
    if (s[*i] == ')') (*i)++;
    return cnt;
}
int main(void)
{
    char s[MAXS];
    if (scanf("%s", s) != 1) { printf("输入有误\\n"); return 0; }
    int i = 1; /* 跳过最外层左括号 */
    printf("长度 = %d\\n", glLength(s, &i));
    return 0;
}
`,
      stem:
        '下面的程序计算**广义表的长度**（第一层元素的个数）。输入的广义表用字符串表示，如 `(a,(b,c),d)`。\n\n' +
        '`glLength(s, &i)` 从位置 i 开始解析：遇到原子就把它当作一个元素计数，遇到 `(` 就递归进入子表并**整体算作一个元素**计数，' +
        '遇到 `,` 表示元素分隔。程序读入一串广义表，调用 glLength 并输出**长度**。\n\n' +
        '请写出程序运行后的**完整输出**（一个字符都不能差，注意等号与空格）。',
      inputs: [
        {
          stdin: '(a,(b,c),d)\n',
          note: '第一层有 a、(b,c)、d 三个元素',
          why: '第一层元素为 a、(b,c)、d，共 3 个。子表 (b,c) 整体算一个元素。',
        },
        {
          stdin: '(a,b)\n',
          note: '两个原子',
          why: '第一层为 a、b，共 2 个。',
        },
        {
          stdin: '((a,b),(c))\n',
          note: '两个子表',
          why: '第一层为 (a,b) 与 (c)，共 2 个子表元素。',
        },
        {
          stdin: '(a)\n',
          note: '单元素',
          why: '第一层只有 a，共 1 个元素。',
        },
      ],
      blanks: [
        {
          find: "        if (s[*i] == '(') { (*i)++; glLength(s, i); cnt++; }",
          accepted: [
            "        if (s[*i] == '(') { (*i)++; glLength(s, i); cnt++; }",
            "        if (s[*i] == '(') { (*i)++; glLength(s, i); cnt++; }",
          ],
          hint: '遇到左括号说明是一个子表，整个子表算作一个元素，递归解析它的内部再计数。',
          pitfall:
            '遇到 `(` 时，整个子表（含其内部所有元素）只算**一个**第一层元素。' +
            '递归调用 glLength 是为了跳过子表的内部内容，但外层只 `cnt++` 一次。',
        },
        {
          find: '        else { (*i)++; cnt++; }',
          accepted: ['        else { (*i)++; cnt++; }', '        else { (*i)++; cnt = cnt + 1; }'],
          hint: '遇到普通原子字符，算一个元素并前进到下一个位置。',
          pitfall:
            '原子（普通字符）算一个元素。若漏写 `cnt++`，所有原子都不会被计数，' +
            '只剩子表被计数，长度会明显偏小。',
        },
      ],
      defects: [
        {
          kind: '漏计原子',
          find: '        else { (*i)++; cnt++; }',
          replace: '        else { (*i)++; }',
          why:
            '原子分支漏掉了 `cnt++`，于是只有子表被计数、原子全被忽略，' +
            '凡是含原子的广义表长度都偏小。',
          pitfall:
            '广义表的原子（普通元素）也要计一次数。' +
            '漏掉这个 `cnt++` 会让 (a,b) 从 2 变成 0，错误非常直观但容易在递归里被忽略。',
        },
        {
          kind: '把逗号当元素',
          find: "        else if (s[*i] == ',') { (*i)++; }",
          replace: "        else if (s[*i] == ',') { (*i)++; cnt++; }",
          why:
            '逗号只是**分隔符**，不该计数。改成了 `cnt++` 后，每遇到一个逗号就多算一个元素，长度偏大。',
          pitfall:
            '广义表的长度是「第一层的元素个数」，`、` 分隔符不计入。' +
            '把逗号也 `cnt++` 会让 (a,b) 从 2 变成 3。',
        },
      ],
      asks: [
        { label: '(a,(b,c),d) 的长度', answer: '3' },
        { label: '((a,b),(c)) 的长度', answer: '2' },
        { label: '(a) 的长度', answer: '1' },
        { label: '广义表深度的含义', answer: '嵌套括号的最大层数' },
        { label: '求长度的时间复杂度（用串长 n 表示）', answer: 'O(n)' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n)线性', 'O(长度)'],
      notes: {
        idea:
          '广义表的长度 = 第一层元素的个数。用字符串表示时，第一层元素由逗号分隔，' +
          '每个元素可以是一个原子（一个字符）或一个子表（一对括号及其内部）。' +
          '遇到 `(` 递归进入子表（内部全部算作该子表这一个元素），遇到原子计数，遇到 `,` 跳过。',
        steps: [
          '外层从位置 1（跳过最外层左括号）开始解析。',
          '遇到原子字符：`cnt++`，`i` 前进。',
          '遇到 `(`：进入子表，递归 glLength 跳过其内部，`cnt++`（子表整体一个元素）。',
          '遇到 `,`：只是分隔符，`i` 前进，不计数。',
          '★ 长度只数第一层，子表内部元素不计入长度（但计入深度）。',
        ],
        complexity:
          '每个字符被访问一次（递归也只是线性扫描括号结构），时间 O(n)，空间 O(d)（d 为嵌套深度，递归栈）。',
        pitfalls: [
          '长度只数**第一层**元素，子表内部不算入长度。',
          '`(` 子表整体算一个元素，只 `cnt++` 一次。',
          '`,` 是分隔符，不计数。',
          '递归调用主要为跳过子表内部，外层计数是一次。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '从位置 1（跳过外层左括号）开始。',
            '遇到原子计一次数，遇到 `(` 递归子表后整体计一次数，遇到 `,` 跳过。',
            '数完第一层所有元素，得到长度。',
          ],
        },
        code_completion: {
          steps: [
            '空位 1 是「遇 `(` 子表整体算一个元素」的分支。',
            '空位 2 是「遇原子计数」的分支。',
            '核对 (a,(b,c),d) 得 3。',
          ],
        },
        ds_debug: {
          steps: [
            '明确长度 = 第一层元素个数，子表整体算一个，逗号不计数。',
            '用 (a,(b,c),d) 手工跑得 3。',
            '对比漏 `cnt++`（原子不计数）与逗号 `cnt++`（多计分隔符）。',
          ],
        },
        complexity_analysis: {
          idea:
            '求广义表长度只需线性扫描括号结构，每个字符处理一次，故 O(n)。' +
            '空间是递归深度，最坏为嵌套深度 d，O(d)。',
        },
      },
    },
  ],
};
