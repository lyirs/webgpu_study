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
    var particle_f = particleBuffer.particles[index];
    var particle_b = particleBuffer.particles[index + 1];
    if(particle_f.lifetime == 0){
        particle_f.position = vec2<f32>(0,0);
        particle_f.velocity = vec2<f32>(0,0);
        particle_b.position = vec2<f32>(0,0);
        particle_b.velocity = vec2<f32>(0,0);
    }
    else if(index % 2 == 0){
        particle_f.position += particle_f.velocity;
        particle_b.position += particle_b.velocity;
        particle_b.velocity *= 1.002;
        var pos1 = particle_f.position;
        var posdistance = distance(particle_f.position, particle_b.position);
        if( posdistance < 0.05 && (abs(particle_b.velocity.x) >= abs(particle_f.velocity.x))){
            particle_f.lifetime = max(0.0, particle_f.lifetime - 0.005);
            particle_b.lifetime = max(0.0, particle_b.lifetime - 0.005);
            // particle_f.velocity *= 0.9;
            // particle_b.velocity *= 0.9;
            particle_b.velocity = vec2<f32>(0,0);
            particle_f.velocity = vec2<f32>(0,0);
            particle_b.position = mix(particle_b.position, particle_f.position, 0.05);

        }
        particle_f.lifetime = max(0.0, particle_f.lifetime - 0.002);
        particle_b.lifetime = max(0.0, particle_b.lifetime - 0.002);
        particleBuffer.particles[index] = particle_f;
        particleBuffer.particles[index + 1] = particle_b;
    }
    // particle.velocity *= 0.9;

}