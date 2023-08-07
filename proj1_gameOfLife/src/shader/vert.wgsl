struct Out {
    @builtin(position) pos: vec4<f32>,
    @location(0) cell: f32,   // 表示每个顶点的细胞属性
}

@binding(0) @group(0) var<uniform> size: vec2<u32>;

@vertex
fn main(
    @builtin(instance_index) i: u32, 
    @location(0) cell: u32,
    @location(1) pos: vec2<u32>
    ) -> Out {
    let w = size.x;
    let h = size.y;
    // 这两行代码计算了顶点的标准化设备坐标（Normalized Device Coordinates，NDC），用于将顶点的位置从模拟世界坐标映射到屏幕上的坐标
    // 考虑 x 坐标。模拟世界的 x 坐标可能在 [0, width] 的范围内，其中 width 是模拟世界的宽度。但 NDC 的范围是 [-1, 1]。所以，我们需要将模拟世界的 x 坐标映射到 NDC 范围。
    // i % w + pos.x 计算出顶点在模拟世界中的 x 坐标
    // f32(i % w + pos.x) / f32(w) 将上述计算结果除以宽度 w，以将 x 坐标映射到 [0, 1] 范围内的浮点数。
    // - 0.5：将范围限制到 [-0.5, 0.5]
    // * 2. * f32(w) / f32(max(w, h))：将范围扩展到 [-w/h, w/h] 范围内，确保横纵比保持一致。
    let x = (f32(i % w + pos.x) / f32(w) - 0.5) * 2. * f32(w) / f32(max(w, h));
    // (i - (i % w)) / w + pos.y：这是为了计算每一行的 y 坐标。
    // i - (i % w) 将 i 对齐到当前行的起始索引，然后除以 w 得到行索引，再加上顶点属性中的 y 坐标偏移量 pos.y。
    let y = (f32((i - (i % w)) / w + pos.y) / f32(h) - 0.5) * 2. * f32(h) / f32(max(w, h));
    return Out(vec4<f32>(x, y, 0., 1.), f32(cell));
}
