/* Taj Al Molook V16 — Developer Control Center stable hotfix */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let sb=null, profile=null, mode='developer', dataCache={users:[],codes:[],sections:[],content:[]};
function client(){
 if(sb) return sb;
 if(!window.supabase||!window.TAJ_SUPABASE_URL||!window.TAJ_SUPABASE_KEY) throw new Error('Supabase config missing');
 return sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY);
}
function toast(x){ if(typeof window.showToast==='function') window.showToast(x); else alert(x); }
async function me(){
 const {data,error}=await client().auth.getUser(); if(error||!data?.user) return null;
 const r=await client().from('profiles').select('*').eq('id',data.user.id).maybeSingle();
 if(r.error) throw r.error; return r.data;
}
function isDeveloper(p){ return !!p && String(p.role||'').trim().toLowerCase()==='developer' && Number(p.user_number)===1; }
function ensureSwitch(){
 let d=$('devModeSwitch');
 if(!d){ d=document.createElement('div'); d.id='devModeSwitch'; d.className='dev-mode-switch'; document.body.appendChild(d); }
 d.innerHTML= mode==='developer'
   ? '<button type="button" class="active" data-dev-action="user">👤 دخول وضع المستخدم <small>ID 100</small></button>'
   : '<button type="button" class="active return-dev" data-dev-action="developer">👑 الرجوع إلى المطور <small>ID 1</small></button>';
 d.style.display='flex';
}
function applyMode(){
 document.documentElement.classList.toggle('is-developer',!!isDeveloper(profile));
 document.body.classList.toggle('developer-preview',mode==='user');
 document.body.dataset.previewId=mode==='user'?'100':'';
 ensureSwitch();
}
async function init(){
 try{
   profile=await me();
   if(!isDeveloper(profile)){
     document.documentElement.classList.remove('is-developer'); document.body.classList.remove('developer-preview');
     $('devModeSwitch')?.remove(); $('developerCenter')?.remove(); return;
   }
   mode=localStorage.getItem('taj_dev_mode')==='user'?'user':'developer';
   applyMode();
   if(mode==='developer') await openDeveloper(); else enterUserPreview(false);
 }catch(e){ console.error('Developer init:',e); }
}
async function switchMode(next){
 if(!isDeveloper(profile)) return;
 mode=next==='user'?'user':'developer'; localStorage.setItem('taj_dev_mode',mode); applyMode();
 if(mode==='developer') await openDeveloper(); else enterUserPreview(true);
}
function enterUserPreview(notify=true){
 mode='user'; localStorage.setItem('taj_dev_mode','user'); applyMode(); $('developerCenter')?.remove();
 document.querySelectorAll('#guestBadge .member-text small,[data-user-id],.user-id').forEach(x=>{ if(x.dataset?.userId!==undefined) x.textContent='ID 100'; else if(/ID/i.test(x.textContent||'')) x.textContent='ID: 100'; });
 if(notify) toast('👤 وضع المستخدم التجريبي — ID 100');
}
async function openDeveloper(){
 mode='developer'; localStorage.setItem('taj_dev_mode','developer'); applyMode();
 let root=$('developerCenter'); if(!root){ root=document.createElement('div'); root.id='developerCenter'; root.className='developer-center'; document.body.appendChild(root); }
 root.innerHTML='<div class="dev-loading">👑 جاري تحميل لوحة المطور…</div>';
 await loadData(); renderShell(root); renderTab('overview');
}
function defaults(){return ['home','buy-code','activate-code','download-store','apps','games','cloud-games','links','emulators','paid-games','settings'].map((k,i)=>({section_key:k,title:k,enabled:true,sort_order:i}));}
async function safe(q,fallback=[]){try{const r=await q;if(r.error){console.warn(r.error);return fallback}return r.data||fallback}catch(e){console.warn(e);return fallback}}
async function loadData(){
 const c=client();
 const [users,codes,sections,content]=await Promise.all([
   safe(c.from('profiles').select('id,user_number,display_name,points,role').order('user_number').limit(200)),
   safe(c.from('subscription_codes').select('*').order('created_at',{ascending:false}).limit(100)),
   safe(c.from('platform_sections').select('*').order('sort_order'),defaults()),
   safe(c.from('platform_content').select('*').order('created_at',{ascending:false}).limit(100))
 ]);
 dataCache={users,codes,sections:sections.length?sections:defaults(),content};
}
function renderShell(root){
 const d=dataCache;
 root.innerHTML=`<div class="dev-shell"><header><div><b>👑 مركز تحكم تاج الملوك</b><small>Developer • ID 1</small></div><button type="button" data-dev-action="refresh">↻ تحديث</button></header>
 <div class="dev-stats"><span><b>${d.users.length}</b>حساب</span><span><b>${d.codes.length}</b>كود</span><span><b>${d.content.length}</b>منشور</span><span><b>${d.sections.filter(x=>x.enabled!==false).length}</b>قسم مفتوح</span></div>
 <nav class="dev-tabs"><button type="button" data-dev-tab="overview">⌂ الرئيسية</button><button type="button" data-dev-tab="codes">🔑 الأكواد</button><button type="button" data-dev-tab="users">👥 الحسابات</button><button type="button" data-dev-tab="sections">⚙ الأقسام</button><button type="button" data-dev-tab="publish">🚀 النشر</button></nav><main id="devPanel"></main></div>`;
}
function renderTab(t){
 const p=$('devPanel'),d=dataCache;if(!p)return;
 document.querySelectorAll('.dev-tabs [data-dev-tab]').forEach(b=>b.classList.toggle('active',b.dataset.devTab===t));
 if(t==='overview') p.innerHTML='<section class="dev-hero"><h2>التحكم الكامل بالمنصة</h2><p>اختر أحد الأقسام أعلاه لإدارة الأكواد والحسابات والأقسام والنشر.</p></section>';
 if(t==='codes') p.innerHTML=`<section class="dev-card"><h3>إنشاء كود</h3><div class="dev-form"><select id="dcType"><option value="trial">تجريبي</option><option value="basic">أساسي</option></select><input id="dcMinutes" type="number" value="60" min="1" placeholder="المدة بالدقائق"><button type="button" data-dev-action="create-code">＋ إنشاء</button></div></section><section class="dev-card"><h3>الأكواد</h3>${d.codes.map(x=>`<div class="dev-row"><span><b>${esc(x.code)}</b><small>${esc(x.code_type)} • ${x.duration_minutes||0} دقيقة</small></span><em>${x.used_by?'مستخدم':'متاح'}</em></div>`).join('')||'<p>لا توجد أكواد</p>'}</section>`;
 if(t==='users') p.innerHTML=`<section class="dev-card"><h3>الحسابات</h3>${d.users.map(x=>`<div class="dev-row"><span><b>${esc(x.display_name||'حساب')}</b><small>ID ${esc(x.user_number)} • ${Number(x.points||0).toLocaleString()} نقطة • ${esc(x.role||'user')}</small></span></div>`).join('')||'<p>لا توجد حسابات</p>'}</section>`;
 if(t==='sections') p.innerHTML=`<section class="dev-card"><h3>فتح وقفل الأقسام</h3><p class="dev-note">القسم المقفول يظهر للمستخدم تحت الصيانة.</p>${d.sections.map(x=>`<label class="dev-row dev-toggle"><span><b>${esc(x.title||x.section_key)}</b><small>${esc(x.section_key)}</small></span><input type="checkbox" data-section-key="${esc(x.section_key)}" ${x.enabled!==false?'checked':''}></label>`).join('')}</section>`;
 if(t==='publish') p.innerHTML=`<section class="dev-card"><h3>نشر برنامج أو لعبة</h3><div class="dev-form publish"><input id="pubName" placeholder="اسم البرنامج / اللعبة"><input id="pubVersion" placeholder="الإصدار"><select id="pubType"><option value="app">تطبيق</option><option value="game">لعبة</option></select><input id="pubImage" placeholder="رابط الصورة"><input id="pubUrl" placeholder="رابط الملف / التنزيل"><textarea id="pubDesc" placeholder="الوصف"></textarea><button type="button" data-dev-action="publish">🚀 نشر الآن</button></div></section><section class="dev-card"><h3>المنشورات</h3>${d.content.map(x=>`<div class="dev-row"><span><b>${esc(x.name)}</b><small>${esc(x.content_type)} • ${esc(x.version||'')}</small></span><button type="button" data-remove-content="${esc(x.id)}">حذف</button></div>`).join('')||'<p>لا توجد منشورات</p>'}</section>`;
}
async function createCode(){const type=$('dcType')?.value||'trial',min=Number($('dcMinutes')?.value)||60;const r=await client().rpc('admin_create_code',{p_type:type,p_duration_minutes:min});if(r.error)return toast('خطأ: '+r.error.message);toast('تم إنشاء الكود: '+r.data);await openDeveloper();renderTab('codes');}
async function setSection(key,enabled){const r=await client().from('platform_sections').upsert({section_key:key,title:key,enabled,updated_at:new Date().toISOString()},{onConflict:'section_key'});if(r.error)return toast('خطأ: '+r.error.message);toast(enabled?'تم فتح القسم':'تم وضع القسم تحت الصيانة');const x=dataCache.sections.find(v=>v.section_key===key);if(x)x.enabled=enabled;}
async function publish(){const row={name:$('pubName')?.value.trim(),version:$('pubVersion')?.value.trim(),content_type:$('pubType')?.value||'app',image_url:$('pubImage')?.value.trim(),download_url:$('pubUrl')?.value.trim(),description:$('pubDesc')?.value.trim(),published:true};if(!row.name)return toast('اكتب الاسم');const r=await client().from('platform_content').insert(row);if(r.error)return toast('خطأ: '+r.error.message);toast('تم النشر');await openDeveloper();renderTab('publish');}
async function removeContent(id){if(!confirm('حذف هذا المنشور؟'))return;const r=await client().from('platform_content').delete().eq('id',id);if(r.error)return toast('خطأ: '+r.error.message);await openDeveloper();renderTab('publish');}
document.addEventListener('click',async e=>{
 const a=e.target.closest('[data-dev-action]'); if(a){e.preventDefault();const x=a.dataset.devAction;if(x==='user')return switchMode('user');if(x==='developer')return switchMode('developer');if(x==='refresh')return openDeveloper();if(x==='create-code')return createCode();if(x==='publish')return publish();}
 const tab=e.target.closest('[data-dev-tab]');if(tab){e.preventDefault();return renderTab(tab.dataset.devTab);}
 const del=e.target.closest('[data-remove-content]');if(del){e.preventDefault();return removeContent(del.dataset.removeContent);}
});
document.addEventListener('change',e=>{const x=e.target.closest('[data-section-key]');if(x)setSection(x.dataset.sectionKey,x.checked);});
window.tajDev={switchMode,openDeveloper,refresh:openDeveloper,tab:renderTab,createCode,section:setSection,publish,removeContent};
document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));if(document.readyState!=='loading')setTimeout(init,500);try{client().auth.onAuthStateChange(()=>setTimeout(init,250))}catch(e){}
})();
