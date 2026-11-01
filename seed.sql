-- ============================================================================
-- tpl-lerp-warehouse-erp: D1 SQLite Database Seed Data
-- 4 Hubs, Industrial Engineering Hardware, Real 3-Way Match Records, STOs & Dealers
-- ============================================================================

-- 1. Warehouses
INSERT INTO warehouses (id, code, name, city, state, gst_in, address, is_active) VALUES
('wh-kochi', 'WH-01', 'Kochi Port Logistics Hub', 'Kochi', 'Kerala', '32AABCK1234F1Z5', 'Shed 4B, Willingdon Island Deep Water Logistics Corridor, Kochi 682003', 1),
('wh-blr',   'WH-02', 'Bangalore North Industrial Hub', 'Bangalore', 'Karnataka', '29AABCK1234F1Z8', 'Plot 14-A, Peenya Industrial Complex Phase 2, Bangalore 560058', 1),
('wh-bom',   'WH-03', 'Mumbai JNPT Freight Terminal', 'Navi Mumbai', 'Maharashtra', '27AABCK1234F1Z2', 'Sector 7, Nhava Sheva Special Cargo Zone, Navi Mumbai 400707', 1),
('wh-cal',   'WH-04', 'Calicut Supply Depot', 'Kozhikode', 'Kerala', '32AABCK1234F1Z5', 'Building 12, West Hill Industrial Estate, Kozhikode 673005', 1);

-- 2. Bin Locations
INSERT INTO bin_locations (id, warehouse_id, aisle, rack, tier, bin_code) VALUES
('bin-koc-01', 'wh-kochi', 'A1', 'R01', 'T1', 'KOC-A1-R01-T1'),
('bin-koc-02', 'wh-kochi', 'A1', 'R02', 'T2', 'KOC-A1-R02-T2'),
('bin-koc-03', 'wh-kochi', 'B2', 'R04', 'T1', 'KOC-B2-R04-T1'),
('bin-koc-04', 'wh-kochi', 'C1', 'R01', 'T3', 'KOC-C1-R01-T3'),
('bin-blr-01', 'wh-blr',   'A2', 'R03', 'T1', 'BLR-A2-R03-T1'),
('bin-blr-02', 'wh-blr',   'B1', 'R01', 'T2', 'BLR-B1-R01-T2'),
('bin-blr-03', 'wh-blr',   'B3', 'R05', 'T1', 'BLR-B3-R05-T1'),
('bin-bom-01', 'wh-bom',   'A1', 'R01', 'T1', 'BOM-A1-R01-T1'),
('bin-bom-02', 'wh-bom',   'A3', 'R02', 'T2', 'BOM-A3-R02-T2'),
('bin-bom-03', 'wh-bom',   'C2', 'R04', 'T1', 'BOM-C2-R04-T1'),
('bin-cal-01', 'wh-cal',   'A1', 'R01', 'T1', 'CAL-A1-R01-T1'),
('bin-cal-02', 'wh-cal',   'B1', 'R02', 'T2', 'CAL-B1-R02-T2');

-- 3. Inventory Items
INSERT INTO inventory_items (id, sku, name, category, uom, reorder_level, safety_stock, unit_cost, unit_price, hsn_code, gst_rate) VALUES
('item-01', 'FAST-HEX-304-M12', 'SS 304 High-Tensile Hex Bolt M12 x 50mm (DIN 933)', 'Fasteners', 'BOX (100 pcs)', 40, 20, 480.00, 640.00, '73181500', 18.0),
('item-02', 'BEAR-FLG-UC205',   'UC205 Flanged Mounted Ball Bearing Unit (25mm Bore)', 'Bearings', 'UNIT', 30, 15, 850.00, 1150.00, '84821010', 18.0),
('item-03', 'HYD-DIR-VALV-02',  '4WE6D Direct Solenoid Directional Control Valve 24VDC', 'Hydraulics', 'UNIT', 15, 8, 4200.00, 5800.00, '84812000', 18.0),
('item-04', 'PNEU-ACT-15552',   'ISO 15552 Pneumatic Tie-Rod Cylinder 63mm x 200mm', 'Pneumatics', 'UNIT', 20, 10, 3100.00, 4250.00, '84123100', 18.0),
('item-05', 'BELT-IND-B68',     'Heavy-Duty Classical V-Belt B-68 Heat/Oil Resistant', 'Power Transmission', 'PC', 50, 25, 320.00, 460.00, '40103200', 18.0),
('item-06', 'MTR-STEP-NEMA23',  'Hybrid High-Torque Stepper Motor NEMA 23 2.8Nm 4.2A', 'Automation', 'UNIT', 25, 12, 2100.00, 2950.00, '85011019', 18.0),
('item-07', 'VLV-GATE-CI-150',  'Cast Iron Flanged Gate Valve 2-Inch Class 150 PN16', 'Fluid Control', 'UNIT', 15, 6, 3600.00, 4900.00, '84818010', 18.0),
('item-08', 'LIN-GUIDE-HGR20',  'Precision Linear Motion Rail HGR20 1000mm + Carriage', 'Linear Motion', 'SET', 20, 8, 5400.00, 7200.00, '84669390', 18.0),
('item-09', 'PMP-FILT-VAC90',   'Rotary Vane Vacuum Pump Exhaust Filter Core 90mm', 'Filtration', 'UNIT', 30, 15, 1450.00, 1980.00, '84213990', 18.0),
('item-10', 'ELEC-CON-LC1D25',  '3-Pole 25A Magnetic AC Contactor 220V Coil', 'Switchgear', 'UNIT', 35, 18, 1120.00, 1550.00, '85364900', 18.0);

