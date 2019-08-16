// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using SharpDX;
using SharpDX.Direct3D;
using SharpDX.Direct3D11;
using SharpDX.DXGI;
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Valve.VR;
using Device = SharpDX.Direct3D11.Device;

namespace VRCX
{
    public static class VRCXVR
    {
        private static readonly object m_LockObject = new object();
        private static List<string[]> m_Devices = new List<string[]>();
        private static Thread m_Thread;
        private static Device m_Device;
        private static Texture2D m_Texture1;
        private static Texture2D m_Texture2;
        private static Browser m_Browser1;
        private static Browser m_Browser2;
        private static float[] m_Rotation = { 0f, 0f, 0f };
        private static float[] m_Translation = { 0f, 0f, 0f };
        private static float[] m_L_Translation = { -7f / 100f, -5f / 100f, 6f / 100f };
        private static float[] m_R_Translation = { 7f / 100f, -5f / 100f, 6f / 100f };
        private static float[] m_L_Rotation = { 90f * (float)(Math.PI / 180f), 90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };
        private static float[] m_R_Rotation = { -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };

        // NOTE
        // 메모리 릭 때문에 미리 생성해놓고 계속 사용함
        public static void Setup()
        {
            m_Device = new Device(DriverType.Hardware, DeviceCreationFlags.SingleThreaded | DeviceCreationFlags.BgraSupport);
            m_Texture1 = new Texture2D(m_Device, new Texture2DDescription()
            {
                Width = 512,
                Height = 512,
                MipLevels = 1,
                ArraySize = 1,
                Format = Format.B8G8R8A8_UNorm,
                SampleDescription = new SampleDescription(1, 0),
                Usage = ResourceUsage.Dynamic,
                BindFlags = BindFlags.ShaderResource,
                CpuAccessFlags = CpuAccessFlags.Write
            });
            m_Texture2 = new Texture2D(m_Device, new Texture2DDescription()
            {
                Width = 512,
                Height = 512,
                MipLevels = 1,
                ArraySize = 1,
                Format = Format.B8G8R8A8_UNorm,
                SampleDescription = new SampleDescription(1, 0),
                Usage = ResourceUsage.Dynamic,
                BindFlags = BindFlags.ShaderResource,
                CpuAccessFlags = CpuAccessFlags.Write
            });
            m_Browser1 = new Browser(m_Texture1, Application.StartupPath + "/html/vr.html?1");
            m_Browser2 = new Browser(m_Texture2, Application.StartupPath + "/html/vr.html?2");
        }

        public static void Start()
        {
            lock (m_LockObject)
            {
                if (m_Thread == null)
                {
                    m_Thread = new Thread(ThreadProc);
                    m_Thread.Start();
                }
            }
        }

        public static void Stop()
        {
            lock (m_LockObject)
            {
                var thread = m_Thread;
                if (thread != null)
                {
                    m_Thread = null;
                    try
                    {
                        thread.Interrupt();
                        thread.Join();
                    }
                    catch
                    {
                    }
                }
            }
        }

        public static void Refresh()
        {
            m_Browser1.ExecuteScriptAsync("location.reload()");
            m_Browser2.ExecuteScriptAsync("location.reload()");
        }

        public static string[][] GetDevices()
        {
            lock (m_Devices)
            {
                return m_Devices.ToArray();
            }
        }

        private static void UpdateDevices(CVRSystem system, ref uint trackingIndex)
        {
            lock (m_Devices)
            {
                m_Devices.Clear();
                var sb = new StringBuilder(256);
                var state = new VRControllerState_t();
                for (var i = 0u; i < OpenVR.k_unMaxTrackedDeviceCount; ++i)
                {
                    var devClass = system.GetTrackedDeviceClass(i);
                    if (devClass == ETrackedDeviceClass.Controller ||
                        devClass == ETrackedDeviceClass.GenericTracker)
                    {
                        var err = ETrackedPropertyError.TrackedProp_Success;
                        var batteryPercentage = system.GetFloatTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceBatteryPercentage_Float, ref err);
                        if (err != ETrackedPropertyError.TrackedProp_Success)
                        {
                            batteryPercentage = 1f;
                        }
                        sb.Clear();
                        system.GetStringTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_TrackingSystemName_String, sb, (uint)sb.Capacity, ref err);
                        var isOculus = sb.ToString().IndexOf("oculus", StringComparison.OrdinalIgnoreCase) >= 0;
                        // Oculus : B/Y, Bit 1, Mask 2
                        // Oculus : A/X, Bit 7, Mask 128
                        // Vive : Menu, Bit 1, Mask 2,
                        // Vive : Grip, Bit 2, Mask 4
                        var role = system.GetControllerRoleForTrackedDeviceIndex(i);
                        if (role == ETrackedControllerRole.LeftHand ||
                            role == ETrackedControllerRole.RightHand)
                        {
                            if (system.GetControllerState(i, ref state, (uint)Marshal.SizeOf(state)) &&
                                (state.ulButtonPressed & (isOculus ? 2u : 4u)) != 0)
                            {
                                if (role == ETrackedControllerRole.LeftHand)
                                {
                                    Array.Copy(m_L_Translation, m_Translation, 3);
                                    Array.Copy(m_L_Rotation, m_Rotation, 3);
                                }
                                else
                                {
                                    Array.Copy(m_R_Translation, m_Translation, 3);
                                    Array.Copy(m_R_Rotation, m_Rotation, 3);
                                }
                                trackingIndex = i;
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
                        m_Devices.Add(new[]
                        {
                            type,
                            system.IsTrackedDeviceConnected(i)
                                ? "connected"
                                : "disconnected",
                            (batteryPercentage * 100).ToString()
                        });
                    }
                }
            }
        }

