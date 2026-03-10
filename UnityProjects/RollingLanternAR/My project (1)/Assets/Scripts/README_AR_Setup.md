# Rolling Lantern AR - Minimal Playable Setup

## 1. Scene objects
Create these objects in one scene:

1. `AR Session`
2. `XR Origin (AR)`
3. Keep `AR Camera` under `XR Origin (AR)`

## 2. Add components on `XR Origin (AR)`
Add these components:

1. `AR Plane Manager`
2. `AR Raycast Manager`
3. `ARTapToPlaceRollingLantern`
4. `ARLanternRuntimePanel` (optional but recommended)

In `AR Plane Manager`:
- Set `Detection Mode` to `Horizontal`

## 3. Bind script fields
On `ARTapToPlaceRollingLantern`:

1. `Plane Manager` -> drag `XR Origin (AR)`
2. `Ar Camera` -> drag `AR Camera`
3. `Rolling Lantern Prefab` -> can be empty (script generates lantern at runtime)

On `ARLanternRuntimePanel`:

1. `Placement Controller` -> drag `XR Origin (AR)` object with `ARTapToPlaceRollingLantern`

## 4. Runtime interaction
1. Tap detected plane -> place lantern
2. Tap lantern -> cycle style palette
3. Use panel slider -> change spin RPM
4. Tap `Reset Placement` -> remove lantern and resume plane detection

## 5. Build requirements
Android:
1. Install `ARCore XR Plugin`
2. Enable `ARCore` in `XR Plug-in Management` for Android

iOS:
1. Install `ARKit XR Plugin`
2. Enable `ARKit` in `XR Plug-in Management` for iOS
