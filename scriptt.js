// 🌍 Initialize Mapbox
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';  // Replace with your token
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-79.3832, 43.6532], // Default center (Toronto)
  zoom: 12
});

// 🗣️ Text-to-Speech Function
function speakText(text) {
  const voiceEnabled = document.getElementById("voiceToggle").checked;
  if (voiceEnabled) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1.0;
    speech.pitch = 1.0;
    window.speechSynthesis.speak(speech);
  }
}

// 🗺️ Get Directions from MapQuest
async function getDirections(origin, destination) {
  const mqKey = 'YOUR_MAPQUEST_API_KEY';  // Replace with your key
  const url = `https://www.mapquestapi.com/directions/v2/route?key=${mqKey}&from=${origin}&to=${destination}&routeType=fastest&unit=k`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // 📋 Show Narratives
    const steps = data.route.legs[0].maneuvers.map(m => m.narrative);
    const directionsText = steps.join(", ");
    document.getElementById("response").innerHTML = steps.join("<br>");
    speakText(directionsText);

    // 📍 Plot Route on Map
    const shapePoints = data.route.shape.shapePoints;
    const coordinates = [];
    for (let i = 0; i < shapePoints.length; i += 2) {
      coordinates.push([shapePoints[i + 1], shapePoints[i]]); // [lng, lat]
    }

    // Remove previous layers if re-querying
    if (map.getSource('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    // 🗺️ Add Route Line
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#007AFF',
        'line-width': 6
      }
    });

    map.flyTo({ center: coordinates[0], zoom: 14 });
  } catch (error) {
    document.getElementById("response").innerHTML = "Sorry, Sage couldn't fetch directions.";
    console.error("MapQuest error:", error);
  }
}

// 🧭 Main Handler
function sendQuery() {
  const destination = document.getElementById("userInput").value;

  // 🌎 Use GPS for origin
  navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const origin = `${lat},${lng}`;
    getDirections(origin, destination);
  }, function() {
    // Fallback if GPS fails
    const origin = prompt("Where are you starting from?");
    getDirections(origin, destination);
  });
}
