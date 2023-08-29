@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var meshTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
}

// Static directional lighting
const lightDir = vec3f(1, 1, 1);
const dirColor = vec3(1);
const ambientColor = vec3f(0.05);

@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    let textureColor = textureSample(meshTexture, meshSampler, input.uv);
  // Very simplified lighting algorithm.
    let lightColor = saturate(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor);
    return vec4f(textureColor.rgb * lightColor, textureColor.a);
}