using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

[RequireComponent(typeof(ARRaycastManager))]
public class ARTapToPlaceRollingLantern : MonoBehaviour
{
    [Header("References")]
    public ARPlaneManager planeManager;
    public Camera arCamera;
    public RollingLanternMVP rollingLanternPrefab;

    [Header("Placement")]
    public bool placeOnlyOnce = true;
    public bool hideDetectedPlanesAfterPlace = true;
    [Min(0f)] public float yOffset = 0.02f;

    [Header("Interaction")]
    public bool tapLanternToCycleStyle = true;
    [Min(0.5f)] public float tapRayDistance = 5f;

    private ARRaycastManager _raycastManager;
    private RollingLanternMVP _spawnedLantern;
    private static readonly List<ARRaycastHit> Hits = new List<ARRaycastHit>();

    public event Action<RollingLanternMVP> LanternPlaced;

    public RollingLanternMVP CurrentLantern => _spawnedLantern;

    private void Awake()
    {
        _raycastManager = GetComponent<ARRaycastManager>();

        if (arCamera == null)
        {
            arCamera = Camera.main;
        }
    }

    private void Update()
    {
        if (!TryGetScreenPressPosition(out Vector2 screenPos))
        {
            return;
        }

        if (_spawnedLantern != null && tapLanternToCycleStyle && IsTapOnLantern(screenPos))
        {
            _spawnedLantern.NextPalette();
            return;
        }

        if (!_raycastManager.Raycast(screenPos, Hits, TrackableType.PlaneWithinPolygon))
        {
            return;
        }

        Pose hitPose = Hits[0].pose;
        Vector3 placePos = hitPose.position + Vector3.up * yOffset;

        float yaw = 0f;
        if (arCamera != null)
        {
            yaw = arCamera.transform.eulerAngles.y;
        }
        Quaternion placeRot = Quaternion.Euler(0f, yaw, 0f);

        if (_spawnedLantern == null)
        {
            _spawnedLantern = SpawnLantern(placePos, placeRot);

            if (hideDetectedPlanesAfterPlace)
            {
                SetPlanesVisible(false);
            }

            LanternPlaced?.Invoke(_spawnedLantern);
        }
        else if (!placeOnlyOnce)
        {
            _spawnedLantern.transform.SetPositionAndRotation(placePos, placeRot);
        }
    }

    public void ClearPlacedLantern()
    {
        if (_spawnedLantern == null)
        {
            return;
        }

        Destroy(_spawnedLantern.gameObject);
        _spawnedLantern = null;
        SetPlanesVisible(true);
    }

    private RollingLanternMVP SpawnLantern(Vector3 position, Quaternion rotation)
    {
        RollingLanternMVP lantern;

        if (rollingLanternPrefab != null)
        {
            lantern = Instantiate(rollingLanternPrefab, position, rotation);
        }
        else
        {
            GameObject lanternRoot = new GameObject("RollingLantern");
            lanternRoot.transform.SetPositionAndRotation(position, rotation);
            lantern = lanternRoot.AddComponent<RollingLanternMVP>();
            lantern.buildOnStart = false;
            lantern.BuildLantern();
        }

        return lantern;
    }

    private bool IsTapOnLantern(Vector2 screenPos)
    {
        if (arCamera == null || _spawnedLantern == null)
        {
            return false;
        }

        Ray ray = arCamera.ScreenPointToRay(screenPos);
        if (!Physics.Raycast(ray, out RaycastHit hit, tapRayDistance))
        {
            return false;
        }

        return hit.transform != null && hit.transform.IsChildOf(_spawnedLantern.transform);
    }

    private bool TryGetScreenPressPosition(out Vector2 pos)
    {
#if UNITY_EDITOR
        if (Input.GetMouseButtonDown(0))
        {
            pos = Input.mousePosition;
            return true;
        }
#endif

        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            if (touch.phase == TouchPhase.Began)
            {
                pos = touch.position;
                return true;
            }
        }

        pos = default;
        return false;
    }

    private void SetPlanesVisible(bool visible)
    {
        if (planeManager == null)
        {
            return;
        }

        planeManager.enabled = visible;

        foreach (ARPlane plane in planeManager.trackables)
        {
            plane.gameObject.SetActive(visible);
        }
    }
}
