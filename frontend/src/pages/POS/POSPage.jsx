import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './POSPage.css';
import BarcodeScanner from '../../components/POS/BarcodeScanner';
import ShoppingCart from '../../components/POS/ShoppingCart';
import PaymentModal from '../../components/POS/PaymentModal';

function POSPage() {
  const [cartItems, setCartItems] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [heldBills, setHeldBills] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const calculateTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
    setTotalAmount(total);
  };

  const handleBarcodeScanned = async (barcode) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/barcode/scan`,
        { barcode }
      );

      if (response.data.found) {
        // Product found, add to cart
        const existingItem = cartItems.find(item => item.id === response.data.product.id);
        if (existingItem) {
          existingItem.quantity += 1;
          setCartItems([...cartItems]);
        } else {
          setCartItems([...cartItems, { ...response.data.product, quantity: 1 }]);
        }
      } else {
        // Unknown barcode - show create product modal
        console.log('Unknown barcode:', barcode);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
    }
  };

  const handleCheckout = async (paymentData) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/pos/transaction`,
        {
          items: cartItems,
          payment_method: paymentData.method,
          cash_received: paymentData.amount
        }
      );

      // Clear cart and show receipt
      setCartItems([]);
      setShowPayment(false);
      alert('Transaction completed successfully!');
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleHoldBill = () => {
    if (cartItems.length > 0) {
      setHeldBills([...heldBills, { id: Date.now(), items: cartItems }]);
      setCartItems([]);
    }
  };

  const handleRecallBill = (billId) => {
    const bill = heldBills.find(b => b.id === billId);
    if (bill) {
      setCartItems(bill.items);
      setHeldBills(heldBills.filter(b => b.id !== billId));
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-main">
        {/* Barcode Scanner */}
        <div className="pos-scanner">
          <BarcodeScanner onBarcodeScan={handleBarcodeScanned} />
        </div>

        {/* Shopping Cart */}
        <div className="pos-cart">
          <ShoppingCart
            items={cartItems}
            totalAmount={totalAmount}
            onRemoveItem={(id) => setCartItems(cartItems.filter(item => item.id !== id))}
            onUpdateQuantity={(id, qty) => {
              const item = cartItems.find(i => i.id === id);
              if (item) item.quantity = qty;
              setCartItems([...cartItems]);
            }}
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="pos-controls">
        <div className="pos-total">
          <h2>Total: BND {totalAmount.toFixed(2)}</h2>
        </div>

        <div className="pos-buttons">
          <button onClick={handleHoldBill} className="btn btn-hold">
            Hold Bill
          </button>
          <button onClick={() => setShowPayment(true)} className="btn btn-checkout" disabled={cartItems.length === 0}>
            Checkout (F1)
          </button>
          <button onClick={() => setCartItems([])} className="btn btn-clear">
            Clear
          </button>
        </div>

        {heldBills.length > 0 && (
          <div className="pos-held-bills">
            <h3>Held Bills ({heldBills.length})</h3>
            {heldBills.map(bill => (
              <button key={bill.id} onClick={() => handleRecallBill(bill.id)} className="btn btn-recall">
                Recall Bill
              </button>
            ))}
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          totalAmount={totalAmount}
          onClose={() => setShowPayment(false)}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}

export default POSPage;
