// ds-ch05 树 第 3 批（7 个 code entry）。规则同 ds-ch05-b.mjs。坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次；错误版不能崩/超时；模板串里 printf 换行写 \\n。
export default {
  shard: 'ds-ch05',
  chapter: '第5章 树和二叉树',
  category: 'ds',
  source: '自撰（依据《数据结构》第5章 树 知识点体系）',
  entries: [
    {
      key: 'bt-count-nodes',
      cxaStem: '阅读下面的二叉树结点统计程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉树', '二叉链表', '结点计数', '递归', '后序'],
      knowledgeIds: ['ds-ch05-02', 'ds-ch05-09'],
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
static int countNodes(TN *p) {
    if (p == NULL) return 0;
    return countNodes(p->l) + countNodes(p->r) + 1;
}
int main(void) {
    TN *root;
    build(&root);
    printf("结点数 = %d\\n", countNodes(root));
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），统计整棵二叉树的结点个数（含根结点）。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树（3 层），7 个结点。', why: 'full tree 7 nodes.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链（1->2->3），3 个结点。', why: 'right chain 3 nodes.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根 + 左孩子，2 个结点。', why: 'root with left child, 2 nodes.' },
        { stdin: '-1\n', note: '空树，0 个结点。', why: 'empty tree 0 nodes.' },
      ],
      blanks: [
        {
          find: '    if (p == NULL) return 0;',
          accepted: ['    if (p == NULL) return 0;'],
          hint: '空子树没有结点，返回 0。',
          pitfall: '★ 递归基准必须是「空子树返回 0」。写成 `return 1;` 会让每个 NULL 都多算 1 个结点，导致整树计数虚增；空树输入 `-1` 甚至输出 1（正确应为 0），一测即知。',
        },
        {
          find: '    return countNodes(p->l) + countNodes(p->r) + 1;',
          accepted: ['    return countNodes(p->l) + countNodes(p->r) + 1;'],
          hint: '结点数 = 左子树结点 + 右子树结点 + 1（算上根）。',
          pitfall: '★ 末尾 +1 是「当前根结点本身」，漏掉它整树少 1；只写 `countNodes(p->l)` 则连右子树都丢。NULL 子结点的计数已由基准返回 0 兜底，不要在这里再判断 NULL。',
        },
      ],
      defects: [
        {
          kind: '递归基准错误',
          find: '    if (p == NULL) return 0;',
          replace: '    if (p == NULL) return 1;',
          why: '把空子树当成有 1 个结点，导致每个空指针都贡献 1，计数虚增。',
          pitfall: '★ 空子树应是 0。满二叉树正确 7，本缺陷 15；单结点正确 1 → 2；空树 `-1` 正确 0 → 1（最直观，基准边界）。',
        },
        {
          kind: '循环边界错误',
          find: '    return countNodes(p->l) + countNodes(p->r) + 1;',
          replace: '    return countNodes(p->l) + countNodes(p->r);',
          why: '漏加当前根结点自身，整树结点数少 1。',
          pitfall: '★ 去掉 +1 后每个子树贡献 = 子结点数，根未被计入。满二叉树 7 → 6、空树仍 0（因为基准没变）。输出看似「合法的小数」，只有与正确答案对比才暴露。',
        },
      ],
      asks: [
        { label: '满二叉树（3 层）的结点数', answer: '7', unit: '' },
        { label: '空树的结点数', answer: '0', unit: '' },
        { label: '结点数计算公式', answer: '左+右+1', unit: '' },
        { label: '该算法的时间复杂度', answer: 'O(n)', unit: '' },
        { label: 'n 个结点的二叉树空链域个数', answer: 'n+1', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '统计结点用递归后序：空子树返回 0，否则返回左右子树结点数之和再加 1（当前根）。',
        steps: [
          '先序建立二叉树（-1 表空）。',
          '递归统计左右子树结点。',
          '左右之和 +1 返回。',
        ],
        complexity: '每个结点访问一次，O(n)；递归栈深 O(h)。',
        pitfalls: [
          '空子树基准返回 0。',
          '最后 +1 算根自身。',
          '别把 NULL 子结点当结点。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '先序建立树。',
            '后序统计结点。',
            '打印结点数。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点访问一次。',
            'O(n)，递归栈 O(h)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查递归基准与 +1。',
            '修正后得正确结点数。',
          ],
        },
      },
    },
    {
      key: 'bt-reflection',
      cxaStem: '阅读下面的二叉树镜像（左右交换）程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉树', '镜像', '递归', '先序', '左右交换'],
      knowledgeIds: ['ds-ch05-02', 'ds-ch05-09'],
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
static void mirror(TN *p) {
    if (p == NULL) return;
    TN *t = p->l;
    p->l = p->r;
    p->r = t;
    mirror(p->l);
    mirror(p->r);
}
static void preorder(TN *p) {
    if (p == NULL) return;
    printf("%d ", p->data);
    preorder(p->l);
    preorder(p->r);
}
int main(void) {
    TN *root;
    build(&root);
    mirror(root);
    preorder(root);
    printf("\\n");
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），先将其镜像（左右子树对调），再先序遍历输出结果序列。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树镜像后再先序，输出 1 3 7 6 2 5 4。', why: 'full tree mirrored preorder differs from original.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链镜像成左链，先序仍为 1 2 3。', why: 'chain mirrored preorder unchanged.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根+左孩子镜像成根+右孩子，先序仍 1 2。', why: 'single-left mirrored unchanged in preorder.' },
        { stdin: '-1\n', note: '空树，无输出。', why: 'empty tree, nothing.' },
      ],
      blanks: [
        {
          find: '    TN *t = p->l;',
          accepted: ['    TN *t = p->l;'],
          hint: '先用临时指针保存左孩子，再交换左右。',
          pitfall: '★ 交换必须借用临时变量。若不存 `t` 而直接写 `p->l = p->r; p->r = p->l;`，第二步 `p->l` 已是原右孩子，左右都被覆盖成原右孩子，左子树丢失。',
        },
        {
          find: '    p->r = t;',
          accepted: ['    p->r = t;'],
          hint: '把暂存的（原左孩子）赋给右孩子，完成交换。',
          pitfall: '★ 第二步必须用暂存的 `t`（原左孩子）。写成 `p->r = p->l;` 会把右侧也设为已被覆盖后的值，结果左右都变成原右孩子；写成 `p->r = p->r;` 则根本没换。',
        },
      ],
      defects: [
        {
          kind: '交换取值错误',
          find: '    TN *t = p->l;',
          replace: '    TN *t = p->r;',
          why: '把「存左孩子」写成「存右孩子」，交换后左右都变成原右孩子，左子树丢失。',
          pitfall: '★ 满二叉树正确先序 1 3 7 6 2 5 4，本缺陷 1 3 7 7 3 7 7（结构坍塌）。注意镜像本身不改变树高，所以不能用「高度」当观测量，要看先序/中序序列。',
        },
        {
          kind: '递归调用缺失',
          find: '    mirror(p->l);\n    mirror(p->r);',
          replace: '    mirror(p->l);',
          why: '只镜像左子树，右子树未对调。',
          pitfall: '★ 漏掉 `mirror(p->r);` 会让右子树保持原状。满二叉树正确 1 3 7 6 2 5 4，本缺陷 1 3 7 6 2 4 5（右子树那支未镜像）。程序不崩，只是局部未交换，需对比序列才发现。',
        },
      ],
      asks: [
        { label: '满二叉树镜像后再先序的第一个值', answer: '1', unit: '' },
        { label: '镜像操作的时间复杂度', answer: 'O(n)', unit: '' },
        { label: '镜像是否改变树的深度', answer: '不改变', unit: '' },
        { label: '交换左右孩子需要几个临时变量', answer: '1 个', unit: '' },
        { label: '空 NULL 在 mirror 中的返回', answer: '直接返回', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '镜像 = 递归交换每个结点的左右孩子，最后先序遍历输出，用交换后的序列观察镜像是否生效。',
        steps: [
          '先序建立树。',
          '递归镜像（交换左右）。',
          '先序遍历输出。',
        ],
        complexity: '每结点访问一次，O(n)；递归栈深 O(h)。',
        pitfalls: [
          '交换要用临时变量。',
          '镜像不改树高，观测需用遍历序列。',
          '空子树直接返回。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建立树。',
            '镜像交换左右。',
            '先序打印。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点交换一次。',
            'O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查交换是否用临时变量。',
            '检查是否漏镜像一侧。',
          ],
        },
      },
    },
    {
      key: 'bt-leaf-depth',
      cxaStem: '阅读下面的二叉树叶子深度求和程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 3,
      bloom: 'analyze',
      tags: ['二叉树', '叶子', '深度', '递归', '带参递归'],
      knowledgeIds: ['ds-ch05-09', 'ds-ch05-01'],
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
static int leafDepth(TN *p, int d) {
    if (p == NULL) return 0;
    if (p->l == NULL && p->r == NULL) return d;
    return leafDepth(p->l, d + 1) + leafDepth(p->r, d + 1);
}
int main(void) {
    TN *root;
    build(&root);
    printf("叶子深度和 = %d\\n", leafDepth(root, 1));
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树，根深度按 1 计），求所有叶子结点（无左右孩子）的深度之和。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树，4 个叶子各深度 3，和 = 12。', why: 'full tree, 4 leaves at depth 3, sum 12.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链，叶子 3 深度 3，和 = 3。', why: 'chain, leaf at depth 3.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根+左叶，叶子 2 深度 2，和 = 2。', why: 'root with left leaf, sum 2.' },
        { stdin: '-1\n', note: '空树，无叶子，和 = 0。', why: 'empty, no leaves.' },
      ],
      blanks: [
        {
          find: '    if (p->l == NULL && p->r == NULL) return d;',
          accepted: ['    if (p->l == NULL && p->r == NULL) return d;'],
          hint: '叶子 = 左右孩子都为空，此时返回它所在深度 d。',
          pitfall: '★ 叶子返回的是「传入的深度 d」而非 1。写成 `return 1;` 会把每个叶子的深度都当 1，丢失「越深的叶子贡献越大」的关键信息；用 `||` 则会把单孩子结点也误判成叶子。',
        },
        {
          find: '    return leafDepth(p->l, d + 1) + leafDepth(p->r, d + 1);',
          accepted: ['    return leafDepth(p->l, d + 1) + leafDepth(p->r, d + 1);'],
          hint: '非叶子时把深度加 1 再下探左右子树，两子树结果相加。',
          pitfall: '★ 每下一层 d 要 +1，忘记 +1 会使所有叶子深度偏小（满二叉树 12 → 9）。只递归 `leafDepth(p->l, d + 1)` 则漏掉右子树全部叶子的深度贡献。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (p->l == NULL && p->r == NULL) return d;',
          replace: '    if (p->l == NULL || p->r == NULL) return d;',
          why: '把叶子判定从「左右都空」放宽成「任一为空」，单孩子结点被误判为叶子。',
          pitfall: '★ 右链输入 `1 -1 2 -1 3 -1 -1` 正确 3，本缺陷 1（结点 1、2 都被当成叶子提前返回深度，未下探到真正的叶子 3）。满二叉树因为无单孩子结点，结果不受影响——所以要用「含单孩子的树」的用例才能暴露。',
        },
        {
          kind: '递归调用缺失',
          find: '    return leafDepth(p->l, d + 1) + leafDepth(p->r, d + 1);',
          replace: '    return leafDepth(p->l, d + 1);',
          why: '漏加右子树的叶子深度和，只统计左子树。',
          pitfall: '★ 满二叉树正确 12（4×3），本缺陷只数左子树叶子（4、5 深度 3）得 6；实际 run 得 3。右链正确 3，本缺陷 0（根只有右孩子，`p->l` 为空返回 0）。只对比左子树可掩盖，需用右子树更深的用例。',
        },
      ],
      asks: [
        { label: '单结点树（根即叶）的叶子深度和', answer: '1', unit: '' },
        { label: '满二叉树（3 层）的叶子深度和', answer: '12', unit: '' },
        { label: '叶子的判定条件', answer: '左右孩子都为空', unit: '' },
        { label: '递归何时给 d 加 1', answer: '每下一层加 1', unit: '' },
        { label: '该算法的时间复杂度', answer: 'O(n)', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '叶子深度求和用带参递归：下传当前深度 d；空返回 0，叶子返回 d，否则返回左右子树深度和（每层 d+1）。',
        steps: [
          '从根以深度 1 开始。',
          '叶子返回 d。',
          '非叶子下探并累加。',
        ],
        complexity: '每结点一次，O(n)；递归栈深 O(h)。',
        pitfalls: [
          '叶子返回传入深度 d。',
          '每下一层 d+1。',
          '叶子判定用 &&，不用 ||。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建立树。',
            '带深度递归统计。',
            '打印叶子深度和。',
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
            '检查叶子判定。',
            '检查深度是否逐层 +1。',
          ],
        },
      },
    },
    {
      key: 'bt-inorder',
      cxaStem: '阅读下面的二叉树中序遍历程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 2,
      bloom: 'apply',
      tags: ['二叉树', '中序遍历', '递归', '二叉链表', '遍历'],
      knowledgeIds: ['ds-ch05-09', 'ds-ch05-11', 'ds-ch05-03'],
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
static void inorder(TN *p) {
    if (p == NULL) return;
    inorder(p->l);
    printf("%d ", p->data);
    inorder(p->r);
}
int main(void) {
    TN *root;
    build(&root);
    inorder(root);
    printf("\\n");
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），中序遍历输出各结点值（左-根-右）。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树中序：4 2 5 1 6 3 7。', why: 'full tree inorder.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链中序：1 2 3。', why: ' right chain inorder.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根+左叶中序：2 1。', why: 'root with left leaf inorder.' },
        { stdin: '-1\n', note: '空树，无输出。', why: 'empty tree, nothing.' },
      ],
      blanks: [
        {
          find: '    inorder(p->l);',
          accepted: ['    inorder(p->l);'],
          hint: '中序先访问左子树。',
          pitfall: '★ 中序的访问顺序是「左-根-右」。若把这行写成 `printf("%d ", p->data);` 再递归，就变成先序；若放在 `inorder(p->r);` 之后，就变成后序。错位即换遍历方法。',
        },
        {
          find: '    printf("%d ", p->data);',
          accepted: ['    printf("%d ", p->data);'],
          hint: '左子树访问完，访问根结点。',
          pitfall: '★ 访问根的语句必须夹在两个递归之间。只递归不打印、或把打印挪到头/尾，输出序列都会改变，但程序不崩溃，只有拿序列与标准中序对比才发现。',
        },
      ],
      defects: [
        {
          kind: '递归调用缺失',
          find: '    inorder(p->r);',
          replace: '    ;',
          why: '漏掉右子树的中序遍历调用，右子树的所有结点都不输出。',
          pitfall: '★ 满二叉树正确 4 2 5 1 6 3 7，本缺陷 4 2 1（根和左子树仍在，右子树 6、3、7 消失）。替换成空语句 `;` 可编译通过，程序不崩，只少一段序列。',
        },
        {
          kind: '递归调用缺失',
          find: '    inorder(p->l);',
          replace: '    ;',
          why: '漏掉左子树的中序遍历调用，左子树所有结点不输出。',
          pitfall: '★ 满二叉树正确 4 2 5 1 6 3 7，本缺陷 1 3 7（只输出右链 1-3-7？实际 run 1 3 7）。根和右子树仍在但左子树消失，序列长度明显变短。',
        },
      ],
      asks: [
        { label: '满二叉树（3 层）中序的首个值', answer: '4', unit: '' },
        { label: '中序的访问顺序', answer: '左-根-右', unit: '' },
        { label: '中序遍历的时间复杂度', answer: 'O(n)', unit: '' },
        { label: '先序/中序/后序中，根的位置', answer: '先序最前、中序居中、后序最后', unit: '' },
        { label: '右链 1-2-3 的中序序列', answer: '1 2 3', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '中序 = 左子树中序 → 访问根 → 右子树中序，递归实现。',
        steps: [
          '递归左子树。',
          '打印根。',
          '递归右子树。',
        ],
        complexity: '每结点访问一次，O(n)；递归栈深 O(h)。',
        pitfalls: [
          '访问根的语句在中间。',
          '别漏左右子树之一。',
          '空子树直接返回。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建立树。',
            '中序递归访问。',
            '打印序列。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点一次。',
            'O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查访问根的位置。',
            '检查是否漏一侧递归。',
          ],
        },
      },
    },
    {
      key: 'bt-levelorder',
      cxaStem: '阅读下面的二叉树层次遍历程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 3,
      bloom: 'analyze',
      tags: ['二叉树', '层次遍历', '队列', '广度优先', '二叉链表'],
      knowledgeIds: ['ds-ch05-11', 'ds-ch05-03'],
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
static void levelorder(TN *root) {
    if (root == NULL) return;
    TN *q[MAXN]; int head = 0, tail = 0;
    q[tail++] = root;
    while (head < tail) {
        TN *cur = q[head++];
        printf("%d ", cur->data);
        if (cur->l) q[tail++] = cur->l;
        if (cur->r) q[tail++] = cur->r;
    }
    printf("\\n");
}
int main(void) {
    TN *root;
    build(&root);
    levelorder(root);
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），用队列实现层次遍历（自上而下、从左到右）输出各结点值。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树层次：1 2 3 4 5 6 7。', why: 'full tree level order.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链层次：1 2 3。', why: 'right chain level order.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根+左叶层次：1 2。', why: 'root with left leaf, level 1 2.' },
        { stdin: '-1\n', note: '空树，无输出。', why: 'empty tree, nothing.' },
      ],
      blanks: [
        {
          find: '    TN *q[MAXN]; int head = 0, tail = 0;',
          accepted: ['    TN *q[MAXN]; int head = 0, tail = 0;'],
          hint: '定义队列数组与头尾下标，head 出队、tail 入队。',
          pitfall: '★ 队列用数组 + 头尾下标，出队是 `q[head++]`，入队是 `q[tail++]`。头尾不递增（如始终 head=0 或 head 不 ++）会导致重复处理同一结点堆积或无限循环。',
        },
        {
          find: '        if (cur->l) q[tail++] = cur->l;',
          accepted: ['        if (cur->l) q[tail++] = cur->l;'],
          hint: '当前结点有左孩子就入队。',
          pitfall: '★ 入队前必须判 `cur->l != NULL`。直接把可能为空的 `cur->l` 入队，出队时对 NULL 解引用 `cur->data` 会崩溃。层次遍历按「从左到右」先左后右，顺序颠倒会改变同一层内输出次序。',
        },
      ],
      defects: [
        {
          kind: '入队顺序颠倒',
          find: '        if (cur->l) q[tail++] = cur->l;\n        if (cur->r) q[tail++] = cur->r;',
          replace: '        if (cur->r) q[tail++] = cur->r;\n        if (cur->l) q[tail++] = cur->l;',
          why: '把右孩子先入队、左孩子后入队，同层内输出顺序变为从右到左。',
          pitfall: '★ 满二叉树正确 1 2 3 4 5 6 7，本缺陷 1 3 2 7 6 5 4（每层顺序翻转）。程序不崩，只是顺序错；若树每层只有一个结点（如右链）则看不出差别——要用每层有多结点的树。',
        },
        {
          kind: '递归调用缺失',
          find: '        if (cur->r) q[tail++] = cur->r;',
          replace: '        ;',
          why: '丢掉右孩子入队，右子树的结点全部不访问。',
          pitfall: '★ 满二叉树正确 1 2 3 4 5 6 7，本缺陷 1 2 4（只沿左孩子走）。右链 `1 -1 2 ...` 本缺陷只输出 1。NULL 不会入队（已在条件里判掉），所以只丢右侧不崩溃。',
        },
      ],
      asks: [
        { label: '层次遍历使用的数据结构', answer: '队列', unit: '' },
        { label: '层次遍历的顺序', answer: '自上而下、从左到右', unit: '' },
        { label: '层次遍历的时间复杂度', answer: 'O(n)', unit: '' },
        { label: '队列出队操作', answer: 'q[head++]', unit: '' },
        { label: '满二叉树（3 层）层次序列', answer: '1 2 3 4 5 6 7', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '层次遍历用队列：根入队，循环取队头访问，将其左右孩子依次入队，直到队列为空。',
        steps: [
          '根入队。',
          '取队头、访问后左右孩子入队。',
          '队列空即遍历完。',
        ],
        complexity: '每结点入队一次、出队一次，O(n)；辅助空间 O(最宽层宽)。',
        pitfalls: [
          '入队前判 NULL。',
          '先左后右。',
          '用 head/tail 双下标。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建立树。',
            '队列层序访问。',
            '打印序列。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点入队出队一次。',
            'O(n)，空间 O(w)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查左右入队顺序。',
            '检查入队前是否判空。',
          ],
        },
      },
    },
    {
      key: 'bt-single-child',
      cxaStem: '阅读下面的二叉树单孩子结点统计程序，回答下列问题。',
      section: '5.4 二叉树的遍历',
      difficulty: 3,
      bloom: 'analyze',
      tags: ['二叉树', '单孩子结点', '递归', '后序', '条件计数'],
      knowledgeIds: ['ds-ch05-02', 'ds-ch05-09'],
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
static int singleChild(TN *p) {
    if (p == NULL) return 0;
    int cur = (p->l == NULL) != (p->r == NULL) ? 1 : 0;
    return cur + singleChild(p->l) + singleChild(p->r);
}
int main(void) {
    TN *root;
    build(&root);
    printf("单孩子结点数 = %d\\n", singleChild(root));
    return 0;
}`,
      stem: '用先序建立二叉树（-1 表示空子树），统计「恰好只有一个孩子」的结点个数（左右孩子恰有一个为空）。',
      inputs: [
        { stdin: '1 2 4 -1 -1 5 -1 -1 3 6 -1 -1 7 -1 -1\n', note: '满二叉树每个结点有 0 或 2 个孩子，单孩子结点 0 个。', why: 'full tree 0 single-child.' },
        { stdin: '1 -1 2 -1 3 -1 -1\n', note: '右链，结点 1、2 各只有右孩子，单孩子结点 2 个。', why: 'right chain 2 single-child.' },
        { stdin: '1 2 -1 -1 -1\n', note: '根只有左孩子，单孩子结点 1 个。', why: 'root with left child, 1 single-child.' },
        { stdin: '-1\n', note: '空树，0 个。', why: 'empty tree 0.' },
      ],
      blanks: [
        {
          find: '    int cur = (p->l == NULL) != (p->r == NULL) ? 1 : 0;',
          accepted: ['    int cur = (p->l == NULL) != (p->r == NULL) ? 1 : 0;'],
          hint: '恰有一个孩子 ⇔ 左空与右空的真假不同（异或）。',
          pitfall: '★ 「恰好一个孩子」用异或 `!=`（左右空状态不同）。写成 `&&` 会统计叶子（两个都空），写成 `||` 会统计「至少一个孩子」（含两个都有的）。三者是不同概念，必须区分叶子/单孩子/非空。',
        },
        {
          find: '    return cur + singleChild(p->l) + singleChild(p->r);',
          accepted: ['    return cur + singleChild(p->l) + singleChild(p->r);'],
          hint: '单孩子结点数 = 本结点判定 + 左子树单孩子 + 右子树单孩子。',
          pitfall: '★ 漏加 `singleChild(p->r)` 会丢掉右子树中的单孩子结点；漏加 `cur` 则本结点即使单孩子也不计数。满二叉树因无单孩子结点，只缺右子树项时结果仍可能为 0（被掩盖），需用含单孩子的链树用例。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    int cur = (p->l == NULL) != (p->r == NULL) ? 1 : 0;',
          replace: '    int cur = (p->l == NULL) || (p->r == NULL) ? 1 : 0;',
          why: '把「恰好一个孩子」放宽成「至少一个孩子为空」，双孩子结点也被计入。',
          pitfall: '★ 满二叉树正确 0，本缺陷 4（每层双孩子结点都被多计）。右链正确 2，本缺陷 3（叶子 3 两个都空也被 `||` 判为真）。用 `&&` 则变成统计叶子，又是另一种错。',
        },
        {
          kind: '递归调用缺失',
          find: '    return cur + singleChild(p->l) + singleChild(p->r);',
          replace: '    return cur + singleChild(p->l);',
          why: '漏加右子树的单孩子结点数，只统计左子树。',
          pitfall: '★ 满二叉树正确 0，本缺陷 0（恰好被掩盖，因为满树无单孩子）；右链正确 2，本缺陷 1（只数到根 1，右子树 2 漏了）。所以要用含单孩子且在右子树的用例才能暴露。',
        },
      ],
      asks: [
        { label: '右链 1-2-3 的单孩子结点数', answer: '2', unit: '' },
        { label: '满二叉树的单孩子结点数', answer: '0', unit: '' },
        { label: '「恰好一个孩子」的布尔表达式', answer: '(l==NULL) != (r==NULL)', unit: '' },
        { label: '叶子/单孩子/都有的区分', answer: '&& / != / ||', unit: '' },
        { label: '该算法的时间复杂度', answer: 'O(n)', unit: '' },
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', 'O(n) 线性'],
      askSpace: false,
      notes: {
        idea: '用递归后序统计单孩子结点：本结点「恰有一个孩子」则 +1，再累加左右子树的单孩子数。',
        steps: [
          '先序建立树。',
          '判断本结点是否单孩子。',
          '递归累加左右子树。',
        ],
        complexity: '每结点一次，O(n)。',
        pitfalls: [
          '「恰好一个」用 !=（异或）。',
          '区分叶子/单孩子/至少一个。',
          '别漏右侧递归。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '建立树。',
            '后序统计单孩子。',
            '打印计数。',
          ],
        },
        complexity_analysis: {
          steps: [
            '每结点一次。',
            'O(n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查单孩子判定表达式。',
            '检查是否漏右侧递归。',
          ],
        },
      },
    },
    {
      key: 'bt-wpl',
      cxaStem: '阅读下面的哈夫曼树带权路径长度（WPL）计算程序，回答下列问题。',
      section: '5.7 哈夫曼树与哈夫曼编码',
      difficulty: 4,
      bloom: 'analyze',
      tags: ['哈夫曼树', '哈夫曼编码', 'WPL', '贪心', '带权路径长度'],
      knowledgeIds: ['ds-ch05-04', 'ds-ch05-18'],
      code: `#include <stdio.h>
#define MAXN 100
/* 哈夫曼树带权路径长度 WPL：每次合并两个最小权值，WPL 累加每次合并的和 */
int main(void) {
    int n, w[MAXN], i;
    if (scanf("%d", &n) != 1) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) scanf("%d", &w[i]);
    long wpl = 0;
    while (n > 1) {
        int mi = 0, mj = 1;
        if (w[mi] > w[mj]) { int t = mi; mi = mj; mj = t; }
        for (i = 2; i < n; i++) {
            if (w[i] < w[mi]) { mj = mi; mi = i; }
            else if (w[i] < w[mj]) { mj = i; }
        }
        int s = w[mi] + w[mj];
        wpl += s;
        w[mi] = s;
        w[mj] = w[n - 1];
        n--;
    }
    printf("WPL = %ld\\n", wpl);
    return 0;
}`,
      stem: '读入叶子权值个数 n 及 n 个权值，按哈夫曼算法反复合并两个最小权值，累加每次合并的和以计算哈夫曼树的带权路径长度 WPL。',
      inputs: [
        { stdin: '4 7 5 2 4\n', note: '权值 7 5 2 4，WPL = 35。', why: 'wpl 35.' },
        { stdin: '3 1 2 3\n', note: '权值 1 2 3，WPL = 9。', why: 'wpl 9.' },
        { stdin: '5 2 3 4 7 9\n', note: '权值 2 3 4 7 9，WPL = 55。', why: 'wpl 55.' },
        { stdin: '2 10 20\n', note: '权值 10 20，WPL = 30。', why: 'wpl 30.' },
      ],
      blanks: [
        {
          find: '            if (w[i] < w[mi]) { mj = mi; mi = i; }',
          accepted: ['            if (w[i] < w[mi]) { mj = mi; mi = i; }'],
          hint: '若当前权值比最小还小，则原最小退为次小，当前成为最小。',
          pitfall: '★ 找两个最小权值时，先比 `w[i] < w[mi]` 是否刷新最小，再用 `else if (w[i] < w[mj])` 刷新次小。颠倒这两个分支或比较方向写反（`>` 会去找最大），WPL 会错。循环需从下标 2 开始（前两个已作为初始 mi/mj）。',
        },
        {
          find: '        wpl += s;',
          accepted: ['        wpl += s;'],
          hint: '每次合并的两个权值之和要累加到 WPL。',
          pitfall: '★ WPL = 所有内部结点权值之和 = 每次合并的和累加。写成 `wpl = s`（不累加）只留最后一次合并的和，且不崩溃、输出仍是个「合法」的数（如 35 → 18），只有对比才知道丢了历史合并。',
        },
      ],
      defects: [
        {
          kind: '比较方向错误',
          find: '            if (w[i] < w[mi]) { mj = mi; mi = i; }',
          replace: '            if (w[i] > w[mi]) { mj = mi; mi = i; }',
          why: '把「找最小」的反向比较，导致选出最大的两个权值合并，得到错误的 WPL。',
          pitfall: '★ 正确 35，本缺陷 36（权值 7 5 2 4 改为合最大）。哈夫曼必须始终合并最小的两个，方向一改 WPL 立即变大。注意程序不崩，只是数值不同，要对比。',
        },
        {
          kind: '运算错误',
          find: '        wpl += s;',
          replace: '        wpl = s;',
          why: '漏掉累加，WPL 只等于最后一次合并的和。',
          pitfall: '★ 正确 35，本缺陷 18（权值 7 5 2 4，最后合并 7+11=18）。WPL 定义是所有内部结点权值之和，漏加会显著偏小，且不像越界那样一眼看出，需逐次合并对比。',
        },
      ],
      asks: [
        { label: '权值 1 2 3 的 WPL', answer: '9', unit: '' },
        { label: '权值 10 20 的 WPL', answer: '30', unit: '' },
        { label: 'WPL 的组成', answer: '所有内部结点权值之和', unit: '' },
        { label: '每次合并选两个什么样的权值', answer: '最小的两个', unit: '' },
        { label: '该算法的时间复杂度', answer: 'O(n^2)（简单实现）', unit: '' },
      ],
      complexity: 'O(n^2)（每次扫描找两个最小，共 n-1 次合并）',
      complexityAccepted: ['O(n^2)', 'O(n^2) 简单实现'],
      askSpace: false,
      notes: {
        idea: '哈夫曼 WPL 可用「反复贪心合并最小两权值」直接算出：每次取两个最小权值相加，把和累入 WPL，再把和放回待选集合，重复至只剩一个（等价于建树后求所有内部结点之和）。',
        steps: [
          '读入 n 与 n 个权值。',
          '每次找两个最小，求和并累入 WPL。',
          '用和替换最小、用末尾元素填充次小并 n--。',
        ],
        complexity: '每次合并扫描 O(n)，共 n-1 次，O(n^2)；若用小顶堆可优化到 O(n log n)。',
        pitfalls: [
          '永远合并最小的两个。',
          'WPL 累加，不是只取最后一次。',
          '用末尾元素填充后 n-- 保持有效区间。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读权值。',
            '反复合并最小两权值。',
            '累加得 WPL 并打印。',
          ],
        },
        complexity_analysis: {
          steps: [
            'n-1 次合并。',
            '每次 O(n) 扫描，O(n^2)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查选最小还是最大。',
            '检查是否累加而非覆盖。',
          ],
        },
      },
    },
  ],
}
