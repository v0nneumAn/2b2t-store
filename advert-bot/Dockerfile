# Build stage: compile the ZenithProxy advert plugin
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build
COPY plugin ./plugin

RUN cd plugin && ./gradlew build

# Runtime stage: ZenithProxy with the advert plugin
FROM eclipse-temurin:21-jre

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    unzip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /zenith

# Download and extract the ZenithProxy Python launcher.
ARG ZENITH_LAUNCHER_URL=https://github.com/rfresh2/ZenithProxy/releases/download/launcher-v3/ZenithProxy-launcher-python.zip
RUN curl -L -o /tmp/zenith-launcher.zip ${ZENITH_LAUNCHER_URL} \
    && unzip -o /tmp/zenith-launcher.zip -d /zenith \
    && rm /tmp/zenith-launcher.zip \
    && chmod +x /zenith/launch.sh

# Copy the built plugin into the plugins folder.
COPY --from=builder /build/plugin/build/libs/*.jar /zenith/plugins/

# Bot configuration is supplied via bind-mount at runtime.
VOLUME ["/zenith/advert-bot/config"]

ENV ZENITH_DISCORD_DISABLED=true \
    ZENITH_PLATFORM=java \
    ZENITH_MC_VERSION=1.21.4

ENTRYPOINT ["/zenith/launch.sh"]
