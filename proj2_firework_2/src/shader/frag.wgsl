@fragment
fn main(
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>,
) -> @location(0) vec4<f32> {
    return Color;
}