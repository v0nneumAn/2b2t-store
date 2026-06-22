#!/bin/bash
# Run this on the testbed VM after first boot if cloud-init did not cover everything.
# Or use it standalone on a fresh Ubuntu 24.04 install.

set -e

sudo apt-get update
sudo apt-get install -y \
    curl wget git tmux screen ca-certificates gnupg lsb-release unzip net-tools jq \
    python3 python3-pip python3-venv openjdk-21-jdk nodejs npm

# Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$(whoami)"
fi

# uv
if ! command -v uv &> /dev/null; then
    curl -fsSL https://astral.sh/uv/install.sh | bash
fi

# Git config
git config --global user.name "shulker-mechanic"
git config --global user.email "shulker-mechanic@users.noreply.github.com"

# Clone skeleton if not present
if [ ! -d "$HOME/2b2t-store" ]; then
    git clone git@github-skeleton:Shulker-Shop/skeleton.git "$HOME/2b2t-store"
fi

echo "Testbed setup complete. Log out and back in for docker group to take effect."
