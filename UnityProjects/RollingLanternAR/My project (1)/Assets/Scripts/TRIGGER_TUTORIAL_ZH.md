# 滚灯 AR 触发教程（最小可运行）

## 1. 场景准备
1. 打开场景（建议新建 `RollingLanternAR.unity`）。
2. 创建 `AR Session`。
3. 创建 `XR Origin (AR)`，保留其子对象 `AR Camera`。

## 2. 挂载组件
在 `XR Origin (AR)` 上添加：
1. `AR Plane Manager`
2. `AR Raycast Manager`
3. `ARTapToPlaceRollingLantern`
4. `ARLanternRuntimePanel`

`AR Plane Manager` 设置：
1. `Detection Mode` 设为 `Horizontal`。

## 3. 绑定引用
`ARTapToPlaceRollingLantern`：
1. `Plane Manager` 拖入 `XR Origin (AR)`
2. `Ar Camera` 拖入 `AR Camera`
3. `Rolling Lantern Prefab` 可留空（运行时自动生成）

`ARLanternRuntimePanel`：
1. `Placement Controller` 拖入 `XR Origin (AR)`（即含 `ARTapToPlaceRollingLantern` 的对象）

## 4. 运行时触发动作
1. 先移动手机扫描平面（桌面/地面）。
2. 单击屏幕平面位置：生成滚灯。
3. 再点击滚灯：切换样式配色。
4. 左上控制面板：
   - `Spin RPM` 滑条：调转速
   - `Next Style`：切样式
   - `Reset Placement`：删除当前滚灯并恢复平面检测

## 5. 无法触发时排查
1. 没出现平面：确认 `AR Plane Manager` 已启用且真机支持 AR。
2. 点了不生成：确认 `XR Origin (AR)` 上有 `AR Raycast Manager`。
3. 点滚灯不切样式：确认 `ARTapToPlaceRollingLantern.tapLanternToCycleStyle = true`。
4. 真机黑屏/权限问题：检查相机权限与 `XR Plug-in Management` 平台勾选。
