// ds-ch06 图 第 4 批（1 个 code entry：AOE 关键路径）。规范全名 chapter='第6章 图'；section='6.6 拓扑排序与关键路径'。
// 坑：knowledgeIds/tags 必须数组；defect 的 find 恰好一次且两处不重叠；错误版不能崩/超时；C 换行用真实换行，printf 内 \\n。
export default {
  shard: 'ds-ch06',
  chapter: '第6章 图',
  category: 'ds',
  source: '自撰（依据《第6章 图》6.6 AOE 网与关键路径考点变式）',
  entries: [
    {
      key: 'aoe-critical-path',
      cxaStem: '阅读下面的 AOE 网关键路径求解程序（邻接矩阵 + 拓扑排序求 ve/vl），回答各问。',
      section: '6.6 拓扑排序与关键路径',
      difficulty: 3,
      bloom: 'apply',
      tags: ['AOE网', '关键路径', '拓扑排序', 've/vl', '活动开始时间'],
      knowledgeIds: ['ds-ch06-17', 'ds-ch06-16'],
      code: `#include <stdio.h>
#define MAXV 100
#define MAXE 1000
int main(void){
    int n,m,u,v,w,i,j,indeg[MAXV],ve[MAXV],vl[MAXV],eu[MAXE],ev[MAXE],ew[MAXE];
    int order[MAXV],cnt=0,h=0,t=0,q[MAXV],g[MAXV][MAXV];
    scanf("%d %d",&n,&m);
    for(i=0;i<n;i++){indeg[i]=0;ve[i]=0;vl[i]=0;for(j=0;j<n;j++)g[i][j]=-1;}
    for(i=0;i<m;i++){scanf("%d %d %d",&u,&v,&w);eu[i]=u;ev[i]=v;ew[i]=w;g[u][v]=w;indeg[v]++;}
    for(i=0;i<n;i++)if(indeg[i]==0)q[t++]=i;
    while(h<t){
        u=q[h++];order[cnt++]=u;
        for(v=0;v<n;v++)if(g[u][v]>=0){
            if(ve[u]+g[u][v]>ve[v])ve[v]=ve[u]+g[u][v];
            if(--indeg[v]==0)q[t++]=v;
        }
    }
    for(i=0;i<n;i++)vl[i]=ve[n-1];
    for(i=cnt-1;i>=0;i--){
        u=order[i];
        for(v=0;v<n;v++)if(g[u][v]>=0)
            if(vl[v]-g[u][v]<vl[u])vl[u]=vl[v]-g[u][v];
    }
    for(i=0;i<m;i++){
        u=eu[i];v=ev[i];
        if(ve[u]==vl[v]-ew[i])printf("%d %d\\n",u,v);
    }
    printf("%d\\n",ve[n-1]);
    return 0;
}`,
      stem: '读入一张 AOE 网（n 个事件，m 条活动边，格式：第一行 n m，随后 m 行 u v w 表示从事件 u 到事件 v、持续 w 的活动），用拓扑排序求各事件最早发生时间 ve 与最晚发生时间 vl，输出所有关键活动（u v）及关键路径长度 ve[n-1]。',
      inputs: [
        { stdin: '5 5\n0 1 3\n1 3 4\n0 2 2\n2 3 3\n3 4 5\n', note: '教材 AOE：两条路径 0-1-3-4 与 0-2-3-4，最长 3+4+5=12。', why: '关键路径为 0→1→3→4，长度 12；边 0-2、2-3 非关键（0-2 最晚开始为 2，早于最早 0 则只是余量，e≠l）。' },
        { stdin: '6 7\n0 1 1\n0 2 2\n1 3 3\n2 3 2\n3 4 4\n4 5 2\n2 5 6\n', note: '路径 0-1-3-4-5 长 1+3+4+2=10，0-2-5 长 2+6=8；入度 0 的事件为 0。', why: '关键路径为 0→1→3→4→5 长 10；边 0-2、2-3、2-5 均非关键（0-2 的 e=0，l=vl[2]-2=4-2=2 不等）。' },
        { stdin: '3 3\n0 1 4\n1 2 2\n0 2 9\n', note: '两条路径 0-1-2 长 4+2=6，0-2 长 9；最长取 0-2。', why: '关键路径只有 0→2（边 0 2），长度 9；边 0-1、1-2 的 e<l（0-1 e=0、l=7-4=3 不等）。' },
        { stdin: '4 4\n0 1 1\n1 2 1\n2 3 1\n0 3 5\n', note: '路径 0-1-2-3 长 3，0-3 长 5；最长取 0-3。', why: '关键路径只有 0→3，长度 5；0-1、1-2、2-3 的 e<l，均非关键。' },
      ],
      blanks: [
        {
          find: 'if(ve[u]+g[u][v]>ve[v])ve[v]=ve[u]+g[u][v];',
          accepted: ['if(ve[u]+g[u][v]>ve[v])ve[v]=ve[u]+g[u][v];'],
          hint: '事件 v 的最早发生时间取「所有入边活动完成时间」的最大值。',
          pitfall: '★ ve 必须取 max：事件 v 要等它所有前驱活动都做完才能开始，所以 ve[v]=max(ve[u]+w)。若误写成 `<`（取 min），会把最早发生时间往前赶，关键路径被错误缩短，工期算错。',
        },
        {
          find: 'if(vl[v]-g[u][v]<vl[u])vl[u]=vl[v]-g[u][v];',
          accepted: ['if(vl[v]-g[u][v]<vl[u])vl[u]=vl[v]-g[u][v];'],
          hint: '事件 u 的最晚发生时间取「所有出边活动最晚开始时间」的最小值。',
          pitfall: '★ vl 取 min：为保证总工期不延期，事件 u 必须赶在「所有后继活动最晚开始时间」里最早的那个之前发生，即 vl[u]=min(vl[v]-w)。若写成 `>`（取 max）或方向颠倒，vl 会偏大，导致关键活动判定错误。',
        },
      ],
      defects: [
        {
          kind: '比较逻辑取反',
          find: 'if(ve[u]==vl[v]-ew[i])printf("%d %d\\n",u,v);',
          replace: 'if(ve[u]!=vl[v]-ew[i])printf("%d %d\\n",u,v);',
          why: '关键活动判定条件 e==l 被取反成 e!=l，于是把「非关键活动」当成关键活动输出。',
          pitfall: '★ 关键活动是 e=ve[u] 与 l=vl[v]-w 相等、即最早开始=最晚开始、没有机动时间的活动。把 `==` 改成 `!=` 会输出恰好相反的一组边（把非关键的 0-2、2-3 也打进关键路径），关键路径完全错误。',
        },
        {
          kind: '目标置错',
          find: 'printf("%d\\n",ve[n-1]);',
          replace: 'printf("%d\\n",ve[0]);',
          why: '最后一行应输出汇点 n-1 的最早发生时间（=工程工期），却改成了源点 0 的 ve。',
          pitfall: '★ 关键路径长度 = 汇点的最早发生时间 ve[n-1]，因为所有活动都汇聚到汇点。而源点 ve[0] 恒为 0，输出它会让工期变成 0，显然错误。工程总工期取汇点而非源点或某中间事件。',
        },
      ],
      asks: [
        { label: 'AOE 网中，事件最早发生时间 ve 用什么原则求?', answer: '取所有前驱活动完成时间的最大（max）', unit: '' },
        { label: '关键活动满足什么关系（e 与 l）?', answer: 'e == l（即 ve[u] == vl[v] - w）', unit: '' },
        { label: '工程工期（关键路径长度）应输出哪个值?', answer: 've[n-1]（汇点最早发生时间）', unit: '' },
        { label: 'AOE 网中不允许存在什么?', answer: '回路（必须是有向无环图 DAG）', unit: '' },
        { label: '求 vl 时应从哪个事件开始反向递推?', answer: '汇点（其 vl = 其 ve = 工期）', unit: '' },
      ],
      complexity: 'O(n^2+m)',
      complexityAccepted: ['O(n^2+m)', 'O(n^2)', 'O(n^2) 平方'],
      askSpace: 'AOE 网求关键路径分两步：先用拓扑序求 ve（事件最早发生时间，取 max），再从汇点按逆拓扑序求 vl（事件最晚发生时间，取 min），最后判定 e=ve[u] 与 l=vl[v]-w 相等的活动为关键活动。工程总工期即汇点的 ve。关键路径的长度不是活动数，而是这些关键活动持续时间之和。',
      notes: {
        idea: 'AOE 网（边表示活动、权为持续时间）上，用拓扑排序正向求各事件最早发生时间 ve（取 max），再逆拓扑序求最晚发生时间 vl（取 min），满足 e=ve[u]、l=vl[v]-w、且 e==l 的活动就是关键活动，汇点 ve 即工程工期。',
        steps: [
          '读入 n、m 与 m 条边 (u,v,w)，记录入度、邻接矩阵。',
          '入度为 0 的事件入队，用 Kahn 拓扑序正向递推 ve[v]=max(ve[u]+w)。',
          '逆拓扑序反向递推 vl[u]=min(vl[v]-w)，汇点 vl=其 ve。',
          '对每条活动边判定 ve[u]==vl[v]-w，相等则输出关键活动。',
          '输出汇点的 ve 作为关键路径长度（工程工期）。',
        ],
        complexity: '邻接矩阵 + 拓扑排序 + 逆拓扑各 O(n²)，读边 O(m)，整体时间 O(n²+m)，空间 O(n²)（邻接矩阵）。',
        pitfalls: [
          've 取 max、vl 取 min，方向不能颠倒。',
          '关键活动是 e==l 无机动时间者，不是简单「最长边」。',
          '工程工期取汇点 ve，与源点 ve==0 区分开。',
          'AOE 网必须无环，否则拓扑排序无法结束（会得到不完整的 order）。',
        ],
      },
      explain: {
        code_reading: { steps: ['读 n、m 与 m 条带权边。', '拓扑序求 ve（事件最早发生时间）。', '逆拓扑序求 vl。', '判定并输出关键活动与工期。'] },
        code_completion: { steps: ['ve 是事件最早发生时间，取所有入边最大值。', 'vl 是事件最晚发生时间，取所有出边最小值。'] },
        ds_debug: { steps: ['检查 ve/vl 取 max/min 的方向是否正确。', '检查关键活动判定 e==l 是否被取反。', '检查最后一行输出的是否是汇点 ve[n-1]。'] },
        complexity_analysis: { steps: ['拓扑序正推每事件 O(n) 次、共 O(n²)。', '逆拓扑序反推 O(n²)。', '判定 m 条活动边 O(m)。'] },
      },
    },
  ],
}
