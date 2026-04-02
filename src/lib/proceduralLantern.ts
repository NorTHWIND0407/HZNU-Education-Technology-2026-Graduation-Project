import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type LanternScaleType = 'small' | 'medium' | 'large'
export type LanternStyleType = 'wen' | 'wu'
export type LanternSuspensionType = 'singleAxis' | 'dualAxis' | 'gimbal'
export type LanternCoverType = 'bareBamboo' | 'paper' | 'cloth'
export type LanternLightType = 'candle' | 'led'

export type LanternPalette = {
  name: string
  frameColor: THREE.ColorRepresentation
  innerShellColor: THREE.ColorRepresentation
  coreColor: THREE.ColorRepresentation
}

export type ProceduralLanternOptions = {
  scaleType?: LanternScaleType
  styleType?: LanternStyleType
  suspensionType?: LanternSuspensionType
  coverType?: LanternCoverType
  lightType?: LanternLightType
  overallScale?: number
  arcSegments?: number
  cageIrregularity?: number
  ribTiltDegrees?: number
  chainWeight?: number
  suspensionOffset?: number
  showSuspensionFrame?: boolean
  addDualTractionLines?: boolean
  addInnerSupportRing?: boolean
  addPointLight?: boolean
  initialPaletteIndex?: number
  palettes?: LanternPalette[]
}

type ResolvedOptions = Required<Omit<ProceduralLanternOptions, 'palettes'>> & {
  palettes: LanternPalette[]
}

type ResolvedColors = {
  frameColor: THREE.Color
  shellColor: THREE.Color
  coreColor: THREE.Color
  chainColor: THREE.Color
  wireColor: THREE.Color
}

const UP = new THREE.Vector3(0, 1, 0)
const RIGHT = new THREE.Vector3(1, 0, 0)
const FORWARD = new THREE.Vector3(0, 0, 1)
const UNIT_SCALE = new THREE.Vector3(1, 1, 1)
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const UNIT_CAPSULE = new THREE.CapsuleGeometry(1, 1, 6, 10)

const DEFAULT_PALETTES: LanternPalette[] = [
  {
    name: 'Gold-Red',
    frameColor: 0xebba29,
    innerShellColor: 0xe01419,
    coreColor: 0xff6b38,
  },
  {
    name: 'Amber-Crimson',
    frameColor: 0xd18426,
    innerShellColor: 0xc61512,
    coreColor: 0xff8754,
  },
  {
    name: 'Black-Garnet',
    frameColor: 0x554d47,
    innerShellColor: 0x9b0f12,
    coreColor: 0xff7549,
  },
]

function colorOf(value: THREE.ColorRepresentation) {
  return new THREE.Color(value)
}

function clampIndex(index: number, length: number) {
  return THREE.MathUtils.clamp(index, 0, Math.max(0, length - 1))
}

function hash01(seed: number) {
  return THREE.MathUtils.euclideanModulo(Math.sin(seed * 12.9898 + 78.233) * 43758.5453, 1)
}

function signedHash(seed: number) {
  return hash01(seed) * 2 - 1
}

function safeNormalize(input: THREE.Vector3) {
  const vector = input.clone()
  return vector.lengthSq() <= 1e-6 ? new THREE.Vector3() : vector.normalize()
}

function createStandardMaterial(color: THREE.ColorRepresentation, metalness: number, roughness: number) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  })
}

function resolveOptions(input: ProceduralLanternOptions = {}): ResolvedOptions {
  return {
    scaleType: input.scaleType ?? 'large',
    styleType: input.styleType ?? 'wen',
    suspensionType: input.suspensionType ?? 'dualAxis',
    coverType: input.coverType ?? 'cloth',
    lightType: input.lightType ?? 'led',
    overallScale: input.overallScale ?? 1,
    arcSegments: Math.max(12, input.arcSegments ?? 22),
    cageIrregularity: THREE.MathUtils.clamp(input.cageIrregularity ?? 0, 0, 0.12),
    ribTiltDegrees: THREE.MathUtils.clamp(input.ribTiltDegrees ?? 16, 0, 35),
    chainWeight: THREE.MathUtils.clamp(input.chainWeight ?? 0, 0, 50),
    suspensionOffset: THREE.MathUtils.clamp(input.suspensionOffset ?? 0, 0, 0.08),
    showSuspensionFrame: input.showSuspensionFrame ?? false,
    addDualTractionLines: input.addDualTractionLines ?? true,
    addInnerSupportRing: input.addInnerSupportRing ?? true,
    addPointLight: input.addPointLight ?? true,
    initialPaletteIndex: Math.max(0, input.initialPaletteIndex ?? 0),
    palettes: input.palettes && input.palettes.length > 0 ? input.palettes : DEFAULT_PALETTES,
  }
}

