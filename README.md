# NURUL HR SDN BHD - Enterprise EPOS System

A complete, offline-first, enterprise-grade Electronic Point of Sale (EPOS) and Inventory Management System for supermarkets/minimarts in Brunei, with GoFrugal data migration capabilities.

## 🚀 Features

### Point of Sale (POS)
- ✅ Barcode scanning with auto-product creation for unknown items
- ✅ Multiple barcode management (primary, secondary, distributor, import)
- ✅ Product search & category search
- ✅ Touchscreen & keyboard support (Ctrl+1 to Ctrl+5 shortcuts)
- ✅ Hold & recall bills
- ✅ Split payments
- ✅ Multi-payment methods (Cash, Baiduri Card, BIBD Card, Customer Credit)
- ✅ 80mm thermal printer support
- ✅ Receipt printing (print/don't print/reprint options)
- ✅ Automatic calculations (Bill Total, Change, Outstanding Balance)

### Barcode Management
- ✅ Automatic barcode scanning
- ✅ Unknown barcode detection → Create new product automatically
- ✅ Multiple barcodes per product
  - Primary Barcode
  - Secondary Barcode
  - Distributor Barcode
  - Import Barcode
- ✅ Add, edit, delete barcodes
- ✅ Generate barcode labels
- ✅ Excel/CSV barcode import
- ✅ Barcode label printing

### Inventory Management
- ✅ Stock receiving & purchase orders
- ✅ Stock adjustment & count
- ✅ Stock transfer between branches/warehouses
- ✅ FIFO & FEFO batch control
- ✅ Expiry tracking with near-expiry alerts (7 days)
- ✅ Low stock alerts (default 10 units, customizable)
- ✅ Multiple units support (KG, Gram, Piece, Bundle, Sack, Bag, Carton, Litre, ML)
- ✅ Conversion master (unlimited conversions)
- ✅ Fruits & vegetables weight-based pricing

### Accounting & Finance
- ✅ **Purchase Management**
  - Paid/Unpaid tracking
  - Payment history
  - Edit purchase records
  - Supplier payment status
- ✅ **Supplier Management**
  - Company name customization
  - Supplier information
  - Payment to supplier
  - Supplier balance tracking
- ✅ **Bank Deposits**
  - BIBD Bank deposits (Company account)
  - Customer deposits (separate tracking)
  - Deposit verification
  - Bank reconciliation
- ✅ Customer credit management
- ✅ Accounts receivable & payable
- ✅ Cash book & journal entries
- ✅ Profit & loss calculations
- ✅ Daily bank reconciliation

### Reports
- ✅ Daily sales, purchase, and profit reports
- ✅ Cashier performance reports
- ✅ Bank deposit reports
- ✅ Supplier payment tracking
- ✅ Weekly, monthly, yearly reports
- ✅ Export to PDF/Excel/CSV

### GoFrugal Data Migration
- ✅ Import from Excel, CSV, SQL Server, MySQL, Database backups
- ✅ Guided migration wizard with field mapping
- ✅ Duplicate detection & resolution
- ✅ Data validation with error reporting
- ✅ Automatic backup & rollback
- ✅ Real-time progress tracking
- ✅ Comprehensive audit logging
- ✅ Enterprise-scale performance (100K+ products)

### Security & User Management
- ✅ Role-based access control (Master Admin, Manager, Cashier)
- ✅ Password protection & authentication
- ✅ Audit logs for all transactions
- ✅ Manager approval workflows

### Server Architecture
- ✅ Offline-first (SQLite local database)
- ✅ Automatic background synchronization
- ✅ Real-time sync when connected
- ✅ Duplicate prevention
- ✅ Automatic retry with exponential backoff
- ✅ Cloud backup support

### AI Features
- ✅ Low stock predictions
- ✅ Purchase quantity recommendations
- ✅ Sales forecasting
- ✅ Profit analysis

## 📋 System Architecture

```
NURUL HR EPOS System
├── Frontend (React + Electron)
│   ├── POS Interface
│   ├── Inventory Dashboard
│   ├── Reports & Analytics
│   ├── Accounting & Finance
│   ├── Administration Panel
│   └── GoFrugal Migration Wizard
├── Backend API (Node.js/Express)
│   ├── POS APIs
│   ├── Inventory APIs
│   ├── Accounting APIs
│   ├── Reporting APIs
│   ├── Migration APIs
│   ├── Barcode APIs
│   └── Synchronization Engine
├── Database
│   ├── SQLite (Offline - Local)
│   ├── PostgreSQL (Production - Server)
│   └── Migration Module
└── Reporting Engine
    ├── PDF generation
    ├── Excel export
    └── Analytics
```

## 🔧 Technology Stack

- **Frontend**: React 18, Electron, Redux, Socket.io
- **Backend**: Node.js 18+, Express.js, Bull (task queue)
- **Database**: SQLite (offline), PostgreSQL (production)
- **Currency**: BND (Brunei Dollar)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/commercialnurulhr-ux/nurul-hr-epos.git
cd nurul-hr-epos

# Setup with Docker
docker-compose up -d

# Or manual setup
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## 📚 Documentation

See the `/docs` folder for comprehensive guides:
- Installation Guide
- User Guide
- Admin Guide
- API Documentation
- Migration Guide
- Database Schema
- Barcode Management Guide

## 🔐 Security

- Role-based access control (RBAC)
- Encrypted passwords (bcrypt)
- Audit logging
- Transaction verification
- Encrypted backups

## 📧 Support

For support: support@nurul-hr-epos.bn

## 📄 License

Licensed to NURUL HR SDN BHD - Brunei

---

**Version**: 1.0.0  
**Currency**: BND (Brunei Dollar)  
**Country**: Brunei Darussalam  
**Domain**: nurul-hr-epos.bn