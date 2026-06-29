import React, { useState } from 'react';
import './MigrationPage.css';

function MigrationPage() {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('');
  const [file, setFile] = useState(null);

  return (
    <div className="migration-container">
      <div className="migration-wizard">
        <h1>GoFrugal Data Migration Wizard</h1>
        <p>Seamlessly migrate your existing GoFrugal data to NURUL HR EPOS</p>

        {step === 1 && (
          <div className="migration-step">
            <h2>Step 1: Select Source Type</h2>
            <div className="source-options">
              <button
                className={`source-btn ${sourceType === 'excel' ? 'active' : ''}`}
                onClick={() => setSourceType('excel')}
              >
                📊 Excel (.xlsx)
              </button>
              <button
                className={`source-btn ${sourceType === 'csv' ? 'active' : ''}`}
                onClick={() => setSourceType('csv')}
              >
                📄 CSV File
              </button>
              <button
                className={`source-btn ${sourceType === 'mssql' ? 'active' : ''}`}
                onClick={() => setSourceType('mssql')}
              >
                🗄️ SQL Server
              </button>
              <button
                className={`source-btn ${sourceType === 'mysql' ? 'active' : ''}`}
                onClick={() => setSourceType('mysql')}
              >
                🗄️ MySQL
              </button>
            </div>
            <button className="btn btn-next" onClick={() => setStep(2)} disabled={!sourceType}>
              Next Step →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="migration-step">
            <h2>Step 2: Upload File</h2>
            <div className="file-upload">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".xlsx,.csv,.sql,.backup"
              />
              {file && <p>Selected: {file.name}</p>}
            </div>
            <div className="migration-buttons">
              <button className="btn btn-back" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-next" onClick={() => setStep(3)} disabled={!file}>
                Next Step →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="migration-step">
            <h2>Step 3: Preview & Validate Data</h2>
            <div className="preview-box">
              <p>Validating data...</p>
              <div className="progress-bar">
                <div className="progress" style={{width: '65%'}}></div>
              </div>
            </div>
            <div className="migration-buttons">
              <button className="btn btn-back" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-next" onClick={() => setStep(4)}>
                Start Migration →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="migration-step">
            <h2>Step 4: Migration in Progress</h2>
            <div className="migration-progress">
              <div className="progress-info">
                <p>Importing products...</p>
                <p className="progress-stats">1,250 / 5,000 records</p>
              </div>
              <div className="progress-bar">
                <div className="progress" style={{width: '25%'}}></div>
              </div>
              <div className="migration-logs">
                <p>✓ Connected to GoFrugal database</p>
                <p>✓ Validated schema</p>
                <p>⏳ Importing products...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MigrationPage;
