// ds-ch08 排序 扩充题库 — 程序库
// 规则：每个带 code 的 entry 派生 7 道题（cr×2 + cc + ds_debug + multi_bug_debug + complexity_analysis）
// 每个代码一律 -std=c99 -Wall -Wextra 零警告；expected 由生成器实跑得到，禁止手写。
// 所有程序都带两个「算出来的自检」：有序=？ 与 比较/移动 计数 —— expected 里固有断言，
// defect 一旦改变结果，输出立刻变化。
export default {
  shard: 'ds-ch08',
  chapter: '第8章 排序',
  category: 'ds',
  source: '自撰（依据《第8章 排序》教材考点变式）',
  entries: [
    {
      key: 'straight-insert',
      section: '8.2 插入排序',
      difficulty: 2,
      bloom: 'apply',
      tags: ['直接插入排序', '哨兵', '逆序对', '比较次数', '稳定'],
      knowledgeIds: ['ds-ch08-05', 'ds-ch08-02', 'ds-ch08-01'],
      cxaStem: '阅读下面这段直接插入排序算法（带比较/移动计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, mv = 0;
void insertSort(int a[], int n) {
    int i, j, t;
    for (i = 1; i < n; i++) {
        t = a[i]; j = i - 1;
        while (j >= 0 && a[j] > t) { cmp++; a[j + 1] = a[j]; j--; mv++; }
        if (j >= 0) cmp++;
        a[j + 1] = t; mv++;
    }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    insertSort(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 移动=%d\\n", cmp, mv);
    return 0;
}`,
      stem: '阅读下面这段直接插入排序算法。它对数组 a 原地升序排序，并统计比较次数 cmp 与移动次数 mv。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / mv 各是多少？',
      inputs: [
        { stdin: '5 1 2 3 4 5\n', note: '已有序，比较最少', why: '有序序列：每趟只比 1 次，无移动' },
        { stdin: '5 49 38 65 97 76\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序，最坏', why: '比较与移动都达最大值' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测稳定性', why: '重复元素是否保持原相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1 不进入循环' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        while (j >= 0 && a[j] > t) { cmp++; a[j + 1] = a[j]; j--; mv++; }',
          accepted: [
            '        while (j >= 0 && a[j] > t) { cmp++; a[j + 1] = a[j]; j--; mv++; }',
            '        while (j >= 0 && a[j] > t) { cmp++; a[j + 1] = a[j]; j--; mv++; }'
          ],
          hint: '右移比 t 大的元素，直到找到插入位置',
          pitfall: '循环条件必须同时判 j>=0 与 a[j]>t：少写 j>=0 会对数组越界访问（j 变 -1 后 a[-1] 是非法读）；少写 a[j]>t 会在已有序时把每个元素都往右移一格、破坏结果。'
        },
        {
          find: '        a[j + 1] = t; mv++;',
          accepted: [
            '        a[j + 1] = t; mv++;',
            '        a[j + 1] = t; mv++;'
          ],
          hint: '把暂存值放入空出的位置',
          pitfall: '记住移动次数包含「把暂存值写回」这一次赋值；很多同学只数了 while 里的移动。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'a[j] > t',
          replace: 'a[j] < t',
          why: '把「大于才右移」写成「小于才右移」，结果序列变成降序（对已有序输入再次逆序），有序自检为 0。',
          pitfall: '方向判断错误是一类「结果正确但逆序」的隐蔽错误：程序不崩溃、序列是「某种」有序，只是方向反了。'
        },
        {
          kind: '循环边界错误',
          find: 'while (j >= 0',
          replace: 'while (j > 0',
          why: '把判空 j>=0 改成 j>0，第 0 号元素永远不被比较，首个元素无法归位，结果序列错位（有序自检为 0）。',
          pitfall: '下标从 0 开始，哨兵/边界判断用的下标 +1 是最容易写错的差一位错误。'
        }
      ],
      asks: [
        { label: '对输入 5 1 2 3 4 5，结果序列首元素', answer: '1', unit: '' },
        { label: '同样的已有序输入，比较次数 cmp', answer: '4', unit: '次' },
        { label: '同样的已有序输入，移动次数 mv', answer: '4', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），比较次数 cmp', answer: '10', unit: '次' },
        { label: '对输入 5 49 38 65 97 76，移动次数 mv', answer: '6', unit: '次' },
        { label: '对输入 1 42（单元素），比较次数 cmp', answer: '0', unit: '次' }
      ],
      complexity: 'O(n²)',
      complexityAccepted: ['O(n²)', 'O(n*n)', 'n^2', '平方'],
      askSpace: '直接插入排序在基本有序时接近 O(n)；最坏（逆序）与平均为 O(n²)。',
      notes: {
        idea: '直接插入排序把每个元素插入到前面已排好序的序列中，是稳定的内部排序。',
        steps: [
          '从第二个元素开始，把当前元素 t 暂存起来',
          '从右向左扫描已排序部分，把比 t 大的元素右移一格',
          '把 t 写入空出的位置，完成一趟插入',
          '对剩余元素重复，直到全部排好'
        ],
        complexity: '最坏 O(n²)（逆序），最好 O(n)（已序），平均 O(n²)；空间 O(1)，是稳定排序。',
        pitfalls: [
          '比较次数与移动次数是核心考点：cmp == 逆序对数 + (n-1)，mv 还包含「写回暂存值」的移动',
          '哨兵版（r[0] 兼作暂存）能省去循环内的 j>=0 判断，因此比非哨兵版略快',
          '元素配对着总是保持相对顺序（a[j] > t 用严格大于），因此直接插入是稳定排序'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 insertSort 升序排序', '打印结果序列与 cmp/mv 计数'] },
        code_completion: { steps: ['先判 j>=0 且 a[j]>t 则右移', '把暂存值 t 写回空位'] },
        ds_debug: { steps: ['对比正确算法的移动方向', '逐行检查 while 条件与写回位置'] },
        complexity_analysis: { steps: ['数出每次比较次数', '数出每次移动（含写回）', '用规格 n 与逆序对解释'] }
      }
    }
  ]
};
