import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EMOTE_CATALOG,
  EMOTE_COOLDOWN_SEC,
  EMOTES_BY_ID,
  EmoteId,
  computeEmoteWheelSlots,
  resolveEmoteSelectionFromOffset,
} from '../game/emotes';
import { EmoteBadgeIcon, EmoteTriggerIcon } from './EmoteIcons';

interface RadialEmoteMenuProps {
  emoteCooldown: number;
  disabled?: boolean;
  isMobile?: boolean;
  inlineTrigger?: boolean;
  triggerClassName?: string;
  onSendEmote: (emoteId: EmoteId) => boolean | void;
}

export const RadialEmoteMenu: React.FC<RadialEmoteMenuProps> = ({
  emoteCooldown,
  disabled = false,
  isMobile = false,
  inlineTrigger = false,
  triggerClassName = '',
  onSendEmote,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<EmoteId | null>(null);
  const [lastFeedback, setLastFeedback] = useState<EmoteId | null>(null);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const hoveredIdRef = useRef<EmoteId | null>(null);
  const openRef = useRef(false);
  const tKeyDownAtRef = useRef<number | null>(null);
  hoveredIdRef.current = hoveredId;
  openRef.current = open;

  const wheelRadius = isMobile ? 90 : 104;
  const slots = useMemo(
    () => computeEmoteWheelSlots(EMOTE_CATALOG, wheelRadius),
    [wheelRadius]
  );

  const onCooldown = emoteCooldown > 0.05;
  const cooldownProgress = Math.min(1, Math.max(0, emoteCooldown / EMOTE_COOLDOWN_SEC));

  const fireEmote = useCallback(
    (emoteId: EmoteId) => {
      if (disabled || onCooldown) {
        setOpen(false);
        setHoveredId(null);
        return;
      }
      onSendEmote(emoteId);
      setLastFeedback(emoteId);
      setOpen(false);
      setHoveredId(null);
    },
    [disabled, onCooldown, onSendEmote]
  );

  useEffect(() => {
    if (!lastFeedback) return;
    const timer = window.setTimeout(() => setLastFeedback(null), 900);
    return () => window.clearTimeout(timer);
  }, [lastFeedback]);

  const updateSelectionFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const wheelEl = wheelRef.current;
    if (!wheelEl) return;
    const rect = wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const matched = resolveEmoteSelectionFromOffset(clientX - cx, clientY - cy, EMOTE_CATALOG, 24);
    setHoveredId(matched ? matched.id : null);
  }, []);

  // Keyboard support: T (tap to toggle, hold + aim + release to quick-cast), 1-6 quick pick, Esc to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Escape' && openRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setHoveredId(null);
        tKeyDownAtRef.current = null;
        return;
      }

      if (e.code === 'KeyT' && !e.repeat) {
        e.preventDefault();
        if (openRef.current) {
          setOpen(false);
          setHoveredId(null);
          tKeyDownAtRef.current = null;
        } else {
          tKeyDownAtRef.current = performance.now();
          setHoveredId(null);
          setOpen(true);
        }
        return;
      }

      if (openRef.current && e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1;
        const chosen = EMOTE_CATALOG[idx];
        if (chosen) {
          e.preventDefault();
          fireEmote(chosen.id);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'KeyT') return;
      const downAt = tKeyDownAtRef.current;
      tKeyDownAtRef.current = null;
      if (downAt === null || !openRef.current) return;

      const heldMs = performance.now() - downAt;
      if (heldMs >= 210) {
        if (hoveredIdRef.current) {
          fireEmote(hoveredIdRef.current);
        } else {
          setOpen(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [disabled, fireEmote]);

  const activePreview = hoveredId ? EMOTES_BY_ID[hoveredId] : null;
  const wheelSizePx = isMobile ? 256 : 292;
  const spokeOuter = wheelSizePx / 2 - 4;
  const spokeInner = 40;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        tabIndex={-1}
        data-testid="emote-menu-trigger"
        aria-label="Abrir menu radial de emotes"
        aria-expanded={open}
        title="Emotes rápidos [T]"
        disabled={disabled}
        onClick={(e) => {
          e.currentTarget.blur();
          if (disabled) return;
          setHoveredId(null);
          setOpen((prev) => !prev);
        }}
        className={`${
          inlineTrigger
            ? 'relative w-14 h-14 rounded-lg'
            : 'pointer-events-auto fixed left-3.5 bottom-[144px] sm:static w-12 h-12 rounded-full shadow-xl'
        } border flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden ${
          open
            ? 'border-amber-300 bg-amber-500/25'
            : lastFeedback
            ? 'border-emerald-400 bg-emerald-500/20'
            : 'border-indigo-400/55 bg-slate-950/90 hover:border-amber-400/80'
        } ${disabled ? 'opacity-45 cursor-not-allowed' : ''} ${triggerClassName}`}
        style={
          inlineTrigger
            ? undefined
            : { backgroundColor: open ? 'rgba(245, 158, 11, 0.24)' : 'rgba(13, 20, 36, 0.92)' }
        }
      >
        <EmoteTriggerIcon className={inlineTrigger ? 'w-5 h-5' : 'w-5 h-5'} />
        <span className="text-[9px] font-mono-num font-bold text-amber-300 leading-none mt-0.5">
          {onCooldown ? `${emoteCooldown.toFixed(1)}s` : isMobile ? 'EMOTE' : 'T'}
        </span>

        {onCooldown && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-amber-400/85 pointer-events-none"
            style={{ width: `${Math.round((1 - cooldownProgress) * 100)}%` }}
          />
        )}
      </button>

      {/* Radial Emote Wheel Overlay (portaled to body so parent transforms never clip fixed positioning) */}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-testid="radial-emote-overlay"
            className="fixed inset-0 z-40 pointer-events-auto flex items-center justify-center"
            style={{ backgroundColor: 'rgba(8, 12, 28, 0.48)' }}
            onPointerMove={(e) => updateSelectionFromClientPoint(e.clientX, e.clientY)}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
                setHoveredId(null);
              }
            }}
          >
            <div
              ref={wheelRef}
              data-testid="radial-emote-wheel"
              role="dialog"
              aria-label="Roda de emotes rápidos"
              className="relative rounded-full flex items-center justify-center select-none shadow-2xl"
              style={{
                width: `${wheelSizePx}px`,
                height: `${wheelSizePx}px`,
                backgroundColor: 'rgba(11, 17, 42, 0.94)',
                border: '2px solid rgba(129, 140, 248, 0.48)',
                boxShadow: '0 24px 60px rgba(2, 6, 23, 0.78)',
              }}
            >
              {/* Radial Divider Spokes & Active Wedge Ring */}
              <svg
                viewBox={`0 0 ${wheelSizePx} ${wheelSizePx}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <circle
                  cx={wheelSizePx / 2}
                  cy={wheelSizePx / 2}
                  r={wheelRadius}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {slots.map((slot) => {
                  const boundaryAngle = slot.angleRad - Math.PI / slots.length;
                  const cx = wheelSizePx / 2;
                  const cy = wheelSizePx / 2;
                  return (
                    <line
                      key={slot.emote.id}
                      x1={cx + Math.cos(boundaryAngle) * spokeInner}
                      y1={cy + Math.sin(boundaryAngle) * spokeInner}
                      x2={cx + Math.cos(boundaryAngle) * spokeOuter}
                      y2={cy + Math.sin(boundaryAngle) * spokeOuter}
                      stroke="rgba(129, 140, 248, 0.22)"
                      strokeWidth="1.2"
                    />
                  );
                })}
              </svg>

              {/* Radial Emote Option Buttons */}
              {slots.map((slot) => {
                const isSelected = hoveredId === slot.emote.id;
                return (
                  <button
                    key={slot.emote.id}
                    type="button"
                    data-testid={`emote-option-${slot.emote.id}`}
                    aria-label={slot.emote.ariaLabel}
                    onPointerEnter={() => setHoveredId(slot.emote.id)}
                    onMouseEnter={() => setHoveredId(slot.emote.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      fireEmote(slot.emote.id);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex flex-col items-center justify-center transition-transform duration-100 cursor-pointer shadow-lg ${
                      isMobile ? 'w-[64px] h-[64px]' : 'w-[74px] h-[74px]'
                    } ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'} ${
                      onCooldown ? 'opacity-65' : ''
                    }`}
                    style={{
                      left: `${wheelSizePx / 2 + slot.x}px`,
                      top: `${wheelSizePx / 2 + slot.y}px`,
                      backgroundColor: isSelected ? slot.emote.bgTint : 'rgba(15, 23, 42, 0.94)',
                      borderColor: isSelected ? slot.emote.borderColor : 'rgba(100, 116, 139, 0.65)',
                    }}
                  >
                    <EmoteBadgeIcon
                      emoteId={slot.emote.id}
                      className={isMobile ? 'w-6 h-6' : 'w-7 h-7'}
                    />
                    <span className="text-[10px] font-extrabold text-slate-100 leading-none mt-1 whitespace-nowrap">
                      {slot.emote.label}
                    </span>
                    {!isMobile && (
                      <span className="text-[9px] font-mono-num text-slate-400 leading-none mt-0.5">
                        {slot.emote.hotkey}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Center Hub: Preview Active Emote or Cancel */}
              <button
                type="button"
                data-testid="emote-wheel-cancel"
                aria-label="Fechar roda de emotes"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setHoveredId(null);
                }}
                className="relative z-10 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center text-center px-1.5 transition-colors cursor-pointer shadow-inner"
                style={{
                  backgroundColor: 'rgba(8, 12, 28, 0.96)',
                  borderColor: activePreview
                    ? activePreview.borderColor
                    : 'rgba(129, 140, 248, 0.45)',
                }}
              >
                {onCooldown ? (
                  <>
                    <span className="text-[10px] font-bold uppercase text-slate-400 leading-none">
                      Recarga
                    </span>
                    <span className="text-sm font-mono-num font-extrabold text-amber-300 mt-1">
                      {emoteCooldown.toFixed(1)}s
                    </span>
                  </>
                ) : activePreview ? (
                  <>
                    <span
                      className="text-xs font-extrabold leading-tight"
                      style={{ color: activePreview.accent }}
                    >
                      {activePreview.label}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">Enviar</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-extrabold text-slate-200 leading-none">Emotes</span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-none">Fechar ×</span>
                  </>
                )}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
