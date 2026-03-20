import React from 'react'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: string) => Promise<boolean>
  }
}

const STYLE_PALETTES = [
  { color: new THREE.Color(0xb71818), emissive: new THREE.Color(0x401010) },
  { color: new THREE.Color(0x5f1111), emissive: new THREE.Color(0x1d0d0d) },
  { color: new THREE.Color(0xc07d22), emissive: new THREE.Color(0x2f2210) },
]

export default function ARViewer() {
  const useAR = (import.meta.env.VITE_USE_AR ?? 'true') !== 'false'

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasHostRef = React.useRef<HTMLDivElement | null>(null)
  const arButtonHostRef = React.useRef<HTMLDivElement | null>(null)
  const styleActionRef = React.useRef<() => void>(() => undefined)
  const resetActionRef = React.useRef<() => void>(() => undefined)

  const [status, setStatus] = React.useState('状态：初始化中...')
  const [controlsEnabled, setControlsEnabled] = React.useState(false)

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

    const setModelScale = (nextScale: number) => {
      if (!placedModel) return
      const clamped = THREE.MathUtils.clamp(nextScale, 0.08, 8)
      placedModel.scale.setScalar(clamped)
    }

    const applyStyle = (index: number) => {
      if (!placedModel) return
      const palette = STYLE_PALETTES[index % STYLE_PALETTES.length]

      placedModel.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh || !mesh.material) return

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat: THREE.Material) => {
          const standard = mat as THREE.MeshStandardMaterial
          if (standard.color) standard.color.copy(palette.color)
          if (standard.emissive) standard.emissive.copy(palette.emissive)
        })
      })
    }

    const createFallbackLantern = () => {
      const rootGroup = new THREE.Group()

      const outer = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xb71818, roughness: 0.52, metalness: 0.06 })
      )
      rootGroup.add(outer)

      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.0045, 12, 100),
        new THREE.MeshStandardMaterial({ color: 0xcfa955, roughness: 0.4, metalness: 0.34 })
      )
      outerRing.rotation.x = Math.PI / 2
      rootGroup.add(outerRing)

      const lineMat = new THREE.MeshStandardMaterial({ color: 0xadb5bd, roughness: 0.26, metalness: 0.86 })
      const topLine = new THREE.Mesh(new THREE.CylinderGeometry(0.0019, 0.0019, 0.22, 8), lineMat)
      topLine.position.y = 0.2
      rootGroup.add(topLine)

      const bottomLine = topLine.clone()
      bottomLine.position.y = -0.2
      rootGroup.add(bottomLine)

      rootGroup.scale.setScalar(0.75)
      return rootGroup
    }

    const loadLanternTemplate = async () => {
      const loader = new GLTFLoader()
      const candidates = ['/models/rolling-lantern.glb', '/models/lantern.glb']

      for (const path of candidates) {
        try {
          const gltf = await loader.loadAsync(path)
          const loadedModel = gltf.scene
          loadedModel.visible = false
          scene.add(loadedModel)
          modelTemplate = loadedModel
          setSafeStatus('模型已加载，点击地面可放置')
          return
        } catch {
          continue
        }
      }

      const fallbackModel = createFallbackLantern()
      fallbackModel.visible = false
      scene.add(fallbackModel)
      modelTemplate = fallbackModel
      setSafeStatus('未找到 glb，已启用占位滚灯')
    }

    const placeModelFromReticle = () => {
      if (!reticle.visible || !modelTemplate) return

      if (placedModel) scene.remove(placedModel)

      placedModel = modelTemplate.clone(true)
      placedModel.visible = true
      placedModel.matrix.copy(reticle.matrix)
      placedModel.matrix.decompose(placedModel.position, placedModel.quaternion, placedModel.scale)
      placedModel.scale.setScalar(0.75)
      scene.add(placedModel)

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

    resetActionRef.current = () => {
      if (placedModel) {
        scene.remove(placedModel)
        placedModel = null
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
            setSafeStatus('当前设备或浏览器不支持 immersive-ar')
          }
        })
        .catch(() => {
          setSafeStatus('无法检测 WebXR 支持状态')
        })
    } else {
      setSafeStatus('浏览器不支持 WebXR')
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

    setSafeStatus('初始化完成，请点击“进入 AR”')
    setSafeControls(false)
    void loadLanternTemplate()

    return () => {
      disposed = true

      styleActionRef.current = () => undefined
      resetActionRef.current = () => undefined

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

      scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat: THREE.Material) => mat?.dispose())
      })

      renderer.dispose()
    }
  }, [useAR])

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
            <h2 className="text-sm font-semibold tracking-wide text-amber-300">滚灯 WebAR 交互</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-100/90">
              1. 点击“进入 AR”并允许摄像头权限。
              2. 移动设备找到平面，出现蓝色圆环后点击屏幕放置滚灯。
              3. 单指拖拽旋转，双指捏合或鼠标滚轮自由缩放。
            </p>

            <p className="mt-2 text-xs text-amber-100">{status}</p>

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
