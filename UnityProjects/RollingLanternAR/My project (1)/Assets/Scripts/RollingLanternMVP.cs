using UnityEngine;

[System.Serializable]
public class LanternPalette
{
    public string paletteName = "Default";
    public Color frameColor = new Color(0.95f, 0.72f, 0.20f, 1f);
    public Color innerShellColor = new Color(1f, 0.35f, 0.15f, 1f);
    public Color coreColor = new Color(1f, 0.95f, 0.75f, 1f);
}

public class RollingLanternMVP : MonoBehaviour
{
    [Header("Outer Cage")]
    [Min(0.05f)] public float outerRadius = 0.25f;
    [Min(0.001f)] public float ringTube = 0.006f;
    [Min(12)] public int bigRingSegments = 64;
    [Min(3)] public int smallRingCount = 8;
    [Min(12)] public int smallRingSegments = 40;

    [Header("Inner Rolling Ball")]
    [Min(0.02f)] public float innerRadius = 0.11f;
    public float spinRpm = 12f;
    public bool addInnerBands = true;

    [Header("Styles")]
    public LanternPalette[] palettes;
    [Min(0)] public int initialPaletteIndex = 0;

    [Header("Interaction")]
    public bool addInteractionCollider = true;
    [Min(1f)] public float interactionColliderScale = 1.05f;

    [Header("Build")]
    public bool buildOnStart = true;

    private Transform _innerRoot;
    private int _paletteIndex;
    private bool _palettesInitialized;

    public int CurrentPaletteIndex => _paletteIndex;

    private void Start()
    {
        EnsurePalettes();

        if (buildOnStart)
        {
            BuildLantern();
        }
    }

    private void Update()
    {
        if (_innerRoot == null)
        {
            return;
        }

        float degPerSecond = spinRpm * 6f;
        _innerRoot.Rotate(Vector3.up, degPerSecond * Time.deltaTime, Space.Self);
    }

    [ContextMenu("Rebuild Lantern")]
    public void BuildLantern()
    {
        EnsurePalettes();

        ClearChildren();

        Material frameMat = CreateMaterial(palettes[_paletteIndex].frameColor);
        Material shellMat = CreateMaterial(palettes[_paletteIndex].innerShellColor);
        Material coreMat = CreateMaterial(palettes[_paletteIndex].coreColor);

        Transform frame = new GameObject("OuterFrame").transform;
        frame.SetParent(transform, false);

        CreateRing(frame, outerRadius, ringTube, bigRingSegments, Vector3.zero, Quaternion.identity, "BigRing_XY", frameMat);
        CreateRing(frame, outerRadius, ringTube, bigRingSegments, Vector3.zero, Quaternion.Euler(90f, 0f, 0f), "BigRing_XZ", frameMat);
        CreateRing(frame, outerRadius, ringTube, bigRingSegments, Vector3.zero, Quaternion.Euler(0f, 90f, 0f), "BigRing_YZ", frameMat);

        float smallRadius = outerRadius * 0.33f;
        float orbitRadius = outerRadius * 0.62f;

        for (int i = 0; i < smallRingCount; i++)
        {
            float angle = i * Mathf.PI * 2f / smallRingCount;
            Vector3 center = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * orbitRadius;
            Quaternion rot = Quaternion.FromToRotation(Vector3.forward, center.normalized);

            CreateRing(frame, smallRadius, ringTube * 0.9f, smallRingSegments, center, rot, $"SmallRing_{i}", frameMat);
        }

        _innerRoot = new GameObject("InnerRollingBall").transform;
        _innerRoot.SetParent(transform, false);

        GameObject shell = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        shell.name = "Shell";
        shell.transform.SetParent(_innerRoot, false);
        shell.transform.localScale = Vector3.one * (innerRadius * 2f);
        RemoveCollider(shell);
        shell.GetComponent<Renderer>().material = shellMat;

        GameObject core = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        core.name = "Core";
        core.transform.SetParent(_innerRoot, false);
        core.transform.localScale = Vector3.one * (innerRadius * 1.05f);
        RemoveCollider(core);
        core.GetComponent<Renderer>().material = coreMat;

        if (addInnerBands)
        {
            int bandSegments = Mathf.Max(16, smallRingSegments / 2);
            float bandRadius = innerRadius * 0.88f;
            float bandTube = Mathf.Max(0.0015f, ringTube * 0.45f);
            CreateRing(_innerRoot, bandRadius, bandTube, bandSegments, Vector3.zero, Quaternion.Euler(90f, 0f, 0f), "InnerBand_XZ", frameMat);
            CreateRing(_innerRoot, bandRadius, bandTube, bandSegments, Vector3.zero, Quaternion.Euler(0f, 90f, 0f), "InnerBand_YZ", frameMat);
        }

        UpdateInteractionCollider();
    }

