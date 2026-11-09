// ds-ch07 查找 第 3 批（1 个 code entry：散列表线性探测 + 装填因子/成功查找 ASL）。规范全名 chapter='第7章 查找'；section='7.5 散列表'。
// 坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次且两处不重叠；错误版不能崩/超时；C 换行用真实换行，printf 内 \\n。
export default {
  shard: 'ds-ch07',
  chapter: '第7章 查找',
  category: 'ds',
  source: '自撰（依据《第7章 查找》7.5 散列表：除留余数法 + 线性探测 + 装填因子与成功查找 ASL 考点变式）',
  entries: [
    {
      key: 'hash-load-factor',
      cxaStem: '阅读下面的散列表构造程序（除留余数法 H(key)=key%m + 线性探测），回答各问。',
      section: '7.5 散列表',
      difficulty: 3,
      bloom: 'apply',
      tags: ['散列表', '线性探测', '装填因子', '成功查找ASL', '除留余数法'],
      knowledgeIds: ['ds-ch07-14', 'ds-ch07-03'],
      code: `#include <stdio.h>
#define MAX 100
int main(void){
    int n,m,i,k,pos,step,total;
    int table[MAX],used[MAX],probe[MAX],key[MAX];
    scanf("%d %d",&n,&m);
    for(i=0;i<m;i++){table[i]=-1;used[i]=0;}
    for(i=0;i<n;i++){scanf("%d",&key[i]);}
    total=0;
    for(i=0;i<n;i++){
        k=key[i];
        pos=k%m;
        step=0;
        while(used[pos]){
            pos=(pos+1)%m;
            step++;
        }
        used[pos]=1;
        table[pos]=k;
        probe[i]=step+1;
        total+=probe[i];
    }
    for(i=0;i<m;i++){printf("%d",table[i]);if(i<m-1)printf(" ");}
    printf("\\n");
    printf("%d\\n",total);
    printf("%.2f\\n",(double)total/n);
    return 0;
}`,
      stem: '读入 n（关键字个数）与 m（散列表长），随后读入 n 个关键字。用除留余数法 H(key)=key%m 求初始位置，并用线性探测法解决冲突：把关键字放入散列表（空位用 -1 表示），统计每个关键字的探测次数（probe[i] 含直接命中的第 1 次探测），输出散列表中每个槽位的值、总探测次数 total、以及成功查找的平均查找长度 total/n。',
      inputs: [
        { stdin: '5 5\n3 1 4 9 2\n', note: '装填因子 α=5/5=1，所有关键字基本直接命中，仅 9 冲突一次。', why: '散列表 9 1 2 3 4，总探测 6，ASL=6/5=1.20。9 的探测次数为 2（%5=4 已占，线性探测到 0）。' },
        { stdin: '7 11\n12 23 34 45 56 67 78\n', note: '装填因子 α=7/11≈0.64，全部关键字 %11 都等于 1，形成一条长线性探测链。', why: '散列表 -1 12 23 34 45 56 67 78 -1 -1 -1，总探测 28，ASL=28/7=4.00。每个关键字都从 1 开始顺次探测到其唯一位置。' },
        { stdin: '6 8\n3 11 19 27 35 43\n', note: '装填因子 α=6/8=0.75，关键字 %8 均为 3 的等差序列，线性探测链很长。', why: '散列表 43 -1 -1 3 11 19 27 35，总探测 21，ASL=21/6=3.50。最后一个 43 探测到下标 0 才落入。' },
        { stdin: '4 7\n10 14 17 21\n', note: '装填因子 α=4/7≈0.57，部分关键字冲突（10 与 17 同余 3，14 与 21 同余 0）。', why: '散列表 14 21 -1 10 17 -1 -1，总探测 6，ASL=6/4=1.50。17 探测 2 次、21 探测 2 次。' },
      ],
      blanks: [
        {
          find: 'pos=k%m;',
          accepted: ['pos=k%m;'],
          hint: '用除留余数法 H(key)=key%m 求关键字 k 的初始散列位置。',
          pitfall: '★ 散列函数必须是除留余数法 H(key)=key%m（模表长 m）。若误写成 key%n（模关键字个数）或 key/m（除运算），初始位置口径就错了，冲突情况与最终散列表全变，ASL 无法对应。',
        },
        {
          find: 'pos=(pos+1)%m;',
          accepted: ['pos=(pos+1)%m;'],
          hint: '线性探测：下标冲突时向后顺移一位，越过表尾 m-1 应回绕到 0。',
          pitfall: '★ 线性探测是 pos=(pos+1)%m（环形回绕）。若写成 pos=pos+1（不取模），冲突到表尾 m-1 后访问 table[m] 越界（UB）；回绕后必须仍在 [0,m-1] 内。必须在顺移后取模。',
        },
      ],
      defects: [
        {
          kind: '漏计原子',
          find: 'probe[i]=step+1;',
          replace: 'probe[i]=step;',
          why: '成功查找每个关键字至少要探测 1 次（直接命中位），probe 应从 step+1 计起，漏计了首次探测。',
          pitfall: '★ 探测次数探针必须包含第 1 次（step 只记冲突顺移的次数，首位置不计入 step）。改成 probe[i]=step 会让所有关键字的探测数少 1，总探测与 ASL 全被低估（首个输入 total 由 6 变 1、ASL 由 1.20 变 0.20）。',
        },
        {
          kind: '公式错误',
          find: 'printf("%.2f\\n",(double)total/n);',
          replace: 'printf("%.2f\\n",(double)total/m);',
          why: '成功查找平均查找长度应除以关键字个数 n，误用表长 m 会使 ASL 计算错误。',
          pitfall: '★ ASL=总探测次数/关键字个数，分母是 n 不是表长 m。装填因子 α=n/m 才会用到 m；当 n=m 时两者恰好相等看不出错，但换 n≠m 的用例（如 7 11）ASL 由 4.00 错成 2.55。',
        },
      ],
      asks: [
        { label: '散列表的装填因子 α 如何计算?', answer: 'α = n / m（关键字个数 / 表长）', unit: '' },
        { label: '用线性探测解决冲突时，成功查找 ASL 由什么决定?', answer: '装填因子 α（α 越大冲突越严重，ASL 越大）', unit: '' },
        { label: '程序里 probe[i] 记录的是什么?', answer: '关键字 key[i] 插入所需的总探测次数（含直接命中）', unit: '' },
        { label: '线性探测到表尾后下一个位置怎么取?', answer: '回绕到 0（pos=(pos+1)%m）', unit: '' },
        { label: '成功查找 ASL 的分母该用 n 还是 m?', answer: 'n（关键字个数），不是表长 m', unit: '' },
      ],
      complexity: 'O(n·m) 最坏（n 个关键字，线性探测每次插入平均 O(1)、最坏 O(m)），期望 O(n)；空间 O(m)（散列表）。',
      complexityAccepted: ['O(n*m)', 'O(n*m) 最坏', 'O(n^2) 最坏', 'O(n·m) 最坏'],
      askSpace: '线性探测散列表的冲突处理：H(key)=key%m 定初始位置，冲突则 pos=(pos+1)%m 顺移。装填因子 α=n/m 决定拥挤程度，α 越大冲突越多、成功查找 ASL 越大。成功查找 ASL=Σ探测次数/n，分母是关键字个数 n。线性探测到表尾 m-1 后要回绕到 0，否则越界。',
      notes: {
        idea: '用除留余数法 H(key)=key%m 求关键字初始位置，冲突时用线性探测 pos=(pos+1)%m 顺移；每插一个关键字记下其探测次数（含直接命中的第 1 次），最后输出散列表、总探测次数与成功查找平均查找长度 ASL=total/n。',
        steps: [
          '读入 n（关键字数）、m（表长）与 n 个关键字，散列表空位初始化为 -1。',
          '对每个关键字 k 求 pos=k%m，冲突则 pos=(pos+1)%m 顺移，直到找到空位。',
          '把 k 放入该空位，记录 probe[i]=step+1（step 为顺移次数）。',
          '累加总探测次数 total，输出散列表各槽位值与 total。',
          '输出成功查找 ASL=(double)total/n。',
        ],
        complexity: '每个关键字线性探测平均 O(1)（α<1 时），最坏 O(m)，建整个表最坏 O(n·m)、期望 O(n)；空间 O(m)（散列表）。',
        pitfalls: [
          'probe 要含直接命中的第 1 次探测（加 1），否则 ASL 被低估。',
          '线性探测到表尾 m-1 必须 %m 回绕到 0，否则越界。',
          'ASL 分母是关键字个数 n，不是表长 m；只有装填因子 α 才用 m。',
          '空位标记要区分「未用」与「已用」，否则会把空位当作被占。',
        ],
      },
      explain: {
        code_reading: { steps: ['读 n、m 与关键字，把空槽位初始化成 -1。', '逐个关键字求 pos=key%m，冲突则线性探测顺移。', '累计每关键字的探测次数与 total。', '输出散列表、total 与 ASL=total/n。'] },
        code_completion: { steps: ['用除留余数法求初始位置 pos=k%m。', '冲突时线性探测顺移 pos=(pos+1)%m 并回绕。'] },
        ds_debug: { steps: ['检查探测次数是否含第 1 次（step+1）。', '检查 ASL 分母用 n 还是 m。', '检查线性探测是否越界/回绕。'] },
        complexity_analysis: { steps: ['线性探测每关键字平均 O(1)、最坏 O(m)。', 'n 个关键字建表最坏 O(n·m)、期望 O(n)。', '空间为散列表 O(m)。'] },
      },
    },
  ],
}
