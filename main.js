// Nav: hide on scroll down, show on scroll up; shadow once scrolled; highlight current section
const nav = document.querySelector('.nav');
if (nav) {
  let lastY = scrollY, tick = false;
  const onScroll = () => {
    tick = false;
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 10);
    if (Math.abs(y - lastY) > 6) { nav.classList.toggle('is-hidden', y > lastY && y > 160); lastY = y; }
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
  const secLinks = [...nav.querySelectorAll('[data-sec]')];
  const secs = secLinks.map(l => document.getElementById(l.dataset.sec)).filter(Boolean);
  if (secs.length) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      const l = nav.querySelector('[data-sec="' + e.target.id + '"]');
      if (l) l.classList.toggle('is-active', e.isIntersecting);
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => so.observe(s));
  }
}

// Nav links: letters scramble through pixel glyphs on hover, then settle
const GLYPHS = '#%&*+=?@$<>/\\01';
document.querySelectorAll('[data-scramble]').forEach(el => {
  const txt = el.textContent; let raf, f;
  el.style.minWidth = el.offsetWidth ? '' : '';
  const run = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cancelAnimationFrame(raf); f = 0;
    const step = () => {
      f++;
      const done = Math.floor(f / 2);
      el.textContent = [...txt].map((c, i) => i < done ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
      if (done < txt.length) raf = requestAnimationFrame(step); else el.textContent = txt;
    };
    step();
  };
  el.addEventListener('mouseenter', run);
  el.addEventListener('focus', run);
});

// Lightbox: any <button data-zoom> containing an <img>
const lb = document.createElement('div');
lb.className = 'lightbox';
lb.innerHTML = '<img alt="">';
document.body.appendChild(lb);
const lbImg = lb.querySelector('img');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-zoom]');
  if (!b) return;
  const img = b.querySelector('img');
  lbImg.src = img.currentSrc || img.src;
  lbImg.alt = img.alt;
  lb.classList.add('is-open');
});
lb.addEventListener('click', () => lb.classList.remove('is-open'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('is-open'); });

// Fade sections in as they scroll into view
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
// Motion: auto-reveal more of each page, staggered within groups
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!calm) {
  // Headline: words rise out of a mask on load
  const h1 = document.querySelector('.hero h1, main h1, header h1, h1');
  if (h1) {
    let n = 0;
    const walk = node => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const o = document.createElement('span'); o.className = 'w';
          const i = document.createElement('span'); i.textContent = part; i.style.transitionDelay = (120 + n++ * 55) + 'ms';
          o.appendChild(i); frag.appendChild(o);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(h1); h1.classList.add('is-split');
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('is-in')));
    const after = [...(h1.parentElement?.children || [])].filter(el => el !== h1 && !el.hasAttribute('data-reveal'));
    after.forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.transitionDelay = (260 + n * 55 + i * 90) + 'ms'; });
  }
  // Everything else worth revealing
  const sel = '.block__text, .block__media > *, .gallery > *, .next, .stack__text > *, .posters > *, .grid > *, .section .label, .footer .wrap';
  document.querySelectorAll(sel).forEach(el => {
    if (el.closest('[data-reveal]') || el.hasAttribute('data-reveal')) return;
    el.setAttribute('data-reveal', '');
    const sibs = [...el.parentElement.children].filter(s => s.matches(sel));
    const idx = Math.min(sibs.indexOf(el), 5);
    if (idx > 0) el.style.transitionDelay = idx * 80 + 'ms';
  });
  document.querySelectorAll('.steps > [data-reveal]').forEach((el, i) => { el.style.transitionDelay = i * 110 + 'ms'; });
  // Ticker speeds up with scroll, then eases back
  const tk = document.querySelector('.ticker__track');
  const anim = tk && tk.getAnimations && tk.getAnimations()[0];
  if (anim) {
    let lastY = scrollY, rate = 1, raf2 = 0;
    const ease = () => { rate += (1 - rate) * .06; anim.playbackRate = rate; raf2 = Math.abs(rate - 1) > .01 ? requestAnimationFrame(ease) : (anim.playbackRate = 1, 0); };
    addEventListener('scroll', () => { const v = Math.abs(scrollY - lastY); lastY = scrollY; rate = Math.min(6, Math.max(rate, 1 + v * .08)); if (!raf2) raf2 = requestAnimationFrame(ease); }, { passive: true });
  }
}
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));


