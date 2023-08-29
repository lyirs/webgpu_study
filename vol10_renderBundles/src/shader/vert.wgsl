struct Uniforms {
  viewProjectionMatrix: mat4x4f
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;

struct VertexInput {
  @location(0) position: vec4f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.viewProjectionMatrix * modelMatrix * input.position;
    output.normal = normalize((modelMatrix * vec4(input.normal, 0)).xyz);
    output.uv = input.uv;
    return output;
}