function resolveScalePreset(scaleType: LanternScaleType, styleType: LanternStyleType) {
  if (scaleType === 'small') {
    return { outerDiameter: 0.36, innerDiameter: 0.12, equatorBands: 3 }
  }

  if (scaleType === 'medium') {
    return { outerDiameter: 0.72, innerDiameter: 0.23, equatorBands: 3 }
  }

  const outerDiameter = styleType === 'wu' ? 1.5 : 1.2
  return { outerDiameter, innerDiameter: outerDiameter * 0.32, equatorBands: 4 }
}

function resolveStyleColors(
  palette: LanternPalette,
  styleType: LanternStyleType,
  coverType: LanternCoverType
): ResolvedColors {
  let frameColor = colorOf(palette.frameColor)
  let shellColor = colorOf(palette.innerShellColor)
  let coreColor = colorOf(palette.coreColor)
  let chainColor = new THREE.Color(0x48484d)

  if (styleType === 'wen') {
    frameColor.lerp(new THREE.Color(0xdbb444), 0.25)
    shellColor.lerp(new THREE.Color(0xd91a1a), 0.2)
    coreColor.lerp(new THREE.Color(0xff6f49), 0.15)
  } else {
    frameColor.lerp(new THREE.Color(0x392f25), 0.58)
    shellColor.lerp(new THREE.Color(0x8c1313), 0.42)
    coreColor.lerp(new THREE.Color(0xe5483f), 0.3)
    chainColor = new THREE.Color(0x383838)
  }

  if (coverType === 'paper') {
    shellColor.lerp(new THREE.Color(0xf2ca9e), 0.22)
  }

  return {
    frameColor,
    shellColor,
    coreColor,
    chainColor,
    wireColor: new THREE.Color(0x3d3d42),
  }
}

function createRibGeometry(start: THREE.Vector3, end: THREE.Vector3, width: number, thickness: number) {
  const direction = end.clone().sub(start)
  const length = direction.length()
  if (length <= 1e-4) return null

  const midpoint = start.clone().add(end).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
  const geometry = UNIT_BOX.clone()
  geometry.applyMatrix4(
    new THREE.Matrix4().compose(midpoint, quaternion, new THREE.Vector3(width, length, thickness))
  )
  return geometry
}

function createCapsuleGeometry(
  center: THREE.Vector3,
  direction: THREE.Vector3,
  radius: number,
  halfHeight: number
) {
  const tangent = safeNormalize(direction)
  if (tangent.lengthSq() <= 1e-6) return null

  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, tangent)
  const geometry = UNIT_CAPSULE.clone()
  geometry.applyMatrix4(
    new THREE.Matrix4().compose(
      center,
      quaternion,
      new THREE.Vector3(radius * 1.2, halfHeight * 0.8, radius * 1.2)
    )
  )
  return geometry
}

function pushGreatCircleGeometries(
  target: THREE.BufferGeometry[],
  radius: number,
  normal: THREE.Vector3,
  width: number,
  thickness: number,
  segments: number,
  cageIrregularity: number
) {
  const n = safeNormalize(normal)
  const stableNormal = n.lengthSq() <= 1e-6 ? UP.clone() : n
  let tangentA = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, UP))
  if (tangentA.lengthSq() <= 1e-6) {
    tangentA = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, RIGHT))
  }
  const tangentB = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, tangentA))

  for (let index = 0; index < segments; index += 1) {
    const angle0 = (index / segments) * Math.PI * 2
    const angle1 = ((index + 1) / segments) * Math.PI * 2
    const point0 = tangentA
      .clone()
      .multiplyScalar(Math.cos(angle0))
      .add(tangentB.clone().multiplyScalar(Math.sin(angle0)))
      .multiplyScalar(radius)
    const point1 = tangentA
      .clone()
      .multiplyScalar(Math.cos(angle1))
      .add(tangentB.clone().multiplyScalar(Math.sin(angle1)))
      .multiplyScalar(radius)

    if (cageIrregularity > 0) {
      point0.multiplyScalar(1 + signedHash(index * 1.73 + radius * 19.7) * cageIrregularity * 0.15)
      point1.multiplyScalar(1 + signedHash((index + 1) * 1.73 + radius * 19.7) * cageIrregularity * 0.15)
    }

    const geometry = createRibGeometry(point0, point1, width, thickness)
    if (geometry) target.push(geometry)
  }
}

