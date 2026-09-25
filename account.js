/* Taj Al Molook V5 — Supabase auth/profile/admin/code layer */
(() => {
 const cfg=()=>window.TAJ_SUPABASE_KEY && !window.TAJ_SUPABASE_KEY.includes('PUT_YOUR');
 let sb=null, authMode='login', me=null;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function toast(s){ window.showToast?showToast(s):alert(s); }
 function client(){ if(!cfg()) throw new Error('أضف Publishable key داخل supabase-config.js'); if(!sb) sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY); return sb; }
 function guestId(){ let x=localStorage.getItem('taj_guest_v5'); if(!x){x='G-'+crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(0,7);localStorage.setItem('taj_guest_v5',x)} return x; }
 function badgeGuest(){const b=$('guestBadge');if(b){b.classList.remove('member-badge');b.innerHTML=`<span class="status-dot"></span><i class="fa-regular fa-user"></i><span>زائر</span>`;}}
 function badgeUser(p){const b=$('guestBadge');if(b){const pid=p.user_number??p.public_id??'—';b.classList.add('member-badge');b.innerHTML=`<span class="member-text"><strong>${esc(p.display_name||'حساب')}</strong><small>ID: ${esc(pid)}</small></span><span class="status-dot"></span>`;}}
 function profileHtml(p,sub=null){const pid=p.user_number??p.public_id??'—';let codeText='لا يوجد';let codeClass='';if(sub){const active=!sub.expires_at||new Date(sub.expires_at)>new Date();codeText=active?`مفعّل • ${sub.code_type||''}${sub.expires_at?' • حتى '+new Date(sub.expires_at).toLocaleString('ar-IQ'):''}`:'منتهي';codeClass=active?'code-profile-active':'code-profile-expired'}return `<div class="v5-profile"><h3>👑 ${esc(p.display_name||'حساب')}</h3><div><b>ID</b><span>${esc(pid)}</span></div><div><b>البريد</b><span>${esc(p.email||'—')}</span></div><div><b>حالة الكود</b><span class="${codeClass}">${esc(codeText)}</span></div><div><b>تاريخ الانضمام</b><span>${new Date(p.created_at).toLocaleString('ar-IQ')}</span></div><div><b>حالة الحساب</b><span class="account-online">● ${p.account_status==='active'?'مفعّل':esc(p.account_status)}</span></div></div>`}
 async function loadMe(){ const c=client(),{data:{user}}=await c.auth.getUser(); if(!user){me=null;badgeGuest();return null} const {data,error}=await c.from('profiles').select('*').eq('id',user.id).single(); if(error) throw error; me=data; if(['admin','developer'].includes(String(me.role||'').toLowerCase())){ await c.auth.signOut(); me=null; badgeGuest(); toast('حساب الإدارة يعمل من برنامج الحاسبة فقط.'); return null; } const metaName=user.user_metadata?.display_name; const emailPrefix=(user.email||'').split('@')[0]; if(metaName && (!me.display_name || me.display_name===emailPrefix)){ const r=await c.rpc('set_my_display_name',{p_name:metaName,p_initial:true}); if(!r.error) me.display_name=metaName; } if(user.email) me.email=user.email; badgeUser(me); if(me.account_status==='banned') toast('هذا الحساب محظور من الإدارة'); return me; }
 async function showAccount(){try{const p=await loadMe();if(!p){openSection('login');return}let sub=null;try{const r=await client().from('my_subscription').select('*').maybeSingle();if(!r.error)sub=r.data}catch(_){}let box=$('v5AccountBox');if(!box){box=document.createElement('div');box.id='v5AccountBox';box.className='v5-overlay';document.body.appendChild(box)}box.innerHTML=`<div class="v5-dialog"><button class="v5-x" onclick="this.closest('.v5-overlay').remove()">×</button>${profileHtml(p,sub)}</div>`;}catch(e){toast(e.message)}}
 window.switchAuthTab=function(mode){authMode=mode; $('tabLogin')?.classList.toggle('active',mode==='login');$('tabRegister')?.classList.toggle('active',mode==='register');if($('groupName'))$('groupName').style.display=mode==='register'?'block':'none';if($('authBtnText'))$('authBtnText').textContent=mode==='login'?'دخول الحساب':'إنشاء الحساب';};
 window.handleAuthSubmit=async function(e){e.preventDefault();try{const c=client(),email=$('authEmail').value.trim(),password=$('authPass').value,name=$('authName')?.value.trim(); if(authMode==='register'){if(!name)throw new Error('اكتب اسم الحساب');const {error}=await c.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)throw error;toast('تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح رسالة التأكيد ثم سجل الدخول.');switchAuthTab('login');}else{const {error}=await c.auth.signInWithPassword({email,password});if(error)throw error;await loadMe();toast('تم تسجيل الدخول');closeSection();}}catch(x){toast(x.message)}};
 async function logout(){try{await client().auth.signOut();me=null;badgeGuest();document.querySelector('.v5-overlay')?.remove();toast('تم تسجيل الخروج');setTimeout(()=>location.reload(),350)}catch(e){toast(e.message)}}
 async function activateCode(){try{const p=await loadMe();if(!p)throw new Error('سجل الدخول أولاً لتفعيل الكود');const input=$('activationCode');const code=input?.value.trim().toUpperCase();if(!code)throw new Error('أدخل الكود');const {data,error}=await client().rpc('activate_subscription_code',{p_code:code});if(error)throw error;toast(data.message||'تم التفعيل');await loadMe();window.tajV5.renderCode();}catch(e){toast(e.message)}}
 async function renderCode(){const box=$('activationResult');if(!box)return;try{const p=await loadMe();if(!p){box.classList.remove('hidden');box.innerHTML='سجّل الدخول لعرض حالة الكود.';return}const {data}=await client().from('my_subscription').select('*').maybeSingle();box.classList.remove('hidden');if(!data){box.innerHTML='لا يوجد كود مفعّل.';return}const end=new Date(data.expires_at),active=end>Date.now();box.innerHTML=`<div class="code-status-card ${active?'is-active':'is-expired'}"><strong>${active?'🟢 مفعّل':'🔴 منتهي'}</strong><p>${esc(data.code_type)} • ${esc(data.code)}</p><p>ينتهي: ${end.toLocaleString('ar-IQ')}</p></div>`;}catch(e){box.innerHTML=esc(e.message)}}
 async function support(body){try{const p=await loadMe();const {error}=await client().from('support_messages').insert({user_id:p?.id||null,guest_id:p?null:guestId(),sender_name:p?.display_name||'زائر',body});if(error)throw error;toast('تم إرسال رسالتك إلى المطور')}catch(e){toast(e.message)}}
 async function trackGuest(){if(!cfg())return;try{const c=client();await c.from('guest_sessions').upsert({guest_id:guestId(),last_seen:new Date().toISOString()},{onConflict:'guest_id'});}catch{}}
 window.tajV5={loadMe,showAccount,logout,activateCode,renderCode,support,client,getMe:()=>me};
 document.addEventListener('DOMContentLoaded',async()=>{badgeGuest();if(cfg()){try{await loadMe();await trackGuest();client().auth.onAuthStateChange(()=>setTimeout(loadMe,0));}catch(e){console.warn(e)}} const b=$('guestBadge');if(b)b.onclick=()=>me?showAccount():openSection('login'); const old=window.activateCode;if($('activationCode'))window.activateCode=activateCode;});
})();

