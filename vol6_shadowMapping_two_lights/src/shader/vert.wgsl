@group(0) @binding(0) var<storage> model : array<mat4x4<f32>>;
@group(0) @binding(1) var<uniform> viewProjection : mat4x4<f32>;
@group(0) @binding(2) var<uniform> lightProjection : array<mat4x4<f32>,2>;
@group(0) @binding(3) var<storage> colors : array<vec4<f32>>;


// @builtin(instance_index): 这个标记提供了当前实例的索引。
// 在实例渲染（也称为instanced rendering或instancing）中，同一模型的多个实例可以一次性地渲染。
// 在这种情况下，instance_index将给出当前实例在所有实例中的位置或索引。
// 这在当你需要为每个实例提供独立的信息（如不同的变换矩阵或颜色）时非常有用。

// @builtin(vertex_index): 这个标记提供了当前顶点的索引。
// 在渲染管线中，顶点着色器对每个顶点单独执行一次。
// vertex_index将为你提供当前正在处理的顶点的索引，这在你需要获取与顶点相关的数据（如顶点的位置或颜色）时非常有用。


@vertex
fn shadow1(
    @builtin(instance_index) index: u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    let modelMatrix = model[index];
    let pos = vec4(position, 1.0);
    return lightProjection[0] * modelMatrix * pos;
    // 输出灯光视角下所有物体的投影空间坐标
}

@vertex
fn shadow2(
    @builtin(instance_index) index: u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    let modelMatrix = model[index];
    let pos = vec4(position, 1.0);
    return lightProjection[1] * modelMatrix * pos;
    // 输出灯光视角下所有物体的投影空间坐标
}

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) fragPosition: vec3<f32>,
    @location(1) fragNormal: vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) shadowPos1: vec3<f32>,
    @location(4) shadowPos2: vec3<f32>,
    @location(5) fragColor: vec4<f32>
};

// 正式渲染
@vertex
fn main(
    @builtin(instance_index) index: u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>
) -> VertexOutput {
    let modelMatrix = model[index];
    let pos = vec4<f32>(position, 1.0);
    let posFromCamera: vec4<f32> = viewProjection * modelMatrix * pos;
              
    var output: VertexOutput;
    output.Position = posFromCamera;   // 相机MVP变换后的投影坐标，给GPU输出绘制几何关系
    output.fragPosition = (modelMatrix * pos).xyz;  // 不包括投影变换的世界坐标，辅助计算光线入射方向的
    output.fragNormal = (modelMatrix * vec4<f32>(normal, 0.0)).xyz;
    output.fragUV = uv;
    output.fragColor = colors[index];

    let posFromLight: vec4<f32> = lightProjection[0] * modelMatrix * pos;  // 灯光MVP变换后的投影坐标，用来查找灯光贴图中的深度信息的
    // 转换shadowPos XY (-1, 1) 以适应 texture UV (0, 1)，方便后续贴图操作
    output.shadowPos1 = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);
    let posFromLight2: vec4<f32> = lightProjection[1] * modelMatrix * pos;
    output.shadowPos2 = vec3<f32>(posFromLight2.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight2.z);
    return output;
}
