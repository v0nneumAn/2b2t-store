#!/usr/bin/env bash
# =============================================================================
# 2b2t-like Paper test server setup
# =============================================================================
# Downloads Paper 1.20.1 and installs plugins used on 2b2t to make the test
# environment as close to production as possible:
#   - GrimAC    (anti-cheat)
#   - ViaVersion + ViaBackwards + ViaRewind (multi-version client support)
#   - ProtocolLib (packet utilities, dependency for many plugins)
#
# Usage:
#   ./setup-paper-server.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${SCRIPT_DIR}/../server"
PLUGINS_DIR="${SERVER_DIR}/plugins"
mkdir -p "$SERVER_DIR" "$PLUGINS_DIR"
cd "$SERVER_DIR"

PAPER_VERSION="1.20.1"
PAPER_BUILD="196"
JAR_NAME="paper-${PAPER_VERSION}-${PAPER_BUILD}.jar"

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

download() {
    local url="$1"
    local dest="$2"
    if [[ -f "$dest" ]]; then
        echo "Already exists: $(basename "$dest")"
        return 0
    fi
    echo "Downloading: $url"
    wget -q "$url" -O "$dest"
}

fetch_latest_github_jar() {
    local repo="$1"      # owner/repo
    local asset_name="$2" # substring to match in asset name, or "_first_"
    local api_url="https://api.github.com/repos/${repo}/releases/latest"
    if [[ "$asset_name" == "_first_" ]]; then
        curl -s "$api_url" | python3 -c "import sys,json; d=json.load(sys.stdin); assets=d.get('assets',[]); print(assets[0]['browser_download_url'] if assets else '')"
    else
        curl -s "$api_url" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(a['browser_download_url']) for a in d.get('assets',[]) if '${asset_name}' in a['name']]"
    fi
}

fetch_modrinth_primary() {
    local project_id="$1"
    curl -s "https://api.modrinth.com/v2/project/${project_id}/version" \
        | python3 -c "import sys,json; data=json.load(sys.stdin); files=data[0].get('files',[]) if data else []; primary=[f for f in files if f.get('primary')]; print((primary[0] if primary else files[0])['url'] if files else '')"
}

# -----------------------------------------------------------------------------
# Paper server jar
# -----------------------------------------------------------------------------

if [[ ! -f "$JAR_NAME" ]]; then
    download "https://api.papermc.io/v2/projects/paper/versions/${PAPER_VERSION}/builds/${PAPER_BUILD}/downloads/${JAR_NAME}" "$JAR_NAME"
fi

# -----------------------------------------------------------------------------
# Plugins
# -----------------------------------------------------------------------------

# GrimAC (Modrinth)
GRIM_URL=$(fetch_modrinth_primary "LJNGWSvH")
if [[ -n "$GRIM_URL" ]]; then
    download "$GRIM_URL" "${PLUGINS_DIR}/grimac.jar"
else
    echo "WARNING: Could not fetch GrimAC URL. Download manually from https://modrinth.com/plugin/grimac"
fi

# ViaVersion / ViaBackwards / ViaRewind (GitHub releases)
download "$(fetch_latest_github_jar ViaVersion/ViaVersion ViaVersion)" "${PLUGINS_DIR}/ViaVersion.jar"
download "$(fetch_latest_github_jar ViaVersion/ViaBackwards ViaBackwards)" "${PLUGINS_DIR}/ViaBackwards.jar"
download "$(fetch_latest_github_jar ViaVersion/ViaRewind ViaRewind)" "${PLUGINS_DIR}/ViaRewind.jar"

# ProtocolLib (GitHub releases)
download "$(fetch_latest_github_jar dmulloy2/ProtocolLib _first_)" "${PLUGINS_DIR}/ProtocolLib.jar"

# -----------------------------------------------------------------------------
# EULA
# -----------------------------------------------------------------------------

if [[ ! -f eula.txt ]]; then
    echo "eula=true" > eula.txt
fi

# -----------------------------------------------------------------------------
# server.properties (2b2t-like anarchy settings)
# -----------------------------------------------------------------------------

cat > server.properties <<EOF
# 2b2t-like test server
server-port=25565
online-mode=false
motd=\\u00A742b2t Store Test Server\\u00A7r - Anarchy
max-players=20
spawn-protection=0
gamemode=survival
difficulty=hard
pvp=true
allow-flight=false
view-distance=10
simulation-distance=10
entity-broadcast-range-percentage=100
max-world-size=29999984
enable-command-block=false
enable-query=false
enable-rcon=false
prevent-proxy-connections=false
enforce-secure-profile=false
snooper-enabled=false
resource-pack=
resource-pack-prompt=
resource-pack-sha1=
require-resource-pack=false
white-list=false
enforce-whitelist=false
EOF

# -----------------------------------------------------------------------------
# Start script
# -----------------------------------------------------------------------------

cat > start.sh <<EOF
#!/usr/bin/env bash
cd "\$(dirname "\$0")"
exec java -Xmx2G -Xms2G -jar "$JAR_NAME" nogui
EOF
chmod +x start.sh

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------

echo ""
echo "============================================================"
echo "2b2t-like Paper test server ready in:"
echo "  $SERVER_DIR"
echo ""
echo "Installed plugins:"
ls -1 "$PLUGINS_DIR" | sed 's/^/  - /'
echo ""
echo "Start with: ./paper-server/server/start.sh"
echo "============================================================"
