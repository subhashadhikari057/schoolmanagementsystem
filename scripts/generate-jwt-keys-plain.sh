#!/usr/bin/env bash
# ============================================================================
# Generate RSA keypair for JWT (unencrypted, ready for RS256)
# Produces:
#   - private.pem / public.pem
#   - private.b64 / public.b64 (single-line base64)
#   - jwt-env-snippet.txt (ready to paste into .env)
# ============================================================================
set -euo pipefail

OUT_DIR="${1:-.}"
PRIVATE_PEM="$OUT_DIR/private.pem"
PUBLIC_PEM="$OUT_DIR/public.pem"
PRIVATE_B64="$OUT_DIR/private.b64"
PUBLIC_B64="$OUT_DIR/public.b64"
SNIPPET="$OUT_DIR/jwt-env-snippet.txt"

echo "🔐 Generating RSA keypair (no passphrase) in: $OUT_DIR"

# 1) Private key (unencrypted)
openssl genpkey -algorithm RSA -out "$PRIVATE_PEM"

# 2) Public key
openssl rsa -pubout -in "$PRIVATE_PEM" -out "$PUBLIC_PEM"

# 3) Base64 encode to single lines
base64 -w 0 "$PRIVATE_PEM" > "$PRIVATE_B64"
base64 -w 0 "$PUBLIC_PEM" > "$PUBLIC_B64"

# 4) Build .env snippet
cat > "$SNIPPET" <<EOF
JWT_PRIVATE_KEY_BASE64="$(cat "$PRIVATE_B64")"
JWT_PUBLIC_KEY_BASE64="$(cat "$PUBLIC_B64")"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ACCESS_TOKEN_EXPIRES_IN="900000"
REFRESH_TOKEN_EXPIRES_IN="604800000"
EOF

echo "✅ Done. Files created:"
echo " - $PRIVATE_PEM"
echo " - $PUBLIC_PEM"
echo " - $PRIVATE_B64"
echo " - $PUBLIC_B64"
echo " - $SNIPPET (copy/paste into backend/.env)"
echo ""
echo "If you don't need the .pem files afterward: rm -f \"$PRIVATE_PEM\" \"$PUBLIC_PEM\""
