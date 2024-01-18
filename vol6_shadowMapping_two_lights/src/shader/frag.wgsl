@group(1) @binding(0) var<uniform> light : array<array<vec4<f32>, 2>, 2>;
@group(1) @binding(1) var shadowMap1: texture_depth_2d;  // 深度贴图类型
@group(1) @binding(2) var shadowMap2: texture_depth_2d;  // 深度贴图类型
@group(1) @binding(3) var shadowSampler: sampler_comparison;  // 对比采样类型

@fragment
fn main(
    @location(0) fragPosition: vec3<f32>,
    @location(1) fragNormal: vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) shadowPos1: vec3<f32>,
    @location(4) shadowPos2: vec3<f32>,
    @location(5) fragColor: vec4<f32>
) -> @location(0) vec4<f32> {
    let objectColor = fragColor.rgb;
    var totalLight: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    
    // 计算第一个光源的阴影
    var shadow1: f32 = calculateShadow(shadowMap1, shadowSampler, shadowPos1);
    // 计算第二个光源的阴影
    var shadow2: f32 = calculateShadow(shadowMap2, shadowSampler, shadowPos2);

    // 光源合成
    let diffuse1: f32 = max(dot(normalize(light[0][0].xyz), fragNormal), 0.0);  // 漫反射光
    // ambient + diffuse * shadow
    let lightFactor1 = min(0.3 + shadow1 * diffuse1, 1.0);
    totalLight = totalLight + lightFactor1 * light[0][1].rgb;
    let diffuse2: f32 = max(dot(normalize(light[1][0].xyz), fragNormal), 0.0);
    let lightFactor2 = min(0.3 + shadow2 * diffuse2, 1.0);
    totalLight = totalLight + lightFactor2 * light[1][1].rgb;

    return vec4<f32>(objectColor * totalLight, 1.0);
}

// 辅助函数：计算阴影
fn calculateShadow(shadowMap: texture_depth_2d, shadowSampler: sampler_comparison, shadowPos: vec3<f32>) -> f32 {
    var shadow: f32 = 0.0;
    let size = f32(textureDimensions(shadowMap).x);
    for (var y: i32 = -1 ; y <= 1 ; y = y + 1) {
        for (var x: i32 = -1 ; x <= 1 ; x = x + 1) {
            let offset = vec2<f32>(f32(x) / size, f32(y) / size);
            shadow = shadow + textureSampleCompare(
                shadowMap,
                shadowSampler,
                shadowPos.xy + offset,
                shadowPos.z - 0.005
            );
        }
    }
    return shadow / 9.0;
}