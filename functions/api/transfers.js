import { getStockTransfers, createStockTransfer } from './_store.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const filters = {
      warehouse_id: url.searchParams.get('warehouse_id') || 'all',
      status: url.searchParams.get('status') || ''
    };

    const transfers = getStockTransfers(filters);
    const activeTransit = transfers.filter(t => t.status === 'IN_TRANSIT').length;

    return new Response(JSON.stringify({
      success: true,
      total_transfers: transfers.length,
      active_in_transit: activeTransit,
      transfers
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
    const { from_warehouse_id, to_warehouse_id, carrier_name, vehicle_no, items } = body;

    if (!from_warehouse_id || !to_warehouse_id || !items || !items.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INVALID_TRANSFER_REQUEST',
        message: 'from_warehouse_id, to_warehouse_id, and at least 1 item are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (from_warehouse_id === to_warehouse_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'SAME_WAREHOUSE',
        message: 'Source and destination warehouses cannot be the same'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const transfer = createStockTransfer({ from_warehouse_id, to_warehouse_id, carrier_name, vehicle_no, items });
    return new Response(JSON.stringify({
      success: true,
      message: `Stock Transfer Order ${transfer.sto_number} created with E-Way Bill ${transfer.eway_bill_no}`,
      transfer
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
