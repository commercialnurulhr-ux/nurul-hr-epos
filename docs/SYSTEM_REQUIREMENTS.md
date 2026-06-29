# NURUL HR EPOS - System Requirements

## Hardware Requirements

### Server
- **CPU**: Intel Xeon or equivalent, 4+ cores
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 500GB SSD minimum
- **Network**: 1Gbps connection
- **Backup**: Additional 500GB for backups

### Client (Cashier Terminal)
- **CPU**: Intel Core i5 or equivalent
- **RAM**: 8GB minimum
- **Storage**: 256GB SSD
- **Display**: 15-17 inch touchscreen (1280x1024 minimum)
- **Printer**: 80mm thermal printer (USB connection)
- **Barcode Scanner**: USB connection
- **Network**: WiFi or Ethernet

## Software Requirements

### Server
- **OS**: Linux (Ubuntu 20.04 LTS+), Windows Server 2019+
- **Node.js**: 18.x LTS or later
- **PostgreSQL**: 13.x or later
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

### Client Workstation
- **OS**: Windows 10/11, macOS 10.15+
- **Node.js**: 18.x LTS

## Database

### Offline (Local)
- SQLite 3.x
- Size: 2GB per cashier
- Backup frequency: Daily

### Production (Server)
- PostgreSQL 13+
- Size: 10GB minimum for 100,000 products
- Backup frequency: Hourly

## Security Requirements

- SSL/TLS 1.3 for all connections
- AES-256 encryption for sensitive data
- BCRYPT hashing for passwords
- Audit logging
- Regular security patches

## Performance Targets

- **Transaction Speed**: < 100ms
- **Barcode Scan**: < 50ms
- **Report Generation**: < 5 seconds
- **Sync Speed**: 1000 transactions/minute
- **Concurrent Users**: 20 cashiers minimum

## Storage Requirements

### Initial Setup
- Application: 500MB
- Database: 2GB
- Total: 2.5GB

### Annual Growth
- Per 100,000 products: +200MB
- Per 1M transactions: +300MB