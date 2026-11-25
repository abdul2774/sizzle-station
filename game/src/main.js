// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over. Cooking events drive the synthesized sounds.
//
// ?seed=N fixes the order pattern. ?shot=cover|grill|serve|rush (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld,
  EVENT_BURNT,
  EVENT_CHOP,
  EVENT_COOK_DONE,
  EVENT_DENIED,
  EVENT_EXPIRE,
  EVENT_ORDER,
  EVENT_OVER,
  EVENT_PICKUP,
  EVENT_PLACE,
  EVENT_SERVE,
  EVENT_TRASH,
  EVENT_WRONG,
} from './world.js';
import { ACTION_CONFIRM, ACTION_CYCLE, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { DRINKS } from './config.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);
// Test hook: lets a play-test read the live world state (money, orders, hand).
window.__sizzle = { world };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, audio.muted);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let sizzleAcc = 0;

  function announce(message) {
    status.textContent = message;
  }

  function scoreOf() {
    return world.state.money * 10 + world.state.served * 50;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before their patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    const score = scoreOf();
    if (score > best) {
      best = score;
      saveBest(best);
    }
    announce(`Shift over. Money ${world.state.money} dollars, ${world.state.served} orders served. Score ${score}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_PICKUP) audio.play('pickup');
    if (events & EVENT_PLACE) audio.play('pop');
    if (events & EVENT_CHOP) audio.play('chop');
    if (events & EVENT_COOK_DONE) audio.play('ding');
    if (events & EVENT_BURNT) audio.play('burn');
    if (events & EVENT_SERVE) {
      audio.play('serve');
      audio.play('coin');
    }
    if (events & (EVENT_WRONG | EVENT_DENIED)) audio.play('buzz');
    if (events & EVENT_EXPIRE) audio.play('expire');
    if (events & EVENT_TRASH) audio.play('pop');
    if (events & EVENT_ORDER) audio.play('tick');
    if (events & EVENT_OVER) endGame();
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CYCLE) {
      world.cycleDrink();
      announce(`Drink: ${DRINKS[world.state.drinkSel].name}.`);
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function cookingLevel() {
    let cooking = 0;
    for (const key of Object.keys(world.state.cookers)) {
      for (const slot of world.state.cookers[key]) if (slot && !slot.burnt) cooking += 1;
    }
    if (world.state.brew) cooking += 1;
    return cooking / 9;
  }

  // One-shot inputs wait here until a fixed step consumes them: a click or
  // E-press that lands on a frame with no step to run must not vanish.
  let pendingClick = null;
  let pendingInteract = false;

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      if (actions & ACTION_INTERACT) pendingInteract = true;
      const click = screen === SCREEN_PLAY ? input.takeClick() : null;
      if (click) {
        // Carry the station (and the drink cup, if the click landed on one)
        // through the command: the approach point alone cannot identify them.
        const clickStation = world.stationAt(click.x, click.y);
        let clickDrink = null;
        if (clickStation && clickStation.kind === 'drinks') {
          const gap = (clickStation.width - 52) / DRINKS.length;
          const index = Math.max(0, Math.min(DRINKS.length - 1, Math.floor((click.x - clickStation.x - 52) / gap)));
          clickDrink = DRINKS[index].id;
        }
        pendingClick = {
          point: clickStation ? world.stationApproach(clickStation) : click,
          station: clickStation,
          drink: clickDrink,
        };
      }
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        let events = 0;
        if (screen === SCREEN_PLAY) {
          const dir = input.keyDirection();
          const cmd = {
            dir,
            interact: pendingInteract,
            click: pendingClick ? pendingClick.point : null,
            clickStation: pendingClick ? pendingClick.station : null,
            clickDrink: pendingClick ? pendingClick.drink : null,
          };
          pendingInteract = false;
          pendingClick = null;
          events = world.step(STEP, cmd);
        }
        handleEvents(events);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      input.takeClick();
      pendingClick = null;
      pendingInteract = false;
    }
    sizzleAcc += 1;
    if (sizzleAcc % 6 === 0) audio.setSizzle(screen === SCREEN_PLAY ? cookingLevel() : 0);
    renderer.draw(world.state, screen, best, audio.muted);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  // The title screen shows the cover scene behind the logo: the real kitchen,
  // mid-rush, before a single key is pressed.
  world.stageShot('cover');
  announce('Nasi Uduk Ekspress. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
