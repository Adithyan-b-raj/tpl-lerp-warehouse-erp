import { getMatchSets, reconcileMatch } from './_store.js';

export async function onRequestGet(context) {
  try {
    const matchSets = getMatchSets();
    const approvedCount = matchSets.filter(m => m.status === 'APPROVED' || m.status === 'MATCHED_APPROVED').length;
    const pendingVarianceCount = matchSets.filter(m => m.status !== 'APPROVED' && m.status !== 'MATCHED_APPROVED').length;
    const totalVarianceAmount = matchSets.reduce((sum, m) => sum + Math.abs(m.total_variance || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      total_reviews: matchSets.length,
      approved_count: approvedCount,
      pending_variance_count: pendingVarianceCount,
      total_variance_exposure: totalVarianceAmount,
      match_sets: matchSets
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=10, s-maxage=20, stale-while-revalidate=30'
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
    const { match_id, action, notes } = body;

    if (!match_id || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'match_id and action (APPROVE | CREDIT_NOTE | AUDIT_HOLD) are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const result = reconcileMatch({ match_id, action, notes });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
