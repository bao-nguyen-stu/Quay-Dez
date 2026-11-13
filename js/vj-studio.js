const tabBtnVj = document.getElementById('tabBtnVj');
const tabBtnMeme = document.getElementById('tabBtnMeme');
const vjStudioTabPanel = document.getElementById('vjStudioTabPanel');
const memeStudioTabPanel = document.getElementById('memeStudioTabPanel');

function switchStudioTab(tabName) {
  const isVj = tabName === 'vj';
  vjStudioTabPanel.classList.toggle('hidden', !isVj);
  memeStudioTabPanel.classList.toggle('hidden', isVj);

  tabBtnVj.className = isVj
    ? 'studio-tab-btn py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-studio-cyan/20 text-studio-cyan border border-studio-cyan/60 shadow-[0_0_12px_rgba(0,240,255,0.2)] transition flex items-center justify-center gap-1.5'
    : 'studio-tab-btn py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 border border-transparent transition flex items-center justify-center gap-1.5';

  tabBtnMeme.className = !isVj
    ? 'studio-tab-btn py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-studio-magenta/20 text-studio-magenta border border-studio-magenta/60 shadow-[0_0_12px_rgba(255,0,127,0.25)] transition flex items-center justify-center gap-1.5'
    : 'studio-tab-btn py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 border border-transparent transition flex items-center justify-center gap-1.5';
}

tabBtnVj.addEventListener('click', () => switchStudioTab('vj'));
tabBtnMeme.addEventListener('click', () => switchStudioTab('meme'));

const AVAILABLE_EFFECTS = [
  { id: 'kaleidoscope', label: 'Kaleidoscope', color: 'cyan' },
  { id: 'mandala', label: 'Mandala', color: 'magenta' },
  { id: 'colourStripe', label: 'Colour Stripe', color: 'lime' },
  { id: 'flash', label: 'Flash', color: 'amber' },
  { id: 'zoomPulse', label: 'Zoom & Shake', color: 'purple' },
  { id: 'sparkles', label: 'Sparkles', color: 'sky' }
];

const FREQUENCY_BANDS = [
  {
    id: 'bass',
    title: 'Bass & Sub-Bass',
    range: '20 Hz – 250 Hz',
    desc: 'Heavy impacts, zoom pulses, beat drops & deep flashes.',
    accent: '#00f0ff',
    defaultEffects: ['zoomPulse', 'flash']
  },
  {
    id: 'kick',
    title: 'Kick Drum Channel',
    range: '50 Hz – 120 Hz Punch',
    desc: 'Isolates transient kicks to lock animations tightly to tempo.',
    accent: '#ff007f',
    defaultEffects: ['kaleidoscope']
  },
  {
    id: 'mids',
    title: 'Mids (Vocals & Synths)',
    range: '250 Hz – 4 kHz',
    desc: 'Harmonic color shifts, sacred geometry morphing & waves.',
    accent: '#9d4edd',
    defaultEffects: ['mandala', 'colourStripe']
  },
  {
    id: 'highs',
    title: 'Highs (Hi-Hats & Cymbals)',
    range: '4 kHz – 16 kHz',
    desc: 'Fast-moving sparkles, neon aurora streaks & micro-strobes.',
    accent: '#39ff14',
    defaultEffects: ['sparkles']
  }
];

const state = {
  mappings: {
    bass: ['zoomPulse', 'flash'],
    kick: ['kaleidoscope'],
    mids: ['mandala', 'colourStripe'],
    highs: ['sparkles']
  },
  volume: 0.85,
  isMuted: false,
  reactivityStrength: 0.65,
  sourceMode: 'none',
  isPlaying: false,
  trackName: '',
  energy: {
    bass: 0,
    kick: 0,
    mids: 0,
    highs: 0,
    overall: 0
  },
  manualImpulse: {
    flash: 0,
    pulse: 0,
    kaleido: 0,
    sparkle: 0
  },
  dj: {
    leftAngle: 0,
    rightAngle: 0,
    leftDragging: false,
    rightDragging: false,
    leftVelocity: 0,
    rightVelocity: 0,
    scratchImpulse: 0
  },
  mandalaShapeIndex: 0,
  mandalaPetals: 12,
  mandalaMorphPhase: 0,
  lastMandalaShiftTime: 0,
  time: 0,
  hueShift: 0,
  kaleidoAngle: 0,
  mandalaAngle: 0,
  kickDecay: 0,
  lastKickEnergy: 0,
  tornadoActive: false
};

const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('aether_vj_sync') : null;
let previewWindowRef = null;

const audioPlayer = document.getElementById('audioPlayer');
const audioFileInput = document.getElementById('audioFileInput');
const dropZone = document.getElementById('dropZone');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseLabel = document.getElementById('playPauseLabel');
const demoSynthBtn = document.getElementById('demoSynthBtn');
const demoSynthLabel = document.getElementById('demoSynthLabel');
const trackInfoBar = document.getElementById('trackInfoBar');
const trackNameDisplay = document.getElementById('trackNameDisplay');
const trackTimeDisplay = document.getElementById('trackTimeDisplay');
const audioSourceBadge = document.getElementById('audioSourceBadge');

const micToggleBtn = document.getElementById('micToggleBtn');
const micDot = document.getElementById('micDot');
const micBtnLabel = document.getElementById('micBtnLabel');
const recordBtn = document.getElementById('recordBtn');
const recDot = document.getElementById('recDot');
const recBtnLabel = document.getElementById('recBtnLabel');
const micMeterContainer = document.getElementById('micMeterContainer');
const micLevelBar = document.getElementById('micLevelBar');
const micDbLabel = document.getElementById('micDbLabel');

const reactivitySlider = document.getElementById('reactivitySlider');
const reactivityPercentText = document.getElementById('reactivityPercentText');
const reactivityPresetBtns = document.querySelectorAll('.reactivity-preset-btn');

const masterVolumeSlider = document.getElementById('masterVolumeSlider');
const volumePercentText = document.getElementById('volumePercentText');
const muteToggleBtn = document.getElementById('muteToggleBtn');
const volIconUnmuted = document.getElementById('volIconUnmuted');
const volIconMuted = document.getElementById('volIconMuted');
const openPreviewTabBtn = document.getElementById('openPreviewTabBtn');

const vjCanvas = document.getElementById('vjCanvas');
const ctx = vjCanvas.getContext('2d');
const projectionWallContainer = document.getElementById('projectionWallContainer');
const wallGlowOverlay = document.getElementById('wallGlowOverlay');
const aspectRatioBadge = document.getElementById('aspectRatioBadge');

const leftSpeakerStack = document.getElementById('leftSpeakerStack');
const rightSpeakerStack = document.getElementById('rightSpeakerStack');
const speakerCones = document.querySelectorAll('.speaker-cone');
const leftJogWheel = document.getElementById('leftJogWheel');
const rightJogWheel = document.getElementById('rightJogWheel');
const leftJogHousing = document.getElementById('leftJogHousing');
const rightJogHousing = document.getElementById('rightJogHousing');
const leftDeckStatus = document.getElementById('leftDeckStatus');
const rightDeckStatus = document.getElementById('rightDeckStatus');

const mixerVuBass = document.getElementById('mixerVuBass');
const mixerVuKick = document.getElementById('mixerVuKick');
const mixerVuMids = document.getElementById('mixerVuMids');
const mixerVuHighs = document.getElementById('mixerVuHighs');

