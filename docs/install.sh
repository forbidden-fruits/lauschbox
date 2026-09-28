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

# Konfigurationsordner + Sperrliste + Einstellungen
mkdir -p "$CONFIG_DIR"
if [ -f "$CONFIG_DIR/blocklist.txt" ]; then
  echo "→ blocklist.txt existiert bereits in $CONFIG_DIR — wird nicht überschrieben"
else
  echo "→ Lade blocklist.txt nach $CONFIG_DIR"
  curl -fsSL "$BASE/blocklist.txt" -o "$CONFIG_DIR/blocklist.txt"
fi

if [ -f "$CONFIG_DIR/lauschbox.env" ]; then
  echo "→ lauschbox.env existiert bereits in $CONFIG_DIR — wird nicht überschrieben"
else
  cat > "$CONFIG_DIR/lauschbox.env" <<'EOF'
# lauschbox Einstellungen
# Maximale Zeilen im Puffer der DNS-Logging-Ansicht (Ringpuffer)
LOG_MAX_LINES=1000
# Maximale Zeilen aus blocklist.txt in der Sperrlisten-Anzeige
BLOCKLIST_MAX_LINES=1000
EOF
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
echo "   Konfiguration, blocklist.txt & lauschbox.env: $CONFIG_DIR"
echo "   (lauschbox sucht Konfigdateien zuerst im aktuellen Verzeichnis, dann in $CONFIG_DIR)"
echo "   Puffer-Limits einstellen in: $CONFIG_DIR/lauschbox.env"
echo "   Start mit:  lauschbox"
