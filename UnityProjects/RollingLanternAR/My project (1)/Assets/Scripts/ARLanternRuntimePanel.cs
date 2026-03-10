using UnityEngine;

public class ARLanternRuntimePanel : MonoBehaviour
{
    [Header("Reference")]
    public ARTapToPlaceRollingLantern placementController;

    [Header("UI")]
    public bool showPanel = true;
    [Min(0f)] public float minRpm = 0f;
    [Min(1f)] public float maxRpm = 30f;

    private Rect _panelRect = new Rect(20f, 20f, 320f, 190f);
    private RollingLanternMVP _lastLantern;
    private float _rpm = 12f;

    private void Awake()
    {
        if (placementController == null)
        {
            placementController = FindObjectOfType<ARTapToPlaceRollingLantern>();
        }
    }

    private void OnGUI()
    {
        if (!showPanel)
        {
            return;
        }

        RollingLanternMVP lantern = placementController != null ? placementController.CurrentLantern : null;
        if (lantern != _lastLantern)
        {
            _lastLantern = lantern;
            if (lantern != null)
            {
                _rpm = lantern.spinRpm;
            }
        }

        GUILayout.BeginArea(_panelRect, GUI.skin.box);
        GUILayout.Label("Rolling Lantern Controls");
        GUILayout.Space(4f);

        if (lantern == null)
        {
            GUILayout.Label("Status: tap detected plane to place lantern");
        }
        else
        {
            GUILayout.Label("Status: lantern placed");
        }

        GUI.enabled = lantern != null;

        GUILayout.Space(8f);
        GUILayout.Label($"Spin RPM: {_rpm:0.0}");

        float clampedMax = Mathf.Max(minRpm + 0.01f, maxRpm);
        float nextRpm = GUILayout.HorizontalSlider(_rpm, minRpm, clampedMax);
        if (lantern != null && Mathf.Abs(nextRpm - _rpm) > 0.001f)
        {
            _rpm = nextRpm;
            lantern.SetSpinRpm(_rpm);
        }

        GUILayout.Space(8f);
        if (GUILayout.Button("Next Style"))
        {
            lantern.NextPalette();
        }

        GUI.enabled = placementController != null;
        if (GUILayout.Button("Reset Placement"))
        {
            placementController.ClearPlacedLantern();
            _lastLantern = null;
        }

        GUI.enabled = true;
        GUILayout.EndArea();
    }
}
