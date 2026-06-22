# 2b2t Store Testbed VM

Sandboxed Proxmox VM for building, testing, and running the advert/delivery bots.

## Purpose

- Offload builds and Docker Compose tests from the dev host.
- Provide an isolated environment for running ZenithProxy instances.
- Serve as a staging area before deploying to production hosts.

## Provisioning

1. Create an Ubuntu 24.04 VM in Proxmox VE.
2. Attach the `user-data.yml` cloud-init config (or paste its contents into Proxmox cloud-init).
3. Start the VM and wait for cloud-init to finish.
4. Note the VM IP address.

## Access

This workspace contains an SSH key pair for the testbed:

- **Public key:** `infra/testbed/kimi-testbed.pub`
- **Private key:** `infra/testbed/kimi-testbed` (gitignored)

From this workspace, connect with:

```bash
ssh -i infra/testbed/kimi-testbed kimi@<vm-ip>
```

## Software installed

- Docker + Docker Compose plugin
- OpenJDK 21
- Python 3 + pip + uv
- Node.js + npm
- Git (configured with project identity)
- tmux, screen

## Usage

Once logged in:

```bash
cd ~/2b2t-store

# Build advert plugin
cd advert-bot/plugin
./gradlew build

# Run local advert test harness
cd ../scripts
./run-local-test.sh
```

## Security

- The VM should be on an isolated network or VLAN if possible.
- The SSH key is session-scoped; regenerate it if the session is destroyed.
- Do not commit the private key (`infra/testbed/kimi-testbed`) to Git.