let toastTimeout = null;
function showToast(msg) {
  const banner = document.getElementById('toastBanner');
  const text = document.getElementById('toastMessage');
  text.textContent = msg;
  banner.classList.remove('opacity-0', 'translate-y-[-10px]');
  banner.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    banner.classList.add('opacity-0', 'translate-y-[-10px]');
    banner.classList.remove('opacity-100', 'translate-y-0');
  }, 3200);
}

document.getElementById('dismissControlWarningBtn').addEventListener('click', () => {
  document.getElementById('controlFlashWarning').classList.add('hidden');
});

let audioCtx = null;
let analyser = null;
let djFilter = null;
let masterGain = null;
let fileMediaSource = null;
let micMediaSource = null;
let micStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let synthInterval = null;
let freqData = null;
let scratchNoiseBuffer = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;

    djFilter = audioCtx.createBiquadFilter();
    djFilter.type = 'allpass';
    djFilter.frequency.value = 1000;
    djFilter.Q.value = 1.0;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = state.isMuted ? 0 : state.volume;

    analyser.connect(djFilter);
    djFilter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    freqData = new Uint8Array(analyser.frequencyBinCount);

    const len = audioCtx.sampleRate * 1.0;
    scratchNoiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const ch = scratchNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      ch[i] = (b0 + b1 + b2 + white * 0.18) * 1.6;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

let lastScratchSoundTime = 0;
function triggerVinylScratchSound(angularVelocity, deck = 'left') {
  initAudioContext();
  const now = audioCtx.currentTime;
  if (now - lastScratchSoundTime < 0.032) return;
  lastScratchSoundTime = now;

  const speed = Math.min(4.0, Math.abs(angularVelocity) * 18);
  if (speed < 0.08) return;

  const noise = audioCtx.createBufferSource();
  noise.buffer = scratchNoiseBuffer;
  const offset = Math.random() * 0.7;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  const baseFreq = deck === 'left' ? 950 : 680;
  const targetFreq = Math.min(4800, Math.max(240, baseFreq + speed * 850 * (angularVelocity >= 0 ? 1.2 : 0.75)));
  bandpass.frequency.setValueAtTime(targetFreq, now);
  bandpass.Q.setValueAtTime(4.2, now);

  const scratchGain = audioCtx.createGain();
  const vol = Math.min(0.42, speed * 0.14);
  scratchGain.gain.setValueAtTime(0.001, now);
  scratchGain.gain.linearRampToValueAtTime(vol, now + 0.008);
  scratchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

  noise.connect(bandpass);
  bandpass.connect(scratchGain);
  scratchGain.connect(analyser);
  noise.start(now, offset, 0.06);

  const chirpOsc = audioCtx.createOscillator();
  const chirpGain = audioCtx.createGain();
  chirpOsc.type = deck === 'left' ? 'triangle' : 'sawtooth';
  const startPitch = deck === 'left' ? 220 : 165;
  const endPitch = Math.min(1400, Math.max(95, startPitch * (1 + angularVelocity * 6.5)));
  chirpOsc.frequency.setValueAtTime(startPitch, now);
  chirpOsc.frequency.exponentialRampToValueAtTime(endPitch, now + 0.045);

  chirpGain.gain.setValueAtTime(vol * 0.45, now);
  chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  chirpOsc.connect(chirpGain);
  chirpGain.connect(analyser);
  chirpOsc.start(now);
  chirpOsc.stop(now + 0.055);
}

function applyDJTurntableDSP() {
  const { leftDragging, rightDragging, leftVelocity, rightVelocity } = state.dj;

  if (state.sourceMode === 'file' && audioPlayer && !audioPlayer.paused) {
    if (leftDragging) {
      let rate = 1.0 + leftVelocity * 7.5;
      if (Math.abs(leftVelocity) < 0.008) {
        rate = 0.12;
      } else if (leftVelocity < -0.015) {
        rate = 0.25;
        if (audioPlayer.currentTime > 0.06) {
          audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - Math.min(0.14, Math.abs(leftVelocity) * 0.45));
        }
      }
      audioPlayer.playbackRate = Math.max(0.1, Math.min(2.3, rate));
    } else if (rightDragging) {
      const bendRate = 1.0 + rightVelocity * 3.5;
      audioPlayer.playbackRate = Math.max(0.55, Math.min(1.65, bendRate));
    } else if (Math.abs(audioPlayer.playbackRate - 1.0) > 0.01) {
      audioPlayer.playbackRate += (1.0 - audioPlayer.playbackRate) * 0.22;
      if (Math.abs(audioPlayer.playbackRate - 1.0) < 0.015) audioPlayer.playbackRate = 1.0;
    }
  }

  if (djFilter && audioCtx) {
    const now = audioCtx.currentTime;
    if (leftDragging) {
      djFilter.type = 'highpass';
      const hpFreq = Math.min(3400, Math.max(90, 260 + Math.abs(leftVelocity) * 14000));
      djFilter.frequency.setTargetAtTime(hpFreq, now, 0.02);
      djFilter.Q.setTargetAtTime(5.5, now, 0.02);
    } else if (rightDragging) {
      djFilter.type = 'lowpass';
      const lpFreq = Math.max(180, Math.min(14000, 1400 - rightVelocity * 8500));
      djFilter.frequency.setTargetAtTime(lpFreq, now, 0.02);
      djFilter.Q.setTargetAtTime(6.5, now, 0.02);
    } else if (djFilter.type !== 'allpass') {
      djFilter.type = 'allpass';
      djFilter.Q.setTargetAtTime(1.0, now, 0.04);
    }
  }
}

function stopActiveSources(exceptMode = null) {
  if (exceptMode !== 'file' && !audioPlayer.paused) {
    audioPlayer.pause();
  }
  if (exceptMode !== 'synth' && synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
    demoSynthLabel.textContent = 'Demo Beat';
    demoSynthBtn.classList.remove('ring-2', 'ring-studio-magenta');
  }
  if (exceptMode !== 'mic' && micStream) {
    if (isRecording) toggleRecording();
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
    if (micMediaSource) {
      try { micMediaSource.disconnect(); } catch (e) {}
      micMediaSource = null;
    }
    if (analyser && djFilter) {
      try { analyser.disconnect(); } catch (e) {}
      analyser.connect(djFilter);
    }
    micDot.className = 'w-2 h-2 rounded-full bg-slate-500';
    micBtnLabel.textContent = 'Mic / Live Input';
    recordBtn.disabled = true;
    micMeterContainer.classList.add('hidden');
  }
}

async function loadAudioFile(file) {
  if (!file) return;
  initAudioContext();
  stopActiveSources('file');

  const objectUrl = URL.createObjectURL(file);
  audioPlayer.src = objectUrl;
  audioPlayer.loop = true;
  audioPlayer.playbackRate = 1.0;

  if (!fileMediaSource) {
    fileMediaSource = audioCtx.createMediaElementSource(audioPlayer);
    fileMediaSource.connect(analyser);
  }

  state.sourceMode = 'file';
  state.trackName = file.name;
  trackNameDisplay.textContent = file.name;
  trackInfoBar.classList.remove('hidden');
  trackInfoBar.classList.add('flex');
  playPauseBtn.disabled = false;
  audioSourceBadge.textContent = 'FILE LOOP';
  audioSourceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-cyan/20 text-studio-cyan border border-studio-cyan/40';

  try {
    await audioPlayer.play();
    state.isPlaying = true;
    updateTransportUI();
    showToast(`Playing & looping: ${file.name}`);
  } catch (err) {
    state.isPlaying = false;
    updateTransportUI();
    showToast('Track loaded! Click "Play Loop" to start audio.');
  }
}

