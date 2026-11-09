// ds-ch04 串/数组/广义表 第 2 批（3 个 entry）。
// 写库规则（与 ds-ch04.mjs 一致）：
//   每个带 code 的 entry 派生 7 道：code_reading×2 + code_completion + ds_debug + multi_bug_debug + complexity_analysis×2。
//   code 必须 ≤40 物理行、-std=c99 -Wall -Wextra 零警告；expected 由生成器实跑得到，不手工写。
//   defects 的错误版必须「能跑完且输出与正确版不同」（不崩、不死循环、不超大输出 20s）。
//   blanks 的 find 必须在 code 中恰好一次；defects 的 find 两两不重叠。
//   概念题（code:''）素材一律写在 entry 级 notes，term 子对象里别再放 notes。
export default {
  shard: 'ds-ch04',
  chapter: '第4章 串、数组和广义表',
  category: 'ds',
  source: '自撰（依据《数据结构》第4章 串、数组和广义表 知识点体系）',
  entries: [
    {
      key: 'slen-strcmp',
      cxaStem: '阅读下面的串基本运算程序，回答下列问题。',
      section: '4.1 串的定义与存储结构',
      difficulty: 2,
      bloom: 'apply',
      tags: ['串', '求长', '比较', '字符串'],
      knowledgeIds: ['ds-ch04-11', 'ds-ch04-05', 'ds-ch04-01'],
      code: `#include <stdio.h>
#define MAXS 100
static int sLen(const char *s) {
    int n = 0;
    while (s[n] != '\\0') n++;
    return n;
}
static int sCmp(const char *a, const char *b) {
    int i = 0;
    while (a[i] != '\\0' && b[i] != '\\0') {
        if (a[i] != b[i]) return a[i] - b[i];
        i++;
    }
    return a[i] - b[i];
}
int main(void) {
    char a[MAXS], b[MAXS];
    scanf("%s %s", a, b);
    int la = sLen(a), lb = sLen(b), c = sCmp(a, b);
    printf("a=%d b=%d 比较=%d\\n", la, lb, c);
    return 0;
}`,
      stem: '补全串的长度与比较函数，使其分别返回串长与两个串的字典序差（a<b 为负、a==b 为 0、a>b 为正）。',
      inputs: [
        { stdin: 'hello world\n', note: 'a 短 b 长，a<b。', why: '长度 5 vs 5，第一个字符 h 与 w 比较得负值。' },
        { stdin: 'abc abb\n', note: '第三个字符 c 与 b 不相等的正差。', why: '前两个相同，第三个 c>b 返回正。' },
        { stdin: 'same same\n', note: '完全相等，比较=0。', why: '逐字符相等，末尾同时到 \\0，返回 0。' },
        { stdin: 'z a\n', note: '首字符 z 远大于 a。', why: '第一个字符即返回大差。' },
        { stdin: 'abc abcd\n', note: 'a 是 b 的前缀，a 先到 \\0。', why: 'a=3 b=4，循环到 a 的 \\0 退出，比较=0-字符 d 的值 <0。' },
      ],
      blanks: [
        {
          find: '        if (a[i] != b[i]) return a[i] - b[i];',
          accepted: ['        if (a[i] != b[i]) return a[i] - b[i];'],
          hint: '查第一个不相同的位置，返回字符差。',
          pitfall: '比较函数必须返回两个具体字符的差（大于 0 / 小于 0），而不是返回 1 或 -1 —— 题目要求字典序「差」，不是「符号」。用 unsigned char 转一下更稳妥（字符可能 >127），这里用简单写法。',
        },
        {
          find: '    return a[i] - b[i];',
          accepted: ['    return a[i] - b[i];'],
          hint: '循环退出时 i 指向第一个差一位（或同为结束符）。',
          pitfall: '当两个串前缀完全相同、其中一个先结束（a[i]==\\0 而 b[i]!=0）时，循环退出，此时 a[i]-b[i] 是负数，恰好正确表示 a<b。★ 别写成 return 0，那样「abc」与「abcd」会被判成相等。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    return a[i] - b[i];',
          replace: '    return b[i] - a[i];',
          why: '最终返回的字符差从 a[i]-b[i] 写成 b[i]-a[i]，即把「字典序比较结果」的符号整个颠倒。a<b 的串会被判成 a>b。',
          pitfall: '两个串比较，返回值的符号必须与字典序一致（a<b 为负、a>b 为正）。写成 b[i]-a[i] 就把正负颠倒。★ 对「不相等」的串输出全部错号，但对「相等」的串因为差为 0 仍返回 0、看不出问题 —— 这正是「从输出只能看出以往对的例子」的陷阱。',
        },
        {
          kind: '条件判断错误',
          find: '        if (a[i] != b[i]) return a[i] - b[i];',
          replace: '        if (a[i] == b[i]) return a[i] - b[i];',
          why: '判断从「不相等」改成「相等」。于是每次遇到相同的字符就提前返回，比较的结果完全错误：只有第一个字符相同才可能继续，第一个字符相同与否直接决定返回 0 或差值。',
          pitfall: '比较函数的核心是「找到第一个不相等的位置再返回差距」。写成 `==` 就把逻辑颠倒成「找到第一个相等的位置就返回」，这对绝大多数输入都立刻给出错误结果。★ 不改循环、不崩，程序照样跑完，但比较值全错，必须代入几个串逐一核对。',
        },
      ],
      asks: [
        { label: 'a=hello b=world 时 sCmp 返回的符号', answer: '负', unit: '' },
        { label: 'a=abc b=abb 时 sCmp 返回 a[i]-b[i] 的具体值', answer: '1', unit: '' },
        { label: '比较函数 sCmp 最多会访问 a 的第几个元素（当 a 是 b 前缀时）', answer: 'i+1', unit: '个' },
        { label: 'sLen("hello") 返回', answer: '5', unit: '' },
        { label: '当 a="abc"、b="abcd" 时 sCmp 返回的符号', answer: '负', unit: '' },
      ],
      complexity: 'O(len(a)+len(b))',
      complexityAccepted: ['O(n)', 'O(m+n)', 'O(len(a)+len(b))', 'O(n) 线性'],
      notes: {
        idea: '串是字符的有限序列，求长与比较是两种最基本的串运算。求长是逐个累计直到结束符；比较是逐字符取字典序差。',
        steps: [
          'sLen 从下标 0 起，遇到 \\0 停止，返回计数 n。',
          'sCmp 同时前进、比较 a[i] 与 b[i]，第一个不同位置返回 char 差。',
          '若某个串先到结束符，则返回 `a[i]-b[i]`（较短的为负）。',
        ],
        complexity: 'sLen 与 sCmp 都是线性扫描，O(串长)。',
        pitfalls: [
          '比较返回的是字符差（具体数值），不是 -1/0/1。',
          '一个串是另一个前缀时，靠「先到 \\0 的那个返回负」来体现字典序。',
          '字符可用 unsigned char 转一下避免负数扩展歧义（超过 127 的字符）。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '程序先读入两个串 a、b。',
            'sLen 逐个累加得到各自长度。',
            'sCmp 逐字符比较，第一个不同位置返回差，全同则返回 a[i]-b[i]。',
          ],
        },
        complexity_analysis: {
          steps: [
            'sLen(a) 与 sLen(b) 各线性扫描一次。',
            'sCmp 最坏扫描到较短串的长度。',
            '总复杂度 O(len(a)+len(b))。',
          ],
        },
        ds_debug: {
          steps: [
            '找 sLen 与 sCmp 两处循环的条件问题。',
            '修正循环边界与字符相等判断。',
          ],
        },
      },
    },
    {
      key: 'array-addr',
      cxaStem: '阅读下面的数组地址计算程序，回答下列问题。',
      section: '4.3 数组的顺序存储与地址计算',
      difficulty: 2,
      bloom: 'apply',
      tags: ['数组', '行主序', '地址计算', '一维下标'],
      knowledgeIds: ['ds-ch04-12', 'ds-ch04-02', 'ds-ch04-13'],
      code: `#include <stdio.h>
int main(void) {
    int rows, cols;
    scanf("%d %d", &rows, &cols);
    int base;
    scanf("%d", &base);
    int i, j;
    scanf("%d %d", &i, &j);
    int off = i * cols + j;
    int addr = base + off * sizeof(int);
    printf("下标= %d 地址= %d\\n", off, addr);
    return 0;
}`,
      stem: '按行主序（row-major）计算二维数组 a[rows][cols] 中元素 a[i][j] 的一维下标的偏移与内存地址。',
      inputs: [
        { stdin: '3 4\n100\n1 2\n', note: '行主序 a[1][2] 偏移 6、地址 124。', why: '1*4+2=6，100+6*4=124。' },
        { stdin: '3 4\n100\n0 0\n', note: '首元素偏移 0、地址 base。', why: '0*4+0=0，100+0=100。' },
        { stdin: '4 4\n200\n3 3\n', note: '末元素偏移 15、地址 260。', why: '3*4+3=15，200+60=260。' },
        { stdin: '2 5\n50\n1 4\n', note: '偏移 9、地址 86。', why: '1*5+4=9，50+36=86。' },
      ],
      blanks: [
        {
          find: '    int off = i * cols + j;',
          accepted: ['    int off = i * cols + j;'],
          hint: '行主序时，先跳过 i 整行（每行 cols 个），再在本行内前进 j 个。',
          pitfall: '行主序一维下标 = i*cols + j（第 i 行前面有 i 整行、每行 cols 个）。★ 列主序则是 j*rows + i，两者不可混。写成一维下标公式时最容易把 rows/cols 用反。',
        },
        {
          find: '    int addr = base + off * sizeof(int);',
          accepted: ['    int addr = base + off * sizeof(int);'],
          hint: '地址 = 基址 + 偏移 × 单个元素字节数。',
          pitfall: '每个 int 占 sizeof(int)（通常 4）字节，偏移必须乘它才是字节偏移。★ 别漏乘 sizeof(int)，否则地址完全错误（这是数组地址题最常犯的错）。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    int off = i * cols + j;',
          replace: '    int off = j * rows + i;',
          why: '把行主序算成了列主序。对不是方阵（rows≠cols）且 i≠j 的元素，偏移完全不同。',
          pitfall: '行主序用 cols，列主序用 rows。★ 当 rows==cols（方阵）且 i、j 取任意值时两者不一定相同：对非对角元素 j*rows+i ≠ i*cols+j。' ,
        },
        {
          kind: '赋值顺序错误',
          find: '    int addr = base + off * sizeof(int);',
          replace: '    int addr = base + off;',
          why: '地址公式漏乘了 sizeof(int)，把元素个数当成字节偏移，地址错误。',
          pitfall: '基址是按字节数给的首元素地址，所以偏移必须是「元素个数 × 单个元素字节数」。★ 漏乘 sizeof(int) 是最隐蔽的地址题错误：程序不崩、输出是个整数，但数值与真实地址差一个倍数。',
        },
      ],
      asks: [
        { label: 'rows=3 cols=4 时 a[1][2] 的一维偏移', answer: '6', unit: '' },
        { label: 'base=100 时 a[1][2] 的字节地址（int 4 字节）', answer: '124', unit: '' },
        { label: 'rows=4 cols=4 时 a[3][3] 的一维偏移', answer: '15', unit: '' },
        { label: 'a[rows][cols] 中偏移为 0 的元素', answer: 'a[0][0]', unit: '' },
        { label: '行主序公式里乘的是', answer: 'cols', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', '常数', 'O(1) 常数'],
      notes: {
        idea: '二维数组按行主序存储时，a[i][j] 与一维下标 `i*cols+j` 一一对应；地址 = 基址 + 偏移 × sizeof(元素)。',
        steps: [
          '读入行列数 rows、cols 与基址 base 和目标下标 i、j。',
          '计算一维偏移 off = i*cols + j。',
          '计算字节地址 addr = base + off*sizeof(int)。',
        ],
        complexity: 'O(1)，只做常数次算术。',
        pitfalls: [
          '行主序乘 cols，列主序乘 rows，不可混。',
          '地址偏移必须乘以 sizeof(int)。',
          '下标从 0 数起才有「前 i 行共 i 行」的说法；若题目下标从 1 计要调整。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 rows、cols、base 以及目标 i、j。',
            '按行主序算一维偏移 off=i*cols+j。',
            '算地址 base+off*sizeof(int)。',
          ],
        },
        complexity_analysis: {
          steps: [
            '只做固定次数的乘加。',
            '与数组规模无关，O(1)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查行主序公式与地址是否漏乘字节数。',
            '修正后得到正确偏移与地址。',
          ],
        },
      },
    },
    {
      key: 'sym-press',
      cxaStem: '阅读下面的对称矩阵压缩存储程序，回答下列问题。',
      section: '4.4 特殊矩阵的压缩存储',
      difficulty: 3,
      bloom: 'apply',
      tags: ['特殊矩阵', '对称矩阵', '下三角', '压缩存储'],
      knowledgeIds: ['ds-ch04-15', 'ds-ch04-16', 'ds-ch04-03'],
      code: `#include <stdio.h>
#define N 4
static int get(const int *a, int i, int j) {
    if (i < j) { int t = i; i = j; j = t; }
    int k = i * (i + 1) / 2 + j;
    return a[k];
}
int main(void) {
    int a[N * (N + 1) / 2];
    int i, j;
    for (i = 0; i < N * (N + 1) / 2; i++) a[i] = i + 1;
    scanf("%d %d", &i, &j);
    int v = get(a, i, j);
    printf("a[%d][%d]=%d\\n", i, j, v);
    return 0;
}`,
      stem: '把 N×N 对称矩阵只存下三角，用一维数组 a 按「行优先存储下三角」压缩。求 get(i,j) 返回的值（i、j 均从 0 计）。',
      inputs: [
        { stdin: '1 2\n', note: 'i<j，换算成 a[2][1]，k=2*3/2+1=4，a[4]=5。', why: '对称矩阵 a[1][2]==a[2][1]，下三角下标 k=2*3/2+1=4。' },
        { stdin: '2 2\n', note: '对角元素 k=2*3/2+2=5，a[5]=6。', why: 'i>=j，k=i(i+1)/2+j=3+2=5。' },
        { stdin: '0 3\n', note: 'i<j 换算 a[3][0]，k=3*4/2+0=6，a[6]=7。', why: '交换后 i=3,j=0，k=6+0=6。' },
        { stdin: '3 0\n', note: 'i>=j，k=3*4/2+0=6，a[6]=7。', why: '下三角直接 k=6。' },
      ],
      blanks: [
        {
          find: '    int k = i * (i + 1) / 2 + j;',
          accepted: ['    int k = i * (i + 1) / 2 + j;'],
          hint: '下三角行优先：第 i 行前面有 0..i-1 行，共 1+2+...+i = i(i+1)/2 个，再 +j。',
          pitfall: '0-based 下标下，第 0 行 1 个、第 1 行 2 个……第 i 行前共 i(i+1)/2 个，加上本行内的 j。★ 用 1-based 口径是 k=i(i-1)/2+j，两者差 i，别混。' ,
        },
        {
          find: '    if (i < j) { int t = i; i = j; j = t; }',
          accepted: ['    if (i < j) { int t = i; i = j; j = t; }'],
          hint: '只存下三角，上三角的元素要换成它的对称位置。',
          pitfall: '矩阵对称，a[i][j]==a[j][i]。所以 i<j 时先交换 i、j 把它变成下三角再求 k。★ 不交换会「越界访问」下三角数组（k 可能 ≥ 长度），这里靠交换保证 i>=j。' ,
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (i < j) { int t = i; i = j; j = t; }',
          replace: '    if (i > j) { int t = i; i = j; j = t; }',
          why: '交换条件写成 i>j（本意是 i<j 时把上三角换到下三角）。于是「上三角元素」不被交换，直接按 i(i+1)/2+j 求 k，很多元素算出的 k 落在下三角数组的合法范围之外或取错值。',
          pitfall: '对称矩阵存储的关键是「把上三角映射到对称的下三角位置」。条件写反（i>j 才交换）会让本应映射的元素不映射，得到错误下标。★ 程序不崩、正常返回一个值，但数值与真实对称元素不符，尤其 i<j 时。',
        },
        {
          kind: '循环边界错误',
          find: '    int k = i * (i + 1) / 2 + j;',
          replace: '    int k = i * (i - 1) / 2 + j;',
          why: '把 0-based 下标公式误写成 1-based 公式。第 i 行前应共 i(i+1)/2 个，写成 i(i-1)/2 会少算 i 个，几乎所有元素都取错。',
          pitfall: '下三角「0-based」与「1-based」两套公式差一个 i：0-based 是 i(i+1)/2+j，1-based 是 i(i-1)/2+j。★ 这里下标从 0 计，必须用前者；用后者会对除首行外的一切元素算错。' ,
        },
      ],
      asks: [
        { label: 'N=4 时下三角共存储的元素个数', answer: '10', unit: '' },
        { label: 'a[1][2] 对应的下三角下标 k', answer: '4', unit: '' },
        { label: 'a[2][2] 对应的下三角下标 k', answer: '5', unit: '' },
        { label: 'get 里交换 i、j 的条件是', answer: 'i<j', unit: '' },
        { label: 'a[3][0] 对应的下三角下标 k', answer: '6', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', '常数', 'O(1) 常数'],
      notes: {
        idea: '对称矩阵只存下三角，用一维数组压缩。求 a[i][j] 时，i<j 的用对称元素 a[j][i]，再按 0-based 下三角行优先公式 k=i(i+1)/2+j 取下标。',
        steps: [
          '读入 i、j，若 i<j 交换二者（对称）。',
          '计算下三角下标 k=i(i+1)/2+j。',
          '返回 a[k]。',
        ],
        complexity: 'O(1)，只有一次交换与一次乘除。',
        pitfalls: [
          '0-based 与 1-based 下三角公式差 i。',
          'i<j 时必须先交换，否则越界/取错。',
          '只存下三角省一半空间，但失去 O(1) 随机访问的直观性（要算 k）。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入目标 i、j，先把上三角元素映射到对称下三角。',
            '按 0-based 下三角行优先求 k。',
            '输出 a[k]。',
          ],
        },
        complexity_analysis: {
          steps: [
            'get 只做一次交换与一次乘除。',
            'O(1) 常数时间。',
          ],
        },
        ds_debug: {
          steps: [
            '检查对称交换条件与下三角下标公式。',
            '修正后返回正确压缩值。',
          ],
        },
      },
    },
  ],
}
