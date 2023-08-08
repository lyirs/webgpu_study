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
| vec2&lt;T&gt;, T is i32, u32, or f32 | 8 | 8 |
| vec2&lt;f16&gt; | 4 | 4 |
| vec3&lt;T&gt;, T is i32, u32, or f32 | 16 | 12 |
| vec3&lt;f16&gt; | 8 | 6 |
| vec4&lt;T&gt;, T is i32, u32, or f32 | 16 | 16 |
| vec4&lt;f16&gt; | 8 | 8 |
| matCxR (col-major) (General form) | AlignOf(vecR) | SizeOf(array&lt;vecR, C&gt;)|
| mat2x2&lt;f32&gt; | 8 | 16 |
| mat2x2&lt;f16&gt; | 4 | 8 |
| mat3x2&lt;f32&gt; | 8 | 24 |
| mat3x2&lt;f16&gt; | 4 | 12 |
| mat4x2&lt;f32&gt; | 8 | 32 |
| mat4x2&lt;f16&gt; | 4 | 16 |
| mat2x3&lt;f32&gt; | 16 | 32 |
| mat2x3&lt;f16&gt; | 8 | 16 |
| mat3x3&lt;f32&gt; | 16 | 48 |
| mat3x3&lt;f16&gt; | 8 | 24 |
| mat4x3&lt;f32&gt; | 16 | 64 |
| mat4x3&lt;f16&gt; | 8 | 32 |
| mat2x4&lt;f32&gt; | 16 | 32 |
| mat2x4&lt;f16&gt; | 8 | 16 |
| mat3x4&lt;f32&gt; | 16 | 48 |
| mat3x4&lt;f16&gt; | 8 | 24 |
| mat4x4&lt;f32&gt; | 16 | 64 |
| mat4x4&lt;f16&gt; | 8 | 32 |
| struct S with members M<sub>1</sub>...M<sub>N</sub> | max(AlignOfMember(S,1), ... , AlignOfMember(S,N)) | roundUp(AlignOf(S), justPastLastMember) <br><br>where justPastLastMember = OffsetOfMember(S,N) + SizeOfMember(S,N)|
| array&lt;E, N&gt; | AlignOf(E) | N × roundUp(AlignOf(E), SizeOf(E)) |
| array&lt;E&gt; | AlignOf(E) | NRuntime × roundUp(AlignOf(E), SizeOf(E))<br><br> where NRuntime is the runtime-determined number of elements of T |

按照计算公式

<b><span style="background-color: gray; color:blue">OffsetOfMember(S, i) = roundUp(AlignOfMember(S, i), OffsetOfMember(S, i-1) + SizeOfMember(S, i-1))</span></b>

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
    velocity : vec2<f32>,                       // offset(8)    align(8)    size(8)    OffsetOfMember = roundUp(8,8) = ⌈8 ÷ 8⌉ × 8 = 8
    lifetime : f32,                             // offset(16)   align(4)    size(4)    OffsetOfMember = roundUp(4,16) = 16
    // -- implicit member alignment padding --  // offset(20)               size(12)
    color : vec3<f32>                           // offset(32)   align(16)   size(12)   OffsetOfMember = roundUp(16,20) = 20，但20不是16的倍数，加上size(12)对齐
    // -- implicit struct size padding --       // offset(44)               size(4)    必须是align(16)的倍数，即48。所以加上size(4)对齐
};
```

下面是 w3c 中的例子：

```
struct A {                                     //             align(8)  size(24)
    u: f32,                                    // offset(0)   align(4)  size(4)
    v: f32,                                    // offset(4)   align(4)  size(4)
    w: vec2<f32>,                              // offset(8)   align(8)  size(8)
    x: f32                                     // offset(16)  align(4)  size(4)
    // -- implicit struct size padding --      // offset(20)            size(4)
}

struct B {                                     //             align(16) size(160)
    a: vec2<f32>,                              // offset(0)   align(8)  size(8)
    // -- implicit member alignment padding -- // offset(8)             size(8)
    b: vec3<f32>,                              // offset(16)  align(16) size(12)
    c: f32,                                    // offset(28)  align(4)  size(4)
    d: f32,                                    // offset(32)  align(4)  size(4)
    // -- implicit member alignment padding -- // offset(36)            size(4)
    e: A,                                      // offset(40)  align(8)  size(24)
    f: vec3<f32>,                              // offset(64)  align(16) size(12)
    // -- implicit member alignment padding -- // offset(76)            size(4)
    g: array<A, 3>,    // element stride 24       offset(80)  align(8)  size(72)
    h: i32                                     // offset(152) align(4)  size(4)
    // -- implicit struct size padding --      // offset(156)           size(4)
}

@group(0) @binding(0)
var<storage,read_write> storage_buffer: B;
```

```
struct A {                                     //             align(8)  size(32)
    u: f32,                                    // offset(0)   align(4)  size(4)
    v: f32,                                    // offset(4)   align(4)  size(4)
    w: vec2<f32>,                              // offset(8)   align(8)  size(8)
    @size(16) x: f32                           // offset(16)  align(4)  size(16)
}

struct B {                                     //             align(16) size(208)
    a: vec2<f32>,                              // offset(0)   align(8)  size(8)
    // -- implicit member alignment padding -- // offset(8)             size(8)
    b: vec3<f32>,                              // offset(16)  align(16) size(12)
    c: f32,                                    // offset(28)  align(4)  size(4)
    d: f32,                                    // offset(32)  align(4)  size(4)
    // -- implicit member alignment padding -- // offset(36)            size(12)
    @align(16) e: A,                           // offset(48)  align(16) size(32)
    f: vec3<f32>,                              // offset(80)  align(16) size(12)
    // -- implicit member alignment padding -- // offset(92)            size(4)
    g: array<A, 3>,    // element stride 32       offset(96)  align(8)  size(96)
    h: i32                                     // offset(192) align(4)  size(4)
    // -- implicit struct size padding --      // offset(196)           size(12)
}

@group(0) @binding(0)
var<uniform> uniform_buffer: B;
```
