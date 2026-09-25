/* Taj Al Molook V27 — direct open + protected downloads + faster rendering */
(()=>{
  'use strict';
  const DOWNLOAD_BASE=String(window.TAJ_DOWNLOAD_BASE||'https://w.zlzalh810z.workers.dev').replace(/\/+$/,'');
  const $=id=>document.getElementById(id);
  let sb=null,items=[],current=null,blobUrl=null;
  const renderHashes=new Map();
  const client=()=>sb||(sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const key=id=>`taj_game_downloaded_${id}`;
  const isDownloaded=id=>localStorage.getItem(key(id))==='1';
  const markDownloaded=id=>localStorage.setItem(key(id),'1');
  const objectPath=v=>{v=String(v||'').trim();if(!v)return '';if(/^https?:\/\//i.test(v)){try{v=decodeURIComponent(new URL(v).pathname.replace(/^\/+/,''));}catch(e){return ''}}return v.replace(/^\/+/, '')};
  const fileUrl=x=>{const v=objectPath(x.r2_object||x.download_url);if(!v)return '';return `${DOWNLOAD_BASE}/${v.split('/').map(encodeURIComponent).join('/')}`};
  function normalizeOpenUrl(v){
    v=String(v||'').trim();
    if(!v)return '';
    if(/^www\./i.test(v))v='https://'+v;
    else if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)&&/^[\w.-]+\.[a-z]{2,}(?:[\/:?#]|$)/i.test(v))v='https://'+v;
    return v;
  }
  const directUrl=x=>normalizeOpenUrl(x?.open_url||x?.launch_url||x?.web_url||x?.website_url||'');
  const toast=s=>window.showToast?window.showToast(s):console.warn(s);
  function normalizeSection(v,type){v=String(v||'').trim().toLowerCase().replace(/_/g,'-');const aliases={app:'apps',application:'apps',applications:'apps',game:'games',paid:'games','paidgames':'games','paid-game':'games','paid-games':'games',emulator:'apps',emulators:'apps',cloud:'cloud-games'};v=aliases[v]||v;if(['apps','games','cloud-games'].includes(v))return v;return String(type||'').toLowerCase()==='app'?'apps':'games'}
  const sectionOf=x=>normalizeSection(x.section_key,x.content_type);
  const priceHtml=x=>`${x.old_price?`<del class="taj-old-price">${esc(x.old_price)}</del>`:''}<strong class="taj-free-price">مجاني</strong>`;

  async function load(){try{const {data,error}=await client().from('platform_content').select('*').eq('published',true).order('created_at',{ascending:false});if(error)throw error;items=(data||[]).map(x=>({...x,section_key:sectionOf(x)}))}catch(e){console.warn('content load',e);items=[]}renderAll()}
  function card(x){const locked=!!x.locked;return `<button class="r2-game-card taj-dynamic-card ${locked?'is-locked':''}" data-content-id="${esc(x.id)}"><div class="r2-cover-wrap"><img src="${esc(x.image_url||'')}" alt="${esc(x.name)}" loading="lazy" decoding="async" onerror="this.style.opacity='.15'"><span class="r2-lock-badge" ${locked?'':'hidden'}>🔒 مقفول</span></div><span class="r2-game-name">${esc(x.name)}</span><small>${esc(x.version||'بدون إصدار')}${x.size_text?' • '+esc(x.size_text):''}</small><div class="taj-card-price">${priceHtml(x)}</div><span class="r2-download-count">⬇ ${Number(x.download_count||0).toLocaleString('en-US')}</span>${directUrl(x)?'<em class="r2-open-badge">فتح مباشر</em>':''}${isDownloaded(x.id)?'<em class="r2-downloaded-badge">تم التنزيل</em>':''}</button>`}
  function target(section){const view=$('view-'+section);if(!view)return null;let g=view.querySelector(`.taj-published-grid[data-published-section="${section}"]`);if(!g){g=document.createElement('div');g.className='r2-games-grid taj-published-grid';g.dataset.publishedSection=section;const body=view.querySelector('.view-body')||view;if(section==='apps'){const legacy=$('appsGrid');if(legacy)body.insertBefore(g,legacy);else body.prepend(g)}else if(section==='cloud-games'){const legacy=body.querySelector('.cloud-games-grid');if(legacy)body.insertBefore(g,legacy);else body.prepend(g)}else{const empty=body.querySelector('.empty-state');if(empty)body.insertBefore(g,empty);else body.prepend(g)}}return g}
  function toggleLegacy(section,hasDynamic){if(section==='apps'){const el=$('appsGrid');if(el)el.hidden=true;const filters=$('view-apps')?.querySelector('.filter-search-bar');if(filters)filters.hidden=true}else if(section==='cloud-games'){const el=$('view-cloud-games')?.querySelector('.cloud-games-grid');if(el)el.hidden=hasDynamic}}
  function ensureDynamicEmpty(section){if(!['apps','games'].includes(section))return null;const view=$('view-'+section),body=view?.querySelector('.view-body');if(!body)return null;let e=body.querySelector('.taj-dynamic-empty');if(!e){e=document.createElement('div');e.className='empty-state taj-dynamic-empty';e.innerHTML='<i class="fa-solid fa-box-open"></i><h3>لا يوجد محتوى حاليًا</h3><p>سيظهر المحتوى هنا بعد نشره من حساب المطور.</p>';body.appendChild(e)}return e}
  function renderAll(){['apps','games','cloud-games'].forEach(s=>toggleLegacy(s,false));['apps','games'].forEach(ensureDynamicEmpty);document.querySelectorAll('#view-apps .empty-state,#view-games .empty-state,#view-cloud-games .empty-state').forEach(x=>x.hidden=false);const groups={apps:[],games:[],'cloud-games':[]};items.forEach(x=>(groups[sectionOf(x)]??=[]).push(x));Object.entries(groups).forEach(([sec,list])=>{const g=target(sec);if(g){const html=list.map(card).join('');if(renderHashes.get(sec)!==html){g.innerHTML=html;renderHashes.set(sec,html)}toggleLegacy(sec,list.length>0);if(list.length)$('view-'+sec)?.querySelectorAll('.empty-state').forEach(x=>x.hidden=true)}});document.querySelectorAll('[data-content-id]').forEach(b=>b.onclick=()=>open(b.dataset.contentId))}
  function ensureLockedNote(){let n=$('r2LockedNote');if(!n){n=document.createElement('div');n.id='r2LockedNote';n.className='r2-locked-note';const row=document.querySelector('.r2-action-row')||$('r2DownloadBtn');row?.parentNode?.insertBefore(n,row)}return n}
  function ensurePrice(){let p=$('r2PriceLine');if(!p){p=document.createElement('div');p.id='r2PriceLine';p.className='taj-detail-price';const d=$('r2DetailDescription');d?.insertAdjacentElement('beforebegin',p)}return p}
  function setButtons(){if(!current)return;const done=isDownloaded(current.id),locked=!!current.locked,n=ensureLockedNote(),openBtn=$('r2OpenBtn'),downloadBtn=$('r2DownloadBtn');if(n){n.hidden=!locked;n.textContent=current.lock_message||'🔒 أوقف المطور تنزيل هذا العنصر مؤقتًا.'}if(openBtn){const hasDirect=!!directUrl(current);openBtn.hidden=false;openBtn.disabled=locked;openBtn.title=hasDirect?'فتح التطبيق أو الخدمة مباشرة بدون تنزيل':'اضغط لمعرفة كيفية إضافة رابط الفتح المباشر'}if(downloadBtn){downloadBtn.hidden=locked;downloadBtn.disabled=false}if($('r2InstallBtn'))$('r2InstallBtn').hidden=!done||locked;if($('r2InstallNote'))$('r2InstallNote').hidden=!done||locked;if(done&&!locked){$('r2ProgressWrap').hidden=false;$('r2ProgressText').textContent='100%';$('r2ProgressBar').style.width='100%'}else if(!locked){$('r2ProgressWrap').hidden=true;$('r2ProgressText').textContent='0%';$('r2ProgressBar').style.width='0%'}else{$('r2ProgressWrap').hidden=true}}
  function open(id){current=items.find(x=>String(x.id)===String(id));if(!current)return;$('r2DetailImage').src=current.image_url||'';$('r2DetailName').textContent=current.name||'';$('r2DetailVersion').textContent='الإصدار: '+(current.version||'—');$('r2DetailSize').textContent='الحجم: '+(current.size_text||'—');$('r2DetailDescription').textContent=current.description||'لا توجد نبذة حاليًا.';const price=ensurePrice();if(price)price.innerHTML=priceHtml(current);const back=$('r2DetailBack');if(back)back.innerHTML='<i class="fa-solid fa-arrow-right"></i> رجوع';setButtons();$('r2GameDetail').classList.add('active');$('r2GameDetail').setAttribute('aria-hidden','false')}
  function close(){$('r2GameDetail')?.classList.remove('active');$('r2GameDetail')?.setAttribute('aria-hidden','true')}
  function openDirect(){
    if(!current||current.locked)return;
    const url=directUrl(current);
    if(!url)return toast('الفتح المباشر غير مضاف لهذا التطبيق. من حساب المطور افتح تعديل المحتوى وأضف رابط الفتح المباشر.');
    try{
      // Android WebView often blocks target=_blank/window.open. Same-window navigation is reliable.
      close();
      const a=document.createElement('a');
      a.href=url;
      a.target='_self';
      a.rel='noopener noreferrer';
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Fallback for WebViews that suppress synthetic anchor navigation.
      setTimeout(()=>{try{if(document.visibilityState==='visible')window.location.assign(url)}catch(_){}},80);
    }catch(e){
      try{window.location.href=url}catch(_){toast('تعذر فتح الرابط المباشر. تأكد من الرابط في لوحة المطور.')}
    }
  }
  async function activeSubscription(){try{if(window.tajV24Account?.effectiveSubscription)return await window.tajV24Account.effectiveSubscription();const {data}=await client().from('my_subscription').select('*').maybeSingle();return data||null}catch(e){return null}}
  async function canDownload(){try{const {data:{user}}=await client().auth.getUser();if(!user){close();toast('🔐 التنزيل يحتاج تسجيل دخول أولاً.');window.openSection?.('login');return false}const sub=await activeSubscription();const end=sub?.effective_expires_at||sub?.expires_at;const active=!!sub&&(!end||new Date(end)>new Date());if(!active){close();toast('🔑 التنزيل يحتاج كود تفعيل صالح. فعّل الكود من الإعدادات.');window.openSection?.('settings');setTimeout(()=>{$('activationCode')?.focus()},250);return false}return true}catch(e){toast('تعذر التحقق من الحساب الآن. حاول مرة أخرى.');return false}}
  async function recordDownload(){if(!current?.id)return;try{const {error}=await client().rpc('record_content_download_v24',{p_content:String(current.id)});if(!error){current.download_count=Number(current.download_count||0)+1;const counter=document.querySelector(`[data-content-id="${CSS.escape(String(current.id))}"] .r2-download-count`);if(counter)counter.textContent='⬇ '+Number(current.download_count).toLocaleString('en-US')}}catch(e){console.warn('download counter',e)}}
  async function download(){if(!current)return;if(current.locked)return toast('هذا العنصر مقفول من الإدارة حاليًا.');if(!(await canDownload()))return;const url=fileUrl(current);if(!url)return toast('لم يحدد المطور ملف APK.');const btn=$('r2DownloadBtn');btn.disabled=true;$('r2ProgressWrap').hidden=false;$('r2ProgressText').textContent='0%';$('r2ProgressBar').style.width='0%';const xhr=new XMLHttpRequest();xhr.open('GET',url,true);xhr.responseType='blob';xhr.onprogress=e=>{if(e.lengthComputable){const p=Math.min(100,Math.round(e.loaded/e.total*100));$('r2ProgressText').textContent=p+'%';$('r2ProgressBar').style.width=p+'%'}};xhr.onload=async()=>{btn.disabled=false;if(xhr.status>=200&&xhr.status<300){$('r2ProgressText').textContent='100%';$('r2ProgressBar').style.width='100%';if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(xhr.response);const a=document.createElement('a');a.href=blobUrl;a.download=(current.name||'app')+'.apk';document.body.appendChild(a);a.click();a.remove();markDownloaded(current.id);await recordDownload();setButtons()}else fail()};xhr.onerror=fail;xhr.send();function fail(){btn.disabled=false;toast('تعذر التنزيل. تحقق من اسم ملف R2 وربط Cloudflare Worker.')}}
  function install(){if(!current||current.locked)return;if(blobUrl){location.href=blobUrl;return}location.assign(fileUrl(current))}
  document.addEventListener('DOMContentLoaded',()=>{load();$('r2DetailBack')?.addEventListener('click',close);$('r2OpenBtn')?.addEventListener('click',openDirect);$('r2DownloadBtn')?.addEventListener('click',download);$('r2InstallBtn')?.addEventListener('click',install)});
  window.tajStore={reload:load};
})();
