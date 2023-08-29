<h3 align="center">

💡 **命令束** 💡

</h3>
passEncoder.executeBundles 是 WebGPU API 中的一个方法，它允许你执行预先录制的命令束（bundles）。

命令束是一组预先录制的渲染命令，这些命令可以在多个渲染通道中重复使用。

- 减少 CPU 与 GPU 之间的通信：当你录制一个命令束，你实际上是在 CPU 上预先组织和优化一组命令，然后在需要时发送给 GPU。这减少了每帧都重新组织和发送命令的开销。
- 命令重用：如果在多个渲染通道或多个帧中有相同的命令序列，你可以简单地重复使用同一个命令束，而不是每次都重新录制这些命令。
- 并行录制：在某些实现中，命令束可以在多个线程上并行录制，从而利用多核 CPU 的优势。
- 状态设置优化：由于命令束是预先录制的，某些实现可能会对状态设置进行优化，例如合并连续的状态设置命令或消除不必要的状态更改。

<hr/>

device.createRenderBundleEncoder 是 WebGPU API 的一部分，它允许开发者创建一个 GPURenderBundleEncoder 对象。

这个对象可以预先录制渲染命令，然后在渲染过程中快速重复执行这些命令，而不需要每帧重新编码它们。这种方法可以提高渲染性能，特别是当有大量重复的渲染命令时。

```
const renderBundleEncoder = device.createRenderBundleEncoder(descriptor);
```

- descriptor: 一个对象，描述了渲染束编码器的配置。它包括以下属性：
- colorFormats: 一个数组，列出了渲染目标的颜色格式。
- depthStencilFormat (可选): 深度/模板附件的格式。
- sampleCount (可选): 多重采样的数量，默认为 1。

1.创建渲染束编码器:
```
const renderBundleEncoder = device.createRenderBundleEncoder({
  colorFormats: ['rgba8unorm'],
  depthStencilFormat: 'depth24plus',
});
```

2.编码渲染命令:

使用渲染束编码器的方法（如setPipeline, setVertexBuffer等）来编码渲染命令。
```
renderBundleEncoder.setPipeline(pipeline);
renderBundleEncoder.setVertexBuffer(0, vertexBuffer);
// ... 其他渲染命令
```

3.完成渲染束:
```
const renderBundle = renderBundleEncoder.finish();
```

4.在渲染过程中使用渲染束:

在渲染过程中，使用executeBundles方法执行预先录制的渲染束。
```
renderPassEncoder.executeBundles([renderBundle]);
```

