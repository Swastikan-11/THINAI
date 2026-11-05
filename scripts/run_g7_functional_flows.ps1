$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
New-Item -ItemType Directory -Force -Path "docs/screenshots"

Write-Host "=== STARTING G7 FUNCTIONAL FLOWS ON CI RELEASE APK ==="

# 1. Clear app data and clear logcat
& $adb logcat -c
& $adb shell pm clear com.thinai.agriapp

# Flow 1: First-run Launch (Default English)
Write-Host "Flow 1: First-run Launch (Default English)"
& $adb shell am start -n com.thinai.agriapp/.MainActivity
Start-Sleep -Seconds 4
& $adb shell screencap -p /sdcard/g7_flow1_first_run.png
& $adb pull /sdcard/g7_flow1_first_run.png docs/screenshots/g7_flow1_first_run.png

# Flow 2: Register / Login interaction
Write-Host "Flow 2: Register / Login interaction"
& $adb shell input tap 180 500
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow2_login.png
& $adb pull /sdcard/g7_flow2_login.png docs/screenshots/g7_flow2_login.png

# Flow 3: Crop Selection
Write-Host "Flow 3: Crop Selection"
& $adb shell input tap 180 350
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow3_crop_selection.png
& $adb pull /sdcard/g7_flow3_crop_selection.png docs/screenshots/g7_flow3_crop_selection.png

# Flow 4: Scan pushed gallery images (Doctor tab tap, run inference)
Write-Host "Flow 4: Scan & Diagnosis Screen"
& $adb shell input tap 90 750
Start-Sleep -Seconds 3
& $adb shell screencap -p /sdcard/g7_flow4_scan_result.png
& $adb pull /sdcard/g7_flow4_scan_result.png docs/screenshots/g7_flow4_scan_result.png

# Flow 5: Save to History
Write-Host "Flow 5: Save to History"
& $adb shell input tap 180 600
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow5_history.png
& $adb pull /sdcard/g7_flow5_history.png docs/screenshots/g7_flow5_history.png

# Flow 6: Offline Scan (Airplane mode ON)
Write-Host "Flow 6: Offline Scan (Airplane mode ON)"
& $adb shell cmd connectivity airplane-mode enable
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow6_offline.png
& $adb pull /sdcard/g7_flow6_offline.png docs/screenshots/g7_flow6_offline.png

# Flow 7: Reconnect & Sync (Airplane mode OFF)
Write-Host "Flow 7: Reconnect & Sync (Airplane mode OFF)"
& $adb shell cmd connectivity airplane-mode disable
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow7_reconnect.png
& $adb pull /sdcard/g7_flow7_reconnect.png docs/screenshots/g7_flow7_reconnect.png

# Flow 8: Language Switch (Tamil, Hindi, Urdu RTL, Santali)
Write-Host "Flow 8: Language Switch"
# Tap language toggle / dropdown
& $adb shell input tap 320 60
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow8_lang_menu.png
& $adb pull /sdcard/g7_flow8_lang_menu.png docs/screenshots/g7_flow8_lang_menu.png

# Flow 9: Rotate to Landscape and back
Write-Host "Flow 9: Rotate Orientation"
& $adb shell settings put system accelerometer_rotation 0
& $adb shell settings put system user_rotation 1
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow9_landscape.png
& $adb pull /sdcard/g7_flow9_landscape.png docs/screenshots/g7_flow9_landscape.png
& $adb shell settings put system user_rotation 0
Start-Sleep -Seconds 2

# Flow 10: Background and Resume
Write-Host "Flow 10: Background and Resume"
& $adb shell input keyevent KEYCODE_HOME
Start-Sleep -Seconds 2
& $adb shell am start -n com.thinai.agriapp/.MainActivity
Start-Sleep -Seconds 2
& $adb shell screencap -p /sdcard/g7_flow10_resume.png
& $adb pull /sdcard/g7_flow10_resume.png docs/screenshots/g7_flow10_resume.png

# Flow 11: Kill and Restart
Write-Host "Flow 11: Kill and Restart"
& $adb shell am force-stop com.thinai.agriapp
Start-Sleep -Seconds 1
& $adb shell am start -n com.thinai.agriapp/.MainActivity
Start-Sleep -Seconds 3
& $adb shell screencap -p /sdcard/g7_flow11_restart.png
& $adb pull /sdcard/g7_flow11_restart.png docs/screenshots/g7_flow11_restart.png

# Flow 12: Monkey Test (5,000 events)
Write-Host "Flow 12: Executing 5,000-event Monkey Stress Test"
& $adb shell monkey -p com.thinai.agriapp --throttle 300 -v 5000 > docs/monkey_ci_release_output.txt

# Dump logcat
Write-Host "Dumping Logcat..."
& $adb logcat -d > docs/logcat_ci_release_monkey_g7.log

Write-Host "=== G7 FUNCTIONAL FLOWS COMPLETE ==="
