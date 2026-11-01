import { getWarehouses, getInventory, getMatchSets, getStockTransfers } from './_store.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Health check endpoint
  if (path.endsWith('/health')) {
    return new Response(JSON.stringify({
      service: 'tpl-lerp-warehouse-erp',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      architecture: 'Movement Q: Enterprise Multi-Branch 3-Way Match Data Grid',
      archetypes: {
        storefront: 'enterprise-warehouse-erp',
        admin: 'enterprise-ops-console'
      }
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // Summary API overview
  try {
    const warehouses = getWarehouses();
    const inventory = getInventory();
    const matchSets = getMatchSets();
    const transfers = getStockTransfers();

    return new Response(JSON.stringify({
      service: 'tpl-lerp-warehouse-erp',
      status: 'ok',
      movement: 'Movement Q: Enterprise Multi-Branch Data Grid (SAP Fiori / ERPNext v15 / Ramp)',
      hubs_count: warehouses.length,
      active_sku_lines: inventory.length,
      pending_matches: matchSets.filter(m => m.status !== 'APPROVED').length,
      active_transfers: transfers.filter(t => t.status === 'IN_TRANSIT').length,
      endpoints: [
        'GET /api/warehouses',
        'GET /api/inventory?warehouse_id=...&category=...&search=...&low_stock=...',
        'POST /api/inventory (adjust stock)',
        'GET /api/po?warehouse_id=...&status=...',
        'POST /api/po (issue purchase order or auto_replenish)',
        'GET /api/match (3-way PO-GRN-Invoice variance inspection)',
        'POST /api/match (reconcile: APPROVE | CREDIT_NOTE | AUDIT_HOLD)',
        'GET /api/transfers?warehouse_id=...&status=...',
        'POST /api/transfers (dispatch inter-branch STO with 12-digit Indian E-Way bill)',
        'GET /api/dealers',
        'POST /api/dealers (place dealer B2B order with credit check and GST)'
      ]
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ service: 'tpl-lerp-warehouse-erp', status: 'error', error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