/* Taj Al Molook V6 — points wallet + code shop */
(()=>{
 let sb=null, me=null;
 const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const toast=s=>window.showToast?showToast(s):alert(s);
 function ready(){return window.TAJ_SUPABASE_KEY&&!window.TAJ_SUPABASE_KEY.includes('PUT_YOUR')}
 function client(){if(!ready())throw Error('أضف Publishable key داخل supabase-config.js');return sb||(sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY))}
 async function load(){const {data:{user}}=await client().auth.getUser();if(!user){me=null;return null}const {data,error}=await client().from('profiles').select('*').eq('id',user.id).single();if(error)throw error;me=data;renderPoints();return me}
 function renderPoints(){document.querySelectorAll('.v6-points').forEach(x=>x.textContent=Number(me?.points||0).toLocaleString('ar-IQ')+' نقطة')}
 function duration(m){if(m%43200===0)return (m/43200)+' شهر';if(m%10080===0)return (m/10080)+' أسبوع';if(m%1440===0)return (m/1440)+' يوم';if(m%60===0)return (m/60)+' ساعة';return m+' دقيقة'}
 async function shop(){try{const p=await load();const host=document.querySelector('#view-buy-code .view-body');if(!host)return;if(!p){host.innerHTML='<div class="v6-empty">سجّل الدخول أولاً لشراء الأكواد بالنقاط.</div>';return}const {data,error}=await client().from('code_products').select('*').eq('enabled',true).order('points_price');if(error)throw error;host.innerHTML=`<div class="v6-wallet"><span>رصيدك</span><strong class="v6-points">${Number(p.points||0).toLocaleString('ar-IQ')} نقطة</strong></div><div class="v6-shop-title"><h3>متجر الأكواد بالنقاط</h3><p>اختر البطاقة المناسبة. يتم التحقق من السعر والرصيد داخل Supabase.</p></div><div class="v6-products">${(data||[]).length?(data||[]).map(x=>`<article class="v6-product"><div class="v6-product-icon">👑</div><h3>${esc(x.title)}</h3><span class="v6-type ${x.code_type}">${x.code_type==='trial'?'تجريبي':'أساسي'}</span><p>المدة: <b>${duration(x.duration_minutes)}</b></p><div class="v6-price">🪙 ${Number(x.points_price).toLocaleString('ar-IQ')} نقطة</div><button onclick="tajV6.buy('${x.id}')">شراء الكود</button></article>`).join(''):'<div class="v6-empty">لا توجد بطاقات متاحة حاليًا.</div>'}</div><div id="v6Purchased"></div>`}catch(e){toast(e.message)}}
 async function buy(id){try{const {data,error}=await client().rpc('buy_code_product',{p_product:id});if(error)throw error;if(!data?.ok){toast(data?.message||'تعذر الشراء');return}await load();const box=$('v6Purchased');if(box)box.innerHTML=`<div class="v6-bought"><b>✅ تم شراء الكود</b><code>${esc(data.code)}</code><span>${data.code_type==='trial'?'تجريبي':'أساسي'} • ${duration(data.duration_minutes)}</span><button onclick="navigator.clipboard.writeText('${esc(data.code)}');showToast('تم نسخ الكود')">نسخ الكود</button></div>`;renderPoints();toast('تم شراء الكود بنجاح')}catch(e){toast(e.message)}}
 function patchProfile(){const old=window.tajV5?.showAccount;if(!old)return;window.tajV5.showAccount=async()=>{await old();try{await load();const prof=document.querySelector('.v5-profile');if(prof&&!prof.querySelector('.v6-wallet-row')){const row=document.createElement('div');row.className='v6-wallet-row';row.innerHTML=`<b>النقاط</b><span class="v6-points">${Number(me?.points||0).toLocaleString('ar-IQ')} نقطة</span>`;const first=prof.querySelector('div');first?first.before(row):prof.appendChild(row)}}catch{}}}
 document.addEventListener('DOMContentLoaded',()=>{if(!ready())return;setTimeout(()=>{patchProfile();const oldOpen=window.openSection;window.openSection=function(name){const r=oldOpen.apply(this,arguments);if(name==='buy-code')setTimeout(shop,50);return r};load().catch(()=>{})},150)});
 window.tajV6={shop,buy};
})();


