varying float vState;
uniform float uiTime;

// ---MAIN---
{
    float hoverBoost = (vState > 0.5 && vState < 1.5) ? 0.2 : 0.0;
    float selectBoost = (vState > 1.5) ? abs(sin(uiTime * 2.0)) * 0.2 : 0.0;
    diffuseColor.rgb = min(diffuseColor.rgb + hoverBoost + selectBoost, 1.0);
}
