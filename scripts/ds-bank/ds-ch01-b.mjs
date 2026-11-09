export default {
  shard: 'ds-ch01',
  chapter: '第1章 绪论',
  category: 'ds',
  source: '自撰（依据《第1章 绪论》教材考点变式）',
  entries: [
    {
      key: 'alg-time-complex',
      section: '1.4 算法和算法分析',
      difficulty: 2,
      bloom: 'apply',
      tags: ['时间复杂度', '算法分析', '循环嵌套', '计数'],
      knowledgeIds: ['ds-ch01-04', 'ds-ch01-01'],
      cxaStem: '阅读下面的程序，回答有关算法时间复杂度的问题。',
      code: `#include <stdio.h>
int main(void) {
    int n, i, j, cnt = 0;
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        for (j = 1; j <= i; j++) {
            cnt++;
        }
    }
    printf("count=%d\\n", cnt);
    return 0;
}`,
      stem: '写出下列程序在给定输入下的运行结果（逐行抄写，空格与换行都要一致）。',
      inputs: [
        { stdin: '1\n', note: 'n=1', why: '只有 i=1 时内层执行一次，cnt 从 0 变成 1。' },
        { stdin: '3\n', note: 'n=3', why: '内层共执行 1+2+3=6 次，cnt 为 6。' },
        { stdin: '5\n', note: 'n=5', why: '内层共执行 1+2+3+4+5=15 次。' },
        { stdin: '10\n', note: 'n=10', why: '内层共执行 1+2+…+10=55 次。' },
        { stdin: '2\n', note: 'n=2', why: '内层共执行 1+2=3 次。' }
      ],
      blanks: [
        { find: '            cnt++;', accepted: ['            cnt++;', '            ++cnt;', '            cnt = cnt + 1;'], hint: '每一层内循环都要把操作计数加 1。', pitfall: '计数语句必须放在最内层循环体里，否则计数会少很多。' },
        { find: 'for (j = 1; j <= i; j++)', accepted: ['for (j = 1; j <= i; j++)'], hint: '内层循环从 1 走到 i，才能凑成 n(n+1)/2 次执行。', pitfall: '内层上界写成 n 会变成 n^2 次；写成 j<i 会少算 n 次。' }
      ],
      defects: [
        { kind: '比较取反', find: 'for (j = 1; j <= i; j++)', replace: 'for (j = 1; j < i; j++)', why: '把内层循环上界从“<=i”改成“<i”，少执行 n 次，count 变小。', pitfall: '内层 j<i 时，i=1 的内层一次都不执行，整体少算 n 次。' },
        { kind: '比较取反', find: 'for (i = 1; i <= n; i++)', replace: 'for (i = 1; i < n; i++)', why: '把外层循环上界从“<=n”改成“<n”，外层少跑一轮，count 变小。', pitfall: '外层 i<n 时少执行最后一轮（i=n），结果整体变小。' }
      ],
      asks: [
        { label: '该程序的时间复杂度（用大 O 表示）是？', answer: 'O(n^2)', unit: '' },
        { label: '当 n=5 时，程序输出的 count 是多少？', answer: '15', unit: '' },
        { label: 'cnt 语句（最内层）总共执行多少次（用 n 表示）？', answer: 'n(n+1)/2', unit: '' },
        { label: '最内层循环体之外，外层循环总共执行多少次？', answer: 'n', unit: '次' },
        { label: '若把内层循环上界改为 n，cnt 语句总共执行多少次（用 n 表示）？', answer: 'n^2', unit: '' }
      ],
      complexity: 'O(n^2)',
      complexityAccepted: ['O(n^2)', 'n^2', 'O(n*n)'],
      notes: {
        idea: '用一段双层循环程序统计最内层语句执行次数，直观体会嵌套循环的时间复杂度是 O(n^2)。该程序内层循环上界随外层 i 变化（j<=i），因此总次数是 1+2+…+n=n(n+1)/2。',
        steps: [
          '先看外层循环：i 从 1 到 n，共 n 轮。',
          '再看内层循环：对每个 i，j 从 1 到 i，共 i 次。',
          '把每轮执行次数累加：1+2+…+n = n(n+1)/2。',
          '只保留最高阶项，得到时间复杂度 O(n^2)。'
        ],
        complexity: '总执行次数为 n(n+1)/2，渐近复杂度为 O(n^2)，空间复杂度为 O(1)。',
        pitfalls: [
          '内层循环上界随外层变化，不能用“n×n”直接认为固定 n^2 次。',
          '统计频度时要把所有层的循环次数相乘或相加，注意循环变量之间的依赖关系。',
          '误以为内层也循环 n 次会得出 O(n^2) 但把系数算错；正确是 n(n+1)/2。'
        ]
      },
      explain: {
        code_reading: {
          steps: [
            '读入 n 的值，初始化 cnt=0。',
            '外层 i 从 1 到 n；对每个 i，内层 j 从 1 到 i 执行 cnt++。',
            '内层总执行次数为 1+2+…+n = n(n+1)/2。',
            'printf 输出 count= 后接该累计值。'
          ]
        },
        code_completion: {
          steps: [
            '补系统头文件 #include <stdio.h> 以便使用 scanf/printf。',
            '最内层需要一条计数语句 cnt++;。',
            '内层循环写成 for (j = 1; j <= i; j++)，使上界随 i 变化。',
            '最后 printf 输出 count 值。'
          ]
        },
        ds_debug: {
          idea: '内层循环上界写错会直接改变被执行的总次数。',
          steps: [
            '检查外层循环上界是否为 i<=n。',
            '检查内层循环上界是否为 j<=i（随外层变化）。',
            '确认计数语句在最内层循环体内。'
          ]
        },
        complexity_analysis: {
          idea: '总频度 n(n+1)/2 的最高阶为 n^2，故时间复杂度 O(n^2)。'
        }
      }
    }
  ]
};
