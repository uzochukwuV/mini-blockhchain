import { ec as EC } from 'elliptic';

const secp256k1 = new EC('secp256k1');

/**
 * Hashes a string payload with SHA-256 and returns the digest as hex.
 *
 * @param {string} value
 * @returns {Promise<string>}
 */
const textToHex = async (value) => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

/**
 * Signs a transaction payload in the browser using the locally stored private key.
 *
 * @param {{ fromAddress: string, toAddress: string, amount: number, timestamp: number }} transaction
 * @param {string} privateKey
 * @returns {Promise<string>}
 */
export const signTransactionPayload = async (transaction, privateKey) => {
  const payload = `${transaction.fromAddress}${transaction.toAddress}${transaction.amount}${transaction.timestamp}`;
  const hash = await textToHex(payload);
  const key = secp256k1.keyFromPrivate(privateKey, 'hex');
  return key.sign(hash, { canonical: true }).toDER('hex');
};
