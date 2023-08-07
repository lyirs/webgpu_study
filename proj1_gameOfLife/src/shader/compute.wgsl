@binding(0) @group(0) var<storage, read> size: vec2<u32>;  // 用于存储模拟世界的大小（宽度和高度）
@binding(1) @group(0) var<storage, read> current: array<u32>;  // 存储当前时刻模拟世界中每个细胞的状态
@binding(2) @group(0) var<storage, read_write> next: array<u32>;  // 存储下一个时刻模拟世界中每个细胞的状态

// override 关键字用于覆盖或修改默认的着色器设置，这样可以在计算着色器中显式地指定适合问题的工作组大小，以优化并行计算性能
// 在实际的应用中，选择使用 const 还是 override 取决于具体的需求。如果工作组大小是固定的，并且在编译时就可以确定，那么使用 const 是合适的。
// 如果工作组大小需要在运行时动态调整，以优化性能或适应不同的硬件，那么使用 override 更合适。
override blockSize = 8;  

// 根据给定的 x 和 y 坐标计算细胞在一维数组中的索引
// 目的是将二维坐标 (x, y) 映射到一个一维数组中的索引，以便可以在一维数组中更方便地访问或操作相应的元素
// (y % h)：这是将给定的 y 坐标对高度 h 取模的结果，这是为了处理边界情况，以确保索引在合法范围内。
// (y % h) * w：将结果与宽度 w 相乘，得到一个一维数组中的基本偏移量
fn getIndex(x: u32, y: u32) -> u32 {
    let h = size.y;
    let w = size.x;
    return (y % h) * w + (x % w);
}

// 根据给定的 x 和 y 坐标，返回当前时刻模拟世界中对应细胞的状态
fn getCell(x: u32, y: u32) -> u32 {
    return current[getIndex(x, y)];
}

// 根据给定的 x 和 y 坐标，计算当前细胞周围活细胞的数量。它通过调用 getCell 函数来获取相邻细胞的状态，并将它们累加起来
fn countNeighbors(x: u32, y: u32) -> u32 {
    return getCell(x - 1, y - 1) + getCell(x, y - 1) + getCell(x + 1, y - 1) + 
            getCell(x - 1, y) +                         getCell(x + 1, y) + 
            getCell(x - 1, y + 1) + getCell(x, y + 1) + getCell(x + 1, y + 1);
}

@compute @workgroup_size(blockSize, blockSize)   // 工作组大小设置为 8x8
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
    // 当前工作组内的一个细胞的位置
    let x = grid.x;
    let y = grid.y;  
    let n = countNeighbors(x, y);
    // 根据生命游戏的规则更新下一个时刻细胞的状态
    // 使用 select 函数根据当前细胞状态和周围活细胞数量来决定细胞的生死状态，然后将结果存储在 next 数组中
    // select(f: T, t: T, cond: bool) -> T
    // 当前细胞为死亡状态时，当周围有3个存活细胞时，该细胞变成存活状态  getCell(x, y) == 1u [False] => u32(n == 3u) [True] => 存活
    // 当前细胞为存活状态时，当周围低于2个（不包含2个）存活细胞时， 该细胞变成死亡状态   getCell(x, y) == 1u [True] => u32(n == 2u || n == 3u) [False] => 死亡
    // 当前细胞为存活状态时，当周围有2个或3个存活细胞时， 该细胞保持原样 getCell(x, y) == 1u [True] => u32(n == 2u || n == 3u) [True] => 存活
    // 当前细胞为存活状态时，当周围有3个以上的存活细胞时，该细胞变成死亡状态  getCell(x, y) == 1u [True] => u32(n == 2u || n == 3u) [False] => 死亡
    next[getIndex(x, y)] = select(u32(n == 3u), u32(n == 2u || n == 3u), getCell(x, y) == 1u); 
} 
