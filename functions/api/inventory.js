export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT product, quantity, unit, counted_by, counted_at
      FROM inventory_counts
      WHERE snapshot_id = (SELECT snapshot_id FROM inventory_counts ORDER BY counted_at DESC LIMIT 1)
      ORDER BY product COLLATE NOCASE
    `).all();
    return json({ items: results || [] });
  } catch (error) { return json({ error:error.message }, 500); }
}

export async function onRequestPost({ request, env }) {
  try {
    const { items, countedBy } = await request.json();
    if (!Array.isArray(items) || !items.length) return json({ error:'At least one item is required.' },400);
    const snapshotId = crypto.randomUUID();
    const countedAt = new Date().toISOString();
    const statements = items.slice(0,250).map(item => env.DB.prepare(`
      INSERT INTO inventory_counts (snapshot_id, product, quantity, unit, counted_by, counted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(snapshotId, String(item.product).slice(0,100), Math.max(0,Math.round(Number(item.quantity)||0)), String(item.unit||'sleeves').slice(0,20), String(countedBy||'Unknown').slice(0,80), countedAt));
    await env.DB.batch(statements);
    return json({ ok:true, snapshotId, countedAt });
  } catch (error) { return json({ error:error.message },500); }
}
function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}}); }
