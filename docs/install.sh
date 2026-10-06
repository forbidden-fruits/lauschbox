#!/bin/sh
# lauschbox Installer (macOS & Linux)
# Aufruf: curl -fsSL https://forbidden-fruits.github.io/lauschbox/install.sh | sh
set -eu

REPO="forbidden-fruits/lauschbox"
BRANCH="main"
BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"
DEST_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
DEST="$DEST_DIR/lauschbox"
CONFIG_DIR="$HOME/.config/lauschbox"

echo "📡 lauschbox Installer"
echo "→ Ziel: $DEST"

mkdir -p "$DEST_DIR"
echo "→ Lade lauschbox ($BASE/lauschbox)"
curl -fsSL "$BASE/lauschbox" -o "$DEST"
chmod +x "$DEST"

# Konfigurationsordner + Sperrliste + Web-UI-Seite + Einstellungen
mkdir -p "$CONFIG_DIR"
if [ -f "$CONFIG_DIR/blocklist.txt" ]; then
  echo "→ blocklist.txt existiert bereits in $CONFIG_DIR — wird nicht überschrieben"
else
  echo "→ Lade blocklist.txt nach $CONFIG_DIR"
  curl -fsSL "$BASE/blocklist.txt" -o "$CONFIG_DIR/blocklist.txt"
fi

# web.html wird bei jedem Install aktualisiert; eine abweichende vorhandene Datei wird gesichert
echo "→ Lade web.html nach $CONFIG_DIR"
curl -fsSL "$BASE/web.html" -o "$CONFIG_DIR/web.html.new"
if [ -f "$CONFIG_DIR/web.html" ] && ! cmp -s "$CONFIG_DIR/web.html" "$CONFIG_DIR/web.html.new"; then
  BACKUP="$CONFIG_DIR/web_html_$(date +%Y%m%d-%H%M%S).backup"
  cp "$CONFIG_DIR/web.html" "$BACKUP"
  echo "→ Bisherige web.html gesichert: $BACKUP"
fi
mv -f "$CONFIG_DIR/web.html.new" "$CONFIG_DIR/web.html"

if [ -f "$CONFIG_DIR/lauschbox.env" ]; then
  echo "→ lauschbox.env existiert bereits in $CONFIG_DIR — wird nicht überschrieben"
else
  cat > "$CONFIG_DIR/lauschbox.env" <<'EOF'
# lauschbox Einstellungen
# Maximale Zeilen im Puffer der DNS-Logging-Ansicht (Ringpuffer)
LOG_MAX_LINES=1000
# Maximale Zeilen aus blocklist.txt in der Sperrlisten-Anzeige
BLOCKLIST_MAX_LINES=1000
# Schnittstelle der Fritzbox-Aufzeichnung
CAPTURE_IFACE=1-lan
# Identische Anfragen (Gerät+Domain) innerhalb n Sekunden ausblenden; 0 = aus
DEDUPE_SECS=2
# Telegram: gleicher Treffer frühestens nach n Sekunden erneut melden; 0 = aus
NOTIFY_COOLDOWN=30
# Geräteliste (Namensauflösung) alle n Sekunden auffrischen; 0 = aus
DEVICE_REFRESH_SECS=300
# Port der Web-UI (Taste w im Logging), 1024-65535
WEB_PORT=8080
# Eigene Seite der Web-UI (absoluter Pfad); Vorrang vor ./web.html und ~/.config/lauschbox/web.html
#WEB_HTML=/Users/dein-name/web.html
# Basic Auth der Web-UI: nur aktiv, wenn BEIDE gesetzt sind (Benutzer ohne ':'); sonst bleibt die Web-UI offen
# Achtung: Klartext in dieser Datei, Übertragung unverschlüsselt (HTTP) — Datei mit chmod 600 schützen
#WEB_USER=dein-name
#WEB_PASS=dein-passwort
# Ziel des Datei-Logs (Taste l) — absoluter Pfad, ~ und $HOME werden nicht aufgelöst
# Standard: ~/.config/lauschbox/dns.log
#LOG_FILE=/Users/dein-name/.config/lauschbox/dns.log
EOF
  chmod 600 "$CONFIG_DIR/lauschbox.env"
  echo "→ lauschbox.env mit Standard-Limits nach $CONFIG_DIR geschrieben"
fi

# Abhängigkeiten prüfen
missing=""
for t in figlet curl tshark python3; do
  command -v "$t" >/dev/null 2>&1 || missing="$missing $t"
done

if [ -n "$missing" ]; then
  echo "⚠️  Fehlende Werkzeuge:$missing"
  if [ "$(uname -s)" = "Darwin" ]; then
    pkgs=""
    for t in $missing; do
      case $t in
        tshark)  pkgs="$pkgs wireshark" ;;
        python3) pkgs="$pkgs python" ;;
        *)       pkgs="$pkgs $t" ;;
      esac
    done
    echo "   Installieren mit:  brew install$pkgs"
  else
    echo "   Installieren mit:  sudo apt-get install$missing"
  fi
fi

# PATH-Hinweis
case ":$PATH:" in
  *":$DEST_DIR:"*) ;;
  *) echo "ℹ️  $DEST_DIR ist nicht im PATH — ergänze in ~/.zshrc bzw. ~/.bashrc:"
     echo "   export PATH=\"$DEST_DIR:\$PATH\"" ;;
esac

echo "✅ Installiert: $DEST"
echo "   Konfiguration, blocklist.txt, web.html & lauschbox.env: $CONFIG_DIR"
echo "   (lauschbox sucht Konfigdateien zuerst im aktuellen Verzeichnis, dann in $CONFIG_DIR)"
echo "   Puffer-Limits einstellen in: $CONFIG_DIR/lauschbox.env"
echo "   Start mit:  lauschbox"