function updateTransportUI() {
  const playing = state.isPlaying;
  playPauseLabel.textContent = playing ? 'Pause Loop' : 'Play Loop';
  broadcastSyncState();
}

function toggleDemoSynth() {
  initAudioContext();
  if (state.sourceMode === 'synth' && synthInterval) {
    stopActiveSources();
    state.sourceMode = 'none';
    state.isPlaying = false;
    audioSourceBadge.textContent = 'STANDBY';
    audioSourceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
    updateTransportUI();
    return;
  }

  stopActiveSources('synth');
  state.sourceMode = 'synth';
  state.isPlaying = true;
  state.trackName = 'AETHER 128 BPM Synth Engine';
  trackNameDisplay.textContent = state.trackName;
  trackInfoBar.classList.remove('hidden');
  trackInfoBar.classList.add('flex');
  audioSourceBadge.textContent = 'LIVE SYNTH';
  audioSourceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-magenta/20 text-studio-magenta border border-studio-magenta/40';
  demoSynthLabel.textContent = 'Stop Beat';
  demoSynthBtn.classList.add('ring-2', 'ring-studio-magenta');
  updateTransportUI();

  let step = 0;
  const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 49.0, 55];

  const triggerStep = () => {
    if (!audioCtx || state.sourceMode !== 'synth') return;
    const now = audioCtx.currentTime;

    const djPitchMult = state.dj.leftDragging
      ? Math.max(0.4, 1 + state.dj.leftVelocity * 3.5)
      : (state.dj.rightDragging ? Math.max(0.5, 1 + state.dj.rightVelocity * 2.5) : 1.0);

    if (step % 4 === 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145 * djPitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(38 * djPitchMult, now + 0.14);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(analyser);
      osc.start(now);
      osc.stop(now + 0.29);
    }

    if (step % 2 === 1) {
      const bassOsc = audioCtx.createOscillator();
      const bassFilter = audioCtx.createBiquadFilter();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNotes[(step >> 1) % bassNotes.length] * djPitchMult, now);
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, now);
      bassGain.gain.setValueAtTime(0.42, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(analyser);
      bassOsc.start(now);
      bassOsc.stop(now + 0.19);
    }

    if (step % 2 === 0) {
      const arpNotes = [220, 261.63, 329.63, 392.0, 440, 523.25, 392.0, 329.63];
      const synthOsc = audioCtx.createOscillator();
      const synthGain = audioCtx.createGain();
      synthOsc.type = 'triangle';
      synthOsc.frequency.setValueAtTime(arpNotes[(step / 2) % arpNotes.length] * djPitchMult, now);
      synthGain.gain.setValueAtTime(0.22, now);
      synthGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      synthOsc.connect(synthGain);
      synthGain.connect(analyser);
      synthOsc.start(now);
      synthOsc.stop(now + 0.17);
    }

    const bufferSize = audioCtx.sampleRate * 0.05;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 6500;
    const hatGain = audioCtx.createGain();
    const hatVol = (step % 4 === 2) ? 0.35 : 0.14;
    hatGain.gain.setValueAtTime(hatVol, now);
    hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    whiteNoise.connect(hpFilter);
    hpFilter.connect(hatGain);
    hatGain.connect(analyser);
    whiteNoise.start(now);

    step = (step + 1) % 16;
  };

  triggerStep();
  synthInterval = setInterval(triggerStep, 117);
  showToast('128 BPM Demo Synth Beat activated! Try dragging the Cyan & Pink discs.');
}

async function toggleMicInput() {
  initAudioContext();
  if (state.sourceMode === 'mic' && micStream) {
    stopActiveSources();
    state.sourceMode = 'none';
    state.isPlaying = false;
    audioSourceBadge.textContent = 'STANDBY';
    audioSourceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
    updateTransportUI();
    showToast('Microphone input stopped.');
    return;
  }

  try {
    stopActiveSources('mic');
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    try { analyser.disconnect(); } catch (e) {}

    micMediaSource = audioCtx.createMediaStreamSource(micStream);
    micMediaSource.connect(analyser);

    state.sourceMode = 'mic';
    state.isPlaying = true;
    micDot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-ping';
    micBtnLabel.textContent = 'Stop Mic Input';
    recordBtn.disabled = false;
    micMeterContainer.classList.remove('hidden');
    audioSourceBadge.textContent = 'MIC LIVE';
    audioSourceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40';
    updateTransportUI();
    showToast('Live Microphone / Ambient Audio active!');
  } catch (err) {
    showToast('Microphone permission denied or unavailable.');
  }
}

