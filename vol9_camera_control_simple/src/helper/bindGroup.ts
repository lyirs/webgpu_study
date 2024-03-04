type BindGroupBufferEntry = {
  binding: GPUIndex32;
  resource: GPUBuffer;
  offset?: GPUSize64;
  size?: GPUSize64;
};

type BindGroupEntrys = {
  binding: GPUIndex32;
  resource: GPUSampler | GPUTextureView | GPUBufferBinding | GPUExternalTexture;
};

type BindGroupEntry = BindGroupBufferEntry | BindGroupEntrys;

export const createBindGroup = (
  device: GPUDevice,
  pipeline: GPURenderPipeline | GPUComputePipeline,
  bindGroupLayoutIndex: number,
  entries: BindGroupEntry[]
): GPUBindGroup => {
  return device.createBindGroup({
    layout: pipeline.getBindGroupLayout(bindGroupLayoutIndex),
    entries: entries.map((entry) => {
      let bindResource: GPUBindingResource;

      if (entry.resource instanceof GPUBuffer) {
        bindResource = {
          buffer: entry.resource,
          offset: (entry as BindGroupBufferEntry).offset,
          size: (entry as BindGroupBufferEntry).size,
        };
      } else {
        bindResource = entry.resource;
      }

      return {
        binding: entry.binding,
        resource: bindResource,
      };
    }),
  });
};

export const createBindGroupWithLayout = (
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  entries: BindGroupEntry[]
): GPUBindGroup => {
  return device.createBindGroup({
    layout: layout,
    entries: entries.map((entry) => {
      let bindResource: GPUBindingResource;

      if (entry.resource instanceof GPUBuffer) {
        bindResource = {
          buffer: entry.resource,
          offset: (entry as BindGroupBufferEntry).offset,
          size: (entry as BindGroupBufferEntry).size,
        };
      } else {
        bindResource = entry.resource;
      }

      return {
        binding: entry.binding,
        resource: bindResource,
      };
    }),
  });
};

/*
const group = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0), 
    entries: [
      {
        binding: 0,
        resource: {
          buffer: buffer,
        },
      },
      {
        binding: 1,
        resource: textview
      },
      {
        binding: 2,
        resource: sampler
      },
    ],
  })
  */
