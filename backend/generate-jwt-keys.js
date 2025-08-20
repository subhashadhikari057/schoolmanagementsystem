const crypto = require('crypto');
const fs = require('fs');

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Convert to base64
const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

console.log('🔐 Generated JWT RSA Key Pair');
console.log('\n📝 Add these to your .env file:');
console.log('\nJWT_PRIVATE_KEY_BASE64=' + privateKeyBase64);
console.log('JWT_PUBLIC_KEY_BASE64=' + publicKeyBase64);
console.log('\n⏰ JWT Expiration Settings:');
console.log('JWT_ACCESS_EXPIRES_IN=15m');
console.log('JWT_REFRESH_EXPIRES_IN=7d');

// Save to .env file if it doesn't exist
const envPath = '.env.generated';
if (!fs.existsSync(envPath)) {
  const envContent = `# JWT Configuration
JWT_PRIVATE_KEY_BASE64=${privateKeyBase64}
JWT_PUBLIC_KEY_BASE64=${publicKeyBase64}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/school_db"

# Server Configuration
PORT=8080
NODE_ENV=development

# Cookie Configuration
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
ACCESS_TOKEN_EXPIRES_IN=900000
REFRESH_TOKEN_EXPIRES_IN=604800000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Created .env file with generated keys');
} else {
  console.log(
    '\n⚠️  .env file already exists. Please manually add the JWT keys.',
  );
}
