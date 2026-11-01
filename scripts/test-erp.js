/**
 * scripts/test-erp.js
 * Verification Test Suite for Ticket 6.1:
 * "Multi-Branch Inventory, Purchase Order & B2B Dealer ERP (tpl-lerp-warehouse-erp)"
 *
 * Verifies:
 * 1. Schema & Seed completeness (13 tables, 4 warehouses, 10 engineering items)
 * 2. V8 Isolate Snapshot Freeze Immunity & Lazy Factory Store logic
 * 3. 3-Way Match Variance Calculations (Zero delta, Qty variance, Price variance, QA rejections)
 * 4. 12-Digit Indian E-Way Bill format generation (2410-XXXX-XXXX)
 * 5. B2B Dealer order credit checks & GST split (Intra-state vs Inter-state)
 * 6. Low-stock batch replenishment PO generator
 * 7. Cloudflare Pages Function route handlers
 * 8. HTML Layout Archetypes (enterprise-warehouse-erp & enterprise-ops-console)
 * 9. Whitelabel contract & CSS tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================================');
  console.log('🧪 Starting tpl-lerp-warehouse-erp Automated Verification Suite');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Schema & Seed Verification
  // --------------------------------------------------------------------------
  console.log('\x1b[36m[Group 1] Database Relational Schema & Seed Verification\x1b[0m');
  const schemaPath = path.join(rootDir, 'schema.sql');
  const seedPath = path.join(rootDir, 'seed.sql');

  assert(fs.existsSync(schemaPath), 'schema.sql file exists');
  assert(fs.existsSync(seedPath), 'seed.sql file exists');

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const requiredTables = [
    'warehouses', 'bin_locations', 'inventory_items', 'warehouse_stock',
    'purchase_orders', 'po_items', 'goods_receipt_notes', 'grn_items',
    'vendor_invoices', 'vendor_invoice_items', 'stock_transfers',
    'stock_transfer_items', 'dealers'
  ];

  requiredTables.forEach(t => {
    assert(schemaContent.includes(`CREATE TABLE ${t}`), `Schema declares table: ${t}`);
  });

  const seedContent = fs.readFileSync(seedPath, 'utf8');
  assert(seedContent.includes('wh-kochi') && seedContent.includes('wh-blr') && seedContent.includes('wh-bom') && seedContent.includes('wh-cal'), 'Seed contains all 4 logistics hubs (Kochi, BLR, Mumbai, Calicut)');
  assert(seedContent.includes('FAST-HEX-304-M12') && seedContent.includes('BEAR-FLG-UC205'), 'Seed contains industrial components (Hex Bolts, Bearings)');
  assert(seedContent.includes('2410-8849-2104'), 'Seed contains genuine 12-digit Indian E-Way bill format');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Store Logic & V8 Freeze Safe Initialization
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 2] Store & V8 Isolate Snapshot Freeze Immunity\x1b[0m');
  const store = await import('../functions/api/_store.js');

  const warehouses = store.getWarehouses();
  assert(warehouses.length === 4, `getWarehouses() returns 4 hubs (received ${warehouses.length})`);
  assert(warehouses.every(w => w.total_quantity > 0), 'All hubs have calculated stock summaries');

  const inventory = store.getInventory();
  assert(inventory.length >= 10, `getInventory() returns catalog items (found ${inventory.length})`);
  const hexBolt = inventory.find(i => i.sku === 'FAST-HEX-304-M12');
  assert(hexBolt && hexBolt.total_on_hand > 0, 'Inventory item stock rollup correctly sums on-hand across branches');

  // Test stock adjustment
  const initialKochiBolt = hexBolt.branches.find(b => b.warehouse_id === 'wh-kochi').on_hand;
  const adjResult = store.adjustStock({
    warehouse_id: 'wh-kochi',
    item_id: hexBolt.id,
    adjustment_qty: 15,
    reason: 'CYCLE_COUNT_TEST'
  });
  assert(adjResult.success && adjResult.new_qty === initialKochiBolt + 15, 'adjustStock() successfully records physical count variance');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: 3-Way Match Variance Delta Engine
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 3] 3-Way Match Variance Delta Engine\x1b[0m');
  const matchSets = store.getMatchSets();
  assert(matchSets.length >= 4, `getMatchSets() returns at least 4 test cases (received ${matchSets.length})`);

  // Case 1: PO-881 (Bharat Fasteners) — Perfect Match
  const case1 = matchSets.find(m => m.po_number === 'PO-2026-881');
  assert(case1 !== undefined, 'Case 1 (PO-2026-881) present');
  assert(case1.total_variance === 0, `Case 1 total variance is exactly 0 (received ${case1.total_variance})`);
  assert(case1.lines.every(l => l.qty_delta === 0 && l.rate_delta === 0), 'Case 1 lines have 0 qty delta and 0 price delta');

  // Case 2: PO-882 (SKF Bearings) — Quantity Shortage Variance
  const case2 = matchSets.find(m => m.po_number === 'PO-2026-882');
  assert(case2 !== undefined, 'Case 2 (PO-2026-882) present');
  const case2Line = case2.lines[0];
  assert(case2Line.qty_delta === 10, `Case 2 detects 10 units shortage (received delta: ${case2Line.qty_delta})`);
  assert(case2Line.line_status === 'QTY_SHORTAGE', `Case 2 flags status QTY_SHORTAGE (received ${case2Line.line_status})`);

  // Case 3: PO-883 (Rexroth) — Price Delta Variance
  const case3 = matchSets.find(m => m.po_number === 'PO-2026-883');
  assert(case3 !== undefined, 'Case 3 (PO-2026-883) present');
  const case3Line = case3.lines[0];
  assert(case3Line.rate_delta === 300, `Case 3 detects ₹300/unit price inflation delta (received ${case3Line.rate_delta})`);
  assert(case3Line.line_status === 'PRICE_DELTA', `Case 3 flags status PRICE_DELTA (received ${case3Line.line_status})`);

  // Case 4: PO-884 (Festo) — QA Rejection Damages Variance
  const case4 = matchSets.find(m => m.po_number === 'PO-2026-884');
  assert(case4 !== undefined, 'Case 4 (PO-2026-884) present');
  const case4Line = case4.lines[0];
  assert(case4Line.rejected_qty === 8, `Case 4 captures 8 rejected units on GRN (received ${case4Line.rejected_qty})`);

  // Test reconciliation mutation
  const reconcileRes = store.reconcileMatch({
    match_id: case2.match_id,
    action: 'REQUEST_CREDIT_NOTE',
    notes: 'Requested ₹10,030 debit note from SKF Bearings'
  });
  assert(reconcileRes.success && reconcileRes.new_status === 'CREDIT_NOTE_REQUESTED', 'reconcileMatch() successfully updates status to CREDIT_NOTE_REQUESTED');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: STO & 12-Digit Indian E-Way Bill Format
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 4] STO Dispatch & 12-Digit Indian E-Way Bill Format\x1b[0m');
  const transfers = store.getStockTransfers();
  assert(transfers.length >= 3, `getStockTransfers() returns existing STOs (count: ${transfers.length})`);

  const ewayRegex = /^2410-\d{4}-\d{4}$/;
  assert(transfers.every(t => ewayRegex.test(t.eway_bill_no)), 'All existing transfers have valid 12-digit Indian E-Way Bill format (2410-XXXX-XXXX)');

  const newSto = store.createStockTransfer({
    from_warehouse_id: 'wh-kochi',
    to_warehouse_id: 'wh-cal',
    carrier_name: 'V-Trans Logistics Ltd',
    vehicle_no: 'KL-07-CD-9988',
    items: [{ item_id: 'item-01', transfer_qty: 5 }]
  });
  assert(newSto && newSto.sto_number.startsWith('STO-2026-'), 'createStockTransfer() creates formatted STO number');
  assert(ewayRegex.test(newSto.eway_bill_no), `createStockTransfer() generated valid Indian E-Way bill format: ${newSto.eway_bill_no}`);
  assert(newSto.status === 'IN_TRANSIT', 'New STO initiates with status IN_TRANSIT');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: B2B Dealer Ledger & GST Logic
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 5] B2B Dealer Credit Ledger & State-Aware GST\x1b[0m');
  const dealers = store.getDealers();
  assert(dealers.length === 4, `getDealers() returns 4 dealers (received ${dealers.length})`);
  assert(dealers.every(d => d.credit_limit > 0 && d.available_credit <= d.credit_limit), 'Dealer credit limits and available balances are consistent');

  // Place intra-state order (Dealer in Kerala, Warehouse in Kerala)
  const keralaDealer = dealers.find(d => d.state === 'Kerala');
  const prevCredit = keralaDealer.available_credit;
  const orderRes = store.createDealerOrder({
    dealer_id: keralaDealer.id,
    warehouse_id: 'wh-kochi',
    items: [{ item_id: 'item-01', quantity: 2 }]
  });

  assert(orderRes.success, 'Dealer order placed successfully');
  assert(orderRes.is_intra_state === true, 'Intra-state transaction correctly identified');
  assert(orderRes.tax_split.cgst_9 !== undefined && orderRes.tax_split.sgst_9 !== undefined, 'Intra-state order generates 9% CGST + 9% SGST split');
  const updatedDealer = store.getDealers().find(d => d.id === keralaDealer.id);
  assert(orderRes.remaining_credit < prevCredit && updatedDealer.available_credit < prevCredit, 'Dealer available credit is correctly deducted');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Batch Auto-PO Replenishment
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 6] Low-Stock Auto-PO Batch Replenishment\x1b[0m');
  const autoPoResult = store.autoGenerateLowStockPOs();
  assert(autoPoResult.success === true, 'autoGenerateLowStockPOs() executed without errors');
  assert(autoPoResult.count >= 1, `Auto-PO generator successfully identified low-stock items and issued ${autoPoResult.count} POs`);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Cloudflare Functions Route Handlers
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 7] Cloudflare Pages Function Route Endpoints\x1b[0m');
  const whModule = await import('../functions/api/warehouses.js');
  const invModule = await import('../functions/api/inventory.js');
  const poModule = await import('../functions/api/po.js');
  const matchModule = await import('../functions/api/match.js');
  const transferModule = await import('../functions/api/transfers.js');
  const dealerModule = await import('../functions/api/dealers.js');
  const routeModule = await import('../functions/api/[[route]].js');

  const mockContext = (urlStr, method = 'GET', body = null) => ({
    request: new Request(urlStr, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    })
  });

  // GET /api/warehouses
  const resWh = await whModule.onRequestGet(mockContext('https://test.local/api/warehouses'));
  assert(resWh.status === 200, 'GET /api/warehouses returns 200');
  const jsonWh = await resWh.json();
  assert(jsonWh.success && jsonWh.count === 4, 'GET /api/warehouses payload valid');

  // GET /api/inventory
  const resInv = await invModule.onRequestGet(mockContext('https://test.local/api/inventory?category=Fasteners'));
  assert(resInv.status === 200, 'GET /api/inventory returns 200');
  const jsonInv = await resInv.json();
  assert(jsonInv.success && jsonInv.items.length > 0, 'GET /api/inventory filters by category');

  // POST /api/inventory (Stock adjustment)
  const resAdj = await invModule.onRequestPost(mockContext('https://test.local/api/inventory', 'POST', {
    warehouse_id: 'wh-blr',
    item_id: 'item-02',
    adjustment_qty: 5,
    reason: 'CYCLE_COUNT_API_TEST'
  }));
  assert(resAdj.status === 200, 'POST /api/inventory returns 200 for stock adjustment');

  // GET /api/match
  const resMatch = await matchModule.onRequestGet(mockContext('https://test.local/api/match'));
  assert(resMatch.status === 200, 'GET /api/match returns 200');
  const jsonMatch = await resMatch.json();
  assert(jsonMatch.success && jsonMatch.match_sets.length >= 4, 'GET /api/match returns match sets');

  // POST /api/match
  const resReconcile = await matchModule.onRequestPost(mockContext('https://test.local/api/match', 'POST', {
    match_id: 'inv-903',
    action: 'AUDIT_HOLD',
    notes: 'Price discrepancy hold via API test'
  }));
  assert(resReconcile.status === 200, 'POST /api/match returns 200 for reconciliation');

  // GET /api/transfers
  const resTransfers = await transferModule.onRequestGet(mockContext('https://test.local/api/transfers'));
  assert(resTransfers.status === 200, 'GET /api/transfers returns 200');

  // GET /api/dealers
  const resDealers = await dealerModule.onRequestGet(mockContext('https://test.local/api/dealers'));
  assert(resDealers.status === 200, 'GET /api/dealers returns 200');

  // Catch-all overview /api
  const resOverview = await routeModule.onRequest(mockContext('https://test.local/api'));
  assert(resOverview.status === 200, 'GET /api overview returns 200');

  // Health check /api/health
  const resHealth = await routeModule.onRequest(mockContext('https://test.local/api/health'));
  assert(resHealth.status === 200, 'GET /api/health returns 200');
  const jsonHealth = await resHealth.json();
  assert(jsonHealth.status === 'healthy', 'GET /api/health status is healthy');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: HTML Layout Archetypes & Craftsmanship
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 8] HTML Layout Archetypes & Anti-Clone Compliance\x1b[0m');
  const indexHtmlPath = path.join(rootDir, 'public', 'index.html');
  const adminHtmlPath = path.join(rootDir, 'public', 'admin.html');

  assert(fs.existsSync(indexHtmlPath), 'public/index.html exists');
  assert(fs.existsSync(adminHtmlPath), 'public/admin.html exists');

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

  assert(indexHtml.includes('data-layout-archetype="enterprise-warehouse-erp"'), 'public/index.html has data-layout-archetype="enterprise-warehouse-erp"');
  assert(adminHtml.includes('data-layout-archetype="enterprise-ops-console"'), 'public/admin.html has data-layout-archetype="enterprise-ops-console"');

  assert(indexHtml.includes('data-wl-brand'), 'public/index.html includes [data-wl-brand]');
  assert(adminHtml.includes('data-wl-brand'), 'public/admin.html includes [data-wl-brand]');

  assert(indexHtml.includes('id="floatingWaBtn"'), 'public/index.html includes #floatingWaBtn');
  assert(adminHtml.includes('id="adminWaInput"'), 'public/admin.html includes #adminWaInput');

  // Anti-placeholder checks
  const placeholders = ['lorem ipsum', 'dolor sit amet', 'placeholder text', 'temp item', 'todo: implement'];
  placeholders.forEach(ph => {
    assert(!indexHtml.toLowerCase().includes(ph), `public/index.html contains zero "${ph}" placeholders`);
    assert(!adminHtml.toLowerCase().includes(ph), `public/admin.html contains zero "${ph}" placeholders`);
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 9: Theme Tokens & Whitelabel Contract
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 9] Movement Q Theme Tokens & Whitelabel Contract\x1b[0m');
  const cssPath = path.join(rootDir, 'public', 'theme-tokens.css');
  const wlPath = path.join(rootDir, 'public', 'whitelabel.js');

  assert(fs.existsSync(cssPath), 'theme-tokens.css exists');
  assert(fs.existsSync(wlPath), 'whitelabel.js exists');

  const css = fs.readFileSync(cssPath, 'utf8');
  assert(css.includes('--color-primary: #2563eb;'), 'CSS token --color-primary is #2563eb (primary blue)');
  assert(css.includes('#0f172a'), 'CSS token contains #0f172a (navy)');
  assert(css.includes('#1e293b'), 'CSS token contains #1e293b (slate-800)');
  assert(css.includes('#059669'), 'CSS token contains #059669 (success emerald)');
  assert(css.includes('#d97706'), 'CSS token contains #d97706 (amber alert)');
  assert(css.includes('#dc2626'), 'CSS token contains #dc2626 (red variance)');

  const wl = fs.readFileSync(wlPath, 'utf8');
  assert(wl.includes('bmad_wl_config'), 'whitelabel.js has sessionStorage persistence');
  assert(wl.includes('reset_wl'), 'whitelabel.js supports reset_wl=1');
  assert(!wl.includes('Kaka by Eliza'), 'whitelabel.js has zero legacy Kaka by Eliza references');

  console.log('\n======================================================================');
  console.log(`Test Execution Complete: \x1b[32m${passedTests} Passed\x1b[0m, \x1b[31m${failedTests} Failed\x1b[0m`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
