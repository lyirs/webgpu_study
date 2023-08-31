### MVP 矩阵

MVP 矩阵分别是模型（Model），观察（View），投影（Projection）三个矩阵

- 1.MVP 首先从局部空间（Local Space）经过 M 矩阵（Model MATRTX）的变换到我们的世界空间（Word Space）。
- 2.然后世界空间（Word Space）再经过 V 矩阵（VIEW MATRTX）的变换，变换到我们的观察空间（View Space）。
- 3.观察空间（View Space）经过投影矩阵（PROJECTION MATRIX）的变换，变换到裁剪空间（Clip Space）。
- 4.裁剪空间（Clip Space）通过投影映射变换到屏幕空间（Screen Coordinate）

<div align="center">

<hr/>

平移矩阵 T

$$
\left[
\begin{matrix}
1 & 0 & 0 & Tx  \\
0 & 1 & 0 & Ty  \\
0 & 0 & 1 & Tz  \\
0 & 0 & 0 & 1
\end{matrix}
\right]
*
\left[
\begin{matrix}
x  \\
y  \\
z  \\
1
\end{matrix}
\right]
$$

缩放矩阵 S

$$
\left[
\begin{matrix}
Sx & 0 & 0 & 0  \\
0 & Sy & 0 & 0  \\
0 & 0 & Sz & 0  \\
0 & 0 & 0 & 1
\end{matrix}
\right]
*
\left[
\begin{matrix}
x  \\
y  \\
z  \\
1
\end{matrix}
\right]
$$

旋转矩阵 R

$$
\left[
\begin{matrix}
cosγ & -sinγ & 0 & 0  \\
sinγ & cosγ & 0 & 0  \\
0 & 0 & 1 & 0  \\
0 & 0 & 0 & 1
\end{matrix}
\right]
*
\left[
\begin{matrix}
x  \\
y  \\
z  \\
1
\end{matrix}
\right]
\tag{绕z轴旋转}
$$

$$
\left[
\begin{matrix}
1 & 0 & 0 & 0  \\
0 & cosα & -sinα & 0  \\
0 & sinα & cosα & 0  \\
0 & 0 & 0 & 1
\end{matrix}
\right]
*
\left[
\begin{matrix}
x  \\
y  \\
z  \\
1
\end{matrix}
\right]
\tag{绕x轴旋转}
$$

$$
\left[
\begin{matrix}
cosβ & 0 & sinβ & 0  \\
0 & 1 & 0 & 0  \\
-sinβ & 0 & cosβ & 0  \\
0 & 0 & 0 & 1
\end{matrix}
\right]
*
\left[
\begin{matrix}
x  \\
y  \\
z  \\
1
\end{matrix}
\right]
\tag{绕z轴旋转}
$$

模型矩阵 M = S \* R \* T \* M （ 平移 -> 旋转 -> 缩放 ）

</div>

<hr/>

### GPUBufferUsage 标志

GPUBufferUsage 标志决定了 GPUBuffer 在创建后如何使用：

| 标志          | 描述                                                 | 示例                                                                                                   |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| MAP_READ      | 可以映射缓冲区以供读取。只能与 COPY_DST 结合使用。   | 使用 GPUMapMode.READ 调用 mapAsync()                                                                   |
| MAP_WRITE     | 可以映射缓冲区以进行写入。只能与 COPY_DST 结合使用。 | 使用 GPUMapMode.WRITE 调用 mapAsync()                                                                  |
| COPY_SRC      | 缓冲区可以用作复制操作的源。                         | 作为 copyBufferToBuffer() 或 copyBufferToTexture() 调用的 source 参数。                                |
| COPY_DST      | 缓冲区可用作复制或写入操作的目标。                   | 作为 copyBufferToBuffer() 或 copyTextureToBuffer() 调用的“目标”参数，或作为 writeBuffer() 调用的目标。 |
| INDEX         | 该缓冲区可用作索引缓冲区。                           | 传递给 setIndexBuffer()。                                                                              |
| VERTEX        | 该缓冲区可用作顶点缓冲区。                           | 传递给 setVertexBuffer()。                                                                             |
| UNIFORM       | 该缓冲区可以用作统一缓冲区。                         | 作为 GPUBufferBindingLayout 的绑定组条目，其 buffer.type 为 "uniform"。                                |
| STORAGE       | 缓冲区可以用作存储缓冲区。                           | 作为具有 buffer 的 GPUBufferBindingLayout 的绑定组条目。type 为 "storage" 或 "read- 仅存储"            |
| INDIRECT      | 缓冲区可用于存储间接命令参数。                       | 作为 drawIndirect() 或 dispatchWorkgroupsIndirect() 调用的 indirectBuffer 参数。                       |
| QUERY_RESOLVE | 缓冲区可用于捕获查询结果。                           | 作为 resolveQuerySet() 调用的“目标”参数。                                                              |

<h3 align="center">

<hr/>

💡 **正交投影** 💡