-- 4. Warehouse Stock
INSERT INTO warehouse_stock (id, warehouse_id, item_id, bin_id, quantity_on_hand, quantity_reserved, quantity_in_transit) VALUES
('stk-koc-01', 'wh-kochi', 'item-01', 'bin-koc-01', 140, 25, 0),
('stk-koc-02', 'wh-kochi', 'item-02', 'bin-koc-02', 45, 10, 15),
('stk-koc-03', 'wh-kochi', 'item-03', 'bin-koc-03', 18, 4, 0),
('stk-koc-04', 'wh-kochi', 'item-04', 'bin-koc-04', 32, 6, 0),
('stk-koc-05', 'wh-kochi', 'item-05', 'bin-koc-01', 120, 30, 0),
('stk-koc-06', 'wh-kochi', 'item-06', 'bin-koc-02', 42, 8, 10),
('stk-koc-07', 'wh-kochi', 'item-07', 'bin-koc-03', 9, 2, 0), -- Low stock alert (< safety 10)
('stk-koc-08', 'wh-kochi', 'item-08', 'bin-koc-04', 28, 5, 0),
('stk-koc-09', 'wh-kochi', 'item-09', 'bin-koc-01', 50, 12, 0),
('stk-koc-10', 'wh-kochi', 'item-10', 'bin-koc-02', 65, 15, 0),

('stk-blr-01', 'wh-blr',   'item-01', 'bin-blr-01', 210, 40, 0),
('stk-blr-02', 'wh-blr',   'item-02', 'bin-blr-02', 85, 20, 0),
('stk-blr-03', 'wh-blr',   'item-03', 'bin-blr-03', 28, 5, 10),
('stk-blr-04', 'wh-blr',   'item-04', 'bin-blr-01', 44, 8, 0),
('stk-blr-05', 'wh-blr',   'item-05', 'bin-blr-02', 180, 50, 0),
('stk-blr-06', 'wh-blr',   'item-06', 'bin-blr-03', 60, 15, 0),
('stk-blr-07', 'wh-blr',   'item-07', 'bin-blr-01', 22, 4, 0),
('stk-blr-08', 'wh-blr',   'item-08', 'bin-blr-02', 36, 6, 12),
('stk-blr-09', 'wh-blr',   'item-09', 'bin-blr-03', 75, 18, 0),
('stk-blr-10', 'wh-blr',   'item-10', 'bin-blr-01', 95, 20, 0),

('stk-bom-01', 'wh-bom',   'item-01', 'bin-bom-01', 350, 60, 0),
('stk-bom-02', 'wh-bom',   'item-02', 'bin-bom-02', 140, 30, 0),
('stk-bom-03', 'wh-bom',   'item-03', 'bin-bom-03', 52, 10, 0),
('stk-bom-04', 'wh-bom',   'item-04', 'bin-bom-01', 65, 12, 0),
('stk-bom-05', 'wh-bom',   'item-05', 'bin-bom-02', 240, 40, 20),
('stk-bom-06', 'wh-bom',   'item-06', 'bin-bom-03', 90, 20, 0),
('stk-bom-07', 'wh-bom',   'item-07', 'bin-bom-01', 38, 8, 0),
('stk-bom-08', 'wh-bom',   'item-08', 'bin-bom-02', 58, 10, 0),
('stk-bom-09', 'wh-bom',   'item-09', 'bin-bom-03', 110, 25, 0),
('stk-bom-10', 'wh-bom',   'item-10', 'bin-bom-01', 130, 30, 0),

