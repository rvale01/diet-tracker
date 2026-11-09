# Kitchen board on a cheap photo frame

A ~£50 "smart" photo frame (Frameo and similar, 10.1", 1280×800 touchscreen) is an Android tablet inside.
Swap its photo app for a full-screen browser that opens `https://diet-tracker-hazel.vercel.app/board`.

## Buying

- **10.1", 1280×800, touchscreen, Wi-Fi.** Frameo frames are the most common.
- Before buying, check reviews or forums for the model plus "ADB". A few frames lock it.

## What you need

- A computer with **ADB** (Android Debug Bridge: `brew install android-platform-tools` on Mac, or the Android SDK Platform Tools on Windows/Linux).
- The frame's USB cable.
- APK files (Android app installers) for:
  - **Fully Kiosk Browser** (fully-kiosk.com). The free version is enough to start; PLUS (~€8) adds kiosk lock and screen schedules.
  - **Android System WebView**: the newest version for the frame's Android version and CPU (arm or arm64), from APKMirror. Frames ship an old one; updating it is what makes modern pages run smoothly.

## Steps

1. **Turn on ADB on the frame.** On many Frameo frames: Settings → About → tap the build number 7 times, then enable USB debugging. Some models have a "Enable ADB" switch under Settings → About or Beta. If yours differs, search "<model> enable adb".
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
   adb shell pm list packages | grep -i -E "frameo|photo|frame"
   adb shell pm disable-user --user 0 net.frameo.app      # use the name from the line above
   ```
   Undo later with `adb shell pm enable net.frameo.app`.
5. **Set up Fully Kiosk** on the frame:
   - Start URL: `https://diet-tracker-hazel.vercel.app/board`
   - Settings → Device Management → **Launch on boot** on, and accept making it the **Home app**.
   - Settings → Device Management → **Keep screen on** on.
   - Optional (PLUS): Screen off at night, e.g. 23:00–06:30. The board also dims itself (Settings → Kitchen board in the dashboard).
6. **Sign in once** on the board with your dashboard password. It stays signed in.

## Good to know

- The board checks for changes once a minute and reloads itself every 6 hours, so it stays fresh without touching it.
- You can tick things on it: diet quests, to-dos and bills. It's the same data as your phone.
- If it ever shows "Couldn't load your dashboard", tap **Try again**. If it says to sign in, sign in again (this happens after the password is changed in Vercel).
- To get back to Android settings: swipe from the left edge in Fully Kiosk, or connect ADB and run `adb shell am start -a android.settings.SETTINGS`.
