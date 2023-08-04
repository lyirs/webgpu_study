/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />
import "./style.css";
import { InitGPU } from "./helper/init";
import vertWGSL from "./shader/cubeVert.wgsl?raw";
import fragWGSL from "./shader/cubeFrag.wgsl?raw";
import { mat4, vec3 } from "wgpu-matrix";
import { CubeData } from "./helper/vertexData";
import { CreateGPUBuffer, CreateGPUBufferUint } from "./helper/gpuBuffer";
import { getModelMatrix, getViewProjectionMatrix } from "./helper/math";

interface LightInputs {
  color: any;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  shininess: number;
  specularColor: any;
}

const gpu = await InitGPU();
const device = gpu.device;
const canvas = gpu.canvas;
const format = gpu.format;
const context = gpu.context;
const cubeData = CubeData();

// （颜色，高光颜色，环境光强度，漫反射光强度，高光强度和高光光泽度）
const light: LightInputs = {
  color: [1.0, 0.0, 0.0],
  ambientIntensity: 0.2,
  diffuseIntensity: 0.8,
  specularIntensity: 0.4,
  shininess: 30.0,
  specularColor: [1.0, 1.0, 1.0],
};

const cubeVertexCount = cubeData.positions.length / 3; // 36

const vertexBuffer = CreateGPUBuffer(device, cubeData.positions);
const normalBuffer = CreateGPUBuffer(device, cubeData.normals);

const aspect = canvas.width / canvas.height; // 相机宽高比例
const fov = (60 / 180) * Math.PI;
const near = 0.1;
const far = 100.0;
const position = { x: 0, y: 0, z: 10 };

const normalMatrix = mat4.identity(); // 法向量
let vpMatrix = getViewProjectionMatrix(aspect, fov, near, far, position);

let rotation = vec3.fromValues(0, 5, 0);
let eyePosition = new Float32Array([position.x, position.y, position.z]);
let lightPosition = eyePosition;

var lightParams = [] as any;
lightParams.push([light.color[0], light.color[1], light.color[2], 1.0]);
lightParams.push([
  light.specularColor[0],
  light.specularColor[1],
  light.specularColor[2],
  1.0,
]);
lightParams.push([
  light.ambientIntensity,
  light.diffuseIntensity,
  light.specularIntensity,
  light.shininess,
]);

const vertexUniformBuffer = device.createBuffer({
  size: 192,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const fragmentUniformBuffer = device.createBuffer({
  size: 32,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const lightUniformBuffer = device.createBuffer({
  size: 48,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexUniformBuffer, 0, vpMatrix);
device.queue.writeBuffer(fragmentUniformBuffer, 0, lightPosition);
device.queue.writeBuffer(fragmentUniformBuffer, 16, eyePosition);
device.queue.writeBuffer(
  lightUniformBuffer,
  0,
  new Float32Array(lightParams.flat())
);

/**
 * 绑定组传递的 GPUBuffer 只有两种，UBO（即 "uniform" 类型的 GPUBuffer）和存储型 GPUBuffer，
 * 其中后者又分存储型（"storage"）和只读存储型（"read-only-storage"）两小种，通过 type 字段标识，默认值是 "uniform"，type 字段只能是 GPUBufferBindingType 枚举中的一个
 */
// 一个 GPUBindGroupLayout 定义了在 GPUBindGroup 中绑定的一组资源与它们在着色器阶段中的可访问性之间的接口。
const uniformBindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0, // 一个唯一的标识符，用于在 GPUBindGroupLayout 中的资源绑定，对应于 GPUBindGroupEntry.binding 和 GPUShaderModule 中的 @binding 属性。
      visibility: GPUShaderStage.VERTEX, // 只在顶点着色器阶段可见
      // buffer字段 表示此 GPUBindGroupLayoutEntry 的 绑定资源类型 是 GPUBufferBinding。
      buffer: {
        type: "uniform",
      },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT, // 只在片元着色器阶段可见
      buffer: {
        type: "uniform",
      },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: "uniform",
      },
    },
  ],
});

