import React from 'react'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  applyProceduralLanternPalette,
  createProceduralLantern,
  proceduralLanternPalettes,
  type LanternScaleType,
  type LanternStyleType,
} from '../lib/proceduralLantern'

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: string) => Promise<boolean>
  }
}

const STYLE_PALETTES = proceduralLanternPalettes

function cloneRenderableTemplate(source: THREE.Object3D) {
  const clone = source.clone(true)
  clone.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.geometry = mesh.geometry.clone()
    if (!mesh.material) return

    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(material => material.clone())
      : mesh.material.clone()
  })
  return clone
}

function disposeRenderableObject(target: THREE.Object3D | null) {
  if (!target) return

  target.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    mats.forEach((material: THREE.Material) => material?.dispose())
  })
}

export default function ARViewer() {
  const useAR = (import.meta.env.VITE_USE_AR ?? 'true') !== 'false'
  const modelSource = String(import.meta.env.VITE_AR_MODEL_SOURCE ?? 'procedural').toLowerCase()

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasHostRef = React.useRef<HTMLDivElement | null>(null)
  const arButtonHostRef = React.useRef<HTMLDivElement | null>(null)
  const styleActionRef = React.useRef<() => void>(() => undefined)
  const resetActionRef = React.useRef<() => void>(() => undefined)
  const setProceduralStyleActionRef = React.useRef<(styleType: LanternStyleType) => void>(() => undefined)
  const setProceduralScaleActionRef = React.useRef<(scaleType: LanternScaleType) => void>(() => undefined)

  const [status, setStatus] = React.useState('状态：初始化中...')
  const [controlsEnabled, setControlsEnabled] = React.useState(false)
  const [proceduralControlsEnabled, setProceduralControlsEnabled] = React.useState(true)
  const [selectedStyleType, setSelectedStyleType] = React.useState<LanternStyleType>('wen')
  const [selectedScaleType, setSelectedScaleType] = React.useState<LanternScaleType>('large')
  const [previewMode, setPreviewMode] = React.useState(false)

  React.useEffect(() => {
    if (!useAR) {
      setStatus('状态：AR 模式已关闭（VITE_USE_AR=false）')
      return
    }

    const root = rootRef.current
    const host = canvasHostRef.current
    const buttonHost = arButtonHostRef.current
    if (!root || !host || !buttonHost) return

    let disposed = false

    const setSafeStatus = (text: string) => {
      if (!disposed) setStatus(`状态：${text}`)
    }

    const setSafeControls = (enabled: boolean) => {
      controlsEnabledValue = enabled
      if (!disposed) setControlsEnabled(enabled)
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.xr.enabled = true
    renderer.domElement.style.touchAction = 'none'
    host.appendChild(renderer.domElement)

    const resize = () => {
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    window.addEventListener('resize', resize)

    const hemiLight = new THREE.HemisphereLight(0xfff5d6, 0x2d3a48, 1.1)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85)
    dirLight.position.set(1.5, 2, 1.2)
    scene.add(dirLight)

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.12, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x45e0ff })
    )
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)

    let hitTestSource: unknown = null
    let hitTestSourceRequested = false
    let referenceSpace: unknown = null
    let modelTemplate: THREE.Object3D | null = null
    let placedModel: THREE.Object3D | null = null
    let rotating = false
    let pinching = false
    let lastPointerX = 0
    let pinchDistance = 0
    let styleIndex = 0
    let proceduralStyleType: LanternStyleType = 'wen'
    let proceduralScaleType: LanternScaleType = 'large'
    let controlsEnabledValue = false
    let proceduralControlsEnabledValue = true
    let previewModeActive = false
    let shouldAutoPlacePreview = false

    const setSafePreviewMode = (enabled: boolean) => {
      previewModeActive = enabled
      if (!disposed) setPreviewMode(enabled)
    }

    setSafePreviewMode(false)

    const replaceModelTemplate = (nextTemplate: THREE.Object3D) => {
      nextTemplate.visible = false

      if (modelTemplate) {
        scene.remove(modelTemplate)
        disposeRenderableObject(modelTemplate)
      }

      modelTemplate = nextTemplate
      scene.add(nextTemplate)
      proceduralControlsEnabledValue = nextTemplate.userData.lanternKind === 'procedural'
      setProceduralControlsEnabled(proceduralControlsEnabledValue)
    }

    const replacePlacedModel = (nextModel: THREE.Object3D) => {
      const previous = placedModel
      if (previous) {
        const prevPosition = previous.position.clone()
        const prevQuaternion = previous.quaternion.clone()
        const prevScale = previous.scale.clone()

        scene.remove(previous)
        disposeRenderableObject(previous)

        placedModel = nextModel
        placedModel.visible = true
        placedModel.position.copy(prevPosition)
        placedModel.quaternion.copy(prevQuaternion)
        placedModel.scale.copy(prevScale)
        scene.add(placedModel)
        return
      }

      placedModel = nextModel
    }

    const attachPlacedModelToScene = () => {
      if (placedModel && placedModel.parent !== scene) {
        scene.add(placedModel)
      }
    }

    const setModelScale = (nextScale: number) => {
      if (!placedModel) return
      const clamped = THREE.MathUtils.clamp(nextScale, 0.08, 8)
      placedModel.scale.setScalar(clamped)
    }

    const applyStyle = (index: number) => {
      if (!placedModel) return

      if (placedModel.userData.lanternKind === 'procedural') {
        applyProceduralLanternPalette(placedModel, index)
        return
      }

      const palette = STYLE_PALETTES[index % STYLE_PALETTES.length]
      const fallbackColor = new THREE.Color(palette.frameColor)
      const fallbackEmissive = fallbackColor.clone().multiplyScalar(0.16)

      placedModel.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh || !mesh.material) return

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat: THREE.Material) => {
          const standard = mat as THREE.MeshStandardMaterial
          if (standard.color) standard.color.copy(fallbackColor)
          if (standard.emissive) standard.emissive.copy(fallbackEmissive)
        })
      })
    }

    const createRuntimeLantern = (styleType = proceduralStyleType, scaleType = proceduralScaleType) => {
      const runtimeLantern = createProceduralLantern({
        scaleType,
        styleType,
        coverType: 'cloth',
        suspensionType: 'dualAxis',
        lightType: 'led',
        overallScale: 1,
        arcSegments: 20,
        chainWeight: styleType === 'wu' ? 24 : 0,
      })
      applyProceduralLanternPalette(runtimeLantern, styleIndex, styleType)
      return runtimeLantern
    }

    const rebuildProceduralLantern = (nextStyleType = proceduralStyleType, nextScaleType = proceduralScaleType) => {
      proceduralStyleType = nextStyleType
      proceduralScaleType = nextScaleType
      setSelectedStyleType(nextStyleType)
      setSelectedScaleType(nextScaleType)

      const nextTemplate = createRuntimeLantern(nextStyleType, nextScaleType)
      replaceModelTemplate(nextTemplate)

      if (placedModel?.userData.lanternKind === 'procedural') {
        const nextPlaced = cloneRenderableTemplate(nextTemplate)
        nextPlaced.visible = true
        replacePlacedModel(nextPlaced)
        attachPlacedModelToScene()
        setSafeStatus(`已切换为${nextScaleType === 'small' ? '小' : nextScaleType === 'medium' ? '中' : '大'}${nextStyleType === 'wen' ? '文灯' : '武灯'}`)
      } else {
        setSafeStatus(`下次放置将使用${nextScaleType === 'small' ? '小' : nextScaleType === 'medium' ? '中' : '大'}${nextStyleType === 'wen' ? '文灯' : '武灯'}`)
      }
    }

    const placePreviewModel = (reason?: string) => {
      if (!modelTemplate) {
        shouldAutoPlacePreview = true
        if (reason) setSafeStatus(reason)
        return
      }

      const nextModel = cloneRenderableTemplate(modelTemplate)
      nextModel.visible = true
      nextModel.position.set(0, -0.08, 0)
      nextModel.rotation.set(0, Math.PI * 0.18, 0)
      nextModel.scale.setScalar(0.72)
      replacePlacedModel(nextModel)
      attachPlacedModelToScene()

      camera.position.set(0, 0.34, 1.85)
      camera.lookAt(0, 0.05, 0)
      reticle.visible = false
      setSafeControls(true)
      if (reason) setSafeStatus(reason)
    }

    const activatePreviewMode = (reason: string) => {
      setSafePreviewMode(true)
      placePreviewModel(reason)
    }

    const loadLanternTemplate = async () => {
      const shouldTryGlb = modelSource === 'auto' || modelSource === 'glb'

      if (shouldTryGlb) {
        const loader = new GLTFLoader()
        const candidates = ['/models/rolling-lantern.glb', '/models/lantern.glb']

        for (const path of candidates) {
          try {
            const gltf = await loader.loadAsync(path)
            const loadedModel = gltf.scene
            replaceModelTemplate(loadedModel)
            setSafeStatus('glb 模型已加载，点击地面可放置')
            return
          } catch {
            continue
          }
        }
      }

      const runtimeModel = createRuntimeLantern()
      replaceModelTemplate(runtimeModel)
      setSafeStatus(shouldTryGlb ? '未找到 glb，已切换为程序生成滚灯' : '已启用程序生成滚灯')

      if (shouldAutoPlacePreview || previewModeActive) {
        placePreviewModel(previewModeActive ? '当前设备不支持 AR，已切换为 3D 预览模式' : undefined)
      }
    }

    const placeModelFromReticle = () => {
      if (!reticle.visible || !modelTemplate) return

      const nextModel = cloneRenderableTemplate(modelTemplate)
      nextModel.visible = true
      nextModel.matrix.copy(reticle.matrix)
      nextModel.matrix.decompose(nextModel.position, nextModel.quaternion, nextModel.scale)
      nextModel.scale.setScalar(0.75)
      replacePlacedModel(nextModel)
      attachPlacedModelToScene()

      styleIndex = 0
      applyStyle(styleIndex)
      setSafeControls(true)
      setSafeStatus('滚灯已放置，可旋转与自由缩放')
    }

    const onSessionStart = () => {
      setSafeStatus('AR 已开始，请移动设备寻找可放置平面')
    }

    const onSessionEnd = () => {
      hitTestSourceRequested = false
      hitTestSource = null
      referenceSpace = null
      reticle.visible = false
      setSafeStatus('AR 会话已结束')
    }

    const requestHitTestSource = (frame: any) => {
      const session = frame.session
      session.requestReferenceSpace('viewer').then((viewerSpace: any) => {
        session.requestHitTestSource({ space: viewerSpace }).then((source: unknown) => {
          hitTestSource = source
        })
      })
      session.addEventListener('end', onSessionEnd, { once: true })
      hitTestSourceRequested = true
    }

    const controller = renderer.xr.getController(0)
    controller.addEventListener('select', placeModelFromReticle)
    scene.add(controller)

    styleActionRef.current = () => {
      if (!placedModel) return
      styleIndex = (styleIndex + 1) % STYLE_PALETTES.length
      applyStyle(styleIndex)
    }

    setProceduralStyleActionRef.current = (nextStyleType: LanternStyleType) => {
      if (!controlsEnabledValue && proceduralControlsEnabledValue) {
        proceduralStyleType = nextStyleType
        setSelectedStyleType(nextStyleType)
        replaceModelTemplate(createRuntimeLantern(nextStyleType, proceduralScaleType))
        setSafeStatus(`下次放置将使用${proceduralScaleType === 'small' ? '小' : proceduralScaleType === 'medium' ? '中' : '大'}${nextStyleType === 'wen' ? '文灯' : '武灯'}`)
        return
      }

      if (!placedModel || placedModel.userData.lanternKind !== 'procedural') {
        setSafeStatus('当前 glb 模式不支持文灯/武灯几何切换')
        return
      }

      rebuildProceduralLantern(nextStyleType, proceduralScaleType)
    }

    setProceduralScaleActionRef.current = (nextScaleType: LanternScaleType) => {
      if (!controlsEnabledValue && proceduralControlsEnabledValue) {
        proceduralScaleType = nextScaleType
        setSelectedScaleType(nextScaleType)
        replaceModelTemplate(createRuntimeLantern(proceduralStyleType, nextScaleType))
        setSafeStatus(`下次放置将使用${nextScaleType === 'small' ? '小' : nextScaleType === 'medium' ? '中' : '大'}${proceduralStyleType === 'wen' ? '文灯' : '武灯'}`)
        return
      }

      if (!placedModel || placedModel.userData.lanternKind !== 'procedural') {
        setSafeStatus('当前 glb 模式不支持尺寸几何切换')
        return
      }

      rebuildProceduralLantern(proceduralStyleType, nextScaleType)
    }

    resetActionRef.current = () => {
      if (placedModel) {
        scene.remove(placedModel)
        disposeRenderableObject(placedModel)
        placedModel = null
      }

      if (previewModeActive) {
        placePreviewModel('已重置为 3D 预览默认视角')
        return
      }

      setSafeControls(false)
      setSafeStatus('已重置，请重新点击地面放置')
    }

    const onWheel = (e: WheelEvent) => {
      if (!placedModel) return
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      setModelScale(placedModel.scale.x * factor)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!placedModel || pinching) return
      rotating = true
      lastPointerX = e.clientX
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!placedModel || !rotating || pinching) return
      const dx = e.clientX - lastPointerX
      lastPointerX = e.clientX
      placedModel.rotation.y -= dx * 0.008
    }

    const endRotate = () => {
      rotating = false
    }

    const distanceOfTouches = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!placedModel || e.touches.length !== 2) return
      pinching = true
      rotating = false
      pinchDistance = distanceOfTouches(e.touches)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!placedModel || !pinching || e.touches.length !== 2) return
      e.preventDefault()
      const nextDistance = distanceOfTouches(e.touches)
      const ratio = nextDistance / Math.max(pinchDistance, 1)
      pinchDistance = nextDistance
      setModelScale(placedModel.scale.x * ratio)
    }

    const onTouchEnd = () => {
      if (pinching) pinching = false
    }

    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', endRotate)
    renderer.domElement.addEventListener('pointercancel', endRotate)
    renderer.domElement.addEventListener('pointerleave', endRotate)
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false })
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true })
    renderer.domElement.addEventListener('touchcancel', onTouchEnd, { passive: true })

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root },
    })

    if (arButton instanceof HTMLElement) {
      arButton.style.position = 'static'
      arButton.style.display = 'inline-flex'
      arButton.style.margin = '0'
      arButton.style.padding = '8px 14px'
      arButton.style.borderRadius = '10px'
      arButton.style.border = '1px solid rgba(255,255,255,0.35)'
      arButton.style.background = 'rgba(19, 39, 67, 0.86)'
      arButton.style.color = '#fff'
      arButton.style.fontSize = '13px'
      arButton.style.letterSpacing = '0.02em'
      arButton.style.cursor = 'pointer'

      if (arButton.tagName === 'BUTTON') {
        arButton.textContent = '进入 AR'
      }
    }

    buttonHost.appendChild(arButton)

    const xrNavigator = navigator as XRNavigator
    if (xrNavigator.xr) {
      xrNavigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => {
          if (!supported) {
            if (arButton instanceof HTMLElement) {
              arButton.style.display = 'none'
            }
            activatePreviewMode('当前设备或浏览器不支持 immersive-ar，已切换为 3D 预览模式')
          }
        })
        .catch(() => {
          if (arButton instanceof HTMLElement) {
            arButton.style.display = 'none'
          }
          activatePreviewMode('无法检测 WebXR 支持状态，已切换为 3D 预览模式')
        })
    } else {
      if (arButton instanceof HTMLElement) {
        arButton.style.display = 'none'
      }
      activatePreviewMode('浏览器不支持 WebXR，已切换为 3D 预览模式')
    }

    renderer.xr.addEventListener('sessionstart', onSessionStart)

    renderer.setAnimationLoop((_time: number, frame?: any) => {
      if (frame) {
        if (!hitTestSourceRequested) {
          requestHitTestSource(frame)
        }

        if (!referenceSpace) {
          referenceSpace = renderer.xr.getReferenceSpace()
        }

        if (hitTestSource && referenceSpace) {
          const hitTestResults = frame.getHitTestResults(hitTestSource as any)
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0]
            const pose = hit.getPose(referenceSpace as any)
            if (pose) {
              reticle.visible = true
              reticle.matrix.fromArray(pose.transform.matrix)
            }
          } else {
            reticle.visible = false
          }
        }
      }

      renderer.render(scene, camera)
    })

    if (!previewModeActive) {
      setSafeStatus('初始化完成，支持时可点击“进入 AR”')
    }
    setSafeControls(false)
    void loadLanternTemplate()

    return () => {
      disposed = true

      styleActionRef.current = () => undefined
      resetActionRef.current = () => undefined
      setProceduralStyleActionRef.current = () => undefined
      setProceduralScaleActionRef.current = () => undefined

      renderer.setAnimationLoop(null)
      renderer.xr.removeEventListener('sessionstart', onSessionStart)

      const activeSession = renderer.xr.getSession()
      if (activeSession) {
        void activeSession.end().catch(() => undefined)
      }

      controller.removeEventListener('select', placeModelFromReticle)

      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', endRotate)
      renderer.domElement.removeEventListener('pointercancel', endRotate)
      renderer.domElement.removeEventListener('pointerleave', endRotate)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onTouchEnd)
      renderer.domElement.removeEventListener('touchcancel', onTouchEnd)

      window.removeEventListener('resize', resize)
      resizeObserver.disconnect()

      if (buttonHost.contains(arButton)) {
        buttonHost.removeChild(arButton)
      }
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement)
      }
      disposeRenderableObject(scene)

      renderer.dispose()
    }
  }, [modelSource, useAR])

  if (!useAR) {
    return (
      <div className="card p-4">
        <p className="mb-2">AR 模式已关闭（.env 设置 `VITE_USE_AR=false`）。</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div
        ref={rootRef}
        className="relative h-[72vh] min-h-[460px] max-h-[860px] w-full bg-[radial-gradient(circle_at_18%_12%,#244369,#07111f_58%)]"
      >
        <div ref={canvasHostRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <section className="pointer-events-auto absolute left-3 top-3 w-[min(90vw,430px)] rounded-xl border border-white/20 bg-slate-950/68 p-3 text-white backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-amber-300">滚灯 WebAR 交互</h2>
              {previewMode ? (
                <span className="rounded-full border border-sky-300/50 bg-sky-400/15 px-2 py-0.5 text-[11px] text-sky-100">
                  3D 预览模式
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-100/90">
              {previewMode
                ? '当前设备不支持标准 WebXR AR，已自动切换为 3D 预览。你仍可切换文灯/武灯、调整尺寸，并用拖拽和滚轮/双指继续查看滚灯。'
                : '1. 点击“进入 AR”并允许摄像头权限。2. 移动设备找到平面，出现蓝色圆环后点击屏幕放置滚灯。3. 单指拖拽旋转，双指捏合或鼠标滚轮自由缩放。'}
            </p>

            <p className="mt-2 text-xs text-amber-100">{status}</p>

            <div className="mt-3 space-y-2">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-300/90">样式</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProceduralStyleActionRef.current('wen')}
                    disabled={!proceduralControlsEnabled}
                    className={`rounded-md border px-3 py-1.5 text-xs transition ${
                      selectedStyleType === 'wen'
                        ? 'border-amber-300 bg-amber-300/20 text-amber-100'
                        : 'border-slate-400/50 bg-slate-800/90 text-white hover:bg-slate-700'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    文灯
                  </button>
                  <button
                    onClick={() => setProceduralStyleActionRef.current('wu')}
                    disabled={!proceduralControlsEnabled}
                    className={`rounded-md border px-3 py-1.5 text-xs transition ${
                      selectedStyleType === 'wu'
                        ? 'border-amber-300 bg-amber-300/20 text-amber-100'
                        : 'border-slate-400/50 bg-slate-800/90 text-white hover:bg-slate-700'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    武灯
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-300/90">尺寸</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['small', '小'],
                    ['medium', '中'],
                    ['large', '大'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setProceduralScaleActionRef.current(value)}
                      disabled={!proceduralControlsEnabled}
                      className={`rounded-md border px-3 py-1.5 text-xs transition ${
                        selectedScaleType === value
                          ? 'border-amber-300 bg-amber-300/20 text-amber-100'
                          : 'border-slate-400/50 bg-slate-800/90 text-white hover:bg-slate-700'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => styleActionRef.current()}
                disabled={!controlsEnabled}
                className="rounded-md border border-slate-400/50 bg-slate-800/90 px-3 py-1.5 text-xs text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                切换风格
              </button>

              <button
                onClick={() => resetActionRef.current()}
                disabled={!controlsEnabled}
                className="rounded-md border border-slate-400/50 bg-slate-800/90 px-3 py-1.5 text-xs text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                重置模型
              </button>
            </div>

            <div ref={arButtonHostRef} className="mt-3" />
          </section>
        </div>
      </div>
    </div>
  )
}
