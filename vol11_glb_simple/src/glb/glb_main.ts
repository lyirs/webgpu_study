import { GLTFAccessor } from "./glb_accessor";
import { GLTFMesh } from "./glb_mesh";
import { GLBModel } from "./glb_model";
import { GLTFNode, makeGLTFSingleLevel, readNodeTransform } from "./glb_node";
import { GLTFPrimitive } from "./glb_primitive";
import { GLTFRenderMode } from "./glb_tool";
import { GLTFBuffer, GLTFBufferView } from "./glb_viewbuffer";

export const uploadGLBModel = async (
  buffer: ArrayBuffer,
  device: GPUDevice
): Promise<GLBModel | undefined> => {
  // 读取头部信息
  const header = new Uint32Array(buffer, 0, 5);
  if (header[0] != 0x46546c67) {
    throw Error("这并不是一个有效的GLB文件");
  }
  if (header[1] != 2) {
    throw Error("Provided file is glTF 2.0 file");
  }
  if (header[4] != 0x4e4f534a) {
    throw Error(
      "Invalid glB: The first chunk of the glB file is not a JSON chunk!"
    );
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
      for (let attr in prim.attributes) {
        let accessor = glbJsonData.accessors[prim.attributes[attr]];
        let viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if (attr == "POSITION") {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        }
      }
      let gltfPrim = new GLTFPrimitive(indices!, positions!, topology);
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

  // 创建和上传场景节点
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for (let i = 0; i < gltfNodes.length; ++i) {
    let n = gltfNodes[i];
    if (n.mesh !== undefined) {
      let node = new GLTFNode(n.name!, meshes[n.mesh], readNodeTransform(n));
      nodes.push(node);
    }
  }
  // 返回GLB模型
  return new GLBModel(nodes);
};
