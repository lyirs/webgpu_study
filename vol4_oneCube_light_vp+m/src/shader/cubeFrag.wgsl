struct FragUniforms {
    light_position : vec4<f32>,
    eye_position : vec4<f32>,
};
@binding(1) @group(0) var<uniform> frag_uniforms : FragUniforms;

struct LightUniforms {
    color : vec4<f32>,  
    specular_color : vec4<f32>,
    params: vec4<f32>, // ambient_intensity, diffuse_intensity, specular_intensity, specular_shininess
};
@binding(2) @group(0) var<uniform> light_uniforms : LightUniforms;

@fragment
fn main(@location(0) v_position: vec4<f32>, @location(1) v_normal: vec4<f32>) ->  @location(0) vec4<f32> {
    let N:vec3<f32> = normalize(v_normal.xyz); // 法线            
    let L:vec3<f32> = normalize(frag_uniforms.light_position.xyz - v_position.xyz);  // 光线方向
    let V:vec3<f32> = normalize(frag_uniforms.eye_position.xyz - v_position.xyz);   // 视线方向     
    let H:vec3<f32> = normalize(L + V);  // 半向量
    let diffuse:f32 = light_uniforms.params[1] * max(dot(N, L), 0.0);  // 漫反射光分量（取决于N和L的点积）
    let specular: f32 = light_uniforms.params[2] * pow(max(dot(N, H),0.0), light_uniforms.params[3]);  // 高光分量 （取决于N和H的点积以及高光光泽度）
    let ambient:f32 = light_uniforms.params[0];               
    // 该颜色是环境光、漫反射光和高光的组合，每种光的颜色由光源的颜色（对于环境光和漫反射光）和光源的高光颜色（对于高光）决定。每种光的强度由对应的光照强度参数决定。
    let final_color = light_uniforms.color*(ambient + diffuse) + light_uniforms.specular_color * specular; 
    return vec4<f32>(final_color.rgb, 1.0);
}