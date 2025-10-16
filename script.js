// UUIDs (replace later if needed)
const SERVICE_UUID = "d1f4a9b0-1234-4a3f-bc2a-7e8f12345678";
const CHAR_UUID    = "b1c2d3e4-5678-4abc-9def-1234567890ab";

let characteristic = null;
let chart = null;

const accValEl = document.getElementById("accVal");
const velValEl = document.getElementById("velVal");
const statusEl = document.getElementById("status");
const readingsSection = document.getElementById("readings");
const chartSection = document.getElementById("chartSection");
const connectBtn = document.getElementById("connectBtn");
const plotBtn = document.getElementById("plotBtn");
const logBox = document.getElementById("logBox");

function log(msg) {
  const time = new Date().toLocaleTimeString();
  logBox.innerHTML += `[${time}] ${msg}<br>`;
  logBox.scrollTop = logBox.scrollHeight;
}

statusEl.textContent = "Hi! Press Connect to begin.";

connectBtn.addEventListener("click", async () => {
  try {
    statusEl.textContent = "🔍 Scanning for devices...";
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });
    statusEl.textContent = `Connecting to ${device.name || "device"}...`;
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHAR_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', onData);

    statusEl.textContent = "✅ Connection successful!";
    readingsSection.classList.remove("hidden");
    chartSection.classList.remove("hidden");
    log("Connected & notifications started.");
  } catch (err) {
    statusEl.textContent = "❌ Connection failed: " + err;
    log("Connection error: " + err);
  }
});

function onData(event) {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(event.target.value).trim();
  log("Received: " + text);

  // Expecting "acc,vel"
  const parts = text.split(",");
  if (parts.length >= 2) {
    const acc = parseFloat(parts[0]);
    const vel = parseFloat(parts[1]);

    if (!isNaN(acc)) accValEl.textContent = acc.toFixed(2);
    if (!isNaN(vel)) velValEl.textContent = vel.toFixed(2);

    if (chart) {
      const now = new Date().toLocaleTimeString();
      chart.data.labels.push(now);
      chart.data.datasets[0].data.push(acc);
      chart.data.datasets[1].data.push(vel);
      if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(ds => ds.data.shift());
      }
      chart.update();
    }
  }
}

plotBtn.addEventListener("click", () => {
  if (!chart) {
    const ctx = document.getElementById("vibChart").getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: "Acceleration (m/s²)", data: [], borderColor: "#00fff7", fill: false, tension: 0.25 },
          { label: "Velocity (mm/s)", data: [], borderColor: "#ff00aa", fill: false, tension: 0.25 },
        ]
      },
      options: {
        animation: false,
        responsive: true,
        plugins: { legend: { labels: { color: "#fff" } } },
        scales: {
          x: { ticks: { color: "#ccc" }, title: { display: true, text: "Time", color: "#00fff7" } },
          y: { ticks: { color: "#ccc" }, title: { display: true, text: "Value", color: "#00fff7" } }
        }
      }
    });
  }
});

// Particle background
particlesJS("particles-js", {
  "particles": {
    "number": { "value": 60 },
    "color": { "value": ["#00fff7", "#ff00aa"] },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.5 },
    "size": { "value": 3 },
    "line_linked": { "enable": true, "distance": 150, "color": "#00fff7", "opacity": 0.3, "width": 1 },
    "move": { "enable": true, "speed": 2 }
  },
  "interactivity": {
    "events": {
      "onhover": { "enable": true, "mode": "repulse" },
      "onclick": { "enable": true, "mode": "push" }
    },
    "modes": {
      "repulse": { "distance": 100 },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});