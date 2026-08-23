/* ============================================================
   Flow-field particle background — rease.dev
   Adapted from the effect on nightmare.app/test/:
   dots drifting on a sine-wave flow field, repelled by the cursor.
   Theme-aware (dark: white dots, light: slate dots), works on touch.

   LOOK: a FIXED population of small glowing "star" dots generated
   once on load (900 desktop / 300 mobile). They flow forever on the
   field and NEVER despawn — when one drifts off-screen it wraps
   around to the opposite edge. No death/respawn means no flicker by
   construction and perfectly constant density.

   NOTE: this always animates, exactly like the original — do NOT
   gate it on prefers-reduced-motion (a v1 static-frame freeze). And
   do NOT reintroduce translucent fade-rects (v1 trails accumulated
   on some GPU/driver combos).
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("flow-field");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: false });
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mouseX = -9999, mouseY = -9999;
  var time = 0, particles = [];
  var W = 0, H = 0;

  var WRAP = 15; /* margin where dots wrap to the opposite edge */

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

  function isMobile() {
    return W < 768;
  }

  /* Generate the fixed population once — nothing is ever removed. */
  function spawn() {
    var count = isMobile() ? 300 : 900;
    var sizeMul = isMobile() ? 0.75 : 1;
    particles = [];
    for (var i = 0; i < count; i++) particles.push(makeParticle(sizeMul));
  }

  function makeParticle(sizeMul) {
    var r = Math.random();
    var small = r < 0.78;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      size: small
        ? (Math.random() * 0.8 + 0.35) * sizeMul
        : (Math.random() * 1.3 + 0.9) * sizeMul,
      alpha: (small
        ? Math.random() * 0.22 + 0.12
        : Math.random() * 0.35 + 0.18) * palette.alphaMul,
      warm: Math.random() < 0.07
    };
  }

  /* Flow field: a sum of sines/cosines over x, y and time. The curl
     (rotated gradient) gives each particle its velocity, which is what
     bends the dots into those circular, swirling paths. The 110 scale
     is the field's speed; lower = slower drift. */
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
    return [dPdy * 110, -dPdx * 110];
  }

  /* Draw a small glowing "star" dot. */
  function drawDot(p) {
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

      /* Solid clear every frame — nothing accumulates. */
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

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
          p.x += (dx / d) * f * 1.6;
          p.y += (dy / d) * f * 1.6;
        }

        /* Never despawn: wrap around the edges so the population
           stays constant and the screen never empties. */
        if (p.x < -WRAP) p.x = W + WRAP;
        else if (p.x > W + WRAP) p.x = -WRAP;
        if (p.y < -WRAP) p.y = H + WRAP;
        else if (p.y > H + WRAP) p.y = -WRAP;

        drawDot(p);
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
