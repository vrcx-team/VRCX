#!/usr/bin/env bash

export WINEPREFIX=~/.local/share/vrcx

# Function to launch winediscordipcbridge
launch_ipcbridge() {
    wine ~/.local/share/vrcx/drive_c/winediscordipcbridge.exe &
    IPCBRIDGE_PID=$!
}

# Launch winediscordipcbridge
launch_ipcbridge

# Launch VRCX
wine "$WINEPREFIX/drive_c/Program Files/VRCX/VRCX.exe" &
VRCX_PID=$!

while kill -0 $VRCX_PID 2>/dev/null; do
    # Check if VRChat is running
    if ps -A | grep -i "VRChat.exe" > /dev/null; then
        isGameRunning=true
    else
        isGameRunning=false
    fi
    echo "isGameRunning=$isGameRunning" > "$WINEPREFIX/drive_c/users/$USER/AppData/Roaming/VRCX/wine.tmp"

    # Check if winediscordipcbridge is running
    if ! kill -0 $IPCBRIDGE_PID 2>/dev/null; then
        echo "winediscordipcbridge.exe not running, restarting..."
        launch_ipcbridge
    fi

    sleep 1
done

# Cleanup after VRCX exits
echo "isGameRunning=false" > "$WINEPREFIX/drive_c/users/$USER/AppData/Roaming/VRCX/wine.tmp"

# Kill winediscordipcbridge if it's still running
kill $IPCBRIDGE_PID 2>/dev/null