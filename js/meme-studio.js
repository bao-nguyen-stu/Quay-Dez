(() => {
let parseGIF = null;
let decompressFrames = null;
const gifuctReady = import('https://esm.sh/gifuct-js@2.1.2').then((mod) => {
  parseGIF = mod.parseGIF;
  decompressFrames = mod.decompressFrames;
}).catch((err) => {
  console.warn('gifuct-js failed to load:', err);
});


const presetCategories = {
  creatures: {
    name: "Creatures",
    gifs: [
      "../assets/meow-zhe.gif",
      "../assets/gnarp-cat-alien-cat-meme.gif",
      "../assets/gnarp-y-gnarpy.gif",
      "../assets/aliendog-dancing-dog.gif",
      "../assets/iora-hotaru-iora.gif"
    ]
  },
  alien: {
    name: "Alien",
    gifs: [
      "../assets/steam-green-alien.gif",
      "../assets/alien-pls.gif",
      "../assets/alienpls3-alienpls.gif"
    ]
  },
  dancingMan: {
    name: "Dancing Man",
    gifs: [
      "../assets/alex-horne-little-alex-horne.gif",
      "../assets/funky-dancing.gif",
      "../assets/andrew-tate-dance.gif",
      "../assets/dance-moves.gif"
    ]
  },
  animeGirl: {
    name: "Anime Girl",
    gifs: [
      "magical-girl-madoka.gif",
      "osaka-dance.gif",
      "rt97k.gif"
    ]
  }
};

const defaultFaceSVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#ffeb3b"/>
    <circle cx="35" cy="40" r="8" fill="#111"/>
    <circle cx="65" cy="40" r="8" fill="#111"/>
    <path d="M28 62 Q50 85 72 62" stroke="#111" stroke-width="7" stroke-linecap="round" fill="none"/>
  </svg>
`);

const stageScaleWrapperEl = document.getElementById('stage-scale-wrapper');
const trackerStageEl = document.getElementById('tracker-stage');
const trackerCanvas = document.getElementById('tracker-canvas');
const trackerCtx = trackerCanvas.getContext('2d');
const hiddenVideo = document.getElementById('hidden-video');

const processingOverlay = document.getElementById('processing-overlay');
const processingText = document.getElementById('processing-text');
const processingSub = document.getElementById('processing-sub');

const gifScaleSlider = document.getElementById('gif-scale-slider');
const gifScaleVal = document.getElementById('gif-scale-val');
const toggleGifVis = document.getElementById('toggle-gif-vis');
const gifVisLabel = document.getElementById('gif-vis-label');
const toggleTextVis = document.getElementById('toggle-text-vis');
const textVisLabel = document.getElementById('text-vis-label');

const sizeSlider = document.getElementById('size-slider');
const sizeVal = document.getElementById('size-val');
const offsetXSlider = document.getElementById('offset-x-slider');
const offsetXVal = document.getElementById('offset-x-val');
const offsetYSlider = document.getElementById('offset-y-slider');
const offsetYVal = document.getElementById('offset-y-val');

let appMode = 'preset';
let activeCategoryKey = 'creatures';
let categoryIndices = {
  creatures: 0,
  alien: 0,
  dancingMan: 0,
  animeGirl: 0
};

let userFaceImage = new Image();
userFaceImage.src = defaultFaceSVG;

let gifScale = 1.0;

let isGifVisible = false;
let isTextVisible = false;

let faceScale = 1.0;
let manualOffsetX = 0;
let manualOffsetY = 0;

function syncGifVisibility() {
  gifVisLabel.textContent = isGifVisible ? 'Show' : 'Off';
  toggleGifVis.checked = isGifVisible;
  stageScaleWrapperEl.style.display = isGifVisible ? 'flex' : 'none';
  if (isGifVisible && (appMode === 'gif' || appMode === 'preset') && gifFrames.length > 0 && !animFrameId) {
    lastFrameTimestamp = performance.now();
    startGifLoop();
  }
}

gifScaleSlider.addEventListener('input', (e) => {
  gifScale = parseFloat(e.target.value);
  gifScaleVal.textContent = gifScale.toFixed(2).replace(/\.00$/, '.0') + 'x';
  stageScaleWrapperEl.style.transform = `scale(${gifScale})`;
});

toggleGifVis.addEventListener('change', (e) => {
  isGifVisible = e.target.checked;
  syncGifVisibility();
});

let gifFrames = [];
let gifTrackPoints = [];
let gifWidth = 400;
let gifHeight = 400;
let currentFrameIndex = 0;
let lastFrameTimestamp = 0;
let frameAccumulator = 0;
let animFrameId = null;

let currentVideoTrack = { x: 200, y: 120, radius: 48, angle: 0 };
let videoDetectPending = false;
let templatePatch = null;

let blazefaceModel = null;
async function loadAIModel() {
  if (blazefaceModel) return blazefaceModel;
  if (window.blazeface) {
    try {
      blazefaceModel = await window.blazeface.load();
    } catch (err) {
      console.warn("BlazeFace model load fallback to 2D motion tracker:", err);
    }
  }
  return blazefaceModel;
}
loadAIModel();

window.selectPresetCategory = async function(key, btnElement) {
  stopCustomLoop();
  appMode = 'preset';
  activeCategoryKey = key;

  document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  const cat = presetCategories[key];
  const gifUrl = cat.gifs[categoryIndices[key]];
  categoryIndices[key] = (categoryIndices[key] + 1) % cat.gifs.length;

  trackerStageEl.style.display = 'block';

  manualOffsetX = 0;
  manualOffsetY = 0;
  offsetXSlider.value = 0;
  offsetYSlider.value = 0;
  offsetXVal.textContent = '0px';
  offsetYVal.textContent = '0px';
  faceScale = 1.0;
  sizeSlider.value = 1.0;
  sizeVal.textContent = '1.0x';

  await loadAndProcessPresetGif(gifUrl);
};

async function loadAndProcessPresetGif(url) {
  showProcessing("Loading GIF Frames...", "Extracting native animation frames");
  try {
    await gifuctReady;
    if (!parseGIF) throw new Error('GIF decoder unavailable');
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const gif = parseGIF(arrayBuffer);
    const rawFrames = decompressFrames(gif, true);

    if (!rawFrames || rawFrames.length === 0) {
      throw new Error("No frames found in GIF.");
    }

    gifWidth = gif.lsd.width;
    gifHeight = gif.lsd.height;
    trackerCanvas.width = gifWidth;
    trackerCanvas.height = gifHeight;

    const compCanvas = document.createElement('canvas');
    compCanvas.width = gifWidth;
    compCanvas.height = gifHeight;
    const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });

    const patchCanvas = document.createElement('canvas');
    const patchCtx = patchCanvas.getContext('2d');

    gifFrames = [];
    let previousImageData = null;

    for (let i = 0; i < rawFrames.length; i++) {
      const frame = rawFrames[i];
      const { dims, patch, disposalType, delay } = frame;

      if (disposalType === 3) {
        previousImageData = compCtx.getImageData(0, 0, gifWidth, gifHeight);
      }

      patchCanvas.width = dims.width;
      patchCanvas.height = dims.height;
      const patchImgData = new ImageData(new Uint8ClampedArray(patch), dims.width, dims.height);
      patchCtx.putImageData(patchImgData, 0, 0);

      compCtx.drawImage(patchCanvas, dims.left, dims.top);

      const fullFrameData = compCtx.getImageData(0, 0, gifWidth, gifHeight);
      const bitmap = await createImageBitmap(compCanvas);
      gifFrames.push({
        bitmap,
        imageData: fullFrameData,
        delay: Math.max(delay || 50, 20)
      });

      if (disposalType === 2) {
        compCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
      } else if (disposalType === 3 && previousImageData) {
        compCtx.putImageData(previousImageData, 0, 0);
      }
    }

    await trackAllGifFrames();

    hideProcessing();
    currentFrameIndex = 0;
    lastFrameTimestamp = performance.now();
    frameAccumulator = 0;
    startGifLoop();
  } catch (err) {
    console.warn("Preset GIF asset unavailable:", url, err);
    hideProcessing();
  }
}

selectPresetCategory('creatures', document.querySelector('.char-btn.active'));

const gifUploadInput = document.getElementById('gif-upload');
const faceUploadInput = document.getElementById('face-upload');

gifUploadInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleCustomMediaFile(e.target.files[0]);
});

faceUploadInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFacePhotoFile(e.target.files[0]);
});

setupDropzone(document.getElementById('gif-dropzone'), handleCustomMediaFile);
setupDropzone(document.getElementById('face-dropzone'), handleFacePhotoFile);

function setupDropzone(el, callback) {
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.classList.add('dragover');
  });
  el.addEventListener('dragleave', () => el.classList.remove('dragover'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('dragover');
    if (e.dataTransfer.files[0]) callback(e.dataTransfer.files[0]);
  });
}

function handleFacePhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    userFaceImage = img;
  };
  img.src = url;
  document.getElementById('face-filename').textContent = `Loaded: ${file.name}`;
}

async function handleCustomMediaFile(file) {
  stopCustomLoop();
  document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('gif-filename').textContent = `Loaded: ${file.name}`;

  trackerStageEl.style.display = 'block';

  manualOffsetX = 0;
  manualOffsetY = 0;
  offsetXSlider.value = 0;
  offsetYSlider.value = 0;
  offsetXVal.textContent = '0px';
  offsetYVal.textContent = '0px';
  faceScale = 1.0;
  sizeSlider.value = 1.0;
  sizeVal.textContent = '1.0x';

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (fileType === 'image/gif' || fileName.endsWith('.gif')) {
    await processAnimatedGIF(file);
  } else if (fileType.startsWith('video/')) {
    await processVideoFile(file);
  } else {
    await processStaticImageFile(file);
  }
}

async function processAnimatedGIF(file) {
  appMode = 'gif';
  showProcessing("Decoding GIF Frames...", "Extracting native animation frames");

  try {
    await gifuctReady;
    if (!parseGIF) throw new Error('GIF decoder unavailable');
    const arrayBuffer = await file.arrayBuffer();
    const gif = parseGIF(arrayBuffer);
    const rawFrames = decompressFrames(gif, true);

    if (!rawFrames || rawFrames.length === 0) {
      throw new Error("No frames found in GIF.");
    }

    gifWidth = gif.lsd.width;
    gifHeight = gif.lsd.height;
    trackerCanvas.width = gifWidth;
    trackerCanvas.height = gifHeight;

    const compCanvas = document.createElement('canvas');
    compCanvas.width = gifWidth;
    compCanvas.height = gifHeight;
    const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });

    const patchCanvas = document.createElement('canvas');
    const patchCtx = patchCanvas.getContext('2d');

    gifFrames = [];
    let previousImageData = null;

    for (let i = 0; i < rawFrames.length; i++) {
      const frame = rawFrames[i];
      const { dims, patch, disposalType, delay } = frame;

      if (disposalType === 3) {
        previousImageData = compCtx.getImageData(0, 0, gifWidth, gifHeight);
      }

      patchCanvas.width = dims.width;
      patchCanvas.height = dims.height;
      const patchImgData = new ImageData(new Uint8ClampedArray(patch), dims.width, dims.height);
      patchCtx.putImageData(patchImgData, 0, 0);

      compCtx.drawImage(patchCanvas, dims.left, dims.top);

      const fullFrameData = compCtx.getImageData(0, 0, gifWidth, gifHeight);
      const bitmap = await createImageBitmap(compCanvas);
      gifFrames.push({
        bitmap,
        imageData: fullFrameData,
        delay: Math.max(delay || 50, 20)
      });

      if (disposalType === 2) {
        compCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
      } else if (disposalType === 3 && previousImageData) {
        compCtx.putImageData(previousImageData, 0, 0);
      }
    }

    await trackAllGifFrames();

    hideProcessing();
    currentFrameIndex = 0;
    lastFrameTimestamp = performance.now();
    frameAccumulator = 0;
    startGifLoop();
  } catch (err) {
    console.error("GIF decode error:", err);
    hideProcessing();
    await processStaticImageFile(file);
  }
}

async function trackAllGifFrames(userAnchorPoint = null) {
  showProcessing("Tracking Character Head...", "Analyzing movement across " + gifFrames.length + " frames");

  gifTrackPoints = [];
  const defaultRadius = Math.max(46, Math.min(gifWidth, gifHeight) * 0.20);
  let anchor = userAnchorPoint || estimateInitialHeadCenter(gifFrames);
  let patchSize = Math.max(16, Math.round(Math.min(gifWidth, gifHeight) * 0.14));
  let currentTemplate = extractColorPatch(gifFrames[0].imageData, anchor.x, anchor.y, patchSize);

  gifTrackPoints[0] = {
    x: anchor.x,
    y: anchor.y,
    radius: defaultRadius,
    angle: 0,
    source: 'motion'
  };

  let prevPos = { x: anchor.x, y: anchor.y };
  const searchRadius = Math.max(28, Math.round(Math.min(gifWidth, gifHeight) * 0.18));

  for (let i = 1; i < gifFrames.length; i++) {
    const match = findBestPatchMatch(
      gifFrames[i].imageData,
      currentTemplate,
      patchSize,
      prevPos.x,
      prevPos.y,
      searchRadius
    );

    const dx = match.x - prevPos.x;
    const tiltAngle = Math.max(-0.28, Math.min(0.28, dx * 0.015));

    gifTrackPoints[i] = {
      x: match.x,
      y: match.y,
      radius: defaultRadius,
      angle: tiltAngle,
      source: 'motion'
    };

    prevPos = { x: match.x, y: match.y };
  }

  smoothTrackArray(gifTrackPoints);
}

function smoothTrackArray(points) {
  if (points.length < 3) return;
  const copy = points.map(p => ({ ...p }));
  for (let i = 0; i < points.length; i++) {
    const prev = copy[(i - 1 + copy.length) % copy.length];
    const curr = copy[i];
    const next = copy[(i + 1) % copy.length];
    points[i].x = prev.x * 0.2 + curr.x * 0.6 + next.x * 0.2;
    points[i].y = prev.y * 0.2 + curr.y * 0.6 + next.y * 0.2;
    points[i].angle = prev.angle * 0.2 + curr.angle * 0.6 + next.angle * 0.2;
  }
}

function estimateInitialHeadCenter(frames) {
  if (frames.length < 2) {
    return { x: gifWidth * 0.5, y: gifHeight * 0.3 };
  }
  const d0 = frames[0].imageData.data;
  const d1 = frames[Math.min(2, frames.length - 1)].imageData.data;
  let sumX = 0, sumY = 0, totalWeight = 0;

  for (let y = 0; y < gifHeight; y += 4) {
    for (let x = 0; x < gifWidth; x += 4) {
      const idx = (y * gifWidth + x) * 4;
      const diff = Math.abs(d0[idx] - d1[idx]) + Math.abs(d0[idx + 1] - d1[idx + 1]) + Math.abs(d0[idx + 2] - d1[idx + 2]);
      if (diff > 35) {
        const verticalBias = y < gifHeight * 0.65 ? 1.8 : 0.6;
        const w = diff * verticalBias;
        sumX += x * w;
        sumY += y * w;
        totalWeight += w;
      }
    }
  }

  if (totalWeight > 0) {
    return {
      x: sumX / totalWeight,
      y: Math.max(gifHeight * 0.16, (sumY / totalWeight) * 0.85)
    };
  }
  return { x: gifWidth * 0.5, y: gifHeight * 0.3 };
}

function extractColorPatch(imageData, cx, cy, size) {
  const half = Math.floor(size / 2);
  const patch = new Float32Array(size * size * 3);
  const { width, height, data } = imageData;
  let ptr = 0;

  for (let dy = -half; dy < -half + size; dy++) {
    const sy = Math.max(0, Math.min(height - 1, Math.round(cy + dy)));
    for (let dx = -half; dx < -half + size; dx++) {
      const sx = Math.max(0, Math.min(width - 1, Math.round(cx + dx)));
      const idx = (sy * width + sx) * 4;
      patch[ptr++] = data[idx];
      patch[ptr++] = data[idx + 1];
      patch[ptr++] = data[idx + 2];
    }
  }
  return patch;
}

function findBestPatchMatch(imageData, template, size, startX, startY, searchRadius) {
  const { width, height, data } = imageData;
  const half = Math.floor(size / 2);
  let bestScore = Infinity;
  let bestX = startX;
  let bestY = startY;

  const minX = Math.max(half, Math.round(startX - searchRadius));
  const maxX = Math.min(width - half - 1, Math.round(startX + searchRadius));
  const minY = Math.max(half, Math.round(startY - searchRadius));
  const maxY = Math.min(height - half - 1, Math.round(startY + searchRadius));

  for (let cy = minY; cy <= maxY; cy += 4) {
    for (let cx = minX; cx <= maxX; cx += 4) {
      let score = 0;

      for (let dy = -half; dy < -half + size; dy += 4) {
        const rowOffset = (cy + dy) * width;
        for (let dx = -half; dx < -half + size; dx += 4) {
          const idx = (rowOffset + (cx + dx)) * 4;
          const tIdx = ((dy + half) * size + (dx + half)) * 3;
          score +=
            Math.abs(data[idx] - template[tIdx]) +
            Math.abs(data[idx + 1] - template[tIdx + 1]) +
            Math.abs(data[idx + 2] - template[tIdx + 2]);
        }
      }

      const distPenalty = ((cx - startX) ** 2 + (cy - startY) ** 2) * 0.25;
      score += distPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestX = cx;
        bestY = cy;
      }
    }
  }

  return { x: bestX, y: bestY };
}

function startGifLoop() {
  function render(now) {
    if (appMode !== 'gif' && appMode !== 'preset') return;
    if (gifFrames.length === 0) return;

    const dt = Math.min(now - lastFrameTimestamp, 250);
    lastFrameTimestamp = now;
    frameAccumulator += dt;

    let frame = gifFrames[currentFrameIndex];
    while (frameAccumulator >= frame.delay) {
      frameAccumulator -= frame.delay;
      currentFrameIndex = (currentFrameIndex + 1) % gifFrames.length;
      frame = gifFrames[currentFrameIndex];
    }

    const track = gifTrackPoints[currentFrameIndex] || {
      x: gifWidth / 2,
      y: gifHeight * 0.3,
      radius: 48,
      angle: 0
    };

    trackerCtx.clearRect(0, 0, gifWidth, gifHeight);
    trackerCtx.drawImage(frame.bitmap, 0, 0);

    drawTrackedFace(
      trackerCtx,
      track.x + manualOffsetX,
      track.y + manualOffsetY,
      track.radius * faceScale,
      track.angle
    );

    animFrameId = requestAnimationFrame(render);
  }
  animFrameId = requestAnimationFrame(render);
}

async function processVideoFile(file) {
  appMode = 'video';
  showProcessing("Loading Video Stream...", "Starting real-time motion face tracker");

  const url = URL.createObjectURL(file);
  hiddenVideo.src = url;
  await new Promise((resolve) => {
    hiddenVideo.onloadedmetadata = resolve;
  });

  gifWidth = hiddenVideo.videoWidth || 480;
  gifHeight = hiddenVideo.videoHeight || 480;
  trackerCanvas.width = gifWidth;
  trackerCanvas.height = gifHeight;

  currentVideoTrack = {
    x: gifWidth * 0.5,
    y: gifHeight * 0.3,
    radius: Math.max(46, Math.min(gifWidth, gifHeight) * 0.20),
    angle: 0
  };
  templatePatch = null;

  await hiddenVideo.play();
  hideProcessing();

  function renderVideoFrame() {
    if (appMode !== 'video') return;

    trackerCtx.clearRect(0, 0, gifWidth, gifHeight);
    trackerCtx.drawImage(hiddenVideo, 0, 0, gifWidth, gifHeight);

    if (!videoDetectPending && hiddenVideo.readyState >= 2) {
      videoDetectPending = true;
      updateVideoTrack().finally(() => {
        videoDetectPending = false;
      });
    }

    drawTrackedFace(
      trackerCtx,
      currentVideoTrack.x + manualOffsetX,
      currentVideoTrack.y + manualOffsetY,
      currentVideoTrack.radius * faceScale,
      currentVideoTrack.angle
    );

    animFrameId = requestAnimationFrame(renderVideoFrame);
  }
  animFrameId = requestAnimationFrame(renderVideoFrame);
}

async function updateVideoTrack() {
  const frameData = trackerCtx.getImageData(0, 0, gifWidth, gifHeight);
  if (!templatePatch) {
    const pSize = Math.max(18, Math.round(Math.min(gifWidth, gifHeight) * 0.14));
    templatePatch = {
      data: extractColorPatch(frameData, currentVideoTrack.x, currentVideoTrack.y, pSize),
      size: pSize
    };
  }

  const searchRadius = Math.max(32, Math.round(Math.min(gifWidth, gifHeight) * 0.16));
  const match = findBestPatchMatch(
    frameData,
    templatePatch.data,
    templatePatch.size,
    currentVideoTrack.x,
    currentVideoTrack.y,
    searchRadius
  );
  const dx = match.x - currentVideoTrack.x;
  currentVideoTrack.x = currentVideoTrack.x * 0.3 + match.x * 0.7;
  currentVideoTrack.y = currentVideoTrack.y * 0.3 + match.y * 0.7;
  currentVideoTrack.angle = Math.max(-0.25, Math.min(0.25, dx * 0.015));
}

async function processStaticImageFile(file) {
  appMode = 'static';
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = url;
  });

  gifWidth = img.naturalWidth || 400;
  gifHeight = img.naturalHeight || 400;
  trackerCanvas.width = gifWidth;
  trackerCanvas.height = gifHeight;

  currentVideoTrack = {
    x: gifWidth * 0.5,
    y: gifHeight * 0.3,
    radius: Math.max(46, Math.min(gifWidth, gifHeight) * 0.20),
    angle: 0
  };

  function renderStatic() {
    if (appMode !== 'static') return;
    trackerCtx.clearRect(0, 0, gifWidth, gifHeight);
    trackerCtx.drawImage(img, 0, 0, gifWidth, gifHeight);
    drawTrackedFace(
      trackerCtx,
      currentVideoTrack.x + manualOffsetX,
      currentVideoTrack.y + manualOffsetY,
      currentVideoTrack.radius * faceScale,
      currentVideoTrack.angle
    );
    animFrameId = requestAnimationFrame(renderStatic);
  }
  animFrameId = requestAnimationFrame(renderStatic);
}

function traceRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTrackedFace(ctx, x, y, radius, angle = 0) {
  if (!userFaceImage || !userFaceImage.complete) return;
  const safeRadius = Math.max(16, radius);
  const boxSize = safeRadius * 2;
  const cornerRadius = Math.max(8, boxSize * 0.12);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  traceRoundedRect(ctx, -safeRadius, -safeRadius, boxSize, boxSize, cornerRadius);
  ctx.clip();

  const iw = userFaceImage.naturalWidth || 100;
  const ih = userFaceImage.naturalHeight || 100;
  const scale = Math.max(boxSize / iw, boxSize / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  ctx.drawImage(userFaceImage, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  traceRoundedRect(ctx, -safeRadius, -safeRadius, boxSize, boxSize, cornerRadius);
  ctx.lineWidth = Math.max(2.5, safeRadius * 0.06);
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 0, 127, 0.85)';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}

let isCanvasDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

trackerCanvas.addEventListener('pointerdown', (e) => {
  const rect = trackerCanvas.getBoundingClientRect();
  const scaleX = trackerCanvas.width / rect.width;
  const scaleY = trackerCanvas.height / rect.height;
  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  isCanvasDragging = true;
  dragStartX = canvasX;
  dragStartY = canvasY;
  startOffsetX = manualOffsetX;
  startOffsetY = manualOffsetY;
  trackerCanvas.setPointerCapture(e.pointerId);
});

trackerCanvas.addEventListener('pointermove', (e) => {
  if (!isCanvasDragging) return;
  const rect = trackerCanvas.getBoundingClientRect();
  const scaleX = trackerCanvas.width / rect.width;
  const scaleY = trackerCanvas.height / rect.height;
  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  manualOffsetX = Math.max(-150, Math.min(150, Math.round(startOffsetX + (canvasX - dragStartX))));
  manualOffsetY = Math.max(-150, Math.min(150, Math.round(startOffsetY + (canvasY - dragStartY))));

  offsetXSlider.value = manualOffsetX;
  offsetYSlider.value = manualOffsetY;
  offsetXVal.textContent = manualOffsetX + 'px';
  offsetYVal.textContent = manualOffsetY + 'px';
});

trackerCanvas.addEventListener('pointerup', (e) => {
  if (isCanvasDragging) {
    isCanvasDragging = false;
    trackerCanvas.releasePointerCapture(e.pointerId);
  }
});

sizeSlider.addEventListener('input', (e) => {
  faceScale = parseFloat(e.target.value);
  sizeVal.textContent = faceScale.toFixed(2).replace(/\.00$/, '.0') + 'x';
});

offsetXSlider.addEventListener('input', (e) => {
  manualOffsetX = parseInt(e.target.value, 10);
  offsetXVal.textContent = manualOffsetX + 'px';
});

offsetYSlider.addEventListener('input', (e) => {
  manualOffsetY = parseInt(e.target.value, 10);
  offsetYVal.textContent = manualOffsetY + 'px';
});

const memeTextInput = document.getElementById('meme-text-input');
const charCounterEl = document.getElementById('char-counter');
const memeBannerWrapper = document.getElementById('meme-banner-wrapper');
const memeTextDisplay = document.getElementById('meme-text-display');
const textSizeSlider = document.getElementById('text-size-slider');
const textSizeVal = document.getElementById('text-size-val');
const btnTogglePin = document.getElementById('btn-toggle-pin');

let currentTextStyle = 'rainbow';
let currentTextAnim = 'wave';
let isTextFloating = false;

function renderMemeText(rawText) {
  const text = rawText.slice(0, 120);
  charCounterEl.textContent = `${text.length} / 120`;

  memeTextDisplay.innerHTML = '';
  if (!text.trim() || !isTextVisible) {
    memeBannerWrapper.style.display = 'none';
    return;
  }

  memeBannerWrapper.style.display = 'flex';
  const chars = Array.from(text);
  chars.forEach((ch, idx) => {
    const span = document.createElement('span');
    span.className = 'meme-char';
    span.style.setProperty('--i', idx);
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    memeTextDisplay.appendChild(span);
  });
}

toggleTextVis.addEventListener('change', (e) => {
  isTextVisible = e.target.checked;
  textVisLabel.textContent = isTextVisible ? 'Show' : 'Off';
  renderMemeText(memeTextInput.value);
});

memeTextInput.addEventListener('input', (e) => {
  renderMemeText(e.target.value);
});

window.applyPresetText = function(phrase) {
  memeTextInput.value = phrase;
  renderMemeText(phrase);
};

window.setTextAnimation = function(animKey, btnEl) {
  currentTextAnim = animKey;
  document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  updateTextClasses();
};

window.setTextStyle = function(styleKey, btnEl) {
  currentTextStyle = styleKey;
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  updateTextClasses();
};

function updateTextClasses() {
  memeTextDisplay.className = `style-${currentTextStyle} anim-${currentTextAnim}`;
}

textSizeSlider.addEventListener('input', (e) => {
  const px = e.target.value + 'px';
  textSizeVal.textContent = px;
  memeTextDisplay.style.fontSize = px;
});

window.toggleTextPlacement = function() {
  isTextFloating = !isTextFloating;
  memeBannerWrapper.classList.toggle('floating-mode', isTextFloating);
  if (!isTextFloating) {
    memeBannerWrapper.style.left = '';
    memeBannerWrapper.style.top = '';
    btnTogglePin.textContent = '📌 Pinned Above GIF';
  } else {
    btnTogglePin.textContent = '🖐️ Free Floating';
  }
};

window.resetTextPosition = function() {
  isTextFloating = false;
  memeBannerWrapper.classList.remove('floating-mode');
  memeBannerWrapper.style.left = '';
  memeBannerWrapper.style.top = '';
  btnTogglePin.textContent = '📌 Pinned Above GIF';
};

let isTextDragging = false;
let textStartX = 0;
let textStartY = 0;

memeBannerWrapper.addEventListener('pointerdown', (e) => {
  if (!isTextFloating) {
    const rect = memeBannerWrapper.getBoundingClientRect();
    const parentRect = memeBannerWrapper.parentElement.getBoundingClientRect();
    isTextFloating = true;
    memeBannerWrapper.classList.add('floating-mode');
    memeBannerWrapper.style.left = (rect.left - parentRect.left) + 'px';
    memeBannerWrapper.style.top = (rect.top - parentRect.top) + 'px';
    btnTogglePin.textContent = '🖐️ Free Floating';
  }
  isTextDragging = true;
  textStartX = e.clientX - memeBannerWrapper.offsetLeft;
  textStartY = e.clientY - memeBannerWrapper.offsetTop;
  memeBannerWrapper.setPointerCapture(e.pointerId);
});

memeBannerWrapper.addEventListener('pointermove', (e) => {
  if (!isTextDragging) return;
  memeBannerWrapper.style.left = (e.clientX - textStartX) + 'px';
  memeBannerWrapper.style.top = (e.clientY - textStartY) + 'px';
});

memeBannerWrapper.addEventListener('pointerup', (e) => {
  if (isTextDragging) {
    isTextDragging = false;
    memeBannerWrapper.releasePointerCapture(e.pointerId);
  }
});

renderMemeText(memeTextInput.value);

function stopCustomLoop() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  hiddenVideo.pause();
  gifFrames.forEach(f => f.bitmap && f.bitmap.close && f.bitmap.close());
  gifFrames = [];
}

function showProcessing(title, sub) {
  processingText.textContent = title;
  processingSub.textContent = sub;
  processingOverlay.style.display = 'flex';
}

function hideProcessing() {
  processingOverlay.style.display = 'none';
}

const TEXT_ANIM_BAND = {
  wave: 'mids',
  heartbeat: 'bass',
  shake: 'highs',
  bounce: 'kick',
  spin: 'mids',
  none: null
};

const reactSmooth = { bass: 0, kick: 0, mids: 0, highs: 0 };
const reactOut = { amp: 1, pop: 1 };
let tornadoAngle = 0;
let tornadoVelocity = 0;
let lastReactTimestamp = performance.now();

function smoothBand(key) {
  const raw = Math.min(1, (state.energy[key] || 0) * (0.6 + state.reactivityStrength));
  const prev = reactSmooth[key];
  reactSmooth[key] = raw > prev ? prev + (raw - prev) * 0.65 : prev * 0.9;
  return reactSmooth[key];
}

function updateTornado(dtSec) {
  if (state.tornadoActive) {
    tornadoVelocity = Math.min(2600, tornadoVelocity + 9000 * dtSec);
  } else {
    tornadoVelocity *= Math.pow(0.015, dtSec);
  }
  tornadoAngle += tornadoVelocity * dtSec;
  if (!state.tornadoActive && Math.abs(tornadoVelocity) < 90) {
    tornadoVelocity = 0;
    tornadoAngle %= 360;
    const target = Math.round(tornadoAngle / 360) * 360;
    tornadoAngle += (target - tornadoAngle) * Math.min(1, dtSec * 10);
    if (Math.abs(target - tornadoAngle) < 0.05) tornadoAngle = 0;
  } else {
    tornadoAngle %= 360;
  }
}

function memeReactLoop(now) {
  const dtSec = Math.min(0.1, (now - lastReactTimestamp) / 1000);
  lastReactTimestamp = now;

  const bass = smoothBand('bass');
  const kick = smoothBand('kick');
  const mids = smoothBand('mids');
  const highs = smoothBand('highs');

  const bandKey = TEXT_ANIM_BAND[currentTextAnim];
  const level = bandKey ? reactSmooth[bandKey] : 0;
  reactOut.amp = bandKey ? 0.4 + level * 1.3 : 1;
  reactOut.pop = currentTextAnim === 'spin' ? 1 + level * 0.2 : 1;
  memeTextDisplay.style.setProperty('--amp', reactOut.amp.toFixed(3));
  memeTextDisplay.style.setProperty('--pop', reactOut.pop.toFixed(3));

  updateTornado(dtSec);

  const pump = 1 + bass * 0.11 + kick * 0.09;
  const sway = Math.sin(now * 0.006) * mids * 4;
  const rotation = tornadoAngle + sway;
  stageScaleWrapperEl.style.transition = 'none';
  stageScaleWrapperEl.style.transform = `scale(${(gifScale * pump).toFixed(4)}) rotate(${rotation.toFixed(2)}deg)`;
  stageScaleWrapperEl.style.filter = `drop-shadow(0 0 ${(4 + highs * 16).toFixed(1)}px rgba(255, 0, 127, ${(0.15 + kick * 0.5 + highs * 0.25).toFixed(2)}))`;

  requestAnimationFrame(memeReactLoop);
}
requestAnimationFrame(memeReactLoop);

window.MemeStudio = {
  getPreviewSnapshot() {
    return {
      gifCanvas: trackerCanvas,
      data: {
        gifVisible: isGifVisible && trackerStageEl.style.display === 'block',
        gifBox: { w: trackerCanvas.offsetWidth, h: trackerCanvas.offsetHeight },
        gifTransform: stageScaleWrapperEl.style.transform,
        gifFilter: stageScaleWrapperEl.style.filter,
        text: {
          visible: isTextVisible,
          value: memeTextInput.value.slice(0, 120),
          style: currentTextStyle,
          anim: currentTextAnim,
          fontSize: memeTextDisplay.style.fontSize,
          floating: isTextFloating,
          left: memeBannerWrapper.style.left,
          top: memeBannerWrapper.style.top,
          amp: reactOut.amp,
          pop: reactOut.pop
        }
      }
    };
  }
};
})();
