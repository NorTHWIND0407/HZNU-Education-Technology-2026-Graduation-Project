# Unity 导出与发布教程

这是给当前“临平滚灯”网页项目配套使用的 Unity 导出手册。目标不是泛泛讲 Unity，而是让你能一次性导出并放好下面这些文件：

- WebAR 模型：`public/models/rolling-lantern.glb`
- Windows 安装包：`public/downloads/rolling-lantern-ar-windows.zip`
- Unity 模块包：`public/downloads/rolling-lantern-module.unitypackage`
- Unity 源工程压缩包：`public/downloads/rolling-lantern-source.zip`
- Android 导出教程页：`public/downloads/android-apk-guide.html`

文档更新时间：2026-04-02

## 1. 发布前统一检查

无论你要导出模型还是安装包，先做这几项检查：

1. 打开 Unity 工程，进入 `File > Build Settings`。
2. 在 `Scenes In Build` 里确认需要发布的场景已经加入；如果没加入，可点 `Add Open Scenes`。
3. 确认当前是正式发布版时，不要勾选 `Development Build`。
4. 打开 `Player Settings`，检查：
   - `Product Name`
   - `Company Name`
   - `Version`
   - 应用图标、启动方向、包名
5. 如果目标平台是灰色不可选，去 Unity Hub 的 `Installs > Add Modules` 补装对应平台模块。

建议你把 Unity 导出文件统一先放在 Unity 工程自己的 `Builds/` 目录里，确认没问题后再复制到本网页项目。

## 2. 导出 WebAR 用 3D 模型（GLB）

### 方案 A：从原始建模软件直接导出 GLB

如果你手里还有 Blender、Maya、3ds Max 等原始模型文件，优先走这条路线。原因是 WebAR 最终读取的是 `.glb`，直接从建模源头导出，通常比“先进 Unity 再倒出来”更稳。

建议导出要求：

- 模型单位按米整理，避免导入网页后尺寸失真。
- 尽量把贴图控制在 `1024x1024` 以内。
- 面数尽量低于 `50k`，更理想是低于 `20k`。
- 尽量合并重复材质，清理没用到的节点和空物体。

导出完成后，把文件命名为：

```text
rolling-lantern.glb
```

然后放到：

```text
public/models/rolling-lantern.glb
```

### 方案 B：只有 Unity 工程，没有原始建模文件

Unity 本身更擅长“导入模型并打包应用”，不是所有版本都默认内置 `glb` 导出菜单。  
如果你只有 Unity 工程，推荐两种做法：

1. 安装 `glTFast`
2. 安装 `UniGLTF / UniVRM`

#### 路线 B1：使用 glTFast 导出

适合想尽量走 Unity 官方生态的情况。

步骤：

1. 在 Unity 的 `Package Manager` 中安装包 `com.unity.cloud.gltfast`。
2. 在场景或层级里选中你的滚灯模型根节点。
3. 进入 `File > Export`，选择 glTF / GLB 相关导出项。
4. 导出后检查材质、法线、贴图是否正常。
5. 将结果命名为 `rolling-lantern.glb`，复制到 `public/models/`。

#### 路线 B2：使用 UniGLTF / UniVRM 导出

适合你已经在 Unity 里用了 VRM / glTF 相关工具链，或者 glTFast 菜单不顺手的情况。

步骤：

1. 安装 `com.vrmc.gltf`（UniGLTF）。
2. 在编辑器里选中目标对象或场景根节点。
3. 使用包提供的 glTF 2.0 / GLB 导出入口。
4. 导出后同样命名为 `rolling-lantern.glb`，放到 `public/models/`。

#### 路线 B3：先导出 FBX，再转成 GLB

如果你在 Unity 中只能稳定导出 FBX，也可以先走中间方案：

1. 在 Unity 中选中模型对象。
2. 使用 `GameObject > Export To FBX` 导出 `.fbx`。
3. 再把 FBX 放进 Blender 等工具中导出为 `.glb`。

这条路线虽然多一步，但在“Unity 内部材质导出不完整”时通常更稳。

## 3. 导出 Android 安装包（APK）

如果你现在已经能在 Unity 里看到 Android 平台，并且可以正常切换平台，就可以直接导出 APK。
但在当前网页项目里，Android 入口已经改成教程页，不再直接上传 APK 文件。

