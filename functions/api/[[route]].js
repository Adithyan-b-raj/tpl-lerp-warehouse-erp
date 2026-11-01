export async function onRequest() {
  return new Response(JSON.stringify({ service: 'tpl-lerp-warehouse-erp', status: 'ok', items: [{"id":"PO-2026-881","name":"Vendor: Tata Steel Downstream Ltd","phone":"919847011223","detail":"40 MT CRCA Steel Coil -> Kochi Central Hub • GRN #GRN-441 Verified","status":"3-WAY MATCHED ✅","amount":"₹28,40,000"},{"id":"XFER-904","name":"Inter-Branch: Kochi Hub -> Calicut Depot","phone":"919447022334","detail":"25 Units Industrial Servo Motor • E-Way Bill #3210998822","status":"IN TRANSIT 🚚","amount":"₹4,62,500"},{"id":"PR-1102","name":"Dept: Production Line B (Coimbatore)","phone":"919895033445","detail":"Requisition: 10 Pallets 5-Ply Master Cartons • Urgent Priority","status":"PENDING PO APPROVAL","amount":"₹1,85,000"}] }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' }
  });
}
