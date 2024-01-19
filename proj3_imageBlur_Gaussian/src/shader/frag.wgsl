// 首先将纹理的颜色从 RGB 转换到 YUV 空间，然后对亮度（Y 分量）应用高斯模糊，最后将模糊后的亮度值用于输出颜色的 RGB 分量。
// 这种方法特别适用于灰度图像或者只关注亮度变化的场景。

@group(0) @binding(0) var<uniform> rgb2yuv : mat3x3<f32>; // 注意缓冲区
@group(0) @binding(1) var<uniform> gaussian : array<vec3<f32>,3>; // 注意缓冲区
@group(0) @binding(2) var<uniform> kernel_offsets : array<vec4<f32>,9>;
@group(0) @binding(3) var mySampler : sampler;
@group(0) @binding(4) var myTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
    var val = 0.0;
    for (var i = 0u; i < 3; i++) {
      // 将采样得到的 RGB 颜色转换为 YUV 颜色空间，并提取出 Y 分量（亮度）
        let a = vec3f(
            (rgb2yuv * textureSample(myTexture, mySampler, input.fragUV + kernel_offsets[i * 3].xy).xyz).x,
            (rgb2yuv * textureSample(myTexture, mySampler, input.fragUV + kernel_offsets[i * 3 + 1].xy).xyz).x,
            (rgb2yuv * textureSample(myTexture, mySampler, input.fragUV + kernel_offsets[i * 3 + 2].xy).xyz).x
        );
        val += dot(a, gaussian[i]);
    }
    return vec4<f32>(val, val, val, 1.0);
}
