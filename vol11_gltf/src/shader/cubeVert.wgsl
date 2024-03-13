struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) fragUV: vec2<f32>,
    @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
    @location(0) position:vec4<f32>,
    @location(1) uv:vec2<f32>,
) -> VertexOutput {
    var output:VertexOutput;
    output.position = uniforms.modelViewProjectionMatrix * position;
    output.fragUV = uv;
    output.fragPosition = (position + vec4(1.0,1.0,1.0,1.0))* 0.5;
    return output;
}


// output.position:
// 这是顶点着色器的输出，它决定了当前顶点在屏幕上的位置。
// uniforms.modelViewProjectionMatrix * position 这个操作是将模型坐标转换为屏幕坐标。这里使用的 modelViewProjectionMatrix 是模型矩阵、视图矩阵和投影矩阵的组合。它将模型坐标转换为归一化设备坐标 (NDC)。
// NDC 范围是 [-1, 1]。这意味着，经过这个变换后，任何在视野之外的顶点将有一个超出这个范围的 x、y 或 z 值。
// 在顶点着色器执行后，图形管线将执行裁剪，删除那些超出 NDC 范围的部分，并将剩余的部分转换为屏幕坐标。

// fragPosition:
// 这是顶点着色器为每个顶点输出的一个值，之后将由光栅化器插值并传递给片元着色器。
// fragPosition 是模型空间中的坐标值，它被稍微调整了以使其范围在 [0, 1] 而不是 [-1, 1]。这样做可能是为了满足某种特定需求，例如将其用作纹理坐标或其他计算。
// 与 output.position 不同，fragPosition 不影响顶点在屏幕上的位置。它只是一个额外的数据，可以在后续的计算中使用。