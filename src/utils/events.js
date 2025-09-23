export const EVENTS = {
    // GUI events
    TOGGLE_SIMULATION: "GUI:toggleSimulation",
    SET_SIM_SPEED: "GUI:setSimSpeed",
    APPLY_TERRAIN_FILTER: "GUI:applyTerrainFilter",
    TOGGLE_VEGETATION: "GUI:toggleVegetation",
    GENERATE_MAP: "GUI:generateMap",

    // simulation events
    MAP_GENERATED: "sim:mapGenerated",
    SEASON_CHANGED: "sim:seasonChanged",
    DATE_CHANGED: "sim:dateChanged",

    // renderer events
    NEW_SCALE_CALCULATED: "ren:newScaleCalculated",

    // tile picker events
    TILE_HOVERED: "tilePick:tileHovered",
    TILE_SELECTED: "tilePick:tileSelected",

    // camera controller events
    CAMERA_UPDATED: "camCtrl:CameraUpdated",
};