### 导出步骤

1. 打开 `File > Build Settings`。
2. 在平台列表中选择 `Android`。
3. 如果还没切过去，点击 `Switch Platform`。
4. 点击 `Player Settings`，重点检查：
   - `Package Name`
   - `Version`
   - `Minimum API Level`
   - 图标、启动方向
5. 正式发布时不要勾 `Development Build`。
6. 在 `Build Settings` 中点击 `Build`。
7. 导出文件命名为：

```text
rolling-lantern-ar-android.apk
```

8. 如需网页端说明，改为在教程页中写明导出方法即可，不必再强制上传 APK 到网页目录。

### 导出建议

- 如果只是老师验收或现场安装，直接导出 `APK` 最省事。
- 如果后面要上应用市场，再单独考虑 `AAB`。
- 真机安装前，记得在 Android 手机上允许安装未知来源应用。

## 4. 在 mac 上导出 Windows 安装包（ZIP）

你现在用的是 macOS 上的 Unity，这种情况通常也可以直接导出 Windows 包，但前提是这套 Unity 编辑器已经安装了 `Windows Build Support` 模块。

Windows 端不要只拿一个 `.exe`。Unity 的 Windows 发布通常至少包含：

- `ProjectName.exe`
- `UnityPlayer.dll`
- `ProjectName_Data/`

所以网页里最稳的做法是把整个 Windows 发布目录打成一个 ZIP。

### 先确认你的 Unity 有没有 Windows 支持模块

1. 打开 `Unity Hub`。
2. 进入 `Installs`。
3. 找到你正在使用的 Unity 版本。
4. 点右侧 `...`。
5. 选择 `Add Modules`。
6. 勾选 `Windows Build Support (Mono)` 或你项目需要的 Windows 模块。
7. 安装完成后，再回到项目。

如果 `Build Settings` 里看不到 `Windows`，通常就是这个模块还没装。

### 导出步骤

1. 进入 `File > Build Settings`。
2. 在平台列表里选 `Windows`。
3. 点击 `Switch Platform`。
4. 推荐 `Architecture` 选择 `Intel 64-bit`。
5. 正式发布时：
   - 不勾 `Development Build`
   - 通常也不需要勾 `Copy PDB files`
6. 点击 `Build`。
7. 选择一个输出文件夹，例如：

```text
Builds/Windows/rolling-lantern-ar-windows/
```

8. 等 Unity 导出完成后，你会得到一个完整目录，而不是单独一个 exe。
9. 把整个目录压缩成：

```text
rolling-lantern-ar-windows.zip
```

10. 复制到网页项目：

```text
public/downloads/rolling-lantern-ar-windows.zip
```

### 在 mac 上导出 Windows 时的注意点

- 你可以在 macOS 上直接生成 Windows 构建文件，不一定非要去 Windows 电脑上打包。
- 但 `Build And Run` 一般不适合在 Mac 上直接验证 Windows 程序；更稳的是先 `Build`，再拿到 Windows 机器实测。
- 如果你的 Unity 项目依赖某些仅 Windows 可用的原生插件、DLL、注册表调用或外部 EXE，就算能打包，也最好在 Windows 设备上再验一遍。
- 对你这个当前项目来说，如果主要是模型、场景、交互和普通脚本，通常可以直接从 Mac 构建 Windows 包。

## 5. 导出 Unity 模块包（.unitypackage）

这个包适合给别的 Unity 项目直接复用滚灯模型、材质、预制体和脚本。

### 建议先整理好模块目录

最好先把你要复用的内容集中到一个总目录里，例如：

```text
Assets/RollingLanternModule/
```

里面可以放：

- Prefabs
- Materials
- Textures
- Models
- Scripts
- Demo Scene

### 导出步骤

1. 在 `Project` 面板中选中模块根目录，或手动多选要导出的资源。
2. 进入 `Assets > Export Package...`
3. 在弹窗中勾选：
   - 目标资源
   - `Include dependencies`
4. 点击 `Export`
5. 保存为：

```text
rolling-lantern-module.unitypackage
```

6. 复制到网页项目：

```text
public/downloads/rolling-lantern-module.unitypackage
```

