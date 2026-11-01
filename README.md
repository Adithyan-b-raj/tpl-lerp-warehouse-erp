# NEXUS SUPPLY ERP // Multi-Branch Inventory, PO & 3-Way Match Suite

> **BMAD Architectural Movement Q:** Enterprise Multi-Branch 3-Way Match Data Grid  
> **Reference Archetype:** SAP Fiori Horizon / ERPNext v15 / Ramp  
> **Live Edge Deployment:** [https://tpl-lerp-warehouse-erp.pages.dev](https://tpl-lerp-warehouse-erp.pages.dev)  
> **Admin Ops Console:** [https://tpl-lerp-warehouse-erp.pages.dev/admin.html](https://tpl-lerp-warehouse-erp.pages.dev/admin.html)

---

## 1. Architectural Highlights

- **Layout Archetypes:**
  - Storefront / Dealer Self-Service: `data-layout-archetype="enterprise-warehouse-erp"`
  - Admin Operator Console: `data-layout-archetype="enterprise-ops-console"`
- **Design Tokens (Movement Q):**
  - Navy: `#0f172a`
  - Slate-800: `#1e293b`
  - Primary Blue: `#2563eb`
  - Success Emerald: `#059669`
  - Amber Alert: `#d97706`
  - Red Variance: `#dc2626`
  - Light Slate: `#f8fafc`
  - Typography: `Inter` for crisp UI, `IBM Plex Mono` for SKUs, HSN codes, and 12-digit Indian E-Way Bills.
- **V8 Isolate Snapshot Freeze Immunity:**
  - Lazy factory pattern on `functions/api/_store.js` ensures `Date.now()` and dynamic timestamps are evaluated strictly at request time.
  - Defensive client-side date guards prevent any timestamp evaluation prior to 2024.
- **Relational D1 Schema (`schema.sql` & `seed.sql`):**
  - `warehouses` (Kochi Port WH-01, Bangalore North WH-02, Mumbai JNPT WH-03, Calicut Depot WH-04)
  - `bin_locations` (Aisle, Rack, Tier coordinates)
  - `inventory_items` (Hex Bolts, Bearings, Hydraulic Valves, Actuators, V-Belts, Steppers, Gate Valves, Linear Guides, Filters, Contactors)
  - `warehouse_stock` (On-hand, reserved, in-transit)
  - `purchase_orders` & `po_items`
  - `goods_receipt_notes` & `grn_items` (Received vs accepted vs rejected)
  - `vendor_invoices` & `vendor_invoice_items`
  - `stock_transfers` & `stock_transfer_items` (12-digit E-Way bills `2410-XXXX-XXXX`)
  - `dealers` (B2B credit line balances & state-aware GST calculations)

---

## 2. Interactive Domain Widget: 3-Way Match Inspector

The 3-Way Match Inspector reconciles procurement documents across 3 operational layers:
1. **Purchase Order (PO):** Agreed contractual unit rates & ordered quantities.
2. **Goods Receipt Note (GRN):** Physical inward offloading count, QA acceptances, and transit damages.
3. **Vendor Tax Invoice:** Supplier billed rates, quantities, and GST ITC.

Automated variance delta engine computes:
- Item-level Quantity Variance: `Billed Qty - Accepted Qty`
- Item-level Price Variance: `Billed Rate - PO Agreed Rate`
- Total Commercial Exposure Delta (₹)
- Recommended Actions: `Approve for Disbursement`, `Request Credit Note`, `Audit Hold`

---

## 3. API Endpoints

- `GET /api/warehouses` — List all logistics hubs with branch summaries.
- `GET /api/inventory` — Query branch stock, filter by warehouse, category, low stock.
- `POST /api/inventory` — 1-click cycle count adjustments (physical count reconciliations).
- `GET /api/po` — Retrieve purchase orders and items.
- `POST /api/po` — Issue manual PO or trigger batch auto-replenishment.
- `GET /api/match` — Cross-referenced 3-way match sets with itemized variance flags.
- `POST /api/match` — Reconcile invoice (`APPROVE` | `CREDIT_NOTE` | `AUDIT_HOLD`).
- `GET /api/transfers` — Query inter-branch stock transfers and E-Way bills.
- `POST /api/transfers` — Dispatch STO with auto-generated 12-digit Indian E-Way bill.
- `GET /api/dealers` — B2B dealer credit line ledger.
- `POST /api/dealers` — Submit B2B dealer order with credit validation and intra/inter-state GST.

---

## 4. White-Label URL Overrides (`whitelabel.js`)

URL query parameters dynamically rebrand the entire application:
- `?brand=Tata+Steel+Logistics`
- `?tagline=Heavy+Industrial+Supply+Chain`
- `?primary=0284c7`
- `?wa=919847011223`
- `?reset_wl=1`
