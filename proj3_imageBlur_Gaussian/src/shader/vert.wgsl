struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
}

@vertex
fn main(@location(0) pos: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.Position = vec4<f32>(pos, 0.0, 1.0);
    output.fragUV = pos * 0.5 + 0.5;
    return output;
}