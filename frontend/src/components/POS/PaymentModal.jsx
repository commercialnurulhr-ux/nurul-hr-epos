import React, { useState } from 'react';

function PaymentModal({ totalAmount, onClose, onCheckout }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  React.useEffect(() => {
    if (paymentMethod === 'cash') {
      setChangeAmount(parseFloat(cashReceived) - totalAmount);
    }
  }, [cashReceived, totalAmount]);

  const handleCheckout = () => {
    if (paymentMethod === 'cash' && !cashReceived) {
      alert('Please enter cash amount');
      return;
    }
    onCheckout({
      method: paymentMethod,
      amount: paymentMethod === 'cash' ? parseFloat(cashReceived) : totalAmount
    });
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <h2>Payment</h2>
        <div className="payment-summary">
          <p>Total Amount: <strong>BND {totalAmount.toFixed(2)}</strong></p>
        </div>

        <div className="payment-methods">
          <button
            className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            💵 Cash
          </button>
          <button
            className={`method-btn ${paymentMethod === 'baiduri' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('baiduri')}
          >
            🏦 Baiduri Card
          </button>
          <button
            className={`method-btn ${paymentMethod === 'bibd' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('bibd')}
          >
            🏦 BIBD Card
          </button>
          <button
            className={`method-btn ${paymentMethod === 'credit' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('credit')}
          >
            💳 Customer Credit
          </button>
        </div>

        {paymentMethod === 'cash' && (
          <div className="cash-input">
            <label>Cash Received:</label>
            <input
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
            />
            {changeAmount > 0 && (
              <p className="change-amount">Change: BND {changeAmount.toFixed(2)}</p>
            )}
          </div>
        )}

        <div className="payment-buttons">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-complete" onClick={handleCheckout}>Complete Payment</button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
