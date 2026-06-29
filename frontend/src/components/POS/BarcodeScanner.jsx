import React, { useRef, useEffect } from 'react';

function BarcodeScanner({ onBarcodeScan }) {
  const inputRef = useRef(null);
  const [barcode, setBarcode] = React.useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (e) => {
    if (e.key === 'Enter') {
      onBarcodeScan(barcode);
      setBarcode('');
    } else {
      setBarcode(barcode + e.key);
    }
  };

  return (
    <div className="barcode-scanner">
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onKeyPress={handleBarcodeInput}
        placeholder="Scan barcode or type here..."
        className="barcode-input"
        autoFocus
      />
    </div>
  );
}

export default BarcodeScanner;
