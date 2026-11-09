// ds-ch05 树 第 2 批（2 个 code entry）。规则同 ds-ch05.mjs。坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次；错误版不能崩/超时。
export default {
  shard: 'ds-ch05',
  chapter: '第5章 树和二叉树',
  category: 'ds',
  source: '自撰（依据《数据结构》第5章 树 知识点体系）',
  entries: [
    {
      key: 'bt-count-leaves',
      cxaStem: '阅读下面的二叉树叶子结点统计程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉树', '二叉链表', '叶子结点', '递归', '遍历'],
      knowledgeIds: ['ds-ch05-02', 'ds-ch05-09', 'ds-ch05-05'],
      code: `#include <stdio.h>
#include <stdlib.h>
#define MAXN 100
typedef struct TN { int data; struct TN *l, *r; } TN;
static void build(TN **p) {
    int x; scanf("%d", &x);
    if (x == -1) { *p = NULL; return; }
    *p = (TN *)malloc(sizeof(TN));
    (*p)->data = x;
    build(&(*p)->l);
    build(&(*p)->r);
}
static int countLeaves(TN *p) {
    if (p == NULL) return 0;
    if (p->l == NULL && p->r == NULL) return 1;
    return countLeaves(p->l) + countLeaves(p->r);
}
int main(void) {
    TN *root;
    build(&root);
    printf("叶子结点数 = %d\\n", countLeaves(root));
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），统计叶子结点（无左右孩子的结点）个数。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树（3 层），叶子 = 4、5、6、7，共 4 个。', why: 'full tree 4 leaves.' },
        { stdin: '1 -1 2 4 -1 -1 5 -1 -1\n', note: '根无左孩子、右子树含两个叶（4 和 5），叶子 = 2。', why: 'root has only right child, 2 leaves.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根 + 左孩子为叶，叶子 = 1（结点 2）。', why: 'root with left child leaf.' },
        { stdin: '-1\n', note: '空树，叶子 0。', why: 'empty tree.' },
      ],
      blanks: [
        {
          find: '    if (p->l == NULL && p->r == NULL) return 1;',
          accepted: ['    if (p->l == NULL && p->r == NULL) return 1;'],
          hint: '叶子结点 = 左右孩子都为空。',
          pitfall: '★ 必须先判空（p==NULL 返回 0），再判叶子（左右都空返回 1），最后递归。顺序不对（如先判 `p->l==NULL` 再判 `p->r==NULL` 时用 `||`）会把只有单孩子的结点也当成叶子。叶子定义是「左右孩子都为空」。',
        },
        {
          find: '    return countLeaves(p->l) + countLeaves(p->r);',
          accepted: ['    return countLeaves(p->l) + countLeaves(p->r);'],
          hint: '叶子数 = 左子树叶子 + 右子树叶子。',
          pitfall: '★ 递归用「先序建立 + 后序统计」结构：建立时先读根再递归左右（先序），统计时先递归左右再合并（后序）。写成 `countLeaves(p->l)` 就够吗？—— 不，要加 `+ countLeaves(p->r)`，否则只统计左子树。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (p->l == NULL && p->r == NULL) return 1;',
          replace: '    if (p->l == NULL || p->r == NULL) return 1;',
          why: '把「左右孩子都为空」写成「左右任一为空」就判成叶子，导致只有单孩子的结点被误判为叶子。',
          pitfall: '★ 用 `||` 会把「只有左孩子」或「只有右孩子」的结点也算成叶子。输入 `1 2 -1 -1 -1`（根+左叶）正确应为 1，错误版得 2；输入右链 `1 -1 2 -1 3 -1 -1` 正确 1，错误版 3。叶子定义必须是左右孩子都为空。',
        },
        {
          kind: '循环边界错误',
          find: '    return countLeaves(p->l) + countLeaves(p->r);',
          replace: '    return countLeaves(p->l);',
          why: '统计时漏加右子树的叶子数，只统计左子树。',
          pitfall: '★ 只返回 `countLeaves(p->l)` 会丢掉右子树的所有叶子。输入满二叉树正确 4，错误版只数根左子树的叶子（2）。程序不崩溃，输出像「合法的叶子数」，只有对比正确答案才发现。',
        },
      ],
      asks: [
        { label: '输入 1 -1 2 -1 3 的叶子数', answer: '1', unit: '' },
        { label: '输入 -1（空树）的叶子数', answer: '0', unit: '' },
        { label: '叶子结点的定义', answer: '左右孩子都为空', unit: '' },
        { label: '该统计用先序还是后序逻辑', answer: '后序', unit: '' },
        { label: '含 n 个结点的二叉树空链域个数', answer: 'n+1', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      notes: {
        idea: '统计叶子结点用递归后序：空子树返回 0，叶子（左右皆空）返回 1，否则返回左右子树叶子之和。',
        steps: [
          '先序建立二叉树（-1 表空）。',
          '递归统计叶子。',
          '返回总和。',
        ],
        complexity: '每个结点访问一次，O(n)。',
        pitfalls: [
          '先判空再判叶子再递归。',
          '叶子 = 左右都空，不是左空。',
          '别把 NULL 当叶子。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先序建立树。',
            '后序统计叶子。',
            '打印结果。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点访问一次。',
            'O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查叶子判断条件。',
            '修正后得正确叶子数。',
          ],
        },
      },
    },
    {
      key: 'bt-depth',
      cxaStem: '阅读下面的二叉树深度计算程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 3,
      bloom: 'apply',
      tags: ['二叉树', '深度', '递归', '后序', '二叉链表'],
      knowledgeIds: ['ds-ch05-09', 'ds-ch05-01', 'ds-ch05-07'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct TN { int data; struct TN *l, *r; } TN;
static void build(TN **p) {
    int x; scanf("%d", &x);
    if (x == -1) { *p = NULL; return; }
    *p = (TN *)malloc(sizeof(TN));
    (*p)->data = x;
    build(&(*p)->l);
    build(&(*p)->r);
}
static int depth(TN *p) {
    int dl, dr;
    if (p == NULL) return 0;
    dl = depth(p->l);
    dr = depth(p->r);
    return (dl > dr ? dl : dr) + 1;
}
int main(void) {
    TN *root;
    build(&root);
    printf("树深度 = %d\\n", depth(root));
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），计算树的深度（根结点深度为 1，空树深度为 0）。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树（3 层），深度 3。', why: 'full tree depth 3.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '左链（1->2->3），深度 3。', why: 'chain depth 3.' },
        { stdin: '1 -1 -1\n', note: '单结点，深度 1。', why: 'single node depth 1.' },
        { stdin: '-1\n', note: '空树，深度 0。', why: 'empty depth 0.' },
      ],
      blanks: [
        {
          find: '    return (dl > dr ? dl : dr) + 1;',
          accepted: ['    return (dl > dr ? dl : dr) + 1;'],
          hint: '深度 = 左右子树较大深度 + 1（算上根）。',
          pitfall: '★ 深度要「左右较大 + 1」。写成 `dl > dr ? dl : dr`（不加 1）或 `(dl + dr) / 2` 都会错；写成除法更是把「深度」和「平均高度」混淆。+1 是因为当前结点本身算一层。',
        },
        {
          find: '    dl = depth(p->l);\n    dr = depth(p->r);',
          accepted: ['    dl = depth(p->l);\n    dr = depth(p->r);'],
          hint: '先递归求左、右子树深度。',
          pitfall: '★ 递归返回的是子树的深度，需要先求出左右子树深度再比较。写成 `return depth(p->l) + 1;` 只算左链，会得到左子树路径长度而不是整树深度（右子树更深的链被忽略）。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    return (dl > dr ? dl : dr) + 1;',
          replace: '    return (dl > dr ? dl : dr);',
          why: '求深度忘加 1，根结点没算进去，所有深度偏小 1。',
          pitfall: '★ 漏 +1 让每个结点都少算自己这一层。空树仍返回 0，单结点深度变 0（应为 1），满二叉树 3 层变 2 层。只有对比「结点数 vs 深度」才发现，且很多树深度恰好=层数-1 看不出。',
        },
        {
          kind: '循环边界错误',
          find: '    if (p == NULL) return 0;',
          replace: '    if (p == NULL) return 1;',
          why: '空子树深度返回 1，导致所有路径长度被多算，深度整体偏大。',
          pitfall: '★ 空树深度应为 0，改成返回 1 会让空子树被当成「一层」。单结点深度变 2、空树变 1、每层都虚增。这个错误连空树输入 `-1` 都与正确版不同（正确 0 vs 错误 1），是基准边界最容易写错的一处。',
        },
      ],
      asks: [
        { label: '单结点树的深度', answer: '1', unit: '' },
        { label: '空树的深度', answer: '0', unit: '' },
        { label: '深度公式', answer: 'max(dl,dr)+1', unit: '' },
        { label: '深度与结点数的关系（完全二叉树）', answer: 'O(log n)', unit: '' },
        { label: '该算法的时间复杂度', answer: 'O(n)', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      notes: {
        idea: '求深度用递归后序：空返回 0，否则返回 max(左深,右深)+1。',
        steps: [
          '先序建立树。',
          '递归求左右深度。',
          '取较大 +1。',
        ],
        complexity: '每结点访问一次，O(n)，递归空间 O(h)。',
        pitfalls: [
          '深度公式 max+1。',
          '空树深度 0。',
          '别只递归左子树。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先序建立树。',
            '后序求深度。',
            '打印结果。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点一次。',
            'O(n)，递归栈 O(h)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查深度公式与基准。',
            '修正后得正确深度。',
          ],
        },
      },
    },
  ],
}
