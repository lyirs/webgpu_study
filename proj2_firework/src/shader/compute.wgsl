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

@group(0) @binding(0) var<storage, read_write> particleBuffer: ParticleBuffer;


const size = u32(64);
@compute @workgroup_size(size)
fn main(
    @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
) {
    // 由于这是一个1维的线程分配（只有x轴），所以只需要使用GlobalInvocationID.x
    var index = GlobalInvocationID.x;
    var particle = particleBuffer.particles[index];
    particle.position += particle.velocity;
    particle.velocity *= 0.5;
    particle.lifetime = max(0.0, particle.lifetime - 0.005);
    if (particle.lifetime <= 0.02) {
        particle.position = vec2<f32>(0.0, 0.0); // 重置到初始位置
        particle.velocity = vec2<f32>(0.0, 0.0);
        particle.velocity *= 0.5;
    }
    particleBuffer.particles[index] = particle;
}