export const CubeData = () => {
    const vertexData = new Float32Array([
        // position,   color
        -1, -1,  1,    0, 0, 1,     // vertex a, index 0
         1, -1,  1,    1, 0, 1,     // vertex b, index 1
         1,  1,  1,    1, 1, 1,     // vertex c, index 2
        -1,  1,  1,    0, 1, 1,     // vertex d, index 3
        -1, -1, -1,    0, 0, 0,     // vertex e, index 4
         1, -1, -1,    1, 0, 0,     // vertex f, index 5
         1,  1, -1,    1, 1, 0,     // vertex g, index 6
        -1,  1, -1,    0, 1, 0,     // vertex h, index 7 
    ]);

    const indexData = new Uint32Array([
        // front
        0, 1, 2, 2, 3, 0,
        // right
        1, 5, 6, 6, 2, 1,
        // back
        4, 7, 6, 6, 5, 4,
        // left
        0, 3, 7, 7, 4, 0,
        // top
        3, 2, 6, 6, 7, 3,
        // bottom
        0, 4, 5, 5, 1, 0
    ]);

    return {
        vertexData,
        indexData
    };
};