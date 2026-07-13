export async function onRequestPost({ request, env }) {
  try {
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
    const { image } = await request.json();
    if (!image || !image.startsWith('data:image/')) return json({ error: 'A valid image is required.' }, 400);

    const prompt = `You are counting beverage inventory for a restaurant. Examine only what is visibly present in the image.
Identify beer, seltzer, cider, and nonalcoholic beverage sleeves/cases. Count physical packages, not individual printed cans pictured on packaging.
Do not guess hidden packages. If a brand or variety is uncertain, name it "Unknown" plus the visible color/type. Combine identical products.
Return JSON only in this exact shape:
{"items":[{"product":"Bud Light","quantity":3,"unit":"sleeves","confidence":0.91}],"notes":"Brief warning about blocked or uncertain areas."}
Allowed units: sleeves, cases, six-packs, loose. Quantities must be whole numbers.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.VISION_MODEL || 'gpt-5.4-mini',
        input: [{ role:'user', content:[
          { type:'input_text', text:prompt },
          { type:'input_image', image_url:image, detail:'high' }
        ] }],
        text: { format: { type:'json_object' } }
      })
    });
    const raw = await response.json();
    if (!response.ok) return json({ error: raw.error?.message || 'Vision request failed.' }, response.status);
    const text = raw.output_text || raw.output?.flatMap(x => x.content || []).find(x => x.type === 'output_text')?.text;
    if (!text) return json({ error:'The model returned no readable result.' }, 502);
    const parsed = JSON.parse(text);
    parsed.items = (parsed.items || []).map(i => ({
      product: String(i.product || 'Unknown').slice(0,100),
      quantity: Math.max(0, Math.round(Number(i.quantity) || 0)),
      unit: ['sleeves','cases','six-packs','loose'].includes(i.unit) ? i.unit : 'sleeves',
      confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0))
    }));
    return json(parsed);
  } catch (error) { return json({ error:error.message || 'Unexpected error.' }, 500); }
}
function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}}); }
