struct Params {
    filterDim : i32,
    blockDim : u32,
}

struct Flip {
    value : u32,
}

@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var<uniform> params : Params;

@group(1) @binding(1) var inputTex : texture_2d<f32>;
@group(1) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(3) var<uniform> flip : Flip;

// 这个着色器根据 |flip.value| 是 0 还是 1，在一个方向上对输入纹理进行模糊处理。
// 每个线程加载一个 4 x 4 的纹素块，以充分利用纹理采样硬件。
// 然后，每个线程通过对共享内存中相邻纹素值取平均来计算模糊结果。

// <workgroup> 相同compute shader workgroup中的调用共享变量
var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;

@compute @workgroup_size(32, 1, 1)
fn main(
    @builtin(workgroup_id) WorkGroupID : vec3<u32>,
    @builtin(local_invocation_id) LocalInvocationID : vec3<u32>
) {
    let filterOffset = (params.filterDim - 1) / 2;
    /**
    * textureDimensions(t: texture_2d<T>, level: i32) -> vec2<i32>
    * 返回纹理的尺寸，或以 texels 为单位的纹理的 mip 级别。
    * @param t:	sampled, multisampled， depth, storage，或者 external 纹理。
    * @param level:	mip 级别，级别 0 包含纹理的全尺寸版本。如果省略，则返回级别 0 的维度。
    */
    let dims = vec2<i32>(textureDimensions(inputTex, 0));
    // 确定每个线程应该从输入纹理中加载哪些像素
    // 调用的本地调用ID local invocation ID 是调用对应的工作组网格点的坐标三元组。
    // 假设对于一个 128 x 128的计算任务中，如果workgroup_size为(4, 4, 4)，那么global_id 为 (x=6, y=6, z=0) 对应的local_invocation_id就是 (x=2, y=2, z=0)，workgroup_id为 (x=1, y=1, z=0)
    let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) +
                                LocalInvocationID.xy * vec2(4, 1))
                    - vec2(filterOffset, 0);

    //每个线程会加载一个 4x4 的纹理块到共享内存中
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
        // 从输入纹理中加载的像素的位置。
        var loadIndex = baseIndex + vec2(c, r);
        // 纹理采样中的翻转
        if (flip.value != 0u) {
            loadIndex = loadIndex.yx;
        }

        // 代码使用 textureSampleLevel 函数从输入纹理 inputTex 中进行采样
        // 采样的位置是由 loadIndex 计算得到的，稍微偏移了一点（vec2<f32>(0.25, 0.25)）以获得更平滑的采样。
        // 4 * LocalInvocationID.x + u32(c) 是要存储的位置。
        /**
         * textureSampleLevel(t: texture_2d<f32>, s: sampler, coords: vec2<f32>, level: f32) -> vec4<f32>
         * 使用显式 mip 级别或 mip 级别 0 对纹理进行采样。
         * @param t:	要采样的 sampled 或 depth 纹理。
         * @param s:	sampler type.
         * @param coords:	用于采样的纹理坐标。
         * @param level:	mip 级别，级别 0 包含纹理的全尺寸版本。 对于 level 是 f32 的函数，如果格式是可过滤的，则可以在两个级别之间插入小数值根据 Texture Format Capabilities。如果未指定，则对 mip 级别 0 进行采样。
         */
        tile[r][4 * LocalInvocationID.x + u32(c)] = textureSampleLevel(
            inputTex,
            samp,
            (vec2<f32>(loadIndex) + vec2<f32>(0.25, 0.25)) / vec2<f32>(dims),
            0.0
        ).rgb;
        }
    }

    // workgroupBarrier() 是在着色器中使用的一个同步函数，它用于在工作组内部的线程之间创建一个同步点。
    // 当调用了 workgroupBarrier() 后，所有在同一个工作组中的线程将会被暂停，直到工作组中的所有线程都达到了这个同步点。
    // 一旦所有线程都到达了这个同步点，它们才会继续执行下面的指令。
    // 在着色器中，工作组内的线程可以并行地执行，但有时候需要确保线程之间的执行顺序，或者在某些情况下需要等待其他线程完成特定操作。
    // 这时可以使用同步函数来实现这种同步行为，以确保线程按照预期的顺序执行。
    // 这里在共享内存中的所有线程都完成加载纹理数据后进行同步。它确保共享内存中的数据已准备好进行模糊计算。
    workgroupBarrier();

    // 每个线程会根据加载的纹理块数据计算模糊结果
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            var writeIndex = baseIndex + vec2(c, r);
            if (flip.value != 0) {
                writeIndex = writeIndex.yx;
            }
            // 计算当前像素在 4x4 块中的中心位置。
            let center = i32(4 * LocalInvocationID.x) + c;
            if (center >= filterOffset &&
                center < 128 - filterOffset &&
                all(writeIndex < dims)) {          // 确保不越界并且所有索引都在有效范围内
                    var acc = vec3(0.0, 0.0, 0.0);
                    // 计算模糊结果。
                    for (var f = 0; f < params.filterDim; f++) {
                        var i = center + f - filterOffset;
                        acc = acc + (1.0 / f32(params.filterDim)) * tile[r][i];
                    }
                    // 将模糊结果存储到输出纹理中。
                    textureStore(outputTex, writeIndex, vec4(acc, 1.0));
            }
        }
    }
}