function toggleRecording() {
  if (!micStream) return;
  if (!isRecording) {
    recordedChunks = [];
    try {
      mediaRecorder = new MediaRecorder(micStream);
    } catch (e) {
      showToast('Audio recording not supported in this browser.');
      return;
    }
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VJ_Live_Capture_${Date.now()}.webm`;
      a.click();
      showToast('Recorded audio clip downloaded!');
    };
    mediaRecorder.start();
    isRecording = true;
    recBtnLabel.textContent = 'Stop & Save';
    recDot.classList.add('animate-ping');
    showToast('Recording live audio input...');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recBtnLabel.textContent = 'Record';
    recDot.classList.remove('animate-ping');
  }
}

function setupDJTurntable(wheelEl, housingEl, statusEl, side) {
  let lastPointerAngle = 0;

  const getAngleFromCenter = (clientX, clientY) => {
    const rect = wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    initAudioContext();
    wheelEl.setPointerCapture(e.pointerId);
    lastPointerAngle = getAngleFromCenter(e.clientX, e.clientY);

    if (side === 'left') {
      state.dj.leftDragging = true;
      state.dj.leftVelocity = 0;
      housingEl.classList.add('ring-2', 'ring-studio-cyan', 'shadow-[0_0_20px_rgba(0,240,255,0.65)]');
      statusEl.textContent = 'SCRATCHING!';
    } else {
      state.dj.rightDragging = true;
      state.dj.rightVelocity = 0;
      housingEl.classList.add('ring-2', 'ring-studio-magenta', 'shadow-[0_0_20px_rgba(255,0,127,0.65)]');
      statusEl.textContent = 'FILTER FX!';
    }
    wheelEl.classList.add('scratching');
  };

  const onPointerMove = (e) => {
    const isDragging = side === 'left' ? state.dj.leftDragging : state.dj.rightDragging;
    if (!isDragging) return;

    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    let delta = currentAngle - lastPointerAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    lastPointerAngle = currentAngle;

    const degDelta = delta * (180 / Math.PI);
    if (side === 'left') {
      state.dj.leftAngle = (state.dj.leftAngle + degDelta) % 360;
      state.dj.leftVelocity = delta;
    } else {
      state.dj.rightAngle = (state.dj.rightAngle + degDelta) % 360;
      state.dj.rightVelocity = delta;
    }

    state.dj.scratchImpulse = Math.min(1.0, state.dj.scratchImpulse + Math.abs(delta) * 1.4);
    triggerVinylScratchSound(delta, side);
  };

  const onPointerUp = (e) => {
    if (wheelEl.hasPointerCapture && wheelEl.hasPointerCapture(e.pointerId)) {
      wheelEl.releasePointerCapture(e.pointerId);
    }
    wheelEl.classList.remove('scratching');
    if (side === 'left') {
      state.dj.leftDragging = false;
      state.dj.leftVelocity = 0;
      housingEl.classList.remove('ring-2', 'ring-studio-cyan', 'shadow-[0_0_20px_rgba(0,240,255,0.65)]');
      statusEl.textContent = 'SCRATCH L';
    } else {
      state.dj.rightDragging = false;
      state.dj.rightVelocity = 0;
      housingEl.classList.remove('ring-2', 'ring-studio-magenta', 'shadow-[0_0_20px_rgba(255,0,127,0.65)]');
      statusEl.textContent = 'FX DISC R';
    }
  };

  wheelEl.addEventListener('pointerdown', onPointerDown);
  wheelEl.addEventListener('pointermove', onPointerMove);
  wheelEl.addEventListener('pointerup', onPointerUp);
  wheelEl.addEventListener('pointercancel', onPointerUp);
}

setupDJTurntable(leftJogWheel, leftJogHousing, leftDeckStatus, 'left');
setupDJTurntable(rightJogWheel, rightJogHousing, rightDeckStatus, 'right');

function setReactivityStrength(val) {
  state.reactivityStrength = Math.max(0.1, Math.min(1.2, val));
  const pct = Math.round(state.reactivityStrength * 100);
  reactivitySlider.value = pct;
  reactivityPercentText.textContent = `${pct}%`;

  reactivityPresetBtns.forEach((btn) => {
    const presetVal = Number(btn.getAttribute('data-reactivity'));
    const isSelected = Math.abs(presetVal - state.reactivityStrength) < 0.03;
    btn.className = isSelected
      ? 'reactivity-preset-btn py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-studio-cyan/20 text-studio-cyan border border-studio-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)] transition'
      : 'reactivity-preset-btn py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-studio-panel text-slate-400 border border-studio-border hover:text-slate-200 transition';
  });
  broadcastSyncState();
}

reactivitySlider.addEventListener('input', (e) => {
  setReactivityStrength(Number(e.target.value) / 100);
});

reactivityPresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    setReactivityStrength(Number(btn.getAttribute('data-reactivity')));
  });
});

function renderFrequencyControls() {
  const container = document.getElementById('frequencyBandsContainer');
  container.innerHTML = '';

  FREQUENCY_BANDS.forEach((band) => {
    const selected = state.mappings[band.id] || [];
    const card = document.createElement('div');
    card.className = 'bg-studio-bg/75 border border-studio-border rounded-xl p-3 space-y-2 transition-colors hover:border-slate-700';

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" style="background:${band.accent}; box-shadow: 0 0 8px ${band.accent};"></span>
            <h3 class="text-xs font-bold text-slate-100">${band.title}</h3>
            <span class="text-[10px] font-mono text-slate-400">(${band.range})</span>
          </div>
          <p class="text-[10.5px] text-slate-400 mt-0.5 leading-snug">${band.desc}</p>
        </div>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-panel border border-studio-border text-slate-300 shrink-0">
          ${selected.length}/2
        </span>
      </div>
      <div class="w-full h-1 bg-studio-panel rounded-full overflow-hidden">
        <div id="meter_${band.id}" class="h-full w-0 transition-all duration-75" style="background:${band.accent};"></div>
      </div>
      <div class="flex flex-wrap gap-1.5 pt-1" id="chips_${band.id}"></div>
    `;

    const chipsWrap = card.querySelector(`#chips_${band.id}`);
    AVAILABLE_EFFECTS.forEach((fx) => {
      const isActive = selected.includes(fx.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = isActive
        ? 'px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-studio-cyan/20 text-studio-cyan border border-studio-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)] transition active:scale-95'
        : 'px-2.5 py-1 rounded-lg text-[11px] font-medium bg-studio-panel text-slate-400 border border-studio-border hover:text-slate-200 hover:border-slate-600 transition active:scale-95';
      btn.textContent = fx.label;

      btn.addEventListener('click', () => {
        toggleBandEffect(band.id, fx.id);
      });

      chipsWrap.appendChild(btn);
    });

    container.appendChild(card);
  });
}

function toggleBandEffect(bandId, effectId) {
  const current = [...state.mappings[bandId]];
  const idx = current.indexOf(effectId);

  if (idx !== -1) {
    current.splice(idx, 1);
  } else {
    if (current.length >= 2) {
      current.shift();
      showToast('Max 2 effects per frequency band — replaced oldest selection.');
    }
    current.push(effectId);
  }

  state.mappings[bandId] = current;
  renderFrequencyControls();
  broadcastSyncState();
}

function analyzeAudioFrequencies() {
  if (!analyser || !freqData || !state.isPlaying) {
    const idlePulse = (Math.sin(state.time * 1.6) + 1) * 0.08;
    state.energy.bass = idlePulse;
    state.energy.kick = 0;
    state.energy.mids = idlePulse * 1.2;
    state.energy.highs = idlePulse * 0.7;
    state.energy.overall = idlePulse;
    return;
  }

  analyser.getByteFrequencyData(freqData);
  const nyquist = audioCtx.sampleRate / 2;
  const binCount = freqData.length;

  const getBandAverage = (lowHz, highHz) => {
    const startBin = Math.max(0, Math.floor((lowHz / nyquist) * binCount));
    const endBin = Math.min(binCount - 1, Math.ceil((highHz / nyquist) * binCount));
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += freqData[i];
      count++;
    }
    return count > 0 ? (sum / count) / 255 : 0;
  };

  const rawBass = getBandAverage(20, 250);
  const rawKickZone = getBandAverage(50, 120);
  const rawMids = getBandAverage(250, 4000);
  const rawHighs = getBandAverage(4000, 16000);

  const kickDelta = rawKickZone - state.lastKickEnergy;
  state.lastKickEnergy = rawKickZone * 0.75 + state.lastKickEnergy * 0.25;
  if (kickDelta > 0.065 && rawKickZone > 0.35) {
    state.kickDecay = Math.min(1.0, rawKickZone * 1.35);
  } else {
    state.kickDecay *= 0.84;
  }

  state.energy.bass = Math.pow(rawBass, 1.15);
  state.energy.kick = state.kickDecay;
  state.energy.mids = Math.pow(rawMids, 1.05);
  state.energy.highs = Math.min(1, rawHighs * 1.45);
  state.energy.overall = (state.energy.bass + state.energy.mids + state.energy.highs) / 3;
}

const particles = Array.from({ length: 95 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: Math.random() * 0.8 + 0.2,
  size: Math.random() * 2.5 + 0.8,
  hueOffset: Math.random() * 140
}));

const neonStripes = Array.from({ length: 28 }, (_, i) => ({
  x: (i / 28) + (Math.random() * 0.02),
  width: Math.random() * 0.018 + 0.004,
  speed: Math.random() * 0.8 + 0.4,
  phase: Math.random() * Math.PI * 2,
  hue: [185, 130, 58, 315, 275][i % 5]
}));

const MANDALA_PETAL_COUNTS = [6, 8, 10, 12, 16, 20];

