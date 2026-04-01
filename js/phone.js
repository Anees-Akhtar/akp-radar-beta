import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let watchId = null;
let wakeLock = null;

async function requestWakeLock() {
  const wakeLockEl = document.getElementById("wakelock");
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLockEl.textContent = "🔆 Screen lock: active — screen will stay on";
      wakeLockEl.className = "active";

      wakeLock.addEventListener("release", async () => {
        wakeLockEl.textContent = "🔆 Screen lock: inactive";
        wakeLockEl.className = "";
        if (watchId !== null) {
          await requestWakeLock();
        }
      });
    } else {
      wakeLockEl.textContent = "⚠️ Wake Lock not supported";
    }
  } catch (err) {
    wakeLockEl.textContent = "⚠️ Could not keep screen on";
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
  const wakeLockEl = document.getElementById("wakelock");
  wakeLockEl.textContent = "🔆 Screen lock: inactive";
  wakeLockEl.className = "";
}

window.startTracking = async function () {
  const statusEl = document.getElementById("status");

  if (!navigator.geolocation) {
    statusEl.textContent = "❌ Geolocation not supported.";
    statusEl.className = "error";
    return;
  }

  statusEl.textContent = "🔍 Getting location...";
  statusEl.className = "";
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("stopBtn").style.display = "block";

  await requestWakeLock();

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);
      const timestamp = Date.now();

      set(ref(db, "location"), { lat, lng, accuracy, timestamp });

      statusEl.textContent = "✅ Tracking active — sending location...";
      statusEl.className = "active";
      document.getElementById("coords").textContent =
        `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} · ~${accuracy}m`;
    },
    (error) => {
      const msgs = {
        1: "❌ Permission denied.",
        2: "❌ Location unavailable.",
        3: "❌ Timed out.",
      };
      statusEl.textContent = msgs[error.code] || "❌ Error.";
      statusEl.className = "error";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
};

window.stopTracking = async function () {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  await releaseWakeLock();
  document.getElementById("status").textContent = "⏹ Tracking stopped.";
  document.getElementById("status").className = "";
  document.getElementById("startBtn").style.display = "block";
  document.getElementById("stopBtn").style.display = "none";
};

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && watchId !== null) {
    await requestWakeLock();
  }
});
