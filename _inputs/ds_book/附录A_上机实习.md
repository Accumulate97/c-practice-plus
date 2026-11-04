附录 A ”上机实习报告内容规范和上机实习报告实例

附录 A.1 上机实习报告内容规范

上机实习是数据结构课程教学不可或缺的重要环节。上机实习通过编写解决简单问题的程
序，达到以下训练目的:

@ 使学生进一步理解和掌握课堂上所学各种基本抽象数据类型的逻辑结构、存储结构和操
作实现算法，以及它们在程序中的使用方法;

@ 使学生掌握软件设计的基本内容和设计方法，并培养学生进行模块化软件设计的能力

© 使学生进一步熟练掌握一门高级程序设计语言。

为达到严格训练的目的，要求上机实习后书写上机实习报告。规范的上机实习报告应当包
括以下 9 部分内容。

题目，要求解问题的概述。

问题描述，要求解问题的详细描述。

基本要求， 给出程序要达到的具体要求。

测试数据;设计测试数据，或具体给出测试数据。要求测试数据能全面地测试所设计程序
的功能。

算法思想:描述解决相应问题算法的主要思想。

模块划分:描述所设计程序包括的函数，以及这些函数的文件组织结构。

数据结构，描述存储数据元素的存储结构。

源程序;给出所有源程序清单，要求程序中有充分的注释语句，至少要注酸每个函数参数
的含义和函数返回值的含义。

测试情况: 给出程序的测试情况说明和测试结果分析。

在以上 9 部分内容中，题目、问题描述和基本要求部分通常由教师作为程序设计要求给出。
有时，测试数据部分也由教师给出，若教师没有给出此部分，则要求学生自己分析设计测试数
据。算法思想、模块划分、数据结构、源程序和测试情况部分的内容，是学生上机实习报告的
主体。

附录 A.2 ”上机实习报告实例

题目: 约瑟夫环问题模拟。

问题描述: Wee SA 1,2, +n Ca>0) 的个人按顺时针方向围坐一轿，每人持有一个正
整数密码。开始时，任意给出一个报数上限值 谱，从第一个人开始按顺时针方向从 1 开始顺序
FRA, FRB) 关时停止报数，报 记的人出列，将他的密码作为新的六值，从他在顺时针方向上的
下一个人起重新从 1 开始顺序报数，如此下去，直到所有人全部出列为止。要求: 设计一个程
序模拟此过程，并输出出列人的编号序列。

基本要求:

C1) 把带头结点的单循环链表设计为头文件。

(2) 用带头结点的单循环链表作为存储结构。

。279 。


测试数据;

1=7，7个人的密码依次为 3, 1, 7, 2, 4, 8, 4。

初始报数上限值 六= 20。

算法思想:

JesephRingO函数是实现问题要求的主要函数，其算法思想是: 从 1 至六对带头结点的单循
环链表循环计数，到 疡时，输出该结点的编号值，将该结点的密码作为新的六值，并删除该结
点，然后从该结点的下一个结点起重新从 1 开始循环计数;如此下去，直到单循环链表为空时，
循环过程结束。

模块划分:

(1) 头文件 SCLinListh。头文件 SCLinListh 中包括: 结点结构体定义、初始化操作、插入
一个结点操作、删除一个结点操作、取一个数据元素操作及判断单循环链表是否非空操作等。

(2) Main.c 文件。Main.c 文件包括以下 3 个函数。

void SCLLDeleteAfter(SCLNode *p)函数: 其功能是删除带头结点的单循环链表中指针 p 所
指结点的下一个结点。这是根据本问题需要设计的一个函数。

void JesephRing(SCLNode *head, int m)函数: 其功能是对带头结点的单循环链表 head, LL m
为初始报数上限值，完成约瑟夫环问题程序模拟过程。

void main(void)函数: 主函数，其功能是给出测试数据值，建立测试数据值的带头结点单特
环链表，调用 JesephRing(O)函数实现问题要求。