function drawGenerativeMandalaLayer(targetCtx, mx, my, radius, petals, shapeType, rot, hueBase, alpha, morphPhase, reactivity) {
  targetCtx.save();
  targetCtx.translate(mx, my);
  targetCtx.rotate(rot);

  targetCtx.beginPath();
  targetCtx.arc(0, 0, radius, 0, Math.PI * 2);
  targetCtx.strokeStyle = `hsla(${hueBase % 360}, 95%, 60%, ${alpha * 0.7})`;
  targetCtx.lineWidth = 1.2 + reactivity * 1.4;
  targetCtx.stroke();

  targetCtx.save();
  targetCtx.setLineDash([4, 6]);
  targetCtx.beginPath();
  targetCtx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  targetCtx.strokeStyle = `hsla(${(hueBase + 60) % 360}, 95%, 65%, ${alpha * 0.6})`;
  targetCtx.lineWidth = 1.1;
  targetCtx.stroke();
  targetCtx.restore();

  targetCtx.beginPath();
  const starPoints = Math.max(5, Math.floor(petals / 2));
  for (let i = 0; i <= starPoints * 2; i++) {
    const r = (i % 2 === 0) ? radius * 0.44 : radius * 0.21;
    const a = (i / (starPoints * 2)) * Math.PI * 2;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r;
    if (i === 0) targetCtx.moveTo(sx, sy);
    else targetCtx.lineTo(sx, sy);
  }
  targetCtx.closePath();
  targetCtx.strokeStyle = `hsla(${(hueBase + 140) % 360}, 95%, 62%, ${alpha * 0.65})`;
  targetCtx.lineWidth = 1.2;
  targetCtx.stroke();

  for (let layer = 0; layer < 2; layer++) {
    const layerR = radius * (layer === 0 ? 0.96 : 0.62);
    const layerHue = (hueBase + layer * 115) % 360;
    const spread = 0.24 + Math.sin(morphPhase + layer) * 0.08;

    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2 + (layer * Math.PI / petals);
      targetCtx.save();
      targetCtx.rotate(ang);
      targetCtx.beginPath();

      if (shapeType === 0) {
        targetCtx.moveTo(0, 0);
        targetCtx.bezierCurveTo(layerR * 0.45, -layerR * spread, layerR * 0.82, -layerR * 0.16, layerR, 0);
        targetCtx.bezierCurveTo(layerR * 0.82, layerR * 0.16, layerR * 0.45, layerR * spread, 0, 0);
      } else if (shapeType === 1) {
        targetCtx.moveTo(layerR * 0.12, 0);
        targetCtx.bezierCurveTo(layerR * 0.45, -layerR * (spread * 1.45), layerR * 1.05, -layerR * (spread * 1.15), layerR * 0.96, 0);
        targetCtx.bezierCurveTo(layerR * 1.05, layerR * (spread * 1.15), layerR * 0.45, layerR * (spread * 1.45), layerR * 0.12, 0);
      } else if (shapeType === 2) {
        targetCtx.moveTo(layerR * 0.15, 0);
        targetCtx.lineTo(layerR * 0.58, -layerR * spread);
        targetCtx.lineTo(layerR, 0);
        targetCtx.lineTo(layerR * 0.58, layerR * spread);
        targetCtx.closePath();
      } else {
        targetCtx.moveTo(0, 0);
        targetCtx.quadraticCurveTo(layerR * 0.5, -layerR * (spread * 1.35), layerR * 0.85, -layerR * 0.08);
        targetCtx.quadraticCurveTo(layerR * 1.02, 0, layerR * 0.85, layerR * 0.08);
        targetCtx.quadraticCurveTo(layerR * 0.5, layerR * (spread * 1.35), 0, 0);
      }

      targetCtx.fillStyle = `hsla(${layerHue}, 90%, 54%, ${alpha * 0.14})`;
      targetCtx.fill();
      targetCtx.strokeStyle = `hsla(${layerHue}, 96%, 64%, ${alpha * 0.72})`;
      targetCtx.lineWidth = 1.15;
      targetCtx.stroke();

      if (layer === 0) {
        targetCtx.beginPath();
        targetCtx.arc(layerR * 1.03, 0, 1.8 + reactivity * 2.2, 0, Math.PI * 2);
        targetCtx.fillStyle = `hsla(${(layerHue + 40) % 360}, 100%, 68%, ${alpha * 0.8})`;
        targetCtx.fill();
      }

      targetCtx.restore();
    }
  }

  targetCtx.restore();
}

