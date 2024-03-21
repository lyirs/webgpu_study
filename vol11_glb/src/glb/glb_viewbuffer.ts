import { alignTo } from "./glb_tool";

// GLTFBuffer和GLTFBufferView类 管理GLB文件中的原始数据和视图，以及将数据上传到GPU
export class GLTFBuffer {
    arrayBuffer: ArrayBuffer;
    size: number;
    byteOffset: number;
    constructor(buffer: ArrayBuffer, size: number, offset: number) {
      this.arrayBuffer = buffer;
      this.size = size;
      this.byteOffset = offset;
    }
  }
  
  export class GLTFBufferView {
    length: number;
    byteOffset: number;
    byteStride: number;
    buffer: Uint8Array;
    needsUpload: boolean;
    gpuBuffer: GPUBuffer | null; // 存储在GPU中的缓冲区的引用。初始时为null，表示尚未创建或上传。
    usage: number;
    constructor(buffer: GLTFBuffer, view: IGLTFBufferView) {
      this.length = view.byteLength;
      this.byteOffset = buffer.byteOffset;
      if (view.byteOffset !== undefined) {
        this.byteOffset += view.byteOffset;
      }
      this.byteStride = 0;
      if (view.byteStride !== undefined) {
        this.byteStride = view.byteStride;
      }
      this.buffer = new Uint8Array(
        buffer.arrayBuffer,
        this.byteOffset,
        this.length
      );
      this.needsUpload = false;
      this.gpuBuffer = null;
      this.usage = 0;
    }
  
    // 允许设置bufferView的用途（如顶点数据、索引数据等），通过按位或操作累加不同的usage标志
    addUsage(usage: number) {
      this.usage = this.usage | usage;
    }
  
    // 将bufferView的数据上传到GPU
    upload(device: GPUDevice) {
      const buf = device.createBuffer({
        size: alignTo(this.buffer.byteLength, 4), // 确保分配的缓冲区大小是4的倍数，满足WebGPU的要求。
        usage: this.usage,
        mappedAtCreation: true,
      });
      new Uint8Array(buf.getMappedRange()).set(this.buffer);
      buf.unmap();
      this.gpuBuffer = buf;
      this.needsUpload = false;
    }
  }
  