import React, { useEffect, useState } from 'react';
import './Wallet.css';
import { createWallet, fetchBalance } from '../api/blockchain.api';
import { signTransactionPayload } from '../utils/wallet';

const emptyWallet = { publicKey: '', privateKey: '' };

/**
 * Wallet panel that generates a browser-held key pair and exposes a signing callback.
 *
 * @param {{
 *   onWalletChange: (walletState: { publicKey: string, signTransaction: ((transaction: object) => Promise<string>) | null }) => void,
 *   refreshKey: number
 * }} props
 * @returns {JSX.Element}
 */
const Wallet = ({ onWalletChange, refreshKey }) => {
  const [wallet, setWallet] = useState(emptyWallet);
  const [balance, setBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!wallet.publicKey) {
      setBalance(0);
      onWalletChange({ publicKey: '', signTransaction: null });
      return;
    }

    onWalletChange({
      publicKey: wallet.publicKey,
      signTransaction: (transaction) =>
        signTransactionPayload(transaction, wallet.privateKey),
    });
  }, [wallet, onWalletChange]);

  useEffect(() => {
    if (!wallet.publicKey) {
      return;
    }

    let active = true;

    /**
     * Fetches the latest confirmed balance for the current wallet.
     *
     * @returns {Promise<void>}
     */
    const loadBalance = async () => {
      setLoadingBalance(true);

      try {
        const response = await fetchBalance(wallet.publicKey);
        if (active) {
          setBalance(response.balance);
        }
      } catch (err) {
        if (active) {
          setMessage(err.message || 'Failed to fetch wallet balance');
        }
      } finally {
        if (active) {
          setLoadingBalance(false);
        }
      }
    };

    loadBalance();

    return () => {
      active = false;
    };
  }, [wallet.publicKey, refreshKey]);

  /**
   * Requests a new wallet from the API and stores the private key locally in component state.
   *
   * @returns {Promise<void>}
   */
  const handleGenerateWallet = async () => {
    setLoadingWallet(true);
    setMessage('');

    try {
      const nextWallet = await createWallet();
      setWallet(nextWallet);
      setBalance(0);
      setMessage('Wallet generated locally. Keep the private key secret.');
    } catch (err) {
      setMessage(err.message || 'Failed to generate wallet');
    } finally {
      setLoadingWallet(false);
    }
  };

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h2 className="panel-title">Wallet</h2>
        <button
          type="button"
          className="wallet-button"
          onClick={handleGenerateWallet}
          disabled={loadingWallet}
        >
          {loadingWallet ? 'Generating...' : wallet.publicKey ? 'Regenerate' : 'Generate Wallet'}
        </button>
      </div>

      <div className="wallet-field">
        <span className="wallet-label">Public Key</span>
        <code className="wallet-value">
          {wallet.publicKey || 'Generate a wallet to create signed transactions.'}
        </code>
      </div>

      <div className="wallet-field">
        <span className="wallet-label">Balance</span>
        <strong className="wallet-balance">
          {loadingBalance ? 'Refreshing...' : `${balance} coins`}
        </strong>
      </div>

      <div className="wallet-field">
        <span className="wallet-label">Private Key</span>
        <code className="wallet-value wallet-private">
          {wallet.privateKey || 'Stored only in this browser session.'}
        </code>
      </div>

      {message && <div className="wallet-message">{message}</div>}
    </div>
  );
};

export default Wallet;
