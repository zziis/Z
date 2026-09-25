/* Taj Al Molook V25 — official social links */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let sb=null;
  const client=()=>sb||(sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const defs={
    telegram:{title:'Telegram',icon:'fa-telegram',cls:'telegram',action:'فتح Telegram'},
    tiktok:{title:'TikTok',icon:'fa-tiktok',cls:'tiktok',action:'فتح TikTok'},
    instagram:{title:'Instagram',icon:'fa-instagram',cls:'instagram',action:'فتح Instagram'}
  };
  async function load(){
    const box=$('officialLinksDynamic'),empty=$('officialLinksEmpty');
    if(!box)return;
    try{
      const {data,error}=await client().from('platform_links').select('*').eq('enabled',true).order('platform',{ascending:true});
      if(error)throw error;
      const rows=(data||[]).filter(x=>defs[x.platform]&&x.url);
      box.innerHTML=rows.map(x=>card(x)).join('');
      if(empty)empty.hidden=rows.length>0;
    }catch(e){
      console.warn('links load',e);
      box.innerHTML='';
      if(empty)empty.hidden=false;
    }
  }
  function card(x){
    const d=defs[x.platform];
    return `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" class="official-link-card"><div class="icon-bubble ${d.cls}"><i class="fa-brands ${d.icon}"></i></div><div class="link-info"><h4>${d.title}</h4><p>${esc(x.label||'الحساب الرسمي')}</p>${x.label?`<span class="link-handle">${esc(x.label)}</span>`:''}</div><span class="btn-link-action">${d.action} <i class="fa-solid fa-arrow-up-right-from-square"></i></span></a>`;
  }
  document.addEventListener('DOMContentLoaded',load);
  window.tajLinks={reload:load};
})();
