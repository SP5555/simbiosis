export const SEA_DEPTH_COLOR_STOPS = [
    [-3000, 0x1426ac],
    [-1500, 0x2436cc],
    [    0, 0x3479cc],
];

export const ELEVATION_COLOR_STOPS = [
    [-4000, 0x000000],
    [    0, 0x73bcfc],
    [    0, 0x3535fc],
    [ 1250, 0x34eb34],
    [ 2500, 0xded831],
    [ 3750, 0xd63838],
    [ 5000, 0xececec],
];

export const TEMPERATURE_COLOR_STOPS = [
    [-20, 0xcccccc],
    [-10, 0xff00ff],
    [  0, 0x0000ff],
    [ 12, 0x00ffff],
    [ 26, 0x00ff00],
    [ 34, 0xffff00],
    [ 50, 0xff0000],
];

export const BIOME_COLOR_MAP = {
    "Desert":       0xccad60,
    "Steppe":       0xad8967,
    "Tundra":       0xa89d99, // 0xa3914d,

    "Savanna":      0xa37936, // 0x8f6f2f,
    "Grassland":    0xa18243,
    "Taiga":        0xb08d80, // 0x9e8451,

    "Jungle":       0x855d2e,
    "Forest":       0x8f6a3f, 
    "Boreal":       0xa6845d,

    "undefined":    0xff0000,
};