('stk-cal-01', 'wh-cal',   'item-01', 'bin-cal-01', 60, 10, 20),
('stk-cal-02', 'wh-cal',   'item-02', 'bin-cal-02', 20, 5, 0),
('stk-cal-03', 'wh-cal',   'item-03', 'bin-cal-01', 6, 2, 0), -- Low stock alert (< safety 8)
('stk-cal-04', 'wh-cal',   'item-04', 'bin-cal-02', 12, 3, 8),
('stk-cal-05', 'wh-cal',   'item-05', 'bin-cal-01', 45, 10, 0),
('stk-cal-06', 'wh-cal',   'item-06', 'bin-cal-02', 15, 4, 0),
('stk-cal-07', 'wh-cal',   'item-07', 'bin-cal-01', 5, 1, 0), -- Low stock alert (< safety 6)
('stk-cal-08', 'wh-cal',   'item-08', 'bin-cal-02', 10, 2, 0),
('stk-cal-09', 'wh-cal',   'item-09', 'bin-cal-01', 22, 5, 0),
('stk-cal-10', 'wh-cal',   'item-10', 'bin-cal-02', 30, 6, 0);

-- 5. Purchase Orders
INSERT INTO purchase_orders (id, po_number, vendor_name, vendor_gst, warehouse_id, order_date, expected_date, subtotal, tax_amount, total_amount, status) VALUES
('po-881', 'PO-2026-881', 'Bharat Fasteners & Alloys Ltd', '27AABCB9988D1Z2', 'wh-kochi', '2026-10-15', '2026-10-22', 48000.00, 8640.00, 56640.00, 'MATCHED_APPROVED'),
('po-882', 'PO-2026-882', 'SKF India Bearings Ltd', '29AABCS5544E1Z6', 'wh-blr',   '2026-10-18', '2026-10-25', 85000.00, 15300.00, 100300.00, 'QTY_VARIANCE_FLAG'),
('po-883', 'PO-2026-883', 'Rexroth Bosch Industrial', '27AABCR1234F1Z9', 'wh-bom',   '2026-10-20', '2026-10-28', 126000.00, 22680.00, 148680.00, 'PRICE_VARIANCE_FLAG'),
('po-884', 'PO-2026-884', 'Festo Pneumatics India Pvt Ltd', '29AABCF3322G1Z1', 'wh-cal',   '2026-10-22', '2026-10-30', 124000.00, 22320.00, 146320.00, 'REJECTION_VARIANCE_FLAG'),
('po-885', 'PO-2026-885', 'Siemens Motion Drives Ltd', '27AABCS7766H1Z4', 'wh-kochi', '2026-10-29', '2026-11-05', 84000.00, 15120.00, 99120.00, 'ISSUED_AWAITING_GRN');

-- 6. Purchase Order Items
INSERT INTO po_items (id, po_id, item_id, ordered_qty, unit_rate, tax_rate, amount) VALUES
('poi-881-1', 'po-881', 'item-01', 100, 480.00, 18.0, 48000.00),
('poi-882-1', 'po-882', 'item-02', 100, 850.00, 18.0, 85000.00),
('poi-883-1', 'po-883', 'item-03', 30, 4200.00, 18.0, 126000.00),
('poi-884-1', 'po-884', 'item-04', 40, 3100.00, 18.0, 124000.00),
('poi-885-1', 'po-885', 'item-06', 40, 2100.00, 18.0, 84000.00);

-- 7. Goods Receipt Notes (GRN)
INSERT INTO goods_receipt_notes (id, grn_number, po_id, warehouse_id, received_date, vehicle_no, delivery_challan_no, received_by, remarks, status) VALUES
('grn-441', 'GRN-2026-441', 'po-881', 'wh-kochi', '2026-10-21', 'KL-07-CD-4419', 'DC-BFA-1092', 'Rajesh K. (Inward Storekeeper)', 'Full consignment verified in good order. 100 boxes received and palletized.', 'VERIFIED'),
('grn-442', 'GRN-2026-442', 'po-882', 'wh-blr',   '2026-10-24', 'KA-01-MJ-8821', 'DC-SKF-8841', 'Suresh N. (WH Inspector)', 'Shortage detected: 90 units received vs 100 ordered on PO. Outer seal intact.', 'SHORT_RECEIVED'),
('grn-443', 'GRN-2026-443', 'po-883', 'wh-bom',   '2026-10-27', 'MH-46-AZ-9901', 'DC-REX-7721', 'Mahesh P. (QA Lead)', 'Physical quantity 30 units verified. Hydrostatic test certificates enclosed.', 'VERIFIED'),
('grn-444', 'GRN-2026-444', 'po-884', 'wh-cal',   '2026-10-29', 'KL-11-BE-3112', 'DC-FES-4401', 'Kiran V. (Depot In-Charge)', '40 units offloaded: 32 accepted, 8 rejected due to bent rod packaging transit damage.', 'PARTIAL_REJECTION');

