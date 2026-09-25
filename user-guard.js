/* Taj Al Molook V28 — user-only section/moderation guard (admin UI removed) */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const fmtDate=v=>v?new Date(v).toLocaleString('ar-IQ'):'—';
  const visibleSectionKeys=['home','apps','games','store','cloud-games','links','settings'];
  let sb=null;
  let guardCache={at:0,profile:null,sections:new Map(),blocked:new Set(),pending:null};
  function client(){
    if(sb)return sb;
    if(!window.supabase||!window.TAJ_SUPABASE_URL||!window.TAJ_SUPABASE_KEY)return null;
    return sb=window.supabase.createClient(window.TAJ_SUPABASE_URL,window.TAJ_SUPABASE_KEY);
  }
  async function me(){
    const c=client(); if(!c)return null;
    const {data:{user}}=await c.auth.getUser(); if(!user)return null;
    const {data,error}=await c.from('profiles').select('id,role,user_number,account_status,frozen_until').eq('id',user.id).maybeSingle();
    if(error)throw error;
    if(data&&['admin','developer'].includes(String(data.role||'').toLowerCase())){
      await c.auth.signOut();
      notice('حساب الإدارة','حساب المطور يعمل من برنامج الحاسبة فقط.');
      return null;
    }
    return data;
  }
  function notice(title,message){
    $('taj24Modal')?.remove();
    const x=document.createElement('div');x.id='taj24Modal';x.className='taj24-modal';
    x.innerHTML=`<div class="taj24-dialog"><div class="taj24-dialog-icon">🔒</div><h3>${title}</h3><p>${message}</p><div class="taj24-dialog-actions"><button data-yes>رجوع</button></div></div>`;
    document.body.appendChild(x);x.querySelector('[data-yes]').onclick=()=>x.remove();x.onclick=e=>{if(e.target===x)x.remove()};
  }
  async function refreshGuardCache(force=false){
    if(!force&&Date.now()-guardCache.at<60000)return guardCache;
    if(guardCache.pending)return guardCache.pending;
    guardCache.pending=(async()=>{try{
      const c=client(),p=await me();
      if(!c){guardCache.pending=null;return guardCache}
      const sectionReq=c.from('platform_sections').select('section_key,enabled');
      const restrictionReq=p?c.from('user_section_restrictions').select('section_key,blocked').eq('user_id',p.id):Promise.resolve({data:[],error:null});
      const [sRes,rRes]=await Promise.all([sectionReq,restrictionReq]);
      const sections=new Map((sRes.data||[]).map(x=>[x.section_key,x.enabled!==false]));
      const blocked=new Set((rRes.data||[]).filter(x=>x.blocked!==false).map(x=>x.section_key));
      guardCache={at:Date.now(),profile:p,sections,blocked,pending:null}; return guardCache;
    }catch(e){console.warn('user guard',e);guardCache.at=Date.now();guardCache.pending=null;return guardCache}})();
    return guardCache.pending;
  }
  async function guardSection(id){try{
    const g=await refreshGuardCache(false),p=g.profile;
    if(p?.account_status==='banned'){notice('الحساب محظور','تم حظر هذا الحساب من الإدارة.');return false}
    if(p?.frozen_until&&new Date(p.frozen_until)>new Date()){notice('الحساب مجمّد','الحساب مجمّد حتى '+fmtDate(p.frozen_until));return false}
    if(!visibleSectionKeys.includes(id))return true;
    if(g.sections.has(id)&&g.sections.get(id)===false){notice('القسم مغلق','هذا القسم مغلق مؤقتًا من الإدارة.');return false}
    if(p&&g.blocked.has(id)){notice('القسم مقيّد','الإدارة قيّدت وصول هذا الحساب إلى هذا القسم.');return false}
  }catch(e){console.warn('section guard',e)} return true}
  function hookSections(){const original=window.openSection;if(typeof original==='function'&&!original.__taj28){const wrapped=async function(id){if(await guardSection(id))return original.apply(this,arguments)};wrapped.__taj28=true;window.openSection=wrapped}}
  function init(){hookSections();refreshGuardCache(true).catch(()=>{})}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,180)); if(document.readyState!=='loading')setTimeout(init,180);
  try{client()?.auth.onAuthStateChange(()=>{guardCache.at=0;setTimeout(()=>refreshGuardCache(true),120)})}catch(e){}
})();
