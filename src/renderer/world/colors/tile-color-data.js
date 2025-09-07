export const SEA_DEPTH_COLOR_STOPS = [
    [-3000, 0x1426ac],
    [-1500, 0x2436cc],
    [    0, 0x3479cc],
];

export const ELEVATION_COLOR_STOPS = [
    [-4000, 0x000000],
    [    0, 0x73bcfc],
    [    0, 0x3535fc],
    [ 1000, 0x34eb34],
    [ 3000, 0xded831],
    [ 4000, 0xd63838],
    [ 5000, 0xececec],
];

export const TEMPERATURE_COLOR_STOPS = [
    [-20, 0x3434ff],
    [  0, 0x111111],
    [ 26, 0x00cc00],
    [ 32, 0xcccc00],
    [ 50, 0xff3434],
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
    "Boreal":       0x96744d,

    "undefined":    0xff0000,
};