-- 8. GRN Items
INSERT INTO grn_items (id, grn_id, po_item_id, item_id, received_qty, accepted_qty, rejected_qty) VALUES
('grni-441-1', 'grn-441', 'poi-881-1', 'item-01', 100, 100, 0),
('grni-442-1', 'grn-442', 'poi-882-1', 'item-02', 90, 90, 0),
('grni-443-1', 'grn-443', 'poi-883-1', 'item-03', 30, 30, 0),
('grni-444-1', 'grn-444', 'poi-884-1', 'item-04', 40, 32, 8);

-- 9. Vendor Invoices
INSERT INTO vendor_invoices (id, invoice_number, po_id, vendor_name, invoice_date, billed_subtotal, billed_tax, billed_total, status) VALUES
('inv-901', 'INV-BFF-9021', 'po-881', 'Bharat Fasteners & Alloys Ltd', '2026-10-22', 48000.00, 8640.00, 56640.00, 'MATCHED_APPROVED'),
('inv-902', 'INV-SKF-8812', 'po-882', 'SKF India Bearings Ltd', '2026-10-25', 85000.00, 15300.00, 100300.00, 'FLAGGED_QTY_DELTA'),
('inv-903', 'INV-REX-4491', 'po-883', 'Rexroth Bosch Industrial', '2026-10-28', 135000.00, 24300.00, 159300.00, 'FLAGGED_PRICE_DELTA'),
('inv-904', 'INV-FES-1109', 'po-884', 'Festo Pneumatics India Pvt Ltd', '2026-10-30', 124000.00, 22320.00, 146320.00, 'FLAGGED_REJECTION_HOLD');

-- 10. Vendor Invoice Items
INSERT INTO vendor_invoice_items (id, invoice_id, item_id, billed_qty, billed_rate, billed_amount) VALUES
('invi-901-1', 'inv-901', 'item-01', 100, 480.00, 48000.00), -- Exact match (100 @ 480 = 48000)
('invi-902-1', 'inv-902', 'item-02', 100, 850.00, 85000.00), -- Billed 100, but only 90 accepted at GRN
('invi-903-1', 'inv-903', 'item-03', 30, 4500.00, 135000.00), -- Billed @ 4500 vs PO agreed @ 4200 (+₹300/unit)
('invi-904-1', 'inv-904', 'item-04', 40, 3100.00, 124000.00); -- Billed 40, but 8 rejected on QA

-- 11. Stock Transfers (STOs)
INSERT INTO stock_transfers (id, sto_number, from_warehouse_id, to_warehouse_id, status, dispatch_date, expected_delivery, carrier_name, vehicle_no, eway_bill_no, eway_valid_until) VALUES
('sto-101', 'STO-2026-101', 'wh-kochi', 'wh-cal', 'IN_TRANSIT', '2026-10-31 08:30', '2026-11-01 18:00', 'V-Trans Logistics India', 'KL-07-CD-4419', '2410-8849-2104', '2026-11-03 23:59'),
('sto-102', 'STO-2026-102', 'wh-bom',   'wh-blr', 'IN_TRANSIT', '2026-10-30 14:15', '2026-11-02 20:00', 'SafeXpress Cargo Ltd', 'MH-46-AZ-9901', '2410-9122-3841', '2026-11-04 23:59'),
('sto-103', 'STO-2026-103', 'wh-blr',   'wh-kochi', 'DELIVERED',  '2026-10-27 09:00', '2026-10-29 16:30', 'BlueDart Express Freight', 'KA-01-MJ-8821', '2410-7714-5509', '2026-10-31 23:59');

-- 12. Stock Transfer Items
INSERT INTO stock_transfer_items (id, transfer_id, item_id, transfer_qty) VALUES
('stoi-101-1', 'sto-101', 'item-01', 20),
('stoi-101-2', 'sto-101', 'item-04', 8),
('stoi-102-1', 'sto-102', 'item-03', 10),
('stoi-102-2', 'sto-102', 'item-05', 20),
('stoi-103-1', 'sto-103', 'item-02', 15),
('stoi-103-2', 'sto-103', 'item-06', 10);

-- 13. Dealers
INSERT INTO dealers (id, name, company, gst_in, city, credit_limit, available_credit, status) VALUES
('dl-101', 'K. V. Ramanan',     'Malabar Industrial Machinery', '32AABCM1122D1Z3', 'Kozhikode', 2500000.00, 1840000.00, 'ACTIVE'),
('dl-102', 'Satish Hegde',      'Deccan Engineering & Hydraulics', '29AABCD3344E1Z7', 'Bangalore', 4000000.00, 3150000.00, 'ACTIVE'),
('dl-103', 'Rohan Tendolkar',   'Konkan Marine & Hardware Supplies', '27AABCK5566F1Z1', 'Mumbai', 5000000.00, 4420000.00, 'ACTIVE'),
('dl-104', 'Deepak Nambiar',    'Apex Fab & Motion Controls', '32AABCA7788G1Z9', 'Kochi', 3000000.00, 2280000.00, 'ACTIVE');