数据结构:

(1) 数据类型 DataType 定义如下:

typedef struct
{
int number;
int cipher;
} DataType;
(2) 带头结点单循环链表结点的结构体定义如下:
typedef struct node
{
DataType data;
struct node *next;
} SCLNode;
源程序;
源程序存放在两个文件中，即头文件 SCLinListh 和文件 Main.c。
//头文件 SCLinList.h
typedef struct node
{
DataType data;
struct node *next;

} SCLNode;                                          //结点结构体定义

void SCLLInitiate(SCLNode **head)                           //初始化

{
if ((*head = (SCLNode *)malloc (sizeof (SCLNode))) == NULL) exit(1) ;
(*head)-—>next = *head;

* 280°


int SCLLInsert (SCLNode *head, int i, DataType x) ，//插入一个结点

{

SCLNode *p, *q;
int j;
p = head->next;   j=;
while(p != head && j < i - 1)
{
p = p->next; jtt;
}
if(j !=i- 1 &&i != 1)
{
printf (AMBER ! ”);
return 0;
}
if ((q = (SCLNode *)malloc (sizeof (SCLNode))) == NULL) exit (1);
q->data
q->next = p-—>next;
q;

xX;

p->next
return 1;

int SCLLDelete(SCLNode *head, int i, DataType *x) //删除一个结点

{

int SCLLGet(SCLNode *head, int i, DataType #x) //取一个结点数据元素值

{

SCLNode *p, *q;

int j;

p = head; j = 0;

while(p->next != head && j < i - 1)

{
p = p->next; j++;

}

if(j !=i- 1

{
printf ("删除位置参数错! ") ;
return 0;

}

q = p->next;

p->next = p->next->next;
*x = q->data;

free(q);

return 1;

SCLNode *p;
int j;

° 281°


"282。

p = head; j = 0;
while(p—>next != head && j < i)
{
p = p->next; jt+;
}
if(j != i)
{

printf ("取元素位置参数错! ");

return 0;
}
*x = p->data;
return 1;

int SCLLNot Empty (SCLNode *head)

{
if (head->next == head) return 0;
else return 1;

// SAF Main. c
#include <stdio.h>
#include <stdlib.h>
typedef struct
{
int number;
int cipher;
} DataType;
#include "SCLinList. h"

void SCLLDeleteAfter (SCLNode *p)
{
SCLNode *q = p->next;
p->next = p-—>next-—>next;
free (q);

void JesephRing(SCLNode *head, int m)

//链表非空否

//定义具体的数据类型 DataType
//包含头文件 SCLinList

//删除 p 指针所指结点的下一个结点

//对带头结点单循环链表 head，初始值为m的约瑟夫环问题函数

{
SCLNode *pre, *curr;
int i;
pre = head;
curr = head->next;
while (SCLLNotEmpty (head) == 1)
{
for(i = 1; i < m; i++)

{


pre = curr;
curr = curr->next;
if (curr == head)
{
pre = curr;
curr = curr->next;
}
}

printf(" %d ", curr->data. number) ;
m = curr->data. cipher;

curr = curr->next;

if (curr == head) curr = curr->next;
SCLLDeleteAfter (pre) ;

}

void main(void)

{
DataType test(7]={{1, 3}, {2,1}, {3, 7}, {4, 2}, {5, 4}, {6,8}, {7, 4h};
int n = 7, m= 20, i;
SCLNode *head;

SCLLInitiate (head) ;//初始化
for(i = 1; i <= ni itt)              //循环插入建立单循环链表
SCLLInsert (head, i, test[i-1]);
JesephRing (head, m);                   //调用约瑟夫环问题函数
}
测试情况:

C1) 程序运行输出为:
6 1 4 7 2 3 5
(2) 测试结果分析:
程序运行结果和人工模拟分析过程完全相同，说明程序设计正确。

° 283
