(() => {
  'use strict';
  const R2='https://pub-d5ab4b74ad9345d2b1095e21b03bda8c.r2.dev';
  const $=id=>document.getElementById(id);
  let sb=null, items=[], current=null, blobUrl=null;
  const client=()=>sb||(sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const key=id=>`taj_game_downloaded_${id}`;
  const isDownloaded=id=>localStorage.getItem(key(id))==='1';
  const markDownloaded=id=>localStorage.setItem(key(id),'1');
  const fileUrl=x=>{const v=(x.r2_object||x.download_url||'').trim(); if(!v)return ''; if(/^https?:\/\//i.test(v))return v; return `${R2}/${v.split('/').map(encodeURIComponent).join('/')}`;};

  async function load(){
    try{
      const {data,error}=await client().from('platform_content').select('*').eq('published',true).order('created_at',{ascending:false});
      if(error)throw error; items=data||[];
    }catch(e){ console.warn('content load',e); items=[]; }
    // Keep LIMBO visible until it is published from Developer Center.
    if(!items.some(x=>String(x.name).toUpperCase()==='LIMBO')) items.push({id:'limbo',name:'LIMBO',version:'Android',size_text:'102.01 MB',section_key:'paid-games',content_type:'game',image_url:`${R2}/Limb.webp.jpg`,r2_object:'LIMBO.apk',description:'لعبة مغامرات وألغاز ذات أجواء غامضة. تحكم بالشخصية وتجاوز العقبات والألغاز للوصول إلى نهاية الرحلة.'});
    renderAll();
  }
  function sectionOf(x){return x.section_key || (x.content_type==='app'?'apps':'games');}
  function card(x){return `<button class="r2-game-card taj-dynamic-card" data-content-id="${esc(x.id)}"><img src="${esc(x.image_url||'')}" alt="${esc(x.name)}" loading="lazy"><span class="r2-game-name">${esc(x.name)}</span><small>${esc(x.version||'بدون إصدار')}${x.size_text?' • '+esc(x.size_text):''}</small>${isDownloaded(x.id)?'<em class="r2-downloaded-badge">تم التنزيل</em>':''}</button>`;}
  function target(section){
    if(section==='paid-games')return $('r2GamesGrid');
    const view=$('view-'+section); if(!view)return null;
    let g=view.querySelector('.taj-published-grid');
    if(!g){g=document.createElement('div');g.className='r2-games-grid taj-published-grid'; const body=view.querySelector('.view-body')||view; body.insertBefore(g,body.firstChild);}
    return g;
  }
  function renderAll(){
    document.querySelectorAll('.taj-published-grid').forEach(x=>x.remove());
    const paid=$('r2GamesGrid'); if(paid)paid.innerHTML='';
    const groups={}; items.forEach(x=>(groups[sectionOf(x)]??=[]).push(x));
    Object.entries(groups).forEach(([sec,list])=>{const g=target(sec);if(g)g.innerHTML=list.map(card).join('');});
    document.querySelectorAll('[data-content-id]').forEach(b=>b.onclick=()=>open(b.dataset.contentId));
  }
  function setButtons(){
    if(!current)return; const done=isDownloaded(current.id);
    $('r2DownloadBtn').hidden=done; $('r2InstallBtn').hidden=!done; $('r2InstallNote').hidden=!done;
    if(done){$('r2ProgressWrap').hidden=false;$('r2ProgressText').textContent='100%';$('r2ProgressBar').style.width='100%';}
    else {$('r2ProgressWrap').hidden=true;$('r2ProgressText').textContent='0%';$('r2ProgressBar').style.width='0%';}
  }
  function open(id){
    current=items.find(x=>String(x.id)===String(id)); if(!current)return;
    $('r2DetailImage').src=current.image_url||''; $('r2DetailName').textContent=current.name||'';
    $('r2DetailVersion').textContent='الإصدار: '+(current.version||'—'); $('r2DetailSize').textContent='الحجم: '+(current.size_text||'—');
    $('r2DetailDescription').textContent=current.description||'لا توجد نبذة حاليًا.'; setButtons();
    $('r2GameDetail').classList.add('active'); $('r2GameDetail').setAttribute('aria-hidden','false');
  }
  function close(){$('r2GameDetail')?.classList.remove('active');$('r2GameDetail')?.setAttribute('aria-hidden','true');}
  function download(){
    if(!current)return; const url=fileUrl(current); if(!url)return alert('لم يحدد المطور ملف APK.');
    const btn=$('r2DownloadBtn');btn.disabled=true;$('r2ProgressWrap').hidden=false;$('r2ProgressText').textContent='0%';$('r2ProgressBar').style.width='0%';
    const xhr=new XMLHttpRequest();xhr.open('GET',url,true);xhr.responseType='blob';
    xhr.onprogress=e=>{if(e.lengthComputable){const p=Math.min(100,Math.round(e.loaded/e.total*100));$('r2ProgressText').textContent=p+'%';$('r2ProgressBar').style.width=p+'%';}};
    xhr.onload=()=>{btn.disabled=false;if(xhr.status>=200&&xhr.status<300){$('r2ProgressText').textContent='100%';$('r2ProgressBar').style.width='100%';if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(xhr.response);const a=document.createElement('a');a.href=blobUrl;a.download=(current.name||'app')+'.apk';document.body.appendChild(a);a.click();a.remove();markDownloaded(current.id);setButtons();renderAll();}else fail();};
    xhr.onerror=fail;xhr.send();function fail(){btn.disabled=false;(window.showToast?showToast:alert)('تعذر التنزيل. تحقق من اسم ملف R2 و CORS.');}
  }
  function install(){if(!current)return;if(blobUrl){location.href=blobUrl;return;}location.assign(fileUrl(current));}
  document.addEventListener('DOMContentLoaded',()=>{load();$('r2DetailBack')?.addEventListener('click',close);$('r2DownloadBtn')?.addEventListener('click',download);$('r2InstallBtn')?.addEventListener('click',install);});
  window.tajStore={reload:load};
})();