// GPUBindGroup 定义了一组要绑定在一起的资源，以及这些资源在着色器阶段的使用方式。
const uniformBindGroup = device.createBindGroup({
  layout: uniformBindGroupLayout, // 与此 GPUBindGroup 关联的 GPUBindGroupLayout
  entries: [
    {
      binding: 0, // GPUBindGroup 中资源绑定的唯一标识符，对应于 GPUBindGroupLayoutEntry.binding 和 GPUShaderModule 中的 @binding 属性。
      // 要绑定的资源，可以是 GPUSampler、GPUTextureView、GPUExternalTexture 或 GPUBufferBinding。
      resource: {
        buffer: vertexUniformBuffer,
        offset: 0,
        size: 192, // vp矩阵[4*4*4] + model矩阵[4*4*4] + normal矩阵[4*4*4] 共计64+64+64=192
      },
    },
    {
      binding: 1,
      resource: {
        buffer: fragmentUniformBuffer,
        offset: 0,
        size: 32, // light position[4*4] + eye position[4*4]
      },
    },
    {
      binding: 2,
      resource: {
        buffer: lightUniformBuffer,
        offset: 0,
        size: 48, // 光照矩阵[4*3*4] => {color[4*1] specular_color[4*1] params[4*1]}
      },
    },
  ],
});

// 创建渲染管线
/**       GPUBindGroup <--- 1 ---┓
 *                     GPUBindGroupLayout
 *   GPUPipelineLayout <--- N ---┛
 */
const pipeline = device.createRenderPipeline({
  // 布局
  layout: device.createPipelineLayout({
    bindGroupLayouts: [uniformBindGroupLayout],
  }),
  // 顶点着色器
  vertex: {
    module: device.createShaderModule({
      code: vertWGSL,
    }),
    entryPoint: "main",
    buffers: [
      // 缓冲区集合，其中一个元素对应一个缓冲对象
      {
        arrayStride: 12, // 顶点长度 以字节为单位 3*4  position
        attributes: [
          {
            shaderLocation: 0, // 遍历索引，这里的索引值就对应的是着色器语言中 @location(0) 的数字
            offset: 0,
            format: "float32x3",
          },
        ],
      },
      {
        arrayStride: 12, // normal
        attributes: [
          {
            shaderLocation: 1,
            offset: 0,
            format: "float32x3",
          },
        ],
      },
    ],
  },
  // 片元着色器
  fragment: {
    module: device.createShaderModule({
      code: fragWGSL,
    }),
    entryPoint: "main",
    // 输出颜色
    targets: [
      {
        format: format,
      },
    ],
  },
  // 图元类型
  primitive: {
    topology: "triangle-list",
  },
  // 深度
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
  },
});

const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// 渲染
const render = () => {
  rotation[0] += 0.01;
  rotation[1] += 0.01;
  rotation[2] += 0.01;
  const modelMatrix = getModelMatrix(
    { x: 0, y: 0, z: 0 },
    { x: rotation[0], y: rotation[1], z: rotation[2] }
  );
  mat4.invert(modelMatrix, normalMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  device.queue.writeBuffer(vertexUniformBuffer, 64, modelMatrix as ArrayBuffer);
  device.queue.writeBuffer(
    vertexUniformBuffer,
    128,
    normalMatrix as ArrayBuffer
  );
  // 开始命令编码
  const commandEncoder = device.createCommandEncoder();

  // 开启渲染通道
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, //background color
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  // 设置渲染管线
  renderPass.setPipeline(pipeline);
  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setVertexBuffer(1, normalBuffer);
  // 绘制
  renderPass.setBindGroup(0, uniformBindGroup);
  renderPass.draw(cubeVertexCount);
  // 结束渲染通道
  renderPass.end();
  // 提交命令
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
};

render();