function renderVJFrame(targetCtx, width, height) {
  if (width <= 0 || height <= 0) return;

  const reactivity = state.reactivityStrength;
  const { bass, kick, mids, highs } = state.energy;
  const manualFlash = state.manualImpulse.flash;
  const manualPulse = state.manualImpulse.pulse;
  const manualKaleido = state.manualImpulse.kaleido;
  const manualSparkle = state.manualImpulse.sparkle;
  const scratchImpulse = state.dj.scratchImpulse;

  const effectPower = {
    kaleidoscope: 0,
    mandala: 0,
    colourStripe: 0,
    flash: 0,
    zoomPulse: 0,
    sparkles: 0
  };

  Object.entries(state.mappings).forEach(([bandKey, effects]) => {
    const bandVal = (state.energy[bandKey] || 0) * reactivity;
    effects.forEach((fx) => {
      effectPower[fx] = Math.max(effectPower[fx], Math.min(1.0, bandVal));
    });
  });

  effectPower.flash = Math.min(0.95, effectPower.flash + manualFlash * 0.85);
  effectPower.zoomPulse = Math.min(1.0, effectPower.zoomPulse + manualPulse + scratchImpulse * 0.35);
  effectPower.kaleidoscope = Math.min(1.0, effectPower.kaleidoscope + manualKaleido + scratchImpulse * 0.45);
  effectPower.sparkles = Math.min(1.0, effectPower.sparkles + manualSparkle + scratchImpulse * 0.55);

  state.time += 0.016;
  state.mandalaMorphPhase += 0.025 + mids * reactivity * 0.06;
  state.hueShift = (state.hueShift + 0.35 + mids * reactivity * 2.4) % 360;

  const djAngleSpin = (state.dj.leftVelocity * 2.2) + (state.dj.rightVelocity * 1.8);
  state.kaleidoAngle += (0.006 + kick * reactivity * 0.032 + bass * reactivity * 0.01) + djAngleSpin;
  state.mandalaAngle -= (0.004 + mids * reactivity * 0.02) - djAngleSpin * 0.75;

  if ((kick > 0.72 || mids > 0.68) && (state.time - state.lastMandalaShiftTime > 2.4)) {
    state.lastMandalaShiftTime = state.time;
    state.mandalaShapeIndex = (state.mandalaShapeIndex + 1) % 4;
    const nextIdx = (MANDALA_PETAL_COUNTS.indexOf(state.mandalaPetals) + 1) % MANDALA_PETAL_COUNTS.length;
    state.mandalaPetals = MANDALA_PETAL_COUNTS[nextIdx];
  }

  targetCtx.globalCompositeOperation = 'source-over';
  const bgClearAlpha = Math.max(0.24, 0.36 - mids * reactivity * 0.1);
  targetCtx.fillStyle = `rgba(6, 6, 12, ${bgClearAlpha})`;
  targetCtx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  targetCtx.save();

  if (effectPower.zoomPulse > 0.01) {
    const p = effectPower.zoomPulse;
    const zoomScale = 1 + p * 0.2;
    const shakeX = (Math.random() - 0.5) * p * 16;
    const shakeY = (Math.random() - 0.5) * p * 16;
    targetCtx.translate(cx + shakeX, cy + shakeY);
    targetCtx.scale(zoomScale, zoomScale);
    targetCtx.translate(-cx, -cy);
  }

  targetCtx.globalCompositeOperation = 'screen';

  if (effectPower.colourStripe > 0.02) {
    const p = effectPower.colourStripe;
    const horizonY = height * 0.64;

    neonStripes.forEach((s, idx) => {
      const beamX = ((s.x + Math.sin(state.time * 0.4 + s.phase) * 0.03) % 1) * width;
      const beamH = height * (0.26 + p * 0.54 * (0.5 + 0.5 * Math.sin(state.time * s.speed * 3 + s.phase)));
      const beamY = (idx % 2 === 0) ? 0 : Math.max(0, horizonY - beamH * 0.85);
      const hue = (s.hue + state.hueShift * 0.4) % 360;

      const grad = targetCtx.createLinearGradient(beamX, beamY, beamX, beamY + beamH);
      grad.addColorStop(0, `hsla(${hue}, 100%, 55%, 0)`);
      grad.addColorStop(0.5, `hsla(${hue}, 100%, 54%, ${0.14 + p * 0.36})`);
      grad.addColorStop(1, `hsla(${hue}, 100%, 58%, 0)`);

      targetCtx.fillStyle = grad;
      targetCtx.fillRect(beamX, beamY, s.width * width * (1 + p * 0.8), beamH);

      const refGrad = targetCtx.createLinearGradient(beamX, horizonY, beamX, height);
      refGrad.addColorStop(0, `hsla(${hue}, 100%, 55%, ${0.12 + p * 0.25})`);
      refGrad.addColorStop(1, `hsla(${hue}, 100%, 48%, 0)`);
      targetCtx.fillStyle = refGrad;
      targetCtx.fillRect(beamX - 2, horizonY, s.width * width * 1.3, (height - horizonY) * 0.9);
    });

    targetCtx.beginPath();
    const slices = 64;
    for (let i = 0; i <= slices; i++) {
      const t = i / slices;
      const x = t * width;
      const binVal = freqData ? (freqData[i * 4] / 255) : p;
      const spike = binVal * height * 0.22 * (0.35 + p);
      const y = horizonY - spike * Math.sin(t * Math.PI);
      if (i === 0) targetCtx.moveTo(x, horizonY);
      targetCtx.lineTo(x, y);
    }
    targetCtx.strokeStyle = `hsla(${(185 + state.hueShift) % 360}, 100%, 62%, ${0.38 + p * 0.45})`;
    targetCtx.lineWidth = 1.8 + p * 2.0;
    targetCtx.stroke();
  }

  if (effectPower.kaleidoscope > 0.02) {
    const p = effectPower.kaleidoscope;
    const segments = 12;
    const outerRadius = maxDim * (0.46 + p * 0.24);

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate(state.kaleidoAngle);

    for (let ring = 1; ring <= 4; ring++) {
      const rBase = (outerRadius / 4) * ring * (0.85 + p * 0.3);
      const hue = (ring % 2 === 0 ? 190 : 312) + state.hueShift;

      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        targetCtx.save();
        targetCtx.rotate(theta);

        targetCtx.beginPath();
        targetCtx.moveTo(rBase * 0.35, 0);
        targetCtx.quadraticCurveTo(rBase * 0.72, -rBase * 0.24 * (0.7 + p * 0.55), rBase, 0);
        targetCtx.quadraticCurveTo(rBase * 0.72, rBase * 0.24 * (0.7 + p * 0.55), rBase * 0.35, 0);

        targetCtx.fillStyle = `hsla(${hue % 360}, 95%, 52%, ${0.08 + p * 0.18})`;
        targetCtx.fill();
        targetCtx.lineWidth = 1.1 + p * 1.6;
        targetCtx.strokeStyle = `hsla(${(hue + 35) % 360}, 100%, 62%, ${0.28 + p * 0.48})`;
        targetCtx.stroke();
        targetCtx.restore();
      }
    }

    const coreRadius = minDim * (0.08 + p * 0.12);
    const coreGrad = targetCtx.createRadialGradient(0, 0, 2, 0, 0, coreRadius * 1.35);
    coreGrad.addColorStop(0, `hsla(${(185 + state.hueShift) % 360}, 100%, 72%, ${0.42 + p * 0.35})`);
    coreGrad.addColorStop(0.55, `hsla(${(310 + state.hueShift) % 360}, 100%, 54%, ${0.22 + p * 0.35})`);
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    targetCtx.fillStyle = coreGrad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, coreRadius * 1.35, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
  }

  if (effectPower.mandala > 0.02) {
    const p = effectPower.mandala;
    const mainR = minDim * (0.24 + p * 0.16);
    const alpha = Math.min(0.82, 0.24 + p * 0.52);

    drawGenerativeMandalaLayer(
      targetCtx,
      cx,
      cy,
      mainR,
      state.mandalaPetals,
      state.mandalaShapeIndex,
      state.mandalaAngle,
      305 + state.hueShift,
      alpha,
      state.mandalaMorphPhase,
      p
    );

    if (width > height * 0.85) {
      const offsetX = width * 0.28;
      const twinPetals = Math.max(6, state.mandalaPetals - 4);
      const twinShape = (state.mandalaShapeIndex + 2) % 4;
      drawGenerativeMandalaLayer(
        targetCtx,
        cx - offsetX,
        cy,
        mainR * 0.66,
        twinPetals,
        twinShape,
        -state.mandalaAngle * 1.25,
        195 + state.hueShift,
        alpha * 0.78,
        state.mandalaMorphPhase + 1.2,
        p
      );
      drawGenerativeMandalaLayer(
        targetCtx,
        cx + offsetX,
        cy,
        mainR * 0.66,
        twinPetals,
        twinShape,
        -state.mandalaAngle * 1.25,
        195 + state.hueShift,
        alpha * 0.78,
        state.mandalaMorphPhase + 1.2,
        p
      );
    }
  }

  if (effectPower.sparkles > 0.02) {
    const p = effectPower.sparkles;
    particles.forEach((pt) => {
      pt.y -= (0.002 + p * 0.015) * pt.z;
      if (pt.y < 0) {
        pt.y = 1;
        pt.x = Math.random();
      }
      const px = pt.x * width + Math.sin(state.time * 3 + pt.hueOffset) * 8 * p;
      const py = pt.y * height;
      const radius = pt.size * (0.8 + p * 2.2);
      const hue = (180 + pt.hueOffset + state.hueShift) % 360;

      targetCtx.fillStyle = `hsla(${hue}, 100%, 68%, ${0.22 + p * 0.62})`;
      targetCtx.beginPath();
      targetCtx.arc(px, py, radius, 0, Math.PI * 2);
      targetCtx.fill();

      if (p > 0.35 && pt.z > 0.65) {
        targetCtx.strokeStyle = `hsla(${hue}, 100%, 78%, ${p * 0.7})`;
        targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.moveTo(px - radius * 2.8, py);
        targetCtx.lineTo(px + radius * 2.8, py);
        targetCtx.moveTo(px, py - radius * 2.8);
        targetCtx.lineTo(px, py + radius * 2.8);
        targetCtx.stroke();
      }
    });
  }

  if (effectPower.flash > 0.45) {
    const intensity = Math.min(1, (effectPower.flash - 0.45) * 1.5);
    const flashHue = (state.hueShift + 190) % 360;
    targetCtx.fillStyle = `hsla(${flashHue}, 100%, 60%, ${intensity * 0.16})`;
    targetCtx.fillRect(0, 0, width, height);

    targetCtx.beginPath();
    targetCtx.arc(cx, cy, minDim * (0.15 + intensity * 0.62), 0, Math.PI * 2);
    targetCtx.strokeStyle = `hsla(${(flashHue + 120) % 360}, 100%, 68%, ${intensity * 0.58})`;
    targetCtx.lineWidth = 2 + intensity * 5;
    targetCtx.stroke();
  }

  targetCtx.restore();

  state.manualImpulse.flash *= 0.85;
  state.manualImpulse.pulse *= 0.85;
  state.manualImpulse.kaleido *= 0.88;
  state.manualImpulse.sparkle *= 0.88;
  state.dj.scratchImpulse *= 0.86;
}

