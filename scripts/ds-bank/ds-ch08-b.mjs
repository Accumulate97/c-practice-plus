// ds-ch08-b — 冒泡 / 选择 / 堆 三个排序程序库 entry
// 规则同 ds-ch08.mjs。所有计数程序经本地 gcc 零警告 + run-c 实测，asks 一律用实测值。
export default {
  shard: 'ds-ch08',
  chapter: '第8章 排序',
  category: 'ds',
  source: '自撰（依据《第8章 排序》教材考点变式）',
  entries: [
    {
      key: 'bubble-sort',
      section: '8.3 交换排序（冒泡排序与快速排序）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['冒泡排序', '交换', '逆序对', '比较次数', '稳定'],
      knowledgeIds: ['ds-ch08-08', 'ds-ch08-03', 'ds-ch08-01'],
      cxaStem: '阅读下面这段冒泡排序算法（带比较/交换计数与提前结束哨兵），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, swaps = 0;
void bubble(int a[], int n) {
    int i, j, t, flag;
    for (i = 0; i < n - 1; i++) {
        flag = 0;
        for (j = 0; j < n - 1 - i; j++) {
            cmp++;
            if (a[j] > a[j + 1]) { t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swaps++; flag = 1; }
        }
        if (!flag) break;
    }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    bubble(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 交换=%d\\n", cmp, swaps);
    return 0;
}`,
      stem: '阅读下面这段冒泡排序算法。它对数组 a 原地升序排序，统计比较次数 cmp 与交换次数 swaps。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / swaps 各是多少？',
      inputs: [
        { stdin: '5 49 38 65 97 76\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已有序，一趟哨兵即停', why: '提前结束与最少交换' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序，最坏', why: '比较与交换都达最大值' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测稳定性', why: '重复元素是否保持原相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '            if (a[j] > a[j + 1]) { t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swaps++; flag = 1; }',
          accepted: ['            if (a[j] > a[j + 1]) { t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swaps++; flag = 1; }'],
          hint: '相邻逆序则交换并把本轮发生交换的标记置位',
          pitfall: '相邻比较必须用严格大于 > 才能保持稳定：用 >= 会把相等元素也交换、破坏相对顺序，但输出序列仍是升序（因此这类缺陷靠输出看不出，需靠稳定性）。'
        },
        {
          find: '        if (!flag) break;',
          accepted: ['        if (!flag) break;', '        if (flag == 0) break;'],
          hint: '本轮没有任何交换说明已全部有序，提前结束外层循环',
          pitfall: '这个「提前结束」标记是冒泡相对于其它 O(n²) 排序在基本有序时接近 O(n) 的关键；写成 if (flag) break 会提前错误终止。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'a[j] > a[j + 1]',
          replace: 'a[j] < a[j + 1]',
          why: '把「大于才交换」写成「小于才交换」，冒泡降序排列，结果序列变为降序。',
          pitfall: '比较方向写反是交换类排序最典型的错误：程序不崩溃、输出是「逆序的有序序列」。'
        },
        {
          kind: '循环边界错误',
          find: 'for (j = 0; j < n - 1 - i; j++)',
          replace: 'for (j = 1; j < n - 1 - i; j++)',
          why: '内层循环从下标 1 开始，a[0] 永不与 a[1] 比较（首元素无法上浮），结果为部分有序、a[0] 错位。',
          pitfall: '下标起点差一：冒泡必须让每个元素都有机会与其左边相邻元素比较，从 0 开始是保证 a[0] 也能趟到正确位置的关键。'
        }
      ],
      asks: [
        { label: '对输入 5 49 38 65 97 76，比较次数 cmp', answer: '7', unit: '次' },
        { label: '同样的输入，交换次数 swaps', answer: '2', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），交换次数 swaps', answer: '10', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），比较次数 cmp', answer: '4', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），交换次数 swaps', answer: '0', unit: '次' },
        { label: '把 a[j] > a[j+1] 改成 a[j] >= a[j+1]，排序是否还稳定', answer: '否', unit: '' }
      ],
      complexity: 'O(n²)',
      complexityAccepted: ['O(n²)', 'O(n*n)', 'n^2', '平方'],
      askSpace: '冒泡排序带哨兵时基本有序接近 O(n)；最坏与平均 O(n²)，是稳定排序。',
      notes: {
        idea: '冒泡排序每趟把当前最大（最小）元素「冒泡」到序列末尾，相邻逆序才交换，所以是稳定的。',
        steps: [
          '重复 n-1 趟，每趟终值都上浮到当前未排序末尾',
          '相邻元素逆序则交换，同时记一次交换数',
          '一旦某趟没有发生交换，说明已全部有序，提前结束',
          '最终得到升序序列'
        ],
        complexity: '最坏/平均 O(n²)（逆序），最好 O(n)（已序 + 哨兵）；空间 O(1)。交换次数恰等于逆序对数，是稳定排序。',
        pitfalls: [
          'swaps 计数恰等于逆序对数；cmp 在最坏（逆序）为 n(n-1)/2，已序只有 n-1',
          '「提前结束哨兵」只对基本有序的输入有加速，对逆序无帮助',
          '相邻交换保证相等元素相对顺序不变，故稳定'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 bubble 升序排序', '打印结果与 cmp/swaps'] },
        code_completion: { steps: ['相邻逆序则交换并置位 flag', '某趟无交换则 break 提前结束'] },
        ds_debug: { steps: ['检查相邻比较的方向', '检查内层循环起点与范围'] },
        complexity_analysis: { steps: ['数每趟比较与交换', '用逆序对解释交换次数'] }
      }
    },
    {
      key: 'select-sort',
      section: '8.4 选择排序（简单选择排序与堆排序）',
      difficulty: 2,
      bloom: 'apply',
      tags: ['简单选择排序', '比较次数', '交换次数', '不稳定'],
      knowledgeIds: ['ds-ch08-10', 'ds-ch08-03', 'ds-ch08-01'],
      cxaStem: '阅读下面这段简单选择排序算法（带比较/交换计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, swp = 0;
void selectSort(int a[], int n) {
    int i, j, min, t;
    for (i = 0; i < n - 1; i++) {
        min = i;
        for (j = i + 1; j < n; j++) { cmp++; if (a[j] < a[min]) min = j; }
        if (min != i) { t = a[i]; a[i] = a[min]; a[min] = t; swp++; }
    }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    selectSort(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 交换=%d\\n", cmp, swp);
    return 0;
}`,
      stem: '阅读下面这段简单选择排序算法。它对数组 a 原地升序排序，统计比较次数 cmp 与交换次数 swp。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / swp 各是多少？',
      inputs: [
        { stdin: '5 49 38 65 97 76\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已有序，比较次数不变', why: '选择排序比较次数与初始状态无关' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '比较次数恒定 n(n-1)/2' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测稳定性', why: '重复元素是否保持原相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        for (j = i + 1; j < n; j++) { cmp++; if (a[j] < a[min]) min = j; }',
          accepted: ['        for (j = i + 1; j < n; j++) { cmp++; if (a[j] < a[min]) min = j; }'],
          hint: '在 i 之后的序列里找最小元素下标，存到 min',
          pitfall: 'min 必须初始化为 i（当前趟的首位置），而不是 0；且每次找出的是「最小」而不是「最大」，方向写反会变成降序。'
        },
        {
          find: '        if (min != i) { t = a[i]; a[i] = a[min]; a[min] = t; swp++; }',
          accepted: ['        if (min != i) { t = a[i]; a[i] = a[min]; a[min] = t; swp++; }'],
          hint: '如果找到的最小元素不在当前位置，就交换过去',
          pitfall: '先判断 min != i 再做交换，避免多余的自交换；直接在未排序区间交换是选择排序交换次数远小于冒泡的原因。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'a[j] < a[min]',
          replace: 'a[j] > a[min]',
          why: '把「找最小」写成「找最大」，每趟选出的最大元素放到首位置，结果序列变为降序。',
          pitfall: '比较方向写反，程序仍终止、输出也是「有序」，只是方向相反。'
        },
        {
          kind: '初始化错误',
          find: 'min = i;',
          replace: 'min = 0;',
          why: '把 min 初值写成 0（固定首个位置），每趟都从固定的 a[0] 比较，导致首元素被反复选出，前几个位置错位。',
          pitfall: 'min 的初值必须是当前趟的起点下标 i；写成常量会使后续趟「选择」的对象错位。'
        }
      ],
      asks: [
        { label: '对输入 5 49 38 65 97 76，比较次数 cmp', answer: '10', unit: '次' },
        { label: '同样的输入，交换次数 swp', answer: '2', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），比较次数 cmp', answer: '10', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），比较次数 cmp', answer: '10', unit: '次' },
        { label: '任意 n 个元素，简单选择排序的比较次数恒为', answer: 'n(n-1)/2', unit: '次' },
        { label: '简单选择排序是否稳定', answer: '否', unit: '' }
      ],
      complexity: 'O(n²)',
      complexityAccepted: ['O(n²)', 'O(n*n)', 'n^2', '平方'],
      askSpace: '简单选择排序比较次数恒为 n(n-1)/2（与初始状态无关），交换次数 ≤ n-1，是不稳定排序。',
      notes: {
        idea: '每趟从未排序区间选出最小元素与区间首位置交换，直到全部排好。',
        steps: [
          '把当前位置 i 当作区间起点',
          '在 i..n-1 里找出最小元素下标 min',
          '若 min != i 则交换，使最小元素就位',
          '继续下一趟，直到 n-1 趟完成'
        ],
        complexity: 'O(n²)（比较次数恒定 n(n-1)/2），交换次数 ≤ n-1；空间 O(1)。因「长距离交换」跨越相等的元素，故不稳定。',
        pitfalls: [
          '比较次数与初始排列无关（这是它与冒泡/插入的本质区别），永远 O(n²)',
          'swap 次数远小于冒泡（≤n-1），这是它「比较好但交换少」的特点',
          '不稳定：{5a,8,5b} 排序后两个 5 的相对顺序会变'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 selectSort 升序排序', '打印结果与 cmp/swp'] },
        code_completion: { steps: ['找 i..n-1 的最小元素下标 min', 'min!=i 则交换'] },
        ds_debug: { steps: ['检查比较方向找最小', '检查 min 初值'] },
        complexity_analysis: { steps: ['内层循环次数 n-1-i 累加', '得到 n(n-1)/2 恒定'] }
      }
    },
    {
      key: 'heap-sort',
      section: '8.4 选择排序（简单选择排序与堆排序）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['堆排序', '大顶堆', '建堆', '不稳定'],
      knowledgeIds: ['ds-ch08-11', 'ds-ch08-03', 'ds-ch08-01'],
      cxaStem: '阅读下面这段堆排序算法（大顶堆，带筛选计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, swp = 0;
void siftDown(int a[], int k, int n) {
    int t = a[k], child;
    while (k * 2 + 1 < n) {
        child = 2 * k + 1;
        if (child + 1 < n && a[child] < a[child + 1]) child++;
        cmp++;
        if (t >= a[child]) break;
        a[k] = a[child]; k = child;
    }
    a[k] = t;
}
void heapSort(int a[], int n) {
    int i, t;
    for (i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);
    for (i = n - 1; i > 0; i--) { t = a[0]; a[0] = a[i]; a[i] = t; swp++; siftDown(a, 0, i); }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    heapSort(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 交换=%d\\n", cmp, swp);
    return 0;
}`,
      stem: '阅读下面这段堆排序算法（大顶堆，升序排序）。它先自 n/2-1 起建堆，再把堆顶与末元素交换后重新筛选。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / swp 各是多少？',
      inputs: [
        { stdin: '5 49 38 65 97 76\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已序小到大', why: '验证大顶堆建堆与交换' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '验证建堆路径' },
        { stdin: '4 2 2 1 1\n', note: '含重复', why: '重复元素处理' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '    for (i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);',
          accepted: ['    for (i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);'],
          hint: '从最后一个非叶结点开始自下而上建堆',
          pitfall: '建堆起点必须是最后一个有孩子的结点 n/2 - 1（下标 0 基），从 n-1 起或过多都会做无效筛选；筛选时 i 每轮 -1。'
        },
        {
          find: '        if (t >= a[child]) break;',
          accepted: ['        if (t >= a[child]) break;'],
          hint: '若暂存值已不小于较大的孩子，说明不用再下沉，结束本趟筛选',
          pitfall: '用 >= 保证相等值不再下沉，否则会破坏稳定性（不过堆排序本身不稳定）；写成 > 会让相等元素继续交换。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'a[child] < a[child + 1]',
          replace: 'a[child] > a[child + 1]',
          why: '把「挑较大的孩子」改成「挑较小的孩子」，下沉到较小的分支，破坏大顶堆性质，结果是乱序而非升序。',
          pitfall: '大顶堆必须选较大的孩子与根比较；选错孩子会产生一个不满足堆序的序列。'
        },
        {
          kind: '赋值顺序错误',
          find: '(t >= a[child])',
          replace: '(t <= a[child])',
          why: '把「不小于孩子则停」写成「不大于孩子则停」，相等或更小的值也继续下沉，把堆顶原值一路压到底，结果乱序。',
          pitfall: '筛选终止条件是「暂存值不小于较大的孩子」；写成反向会在堆排序中把不该下沉的值继续下沉。'
        }
      ],
      asks: [
        { label: '对输入 5 49 38 65 97 76，比较次数 cmp', answer: '7', unit: '次' },
        { label: '同样的输入，交换次数 swp', answer: '4', unit: '次' },
        { label: 'n 个元素建堆的时间复杂度', answer: 'O(n)', unit: '' },
        { label: '堆排序总体时间复杂度', answer: 'O(nlogn)', unit: '' },
        { label: '堆排序是否稳定', answer: '否', unit: '' },
        { label: '建堆从哪个下标开始（0 基）', answer: 'n/2-1', unit: '' }
      ],
      complexity: 'O(nlogn)',
      complexityAccepted: ['O(nlogn)', 'O(n*log n)', 'O(n log n)', 'nlogn', 'O(nlogn)'],
      askSpace: '堆排序建堆 O(n)，每次取堆顶再筛选 O(logn)，共 n 趟 O(nlogn)，不稳定。',
      notes: {
        idea: '堆排序利用完全二叉树的数组表示，先建大顶堆，再反复交换堆顶与末元素并重新筛选。',
        steps: [
          '自 n/2-1 起自下而上建大顶堆 O(n)',
          '把堆顶 a[0] 与当前末元素交换（最大值归位）',
          '对剩余 n-1 个元素重新筛选恢复堆',
          '重复直到全部有序'
        ],
        complexity: '建堆 O(n)，每趟取堆顶+筛选 O(logn)，总 O(nlogn)；空间 O(1)。因长距离交换跨越相等元素，故不稳定。',
        pitfalls: [
          '建堆起点是 n/2-1（最后一个非叶结点），不是 n-1',
          '筛选 siftDown 必须比较两个孩子挑较大的那个',
          '升序用大顶堆、降序用小顶堆，方向反了结果相反'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', 'heapSort 建大顶堆再交换', '打印结果与 cmp/swp'] },
        code_completion: { steps: ['自 n/2-1 建堆', '筛选时挑较大孩子、不小于则停'] },
        ds_debug: { steps: ['检查挑孩子方向', '检查筛选终止条件'] },
        complexity_analysis: { steps: ['建堆 O(n)', '每趟 O(logn) 共 n 趟'] }
      }
    }
  ]
};
