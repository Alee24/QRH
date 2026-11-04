# Grand Heritage Hotel: QR Self-Ordering, KDS & POS Management System

A production-grade, mobile-first Hotel and Restaurant Management Platform centered around QR-code self-service ordering, multi-station Kitchen Display Systems (KDS), Cashier Point-of-Sale (POS), inventory recipe management, Safaricom Daraja M-Pesa payments, and hotel PMS room billing integration.

---

## 1. System Architecture Overview

```
                                      ┌────────────────────────────────────────────────┐
                                      │   CUSTOMER SMARTPHONE (Mobile-First Web App)   │
                                      │  - Scan Unique Table QR Token                  │
                                      │  - Browse Scheduled Digital Menu               │
                                      │  - Select Portions, Modifiers & Dietary Notes  │
                                      │  - Real-Time Live Order Tracker                │
                                      │  - Request Waiter Assistance / M-Pesa Payment  │
                                      └───────────────────────┬────────────────────────┘
                                                              │
                                                        REST / WebSocket
                                                              │
                                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CENTRAL ORDER & EVENT ENGINE (Node.js / Express)                                │
│                                                                                                                  │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────┐  │
│  │ Table Session Ledger  │   │  Multi-Station Router    │   │  Transactional Inventory │   │ Safaricom Daraja │  │
│  │ Consolidated Ordering │   │  Splits items into KOTs  │   │  Recipe BOM Stock Deduct │   │ M-Pesa STK Push  │  │
│  └───────────────────────┘   └──────────────────────────┘   └──────────────────────────┘   └──────────────────┘  │
└──────────────┬──────────────────────────────┬────────────────────────────┬─────────────────────────────┬─────────┘
               │                              │                            │                             │
               ▼                              ▼                            ▼                             ▼
   ┌───────────────────────┐      ┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
   │  KITCHEN DISPLAY (KDS)│      │  SERVICE & RUNNER     │    │  CASHIER & POS        │    │  HOTEL PMS INTEGRATION│
   │  - Pending/Prep/Ready │      │  - Delivery Queue     │    │  - Consolidated Bills │    │  - Room Directory     │
   │  - Station Filtering  │      │  - Confirm Delivery   │    │  - Bill Splitting     │    │  - Room Charge Auth   │
   │  - Overdue Timers     │      │  - Assistance Calls   │    │  - Receipt & Release  │    │  - Room Service Orders│
   └───────────────────────┘      └───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

---

## 2. Master User Role & Permission Matrix

| Role | QR / Menu Order | KDS Screen | Food Delivery | Cashier & POS | Table Manager | Inventory & BOM | Reports & CSV | Staff & RBAC |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Super Admin** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Hotel Admin** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Restaurant Manager** | Full | Full | Full | Full | Full | View/Edit | Full | View |
| **Kitchen Manager** | View | Full | View | - | - | Full | KDS Reports | - |
| **Kitchen Staff (Grill/Bar)** | View | Station KDS | - | - | - | Log Waste | - | - |
| **Service Staff (Runners)** | View | View Ready | Full Delivery | - | View | - | - | - |
| **Cashier** | View | View | View | Full Settle | Settle/Clean | - | Shift Sales | - |
| **Accountant** | - | - | - | View/Audit | - | Valuation | Full Sales/M-Pesa | Audit |
| **Inventory Manager** | - | - | - | - | - | Full Procurement | Wastage & Stock | - |
| **Auditor** | - | - | - | Read-only | Read-only | Read-only | Full Audit Logs | Audit |

---

## 3. Seeded Accounts for Immediate Testing

All staff accounts are pre-configured with the password: `Admin@2026!`

- **Super Administrator**: `admin@hotel.com`
- **Restaurant Manager**: `manager@hotel.com`
- **Kitchen Manager (Main Kitchen)**: `chef@hotel.com`
- **Grill Chef (Charcoal Grill)**: `grill@hotel.com`
- **Mixologist (Artisan Bar)**: `bar@hotel.com`
- **Cashier**: `cashier@hotel.com`
- **Service Runner**: `runner@hotel.com`
- **Inventory Manager**: `inventory@hotel.com`

---

## 4. End-to-End Operational Lifecycle (22 Verified Steps)

1. **Table Creation**: Table 01 is configured with capacity and location.
2. **Cryptographic QR Generation**: Unique, non-guessable QR token is generated and printable as an A5 Table Tent Card.
3. **Guest Scan**: Guest scans table QR with smartphone camera; system resolves Table 01 without requiring login.
4. **Digital Menu**: Displays time-scheduled gourmet menu (Breakfast, Lunch, Dinner, All Day, Specials).
5. **Item Customization**: Guest selects steak doneness (Medium Rare), sides (Truffle Fries), portions, and add-ons.
6. **Order Submission**: Order is validated and atomically created with immutable price snapshotting and idempotency check.
7. **Kitchen Station Split**:
   - Prime Angus Ribeye routes to **Charcoal & Smoker Grill (`station-grill`)**
   - Wild Porcini Tagliatelle routes to **Main Hot Kitchen (`station-main`)**
   - Savannah Sunset Negroni routes to **Cocktail & Artisan Bar (`station-bar`)**
8. **Automated Inventory Deduction**: Recipe Bill of Materials (BOM) atomically deducts 0.35kg beef, 0.20kg pasta, and 0.06L gin.
9. **KDS Ticket Progression**: Kitchen staff acknowledge tickets (`pending` -> `preparing`), updating table state.
10. **Ready Progression**: Items become ready; parent order automatically transitions to `ready` when all station tickets are complete.
11. **Service Notification**: Food runner receives chime and delivers dishes to Table 01.
12. **Multi-Order Session Appending**: Guest orders an additional drink (Passion Dawa); it joins the **same** table session without creating duplicate sessions.
13. **Consolidated Billing**: Cashier opens Table 01 and sees all orders consolidated under one single itemized bill.
14. **Taxes & Discounts**: Calculates 16% VAT, 2% Catering Levy, and allows authorized discounts.
15. **M-Pesa STK Push Settlement**: Guest or cashier triggers M-Pesa STK Push; Daraja callback verifies transaction receipt.
16. **Table Release Cycle**:
    - Table balance reaches 0.
    - Cashier marks table for cleaning (`status = 'cleaning'`).
    - Service staff confirms cleaning -> Table status resets to `available`.
17. **Audit Logging**: Every sensitive action is recorded in `audit_logs`.

---

## 5. Automated Verification Test Suite

Run the master 22-step integration test:

```bash
npm run test
```

Expected output:
```
✔ 1 & 2: Administrator creates or verifies Table 01 and its unique QR code
✔ 3, 4 & 5: Customer scans QR token and views menu
✔ 6 & 7: Customer selects meals + drink and submits order
✔ 8 & 9: Order splits to correct kitchen stations and kitchen acknowledges
✔ 10, 11 & 12: Kitchen marks items ready and service staff is notified
✔ 13 & 14: Customer places an additional drink order that joins the same session
✔ 15: Cashier sees all orders in one consolidated bill
✔ 16 & 17: Cashier processes M-Pesa payment and verifies confirmation
✔ 18, 19, 20 & 21: Table cleaning cycle and release to available
✔ 22: All actions recorded in audit history
ℹ tests 11, pass 11, fail 0
```

---

## 6. Docker & Production VPS Deployment

### Single-Command VPS Deployment

```bash
git pull origin main && \
docker compose build --no-cache && \
docker compose up -d && \
docker image prune -f
```

### Health Check & Verification Commands

```bash
# Check running containers
docker compose ps

# Check backend health endpoint
curl http://localhost:5000/api/health

# View live container logs
docker compose logs -f server
```

### Database Backup & Recovery

```bash
# Backup SQLite database
docker cp hotel_qr_server:/app/data/restaurant_pos.sqlite ./backup_$(date +%Y%m%d).sqlite

# Restore database
docker cp ./backup_20261104.sqlite hotel_qr_server:/app/data/restaurant_pos.sqlite
docker compose restart server
```
