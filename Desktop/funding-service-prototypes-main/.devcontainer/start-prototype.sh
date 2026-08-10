#!/usr/bin/env bash
# Runs on every attach (see postAttachCommand in devcontainer.json).
# Only starts the kit if nothing is already listening on the kit's port
# (3014, set in app/config.json), so reconnecting to a running codespace
# doesn't spawn a second server.
if curl --silent --output /dev/null --max-time 2 http://localhost:3014; then
  echo "Prototype kit is already running on port 3014."
else
  npm run dev
fi