### 导出建议

- 如果模块里依赖场景材质、通用脚本和动画，一定要勾 `Include dependencies`。
- 如果你只想给别人“功能包”，不要把整个工程都导进去。
- 最好附一个 `Demo Scene`，导入后能直接看到效果。

## 6. 导出 Unity 源工程 ZIP

这个包适合备份、交接、二次开发，不是给普通用户安装的。

### 推荐保留的目录

- `Assets/`
- `Packages/`
- `ProjectSettings/`

### 一般不建议打包的目录

- `Library/`
- `Temp/`
- `Logs/`
- `Obj/`
- `Build/` 或 `Builds/`

这些目录体积大，而且大多数都可以重新生成。

### 导出步骤

1. 关闭 Unity 工程。
2. 进入项目根目录。
3. 确认要排除上面的临时目录。
4. 将工程压缩为：

```text
rolling-lantern-source.zip
```

5. 复制到网页项目：

```text
public/downloads/rolling-lantern-source.zip
```

## 7. 放到网页项目后的最终检查

把文件都复制好之后，按这个对照表检查一次：

| 用途 | 最终文件名 | 放置位置 |
| --- | --- | --- |
| WebAR 模型 | `rolling-lantern.glb` | `public/models/` |
| Windows 包 | `rolling-lantern-ar-windows.zip` | `public/downloads/` |
| Unity 模块包 | `rolling-lantern-module.unitypackage` | `public/downloads/` |
| 源工程包 | `rolling-lantern-source.zip` | `public/downloads/` |
| Android 教程页 | `android-apk-guide.html` | `public/downloads/` |

然后在网页项目根目录执行：

```bash
npm run build
```

重新部署后：

- `/webar` 会读取 `public/models/rolling-lantern.glb`
- `/module-download` 会自动检测 `public/downloads` 中的文件并开启下载按钮

## 8. 常见问题

### 8.1 为什么网页里模型不显示？

优先检查：

- 文件名是不是精确叫 `rolling-lantern.glb`
- 是否放在 `public/models/`
- 浏览器能否直接访问 `/models/rolling-lantern.glb`
- 模型贴图是否丢失
- 面数或贴图是否过大，导致移动端加载失败

### 8.2 为什么 Windows 只传一个 exe 不行？

因为 Unity Windows 构建不是单文件应用。缺少 `UnityPlayer.dll` 和 `_Data` 文件夹时，程序通常无法正常运行。

### 7.3 为什么导出的 unitypackage 导入别的项目后材质丢失？

通常是导出时没有勾 `Include dependencies`，或者资源引用跨目录太分散。

### 7.4 只有 Unity 工程，没有 Blender 源文件，还适合做 WebAR 模型吗？

可以，优先尝试 Unity 内的 glTF 导出工具；如果材质不理想，再走“Unity 导出 FBX -> Blender 转 GLB”的路线。

### 7.5 我在 mac 上能直接导出 Windows 吗？

可以，前提是当前 Unity 编辑器安装了 `Windows Build Support`。  
如果没有这个模块，就先去 `Unity Hub > Installs > 对应版本右侧 ... > Add Modules` 补装。

## 8. 参考资料（2026-04-02 查询）

以下是我整理这份手册时参考的官方或项目主文档：

- Unity Build Settings：
  - https://docs.unity3d.com/cn/2022.1/Manual/BuildSettings.html
- Unity Windows Build Settings：
  - https://docs.unity3d.com/cn/2023.2/Manual/WindowsStandaloneBinaries.html
- Unity PC, Mac & Linux Standalone Build Settings：
  - https://docs.unity3d.com/cn/2019.2/Manual/BuildSettingsStandalone.html
- Unity Hub Add Modules：
  - https://docs.unity3d.com/es/2021.1/Manual/GettingStartedAddingEditorComponents.html
- Unity Export Package：
  - https://docs.unity3d.com/cn/2023.1/Manual/AssetPackagesCreate.html
- Unity FBX Exporter：
  - https://docs.unity.cn/Packages/com.unity.formats.fbx%404.2/manual/exporting.html
- Unity glTFast：
  - https://github.com/atteneder/glTFast
- UniVRM / UniGLTF：
  - https://github.com/vrm-c/UniVRM
