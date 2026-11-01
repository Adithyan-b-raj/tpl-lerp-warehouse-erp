-- ============================================================================
-- tpl-lerp-warehouse-erp: D1 SQLite Database Schema
-- Multi-Branch Inventory, Purchase Order & B2B Dealer ERP
-- Architectural Movement Q: Enterprise Multi-Branch 3-Way Match Data Grid
-- ============================================================================

DROP TABLE IF EXISTS stock_transfer_items;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS vendor_invoice_items;
DROP TABLE IF EXISTS vendor_invoices;
DROP TABLE IF EXISTS grn_items;
DROP TABLE IF EXISTS goods_receipt_notes;
DROP TABLE IF EXISTS po_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS warehouse_stock;
DROP TABLE IF EXISTS bin_locations;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS dealers;
DROP TABLE IF EXISTS warehouses;

-- 1. Warehouses (Multi-Branch Logistics Hubs)
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  gst_in TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bin Locations (Aisle / Rack / Tier Coordinates)
CREATE TABLE bin_locations (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  aisle TEXT NOT NULL,
  rack TEXT NOT NULL,
  tier TEXT NOT NULL,
  bin_code TEXT NOT NULL UNIQUE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- 3. Inventory Master Items (Engineering & Industrial Hardware)
CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  uom TEXT NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  safety_stock INTEGER NOT NULL DEFAULT 5,
  unit_cost REAL NOT NULL DEFAULT 0.0,
  unit_price REAL NOT NULL DEFAULT 0.0,
  hsn_code TEXT NOT NULL,
  gst_rate REAL NOT NULL DEFAULT 18.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Warehouse Stock (Per-Branch Ledger & On-Hand Balances)
CREATE TABLE warehouse_stock (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  bin_id TEXT,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  quantity_in_transit INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (bin_id) REFERENCES bin_locations(id) ON DELETE SET NULL,
  UNIQUE(warehouse_id, item_id)
);

-- 5. Purchase Orders
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_gst TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  expected_date TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0.0,
  tax_amount REAL NOT NULL DEFAULT 0.0,
  total_amount REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 6. Purchase Order Items
CREATE TABLE po_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  ordered_qty INTEGER NOT NULL,
  unit_rate REAL NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 18.0,
  amount REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- 7. Goods Receipt Notes (GRN)
CREATE TABLE goods_receipt_notes (
  id TEXT PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  po_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  received_date TEXT NOT NULL,
  vehicle_no TEXT,
  delivery_challan_no TEXT,
  received_by TEXT NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 8. GRN Items (Received vs Accepted vs Rejected)
CREATE TABLE grn_items (
  id TEXT PRIMARY KEY,
  grn_id TEXT NOT NULL,
  po_item_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  received_qty INTEGER NOT NULL,
  accepted_qty INTEGER NOT NULL,
  rejected_qty INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (po_item_id) REFERENCES po_items(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- 9. Vendor Invoices (Billed Values)
CREATE TABLE vendor_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  po_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  billed_subtotal REAL NOT NULL,
  billed_tax REAL NOT NULL,
  billed_total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

-- 10. Vendor Invoice Items
CREATE TABLE vendor_invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  billed_qty INTEGER NOT NULL,
  billed_rate REAL NOT NULL,
  billed_amount REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES vendor_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- 11. Inter-Branch Stock Transfers (STO)
CREATE TABLE stock_transfers (
  id TEXT PRIMARY KEY,
  sto_number TEXT NOT NULL UNIQUE,
  from_warehouse_id TEXT NOT NULL,
  to_warehouse_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISPATCHED',
  dispatch_date TEXT NOT NULL,
  expected_delivery TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  eway_bill_no TEXT NOT NULL,
  eway_valid_until TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id)
);

-- 12. Stock Transfer Items
CREATE TABLE stock_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  transfer_qty INTEGER NOT NULL,
  FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- 13. Dealers (B2B Credit & Trade Accounts)
CREATE TABLE dealers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  gst_in TEXT NOT NULL,
  city TEXT NOT NULL,
  credit_limit REAL NOT NULL,
  available_credit REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_stock_wh ON warehouse_stock(warehouse_id);
CREATE INDEX idx_stock_item ON warehouse_stock(item_id);
CREATE INDEX idx_po_wh ON purchase_orders(warehouse_id);
CREATE INDEX idx_grn_po ON goods_receipt_notes(po_id);
CREATE INDEX idx_inv_po ON vendor_invoices(po_id);
CREATE INDEX idx_sto_status ON stock_transfers(status);