function pushOffsetRingGeometries(
  target: THREE.BufferGeometry[],
  sphereRadius: number,
  axis: THREE.Vector3,
  offset: number,
  width: number,
  thickness: number,
  segments: number
) {
  const ringRadiusSquared = sphereRadius * sphereRadius - offset * offset
  if (ringRadiusSquared <= 1e-6) return

  const up = safeNormalize(axis)
  const rotation = new THREE.Quaternion().setFromUnitVectors(UP, up.lengthSq() <= 1e-6 ? UP : up)
  const ringRadius = Math.sqrt(ringRadiusSquared)

  for (let index = 0; index < segments; index += 1) {
    const angle0 = (index / segments) * Math.PI * 2
    const angle1 = ((index + 1) / segments) * Math.PI * 2
    const local0 = new THREE.Vector3(Math.cos(angle0) * ringRadius, offset, Math.sin(angle0) * ringRadius)
    const local1 = new THREE.Vector3(Math.cos(angle1) * ringRadius, offset, Math.sin(angle1) * ringRadius)
    const point0 = local0.applyQuaternion(rotation)
    const point1 = local1.applyQuaternion(rotation)
    const geometry = createRibGeometry(point0, point1, width, thickness)
    if (geometry) target.push(geometry)
  }
}

function pushChainOrbitGeometries(
  target: THREE.BufferGeometry[],
  radius: number,
  normal: THREE.Vector3,
  links: number,
  linkRadius: number
) {
  const n = safeNormalize(normal)
  const stableNormal = n.lengthSq() <= 1e-6 ? UP.clone() : n
  let tangentA = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, UP))
  if (tangentA.lengthSq() <= 1e-6) {
    tangentA = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, RIGHT))
  }
  const tangentB = safeNormalize(new THREE.Vector3().crossVectors(stableNormal, tangentA))

  for (let index = 0; index < links; index += 1) {
    const angle = (index / links) * Math.PI * 2
    const center = tangentA
      .clone()
      .multiplyScalar(Math.cos(angle))
      .add(tangentB.clone().multiplyScalar(Math.sin(angle)))
      .multiplyScalar(radius)
    const tangent = tangentA
      .clone()
      .multiplyScalar(-Math.sin(angle))
      .add(tangentB.clone().multiplyScalar(Math.cos(angle)))
      .normalize()
    const geometry = createCapsuleGeometry(center, tangent, linkRadius, linkRadius)
    if (geometry) target.push(geometry)
  }
}

function getOuterRibNormal(ribIndex: number, ribTiltDegrees: number) {
  if (ribIndex < 2) {
    return RIGHT.clone().applyAxisAngle(UP, THREE.MathUtils.degToRad(ribIndex * 90))
  }

  const starPoints = 5
  const weavedIndex = ribIndex - 2
  const starIndex = weavedIndex % starPoints
  const familyIndex = Math.floor(weavedIndex / starPoints)
  const pentagramOrder = (starIndex * 2) % starPoints

  let yaw = pentagramOrder * 72
  if (familyIndex % 2 === 1) {
    yaw += 36
  }

  const baseTilt = THREE.MathUtils.clamp(58 + ribTiltDegrees * 0.25, 46, 72)
  const mirroredFamilyIndex = Math.floor(familyIndex / 2)
  const familyTilt = Math.max(18, baseTilt - mirroredFamilyIndex * 5)
  const signedTilt = familyIndex % 2 === 0 ? familyTilt : -familyTilt

  const vector = UP.clone()
    .applyAxisAngle(RIGHT, THREE.MathUtils.degToRad(signedTilt))
    .applyAxisAngle(UP, THREE.MathUtils.degToRad(yaw))

  return safeNormalize(vector)
}

