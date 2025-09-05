// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using CefSharp;
using NLog;
using SharpDX;
using SharpDX.Direct3D11;
using SharpDX.DXGI;
using Valve.VR;
using Device = SharpDX.Direct3D11.Device;
using Device1 = SharpDX.Direct3D11.Device1;
using Device2 = SharpDX.Direct3D11.Device2;
using Device3 = SharpDX.Direct3D11.Device3;
using Device4 = SharpDX.Direct3D11.Device4;

namespace VRCX
{
    public class VRCXVRCef : VRCXVRInterface
    {
        public static VRCXVRInterface Instance;
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly float[] _rotation = { 0f, 0f, 0f };
        private static readonly float[] _translation = { 0f, 0f, 0f };
        private static readonly float[] _translationLeft = { -7f / 100f, -5f / 100f, 6f / 100f };
        private static readonly float[] _translationRight = { 7f / 100f, -5f / 100f, 6f / 100f };
        private static readonly float[] _rotationLeft = { 90f * (float)(Math.PI / 180f), 90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };
        private static readonly float[] _rotationRight = { -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };
        private static OffScreenBrowser _wristOverlay;
        private static OffScreenBrowser _hmdOverlay;
        private readonly List<string[]> _deviceList;
        private readonly ReaderWriterLockSlim _deviceListLock;
        private bool _active;
        private Device _device;
        private bool _menuButton;
        private int _overlayHand;
        private Factory _factory;
        private Texture2D _texture1;
        private Texture2D _texture2;
        private Thread _thread;
        private DateTime _nextOverlayUpdate;

        private ulong _hmdOverlayHandle;
        private bool _hmdOverlayActive;
        private bool _hmdOverlayWasActive;

        private ulong _wristOverlayHandle;
        private bool _wristOverlayActive;
        private bool _wristOverlayWasActive;


        static VRCXVRCef()
        {
            Instance = new VRCXVRCef();
        }

        public VRCXVRCef()
        {
            _deviceListLock = new ReaderWriterLockSlim();
            _deviceList = new List<string[]>();
            _thread = new Thread(ThreadLoop)
            {
                IsBackground = true
            };
        }

        // NOTE
        // 메모리 릭 때문에 미리 생성해놓고 계속 사용함
        public override void Init()
        {
            _thread.Start();
        }

        public override void Exit()
        {
            var thread = _thread;
            _thread = null;
            thread?.Interrupt();
            thread?.Join();
        }

        public override void Restart()
        {
            Exit();
            Instance = new VRCXVRCef();
            Instance.Init();
            Program.VRCXVRInstance = Instance;
            MainForm.Instance.Browser.ExecuteScriptAsync("console.log('VRCXVR Restarted');");
        }

        private void SetupTextures()
        {
            _factory ??= new Factory1();

            _device?.Dispose();
            _device = new Device(_factory.GetAdapter(OpenVR.System.GetD3D9AdapterIndex()),
                DeviceCreationFlags.BgraSupport);
            UpgradeDevice();

            _texture1?.Dispose();
            _texture1 = new Texture2D(
                _device,
                new Texture2DDescription
                {
                    Width = 512,
                    Height = 512,
                    MipLevels = 1,
                    ArraySize = 1,
                    Format = Format.B8G8R8A8_UNorm,
                    SampleDescription = new SampleDescription(1, 0),
                    BindFlags = BindFlags.ShaderResource
                }
            );
            _wristOverlay?.UpdateRender(_device, _texture1);

            _texture2?.Dispose();
            _texture2 = new Texture2D(
                _device,
                new Texture2DDescription
                {
                    Width = 1024,
                    Height = 1024,
                    MipLevels = 1,
                    ArraySize = 1,
                    Format = Format.B8G8R8A8_UNorm,
                    SampleDescription = new SampleDescription(1, 0),
                    BindFlags = BindFlags.ShaderResource
                }
            );
            _hmdOverlay?.UpdateRender(_device, _texture2);
        }

