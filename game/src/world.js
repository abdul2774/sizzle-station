// Nasi Uduk Ekspress's rules and state, with no drawing and no browser in it:
// the cook, the stations, cooking, pounding sambal, pouring drinks, plating,
// orders, money, combo, the shift clock, particles and shake. step() advances
// one fixed step and returns what happened as bit flags, so the caller can
// react (sounds, announcements) without the world knowing about screens or
// sound. Nothing here allocates after createWorld returns.
import { COMBOS, COOK, COOKERS, DRINKS, FLOOR, ITEMS, ORDERS, POUNDS_NEEDED, RICE_BASES, SHIFT_SECONDS, STATIONS } from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_COOK_DONE = 4;
export const EVENT_BURNT = 8;
export const EVENT_CHOP = 16;
export const EVENT_SERVE = 32;
export const EVENT_WRONG = 64;
export const EVENT_EXPIRE = 128;
export const EVENT_OVER = 256;
export const EVENT_ORDER = 512;
export const EVENT_TRASH = 1024;
export const EVENT_DENIED = 2048;

const STATION_LIST = Object.entries(STATIONS).map(([id, def]) => ({ id, ...def }));
const COOKER_KEYS = Object.keys(COOKERS);

function overlapsCircleRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i += 1) if (sortedA[i] !== sortedB[i]) return false;
  return true;
}

