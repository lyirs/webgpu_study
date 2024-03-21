import { GLTFAccessor } from "./glb_accessor";
import { GLTFTexture } from "./glb_texture";

export class GLBShaderCache {
  device: GPUDevice;
  shaderCache: any;
  constructor(device: GPUDevice) {
    this.device = device;
    this.shaderCache = {};
  }

  getShader(
    hasNormals: GLTFAccessor,
    hasUVs: boolean,
    hasColorTexture: GLTFTexture
  ): GPUShaderModule {
    let shaderID = "glb";
    if (hasNormals) {
      shaderID += "n";
    }
    if (hasUVs) {
      shaderID += "uv";
    }
    if (hasColorTexture) {
      shaderID += "colortex";
    }
    if (!(shaderID in this.shaderCache)) {
      let shaderSource = generateGLTFShader(
        hasNormals,
        hasUVs,
        hasColorTexture
      );
      this.shaderCache[shaderID] = this.device.createShaderModule({
        code: shaderSource,
      });
    }
    return this.shaderCache[shaderID];
  }
}

const generateGLTFShader = (
  hasNormals: GLTFAccessor,
  hasUVs: boolean,
  hasColorTexture: GLTFTexture
): string => {
  let vertexInputStruct = `
struct VertexInput {
    @location(0) position: vec3<f32>,
`;

  let vertexOutputStruct = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
`;

  if (hasNormals) {
    vertexInputStruct += `
    @location(1) normal: vec3<f32>,
    `;
    vertexOutputStruct += `
    @location(1) normal: vec3<f32>,
    `;
  }
  if (hasUVs) {
    vertexInputStruct += `
    @location(2) uv: vec2<f32>,
    `;
    vertexOutputStruct += `
    @location(2) uv: vec2<f32>,
    `;
  }
  vertexInputStruct += "};";
  vertexOutputStruct += "};";

  let vertexUniformParams = `
struct Mat4Uniform {
    m: mat4x4<f32>,
};

@group(0) @binding(0)
var<uniform> view_proj: Mat4Uniform;
@group(1) @binding(0)
var<uniform> node_transform: Mat4Uniform;
`;

  let vertexStage =
    vertexInputStruct +
    vertexOutputStruct +
    vertexUniformParams +
    `
@vertex
fn vertex_main(vin: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = view_proj.m * node_transform.m * vec4<f32>(vin.position, 1.0);
`;
  if (hasNormals) {
    vertexStage += `
    out.normal = vin.normal;
    `;
  }
  if (hasUVs) {
    vertexStage += `
    out.uv = vin.uv;
    `;
  }
  vertexStage += `
    return out;
}`;

  let fragmentParams = `
struct MaterialParams {
    base_color_factor: vec4<f32>,  // 基色
    emissive_factor: vec4<f32>,  // 自发光 
    metallic_factor: f32,  // 金属度
    roughness_factor: f32,  // 粗糙度
};

@group(2) @binding(0)
var<uniform> material: MaterialParams;
`;

  if (hasColorTexture) {
    fragmentParams += `
    @group(2) @binding(1)
    var base_color_sampler: sampler;
    @group(2) @binding(2)
    var base_color_texture: texture_2d<f32>;
    `;
  }

  let fragmentStage =
    fragmentParams +
    `
fn linear_to_srgb(x: f32) -> f32 {
    if (x <= 0.0031308) {
        return 12.92 * x;
    }
    return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

@fragment
fn fragment_main(fin: VertexOutput) -> @location(0) vec4<f32> {
    var color = vec4<f32>(material.base_color_factor.xyz, 1.0);
`;

  // 应用基础颜色并根据需要与纹理颜色混合
  if (hasUVs && hasColorTexture) {
    fragmentStage += `
    var texture_color = textureSample(base_color_texture, base_color_sampler, fin.uv);
    if (texture_color.a < 0.001) {
        discard;
    }
    color = vec4<f32>(material.base_color_factor.xyz * texture_color.xyz, 1.0);
    `;
  }

  // 将颜色从线性空间转换到sRGB空间
  fragmentStage += `
    color.x = linear_to_srgb(color.x);
    color.y = linear_to_srgb(color.y);
    color.z = linear_to_srgb(color.z);
    color.w = 1.0;
    return color;
}
`;

  return vertexStage + fragmentStage;
};