/* Taj Al Molook V8 — polished in-app account settings */
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const toast=s=>window.showToast?showToast(s):alert(s);
 const c=()=>window.tajV5.client();
 const fmt=d=>d?new Date(d).toLocaleString('ar-IQ'):'—';
 async function profile(){return await window.tajV5.loadMe()}
 function cooldown(last,days){if(!last)return 0;return Math.max(0,new Date(last).getTime()+days*86400000-Date.now())}
 function remain(ms){const days=Math.floor(ms/86400000),hrs=Math.floor((ms%86400000)/3600000);return days>0?`${days} يوم و${hrs} ساعة`:`${Math.max(1,hrs)} ساعة`}
 function dialog({icon='⚠️',title,message,ok='متابعة',cancel='إلغاء',danger=false}){return new Promise(resolve=>{document.getElementById('tajConfirm')?.remove();const x=document.createElement('div');x.id='tajConfirm';x.className='taj-confirm-overlay';x.innerHTML=`<div class="taj-confirm"><div class="taj-confirm-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(message)}</p><div><button class="taj-cancel">${esc(cancel)}</button><button class="taj-ok ${danger?'danger':''}">${esc(ok)}</button></div></div>`;document.body.appendChild(x);x.querySelector('.taj-cancel').onclick=()=>{x.remove();resolve(false)};x.querySelector('.taj-ok').onclick=()=>{x.remove();resolve(true)};x.onclick=e=>{if(e.target===x){x.remove();resolve(false)}}})}
 async function openAccountSettings(){
   const p=await profile(); if(!p){openSection('login');return}
   const nl=cooldown(p.name_changed_at,7),el=cooldown(p.email_changed_at,30);
   document.getElementById('v7AccountSettings')?.remove();
   const box=document.createElement('div');box.id='v7AccountSettings';box.className='v5-overlay';
   box.innerHTML=`<div class="v5-dialog v7-account"><button class="v5-x" onclick="this.closest('.v5-overlay').remove()">×</button><h2>👤 أنا</h2>
   <div class="v7-summary"><span><b>ID</b><strong>${esc(p.user_number??p.public_id??'—')}</strong></span><span><b>حالة الحساب</b><strong class="account-online">● متصل</strong></span><span><b>تاريخ الانضمام</b><strong>${fmt(p.created_at)}</strong></span><span><b>النقاط</b><strong class="v6-points">${Number(p.points??0).toLocaleString('en-US')} نقطة</strong></span></div>
   <div class="v7-field ${nl?'locked':''}"><label>الاسم</label><div><input id="v7Name" value="${esc(p.display_name)}" ${nl?'disabled':''}><button id="v7NameBtn" onclick="tajV7.changeName()" ${nl?'disabled':''}>تغيير</button></div><small>${nl?'🔒 يمكنك تغيير الاسم بعد '+remain(nl):'يمكن تغييره مرة كل 7 أيام.'}</small></div>
   <div class="v7-field ${el?'locked':''}"><label>البريد الإلكتروني</label><div><input id="v7Email" type="email" value="${esc(p.email)}" ${el?'disabled':''}><button onclick="tajV7.changeEmail()" ${el?'disabled':''}>تغيير</button></div><small>${el?'🔒 يمكنك تغيير البريد بعد '+remain(el):'يمكن تغييره مرة كل 30 يومًا، ويحتاج تأكيد البريد الجديد.'}</small></div>
   <div class="v7-field"><label>كلمة المرور الجديدة</label><div><input id="v7Pass" type="password" placeholder="اكتب كلمة مرور جديدة"><button onclick="tajV7.togglePass()">👁</button><button onclick="tajV7.changePass()">حفظ</button></div><small>لأسباب أمنية لا يمكن عرض كلمة المرور الحالية.</small></div>
   <button class="v7-logout" onclick="tajV7.confirmLogout()">تسجيل خروج</button>
   <details class="v7-danger"><summary>حسابي</summary><button onclick="tajV7.disableAccount()">تعطيل الحساب مؤقتًا</button><button class="danger" onclick="tajV7.deleteAccount()">حذف الحساب نهائيًا</button></details></div>`;
   document.body.appendChild(box);
 }
 async function changeName(){const p=await profile(),left=cooldown(p.name_changed_at,7);if(left){toast('يمكن تغيير الاسم بعد '+remain(left));return openAccountSettings()}const name=document.getElementById('v7Name').value.trim();if(name.length<2)return toast('الاسم قصير جدًا');if(!await dialog({icon:'👤',title:'تأكيد تغيير الاسم',message:'بعد تغيير الاسم لن تتمكن من تغييره لمدة 7 أيام. هل تريد المتابعة؟'}))return;const {error}=await c().rpc('set_my_display_name',{p_name:name,p_initial:false});if(error)return toast(error.message);toast('تم تغيير الاسم بنجاح');openAccountSettings()}
 async function changeEmail(){const p=await profile(),left=cooldown(p.email_changed_at,30);if(left){toast('يمكن تغيير البريد بعد '+remain(left));return openAccountSettings()}const email=document.getElementById('v7Email').value.trim();if(!await dialog({icon:'✉️',title:'تأكيد تغيير البريد',message:'بعد تغيير البريد لن تتمكن من تغييره لمدة 30 يومًا، وستصلك رسالة لتأكيد البريد الجديد.'}))return;const {error}=await c().auth.updateUser({email});if(error)return toast(error.message);toast('تم إرسال رسالة تأكيد إلى البريد الجديد.')}
 function togglePass(){const x=document.getElementById('v7Pass');x.type=x.type==='password'?'text':'password'}
 async function changePass(){const password=document.getElementById('v7Pass').value;if(password.length<8)return toast('كلمة المرور يجب أن تكون 8 أحرف على الأقل');const {error}=await c().auth.updateUser({password});toast(error?error.message:'تم تغيير كلمة المرور')}
 async function confirmLogout(){if(!await dialog({icon:'↪️',title:'تسجيل الخروج',message:'سيتم خروجك من الجلسة الحالية. هل تريد المتابعة؟',ok:'تسجيل الخروج'}))return;document.getElementById('v7AccountSettings')?.remove();await window.tajV5.logout()}
 async function disableAccount(){if(!await dialog({icon:'⏸️',title:'تعطيل الحساب',message:'سيتم تعطيل حسابك مؤقتًا وتسجيل خروجك.',ok:'تعطيل',danger:true}))return;const {error}=await c().rpc('disable_my_account');if(error)return toast(error.message);await window.tajV5.logout()}
 async function deleteAccount(){if(!await dialog({icon:'🗑️',title:'حذف الحساب نهائيًا',message:'سيتم حذف الحساب نهائيًا ولا يمكن التراجع عن ذلك.',ok:'حذف نهائي',danger:true}))return;const {error}=await c().rpc('delete_my_account');if(error)return toast(error.message);localStorage.removeItem('tajMemberId');toast('تم حذف الحساب');setTimeout(()=>location.reload(),700)}
 window.tajV7={openAccountSettings,changeName,changeEmail,togglePass,changePass,confirmLogout,disableAccount,deleteAccount};
})();

