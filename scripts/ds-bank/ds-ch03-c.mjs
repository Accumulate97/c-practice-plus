export default {
  shard: 'ds-ch03',
  chapter: '第3章 栈和队列',
  category: 'ds',
  source: '自撰（依据《第3章 栈和队列》教材考点变式：后缀求值/中缀转后缀/两栈队列/循环队列/回文判定/迷宫回溯）',
  entries: [
    {
      key: 'postfix-eval',
      cxaStem: '阅读下面的后缀表达式求值程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 2,
      bloom: 'apply',
      tags: ['后缀表达式', '求值', '操作数栈', '数字与运算符处理'],
      knowledgeIds: ['ds-ch03-10', 'ds-ch03-01', 'ds-ch03-04'],
      code: `#include <stdio.h>
#define MAX 64
int main(void) {
    char s[MAX]; int st[MAX], top = -1, i, a, b;
    if (scanf("%63s", s) != 1) { printf("输入有误\\n"); return 0; }
    for (i = 0; s[i] != '\\0'; i++) {
        if (s[i] >= '0' && s[i] <= '9') { st[++top] = s[i] - '0'; }
        else { b = st[top--]; a = st[top--];
            if (s[i] == '+') st[++top] = a + b;
            else if (s[i] == '-') st[++top] = a - b;
            else if (s[i] == '*') st[++top] = a * b;
            else st[++top] = a / b; }
    }
    printf("结果：%d\\n", st[top]);
    return 0;
}`,
      stem: '用操作数栈对后缀表达式（单个数字 0-9 与四则运算符）求值，最后输出结果。',
      inputs: [
        { stdin: '34+\n', note: '两个操作数相加', why: '3 入栈、4 入栈，遇 + 弹出 4 与 3，3+4=7 压回，输出 7。' },
        { stdin: '123+4*+\n', note: '含括号效果的混合运算', why: '等价于 1+(2+3)*4=1+20=21，后缀把优先级顺序固化，运算全程只用栈不看括号。' },
        { stdin: '95-\n', note: '减法', why: '弹出 b=5、a=9，计算 a-b=9-5=4；后缀的 9 5 - 等价于“9 减 5”。' },
        { stdin: '83/\n', note: '整除', why: '弹出 b=3、a=8，8/3=2（整除取整）；后缀的两个操作数顺序必须严格，否则 3/8 就错了。' },
        { stdin: '12+3*\n', note: '先加后乘', why: '1+2=3 压回，再与 3 相乘，3*3=9；注意此式等价于 (1+2)*3，与 1+2*3 不同。' }
      ],
      blanks: [
        { find: 'st[++top] = s[i] - \'0\';', accepted: ['st[++top] = s[i] - \'0\';'], hint: '读到数字字符时把它转成数值压入操作数栈。', pitfall: '必须做 s[i]-\'0\' 的字符到整数转换，直接压 s[i] 会把 ASCII 码当数值。' },
        { find: 'b = st[top--]; a = st[top--];', accepted: ['b = st[top--]; a = st[top--];'], hint: '遇到运算符先弹出右操作数 b，再弹出左操作数 a。', pitfall: '弹出顺序不能颠倒：先弹出的 b 是右操作数，后弹出的 a 是左操作数，减法/除法对顺序敏感。' }
      ],
      defects: [
        { kind: '运算顺序错误', find: 'st[++top] = a - b;', replace: 'st[++top] = b - a;', why: '减法把被减数与减数颠倒，9 5 - 本应为 9-5=4，却算了 5-9=-4。', pitfall: '后缀表达式先弹出的 b 是右操作数，后弹出的 a 是左操作数，a-b 的顺序不能换。' },
        { kind: '运算符误用', find: 'st[++top] = a * b;', replace: 'st[++top] = a + b;', why: '遇到 * 却执行加法，12+3* 本应为 (1+2)*3=9，却得到 1+2+3=6。', pitfall: '每个运算符分支对应唯一的运算，写成别的运算符不会报错但结果错误，只能靠比对发现。' }
      ],
      asks: [
        { label: '后缀表达式 34+ 的求值结果是多少？', answer: '7' },
        { label: '求值时若遇到运算符，需要从栈里弹出几个操作数？', answer: '2 个' },
        { label: '后缀表达式 12+3* 等价于哪个中缀表达式？', answer: '(1+2)*3' },
        { label: '后缀求值过程中，操作数栈最多同时存放几个数（对单个数字的操作数而言）？', answer: '由表达式结构决定，一般不超过操作数个数' },
        { label: '后缀求值的时间复杂度是多少？', answer: 'O(n)' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '后缀表达式无需括号就能确定运算顺序，用操作数栈从左到右扫描：数字入栈，遇运算符弹出两个操作数计算并把结果压回，最后栈顶即答案。',
        steps: ['读入后缀表达式字符串', '从左到右扫描每个字符', '数字字符转成数值压栈', '遇运算符弹出右、左两个操作数并计算', '结果压回栈，扫描结束后输出栈顶'],
        complexity: '时间 O(n)（每个字符处理一次），空间 O(n)（操作数栈）。',
        pitfalls: [
          '数字是字符，必须做 s[i]-\'0\' 转换，否则存的是 ASCII 值。',
          '先弹出的 b 是右操作数、后弹出的 a 是左操作数，减法与除法对顺序敏感。',
          '运算符的分支必须与符号严格对应，写成别的运算符不报错但结果错。'
        ]
      },
      explain: {
        code_reading: { steps: ['读入后缀字符串并初始化空栈', '逐个字符扫描', '数字入栈、运算符弹两个操作数运算后压回', '扫描结束输出栈顶结果'] },
        code_completion: { steps: ['数字字符要转数值后入栈', '运算符分支弹出两个操作数', '按 a\'-operator\'-b 计算再压回', '结束时栈顶即结果'] },
        ds_debug: { idea: '运算顺序错误或运算符分支错误，会让结果悄悄改变而不报错。', steps: ['先确认弹出顺序 a 是左、b 是右', '再核对每个运算符分支对应的运算', '用 95- 与 12+3* 各测一次'] },
        complexity_analysis: { idea: '每个字符处理一次，时间线性；栈深取决于表达式结构。' }
      }
    },
    {
      key: 'infix-to-postfix',
      cxaStem: '阅读下面的中缀转后缀表达式程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 3,
      bloom: 'apply',
      tags: ['中缀转后缀', '运算符栈', '优先级', '括号处理'],
      knowledgeIds: ['ds-ch03-09', 'ds-ch03-08', 'ds-ch03-01'],
      code: `#include <stdio.h>
#define MAX 64
static int prec(char c) {
    if (c == '*' || c == '/') return 2;
    if (c == '+' || c == '-') return 1;
    return 0;
}
int main(void) {
    char in[MAX], op[MAX]; int top = -1, i;
    if (scanf("%63s", in) != 1) { printf("输入有误\\n"); return 0; }
    for (i = 0; in[i] != '\\0'; i++) {
        char c = in[i];
        if (c >= '0' && c <= '9') printf("%c", c);
        else if (c == '(') op[++top] = c;
        else if (c == ')') { while (top >= 0 && op[top] != '(') printf("%c", op[top--]); top--; }
        else { while (top >= 0 && op[top] != '(' && prec(op[top]) >= prec(c)) printf("%c", op[top--]); op[++top] = c; }
    }
    while (top >= 0) printf("%c", op[top--]);
    printf("\\n");
    return 0;
}`,
      stem: '用运算符栈把中缀表达式（单个数字与 + - * / 及括号）转换为后缀（逆波兰）表达式并输出。',
      inputs: [
        { stdin: '1+2*3\n', note: '乘法优先于加法', why: '* 优先级高，先弹出 + 再把 * 压栈，输出 123*+。' },
        { stdin: '(1+2)*3\n', note: '括号改变顺序', why: '遇到 ) 把左括号以上的运算符弹出，括号本身不出现在后缀里，输出 12+3*。' },
        { stdin: '1+2-3\n', note: '同优先级左结合', why: '同级运算符在遇到下一个同/高优先级时弹出，保持左结合，输出 12+3-。' },
        { stdin: '2+3*4\n', note: '加号后乘号', why: '遇 * 时栈顶 + 优先级低不被弹出，* 入栈，输出 23*4+。' },
        { stdin: '1*(2+3)\n', note: '乘号后括号', why: '( 入栈后括号内 + 先弹出，随后 * 再弹出，输出 123+*。' }
      ],
      blanks: [
        { find: 'while (top >= 0 && op[top] != \'(\' && prec(op[top]) >= prec(c)) printf("%c", op[top--]);', accepted: ['while (top >= 0 && op[top] != \'(\' && prec(op[top]) >= prec(c)) printf("%c", op[top--]);'], hint: '栈顶运算符优先级不低于当前运算符时，先把栈顶弹出，再让当前运算符入栈。', pitfall: '比较用 >= 才能保证同优先级左结合；用 > 会让同优先级运算符保留在栈里，破坏结合顺序。' },
        { find: 'while (top >= 0) printf("%c", op[top--]);', accepted: ['while (top >= 0) printf("%c", op[top--]);'], hint: '扫描结束后把栈中剩余运算符依次弹出并输出。', pitfall: '这个收尾循环不能省，否则栈中剩余的运算符会被遗漏。' }
      ],
      defects: [
        { kind: '优先级比较错误', find: 'prec(op[top]) >= prec(c)', replace: 'prec(op[top]) > prec(c)', why: '同优先级运算符不再弹出，1+2-3 本应输出 12+3-，却输出 123-+，破坏了左结合。', pitfall: '中缀转后缀对同级运算符要保持从左到右结合，必须用 >= 而不是 >。' },
        { kind: '优先级函数错误', find: 'if (c == \'*\' || c == \'/\') return 2;', replace: 'if (c == \'*\' || c == \'/\') return 0;', why: '把乘除优先级降为 0，导致 2+3*4 时 * 不再先算，输出 234*+ 而非 23*4+。', pitfall: '优先级函数的值决定运算符何时出栈，乘除必须高于加减。' }
      ],
      asks: [
        { label: '中缀 1+2*3 转换成的后缀表达式是什么？', answer: '123*+' },
        { label: '遇到右括号 ) 时，要如何处理？', answer: '把栈中左括号之上的运算符全部弹出输出，并弹出左括号' },
        { label: '同级运算符（如 + 和 -）为何要用 >= 比较？', answer: '保证从左到右的左结合' },
        { label: '括号在转换后的后缀表达式中还出现吗？', answer: '不出现，被用于决定运算顺序' },
        { label: '中缀转后缀的时间复杂度是多少？', answer: 'O(n)' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '中缀转后缀用运算符栈：数字直接输出；左括号入栈；右括号弹出栈顶直到左括号；运算符则弹出栈中优先级不低于它的运算符后再入栈；扫描结束弹出全部残余运算符。',
        steps: ['初始化运算符栈并逐个读字符', '数字直接输出，左括号入栈', '右括号弹出栈顶直至左括号', '运算符弹出不低于自身优先级的栈顶后入栈', '扫描结束弹出剩余运算符'],
        complexity: '时间 O(n)（每个运算符至多入、出栈一次），空间 O(n)（运算符栈）。',
        pitfalls: [
          '同级运算符比较必须用 >=（左结合），用 > 会破坏结合顺序。',
          '右括号处理时左括号本身要弹出但不输出。',
          '扫描结束必须把栈剩余运算符全部弹出，否则丢失运算符。'
        ]
      },
      explain: {
        code_reading: { steps: ['读入中缀串，初始化运算符栈', '数字直接输出，左括号入栈', '右括号弹出至左括号', '运算符按优先级弹出后入栈', '结束弹出全部运算符'] },
        code_completion: { steps: ['运算符入栈前先弹出优先级不低于它的栈顶', '右括号弹出直到左括号并丢弃左括号', '结束时清空剩余运算符'] },
        ds_debug: { idea: '优先级比较从 >= 变 > 或优先级函数取值错误，都会改变出栈时机从而改变输出。', steps: ['检查 prec 函数对乘除加法的赋值', '核对从栈顶弹出条件是否 >=', '用 1+2-3 验证左结合'] },
        complexity_analysis: { idea: '每个运算符至多入栈出栈一次，整体线性。' }
      }
    },
    {
      key: 'two-stack-queue',
      cxaStem: '阅读下面的用两个栈实现队列的程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 3,
      bloom: 'apply',
      tags: ['两栈实现队列', '入队出队', '倒栈', '栈顶'],
      knowledgeIds: ['ds-ch03-18', 'ds-ch03-05', 'ds-ch03-01'],
      code: `#include <stdio.h>
#define MAX 64
int main(void) {
    int s1[MAX], s2[MAX], n1 = -1, n2 = -1, n, i, op, x;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) {
        if (scanf("%d", &op) != 1) { printf("输入有误\\n"); return 0; }
        if (op == 1) { if (scanf("%d", &x) != 1) { printf("输入有误\\n"); return 0; } s1[++n1] = x; }
        else {
            if (n2 == -1) { while (n1 >= 0) s2[++n2] = s1[n1--]; }
            if (n2 == -1) printf("队空\\n");
            else printf("出队：%d\\n", s2[n2--]);
        }
    }
    return 0;
}`,
      stem: '用两个栈 s1、s2 模拟队列：op=1 入队（压入 s1），op=2 出队（先倒栈到 s2 再弹出队首），处理 n 次操作。',
      inputs: [
        { stdin: '5\n1 10\n1 20\n2\n1 30\n2\n', note: '混合入队出队', why: '两次入队后出队 10，再入队 30 再出队 20，输出 出队：10 与 出队：20。' },
        { stdin: '4\n2\n2\n1 5\n2\n', note: '队空出队', why: '先两次空队列出队都输出 队空，入队 5 后出队输出 出队：5。' },
        { stdin: '6\n1 1\n1 2\n1 3\n2\n2\n2\n', note: '连续入队后连续出队', why: 's1 依次压 1、2、3，倒栈到 s2 后按 1、2、3 弹出，FIFO 顺序。' },
        { stdin: '3\n1 7\n2\n2\n', note: '单个元素后连出两队', why: '入队 7 后第一次出队 7，第二次 s2 已空且 s1 空，输出 队空。' },
        { stdin: '2\n2\n2\n', note: '空队列', why: '两次出队都输出 队空，出队前必须检查 s2 空则先倒栈、仍空则队空。' }
      ],
      blanks: [
        { find: 'while (n1 >= 0) s2[++n2] = s1[n1--];', accepted: ['while (n1 >= 0) s2[++n2] = s1[n1--];'], hint: 's2 为空时把 s1 的整个栈顶元素依次弹出并压入 s2，使栈底元素（最早入队者）到 s2 顶部。', pitfall: '每次出队只需当 s2 空时倒一次栈，倒完 s1 就空了；若重复倒栈会把已倒元素打乱顺序。' },
        { find: 'else printf("出队：%d\\n", s2[n2--]);', accepted: ['else printf("出队：%d\\n", s2[n2--]);'], hint: 's2 不为空时弹出其栈顶，即最早入队的元素。', pitfall: '弹出是栈顶操作 s2[n2--]，不能误写为从 s1 取，否则顺序倒置成后进先出。' }
      ],
      defects: [
        { kind: '循环边界错误', find: 'while (n1 >= 0) s2[++n2] = s1[n1--];', replace: 'while (n1 > 0) s2[++n2] = s1[n1--];', why: '倒栈少倒了一个元素，栈底那个最早入队的元素留在 s1 里取不出来，导致入队多于出队时元素丢失。', pitfall: '倒栈要把 s1 的所有元素倒空，循环条件应为 n1>=0，写成 n1>0 会漏掉栈底一个元素。' },
        { kind: '出栈不弹栈顶', find: 'else printf("出队：%d\\n", s2[n2--]);', replace: 'else printf("出队：%d\\n", s2[n2]);', why: '出队时不递减 n2，于是 s2 栈顶永远不被弹出，后续出队会重复输出同一个元素。', pitfall: '弹出必须用 n2-- 让栈顶真正出栈，否则 s2 内容不变、队首重复。' }
      ],
      asks: [
        { label: '用两个栈实现队列时，入队操作把元素压入哪个栈？', answer: 's1' },
        { label: '出队时若 s2 为空，需要先做什么？', answer: '把 s1 的所有元素依次弹出并压入 s2（倒栈）' },
        { label: '为什么要用“倒栈”操作？', answer: '两次“后进先出”叠加即为“先进先出”，倒栈使最早入队的元素变成 s2 栈顶' },
        { label: '两个栈实现队列的均摊时间复杂度是多少？', answer: 'O(1)（每个元素至多被移动两次）' },
        { label: 's1、s2 都为空时执行出队，程序输出什么？', answer: '队空' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '均摊 O(1)'],
      notes: {
        idea: '用两个栈反转两次实现队列：入队压入 s1；出队时若 s2 空，把 s1 全部倒到 s2（两次后进先出抵消为先进先出），再从 s2 栈顶弹出。',
        steps: ['初始化两个栈 s1、s2 均为空', 'op=1 把元素压入 s1', 'op=2 若 s2 空则把 s1 全部倒栈', 's2 不为空则弹出栈顶作为队首', 's1、s2 都空则输出队空'],
        complexity: '每个元素至多被入栈、出栈、倒栈两次，均摊时间 O(1)，空间 O(n)。',
        pitfalls: [
          '只有 s2 为空时才需要倒栈，不能每次出队都倒。',
          '倒栈必须把 s1 倒空（n1>=0），循环条件错一个元素就丢一个。',
          '出队要真正弹出 s2 栈顶（n2--），否则队首重复。'
        ]
      },
      explain: {
        code_reading: { steps: ['读操作数 n 并循环处理', 'op=1 入队压入 s1', 'op=2 先检查 s2 空则倒栈', 's2 非空则弹出栈顶输出，空则输出队空'] },
        code_completion: { steps: ['入队压 s1', '出队前 s2 空则把 s1 全部倒栈', '从 s2 栈顶弹出输出', '双空输出队空'] },
        ds_debug: { idea: '倒栈循环边界或出队弹栈错误会让元素丢失或重复。', steps: ['检查倒栈是否把 s1 倒空', '核对出队是否 n2--', '用 1 1 1 2 2 2 验证 FIFO'] },
        complexity_analysis: { idea: '每个元素至多移动两次，均摊 O(1)。' }
      }
    },
    {
      key: 'cycle-queue-ops',
      cxaStem: '阅读下面的循环队列操作程序，回答下列问题。',
      section: '3.5 循环队列的顺序表示',
      difficulty: 2,
      bloom: 'apply',
      tags: ['循环队列', '队头队尾指针', '判空判满', '取模'],
      knowledgeIds: ['ds-ch03-13', 'ds-ch03-03', 'ds-ch03-01'],
      code: `#include <stdio.h>
#define MAX 6
int main(void) {
    int q[MAX], front = 0, rear = 0, n, i, op, x;
    if (scanf("%d", &n) != 1 || n < 0 || n > 64) { printf("输入有误\\n"); return 0; }
    for (i = 0; i < n; i++) {
        if (scanf("%d", &op) != 1) { printf("输入有误\\n"); return 0; }
        if (op == 1) {
            if (scanf("%d", &x) != 1) { printf("输入有误\\n"); return 0; }
            if ((rear + 1) % MAX == front) printf("队满\\n");
            else { q[rear] = x; rear = (rear + 1) % MAX; }
        } else {
            if (front == rear) printf("队空\\n");
            else { printf("出队：%d\\n", q[front]); front = (front + 1) % MAX; }
        }
    }
    return 0;
}`,
      stem: '用数组实现循环队列，op=1 入队、op=2 出队，利用取模让队头队尾指针回绕，处理 n 次操作。',
      inputs: [
        { stdin: '5\n1 10\n1 20\n2\n1 30\n2\n', note: '入队出队交替', why: '入 10、20，出队 10，再入 30 出队 20，输出 出队：10 与 出队：20。' },
        { stdin: '4\n2\n2\n1 5\n2\n', note: '空队列出队', why: 'front==rear 判空，两次空队出队输出 队空，入 5 后出队输出 出队：5。' },
        { stdin: '6\n1 1\n1 2\n1 3\n2\n2\n2\n', note: '连续入队再连续出队', why: '队头指针依次后移，按先进先出输出 1、2、3。' },
        { stdin: '5\n1 7\n1 8\n2\n1 9\n2\n', note: '成对入出', why: '入 7、8，出 7，再入 9 出 8，输出 出队：7 与 出队：8。' },
        { stdin: '2\n2\n2\n', note: '空队列', why: '两次出队都触发 front==rear，输出 队空。' }
      ],
      blanks: [
        { find: 'else { q[rear] = x; rear = (rear + 1) % MAX; }', accepted: ['else { q[rear] = x; rear = (rear + 1) % MAX; }'], hint: '队尾指针处存入元素，然后让 rear 向后移一位并回绕。', pitfall: 'rear 的移动必须对 MAX 取模，否则超出数组越界；判满用 (rear+1)%MAX==front 表示少用一格。' },
        { find: 'else { printf("出队：%d\\n", q[front]); front = (front + 1) % MAX; }', accepted: ['else { printf("出队：%d\\n", q[front]); front = (front + 1) % MAX; }'], hint: '取出队头指针处元素，再让 front 向后移一位并回绕。', pitfall: 'front 移动同样要取模；判空用 front==rear，判满用 (rear+1)%MAX==front。' }
      ],
      defects: [
        { kind: '队头不后移', find: 'else { printf("出队：%d\\n", q[front]); front = (front + 1) % MAX; }', replace: 'else { printf("出队：%d\\n", q[front]); }', why: '出队后不移动 front，队头指针停在原处，后续出队会重复输出同一个元素。', pitfall: '出队必须让 front 后移并取模，否则队头不会前进、队首元素被反复输出。' },
        { kind: '队尾不后移', find: 'else { q[rear] = x; rear = (rear + 1) % MAX; }', replace: 'else { q[rear] = x; }', why: '入队后不移动 rear，元素一直写到队尾指针原处，后来的入队会覆盖先前的元素。', pitfall: '入队必须让 rear 后移并取模，否则队列无法前进、元素被覆盖。' }
      ],
      asks: [
        { label: '循环队列用数组实现时，判满的条件是什么（设队头 front、队尾 rear、容量 MAX）？', answer: '(rear+1)%MAX == front' },
        { label: '循环队列判空的条件是什么？', answer: 'front == rear' },
        { label: '为什么要让 rear 和 front 对 MAX 取模？', answer: '使队头队尾指针在数组内回绕，避免越界并利用空余空间' },
        { label: '循环队列用少用一个存储单元来区分队空与队满，可容纳几个元素？', answer: 'MAX-1 个' },
        { label: '循环队列出队时队头指针如何变化？', answer: 'front = (front+1)%MAX' }
      ],
      complexity: 'O(1)',
      complexityAccepted: ['O(1)'],
      notes: {
        idea: '循环队列用数组加队头、队尾指针实现，指针在数组内回绕；用 (rear+1)%MAX==front 判满（少用一个单元），用 front==rear 判空，入队出队均为 O(1)。',
        steps: ['初始化 front=rear=0，队列空', 'op=1 判满后存入 x 并后移 rear', 'op=2 判空后取出并后移 front', '指针移动都取模回绕'],
        complexity: '入队、出队均为 O(1)，空间 O(MAX)。',
        pitfalls: [
          '判满必须用 (rear+1)%MAX==front，而不是 rear 直接等于某个下标。',
          '队头、队尾指针移动都要取模，否则越界。',
          '区分空满用少存一个单元的策略，队列最多存 MAX-1 个元素。'
        ]
      },
      explain: {
        code_reading: { steps: ['初始化空循环队列', 'op=1 判满后入队并后移 rear', 'op=2 判空后出队并后移 front', '指针均取模回绕'] },
        code_completion: { steps: ['入队判满、存入、rear 后移', '出队判空、取出、front 后移', '移动都取模'] },
        ds_debug: { idea: '漏掉 front 或 rear 的后移会让队首/队尾不前进，元素被重复或覆盖。', steps: ['检查入队是否后移 rear', '检查出队是否后移 front', '用连续入出 3 个元素验证'] },
        complexity_analysis: { idea: '入队出队各 O(1)，回绕取模不增加复杂度。' }
      }
    },
    {
      key: 'palindrome-stack',
      cxaStem: '阅读下面的用栈判定回文的程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 2,
      bloom: 'apply',
      tags: ['回文判定', '栈', '字符比较', '逆序'],
      knowledgeIds: ['ds-ch03-24', 'ds-ch03-01', 'ds-ch03-04'],
      code: `#include <stdio.h>
#include <string.h>
#define MAX 64
int main(void) {
    char s[MAX], st[MAX]; int top = -1, i, n, pal = 1;
    if (scanf("%63s", s) != 1) { printf("输入有误\\n"); return 0; }
    n = (int)strlen(s);
    for (i = 0; i < n; i++) st[++top] = s[i];
    for (i = 0; i < n / 2; i++) { if (s[i] != st[top--]) { pal = 0; break; } }
    printf(pal ? "是回文\\n" : "不是回文\\n");
    return 0;
}`,
      stem: '把字符串全部字符压入栈，再依次弹出与字符串前半部分比较，据此判定是否为回文。',
      inputs: [
        { stdin: 'abcba\n', note: '奇数长度回文', why: '压栈倒序为 a b c b a，与前半逐位相等，判定为回文。' },
        { stdin: 'abcd\n', note: '非回文', why: '正序 a b c d 与倒序 d c b a 首位即不同，判定不是回文。' },
        { stdin: 'abccba\n', note: '偶数长度回文', why: '正序与倒序完全相同，判定为回文。' },
        { stdin: 'a\n', note: '单字符', why: 'n/2=0，比较循环不执行，pal 保持 1，判定为回文。' },
        { stdin: 'abca\n', note: '非回文', why: '正序 a b c a 与倒序 a c b a 第二、三位不同，判定不是回文。' }
      ],
      blanks: [
        { find: 'st[++top] = s[i];', accepted: ['st[++top] = s[i];'], hint: '把字符串每个字符依次压入栈，栈中即字符串的逆序。', pitfall: '必须从栈顶压入且用 ++top，否则会覆盖或越界。' },
        { find: 'if (s[i] != st[top--]) { pal = 0; break; }', accepted: ['if (s[i] != st[top--]) { pal = 0; break; }'], hint: '比较原串前半与栈顶（即逆序前半），一旦不等即为非回文。', pitfall: '子串比较只需进行到 n/2，比较到 n 会重复比较后半段。' }
      ],
      defects: [
        { kind: '比较逻辑取反', find: 's[i] != st[top--]', replace: 's[i] == st[top--]', why: '把“不等才判非回文”改成“相等才判非回文”，abcba 本应为回文却被判成非回文。', pitfall: '回文判定的条件是“存在不相等即非回文”，用 == 判断会完全颠倒结论。' },
        { kind: '输出取反', find: 'printf(pal ? "是回文\\n" : "不是回文\\n");', replace: 'printf(pal ? "不是回文\\n" : "是回文\\n");', why: '把三目运算符的两个分支对调，pal=1（回文）时反而输出“不是回文”。', pitfall: '三目运算符的真假分支必须与语义对应，对调后不报错但结论全部相反。' }
      ],
      asks: [
        { label: '判定回文时，把字符串全部压入栈后，栈中内容与字符串有何关系？', answer: '栈中字符顺序正好是原字符串的逆序' },
        { label: '比较时只需比较到字符串的哪个位置？', answer: 'n/2 处' },
        { label: '回文判定能判断的最短“回文”串长度是多少？', answer: '单字符（如 a）也算回文' },
        { label: '该判定算法的时间复杂度是多少？', answer: 'O(n)' },
        { label: '若字符串长度 n 为奇数，中间那个字符需要比较吗？', answer: '不需要，它与自身比较无意义' }
      ],
      complexity: 'O(n)',
      complexityAccepted: ['O(n)', '线性阶'],
      notes: {
        idea: '栈的后进先出正好把字符串倒序：把所有字符压栈得到逆序，再与原串前半逐位比较（只需比到 n/2），全部相等即为回文。',
        steps: ['读入字符串 n', '把每个字符压栈', '将栈顶弹出与 s[i] 比较', '比较到 n/2 出现不等即判非回文', '输出结论'],
        complexity: '时间 O(n)（压栈与比较各一遍），空间 O(n)（字符栈）。',
        pitfalls: [
          '比较只需到 n/2，比较到 n 会重复判断后半段而得到错误结论或多余比较。',
          '回文判定条件是不相等即失败，用 == 会让结论颠倒。',
          '单字符长度为 1 时 n/2=0，不比较即为回文。'
        ]
      },
      explain: {
        code_reading: { steps: ['读串并压栈得到逆序', '弹出栈顶与前半比较', '不等则置 pal=0 并跳出', '按 pal 输出结论'] },
        code_completion: { steps: ['每个字符压栈', '弹出与 s[i] 比较', '不等即置 pal=0', '输出结论'] },
        ds_debug: { idea: '比较条件取反或输出分支对调都会让结论完全相反。', steps: ['核对比较条件是 !=', '核对三目分支与语义对应', '用 abcba 与 abcd 各测一次'] },
        complexity_analysis: { idea: '压栈一遍、比较半遍，均为线性。' }
      }
    },
    {
      key: 'maze-backtrack',
      cxaStem: '阅读下面的用递归回溯求解迷宫可达性的程序，回答下列问题。',
      section: '3.6 栈与队列的应用',
      difficulty: 3,
      bloom: 'apply',
      tags: ['迷宫', '递归回溯', '深度优先', '可达性'],
      knowledgeIds: ['ds-ch03-22', 'ds-ch03-19', 'ds-ch03-01'],
      code: `#include <stdio.h>
#define R 3
#define C 3
static int m[R][C], ok = 0;
static void dfs(int x, int y) {
    if (x < 0 || x >= R || y < 0 || y >= C || m[x][y] != 1) return;
    if (x == R - 1 && y == C - 1) { m[x][y] = 2; ok = 1; return; }
    m[x][y] = 2;
    dfs(x + 1, y); dfs(x - 1, y); dfs(x, y + 1); dfs(x, y - 1);
}
int main(void) {
    int i, j;
    for (i = 0; i < R; i++) for (j = 0; j < C; j++) if (scanf("%d", &m[i][j]) != 1) { printf("输入有误\\n"); return 0; }
    dfs(0, 0);
    printf(ok ? "可达\\n" : "不可达\\n");
    return 0;
}`,
      stem: '用递归回溯判断 3x3 迷宫从左上角 (0,0) 到右下角 (2,2) 是否可达：1 为通路、0 为墙，走过的格子标 2 防重复。',
      inputs: [
        { stdin: '1 1 1 1 1 1 1 1 1\n', note: '全通', why: '四邻均可走，深度优先能到达 (2,2)，输出 可达。' },
        { stdin: '1 1 0 1 1 1 1 1 1\n', note: '绕过障碍', why: '中间一格为墙，但可绕行到达 (2,2)，输出 可达。' },
        { stdin: '1 0 1 0 0 0 1 0 1\n', note: '起点被围', why: '(0,0) 的右、下邻均为墙，四个方向都被堵死，无法到达 (2,2)，输出 不可达。' },
        { stdin: '0 1 1 1 1 1 1 1 1\n', note: '起点即墙', why: '(0,0)=0，dfs 入口即返回，输出 不可达。' },
        { stdin: '1 1 1 1 1 1 1 1 0\n', note: '终点即墙', why: '(2,2)=0 不可进入，dfs 永远到不了目标，输出 不可达。' }
      ],
      blanks: [
        { find: 'if (x == R - 1 && y == C - 1) { m[x][y] = 2; ok = 1; return; }', accepted: ['if (x == R - 1 && y == C - 1) { m[x][y] = 2; ok = 1; return; }'], hint: '到达右下角目标时标记已访问、置 ok=1 并返回。', pitfall: '目标格也要先判在边界内且可走，不能直接判定到达，否则对不可达的墙也会误判。' },
        { find: 'dfs(x + 1, y); dfs(x - 1, y); dfs(x, y + 1); dfs(x, y - 1);', accepted: ['dfs(x + 1, y); dfs(x - 1, y); dfs(x, y + 1); dfs(x, y - 1);'], hint: '递归探索当前格子的上、下、左、右四个相邻格子。', pitfall: '四个方向都要尝试，且 m[x][y]=2 标记要在递归前设置，否则会重复进入已探格子造成死循环。' }
      ],
      defects: [
        { kind: '方向缺失', find: 'dfs(x + 1, y);', replace: 'dfs(x - 1, y);', why: '把“向下”改成“向上”，使得永远无法走出第一行，原本可达的迷宫被判为不可达。', pitfall: '四个方向是隔断的“分支选择”，漏掉或改错一个方向都会让可达性判断失真，且不报错。' },
        { kind: '目标置错', find: 'ok = 1;', replace: 'ok = 0;', why: '到达目标时却把 ok 置 0，于是即使到达 (2,2) 也永远输出 不可达。', pitfall: 'ok 是全局可达标志，到达目标必须置 1，置错会让人误以为迷宫不可达。' }
      ],
      asks: [
        { label: 'dfs 用到的数据结构本质上是什么？', answer: '栈（函数调用栈）' },
        { label: '为什么走过一个格子要标记为 2（而非保持 1）？', answer: '防止重复进入已探格子，避免死循环' },
        { label: '若不标记已访问，程序可能发生什么？', answer: '无限递归、反复进出相邻格子而死循环（栈溢出）' },
        { label: '回溯到上一层格子的动作是由什么机制自动完成的？', answer: '函数调用结束返回时、递归栈自动出栈' },
        { label: '迷宫可达性用深度优先搜索的最坏时间/空间复杂度是多少？', answer: '时间 O(R*C)，空间 O(R*C)（递归栈深度最坏为格子数）' }
      ],
      complexity: 'O(R*C)',
      complexityAccepted: ['O(R*C)'],
      notes: {
        idea: '迷宫可达性用递归深度优先搜索：从起点出发，四个方向逐个递归；进入格子先标记防重入；到达目标置 ok=1；全部探索完未达则不可达。递归调用栈天然承担回溯。',
        steps: ['读入 3x3 迷宫矩阵', '从 (0,0) 开始 dfs', '越界或墙则返回', '到达目标置 ok=1 返回', '否则标记后向四方递归', '输出可达/不可达'],
        complexity: '时间 O(R*C)（每个格子至多访问一次），空间 O(R*C)（递归栈最坏达到格子数）。',
        pitfalls: [
          '进入格子必须先标记 m[x][y]=2，否则会反复进出造成死循环。',
          '遍历边界检查必须先做，越界访问数组是严重错误。',
          '目标判定要放在可走判断之后，且要检查是否在边界内。'
        ]
      },
      explain: {
        code_reading: { steps: ['读入迷宫并调用 dfs(0,0)', '深搜四个方向', '到达目标置 ok=1', '按 ok 输出可达性'] },
        code_completion: { steps: ['进入先判边界与墙', '到达目标置 ok', '标记已访问后向四方递归'] },
        ds_debug: { idea: '方向缺失或目标置错会改变可达性结论而不报错。', steps: ['核对四个递归方向是否齐全且无重复', '核对到达目标是否 ok=1', '用被围迷宫验证不可达'] },
        complexity_analysis: { idea: '深搜每个格子至多访问一次，时间空间均 O(R*C)。' }
      }
    }
  ]
};
