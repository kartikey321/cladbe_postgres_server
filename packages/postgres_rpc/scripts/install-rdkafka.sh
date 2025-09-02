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

echo "[rdkafka] Resolving installed node-rdkafka package directory..."
PKG_DIR="$(node -p "require('path').dirname(require.resolve('node-rdkafka/package.json'))")" || {
  echo "  !! Could not resolve node-rdkafka via Node. Is it installed?"
  exit 1
}
echo "  -> resolved: $PKG_DIR"

echo "[rdkafka] Verifying linkage to /usr/local..."
NODE_MODULE_PATH="$PKG_DIR/build/Release/node-librdkafka.node"
echo "  -> addon path: $NODE_MODULE_PATH"

if [ ! -f "$NODE_MODULE_PATH" ]; then
  echo "  !! Addon not found at $NODE_MODULE_PATH"
  echo "  -> attempting local rebuild inside resolved package dir..."
  ( cd "$PKG_DIR" && npm rebuild --build-from-source --foreground-scripts )
fi

if [ ! -f "$NODE_MODULE_PATH" ]; then
  echo "  !! Still could not find addon at $NODE_MODULE_PATH"
  echo "     Ensure the package built successfully."
  exit 1
fi

echo "  -> ldd check:"
if ! ldd "$NODE_MODULE_PATH" | grep -E 'librdkafka(\+\+)?\.so' >/dev/null 2>&1; then
  echo "  !! ldd did not show librdkafka linkage. Running ldconfig and showing ldd output:"
  sudo ldconfig
  ldd "$NODE_MODULE_PATH" || true
  echo "  -> If librdkafka is still missing, confirm it exists under /usr/local/lib and PKG_CONFIG_PATH points to its .pc file."
else
  ldd "$NODE_MODULE_PATH" | grep -E 'librdkafka(\+\+)?\.so' || true
fi

echo "[rdkafka] Done."