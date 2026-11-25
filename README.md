# Nasi Uduk Ekspress

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/abdul2774/sizzle-station/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/abdul2774/sizzle-station/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast Indonesian warung cooking game, built for the make.fun bounty
**“Make the best cooking game”** (`best-cooking-game-20261125-0137`).

You run a nasi uduk warung for one 3-minute shift. Take ingredients from
the baskets, steam the rice in the penanak nasi, stir-fry bihun and mie in
the wajan, fry tahu and jengkol, pound sambal on the cobek, wrap the rice in
brown paper (kertas coklat), build each plate on the assembly counter to
match the order ticket — lauk, toppings, and a drink from the MINUMAN
station — and serve it at the window before the customer's patience runs
out. Serve streaks build a combo that pays more; burnt food and lost orders
cost you.

## The menu

Three rice bases, every order picks one:

- **Nasi Uduk** — coconut rice steamed in the penanak nasi, served WRAPPED
  in brown paper (kertas coklat), the signature packet.
- **Nasi Kuning** — yellow turmeric rice, steamed in the penanak nasi from
  the KUNING basket, served as a golden mound.
- **Nasi Goreng** — steamed rice fried in the wajan with egg and veg bits,
  served as a browned mound.

Six lauk, every one orderable: **Bihun, Orek Tempe, Telor Balado, Mie
Keriting, Tahu Cabe, Jengkol**. **Bawang Goreng** and **Kerupuk** are
toppings only — they garnish a finished plate, never a dish on their own.
Five drinks, all poured at the MINUMAN station: **Teh Manis Panas, Kopi
Hitam, Es Teh Manis, Teh Tawar, Air Putih**.

## Controls

- **WASD / arrow keys** — move the cook
- **Click** — walk there (click a station to walk to it and use it; click
  one of the five cups at MINUMAN to pour that drink)
- **E / Space** — use the station you're standing at (at MINUMAN, pours the
  drink the oldest order still needs, or the highlighted one)
- **Q** — pick the highlighted drink · **P / Esc** — pause · **M** — mute

## How to play

1. Grab beras from the basket and steam it in the penanak nasi — take the
   nasi off when the ring turns green, or it burns. Beras kuning from the
   KUNING basket steams into nasi kuning the same way.
2. Bihun, mie and tempe go in the wajan; tahu and jengkol in the
   penggorengan; telur in the wajan telur. Steamed nasi fried in the wajan
   becomes nasi goreng.
3. Cabe goes on the cobek — press E three times to ulek it into sambal.
4. Put a plate on the assembly counter: the brown-paper nasi packet first,
   then the lauk to match the ticket, bawang goreng or kerupuk on top, and
   the drink beside it if the ticket shows one. Carry the plate to the
   serve window.

## Tech

Vanilla JavaScript on a 2D canvas, no libraries, no network requests. All
art is drawn in code and all sound is synthesized with WebAudio. The game is
static files under `game/`; `node serve.ts` serves it on
http://localhost:8080.

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `dossier.json` with the vendored
make.fun library (`vendor/makefun-game.ts`).

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
