// lauschbox — GitHub Pages
const INSTALL_CMD =
  "curl -fsSL https://forbidden-fruits.github.io/lauschbox/install.sh | sh";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Install-Befehl in alle Boxen einsetzen
for (const id of ["install-cmd", "install-cmd-2", "install-cmd-3"]) {
  const el = document.getElementById(id);
  if (el) el.textContent = INSTALL_CMD;
}

// ---------- Copy-to-Clipboard mit Toast ----------
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}
for (const btn of document.querySelectorAll(".copy-btn")) {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.copy);
    const text = target ? target.textContent : INSTALL_CMD;
    try {
      await navigator.clipboard.writeText(text);
      showToast("✓ In Zwischenablage kopiert");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showToast("✓ In Zwischenablage kopiert"); }
      catch { showToast("⚠️ Kopieren fehlgeschlagen"); }
      ta.remove();
    }
  });
}

// ---------- OS-Tabs ----------
for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => {
    for (const t of document.querySelectorAll(".tab")) {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
    }
    for (const p of document.querySelectorAll(".tabpane"))
      p.classList.toggle("active", p.dataset.pane === tab.dataset.tab);
  });
}

// ---------- Cursor-Glow auf Karten ----------
for (const el of document.querySelectorAll(".spot")) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

// ---------- Scroll-Reveal ----------
const revealEls = document.querySelectorAll(
  ".section > *, .card, .flow-step, .step, .panel, .faq details, .cta > *"
);
for (const el of revealEls) el.classList.add("reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  for (const el of revealEls) el.classList.add("in");
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 60}ms`;
    io.observe(el);
  });
}

// ---------- Interaktive Demo (Simulation) ----------
(() => {
  const term = document.getElementById("demo-term");
  if (!term) return;
  const $ = (id) => document.getElementById(id);
  const logEl = $("d-log"), ruleEl = $("d-rule"), statusEl = $("d-status");
  const tgEl = $("d-tg"), tgTxt = $("d-tg-txt");

  const DEVICES = [
    ["Mac", "192.168.179.129"],
    ["iPhone", "192.168.179.154"],
    ["iPad", "192.168.179.126"],
    ["smarthome", "192.168.179.100"],
    ["Samsung-TV", "192.168.179.53"],
  ];
  const OK_DOMAINS = [
    "time.apple.com", "api.github.com", "eu-west-1.amazonaws.com", "heise.de",
    "example.com", "cdn.jsdelivr.net", "mask.icloud.com", "ocsp.digicert.com",
    "youtube.com", "fonts.gstatic.com", "spiegel.de", "connectivitycheck.gstatic.com",
  ];
  const HIT_DOMAINS = ["ads.tracker-example.net", "telemetry.example.com", "pornhub.com", "xvideos.com", "doubleclick.net"];
  const MAX_ROWS = 14;
  const SPARK = "▁▂▃▄▅▆▇█";

  const st = { g: true, s: false, t: false, p: false, l: false, w: false };
  let total = 0, hits = 0, held = 0;
  const rows = [];          // sichtbare Zeilen (Records)
  let buckets = new Array(16).fill(0), cur = 0;
  let msg = "", msgTimer;
  let tgTimer;

  const pad = (n) => String(n).padStart(2, "0");
  const now = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  function lineHTML(r) {
    return `<div class="dl${r.hit ? " hit" : ""}"><span class="gut">${r.hit ? "▌" : ""}</span>` +
      `<span class="c-dim">${r.ts}</span><span class="c-sky">${esc(r.name)}</span>` +
      `<span class="c-blue ip">${r.ip}</span><span class="dom c-text">${esc(r.dom)}</span></div>`;
  }
  function renderLog() {
    logEl.innerHTML = rows.map(lineHTML).join("");
  }
  function appendRow(r) {
    rows.push(r);
    if (rows.length > MAX_ROWS) rows.shift();
    logEl.insertAdjacentHTML("beforeend", lineHTML(r));
    while (logEl.children.length > MAX_ROWS) logEl.firstChild.remove();
  }

  function renderRule() {
    const chip = st.g ? "📱 Mac, iPhone" : "📱 alle Geräte (Filter aus)";
    ruleEl.innerHTML = `── <span class="chip">${chip}${st.s ? "  ·  🚫 nur Sperrliste (104)" : ""}  ·  1-lan</span> ──────────`;
  }
  function renderStatus() {
    const max = Math.max(1, ...buckets);
    const spark = buckets.map((v) => (v ? SPARK[Math.min(7, Math.floor((v * 7) / max))] : "▁")).join("");
    const sum = buckets.slice(-10).reduce((a, b) => a + b, 0);
    const state = st.p
      ? `<span class="c-yellow">⏸ PAUSE${held ? ` <span class="c-dim">(+${held} neu)</span>` : ""}</span>`
      : `<span class="c-green">● LIVE</span>`;
    statusEl.innerHTML = `${state}<span class="d-spark">${spark}</span>` +
      `<span class="c-text">Σ ${total}</span><span class="c-red">🚫 ${hits}</span>` +
      `<span class="c-text">${(sum / 10).toFixed(1)}/s</span>` +
      (msg ? `<span class="c-peach">${esc(msg)}</span>` : "");
  }
  function renderKeys() {
    for (const t of term.querySelectorAll(".tog")) {
      const k = t.dataset.t;
      t.classList.toggle("on", !!st[k]);
    }
    const tBtn = term.querySelector('[data-k="t"]');
    tBtn.classList.toggle("dis", !st.s);
  }
  function say(m) {
    msg = m;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msg = ""; renderStatus(); }, 4000);
    renderStatus();
  }
  function showTg(r) {
    tgTxt.innerHTML = `<b>🚨 lauschbox: Sperrlisten-Treffer</b><span>Gerät: ${esc(r.name)} (${r.ip})</span><span>Domain: ${esc(r.dom)}</span>`;
    tgEl.classList.add("show");
    clearTimeout(tgTimer);
    tgTimer = setTimeout(() => tgEl.classList.remove("show"), 3600);
  }

  let lastTg = 0;
  function emit() {
    const hitRoll = Math.random() < (st.s ? 0.55 : 0.16);
    const dev = st.g ? pick(DEVICES.slice(0, 2)) : pick(DEVICES);
    const hit = hitRoll;
    const r = { ts: now(), name: dev[0], ip: dev[1], dom: hit ? pick(HIT_DOMAINS) : pick(OK_DOMAINS), hit };
    if (st.s && !hit) return;
    total++; cur++;
    if (hit) {
      hits++;
      if (st.t && Date.now() - lastTg > 4500) { lastTg = Date.now(); showTg(r); }
    }
    if (st.p) { held++; renderStatus(); return; }
    appendRow(r);
    renderStatus();
  }

  function press(k) {
    switch (k) {
      case "g": st.g = !st.g; say(st.g ? "Gerätefilter an: Mac, iPhone" : "Gerätefilter aus — alle Geräte"); renderRule(); break;
      case "e": say("Öffnet die Geräteauswahl (in der echten App)"); break;
      case "s":
        st.s = !st.s;
        say(st.s ? "Sperrliste an (104 Einträge) — nur Treffer" : "Sperrliste aus — alle Anfragen");
        renderRule(); break;
      case "t":
        st.t = !st.t; say(st.t ? "Telegram-Benachrichtigung an" : "Telegram-Benachrichtigung aus");
        if (!st.t) tgEl.classList.remove("show"); break;
      case "p":
        st.p = !st.p;
        if (!st.p && held) { held = 0; }
        say(st.p ? "Angehalten — Log läuft im Hintergrund weiter" : "Live-Ansicht"); break;
      case "l": st.l = !st.l; say(st.l ? "Datei-Log an → ~/.config/lauschbox/dns.log" : "Datei-Log aus"); break;
      case "w": st.w = !st.w; say(st.w ? "Web-UI an → http://fritzbox-mac:8080" : "Web-UI aus"); break;
      case "c": rows.length = 0; total = hits = held = 0; buckets.fill(0); cur = 0; renderLog(); say("Puffer und Zähler geleert"); break;
      default: return;
    }
    renderKeys(); renderStatus();
  }

  for (const b of term.querySelectorAll(".key")) b.addEventListener("click", () => press(b.dataset.k));
  term.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if ("gestplc".includes(k) && k.length === 1) { e.preventDefault(); press(k); }
  });

  // Startzustand: ein paar Zeilen vorbefüllen
  const seed = [
    ["smarthome", "192.168.179.100", "eu-west-1.amazonaws.com", 0],
    ["iPad", "192.168.179.126", "iPad.local", 0],
    ["Mac", "192.168.179.129", "heise.de", 0],
    ["Mac", "192.168.179.129", "pornhub.com", 1],
    ["iPhone", "192.168.179.154", "time.apple.com", 0],
  ];
  const base = Date.now() - seed.length * 3000;
  seed.forEach((s, i) => {
    const d = new Date(base + i * 3000);
    rows.push({ ts: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, name: s[0], ip: s[1], dom: s[2], hit: !!s[3] });
    total++; if (s[3]) hits++;
  });
  buckets[buckets.length - 1] = 2;
  renderLog(); renderRule(); renderKeys(); renderStatus();

  if (reduceMotion) return;

  // Nur simulieren, solange die Demo sichtbar ist
  let visible = false, tick = 0, nextEmit = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.15 }).observe(term);
  setInterval(() => {
    if (!visible || document.hidden) return;
    tick++;
    buckets.push(cur); cur = 0; buckets.shift();
    renderStatus();
  }, 1000);
  (function loop() {
    if (visible && !document.hidden) {
      const burst = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < burst; i++) emit();
    }
    setTimeout(loop, 500 + Math.random() * 900);
  })();
})();

// Jahr im Footer
document.getElementById("year").textContent = new Date().getFullYear();
