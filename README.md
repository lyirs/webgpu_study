<h1 align="center">WebGPU Study</h1>

<div align="center">

![Static Badge](https://img.shields.io/badge/chrome-113+-green)
![Static Badge](https://img.shields.io/badge/pnpm-8.2.0-8A2BE2)
![Static Badge](https://img.shields.io/badge/vite-4.3.2-blue)

![Static Badge](https://img.shields.io/badge/typescript-5.0.4-orange)
![Static Badge](https://img.shields.io/badge/wgpu--matrix-2.5.0-orange)
![Static Badge](https://img.shields.io/badge/dat.gui-0.7.9-orange)

</div>

<hr/>

<h3 align="center">

💡 **文件说明** 💡

</h3>

| 文件                              | 描述                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| drawio                            | 一些流程图之类的                                                    |
| vol0_triangle                     | 最基础的画三角形                                                    |
| vol1_oneCube                      | 一个旋转的正方体                                                    |
| vol1_oneCube_MSAA                 | 一个旋转的正方体带抗锯齿                                            |
| vol1_oneCube_MSAA_textureSampling | 一个旋转的正方体带抗锯齿与纹理采样                                  |
| vol2_twoCubes                     | 两个旋转的正方体                                                    |
| vol2_twoCubesMSAA                 | 两个旋转的正方体带抗锯齿                                            |
| vol3_sphere_wireFrame             | 一个旋转的线框球体                                                  |
| vol4_oneCube_light_mv+p           | 一个具有照明效果的旋转的正方体（模型视图矩阵+投影矩阵实现）         |
| vol4_oneCube_light_vp+m           | 一个具有照明效果的旋转的正方体（视图投影矩阵+模型矩阵实现）         |
| vol5_objects_light_mv+p           | 带有基础照明的多个物体                                              |
| vol5_objects_light_mv+p_layout    | 带有基础照明的多个物体（创建 pipeline 时指定 layout 而非使用 auto） |
| vol6_shadowMapping                | 利用阴影贴图实现实时阴影                                            |
| vol7_computeShader                | 利用计算着色器模拟数十万物体动态移动                                |
| threejs-car                       | three.js 的一个应用                                                 |

<h3 align="center">

<hr/>

💡 **一些网站** 💡

</h3>

- [WebGPU 最新版本](https://www.w3.org/TR/webgpu/)
- [WebGPU 中文翻译文档](https://www.orillusion.com/zh/webgpu.html)
- [WGSL 最新版本](https://www.w3.org/TR/WGSL/)
- [WGSL 中文翻译文档](https://www.orillusion.com/zh/wgsl.html)
- [WebGPU 说明](https://gpuweb.github.io/gpuweb/explainer/)
- [WebGPU 说明 中文翻译文档](https://www.orillusion.com/zh/explainer.html)
- [google 工程师维护的 WebGPU 示例](https://github.com/austinEng/webgpu-samples)
- [WebGPU API C++版本](https://dawn.googlesource.com/dawn)
- [官方演示](https://webgpu.github.io/webgpu-samples)

<div>
</div>

- [WebGPU 博客](https://alain.xyz/blog/raw-webgpu)

<hr/>

<h3 align="center">

<h3 align="center">

💡 **基本使用** 💡

</h3>

进入对应项目

```bash
├─ 📂 node_modules/ # 👶 Dependencies
│ ├─ 📁 gl-matrix # ➕ Linear Algebra
│ └─ 📁 ... # 🕚 Other Dependencies (TypeScript, etc.)
├─ 📂 src/ # 🌟 Source Files
│ ├─ 📄 index.html # 📇 Main HTML file
│ └─ 📄 main.ts # 🔺 Triangle Renderer
├─ 📄 .gitignore # 👁️ Ignore certain files in git repo
├─ 📄 package.json # 📦 Node Package File
└─ 📃 readme.md # 📖 Read Me!
```

### 依赖安装

`pnpm i`

### 运行

`pnpm dev`