function getBandOffset(index: number, totalBands: number, maxOffset: number) {
  if (totalBands <= 2) {
    return index === 0 ? -maxOffset : maxOffset
  }

  if (totalBands === 3) {
    if (index === 0) return -maxOffset
    if (index === 1) return 0
    return maxOffset
  }

  const near = maxOffset * 0.32
  if (index === 0) return -maxOffset
  if (index === 1) return -near
  if (index === 2) return near
  return maxOffset
}

function buildSuspensionOffset(outerDiameter: number, innerDiameter: number, suspensionOffset: number) {
  if (suspensionOffset <= 0) return new THREE.Vector3()

  const x = signedHash(outerDiameter * 17.31 + 12 * 2.31)
  const z = signedHash(innerDiameter * 29.17 + 6 * 1.17)
  return new THREE.Vector3(x, 0, z).normalize().multiplyScalar(suspensionOffset)
}

function createMergedMesh(
  geometries: THREE.BufferGeometry[],
  material: THREE.Material,
  role: string,
  name: string
) {
  if (geometries.length === 0) return null
  const merged = mergeGeometries(geometries, false)
  if (!merged) return null
  const mesh = new THREE.Mesh(merged, material)
  mesh.name = name
  mesh.userData.lanternRole = role
  mesh.castShadow = false
  mesh.receiveShadow = false
  return mesh
}

