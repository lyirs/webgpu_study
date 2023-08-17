### GPUTextureUsage 标志

GPUTextureUsage 标志决定了 GPUTexture 在创建后如何使用：
| 标志 | 描述 | 示例 |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| COPY_SRC | 纹理可以用作复制操作的来源。 | 作为 copyTextureToTexture() 或 copyTextureToBuffer() 调用的 source 参数。 |
| COPY_DST | 纹理可用作复制或写入操作的目标。 |作为 copyTextureToTexture() 或 copyBufferToTexture() 调用的“目标”参数，或作为 writeTexture() 调用的目标。 |
| TEXTURE_BINDING | 纹理可以绑定用作着色器中的采样纹理 | 作为绑定组 GPUTextureBindingLayout 的条目。 |
| STORAGE_BINDING | 纹理可以绑定用作着色器中的存储纹理 | 作为 GPUStorageTextureBindingLayout 的绑定组条目。 |
| RENDER_ATTACHMENT | 纹理可以用作渲染过程中的颜色或深度/模板附件。 | 作为 GPURenderPassColorAttachment.view 或 GPURenderPassDepthStencilAttachment.view。 |