// Red, the messenger: hover the email and he picks up the letter; click and he flies off with it
const contact = document.querySelector('.contact');
const mail = document.querySelector('[data-send]');
if (contact && mail) {
  const ready = on => contact.classList.toggle('is-ready', on);
  mail.addEventListener('mouseenter', () => ready(true));
  mail.addEventListener('mouseleave', () => ready(false));
  mail.addEventListener('focus', () => ready(true));
  mail.addEventListener('blur', () => ready(false));
  mail.addEventListener('click', e => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    contact.classList.remove('is-ready', 'is-back');
    contact.classList.add('is-sending');
    setTimeout(() => { location.href = mail.href; }, 1400);
    setTimeout(() => { contact.classList.remove('is-sending'); contact.classList.add('is-back'); }, 2400);
  });
}

// Red is also a link to his game: hovering him changes what he says
const bird = document.querySelector('.messenger__bird');
const say = document.querySelector('.messenger__say');
if (contact && bird && say) {
  const line = say.textContent;
  const play = on => { contact.classList.toggle('is-playing', on); say.textContent = on ? 'Play my game' : line; };
  bird.addEventListener('mouseenter', () => play(true));
  bird.addEventListener('mouseleave', () => play(false));
  bird.addEventListener('focus', () => play(true));
  bird.addEventListener('blur', () => play(false));
}

