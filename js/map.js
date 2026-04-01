import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let map, marker, accuracyCircle;
let firstUpdate = true;

window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    mapTypeControl: false,
    streetViewControl: false,
  });

  const locationRef = ref(db, "location");
  onValue(locationRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const { lat, lng, accuracy, timestamp } = data;
    const position = { lat, lng };
    const time = new Date(timestamp).toLocaleTimeString();

    updateStatus(lat, lng, accuracy, time);
    updateMarker(position);
    updateAccuracyCircle(position, accuracy);

    if (firstUpdate) {
      map.setCenter(position);
      map.setZoom(16);
      firstUpdate = false;
    }
  });
};

function updateStatus(lat, lng, accuracy, time) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = `✅ Live location receiving — Last update: ${time}`;
  statusEl.className = "active";

  document.getElementById("coords").textContent =
    `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} · ~${accuracy}m accuracy`;
}

function updateMarker(position) {
  if (marker) {
    marker.setPosition(position);
  } else {
    marker = new google.maps.Marker({
      position,
      map,
      title: "📍 Live Location",
      animation: google.maps.Animation.DROP,
    });
  }
}

function updateAccuracyCircle(position, accuracy) {
  if (accuracyCircle) {
    accuracyCircle.setCenter(position);
    accuracyCircle.setRadius(accuracy);
  } else {
    accuracyCircle = new google.maps.Circle({
      map,
      center: position,
      radius: accuracy,
      fillColor: "#1a73e8",
      fillOpacity: 0.15,
      strokeColor: "#1a73e8",
      strokeOpacity: 0.4,
      strokeWeight: 1,
    });
  }
}
