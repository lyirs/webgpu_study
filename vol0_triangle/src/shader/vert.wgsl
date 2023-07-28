@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
) -> @builtin(position) vec4<f32> { 
    // 设置三角形顶点坐标
    var pos = array<vec2<f32>, 3>(
        vec2(0.0, 0.5),
        vec2(-0.5, -0.5),
        vec2(0.5, -0.5),
    );
    // 返回顶点坐标
    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}