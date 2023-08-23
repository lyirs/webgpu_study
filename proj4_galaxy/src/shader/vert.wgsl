struct Particle {
    position : vec3<f32>,
    r: f32,
    g: f32,
    b: f32,
    pad : vec2<f32>
};

struct ParticleBuffer {
    particles : array<Particle>
};

struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}

@group(0) @binding(0) var<storage, read> particleBuffer: ParticleBuffer;
@group(1) @binding(0) var<uniform> uniforms : Uniforms;


struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>,
};

@vertex
fn main(
    @builtin(vertex_index) index : u32,
) -> VertexOutput {
    var output : VertexOutput;
    var particle = particleBuffer.particles[index];
    output.Position = uniforms.modelViewProjectionMatrix * vec4<f32>(particle.position, 1.0);
    output.Color = vec4<f32>(particle.r, particle.g, particle.b, 1.0);
    return output;
}