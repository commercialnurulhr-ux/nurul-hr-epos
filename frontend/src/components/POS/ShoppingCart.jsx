import React from 'react';

function ShoppingCart({ items, totalAmount, onRemoveItem, onUpdateQuantity }) {
  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p className="empty-cart">Cart is empty</p>
      ) : (
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>BND {item.selling_price.toFixed(2)} x {item.quantity}</p>
              </div>
              <div className="item-controls">
                <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                <button onClick={() => onRemoveItem(item.id)} className="btn-remove">🗑️</button>
              </div>
              <div className="item-total">
                BND {(item.quantity * item.selling_price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;
