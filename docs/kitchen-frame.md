# Kitchen board on a cheap photo frame

A ~£50 "smart" photo frame (Frameo and similar, 10.1", 1280×800 touchscreen) is an Android tablet inside.
Swap its photo app for a full-screen browser that opens `https://diet-tracker-hazel.vercel.app/board`.

## Buying

- **10.1", 1280×800, touchscreen, Wi-Fi.** Frameo frames are the most common.
- Before buying, check reviews or forums for the model plus "ADB". A few frames lock it.
- Known to work: Frameo frames on the Rockchip RK3326 board (model S101). See wesbos/photo-frame-dashboard on GitHub.

> **Before you connect it to Wi-Fi:** community reports say Frameo app update **1.58** turned ADB off on some frames, which blocks this whole conversion. Set the frame up, turn ADB on (step 1) and disable the Frameo app (step 4) **before** letting it update. If it asks to update during setup, skip it.

## What you need

- A computer with **ADB** (Android Debug Bridge: `brew install android-platform-tools` on Mac, or the Android SDK Platform Tools on Windows/Linux).
- The frame's USB cable.
- APK files (Android app installers) for:
  - **Fully Kiosk Browser** (fully-kiosk.com). The free version is enough to start; PLUS (~€8) adds kiosk lock and screen schedules.
  - **Android System WebView**: the newest version for the frame's Android version and CPU (arm or arm64), from APKMirror. Frames ship an old one; updating it is what makes modern pages run smoothly.

## Steps

1. **Turn on ADB on the frame.** In the Frameo app: Settings → About → **Enable Beta Program**, which reveals an **ADB access** switch. Turn it on. On some frames it's already on. If `adb devices` later shows "unauthorized", switch it off and on again.
2. **Connect and check:**
   ```bash
   adb devices                       # the frame should be listed; accept the prompt on the frame
   adb shell getprop ro.build.version.release   # Android version
   adb shell getprop ro.product.cpu.abi         # arm64-v8a or armeabi-v7a, to pick the right APKs
   ```
3. **Update the browser engine and install the kiosk browser:**
   ```bash
   adb install -r android-system-webview.apk
   adb install fully-kiosk-browser.apk
   ```
4. **Remove the photo app** (disabled, not deleted, so it can be undone):
   ```bash
   adb shell pm list packages | grep -i frameo            # usually net.frameo.frame
   adb shell pm disable-user --user 0 net.frameo.frame
   ```
   Undo later with `adb shell pm enable net.frameo.frame`.
5. **Set up Fully Kiosk** on the frame:
   - Start URL: `https://diet-tracker-hazel.vercel.app/board`
   - Settings → Device Management → **Launch on boot** on, and accept making it the **Home app**.
   - Settings → Device Management → **Keep screen on** on.
   - Fully Kiosk turns USB debugging off by default: in its Device Management / Device Owner settings, turn **ADB/USB debugging** back on straight away so you can still reach the frame.
   - Optional, to manage it over Wi-Fi later: `adb tcpip 5555`, then `adb connect <frame-ip>:5555`.
   - Optional (PLUS): Screen off at night, e.g. 23:00–06:30. The board also dims itself (Settings → Kitchen board in the dashboard).
6. **Sign in once** on the board with your dashboard password. It stays signed in.

## Good to know

- The board checks for changes once a minute and reloads itself every 6 hours, so it stays fresh without touching it.
- You can tick things on it: diet quests, to-dos and bills. It's the same data as your phone.
- If it ever shows "Couldn't load your dashboard", tap **Try again**. If it says to sign in, sign in again (this happens after the password is changed in Vercel).
- To get back to Android settings: swipe from the left edge in Fully Kiosk, or connect ADB and run `adb shell am start -a android.settings.SETTINGS`.
