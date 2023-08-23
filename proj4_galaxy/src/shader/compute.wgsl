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

@group(0) @binding(0) var<storage, read_write> particleBuffer: ParticleBuffer;


const size = u32(64);
@compute @workgroup_size(size)
fn main(
    @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
) {
    // 由于这是一个1维的线程分配（只有x轴），所以只需要使用GlobalInvocationID.x
    var index = GlobalInvocationID.x;
    var particle = particleBuffer.particles[index];
    particleBuffer.particles[index] = particle;
}