/* ===== V24 — code guard + moderation session sync ===== */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const toast=s=>window.showToast?window.showToast(s):console.warn(s);
  const c=()=>window.tajV5?.client?.();
  async function effectiveSubscription(){
    const db=c();if(!db)return null;
    const {data:{user}}=await db.auth.getUser();if(!user)return null;
    const subRes=await db.from('my_subscription').select('*').maybeSingle();
    if(subRes.error||!subRes.data)return subRes.data||null;
    const sub={...subRes.data};let adjust=0;
    try{const r=await db.from('code_time_adjustments').select('adjust_minutes').eq('user_id',user.id).eq('code',sub.code).maybeSingle();if(!r.error&&r.data)adjust=Number(r.data.adjust_minutes||0)}catch(_){}
    sub.adjust_minutes=adjust;
    if(sub.expires_at){sub.effective_expires_at=new Date(new Date(sub.expires_at).getTime()+adjust*60000).toISOString()}
    return sub;
  }
  async function activateCodeV24(){
    try{
      const db=c();if(!db)throw Error('Supabase غير جاهز');
      const {data:{user}}=await db.auth.getUser();if(!user)throw Error('سجل الدخول أولاً لتفعيل الكود');
      const old=await effectiveSubscription();
      const end=old?.effective_expires_at||old?.expires_at;
      if(end&&new Date(end)>new Date())throw Error('لديك كود مفعل بالفعل. لا يمكن تفعيل كود ثانٍ قبل انتهاء الحالي.');
      const input=$('activationCode'),code=input?.value.trim().toUpperCase();if(!code)throw Error('أدخل الكود');
      const {data,error}=await db.rpc('activate_subscription_code',{p_code:code});if(error)throw error;
      toast(data?.message||'تم تفعيل الكود');if(input)input.value='';await renderCodeV24();
    }catch(e){toast(e.message)}
  }
  async function renderCodeV24(){
    const box=$('activationResult');if(!box)return;
    try{
      const db=c();const {data:{user}}=await db.auth.getUser();box.classList.remove('hidden');if(!user){box.innerHTML='سجّل الدخول لعرض حالة الكود.';return}
      const sub=await effectiveSubscription();if(!sub){box.innerHTML='لا يوجد كود مفعّل.';return}
      const end=new Date(sub.effective_expires_at||sub.expires_at),active=end>Date.now();
      box.innerHTML=`<div class="code-status-card ${active?'is-active':'is-expired'}"><strong>${active?'🟢 مفعّل':'🔴 منتهي'}</strong><p>${String(sub.code_type||'')} • ${String(sub.code||'')}</p><p>ينتهي: ${end.toLocaleString('ar-IQ')}</p>${sub.adjust_minutes?`<small>تعديل الإدارة: ${sub.adjust_minutes>0?'+':''}${sub.adjust_minutes} دقيقة</small>`:''}</div>`;
    }catch(e){box.innerHTML=String(e.message||e)}
  }
  function siteNotice(title,message){document.getElementById('taj24AccountNotice')?.remove();const x=document.createElement('div');x.id='taj24AccountNotice';x.className='taj24-modal';x.innerHTML=`<div class="taj24-dialog"><div class="taj24-dialog-icon">⚠️</div><h3>${title}</h3><p>${message}</p><div class="taj24-dialog-actions"><button>حسنًا</button></div></div>`;document.body.appendChild(x);x.querySelector('button').onclick=()=>x.remove()}
  async function moderationCheck(){
    try{
      const db=c();if(!db)return;const {data:{user}}=await db.auth.getUser();if(!user)return;
      const {data:p,error}=await db.from('profiles').select('account_status,frozen_until,force_logout_version').eq('id',user.id).maybeSingle();if(error||!p)return;
      const k='taj_force_logout_'+user.id,nowV=Number(p.force_logout_version||0),old=localStorage.getItem(k);
      if(old===null)localStorage.setItem(k,String(nowV));else if(Number(old)!==nowV){localStorage.setItem(k,String(nowV));siteNotice('تم إنهاء الجلسة','قام المطور بطرد هذه الجلسة. سجّل الدخول مرة أخرى.');setTimeout(async()=>{await db.auth.signOut();location.reload()},900);return}
      if(p.account_status==='banned'){siteNotice('الحساب محظور','تم حظر هذا الحساب من الإدارة.');setTimeout(async()=>{await db.auth.signOut();location.reload()},1200);return}
      if(p.frozen_until&&new Date(p.frozen_until)>new Date()){
        const fk='taj_freeze_notice_'+p.frozen_until;if(!sessionStorage.getItem(fk)){sessionStorage.setItem(fk,'1');siteNotice('الحساب مجمّد','تم تجميد الحساب مؤقتًا حتى '+new Date(p.frozen_until).toLocaleString('ar-IQ'))}
      }
    }catch(e){console.warn('V24 moderation check',e)}
  }
  function install(){window.activateCode=activateCodeV24;if(window.tajV5){window.tajV5.activateCode=activateCodeV24;window.tajV5.renderCode=renderCodeV24}moderationCheck();setInterval(moderationCheck,15000)}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,700));if(document.readyState!=='loading')setTimeout(install,700);
  window.tajV24Account={effectiveSubscription,activateCode:activateCodeV24,renderCode:renderCodeV24,moderationCheck};
})();

/* ===== V26 — activation moved into Settings ===== */
(()=>{
  async function paste(){
    try{
      const text=await navigator.clipboard.readText();
      const input=document.getElementById('activationCode');
      if(input){input.value=String(text||'').trim().toUpperCase();input.focus()}
    }catch(e){ if(window.showToast)window.showToast('الصق الكود يدويًا داخل الحقل'); }
  }
  window.tajV26Code={paste};
})();
