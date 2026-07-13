const photo = document.querySelector('#photo');
const preview = document.querySelector('#preview');
const analyzeBtn = document.querySelector('#analyzeBtn');
const statusEl = document.querySelector('#status');
const reviewCard = document.querySelector('#reviewCard');
const reviewRows = document.querySelector('#reviewRows');
const rowTemplate = document.querySelector('#rowTemplate');
const inventoryList = document.querySelector('#inventoryList');
const lastUpdated = document.querySelector('#lastUpdated');
let imageDataUrl = '';

photo.addEventListener('change', async () => {
  const file = photo.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return setStatus('Please choose an image.');
  imageDataUrl = await resizeImage(file, 2200, .86);
  preview.src = imageDataUrl;
  preview.hidden = false;
  analyzeBtn.disabled = false;
  setStatus('Photo ready.');
});

document.querySelector('#addRowBtn').addEventListener('click', () => addRow());
document.querySelector('#refreshBtn').addEventListener('click', loadInventory);

analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  setStatus('Analyzing visible sleeves…');
  try {
    const res = await fetch('/api/analyze', {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({ image:imageDataUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not analyze photo.');
    reviewRows.innerHTML = '';
    (data.items || []).forEach(addRow);
    if (!data.items?.length) addRow();
    reviewCard.hidden = false;
    reviewCard.scrollIntoView({behavior:'smooth', block:'start'});
    setStatus(data.notes || 'Review the count before saving.');
  } catch (err) { setStatus(err.message); }
  finally { analyzeBtn.disabled = false; }
});

document.querySelector('#saveBtn').addEventListener('click', async () => {
  const items = [...reviewRows.querySelectorAll('.review-row')].map(row => ({
    product: row.querySelector('.brand').value.trim(),
    quantity: Number(row.querySelector('.qty').value || 0),
    unit: row.querySelector('.unit').value,
  })).filter(x => x.product);
  if (!items.length) return setStatus('Add at least one inventory item.');
  const countedBy = document.querySelector('#countedBy').value.trim() || 'Unknown';
  try {
    const res = await fetch('/api/inventory', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({items,countedBy}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save inventory.');
    setStatus('Inventory saved.');
    await loadInventory();
  } catch (err) { setStatus(err.message); }
});

function addRow(item={}) {
  const node = rowTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('.brand').value = item.product || '';
  node.querySelector('.qty').value = Number.isFinite(item.quantity) ? item.quantity : 0;
  node.querySelector('.unit').value = item.unit || 'sleeves';
  node.querySelector('.remove').addEventListener('click', () => node.remove());
  reviewRows.appendChild(node);
}

async function loadInventory() {
  try {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load inventory.');
    if (!data.items?.length) return;
    inventoryList.innerHTML = data.items.map(i => `
      <div class="inventory-item"><div><strong>${escapeHtml(i.product)}</strong><small>${escapeHtml(i.counted_by)} · ${new Date(i.counted_at).toLocaleString()}</small></div><div class="count">${i.quantity} ${escapeHtml(i.unit)}</div></div>`).join('');
    lastUpdated.textContent = data.items[0]?.counted_at ? new Date(data.items[0].counted_at).toLocaleString() : '';
  } catch (err) { inventoryList.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`; }
}

function setStatus(message){ statusEl.textContent = message; }
function escapeHtml(value=''){ return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function resizeImage(file,maxDimension,quality){
  return new Promise((resolve,reject)=>{
    const img=new Image(); const reader=new FileReader();
    reader.onerror=reject; reader.onload=()=>{ img.src=reader.result; };
    img.onerror=reject; img.onload=()=>{
      const scale=Math.min(1,maxDimension/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas'); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg',quality));
    };
    reader.readAsDataURL(file);
  });
}
loadInventory();
