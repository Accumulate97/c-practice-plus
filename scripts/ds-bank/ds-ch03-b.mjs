// ds-ch03 栈与队列 第 2 批（4 个 entry）。规则同 ds-ch03.mjs。坑：knowledgeIds/tags 必须数组；defect1 的 find 不能与 defect0 的替换重叠；find 恰好一次。
export default {
  shard: 'ds-ch03',
  chapter: '第3章 栈和队列',
  category: 'ds',
  source: '自撰（依据《数据结构》第3章 栈和队列 知识点体系）',
  entries: [
    {
      key: 'link-stack',
      cxaStem: '阅读下面的链式栈程序，回答下列问题。',
      section: '3.3 栈的链式表示与实现',
      difficulty: 2,
      bloom: 'apply',
      tags: ['链栈', '链式存储', '入栈', '出栈'],
      knowledgeIds: ['ds-ch03-09', 'ds-ch03-10', 'ds-ch03-01'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct Node { int data; struct Node *next; } Node, *Stack;
static int push(Stack *S, int x) {
    Node *p = (Node *)malloc(sizeof(Node));
    if (p == NULL) return 0;
    p->data = x; p->next = *S; *S = p;
    return 1;
}
static int pop(Stack *S, int *out) {
    if (*S == NULL) return 0;
    Node *t = *S; *out = t->data; *S = t->next; free(t);
    return 1;
}
int main(void) {
    Stack S = NULL; int x, popped = 0, pushed = 0;
    while (scanf("%d", &x) == 1) { if (push(&S, x)) pushed++; }
    while (pop(&S, &x)) { printf("%d ", x); popped++; }
    printf("\\n入栈 %d 次、出栈 %d 次、是否相等 %d\\n", pushed, popped, pushed == popped);
    return 0;
}`,
      stem: '用带头结点的链式栈（头插法：新结点插在栈顶 front）实现读入一组整数并入栈，然后反复出栈打印（后进先出）。统计入栈/出栈次数并判断是否相等。',
      inputs: [
        { stdin: '10 20 30\n', note: '出栈序 30 20 10，入 3 出 3。', why: '后进先出，先 30。' },
        { stdin: '1 2 3 4 5\n', note: '出栈序 5 4 3 2 1，入 5 出 5。', why: '反序输出。' },
        { stdin: '7\n', note: '出栈 7，入 1 出 1。', why: '单元素。' },
        { stdin: '\n', note: '无输入，入 0 出 0。', why: '空栈，pop 立即失败。' },
      ],
      blanks: [
        {
          find: '    p->data = x; p->next = *S; *S = p;',
          accepted: ['    p->data = x; p->next = *S; *S = p;'],
          hint: '头插法：新结点 next 指向当前栈顶，再把栈顶指针指向新结点。',
          pitfall: '链式栈用头插法使栈顶在表头（O(1) 存取）。★ 必须先把新结点 next 接到旧栈顶，再把 `*S` 更新为新结点 —— 顺序倒过来（先 `*S=p` 再 `p->next=*S`）会让新结点 next 指向自身，形成环。',
        },
        {
          find: '    Node *t = *S; *out = t->data; *S = t->next; free(t);',
          accepted: ['    Node *t = *S; *out = t->data; *S = t->next; free(t);'],
          hint: '先取栈顶元素并保存旧栈顶指针，把栈顶后移，再释放旧栈顶。',
          pitfall: '出栈必须先用 t 暂存待释放结点，把 `*S` 移到 `t->next` 之后再 free(t)。★ 如果 `free(t)` 之后再用 `t->next` 就是 use-after-free；如果先 `*S=t->next` 后没暂存 t，就无法释放（内存泄漏）。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: '    p->data = x; p->next = *S; *S = p;',
          replace: '    p->data = x; p->next = *S;',
          why: '入栈时漏掉把栈顶指针更新为新结点。新结点永远没接进栈，栈顶还是 NULL，后续 pop 永远返回失败。',
          pitfall: '★ 漏掉 `*S = p;` 后 push 看起来「成功」（返回 1、pushed 计数照加），但栈顶从未移动，读入多个后 pop 仍找不到任何元素 —— 这是链式结构里最隐蔽的「指针没接上」错误，只有用 pop 验证才发现。',
        },
        {
          kind: '赋值顺序错误',
          find: '    Node *t = *S; *out = t->data; *S = t->next; free(t);',
          replace: '    Node *t = *S; *out = t->data; free(t); *S = t->next;',
          why: '出栈时先 free(t) 再用 t->next。释放后访问 t->next 是 use-after-free（读已释放内存）。',
          pitfall: '★ 必须先 `*S = t->next;` 再 `free(t);`。写成先 free 后取 next 是典型的 use-after-free，在部分编译器/运行环境下可能仍「碰巧」输出正确（释放内存未立即被覆盖），但这是未定义行为，换环境或开 -fsanitize 就暴露。',
        },
      ],
      asks: [
        { label: '输入 10 20 30 的出栈顺序', answer: '30 20 10', unit: '' },
        { label: '链式栈入栈的时间复杂度', answer: 'O(1)', unit: '' },
        { label: '链式栈出栈的时间复杂度', answer: 'O(1)', unit: '' },
        { label: '链式栈有没有栈满问题', answer: '没有（按需分配）', unit: '' },
        { label: '链式栈栈顶在表头还是表尾', answer: '表头', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1) 常数'],
      notes: {
        idea: '链式栈用头插法，栈顶固定在表头，入栈出栈都在表头 O(1) 完成，无栈满问题（除非内存耗尽）。',
        steps: [
          '入栈：malloc 新结点，头插到栈顶。',
          '出栈：取栈顶，移动栈顶指针，释放旧栈顶。',
        ],
        complexity: '入栈出栈均 O(1)。',
        pitfalls: [
          '头插法顺序：先接 next 再移栈顶。',
          '出栈要暂存 t 再释放。',
          '链栈无栈满，但单结点操作要防 use-after-free。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入并头插压栈。',
            '出栈反序打印。',
            '统计并比较。',
          ],
        },
        complexity_analysis: {
          steps: [
            '头插 O(1)。',
            '出栈 O(1)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查指针更新与释放顺序。',
            '修正后得到反序输出。',
          ],
        },
      },
    },
    {
      key: 'link-queue',
      cxaStem: '阅读下面的链式队列程序，回答下列问题。',
      section: '3.4 队列的定义与链式表示',
      difficulty: 2,
      bloom: 'apply',
      tags: ['链队列', '队头', '队尾', '入队出队'],
      knowledgeIds: ['ds-ch03-12', 'ds-ch03-11', 'ds-ch03-01'],
      code: `#include <stdio.h>
#include <stdlib.h>
typedef struct Node { int data; struct Node *next; } Node;
typedef struct { Node *front, *rear; } Queue;
static void init(Queue *q) { q->front = q->rear = NULL; }
static int enQueue(Queue *q, int x) {
    Node *p = (Node *)malloc(sizeof(Node));
    if (p == NULL) return 0;
    p->data = x; p->next = NULL;
    if (q->rear == NULL) { q->front = q->rear = p; }
    else { q->rear->next = p; q->rear = p; }
    return 1;
}
static int deQueue(Queue *q, int *out) {
    if (q->front == NULL) return 0;
    Node *t = q->front; *out = t->data;
    q->front = t->next;
    if (q->front == NULL) q->rear = NULL;
    free(t);
    return 1;
}
int main(void) {
    Queue q; init(&q); int x, en = 0, de = 0;
    while (scanf("%d", &x) == 1) { if (enQueue(&q, x)) en++; }
    while (deQueue(&q, &x)) { printf("%d ", x); de++; }
    printf("\\n入队 %d 次、出队 %d 次、是否相等 %d\\n", en, de, en == de);
    return 0;
}`,
      stem: '用链式队列（front 队头、rear 队尾，无头结点）实现读入一组整数入队，再反复出队打印（先进先出）。统计入队/出队次数并判断是否相等。',
      inputs: [
        { stdin: '10 20 30\n', note: '出队序 10 20 30，入 3 出 3。', why: '先进先出。' },
        { stdin: '1 2 3 4 5\n', note: '出队序 1 2 3 4 5。', why: 'FIFO。' },
        { stdin: '7\n', note: '出队 7，入 1 出 1。', why: '单元素。' },
        { stdin: '\n', note: '无输入，入 0 出 0。', why: '空队，deQueue 立即失败。' },
      ],
      blanks: [
        {
          find: '    else { q->rear->next = p; q->rear = p; }',
          accepted: ['    else { q->rear->next = p; q->rear = p; }'],
          hint: '非空时把新结点接到队尾之后，并更新队尾指向新结点。',
          pitfall: '链队列入队：非空时接在队尾之后并把 `q->rear` 更新为新结点。★ 漏掉 `q->rear = p;` 会让队尾永远停在第一个入队元素，后续入队都串错位置（后入的元素丢失或挂错），且出队时队尾无效。',
        },
        {
          find: '    if (q->front == NULL) q->rear = NULL;',
          accepted: ['    if (q->front == NULL) q->rear = NULL;'],
          hint: '出队后若队头变空，说明队列空了，队尾也要置空。',
          pitfall: '链队列出队后队头变空要将队尾一并置 NULL。★ 漏掉这一句后，队列变空但 `q->rear` 仍指向已释放的结点（悬垂指针），下次入队时走 `q->rear == NULL` 判断会失败、走 else 分支对野指针取 next → use-after-free 或崩溃。',
        },
      ],
      defects: [
        {
          kind: '指针丢失',
          find: '    else { q->rear->next = p; q->rear = p; }',
          replace: '    else { q->rear->next = p; }',
          why: '入队时漏掉更新队尾 rear。后续再入队会把新结点接到旧的（第一个）队尾之后，队尾指针不动，队列顺序错乱。',
          pitfall: '★ 只接 next 不更新 rear，队尾指针永远停留在第一个元素。连续入队后 front 正确但 rear 错位，出队时用 rear 的地方（如判空/接新）全错，只有入队多个并出队比对顺序才能发现。',
        },
        {
          kind: '指针丢失',
          find: '    Node *t = q->front; *out = t->data;\n    q->front = t->next;\n    if (q->front == NULL) q->rear = NULL;\n    free(t);',
          replace: '    Node *t = q->front; *out = t->data;\n    q->front = t->next;\n    free(t);',
          why: '出队后漏掉把队尾 rear 置空。队列变空时 rear 仍指向已释放的结点（悬垂指针）。',
          pitfall: '★ 出队最后一个元素后 front 变 NULL，但 rear 还指向被 free 的结点。之后若再入队，enQueue 判 `q->rear == NULL` 会走 else 分支，对悬垂指针取 next 写 —— use-after-free。且输出已释放地址（行为未定义）。单次出队序列仍正确，只有「出空再入」才暴露。',
        },
      ],
      asks: [
        { label: '输入 10 20 30 的出队顺序', answer: '10 20 30', unit: '' },
        { label: '链队列队头在表头还是表尾', answer: '表头', unit: '' },
        { label: '链队列入队的时间复杂度', answer: 'O(1)', unit: '' },
        { label: '出队后 front==NULL 时应置', answer: 'rear=NULL', unit: '' },
        { label: '链队列相对循环队列的优势', answer: '无假溢出/动态扩容', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1) 常数'],
      notes: {
        idea: '链队列用 front 记队头、rear 记队尾，入队接 rear、出队从 front 摘，均 O(1)，无假溢出。',
        steps: [
          '入队：空则 front=rear=新结点，否则接 rear->next 并后移 rear。',
          '出队：取 front，前进 front，空则 rear 置 NULL，释放。',
        ],
        complexity: '入队出队均 O(1)。',
        pitfalls: [
          '入队要更新 rear。',
          '出队移 front 后若空则 rear 置 NULL。',
          '先移动指针再 free。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入并入队。',
            '出队打印。',
            '统计并比较。',
          ],
        },
        complexity_analysis: {
          steps: [
            '入队 O(1)。',
            '出队 O(1)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查指针更新与释放顺序。',
            '修正后得到 FIFO 输出。',
          ],
        },
      },
    },
    {
      key: 'hanoi',
      cxaStem: '阅读下面的汉诺塔递归程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 3,
      bloom: 'apply',
      tags: ['汉诺塔', '递归', '栈', '应用'],
      knowledgeIds: ['ds-ch03-22', 'ds-ch03-24', 'ds-ch03-01'],
      code: `#include <stdio.h>
static double cnt = 0;
static void hanoi(int n, char from, char aux, char to) {
    if (n <= 1) { if (n == 1) { printf("move %c -> %c\\n", from, to); cnt++; } return; }
    hanoi(n - 1, from, to, aux);
    printf("move %c -> %c\\n", from, to); cnt++;
    hanoi(n - 1, aux, from, to);
}
int main(void) {
    int n;
    scanf("%d", &n);
    hanoi(n, 'A', 'B', 'C');
    printf("总移动次数 = %.0f\\n", cnt);
    return 0;
}`,
      stem: '用递归求解汉诺塔：把 n 个盘子从 A 柱借助 B 柱移到 C 柱，输出每次移动并统计总次数。（n 个盘子总移动次数 = 2^n - 1）',
      inputs: [
        { stdin: '1\n', note: 'move A->C，总移动 1。', why: '一个盘子直接搬。' },
        { stdin: '2\n', note: 'A->B\nA->C\nB->C，总移动 3。', why: '经典两步。' },
        { stdin: '3\n', note: '7 次移动，总移动 7。', why: '2^3-1=7。' },
        { stdin: '0\n', note: 'n=0，总移动 0。', why: '基准：0 个盘子不动（n==1 分支不触发，count 0）。' },
      ],
      blanks: [
        {
          find: '    hanoi(n - 1, from, to, aux);',
          accepted: ['    hanoi(n - 1, from, to, aux);'],
          hint: '把上面 n-1 个盘子从 from 借助 to 移到 aux（此时 to 当辅助柱）。',
          pitfall: '汉诺塔递归的三个参数（from,aux,to）在两次递归里要正确交换。★ 第一步是把 n-1 个从 from 经 to 移到 aux：参数顺序是 (n-1, from, to, aux)。写错顺序（如 (n-1, from, aux, to)）会把柱子语义搞反，移动序列错乱但程序不崩，只有对着标准答案核对才发现。',
        },
        {
          find: '    hanoi(n - 1, aux, from, to);',
          accepted: ['    hanoi(n - 1, aux, from, to);'],
          hint: '把 n-1 个从 aux 借助 from 移到 to。',
          pitfall: '第二步把 n-1 个从 aux 经 from 搬到 to：参数是 (n-1, aux, from, to)。★ 递归本质是「栈后进先出」的自然体现，每次递归调用都在栈上保存返回现场。写错柱子交换顺序会得到合法的但错误的移动序列。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: '    if (n <= 1) { if (n == 1) { printf("move %c -> %c\\n", from, to); cnt++; } return; }',
          replace: '    if (n <= 1) { if (n == 1) { printf("move %c -> %c\\n", from, to); } return; }',
          why: '基准分支漏掉 cnt++，单个盘子的移动没计数，总次数少算（n≥1 时）。',
          pitfall: '★ 基准处漏 `cnt++` 会让总次数少算，但移动序列仍正确、程序不崩。n=1 时正确应 1 次，漏计数得 0 次；n=3 时正确应 7 次，漏计数得 4 次 —— 只有核对总数才发现。计数副作用最容易漏在递归基准里。',
        },
        {
          kind: '循环边界错误',
          find: '    hanoi(n - 1, from, to, aux);',
          replace: '    hanoi(n - 1, from, aux, to);',
          why: '第一步递归的柱子顺序写错（把 aux/to 互换），导致移动逻辑错乱，n≥2 时移动序列完全错误。',
          pitfall: '★ 这个错误让 n 较大时移动序列错乱，但程序不崩溃、仍能「跑完」并打印出 2^n-1 次移动，只是每次的柱子语义错了 —— 是递归题里最隐蔽的「参数顺序」错误。n=1 时不触发，n≥2 才暴露。',
        },
      ],
      asks: [
        { label: 'n=3 的总移动次数', answer: '7', unit: '' },
        { label: 'n 个盘子移动次数的公式', answer: '2^n - 1', unit: '' },
        { label: '第一步递归把 n-1 个移到', answer: 'aux 柱', unit: '' },
        { label: '汉诺塔递归的空间复杂度', answer: 'O(n)', unit: '' },
        { label: 'n=0 时总移动次数', answer: '0', unit: '' },
      ],
      complexity: 'O(2^n)',
      complexityAccepted: ['O(2^n)', 'O(2^n) 指数'],
      notes: {
        idea: '汉诺塔递归：n>1 时先把 n-1 个移到辅助柱，搬最大的，再把 n-1 个从辅助柱搬到目标柱；递归本质依赖调用栈后进先出。',
        steps: [
          '基准 n==1 直接搬。',
          '递归 n-1 从 from 经 to 到 aux。',
          '搬最大盘，再递归 n-1 从 aux 经 from 到 to。',
        ],
        complexity: '移动次数 T(n)=2T(n-1)+1 ⇒ O(2^n)。',
        pitfalls: [
          '两处递归的柱子参数顺序要正确。',
          '基准处 count++ 别漏。',
          '递归深度 O(n) 依赖系统栈。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '读入 n。',
            '递归移动并计数。',
            '打印总数。',
          ],
        },
        complexity_analysis: {
          steps: [
            'T(n)=2T(n-1)+1。',
            'O(2^n)。',
          ],
        },
        ds_debug: {
          steps: [
            '检查基准与参数顺序。',
            '修正后得到正确序列。',
          ],
        },
      },
    },
    {
      key: 'shared-stack',
      cxaStem: '阅读下面的双栈共享程序，回答下列问题。',
      section: '3.2 栈的顺序表示与实现',
      difficulty: 3,
      bloom: 'apply',
      tags: ['双栈', '共享栈', '判满', '顺序栈'],
      knowledgeIds: ['ds-ch03-07', 'ds-ch03-05', 'ds-ch03-01'],
      code: `#include <stdio.h>
#define MAXS 10
typedef struct { int data[MAXS]; int top1, top2; } DStack;
static void init(DStack *s) { s->top1 = -1; s->top2 = MAXS; }
static int full(DStack *s) { return s->top2 - s->top1 == 1; }
static int push1(DStack *s, int x) {
    if (full(s)) return 0;
    s->data[++s->top1] = x; return 1;
}
static int push2(DStack *s, int x) {
    if (full(s)) return 0;
    s->data[--s->top2] = x; return 1;
}
int main(void) {
    DStack s; init(&s); int x, p1 = 0, p2 = 0;
    while (scanf("%d", &x) == 1) {
        if (x % 2 == 0) { if (push1(&s, x)) p1++; }
        else { if (push2(&s, x)) p2++; }
    }
    printf("栈1入 %d 栈2入 %d\\n", p1, p2);
    printf("栈1高度 %d、栈2高度 %d\\n", s.top1 + 1, MAXS - s.top2);
    return 0;
}`,
      stem: '用共享栈（一块数组两个栈顶，stack1 从下标 0 向右，stack2 从 MAXS-1 向左，相遇即满）把偶数压入 stack1、奇数压入 stack2，读取耗尽后输出各自入栈数与高度。',
      inputs: [
        { stdin: '2 4 6\n', note: '栈1入 3 栈2入 0，高度 3/0。', why: '全偶数。' },
        { stdin: '1 3 5\n', note: '栈1入 0 栈2入 3，高度 0/3。', why: '全奇数。' },
        { stdin: '2 4 1 3 5 7\n', note: '栈1入 2 栈2入 4，高度 2/4。', why: '偶数 2,4；奇数 1,3,5,7。' },
        { stdin: '1 2 3 4 5 6 7 8 9 10 11 12\n', note: '共 10 格，栈1入 5 栈2入 5 后满。', why: 'MAXS=10，偶数 2,4,6,8,10 入栈1；奇数先入 1,3,5,7,9 占满剩余 5 格，11 与 12 满时被拒。' },
      ],
      blanks: [
        {
          find: '    s->data[++s->top1] = x; return 1;',
          accepted: ['    s->data[++s->top1] = x; return 1;'],
          hint: 'stack1 栈顶从 -1 开始，先加再存。',
          pitfall: '双栈共享一个数组：stack1 从 0 向右（用 ++），stack2 从 MAXS-1 向左（用 --）。★ 两者方向相反，stack1 判满是 `top1 == MAXS-1`、stack2 判满是 `top2 == 0`，共享判满用 `top2 - top1 == 1`（相遇）。存数据方向写反（如 stack1 用 --）会互相进栈区。',
        },
        {
          find: 'static int full(DStack *s) { return s->top2 - s->top1 == 1; }',
          accepted: ['static int full(DStack *s) { return s->top2 - s->top1 == 1; }'],
          hint: '两个栈顶相遇（top2 在 top1 右侧一格）时满。',
          pitfall: '共享栈满的条件是 `top2 - top1 == 1`（两个栈顶夹住一格空隙即满）。★ 写成 `top1 >= top2` 或 `top1 == top2` 会在恰好相遇时才判满，会多塞一个元素并越界写数组。',
        },
      ],
      defects: [
        {
          kind: '条件判断错误',
          find: 'static int full(DStack *s) { return s->top2 - s->top1 == 1; }',
          replace: 'static int full(DStack *s) { return s->top2 - s->top1 == 0; }',
          why: '判满条件从差 1 改成差 0，两个栈顶恰好重叠才判满，中间每格都能再塞一个，最后导致越界写。',
          pitfall: '★ 差 0 时两栈顶重叠，说明已经互相进入对方区域，之前应已判满。写成差 0 会漏判一格，往数组里多写一个元素（越界）。n=12 输入时本应第 10 个就满，改成差 0 会塞进 11 个，data[10] 越界。',
        },
        {
          kind: '循环边界错误',
          find: '    s->data[--s->top2] = x; return 1;',
          replace: '    s->data[s->top2--] = x; return 1;',
          why: 'stack2 进栈方向写反（用后缀 -- 先存再减），中轴偏移一位，栈2的元素从错误位置开始。',
          pitfall: '★ `--s->top2` 是先减再存（栈顶向下移动后写入），`s->top2--` 是先从当前位置写再减。stack2 从 MAXS 开始向左，正确是 `--s->top2`。用后缀会让第一个奇数写进 data[MAXS] 越界，或写入错误位置，只有对比最终高度才暴露。',
        },
      ],
      asks: [
        { label: '共享栈判满条件', answer: 'top2-top1==1', unit: '' },
        { label: 'stack1 初始 top1', answer: '-1', unit: '' },
        { label: 'stack2 初始 top2', answer: 'MAXS', unit: '' },
        { label: 'MAXS=10 时共享栈最多存', answer: '10', unit: '' },
        { label: 'stack2 进栈用', answer: '--top2', unit: '' },
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)', 'O(1) 常数'],
      notes: {
        idea: '共享栈把两个栈放进同一个数组，两端相向生长，空间利用率高（满则整体满），判满用 top2-top1==1。',
        steps: [
          'stack1 从 0 向右 ++，stack2 从 MAXS-1 向左 --。',
          '判满 top2-top1==1。',
          '按奇偶分别入对应栈。',
        ],
        complexity: '入栈 O(1)。',
        pitfalls: [
          '两栈方向相反。',
          '判满用 top2-top1==1。',
          'stack2 用先减后存。',
        ],
      },
      explain: {
        code_reading: {
          steps: [
            '初始化两栈。',
            '读入并按奇偶入栈。',
            '输出高度。',
          ],
        },
        complexity_analysis: {
          steps: [
            '入栈 O(1)。',
            '共享，满则整体满。',
          ],
        },
        ds_debug: {
          steps: [
            '检查判满与方向。',
            '修正后正确。',
          ],
        },
      },
    },
  ],
}
