export const CreateTextureFromImage = async (
  device: GPUDevice,
  imageSrc: string
) => {
  let texture: GPUTexture;
  //   const response = await fetch(new URL(imageSrc, import.meta.url).toString());
  //   const imageBitmap = await createImageBitmap(await response.blob());
  const image = new Image();
  image.src = imageSrc;
  await image.decode();
  const imageBitmap = await createImageBitmap(image);
  texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]
  );
  return texture;
};