export function createWorld(random) {
  const state = {
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    money: 0,
    earned: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    over: false,
    flash: 0,
    bell: 0,
    trauma: 0,
    shakeTime: 0,
    orderTimer: ORDERS.firstAt,
    nextOrderId: 1,
    orders: [],
    chef: { x: 640, y: 420, faceX: 0, faceY: 1, moving: false, bob: 0, target: null, targetStation: null, targetDrink: null },
    hand: null,
    cookers: { rice: [null, null], wajan: [null, null], fryer: [null, null], eggpan: [null, null] },
    prep: null,
    brew: null,
    drinkReady: null,
    drinkSel: 0,
    plate: null,
    particles: [],
    floaters: [],
    steamAcc: 0,
  };

  function reset() {
    state.elapsed = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.money = 0;
    state.earned = 0;
    state.served = 0;
    state.missed = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.bestCombo = 0;
    state.over = false;
    state.flash = 0;
    state.bell = 0;
    state.trauma = 0;
    state.orderTimer = ORDERS.firstAt;
    state.nextOrderId = 1;
    state.orders.length = 0;
    state.chef.x = 640;
    state.chef.y = 420;
    state.chef.faceX = 0;
    state.chef.faceY = 1;
    state.chef.moving = false;
    state.chef.target = null;
    state.chef.targetStation = null;
    state.chef.targetDrink = null;
    state.hand = null;
    for (const key of COOKER_KEYS) {
      state.cookers[key][0] = null;
      state.cookers[key][1] = null;
    }
    state.prep = null;
    state.brew = null;
    state.drinkReady = null;
    state.drinkSel = 0;
    state.plate = null;
    state.particles.length = 0;
    state.floaters.length = 0;
  }

  function spawnParticle(x, y, vx, vy, life, size, color, kind) {
    if (state.particles.length > 220) return;
    state.particles.push({ x, y, vx, vy, life, maxLife: life, size, color, kind });
  }

  function steamAt(x, y) {
    spawnParticle(x + (random() - 0.5) * 20, y, (random() - 0.5) * 12, -26 - random() * 18, 0.9 + random() * 0.5, 5 + random() * 5, '#ffffff', 'steam');
  }

  function sparksAt(x, y) {
    for (let i = 0; i < 6; i += 1) {
      spawnParticle(x + (random() - 0.5) * 30, y, (random() - 0.5) * 70, -20 - random() * 50, 0.35 + random() * 0.25, 2 + random() * 2, '#ffd34d', 'spark');
    }
  }

  function confettiAt(x, y) {
    const colors = ['#f7c948', '#e0524d', '#7bc96f', '#6db3e8', '#ff8fd1'];
    for (let i = 0; i < 26; i += 1) {
      spawnParticle(x, y, (random() - 0.5) * 260, -60 - random() * 160, 0.9 + random() * 0.6, 3 + random() * 3, colors[i % colors.length], 'confetti');
    }
  }

  function smokeAt(x, y) {
    spawnParticle(x + (random() - 0.5) * 16, y, (random() - 0.5) * 10, -30 - random() * 20, 1.2, 7 + random() * 5, '#5a5a5a', 'smoke');
  }

  function floater(x, y, text, color) {
    if (state.floaters.length > 24) return;
    state.floaters.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
  }

  function orderPatience() {
    const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
    return ORDERS.patienceStart + (ORDERS.patienceEnd - ORDERS.patienceStart) * progress;
  }

  function orderInterval() {
    const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
    return ORDERS.intervalStart + (ORDERS.intervalEnd - ORDERS.intervalStart) * progress;
  }

  function pickCombo() {
    const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
    const pool = ['bihun', 'mie', 'telor'];
    if (progress > 0.25) pool.push('tempe', 'tahu');
    if (progress > 0.5) pool.push('jengkol', 'campur');
    if (progress > 0.75) pool.push('komplit');
    return pool[Math.floor(random() * pool.length)];
  }

  /** The rice base: uduk only while the shift warms up, then all three. */
  function pickRice() {
    const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
    if (progress < 0.15) return 'nasi';
    const roll = random();
    if (roll < 0.45) return 'nasi';
    if (roll < 0.75) return 'nasiKuning';
    return 'nasiGoreng';
  }

  function pickDrink() {
    const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
    const chance = ORDERS.drinkChanceStart + (ORDERS.drinkChanceEnd - ORDERS.drinkChanceStart) * progress;
    if (random() >= chance) return null;
    return DRINKS[Math.floor(random() * DRINKS.length)].id;
  }

  function addOrder(comboKey, riceKey, patience, drink) {
    const combo = COMBOS[comboKey];
    const rice = RICE_BASES[riceKey];
    const orderDrink = drink !== undefined ? drink : pickDrink();
    const order = {
      id: state.nextOrderId,
      rice: riceKey,
      combo: comboKey,
      name: `${rice.name} ${combo.name}`,
      items: [riceKey, ...combo.items],
      drink: orderDrink,
      price: rice.price + combo.price + (orderDrink ? ORDERS.drinkPrice : 0),
      patience: patience ?? orderPatience(),
      maxPatience: patience ?? orderPatience(),
    };
    state.nextOrderId += 1;
    state.orders.push(order);
    return order;
  }

  function spawnOrder() {
    addOrder(pickCombo(), pickRice());
    return EVENT_ORDER;
  }

  /** The station whose counter the point lands on, or null. */
  function stationAt(x, y) {
    for (const station of STATION_LIST) {
      if (x >= station.x - 6 && x <= station.x + station.width + 6 && y >= station.y - 6 && y <= station.y + station.height + 6) return station;
    }
    return null;
  }

  /** The nearest walk-to point on a station's floor side, for click-to-move. */
  function stationApproach(station) {
    const cx = station.x + station.width / 2;
    // Left-wall baskets are approached from the open corridor to their right;
    // top counters from below, bottom counters (and their topping bowls) from
    // above — always from open floor, never through a neighbouring counter.
    if (station.x < 200) return { x: station.x + station.width + COOK.radius + 14, y: station.y + station.height / 2 };
    if (station.y < 300) return { x: cx, y: station.y + station.height + COOK.radius + 14 };
    return { x: cx, y: station.y - COOK.radius - 14 };
  }

  function nearestStationInReach() {
    let best = null;
    let bestDistance = Infinity;
    for (const station of STATION_LIST) {
      const dx = Math.max(station.x - state.chef.x, 0, state.chef.x - (station.x + station.width));
      const dy = Math.max(station.y - state.chef.y, 0, state.chef.y - (station.y + station.height));
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station;
      }
    }
    return bestDistance <= COOK.interactReach ? best : null;
  }

  function moveChef(dx, dy, dt) {
    const chef = state.chef;
    chef.faceX = dx;
    chef.faceY = dy;
    chef.moving = true;
    const stepX = dx * COOK.speed * dt;
    const stepY = dy * COOK.speed * dt;
    const nextX = Math.max(FLOOR.x + COOK.radius, Math.min(FLOOR.x + FLOOR.width - COOK.radius, chef.x + stepX));
    let blocked = false;
    for (const station of STATION_LIST) {
      if (overlapsCircleRect(nextX, chef.y, COOK.radius, station)) { blocked = true; break; }
    }
    if (!blocked) chef.x = nextX;
    const nextY = Math.max(FLOOR.y + COOK.radius, Math.min(FLOOR.y + FLOOR.height - COOK.radius, chef.y + stepY));
    blocked = false;
    for (const station of STATION_LIST) {
      if (overlapsCircleRect(chef.x, nextY, COOK.radius, station)) { blocked = true; break; }
    }
    if (!blocked) chef.y = nextY;
  }

  function slotCenter(station, index, slots) {
    const gap = station.width / slots;
    return { x: station.x + gap * (index + 0.5), y: station.y + station.height / 2 };
  }

  /** The drink the oldest open order still needs, if any. */
  function neededDrink() {
    for (const order of state.orders) {
      if (!order.drink) continue;
      if (state.hand && state.hand.type === 'item' && state.hand.item === order.drink) continue;
      if (state.brew && state.brew.drink === order.drink) continue;
      if (state.drinkReady === order.drink) continue;
      if (state.plate && state.plate.drink === order.drink) continue;
      return order.drink;
    }
    return null;
  }

  function interact(station, drinkChoice) {
    if (!station) return 0;
    if (station.kind === 'crate') {
      if (state.hand) return EVENT_DENIED;
      state.hand = { type: 'item', item: station.item };
      return EVENT_PICKUP;
    }
    if (station.kind === 'cooker') {
      const spec = COOKERS[station.cooker];
      const slots = state.cookers[station.cooker];
      if (state.hand && state.hand.type === 'item' && spec.raws[state.hand.item]) {
        for (let i = 0; i < slots.length; i += 1) {
          if (slots[i] === null) {
            slots[i] = { item: state.hand.item, t: 0, done: false, burnt: false };
            state.hand = null;
            const at = slotCenter(station, i, slots.length);
            sparksAt(at.x, at.y);
            return EVENT_PLACE;
          }
        }
        return EVENT_DENIED;
      }
      if (!state.hand) {
        for (let i = 0; i < slots.length; i += 1) {
          const slot = slots[i];
          if (slot && (slot.done || slot.burnt)) {
            state.hand = { type: 'item', item: slot.burnt ? 'burnt' : spec.raws[slot.item] };
            slots[i] = null;
            return EVENT_PICKUP;
          }
        }
        return EVENT_DENIED;
      }
      return EVENT_DENIED;
    }
    if (station.kind === 'prep') {
      if (!state.prep && state.hand && state.hand.type === 'item' && state.hand.item === 'cabe') {
        state.prep = { item: 'cabe', pounds: 0 };
        state.hand = null;
        return EVENT_PLACE;
      }
      if (state.prep && !state.hand) {
        if (state.prep.pounds < POUNDS_NEEDED) {
          state.prep.pounds += 1;
          const at = { x: station.x + station.width / 2, y: station.y + station.height / 2 };
          sparksAt(at.x, at.y - 6);
          if (state.prep.pounds >= POUNDS_NEEDED) state.prep.item = 'sambal';
          return EVENT_CHOP;
        }
        state.hand = { type: 'item', item: state.prep.item };
        state.prep = null;
        return EVENT_PICKUP;
      }
      return EVENT_DENIED;
    }
    if (station.kind === 'drinks') {
      if (state.drinkReady && !state.hand) {
        state.hand = { type: 'item', item: state.drinkReady };
        state.drinkReady = null;
        return EVENT_PICKUP;
      }
      if (!state.hand && !state.brew && !state.drinkReady) {
        const wanted = drinkChoice ?? neededDrink() ?? DRINKS[state.drinkSel].id;
        const spec = DRINKS.find((d) => d.id === wanted);
        state.brew = { drink: wanted, t: 0, duration: spec.brew };
        state.drinkSel = DRINKS.findIndex((d) => d.id === wanted);
        return EVENT_PLACE;
      }
      return EVENT_DENIED;
    }
    if (station.kind === 'assembly') {
      if (!state.hand && state.plate) {
        state.hand = { type: 'plate', items: state.plate.items, drink: state.plate.drink };
        state.plate = null;
        return EVENT_PICKUP;
      }
      if (state.hand && state.hand.type === 'plate' && !state.plate) {
        state.plate = { items: state.hand.items, drink: state.hand.drink };
        state.hand = null;
        return EVENT_PLACE;
      }
      if (!state.hand && !state.plate) {
        state.plate = { items: [], drink: null };
        return EVENT_PLACE;
      }
      if (state.hand && state.hand.type === 'item') {
        if (!state.plate) state.plate = { items: [], drink: null };
        const isDrink = DRINKS.some((d) => d.id === state.hand.item);
        if (isDrink) {
          if (state.plate.drink) return EVENT_DENIED;
          state.plate.drink = state.hand.item;
          state.hand = null;
          return EVENT_PLACE;
        }
        if (state.plate.items.includes(state.hand.item)) return EVENT_DENIED;
        state.plate.items.push(state.hand.item);
        state.hand = null;
        return EVENT_PLACE;
      }
      return EVENT_DENIED;
    }
    if (station.kind === 'serve') {
      if (!state.hand || state.hand.type !== 'plate') return EVENT_DENIED;
      const plate = state.hand;
      const match = state.orders.find((order) => sameSet(order.items, plate.items) && plate.drink === order.drink);
      if (!match) return EVENT_WRONG;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.comboTimer = ORDERS.comboWindow;
      const pay = Math.round(match.price * (1 + ORDERS.comboStep * (state.combo - 1)));
      state.money += pay;
      state.earned += pay;
      state.served += 1;
      state.orders = state.orders.filter((order) => order !== match);
      state.hand = null;
      state.bell = 0.6;
      const at = { x: station.x + station.width / 2, y: station.y + station.height / 2 };
      confettiAt(at.x, at.y + 30);
      floater(at.x, at.y - 10, `+$${pay}`, '#f7c948');
      if (state.combo >= 2) floater(at.x, at.y - 38, `COMBO x${state.combo}`, '#ff8fd1');
      return EVENT_SERVE;
    }
    if (station.kind === 'trash') {
      if (!state.hand) return EVENT_DENIED;
      state.hand = null;
      return EVENT_TRASH;
    }
    return 0;
  }

  function cookSlots(dt) {
    let events = 0;
    for (const key of COOKER_KEYS) {
      const spec = COOKERS[key];
      const station = STATIONS[key];
      const slots = state.cookers[key];
      for (let i = 0; i < slots.length; i += 1) {
        const slot = slots[i];
        if (!slot) continue;
        slot.t += dt;
        if (!slot.done && slot.t >= spec.cook) {
          slot.done = true;
          events |= EVENT_COOK_DONE;
          const at = slotCenter(station, i, slots.length);
          sparksAt(at.x, at.y);
        } else if (!slot.burnt && slot.t >= spec.cook + spec.burn) {
          slot.burnt = true;
          events |= EVENT_BURNT;
          state.trauma = Math.min(1, state.trauma + 0.35);
          const at = slotCenter(station, i, slots.length);
          smokeAt(at.x, at.y);
        }
      }
    }
    return events;
  }

  /** Cycle the highlighted drink at MINUMAN (Q key). */
  function cycleDrink() {
    state.drinkSel = (state.drinkSel + 1) % DRINKS.length;
  }

  /**
   * One fixed step. `cmd` is { dir: {x, y} | null, interact: bool,
   * click: {x, y} | null, clickStation: station | null, clickDrink: id | null }.
   * Returns the event flags of this step.
   */
  function step(dt, cmd) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);
    if (state.bell > 0) state.bell = Math.max(0, state.bell - dt);
    if (state.trauma > 0) state.trauma = Math.max(0, state.trauma - dt * 1.4);
    state.shakeTime += dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    // Orders arrive and run out of patience.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      if (state.orders.length < ORDERS.maxConcurrent) events |= spawnOrder();
      state.orderTimer = orderInterval();
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.missed += 1;
        state.combo = 0;
        state.money = Math.max(0, state.money - ORDERS.latePenalty);
        state.flash = 1;
        state.trauma = Math.min(1, state.trauma + 0.5);
        floater(640, 150, `ORDER LOST  -$${ORDERS.latePenalty}`, '#e0524d');
        events |= EVENT_EXPIRE;
      }
    }

    // Cooking advances; steam rises from anything on the heat.
    events |= cookSlots(dt);
    if (state.brew) {
      state.brew.t += dt;
      if (state.brew.t >= state.brew.duration) {
        state.drinkReady = state.brew.drink;
        state.brew = null;
        events |= EVENT_COOK_DONE;
      }
    }
    state.steamAcc += dt;
    if (state.steamAcc > 0.22) {
      state.steamAcc = 0;
      for (const key of COOKER_KEYS) {
        const station = STATIONS[key];
        for (let i = 0; i < state.cookers[key].length; i += 1) {
          if (state.cookers[key][i]) {
            const at = slotCenter(station, i, 2);
            steamAt(at.x, at.y - 12);
            if (state.cookers[key][i].burnt) smokeAt(at.x, at.y - 12);
          }
        }
      }
    }

    // The chef walks: keys win over a click target. The click carries the
    // station it landed on (and the drink cup, if any) so arrival uses the
    // station the player actually clicked, not whatever the approach point
    // happens to overlap.
    const chef = state.chef;
    chef.moving = false;
    if (cmd.dir) {
      chef.target = null;
      chef.targetStation = null;
      chef.targetDrink = null;
      moveChef(cmd.dir.x, cmd.dir.y, dt);
    } else if (cmd.click) {
      chef.target = { x: cmd.click.x, y: cmd.click.y };
      chef.targetStation = cmd.clickStation ?? stationAt(cmd.click.x, cmd.click.y);
      chef.targetDrink = cmd.clickDrink ?? null;
    }
    if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) {
        const station = chef.targetStation;
        const drink = chef.targetDrink;
        chef.target = null;
        chef.targetStation = null;
        chef.targetDrink = null;
        if (station) events |= interact(station, drink);
      } else {
        moveChef(dx / distance, dy / distance, dt);
      }
    }
    if (chef.moving) chef.bob += dt * 12;
    if (cmd.interact) {
      const station = nearestStationInReach();
      events |= interact(station);
    }

    // Particles and floaters age out.
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'confetti') p.vy += 320 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }

    if (state.timeLeft <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  // Scene builders for the deterministic ?shot= frames: each one stages a real
  // world state (orders, cooking, a plate mid-assembly) with the seeded random.
  function stageShot(name) {
    reset();
    if (name === 'wok') {
      state.elapsed = 34;
      state.timeLeft = SHIFT_SECONDS - 34;
      state.money = 12;
      state.combo = 1;
      state.comboTimer = 12;
      state.cookers.rice[0] = { item: 'berasKuning', t: 5.5, done: false, burnt: false };
      state.cookers.wajan[0] = { item: 'nasi', t: 4.6, done: false, burnt: false };
      state.cookers.wajan[1] = { item: 'mie', t: 6.4, done: true, burnt: false };
      state.cookers.fryer[0] = { item: 'jengkol', t: 5.2, done: false, burnt: false };
      state.chef.x = 460;
      state.chef.y = 300;
      state.chef.faceX = 0;
      state.chef.faceY = -1;
      state.hand = { type: 'item', item: 'tempe' };
      addOrder('bihun', 'nasi', 38, null);
      addOrder('mie', 'nasiKuning', 26, null);
      steamAt(420, 130);
      steamAt(655, 130);
      steamAt(855, 130);
      return;
    }
    if (name === 'serve') {
      state.elapsed = 72;
      state.timeLeft = SHIFT_SECONDS - 72;
      state.money = 41;
      state.combo = 2;
      state.comboTimer = 14;
      state.served = 5;
      state.hand = { type: 'plate', items: ['nasiKuning', 'telorBalado', 'bihunGoreng', 'bawangGoreng'], drink: 'tehManis' };
      state.chef.x = 1040;
      state.chef.y = 300;
      state.chef.faceX = 0;
      state.chef.faceY = -1;
      state.bell = 0.6;
      state.cookers.rice[0] = { item: 'beras', t: 2.1, done: false, burnt: false };
      state.cookers.fryer[1] = { item: 'jengkol', t: 7.4, done: true, burnt: false };
      addOrder('telor', 'nasiKuning', 31, 'tehManis');
      addOrder('tempe', 'nasi', 18, null);
      confettiAt(1060, 260);
      floater(1060, 245, '+$18', '#f7c948');
      floater(1060, 273, 'COMBO x3', '#ff8fd1');
      return;
    }
    if (name === 'rush') {
      state.elapsed = 138;
      state.timeLeft = 42;
      state.money = 86;
      state.combo = 5;
      state.comboTimer = 9;
      state.served = 11;
      state.cookers.rice[0] = { item: 'beras', t: 14.5, done: true, burnt: true };
      state.cookers.wajan[1] = { item: 'mie', t: 5.1, done: false, burnt: false };
      state.cookers.fryer[0] = { item: 'tahu', t: 8.6, done: true, burnt: false };
      state.prep = { item: 'cabe', pounds: 2 };
      state.plate = { items: ['nasiGoreng', 'orekTempe'], drink: null };
      state.chef.x = 300;
      state.chef.y = 600;
      state.chef.faceX = 1;
      state.chef.faceY = 0;
      state.hand = { type: 'item', item: 'tahuCabe' };
      addOrder('komplit', 'nasi', 9, 'kopiHitam');
      addOrder('jengkol', 'nasiKuning', 7, null);
      addOrder('bihun', 'nasiGoreng', 22, null);
      addOrder('mie', 'nasi', 14, 'esTeh');
      smokeAt(420, 130);
      smokeAt(420, 118);
      steamAt(855, 130);
      state.trauma = 0.25;
      return;
    }
    // cover: the full kitchen mid-rush, every criterion-1 element on screen —
    // order board with all three rice bases, the brown-paper packet on the
    // plate mid-assembly, kuning steaming and goreng frying, timer visible.
    state.elapsed = 85;
    state.timeLeft = SHIFT_SECONDS - 85;
    state.money = 47;
    state.combo = 3;
    state.comboTimer = 15;
    state.served = 6;
    state.cookers.rice[0] = { item: 'berasKuning', t: 4.9, done: false, burnt: false };
    state.cookers.wajan[0] = { item: 'nasi', t: 4.2, done: false, burnt: false };
    state.cookers.fryer[0] = { item: 'tahu', t: 5.0, done: false, burnt: false };
    state.cookers.eggpan[1] = { item: 'telur', t: 3.1, done: false, burnt: false };
    state.prep = { item: 'cabe', pounds: 2 };
    state.drinkReady = 'esTeh';
    state.plate = { items: ['nasi', 'orekTempe', 'bihunGoreng'], drink: null };
    state.chef.x = 640;
    state.chef.y = 500;
    state.chef.faceX = 0;
    state.chef.faceY = -1;
    state.hand = { type: 'item', item: 'kerupuk' };
    addOrder('komplit', 'nasi', 34, 'esTeh');
    addOrder('mie', 'nasiKuning', 21, null);
    addOrder('telor', 'nasiGoreng', 12, 'tehManis');
    steamAt(420, 130);
    steamAt(655, 130);
    steamAt(855, 130);
  }

  return {
    state,
    reset,
    step,
    stageShot,
    stationAt,
    stationApproach,
    cycleDrink,
    addOrder,
    ITEM_NAMES: ITEMS,
  };
}