        private static EVROverlayError ProcessDashboard(CVROverlay overlay, ref ulong dashboardHandle, bool dashboardVisible)
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
                    ulong handle = 0;
                    err = overlay.CreateDashboardOverlay("VRCX", "VRCX", ref dashboardHandle, ref handle);
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
                    var s = m_Browser1.Size;
                    m_Browser1.GetBrowserHost().SendMouseMoveEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), false, CefEventFlags.None);
                }
                else if (type == EVREventType.VREvent_MouseButtonDown)
                {
                    var m = e.data.mouse;
                    var s = m_Browser1.Size;
                    m_Browser1.GetBrowserHost().SendMouseClickEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), MouseButtonType.Left, false, 1, CefEventFlags.LeftMouseButton);
                }
                else if (type == EVREventType.VREvent_MouseButtonUp)
                {
                    var m = e.data.mouse;
                    var s = m_Browser1.Size;
                    m_Browser1.GetBrowserHost().SendMouseClickEvent((int)(m.x * s.Width), s.Height - (int)(m.y * s.Height), MouseButtonType.Left, true, 1, CefEventFlags.None);
                }
            }

            if (dashboardVisible)
            {
                var texture = new Texture_t
                {
                    handle = m_Texture1.NativePointer
                };
                err = overlay.SetOverlayTexture(dashboardHandle, ref texture);
                if (err != EVROverlayError.None)
                {
                    return err;
                }
            }

            return err;
        }

        private static EVROverlayError ProcessOverlay1(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible, bool dashboardVisible, uint trackingIndex, DateTime nextRender)
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

            if (trackingIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
            {
                // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices
                // Scaling-Rotation-Translation
                var m = Matrix.Scaling(0.25f);
                m *= Matrix.RotationX(m_Rotation[0]);
                m *= Matrix.RotationY(m_Rotation[1]);
                m *= Matrix.RotationZ(m_Rotation[2]);
                m *= Matrix.Translation(m_Translation[0], m_Translation[1], m_Translation[2]);
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
                    m11 = m.M43,
                };
                err = overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, trackingIndex, ref hm34);
                if (err != EVROverlayError.None)
                {
                    return err;
                }
            }

            if (!dashboardVisible &&
                DateTime.Now.CompareTo(nextRender) <= 0)
            {
                var texture = new Texture_t
                {
                    handle = m_Texture1.NativePointer
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

        private static EVROverlayError ProcessOverlay2(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible, bool dashboardVisible)
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
                        m11 = m.M43,
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
                    handle = m_Texture2.NativePointer
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

        private static void ThreadProc()
        {
            var e = new VREvent_t();
            var nextOpenVRInit = DateTime.MinValue;
            var nextDeviceInfoUpdate = DateTime.MinValue;
            var nextRender = DateTime.MinValue;
            var trackingIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
            var overlayVisible1 = false;
            var overlayVisible2 = false;
            var dashboardHandle = 0UL;
            var overlayHandle1 = 0UL;
            var overlayHandle2 = 0UL;

            while (m_Thread != null)
            {
                m_Browser1.Render();
                m_Browser2.Render();

                try
                {
                    Thread.Sleep(10);
                }
                catch
                {
                    // ThreadInterruptedException
                }

                var system = OpenVR.System;

                if (system == null)
                {
                    if (DateTime.Now.CompareTo(nextOpenVRInit) < 0)
                    {
                        continue;
                    }
                    var _err = EVRInitError.None;
                    system = OpenVR.Init(ref _err, EVRApplicationType.VRApplication_Overlay);
                    nextOpenVRInit = DateTime.Now.AddSeconds(5);
                    if (system == null)
                    {
                        continue;
                    }
                }

                while (system.PollNextEvent(ref e, (uint)Marshal.SizeOf(e)))
                {
                    var type = (EVREventType)e.eventType;
                    if (type == EVREventType.VREvent_Quit)
                    {
                        OpenVR.Shutdown();
                        // VRChat이 실행 중일 때만 켜는 옵션이 생겨서 시간을 줄임
                        nextOpenVRInit = DateTime.Now.AddSeconds(10);
                        system = null;
                        break;
                    }
                }

                if (system == null)
                {
                    continue;
                }

                if (DateTime.Now.CompareTo(nextDeviceInfoUpdate) >= 0)
                {
                    trackingIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
                    UpdateDevices(system, ref trackingIndex);
                    if (trackingIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
                    {
                        nextRender = DateTime.Now.AddSeconds(10);
                    }
                    nextDeviceInfoUpdate = DateTime.Now.AddSeconds(0.1);
                }

                var overlay = OpenVR.Overlay;

                if (overlay == null)
                {
                    continue;
                }

                var dashboardVisible = overlay.IsDashboardVisible();

                var err = ProcessDashboard(overlay, ref dashboardHandle, dashboardVisible);

                if (err != EVROverlayError.None &&
                    dashboardHandle != 0)
                {
                    overlay.DestroyOverlay(dashboardHandle);
                    dashboardHandle = 0;
                }

                err = ProcessOverlay1(overlay, ref overlayHandle1, ref overlayVisible1, dashboardVisible, trackingIndex, nextRender);

                if (err != EVROverlayError.None &&
                    overlayHandle1 != 0)
                {
                    overlay.DestroyOverlay(overlayHandle1);
                    overlayHandle1 = 0;
                }

                err = ProcessOverlay2(overlay, ref overlayHandle2, ref overlayVisible2, dashboardVisible);

                if (err != EVROverlayError.None &&
                    overlayHandle2 != 0)
                {
                    overlay.DestroyOverlay(overlayHandle2);
                    overlayHandle2 = 0;
                }
            }

            lock (m_Devices)
            {
                m_Devices.Clear();
            }

            OpenVR.Shutdown();
        }
    }
}