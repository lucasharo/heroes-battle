import { EMOTES_BY_ID, EmoteId } from './emotes';
import { HEROES } from './heroes';
import { ActorState } from './types';

function drawBubbleBadgeVector(
  ctx: CanvasRenderingContext2D,
  emoteId: EmoteId,
  cx: number,
  cy: number,
  nowMs: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  switch (emoteId) {
    case 'gg': {
      // Gold trophy / victory star emblem
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -7);
      ctx.lineTo(7, -7);
      ctx.lineTo(5, 2);
      ctx.quadraticCurveTo(0, 6, -5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, 8);
      ctx.moveTo(-4, 8);
      ctx.lineTo(4, 8);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      break;
    }
    case 'smile': {
      // Bright cheerful face with happy eyes and smile
      ctx.fillStyle = '#34d399';
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-3.2, -2, 1.4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3.2, -2, 1.4, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1, 4.6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case 'nice': {
      // Radiant cyan star burst
      const pulse = 1 + Math.sin(nowMs * 0.014) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? 10 : 4.6;
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'angry': {
      // Crimson comic angry face with furrowed brows
      const shake = Math.sin(nowMs * 0.045) * 1.1;
      ctx.translate(shake, 0);
      ctx.fillStyle = '#fb7185';
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#4c0519';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, -3.8);
      ctx.lineTo(-1.5, -1.5);
      ctx.moveTo(5, -3.8);
      ctx.lineTo(1.5, -1.5);
      ctx.stroke();

      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.arc(-3.2, 0.4, 1.3, 0, Math.PI * 2);
      ctx.arc(3.2, 0.4, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 6.2, 3.8, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case 'oops': {
      // Surprised purple face with exclamation mark
      ctx.fillStyle = '#c084fc';
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(-3.2, -2.2, 1.5, 0, Math.PI * 2);
      ctx.arc(3.2, -2.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 3.8, 2.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'taunt': {
      // Crossed orange blades / duel mark
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, 7);
      ctx.lineTo(7, -7);
      ctx.moveTo(-7, -7);
      ctx.lineTo(7, 7);
      ctx.stroke();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5.5, 5.5);
      ctx.lineTo(5.5, -5.5);
      ctx.moveTo(-5.5, -5.5);
      ctx.lineTo(5.5, 5.5);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawActorEmoteBubble(
  ctx: CanvasRenderingContext2D,
  actor: ActorState,
  nowMs: number
) {
  const active = actor.activeEmote;
  if (!active || nowMs >= active.expiresAtMs) return;

  const def = EMOTES_BY_ID[active.id];
  if (!def) return;

  const cfg = HEROES[actor.heroId];
  const ageMs = Math.max(0, nowMs - active.startedAtMs);
  const remainingMs = Math.max(0, active.expiresAtMs - nowMs);

  // Pop-in bounce over first 180ms, fade-out over last 350ms
  const popProgress = Math.min(1, ageMs / 180);
  const popScale =
    popProgress < 1
      ? 0.5 + 0.65 * Math.sin(popProgress * (Math.PI * 0.72))
      : 1;
  const alpha = remainingMs < 350 ? Math.max(0, remainingMs / 350) : 1;
  const bobY = Math.sin(ageMs * 0.008) * 3;

  const extraStarOffset = actor.starsHeld > 0 ? 22 : 0;
  const anchorX = actor.x;
  const anchorY = actor.y - cfg.radius - 114 - extraStarOffset + bobY;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(anchorX, anchorY);
  ctx.scale(popScale, popScale);

  // Measure pill bubble dimensions cleanly
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  const textWidth = ctx.measureText(def.bubbleText).width;
  const bubbleW = Math.max(82, Math.ceil(textWidth + 44));
  const bubbleH = 34;
  const bx = -bubbleW / 2;
  const by = -bubbleH;

  // Drop shadow
  ctx.fillStyle = 'rgba(5, 8, 18, 0.58)';
  ctx.beginPath();
  ctx.roundRect(bx + 2, by + 4, bubbleW, bubbleH, 12);
  ctx.fill();

  // Speech bubble body
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = def.borderColor;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 12);
  ctx.fill();
  ctx.stroke();

  // Speech tail pointing down to hero
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-7, by + bubbleH - 1.5);
  ctx.lineTo(0, by + bubbleH + 9);
  ctx.lineTo(7, by + bubbleH - 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = def.borderColor;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, by + bubbleH);
  ctx.lineTo(0, by + bubbleH + 9);
  ctx.lineTo(7, by + bubbleH);
  ctx.stroke();

  // Left vector icon badge
  drawBubbleBadgeVector(ctx, def.id, bx + 18, by + bubbleH / 2, nowMs);

  // Crisp emote text
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.bubbleText, bx + 33, by + bubbleH / 2 + 0.5);

  ctx.restore();
}
