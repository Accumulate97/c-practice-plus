// ds-ch04 串/数组/广义表 第 4 批（4 个 entry）。规则同 ds-ch04.mjs。
// 已知坑：knowledgeIds 与 tags 必须是数组；defect1 的 find 不能与 defect0 的替换重叠；find 必须恰好命中一次。
export default {
  shard: 'ds-ch04',
  chapter: '第4章 串、数组和广义表',
  category: 'ds',
  source: '自撰（依据《数据结构》第4章 串、数组和广义表 知识点体系）',
  entries: [
    {
      key: 'kmp-nextval',
      cxaStem: '阅读下面的 nextval 计算程序，回答下列问题。',
      section: '4.2 串的模式匹配（BF 与 KMP）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['KMP', 'nextval', '改进', '模式匹配'],
      knowledgeIds: ['ds-ch04-10', 'ds-ch04-09', 'ds-ch04-01'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static void getNextVal(const char *t, int next[]) {
    int i = 0, j = -1, m = strlen(t);
    next[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) {
            i++; j++;
            next[i] = (t[i] != t[j]) ? j : next[j];
        }
        else j = next[j];
    }
}
int main(void) {
    char t[MAXS];
    int next[MAXS], i, m;
    scanf("%s", t);
    m = strlen(t);
    getNextVal(t, next);
    for (i = 0; i < m; i++) printf("%d%s", next[i], (i == m - 1) ? "\\n" : " ");
    return 0;
}`,
      stem: '按「改进的 nextval」计算模式串 t 的 next 数组（next[0]=-1，t[i]==t[j] 时继承 next[j]），输出全部 m 个值（空格分隔，最后一个带换行）。',
      inputs: [
        { stdin: 'aaaab\n', note: 'nextval 为 -1 -1 -1 -1 3。', why: 't 中前 4 个 a 互相继承，最后 t[4]=b 与 t[3]=a 不等取 next[3]+1=3。' },
        { stdin: 'ababaca\n', note: 'nextval 为 -1 0 -1 0 -1 4 -1。', why: 'a 与 a 继承、b 与 b 继承等，末尾 a 不匹配取 4。' },
        { stdin: 'abcdex\n', note: 'nextval 为 -1 0 0 0 0 0。', why: '无相同前后缀，全部为 0（除 next[0]=-1）。' },
        { stdin: 'ababc\n', note: 'nextval 为 -1 0 -1 0 2。', why: 'ab 前缀在后，c 不匹配前一个 b 取 next[3]+1=2。' },
      ],
      blanks: [
        {
          find: '            next[i] = (t[i] != t[j]) ? j : next[j];',
          accepted: ['            next[i] = (t[i] != t[j]) ? j : next[j];'],
          hint: 'nextval 的关键：若 t[i]==t[j]（当前字符与回退目标相同），则继承 next[j]，否则取 j。',
          pitfall: 'nextval 与 next 的唯一区别就在这一行：当 `t[i] == t[j]` 时，下一步仍要回退到与当前字符相同的位置，白白再比较一次，所以直接继承 `next[j]`。★ 写成 `next[i] = j` 就是普通 next（没改进），对全相同字符的串（如 aaaab）结果不同、也会多做一次无谓回退。',
        },
        {
          find: '        else j = next[j];',
          accepted: ['        else j = next[j];'],
          hint: 't[i] 与 t[j] 不相等时，把 j 退到 next[j] 继续尝试。',
          pitfall: '这个回退逻辑与求 next 完全相同。★ 写错成 `j = 0` 会丢失「部分匹配」信息，使 nextval 计算退化成朴素递推，在含公共前后缀的模式上算错。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '            next[i] = (t[i] != t[j]) ? j : next[j];',
          replace: '            next[i] = (t[i] != t[j]) ? next[j] : j;',
          why: '继承条件写反：t[i]!=t[j] 时反而继承 next[j]，t[i]==t[j] 时取 j。逻辑完全颠倒，nextval 值全部错位。',
          pitfall: 'nextval 的行是「真继承假取 j」。写成反的会让「相同字符」去取 j（退化成 next），而「不同字符」反而继承 next[j]，结果在多数模式上都错。★ 由于不崩、输出仍是整数序列，只有拿正确答案 vs 错答案核对才发现。',
        },
        {
          kind: '循环边界错误',
          find: '    while (i < m - 1) {',
          replace: '    while (i < m) {',
          why: '循环上界从 m-1 改成 m，i 会走到 m-1 之外，越界访问 t[m]（\0 之后）并可能把 next[m] 写进数组。',
          pitfall: '求 next（含 nextval）的循环上界是 `i < m-1`，因为 next 只需要 0..m-1 共 m 个值，而推进是成对的（i++ 与 j++）。★ 写成 i<m 会多算一个 next[m]，越界读写；在严格 -Wall -Wextra 下甚至可能触发未定义行为。',
        },
      ],
      asks: [
        { label: 't=aaaab 的 nextval[4]', answer: '3', unit: '' },
        { label: 't=aaaab 的 nextval[0]', answer: '-1', unit: '' },
        { label: 'nextval 比 next 快的主要原因是', answer: '避免同字符重复回退', unit: '' },
        { label: 't=ababaca 的 nextval[1]', answer: '0', unit: '' },
        { label: 'nextval 比 next 多减少的代价是', answer: '无谓的回退', unit: '' },
      ],
      complexity: 'O(m)',
      complexityAccepted: ['O(m)', 'O(m) 线性', 'O(n)'],
      notes: {
        idea: 'nextval 在求 next 的基础上，当 t[i]==t[j] 时把 next[i] 继承为 next[j]，避免失配后回退到与当前字符相同的、注定再失配的位置，进一步减少比较。',
        steps: [
          'next[0]=-1，i=0、j=-1。',
          'i<m-1 循环，t[i]==t[j] 则 i++、j++，并写 next[i]（相同则继承 next[j]）。',
          '不相等则 j=next[j]。',
        ],
        complexity: '一次线性扫描 O(m)。',
        pitfalls: [
          'nextval 的继承行是 t[i]!=t[j] ? j : next[j]。',
          '循环上界 i<m-1。',
          '对全相同字符串收益最大，对互异串收益为零。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 t。',
            '计算 nextval。',
            '逐项输出。',
          ],
        },
        complexity_analysis: {
          steps: [
            '一次线性扫描。',
            'O(m)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查继承行与循环上界。',
            '修正后得到正确 nextval。',
          ],
        },
      },
    },
    {
      key: 'gl-print',
      cxaStem: '阅读下面的广义表打印程序，回答下列问题。',
      section: '4.6 广义表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['广义表', '打印', '递归', '表头表尾'],
      knowledgeIds: ['ds-ch04-20', 'ds-ch04-22', 'ds-ch04-24'],
      code: `#include <stdio.h>
#include <string.h>
#define MAXS 100
static void printGL(const char *s, int *i) {
    printf("(");
    (*i)++;
    while (s[*i] != '\\0' && s[*i] != ')') {
        if (s[*i] == '(') { printGL(s, i); }
        else { printf("%c", s[*i]); (*i)++; }
        if (s[*i] == ',') { printf(","); (*i)++; }
    }
    printf(")");
    if (s[*i] == ')') (*i)++;
}
int main(void) {
    char g[MAXS];
    int i = 0;
    scanf("%s", g);
    printGL(g, &i);
    printf("\\n");
    return 0;
}`,
      stem: '把广义表串（如 (a,(b,c))）原样递归打印（带括号、子表嵌套）。读入后按广义表格式输出。',
      inputs: [
        { stdin: '(a,(b,c),d)\n', note: '原样输出 (a,(b,c),d)。', why: '递归遇到 ( 进子表，否则打印字符。' },
        { stdin: '((a,b),c)\n', note: '原样输出 ((a,b),c)。', why: '第一项是子表 (a,b)。' },
        { stdin: '(a)\n', note: '原样输出 (a)。', why: '一个单元素表。' },
        { stdin: '( )\n', note: '空表，输出 ()。', why: '遇到 ) 直接闭合。' },
      ],
      blanks: [
        {
          find: '        if (s[*i] == \'(\') { printGL(s, i); }',
          accepted: ['        if (s[*i] == \'(\') { printGL(s, i); }'],
          hint: '遇到左括号表示子表，递归进入并打印。',
          pitfall: '广义表打印是递归结构：遇 ( 递归，遇逗号打印逗号，遇 ) 闭合。★ 递归调用后`(*i)`已被子表内部推进到子表的 `)` 之后，绝不能在这里再手动 `(*i)++`，否则跳过字符导致输出错乱或越界。',
        },
        {
          find: '        else { printf("%c", s[*i]); (*i)++; }',
          accepted: ['        else { printf("%c", s[*i]); (*i)++; }'],
          hint: '普通原子直接打印并前进下标。',
          pitfall: '原子分支要先打印字符再推进下标。★ 只打印不推进（漏 `(*i)++`）会让外层 while 死循环重复打印同一个字符；顺序反了（先 ++ 再打印）则漏字符。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '        if (s[*i] == \'(\') { printGL(s, i); }',
          replace: '        if (s[*i] == \'(\') { printf("%c", s[*i]); (*i)++; }',
          why: '把左括号当普通原子打印（不再递归），子表整体被当作平坦字符输出，嵌套括号全部丢失。',
          pitfall: '广义表的结构性在于递归。★ 若把 `(` 处理成普通字符只打印不递归，输出会丢失所有嵌套结构（如 (a,(b,c)) 变成 (a,(b,c))? 不，是 (a,然后遇到 ( 只打印 ( 再原子... 实际会输出扁平化但保留单个括号的字符序列），逻辑上仍是「括号串」但深度信息丢失 —— 只有遇到嵌套子表才会表现出与正确结果的差异。',
        },
        {
          kind: '赋值顺序错误',
          find: '        if (s[*i] == \',\') { printf(","); (*i)++; }',
          replace: '        if (s[*i] == \',\') { printf(","); }',
          why: '打印逗号后忘了推进下标，外层 while 会卡在同一个逗号上死循环。',
          pitfall: '分隔逗号打印后必须推进下标（`(*i)++` 在 `if` 内），否则 while 条件 `s[*i] != \',\'` 永远不成立、死循环。★ 这类「打印了但没推进下标」的 bug 在递归遍历里最常见，输出前几个字符后卡住。',
        },
      ],
      asks: [
        { label: '(a,(b,c),d) 的打印结果', answer: '(a,(b,c),d)', unit: '' },
        { label: '空表 () 的打印结果', answer: '()', unit: '' },
        { label: 'printGL 遇到 ( 时做了什么', answer: '递归', unit: '' },
        { label: '子表打印完后 (*i) 指向', answer: '子表右括号之后', unit: '' },
        { label: '打印逗号后必须', answer: '推进下标', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      notes: {
        idea: '广义表的括号结构天然适合递归打印：遇 ( 递归进入子表，原子直接打印，逗号分隔，) 闭合返回。',
        steps: [
          '打印左括号并前进。',
          '循环：遇 ( 递归；原子打印并前进；遇 , 打印并前进。',
          '打印右括号，遇 ) 前进返回。',
        ],
        complexity: '每个字符处理一次，O(n)。',
        pitfalls: [
          '递归调用后勿再手动推进下标。',
          '打印逗号后必须前进下标。',
          '右括号闭合是递归的边界。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 g。',
            '递归打印。',
            '输出换行。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每字符一次。',
            'O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查递归与下标推进。',
            '修正后正确打印。',
          ],
        },
      },
    },
    {
      key: 'rowmajor-addr',
      cxaStem: '阅读下面的二维数组行主序地址计算程序，回答下列问题。',
      section: '4.3 数组的顺序存储与地址计算',
      difficulty: 2,
      bloom: 'apply',
      tags: ['数组', '行主序', '地址', 'LOC'],
      knowledgeIds: ['ds-ch04-13', 'ds-ch04-14', 'ds-ch04-01'],
      code: `#include <stdio.h>
int main(void) {
    int rows, cols, i, j, base, esize;
    scanf("%d %d %d %d %d", &rows, &cols, &base, &esize, &i);
    scanf("%d", &j);
    int addr = base + (i * cols + j) * esize;
    printf("LOC = %d\\n", addr);
    return 0;
}`,
      stem: '按「行主序」计算二维数组 a[rows][cols] 中元素 a[i][j] 的存储地址：LOC = base + (i*cols + j) * esize。base 为首地址、esize 为每个元素字节数。输出 LOC。',
      inputs: [
        { stdin: '3 4 100 2 1 2\n', note: 'a[1][2]，LOC=100+(1*4+2)*2=112。', why: '行主序，第 1 行第 2 列，前面 6 个元素 ×2 字节。' },
        { stdin: '3 4 100 2 0 0\n', note: 'a[0][0]，LOC=100。', why: '行首元素即 base。' },
        { stdin: '3 4 100 2 2 3\n', note: 'a[2][3]，LOC=100+(2*4+3)*2=122。', why: '末元素，前面 11 个 ×2。' },
        { stdin: '2 5 200 4 1 4\n', note: 'LOC=200+(1*5+4)*4=236。', why: 'esize=4，行宽 5。' },
      ],
      blanks: [
        {
          find: '    int addr = base + (i * cols + j) * esize;',
          accepted: ['    int addr = base + (i * cols + j) * esize;'],
          hint: '行主序：先数 i 行整行，再数 j 个列，再乘元素大小。',
          pitfall: '行主序把「行优先」编号：a[i][j] 的线性下标是 `i*cols + j`。★ 写成 `i*rows + j` 或 `j*cols + i` 都会在非方阵或 i≠j 时算错，这是地址计算最典型的错误。',
        },
        {
          find: '    scanf("%d %d %d %d %d", &rows, &cols, &base, &esize, &i);',
          accepted: ['    scanf("%d %d %d %d %d", &rows, &cols, &base, &esize, &i);'],
          hint: '读入行列数、基址、元素大小与 i，再单独 j。',
          pitfall: '输入顺序必须与 scanf 严格一致。★ 若把 base 与 esize 交换，或漏读 j，地址就完全错。地址公式里元素大小 esize 是不可少的（字节寻址）。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    int addr = base + (i * cols + j) * esize;',
          replace: '    int addr = base + (i * rows + j) * esize;',
          why: '把行主序的行宽 cols 错写成 rows。对非方阵（rows≠cols）或 i>0 的元素，地址全部算错。',
          pitfall: '行主序的「行宽」是列数 cols 而不是行数 rows。★ 写成 rows 后第 1 行以外的元素地址错位，j 越大偏差越大；当 rows==cols（方阵）时反而「碰巧」正确，这正是地址公式题的陷阱 —— 要用非方阵输入才测得出。',
        },
        {
          kind: '赋值顺序错误',
          find: '    scanf("%d %d %d %d %d", &rows, &cols, &base, &esize, &i);',
          replace: '    scanf("%d %d %d %d %d", &rows, &cols, &base, &i, &esize);',
          why: 'scanf 形参顺序把 i 与 esize 交换。读入的 i 被赋成 esize 的值、esize 被赋成 i 的值，地址完全错。',
          pitfall: 'scanf 的形参顺序必须与格式串一一对应。★ 交换两个地址参数后，i 与 esize 的值互窜，地址输出错位且不报错，只有对照输入与正确公式才发现。',
        },
      ],
      asks: [
        { label: 'a[1][2] (3x4, base=100, esize=2) 的 LOC', answer: '112', unit: '' },
        { label: '行主序下标 i*cols+j 中 cols 表示', answer: '列数', unit: '' },
        { label: 'a[2][3] (3x4) 的线性下标', answer: '11', unit: '' },
        { label: 'LOC 公式里 esize 代表', answer: '元素字节数', unit: '' },
        { label: 'a[0][0] 的地址', answer: 'base', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1) 常数'],
      notes: {
        idea: '行主序把一维数组编号按「先走完一行再换行」分配，a[i][j] 的线性下注 i*cols+j，地址 = base + (i*cols+j)*esize。',
        steps: [
          '确定行宽 cols。',
          '线性下标 = i*cols + j。',
          '地址 = base + 下标 * esize。',
        ],
        complexity: '公式直接计算，O(1)。',
        pitfalls: [
          '行宽是 cols 不是 rows。',
          '地址寻址要乘元素大小 esize。',
          '下标从 0 计（本程序约定）。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入参数。',
            '套公式计算。',
            '输出 LOC。',
          ],
        },
        complexity_analysis: {
          steps: [
            '一次算术运算。',
            'O(1)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查行宽与地址公式。',
            '修正后得到正确 LOC。',
          ],
        },
      },
    },
    {
      key: 'triangle-store',
      cxaStem: '阅读下面的对称矩阵下三角压缩存储程序，回答下列问题。',
      section: '4.4 特殊矩阵的压缩存储',
      difficulty: 3,
      bloom: 'apply',
      tags: ['对称矩阵', '下三角', '压缩存储', '下标映射'],
      knowledgeIds: ['ds-ch04-15', 'ds-ch04-16', 'ds-ch04-01'],
      code: `#include <stdio.h>
#define N 5
static int k(int i, int j) {
    if (i < j) { int t = i; i = j; j = t; }
    return i * (i + 1) / 2 + j;
}
int main(void) {
    int sa[N * (N + 1) / 2], i, j;
    for (i = 0; i < N; i++)
        for (j = 0; j <= i; j++)
            sa[k(i, j)] = i * 10 + j;
    scanf("%d %d", &i, &j);
    printf("a[%d][%d] = %d\\n", i, j, sa[k(i, j)]);
    return 0;
}`,
      stem: '把 n=5 的对称矩阵（只存下三角，含主对角线）按行优先压到一维数组 sa 中，映射为 0 基下标 k(i,j)=i(i+1)/2+j（i≥j）。读入 i,j 后输出 a[i][j] 的压缩值（当 i<j 时按对称取 a[j][i]）。',
      inputs: [
        { stdin: '2 1\n', note: 'a[2][1]，k=2*3/2+1=4，sa[4]=21。', why: 'i≥j，直接 k(2,1)=4，值为 2*10+1=21。' },
        { stdin: '1 3\n', note: 'i<j，取 a[3][1]，k=3*4/2+1=7，sa[7]=31。', why: '对称，用 a[3][1]，值 31。' },
        { stdin: '0 0\n', note: 'a[0][0]，k=0，sa[0]=0。', why: '主对角首元素。' },
        { stdin: '4 4\n', note: 'a[4][4]，k=4*5/2+4=14，sa[14]=44。', why: '末元素，k=14 是最后一个位置。' },
      ],
      blanks: [
        {
          find: '    return i * (i + 1) / 2 + j;',
          accepted: ['    return i * (i + 1) / 2 + j;'],
          hint: '下三角 0 基：第 i 行前面有 1+2+...+i = i(i+1)/2 个元素，再加 j。',
          pitfall: '下三角 0 基的映射是 `i(i+1)/2 + j`（每行从 0 到 i 共 i+1 个，前 i 行和 = i(i+1)/2）。★ 写成 `i(i-1)/2 + j` 是 1 基公式，会整体少算 i 个偏移；写成 `i(i+1)/2 - j` 更是方向反。',
        },
        {
          find: '    if (i < j) { int t = i; i = j; j = t; }',
          accepted: ['    if (i < j) { int t = i; i = j; j = t; }'],
          hint: '对称矩阵只存下三角，i<j 时用 a[j][i] 镜像。',
          pitfall: '对称矩阵 a[i][j]==a[j][i]，所以存取时凡 i<j 都要换成 a[j][i]。★ 忘掉镜像交换，或交换写反（把大数行放到第 0 行），会访问到未压缩的正确位置或越界。',
        },
      ],
      defects: [
        {
          kind: '赋值顺序错误',
          find: '    return i * (i + 1) / 2 + j;',
          replace: '    return i * (i - 1) / 2 + j;',
          why: '把 0 基公式 i(i+1)/2+j 错写成 1 基公式 i(i-1)/2+j，整体偏移少算 i 个，映射到错误的压缩位置。',
          pitfall: '压缩存储的下标公式有 0 基与 1 基两套（差一个 i 的偏移）。★ 用错公式后数组下标整体偏移，存取错位；在 i 较大时甚至越界或读到其它元素而不报错（内存里仍是合法的 int 序列），只有逐元素核对才暴露。',
        },
        {
          kind: '条件判断错误',
          find: '    if (i < j) { int t = i; i = j; j = t; }',
          replace: '    if (i < j) { int t = j; j = i; i = t; }',
          why: '镜像时把 t 赋成 j、i=j、j=i，交换逻辑写反，实际让 i 恒为较大前的值，导致 i<j 时映射错。',
          pitfall: '镜像交换写成反后会访问未压缩的上三角区域（下标超出 sa 的三角范围）或错位。★ 这个 bug 不崩、输出看似「合理」，只有对照对称性 a[i][j] 应等于 a[j][i] 才发现。',
        },
      ],
      asks: [
        { label: 'n=5 时下三角元素总数', answer: '15', unit: '' },
        { label: 'a[2][1] 的映射下标 k', answer: '4', unit: '' },
        { label: 'a[4][4] 的映射下标 k', answer: '14', unit: '' },
        { label: '压缩下三角 0 基公式', answer: 'i(i+1)/2+j', unit: '' },
        { label: '对称矩阵 i<j 时应取', answer: 'a[j][i]', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1) 常数'],
      notes: {
        idea: '对称矩阵只存下三角（含主对角线），用 k(i,j)=i(i+1)/2+j（0 基，i≥j）把二维映射到一维，空间从 n² 降到 n(n+1)/2。',
        steps: [
          'i<j 时镜像为 a[j][i]。',
          '计算下三角下标 k。',
          '访问 sa[k]。',
        ],
        complexity: '直接下标计算，O(1)。',
        pitfalls: [
          '0 基公式 i(i+1)/2+j，1 基是 i(i-1)/2+j。',
          'i<j 必须镜像。',
          '压缩空间 n(n+1)/2。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '填下三角到 sa。',
            '读 i,j，镜像后取 sa[k]。',
            '输出。',
          ],
        },
        complexity_analysis: {
          steps: [
            '填表 O(n²)，存取 O(1)。',
            '压缩空间 O(n²)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查映射公式与镜像。',
            '修正后正确。',
          ],
        },
      },
    },
  ],
}
