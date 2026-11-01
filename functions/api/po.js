import { getPurchaseOrders, createPurchaseOrder, autoGenerateLowStockPOs } from './_store.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const filters = {
      warehouse_id: url.searchParams.get('warehouse_id') || 'all',
      status: url.searchParams.get('status') || ''
    };

    const orders = getPurchaseOrders(filters);
    return new Response(JSON.stringify({
      success: true,
      count: orders.length,
      orders
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=10, s-maxage=20'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // Check if triggering batch auto-replenishment
    if (body.action === 'auto_replenish' || body.action === 'auto_generate') {
      const result = autoGenerateLowStockPOs();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const { vendor_name, vendor_gst, warehouse_id, items, expected_days } = body;
    if (!items || !items.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INVALID_ITEMS',
        message: 'At least one line item is required to issue a Purchase Order'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const newPO = createPurchaseOrder({ vendor_name, vendor_gst, warehouse_id, items, expected_days });
    return new Response(JSON.stringify({
      success: true,
      message: `Purchase Order ${newPO.po_number} successfully issued`,
      order: newPO
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