export function createProceduralLantern(input: ProceduralLanternOptions = {}) {
  const options = resolveOptions(input)
  const paletteIndex = clampIndex(options.initialPaletteIndex, options.palettes.length)
  const palette = options.palettes[paletteIndex]
  const { outerDiameter, innerDiameter, equatorBands } = resolveScalePreset(options.scaleType, options.styleType)
  const outerRadius = outerDiameter * 0.5
  const innerRadius = innerDiameter * 0.5
  const ribWidth = Math.max(0.002, outerDiameter * 0.0067)
  const ribThickness = THREE.MathUtils.clamp(ribWidth * 0.5, 0.001, ribWidth)
  const colors = resolveStyleColors(palette, options.styleType, options.coverType)

  const root = new THREE.Group()
  root.name = 'RollingLanternProcedural'
  root.userData.lanternKind = 'procedural'
  root.userData.lanternPaletteIndex = paletteIndex
  root.userData.lanternStyleType = options.styleType
  root.userData.lanternCoverType = options.coverType
  root.userData.lanternPalettes = options.palettes

  const outerRoot = new THREE.Group()
  outerRoot.name = 'OuterLantern'
  root.add(outerRoot)

  const outerFrameGeometries: THREE.BufferGeometry[] = []
  const outerChainGeometries: THREE.BufferGeometry[] = []
  for (let index = 0; index < 12; index += 1) {
    pushGreatCircleGeometries(
      outerFrameGeometries,
      outerRadius,
      getOuterRibNormal(index, options.ribTiltDegrees),
      ribWidth,
      ribThickness,
      options.arcSegments,
      options.cageIrregularity
    )
  }

  for (let index = 0; index < equatorBands; index += 1) {
    pushOffsetRingGeometries(
      outerFrameGeometries,
      outerRadius,
      UP,
      getBandOffset(index, equatorBands, outerRadius * 0.52),
      ribWidth,
      ribThickness * 0.95,
      options.arcSegments
    )
  }

  if (options.styleType === 'wu' && options.chainWeight > 0) {
    const links = THREE.MathUtils.clamp(10 + Math.round(options.chainWeight * 0.6), 10, 80)
    const linkRadius = THREE.MathUtils.lerp(0.004, 0.013, THREE.MathUtils.clamp(options.chainWeight / 50, 0, 1))
    const ringRadius = outerRadius * 0.93
    pushChainOrbitGeometries(outerChainGeometries, ringRadius, RIGHT, links, linkRadius)
    pushChainOrbitGeometries(outerChainGeometries, ringRadius, FORWARD, links, linkRadius)
    pushChainOrbitGeometries(
      outerChainGeometries,
      ringRadius,
      new THREE.Vector3(1, 1, 0).normalize(),
      links,
      linkRadius
    )
  }

  const frameMaterial = createStandardMaterial(colors.frameColor, 0.1, 0.7)
  const chainMaterial = createStandardMaterial(colors.chainColor, 0.58, 0.38)
  const wireMaterial = createStandardMaterial(colors.wireColor, 0.75, 0.7)
  const shellMaterial = createStandardMaterial(colors.shellColor, 0.02, 0.65)
  const coreMaterial = createStandardMaterial(colors.coreColor, 0.05, 0.55)
  shellMaterial.emissive.copy(colors.shellColor).multiplyScalar(0.12)
  shellMaterial.emissiveIntensity = 0.18
  coreMaterial.emissive.copy(colors.coreColor).multiplyScalar(0.38)
  coreMaterial.emissiveIntensity = 0.7

  const outerMesh = createMergedMesh(outerFrameGeometries, frameMaterial, 'frame', 'OuterFrame')
  if (outerMesh) outerRoot.add(outerMesh)

  const chainMesh = createMergedMesh(outerChainGeometries, chainMaterial, 'chain', 'OuterChains')
  if (chainMesh) outerRoot.add(chainMesh)

  const suspensionRoot = new THREE.Group()
  suspensionRoot.name = 'Suspension'
  suspensionRoot.position.copy(buildSuspensionOffset(outerDiameter, innerDiameter, options.suspensionOffset))
  root.add(suspensionRoot)

  const suspensionFrameGeometries: THREE.BufferGeometry[] = []
  const topY = outerRadius * 0.78
  const bottomY = -topY
  const supportWidth = ribWidth * 0.72
  const supportThickness = ribThickness * 0.75
  const anchorRadius = Math.max(innerRadius * 1.18, ribWidth * 4)

  if (options.showSuspensionFrame) {
    if (options.suspensionType === 'singleAxis') {
      const top = createRibGeometry(new THREE.Vector3(0, topY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness)
      const bottom = createRibGeometry(new THREE.Vector3(0, bottomY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness)
      if (top) suspensionFrameGeometries.push(top)
      if (bottom) suspensionFrameGeometries.push(bottom)
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius,
        RIGHT,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
    } else if (options.suspensionType === 'dualAxis') {
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius * 1.05,
        RIGHT,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius * 0.9,
        FORWARD,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
      const ribs = [
        createRibGeometry(new THREE.Vector3(0, topY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
        createRibGeometry(new THREE.Vector3(0, bottomY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
        createRibGeometry(new THREE.Vector3(outerRadius * 0.75, 0, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
        createRibGeometry(new THREE.Vector3(-outerRadius * 0.75, 0, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
      ]
      ribs.forEach((geometry) => {
        if (geometry) suspensionFrameGeometries.push(geometry)
      })
    } else {
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius * 1.15,
        UP,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius,
        RIGHT,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
      pushGreatCircleGeometries(
        suspensionFrameGeometries,
        anchorRadius * 0.86,
        FORWARD,
        supportWidth,
        supportThickness,
        Math.max(16, Math.floor(options.arcSegments / 2)),
        0
      )
      const ribs = [
        createRibGeometry(new THREE.Vector3(0, topY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
        createRibGeometry(new THREE.Vector3(0, bottomY, 0), new THREE.Vector3(0, 0, 0), supportWidth, supportThickness),
      ]
      ribs.forEach((geometry) => {
        if (geometry) suspensionFrameGeometries.push(geometry)
      })
    }
  }

  const suspensionMesh = createMergedMesh(suspensionFrameGeometries, frameMaterial.clone(), 'frame', 'SuspensionFrame')
  if (suspensionMesh) suspensionRoot.add(suspensionMesh)

  const suspensionPivot = new THREE.Group()
  suspensionPivot.name = 'Pivot'
  suspensionRoot.add(suspensionPivot)

  const innerRoot = new THREE.Group()
  innerRoot.name = 'InnerLamp'
  suspensionPivot.add(innerRoot)

  const innerFrameGeometries: THREE.BufferGeometry[] = []
  const innerWireGeometries: THREE.BufferGeometry[] = []
  const lampSphereRadius = innerDiameter * 0.58 * 0.5

  if (options.addInnerSupportRing) {
    pushGreatCircleGeometries(
      innerFrameGeometries,
      innerRadius * 0.92,
      FORWARD,
      ribWidth * 0.72,
      ribThickness * 0.72,
      Math.max(16, Math.floor(options.arcSegments / 2)),
      0
    )
  }

  if (options.addDualTractionLines) {
    const topLine = createRibGeometry(
      new THREE.Vector3(0, outerRadius, 0),
      new THREE.Vector3(0, lampSphereRadius, 0),
      Math.max(0.0005, ribWidth * 0.28),
      Math.max(0.0005, ribThickness * 0.55)
    )
    const bottomLine = createRibGeometry(
      new THREE.Vector3(0, -outerRadius, 0),
      new THREE.Vector3(0, -lampSphereRadius, 0),
      Math.max(0.0005, ribWidth * 0.28),
      Math.max(0.0005, ribThickness * 0.55)
    )
    if (topLine) innerWireGeometries.push(topLine)
    if (bottomLine) innerWireGeometries.push(bottomLine)
  }

  const innerFrameMesh = createMergedMesh(innerFrameGeometries, frameMaterial.clone(), 'frame', 'InnerSupport')
  if (innerFrameMesh) innerRoot.add(innerFrameMesh)

  const wireMesh = createMergedMesh(innerWireGeometries, wireMaterial, 'wire', 'TractionLines')
  if (wireMesh) innerRoot.add(wireMesh)

  const lampSphere = new THREE.Mesh(
    new THREE.SphereGeometry(lampSphereRadius, 28, 28),
    options.coverType === 'paper' ? shellMaterial : coreMaterial
  )
  lampSphere.name = 'LampSphere'
  lampSphere.userData.lanternRole = options.coverType === 'paper' ? 'shell' : 'core'
  innerRoot.add(lampSphere)

  if (options.addPointLight) {
    const pointLight = new THREE.PointLight(
      colors.coreColor,
      options.lightType === 'candle' ? 1.65 : 1.85,
      options.lightType === 'candle' ? 0.85 : 1.05
    )
    pointLight.name = 'InnerLight'
    pointLight.userData.lanternRole = 'light'
    innerRoot.add(pointLight)
  }

  root.scale.copy(UNIT_SCALE).multiplyScalar(Math.max(0.1, options.overallScale))
  return root
}

export function applyProceduralLanternPalette(
  target: THREE.Object3D,
  paletteIndex: number,
  nextStyleType?: LanternStyleType,
  nextCoverType?: LanternCoverType
) {
  const palettes = Array.isArray(target.userData.lanternPalettes) && target.userData.lanternPalettes.length > 0
    ? (target.userData.lanternPalettes as LanternPalette[])
    : DEFAULT_PALETTES
  const index = clampIndex(paletteIndex, palettes.length)
  const styleType = nextStyleType ?? (target.userData.lanternStyleType as LanternStyleType) ?? 'wen'
  const coverType = nextCoverType ?? (target.userData.lanternCoverType as LanternCoverType) ?? 'cloth'
  const colors = resolveStyleColors(palettes[index], styleType, coverType)

  target.userData.lanternPaletteIndex = index
  target.userData.lanternStyleType = styleType
  target.userData.lanternCoverType = coverType

  target.traverse((object) => {
    if ((object as THREE.PointLight).isPointLight) {
      const light = object as THREE.PointLight
      light.color.copy(colors.coreColor)
      return
    }

    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return

    const role = (mesh.userData.lanternRole as string | undefined) ?? 'frame'
    const materialColor =
      role === 'shell'
        ? colors.shellColor
        : role === 'core'
          ? colors.coreColor
          : role === 'chain'
            ? colors.chainColor
            : role === 'wire'
              ? colors.wireColor
              : colors.frameColor

    const emissiveColor =
      role === 'shell'
        ? colors.shellColor.clone().multiplyScalar(0.12)
        : role === 'core'
          ? colors.coreColor.clone().multiplyScalar(0.38)
          : new THREE.Color(0x000000)

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      const standard = material as THREE.MeshStandardMaterial
      if (standard.color) standard.color.copy(materialColor)
      if (standard.emissive) standard.emissive.copy(emissiveColor)
      if ('emissiveIntensity' in standard) {
        standard.emissiveIntensity = role === 'core' ? 0.7 : role === 'shell' ? 0.18 : 0
      }
    })
  })
}

export const proceduralLanternPalettes = DEFAULT_PALETTES
