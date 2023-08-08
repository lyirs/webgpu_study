struct Particle {
    position : vec2<f32>,
    velocity : vec2<f32>,
    lifetime : f32,
    r: f32,
    g: f32,
    b: f32,
};

struct ParticleBuffer {
    particles : array<Particle>
};

@group(0) @binding(0) var<storage, read> particleBuffer: ParticleBuffer;

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
    output.Position = vec4<f32>(particle.position, 0.0, 1.0);
    output.Color = vec4<f32>(particle.r, particle.g, particle.b, particle.lifetime);
    return output;
}