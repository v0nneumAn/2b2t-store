#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${SCRIPT_DIR}/../server"
mkdir -p "$SERVER_DIR"
cd "$SERVER_DIR"

PAPER_VERSION="1.20.1"
PAPER_BUILD="196"
JAR_NAME="paper-${PAPER_VERSION}-${PAPER_BUILD}.jar"

if [[ ! -f "$JAR_NAME" ]]; then
    echo "Downloading Paper ${PAPER_VERSION} build ${PAPER_BUILD}..."
    wget "https://api.papermc.io/v2/projects/paper/versions/${PAPER_VERSION}/builds/${PAPER_BUILD}/downloads/${JAR_NAME}" -O "$JAR_NAME"
fi

# Accept EULA
echo "eula=true" > eula.txt

# Configure for offline mode bot testing
cat > server.properties <<EOF
server-port=25565
online-mode=false
motd=2b2t Store Test Server
gamemode=survival
max-players=20
spawn-protection=0
view-distance=10
simulation-distance=10
enable-command-block=false
EOF

cat > start.sh <<EOF
#!/usr/bin/env bash
cd "\$(dirname "\$0")"
exec java -Xmx2G -Xms2G -jar "$JAR_NAME" nogui
EOF
chmod +x start.sh

echo "Paper server ready in $SERVER_DIR"
echo "Start with: ./paper-server/server/start.sh"
