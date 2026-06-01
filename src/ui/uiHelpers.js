/**
 * uiHelpers.js
 * Reusable Phaser UI primitives for cross-scene polish.
 *
 *   drawConnectionBadge(scene) — top-right ONLINE/OFFLINE chip
 *   showLoading(scene, text)   — centered overlay with spinner-like dots, returns { destroy }
 *   showConfirmDialog(scene, message, onConfirm, onCancel) — blocking yes/no modal
 *   showToast(scene, message, type) — non-blocking bottom notification (auto-dismiss)
 */

const DEPTH_BADGE   = 1000;
const DEPTH_LOADING = 2000;
const DEPTH_MODAL   = 3000;
const DEPTH_TOAST   = 4000;

// ============================================================
// Back button — consistent top-left button. Optional confirm dialog.
// ============================================================
/**
 * @param {Phaser.Scene} scene
 * @param {string} targetSceneKey  Scene key to navigate to
 * @param {object} [opts]
 *   - x, y: position (default 50, 25)
 *   - label: button text (default '< BACK')
 *   - confirmMessage: if set, shows confirm dialog before navigating
 *   - onBeforeNavigate: optional callback fired right before scene.start (e.g. to mark run lose)
 *   - data: optional payload passed to scene.start
 */
export function drawBackButton(scene, targetSceneKey, opts = {}) {
  const x = opts.x ?? 50;
  const y = opts.y ?? 25;
  const label = opts.label ?? '< BACK';

  const bg = scene.add.rectangle(x, y, 80, 30, 0x444466, 0.9)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(2, 0xffffff)
    .setDepth(DEPTH_BADGE);

  const text = scene.add.text(x, y, label, {
    fontSize: '12px', fontFamily: 'Arial Black', color: '#ffffff',
  }).setOrigin(0.5).setDepth(DEPTH_BADGE);

  bg.on('pointerover', () => bg.setFillStyle(0x6666aa, 1));
  bg.on('pointerout',  () => bg.setFillStyle(0x444466, 0.9));

  const navigate = () => {
    if (opts.onBeforeNavigate) opts.onBeforeNavigate();
    scene.scene.start(targetSceneKey, opts.data || {});
  };

  bg.on('pointerdown', () => {
    if (opts.confirmMessage) {
      showConfirmDialog(scene, opts.confirmMessage, navigate);
    } else {
      navigate();
    }
  });

  return { bg, text };
}

// ============================================================
// Connection badge — top-right chip showing online/offline status
// ============================================================
export function drawConnectionBadge(scene) {
  const mode    = scene.registry.get('authMode');
  if (!mode) return null; // not authenticated yet — skip

  const online  = mode === 'online';
  const color   = online ? 0x44aa44 : 0x888899;
  const label   = online ? '● ONLINE' : '● OFFLINE';
  const textCol = online ? '#aaffaa' : '#ffffff';

  const bg = scene.add.rectangle(795, 12, 110, 22, color, 0.9)
    .setOrigin(1, 0)
    .setStrokeStyle(1, 0xffffff)
    .setDepth(DEPTH_BADGE);

  const text = scene.add.text(740, 23, label, {
    fontSize: '11px', fontFamily: 'Arial Black', color: textCol,
  }).setOrigin(0.5).setDepth(DEPTH_BADGE);

  return { bg, text };
}

// ============================================================
// Loading overlay — dimmed background + centered text with animated dots
// ============================================================
export function showLoading(scene, message = 'Loading') {
  const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.55)
    .setDepth(DEPTH_LOADING).setInteractive();

  const text = scene.add.text(400, 300, `${message}...`, {
    fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff',
  }).setOrigin(0.5).setDepth(DEPTH_LOADING);

  // Animated dot count to feel responsive
  let dots = 3;
  const tween = scene.time.addEvent({
    delay: 400, loop: true,
    callback: () => {
      dots = (dots + 1) % 4;
      text.setText(`${message}${'.'.repeat(dots)}`);
    },
  });

  return {
    destroy() {
      tween.remove();
      overlay.destroy();
      text.destroy();
    },
    setMessage(newMsg) {
      message = newMsg;
    },
  };
}

// ============================================================
// Confirm dialog — modal yes/no with callbacks
// ============================================================
export function showConfirmDialog(scene, message, onConfirm, onCancel = null) {
  const elements = [];

  const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7)
    .setDepth(DEPTH_MODAL).setInteractive();
  elements.push(overlay);

  const box = scene.add.rectangle(400, 300, 460, 200, 0x1a1a2e, 1)
    .setDepth(DEPTH_MODAL).setStrokeStyle(2, 0xffcc00);
  elements.push(box);

  const msg = scene.add.text(400, 250, message, {
    fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    wordWrap: { width: 420 }, align: 'center',
  }).setOrigin(0.5).setDepth(DEPTH_MODAL);
  elements.push(msg);

  const cleanup = () => elements.forEach((e) => e.destroy());

  // YES button
  const yesBg = scene.add.rectangle(320, 340, 130, 42, 0x44aa44, 1)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(2, 0x66ff66).setDepth(DEPTH_MODAL);
  const yesText = scene.add.text(320, 340, 'YES', {
    fontSize: '15px', fontFamily: 'Arial Black', color: '#ffffff',
  }).setOrigin(0.5).setDepth(DEPTH_MODAL);
  yesBg.on('pointerdown', () => { cleanup(); onConfirm && onConfirm(); });
  elements.push(yesBg, yesText);

  // NO button
  const noBg = scene.add.rectangle(480, 340, 130, 42, 0xaa3333, 1)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(2, 0xff5555).setDepth(DEPTH_MODAL);
  const noText = scene.add.text(480, 340, 'NO', {
    fontSize: '15px', fontFamily: 'Arial Black', color: '#ffffff',
  }).setOrigin(0.5).setDepth(DEPTH_MODAL);
  noBg.on('pointerdown', () => { cleanup(); onCancel && onCancel(); });
  elements.push(noBg, noText);

  return { close: cleanup };
}

// ============================================================
// Toast — bottom slide-in notification, auto-dismiss
// ============================================================
const TOAST_COLORS = {
  info:    { bg: 0x4466aa, border: 0x88aaff },
  success: { bg: 0x44aa44, border: 0x88ff88 },
  warn:    { bg: 0xaa8844, border: 0xffcc66 },
  error:   { bg: 0xaa3333, border: 0xff6666 },
};

export function showToast(scene, message, type = 'info', durationMs = 2400) {
  const palette = TOAST_COLORS[type] || TOAST_COLORS.info;

  const startY = 620;
  const endY   = 560;

  const bg = scene.add.rectangle(400, startY, 460, 40, palette.bg, 0.95)
    .setStrokeStyle(2, palette.border).setDepth(DEPTH_TOAST);
  const text = scene.add.text(400, startY, message, {
    fontSize: '13px', fontFamily: 'Arial Black', color: '#ffffff',
    wordWrap: { width: 430 }, align: 'center',
  }).setOrigin(0.5).setDepth(DEPTH_TOAST);

  // Slide up
  scene.tweens.add({
    targets: [bg, text], y: endY, duration: 220, ease: 'Sine.easeOut',
  });

  // Auto-dismiss
  scene.time.delayedCall(durationMs, () => {
    scene.tweens.add({
      targets: [bg, text], y: startY, alpha: 0, duration: 220, ease: 'Sine.easeIn',
      onComplete: () => { bg.destroy(); text.destroy(); },
    });
  });
}
