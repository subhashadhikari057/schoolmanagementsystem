#!/usr/bin/env bash
# ============================================================================
# Generate JWT RSA keypair and print base64 strings for .env
# - Uses passphrase: "apple banana orange"
# - Produces .b64 files and an env snippet for copy/paste
# ============================================================================
set -euo pipefail
PASS="apple banana orange"
OUT_DIR="${1:-.}"
PRIVATE_PEM="$OUT_DIR/private.pem"
PUBLIC_PEM="$OUT_DIR/public.pem"
PRIVATE_B64="$OUT_DIR/private.b64"
PUBLIC_B64="$OUT_DIR/public.b64"
SNIPPET="$OUT_DIR/jwt-env-snippet.txt"

echo "🔐 Generating RSA keypair in: $OUT_DIR"

# Generate encrypted private key (PKCS#8 by default)
openssl genpkey -algorithm RSA -aes256 -pass pass:"$PASS" -out "$PRIVATE_PEM"

# Extract public key
openssl rsa -pubout -in "$PRIVATE_PEM" -passin pass:"$PASS" -out "$PUBLIC_PEM"

# Base64 encode (single line)
base64 -w 0 "$PRIVATE_PEM" > "$PRIVATE_B64"
base64 -w 0 "$PUBLIC_PEM" > "$PUBLIC_B64"

# Build env snippet
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
echo " - $SNIPPET (copy/paste into your .env)"
echo ""
echo "Passphrase used: \"$PASS\""
echo "Remove key files if not needed: rm -f \"$PRIVATE_PEM\" \"$PUBLIC_PEM\""
