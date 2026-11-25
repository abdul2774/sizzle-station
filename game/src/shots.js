// The deterministic screenshot scenes behind ?shot=cover|wok|serve|rush.
// Each one stages a real world state through the world's own scene builder,
// so the frame is what the game really looks like mid-shift and the same
// seed always gives the same frame.
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Stage `name` on `world` and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'cover' || name === 'wok' || name === 'serve' || name === 'rush') {
    world.stageShot(name);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  world.stageShot('cover');
  return { screen: SCREEN_TITLE, best: 0 };
}
