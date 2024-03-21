import { GLTFAccessor } from "./glb_accessor";
import { GLTFMaterial } from "./glb_material";
import { GLTFMesh } from "./glb_mesh";
import { GLBModel } from "./glb_model";
import { GLTFNode, makeGLTFSingleLevel, readNodeTransform } from "./glb_node";
import { GLTFPrimitive } from "./glb_primitive";
import { GLTFSampler } from "./glb_sampler";
import { GLTFTexture } from "./glb_texture";
import { GLTFRenderMode } from "./glb_tool";
import { GLTFBuffer, GLTFBufferView } from "./glb_viewbuffer";

export const uploadGLBModel = async (
  buffer: ArrayBuffer,
  device: GPUDevice
): Promise<GLBModel | undefined> => {
  // 读取头部信息
  const header = new Uint32Array(buffer, 0, 5);
  if (header[0] != 0x46546c67) {
    alert("这并不是一个有效的GLB文件");
    return;
  }
  // 解析json块
  const glbJsonData = JSON.parse(
    new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, header[3]))
  ) as IGLTFJsonData;
  // 解析二进制数据
  const binaryHeader = new Uint32Array(buffer, 20 + header[3], 2);
  const glbBuffer = new GLTFBuffer(buffer, binaryHeader[0], 28 + header[3]);

  // 创建BufferViews
  const bufferViews: GLTFBufferView[] = [];
  for (let i = 0; i < glbJsonData.bufferViews.length; ++i) {
    bufferViews.push(new GLTFBufferView(glbBuffer, glbJsonData.bufferViews[i]));
  }
  // 处理和创建纹理对象
  const images = [];
  if (glbJsonData.images !== undefined) {
    for (let i = 0; i < glbJsonData.images.length; ++i) {
      let imgJson = glbJsonData.images[i];
      let imgView = new GLTFBufferView(
        glbBuffer,
        glbJsonData.bufferViews[imgJson.bufferView!]
      );
      let imgBlob = new Blob([imgView.buffer], { type: imgJson.mimeType });
      let img = await createImageBitmap(imgBlob);

      let gpuImg = device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm-srgb",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      let src = { source: img };
      let dst = { texture: gpuImg };
      device.queue.copyExternalImageToTexture(src, dst, [
        img.width,
        img.height,
        1,
      ]);
      images.push(gpuImg);
    }
  }
  // 创建采样器
  const defaultSampler = new GLTFSampler({}, device);
  const samplers: GLTFSampler[] = [];
  if (glbJsonData.samplers !== undefined) {
    for (let i = 0; i < glbJsonData.samplers.length; ++i) {
      samplers.push(new GLTFSampler(glbJsonData.samplers[i], device));
    }
  }
  // 创建纹理
  const textures: GLTFTexture[] = [];
  if (glbJsonData.textures !== undefined) {
    for (let i = 0; i < glbJsonData.textures.length; ++i) {
      let tex = glbJsonData.textures[i];
      let sampler =
        tex.sampler !== undefined ? samplers[tex.sampler] : defaultSampler;
      textures.push(new GLTFTexture(sampler, images[tex.source]));
    }
  }
  // 创建材质
  const defaultMaterial = new GLTFMaterial({}, textures);
  const materials: GLTFMaterial[] = [];
  for (let i = 0; i < glbJsonData.materials.length; ++i) {
    materials.push(new GLTFMaterial(glbJsonData.materials[i], textures));
  }
  // 创建网格和单元
  const meshes = [];
  for (let i = 0; i < glbJsonData.meshes.length; ++i) {
    let mesh = glbJsonData.meshes[i];
    let primitives: GLTFPrimitive[] = [];
    for (let j = 0; j < mesh.primitives.length; ++j) {
      let prim = mesh.primitives[j];
      let topology = prim.mode;
      if (topology == undefined) {
        topology = GLTFRenderMode.TRIANGLES;
      }
      if (
        topology != GLTFRenderMode.TRIANGLES &&
        topology != GLTFRenderMode.TRIANGLE_STRIP
      ) {
        alert("不支持的渲染模式：" + prim.mode);
        continue;
      }

      let indices: GLTFAccessor | null = null;
      if (glbJsonData.accessors[prim.indices] !== undefined) {
        let accessor = glbJsonData.accessors[prim.indices];
        let viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.INDEX);
        indices = new GLTFAccessor(bufferViews[viewID], accessor);
      }

      let positions: GLTFAccessor | null = null;
      let normals: GLTFAccessor | null = null;
      let texcoords: GLTFAccessor[] = [];
      for (let attr in prim.attributes) {
        let accessor = glbJsonData.accessors[prim.attributes[attr]];
        let viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if (attr == "POSITION") {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr == "NORMAL") {
          normals = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr.startsWith("TEXCOORD")) {
          texcoords.push(new GLTFAccessor(bufferViews[viewID], accessor));
        }
      }

      let material: GLTFMaterial | null = null;
      if (prim.material !== undefined) {
        material = materials[prim.material];
      } else {
        material = defaultMaterial;
      }
      let gltfPrim = new GLTFPrimitive(
        indices!,
        positions!,
        normals!,
        texcoords,
        material,
        topology
      );
      primitives.push(gltfPrim);
    }
    meshes.push(new GLTFMesh(mesh.name, primitives));
  }
  // 上传BufferView到GPU
  for (let i = 0; i < bufferViews.length; ++i) {
    if (bufferViews[i].needsUpload) {
      bufferViews[i].upload(device);
    }
  }
  // 上传材质到GPU
  defaultMaterial.upload(device);
  for (let i = 0; i < materials.length; ++i) {
    materials[i].upload(device);
  }
  // 创建和上传场景节点
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for (let i = 0; i < gltfNodes.length; ++i) {
    let n = gltfNodes[i];
    if (n.mesh !== undefined) {
      let node = new GLTFNode(n.name!, meshes[n.mesh], readNodeTransform(n));
      node.upload(device);
      nodes.push(node);
    }
  }
  // 返回GLB模型
  return new GLBModel(nodes);
};
