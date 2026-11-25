// Keyboard and mouse: WASD/arrows to walk, E or Space to use a station, Q to
// cycle the drink at MINUMAN, P or Esc to pause, M to mute, click to walk
// there (clicking a station walks to it and uses it on arrival; clicking one
// of the five cups at MINUMAN pours that drink). Input is read every frame;
// actions are one-shot flags the loop drains with takeActions().
import { VIEW } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_INTERACT = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_CYCLE = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let clickTarget = null;
  let clickStation = null;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === ' ' || key === 'enter') actions |= ACTION_CONFIRM;
    if (key === 'e' || key === ' ') actions |= ACTION_INTERACT;
    if (key === 'q') actions |= ACTION_CYCLE;
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    if (key === 'm') actions |= ACTION_MUTE;
  }

  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function onPointerDown(event) {
    const point = canvasPoint(event);
    clickTarget = point;
    clickStation = null;
    actions |= ACTION_CONFIRM;
  }

  function onPointerMove(event) {
    if (event.buttons === 1) clickTarget = canvasPoint(event);
  }

  function onBlur() {
    keys.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);

  /** Held movement from the keys: a unit vector, or null when no key is held. */
  function keyDirection() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0) return null;
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  }

  /** Drain the one-shot action flags queued since the last call. */
  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  function takeClick() {
    const target = clickTarget;
    clickTarget = null;
    return target;
  }

  function clearClick() {
    clickTarget = null;
    clickStation = null;
  }

  return {
    keyDirection,
    takeActions,
    takeClick,
    clearClick,
    get clickStation() {
      return clickStation;
    },
    setClickStation(station) {
      clickStation = station;
    },
  };
}
