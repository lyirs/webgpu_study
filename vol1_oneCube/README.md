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

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="753px" height="342px" viewBox="-0.5 -0.5 753 342" content="&lt;mxfile&gt;&lt;diagram id=&quot;nRc2XNn0OEb7ZUNHGew7&quot; name=&quot;第 1 页&quot;&gt;7ZzBcqM4EEC/RlW7h1QJhAQcDXFmLrs1VTnsWWMUm1psebCcOPP1KwyyjWCDTQlCwJcEN6KR+3WLVksYoHB9+JbS7eovHrEE2DA6APQIbNvyHSz/ZZL3QgIdmEuWaRwVsrPgOf7NVMNCuo8jtis1FJwnIt6WhQu+2bCFKMlomvK3crMXnpTvuqVLVhE8L2hSlf4TR2KVSz3bPcu/s3i5Une2iJ+fWVPVuPgmuxWN+NuFCM0BClPORX60PoQsyayn7JJf9/Q/Z08dS9lGXHMByi94pcm++G5Fv8S7+rJsE80ym8lPG76RwmAl1on8ZMnD6v2KLrCoZMLi7t8YXzORvssGb2fD4cIYqwubKVnKEiri17LhacFveVJ3usMPHsue2FA5Gyz0FK6GlKcpFTu+TxesuOrSUJoiW1eENUWCpksmKorkwcXXPouOHOqZOBNj4lgtmTTCNccE35m0ixOnuzghI2fSaMoBjl3uxJhUTHktE4TKimy/MybexJi0jhOdSYdx4o+cSaMpBxgn6pE3WijmkuEeoVgjh9JoyyFGit0GSkR3KxYVWC4IZfIfVAiWbo4SGyIp3YmU/3uaXttfgKS5HFofPLub11itCgBjJ9kIYIgDZauywZ3k8HJDa+zFBsfVbAlbQsFYC68OoYy92tBoy2uhEF9TRLqDMvZyg7FIIY6mCHUHZez1hkZbDjFSxl5wcDRbtk6+G0POHBS1CHiHcuvwdYLUAZSxFxwabTnAZ4piMF4onmbLtlWgHp8po988YC5SmugahHIvA9RNbogGoC3JHmec7fYc3EkOMCZb1Q7GTtJYctjoEgZJ1hUcSCINE7zwY5/OSMmvPVcnHnbHPYwz2cAi28ORjjovj5bZ/z9SYIdSRfiw+VMplf3J9eZNKl4j2EGUvSP3g5AnPD270kucJJqIJvEy85+F9A4m5cErS0W8oMmsOLGOoyi7TfC2igV73tJFds+3lG6lLOX7TXR0TviRp2U62eFDX1Nn9VmXmhtd+CKp8UU95bx0uxLnj6DWFSxMQv15h5pHOO4Ral3BwxTUZMKRqiVAyOqPqdLRGdOpBqrG1IE9Mq0rt5hi+mBlQLM/cHpQHfSJVOvqNaaoThkqsTWobo9Q6+o9xqFaE4SqzYSQ1yPUunqRSah3pnk+6vTItK5yZPSZOlGoWBt97R5nqei2vQ6LhO528aJs9oxS8TalRTSLA5mK/aQWsyt4QLYGGpInF+hlJvSRWQdSZsIYlwdX1y+ruLpgaGmjdHfLXei2LRRtWEcehC6qY/30BKHs4ldk7eg1XX3xq/V6c3ebANBtOzPasCaQ+pZbx9oJQxfCL8lar/o6bXd26ks6SK9DG3yzt1rAeLAG+rjUfcrE41OfkfaYEznVOkPWsylZX63Xq+TFI/1Zv5qRTsnxHX2nTJ+OX118PEzL8Yl6h+y00ov7s341a4fTsTxWdcBTPub3Z/lqXvV7Wn6PvfKAj2B/1sfVTKdi+N2KbrPDl4QdivQ2aMp0q3nq1YYbSN6K9N0KXsu81bEbFBn89ZOaRZq5B2YukDnEHAM/AMEczF0w80EwA3Mf+C4InOOpR+BDMCdgBoHnZm0CBIKh1og6iEJLKxuckuALd7P8rsLQroD7+zG8czmG82dyuW3rbM8FHm2krDH0pxV4SImZQ3C7sbPyqnZ3m//wbRtye67vjB+1rgfizkjftmG35wr9+ElranxToOXH8w8y5s3Pv2uJ5v8B&lt;/diagram&gt;&lt;/mxfile&gt;"><defs/><g><path d="M 102 120 L 202 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 102 120" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 202 230" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 230 L 202 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 130 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 202 230 L 332 130" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 332 130 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 120 L 232 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 232 70 L 332 70" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 102 190 L 232 120" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 232 120 L 232 70" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 232 120 L 332 130" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 472 80 L 552 30" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 552 30 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 472 80 L 642 110" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 110 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 492 190 L 472 80" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 492 190 L 642 250" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 250 L 642 110" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 682 170 L 692 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 642 250 L 682 170" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 562 150 L 552 30" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 562 150 L 682 170" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><path d="M 492 190 L 562 150" fill="none" stroke="rgb(0, 0, 0)" stroke-width="2" stroke-miterlimit="10" stroke-dasharray="2 6" pointer-events="stroke"/><rect x="172" y="100" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 115px; margin-left: 173px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(r,t,-n)</font></div></div></div></foreignObject><text x="202" y="119" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(r,t,-n)</text></switch></g><rect x="172" y="230" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 245px; margin-left: 173px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(r,b,-n)</font></div></div></div></foreignObject><text x="202" y="249" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(r,b,-n)</text></switch></g><rect x="52" y="90" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 105px; margin-left: 53px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(l,t,-n)</font></div></div></div></foreignObject><text x="82" y="109" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(l,t,-n)</text></switch></g><rect x="52" y="180" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 195px; margin-left: 53px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(l,b,-n)</font></div></div></div></foreignObject><text x="82" y="199" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(l,b,-n)</text></switch></g><rect x="432" y="180" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 195px; margin-left: 433px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(-1,-1,0)</font></div></div></div></foreignObject><text x="462" y="199" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(-1,-1,0)</text></switch></g><rect x="622" y="250" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 265px; margin-left: 623px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(1,-1,0)</font></div></div></div></foreignObject><text x="652" y="269" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(1,-1,0)</text></switch></g><rect x="692" y="160" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 175px; margin-left: 693px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(1,-1,1)</font></div></div></div></foreignObject><text x="722" y="179" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(1,-1,1)</text></switch></g><rect x="692" y="20" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 35px; margin-left: 693px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(1,1,1)</font></div></div></div></foreignObject><text x="722" y="39" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(1,1,1)</text></switch></g><rect x="522" y="0" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 15px; margin-left: 523px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;"><font style="font-size: 16px;">(-1,1,1)</font></div></div></div></foreignObject><text x="552" y="19" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">(-1,1,1)</text></switch></g><path d="M 557 159 L 604.46 116.72" fill="none" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 609.5 112.23 L 605.77 121.58 L 604.46 116.72 L 599.78 114.86 Z" fill="#00c6f7" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 482 140 L 632.2 177.55" fill="none" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 638.75 179.19 L 628.92 181.37 L 632.2 177.55 L 631.11 172.64 Z" fill="#ff003c" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 562 220 L 552.77 100.07" fill="none" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 552.26 93.34 L 557.43 101.97 L 552.77 100.07 L 548.46 102.66 Z" fill="#4cc700" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><rect x="532" y="220" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 235px; margin-left: 533px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">-1</div></div></div></foreignObject><text x="562" y="240" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">-1</text></switch></g><rect x="525" y="66" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 81px; margin-left: 526px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">y 1</div></div></div></foreignObject><text x="555" y="86" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">y 1</text></switch></g><rect x="442" y="120" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 135px; margin-left: 443px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">-1</div></div></div></foreignObject><text x="472" y="140" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">-1</text></switch></g><rect x="613" y="175" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 190px; margin-left: 614px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">x 1</div></div></div></foreignObject><text x="643" y="195" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">x 1</text></switch></g><rect x="534" y="149" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 164px; margin-left: 535px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">0</div></div></div></foreignObject><text x="564" y="169" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">0</text></switch></g><rect x="585" y="89" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 104px; margin-left: 586px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">z 1</div></div></div></foreignObject><text x="615" y="109" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">z 1</text></switch></g><path d="M 363.5 166 L 363.5 154 L 399.5 154 L 399.5 142.5 L 420.5 160 L 399.5 177.5 L 399.5 166 Z" fill="none" stroke="rgb(0, 0, 0)" stroke-width="3" stroke-linejoin="round" stroke-miterlimit="10" pointer-events="all"/><rect x="112" y="310" width="190" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 188px; height: 1px; padding-top: 325px; margin-left: 113px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">视图空间坐标系</div></div></div></foreignObject><text x="207" y="330" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">视图空间坐标系</text></switch></g><rect x="502" y="310" width="190" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 188px; height: 1px; padding-top: 325px; margin-left: 503px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 16px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">NDC 坐标系</div></div></div></foreignObject><text x="597" y="330" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="16px" text-anchor="middle">NDC 坐标系</text></switch></g><path d="M 48 245 L 92.83 265.76" fill="none" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 98.96 268.59 L 88.9 268.89 L 92.83 265.76 L 92.68 260.73 Z" fill="#ff003c" stroke="#ff003c" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 48 245 L 48 195.1" fill="none" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 48 188.35 L 52.5 197.35 L 48 195.1 L 43.5 197.35 Z" fill="#4cc700" stroke="#4cc700" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/><path d="M 48 245 L 16.08 268.94" fill="none" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 10.68 272.99 L 15.18 263.99 L 16.08 268.94 L 20.58 271.19 Z" fill="#00c6f7" stroke="#00c6f7" stroke-width="3" stroke-miterlimit="10" pointer-events="all"/></g><switch><g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"/><a transform="translate(0,-5)" xlink:href="https://www.diagrams.net/doc/faq/svg-export-text-problems" target="_blank"><text text-anchor="middle" font-size="10px" x="50%" y="100%">Text is not SVG - cannot display</text></a></switch></svg>

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
