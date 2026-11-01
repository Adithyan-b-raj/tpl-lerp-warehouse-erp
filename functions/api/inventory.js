import { getInventory, adjustStock } from './_store.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const filters = {
      warehouse_id: url.searchParams.get('warehouse_id') || url.searchParams.get('hub') || 'all',
      category: url.searchParams.get('category') || 'all',
      search: url.searchParams.get('search') || url.searchParams.get('q') || '',
      low_stock: url.searchParams.get('low_stock') || ''
    };

    const items = getInventory(filters);
    const totalInventoryValue = items.reduce((acc, it) => acc + (it.total_value || 0), 0);
    const lowStockCount = items.filter(it => it.is_low_stock).length;

    return new Response(JSON.stringify({
      success: true,
      total_items: items.length,
      total_stock_value: totalInventoryValue,
      low_stock_alerts: lowStockCount,
      filters,
      items
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=10, s-maxage=20, stale-while-revalidate=40'
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
    const { warehouse_id, item_id, adjustment_qty, reason, note } = body;

    if (!warehouse_id || !item_id || adjustment_qty === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INVALID_PAYLOAD',
        message: 'warehouse_id, item_id, and adjustment_qty are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const result = adjustStock({ warehouse_id, item_id, adjustment_qty, reason, note });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