function updateStageHardwareVisuals() {
  const { bass, kick, mids, highs } = state.energy;

  const bassMeter = document.getElementById('meter_bass');
  const kickMeter = document.getElementById('meter_kick');
  const midsMeter = document.getElementById('meter_mids');
  const highsMeter = document.getElementById('meter_highs');

  if (bassMeter) bassMeter.style.width = `${Math.min(100, bass * 100)}%`;
  if (kickMeter) kickMeter.style.width = `${Math.min(100, kick * 100)}%`;
  if (midsMeter) midsMeter.style.width = `${Math.min(100, mids * 100)}%`;
  if (highsMeter) highsMeter.style.width = `${Math.min(100, highs * 100)}%`;

  mixerVuBass.style.height = `${Math.max(8, Math.min(100, bass * 100))}%`;
  mixerVuKick.style.height = `${Math.max(8, Math.min(100, kick * 100))}%`;
  mixerVuMids.style.height = `${Math.max(8, Math.min(100, mids * 100))}%`;
  mixerVuHighs.style.height = `${Math.max(8, Math.min(100, highs * 100))}%`;

  const coneScale = 1 + (bass * 0.14) + (kick * 0.12);
  speakerCones.forEach((cone) => {
    cone.style.transform = `scale(${coneScale.toFixed(3)})`;
  });

  const cabinetBounce = -(kick * 3.5);
  leftSpeakerStack.style.transform = `translateY(${cabinetBounce.toFixed(1)}px)`;
  rightSpeakerStack.style.transform = `translateY(${cabinetBounce.toFixed(1)}px)`;

  if (!state.dj.leftDragging && state.isPlaying) {
    state.dj.leftAngle = (state.dj.leftAngle + 1.8) % 360;
  }
  if (!state.dj.rightDragging && state.isPlaying) {
    state.dj.rightAngle = (state.dj.rightAngle + 1.8) % 360;
  }
  leftJogWheel.style.transform = `rotate(${state.dj.leftAngle.toFixed(1)}deg)`;
  rightJogWheel.style.transform = `rotate(${state.dj.rightAngle.toFixed(1)}deg)`;

  const glowAlpha = 0.15 + bass * state.reactivityStrength * 0.45;
  wallGlowOverlay.style.boxShadow = `inset 0 0 ${35 + bass * 45}px rgba(0, 240, 255, ${glowAlpha.toFixed(2)}), 0 0 ${25 + mids * 35}px rgba(255, 0, 127, ${(mids * state.reactivityStrength * 0.35).toFixed(2)})`;

  if (state.sourceMode === 'mic') {
    const lvl = Math.min(100, state.energy.overall * 140);
    micLevelBar.style.width = `${lvl}%`;
    const db = Math.round(-60 + (lvl / 100) * 60);
    micDbLabel.textContent = `${db} dB`;
  }

  if (state.sourceMode === 'file' && !isNaN(audioPlayer.currentTime)) {
    const mins = Math.floor(audioPlayer.currentTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
    trackTimeDisplay.textContent = `${mins}:${secs}`;
  }
}

let canvasWidth = 640;
let canvasHeight = 360;

function resizeStageCanvas() {
  const rect = projectionWallContainer.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = Math.max(100, Math.floor(rect.width));
  canvasHeight = Math.max(100, Math.floor(rect.height));

  vjCanvas.width = Math.floor(canvasWidth * dpr);
  vjCanvas.height = Math.floor(canvasHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ratio = (canvasWidth / canvasHeight).toFixed(2);
  const label = canvasWidth < 450 ? 'PORTRAIT' : (canvasWidth < 800 ? 'TABLET' : 'WIDESCREEN');
  aspectRatioBadge.textContent = `${label} // ${ratio}:1`;
}

const resizeObserver = new ResizeObserver(() => resizeStageCanvas());
resizeObserver.observe(projectionWallContainer);

function broadcastSyncState() {
  if (!syncChannel) return;
  syncChannel.postMessage({
    type: 'VJ_SYNC_UPDATE',
    mappings: state.mappings,
    energy: state.energy,
    volume: state.volume,
    isMuted: state.isMuted,
    reactivityStrength: state.reactivityStrength,
    isPlaying: state.isPlaying,
    trackName: state.trackName,
    manualImpulse: state.manualImpulse,
    dj: {
      leftVelocity: state.dj.leftVelocity,
      rightVelocity: state.dj.rightVelocity,
      scratchImpulse: state.dj.scratchImpulse
    },
    mandalaShapeIndex: state.mandalaShapeIndex,
    mandalaPetals: state.mandalaPetals
  });
}

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'PREVIEW_REQUEST_INIT') {
      broadcastSyncState();
    }
  };
}

function openShareablePreviewTab() {
  const win = window.open('preview.html', '_blank');
  if (!win) {
    showToast('Popup blocked — please allow popups to open the Preview Tab.');
    return;
  }
  previewWindowRef = win;
  previewFrameBusy = false;
  showToast('Live second-screen projection tab opened!');
}

let previewFrameBusy = false;
let previewFrameTick = 0;

function streamStageToPreview() {
  if (!previewWindowRef || previewWindowRef.closed) return;
  previewFrameTick++;
  if (previewFrameTick % 2 !== 0 || previewFrameBusy) return;
  previewFrameBusy = true;
  const meme = window.MemeStudio ? window.MemeStudio.getPreviewSnapshot() : null;
  const showGif = !!(meme && meme.data.gifVisible && meme.gifCanvas.width > 0);
  Promise.all([
    createImageBitmap(vjCanvas),
    showGif ? createImageBitmap(meme.gifCanvas) : Promise.resolve(null)
  ]).then(([vjBitmap, gifBitmap]) => {
    const transfer = [vjBitmap];
    if (gifBitmap) transfer.push(gifBitmap);
    try {
      previewWindowRef.postMessage({
        type: 'STAGE_FRAME',
        vj: vjBitmap,
        gif: gifBitmap,
        wallW: canvasWidth,
        wallH: canvasHeight,
        meme: meme ? meme.data : null
      }, '*', transfer);
    } catch (err) {}
  }).catch(() => {}).finally(() => { previewFrameBusy = false; });
}

