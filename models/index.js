const { Blockchain, Transaction } = require('./blockchain');
const config = require('../config');
const { generateWalletPair } = require('../utils/wallet');
const logger = require('../utils/logger');
const persistence = require('../services/persistence.service');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;

/**
 * Rehydrates a plain persisted transaction object into a Transaction instance.
 *
 * @param {{ fromAddress: string | null, toAddress: string, amount: number, timestamp: number, signature: string }} transactionData
 * @returns {Transaction}
 */
const hydrateTransaction = (transactionData) =>
  Object.assign(
    new Transaction(
      transactionData.fromAddress,
      transactionData.toAddress,
      transactionData.amount,
      transactionData.timestamp,
      transactionData.signature
    ),
    transactionData
  );

/**
 * Rehydrates persisted blockchain JSON into a live Blockchain instance.
 *
 * @param {{ chain: Array<object>, pendingTransactions: Array<object> }} persistedState
 * @returns {Blockchain}
 */
const hydrateBlockchain = (persistedState) => {
  const restoredBlockchain = new Blockchain(difficulty, miningReward);

  restoredBlockchain.chain = persistedState.chain.map((blockData) =>
    Object.assign(restoredBlockchain.createGenesisBlock(), {
      ...blockData,
      transactions: blockData.transactions.map(hydrateTransaction),
    })
  );
  restoredBlockchain.pendingTransactions =
    persistedState.pendingTransactions.map(hydrateTransaction);

  return restoredBlockchain;
};

/**
 * Wraps blockchain mutation methods so successful writes are persisted automatically.
 *
 * @param {Blockchain} blockchainInstance
 * @returns {Blockchain}
 */
const attachPersistence = (blockchainInstance) => {
  const originalAddTransaction = blockchainInstance.addTransaction.bind(blockchainInstance);
  blockchainInstance.addTransaction = (transaction) => {
    const result = originalAddTransaction(transaction);
    persistence.save(blockchainInstance);
    return result;
  };

  const originalMinePendingTransactions =
    blockchainInstance.minePendingTransactions.bind(blockchainInstance);
  blockchainInstance.minePendingTransactions = (miningRewardAddress) => {
    const result = originalMinePendingTransactions(miningRewardAddress);
    persistence.save(blockchainInstance);
    return result;
  };

  return blockchainInstance;
};

const persistedState = persistence.load();

let blockchain;

if (persistedState) {
  try {
    const restoredBlockchain = hydrateBlockchain(persistedState);

    if (!restoredBlockchain.isChainValid()) {
      logger.warn('Persisted blockchain state is invalid; starting fresh');
      blockchain = new Blockchain(difficulty, miningReward);
    } else {
      logger.info('Restored blockchain state from disk');
      blockchain = restoredBlockchain;
    }
  } catch (err) {
    logger.warn(`Failed to hydrate persisted blockchain state: ${err.message}`);
    blockchain = new Blockchain(difficulty, miningReward);
  }
} else {
  blockchain = new Blockchain(difficulty, miningReward);
}

blockchain = attachPersistence(blockchain);

if (!persistedState && config.demoData.enabled) {
  const demoWallets = {
    address1: generateWalletPair(),
    address2: generateWalletPair(),
  };

  config.demoData.transactions.forEach(({ from, to, amount }) => {
    const transaction = new Transaction(
      demoWallets[from].publicKey,
      demoWallets[to].publicKey,
      amount
    );

    transaction.signTransaction(demoWallets[from].privateKey);
    blockchain.addTransaction(transaction);
  });
  blockchain.minePendingTransactions(initialMinerAddress);
}

module.exports = { blockchain, Transaction };
