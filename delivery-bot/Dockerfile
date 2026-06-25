# Build stage: compile the ZenithProxy delivery plugin
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build
COPY . .

RUN ./gradlew build

# Runtime stage: ZenithProxy with the delivery plugin
FROM eclipse-temurin:21-jre

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    unzip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv so the ZenithProxy launcher can manage its own Python venv.
RUN curl -fsSL https://astral.sh/uv/install.sh | sh && \
    mv /root/.local/bin/uv /usr/local/bin/uv

WORKDIR /zenith

# Download and extract the ZenithProxy Python launcher.
ARG ZENITH_LAUNCHER_URL=https://github.com/rfresh2/ZenithProxy/releases/download/launcher-v3/ZenithProxy-launcher-python.zip
RUN curl -L -o /tmp/zenith-launcher.zip ${ZENITH_LAUNCHER_URL} \
    && unzip -o /tmp/zenith-launcher.zip -d /zenith \
    && rm /tmp/zenith-launcher.zip \
    && chmod +x /zenith/launch.sh

# Pre-configure the launcher to use the Java release channel (required for plugins).
RUN printf '{\n  "auto_update": true,\n  "auto_update_launcher": true,\n  "release_channel": "java.1.21.4",\n  "version": "0.0.0",\n  "local_version": "0.0.0",\n  "repo_owner": "rfresh2",\n  "repo_name": "ZenithProxy"\n}\n' > /zenith/launch_config.json

# Copy the built plugin into the plugins folder.
COPY --from=builder /build/build/libs/*.jar /zenith/plugins/

# Bot configuration and account cache are supplied via bind-mount at runtime.
VOLUME ["/zenith/config"]

ENV ZENITH_DISCORD_DISABLED=true \
    ZENITH_PLATFORM=java \
    ZENITH_MC_VERSION=1.21.4

ENTRYPOINT ["/zenith/launch.sh", "--unattended", "--env-config"]
