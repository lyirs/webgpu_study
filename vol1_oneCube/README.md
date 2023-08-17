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
