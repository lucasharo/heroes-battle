import React, { useRef, useState } from 'react';
import { HEROES } from '../game/heroes';
import { computeVirtualStickVector } from '../game/physics';
import { HudSnapshot } from '../game/types';
import { SkillSlotIcon } from './GameIcons';

interface MobileControlsProps {
  hud: HudSnapshot;
  onMoveChange: (dx: number, dy: number) => void;
  onAimChange: (dx: number, dy: number, firing: boolean) => void;
  onAttackTap: () => void;
  onTriggerSkill: (slot: 'q' | 'e' | 'r') => void;
}

const MOVE_MAX_RADIUS = 42;
const AIM_MAX_RADIUS = 34;

function trySetPointerCapture(el: HTMLElement, pointerId: number): void {
  try {
    el.setPointerCapture?.(pointerId);
  } catch {
    // Ignore when pointerId is synthetic or already released
  }
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  hud,
  onMoveChange,
  onAimChange,
  onAttackTap,
  onTriggerSkill,
}) => {
  const hero = HEROES[hud.playerHero];

  const movePadRef = useRef<HTMLDivElement | null>(null);
  const movePointerId = useRef<number | null>(null);
  const [moveKnob, setMoveKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const aimPadRef = useRef<HTMLDivElement | null>(null);
  const aimPointerId = useRef<number | null>(null);
  const aimOriginRef = useRef<{ x: number; y: number } | null>(null);
  const aimDraggedRef = useRef<boolean>(false);
  const aimPressStartMsRef = useRef<number>(0);
  const aimMaxDragPxRef = useRef<number>(0);
  const lastAimVecRef = useRef<{ x: number; y: number } | null>(null);
  const [aimKnob, setAimKnob] = useState<{
    x: number;
    y: number;
    active: boolean;
    aiming: boolean;
    angleDeg: number;
  }>({
    x: 0,
    y: 0,
    active: false,
    aiming: false,
    angleDeg: 0,
  });

  const updateMoveFromPointer = (clientX: number, clientY: number) => {
    const el = movePadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const vec = computeVirtualStickVector(clientX - cx, clientY - cy, MOVE_MAX_RADIUS, 0.14);
    setMoveKnob({ x: vec.knobX, y: vec.knobY, active: true });
    onMoveChange(vec.x, vec.y);
  };

  const resetMoveStick = () => {
    movePointerId.current = null;
    setMoveKnob({ x: 0, y: 0, active: false });
    onMoveChange(0, 0);
  };

  const updateAimFromPointer = (clientX: number, clientY: number) => {
    const origin = aimOriginRef.current;
    if (!origin) return;
    const rawDist = Math.hypot(clientX - origin.x, clientY - origin.y);
    aimMaxDragPxRef.current = Math.max(aimMaxDragPxRef.current, rawDist);
    const heldMs = performance.now() - aimPressStartMsRef.current;

    const vec = computeVirtualStickVector(
      clientX - origin.x,
      clientY - origin.y,
      AIM_MAX_RADIUS,
      0.16
    );

    const engagedDrag = rawDist > 16 || (rawDist > 9 && heldMs > 160);

    if (vec.magnitude > 0 && (aimDraggedRef.current || engagedDrag)) {
      aimDraggedRef.current = true;
      lastAimVecRef.current = { x: vec.x, y: vec.y };
      const angleDeg = (Math.atan2(vec.y, vec.x) * 180) / Math.PI;
      setAimKnob({
        x: vec.knobX,
        y: vec.knobY,
        active: true,
        aiming: true,
        angleDeg,
      });
      onAimChange(vec.x, vec.y, true);
    } else if (aimDraggedRef.current && lastAimVecRef.current) {
      const prev = lastAimVecRef.current;
      const angleDeg = (Math.atan2(prev.y, prev.x) * 180) / Math.PI;
      setAimKnob({
        x: vec.knobX,
        y: vec.knobY,
        active: true,
        aiming: true,
        angleDeg,
      });
      onAimChange(prev.x, prev.y, true);
    } else {
      setAimKnob((prev) => ({
        ...prev,
        x: vec.knobX,
        y: vec.knobY,
        active: true,
      }));
    }
  };

  const finishAimStick = (shouldTapFireIfNotDragged: boolean) => {
    const didDrag = aimDraggedRef.current;
    const tapDurationMs = performance.now() - aimPressStartMsRef.current;
    const isQuickTap = !didDrag || (tapDurationMs <= 220 && aimMaxDragPxRef.current <= 20);
    aimPointerId.current = null;
    aimOriginRef.current = null;
    aimDraggedRef.current = false;
    aimMaxDragPxRef.current = 0;
    lastAimVecRef.current = null;
    setAimKnob({ x: 0, y: 0, active: false, aiming: false, angleDeg: 0 });
    onAimChange(0, 0, false);
    if (shouldTapFireIfNotDragged && isQuickTap) {
      onAttackTap();
    }
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none">
      {/* Left Virtual Movement Joystick */}
      <div
        ref={movePadRef}
        data-testid="mobile-move-joystick"
        role="application"
        aria-label="Joystick virtual de movimento"
        onPointerDown={(e) => {
          if (movePointerId.current !== null) return;
          e.preventDefault();
          e.stopPropagation();
          movePointerId.current = e.pointerId;
          trySetPointerCapture(e.currentTarget, e.pointerId);
          updateMoveFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          e.preventDefault();
          updateMoveFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          e.preventDefault();
          resetMoveStick();
        }}
        onPointerCancel={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          resetMoveStick();
        }}
        className="pointer-events-auto touch-none fixed w-28 h-28 rounded-full border-2 flex items-center justify-center shadow-xl"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          left: 'max(0.85rem, env(safe-area-inset-left))',
          backgroundColor: 'rgba(11, 17, 38, 0.68)',
          borderColor: moveKnob.active ? 'rgba(56, 189, 248, 0.72)' : 'rgba(129, 140, 248, 0.38)',
        }}
      >
        <div className="w-16 h-16 rounded-full border border-dashed border-slate-500/35 pointer-events-none" />
        <div
          className="absolute w-11 h-11 rounded-full border-2 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate3d(${moveKnob.x}px, ${moveKnob.y}px, 0)`,
            backgroundColor: moveKnob.active ? 'rgba(56, 189, 248, 0.5)' : 'rgba(148, 163, 184, 0.28)',
            borderColor: moveKnob.active ? '#7dd3fc' : 'rgba(203, 213, 225, 0.6)',
          }}
        />
      </div>

      {/* Right Combat Cluster: Ammo Bar + MOBA Arc (Q / E / R) + Twin-Stick Aim/Attack Pad */}
      <div
        data-testid="mobile-action-pad"
        data-combo-step={hud.comboStep}
        data-ammo={hud.ammo}
        className="pointer-events-none fixed flex flex-col items-end gap-2"
        style={{
          bottom: 'max(1.1rem, env(safe-area-inset-bottom))',
          right: 'max(1.1rem, env(safe-area-inset-right))',
        }}
      >
        {/* Compact Ammo & Combo Indicator above Skill Arc */}
        <div className="flex flex-col items-end gap-1 pr-1">
          {hud.comboStep >= 2 && (
            <div
              data-testid="mobile-combo-indicator"
              className={`px-2 py-0.5 rounded text-[10px] font-display font-extrabold tracking-wide uppercase ${
                hud.comboStep >= 3
                  ? 'bg-amber-500/30 border border-amber-300 text-amber-200'
                  : 'bg-slate-950/85 border border-amber-400/70 text-amber-300'
              }`}
            >
              {hud.comboStep >= 3 ? 'COMBO x3 +65%' : 'COMBO x2 +25%'}
            </div>
          )}
          <div className="flex items-center gap-1">
            {Array.from({ length: hud.maxAmmo }).map((_, i) => {
              const filled = i < hud.ammo;
              const reloading = i === hud.ammo;
              return (
                <div
                  key={i}
                  className={`w-8 h-1.5 rounded-sm bg-slate-950/90 border overflow-hidden ${
                    hud.comboStep >= 1 ? 'border-amber-400' : 'border-slate-700'
                  }`}
                >
                  <div
                    className="h-full"
                    style={{
                      width: filled ? '100%' : reloading ? `${hud.ammoReloadProgress * 100}%` : '0%',
                      backgroundColor: filled
                        ? hud.comboStep >= 2
                          ? '#f97316'
                          : '#fbbf24'
                        : '#94a3b8',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative w-[176px] h-[172px]">
          {/* Skill Q (Left of Attack Ring) */}
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTriggerSkill('q');
            }}
            aria-label={`Habilidade Q: ${hero.skills.q.name}`}
            className="pointer-events-auto touch-none absolute right-[108px] bottom-1 w-12 h-12 rounded-full border-2 border-slate-600/90 bg-slate-950/85 active:scale-95 flex flex-col items-center justify-center overflow-hidden shadow-lg cursor-pointer"
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="Q" accent={hero.accent} />
            <span className="text-[9px] font-mono-num font-bold text-amber-400 leading-none">Q</span>
            {hud.qCooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center font-mono-num text-xs font-extrabold text-white"
                style={{ backgroundColor: 'rgba(9, 14, 26, 0.84)' }}
              >
                {hud.qCooldown.toFixed(1)}
              </div>
            )}
          </button>

          {/* Skill E (Diagonal Top-Left of Attack Ring) */}
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTriggerSkill('e');
            }}
            aria-label={`Habilidade E: ${hero.skills.e.name}`}
            className="pointer-events-auto touch-none absolute right-[88px] bottom-[78px] w-12 h-12 rounded-full border-2 border-slate-600/90 bg-slate-950/85 active:scale-95 flex flex-col items-center justify-center overflow-hidden shadow-lg cursor-pointer"
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="E" accent={hero.accent} />
            <span className="text-[9px] font-mono-num font-bold text-amber-400 leading-none">E</span>
            {hud.eCooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center font-mono-num text-xs font-extrabold text-white"
                style={{ backgroundColor: 'rgba(9, 14, 26, 0.84)' }}
              >
                {hud.eCooldown.toFixed(1)}
              </div>
            )}
          </button>

          {/* Skill R / Fury (Above Attack Ring) */}
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTriggerSkill('r');
            }}
            aria-label={`Fúria R: ${hero.skills.r.name}`}
            className={`pointer-events-auto touch-none absolute right-2 bottom-[108px] w-14 h-14 rounded-full border-2 active:scale-95 flex flex-col items-center justify-center overflow-hidden shadow-lg cursor-pointer transition-colors ${
              hud.furyCharge >= 100
                ? 'border-amber-300 bg-amber-500/30'
                : 'border-slate-600/90 bg-slate-950/85'
            }`}
          >
            <SkillSlotIcon
              heroId={hud.playerHero}
              slot="R"
              accent={hud.furyCharge >= 100 ? '#fbbf24' : hero.accent}
            />
            <span className="text-[9px] font-mono-num font-bold text-amber-300 leading-none">
              {hud.furyCharge >= 100 ? 'R!' : `${hud.furyCharge}%`}
            </span>
            {hud.furyCharge < 100 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-amber-400"
                style={{ width: `${hud.furyCharge}%` }}
              />
            )}
          </button>

          {/* Stationary Outer Aim/Attack Ring with Sliding Inner Knob */}
          <div
            ref={aimPadRef}
            role="button"
            aria-label="Atacar e Mirar"
            data-testid="mobile-attack-button"
            onPointerDown={(e) => {
              if (aimPointerId.current !== null) return;
              e.preventDefault();
              e.stopPropagation();
              aimPointerId.current = e.pointerId;
              aimOriginRef.current = { x: e.clientX, y: e.clientY };
              aimPressStartMsRef.current = performance.now();
              aimMaxDragPxRef.current = 0;
              aimDraggedRef.current = false;
              lastAimVecRef.current = null;
              trySetPointerCapture(e.currentTarget, e.pointerId);
              setAimKnob((prev) => ({ ...prev, x: 0, y: 0, active: true, aiming: false }));
            }}
            onPointerMove={(e) => {
              if (aimPointerId.current !== e.pointerId) return;
              e.preventDefault();
              updateAimFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (aimPointerId.current !== e.pointerId) return;
              e.preventDefault();
              finishAimStick(true);
            }}
            onPointerCancel={(e) => {
              if (aimPointerId.current !== e.pointerId) return;
              finishAimStick(false);
            }}
            className="pointer-events-auto touch-none absolute right-0 bottom-0 w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-2xl cursor-pointer"
            style={{
              backgroundColor: aimKnob.active
                ? 'rgba(245, 158, 11, 0.16)'
                : 'rgba(11, 17, 38, 0.72)',
              borderColor: aimKnob.aiming
                ? '#fbbf24'
                : aimKnob.active
                ? 'rgba(251, 191, 36, 0.7)'
                : 'rgba(129, 140, 248, 0.45)',
            }}
          >
            <div className="w-16 h-16 rounded-full border border-dashed border-amber-300/35 pointer-events-none" />

            {/* Directional Aim Chevron on Outer Ring while dragging */}
            {aimKnob.aiming && (
              <div
                data-testid="mobile-aim-direction-indicator"
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `rotate(${aimKnob.angleDeg}deg)` }}
              >
                <div
                  className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0"
                  style={{
                    borderTop: '7px solid transparent',
                    borderBottom: '7px solid transparent',
                    borderLeft: '11px solid #fbbf24',
                  }}
                />
              </div>
            )}

            {/* Sliding Inner Attack Knob */}
            <div
              className="absolute w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center pointer-events-none shadow-lg"
              style={{
                transform: `translate3d(${aimKnob.x}px, ${aimKnob.y}px, 0)`,
                backgroundColor: aimKnob.active
                  ? 'rgba(245, 158, 11, 0.42)'
                  : 'rgba(14, 21, 52, 0.92)',
                borderColor: aimKnob.active ? '#fbbf24' : hero.accent,
              }}
            >
              <SkillSlotIcon heroId={hud.playerHero} slot="LMB" accent={hero.accent} />
              <span className="text-[9px] font-display font-extrabold tracking-normal text-amber-200 uppercase mt-0.5 leading-none">
                Atacar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