    public void SetSpinRpm(float rpm)
    {
        spinRpm = Mathf.Max(0f, rpm);
    }

    public void NextPalette()
    {
        EnsurePalettes();
        int next = (_paletteIndex + 1) % palettes.Length;
        ApplyPalette(next, true);
    }

    public void ApplyPalette(int index, bool rebuild)
    {
        EnsurePalettes();
        _paletteIndex = Mathf.Clamp(index, 0, palettes.Length - 1);

        if (rebuild)
        {
            BuildLantern();
        }
    }

    private void EnsurePalettes()
    {
        if (palettes == null || palettes.Length == 0)
        {
            palettes = new[]
            {
                new LanternPalette
                {
                    paletteName = "Gold-Red",
                    frameColor = new Color(0.95f, 0.72f, 0.20f, 1f),
                    innerShellColor = new Color(1f, 0.35f, 0.15f, 1f),
                    coreColor = new Color(1f, 0.95f, 0.75f, 1f)
                },
                new LanternPalette
                {
                    paletteName = "Jade-White",
                    frameColor = new Color(0.34f, 0.78f, 0.58f, 1f),
                    innerShellColor = new Color(0.90f, 0.96f, 0.90f, 1f),
                    coreColor = new Color(1f, 1f, 0.94f, 1f)
                },
                new LanternPalette
                {
                    paletteName = "Night-Blue",
                    frameColor = new Color(0.33f, 0.53f, 0.93f, 1f),
                    innerShellColor = new Color(0.24f, 0.29f, 0.56f, 1f),
                    coreColor = new Color(0.84f, 0.92f, 1f, 1f)
                }
            };
        }

        if (!_palettesInitialized)
        {
            _paletteIndex = Mathf.Clamp(initialPaletteIndex, 0, palettes.Length - 1);
            _palettesInitialized = true;
        }
        else
        {
            _paletteIndex = Mathf.Clamp(_paletteIndex, 0, palettes.Length - 1);
        }
    }

    private void UpdateInteractionCollider()
    {
        if (!addInteractionCollider)
        {
            SphereCollider existingCollider = GetComponent<SphereCollider>();
            if (existingCollider != null)
            {
                DestroySafe(existingCollider);
            }
            return;
        }

        SphereCollider sphereCollider = GetComponent<SphereCollider>();
        if (sphereCollider == null)
        {
            sphereCollider = gameObject.AddComponent<SphereCollider>();
        }

        sphereCollider.center = Vector3.zero;
        sphereCollider.radius = outerRadius * interactionColliderScale;
    }

    private void ClearChildren()
    {
        for (int i = transform.childCount - 1; i >= 0; i--)
        {
            DestroySafe(transform.GetChild(i).gameObject);
        }

        _innerRoot = null;
    }

    private void CreateRing(
        Transform parent,
        float radius,
        float tube,
        int segments,
        Vector3 localPos,
        Quaternion localRot,
        string ringName,
        Material ringMaterial)
    {
        Transform ring = new GameObject(ringName).transform;
        ring.SetParent(parent, false);
        ring.localPosition = localPos;
        ring.localRotation = localRot;

        for (int i = 0; i < segments; i++)
        {
            float a0 = i * Mathf.PI * 2f / segments;
            float a1 = (i + 1) * Mathf.PI * 2f / segments;

            Vector3 p0 = new Vector3(Mathf.Cos(a0) * radius, Mathf.Sin(a0) * radius, 0f);
            Vector3 p1 = new Vector3(Mathf.Cos(a1) * radius, Mathf.Sin(a1) * radius, 0f);

            Vector3 dir = p1 - p0;
            Vector3 mid = (p0 + p1) * 0.5f;
            float len = dir.magnitude;

            GameObject segment = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            segment.name = $"Seg_{i}";
            segment.transform.SetParent(ring, false);
            segment.transform.localPosition = mid;
            segment.transform.localRotation = Quaternion.FromToRotation(Vector3.up, dir.normalized);
            segment.transform.localScale = new Vector3(tube, len * 0.5f, tube);
            RemoveCollider(segment);
            segment.GetComponent<Renderer>().material = ringMaterial;
        }
    }

    private static Material CreateMaterial(Color color)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null)
        {
            shader = Shader.Find("Standard");
        }

        Material material = new Material(shader);
        material.color = color;
        return material;
    }

    private static void RemoveCollider(GameObject target)
    {
        Collider collider = target.GetComponent<Collider>();
        if (collider != null)
        {
            DestroySafe(collider);
        }
    }

    private static void DestroySafe(Object obj)
    {
        if (obj == null)
        {
            return;
        }

        if (Application.isPlaying)
        {
            Destroy(obj);
        }
        else
        {
            DestroyImmediate(obj);
        }
    }
}
