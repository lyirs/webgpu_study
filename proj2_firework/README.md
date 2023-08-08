<h3 align="center">

💡 **对齐与尺寸** 💡

</h3>

结构体 Particle 定义为：

```
struct Particle {
    position : vec2<f32>,
    velocity : vec2<f32>,
    lifetime : f32,
    r: f32,
    g: f32,
    b: f32,
};
```

但如果写成这样：

```
struct Particle {
    position : vec2<f32>,
    velocity : vec2<f32>,
    lifetime : f32,
    color : vec3<f32>
};
```

则会报错：

```
Binding size (32) is smaller than the minimum binding size (48).
 - While validating entries[0] as a Buffer
 - While validating [BindGroupDescriptor] against [BindGroupLayout]
 - While calling [Device].CreateBindGroup([BindGroupDescriptor]).
```

根据 wgsl 对齐与尺寸标准 https://www.w3.org/TR/WGSL/#alignment

基于最大的对齐要求（align），结构体的大小必须是 最大 align 字节的倍数

对齐字节与尺寸如下表：
| Host-shareable type T | AlignOf(T) | SizeOf(T) |
|-----------------------|------------|-----------|
| i32, u32, or f32 | 4 | 4 |
| f16 | 2 | 2 |
| atomic | 4 | 4 |
| vec2<T>, T is i32, u32, or f32 | 8 | 8 |
| vec2<f16> | 4 | 4 |
| vec3<T>, T is i32, u32, or f32 | 16 | 12 |
| vec3<f16> | 8 | 6 |
| vec4<T>, T is i32, u32, or f32 | 16 | 16 |
| vec4<f16> | 8 | 8 |
| matCxR (col-major) (General form) | | |
| AlignOf(vecR) | | |
| mat2x2<f32> | 8 | 16 |
| mat2x2<f16> | 4 | 8 |
| mat3x2<f32> | 8 | 24 |
| mat3x2<f16> | 4 | 12 |
| mat4x2<f32> | 8 | 32 |
| mat4x2<f16> | 4 | 16 |
| mat2x3<f32> | 16 | 32 |
| mat2x3<f16> | 8 | 16 |
| mat3x3<f32> | 16 | 48 |
| mat3x3<f16> | 8 | 24 |
| mat4x3<f32> | 16 | 64 |
| mat4x3<f16> | 8 | 32 |
| mat2x4<f32> | 16 | 32 |
| mat2x4<f16> | 8 | 16 |
| mat3x4<f32> | 16 | 48 |
| mat3x4<f16> | 8 | 24 |
| mat4x4<f32> | 16 | 64 |
| mat4x4<f16> | 8 | 32 |
| struct S with members M1...MN | | |
| max(AlignOfMember(S,1), ... , AlignOfMember(S,N)) | | |
| roundUp(AlignOf(S), justPastLastMember) | | |
| array<E, N> | AlignOf(E) × N × roundUp(AlignOf(E), SizeOf(E)) | |
| array<E> | AlignOf(E) × NRuntime × roundUp(AlignOf(E), SizeOf(E)) | |

(Note: The "matCxR (col-major) (General form)" section is incomplete and does not include specific data.)

按照计算公式

<span style="background-color: lightgray;">OffsetOfMember(S, i) = roundUp(AlignOfMember(S, i ), OffsetOfMember(S, i-1) + SizeOfMember(S, i-1))</span>

```
struct Particle {
    position : vec2<f32>,
    velocity : vec2<f32>,
    lifetime : f32,
    color : vec3<f32>
};
```

实际上会被翻译为：

```
struct Particle {                               //              align(16)   size(48)   最大align为16，总大小为48
    position : vec2<f32>,                       // offset(0)    align(8)    size(8)
    // -- implicit member alignment padding --  // offset(8)                size(8)    下一个offset算出来为16，第一个大小只有8，所以加上size(8)对齐
    velocity : vec2<f32>,                       // offset(16)   align(8)    size(8)    OffsetOfMember = roundUp(8,16) = ⌈8 ÷ 16⌉ × 16 = 16
    lifetime : f32,                             // offset(24)   align(4)    size(4)    OffsetOfMember = roundUp(4,24) = 24
    color : vec3<f32>                           // offset(28)   align(16)   size(12)   OffsetOfMember = roundUp(16,28) = 28
    // -- implicit struct size padding --       // offset(40)               size(8)    必须是align(16)的倍数，即48。所以加上size(8)对齐
};
```