function setMasterVolume(val) {
  state.volume = Math.max(0, Math.min(1, val));
  masterVolumeSlider.value = Math.round(state.volume * 100);
  volumePercentText.textContent = `${Math.round(state.volume * 100)}%`;

  if (state.volume > 0 && state.isMuted) {
    state.isMuted = false;
  }
  applyAudioGain();
}

function setMasterMute(muted) {
  state.isMuted = muted;
  applyAudioGain();
}

function applyAudioGain() {
  const effectiveVol = state.isMuted ? 0 : state.volume;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(effectiveVol, audioCtx.currentTime, 0.02);
  }
  audioPlayer.muted = state.isMuted;
  audioPlayer.volume = state.volume;

  if (state.isMuted || state.volume === 0) {
    volIconUnmuted.classList.add('hidden');
    volIconMuted.classList.remove('hidden');
    volumePercentText.textContent = 'MUTED';
  } else {
    volIconUnmuted.classList.remove('hidden');
    volIconMuted.classList.add('hidden');
    volumePercentText.textContent = `${Math.round(state.volume * 100)}%`;
  }
  broadcastSyncState();
}

dropZone.addEventListener('click', () => audioFileInput.click());

audioFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    loadAudioFile(e.target.files[0]);
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-studio-cyan', 'bg-studio-cyan/10');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-studio-cyan', 'bg-studio-cyan/10');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-studio-cyan', 'bg-studio-cyan/10');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    loadAudioFile(e.dataTransfer.files[0]);
  }
});

playPauseBtn.addEventListener('click', async () => {
  if (state.sourceMode !== 'file') return;
  initAudioContext();
  if (audioPlayer.paused) {
    await audioPlayer.play();
    state.isPlaying = true;
  } else {
    audioPlayer.pause();
    state.isPlaying = false;
  }
  updateTransportUI();
});

demoSynthBtn.addEventListener('click', toggleDemoSynth);
micToggleBtn.addEventListener('click', toggleMicInput);
recordBtn.addEventListener('click', toggleRecording);

masterVolumeSlider.addEventListener('input', (e) => {
  setMasterVolume(Number(e.target.value) / 100);
});

muteToggleBtn.addEventListener('click', () => {
  setMasterMute(!state.isMuted);
});

openPreviewTabBtn.addEventListener('click', openShareablePreviewTab);

document.querySelectorAll('.vj-pad').forEach((pad) => {
  const triggerPad = () => {
    const type = pad.getAttribute('data-pad');
    if (type && state.manualImpulse[type] !== undefined) {
      state.manualImpulse[type] = 1.0;
      broadcastSyncState();
    }
  };
  pad.addEventListener('click', triggerPad);
  pad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    triggerPad();
  }, { passive: false });
});

const PAD_KEY_MAP = {
  Digit1: 'flash',
  Digit2: 'pulse',
  Digit3: 'kaleido',
  Digit4: 'sparkle',
  Numpad1: 'flash',
  Numpad2: 'pulse',
  Numpad3: 'kaleido',
  Numpad4: 'sparkle'
};
const heldPadKeys = new Map();
const tornadoBtn = document.getElementById('tornadoBtn');

function setPadButtonsHeld(padType, held) {
  document.querySelectorAll(`.vj-pad[data-pad="${padType}"]`).forEach((btn) => {
    btn.classList.toggle('ring-2', held);
    btn.classList.toggle('ring-white', held);
    btn.classList.toggle('scale-95', held);
  });
}

function setTornado(active) {
  state.tornadoActive = active;
  tornadoBtn.classList.toggle('tornado-active', active);
}

function applyHeldPadKeys() {
  heldPadKeys.forEach((padType) => {
    state.manualImpulse[padType] = 1.0;
  });
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
  if (e.code === 'Digit5' || e.code === 'Numpad5') {
    e.preventDefault();
    setTornado(true);
    return;
  }
  const padType = PAD_KEY_MAP[e.code];
  if (!padType) return;
  e.preventDefault();
  if (!heldPadKeys.has(e.code)) {
    heldPadKeys.set(e.code, padType);
    setPadButtonsHeld(padType, true);
    broadcastSyncState();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Digit5' || e.code === 'Numpad5') {
    setTornado(false);
    return;
  }
  if (heldPadKeys.has(e.code)) {
    const padType = heldPadKeys.get(e.code);
    heldPadKeys.delete(e.code);
    const stillHeld = Array.from(heldPadKeys.values()).includes(padType);
    if (!stillHeld) setPadButtonsHeld(padType, false);
  }
});

window.addEventListener('blur', () => {
  heldPadKeys.forEach((padType) => setPadButtonsHeld(padType, false));
  heldPadKeys.clear();
  setTornado(false);
});

['pointerdown'].forEach((evt) => {
  tornadoBtn.addEventListener(evt, (e) => {
    e.preventDefault();
    tornadoBtn.setPointerCapture(e.pointerId);
    setTornado(true);
  });
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((evt) => {
  tornadoBtn.addEventListener(evt, () => setTornado(false));
});
tornadoBtn.addEventListener('contextmenu', (e) => e.preventDefault());

function bindStageMemeToggle(stageToggleId, panelToggleId) {
  const stageToggle = document.getElementById(stageToggleId);
  const panelToggle = document.getElementById(panelToggleId);
  stageToggle.checked = panelToggle.checked;
  stageToggle.addEventListener('change', () => {
    panelToggle.checked = stageToggle.checked;
    panelToggle.dispatchEvent(new Event('change', { bubbles: true }));
  });
  panelToggle.addEventListener('change', () => {
    stageToggle.checked = panelToggle.checked;
  });
}

bindStageMemeToggle('stage-toggle-gif', 'toggle-gif-vis');
bindStageMemeToggle('stage-toggle-text', 'toggle-text-vis');

const toggleDeckBtn = document.getElementById('toggleDeckBtn');
const deckScrollArea = document.getElementById('deckScrollArea');
const toggleDeckLabel = document.getElementById('toggleDeckLabel');
const toggleDeckIcon = document.getElementById('toggleDeckIcon');
let deckCollapsed = false;

toggleDeckBtn.addEventListener('click', () => {
  deckCollapsed = !deckCollapsed;
  deckScrollArea.classList.toggle('hidden', deckCollapsed);
  toggleDeckLabel.textContent = deckCollapsed ? 'Show Controls' : 'Hide Controls';
  toggleDeckIcon.style.transform = deckCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
  setTimeout(resizeStageCanvas, 50);
});

let frameCounter = 0;
function studioAnimationLoop() {
  applyDJTurntableDSP();
  analyzeAudioFrequencies();
  applyHeldPadKeys();
  renderVJFrame(ctx, canvasWidth, canvasHeight);
  updateStageHardwareVisuals();
  streamStageToPreview();

  state.dj.leftVelocity *= 0.65;
  state.dj.rightVelocity *= 0.65;

  frameCounter++;
  if (frameCounter % 2 === 0 && syncChannel) {
    broadcastSyncState();
  }

  requestAnimationFrame(studioAnimationLoop);
}

window.addEventListener('load', () => {
  renderFrequencyControls();
  resizeStageCanvas();
  applyAudioGain();
  requestAnimationFrame(studioAnimationLoop);
});
