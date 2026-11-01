/**
 * tpl-lerp-warehouse-erp: Core Data Store & Business Logic
 * Movement Q: Enterprise Multi-Branch 3-Way Match Data Grid (SAP Fiori / ERPNext v15)
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Safe against Cloudflare Workers V8 Isolate Snapshot Freeze:
 *    - All mock data, dates, and random generators are inside lazy factory functions
 *    - No top-level Date.now() or static timestamp evaluations during module import.
 * 2. Works both in-memory and binds to Cloudflare D1 (env.DB) when available.
 */

let _storeInstance = null;

function getTodayIso(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function getTodayTimeIso(daysOffset = 0, hoursOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function generateEwayBillNumber() {
  // 12-digit Indian E-Way bill format: 2410-XXXX-XXXX
  // 24 = state jurisdiction code, 10 = year/month prefix
  const part2 = Math.floor(1000 + Math.random() * 9000);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  return `2410-${part2}-${part3}`;
}

export function createInitialStore() {
  const warehouses = [
    {
      id: 'wh-kochi',
      code: 'WH-01',
      name: 'Kochi Port Logistics Hub',
      city: 'Kochi',
      state: 'Kerala',
      gst_in: '32AABCK1234F1Z5',
      address: 'Shed 4B, Willingdon Island Deep Water Logistics Corridor, Kochi 682003',
      is_active: 1
    },
    {
      id: 'wh-blr',
      code: 'WH-02',
      name: 'Bangalore North Industrial Hub',
      city: 'Bangalore',
      state: 'Karnataka',
      gst_in: '29AABCK1234F1Z8',
      address: 'Plot 14-A, Peenya Industrial Complex Phase 2, Bangalore 560058',
      is_active: 1
    },
    {
      id: 'wh-bom',
      code: 'WH-03',
      name: 'Mumbai JNPT Freight Terminal',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      gst_in: '27AABCK1234F1Z2',
      address: 'Sector 7, Nhava Sheva Special Cargo Zone, Navi Mumbai 400707',
      is_active: 1
    },
    {
      id: 'wh-cal',
      code: 'WH-04',
      name: 'Calicut Supply Depot',
      city: 'Kozhikode',
      state: 'Kerala',
      gst_in: '32AABCK1234F1Z5',
      address: 'Building 12, West Hill Industrial Estate, Kozhikode 673005',
      is_active: 1
    }
  ];

  const binLocations = [
    { id: 'bin-koc-01', warehouse_id: 'wh-kochi', aisle: 'A1', rack: 'R01', tier: 'T1', bin_code: 'KOC-A1-R01-T1' },
    { id: 'bin-koc-02', warehouse_id: 'wh-kochi', aisle: 'A1', rack: 'R02', tier: 'T2', bin_code: 'KOC-A1-R02-T2' },
    { id: 'bin-koc-03', warehouse_id: 'wh-kochi', aisle: 'B2', rack: 'R04', tier: 'T1', bin_code: 'KOC-B2-R04-T1' },
    { id: 'bin-koc-04', warehouse_id: 'wh-kochi', aisle: 'C1', rack: 'R01', tier: 'T3', bin_code: 'KOC-C1-R01-T3' },
    { id: 'bin-blr-01', warehouse_id: 'wh-blr',   aisle: 'A2', rack: 'R03', tier: 'T1', bin_code: 'BLR-A2-R03-T1' },
    { id: 'bin-blr-02', warehouse_id: 'wh-blr',   aisle: 'B1', rack: 'R01', tier: 'T2', bin_code: 'BLR-B1-R01-T2' },
    { id: 'bin-blr-03', warehouse_id: 'wh-blr',   aisle: 'B3', rack: 'R05', tier: 'T1', bin_code: 'BLR-B3-R05-T1' },
    { id: 'bin-bom-01', warehouse_id: 'wh-bom',   aisle: 'A1', rack: 'R01', tier: 'T1', bin_code: 'BOM-A1-R01-T1' },
    { id: 'bin-bom-02', warehouse_id: 'wh-bom',   aisle: 'A3', rack: 'R02', tier: 'T2', bin_code: 'BOM-A3-R02-T2' },
    { id: 'bin-bom-03', warehouse_id: 'wh-bom',   aisle: 'C2', rack: 'R04', tier: 'T1', bin_code: 'BOM-C2-R04-T1' },
    { id: 'bin-cal-01', warehouse_id: 'wh-cal',   aisle: 'A1', rack: 'R01', tier: 'T1', bin_code: 'CAL-A1-R01-T1' },
    { id: 'bin-cal-02', warehouse_id: 'wh-cal',   aisle: 'B1', rack: 'R02', tier: 'T2', bin_code: 'CAL-B1-R02-T2' }
  ];

  const items = [
    {
      id: 'item-01',
      sku: 'FAST-HEX-304-M12',
      name: 'SS 304 High-Tensile Hex Bolt M12 x 50mm (DIN 933)',
      category: 'Fasteners',
      uom: 'BOX (100 pcs)',
      reorder_level: 40,
      safety_stock: 20,
      unit_cost: 480.00,
      unit_price: 640.00,
      hsn_code: '73181500',
      gst_rate: 18.0
    },
    {
      id: 'item-02',
      sku: 'BEAR-FLG-UC205',
      name: 'UC205 Flanged Mounted Ball Bearing Unit (25mm Bore)',
      category: 'Bearings',
      uom: 'UNIT',
      reorder_level: 30,
      safety_stock: 15,
      unit_cost: 850.00,
      unit_price: 1150.00,
      hsn_code: '84821010',
      gst_rate: 18.0
    },
    {
      id: 'item-03',
      sku: 'HYD-DIR-VALV-02',
      name: '4WE6D Direct Solenoid Directional Control Valve 24VDC',
      category: 'Hydraulics',
      uom: 'UNIT',
      reorder_level: 15,
      safety_stock: 8,
      unit_cost: 4200.00,
      unit_price: 5800.00,
      hsn_code: '84812000',
      gst_rate: 18.0
    },
    {
      id: 'item-04',
      sku: 'PNEU-ACT-15552',
      name: 'ISO 15552 Pneumatic Tie-Rod Cylinder 63mm x 200mm',
      category: 'Pneumatics',
      uom: 'UNIT',
      reorder_level: 20,
      safety_stock: 10,
      unit_cost: 3100.00,
      unit_price: 4250.00,
      hsn_code: '84123100',
      gst_rate: 18.0
    },
    {
      id: 'item-05',
      sku: 'BELT-IND-B68',
      name: 'Heavy-Duty Classical V-Belt B-68 Heat/Oil Resistant',
      category: 'Power Transmission',
      uom: 'PC',
      reorder_level: 50,
      safety_stock: 25,
      unit_cost: 320.00,
      unit_price: 460.00,
      hsn_code: '40103200',
      gst_rate: 18.0
    },
    {
      id: 'item-06',
      sku: 'MTR-STEP-NEMA23',
      name: 'Hybrid High-Torque Stepper Motor NEMA 23 2.8Nm 4.2A',
      category: 'Automation',
      uom: 'UNIT',
      reorder_level: 25,
      safety_stock: 12,
      unit_cost: 2100.00,
      unit_price: 2950.00,
      hsn_code: '85011019',
      gst_rate: 18.0
    },
    {
      id: 'item-07',
      sku: 'VLV-GATE-CI-150',
      name: 'Cast Iron Flanged Gate Valve 2-Inch Class 150 PN16',
      category: 'Fluid Control',
      uom: 'UNIT',
      reorder_level: 15,
      safety_stock: 6,
      unit_cost: 3600.00,
      unit_price: 4900.00,
      hsn_code: '84818010',
      gst_rate: 18.0
    },
    {
      id: 'item-08',
      sku: 'LIN-GUIDE-HGR20',
      name: 'Precision Linear Motion Rail HGR20 1000mm + Carriage',
      category: 'Linear Motion',
      uom: 'SET',
      reorder_level: 20,
      safety_stock: 8,
      unit_cost: 5400.00,
      unit_price: 7200.00,
      hsn_code: '84669390',
      gst_rate: 18.0
    },
    {
      id: 'item-09',
      sku: 'PMP-FILT-VAC90',
      name: 'Rotary Vane Vacuum Pump Exhaust Filter Core 90mm',
      category: 'Filtration',
      uom: 'UNIT',
      reorder_level: 30,
      safety_stock: 15,
      unit_cost: 1450.00,
      unit_price: 1980.00,
      hsn_code: '84213990',
      gst_rate: 18.0
    },
    {
      id: 'item-10',
      sku: 'ELEC-CON-LC1D25',
      name: '3-Pole 25A Magnetic AC Contactor 220V Coil',
      category: 'Switchgear',
      uom: 'UNIT',
      reorder_level: 35,
      safety_stock: 18,
      unit_cost: 1120.00,
      unit_price: 1550.00,
      hsn_code: '85364900',
      gst_rate: 18.0
    }
  ];

  // Stock table mapping items to warehouses
  const warehouseStock = [
    { id: 'stk-koc-01', warehouse_id: 'wh-kochi', item_id: 'item-01', bin_code: 'KOC-A1-R01-T1', quantity_on_hand: 140, quantity_reserved: 25, quantity_in_transit: 0 },
    { id: 'stk-koc-02', warehouse_id: 'wh-kochi', item_id: 'item-02', bin_code: 'KOC-A1-R02-T2', quantity_on_hand: 45, quantity_reserved: 10, quantity_in_transit: 15 },
    { id: 'stk-koc-03', warehouse_id: 'wh-kochi', item_id: 'item-03', bin_code: 'KOC-B2-R04-T1', quantity_on_hand: 18, quantity_reserved: 4, quantity_in_transit: 0 },
    { id: 'stk-koc-04', warehouse_id: 'wh-kochi', item_id: 'item-04', bin_code: 'KOC-C1-R01-T3', quantity_on_hand: 32, quantity_reserved: 6, quantity_in_transit: 0 },
    { id: 'stk-koc-05', warehouse_id: 'wh-kochi', item_id: 'item-05', bin_code: 'KOC-A1-R01-T1', quantity_on_hand: 120, quantity_reserved: 30, quantity_in_transit: 0 },
    { id: 'stk-koc-06', warehouse_id: 'wh-kochi', item_id: 'item-06', bin_code: 'KOC-A1-R02-T2', quantity_on_hand: 42, quantity_reserved: 8, quantity_in_transit: 10 },
    { id: 'stk-koc-07', warehouse_id: 'wh-kochi', item_id: 'item-07', bin_code: 'KOC-B2-R04-T1', quantity_on_hand: 9, quantity_reserved: 2, quantity_in_transit: 0 },
    { id: 'stk-koc-08', warehouse_id: 'wh-kochi', item_id: 'item-08', bin_code: 'KOC-C1-R01-T3', quantity_on_hand: 28, quantity_reserved: 5, quantity_in_transit: 0 },
    { id: 'stk-koc-09', warehouse_id: 'wh-kochi', item_id: 'item-09', bin_code: 'KOC-A1-R01-T1', quantity_on_hand: 50, quantity_reserved: 12, quantity_in_transit: 0 },
    { id: 'stk-koc-10', warehouse_id: 'wh-kochi', item_id: 'item-10', bin_code: 'KOC-A1-R02-T2', quantity_on_hand: 65, quantity_reserved: 15, quantity_in_transit: 0 },

    { id: 'stk-blr-01', warehouse_id: 'wh-blr',   item_id: 'item-01', bin_code: 'BLR-A2-R03-T1', quantity_on_hand: 210, quantity_reserved: 40, quantity_in_transit: 0 },
    { id: 'stk-blr-02', warehouse_id: 'wh-blr',   item_id: 'item-02', bin_code: 'BLR-B1-R01-T2', quantity_on_hand: 85, quantity_reserved: 20, quantity_in_transit: 0 },
    { id: 'stk-blr-03', warehouse_id: 'wh-blr',   item_id: 'item-03', bin_code: 'BLR-B3-R05-T1', quantity_on_hand: 28, quantity_reserved: 5, quantity_in_transit: 10 },
    { id: 'stk-blr-04', warehouse_id: 'wh-blr',   item_id: 'item-04', bin_code: 'BLR-A2-R03-T1', quantity_on_hand: 44, quantity_reserved: 8, quantity_in_transit: 0 },
    { id: 'stk-blr-05', warehouse_id: 'wh-blr',   item_id: 'item-05', bin_code: 'BLR-B1-R01-T2', quantity_on_hand: 180, quantity_reserved: 50, quantity_in_transit: 0 },
    { id: 'stk-blr-06', warehouse_id: 'wh-blr',   item_id: 'item-06', bin_code: 'BLR-B3-R05-T1', quantity_on_hand: 60, quantity_reserved: 15, quantity_in_transit: 0 },
    { id: 'stk-blr-07', warehouse_id: 'wh-blr',   item_id: 'item-07', bin_code: 'BLR-A2-R03-T1', quantity_on_hand: 22, quantity_reserved: 4, quantity_in_transit: 0 },
    { id: 'stk-blr-08', warehouse_id: 'wh-blr',   item_id: 'item-08', bin_code: 'BLR-B1-R01-T2', quantity_on_hand: 36, quantity_reserved: 6, quantity_in_transit: 12 },
    { id: 'stk-blr-09', warehouse_id: 'wh-blr',   item_id: 'item-09', bin_code: 'BLR-B3-R05-T1', quantity_on_hand: 75, quantity_reserved: 18, quantity_in_transit: 0 },
    { id: 'stk-blr-10', warehouse_id: 'wh-blr',   item_id: 'item-10', bin_code: 'BLR-A2-R03-T1', quantity_on_hand: 95, quantity_reserved: 20, quantity_in_transit: 0 },

    { id: 'stk-bom-01', warehouse_id: 'wh-bom',   item_id: 'item-01', bin_code: 'BOM-A1-R01-T1', quantity_on_hand: 350, quantity_reserved: 60, quantity_in_transit: 0 },
    { id: 'stk-bom-02', warehouse_id: 'wh-bom',   item_id: 'item-02', bin_code: 'BOM-A3-R02-T2', quantity_on_hand: 140, quantity_reserved: 30, quantity_in_transit: 0 },
    { id: 'stk-bom-03', warehouse_id: 'wh-bom',   item_id: 'item-03', bin_code: 'BOM-C2-R04-T1', quantity_on_hand: 52, quantity_reserved: 10, quantity_in_transit: 0 },
    { id: 'stk-bom-04', warehouse_id: 'wh-bom',   item_id: 'item-04', bin_code: 'BOM-A1-R01-T1', quantity_on_hand: 65, quantity_reserved: 12, quantity_in_transit: 0 },
    { id: 'stk-bom-05', warehouse_id: 'wh-bom',   item_id: 'item-05', bin_code: 'BOM-A3-R02-T2', quantity_on_hand: 240, quantity_reserved: 40, quantity_in_transit: 20 },
    { id: 'stk-bom-06', warehouse_id: 'wh-bom',   item_id: 'item-06', bin_code: 'BOM-C2-R04-T1', quantity_on_hand: 90, quantity_reserved: 20, quantity_in_transit: 0 },
    { id: 'stk-bom-07', warehouse_id: 'wh-bom',   item_id: 'item-07', bin_code: 'BOM-A1-R01-T1', quantity_on_hand: 38, quantity_reserved: 8, quantity_in_transit: 0 },
    { id: 'stk-bom-08', warehouse_id: 'wh-bom',   item_id: 'item-08', bin_code: 'BOM-A3-R02-T2', quantity_on_hand: 58, quantity_reserved: 10, quantity_in_transit: 0 },
    { id: 'stk-bom-09', warehouse_id: 'wh-bom',   item_id: 'item-09', bin_code: 'BOM-C2-R04-T1', quantity_on_hand: 110, quantity_reserved: 25, quantity_in_transit: 0 },
    { id: 'stk-bom-10', warehouse_id: 'wh-bom',   item_id: 'item-10', bin_code: 'BOM-A1-R01-T1', quantity_on_hand: 130, quantity_reserved: 30, quantity_in_transit: 0 },

    { id: 'stk-cal-01', warehouse_id: 'wh-cal',   item_id: 'item-01', bin_code: 'CAL-A1-R01-T1', quantity_on_hand: 60, quantity_reserved: 10, quantity_in_transit: 20 },
    { id: 'stk-cal-02', warehouse_id: 'wh-cal',   item_id: 'item-02', bin_code: 'CAL-B1-R02-T2', quantity_on_hand: 20, quantity_reserved: 5, quantity_in_transit: 0 },
    { id: 'stk-cal-03', warehouse_id: 'wh-cal',   item_id: 'item-03', bin_code: 'CAL-A1-R01-T1', quantity_on_hand: 6, quantity_reserved: 2, quantity_in_transit: 0 },
    { id: 'stk-cal-04', warehouse_id: 'wh-cal',   item_id: 'item-04', bin_code: 'CAL-B1-R02-T2', quantity_on_hand: 12, quantity_reserved: 3, quantity_in_transit: 8 },
    { id: 'stk-cal-05', warehouse_id: 'wh-cal',   item_id: 'item-05', bin_code: 'CAL-A1-R01-T1', quantity_on_hand: 45, quantity_reserved: 10, quantity_in_transit: 0 },
    { id: 'stk-cal-06', warehouse_id: 'wh-cal',   item_id: 'item-06', bin_code: 'CAL-B1-R02-T2', quantity_on_hand: 15, quantity_reserved: 4, quantity_in_transit: 0 },
    { id: 'stk-cal-07', warehouse_id: 'wh-cal',   item_id: 'item-07', bin_code: 'CAL-A1-R01-T1', quantity_on_hand: 5, quantity_reserved: 1, quantity_in_transit: 0 },
    { id: 'stk-cal-08', warehouse_id: 'wh-cal',   item_id: 'item-08', bin_code: 'CAL-B1-R02-T2', quantity_on_hand: 10, quantity_reserved: 2, quantity_in_transit: 0 },
    { id: 'stk-cal-09', warehouse_id: 'wh-cal',   item_id: 'item-09', bin_code: 'CAL-A1-R01-T1', quantity_on_hand: 22, quantity_reserved: 5, quantity_in_transit: 0 },
    { id: 'stk-cal-10', warehouse_id: 'wh-cal',   item_id: 'item-10', bin_code: 'CAL-B1-R02-T2', quantity_on_hand: 30, quantity_reserved: 6, quantity_in_transit: 0 }
  ];

  const purchaseOrders = [
    {
      id: 'po-881',
      po_number: 'PO-2026-881',
      vendor_name: 'Bharat Fasteners & Alloys Ltd',
      vendor_gst: '27AABCB9988D1Z2',
      warehouse_id: 'wh-kochi',
      order_date: getTodayIso(-17),
      expected_date: getTodayIso(-10),
      subtotal: 48000.00,
      tax_amount: 8640.00,
      total_amount: 56640.00,
      status: 'APPROVED',
      items: [
        { id: 'poi-881-1', item_id: 'item-01', ordered_qty: 100, unit_rate: 480.00, tax_rate: 18.0, amount: 48000.00 }
      ]
    },
    {
      id: 'po-882',
      po_number: 'PO-2026-882',
      vendor_name: 'SKF India Bearings Ltd',
      vendor_gst: '29AABCS5544E1Z6',
      warehouse_id: 'wh-blr',
      order_date: getTodayIso(-14),
      expected_date: getTodayIso(-7),
      subtotal: 85000.00,
      tax_amount: 15300.00,
      total_amount: 100300.00,
      status: 'QTY_VARIANCE',
      items: [
        { id: 'poi-882-1', item_id: 'item-02', ordered_qty: 100, unit_rate: 850.00, tax_rate: 18.0, amount: 85000.00 }
      ]
    },
    {
      id: 'po-883',
      po_number: 'PO-2026-883',
      vendor_name: 'Rexroth Bosch Industrial',
      vendor_gst: '27AABCR1234F1Z9',
      warehouse_id: 'wh-bom',
      order_date: getTodayIso(-12),
      expected_date: getTodayIso(-4),
      subtotal: 126000.00,
      tax_amount: 22680.00,
      total_amount: 148680.00,
      status: 'PRICE_VARIANCE',
      items: [
        { id: 'poi-883-1', item_id: 'item-03', ordered_qty: 30, unit_rate: 4200.00, tax_rate: 18.0, amount: 126000.00 }
      ]
    },
    {
      id: 'po-884',
      po_number: 'PO-2026-884',
      vendor_name: 'Festo Pneumatics India Pvt Ltd',
      vendor_gst: '29AABCF3322G1Z1',
      warehouse_id: 'wh-cal',
      order_date: getTodayIso(-10),
      expected_date: getTodayIso(-2),
      subtotal: 124000.00,
      tax_amount: 22320.00,
      total_amount: 146320.00,
      status: 'REJECTION_VARIANCE',
      items: [
        { id: 'poi-884-1', item_id: 'item-04', ordered_qty: 40, unit_rate: 3100.00, tax_rate: 18.0, amount: 124000.00 }
      ]
    },
    {
      id: 'po-885',
      po_number: 'PO-2026-885',
      vendor_name: 'Siemens Motion Drives Ltd',
      vendor_gst: '27AABCS7766H1Z4',
      warehouse_id: 'wh-kochi',
      order_date: getTodayIso(-3),
      expected_date: getTodayIso(4),
      subtotal: 84000.00,
      tax_amount: 15120.00,
      total_amount: 99120.00,
      status: 'ISSUED',
      items: [
        { id: 'poi-885-1', item_id: 'item-06', ordered_qty: 40, unit_rate: 2100.00, tax_rate: 18.0, amount: 84000.00 }
      ]
    }
  ];

  const goodsReceiptNotes = [
    {
      id: 'grn-441',
      grn_number: 'GRN-2026-441',
      po_id: 'po-881',
      warehouse_id: 'wh-kochi',
      received_date: getTodayIso(-11),
      vehicle_no: 'KL-07-CD-4419',
      delivery_challan_no: 'DC-BFA-1092',
      received_by: 'Rajesh K. (Inward Storekeeper)',
      remarks: 'Full consignment verified in good order. 100 boxes received and palletized.',
      status: 'COMPLETED',
      items: [
        { id: 'grni-441-1', po_item_id: 'poi-881-1', item_id: 'item-01', received_qty: 100, accepted_qty: 100, rejected_qty: 0 }
      ]
    },
    {
      id: 'grn-442',
      grn_number: 'GRN-2026-442',
      po_id: 'po-882',
      warehouse_id: 'wh-blr',
      received_date: getTodayIso(-8),
      vehicle_no: 'KA-01-MJ-8821',
      delivery_challan_no: 'DC-SKF-8841',
      received_by: 'Suresh N. (WH Inspector)',
      remarks: 'Shortage detected: 90 units received vs 100 ordered on PO. Outer seal intact.',
      status: 'COMPLETED',
      items: [
        { id: 'grni-442-1', po_item_id: 'poi-882-1', item_id: 'item-02', received_qty: 90, accepted_qty: 90, rejected_qty: 0 }
      ]
    },
    {
      id: 'grn-443',
      grn_number: 'GRN-2026-443',
      po_id: 'po-883',
      warehouse_id: 'wh-bom',
      received_date: getTodayIso(-5),
      vehicle_no: 'MH-46-AZ-9901',
      delivery_challan_no: 'DC-REX-7721',
      received_by: 'Mahesh P. (QA Lead)',
      remarks: 'Physical quantity 30 units verified. Hydrostatic test certificates enclosed.',
      status: 'COMPLETED',
      items: [
        { id: 'grni-443-1', po_item_id: 'poi-883-1', item_id: 'item-03', received_qty: 30, accepted_qty: 30, rejected_qty: 0 }
      ]
    },
    {
      id: 'grn-444',
      grn_number: 'GRN-2026-444',
      po_id: 'po-884',
      warehouse_id: 'wh-cal',
      received_date: getTodayIso(-3),
      vehicle_no: 'KL-11-BE-3112',
      delivery_challan_no: 'DC-FES-4401',
      received_by: 'Kiran V. (Depot In-Charge)',
      remarks: '40 units offloaded: 32 accepted, 8 rejected due to bent rod packaging transit damage.',
      status: 'COMPLETED',
      items: [
        { id: 'grni-444-1', po_item_id: 'poi-884-1', item_id: 'item-04', received_qty: 40, accepted_qty: 32, rejected_qty: 8 }
      ]
    }
  ];

  const vendorInvoices = [
    {
      id: 'inv-901',
      invoice_number: 'INV-BFF-9021',
      po_id: 'po-881',
      vendor_name: 'Bharat Fasteners & Alloys Ltd',
      invoice_date: getTodayIso(-10),
      billed_subtotal: 48000.00,
      billed_tax: 8640.00,
      billed_total: 56640.00,
      status: 'APPROVED',
      reconciliation_notes: 'System automated 3-way match verified. Zero price delta, zero quantity variance. Approved for direct disbursement.',
      items: [
        { id: 'invi-901-1', item_id: 'item-01', billed_qty: 100, billed_rate: 480.00, billed_amount: 48000.00 }
      ]
    },
    {
      id: 'inv-902',
      invoice_number: 'INV-SKF-8812',
      po_id: 'po-882',
      vendor_name: 'SKF India Bearings Ltd',
      invoice_date: getTodayIso(-7),
      billed_subtotal: 85000.00,
      billed_tax: 15300.00,
      billed_total: 100300.00,
      status: 'FLAGGED_QTY_DELTA',
      reconciliation_notes: 'Variance Alert: Vendor billed for 100 units, but receiving storekeeper accepted only 90 units. 10 units short. Requires ₹10,030 debit note adjustment.',
      items: [
        { id: 'invi-902-1', item_id: 'item-02', billed_qty: 100, billed_rate: 850.00, billed_amount: 85000.00 }
      ]
    },
    {
      id: 'inv-903',
      invoice_number: 'INV-REX-4491',
      po_id: 'po-883',
      vendor_name: 'Rexroth Bosch Industrial',
      invoice_date: getTodayIso(-4),
      billed_subtotal: 135000.00,
      billed_tax: 24300.00,
      billed_total: 159300.00,
      status: 'FLAGGED_PRICE_DELTA',
      reconciliation_notes: 'Price Delta: PO approved rate is ₹4,200/unit, but invoice billed at ₹4,500/unit (+₹300/unit surcharge not agreed in PO contract).',
      items: [
        { id: 'invi-903-1', item_id: 'item-03', billed_qty: 30, billed_rate: 4500.00, billed_amount: 135000.00 }
      ]
    },
    {
      id: 'inv-904',
      invoice_number: 'INV-FES-1109',
      po_id: 'po-884',
      vendor_name: 'Festo Pneumatics India Pvt Ltd',
      invoice_date: getTodayIso(-2),
      billed_subtotal: 124000.00,
      billed_tax: 22320.00,
      billed_total: 146320.00,
      status: 'FLAGGED_REJECTION_HOLD',
      reconciliation_notes: 'Damage / Rejection Hold: 8 units rejected on GRN-444 due to damaged piston rods. Vendor invoice billed for full 40 units without deduction.',
      items: [
        { id: 'invi-904-1', item_id: 'item-04', billed_qty: 40, billed_rate: 3100.00, billed_amount: 124000.00 }
      ]
    }
  ];

  const stockTransfers = [
    {
      id: 'sto-101',
      sto_number: 'STO-2026-101',
      from_warehouse_id: 'wh-kochi',
      to_warehouse_id: 'wh-cal',
      status: 'IN_TRANSIT',
      dispatch_date: getTodayTimeIso(-1, -6),
      expected_delivery: getTodayTimeIso(1, 4),
      carrier_name: 'V-Trans Logistics India',
      vehicle_no: 'KL-07-CD-4419',
      eway_bill_no: '2410-8849-2104',
      eway_valid_until: getTodayTimeIso(2, 8),
      items: [
        { item_id: 'item-01', sku: 'FAST-HEX-304-M12', name: 'SS 304 High-Tensile Hex Bolt M12 x 50mm (DIN 933)', transfer_qty: 20 },
        { item_id: 'item-04', sku: 'PNEU-ACT-15552', name: 'ISO 15552 Pneumatic Tie-Rod Cylinder 63mm x 200mm', transfer_qty: 8 }
      ]
    },
    {
      id: 'sto-102',
      sto_number: 'STO-2026-102',
      from_warehouse_id: 'wh-bom',
      to_warehouse_id: 'wh-blr',
      status: 'IN_TRANSIT',
      dispatch_date: getTodayTimeIso(-2, -3),
      expected_delivery: getTodayTimeIso(0, 5),
      carrier_name: 'SafeXpress Cargo Ltd',
      vehicle_no: 'MH-46-AZ-9901',
      eway_bill_no: '2410-9122-3841',
      eway_valid_until: getTodayTimeIso(1, 12),
      items: [
        { item_id: 'item-03', sku: 'HYD-DIR-VALV-02', name: '4WE6D Direct Solenoid Directional Control Valve 24VDC', transfer_qty: 10 },
        { item_id: 'item-05', sku: 'BELT-IND-B68', name: 'Heavy-Duty Classical V-Belt B-68 Heat/Oil Resistant', transfer_qty: 20 }
      ]
    },
    {
      id: 'sto-103',
      sto_number: 'STO-2026-103',
      from_warehouse_id: 'wh-blr',
      to_warehouse_id: 'wh-kochi',
      status: 'DELIVERED',
      dispatch_date: getTodayTimeIso(-5, 0),
      expected_delivery: getTodayTimeIso(-3, 0),
      carrier_name: 'BlueDart Express Freight',
      vehicle_no: 'KA-01-MJ-8821',
      eway_bill_no: '2410-7714-5509',
      eway_valid_until: getTodayTimeIso(-2, 0),
      items: [
        { item_id: 'item-02', sku: 'BEAR-FLG-UC205', name: 'UC205 Flanged Mounted Ball Bearing Unit (25mm Bore)', transfer_qty: 15 },
        { item_id: 'item-06', sku: 'MTR-STEP-NEMA23', name: 'Hybrid High-Torque Stepper Motor NEMA 23 2.8Nm 4.2A', transfer_qty: 10 }
      ]
    }
  ];

  const dealers = [
    {
      id: 'dl-101',
      name: 'K. V. Ramanan',
      company: 'Malabar Industrial Machinery',
      gst_in: '32AABCM1122D1Z3',
      city: 'Kozhikode',
      state: 'Kerala',
      credit_limit: 2500000.00,
      available_credit: 1840000.00,
      status: 'ACTIVE'
    },
    {
      id: 'dl-102',
      name: 'Satish Hegde',
      company: 'Deccan Engineering & Hydraulics',
      gst_in: '29AABCD3344E1Z7',
      city: 'Bangalore',
      state: 'Karnataka',
      credit_limit: 4000000.00,
      available_credit: 3150000.00,
      status: 'ACTIVE'
    },
    {
      id: 'dl-103',
      name: 'Rohan Tendolkar',
      company: 'Konkan Marine & Hardware Supplies',
      gst_in: '27AABCK5566F1Z1',
      city: 'Mumbai',
      state: 'Maharashtra',
      credit_limit: 5000000.00,
      available_credit: 4420000.00,
      status: 'ACTIVE'
    },
    {
      id: 'dl-104',
      name: 'Deepak Nambiar',
      company: 'Apex Fab & Motion Controls',
      gst_in: '32AABCA7788G1Z9',
      city: 'Kochi',
      state: 'Kerala',
      credit_limit: 3000000.00,
      available_credit: 2280000.00,
      status: 'ACTIVE'
    }
  ];

  return {
    warehouses,
    binLocations,
    items,
    warehouseStock,
    purchaseOrders,
    goodsReceiptNotes,
    vendorInvoices,
    stockTransfers,
    dealers
  };
}

export function getStore() {
  if (!_storeInstance) {
    _storeInstance = createInitialStore();
  }
  return _storeInstance;
}

// --------------------------------------------------------------------------
// Domain Query & Mutation Methods
// --------------------------------------------------------------------------

export function getWarehouses() {
  const store = getStore();
  return store.warehouses.map(wh => {
    // calculate branch totals
    const stocks = store.warehouseStock.filter(s => s.warehouse_id === wh.id);
    const totalQty = stocks.reduce((acc, s) => acc + s.quantity_on_hand, 0);
    const skuCount = stocks.filter(s => s.quantity_on_hand > 0).length;
    const pendingTransfers = store.stockTransfers.filter(t => (t.from_warehouse_id === wh.id || t.to_warehouse_id === wh.id) && t.status === 'IN_TRANSIT').length;

    return {
      ...wh,
      total_quantity: totalQty,
      active_skus: skuCount,
      pending_transfers: pendingTransfers
    };
  });
}

export function getInventory(filters = {}) {
  const store = getStore();
  const whFilter = filters.warehouse_id || 'all';
  const catFilter = filters.category || 'all';
  const searchQuery = (filters.search || '').trim().toLowerCase();
  const lowStockOnly = filters.low_stock === 'true' || filters.low_stock === true;

  // Build items combined with stock details
  return store.items.map(item => {
    // Get stock records across warehouses or for specific warehouse
    const stocks = store.warehouseStock.filter(s => {
      if (whFilter !== 'all' && s.warehouse_id !== whFilter) return false;
      return s.item_id === item.id;
    });

    const onHand = stocks.reduce((sum, s) => sum + s.quantity_on_hand, 0);
    const reserved = stocks.reduce((sum, s) => sum + s.quantity_reserved, 0);
    const inTransit = stocks.reduce((sum, s) => sum + s.quantity_in_transit, 0);
    const available = Math.max(0, onHand - reserved);
    const isLowStock = onHand <= item.safety_stock;

    // Detailed branch stock breakdown
    const branchStock = store.warehouses.map(wh => {
      const match = store.warehouseStock.find(s => s.warehouse_id === wh.id && s.item_id === item.id);
      return {
        warehouse_id: wh.id,
        warehouse_code: wh.code,
        warehouse_name: wh.name,
        bin_code: match ? match.bin_code : 'N/A',
        on_hand: match ? match.quantity_on_hand : 0,
        reserved: match ? match.quantity_reserved : 0,
        in_transit: match ? match.quantity_in_transit : 0,
        available: match ? Math.max(0, match.quantity_on_hand - match.quantity_reserved) : 0
      };
    });

    return {
      ...item,
      total_on_hand: onHand,
      total_reserved: reserved,
      total_in_transit: inTransit,
      total_available: available,
      total_value: onHand * item.unit_cost,
      is_low_stock: isLowStock,
      branches: branchStock
    };
  }).filter(item => {
    if (catFilter !== 'all' && item.category.toLowerCase() !== catFilter.toLowerCase()) return false;
    if (lowStockOnly && !item.is_low_stock) return false;
    if (searchQuery) {
      const matchSku = item.sku.toLowerCase().includes(searchQuery);
      const matchName = item.name.toLowerCase().includes(searchQuery);
      const matchCat = item.category.toLowerCase().includes(searchQuery);
      const matchHsn = item.hsn_code.includes(searchQuery);
      if (!matchSku && !matchName && !matchCat && !matchHsn) return false;
    }
    return true;
  });
}

export function adjustStock({ warehouse_id, item_id, adjustment_qty, reason, note }) {
  const store = getStore();
  let stock = store.warehouseStock.find(s => s.warehouse_id === warehouse_id && s.item_id === item_id);
  const qty = parseInt(adjustment_qty, 10);

  if (!stock) {
    stock = {
      id: `stk-${Date.now()}`,
      warehouse_id,
      item_id,
      bin_code: 'DYNAMIC-BIN',
      quantity_on_hand: 0,
      quantity_reserved: 0,
      quantity_in_transit: 0
    };
    store.warehouseStock.push(stock);
  }

  const prevQty = stock.quantity_on_hand;
  stock.quantity_on_hand = Math.max(0, stock.quantity_on_hand + qty);

  return {
    success: true,
    warehouse_id,
    item_id,
    previous_qty: prevQty,
    new_qty: stock.quantity_on_hand,
    delta: qty,
    reason: reason || 'CYCLE_COUNT_ADJUSTMENT',
    note: note || 'Physical count verification adjustment recorded.',
    updated_at: new Date().toISOString()
  };
}

export function getPurchaseOrders(filters = {}) {
  const store = getStore();
  return store.purchaseOrders.map(po => {
    const wh = store.warehouses.find(w => w.id === po.warehouse_id);
    const populatedItems = (po.items || []).map(poi => {
      const itemMaster = store.items.find(i => i.id === poi.item_id);
      return {
        ...poi,
        sku: itemMaster ? itemMaster.sku : poi.item_id,
        name: itemMaster ? itemMaster.name : 'Unknown Item',
        uom: itemMaster ? itemMaster.uom : 'UNIT',
        hsn_code: itemMaster ? itemMaster.hsn_code : 'N/A'
      };
    });

    return {
      ...po,
      warehouse_code: wh ? wh.code : 'WH-??',
      warehouse_name: wh ? wh.name : 'Central Hub',
      items: populatedItems
    };
  }).filter(po => {
    if (filters.warehouse_id && filters.warehouse_id !== 'all' && po.warehouse_id !== filters.warehouse_id) return false;
    if (filters.status && po.status !== filters.status) return false;
    return true;
  });
}

export function createPurchaseOrder({ vendor_name, vendor_gst, warehouse_id, items, expected_days = 7 }) {
  const store = getStore();
  const nextNum = 880 + store.purchaseOrders.length + 1;
  const po_number = `PO-2026-${nextNum}`;
  const po_id = `po-${nextNum}`;

  let subtotal = 0;
  let tax_amount = 0;

  const orderItems = (items || []).map((it, idx) => {
    const itemMaster = store.items.find(i => i.id === it.item_id || i.sku === it.sku);
    const rate = parseFloat(it.unit_rate || (itemMaster ? itemMaster.unit_cost : 100));
    const qty = parseInt(it.ordered_qty || 10, 10);
    const amt = rate * qty;
    const taxRate = itemMaster ? itemMaster.gst_rate : 18.0;
    subtotal += amt;
    tax_amount += (amt * taxRate) / 100;

    return {
      id: `poi-${nextNum}-${idx + 1}`,
      po_id,
      item_id: itemMaster ? itemMaster.id : it.item_id,
      ordered_qty: qty,
      unit_rate: rate,
      tax_rate: taxRate,
      amount: amt
    };
  });

  const total_amount = subtotal + tax_amount;
  const newPO = {
    id: po_id,
    po_number,
    vendor_name: vendor_name || 'Industrial Vendor Partners Ltd',
    vendor_gst: vendor_gst || '27AABCU1234F1Z1',
    warehouse_id: warehouse_id || 'wh-kochi',
    order_date: getTodayIso(),
    expected_date: getTodayIso(parseInt(expected_days, 10)),
    subtotal,
    tax_amount,
    total_amount,
    status: 'ISSUED',
    items: orderItems
  };

  store.purchaseOrders.unshift(newPO);
  return newPO;
}

export function getMatchSets() {
  const store = getStore();

  // Cross-reference POs, GRNs, and Vendor Invoices
  return store.vendorInvoices.map(invoice => {
    const po = store.purchaseOrders.find(p => p.id === invoice.po_id);
    const grn = store.goodsReceiptNotes.find(g => g.po_id === invoice.po_id);
    const wh = po ? store.warehouses.find(w => w.id === po.warehouse_id) : null;

    // Line-item 3-way reconciliation
    const lineAnalysis = (invoice.items || []).map(invItem => {
      const itemMaster = store.items.find(i => i.id === invItem.item_id);
      const poItem = po ? (po.items || []).find(pi => pi.item_id === invItem.item_id) : null;
      const grnItem = grn ? (grn.items || []).find(gi => gi.item_id === invItem.item_id) : null;

      const orderedQty = poItem ? poItem.ordered_qty : 0;
      const poRate = poItem ? poItem.unit_rate : invItem.billed_rate;
      const receivedQty = grnItem ? grnItem.received_qty : 0;
      const acceptedQty = grnItem ? grnItem.accepted_qty : 0;
      const rejectedQty = grnItem ? grnItem.rejected_qty : 0;
      const billedQty = invItem.billed_qty;
      const billedRate = invItem.billed_rate;

      // Variance calculations
      const qtyDelta = billedQty - acceptedQty; // >0 means over-billed relative to what was accepted
      const rateDelta = billedRate - poRate;    // >0 means price inflation
      const hasQtyVariance = qtyDelta !== 0;
      const hasPriceVariance = rateDelta !== 0;
      const hasRejection = rejectedQty > 0;

      let lineStatus = 'MATCHED';
      if (hasQtyVariance && hasPriceVariance) lineStatus = 'PRICE_AND_QTY_VARIANCE';
      else if (hasQtyVariance) lineStatus = 'QTY_SHORTAGE';
      else if (hasPriceVariance) lineStatus = 'PRICE_DELTA';
      else if (hasRejection) lineStatus = 'REJECTED_DAMAGES';

      return {
        item_id: invItem.item_id,
        sku: itemMaster ? itemMaster.sku : invItem.item_id,
        name: itemMaster ? itemMaster.name : 'Component',
        uom: itemMaster ? itemMaster.uom : 'UNIT',
        po_rate: poRate,
        billed_rate: billedRate,
        ordered_qty: orderedQty,
        received_qty: receivedQty,
        accepted_qty: acceptedQty,
        rejected_qty: rejectedQty,
        billed_qty: billedQty,
        qty_delta: qtyDelta,
        rate_delta: rateDelta,
        price_variance_amount: rateDelta * billedQty,
        qty_variance_amount: qtyDelta * poRate,
        line_status: lineStatus
      };
    });

    // Header level variance
    const poTotal = po ? po.total_amount : 0;
    const billedTotal = invoice.billed_total;
    const totalDelta = billedTotal - poTotal;

    const anyQtyVariance = lineAnalysis.some(l => l.qty_delta !== 0);
    const anyPriceVariance = lineAnalysis.some(l => l.rate_delta !== 0);
    const anyRejections = lineAnalysis.some(l => l.rejected_qty > 0);

    let matchStatus = invoice.status;
    let matchType = '3-WAY PERFECT MATCH';
    let badgeClass = 'badge-success';

    if (matchStatus === 'APPROVED' || matchStatus === 'MATCHED_APPROVED') {
      matchType = '3-WAY MATCHED & APPROVED';
      badgeClass = 'badge-success';
    } else if (matchStatus === 'AUDIT_HOLD') {
      matchType = 'AUDIT HOLD (INVESTIGATION)';
      badgeClass = 'badge-danger';
    } else if (matchStatus === 'CREDIT_NOTE_REQUESTED') {
      matchType = 'CREDIT NOTE REQUESTED';
      badgeClass = 'badge-amber';
    } else if (anyPriceVariance) {
      matchType = 'PRICE VARIANCE DETECTED';
      badgeClass = 'badge-danger';
    } else if (anyQtyVariance) {
      matchType = 'QUANTITY VARIANCE (SHORTAGE)';
      badgeClass = 'badge-amber';
    } else if (anyRejections) {
      matchType = 'QA REJECTION VARIANCE';
      badgeClass = 'badge-danger';
    }

    return {
      match_id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      vendor_name: invoice.vendor_name,
      warehouse_id: po ? po.warehouse_id : null,
      warehouse_name: wh ? wh.name : 'Central Hub',
      po_number: po ? po.po_number : 'PO-N/A',
      po_date: po ? po.order_date : 'N/A',
      po_total: poTotal,
      grn_number: grn ? grn.grn_number : 'GRN-PENDING',
      grn_date: grn ? grn.received_date : 'N/A',
      grn_vehicle: grn ? grn.vehicle_no : 'N/A',
      grn_challan: grn ? grn.delivery_challan_no : 'N/A',
      grn_remarks: grn ? grn.remarks : '',
      billed_subtotal: invoice.billed_subtotal,
      billed_tax: invoice.billed_tax,
      billed_total: billedTotal,
      total_variance: totalDelta,
      status: invoice.status,
      match_type: matchType,
      badge_class: badgeClass,
      reconciliation_notes: invoice.reconciliation_notes || '',
      lines: lineAnalysis
    };
  });
}

export function reconcileMatch({ match_id, action, notes }) {
  const store = getStore();
  const inv = store.vendorInvoices.find(i => i.id === match_id || i.invoice_number === match_id);
  if (!inv) {
    return { success: false, error: 'INVOICE_NOT_FOUND', message: `Invoice ${match_id} not found` };
  }

  let newStatus = inv.status;
  if (action === 'APPROVE' || action === 'APPROVE_DISBURSEMENT') {
    newStatus = 'APPROVED';
  } else if (action === 'CREDIT_NOTE' || action === 'REQUEST_CREDIT_NOTE') {
    newStatus = 'CREDIT_NOTE_REQUESTED';
  } else if (action === 'AUDIT_HOLD' || action === 'HOLD') {
    newStatus = 'AUDIT_HOLD';
  }

  inv.status = newStatus;
  inv.reconciliation_notes = notes || `Action [${newStatus}] applied on ${new Date().toISOString()}`;

  // Update corresponding PO status if exists
  const po = store.purchaseOrders.find(p => p.id === inv.po_id);
  if (po) {
    po.status = newStatus;
  }

  return {
    success: true,
    invoice_number: inv.invoice_number,
    action,
    new_status: newStatus,
    notes: inv.reconciliation_notes,
    reconciled_at: new Date().toISOString()
  };
}

export function getStockTransfers(filters = {}) {
  const store = getStore();
  return store.stockTransfers.map(st => {
    const fromWh = store.warehouses.find(w => w.id === st.from_warehouse_id);
    const toWh = store.warehouses.find(w => w.id === st.to_warehouse_id);

    return {
      ...st,
      from_warehouse_code: fromWh ? fromWh.code : 'WH-??',
      from_warehouse_name: fromWh ? fromWh.name : 'Unknown Hub',
      from_city: fromWh ? fromWh.city : '',
      to_warehouse_code: toWh ? toWh.code : 'WH-??',
      to_warehouse_name: toWh ? toWh.name : 'Unknown Hub',
      to_city: toWh ? toWh.city : '',
      total_items_count: (st.items || []).reduce((acc, i) => acc + i.transfer_qty, 0)
    };
  }).filter(st => {
    if (filters.warehouse_id && filters.warehouse_id !== 'all') {
      if (st.from_warehouse_id !== filters.warehouse_id && st.to_warehouse_id !== filters.warehouse_id) return false;
    }
    if (filters.status && st.status !== filters.status) return false;
    return true;
  });
}

export function createStockTransfer({ from_warehouse_id, to_warehouse_id, carrier_name, vehicle_no, items }) {
  const store = getStore();
  const nextNum = 100 + store.stockTransfers.length + 1;
  const sto_number = `STO-2026-${nextNum}`;
  const sto_id = `sto-${nextNum}`;
  const eway_bill_no = generateEwayBillNumber();

  // Deduct from source warehouse, mark as in transit
  const parsedItems = (items || []).map(it => {
    const itemMaster = store.items.find(i => i.id === it.item_id || i.sku === it.sku);
    const qty = parseInt(it.transfer_qty || 1, 10);

    if (itemMaster) {
      const srcStock = store.warehouseStock.find(s => s.warehouse_id === from_warehouse_id && s.item_id === itemMaster.id);
      if (srcStock) {
        srcStock.quantity_on_hand = Math.max(0, srcStock.quantity_on_hand - qty);
        srcStock.quantity_in_transit += qty;
      }
    }

    return {
      item_id: itemMaster ? itemMaster.id : it.item_id,
      sku: itemMaster ? itemMaster.sku : it.sku,
      name: itemMaster ? itemMaster.name : 'Material',
      transfer_qty: qty
    };
  });

  const newSTO = {
    id: sto_id,
    sto_number,
    from_warehouse_id,
    to_warehouse_id,
    status: 'IN_TRANSIT',
    dispatch_date: getTodayTimeIso(0, 0),
    expected_delivery: getTodayTimeIso(2, 0),
    carrier_name: carrier_name || 'National Express Logistics',
    vehicle_no: (vehicle_no || 'KA-04-TR-9921').toUpperCase(),
    eway_bill_no,
    eway_valid_until: getTodayTimeIso(3, 0),
    items: parsedItems
  };

  store.stockTransfers.unshift(newSTO);
  return newSTO;
}

export function getDealers() {
  const store = getStore();
  return store.dealers.map(d => ({
    ...d,
    utilization_percent: Math.round(((d.credit_limit - d.available_credit) / d.credit_limit) * 100)
  }));
}

export function createDealerOrder({ dealer_id, warehouse_id, items, po_ref, notes }) {
  const store = getStore();
  const dealer = store.dealers.find(d => d.id === dealer_id);
  if (!dealer) {
    return { success: false, error: 'DEALER_NOT_FOUND', message: 'Selected dealer not found' };
  }

  const wh = store.warehouses.find(w => w.id === warehouse_id) || store.warehouses[0];
  const isIntraState = dealer.state === wh.state;

  let subtotal = 0;
  const orderLines = (items || []).map(it => {
    const itemMaster = store.items.find(i => i.id === it.item_id || i.sku === it.sku);
    const rate = itemMaster ? itemMaster.unit_price : 1000;
    const qty = parseInt(it.quantity || 1, 10);
    const lineTotal = rate * qty;
    subtotal += lineTotal;

    // Deduct warehouse available stock / mark reserved
    const stock = store.warehouseStock.find(s => s.warehouse_id === wh.id && s.item_id === (itemMaster ? itemMaster.id : it.item_id));
    if (stock) {
      stock.quantity_reserved += qty;
    }

    return {
      sku: itemMaster ? itemMaster.sku : it.sku,
      name: itemMaster ? itemMaster.name : 'Item',
      uom: itemMaster ? itemMaster.uom : 'UNIT',
      quantity: qty,
      rate,
      amount: lineTotal
    };
  });

  const taxRate = 18.0;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  if (dealer.available_credit < grandTotal) {
    return {
      success: false,
      error: 'CREDIT_LIMIT_EXCEEDED',
      message: `Order total ₹${grandTotal.toLocaleString('en-IN')} exceeds dealer available credit ₹${dealer.available_credit.toLocaleString('en-IN')}`
    };
  }

  // Deduct dealer available credit
  dealer.available_credit -= grandTotal;

  const orderId = `DLR-ORD-${Date.now().toString().slice(-6)}`;
  return {
    success: true,
    order_id: orderId,
    dealer_id: dealer.id,
    dealer_name: dealer.company,
    warehouse_id: wh.id,
    warehouse_name: wh.name,
    is_intra_state: isIntraState,
    tax_split: isIntraState ? { cgst_9: taxAmount / 2, sgst_9: taxAmount / 2 } : { igst_18: taxAmount },
    subtotal,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    remaining_credit: dealer.available_credit,
    items: orderLines,
    status: 'CONFIRMED_RESERVED',
    po_ref: po_ref || `B2B-PO-${Date.now().toString().slice(-4)}`,
    created_at: new Date().toISOString()
  };
}

export function autoGenerateLowStockPOs() {
  const store = getStore();
  const lowStockItems = [];

  store.items.forEach(item => {
    store.warehouses.forEach(wh => {
      const stock = store.warehouseStock.find(s => s.warehouse_id === wh.id && s.item_id === item.id);
      const onHand = stock ? stock.quantity_on_hand : 0;
      if (onHand <= item.safety_stock) {
        lowStockItems.push({
          warehouse_id: wh.id,
          warehouse_code: wh.code,
          warehouse_name: wh.name,
          item_id: item.id,
          sku: item.sku,
          name: item.name,
          on_hand: onHand,
          safety_stock: item.safety_stock,
          reorder_qty: Math.max(item.reorder_level * 2, 50)
        });
      }
    });
  });

  if (lowStockItems.length === 0) {
    return { success: true, count: 0, message: 'All warehouse stock levels are healthy above safety stock.' };
  }

  // Group by warehouse
  const groupedByWh = {};
  lowStockItems.forEach(rec => {
    if (!groupedByWh[rec.warehouse_id]) groupedByWh[rec.warehouse_id] = [];
    groupedByWh[rec.warehouse_id].push(rec);
  });

  const createdPOs = [];
  Object.keys(groupedByWh).forEach(whId => {
    const lines = groupedByWh[whId].map(rec => ({
      item_id: rec.item_id,
      ordered_qty: rec.reorder_qty
    }));

    const po = createPurchaseOrder({
      vendor_name: 'Industrial OEM Direct Dispatch Ltd',
      vendor_gst: '27AABCD9911K1Z3',
      warehouse_id: whId,
      items: lines,
      expected_days: 5
    });
    createdPOs.push(po);
  });

  return {
    success: true,
    count: createdPOs.length,
    orders: createdPOs,
    message: `Generated ${createdPOs.length} batch replenishment POs for ${lowStockItems.length} low-stock SKU lines.`
  };
}
