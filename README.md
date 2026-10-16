# Amritanshu Kumar Shandilya — portfolio

Plain HTML, CSS and JavaScript. No build step. Open `index.html` in a browser and it works.

## Files

```
index.html        Home: headline + pixel portrait, work list, how I work, contact
ode.html          Case study
desportivos.html  Case study
vignette.html     Case study
posters.html      All posters
404.html          "Page not found" (Vercel uses it automatically)
css/style.css     The only stylesheet. Colours and fonts are at the top.
js/main.js        Lightbox, fade-in on scroll, pixel portrait, Red the messenger owl
game/             Red's Delivery Run (index.html, style.css, game.js)
images/           All artwork (WebP)
files/            Portfolio PDF
```

## Red's Delivery Run (`/game`)

A small canvas game starring Red. Plain HTML/CSS/JS in `game/`, no build step. It loads artwork straight from `images/`.

**Controls:** Space / ↑ / W / click / tap to flap · P or Esc to pause · M to mute. Pick up a letter, then swoop low over a mailbox to deliver it.

Saved in `localStorage`: `red.best`, `red.levelBest`, `red.eggs`, `red.unlocked`, `red.sound`.

### Spoilers: easter eggs

<details>
<summary>All 8 eggs and how to trigger them</summary>

| # | Egg | How to trigger |
|---|-----|----------------|
| 1 | Wink | On the title screen, click Red 5 times quickly. He winks ";)". |
| 2 | Pixel portrait | Level 2 (and endless): a cloud made from `portrait-bitmap-hd.png` assembles high up. Fly through it to scatter it. |
| 3 | Desportivos '26 | Finish level 1 (Desportivos Grounds) and the Desportivos mascot cheers at the finish line. |
| 4 | Vignette | The octopus appears now and then (40% of level 2 runs, 25% of level 3, once in a while in endless). Fly into the paintbrush it holds out to recolour the level. |
| 5 | Ode merch | Collect the tumbler (speed), badge (shield) and tote (carry 3) in a single run. Every level has one of each. |
| 6 | Poster run | Fly through the Shaayar, Brave and Bold and Art is you billboards in one run (level 2 or endless). A gold letter worth 1000 appears. |
| 7 | Sketch mode | Konami code: ↑ ↑ ↓ ↓ ← → ← → B A. Enter it again to switch back. |
| 8 | Delivered | Finish level 3. Red says "I'll deliver it." and the letter opens to the contact email. |

The "Eggs found x/8" menu item appears after the first egg is found. On the home page, clicking Red in the contact section opens the game.

</details>
