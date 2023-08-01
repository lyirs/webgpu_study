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
    let N:vec3<f32> = normalize(v_normal.xyz);                
    let L:vec3<f32> = normalize(frag_uniforms.light_position.xyz - v_position.xyz); // Both in view space  
    let V:vec3<f32> = -v_position.xyz; // Eye position is at origin in view space
    let H:vec3<f32> = normalize(L + V);
    let diffuse:f32 = light_uniforms.params[1] * max(dot(N, L), 0.0);
    let specular: f32 = light_uniforms.params[2] * pow(max(dot(N, H),0.0), light_uniforms.params[3]);
    let ambient:f32 = light_uniforms.params[0];               
    let final_color = light_uniforms.color*(ambient + diffuse) + light_uniforms.specular_color * specular; 
    return vec4<f32>(final_color.rgb, 1.0);
}