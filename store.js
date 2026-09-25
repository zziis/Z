/* Taj Al Molook V26 — public store (balances + codes) */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let sb=null,items=[];
  const client=()=>sb||(sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY));
  function card(x){
    const icon=x.item_type==='code'?'🔑':'💰';
    return `<article class="taj-market-card" data-market-id="${esc(x.id)}">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title)}" loading="lazy" decoding="async">`:`<div class="taj-market-fallback">${icon}</div>`}<div class="taj-market-body"><span class="taj-market-kind">${x.item_type==='code'?'كود':'رصيد'}</span><h3>${esc(x.title||'عرض')}</h3><p>${esc(x.description||'')}</p><div class="taj-market-value">${esc(x.value_text||'')}</div><div class="taj-market-bottom"><strong>${esc(x.price_text||'—')}</strong><button type="button" data-market-pick="${esc(x.id)}">اختيار العرض</button></div></div></article>`;
  }
  function render(){
    const balances=items.filter(x=>x.item_type==='balance'&&x.enabled!==false),codes=items.filter(x=>x.item_type==='code'&&x.enabled!==false);
    const bg=$('tajStoreBalanceGrid'),cg=$('tajStoreCodeGrid'),empty=$('tajStoreEmpty');
    if(bg)bg.innerHTML=balances.map(card).join('');
    if(cg)cg.innerHTML=codes.map(card).join('');
    const active=document.querySelector('[data-store-filter].active')?.dataset.storeFilter||'balance';
    if(empty)empty.hidden=(active==='balance'?balances.length:codes.length)>0;
    document.querySelectorAll('[data-market-pick]').forEach(b=>b.onclick=()=>pick(b.dataset.marketPick));
  }
  async function load(){
    try{const {data,error}=await client().from('platform_store_items').select('*').eq('enabled',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(error)throw error;items=data||[]}
    catch(e){console.warn('store load',e);items=[]}
    render();
  }
  function pick(id){const x=items.find(v=>String(v.id)===String(id));if(!x)return;document.getElementById('tajMarketModal')?.remove();const m=document.createElement('div');m.id='tajMarketModal';m.className='taj-market-modal';m.innerHTML=`<div class="taj-market-dialog"><button class="taj-market-x">×</button><div class="taj-market-big-icon">${x.item_type==='code'?'🔑':'💰'}</div><h3>${esc(x.title||'عرض')}</h3><div class="taj-market-dialog-value">${esc(x.value_text||'')}</div><strong>${esc(x.price_text||'—')}</strong><p>${esc(x.description||'')}</p><small>تم اختيار العرض. يمكن ربط بوابة الدفع أو تنفيذ الطلب من الإدارة لاحقًا.</small><button class="taj-market-ok">حسنًا</button></div>`;document.body.appendChild(m);const close=()=>m.remove();m.querySelector('.taj-market-x').onclick=close;m.querySelector('.taj-market-ok').onclick=close;m.onclick=e=>{if(e.target===m)close()}}
  function bindTabs(){document.querySelectorAll('[data-store-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-store-filter]').forEach(x=>x.classList.toggle('active',x===b));const type=b.dataset.storeFilter,bg=$('tajStoreBalanceGrid'),cg=$('tajStoreCodeGrid');if(bg)bg.hidden=type!=='balance';if(cg)cg.hidden=type!=='code';const list=items.filter(x=>x.item_type===type&&x.enabled!==false);if($('tajStoreEmpty'))$('tajStoreEmpty').hidden=list.length>0}))}
  document.addEventListener('DOMContentLoaded',()=>{bindTabs();load()});
  window.tajMarket={reload:load};
})();
