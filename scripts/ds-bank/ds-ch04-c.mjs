// ds-ch04 串/数组/广义表 第 3 批（3 个 entry）。规则同 ds-ch04.mjs：每 code entry 派生 7 道。
// 已知坑：knowledgeIds 与 tags 必须是数组；concept 素材放 entry 级 notes。
export default {
  shard: 'ds-ch04',
  chapter: '第4章 串、数组和广义表',
  category: 'ds',
  source: '自撰（依据《数据结构》第4章 串、数组和广义表 知识点体系）',
  entries: [
    {
      key: 'kmp-match',
      cxaStem: '阅读下面的 KMP 模式匹配程序，回答下列问题。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['KMP', '模式匹配', 'next数组', '主串不回溯'],
      knowledgeIds: ['ds-ch04-08', 'ds-ch04-09', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static void getNext(const char *t, int next[]) {
    int i = 0, j = -1, m = strlen(t);
    next[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }
        else j = next[j];
    }
}
static int kmp(const char *s, const char *t) {
    int next[MAXS], i = 0, j = 0, n = strlen(s), m = strlen(t);
    getNext(t, next);
    if (m == 0) return 0;
    while (i < n && j < m) {
        if (j == -1 || s[i] == t[j]) { i++; j++; }
        else j = next[j];
    }
    return (j == m) ? i - m : -1;
}
int main(void) {
    char s[MAXS], t[MAXS];
    scanf("%s %s", s, t);
    printf("首次匹配位置 = %d\\n", kmp(s, t));
    return 0;
}`,
      stem: '用 KMP 算法（先求 next 再匹配）找出模式串 t 在主串 s 中首次出现的下标（从 0 计），找不到返回 -1。',
      inputs: [
        { stdin: 'ababcababc abcab\n', note: 't 长 5，首次出现于下标 2。', why: '用 next 匹配，主串指针不回溯，首现位置 2。' },
        { stdin: 'aaaaab aab\n', note: 't= 在 s 下标 3。', why: 'KMP 用 next 跳，首现 3。' },
        { stdin: 'abc def\n', note: 't 不在 s 中，返回 -1。', why: '匹配失败，返回 -1。' },
        { stdin: 'hello lo\n', note: 't=lo 首现于 3。', why: 'KMP 匹配得到 3。' },
      ],
      blanks: [
        {
          find: '        if (j == -1 || s[i] == t[j]) { i++; j++; }',
          accepted: ['        if (j == -1 || s[i] == t[j]) { i++; j++; }'],
          hint: 'j==-1 表示模式串指针已到头（需要整体右移一步），或当前字符匹配则双指针前进。',
          pitfall: '`j == -1` 这个哨兵条件不能省：当 next 让 j 退到 -1 时，表示「模式串开头都不匹配」，此时 s[i] 抛弃、i 前进、j 归 0。★ 少了这个条件，j 永远 >=0，碰到 t[0] 都不匹配的情况会死循环或越界。',
        },
        {
          find: '        else j = next[j];\n    }\n    return (j == m) ? i - m : -1;',
          accepted: ['        else j = next[j];'],
          hint: '失配时主串指针 i 不回退，只把模式串指针 j 退到 next[j]。',
          pitfall: 'KMP 的核心是「失配时 j 退到 next[j]」而不是 j=0。★ 写成 `j = 0` 就退化成 BF（但主串指针仍不回退），输出结果在多数输入仍正确，只有遇到「部分匹配后失配」的串才会错 —— 这是 KMP 与 BF 的分水岭。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        if (j == -1 || s[i] == t[j]) { i++; j++; }',
          replace: '        if (j == -1 || s[i] != t[j]) { i++; j++; }',
          why: '匹配条件从相等改成不相等。于是「字符不相等时才前进」，匹配逻辑完全颠倒，几乎每次都在错误位置前进，返回位置全部错误。',
          pitfall: 'KMP 匹配是「字符相等才同时推进」。写成 `!=` 把匹配判成反向，程序照样跑完、不崩，但返回的匹配位置全错。★ 最隐蔽的是：当 t 的首字符恰好也不匹配而 s 又很长时，结果看起来像是「没找到」，只有拿正确答案核对才发现是符号写反。',
        },
        {
          kind: '赋值顺序错误',
          find: '        else j = next[j];\n    }\n    return (j == m) ? i - m : -1;',
          replace: '        else j = next[j];\n    }\n    return (j == m) ? i - m + 1 : -1;',
          why: '失配回退时把 next[j] 加 1，模式串指针多退一步，跳过了一个本可以复用的前缀。',
          pitfall: 'next[j] 已定义好「失配时 j 应退到的下标」。写成 next[j]+1 就多退一步。★ 这个 bug 不崩、不超时，输出「要么错位要么 -1」，最容易在「模式串有较长公共前后缀」时（如 abab 这类）暴露。',
        },
      ],
      asks: [
        { label: 'KMP 中失配时 i（主串指针）是否回退', answer: '不回退', unit: '' },
        { label: 's=aaaaab t=aab 首次匹配位置', answer: '3', unit: '' },
        { label: 'next 数组里 next[0] 的值', answer: '-1', unit: '' },
        { label: 't=ababc 时 KMP 比 BF 快的主要原因是', answer: '主串不回溯', unit: '' },
        { label: 't=abc 在 s=abc 中匹配位置', answer: '0', unit: '' },
      ],
      complexity: 'O(n+m)',
      complexityAccepted: ['O(n+m)', 'O(n)', 'O(m+n)', 'O(n)'],
      notes: {
        idea: 'KMP 用 next 数组记录模式串每个位置失配时应回退到哪，从而让主串指针永不回溯，把最坏 O(n×m) 降到 O(n+m)。',
        steps: [
          '先求 next 数组（next[0]=-1，递推）。',
          '匹配时 i、j 前进；失配且 j!=-1 时 j=next[j]。',
          'j==m 说明匹配成功，返回 i-m。',
        ],
        complexity: 'getNext 与主要匹配各线性扫描一次，O(n+m)。',
        pitfalls: [
          '失配不进 i，只退 j —— 这是 KMP 与 BF 的本质区别。',
          'j==-1 哨兵不能省略。',
          'next 数组有两种差 1 定义（表长度 vs 表长度+1），实现要与匹配处一致。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入主串 s 与模式 t。',
            '先 getNext 求 next。',
            'kmp 用 next 匹配，输出首现位置。',
          ],
        },
        complexity_analysis: {
          steps: [
            'getNext 线性 O(m)。',
            'kmp 匹配线性 O(n)。',
            '总 O(n+m)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查匹配条件（==）与失配回退（next[j]）。',
            '修正后得到正确首现位置。',
          ],
        },
      },
    },
    {
      key: 'gl-depth',
      cxaStem: '阅读下面的广义表深度计算程序，回答下列问题。',
      section: '4.6 广义表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['广义表', '深度', '递归', '表头表尾'],
      knowledgeIds: ['ds-ch04-19', 'ds-ch04-22', 'ds-ch04-23'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static int depth(const char *s, int *i) {
    int maxd = 0, d = 0;
    while (s[*i] != '\\0' && s[*i] != ')') {
        if (s[*i] == '(') { (*i)++; d = depth(s, i) + 1; }
        else if (s[*i] == ',') { (*i)++; d = 0; }
        else { (*i)++; d = 0; }
        if (d > maxd) maxd = d;
    }
    if (s[*i] == ')') (*i)++;
    return maxd;
}
int main(void) {
    char g[MAXS];
    scanf("%s", g);
    int i = 0;
    int dep = depth(g, &i);
    printf("深度 = %d\\n", dep);
    return 0;
}`,
      stem: '按「广义表深度 = 括号嵌套层数」递归地求一个广义表串（如 (a,(b,c)) ）的深度。读入后输出深度。',
      inputs: [
        { stdin: '(a,(b,c),d)\n', note: '深度 2。', why: '最内层括号 (b,c) 包在 (…,…) 里，共 2 层。' },
        { stdin: '((a,b),(c,(d,e)))\n', note: '深度 3。', why: '最深层 (d,e) 前还有一层嵌套，共 3。' },
        { stdin: '(a,b)\n', note: '深度 1。', why: '只有一层括号。' },
        { stdin: 'a\n', note: '单个原子，深度 0。', why: '没有括号，按定义原子深度为 0。' },
      ],
      blanks: [
        {
          find: '        if (s[*i] == \'(\') { (*i)++; d = depth(s, i) + 1; }',
          accepted: ['        if (s[*i] == \'(\') { (*i)++; d = depth(s, i) + 1; }'],
          hint: '遇左括号进入下一层，递归返回后 +1。',
          pitfall: '深度递归是「遇到左括号就加一层」。★ 写成 `d = depth(s,i)`（忘 +1）会把所有层数少算 1；但原子表 a 的深度会算成 0 而正确也是 0，所以「单层」与「无括号」的用例都测不出，只有嵌套 ≥2 层才暴露 —— 这正是用递减不递增的递归容易错的点。',
        },
        {
          find: '        else if (s[*i] == \',\') { (*i)++; d = 0; }',
          accepted: ['        else if (s[*i] == \',\') { (*i)++; d = 0; }'],
          hint: '逗号是兄弟分隔，跳出当前子表后把本层计数清零。',
          pitfall: '逗号表示「同一层的新子表」，当前层深度计数要清零重新计。★ 不把 d 清零，会让同一层的多个子表深度「叠加」，把深度算大（如 (a,(b),c) 会被算成 3 而正确是 2）。',
        },
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: '    while (s[*i] != \'\\0\' && s[*i] != \')\') {',
          replace: '    while (s[*i] != \'\\0\') {',
          why: '循环条件丢了「遇到右括号就停」的分支。遇到 ) 时不再退出，而继续把 ) 当普通字符处理，右括号本身被计入深度或使递归永不返回，结果错乱。',
          pitfall: '递归处理子表时，遇到右括号表示「本层结束」，必须退出并返回。★ 少了 `s[*i] != \')\'` 这个退出条件，遇到 ) 后 s[*i] 变成当前层的 `)`，跳过它继续读，深度和结果都会错；在嵌套表上还可能读到表尾之后的 \'\\0\' 而误判最深。',
        },
        {
          kind: '条件判断错误',
          find: '        else if (s[*i] == \',\') { (*i)++; d = 0; }',
          replace: '        else if (s[*i] == \',\') { (*i)++; d = depth(s, i); }',
          why: '遇逗号时把 d 设为递归深度而不是清零。这样每个逗号都会重新递归，把后面的子表深度与前面叠加，深度被严重放大且递归路径混乱。',
          pitfall: '逗号只是分隔符，作用是「结束当前子表、开始下一个兄弟」，本层计数应清零。★ 写成递归会让程序在嵌套表上重复进入同一子表，输出深度远超实际，甚至可能因重复递归而指数膨胀（虽然这里 i 会前进、不会死循环，但深度值必然错）。',
        },
      ],
      asks: [
        { label: '(a,(b,c),d) 的深度', answer: '2', unit: '' },
        { label: '((a,b),(c,(d,e))) 的深度', answer: '3', unit: '' },
        { label: '单个原子 a 的深度', answer: '0', unit: '' },
        { label: '广义表深度等于括号的', answer: '最大嵌套层数', unit: '' },
        { label: '逗号在深度计算中的作用是', answer: '分隔兄弟子表', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(length)', 'O(n) 线性'],
      notes: {
        idea: '广义表的深度 = 括号的最大嵌套层数，适合递归：遇到左括号进入下一层并 +1，逗号清零进入兄弟，右括号返回。',
        steps: [
          '从 i=0 出发，递归扫描。',
          '遇到 ( 进一层 depth+1；遇到 , 清零 d 处理兄弟；其他原子 d=0。',
          '每层取 maxd，遇 ) 返回。',
        ],
        complexity: '每个字符只处理一次，O(n)。',
        pitfalls: [
          '原子深度为 0，一层括号深度 1。',
          '逗号必须清零当前层计数，否则同层子表叠加。',
          '遇右括号必须退出，否则越界。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入广义表串 g。',
            '从下标 0 递归调用 depth。',
            '输出最大嵌套层数。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每个字符恰好被访问一次。',
            '递归深度等于最大层数，总 O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查循环退出条件与逗号清零逻辑。',
            '修正后得到正确深度。',
          ],
        },
      },
    },
    {
      key: 'substr-op',
      cxaStem: '阅读下面的求子串程序，回答下列问题。',
      section: '4.1 串的定义与存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['串', '子串', 'SubString', '定位'],
      knowledgeIds: ['ds-ch04-11', 'ds-ch04-04', 'ds-ch04-05'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static int subStr(char *sub, const char *s, int pos, int len) {
    int n = strlen(s), i;
    if (pos < 1 || pos > n) return 0;
    if (len < 0 || pos + len - 1 > n) return 0;
    for (i = 0; i < len; i++) sub[i] = s[pos - 1 + i];
    sub[len] = '\\0';
    return 1;
}
int main(void) {
    char s[MAXS], sub[MAXS];
    int pos, len;
    scanf("%s %d %d", s, &pos, &len);
    if (subStr(sub, s, pos, len)) printf("子串 = %s\\n", sub);
    else printf("越界\\n");
    return 0;
}`,
      stem: '从串 s 的第 pos 个字符起取 len 个字符组成子串（pos 从 1 计，s 下标从 0 计）。若 pos 或 len 越界返回 0 并输出「越界」，否则输出子串。',
      inputs: [
        { stdin: 'hello 2 3\n', note: '从第 2 个取 3 个 = ell。', why: 'pos=2、len=3，s[1..3] 为 ell。' },
        { stdin: 'abcdef 1 6\n', note: '整个串。', why: 'pos=1、len=6 正好取全。' },
        { stdin: 'hello 4 2\n', note: 'lo。', why: 's[3..4] 为 lo。' },
        { stdin: 'hello 0 2\n', note: 'pos=0 越界。', why: 'pos 从 1 计，0 非法返回 0。' },
        { stdin: 'hello 3 10\n', note: 'len 超出串尾越界。', why: 'pos+len-1=12>n=5 返回 0。' },
      ],
      blanks: [
        {
          find: '    if (pos < 1 || pos > n) return 0;',
          accepted: ['    if (pos < 1 || pos > n) return 0;'],
          hint: 'pos 从 1 起，必须落在 [1,n]。',
          pitfall: '教材里 SubString 的 pos 从 1 计。★ 写成 `pos < 0` 会把 pos=0 也放行，然后用 s[-1] 越界读。pos 从 1 起且不能超过串长 n，都必须检查。',
        },
        {
          find: '    for (i = 0; i < len; i++) sub[i] = s[pos - 1 + i];',
          accepted: ['    for (i = 0; i < len; i++) sub[i] = s[pos - 1 + i];'],
          hint: 's 下标从 0 计，而 pos 从 1 计，故起始下标注 pos-1。',
          pitfall: '把「pos 从 1 计」与「下标从 0 计」对上：s 的第 pos 个字符在 s[pos-1]。★ 忘减 1（写成 s[pos+i]）会让子串整体右移一位且末字符越界；这是求子串/定位题最经典的差一错误。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (pos < 1 || pos > n) return 0;',
          replace: '    if (pos < 0 || pos > n) return 0;',
          why: '越界判断的 pos 下界从 1 改成了 0。于是 pos=0 被放行，随后 s[pos-1]=s[-1] 越界读，结果不定。',
          pitfall: 'pos 从 1 计，所以下界是 1 而不是 0。★ 写成 pos<0 会让「pos=0」通过检查，接着 s[-1] 越界——通常不会立即崩溃（读的是栈上相邻垃圾），输出一个奇怪子串，只有输入 pos=0 才暴露。',
        },
        {
          kind: '循环边界错误',
          find: '    for (i = 0; i < len; i++) sub[i] = s[pos - 1 + i];',
          replace: '    for (i = 0; i < len; i++) sub[i] = s[pos + i];',
          why: '复制下标从 s[pos+i] 开始，整体右移一位，子串首字符取错且可能越界。',
          pitfall: 'pos 从 1 计、s 下标从 0 计，起始下标是 pos-1。写成 pos+i 会「从下一个字符开始取」，子串内容整体偏移。★ 在 pos=1、len 恰够时不越界、输出就从第 2 个字符开始（少 1 个），极易被误认为是正常子串。',
        },
      ],
      asks: [
        { label: 'hello 的第 2 到第 4 个字符（pos=2,len=3）的子串', answer: 'ell', unit: '' },
        { label: 'subStr 里 s 的起始下标注为', answer: 'pos-1', unit: '' },
        { label: 'pos 的合法取值范围是', answer: '1到n', unit: '' },
        { label: 'abcdef 取 pos=1,len=6 的子串', answer: 'abcdef', unit: '' },
        { label: 'subStr 成功时返回', answer: '1', unit: '' },
      ],
      complexity: 'O(len)',
      complexityAccepted: ['O(len)', 'O(n)', 'O(len) 线性'],
      notes: {
        idea: '求子串 SubString：从第 pos 个字符起取 len 个。关键在于 pos 从 1 计而 C 下标从 0 计，要取 s[pos-1+i]。',
        steps: [
          '检查 pos（1..n）与 len（0..n-pos+1）是否合法。',
          '从 s[pos-1] 起复制 len 个到 sub，并补 \\0。',
          '成功返回 1，越界返回 0。',
        ],
        complexity: '复制 len 个字符，O(len)。',
        pitfalls: [
          'pos 从 1 计，s 下标从 0 计。',
          '必须检查 pos 与 len 的上/下界，否则越界。',
          '子串必须补结束符 \\0。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 s、pos、len。',
            '检查越界。',
            '复制子串并输出。',
          ],
        },
        complexity_analysis: {
          steps: [
            '只复制 len 个字符。',
            'O(len)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查 pos 下界与复制下标。',
            '修正后得到正确子串。',
          ],
        },
      },
    },
  ],
}