// Portrait pixels: every dot of the 1-bit image is a particle. Rendered into a
// grid-sized buffer and scaled up with smoothing off, so it stays crisp and fast.
const pf = document.querySelector('[data-pixels]');
if (pf) {
  const cv = pf.querySelector('canvas'), ctx = cv.getContext('2d');
  const GW = 300, GH = 360; // native dot grid of portrait-bitmap-hd.png (2px dots)
  const buf = document.createElement('canvas'); buf.width = GW; buf.height = GH;
  const bctx = buf.getContext('2d'), img = bctx.createImageData(GW, GH), px32 = new Uint32Array(img.data.buffer);
  const INK = 0xff111111;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let N = 0, gx, gy, x, y, vx, vy, sx0, sy0, dl, mx = -1e9, my = -1e9, running = false, played = false, t0 = 0;
  const INTRO = 2600; // ms for the assemble animation
  const ease = t => 1 - Math.pow(1 - t, 4);
  const size = () => {
    const r = pf.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.imageSmoothingEnabled = false;
  };
  const src = new Image(); src.src = pf.dataset.pixels;
  src.onload = () => {
    const t = document.createElement('canvas'); t.width = src.width; t.height = src.height;
    const tc = t.getContext('2d'); tc.imageSmoothingEnabled = false; tc.drawImage(src, 0, 0);
    const d = tc.getImageData(0, 0, t.width, t.height).data, sx = t.width / GW, sy = t.height / GH;
    const on = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const k = ((Math.floor(j * sy + sy / 2)) * t.width + Math.floor(i * sx + sx / 2)) * 4 + 3;
      if (d[k] > 127) on.push(i, j);
    }
    N = on.length / 2;
    gx = new Float32Array(N); gy = new Float32Array(N); x = new Float32Array(N); y = new Float32Array(N);
    vx = new Float32Array(N); vy = new Float32Array(N); sx0 = new Float32Array(N); sy0 = new Float32Array(N); dl = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      gx[n] = on[n * 2]; gy[n] = on[n * 2 + 1];
      const ang = Math.random() * 6.283, far = 0.35 + Math.random() * 0.6;
      sx0[n] = x[n] = gx[n] + Math.cos(ang) * GW * far; sy0[n] = y[n] = gy[n] + Math.sin(ang) * GH * far;
      dl[n] = (gy[n] / GH) * 0.45 + Math.random() * 0.15; // top-to-bottom stagger, as a fraction of INTRO
    }
    size();
    if (still) { t0 = -1e9; } else { t0 = performance.now(); }
    start();
  };
  const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
  const tick = now => {
    const R = 16, R2 = R * R;
    const it = (now - t0) / INTRO;
    if (it < 1) { // smooth, time-based assemble
      px32.fill(0);
      for (let n = 0; n < N; n++) {
        const k = ease(Math.min(1, Math.max(0, (it - dl[n]) / (1 - 0.6))));
        x[n] = sx0[n] + (gx[n] - sx0[n]) * k; y[n] = sy0[n] + (gy[n] - sy0[n]) * k;
        const ix = Math.round(x[n]), iy = Math.round(y[n]);
        if (ix >= 0 && ix < GW && iy >= 0 && iy < GH) px32[iy * GW + ix] = INK;
      }
      bctx.putImageData(img, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(buf, 0, 0, cv.width, cv.height);
      requestAnimationFrame(tick); return;
    }
    const scale = GW / pf.clientWidth, px = mx * scale, py = my * scale;
    let moving = false;
    px32.fill(0);
    for (let n = 0; n < N; n++) {
      const dx = x[n] - px, dy = y[n] - py, dd = dx * dx + dy * dy;
      if (dd < R2) { const f = (1 - dd / R2) * 2.2 / (Math.sqrt(dd) || 1); vx[n] += dx * f; vy[n] += dy * f; }
      vx[n] = (vx[n] + (gx[n] - x[n]) * 0.07) * 0.8; vy[n] = (vy[n] + (gy[n] - y[n]) * 0.07) * 0.8;
      x[n] += vx[n]; y[n] += vy[n];
      if (!moving && (Math.abs(gx[n] - x[n]) > 0.3 || Math.abs(gy[n] - y[n]) > 0.3)) moving = true;
      const ix = Math.round(x[n]), iy = Math.round(y[n]);
      if (ix >= 0 && ix < GW && iy >= 0 && iy < GH) px32[iy * GW + ix] = INK;
    }
    bctx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(buf, 0, 0, cv.width, cv.height);
    if (moving || mx > -1e8) requestAnimationFrame(tick);
    else { // settle exactly on the grid
      px32.fill(0); for (let n = 0; n < N; n++) { x[n] = gx[n]; y[n] = gy[n]; px32[gy[n] * GW + gx[n]] = INK; }
      bctx.putImageData(img, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(buf, 0, 0, cv.width, cv.height);
      running = false;
    }
  };
  const reset = () => { mx = my = -1e9; };
  pf.addEventListener('pointermove', e => {
    const r = pf.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    if (!played) { played = true; pf.classList.add('is-played'); }
    start();
  });
  pf.addEventListener('pointerleave', reset);
  pf.addEventListener('pointercancel', reset);
  pf.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') reset(); });
  window.addEventListener('resize', () => { size(); start(); });
}

// Stacked work cards: shrink each card slightly as the next one covers it
const cards = [...document.querySelectorAll('.stack__card')];
if (cards.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let ticking = false;
  const update = () => {
    ticking = false;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const top = parseFloat(getComputedStyle(c).top);
      const gap = next.getBoundingClientRect().top - top;
      const p = Math.min(1, Math.max(0, 1 - gap / c.offsetHeight));
      c.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
      c.style.filter = p ? 'brightness(' + (1 - p * 0.25).toFixed(3) + ')' : '';
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}


// Cursor: a small dot that flips the colours beneath it and grows softly over links
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const dot = document.createElement('div');
  dot.className = 'cursor'; dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.documentElement.classList.add('has-cursor');
  addEventListener('pointermove', e => {
    dot.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    dot.classList.add('is-on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
  addEventListener('pointerdown', () => dot.classList.add('is-down'));
  addEventListener('pointerup', () => dot.classList.remove('is-down'));
  document.addEventListener('pointerover', e => {
    const t = e.target;
    dot.classList.toggle('is-link', !!t.closest('a, button, [role="button"], [data-zoom], label, summary'));
    dot.classList.toggle('is-hidden', !!t.closest('input, textarea, select, [contenteditable]'));
    let el = t, bg = '';
    while (el && el.nodeType === 1) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)/.test(c)) { bg = c; break; } el = el.parentElement; }
    const m = bg.match(/\d+(\.\d+)?/g) || [];
    const [r, g, b] = m.map(Number);
    const warm = r > 180 && r - b > 120 && r - g > 60, dark = m.length && (0.299 * r + 0.587 * g + 0.114 * b) < 110;
    dot.classList.toggle('is-light', !!(warm || dark));
  });
}
