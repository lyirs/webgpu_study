@group(1) @binding(0) var<uniform> lightPosition : vec4<f32>;
@group(1) @binding(1) var shadowMap: texture_depth_2d;  // 深度贴图类型
@group(1) @binding(2) var shadowSampler: sampler_comparison;  // 对比采样类型

@fragment
fn main(
    @location(0) fragPosition : vec3<f32>,
    @location(1) fragNormal: vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) shadowPos: vec3<f32>,
    @location(4) fragColor: vec4<f32>
) -> @location(0) vec4<f32> {
    let objectColor = fragColor.rgb;
    let diffuse: f32 = max(dot(normalize(lightPosition.xyz), fragNormal), 0.0);  // 漫反射光
    // add shadow factor
    var shadow : f32 = 0.0;
    // 添加均值滤波器 PCF （Percentage Closer Filtering 阴影抗锯齿技术）
    // 除了对比坐标本身深度之外，对周边偏移量很小的8个点均进行对比累加，结果除以9。
    // 阴影不再是0,1两种选择，而是[0-1]的区间
    // 在边缘位置平均阴影的亮度，从而得到相对柔和的阴影效果
    let size = f32(textureDimensions(shadowMap).x);   // 获取深度贴图(shadowMap)的尺寸,假设深度贴图是正方形的，所以只取x维度的尺寸就够了
    for (var y : i32 = -1 ; y <= 1 ; y = y + 1) {
        for (var x : i32 = -1 ; x <= 1 ; x = x + 1) {
            let offset = vec2<f32>(f32(x) / size, f32(y) / size);   // 对于每个点，首先计算出其相对于当前点的偏移量。偏移量被归一化到0-1之间，代表了在阴影贴图上的相对位置
            // `textureSampleCompare`函数会将给定的深度值（`shadowPos.z - 0.005`）与从深度贴图上采样得到的深度值进行比较，如果给定的深度值大于采样值（即片元位于光源视角看到的表面之后），则返回1，否则返回0。这个结果被加到`shadow`上
            shadow = shadow + textureSampleCompare(
                shadowMap,   // 阴影贴图
                shadowSampler,  // 比较采样器 用于读取深度贴图并进行深度比较
                shadowPos.xy + offset,  // 采样位置，即在深度贴图上的坐标
                shadowPos.z - 0.005 // 待比较的深度值。 稍微减小对比深度 防止阴影失真（shadow acne）
            );
        }
    }
    shadow = shadow / 9.0;
    // ambient + diffuse * shadow
    let lightFactor = min(0.3 + shadow * diffuse, 1.0);
    return vec4<f32>(objectColor * lightFactor, 1.0);
}