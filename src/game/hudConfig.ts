/**
 * HUD Customizer Configuration & Persistence
 * Allows players to reposition, resize, and adjust opacity of every mobile touch control.
 */

export interface HudButtonConfig {
  id: string;
  name: string;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  size: number; // in pixels (e.g. 50 to 110)
  opacity: number; // 0.2 to 1.0
  icon: string;
}

export interface HudLayout {
  joystick: {
    x: number;
    y: number;
    size: number;
    opacity: number;
  };
  buttons: Record<string, HudButtonConfig>;
}

export const DEFAULT_HUD_LAYOUT: HudLayout = {
  joystick: {
    x: 14,
    y: 72,
    size: 130,
    opacity: 0.85,
  },
  buttons: {
    fire: {
      id: 'fire',
      name: 'Fire / Trigger',
      x: 84,
      y: 68,
      size: 84,
      opacity: 0.9,
      icon: 'crosshair',
    },
    scope: {
      id: 'scope',
      name: 'Scope / ADS',
      x: 74,
      y: 48,
      size: 64,
      opacity: 0.85,
      icon: 'target',
    },
    jump: {
      id: 'jump',
      name: 'Jump / Leap',
      x: 92,
      y: 44,
      size: 60,
      opacity: 0.8,
      icon: 'arrow-up',
    },
    crouch: {
      id: 'crouch',
      name: 'Crouch / Duck',
      x: 91,
      y: 86,
      size: 58,
      opacity: 0.8,
      icon: 'arrow-down',
    },
    reload: {
      id: 'reload',
      name: 'Reload Magazine',
      x: 64,
      y: 68,
      size: 58,
      opacity: 0.8,
      icon: 'rotate-cw',
    },
    swap: {
      id: 'swap',
      name: 'Weapon Swap',
      x: 74,
      y: 86,
      size: 56,
      opacity: 0.8,
      icon: 'repeat',
    },
    breath: {
      id: 'breath',
      name: 'Hold Breath (Sniper)',
      x: 82,
      y: 32,
      size: 54,
      opacity: 0.8,
      icon: 'wind',
    },
  },
};

const STORAGE_KEY = 'poria_jam_hud_layout_v1';

export function loadHudLayout(): HudLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all buttons exist in case defaults were updated
      return {
        joystick: { ...DEFAULT_HUD_LAYOUT.joystick, ...(parsed.joystick || {}) },
        buttons: { ...DEFAULT_HUD_LAYOUT.buttons, ...(parsed.buttons || {}) },
      };
    }
  } catch (e) {
    console.warn('Failed to load saved HUD config, using default', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_HUD_LAYOUT));
}

export function saveHudLayout(layout: HudLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Failed to save HUD config', e);
  }
}

export function resetHudLayout(): HudLayout {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
  return JSON.parse(JSON.stringify(DEFAULT_HUD_LAYOUT));
}
