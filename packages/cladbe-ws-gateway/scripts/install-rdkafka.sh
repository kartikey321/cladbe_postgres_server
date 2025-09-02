#!/usr/bin/env bash
set -euo pipefail

# --- Config you can tweak if needed ---
export BUILD_LIBRDKAFKA=0
export PKG_CONFIG_PATH=${PKG_CONFIG_PATH:-/usr/local/lib/pkgconfig}
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH:-/usr/local/lib}
export npm_config_unsafe_perm=${npm_config_unsafe_perm:-true}
export JOBS=${JOBS:-1}
# --------------------------------------

echo "[rdkafka] Ensuring /usr/local/lib is in the runtime linker path..."
if [ ! -f /etc/ld.so.conf.d/usr-local.conf ] || ! grep -q "/usr/local/lib" /etc/ld.so.conf.d/usr-local.conf; then
  echo "  -> writing /etc/ld.so.conf.d/usr-local.conf (requires sudo)"
  echo "/usr/local/lib" | sudo tee /etc/ld.so.conf.d/usr-local.conf >/dev/null
  sudo ldconfig
else
  echo "  -> already set"
fi

echo "[rdkafka] pkg-config check:"
pkg-config --modversion rdkafka || { echo "  !! rdkafka.pc not found in PKG_CONFIG_PATH=$PKG_CONFIG_PATH"; exit 1; }
pkg-config --variable=includedir rdkafka

echo "[rdkafka] Rebuilding node-rdkafka from source with env above..."
# Rebuild only this dependency, no recursive installs
npm rebuild node-rdkafka --build-from-source --foreground-scripts

echo "[rdkafka] Verifying linkage to /usr/local..."
NODE_MODULE_PATH="node_modules/node-rdkafka/build/Release/node-librdkafka.node"
if [ ! -f "$NODE_MODULE_PATH" ]; then
  echo "  !! Could not find $NODE_MODULE_PATH"
  exit 1
fi
ldd "$NODE_MODULE_PATH" | grep -E 'librdkafka(\+\+)?\.so' || true

echo "[rdkafka] Done."