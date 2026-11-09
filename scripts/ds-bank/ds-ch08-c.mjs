// ds-ch08-c — 折半插入 / 希尔 / 归并 / 快排 / 基数 五个排序程序库 entry
// 规则同 ds-ch08.mjs。所有计数程序经本地 gcc 零警告 + run-c 实测，asks 一律用实测值。
export default {
  shard: 'ds-ch08',
  chapter: '第8章 排序',
  category: 'ds',
  source: '自撰（依据《第8章 排序》教材考点变式）',
  entries: [
    {
      key: 'binary-insert',
      section: '8.2 插入排序',
      difficulty: 3,
      bloom: 'apply',
      tags: ['折半插入排序', '二分查找', '比较次数', '移动次数', '稳定'],
      knowledgeIds: ['ds-ch08-06', 'ds-ch08-02', 'ds-ch08-01'],
      cxaStem: '阅读下面这段折半插入排序算法（带比较/移动计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, mv = 0;
void binsert(int a[], int n) {
    int i, j, lo, hi, mid, t;
    for (i = 1; i < n; i++) {
        t = a[i]; lo = 0; hi = i - 1;
        while (lo <= hi) { cmp++; mid = (lo + hi) / 2; if (a[mid] > t) hi = mid - 1; else lo = mid + 1; }
        for (j = i; j > lo; j--) { a[j] = a[j - 1]; mv++; }
        a[lo] = t; mv++;
    }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    binsert(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 移动=%d\\n", cmp, mv);
    return 0;
}`,
      stem: '阅读下面这段折半插入排序算法（用二分查找定位插入点）。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / mv 各是多少？',
      inputs: [
        { stdin: '7 49 38 65 97 76 13 27\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已序', why: '比较次数少但移动多' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '移动次数最多' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测稳定性', why: '相等元素插入位置' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        while (lo <= hi) { cmp++; mid = (lo + hi) / 2; if (a[mid] > t) hi = mid - 1; else lo = mid + 1; }',
          accepted: ['        while (lo <= hi) { cmp++; mid = (lo + hi) / 2; if (a[mid] > t) hi = mid - 1; else lo = mid + 1; }'],
          hint: '二分定位：mid 处值大于 t 则到左半找，否则（含相等）到右半找，保证相等元素插到右侧（稳定）',
          pitfall: '相等元素必须走 lo = mid + 1 分支，才能保证稳定（相等元素插到已有相等元素的后面）；写成 hi = mid - 1 会破坏稳定性。'
        },
        {
          find: '        for (j = i; j > lo; j--) { a[j] = a[j - 1]; mv++; }',
          accepted: ['        for (j = i; j > lo; j--) { a[j] = a[j - 1]; mv++; }'],
          hint: '把 [lo, i-1] 的元素整体后移一位，给插入元素腾位置',
          pitfall: '移动方向必须从右往左（j 从 i 递减到 lo+1）；从 lo 开始正向会覆盖元素。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'if (a[mid] > t)',
          replace: 'if (a[mid] >= t)',
          why: '把「大于」改成「大于等于」，相等元素走左半分支（hi=mid-1），相等元素被插到已有相等元素之前，破坏稳定性。',
          pitfall: '折半插入的稳定性就藏在 `a[mid] > t` 这个单字符里：用 >= 会把相等元素插到前面。输出序列看不出（仍升序），只有检查稳定性能发现。'
        },
        {
          kind: '循环边界错误',
          find: 'while (lo <= hi)',
          replace: 'while (lo < hi)',
          why: '把二分循环条件从 lo<=hi 改成 lo<hi，当 lo==hi 时不再进入循环，插入点定位偏左一位，结果部分错位。',
          pitfall: '二分查找插入点必须用 lo<=hi，否则在左右指针重合时少查一次，插入位置偏差。'
        }
      ],
      asks: [
        { label: '对输入 7 49 38 65 97 76 13 27，比较次数 cmp', answer: '13', unit: '次' },
        { label: '同样的输入，移动次数 mv', answer: '18', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），移动次数 mv', answer: '14', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），比较次数 cmp', answer: '8', unit: '次' },
        { label: '折半插入的时间复杂度（最坏）', answer: 'O(n²)', unit: '' },
        { label: '折半插入是否稳定', answer: '是', unit: '' }
      ],
      complexity: 'O(n²)',
      complexityAccepted: ['O(n²)', 'O(n*n)', 'n^2', '平方'],
      askSpace: '折半插入用二分查找把「找位置」降到 O(logn)，但「移动」仍需 O(n)，总体仍是 O(n²)；比较次数约 Σ⌈log2(i+1)⌉。稳定。',
      notes: {
        idea: '折半插入只是把直接插入的「线性查找插入点」换成「二分查找」，移动量不变，所以复杂度不变。',
        steps: [
          '对第 i 个元素用二分找插入点 lo',
          '把 [lo, i-1] 整体后移一位',
          '在 lo 处放入 t',
          '继续下一个元素'
        ],
        complexity: '比较 O(nlogn)，移动仍 O(n²)，总 O(n²)；空间 O(1)。稳定（相等元素走右侧分支）。',
        pitfalls: [
          '复杂度仍是 O(n²) —— 折半只优化了比较，未优化移动（移动是主导）',
          '稳定性的关键在 `a[mid] > t` 的严格大于',
          '已序时比较少移动少，但这并不改变最坏复杂度'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 binsert 折半插入排序', '打印结果与 cmp/mv'] },
        code_completion: { steps: ['二分定位插入点 lo', '平移 [lo,i-1] 后放入 t'] },
        ds_debug: { steps: ['检查二分比较符号', '检查循环条件与移动方向'] },
        complexity_analysis: { steps: ['比较 O(nlogn)', '移动 O(n²) 主导'] }
      }
    },
    {
      key: 'shell-sort',
      section: '8.2 插入排序',
      difficulty: 3,
      bloom: 'apply',
      tags: ['希尔排序', '增量', '不稳定', '插入类'],
      knowledgeIds: ['ds-ch08-07', 'ds-ch08-02', 'ds-ch08-01'],
      cxaStem: '阅读下面这段希尔排序算法（带比较/移动计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, mv = 0;
void shell(int a[], int n) {
    int d, i, j, t;
    for (d = n / 2; d > 0; d /= 2) {
        for (i = d; i < n; i++) {
            t = a[i];
            for (j = i - d; j >= 0 && a[j] > t; j -= d) { cmp++; a[j + d] = a[j]; mv++; }
            cmp++;
            a[j + d] = t; mv++;
        }
    }
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    shell(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 移动=%d\\n", cmp, mv);
    return 0;
}`,
      stem: '阅读下面这段希尔排序算法（增量 d 逐次折半，带比较/移动计数）。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / mv 各是多少？',
      inputs: [
        { stdin: '10 49 38 65 97 76 13 27 49 55 4\n', note: '教材例 10 个', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已序', why: '验证基本有序计数' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '验证逆序计数' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测不稳定', why: '重复元素相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        for (j = i - d; j >= 0 && a[j] > t; j -= d) { cmp++; a[j + d] = a[j]; mv++; }',
          accepted: ['        for (j = i - d; j >= 0 && a[j] > t; j -= d) { cmp++; a[j + d] = a[j]; mv++; }'],
          hint: '以步长 d 向前扫描，凡大于 t 的元素后移 d 位',
          pitfall: '步长必须是 j -= d（不是 j--），否则变成普通插入排序；且要保证 j >= 0 下界。'
        },
        {
          find: '        a[j + d] = t; mv++;',
          accepted: ['        a[j + d] = t; mv++;'],
          hint: '把暂存的 t 放入最终位置 j+d',
          pitfall: '放入位置是 j+d（不是 j），因为循环结束时 j 已经越过插入点 d 位。'
        }
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: 'for (d = n / 2; d > 0; d /= 2)',
          replace: 'for (d = n / 2; d > 1; d /= 2)',
          why: '把增量循环条件从 d>0 改成 d>1，最后一趟 d=1 被跳过，各分组的插入排序没有做，结果非完全有序。',
          pitfall: '希尔必须做 d=1 的最后一趟（普通插入）才能保证完全有序；漏掉它输出是「接近有序」而不是有序。'
        },
        {
          kind: '条件判断错误',
          find: 'a[j] > t',
          replace: 'a[j] >= t',
          why: '把「大于」改成「大于等于」，相等元素也会被后移 d 位，跨越相等的元素，破坏稳定性。',
          pitfall: '希尔排序本身不稳定（分组跨越元素），这里的 >= 会进一步把相等的也挪走，但输出序列仍是升序、看不出，只有稳定性检查能发现。'
        }
      ],
      asks: [
        { label: '对输入 10 49 38 65 97 76 13 27 49 55 4，比较次数 cmp', answer: '35', unit: '次' },
        { label: '同样的输入，移动次数 mv', answer: '35', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），比较次数 cmp', answer: '7', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），比较次数 cmp', answer: '11', unit: '次' },
        { label: '希尔排序是否稳定', answer: '否', unit: '' },
        { label: '希尔排序最后一步的增量 d 是', answer: '1', unit: '' }
      ],
      complexity: 'O(n²)（最坏）/ O(n^1.3) 平均',
      complexityAccepted: ['O(n²)', 'O(n^1.3)', 'O(n^(3/2))', 'n^1.3'],
      askSpace: '希尔排序是插入排序的改进：先按较大增量分组插入，最后 d=1 一趟完成。最坏 O(n²)，平均约 O(n^1.3)，不稳定。',
      notes: {
        idea: '希尔排序让相距较远的元素先做插入排序，使序列「基本有序」，最后一趟 d=1 时移动量大幅下降。',
        steps: [
          '取增量 d=n/2，逐次折半',
          '对每个分组（相隔 d）做插入排序',
          '缩小增量重复，直到 d=1',
          'd=1 时即普通插入排序，序列有序'
        ],
        complexity: '最坏 O(n²)（取决于增量序列），平均约 O(n^1.3)；空间 O(1)。分组跨越元素，故不稳定。',
        pitfalls: [
          '增量序列影响复杂度，Knuth 序列 1,4,13,40... 可到 O(n^1.3)',
          '最后一趟必须 d=1',
          '不稳定：同值元素可能分到不同组'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 shell 按增量折半排序', '打印结果与 cmp/mv'] },
        code_completion: { steps: ['以步长 d 反向扫描插入', '放入 j+d 位置'] },
        ds_debug: { steps: ['检查增量尾部 d=1', '检查步长 j-=d'] },
        complexity_analysis: { steps: ['增量折半', '每趟插入排序'] }
      }
    },
    {
      key: 'merge-sort',
      section: '8.5 归并排序与基数排序',
      difficulty: 3,
      bloom: 'apply',
      tags: ['归并排序', '分治', '稳定', '比较次数'],
      knowledgeIds: ['ds-ch08-12', 'ds-ch08-04', 'ds-ch08-01'],
      cxaStem: '阅读下面这段二路归并排序算法（带比较/移动计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0, mv = 0;
void merge(int a[], int lo, int mid, int hi) {
    int b[MAXN], i, j, k;
    for (i = lo; i <= hi; i++) b[i] = a[i];
    i = lo; j = mid + 1; k = lo;
    while (i <= mid && j <= hi) {
        cmp++;
        if (b[i] <= b[j]) { a[k++] = b[i++]; mv++; }
        else { a[k++] = b[j++]; mv++; }
    }
    while (i <= mid) { a[k++] = b[i++]; mv++; }
    while (j <= hi) { a[k++] = b[j++]; mv++; }
}
void ms(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;
    ms(a, lo, mid); ms(a, mid + 1, hi); merge(a, lo, mid, hi);
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    ms(a, 0, n - 1);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d 移动=%d\\n", cmp, mv);
    return 0;
}`,
      stem: '阅读下面这段二路归并排序算法（先分后合，带比较/移动计数）。请填空补全算法，然后回答：对给定输入，结果序列以及 cmp / mv 各是多少？',
      inputs: [
        { stdin: '9 49 38 65 97 76 13 27 49 55\n', note: '教材例 9 个', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已序', why: '验证比较次数' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '验证比较次数' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测稳定性', why: '相等元素相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        if (b[i] <= b[j]) { a[k++] = b[i++]; mv++; }',
          accepted: ['        if (b[i] <= b[j]) { a[k++] = b[i++]; mv++; }'],
          hint: '取两半中较小者放入结果，相等取左半的（保证稳定）',
          pitfall: '必须用 `<=`（相等取左半）才稳定；用 `<` 会在相等时取右半，破坏稳定性。输出序列看不出，只有稳定性检查能发现。'
        },
        {
          find: '    ms(a, lo, mid); ms(a, mid + 1, hi); merge(a, lo, mid, hi);',
          accepted: ['    ms(a, lo, mid); ms(a, mid + 1, hi); merge(a, lo, mid, hi);'],
          hint: '先递归排左半、右半，然后归并',
          pitfall: '递归边界必须是 lo >= hi 返回；划分用 mid=(lo+hi)/2，左右段 [lo,mid] 与 [mid+1,hi] 不重叠。'
        }
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'b[i] <= b[j]',
          replace: 'b[i] >= b[j]',
          why: '把「取较小者」的 `<=` 改成 `>=`，归并时改取较大者，最终整段变成降序排列，结果不是升序。',
          pitfall: '归并必须取较小者放入结果（`<=` 且相等取左半才稳定）；写成 `>=` 会整体降序，是最典型的方向性错误。'
        },
        {
          kind: '循环边界错误',
          find: '    ms(a, lo, mid); ms(a, mid + 1, hi); merge(a, lo, mid, hi);',
          replace: '    ms(a, lo, mid); merge(a, lo, mid, hi);',
          why: '漏掉对右半 [mid+1, hi] 的递归排序，右半保持原始乱序，最终整段不有序。',
          pitfall: '归并排序必须先递归排好左右两半再合并；漏掉任意半边的递归都会使对应区间未排序，只有前半被排。'
        }
      ],
      asks: [
        { label: '对输入 9 49 38 65 97 76 13 27 49 55，比较次数 cmp', answer: '17', unit: '次' },
        { label: '同样的输入，移动次数 mv', answer: '29', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），比较次数 cmp', answer: '5', unit: '次' },
        { label: '归并排序的空间复杂度', answer: 'O(n)', unit: '' },
        { label: '归并排序是否稳定', answer: '是', unit: '' },
        { label: '二路归并排序的时间复杂度', answer: 'O(nlogn)', unit: '' }
      ],
      complexity: 'O(nlogn)',
      complexityAccepted: ['O(nlogn)', 'O(n*log n)', 'O(n log n)', 'nlogn'],
      askSpace: '二路归并 O(nlogn)，需要 O(n) 辅助空间（暂存数组），稳定。',
      notes: {
        idea: '归并排序分治：把序列对半分成两个有序子序列，分别递归排序后再合并。',
        steps: [
          '把 [lo,hi] 对半分成左、右两半',
          '递归排序左半与右半',
          'merge 用双指针把两半归并成一个有序段',
          '递归边界 lo>=hi 返回'
        ],
        complexity: 'O(nlogn)（每层 O(n)，共 logn 层），空间 O(n)。稳定（相等取左半）。',
        pitfalls: [
          '稳定性的关键在 `b[i] <= b[j]`',
          '需要 O(n) 辅助空间，是它相对堆排序/快排的缺点',
          '递归层数 logn，不会栈溢出（对 n 合理大小）'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', 'ms 递归分治', '打印结果与 cmp/mv'] },
        code_completion: { steps: ['双指针归并两半', '取较小者入结果'] },
        ds_debug: { steps: ['检查相等取左半（稳定性）', '检查递归边界'] },
        complexity_analysis: { steps: ['每层 O(n) 共 logn 层', '辅助空间 O(n)'] }
      }
    },
    {
      key: 'quick-sort',
      section: '8.3 交换排序（冒泡排序与快速排序）',
      difficulty: 3,
      bloom: 'apply',
      tags: ['快速排序', '枢轴', '分治', '不稳定'],
      knowledgeIds: ['ds-ch08-09', 'ds-ch08-03', 'ds-ch08-01'],
      cxaStem: '阅读下面这段快速排序算法（挖坑填数法，带比较计数），回答各问。',
      code: `#include <stdio.h>
#define MAXN 100
int cmp = 0;
int part(int a[], int lo, int hi) {
    int pivot = a[lo];
    while (lo < hi) {
        while (lo < hi && a[hi] >= pivot) { hi--; cmp++; }
        a[lo] = a[hi];
        while (lo < hi && a[lo] <= pivot) { lo++; cmp++; }
        a[hi] = a[lo];
    }
    a[lo] = pivot; return lo;
}
void qs(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int p = part(a, lo, hi);
    qs(a, lo, p - 1); qs(a, p + 1, hi);
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    qs(a, 0, n - 1);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n比较=%d\\n", cmp);
    return 0;
}`,
      stem: '阅读下面这段快速排序算法（挖坑填数法，取首元素为枢轴，带比较计数）。请填空补全算法，然后回答：对给定输入，结果序列以及比较次数 cmp 各是多少？',
      inputs: [
        { stdin: '8 49 38 65 97 76 13 27 49\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '已序（最坏）', why: '验证枢轴偏斜到退化' },
        { stdin: '5 5 4 3 2 1\n', note: '逆序', why: '验证枢轴偏斜' },
        { stdin: '4 2 2 1 1\n', note: '含重复，检测不稳定', why: '相等元素相对顺序' },
        { stdin: '1 42\n', note: '单元素', why: '边界：n=1' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        while (lo < hi && a[hi] >= pivot) { hi--; cmp++; }',
          accepted: ['        while (lo < hi && a[hi] >= pivot) { hi--; cmp++; }'],
          hint: '从右往左找比枢轴小的元素，填到左坑；等于枢轴的元素继续走（保证不越界）',
          pitfall: '必须 `>=`（或 `>`) 且带动 left/right 边界检查；若写成只 `a[hi] > pivot` 会把相等元素当做「小于」处理，破坏...（输出仍正确）。'
        },
        {
          find: '    a[lo] = pivot; return lo;',
          accepted: ['    a[lo] = pivot; return lo;'],
          hint: '把暂存的枢轴填入最终位置，返回枢轴下标',
          pitfall: '填枢轴的位置 lo 是左右指针相遇处，是枢轴的最终位置；漏掉会把枢轴数据丢失。'
        }
      ],
      defects: [
        {
          kind: '循环边界错误',
          find: '    qs(a, lo, p - 1); qs(a, p + 1, hi);',
          replace: '    qs(a, p + 1, hi);',
          why: '漏掉对枢轴左半 [lo, p-1] 的递归排序，左半保持原始乱序，结果不有序。',
          pitfall: '快排必须先递归排枢轴左右两半；漏掉任一半边都会让该区间未排序，只有右半被排。'
        },
        {
          kind: '条件判断错误',
          find: 'a[hi] >= pivot',
          replace: 'a[hi] > pivot',
          why: '把右指针扫描条件从 `>=` 改成 `>`，等于枢轴的元素不再停下而是继续左移，枢轴划分位置与比较次序改变，比较次数随之变化（部分输入结果仍正确，但比较计数不同）。',
          pitfall: '扫描条件用 `>=`/`<=` 才能把等于枢轴的元素留在原地；写成 `>` 或 `<` 会改变比较次数与相等元素处理。'
        }
      ],
      asks: [
        { label: '对输入 8 49 38 65 97 76 13 27 49，比较次数 cmp', answer: '13', unit: '次' },
        { label: '对输入 5 1 2 3 4 5（已序），比较次数 cmp', answer: '10', unit: '次' },
        { label: '对输入 5 5 4 3 2 1（逆序），比较次数 cmp', answer: '10', unit: '次' },
        { label: '快速排序最坏时间复杂度', answer: 'O(n²)', unit: '' },
        { label: '快速排序平均时间复杂度', answer: 'O(nlogn)', unit: '' },
        { label: '快速排序是否稳定', answer: '否', unit: '' }
      ],
      complexity: 'O(nlogn) 平均 / O(n²) 最坏',
      complexityAccepted: ['O(nlogn)', 'O(n^2)', 'O(n²)', 'nlogn'],
      askSpace: '快排平均 O(nlogn)，最坏（已序/逆序取首元素为枢轴）退化为 O(n²)。不稳定。',
      notes: {
        idea: '快排选一个枢轴，把小于它的放左边、大于它的放右边，再对左右递归排序。',
        steps: [
          '取 a[lo] 为枢轴（挖坑）',
          '左右指针从两端向中间，把小于枢轴者移到左、大于者移到右',
          '左右相遇处填入枢轴',
          '对枢轴左右两段递归'
        ],
        complexity: '平均 O(nlogn)，最坏 O(n²)（每次划分极端不平衡），空间 O(logn)（递归栈）。不稳定。',
        pitfalls: [
          '已序/逆序输入、取首元素为枢轴时退化为 O(n²)',
          '取三数取中可缓解最坏情况',
          '不稳定：枢轴元素会跨越相等的元素'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', '调用 qs 快速排序', '打印结果与 cmp'] },
        code_completion: { steps: ['划分：小于枢轴左移、大于右移', '填入枢轴'] },
        ds_debug: { steps: ['检查划分方向', '检查枢轴写回位置'] },
        complexity_analysis: { steps: ['平均 nlogn', '最坏 n²'] }
      }
    },
    {
      key: 'radix-sort',
      section: '8.5 归并排序与基数排序',
      difficulty: 3,
      bloom: 'apply',
      tags: ['基数排序', 'LSD', '稳定', '分配收集'],
      knowledgeIds: ['ds-ch08-13', 'ds-ch08-04', 'ds-ch08-01'],
      cxaStem: '阅读下面这段 LSD 基数排序算法（带趟数与操作计数），回答各问。',
      code: `#include <stdio.h>
#include <stdlib.h>
#define MAXN 100
int passes = 0, totalops = 0;
void radixLSD(int a[], int n) {
    int i, maxv = 0, d = 1, *b = (int *)malloc(n * sizeof(int));
    for (i = 0; i < n; i++) if (a[i] > maxv) maxv = a[i];
    while (maxv / d > 0) {
        int cnt[10] = {0};
        for (i = 0; i < n; i++) cnt[a[i] / d % 10]++;
        for (i = 1; i < 10; i++) cnt[i] += cnt[i - 1];
        for (i = n - 1; i >= 0; i--) { b[--cnt[a[i] / d % 10]] = a[i]; totalops++; }
        for (i = 0; i < n; i++) { a[i] = b[i]; totalops++; }
        passes++; d *= 10;
    }
    free(b);
}
int main(void) {
    int a[MAXN], n, i;
    scanf("%d", &n);
    for (i = 0; i < n; i++) scanf("%d", &a[i]);
    radixLSD(a, n);
    printf("结果:");
    for (i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\npasses=%d ops=%d\\n", passes, totalops);
    return 0;
}`,
      stem: '阅读下面这段 LSD（最低位优先）基数排序算法（十进制，带趟数与操作计数）。请填空补全算法，然后回答：对给定输入，结果序列以及 passes / ops 各是多少？',
      inputs: [
        { stdin: '10 505 93 63 83 184 269 278 589 930 109\n', note: '教材例', why: '验证正确结果与计数' },
        { stdin: '5 1 2 3 4 5\n', note: '一位数', why: '只跑一趟' },
        { stdin: '5 5 4 3 2 1\n', note: '一位数', why: '只跑一趟' },
        { stdin: '1 42\n', note: '两位数', why: '跑两趟' },
        { stdin: '0\n', note: '空序列', why: '边界：n=0' }
      ],
      blanks: [
        {
          find: '        for (i = n - 1; i >= 0; i--) { b[--cnt[a[i] / d % 10]] = a[i]; totalops++; }',
          accepted: ['        for (i = n - 1; i >= 0; i--) { b[--cnt[a[i] / d % 10]] = a[i]; totalops++; }'],
          hint: '按当前位从大到小逆序分配到桶（从后往前保证稳定），再据计数定位',
          pitfall: '从 n-1 往前逆序分配是基数稳定性的关键（先被计数压到桶尾的后续元素先出）；顺向分配会破坏稳定性。'
        },
        {
          find: '        for (i = 0; i < n; i++) { a[i] = b[i]; totalops++; }',
          accepted: ['        for (i = 0; i < n; i++) { a[i] = b[i]; totalops++; }'],
          hint: '把本轮分配结果写回原数组',
          pitfall: '必须每一趟都把桶里结果写回 a，否则下一趟基于错误数据分配。'
        }
      ],
      defects: [
        {
          kind: '赋值顺序错误',
          find: 'for (i = n - 1; i >= 0; i--) { b[--cnt[a[i] / d % 10]] = a[i]; totalops++; }',
          replace: 'for (i = 0; i < n; i++) { b[--cnt[a[i] / d % 10]] = a[i]; totalops++; }',
          why: '把分配方向从「从后往前」改成「从前往后」，稳定性的关键被破坏 —— 等位元素被按输入顺序压入桶的头部，下一趟读到的顺序颠倒，多位数字无法正确收集。',
          pitfall: 'LSD 基数排序的稳定性依赖「从后往前分配」；顺向分配会让多位数字（如 505/930 这种同百位）收集顺序错误，结果是乱序。'
        },
        {
          kind: '循环边界错误',
          find: 'while (maxv / d > 0)',
          replace: 'while (maxv / d > 1)',
          why: '把趟数循环条件从 >0 改成 >1，当最高位恰为 1 时（如 maxv=42 的百位、maxv=930 这类），会漏掉最后一个有效趟，多位数字缺少最高位收集，结果乱序。',
          pitfall: '基数趟数 = 最大值的十进制位数；条件必须用 maxv/d>0 才能覆盖最高位为 1 的情况，>1 会漏掉最高位为 1 的那一趟。'
        }
      ],
      asks: [
        { label: '对输入 10 505 93 63 83 184 269 278 589 930 109，趟数 passes', answer: '3', unit: '趟' },
        { label: '同样的输入，操作次数 ops', answer: '60', unit: '次' },
        { label: '对输入 1 42（两位数），趟数 passes', answer: '2', unit: '趟' },
        { label: '基数排序的关键字比较次数', answer: '0', unit: '次' },
        { label: '基数排序是否稳定', answer: '是', unit: '' },
        { label: '基数排序时间复杂度', answer: 'O(d(n+r))', unit: '' }
      ],
      complexity: 'O(d(n+r))',
      complexityAccepted: ['O(d(n+r))', 'O(d*(n+r))', 'O(d(n+r))'],
      askSpace: 'LSD 基数排序 O(d(n+r))（d 位数、r 基数），需 O(n+r) 辅助空间，稳定。',
      notes: {
        idea: 'LSD 基数排序按位从低到高，对每一位做「分配 + 收集」（桶排序思想），直到最高位。',
        steps: [
          '看最大值的位数确定趟数 d',
          '每趟按当前位把元素分配到 10 个桶',
          '从后往前分配保证稳定',
          '写回数组，进入下一位'
        ],
        complexity: 'O(d(n+r))，d 位、r=10 基数；辅助空间 O(n+r)。稳定（从后往前分配）。',
        pitfalls: [
          'LSD（低位优先）与 MSD（高位优先）方向不同',
          '稳定性靠「从 n-1 逆序分配」',
          '只对整数/定长键适用，字符串等长才可 LSD'
        ]
      },
      explain: {
        code_reading: { steps: ['读入 n 与数组', 'radixLSD 按位分配收集', '打印结果与 passes/ops'] },
        code_completion: { steps: ['逆序分配保证稳定', '每趟写回'] },
        ds_debug: { steps: ['检查分配方向（稳定性）', '检查趟数条件防除零'] },
        complexity_analysis: { steps: ['趟数 = 位数', '每趟 O(n+r)'] }
      }
    }
  ]
};
