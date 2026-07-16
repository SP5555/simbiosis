'use strict'

export const SEA_DEPTH_COLOR_STOPS = [
    [-3000, 0x1426ac],
    [-1500, 0x2436cc],
    [    0, 0x3479cc],
];

// hypsometric tint, shared by land and water: deep ocean -> shallow water ->
// lowland -> upland -> mountain -> snow peak
export const ELEVATION_COLOR_STOPS = [
    [-4000, 0x0a1a33],
    [ -500, 0x2a5f8f],
    [    0, 0x4a9e5c],
    [ 1000, 0x8aa63e],
    [ 2000, 0xc9a227],
    [ 3000, 0x8f5a3a],
    [ 4200, 0xd9d3c8],
    [ 5000, 0xffffff],
];

// diverging cold -> hot scale, with the freeze point (0 degC) marked as a
// bright icy band between the darker cold-blue below and thaw-green above
export const TEMPERATURE_COLOR_STOPS = [
    [-20, 0x352a6b],
    [-10, 0x3d6cc2],
    [  0, 0xb8ecf2],
    [ 10, 0x7fc47a],
    [ 20, 0xe8d868],
    [ 30, 0xe8892e],
    [ 40, 0xb3251f],
    [ 50, 0x6b0f0f],
];

// barren tan-brown (low) -> rich dark green (high)
export const FERTILITY_COLOR_STOPS = [
    [0.0, 0x8a6d4b],
    [0.5, 0x8a9c4e],
    [1.0, 0x1f6b3a],
];

// dry umber -> sage -> saturated teal (matches the humidity diagnostic palette)
export const HUMIDITY_COLOR_STOPS = [
    [0.0, 0x6b4226],
    [0.5, 0x93a35c],
    [1.0, 0x2f7a8c],
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
