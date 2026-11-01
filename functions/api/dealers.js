import { getDealers, createDealerOrder } from './_store.js';

export async function onRequestGet(context) {
  try {
    const dealers = getDealers();
    return new Response(JSON.stringify({
      success: true,
      count: dealers.length,
      dealers
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=15, s-maxage=30'
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
    const { dealer_id, warehouse_id, items, po_ref, notes } = body;

    if (!dealer_id || !items || !items.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INVALID_DEALER_ORDER',
        message: 'dealer_id and items are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const result = createDealerOrder({ dealer_id, warehouse_id, items, po_ref, notes });
    return new Response(JSON.stringify(result), {
      status: result.success ? 201 : 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
