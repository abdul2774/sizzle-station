// Every pixel of Nasi Uduk Ekspress, drawn in code: the warung, the stations,
// the cook in a peci, the order board, the HUD and the title/pause/game-over
// screens. The renderer never touches the rules; it only paints the world's
// state, with a trauma-based shake offset (shake is visual only) on the play
// field. The signature visual is the nasi uduk wrapped in brown paper —
// every plate, hand and ticket shows that packet.
import { COOK, COLORS, COOKERS, DRINKS, FLOOR, ITEMS, ORDERS, POUNDS_NEEDED, SHIFT_SECONDS, STATIONS, VIEW } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 700} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** The brown-paper packet: the signature of every nasi uduk plate. */
function drawPacket(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ITEMS.nasi.color;
  roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.3);
  ctx.fill();
  ctx.strokeStyle = ITEMS.nasi.dark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // The folded flap and the tie string across the packet.
  ctx.fillStyle = '#c98f56';
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.7);
  ctx.lineTo(0, 0);
  ctx.lineTo(r, -r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.restore();
}

/** One ingredient or drink icon, drawn at (x, y) with the given radius. */
function drawItemIcon(ctx, item, x, y, r) {
  const info = ITEMS[item] ?? ITEMS.burnt;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'nasi') {
    drawPacket(ctx, 0, 0, r * 0.95);
  } else if (item === 'nasiKuning') {
    // Golden turmeric mound, served open on the plate — no brown paper.
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = info.dark;
    for (const [dx, dy] of [[-r * 0.45, r * 0.1], [r * 0.4, r * 0.05], [0, r * 0.2]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'nasiGoreng') {
    // Browned fried-rice mound, flecked with egg and veg.
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7e3a1';
    for (const [dx, dy] of [[-r * 0.4, -r * 0.1], [r * 0.35, -r * 0.25], [0, r * 0.05]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5faf52';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0524d';
    ctx.beginPath();
    ctx.arc(r * 0.5, r * 0.1, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'beras' || item === 'berasKuning') {
    ctx.fillStyle = '#b98a56';
    ctx.beginPath();
    ctx.arc(0, 2, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.color;
    for (const [dx, dy] of [[-r * 0.5, -r * 0.3], [0, -r * 0.55], [r * 0.5, -r * 0.3], [-r * 0.2, -r * 0.1], [r * 0.25, -r * 0.05]]) {
      ctx.beginPath();
      ctx.ellipse(dx, dy, r * 0.22, r * 0.14, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'bihun' || item === 'bihunGoreng' || item === 'mie' || item === 'mieKeriting') {
    ctx.strokeStyle = info.color;
    ctx.lineWidth = r * 0.28;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.85 - i * 0.26), 0.3 + i, Math.PI * 1.7 + i);
      ctx.stroke();
    }
    if (item === 'bihunGoreng' || item === 'mieKeriting') {
      ctx.strokeStyle = info.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.4);
      ctx.quadraticCurveTo(0, -r * 0.9, r * 0.6, -r * 0.3);
      ctx.stroke();
    }
  } else if (item === 'telur') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'telorBalado') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d1f16';
    for (const [dx, dy] of [[-r * 0.3, -r * 0.2], [r * 0.25, r * 0.1], [0, -r * 0.5]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'tempe') {
    ctx.fillStyle = info.color;
    roundRect(ctx, -r * 0.9, -r * 0.55, r * 1.8, r * 1.1, r * 0.25);
    ctx.fill();
    ctx.fillStyle = info.dark;
    for (const [dx, dy] of [[-r * 0.4, -r * 0.2], [r * 0.3, 0], [0, r * 0.25]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'orekTempe') {
    ctx.fillStyle = info.color;
    for (const [dx, dy] of [[-r * 0.45, -r * 0.25], [r * 0.45, -r * 0.25], [0, r * 0.35]]) {
      roundRect(ctx, dx - r * 0.4, dy - r * 0.35, r * 0.8, r * 0.7, r * 0.15);
      ctx.fill();
    }
    ctx.fillStyle = '#e0524d';
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.4, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'tahu') {
    ctx.fillStyle = info.color;
    roundRect(ctx, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2);
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (item === 'tahuCabe') {
    ctx.fillStyle = info.color;
    roundRect(ctx, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#7d1f16';
    for (const [dx, dy] of [[-r * 0.3, -r * 0.3], [r * 0.3, r * 0.2]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'jengkol' || item === 'jengkolGoreng') {
    ctx.fillStyle = info.color;
    for (const [dx, dy] of [[-r * 0.5, 0], [r * 0.4, -r * 0.3], [r * 0.3, r * 0.4]]) {
      ctx.beginPath();
      ctx.ellipse(dx, dy, r * 0.45, r * 0.32, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (item === 'jengkolGoreng') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-r * 0.6, -r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'cabe') {
    ctx.strokeStyle = info.color;
    ctx.lineWidth = r * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.5);
    ctx.quadraticCurveTo(0, r * 0.5, r * 0.7, -r * 0.2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.leaf;
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.5);
    ctx.lineTo(-r * 0.9, -r * 0.85);
    ctx.stroke();
  } else if (item === 'sambal') {
    ctx.fillStyle = '#7d4f28';
    ctx.beginPath();
    ctx.arc(0, 2, r * 0.95, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d1f16';
    for (const [dx, dy] of [[-r * 0.35, -r * 0.2], [r * 0.3, 0.1], [0, -r * 0.45]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'bawangGoreng') {
    ctx.fillStyle = info.color;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.3, r * 0.16, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'kerupuk') {
    ctx.fillStyle = info.color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const rad = i % 2 === 0 ? r : r * 0.72;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.dark;
    for (const [dx, dy] of [[-r * 0.3, 0], [r * 0.3, 0]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'tehManis' || item === 'kopiHitam' || item === 'esTeh' || item === 'tehTawar' || item === 'airPutih') {
    const hot = item !== 'esTeh' && item !== 'airPutih';
    if (hot) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.5, -r * 1.3, -r * 0.3, -r * 1.6);
      ctx.moveTo(r * 0.2, -r * 0.9);
      ctx.quadraticCurveTo(0, -r * 1.3, r * 0.2, -r * 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = '#f4f6f8';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.7);
    ctx.lineTo(r * 0.7, -r * 0.7);
    ctx.lineTo(r * 0.5, r * 0.8);
    ctx.lineTo(-r * 0.5, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, -r * 0.45);
    ctx.lineTo(r * 0.58, -r * 0.45);
    ctx.lineTo(r * 0.44, r * 0.65);
    ctx.lineTo(-r * 0.44, r * 0.65);
    ctx.closePath();
    ctx.fill();
    if (item === 'esTeh') {
      ctx.fillStyle = '#dff2fb';
      for (const [dx, dy] of [[-r * 0.25, -r * 0.2], [r * 0.25, -r * 0.35]]) {
        ctx.fillRect(dx - r * 0.18, dy - r * 0.18, r * 0.36, r * 0.36);
      }
    }
    ctx.strokeStyle = '#c8d0d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r * 0.75, 0, r * 0.3, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else {
    // burnt (and any unknown item): a charred lump with a smoke curl.
    ctx.fillStyle = info.color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.45);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.2, -r * 1.1, 0, -r * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

/** A plated rice dish: banana-leaf mat, the rice base in the middle —
 *  uduk wrapped in brown paper, kuning as a golden mound, goreng as a
 *  browned mound — lauk arranged around it, toppings sprinkled on, drink
 *  cup beside it. */
function drawPlate(ctx, items, drink, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = COLORS.leaf;
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.leafDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-38, 0);
  ctx.lineTo(38, 0);
  ctx.stroke();
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8d0d8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const rice = items.find((item) => item === 'nasi' || item === 'nasiKuning' || item === 'nasiGoreng');
  const lauk = items.filter((item) => item !== rice);
  const spots = [[-27, -13], [27, -13], [-29, 12], [29, 12], [0, -19]];
  lauk.slice(0, 5).forEach((item, i) => drawItemIcon(ctx, item, spots[i][0], spots[i][1], 9));
  if (rice) drawItemIcon(ctx, rice, 0, 1, 15);
  if (drink) drawItemIcon(ctx, drink, 44, -6, 11);
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, progress, color) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function createRenderer(canvas) {
  // The backing store must match the view the game draws in: left at the
  // 300x150 default, the canvas shows only a magnified top-left corner.
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    // The wall strip is a plain band: the HUD panels and order tickets live
    // on it, so no title text is drawn here (it would sit under the tickets).
    // The game name is on the title screen instead.
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, VIEW.width, 92);
    ctx.fillStyle = COLORS.wallTile;
    for (let x = 0; x < VIEW.width; x += 64) {
      ctx.fillRect(x + 2, 8, 60, 76);
    }
    const tile = 64;
    for (let y = FLOOR.y; y < FLOOR.y + FLOOR.height; y += tile) {
      for (let x = FLOOR.x; x < FLOOR.x + FLOOR.width; x += tile) {
        const odd = ((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 2 === 0;
        ctx.fillStyle = odd ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }

  function drawCounter(x, y, w, h, top) {
    ctx.fillStyle = COLORS.counterSide;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = top;
    roundRect(ctx, x + 3, y + 3, w - 6, h * 0.42, 8);
    ctx.fill();
  }

  function drawCrate(station) {
    // A woven basket: warm wood with weave lines.
    drawCounter(station.x, station.y, station.width, station.height, '#b98a56');
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(station.x + 6, station.y + station.height * (i / 3));
      ctx.lineTo(station.x + station.width - 6, station.y + station.height * (i / 3));
      ctx.stroke();
    }
    if (station.width < 120) {
      // Small topping bowl: icon on top, label under it.
      drawItemIcon(ctx, station.item, station.x + station.width / 2, station.y + 34, 18);
      text(ctx, station.label, station.x + station.width / 2, station.y + station.height - 16, 11, COLORS.cream, 'center', 800);
      return;
    }
    drawItemIcon(ctx, station.item, station.x + 34, station.y + station.height / 2, 17);
    text(ctx, station.label, station.x + 108, station.y + station.height / 2 - 8, 13, COLORS.cream, 'center', 800);
    text(ctx, 'take · E', station.x + 108, station.y + station.height / 2 + 12, 10, '#e8d5b5', 'center', 600);
  }

  function drawCooker(station, slots, key) {
    const spec = COOKERS[key];
    ctx.fillStyle = COLORS.steelDark;
    roundRect(ctx, station.x, station.y, station.width, station.height, 10);
    ctx.fill();
    const gap = station.width / slots.length;
    for (let i = 0; i < slots.length; i += 1) {
      const cx = station.x + gap * (i + 0.5);
      const cy = station.y + station.height / 2;
      if (key === 'rice') {
        // Big steel rice cooker with a lid and a keep-warm light.
        ctx.fillStyle = '#c9ced6';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 34, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8f9aa5';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 6, 34, 16, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e0524d';
        ctx.beginPath();
        ctx.arc(cx + 24, cy + 16, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (key === 'wajan') {
        // Round wok over a flame.
        ctx.fillStyle = 'rgba(255,120,40,0.55)';
        ctx.beginPath();
        ctx.arc(cx, cy + 14, 20 + Math.sin(stateTime * 9 + i) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e2a28';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 32, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a4440';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 4, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (key === 'fryer') {
        // Pot of hot oil, bubbling.
        ctx.fillStyle = '#3a2e1e';
        roundRect(ctx, cx - 32, cy - 24, 64, 48, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(240,169,46,0.85)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 12, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let b = 0; b < 3; b += 1) {
          ctx.beginPath();
          ctx.arc(cx - 12 + b * 12, cy - 14 + Math.sin(stateTime * 6 + b * 2 + i) * 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Flat egg pan with a handle.
        ctx.fillStyle = '#2e2a28';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 34, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a4440';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e2a28';
        ctx.fillRect(cx + 30, cy - 3, 22, 6);
      }
      const slot = slots[i];
      if (slot) {
        // While it cooks, show the raw item; once READY, show the finished dish.
        drawItemIcon(ctx, slot.done && !slot.burnt ? spec.raws[slot.item] : slot.burnt ? 'burnt' : slot.item, cx, cy - 2, 18);
        if (!slot.burnt) {
          const color = slot.done ? COLORS.green : COLORS.gold;
          drawProgressRing(ctx, cx, cy - 2, 32, Math.min(1, slot.t / spec.cook), color);
          if (slot.done) text(ctx, 'READY!', cx, cy - 42, 11, COLORS.green, 'center', 800);
        } else {
          text(ctx, 'BURNT!', cx, cy - 42, 11, COLORS.red, 'center', 800);
        }
      }
    }
    text(ctx, station.label, station.x + station.width / 2, station.y + station.height + 14, 12, '#8a6f5c', 'center', 800);
  }

  function drawServe(station, state) {
    ctx.fillStyle = COLORS.steelDark;
    roundRect(ctx, station.x, station.y, station.width, station.height, 10);
    ctx.fill();
    ctx.fillStyle = '#241a14';
    roundRect(ctx, station.x + 8, station.y + 10, station.width - 16, station.height - 34, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, station.x + 8, station.y + station.height - 26, station.width - 16, 18, 6);
    ctx.fill();
    text(ctx, 'SERVE WINDOW', station.x + station.width / 2, station.y + station.height / 2 - 6, 15, '#ffe9a8', 'center', 800);
    const bellX = station.x + station.width / 2;
    const bellY = station.y + station.height / 2 + 22;
    const ring = state.bell > 0 ? Math.sin(state.bell * 40) * 4 : 0;
    ctx.save();
    ctx.translate(bellX + ring, bellY);
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-12, 0, 24, 3);
    ctx.fillStyle = '#8a6d1f';
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    text(ctx, station.label, station.x + station.width / 2, station.y + station.height + 14, 12, '#8a6f5c', 'center', 800);
  }

  function drawPrep(station, state) {
    drawCounter(station.x, station.y, station.width, station.height, '#8a6f5c');
    // Stone cobek with a pestle.
    ctx.fillStyle = '#5d5648';
    ctx.beginPath();
    ctx.ellipse(station.x + station.width / 2, station.y + station.height / 2 + 4, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f3a30';
    ctx.beginPath();
    ctx.ellipse(station.x + station.width / 2, station.y + station.height / 2, 44, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state.prep) {
      const cx = station.x + station.width / 2;
      const cy = station.y + station.height / 2 - 4;
      drawItemIcon(ctx, state.prep.item, cx, cy, 20);
      drawProgressRing(ctx, cx, cy, 28, state.prep.pounds / POUNDS_NEEDED, '#e0524d');
      text(ctx, `${state.prep.pounds}/${POUNDS_NEEDED} ulek`, cx, cy + 40, 11, '#5d4a33', 'center', 800);
    } else {
      text(ctx, 'ulek cabe · E', station.x + station.width / 2, station.y + station.height / 2, 13, '#efe0c0', 'center', 700);
    }
    text(ctx, station.label, station.x + station.width / 2, station.y + station.height + 14, 12, '#8a6f5c', 'center', 800);
  }

  function drawDrinks(station, state) {
    drawCounter(station.x, station.y, station.width, station.height, '#7d9bb5');
    // Teapot at the left end, five cups in a row.
    const tx = station.x + 24;
    const ty = station.y + station.height / 2;
    ctx.fillStyle = '#5d6b78';
    ctx.beginPath();
    ctx.arc(tx, ty, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f9aa5';
    ctx.beginPath();
    ctx.moveTo(tx + 10, ty - 8);
    ctx.lineTo(tx + 24, ty - 16);
    ctx.lineTo(tx + 24, ty - 6);
    ctx.closePath();
    ctx.fill();
    const gap = (station.width - 52) / DRINKS.length;
    for (let i = 0; i < DRINKS.length; i += 1) {
      const cx = station.x + 52 + gap * (i + 0.5);
      const cy = station.y + station.height / 2;
      if (i === state.drinkSel) {
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawItemIcon(ctx, DRINKS[i].id, cx, cy, 13);
    }
    if (state.brew) {
      const cx = station.x + 52 + gap * (state.drinkSel + 0.5);
      const cy = station.y + station.height / 2;
      drawProgressRing(ctx, cx, cy, 20, Math.min(1, state.brew.t / state.brew.duration), '#6db3e8');
      text(ctx, 'pouring…', station.x + station.width / 2, station.y + station.height - 10, 10, '#e8d5b5', 'center', 700);
    } else if (state.drinkReady) {
      text(ctx, `${ITEMS[state.drinkReady].name} ready · E`, station.x + station.width / 2, station.y + station.height - 10, 10, '#6db3e8', 'center', 800);
    } else {
      text(ctx, 'click a cup · E pours · Q picks', station.x + station.width / 2, station.y + station.height - 10, 10, '#e8d5b5', 'center', 600);
    }
    text(ctx, station.label, station.x + station.width / 2, station.y + station.height + 14, 12, '#8a6f5c', 'center', 800);
  }

  function drawAssembly(station, state) {
    drawCounter(station.x, station.y, station.width, station.height, '#c9ced6');
    if (state.plate) {
      drawPlate(ctx, state.plate.items, state.plate.drink, station.x + station.width / 2, station.y + station.height / 2, 1);
      const count = state.plate.items.length + (state.plate.drink ? 1 : 0);
      text(ctx, count === 0 ? 'empty plate — add the packet first' : `${count} item${count > 1 ? 's' : ''} on plate`, station.x + station.width / 2, station.y + station.height - 12, 11, '#5d4a33', 'center', 700);
    } else {
      text(ctx, 'plate up · E', station.x + station.width / 2, station.y + station.height / 2, 13, '#8a6f5c', 'center', 700);
    }
    text(ctx, station.label, station.x + station.width / 2, station.y + station.height + 14, 12, '#8a6f5c', 'center', 800);
  }

  function drawTrash(station) {
    ctx.fillStyle = '#4a4f55';
    roundRect(ctx, station.x, station.y, station.width, station.height, 10);
    ctx.fill();
    ctx.fillStyle = '#33373c';
    roundRect(ctx, station.x + 20, station.y + 14, station.width - 40, station.height - 40, 8);
    ctx.fill();
    text(ctx, '🗑', station.x + station.width / 2, station.y + station.height / 2 - 6, 26, '#cfd6dd', 'center', 700);
    text(ctx, 'TRASH', station.x + station.width / 2, station.y + station.height - 14, 11, '#cfd6dd', 'center', 800);
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.moving ? Math.sin(chef.bob) * 3 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(chef.x, chef.y + 18, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(chef.x, chef.y + bob * 0.4);
    // Apron over a batik-red shirt.
    ctx.fillStyle = '#e0524d';
    roundRect(ctx, -16, -6, 32, 26, 10);
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(-16, 8, 32, 4);
    // Head and the black peci cap.
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath();
    ctx.arc(0, -16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1a18';
    ctx.beginPath();
    ctx.arc(0, -19, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-12, -21, 24, 5);
    ctx.fillStyle = '#2b1d18';
    const lookX = chef.faceX * 2;
    const lookY = chef.faceY * 2;
    ctx.beginPath();
    ctx.arc(-4 + lookX, -16 + lookY, 1.8, 0, Math.PI * 2);
    ctx.arc(4 + lookX, -16 + lookY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (state.hand) {
      const hx = chef.x;
      const hy = chef.y - 52 + Math.sin(state.shakeTime * 3) * 2;
      if (state.hand.type === 'plate') {
        drawPlate(ctx, state.hand.items, state.hand.drink, hx, hy, 0.75);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(hx, hy, 20, 0, Math.PI * 2);
        ctx.fill();
        drawItemIcon(ctx, state.hand.item, hx, hy, 14);
      }
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = p.kind === 'steam' || p.kind === 'smoke' ? alpha * 0.5 : alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.kind === 'steam' || p.kind === 'smoke' ? 1 + (1 - alpha) * 1.6 : 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const f of state.floaters) {
      const alpha = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = '800 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawOrders(state) {
    const x0 = 252;
    for (let i = 0; i < state.orders.length; i += 1) {
      const order = state.orders[i];
      const x = x0 + i * 178;
      const y = 10;
      const urgent = order.patience < 12;
      const pulse = urgent ? 1 + Math.sin(state.shakeTime * 8) * 0.03 : 1;
      ctx.save();
      ctx.translate(x + 84, y + 28);
      ctx.scale(pulse, pulse);
      ctx.translate(-84, -28);
      ctx.fillStyle = '#fffdf5';
      roundRect(ctx, x, y, 168, 56, 8);
      ctx.fill();
      ctx.strokeStyle = urgent ? COLORS.red : '#d8c9a8';
      ctx.lineWidth = urgent ? 3 : 1.5;
      ctx.stroke();
      text(ctx, `#${order.id} ${order.name}`, x + 10, y + 12, 13, COLORS.ink, 'left', 800);
      text(ctx, `$${order.price}`, x + 158, y + 12, 13, '#8a6d1f', 'right', 800);
      let iconX = x + 16;
      for (const item of order.items) {
        drawItemIcon(ctx, item, iconX, y + 34, 8);
        iconX += 20;
      }
      if (order.drink) {
        drawItemIcon(ctx, order.drink, iconX, y + 34, 9);
      }
      const ratio = Math.max(0, order.patience / order.maxPatience);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRect(ctx, x + 8, y + 48, 152, 5, 2);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? COLORS.green : ratio > 0.25 ? COLORS.gold : COLORS.red;
      roundRect(ctx, x + 8, y + 48, 152 * ratio, 5, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHud(state, muted) {
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, 76, VIEW.width, 4);
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(ctx, 12, 10, 224, 56, 10);
    ctx.fill();
    text(ctx, `$${state.money}`, 24, 30, 26, COLORS.gold, 'left', 800);
    text(ctx, `SERVED ${state.served}`, 24, 54, 11, '#e8d5b5', 'left', 700);
    if (state.combo >= 2) {
      ctx.fillStyle = '#ff8fd1';
      roundRect(ctx, 140, 20, 84, 22, 11);
      ctx.fill();
      text(ctx, `COMBO x${state.combo}`, 182, 32, 13, '#fff', 'center', 800);
      ctx.fillStyle = 'rgba(255,143,209,0.35)';
      const ratio = Math.max(0, state.comboTimer / ORDERS.comboWindow);
      roundRect(ctx, 140, 46, 84 * ratio, 5, 2);
      ctx.fill();
    }
    drawOrders(state);
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const low = state.timeLeft <= 30;
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(ctx, 1080, 10, 188, 56, 10);
    ctx.fill();
    text(ctx, 'SHIFT', 1096, 26, 11, '#e8d5b5', 'left', 700);
    text(ctx, timerText, 1252, 38, 30, low ? COLORS.red : COLORS.cream, 'right', 800);
    const shiftRatio = 1 - state.elapsed / SHIFT_SECONDS;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, 1096, 54, 156, 5, 2);
    ctx.fill();
    ctx.fillStyle = low ? COLORS.red : COLORS.gold;
    roundRect(ctx, 1096, 54, 156 * shiftRatio, 5, 2);
    ctx.fill();
    text(ctx, 'WASD/arrows move · E use · Q pick a drink · click to walk · P pause · M sound', 640, 706, 12, 'rgba(255,247,232,0.75)', 'center', 600);
    text(ctx, muted ? 'MUTED' : 'SOUND ON', 1268, 706, 11, 'rgba(255,247,232,0.6)', 'right', 700);
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(30,16,12,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = COLORS.gold;
    text(ctx, 'NASI UDUK', 640, 190, 84, COLORS.gold, 'center', 900);
    text(ctx, 'EKSPRESS', 640, 268, 84, '#fff7e8', 'center', 900);
    text(ctx, 'A warung rush — three rices, six lauk, five drinks. Steam it, fry it, wrap it, serve!', 640, 330, 22, '#ffd34d', 'center', 700);
    const lines = [
      'Nasi Uduk in brown paper · Nasi Kuning golden mound · Nasi Goreng from the wok',
      'Take beras, beras kuning, bihun, mie, telur, tempe, tahu, jengkol, cabe from the baskets',
      'Steam the rice · stir-fry bihun & mie · fry tahu & jengkol · ulek sambal on the cobek',
      'Build the plate to match the ticket · pour the drink · serve before patience runs out',
    ];
    lines.forEach((line, i) => text(ctx, line, 640, 384 + i * 28, 17, '#fff7e8', 'center', 600));
    text(ctx, 'WASD / arrows or click to move  ·  E or click a station to use it  ·  Q picks a drink  ·  P pause', 640, 500, 16, '#e8d5b5', 'center', 700);
    const blink = Math.sin(state.shakeTime * 4) > -0.2;
    if (blink) text(ctx, 'PRESS SPACE OR CLICK TO START', 640, 560, 24, COLORS.gold, 'center', 800);
    if (best > 0) text(ctx, `Best score: ${best}`, 640, 606, 16, '#fff7e8', 'center', 700);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20,12,8,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'PAUSED', 640, 330, 56, '#fff7e8', 'center', 900);
    text(ctx, 'Press P or click to keep cooking', 640, 392, 18, '#e8d5b5', 'center', 600);
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(30,16,12,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(ctx, 380, 130, 520, 440, 18);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'SHIFT OVER!', 640, 180, 44, COLORS.gold, 'center', 900);
    const score = state.money * 10 + state.served * 50;
    const rows = [
      ['Money earned', `$${state.earned}`],
      ['Orders served', `${state.served}`],
      ['Orders missed', `${state.missed}`],
      ['Best combo', `x${state.bestCombo}`],
      ['Score', `${score}`],
    ];
    rows.forEach(([label, value], i) => {
      text(ctx, label, 440, 244 + i * 44, 20, '#e8d5b5', 'left', 700);
      text(ctx, value, 840, 244 + i * 44, 20, '#fff7e8', 'right', 800);
    });
    if (score >= best && score > 0) text(ctx, 'NEW BEST!', 640, 480, 22, '#ff8fd1', 'center', 800);
    else text(ctx, `Best score: ${best}`, 640, 480, 18, '#e8d5b5', 'center', 700);
    const blink = Math.sin(state.shakeTime * 4) > -0.2;
    if (blink) text(ctx, 'PRESS SPACE TO PLAY AGAIN', 640, 536, 20, COLORS.gold, 'center', 800);
  }

  let stateTime = 0;

  function draw(state, screen, best, muted) {
    stateTime = state.shakeTime;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    const shake = state.trauma * state.trauma;
    const ox = shake * 10 * Math.sin(state.shakeTime * 31) + shake * 5 * Math.sin(state.shakeTime * 47);
    const oy = shake * 8 * Math.sin(state.shakeTime * 37);
    ctx.save();
    ctx.translate(ox, oy);
    drawFloor();
    drawCrate(STATIONS.crateBeras);
    drawCrate(STATIONS.crateBihun);
    drawCrate(STATIONS.crateMie);
    drawCrate(STATIONS.crateTelur);
    drawCrate(STATIONS.crateTempe);
    drawCrate(STATIONS.crateTahu);
    drawCrate(STATIONS.crateJengkol);
    drawCrate(STATIONS.crateCabe);
    drawCooker(STATIONS.rice, state.cookers.rice, 'rice');
    drawCooker(STATIONS.wajan, state.cookers.wajan, 'wajan');
    drawCooker(STATIONS.fryer, state.cookers.fryer, 'fryer');
    drawServe(STATIONS.serve, state);
    drawCrate(STATIONS.crateKuning);
    drawPrep(STATIONS.cobek, state);
    drawCooker(STATIONS.eggpan, state.cookers.eggpan, 'eggpan');
    drawDrinks(STATIONS.drinks, state);
    drawAssembly(STATIONS.assembly, state);
    drawCrate(STATIONS.crateBawang);
    drawCrate(STATIONS.crateKerupuk);
    drawTrash(STATIONS.trash);
    drawChef(state);
    drawParticles(state);
    ctx.restore();
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(224,82,77,${state.flash * 0.25})`;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    drawHud(state, muted);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
