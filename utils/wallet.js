const crypto = require('crypto');

/**
 * Decodes a base64url string into a Buffer.
 *
 * @param {string} value
 * @returns {Buffer}
 */
const base64UrlToBuffer = (value) => {
  const padding = (4 - (value.length % 4)) % 4;
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding);
  return Buffer.from(normalized, 'base64');
};

/**
 * Encodes a Buffer into a base64url string.
 *
 * @param {Buffer} value
 * @returns {string}
 */
const bufferToBase64Url = (value) =>
  value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

/**
 * Converts an uncompressed public key hex string into a JWK representation.
 *
 * @param {string} publicKeyHex
 * @returns {{ kty: string, crv: string, x: string, y: string }}
 */
const publicKeyHexToJwk = (publicKeyHex) => {
  const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

  if (publicKeyBuffer.length !== 65 || publicKeyBuffer[0] !== 4) {
    throw new Error('Invalid public key format');
  }

  return {
    kty: 'EC',
    crv: 'secp256k1',
    x: bufferToBase64Url(publicKeyBuffer.subarray(1, 33)),
    y: bufferToBase64Url(publicKeyBuffer.subarray(33, 65)),
  };
};

/**
 * Derives the matching uncompressed public key from a secp256k1 private key.
 *
 * @param {string} privateKeyHex
 * @returns {string}
 */
const derivePublicKey = (privateKeyHex) => {
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'));
  return ecdh.getPublicKey('hex', 'uncompressed');
};

/**
 * Converts a private key hex string into a JWK representation.
 *
 * @param {string} privateKeyHex
 * @returns {{ kty: string, crv: string, x: string, y: string, d: string }}
 */
const privateKeyHexToJwk = (privateKeyHex) => {
  const publicKeyHex = derivePublicKey(privateKeyHex);
  const publicKeyJwk = publicKeyHexToJwk(publicKeyHex);

  return {
    ...publicKeyJwk,
    d: bufferToBase64Url(Buffer.from(privateKeyHex, 'hex')),
  };
};

/**
 * Creates a Node.js public key object from an uncompressed public key hex string.
 *
 * @param {string} publicKeyHex
 * @returns {crypto.KeyObject}
 */
const createPublicKeyObject = (publicKeyHex) =>
  crypto.createPublicKey({ key: publicKeyHexToJwk(publicKeyHex), format: 'jwk' });

/**
 * Creates a Node.js private key object from a private key hex string.
 *
 * @param {string} privateKeyHex
 * @returns {crypto.KeyObject}
 */
const createPrivateKeyObject = (privateKeyHex) =>
  crypto.createPrivateKey({ key: privateKeyHexToJwk(privateKeyHex), format: 'jwk' });

/**
 * Generates a secp256k1 wallet pair encoded as hex strings for transport and signing.
 *
 * @returns {{ publicKey: string, privateKey: string }}
 */
const generateWalletPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
  });

  const publicJwk = publicKey.export({ format: 'jwk' });
  const privateJwk = privateKey.export({ format: 'jwk' });

  return {
    publicKey: `04${base64UrlToBuffer(publicJwk.x).toString('hex')}${base64UrlToBuffer(
      publicJwk.y
    ).toString('hex')}`,
    privateKey: base64UrlToBuffer(privateJwk.d).toString('hex'),
  };
};

module.exports = {
  createPrivateKeyObject,
  createPublicKeyObject,
  derivePublicKey,
  generateWalletPair,
};