</h3>

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="753px" height="341px" viewBox="-0.5 -0.5 753 341" style="background-color: rgb(255, 255, 255);"><defs/><g><path d="M 102 120 L 202 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 102 120" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 202 230" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 230 L 202 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 130 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 230 L 332 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 332 130 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 120 L 232 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 232 70 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 232 120" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 232 120 L 232 70" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 232 120 L 332 130" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 472 80 L 552 30" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 552 30 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 472 80 L 642 110" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 110 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 492 190 L 472 80" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 492 190 L 642 250" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 250 L 642 110" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 682 170 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 250 L 682 170" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 562 150 L 552 30" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 562 150 L 682 170" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 492 190 L 562 150" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><rect x="172" y="100" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="201.5" y="119.5">(r,t,-n)</text></g><rect x="172" y="230" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="201.5" y="249.5">(r,b,-n)</text></g><rect x="52" y="90" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="81.5" y="109.5">(l,t,-n)</text></g><rect x="52" y="180" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="81.5" y="199.5">(l,b,-n)</text></g><rect x="432" y="180" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="461.5" y="199.5">(-1,-1,0)</text></g><rect x="622" y="250" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="651.5" y="269.5">(1,-1,0)</text></g><rect x="692" y="160" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="721.5" y="179.5">(1,-1,1)</text></g><rect x="692" y="20" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="721.5" y="39.5">(1,1,1)</text></g><rect x="522" y="0" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="12px"><text x="551.5" y="19.5">(-1,1,1)</text></g><path d="M 557 159 L 604.46 116.72" fill="none" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 609.5 112.23 L 605.77 121.58 L 604.46 116.72 L 599.78 114.86 Z" fill="#00c6f7" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 482 140 L 632.2 177.55" fill="none" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 638.75 179.19 L 628.92 181.37 L 632.2 177.55 L 631.11 172.64 Z" fill="#ff003c" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 562 220 L 552.77 100.07" fill="none" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 552.26 93.34 L 557.43 101.97 L 552.77 100.07 L 548.46 102.66 Z" fill="#4cc700" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><rect x="532" y="220" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="561.5" y="241.5">-1</text></g><rect x="525" y="66" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="554.5" y="87.5">y 1</text></g><rect x="442" y="120" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="471.5" y="141.5">-1</text></g><rect x="613" y="175" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="642.5" y="196.5">x 1</text></g><rect x="534" y="149" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="563.5" y="170.5">0</text></g><rect x="585" y="89" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="614.5" y="110.5">z 1</text></g><path d="M 363.5 166 L 363.5 154 L 399.5 154 L 399.5 142.5 L 420.5 160 L 399.5 177.5 L 399.5 166 Z" fill="none" stroke="rgb(0, 0, 0)" stroke-width="3" stroke-linejoin="round" stroke-miterlimit="10" pointer-events="all"/><rect x="112" y="310" width="190" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="206.5" y="331.5">视图空间坐标系</text></g><rect x="502" y="310" width="190" height="30" fill="none" stroke="none" pointer-events="all"/><g fill="rgb(0, 0, 0)" font-family="Helvetica" text-anchor="middle" font-size="16px"><text x="596.5" y="331.5">NDC 坐标系</text></g><path d="M 48 245 L 92.83 265.76" fill="none" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 98.96 268.59 L 88.9 268.89 L 92.83 265.76 L 92.68 260.73 Z" fill="#ff003c" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 48 245 L 48 195.1" fill="none" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 48 188.35 L 52.5 197.35 L 48 195.1 L 43.5 197.35 Z" fill="#4cc700" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 48 245 L 16.08 268.94" fill="none" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 10.68 272.99 L 15.18 263.99 L 16.08 268.94 L 20.58 271.19 Z" fill="#00c6f7" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/></g></svg>

> **注意:** webgpu 中 z 轴为[0,1]，不同于 opengl 中 z 轴为[-1,1]。

构建正交投影矩阵相对于透视投影来说要简单很多，只需要将视图空间（eye space）的坐标线性的映射到 NDC（normalized device coordinates）坐标中：

$$
(X_e) \to (X_n) \in [-1,1]
$$

$$
(Y_e) \to (Y_n) \in [-1,1]
$$

$$
(Z_e) \to (Z_n) \in [0,1]
$$

有以下线性变换等式：

$$
X_n = k_1 \times X_e + b_1   （经过(l,-1),(r,1)两点）
$$

$$
Y_n = k_2 \times Y_e + b_2   （经过(b,-1),(t,1)两点）
$$

$$
Z_n = k_3 \times Z_e + b_3   （经过(-n,0),(-f,1)两点）
$$

其中：

l：视锥体左平面，r：视锥体右平面

b：视锥体下平面，t：视锥体上平面

n：视锥体近平面，f：视锥体远平面

解得:

$$
k_1 = \frac{2}{r-l}
$$

$$
b_1 = \frac{r+l}{l-r}
$$

$$
k_2 = \frac{2}{t-b}
$$

$$
b_2 = \frac{t+b}{b-t}
$$

$$
k_3 = \frac{1}{n-f}
$$

$$
b_3 = \frac{n}{n-f}
$$

对应的正交投影矩阵就是：

$$
\begin{bmatrix}
\frac{2}{r-l} & 0 & 0 & \frac{r+l}{l-r} \\
0 & \frac{2}{t-b} & 0 & \frac{t+b}{b-t} \\
0 & 0 & \frac{1}{n-f} & \frac{n}{n-f} \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

对应的代码：

```
function ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array {
  dst = new Float32Array(16);

  dst[0]  = 2 / (right - left);
  dst[1]  = 0;
  dst[2]  = 0;
  dst[3]  = 0;

  dst[4]  = 0;
  dst[5]  = 2 / (top - bottom);
  dst[6]  = 0;
  dst[7]  = 0;

  dst[8]  = 0;
  dst[9]  = 0;
  dst[10] = 1 / (near - far);
  dst[11] = 0;

  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;

  return dst;
}

```
