export const EVENTS = {
    // GUI events
    GENERATE_MAP: "GUI:generateMap",
    APPLY_TERRAIN_FILTER: "GUI:applyTerrainFilter",
    TOGGLE_VEGETATION: "GUI:toggleVegetation",

    // simulation events
    MAP_GENERATED: "sim:mapGenerated",
    SEASON_CHANGED: "sim:seasonChanged",
    DATE_CHANGED: "sim:dateChanged",

    // renderer events
    NEW_SCALE_CALCULATED: "ren:newScaleCalculated",

    // tile picker events
    TILE_HOVERED: "tilePick:tileHovered",

    // camera controller events
    CAMERA_UPDATED: "camCtrl:CameraUpdated",
};
