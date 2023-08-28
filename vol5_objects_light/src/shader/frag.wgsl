@group(1) @binding(0) var<uniform> ambientIntensity : f32;
@group(1) @binding(1) var<uniform> pointLight : array<vec4<f32>, 2>;
@group(1) @binding(2) var<uniform> directionLight : array<vec4<f32>, 2>;

@fragment
fn main(
    @location(0) fragPosition: vec3<f32>,
    @location(1) fragNormal: vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) fragColor: vec4<f32>
) -> @location(0) vec4<f32> {
    let objectColor = fragColor.rgb;
    let ambintLightColor = vec3(1.0, 1.0, 1.0);  // 环境光
    let pointLightColor = vec3(1.0, 1.0, 1.0);  // 点光源
    let dirLightColor = vec3(1.0, 1.0, 1.0);  // 直射光

    var lightResult = vec3(0.0, 0.0, 0.0);
    // ambient
    // 环境光强度乘以环境光颜色得到其对结果颜色的影响
    lightResult += ambintLightColor * ambientIntensity;  
    // Directional Light
    // 计算其影响时，需要计算光源方向和法线的点积。结果乘以定向光强度和颜色就得到了定向光的影响
    var directionPosition = directionLight[0].xyz;
    var directionIntensity: f32 = directionLight[1][0];
    // diffuse变量代表了漫反射的强度，即光线照射到表面后散射开的光的强度。
    // 在这个计算中，使用了 Lambert 光照模型，其基本思想是光线与表面的入射角越小（也就是说，光线越垂直于表面），表面反射的光就越强。
    // dot(normalize(directionPosition), fragNormal)这部分计算了定向光源的方向（经过归一化处理）与片元的法线向量的点积，这个点积的结果将决定光线入射角度的余弦值。
    // 当这两个向量越接近，即它们的夹角越小，那么点积的结果就越接近1，说明光线更加垂直于物体表面，漫反射效果就越强。
    // 通过max(dot(normalize(directionPosition), fragNormal), 0.0)保证了当点积结果小于0（也就是光源方向和法线方向的夹角大于90度）时，漫反射强度为0
    // 也就是说，当光源在物体的后方时，不会产生漫反射效果。
    // 得到的diffuse值在0到1之间，表示了定向光对于这个片元的漫反射强度
    var diffuse: f32 = max(dot(normalize(directionPosition), fragNormal), 0.0);
    lightResult += dirLightColor * directionIntensity * diffuse;
    // Point Light
    // 计算其影响时，除了需要考虑光源方向和法线的点积，还需要考虑光源与像素之间的距离
    // 当像素距离光源的距离小于光源的半径时，就会受到光源的影响。
    var pointPosition = pointLight[0].xyz;
    var pointIntensity: f32 = pointLight[1][0];
    var pointRadius: f32 = pointLight[1][1];
    var L = pointPosition - fragPosition;
    var distance = length(L);
    if distance < pointRadius {
        // 点光源对于片元的漫反射强度
        var diffuse: f32 = max(dot(normalize(L), fragNormal), 0.0);
        // 距离因子distanceFactor，用于表达随着距离的增加，光源对物体的照明强度的衰减
        // 这里使用了一个简单的二次衰减模型，具体来说，随着片元到光源的距离（distance）占光源有效半径（pointRadius）的比例增加，衰减的强度增大（1.0 - distance / pointRadius的值会减小）
        // 然后取这个比例的平方，使得衰减在接近光源边缘时更加明显。
        var distanceFactor: f32 = pow(1.0 - distance / pointRadius, 2.0);
        lightResult += pointLightColor * pointIntensity * diffuse * distanceFactor;
    }

    return vec4<f32>(objectColor * lightResult, 1.0);
}