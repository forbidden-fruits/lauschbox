// lauschbox — GitHub Pages
const INSTALL_CMD =
  "curl -fsSL https://forbidden-fruits.github.io/lauschbox/install.sh | sh";

// Install-Befehl in alle Boxen einsetzen
for (const id of ["install-cmd", "install-cmd-2"]) {
  const el = document.getElementById(id);
  if (el) el.textContent = INSTALL_CMD;
}

// Copy-to-Clipboard mit Toast
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
      // Fallback für ältere Browser / http-Kontext
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("✓ In Zwischenablage kopiert");
      } catch {
        showToast("⚠️ Kopieren fehlgeschlagen");
      }
      ta.remove();
    }
  });
}

// Logging-Screenshot: Zeilen nacheinander einblenden, sobald sichtbar
const logview = document.getElementById("logview");
if (logview) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    logview.classList.add("revealed");
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            logview.classList.add("revealed");
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(logview);
  }
}

// Jahr im Footer
document.getElementById("year").textContent = new Date().getFullYear();
