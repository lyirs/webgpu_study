struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms: Uniforms;

@vertex

fn main(
    @location(0) position: vec4<f32>,
) -> @builtin(position) vec4<f32> {
    return uniforms.modelViewProjectionMatrix * position;
}