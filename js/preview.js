const stage = document.getElementById('previewStage');
const projCanvas = document.getElementById('projCanvas');
const projCtx = projCanvas.getContext('2d');
const waitingMsg = document.getElementById('waitingMsg');
const overlayLayer = document.getElementById('memeStageOverlayLayer');
const bannerWrapper = document.getElementById('meme-banner-wrapper');
const textDisplay = document.getElementById('meme-text-display');
const gifWrapper = document.getElementById('stage-scale-wrapper');
const gifStage = document.getElementById('tracker-stage');
const gifCanvas = document.getElementById('tracker-canvas');
const gifCtx = gifCanvas.getContext('2d');

let wallW = 640;
let wallH = 360;
let lastText = null;

document.getElementById('dismissPreviewWarning').addEventListener('click', () => {
  document.getElementById('previewFlashWarning').style.display = 'none';
});

function fitStage() {
  const scale = Math.min(window.innerWidth / wallW, window.innerHeight / wallH);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', fitStage);

function applyText(t) {
  const showText = t.visible && t.value.trim().length > 0;
  bannerWrapper.style.display = showText ? 'flex' : 'none';
  if (!showText) {
    lastText = null;
    return;
  }

  if (lastText !== t.value) {
    lastText = t.value;
    textDisplay.innerHTML = '';
    Array.from(t.value).forEach((ch, idx) => {
      const span = document.createElement('span');
      span.className = 'meme-char';
      span.style.setProperty('--i', idx);
      span.textContent = ch === ' ' ? ' ' : ch;
      textDisplay.appendChild(span);
    });
  }

  const cls = `style-${t.style} anim-${t.anim}`;
  if (textDisplay.className !== cls) textDisplay.className = cls;
  textDisplay.style.fontSize = t.fontSize;
  textDisplay.style.setProperty('--amp', t.amp);
  textDisplay.style.setProperty('--pop', t.pop);

  bannerWrapper.classList.toggle('floating-mode', t.floating);
  bannerWrapper.style.left = t.floating ? t.left : '';
  bannerWrapper.style.top = t.floating ? t.top : '';
}

function applyGif(bitmap, meme) {
  if (!meme.gifVisible || !bitmap) {
    gifWrapper.style.display = 'none';
    if (bitmap) bitmap.close();
    return;
  }
  gifWrapper.style.display = 'flex';
  gifStage.style.display = 'block';
  if (gifCanvas.width !== bitmap.width || gifCanvas.height !== bitmap.height) {
    gifCanvas.width = bitmap.width;
    gifCanvas.height = bitmap.height;
  }
  gifCanvas.style.maxWidth = 'none';
  gifCanvas.style.maxHeight = 'none';
  gifCanvas.style.width = `${meme.gifBox.w}px`;
  gifCanvas.style.height = `${meme.gifBox.h}px`;
  gifCtx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
  gifCtx.drawImage(bitmap, 0, 0);
  bitmap.close();
  gifWrapper.style.transition = 'none';
  gifWrapper.style.transform = meme.gifTransform;
  gifWrapper.style.filter = meme.gifFilter;
}

window.addEventListener('message', (e) => {
  if (e.source !== window.opener) return;
  const d = e.data;
  if (!d || d.type !== 'STAGE_FRAME') return;

  if (waitingMsg) waitingMsg.style.display = 'none';
  stage.style.display = 'block';

  if (d.wallW !== wallW || d.wallH !== wallH) {
    wallW = d.wallW;
    wallH = d.wallH;
    stage.style.width = `${wallW}px`;
    stage.style.height = `${wallH}px`;
    fitStage();
  }

  if (projCanvas.width !== d.vj.width || projCanvas.height !== d.vj.height) {
    projCanvas.width = d.vj.width;
    projCanvas.height = d.vj.height;
  }
  projCtx.drawImage(d.vj, 0, 0);
  d.vj.close();

  if (d.meme) {
    applyGif(d.gif, d.meme);
    applyText(d.meme.text);
  } else if (d.gif) {
    d.gif.close();
  }
});

fitStage();
