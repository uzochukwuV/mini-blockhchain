const { sendCreated } = require('../utils/response');
const { generateWalletPair } = require('../utils/wallet');

/**
 * Generates a new wallet pair and returns it to the client.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const createWallet = (req, res, next) => {
  try {
    const wallet = generateWalletPair();
    sendCreated(res, wallet);
  } catch (err) {
    next(err);
  }
};

module.exports = { createWallet };
