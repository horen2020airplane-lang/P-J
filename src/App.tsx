/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Crosshair,
  Target,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Repeat,
  Wind,
  Settings,
  Users,
  Radio,
  Download,
  Volume2,
  VolumeX,
  Play,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { FPSEngine } from './game/engine.ts';
import { soundEngine } from './game/audio.ts';
import { WEAPON_REGISTRY, WeaponDef } from './game/weapons.ts';
import { MAP_REGISTRY, MapData } from './game/maps.ts';
import { TeamType } from './game/operators.ts';
import { loadHudLayout, saveHudLayout, resetHudLayout, HudLayout, HudButtonConfig } from './game/hudConfig.ts';
import { networkManager } from './game/network.ts';
import { ArmoryPreview } from './game/armoryPreview.ts';
import { exportStandaloneHTML } from './game/standaloneExporter.ts';

type AppScreen = 'splash' | 'menu' | 'maps' | 'armory' | 'hud_editor' | 'playing';

interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  isSelf: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [team, setTeam] = useState<TeamType>('blue');
  const [selectedMapId, setSelectedMapId] = useState<string>('dust2');
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('m4a1');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // In-game HUD state
  const [health, setHealth] = useState<number>(100);
  const [armor, setArmor] = useState<number>(50);
  const [magAmmo, setMagAmmo] = useState<number>(30);
  const [reserveAmmo, setReserveAmmo] = useState<number>(90);
  const [activeWeapon, setActiveWeapon] = useState<WeaponDef>(WEAPON_REGISTRY.m4a1);
  const [isPrimaryActive, setIsPrimaryActive] = useState<boolean>(true);
  const [blueScore, setBlueScore] = useState<number>(0);
  const [redScore, setRedScore] = useState<number>(0);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [showHitmarker, setShowHitmarker] = useState<boolean>(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState<boolean>(false);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);

  // Sniper Scope state
  const [isScoped, setIsScoped] = useState<boolean>(false);
  const [isSniperScope, setIsSniperScope] = useState<boolean>(false);
  const [breathPercent, setBreathPercent] = useState<number>(100);
  const [isHoldingBreath, setIsHoldingBreath] = useState<boolean>(false);

  // HUD layout config
  const [hudLayout, setHudLayout] = useState<HudLayout>(loadHudLayout());
  const [selectedHudBtn, setSelectedHudBtn] = useState<string>('fire');

  // Network state
  const [hostCode, setHostCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [netStatus, setNetStatus] = useState<string>('');
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);

  // Refs
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FPSEngine | null>(null);
  const armoryMountRef = useRef<HTMLDivElement>(null);
  const armoryPreviewRef = useRef<ArmoryPreview | null>(null);

  // Virtual Joystick touch refs
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera touch look refs
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Toggle audio
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  // 1. Splash Screen Enter
  const handleEnterGame = () => {
    soundEngine.playIntroChime();
    setScreen('menu');
  };

  // 2. Start Match (Solo or Multiplayer)
  const startMatch = () => {
    setScreen('playing');
  };

  // Host Hotspot Match
  const handleHostMatch = () => {
    setNetStatus('Provisioning WebRTC peer host...');
    networkManager.hostMatch(
      (code) => {
        setHostCode(code);
        setNetStatus(`Room created: ${code}. Share with hotspot peers!`);
        startMatch();
      },
      (err) => {
        setNetStatus(`Host error: ${err}`);
      }
    );
  };

  // Join Hotspot Match
  const handleJoinMatch = () => {
    if (!joinCodeInput.trim()) return;
    setNetStatus(`Connecting to ${joinCodeInput}...`);
    networkManager.joinMatch(
      joinCodeInput.trim(),
      () => {
        setShowJoinModal(false);
        setNetStatus(`Connected!`);
        startMatch();
      },
      (err) => {
        setNetStatus(`Join error: ${err}`);
      }
    );
  };

  // Initialize FPS Engine when entering 'playing' screen
  useEffect(() => {
    if (screen !== 'playing') {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasMountRef.current) return;

    const engine = new FPSEngine(
      canvasMountRef.current,
      selectedMapId,
      selectedPrimaryId,
      team,
      {
        onHealthChange: (hp, arm) => {
          setHealth(hp);
          setArmor(arm);
        },
        onAmmoChange: (mag, res) => {
          setMagAmmo(mag);
          setReserveAmmo(res);
        },
        onWeaponChange: (w, isPrim) => {
          setActiveWeapon(w);
          setIsPrimaryActive(isPrim);
        },
        onScoreChange: (b, r) => {
          setBlueScore(b);
          setRedScore(r);
        },
        onKillFeed: (killer, victim, weapon, headshot, isSelf) => {
          const item: KillFeedItem = {
            id: Math.random().toString(),
            killer,
            victim,
            weapon,
            headshot,
            isSelf,
          };
          setKillFeed((prev) => [item, ...prev.slice(0, 4)]);
          setTimeout(() => {
            setKillFeed((prev) => prev.filter((i) => i.id !== item.id));
          }, 4500);
        },
        onHitmarker: (headshot) => {
          setShowHitmarker(true);
          setIsHeadshotHit(headshot);
          setTimeout(() => setShowHitmarker(false), 120);
        },
        onDamageTaken: () => {
          setDamageFlash(true);
          setTimeout(() => setDamageFlash(false), 200);
        },
        onSniperSway: (_sx, _sy, stamina, isHolding) => {
          setBreathPercent(Math.round(stamina * 100));
          setIsHoldingBreath(isHolding);
        },
        onScopeState: (scoped, isSniper) => {
          setIsScoped(scoped);
          setIsSniperScope(isSniper);
        },
      }
    );

    engineRef.current = engine;

    // Desktop Keyboard / Mouse Controls Fallback
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') engine.moveVector.y = 1;
      if (e.code === 'KeyS') engine.moveVector.y = -1;
      if (e.code === 'KeyA') engine.moveVector.x = -1;
      if (e.code === 'KeyD') engine.moveVector.x = 1;
      if (e.code === 'Space') engine.triggerJump();
      if (e.code === 'KeyC') engine.toggleCrouch();
      if (e.code === 'KeyR') engine.reload();
      if (e.code === 'KeyQ') engine.switchWeapon();
      if (e.code === 'ShiftLeft') engine.setHoldingBreath(true);
      if (e.code === 'Escape') setScreen('menu');
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'KeyS') engine.moveVector.y = 0;
      if (e.code === 'KeyA' || e.code === 'KeyD') engine.moveVector.x = 0;
      if (e.code === 'ShiftLeft') engine.setHoldingBreath(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) engine.isTriggerHeld = true;
      if (e.button === 2) engine.toggleADS();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) engine.isTriggerHeld = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        engine.lookDelta.x = e.movementX;
        engine.lookDelta.y = e.movementY;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      engine.dispose();
      engineRef.current = null;
    };
  }, [screen, selectedMapId, selectedPrimaryId, team]);

  // Initialize 3D Armory Turntable Preview
  useEffect(() => {
    if (screen !== 'armory') {
      if (armoryPreviewRef.current) {
        armoryPreviewRef.current.dispose();
        armoryPreviewRef.current = null;
      }
      return;
    }

    if (armoryMountRef.current) {
      armoryPreviewRef.current = new ArmoryPreview(armoryMountRef.current, selectedPrimaryId);
    }

    return () => {
      if (armoryPreviewRef.current) {
        armoryPreviewRef.current.dispose();
        armoryPreviewRef.current = null;
      }
    };
  }, [screen, selectedPrimaryId]);

  // Update armory preview when selected weapon changes
  const handleSelectArmoryWeapon = (wId: string) => {
    setSelectedPrimaryId(wId);
    if (armoryPreviewRef.current) {
      armoryPreviewRef.current.setWeapon(wId);
    }
  };

  // Virtual Left Joystick Touch Handlers
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const maxDist = hudLayout.joystick.size / 2;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;
        setJoystickKnob({ x: clampedX, y: clampedY });

        // Normalize to -1..1 for game engine
        if (engineRef.current) {
          engineRef.current.moveVector = {
            x: clampedX / maxDist,
            y: -clampedY / maxDist,
          };
        }
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setJoystickKnob({ x: 0, y: 0 });
        if (engineRef.current) {
          engineRef.current.moveVector = { x: 0, y: 0 };
        }
      }
    }
  };

  // Right-side Camera Touch Look Handlers
  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Only track if on right half of screen
      if (touch.clientX > window.innerWidth * 0.35 && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        if (engineRef.current) {
          engineRef.current.lookDelta.x += dx * 1.35;
          engineRef.current.lookDelta.y += dy * 1.35;
        }
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  // HUD Customizer button drag handler
  const handleHudDrag = (btnId: string, clientX: number, clientY: number) => {
    const xPct = Math.max(5, Math.min(95, (clientX / window.innerWidth) * 100));
    const yPct = Math.max(5, Math.min(95, (clientY / window.innerHeight) * 100));

    setHudLayout((prev) => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        [btnId]: {
          ...prev.buttons[btnId],
          x: Math.round(xPct),
          y: Math.round(yPct),
        },
      },
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-['Chakra_Petch',sans-serif]">
      {/* =========================================================================
          SCREEN 1: PERSIAN STARTUP / SPLASH SCREEN
          Mandatory text: "بسم الله الرحمن الرحیم" and "به بازی پوریا جم خوش آمدید"
          ========================================================================= */}
      {screen === 'splash' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#070b10] via-[#0d141f] to-[#040609] text-white">
          {/* Persian Calligraphy Header */}
          <div className="mt-8 text-center animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-extrabold font-['Vazirmatn'] text-[#00f0ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]">
              بسم الله الرحمن الرحیم
            </h1>
            <p className="mt-4 text-xl md:text-3xl font-bold font-['Vazirmatn'] text-gray-200 drop-shadow-md">
              به بازی پوریا جم خوش آمدید
            </p>
            <div className="mt-2 inline-block px-3 py-1 text-xs tracking-widest font-semibold uppercase text-cyan-400 border border-cyan-500/40 bg-cyan-950/30 rounded">
              PORIA JAM // ULTRA TACTICAL 3D FPS
            </div>
          </div>

          {/* Center Tactical Emblem */}
          <div className="relative flex items-center justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/20 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-cyan-950 to-slate-900 border border-cyan-500/50 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.25)]">
                <Crosshair className="w-16 h-16 text-[#00f0ff] mb-1" />
                <span className="text-xl font-black tracking-widest text-white">PJ-OPS</span>
                <span className="text-[10px] tracking-widest text-cyan-400">MIL-SPEC 3D</span>
              </div>
            </div>
          </div>

          {/* Action CTA & Audio Notice */}
          <div className="mb-6 flex flex-col items-center gap-4 w-full max-w-sm">
            <button
              onClick={handleEnterGame}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-lg md:text-xl rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-black" />
              <span>ورود به بازی / ENTER COMBAT</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Designed for mobile touch screens & desktop browsers</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 2: MAIN MENU & LOBBY
          ========================================================================= */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 md:p-8 bg-[#0a0e14]/95 text-white backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-lg">
                <Crosshair className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-wider text-white">
                  PORIA JAM <span className="text-cyan-400">// TACTICAL OPS</span>
                </h1>
                <p className="text-xs text-gray-400 font-['Vazirmatn']">بازی تیراندازی پوریا جم - نسخه نظامی</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="p-2 bg-gray-900 border border-gray-700 hover:border-cyan-400 rounded-lg text-gray-300 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              </button>
              <button
                onClick={exportStandaloneHTML}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 rounded-lg text-xs font-semibold"
                title="Download single-file self-contained HTML game"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Standalone HTML</span>
              </button>
            </div>
          </div>

          {/* Central Lobby Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto max-w-5xl mx-auto w-full">
            {/* Left: Operator Team Selector */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-widest text-cyan-400 uppercase mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Operator Team
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  100% human tactical military units. Strictly no robots.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTeam('blue')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      team === 'blue'
                        ? 'border-blue-500 bg-blue-950/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'border-gray-800 bg-gray-900/40 text-gray-400'
                    }`}
                  >
                    <div className="font-bold text-sm text-blue-400">Blue Team</div>
                    <div className="text-[11px] text-gray-400">Counter-Terrorist</div>
                    <div className="text-[10px] text-gray-500 mt-1">FAST Helmet & Kevlar</div>
                  </button>

                  <button
                    onClick={() => setTeam('red')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      team === 'red'
                        ? 'border-red-500 bg-red-950/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'border-gray-800 bg-gray-900/40 text-gray-400'
                    }`}
                  >
                    <div className="font-bold text-sm text-red-400">Red Team</div>
                    <div className="text-[11px] text-gray-400">Insurgent Forces</div>
                    <div className="text-[10px] text-gray-500 mt-1">Shemagh & Ammo Harness</div>
                  </button>
                </div>
              </div>

              {/* Match overview */}
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Map:</span>
                  <span className="text-white font-semibold">{MAP_REGISTRY[selectedMapId].name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Weapon:</span>
                  <span className="text-cyan-400 font-semibold">{WEAPON_REGISTRY[selectedPrimaryId].name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Secondary:</span>
                  <span className="text-yellow-400 font-semibold">Desert Hawk .50</span>
                </div>
              </div>
            </div>

            {/* Center: Match Play Modes */}
            <div className="bg-gray-900/80 border border-cyan-500/30 rounded-xl p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(0,240,255,0.08)]">
              <div>
                <h2 className="text-sm font-bold tracking-widest text-cyan-400 uppercase mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4" /> Deployment Modes
                </h2>

                <div className="space-y-3">
                  <button
                    onClick={startMatch}
                    className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-base rounded-lg shadow-lg flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div className="text-left">
                      <div className="text-black font-extrabold">SOLO / BOT MATCH</div>
                      <div className="text-[11px] text-cyan-950 font-medium">Instant tactical engagement</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-black" />
                  </button>

                  <button
                    onClick={handleHostMatch}
                    className="w-full p-3.5 bg-gray-900 hover:bg-gray-800 border border-cyan-500/40 hover:border-cyan-400 text-white rounded-lg flex items-center justify-between transition-all"
                  >
                    <div className="text-left">
                      <div className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                        <Radio className="w-4 h-4" /> HOST HOTSPOT MATCH
                      </div>
                      <div className="text-[11px] text-gray-400">Generate room code for local Wi-Fi</div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded">PeerJS</span>
                  </button>

                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="w-full p-3.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-white rounded-lg flex items-center justify-between transition-all"
                  >
                    <div className="text-left">
                      <div className="text-gray-200 font-bold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" /> JOIN VIA ROOM CODE
                      </div>
                      <div className="text-[11px] text-gray-400">Connect to friend's mobile hotspot</div>
                    </div>
                    <span className="text-xs text-gray-500">PJ-XXXX</span>
                  </button>
                </div>
              </div>

              {netStatus && (
                <div className="mt-4 p-2 bg-black/50 border border-cyan-500/20 rounded text-[11px] text-cyan-300 font-mono text-center">
                  {netStatus}
                </div>
              )}
            </div>

            {/* Right: Armory, Maps & HUD Editor Quick Links */}
            <div className="space-y-3 flex flex-col justify-between">
              <button
                onClick={() => setScreen('maps')}
                className="flex-1 p-4 bg-gray-900/60 hover:bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-left flex items-center gap-4 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-800 flex items-center justify-center font-bold text-white text-lg">
                  MAP
                </div>
                <div>
                  <div className="font-bold text-white text-sm">MAP SELECTOR</div>
                  <div className="text-xs text-gray-400">3 Maps with Poria Jam Graffiti</div>
                </div>
              </button>

              <button
                onClick={() => setScreen('armory')}
                className="flex-1 p-4 bg-gray-900/60 hover:bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-left flex items-center gap-4 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-cyan-500/30 flex items-center justify-center">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">ARMORY / WEAPONS</div>
                  <div className="text-xs text-gray-400">3D Turntable, M4A1, AK-47, Sniper</div>
                </div>
              </button>

              <button
                onClick={() => setScreen('hud_editor')}
                className="flex-1 p-4 bg-gray-900/60 hover:bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl text-left flex items-center gap-4 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Sliders className="w-6 h-6 text-gray-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">CUSTOMIZE TOUCH HUD</div>
                  <div className="text-xs text-gray-400">Drag, resize & opacity editor</div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Controls & Info */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-800/80 pt-3">
            Desktop controls: WASD to Move · Mouse to Aim · Left-Click to Shoot · Right-Click to Scope · C Crouch · R Reload · Q Swap
          </div>

          {/* Join Match Modal */}
          {showJoinModal && (
            <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 border border-cyan-500/50 rounded-xl p-6 max-w-sm w-full space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-400" /> Enter Hotspot Room Code
                </h3>
                <p className="text-xs text-gray-400">
                  Ensure you are connected to the host's Wi-Fi or mobile hotspot.
                </p>
                <input
                  type="text"
                  placeholder="e.g. PJ-4821"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-center text-lg font-mono tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinMatch}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-bold"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 3: MAP SELECTION WITH VISUAL THUMBNAILS & UNIVERSAL GRAFFITI
          ========================================================================= */}
      {screen === 'maps' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 md:p-8 bg-[#0a0e14] text-white overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white">MAP SELECTION</h1>
              <p className="text-xs text-cyan-400">
                Notice: All maps feature prominent street-spray graffiti spelling &quot;پوریا جم&quot; (poria_jam)
              </p>
            </div>
            <button
              onClick={() => setScreen('menu')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
            >
              Back to Menu
            </button>
          </div>

          {/* Map Preview Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto py-6 max-w-6xl mx-auto w-full">
            {Object.values(MAP_REGISTRY).map((m) => {
              const isSelected = selectedMapId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMapId(m.id)}
                  className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.3)] scale-[1.02]'
                      : 'border-gray-800 hover:border-gray-600 bg-gray-900/60'
                  }`}
                >
                  {/* Visual Preview Graphic */}
                  <div
                    className="h-44 w-full relative flex items-center justify-center p-4 overflow-hidden"
                    style={{ background: m.previewThumbnail }}
                  >
                    {/* Visual Stylized Map Thumbnail Representation */}
                    <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center">
                      <span className="text-2xl md:text-3xl font-black tracking-wider text-white drop-shadow-md">
                        {m.name}
                      </span>
                      <span className="text-xs font-semibold text-gray-200 mt-1">{m.subtitle}</span>
                    </div>

                    {/* Prominent Graffiti Tag Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 border border-cyan-400/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
                      <span className="font-['Vazirmatn'] font-bold text-xs text-cyan-400">پوریا جم</span>
                      <span>GRAFFITI TAGGED</span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-cyan-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                        Active Map
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-gray-950/80">
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed mb-3">{m.description}</p>
                      <div className="p-2.5 bg-gray-900/90 border border-gray-800 rounded-lg text-[11px] text-gray-400">
                        <span className="text-cyan-400 font-bold block mb-0.5">Graffiti Location:</span>
                        <span>{m.graffitiLocation}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMapId(m.id);
                        startMatch();
                      }}
                      className={`mt-4 w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isSelected ? 'DEPLOY ON THIS MAP' : 'SELECT MAP'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-gray-500">
            Selected map will load with procedural 3D colliders, PBR sandstone/metal materials, and dynamic lighting.
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 4: WEAPON SELECTOR & DETAILED 3D ARMORY
          ========================================================================= */}
      {screen === 'armory' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 md:p-8 bg-[#080c12] text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white">TACTICAL ARMORY</h1>
              <p className="text-xs text-gray-400">Drag in viewport to rotate and inspect 3D procedural firearms</p>
            </div>
            <button
              onClick={() => setScreen('menu')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
            >
              Back to Menu
            </button>
          </div>

          {/* Central 3D Preview + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto max-w-6xl mx-auto w-full items-center">
            {/* Left: Weapon Selection List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Primary Firearms</h2>
              {['m4a1', 'ak47', 'sniper'].map((wId) => {
                const w = WEAPON_REGISTRY[wId];
                const isSel = selectedPrimaryId === wId;
                return (
                  <button
                    key={wId}
                    onClick={() => handleSelectArmoryWeapon(wId)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      isSel
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-white">{w.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{w.caliber}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{w.description}</p>
                  </button>
                );
              })}

              <h2 className="text-xs font-bold text-yellow-400 tracking-wider uppercase pt-2">Secondary Sidearm</h2>
              <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/40 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white">Desert Hawk .50</span>
                  <span className="text-[10px] text-yellow-400 font-mono">.50 Action Express</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">High-impact sidearm with rapid trigger reset.</p>
              </div>
            </div>

            {/* Center: Live 3D Weapon Turntable Canvas Mount */}
            <div className="relative h-72 md:h-96 bg-gradient-to-b from-gray-900/40 to-black/80 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center">
              <div ref={armoryMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
              <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] text-gray-400 pointer-events-none">
                Interactive 3D Turntable (Touch/Drag to Spin)
              </div>
            </div>

            {/* Right: Weapon Performance Stats */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">{WEAPON_REGISTRY[selectedPrimaryId].name}</h3>
                <span className="text-xs text-cyan-400 font-mono">{WEAPON_REGISTRY[selectedPrimaryId].caliber}</span>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {WEAPON_REGISTRY[selectedPrimaryId].description}
                </p>
              </div>

              {/* Stat Bars */}
              <div className="space-y-2.5 pt-2">
                {Object.entries(WEAPON_REGISTRY[selectedPrimaryId].stats).map(([stat, val]) => (
                  <div key={stat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="uppercase text-gray-400 text-[11px] font-semibold">{stat}</span>
                      <span className="text-cyan-400 font-mono">{val}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  startMatch();
                }}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> EQUIP & ENTER MATCH
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            AWM Sniper features authentic Call of Duty style high-zoom scope with hold-breath steadying.
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 5: INTERACTIVE HUD CUSTOMIZATION & SETTINGS
          ========================================================================= */}
      {screen === 'hud_editor' && (
        <div className="absolute inset-0 z-40 bg-[#070b10] text-white flex flex-col justify-between p-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h1 className="text-lg md:text-xl font-black text-white">HUD LAYOUT CUSTOMIZER</h1>
              <p className="text-xs text-gray-400">Drag buttons on screen to reposition, adjust scale & opacity</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHudLayout(resetHudLayout())}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={() => {
                  saveHudLayout(hudLayout);
                  setScreen('menu');
                }}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save & Exit
              </button>
            </div>
          </div>

          {/* Canvas Simulation Area with Draggable Buttons */}
          <div className="relative flex-1 my-3 bg-black/40 border border-dashed border-gray-800 rounded-xl overflow-hidden">
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-700 font-mono text-sm">
              [ HUD SCREEN PREVIEW - DRAG ANY BUTTON ]
            </div>

            {/* Draggable Virtual Joystick Indicator */}
            <div
              style={{
                left: `${hudLayout.joystick.x}%`,
                top: `${hudLayout.joystick.y}%`,
                width: `${hudLayout.joystick.size}px`,
                height: `${hudLayout.joystick.size}px`,
                opacity: hudLayout.joystick.opacity,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/60 bg-cyan-950/20 flex items-center justify-center cursor-move"
              onPointerDown={(e) => {
                const target = e.currentTarget;
                const onPointerMove = (ev: PointerEvent) => {
                  const xPct = Math.max(5, Math.min(95, (ev.clientX / window.innerWidth) * 100));
                  const yPct = Math.max(5, Math.min(95, (ev.clientY / window.innerHeight) * 100));
                  setHudLayout((p) => ({
                    ...p,
                    joystick: { ...p.joystick, x: Math.round(xPct), y: Math.round(yPct) },
                  }));
                };
                const onPointerUp = () => {
                  window.removeEventListener('pointermove', onPointerMove);
                  window.removeEventListener('pointerup', onPointerUp);
                };
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
              }}
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/80" />
            </div>

            {/* Draggable Action Buttons */}
            {Object.values(hudLayout.buttons).map((btn) => (
              <div
                key={btn.id}
                onClick={() => setSelectedHudBtn(btn.id)}
                style={{
                  left: `${btn.x}%`,
                  top: `${btn.y}%`,
                  width: `${btn.size}px`,
                  height: `${btn.size}px`,
                  opacity: btn.opacity,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center cursor-move border transition-shadow ${
                  selectedHudBtn === btn.id
                    ? 'border-yellow-400 bg-cyan-900/70 shadow-[0_0_20px_rgba(250,204,21,0.6)]'
                    : 'border-cyan-400/50 bg-gray-900/80 hover:border-cyan-300'
                }`}
                onPointerDown={(e) => {
                  setSelectedHudBtn(btn.id);
                  const onPointerMove = (ev: PointerEvent) => {
                    handleHudDrag(btn.id, ev.clientX, ev.clientY);
                  };
                  const onPointerUp = () => {
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);
                  };
                  window.addEventListener('pointermove', onPointerMove);
                  window.addEventListener('pointerup', onPointerUp);
                }}
              >
                <span className="text-[10px] font-black uppercase text-cyan-300 pointer-events-none">
                  {btn.name.split(' ')[0]}
                </span>
                <span className="text-[8px] text-gray-400 pointer-events-none">
                  {btn.size}px
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Settings Dock for Selected Button */}
          {hudLayout.buttons[selectedHudBtn] && (
            <div className="p-3 bg-gray-900/90 border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-cyan-400">
                  Editing: {hudLayout.buttons[selectedHudBtn].name}
                </span>
              </div>

              {/* Size Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Size:</span>
                <input
                  type="range"
                  min="44"
                  max="110"
                  value={hudLayout.buttons[selectedHudBtn].size}
                  onChange={(e) => {
                    const s = parseInt(e.target.value);
                    setHudLayout((p) => ({
                      ...p,
                      buttons: {
                        ...p.buttons,
                        [selectedHudBtn]: { ...p.buttons[selectedHudBtn], size: s },
                      },
                    }));
                  }}
                  className="w-28 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-300 w-8">
                  {hudLayout.buttons[selectedHudBtn].size}px
                </span>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Opacity:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={Math.round(hudLayout.buttons[selectedHudBtn].opacity * 100)}
                  onChange={(e) => {
                    const op = parseInt(e.target.value) / 100;
                    setHudLayout((p) => ({
                      ...p,
                      buttons: {
                        ...p.buttons,
                        [selectedHudBtn]: { ...p.buttons[selectedHudBtn], opacity: op },
                      },
                    }));
                  }}
                  className="w-28 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-300 w-8">
                  {Math.round(hudLayout.buttons[selectedHudBtn].opacity * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 6: ACTIVE 3D GAMEPLAY VIEWPORT & MOBILE TACTICAL HUD
          ========================================================================= */}
      {screen === 'playing' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Isolated Three.js WebGL Canvas Mount */}
          <div
            ref={canvasMountRef}
            className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
            onClick={() => {
              // Request pointer lock for desktop mouse aim
              if (document.body.requestPointerLock) {
                document.body.requestPointerLock();
              }
            }}
          />

          {/* Right-Side Camera Touch Look Surface (Captures touch drag for aim) */}
          <div
            className="absolute top-0 right-0 w-[65%] h-full z-10 touch-none"
            onTouchStart={handleLookTouchStart}
            onTouchMove={handleLookTouchMove}
            onTouchEnd={handleLookTouchEnd}
          />

          {/* Red Damage Vignette Flash */}
          {damageFlash && (
            <div className="absolute inset-0 pointer-events-none z-20 bg-red-600/30 animate-pulse border-8 border-red-600/60" />
          )}

          {/* =====================================================================
              AUTHENTIC CALL OF DUTY STYLE BOLT-ACTION SNIPER SCOPE OVERLAY
              ===================================================================== */}
          {isScoped && isSniperScope && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
              {/* Peripheral Depth-Of-Field Vignette & Black Lens Body */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at center, transparent 24%, rgba(0,0,0,0.85) 34%, rgba(0,0,0,0.98) 42%, black 43%)',
                }}
              />

              {/* Circular Scope Lens Border */}
              <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] rounded-full border-4 border-gray-800 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex items-center justify-center">
                {/* Horizontal Crosshair Hairline */}
                <div className="absolute left-0 right-0 h-[1.5px] bg-red-500/90 shadow-[0_0_4px_rgba(255,0,0,0.8)]" />
                {/* Vertical Crosshair Hairline */}
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-red-500/90 shadow-[0_0_4px_rgba(255,0,0,0.8)]" />

                {/* Mil-Dot Hash Marks */}
                {[-120, -80, -40, 40, 80, 120].map((offset) => (
                  <React.Fragment key={offset}>
                    <div
                      className="absolute w-2 h-[1px] bg-red-400"
                      style={{ top: `calc(50% + ${offset}px)`, left: 'calc(50% - 4px)' }}
                    />
                    <div
                      className="absolute h-2 w-[1px] bg-red-400"
                      style={{ left: `calc(50% + ${offset}px)`, top: 'calc(50% - 4px)' }}
                    />
                  </React.Fragment>
                ))}

                {/* Center Rangefinder Reticle */}
                <div className="w-2.5 h-2.5 rounded-full border border-red-400/90" />
              </div>

              {/* Hold Breath Stamina Meter */}
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/80 border border-gray-800 px-4 py-2 rounded-lg flex items-center gap-3">
                <Wind className={`w-4 h-4 ${isHoldingBreath ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      breathPercent > 25 ? 'bg-cyan-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${breathPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-300">
                  {isHoldingBreath ? 'HOLDING' : 'BREATH'}
                </span>
              </div>
            </div>
          )}

          {/* Standard Hipfire Reticle (When not sniper scoping) */}
          {(!isScoped || !isSniperScope) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                <div className="absolute -top-3 w-0.5 h-2 bg-cyan-300/80" />
                <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-300/80" />
                <div className="absolute -left-3 h-0.5 w-2 bg-cyan-300/80" />
                <div className="absolute -right-3 h-0.5 w-2 bg-cyan-300/80" />
              </div>
            </div>
          )}

          {/* Tactical Hitmarker */}
          {showHitmarker && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div
                className={`text-2xl font-black ${
                  isHeadshotHit ? 'text-red-500 scale-125' : 'text-white'
                } drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-ping`}
              >
                ✕
              </div>
            </div>
          )}

          {/* Top Status Header: Team Scores, Match Info & Menu Button */}
          <div className="absolute top-3 inset-x-4 pointer-events-none z-30 flex items-center justify-between">
            {/* Blue vs Red TDM Score Header */}
            <div className="flex items-center gap-2 bg-black/70 border border-gray-800 rounded-lg p-1.5 pointer-events-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/80 border border-blue-500/50 rounded">
                <span className="text-xs font-bold text-blue-400">BLUE</span>
                <span className="text-sm font-black text-white">{blueScore}</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">VS</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-500/50 rounded">
                <span className="text-xs font-bold text-red-400">RED</span>
                <span className="text-sm font-black text-white">{redScore}</span>
              </div>
            </div>

            {/* Kill Feed */}
            <div className="flex flex-col items-end gap-1 pointer-events-none">
              {killFeed.map((kf) => (
                <div
                  key={kf.id}
                  className="bg-black/80 border border-gray-800 px-2.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5 shadow"
                >
                  <span className="text-cyan-400 font-bold">{kf.killer}</span>
                  <span className="text-gray-500">[{kf.weapon}]</span>
                  {kf.headshot && <span className="text-red-400 text-[10px]">HEADSHOT</span>}
                  <span className="text-red-400 font-bold">{kf.victim}</span>
                </div>
              ))}
            </div>

            {/* Menu Return Button */}
            <button
              onClick={() => {
                if (document.exitPointerLock) document.exitPointerLock();
                setScreen('menu');
              }}
              className="p-2 bg-black/70 hover:bg-gray-800 border border-gray-700 rounded-lg pointer-events-auto text-gray-300"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Left: Health, Armor, Weapon Ammo Status */}
          <div className="absolute bottom-4 left-4 z-30 pointer-events-none flex flex-col gap-2">
            <div className="bg-black/80 border border-gray-800/90 rounded-xl p-3 flex items-center gap-4 shadow-xl">
              {/* Health */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/40">
                  <span className="text-xs font-black text-red-400">HP</span>
                </div>
                <div>
                  <div className="text-base font-black text-white">{health}</div>
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full ${health > 30 ? 'bg-red-500' : 'bg-red-600 animate-pulse'}`}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Armor */}
              <div className="flex items-center gap-2 border-l border-gray-800 pl-3">
                <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-500/40">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <div className="text-base font-black text-white">{armor}</div>
                  <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-blue-500" style={{ width: `${armor * 2}%` }} />
                  </div>
                </div>
              </div>

              {/* Ammo Status */}
              <div className="flex items-center gap-2 border-l border-gray-800 pl-3">
                <div className="text-right">
                  <div className="text-lg font-black text-yellow-400 font-mono leading-none">
                    {magAmmo} <span className="text-xs text-gray-500 font-normal">/ {reserveAmmo}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{activeWeapon.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              MOBILE TOUCH CONTROLS (VIRTUAL JOYSTICK + ACTION BUTTONS)
              ===================================================================== */}
          {/* Virtual Left Movement Joystick */}
          <div
            style={{
              left: `${hudLayout.joystick.x}%`,
              top: `${hudLayout.joystick.y}%`,
              width: `${hudLayout.joystick.size}px`,
              height: `${hudLayout.joystick.size}px`,
              opacity: hudLayout.joystick.opacity,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/50 bg-black/40 touch-none z-20 flex items-center justify-center active:border-cyan-300"
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
          >
            {/* Outer Sprint Ring Indicator */}
            <div className="absolute inset-1 rounded-full border border-dashed border-cyan-500/20" />
            {/* Inner Joystick Knob */}
            <div
              style={{
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.6)]"
            />
          </div>

          {/* On-Screen Mobile Action Touch Buttons */}
          {/* 1. Fire Button */}
          {hudLayout.buttons.fire && (
            <button
              style={{
                left: `${hudLayout.buttons.fire.x}%`,
                top: `${hudLayout.buttons.fire.y}%`,
                width: `${hudLayout.buttons.fire.size}px`,
                height: `${hudLayout.buttons.fire.size}px`,
                opacity: hudLayout.buttons.fire.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.isTriggerHeld = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.isTriggerHeld = false;
              }}
              onMouseDown={() => {
                if (engineRef.current) engineRef.current.isTriggerHeld = true;
              }}
              onMouseUp={() => {
                if (engineRef.current) engineRef.current.isTriggerHeld = false;
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-white font-black z-20 active:scale-95 transition-transform"
            >
              <Crosshair className="w-8 h-8 pointer-events-none" />
            </button>
          )}

          {/* 2. Scope / ADS Button */}
          {hudLayout.buttons.scope && (
            <button
              style={{
                left: `${hudLayout.buttons.scope.x}%`,
                top: `${hudLayout.buttons.scope.y}%`,
                width: `${hudLayout.buttons.scope.size}px`,
                height: `${hudLayout.buttons.scope.size}px`,
                opacity: hudLayout.buttons.scope.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.toggleADS();
              }}
              onClick={() => {
                if (engineRef.current) engineRef.current.toggleADS();
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center font-bold z-20 active:scale-95 transition-transform ${
                isScoped
                  ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                  : 'bg-black/75 text-cyan-400 border-cyan-400/60'
              }`}
            >
              <Target className="w-6 h-6 pointer-events-none" />
            </button>
          )}

          {/* 3. Jump Button */}
          {hudLayout.buttons.jump && (
            <button
              style={{
                left: `${hudLayout.buttons.jump.x}%`,
                top: `${hudLayout.buttons.jump.y}%`,
                width: `${hudLayout.buttons.jump.size}px`,
                height: `${hudLayout.buttons.jump.size}px`,
                opacity: hudLayout.buttons.jump.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.triggerJump();
              }}
              onClick={() => {
                if (engineRef.current) engineRef.current.triggerJump();
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 active:bg-cyan-950 border-2 border-cyan-400/60 text-cyan-400 flex items-center justify-center z-20 active:scale-95 transition-transform"
            >
              <ArrowUp className="w-6 h-6 pointer-events-none" />
            </button>
          )}

          {/* 4. Crouch Button */}
          {hudLayout.buttons.crouch && (
            <button
              style={{
                left: `${hudLayout.buttons.crouch.x}%`,
                top: `${hudLayout.buttons.crouch.y}%`,
                width: `${hudLayout.buttons.crouch.size}px`,
                height: `${hudLayout.buttons.crouch.size}px`,
                opacity: hudLayout.buttons.crouch.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.toggleCrouch();
              }}
              onClick={() => {
                if (engineRef.current) engineRef.current.toggleCrouch();
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 active:bg-cyan-950 border-2 border-cyan-400/60 text-cyan-400 flex items-center justify-center z-20 active:scale-95 transition-transform"
            >
              <ArrowDown className="w-6 h-6 pointer-events-none" />
            </button>
          )}

          {/* 5. Reload Button */}
          {hudLayout.buttons.reload && (
            <button
              style={{
                left: `${hudLayout.buttons.reload.x}%`,
                top: `${hudLayout.buttons.reload.y}%`,
                width: `${hudLayout.buttons.reload.size}px`,
                height: `${hudLayout.buttons.reload.size}px`,
                opacity: hudLayout.buttons.reload.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.reload();
              }}
              onClick={() => {
                if (engineRef.current) engineRef.current.reload();
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 active:bg-yellow-950 border-2 border-yellow-400/60 text-yellow-400 flex items-center justify-center z-20 active:scale-95 transition-transform"
            >
              <RotateCw className="w-5 h-5 pointer-events-none" />
            </button>
          )}

          {/* 6. Weapon Swap Button */}
          {hudLayout.buttons.swap && (
            <button
              style={{
                left: `${hudLayout.buttons.swap.x}%`,
                top: `${hudLayout.buttons.swap.y}%`,
                width: `${hudLayout.buttons.swap.size}px`,
                height: `${hudLayout.buttons.swap.size}px`,
                opacity: hudLayout.buttons.swap.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.switchWeapon();
              }}
              onClick={() => {
                if (engineRef.current) engineRef.current.switchWeapon();
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 active:bg-cyan-950 border-2 border-cyan-400/60 text-cyan-400 flex items-center justify-center z-20 active:scale-95 transition-transform"
            >
              <Repeat className="w-5 h-5 pointer-events-none" />
            </button>
          )}

          {/* 7. Hold Breath Button (Sniper Optic Steadying) */}
          {isScoped && isSniperScope && hudLayout.buttons.breath && (
            <button
              style={{
                left: `${hudLayout.buttons.breath.x}%`,
                top: `${hudLayout.buttons.breath.y}%`,
                width: `${hudLayout.buttons.breath.size}px`,
                height: `${hudLayout.buttons.breath.size}px`,
                opacity: hudLayout.buttons.breath.opacity,
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.setHoldingBreath(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                if (engineRef.current) engineRef.current.setHoldingBreath(false);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-950/90 active:bg-cyan-600 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center z-30 active:scale-95 transition-transform"
            >
              <Wind className="w-5 h-5 pointer-events-none" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
