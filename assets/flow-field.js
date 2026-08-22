/* ============================================================
   Flow-field particle background — rease.dev
   Adapted from the effect on nightmare.app/test/:
   white dots drifting on a sine-wave flow field, leaving trails,
   repelled by the cursor. Theme-aware (dark: white dots, light:
   slate dots), works on touch.

   LOOK: each particle is a bright dot (head) with a fading trail
   drawn behind it. Trails fade out over TRAIL_MS by construction:
   every frame the canvas is cleared solid, and each trail is
   redrawn from the particle's position history with alpha windows
   by absolute age (0.05 -> 1.0 head). When a particle dies it
   becomes a ghost whose history ages out, so its trail fades
   slowly instead of blinking out.

   NOTE: this always animates, exactly like the original — do NOT
   gate it on prefers-reduced-motion (v1 froze into a static frame
   on systems that report reduce, e.g. Windows animation effects
   off). And do NOT use the translucent fade-rect trick for trails
   (v1 of the trails accumulated on some GPU/driver combos until
   they filled the screen).
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("flow-field");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: false });
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mouseX = -9999, mouseY = -9999;
  var time = 0, particles = [];
  var W = 0, H = 0, isMobile = false;

  var TRAIL_MS = 1400; /* trails fade out over ~1.4s */

  /* Trail alpha windows by point age (ms). Drawn oldest -> newest,
     alpha stepping up toward the head. Points older than TRAIL_MS
     are dropped, so nothing accumulates. */
  var BUCKETS = [
    { max: 150,  alpha: 1.0 },   /* head of the trail */
    { max: 300,  alpha: 0.78 },
    { max: 520,  alpha: 0.5 },
    { max: 760,  alpha: 0.28 },
    { max: 1050, alpha: 0.13 },
    { max: 1400, alpha: 0.05 }   /* tail - nearly gone */
  ];

  /* Theme palettes: bg must match the CSS --bg token so the canvas
     blends seamlessly into the page. Warm dots are a rare accent. */
  var PALETTES = {
    dark: {
      bg: "#0f172a",
      dot: [220, 226, 240],
      warm: [232, 204, 178],
      alphaMul: 1
    },
    light: {
      bg: "#f8fafc",
      dot: [51, 65, 85],
      warm: [124, 58, 237],
      alphaMul: 0.8
    }
  };

  function theme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark" : "light";
  }
  var palette = PALETTES[theme()];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
  }

  function spawn() {
    isMobile = W < 768;
    var count = isMobile ? 180 : 600;
    particles = [];
    for (var i = 0; i < count; i++) particles.push(makeParticle());
  }

  function makeParticle() {
    var r = Math.random();
    var small = r < 0.78;
    var sizeMul = isMobile ? 0.75 : 1;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      life: Math.floor(Math.random() * 260 + 140),
      size: small
        ? (Math.random() * 0.8 + 0.35) * sizeMul
        : (Math.random() * 1.3 + 0.9) * sizeMul,
      alpha: (small
        ? Math.random() * 0.22 + 0.12
        : Math.random() * 0.35 + 0.18) * palette.alphaMul,
      warm: Math.random() < 0.07,
      dead: false,
      history: [] /* trail points: {x, y, t} */
    };
  }

  /* Flow field: a sum of sines/cosines over x, y and time. The curl
     (rotated gradient) gives each particle its velocity, which is what
     bends the dots into those circular, swirling paths. */
  function potential(x, y, t) {
    var s = 0.0022;
    return Math.sin(x * s + t * 0.00018) * Math.cos(y * s * 1.3 - t * 0.00012)
         + Math.sin((x + y) * s * 0.55 + t * 0.00008) * 0.55
         + Math.cos((x - y) * s * 0.7 - t * 0.00009) * 0.4;
  }

  function curl(x, y, t) {
    var eps = 3;
    var dPdy = (potential(x, y + eps, t) - potential(x, y - eps, t)) / (2 * eps);
    var dPdx = (potential(x + eps, y, t) - potential(x - eps, y, t)) / (2 * eps);
    return [dPdy * 180, -dPdx * 180];
  }

  function dropOld(p, now) {
    while (p.history.length && now - p.history[0].t > TRAIL_MS) p.history.shift();
  }

  /* Draw the fading trail: the history polyline split into age
     buckets, oldest first, alpha stepping up toward the head. */
  function drawTrail(p, now) {
    var h = p.history;
    var n = h.length;
    if (n < 2) return;

    var color = p.warm ? palette.warm : palette.dot;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var prevMax = 0;
    for (var b = 0; b < BUCKETS.length; b++) {
      var max = BUCKETS[b].max;
      var a = p.alpha * BUCKETS[b].alpha;
      if (a < 0.015) { prevMax = max; continue; }  /* invisible: skip */

      ctx.strokeStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + a + ")";
      ctx.lineWidth = p.size;

      ctx.beginPath();
      var started = false;
      for (var i = 0; i < n; i++) {
        var age = now - h[i].t;
        if (age <= prevMax || age > max) continue;
        if (!started) {
          ctx.moveTo(h[i].x, h[i].y);
          started = true;
        } else {
          ctx.lineTo(h[i].x, h[i].y);
        }
      }
      if (started) ctx.stroke();
      prevMax = max;
    }
  }

  /* The bright dot at the head of the trail, with a soft glow so
     the moving particle is clearly discernible. */
  function drawHead(p) {
    var color = p.warm ? palette.warm : palette.dot;
    var css = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + p.alpha + ")";

    /* soft glow halo (skipped for the tiniest particles) */
    if (p.size > 0.7) {
      ctx.fillStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + p.alpha * 0.22 + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    /* the dot itself */
    ctx.fillStyle = css;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    try {
      time++;
      var now = Date.now();

      /* Solid clear every frame — nothing accumulates. */
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        if (!p.dead) {
          var v = curl(p.x, p.y, time);
          p.x += v[0];
          p.y += v[1];

          /* Mouse repulsion within 150px. */
          var dx = p.x - mouseX;
          var dy = p.y - mouseY;
          var d2 = dx * dx + dy * dy;
          if (d2 < 22500 && d2 > 1) {
            var d = Math.sqrt(d2);
            var f = (150 - d) / 150;
            p.x += (dx / d) * f * 2.2;
            p.y += (dy / d) * f * 2.2;
          }

          p.life--;
          if (p.life <= 0 || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) {
            p.dead = true; /* ghost: trail fades out, no instant blink */
          }
        }

        if (p.dead) {
          /* Trail ages out over TRAIL_MS; respawn once it's gone. */
          if (p.history.length === 0) {
            var np = makeParticle();
            for (var k in np) p[k] = np[k];
            continue;
          }
          dropOld(p, now);
          drawTrail(p, now);
          continue;
        }

        if (isMobile) {
          /* Mobile: plain dot, no trail — cheaper and still lively. */
          var color = p.warm ? palette.warm : palette.dot;
          ctx.fillStyle = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + p.alpha + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.history.push({ x: p.x, y: p.y, t: now });
          dropOld(p, now);
          drawTrail(p, now);
          drawHead(p);
        }
      }
    } finally {
      /* Always reschedule, even if a frame threw — one bad particle
         must never permanently stop the animation. */
      requestAnimationFrame(loop);
    }
  }

  window.addEventListener("resize", function () {
    resize();
    spawn();
  });

  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  window.addEventListener("mouseleave", function () {
    mouseX = -9999;
    mouseY = -9999;
  });
  window.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches.length) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  /* Re-theme when the toggle flips data-theme on <html>. */
  new MutationObserver(function () {
    palette = PALETTES[theme()];
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
    spawn();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  spawn();
  requestAnimationFrame(loop);
})();
