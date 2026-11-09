// ds-ch01 绪论 第 3 批（1 个 code entry：循环嵌套基本操作执行次数 → 时间/空间复杂度分析）。规范全名 chapter='第1章 绪论'；section='1.4 算法和算法分析'。
// 坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次且两处不重叠；错误版不能崩/超时；C 换行用真实换行，printf 内 \\n。
export default {
  shard: 'ds-ch01',
  chapter: '第1章 绪论',
  category: 'ds',
  source: '自撰（依据《第1章 绪论》1.4 算法和算法分析：基本语句执行次数与四种复杂度量级对照考点变式）',
  entries: [
    {
      key: 'op-freq-count',
      cxaStem: '阅读下面的程序（用四段循环统计基本语句执行次数 c1…c4），分析各段及整体时间复杂度。',
      section: '1.4 算法和算法分析',
      difficulty: 3,
      bloom: 'apply',
      tags: ['时间复杂度', '循环嵌套', '基本操作计数', '对数阶', '大O记法'],
      knowledgeIds: ['ds-ch01-04'],
      code: `#include <stdio.h>
int main(void){
    int n,i,j,k,t,c1=0,c2=0,c3=0,c4=0;
    scanf("%d",&n);
    for(i=0;i<n;i++) c1++;
    for(i=0;i<n;i++) for(j=0;j<i;j++) c2++;
    for(i=0;i<n;i++) for(j=0;j<i;j++) for(k=0;k<i;k++) c3++;
    t=n;
    while(t>0){ c4++; t/=2; }
    printf("%d %d %d %d\\n",c1,c2,c3,c4);
    return 0;
}`,
      stem: '读入一个正整数 n，用四段循环统计基本语句（c1++、c2++、c3++、c4++）的执行次数：单重循环 c1、双重循环 c2、三重嵌套循环 c3、以及把 n 反复除以 2 的 while 循环 c4。输出 c1 c2 c3 c4 四个数值。',
      inputs: [
        { stdin: '8\n', note: 'n=8。', why: 'c1=8，c2=8×7/2=28，c3=7×8×15/6=140，c4：8→4→2→1→0 共 4 次。' },
        { stdin: '16\n', note: 'n=16。', why: 'c1=16，c2=16×15/2=120，c3=15×16×31/6=1240，c4：16→8→4→2→1→0 共 5 次。' },
        { stdin: '5\n', note: 'n=5。', why: 'c1=5，c2=5×4/2=10，c3=4×5×9/6=30，c4：5→2→1→0 共 3 次。' },
        { stdin: '12\n', note: 'n=12。', why: 'c1=12，c2=12×11/2=66，c3=11×12×23/6=506，c4：12→6→3→1→0 共 4 次。' },
      ],
      blanks: [
        {
          find: 'c3++;',
          accepted: ['c3++;'],
          hint: '三重嵌套最内层循环的计数语句，表示基本语句总执行次数。',
          pitfall: '★ 三重循环体内层执行 c3++ 的次数为 Σi²（i 从 0 到 n-1），即 n(n-1)(2n-1)/6。若误把 c3++ 写成 c3+=i 或放到不同循环层，正确公式会被破坏，输出的 c3 无法体现 O(n³) 量级。',
        },
        {
          find: 't/=2;',
          accepted: ['t/=2;'],
          hint: '把 t 反复除以 2，是典型的对数阶（O(log n)）循环。',
          pitfall: '★ while(t>0){ c4++; t/=2; } 是 O(log n)：每次把 t 折半，循环约 ⌊log₂n⌋+1 次。若把 t/=2 写成 t-- 会退化成 O(n)，若漏掉 t/=2 则 t 不变会死循环（超时）。必须保证 t 单调趋 0 且能到 0。',
        },
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: 'for(j=0;j<i;j++) c2++;',
          replace: 'for(j=0;j<=i;j++) c2++;',
          why: '把内层循环上界从 j<i 改成了 j<=i，循环多执行一次，c2 的公式被破坏。',
          pitfall: '★ 双循环 c2 的精确次数是 Σi = n(n-1)/2（j 从 0 到 i-1）。改成 j<=i 后每次多执行 1 次，c2 变 n(n+1)/2（n=8 时由 28 变 36），量级虽仍为 O(n²)，但精确公式错了。',
        },
        {
          kind: '循环边界错误',
          find: 'for(i=0;i<n;i++) c1++;',
          replace: 'for(i=0;i<=n;i++) c1++;',
          why: '把单重循环上界从 i<n 改成 i<=n，c1 由 n 变 n+1，次数量级虽不变但精确值出错。',
          pitfall: '★ c1 应为 n（i=0…n-1 共 n 次）。改成 i<=n 后执行 n+1 次（n=8 时 c1 变 9）。同时两个上界错误（c1 与 c2）叠加时，组合版本输出同时偏大，注意区分单重与双重循环各自的上界错误。',
        },
      ],
      asks: [
        { label: '三重嵌套循环 c3 对应的时间复杂度量级是?', answer: 'O(n^3)', unit: '' },
        { label: '单重循环 c1 的时间复杂度量级是?', answer: 'O(n)', unit: '' },
        { label: 'while(t>0){ c4++; t/=2; } 的时间复杂度是?', answer: 'O(log n)', unit: '' },
        { label: '四个计数的循环次数由小到大排列是?', answer: 'c4 < c1 < c2 < c3', unit: '' },
        { label: '双重循环 c2 的精确迭代次数公式是?', answer: 'n(n-1)/2', unit: '' },
      ],
      complexity: 'O(n^3)（程序整体取最高阶；单重 O(n)、双重 O(n²)、三重 O(n³)、while 折半 O(log n)）',
      complexityAccepted: ['O(n^3)', 'O(n^3) 立方', 'O(n^3)'],
      askSpace: '统计基本语句执行次数是分析时间复杂度的入口：单重循环即 O(n)，双重嵌套即 O(n²)，三重嵌套即 O(n³)，而把 n 反复除以 2 的 while 循环是 O(log n)。程序整体复杂度取最高阶，故为 O(n³)，空间复杂度为 O(1)（只用了几个整型变量）。',
      notes: {
        idea: '用四段循环分别统计基本语句执行次数，直观对照四种复杂度量级：单重循环 O(n)、双重嵌套 O(n²)、三重嵌套 O(n³)、把 n 反复折半的 while 循环 O(log n)，整体复杂度取最高阶。',
        steps: [
          '读入 n。',
          '单重循环 i=0…n-1，c1++ 执行 n 次（O(n)）。',
          '双重循环 i 的每个取值下内层 j=0…i-1，c2++ 共 n(n-1)/2 次（O(n²)）。',
          '三重循环最内层 k=0…i-1，c3++ 共 Σi²=n(n-1)(2n-1)/6 次（O(n³)）。',
          'while(t>0){ c4++; t/=2; } 把 n 折半，c4 约 ⌊log₂n⌋+1 次（O(log n)），输出 c1 c2 c3 c4。',
        ],
        complexity: '整体 O(n³)（取最高阶），空间 O(1)；单重 O(n)、双重 O(n²)、三重 O(n³)、折半 O(log n)。',
        pitfalls: [
          '时间频度是基本语句执行次数，按最高阶取大 O；常数与低阶项可以省略。',
          '双重循环 c2=Σi 的精确公式是 n(n-1)/2，不是 n²/2 的近似。',
          'while 折半循环是 O(log n)：每次 t/=2，t 单调趋 0。',
          '上界「< n」与「<= n」差 1 次，精确值会变，但大 O 量级不变。',
        ],
      },
      explain: {
        code_reading: { steps: ['读 n。', '单重循环 c1 计 n 次。', '双重循环 c2 计 n(n-1)/2 次。', '三重循环 c3 计 Σi² 次，while 折半 c4 计 ⌊log₂n⌋+1 次。'] },
        code_completion: { steps: ['补全三重循环最内层计数 c3++。', '补全 while 中的折半步 t/=2。'] },
        ds_debug: { steps: ['检查 c1 单重循环上界 i<n。', '检查 c2 双重循环上界 j<i。', '检查 while 是否折半（t/=2）而非 t-- 或死循环。'] },
        complexity_analysis: { steps: ['确定各段循环执行次数与量级。', '取最高阶得到整体复杂度。'] },
      },
    },
  ],
}
