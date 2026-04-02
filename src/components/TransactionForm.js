import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction } from '../api/blockchain.api';

const TransactionForm = ({ walletAddress, signTransaction, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletAddress || !signTransaction) {
      setMessage('Generate a wallet before creating a signed transaction.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const transaction = {
        fromAddress: walletAddress,
        toAddress: formData.toAddress.trim(),
        amount: Number(formData.amount),
        timestamp: Date.now(),
      };

      const signature = await signTransaction(transaction);

      await addTransaction({
        ...transaction,
        signature,
      });

      setMessage('Transaction added successfully!');
      setFormData({ toAddress: '', amount: '' });
      onTransactionAdded();
    } catch (err) {
      setMessage(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h2 className="panel-title">Create Transaction</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fromAddress">From Address</label>
          <input
            type="text"
            id="fromAddress"
            name="fromAddress"
            value={walletAddress}
            placeholder="Generate a wallet first"
            disabled
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="toAddress">To Address</label>
          <input
            type="text"
            id="toAddress"
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="Recipient public key"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g., 100"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        {message && (
          <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          className="submit-button"
          disabled={loading || !walletAddress || !signTransaction}
        >
          {loading ? 'Signing...' : 'Sign & Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
