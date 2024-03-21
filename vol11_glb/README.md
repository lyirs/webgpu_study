## materials

在没有任何扩展的情况下，glTf 仅支持一种材质，即 pbrMetallicRoughness 材质模型，这是一种物理渲染模型，通过表面金属度和粗糙度进行描述，还可以定义表面基本颜色和反射率，以及法线贴图，遮挡贴图，以及其他一些属性控制几何形状和混合状态。完整的属性：

```
"materials": [{
 "pbrMetallicRoughness": {
    "baseColorTexture": { "index": 1 },
    "baseColorFactor": [ 1.0, 0.75, 0.35, 1.0 ],
    "metallicRoughnessTexture": { "index": 5 },
    "metallicFactor": 1.0,
    "roughnessFactor": 0.0
  },
  "normalTexture": { "index": 2 },
  "occlusionTexture": {
    "index": 4,
    "strength": 0.9
  },
  "emissiveTexture": { "index": 3 },
  "emissiveFactor": [0.4, 0.8, 0.6],
  "alphaMode": "OPAQUE",
  "doubleSided": true,
}]
```
