const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const STORAGE_PATH = path.join(__dirname, '..', 'blockchain.json');

/**
 * Persisted blockchain file shape.
 *
 * @typedef {Object} PersistedBlockchainState
 * @property {Array<{
 *   timestamp: number,
 *   transactions: Array<{
 *     fromAddress: string | null,
 *     toAddress: string,
 *     amount: number,
 *     timestamp: number,
 *     signature: string
 *   }>,
 *   previousHash: string,
 *   nonce: number,
 *   hash: string
 * }>} chain
 * @property {Array<{
 *   fromAddress: string | null,
 *   toAddress: string,
 *   amount: number,
 *   timestamp: number,
 *   signature: string
 * }>} pendingTransactions
 */

/**
 * Serializes the blockchain state to disk.
 *
 * @param {{ chain: Array<object>, pendingTransactions: Array<object> }} blockchain
 * @returns {void}
 */
const save = (blockchain) => {
  try {
    const payload = {
      chain: blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions,
    };

    fs.writeFileSync(STORAGE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    logger.info(`Blockchain state saved to ${STORAGE_PATH}`);
  } catch (err) {
    logger.error(`Failed to save blockchain state: ${err.message}`);
  }
};

/**
 * Loads persisted blockchain state from disk.
 *
 * @returns {PersistedBlockchainState | null}
 */
const load = () => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      logger.info('No persisted blockchain state found; starting fresh');
      return null;
    }

    const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    logger.info(`Blockchain state loaded from ${STORAGE_PATH}`);
    return parsed;
  } catch (err) {
    logger.warn(`Failed to load persisted blockchain state: ${err.message}`);
    return null;
  }
};

/**
 * Deletes the persisted blockchain state file if it exists.
 *
 * @returns {void}
 */
const clear = () => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      logger.info('No persisted blockchain state to clear');
      return;
    }

    fs.unlinkSync(STORAGE_PATH);
    logger.info(`Cleared persisted blockchain state at ${STORAGE_PATH}`);
  } catch (err) {
    logger.error(`Failed to clear persisted blockchain state: ${err.message}`);
  }
};

module.exports = { save, load, clear };
