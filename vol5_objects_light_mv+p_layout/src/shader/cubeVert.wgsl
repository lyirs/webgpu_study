@group(0) @binding(0) var<storage,read> modelViews : array<mat4x4<f32>>;
@group(0) @binding(1) var<uniform> projection : mat4x4<f32>;
@group(0) @binding(2) var<storage,read> colors : array<vec4<f32>>;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) fragPosition : vec3<f32>,
    @location(1) fragNormal : vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) fragColor: vec4<f32>
};

@vertex
fn main(
    @builtin(instance_index) index : u32,
    @location(0) position : vec3<f32>,
    @location(1) normal : vec3<f32>,
    @location(2) uv : vec2<f32>,
) -> VertexOutput {
    let modelview = modelViews[index];
    let mvp = projection * modelview;
    let pos = vec4<f32>(position, 1.0);
    
    var output : VertexOutput;
    output.Position = mvp * pos;
    output.fragPosition = (modelview * pos).xyz;
    // 如果你考虑到非均匀缩放，那么在变换法线时，你应该使用模型视图矩阵的逆矩阵的转置，而不是模型视图矩阵本身
    // 但在WGSL中，并没有提供直接计算矩阵逆的函数，因此注释建议在JavaScript或计算着色器（Compute Shader）中进行此操作。
    // 这里为了简化 直接使用模型视图矩阵
    output.fragNormal =  (modelview * vec4<f32>(normal, 0.0)).xyz;
    output.fragUV = uv;
    output.fragColor = colors[index];
    return output;
}