import { getWarehouses } from './_store.js';

export async function onRequestGet(context) {
  try {
    const warehouses = getWarehouses();
    return new Response(JSON.stringify({
      success: true,
      count: warehouses.length,
      warehouses
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