        private void UpgradeDevice()
        {
            Device5 device5 = _device.QueryInterfaceOrNull<Device5>();
            if (device5 != null)
            {
                _device.Dispose();
                _device = device5;
                return;
            }
            Device4 device4 = _device.QueryInterfaceOrNull<Device4>();
            if (device4 != null)
            {
                _device.Dispose();
                _device = device4;
                return;
            }
            Device3 device3 = _device.QueryInterfaceOrNull<Device3>();
            if (device3 != null)
            {
                _device.Dispose();
                _device = device3;
                return;
            }
            Device2 device2 = _device.QueryInterfaceOrNull<Device2>();
            if (device2 != null)
            {
                _device.Dispose();
                _device = device2;
                return;
            }
            Device1 device1 = _device.QueryInterfaceOrNull<Device1>();
            if (device1 != null)
            {
                _device.Dispose();
                _device = device1;
            }
        }

        private void ThreadLoop()
        {
            var active = false;
            var e = new VREvent_t();
            var nextInit = DateTime.MinValue;
            var nextDeviceUpdate = DateTime.MinValue;
            _nextOverlayUpdate = DateTime.MinValue;
            var overlayIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
            var overlayVisible1 = false;
            var overlayVisible2 = false;
            var dashboardHandle = 0UL;

            _wristOverlay = new OffScreenBrowser(
                Program.LaunchDebug ? "http://localhost:9000/vr.html?1": "file://vrcx/vr.html?1",
                512,
                512
            );

            _hmdOverlay = new OffScreenBrowser(
                Program.LaunchDebug ? "http://localhost:9000/vr.html?2": "file://vrcx/vr.html?2",
                1024,
                1024
            );

            while (_thread != null)
            {
                try
                {
                    Thread.Sleep(32);
                }
                catch (ThreadInterruptedException)
                {
                }

                if (_active)
                {
                    var system = OpenVR.System;
                    if (system == null)
                    {
                        if (DateTime.UtcNow.CompareTo(nextInit) <= 0)
                        {
                            continue;
                        }

                        var _err = EVRInitError.None;
                        system = OpenVR.Init(ref _err, EVRApplicationType.VRApplication_Background);
                        nextInit = DateTime.UtcNow.AddSeconds(5);
                        if (system == null)
                        {
                            continue;
                        }

                        active = true;
                        SetupTextures();
                    }

                    while (system.PollNextEvent(ref e, (uint)Marshal.SizeOf(e)))
                    {
                        var type = (EVREventType)e.eventType;
                        if (type == EVREventType.VREvent_Quit)
                        {
                            active = false;
                            IsHmdAfk = false;
                            OpenVR.Shutdown();
                            nextInit = DateTime.UtcNow.AddSeconds(10);
                            system = null;

                            _wristOverlayHandle = 0;
                            _hmdOverlayHandle = 0;
                            break;
                        }
                    }

                    if (system != null)
                    {
                        if (DateTime.UtcNow.CompareTo(nextDeviceUpdate) >= 0)
                        {
                            overlayIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
                            UpdateDevices(system, ref overlayIndex);
                            if (overlayIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
                            {
                                _nextOverlayUpdate = DateTime.UtcNow.AddSeconds(10);
                            }

                            nextDeviceUpdate = DateTime.UtcNow.AddSeconds(0.1);
                        }

                        var overlay = OpenVR.Overlay;
                        if (overlay != null)
                        {
                            var dashboardVisible = overlay.IsDashboardVisible();
                            var err = ProcessDashboard(overlay, ref dashboardHandle, dashboardVisible);
                            if (err != EVROverlayError.None &&
                                dashboardHandle != 0)
                            {
                                overlay.DestroyOverlay(dashboardHandle);
                                dashboardHandle = 0;
                                logger.Error(err);
                            }

                            if (_wristOverlayActive)
                            {
                                err = ProcessOverlay1(overlay, ref _wristOverlayHandle, ref overlayVisible1,
                                    dashboardVisible, overlayIndex);
                                if (err != EVROverlayError.None &&
                                    _wristOverlayHandle != 0)
                                {
                                    overlay.DestroyOverlay(_wristOverlayHandle);
                                    _wristOverlayHandle = 0;
                                    logger.Error(err);
                                }
                            }

                            if (_hmdOverlayActive)
                            {
                                err = ProcessOverlay2(overlay, ref _hmdOverlayHandle, ref overlayVisible2,
                                    dashboardVisible);
                                if (err != EVROverlayError.None &&
                                    _hmdOverlayHandle != 0)
                                {
                                    overlay.DestroyOverlay(_hmdOverlayHandle);
                                    _hmdOverlayHandle = 0;
                                    logger.Error(err);
                                }
                            }
                        }
                    }
                }
                else if (active)
                {
                    active = false;
                    IsHmdAfk = false;
                    OpenVR.Shutdown();
                    _deviceListLock.EnterWriteLock();
                    try
                    {
                        _deviceList.Clear();
                    }
                    finally
                    {
                        _deviceListLock.ExitWriteLock();
                    }
                }
            }

            _hmdOverlay?.Dispose();
            _wristOverlay?.Dispose();
            _texture2?.Dispose();
            _texture1?.Dispose();
            _device?.Dispose();
        }

        public override void SetActive(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
        {
            _active = active;
            _hmdOverlayActive = hmdOverlay;
            _wristOverlayActive = wristOverlay;
            _menuButton = menuButton;
            _overlayHand = overlayHand;

            if (_hmdOverlayActive != _hmdOverlayWasActive && _hmdOverlayHandle != 0)
            {
                OpenVR.Overlay.DestroyOverlay(_hmdOverlayHandle);
                _hmdOverlayHandle = 0;
            }

            _hmdOverlayWasActive = _hmdOverlayActive;

            if (_wristOverlayActive != _wristOverlayWasActive && _wristOverlayHandle != 0)
            {
                OpenVR.Overlay.DestroyOverlay(_wristOverlayHandle);
                _wristOverlayHandle = 0;
            }

            _wristOverlayWasActive = _wristOverlayActive;
        }

        public override void Refresh()
        {
            _wristOverlay.Reload();
            _hmdOverlay.Reload();
        }

        public override string[][] GetDevices()
        {
            _deviceListLock.EnterReadLock();
            try
            {
                return _deviceList.ToArray();
            }
            finally
            {
                _deviceListLock.ExitReadLock();
            }
        }

        private void UpdateDevices(CVRSystem system, ref uint overlayIndex)
        {
            _deviceListLock.EnterWriteLock();
            try
            {
                _deviceList.Clear();
            }
            finally
            {
                _deviceListLock.ExitWriteLock();
            }

            var sb = new StringBuilder(256);
            var state = new VRControllerState_t();
            var poses = new TrackedDevicePose_t[OpenVR.k_unMaxTrackedDeviceCount];
            system.GetDeviceToAbsoluteTrackingPose(ETrackingUniverseOrigin.TrackingUniverseStanding, 0, poses);
            for (var i = 0u; i < OpenVR.k_unMaxTrackedDeviceCount; ++i)
            {
                var devClass = system.GetTrackedDeviceClass(i);
                switch (devClass)
                {
                    case ETrackedDeviceClass.HMD:
                        var success = system.GetControllerState(i, ref state, (uint)Marshal.SizeOf(state));
                        if (!success)
                            break; // this fails while SteamVR overlay is open

                        var prox = state.ulButtonPressed & (1UL << ((int)EVRButtonId.k_EButton_ProximitySensor));
                        var isHmdAfk = prox == 0;
                        if (isHmdAfk != IsHmdAfk)
                        {
                            IsHmdAfk = isHmdAfk;
                            Program.AppApiInstance.CheckGameRunning();
                        }

                        var headsetErr = ETrackedPropertyError.TrackedProp_Success;
                        var headsetBatteryPercentage = system.GetFloatTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceBatteryPercentage_Float, ref headsetErr);
                        if (headsetErr != ETrackedPropertyError.TrackedProp_Success)
                        {
                            // Headset has no battery, skip displaying it
                            break;
                        }

                        var headset = new[]
                        {
                            "headset",
                            system.IsTrackedDeviceConnected(i)
                                ? "connected"
                                : "disconnected",
                            // Currently neither VD or SteamLink report charging state
                            "discharging",
                            (headsetBatteryPercentage * 100).ToString(),
                            poses[i].eTrackingResult.ToString()
                        };
                        _deviceListLock.EnterWriteLock();
                        try
                        {
                            _deviceList.Add(headset);
                        }
                        finally
                        {
                            _deviceListLock.ExitWriteLock();
                        }

                        break;
                    case ETrackedDeviceClass.Controller:
                    case ETrackedDeviceClass.GenericTracker:
                    case ETrackedDeviceClass.TrackingReference:
                        {
                            var err = ETrackedPropertyError.TrackedProp_Success;
                            var batteryPercentage = system.GetFloatTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceBatteryPercentage_Float, ref err);
                            if (err != ETrackedPropertyError.TrackedProp_Success)
                            {
                                batteryPercentage = 1f;
                            }

                            err = ETrackedPropertyError.TrackedProp_Success;
                            var isCharging = system.GetBoolTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceIsCharging_Bool, ref err);
                            if (err != ETrackedPropertyError.TrackedProp_Success)
                            {
                                isCharging = false;
                            }

                            sb.Clear();
                            system.GetStringTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_TrackingSystemName_String, sb, (uint)sb.Capacity, ref err);
                            var isOculus = sb.ToString().IndexOf("oculus", StringComparison.OrdinalIgnoreCase) >= 0;
                            // Oculus : B/Y, Bit 1, Mask 2
                            // Oculus : A/X, Bit 7, Mask 128
                            // Vive : Menu, Bit 1, Mask 2,
                            // Vive : Grip, Bit 2, Mask 4
                            var role = system.GetControllerRoleForTrackedDeviceIndex(i);
                            if (role == ETrackedControllerRole.LeftHand || role == ETrackedControllerRole.RightHand)
                            {
                                if (_overlayHand == 0 ||
                                    (_overlayHand == 1 && role == ETrackedControllerRole.LeftHand) ||
                                    (_overlayHand == 2 && role == ETrackedControllerRole.RightHand))
                                {
                                    if (system.GetControllerState(i, ref state, (uint)Marshal.SizeOf(state)) &&
                                        (state.ulButtonPressed & (_menuButton ? 2u : isOculus ? 128u : 4u)) != 0)
                                    {
                                        _nextOverlayUpdate = DateTime.MinValue;
                                        if (role == ETrackedControllerRole.LeftHand)
                                        {
                                            Array.Copy(_translationLeft, _translation, 3);
                                            Array.Copy(_rotationLeft, _rotation, 3);
                                        }
                                        else
                                        {
                                            Array.Copy(_translationRight, _translation, 3);
                                            Array.Copy(_rotationRight, _rotation, 3);
                                        }

                                        overlayIndex = i;
                                    }
                                }
                            }

                            var type = string.Empty;
                            if (devClass == ETrackedDeviceClass.Controller)
                            {
                                if (role == ETrackedControllerRole.LeftHand)
                                {
                                    type = "leftController";
                                }
                                else if (role == ETrackedControllerRole.RightHand)
                                {
                                    type = "rightController";
                                }
                                else
                                {
                                    type = "controller";
                                }
                            }
                            else if (devClass == ETrackedDeviceClass.GenericTracker)
                            {
                                type = "tracker";
                            }
                            else if (devClass == ETrackedDeviceClass.TrackingReference)
                            {
                                type = "base";
                            }

                            var item = new[]
                            {
                            type,
                            system.IsTrackedDeviceConnected(i)
                                ? "connected"
                                : "disconnected",
                            isCharging
                                ? "charging"
                                : "discharging",
                            (batteryPercentage * 100).ToString(),
                            poses[i].eTrackingResult.ToString()
                        };
                            _deviceListLock.EnterWriteLock();
                            try
                            {
                                _deviceList.Add(item);
                            }
                            finally
                            {
                                _deviceListLock.ExitWriteLock();
                            }

                            break;
                        }
                }
            }
        }

        internal EVROverlayError ProcessDashboard(CVROverlay overlay, ref ulong dashboardHandle, bool dashboardVisible)
        {
            var err = EVROverlayError.None;

            if (dashboardHandle == 0)
            {
                err = overlay.FindOverlay("VRCX", ref dashboardHandle);
                if (err != EVROverlayError.None)
                {
                    if (err != EVROverlayError.UnknownOverlay)
                    {
                        return err;
                    }

                    ulong thumbnailHandle = 0;
                    err = overlay.CreateDashboardOverlay("VRCX", "VRCX", ref dashboardHandle, ref thumbnailHandle);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    var iconPath = Path.Join(Program.BaseDirectory, "VRCX.png");
                    err = overlay.SetOverlayFromFile(thumbnailHandle, iconPath);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayWidthInMeters(dashboardHandle, 1.5f);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayInputMethod(dashboardHandle, VROverlayInputMethod.Mouse);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }
                }
            }

            var e = new VREvent_t();

            while (overlay.PollNextOverlayEvent(dashboardHandle, ref e, (uint)Marshal.SizeOf(e)))
            {
                var type = (EVREventType)e.eventType;
                if (type == EVREventType.VREvent_MouseMove)
                {
                    var m = e.data.mouse;
                    var s = _wristOverlay.Size;
                    _wristOverlay.GetBrowserHost().SendMouseMoveEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), false, CefEventFlags.None);
                }
                else if (type == EVREventType.VREvent_MouseButtonDown)
                {
                    var m = e.data.mouse;
                    var s = _wristOverlay.Size;
                    _wristOverlay.GetBrowserHost().SendMouseClickEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), MouseButtonType.Left, false, 1, CefEventFlags.LeftMouseButton);
                }
                else if (type == EVREventType.VREvent_MouseButtonUp)
                {
                    var m = e.data.mouse;
                    var s = _wristOverlay.Size;
                    _wristOverlay.GetBrowserHost().SendMouseClickEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), MouseButtonType.Left, true, 1, CefEventFlags.None);
                }
            }

            if (dashboardVisible)
            {
                var texture = new Texture_t
                {
                    handle = _texture1.NativePointer
                };
                err = overlay.SetOverlayTexture(dashboardHandle, ref texture);
                if (err != EVROverlayError.None)
                {
                    return err;
                }
            }

            return err;
        }

        internal EVROverlayError ProcessOverlay1(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible, bool dashboardVisible, uint overlayIndex)
        {
            var err = EVROverlayError.None;

            if (overlayHandle == 0)
            {
                err = overlay.FindOverlay("VRCX1", ref overlayHandle);
                if (err != EVROverlayError.None)
                {
                    if (err != EVROverlayError.UnknownOverlay)
                    {
                        return err;
                    }

                    overlayVisible = false;
                    err = overlay.CreateOverlay("VRCX1", "VRCX1", ref overlayHandle);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayAlpha(overlayHandle, 0.9f);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayWidthInMeters(overlayHandle, 1f);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayInputMethod(overlayHandle, VROverlayInputMethod.None);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }
                }
            }

            if (overlayIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
            {
                // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices
                // Scaling-Rotation-Translation
                var m = Matrix.Scaling(0.25f);
                m *= Matrix.RotationX(_rotation[0]);
                m *= Matrix.RotationY(_rotation[1]);
                m *= Matrix.RotationZ(_rotation[2]);
                m *= Matrix.Translation(_translation[0], _translation[1], _translation[2]);
                var hm34 = new HmdMatrix34_t
                {
                    m0 = m.M11,
                    m1 = m.M21,
                    m2 = m.M31,
                    m3 = m.M41,
                    m4 = m.M12,
                    m5 = m.M22,
                    m6 = m.M32,
                    m7 = m.M42,
                    m8 = m.M13,
                    m9 = m.M23,
                    m10 = m.M33,
                    m11 = m.M43
                };
                err = overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, overlayIndex, ref hm34);
                if (err != EVROverlayError.None)
                {
                    return err;
                }
            }

            if (!dashboardVisible &&
                DateTime.UtcNow.CompareTo(_nextOverlayUpdate) <= 0)
            {
                var texture = new Texture_t
                {
                    handle = _texture1.NativePointer
                };
                err = overlay.SetOverlayTexture(overlayHandle, ref texture);
                if (err != EVROverlayError.None)
                {
                    return err;
                }

                if (!overlayVisible)
                {
                    err = overlay.ShowOverlay(overlayHandle);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    overlayVisible = true;
                }
            }
            else if (overlayVisible)
            {
                err = overlay.HideOverlay(overlayHandle);
                if (err != EVROverlayError.None)
                {
                    return err;
                }

                overlayVisible = false;
            }

            return err;
        }

        internal EVROverlayError ProcessOverlay2(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible, bool dashboardVisible)
        {
            var err = EVROverlayError.None;

            if (overlayHandle == 0)
            {
                err = overlay.FindOverlay("VRCX2", ref overlayHandle);
                if (err != EVROverlayError.None)
                {
                    if (err != EVROverlayError.UnknownOverlay)
                    {
                        return err;
                    }

                    overlayVisible = false;
                    err = overlay.CreateOverlay("VRCX2", "VRCX2", ref overlayHandle);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayAlpha(overlayHandle, 0.9f);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayWidthInMeters(overlayHandle, 1f);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    err = overlay.SetOverlayInputMethod(overlayHandle, VROverlayInputMethod.None);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    var m = Matrix.Scaling(1f);
                    m *= Matrix.Translation(0, -0.3f, -1.5f);
                    var hm34 = new HmdMatrix34_t
                    {
                        m0 = m.M11,
                        m1 = m.M21,
                        m2 = m.M31,
                        m3 = m.M41,
                        m4 = m.M12,
                        m5 = m.M22,
                        m6 = m.M32,
                        m7 = m.M42,
                        m8 = m.M13,
                        m9 = m.M23,
                        m10 = m.M33,
                        m11 = m.M43
                    };
                    err = overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, OpenVR.k_unTrackedDeviceIndex_Hmd, ref hm34);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }
                }
            }

            if (!dashboardVisible)
            {
                var texture = new Texture_t
                {
                    handle = _texture2.NativePointer
                };
                err = overlay.SetOverlayTexture(overlayHandle, ref texture);
                if (err != EVROverlayError.None)
                {
                    return err;
                }

                if (!overlayVisible)
                {
                    err = overlay.ShowOverlay(overlayHandle);
                    if (err != EVROverlayError.None)
                    {
                        return err;
                    }

                    overlayVisible = true;
                }
            }
            else if (overlayVisible)
            {
                err = overlay.HideOverlay(overlayHandle);
                if (err != EVROverlayError.None)
                {
                    return err;
                }

                overlayVisible = false;
            }

            return err;
        }

        public override ConcurrentQueue<KeyValuePair<string, string>> GetExecuteVrFeedFunctionQueue()
        {
            throw new NotImplementedException();
        }

        public override void ExecuteVrFeedFunction(string function, string json)
        {
            if (_wristOverlay == null) return;
            // if (_wristOverlay.IsLoading)
            //     Restart();
            _wristOverlay.ExecuteScriptAsync($"$app.{function}", json);
        }

        public override ConcurrentQueue<KeyValuePair<string, string>> GetExecuteVrOverlayFunctionQueue()
        {
            throw new NotImplementedException();
        }

        public override void ExecuteVrOverlayFunction(string function, string json)
        {
            if (_hmdOverlay == null) return;
            // if (_hmdOverlay.IsLoading)
            //     Restart();
            _hmdOverlay.ExecuteScriptAsync($"$app.{function}", json);
        }
    }
}