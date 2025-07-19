const audioContext = new window.AudioContext();

const elements = {
  rangeMin: document.getElementById('rangeMin'),
  rangeMax: document.getElementById('rangeMax'),
  minValue: document.getElementById('minValue'),
  maxValue: document.getElementById('maxValue'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  status: document.getElementById('status'),
  volumeSlider: document.getElementById('volumeSlider'),
  volumeValue: document.getElementById('volumeValue')
};

const state = {
  isRunning: false,
  beepTimeout: null,
  statusInterval: null,
  nextBeepTime: null,
  minValue: null,
  maxValue: null,
  volume: null,
};

function playBeep(frequency = 440, duration = 0.5) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(state.volume, audioContext.currentTime);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function pulseBeep() {
  elements.status.classList.add('beeping');
  setTimeout(() => {
    elements.status.classList.remove('beeping');
  }, 500);
}

function scheduleNextBeep() {
  const interval = Math.random() * (state.maxValue - state.minValue) + state.minValue;
  state.nextBeepTime = Date.now() + interval * 1000;
  state.beepTimeout = setTimeout(() => {
    playBeep();
    pulseBeep();
    scheduleNextBeep();
  }, interval * 1000);
}

function updateStatus() {
  const remaining = Math.max(0, (state.nextBeepTime - Date.now()) / 1000);
  elements.status.textContent = `Next beep in ${remaining.toFixed(1)} seconds...`;
}

function updateRangeDisplay() {
  elements.minValue.textContent = state.minValue.toFixed(1);
  elements.maxValue.textContent = state.maxValue.toFixed(1);
}

function updateRangeValues() {
  if (this === elements.rangeMin) {
    // Min slider is being moved
    let newMin = parseFloat(elements.rangeMin.value);
    if (newMin > state.maxValue - 0.5) {
      // need to clamp to prevent overlap
      newMin = state.maxValue - 0.5;
      elements.rangeMin.value = newMin;
    }
    state.minValue = newMin;
  }
  else {
    // Max slider is being moved
    let newMax = parseFloat(elements.rangeMax.value);
    if (newMax < state.minValue + 0.5) {
      // need to clamp to prevent overlap
      newMax = state.minValue + 0.5;
      elements.rangeMax.value = newMax;
    }
    state.maxValue = newMax;
  }
  
  updateRangeDisplay();
  // Reschedule if next beep is outside new range
  if (state.isRunning && state.nextBeepTime) {
    const remaining = (state.nextBeepTime - Date.now()) / 1000;
    if (remaining > state.maxValue) {
      clearTimeout(state.beepTimeout);
      scheduleNextBeep();
    }
  }
}

function start() {
  state.isRunning = true;
  elements.startBtn.disabled = true;
  elements.stopBtn.disabled = false;
  scheduleNextBeep();
  state.statusInterval = setInterval(updateStatus, 250);
}

function stop() {
  state.isRunning = false;
  clearTimeout(state.beepTimeout);
  clearInterval(state.statusInterval);
  state.nextBeepTime = null;
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  elements.status.textContent = 'Stopped';
}

function formatVolume(value) {
  // This is for cuteness, since we use quadratic volume scaling. Show the
  // eased value with 2 sig figs.
  const percent = value * 100;
  if (percent === 0) return '0.000%';
  if (percent === 100) return '100%';
  return percent.toPrecision(2) + '%';
}

function updateVolume() {
  const sliderValue = elements.volumeSlider.value / 100;
  state.volume = sliderValue * sliderValue;
  elements.volumeValue.textContent = formatVolume(state.volume);
}

function initialize() {
  state.minValue = parseFloat(elements.rangeMin.value);
  state.maxValue = parseFloat(elements.rangeMax.value);
  updateRangeDisplay();
  updateVolume();
  
  elements.rangeMin.addEventListener('input', updateRangeValues);
  elements.rangeMax.addEventListener('input', updateRangeValues);
  elements.startBtn.addEventListener('click', start);
  elements.stopBtn.addEventListener('click', stop);
  elements.volumeSlider.addEventListener('input', updateVolume);
}
initialize();
