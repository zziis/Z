/* Taj Al Molook V17 — fully isolated Developer Center */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let sb=null, profile=null, mode='developer', data={users:[],codes:[],sections:[],content:[]};
  const defaultSections=()=>['home','buy-code','activate-code','download-store','apps','games','cloud-games','links','emulators','paid-games','settings'].map((k,i)=>({section_key:k,title:k,enabled:true,sort_order:i}));
  function client(){ if(sb)return sb; if(!window.supabase||!window.TAJ_SUPABASE_URL||!window.TAJ_SUPABASE_KEY) throw new Error('Supabase config missing'); return sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY); }
  function toast(x){ if(typeof window.showToast==='function') window.showToast(x); else alert(x); }
  async function me(){ const {data:{user}}=await client().auth.getUser(); if(!user)return null; const {data,error}=await client().from('profiles').select('*').eq('id',user.id).maybeSingle(); if(error)throw error; return data; }
  function isDev(p){ return !!p && String(p.role||'').toLowerCase()==='developer' && Number(p.user_number)===1; }

  function ensureSwitcher(){
    let el=$('devModeSwitch');
    if(!el){ el=document.createElement('div'); el.id='devModeSwitch'; el.className='dev-mode-switch-v17'; el.innerHTML='<button type="button" data-mode="developer">👑 <span>المطور</span><small>ID 1</small></button><button type="button" data-mode="user">👤 <span>المستخدم</span><small>ID 100</small></button>'; document.body.appendChild(el); }
    el.onclick=e=>{ const b=e.target.closest('button[data-mode]'); if(b) switchMode(b.dataset.mode); };
    paintSwitcher();
  }
  function paintSwitcher(){ const el=$('devModeSwitch'); if(!el)return; el.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode)); }
  function closeUserLayers(){
    document.querySelectorAll('.full-screen-view.active').forEach(x=>x.classList.remove('active'));
    document.getElementById('sideDrawer')?.classList.remove('active');
    document.getElementById('sidebarBackdrop')?.classList.remove('active');
    try{ if(window.state) window.state.currentSection=null; }catch(e){}
  }
  function setModeClasses(){
    document.documentElement.classList.toggle('taj-developer-session',isDev(profile));
    document.body.classList.toggle('dev-admin-mode',mode==='developer');
    document.body.classList.toggle('dev-user-preview-mode',mode==='user');
    paintSwitcher();
  }
  async function switchMode(next){
    if(!isDev(profile))return;
    mode=next==='user'?'user':'developer'; localStorage.setItem('taj_dev_mode',mode);
    if(mode==='developer'){ closeUserLayers(); setModeClasses(); await openDeveloper(); toast('👑 وضع المطور — ID 1'); }
    else { $('developerCenter')?.remove(); setModeClasses(); updatePreviewIdentity(); toast('👤 معاينة المستخدم — ID 100'); }
  }
  function updatePreviewIdentity(){
    if(mode!=='user')return;
    document.body.dataset.previewId='100';
    const badge=$('guestBadge'); if(badge){ const t=badge.querySelector('[data-key="guest_status"]')||badge.querySelector('span:last-child'); if(t)t.textContent='ID: 100'; badge.title='معاينة المستخدم — ID 100'; }
  }

  async function safe(table, query){ try{return await query(client().from(table));}catch(e){return {data:[],error:e};} }
  async function loadData(){
    const u=await safe('profiles',q=>q.select('id,user_number,display_name,username,points,role').order('user_number').limit(300));
    const c=await safe('subscription_codes',q=>q.select('*').order('created_at',{ascending:false}).limit(200));
    const s=await safe('platform_sections',q=>q.select('*').order('sort_order'));
    const p=await safe('platform_content',q=>q.select('*').order('created_at',{ascending:false}).limit(200));
    data={users:u.data||[],codes:c.data||[],sections:(s.data&&s.data.length?s.data:defaultSections()),content:p.data||[]};
  }
  function shell(){
    let root=$('developerCenter'); if(!root){root=document.createElement('section');root.id='developerCenter';root.className='developer-center-v17';document.body.appendChild(root);}
    root.innerHTML=`<div class="dev17-shell">
      <header class="dev17-head"><div><h1>👑 مركز تحكم تاج الملوك</h1><p>Developer • ID 1</p></div><div class="dev17-head-actions"><button type="button" data-action="preview">👤 معاينة المستخدم</button><button type="button" data-action="refresh">↻ تحديث</button></div></header>
      <div class="dev17-stats"><article><b>${data.users.length}</b><span>الحسابات</span></article><article><b>${data.codes.length}</b><span>الأكواد</span></article><article><b>${data.content.length}</b><span>المنشورات</span></article><article><b>${data.sections.filter(x=>x.enabled!==false).length}</b><span>الأقسام المفتوحة</span></article></div>
      <nav class="dev17-tabs"><button data-tab="overview" class="active">⌂ الرئيسية</button><button data-tab="codes">🔑 الأكواد</button><button data-tab="users">👥 الحسابات</button><button data-tab="sections">⚙ الأقسام</button><button data-tab="publish">🚀 النشر</button></nav>
      <main id="devPanelV17"></main></div>`;
    root.onclick=handleClick; root.onchange=handleChange; tab('overview');
  }
  async function openDeveloper(){ if(mode!=='developer')return; setModeClasses(); let root=$('developerCenter'); if(!root){root=document.createElement('section');root.id='developerCenter';root.className='developer-center-v17';document.body.appendChild(root);} root.innerHTML='<div class="dev17-loading">👑 جاري تحميل لوحة المطور…</div>'; await loadData(); if(mode==='developer')shell(); }
  function tab(name){
    const p=$('devPanelV17'); if(!p)return;
    document.querySelectorAll('.dev17-tabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
    if(name==='overview') p.innerHTML='<section class="dev17-card dev17-welcome"><h2>لوحة المطور مستقلة بالكامل</h2><p>تحكم بالأكواد والحسابات والأقسام والنشر. واجهة المستخدم لا تظهر خلف هذه اللوحة.</p></section>';
    if(name==='codes') p.innerHTML=`<section class="dev17-card"><h2>إنشاء كود</h2><div class="dev17-form"><select id="dcType"><option value="trial">تجريبي</option><option value="basic">أساسي</option></select><input id="dcMinutes" type="number" min="1" value="60" placeholder="المدة بالدقائق"><button data-action="create-code">＋ إنشاء الكود</button></div></section><section class="dev17-card"><h2>الأكواد</h2>${data.codes.map(x=>`<div class="dev17-row"><span><b>${esc(x.code)}</b><small>${esc(x.code_type||'')} • ${Number(x.duration_minutes||0)} دقيقة</small></span><em>${x.used_by?'مستخدم':'متاح'}</em></div>`).join('')||'<p class="dev17-empty">لا توجد أكواد حاليًا</p>'}</section>`;
    if(name==='users') p.innerHTML=`<section class="dev17-card"><h2>الحسابات</h2>${data.users.map(x=>`<div class="dev17-row"><span><b>${esc(x.display_name||x.username||'حساب')}</b><small>ID ${esc(x.user_number)} • ${Number(x.points||0).toLocaleString()} نقطة • ${esc(x.role||'user')}</small></span><div class="dev17-actions"><button data-user="${esc(x.id)}" data-status="banned">حظر</button><button data-user="${esc(x.id)}" data-status="active">فتح</button></div></div>`).join('')||'<p class="dev17-empty">لا توجد حسابات</p>'}</section>`;
    if(name==='sections') p.innerHTML=`<section class="dev17-card"><h2>فتح وقفل الأقسام</h2><p class="dev17-note">القسم المغلق يظهر للمستخدم تحت الصيانة.</p>${data.sections.map(x=>`<label class="dev17-row"><span><b>${esc(x.title||x.section_key)}</b><small>${esc(x.section_key)}</small></span><input class="dev17-check" type="checkbox" data-section="${esc(x.section_key)}" ${x.enabled!==false?'checked':''}></label>`).join('')}</section>`;
    if(name==='publish') p.innerHTML=`<section class="dev17-card"><h2>🚀 نشر لعبة أو تطبيق مباشرة</h2><p class="dev17-note">ارفع APK إلى R2 فقط، ثم اكتب اسم الملف هنا. الصورة تختارها من جهازك وتحفظ في Supabase.</p><div class="dev17-form dev17-publish dev22-pub-grid"><input id="pubName" placeholder="اسم اللعبة / التطبيق"><input id="pubVersion" placeholder="الإصدار - مثال 1.0.5"><select id="pubType"><option value="game">لعبة</option><option value="app">تطبيق</option></select><select id="pubSection"><option value="paid-games">الألعاب المدفوعة</option><option value="games">الألعاب</option><option value="apps">التطبيقات</option><option value="cloud-games">الألعاب السحابية</option><option value="emulators">المحاكي</option></select><input id="pubR2" class="wide" placeholder="اسم ملف R2 مثل LIMBO.apk أو رابط R2 كامل"><input id="pubSize" placeholder="الحجم - مثال 102.01 MB"><label class="dev22-file">🖼️ صورة الغلاف من الجهاز<input id="pubImageFile" type="file" accept="image/jpeg,image/png,image/webp"></label><img id="pubImagePreview" class="dev22-image-preview" alt="معاينة"><textarea id="pubDesc" class="wide" placeholder="نبذة / وصف اللعبة أو التطبيق"></textarea><div class="dev22-help wide">لا تضع مفاتيح R2 السرية هنا. يكفي اسم APK الموجود داخل Bucket bax.</div><button class="wide" data-action="publish">🚀 نشر الآن</button></div></section><section class="dev17-card"><h2>المنشورات</h2>${data.content.map(x=>`<div class="dev17-row"><span><b>${esc(x.name)}</b><small>${esc(x.section_key||x.content_type||'')} • ${esc(x.version||'')} • ${x.published===false?'مخفي':'منشور'}</small></span><div class="dev17-actions"><button data-toggle-pub="${esc(x.id)}" data-next="${x.published===false?'true':'false'}">${x.published===false?'إظهار':'إخفاء'}</button><button data-delete="${esc(x.id)}">حذف</button></div></div>`).join('')||'<p class="dev17-empty">لا توجد منشورات</p>'}</section>`; setTimeout(()=>{const f=$('pubImageFile'),im=$('pubImagePreview');if(f)f.onchange=()=>{const z=f.files?.[0];if(!z)return;if(im){im.src=URL.createObjectURL(z);im.style.display='block';}}},0);
  }
  async function handleClick(e){
    const tabBtn=e.target.closest('[data-tab]'); if(tabBtn){tab(tabBtn.dataset.tab);return;}
    const a=e.target.closest('[data-action]'); if(a){ if(a.dataset.action==='preview')return switchMode('user'); if(a.dataset.action==='refresh')return openDeveloper(); if(a.dataset.action==='create-code')return createCode(); if(a.dataset.action==='publish')return publishContent(); }
    const ub=e.target.closest('[data-user][data-status]'); if(ub)return setUserStatus(ub.dataset.user,ub.dataset.status);
    const tog=e.target.closest('[data-toggle-pub]'); if(tog)return toggleContent(tog.dataset.togglePub,tog.dataset.next==='true'); const del=e.target.closest('[data-delete]'); if(del)return removeContent(del.dataset.delete);
  }
  async function handleChange(e){ const c=e.target.closest('[data-section]'); if(c) await setSection(c.dataset.section,c.checked); }
  async function createCode(){ const type=$('dcType')?.value||'trial', mins=Number($('dcMinutes')?.value||60); const {data:r,error}=await client().rpc('admin_create_code',{p_type:type,p_duration_minutes:mins}); if(error)return toast('خطأ: '+error.message); toast('تم إنشاء الكود: '+r); await openDeveloper(); tab('codes'); }
  async function setSection(key,enabled){ const {error}=await client().from('platform_sections').upsert({section_key:key,title:key,enabled,updated_at:new Date().toISOString()},{onConflict:'section_key'}); if(error)return toast('خطأ: '+error.message); toast(enabled?'تم فتح القسم':'تم قفل القسم للصيانة'); }
  async function publishContent(){
    const name=$('pubName')?.value.trim(), file=$('pubImageFile')?.files?.[0], r2=$('pubR2')?.value.trim();
    if(!name)return toast('اكتب اسم اللعبة أو التطبيق'); if(!r2)return toast('اكتب اسم ملف APK الموجود في R2'); if(!file)return toast('اختر صورة الغلاف من جهازك');
    const btn=document.querySelector('[data-action="publish"]'); if(btn){btn.disabled=true;btn.textContent='جاري رفع الصورة والنشر…';}
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase(), path=`covers/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const up=await client().storage.from('content-images').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type}); if(up.error)throw up.error;
      const pub=client().storage.from('content-images').getPublicUrl(path); const image=pub.data.publicUrl;
      const row={name,version:$('pubVersion')?.value.trim(),content_type:$('pubType')?.value,section_key:$('pubSection')?.value,r2_object:r2,download_url:r2,size_text:$('pubSize')?.value.trim(),image_url:image,description:$('pubDesc')?.value.trim(),published:true};
      const {error}=await client().from('platform_content').insert(row); if(error)throw error;
      toast('✅ تم النشر ويظهر للمستخدمين مباشرة'); await openDeveloper(); tab('publish'); window.tajStore?.reload?.();
    }catch(e){toast('خطأ: '+e.message);}finally{if(btn){btn.disabled=false;btn.textContent='🚀 نشر الآن';}}
  }
  async function toggleContent(id,published){const {error}=await client().from('platform_content').update({published}).eq('id',id);if(error)return toast('خطأ: '+error.message);toast(published?'تم إظهار المنشور':'تم إخفاء المنشور');await openDeveloper();tab('publish');window.tajStore?.reload?.();}
  async function removeContent(id){ if(!confirm('حذف هذا المنشور؟'))return; const {error}=await client().from('platform_content').delete().eq('id',id); if(error)return toast('خطأ: '+error.message); await openDeveloper(); tab('publish'); }
  async function setUserStatus(id,status){ if(window.tajV5&&typeof window.tajV5.setStatus==='function')return window.tajV5.setStatus(id,status); toast('وظيفة حالة الحساب تحتاج RPC الخاص بالإدارة في Supabase.'); }
  async function guardSection(id){ try{const {data:r}=await client().from('platform_sections').select('enabled').eq('section_key',id).maybeSingle();if(r&&r.enabled===false){showMaintenance();return false;}}catch(e){}return true; }
  function showMaintenance(){ let o=$('maintenanceOverlay'); if(!o){o=document.createElement('div');o.id='maintenanceOverlay';o.className='maintenance-overlay';document.body.appendChild(o);} o.innerHTML='<div><i>🛠</i><h2>القسم تحت الصيانة</h2><p>نعمل على تطوير هذا القسم وسيعود قريبًا.</p><button type="button">رجوع</button></div>'; o.querySelector('button').onclick=()=>o.remove(); }
  function hookSections(){ const original=window.openSection; if(typeof original==='function'&&!original.__dev17){ const wrapped=async function(id){if(await guardSection(id))return original(id)}; wrapped.__dev17=true; window.openSection=wrapped; } }
  async function init(){ try{profile=await me(); if(!isDev(profile)){document.documentElement.classList.remove('taj-developer-session');document.body.classList.remove('dev-admin-mode','dev-user-preview-mode');$('devModeSwitch')?.remove();$('developerCenter')?.remove();return;} mode=localStorage.getItem('taj_dev_mode')==='user'?'user':'developer'; ensureSwitcher(); setModeClasses(); hookSections(); if(mode==='developer'){closeUserLayers();await openDeveloper();}else{updatePreviewIdentity();} }catch(e){console.warn('V17 developer init:',e);} }
  window.tajDev={switchMode,openDeveloper,tab};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500)); if(document.readyState!=='loading')setTimeout(init,500);
  try{client().auth.onAuthStateChange(()=>setTimeout(init,250));}catch(e){}
})();
