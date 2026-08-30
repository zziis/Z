const { createClient } = supabase;
const sb = createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = id => document.getElementById(id);
const show = (el, yes=true) => el.classList.toggle("hidden", !yes);
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

let signupMode = false;
let currentUser = null;
let myProfile = null;
let currentRoom = null;
let currentDmUser = null;
let chatMode = "room";
let messageChannel = null;
let roomsChannel = null;
let dmChannel = null;
let settingsChannel = null;
let appSettings = null;
let audioCtx = null, ambientNodes = [];

function authMsg(text){ $("authMsg").textContent = text || ""; }
function toast(text){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}
  t.textContent=text;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2800);
}

$("loginTab").onclick=()=>{signupMode=false;updateAuth();};
$("signupTab").onclick=()=>{signupMode=true;updateAuth();};
function updateAuth(){
  $("loginTab").classList.toggle("active",!signupMode);$("signupTab").classList.toggle("active",signupMode);
  show($("displayName"),signupMode);show($("username"),signupMode);
  $("authSubmit").textContent=signupMode?"إنشاء الحساب":"دخول";authMsg("");
}

$("authForm").onsubmit=async e=>{
  e.preventDefault();authMsg("");
  const email=$("email").value.trim(),password=$("password").value;
  if(signupMode){
    const display_name=$("displayName").value.trim();
    const username=$("username").value.trim().replace(/^@/,"").toLowerCase();
    if(!display_name)return authMsg("اكتب الاسم الظاهر.");
    if(!/^[a-z0-9_]{3,24}$/.test(username))return authMsg("اليوزر من 3 إلى 24 حرفًا إنجليزيًا/رقمًا أو _ فقط.");
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name,username}}});
    if(error)return authMsg(error.message.includes('duplicate')?"هذا اليوزر مستخدم.":error.message);
    if(data.session)await boot(data.session.user);else authMsg("تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا افتح بريدك ثم سجّل الدخول.");
  }else{
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error)return authMsg(error.message);
    await boot(data.user);
  }
};
$("logoutBtn").onclick=async()=>{stopMusic();await sb.auth.signOut();location.reload();};

async function boot(user){
  if(currentUser?.id===user.id && myProfile)return;
  currentUser=user;
  await ensureProfile();
  if(!myProfile){authMsg("تعذر تحميل الحساب.");return;}
  if(myProfile.is_banned){await sb.auth.signOut();alert("هذا الحساب موقوف من إدارة التطبيق.");return;}
  $("userLabel").textContent=`${myProfile.display_name} • @${myProfile.username}`;
  show($("authView"),false);show($("appView"),true);show($("adminBtn"),myProfile.role==="admin");
  await Promise.all([loadSettings(),loadRooms(),loadDmList(),updateUnreadBadge()]);
  subscribeRooms();subscribeDm();subscribeSettings();
}

async function ensureProfile(){
  let {data}=await sb.from('profiles').select('*').eq('id',currentUser.id).maybeSingle();
  if(!data){
    const display_name=currentUser.user_metadata?.display_name || currentUser.email.split('@')[0];
    const username=(currentUser.user_metadata?.username || ('user_'+currentUser.id.slice(0,8))).toLowerCase();
    await sb.from('profiles').upsert({id:currentUser.id,display_name,username},{onConflict:'id'});
    ({data}=await sb.from('profiles').select('*').eq('id',currentUser.id).single());
  }
  myProfile=data;
}

async function loadSettings(){
  const {data}=await sb.from('app_settings').select('*').eq('id',1).maybeSingle();
  appSettings=data||{welcome_text:'أهلاً بك في ZELZAL CHAT',welcome_enabled:true,music_mode:'off',music_url:'',music_title:'موسيقى هادئة'};
  renderSettings();
}
function renderSettings(){
  const b=$("welcomeBanner");b.textContent=appSettings?.welcome_text||'';show(b,!!appSettings?.welcome_enabled && !!appSettings?.welcome_text);
  $("musicBtn").title=appSettings?.music_title||'موسيقى هادئة';
}
function subscribeSettings(){
  if(settingsChannel)sb.removeChannel(settingsChannel);
  settingsChannel=sb.channel('settings-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_settings',filter:'id=eq.1'},p=>{appSettings=p.new;renderSettings();}).subscribe();
}

async function loadRooms(){
  const {data,error}=await sb.from('rooms').select('*,creator:profiles!rooms_created_by_fkey(display_name,username)').order('created_at',{ascending:true});
  if(error){$("roomsList").innerHTML="<p class='msg'>تعذر تحميل الرومات.</p>";return;}
  $("roomsList").innerHTML='';
  (data||[]).forEach(r=>{
    const b=document.createElement('button');b.className='roomItem'+(currentRoom?.id===r.id&&chatMode==='room'?' active':'');
    b.innerHTML=`<div class="roomMeta"><strong>🏠 ${escapeHtml(r.name)}</strong><small>${escapeHtml(r.description||'بدون وصف')}</small><small class="userLine">المنشئ: ${escapeHtml(r.creator?.display_name||'')} • @${escapeHtml(r.creator?.username||'')}</small></div>`;
    b.onclick=()=>openRoom(r);$("roomsList").appendChild(b);
  });
  if(!(data||[]).length)$("roomsList").innerHTML="<p class='muted'>لا توجد رومات بعد.</p>";
}
function subscribeRooms(){
  if(roomsChannel)sb.removeChannel(roomsChannel);
  roomsChannel=sb.channel('rooms-live').on('postgres_changes',{event:'*',schema:'public',table:'rooms'},()=>loadRooms()).subscribe();
}

async function openRoom(room){
  chatMode='room';currentRoom=room;currentDmUser=null;
  $("chatTitle").textContent=room.name;$("chatDesc").textContent=room.description||'';$("chatStatus").textContent='● روم عام';
  show($("deleteRoomBtn"),room.created_by===currentUser.id||myProfile.role==='admin');
  enableComposer(true);await loadRoomMessages();await loadRooms();closeMobileSidebar();
  if(messageChannel)await sb.removeChannel(messageChannel);
  messageChannel=sb.channel('room-messages-'+room.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`room_id=eq.${room.id}`},async p=>{
    const m=await hydrateRoomMessage(p.new);appendMessage(m,true);
  }).subscribe();
}
async function hydrateRoomMessage(m){
  const {data}=await sb.from('profiles').select('display_name,username').eq('id',m.user_id).single();return {...m,profiles:data};
}
async function loadRoomMessages(){
  $("messages").innerHTML="<div class='empty'>جاري التحميل...</div>";
  const {data,error}=await sb.from('messages').select('id,room_id,user_id,content,created_at,profiles(display_name,username)').eq('room_id',currentRoom.id).order('created_at',{ascending:true}).limit(250);
  if(error){$("messages").innerHTML="<div class='empty'>تعذر تحميل الرسائل.</div>";return;}
  $("messages").innerHTML='';(data||[]).forEach(m=>appendMessage(m,false));scrollBottom();
}

async function loadDmList(){
  const {data,error}=await sb.from('private_messages').select('id,sender_id,receiver_id,content,created_at,read_at,sender:profiles!private_messages_sender_id_fkey(display_name,username),receiver:profiles!private_messages_receiver_id_fkey(display_name,username)').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at',{ascending:false}).limit(300);
  if(error){$("dmList").innerHTML="<p class='msg'>تعذر تحميل الخاص.</p>";return;}
  const map=new Map();
  for(const m of data||[]){const otherId=m.sender_id===currentUser.id?m.receiver_id:m.sender_id;if(!map.has(otherId))map.set(otherId,{id:otherId,profile:m.sender_id===currentUser.id?m.receiver:m.sender,last:m});}
  $("dmList").innerHTML='';
  for(const x of map.values()){
    const b=document.createElement('button');b.className='dmItem'+(currentDmUser?.id===x.id&&chatMode==='dm'?' active':'');
    const unread=x.last.receiver_id===currentUser.id&&!x.last.read_at;
    b.innerHTML=`<div class="dmMeta"><strong>${escapeHtml(x.profile?.display_name||'')}</strong><small class="userLine">@${escapeHtml(x.profile?.username||'')}</small><small>${escapeHtml(x.last.content)}</small></div>${unread?'<span class="badge">●</span>':''}`;
    b.onclick=()=>openDm({id:x.id,...x.profile});$("dmList").appendChild(b);
  }
  if(!map.size)$("dmList").innerHTML="<p class='muted'>لا توجد محادثات خاصة بعد.</p>";
}

async function openDm(user){
  chatMode='dm';currentDmUser=user;currentRoom=null;
  $("chatTitle").textContent=user.display_name;$("chatDesc").textContent='@'+user.username;$("chatStatus").textContent='● رسالة خاصة';show($("deleteRoomBtn"),false);enableComposer(true);
  await markDmRead(user.id);await loadDmMessages();await loadDmList();await updateUnreadBadge();closeMobileSidebar();
  if(messageChannel)await sb.removeChannel(messageChannel);
  messageChannel=sb.channel('dm-'+[currentUser.id,user.id].sort().join('-')).on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages'},async p=>{
    const m=p.new;if(!((m.sender_id===currentUser.id&&m.receiver_id===user.id)||(m.sender_id===user.id&&m.receiver_id===currentUser.id)))return;
    if(m.receiver_id===currentUser.id)await markDmRead(user.id);
    const hydrated=await hydrateDmMessage(m);appendMessage(hydrated,true);await loadDmList();await updateUnreadBadge();
  }).subscribe();
}
async function hydrateDmMessage(m){
  const {data}=await sb.from('profiles').select('display_name,username').eq('id',m.sender_id).single();return {...m,user_id:m.sender_id,profiles:data};
}
async function loadDmMessages(){
  $("messages").innerHTML="<div class='empty'>جاري التحميل...</div>";
  const {data,error}=await sb.from('private_messages').select('id,sender_id,receiver_id,content,created_at,read_at,sender:profiles!private_messages_sender_id_fkey(display_name,username)').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentDmUser.id}),and(sender_id.eq.${currentDmUser.id},receiver_id.eq.${currentUser.id})`).order('created_at',{ascending:true}).limit(300);
  if(error){$("messages").innerHTML="<div class='empty'>تعذر تحميل الرسائل الخاصة.</div>";return;}
  $("messages").innerHTML='';(data||[]).forEach(m=>appendMessage({...m,user_id:m.sender_id,profiles:m.sender},false));scrollBottom();
}
async function markDmRead(otherId){await sb.from('private_messages').update({read_at:new Date().toISOString()}).eq('sender_id',otherId).eq('receiver_id',currentUser.id).is('read_at',null);}
async function updateUnreadBadge(){
  const {count}=await sb.from('private_messages').select('id',{count:'exact',head:true}).eq('receiver_id',currentUser.id).is('read_at',null);
  const n=count||0;$("dmBadge").textContent=n;show($("dmBadge"),n>0);
  document.title=n?`(${n}) ZELZAL CHAT`:'ZELZAL CHAT';
}
function subscribeDm(){
  if(dmChannel)sb.removeChannel(dmChannel);
  dmChannel=sb.channel('dm-inbox-'+currentUser.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages',filter:`receiver_id=eq.${currentUser.id}`},async p=>{
    await loadDmList();await updateUnreadBadge();
    if(!(chatMode==='dm'&&currentDmUser?.id===p.new.sender_id)){toast('📩 لديك رسالة خاصة جديدة');}
  }).subscribe();
}

function appendMessage(m,scroll){
  if($("messages").querySelector('.empty'))$("messages").innerHTML='';
  const d=document.createElement('div');d.className='bubble'+(m.user_id===currentUser.id?' me':'');
  const name=m.profiles?.display_name || (m.user_id===currentUser.id?myProfile.display_name:'عضو');
  const username=m.profiles?.username || (m.user_id===currentUser.id?myProfile.username:'');
  d.innerHTML=`<b>${escapeHtml(name)}</b><i class="username">@${escapeHtml(username)}</i><span>${escapeHtml(m.content)}</span><small>${new Date(m.created_at).toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}</small>`;
  $("messages").appendChild(d);if(scroll)scrollBottom();
}

$("messageForm").onsubmit=async e=>{
  e.preventDefault();const content=$("messageInput").value.trim();if(!content)return;$("sendBtn").disabled=true;
  let error;
  if(chatMode==='room'&&currentRoom)({error}=await sb.from('messages').insert({room_id:currentRoom.id,user_id:currentUser.id,content}));
  else if(chatMode==='dm'&&currentDmUser)({error}=await sb.from('private_messages').insert({sender_id:currentUser.id,receiver_id:currentDmUser.id,content}));
  $("sendBtn").disabled=false;if(error)alert(error.message);else{$("messageInput").value='';if(chatMode==='dm')loadDmList();}
};
function enableComposer(on){$("messageInput").disabled=!on;$("sendBtn").disabled=!on;}

$("newRoomBtn").onclick=()=>{show($("roomModal"),true);$("roomName").focus();};
$("cancelRoom").onclick=()=>show($("roomModal"),false);
$("createRoom").onclick=async()=>{
  $("roomMsg").textContent='';const name=$("roomName").value.trim(),description=$("roomDescription").value.trim();
  if(!name)return $("roomMsg").textContent='اكتب اسم الروم.';
  const {error}=await sb.from('rooms').insert({name,description,created_by:currentUser.id});
  if(error)return $("roomMsg").textContent=error.message;$("roomName").value='';$("roomDescription").value='';show($("roomModal"),false);
};
$("deleteRoomBtn").onclick=async()=>{
  if(!currentRoom)return;if(!confirm(`حذف روم «${currentRoom.name}» وجميع رسائله؟`))return;
  const {error}=await sb.from('rooms').delete().eq('id',currentRoom.id);if(error)return alert(error.message);
  currentRoom=null;$("chatTitle").textContent='اختر روم';$("chatDesc").textContent='';$("messages").innerHTML='<div class="empty">تم حذف الروم</div>';enableComposer(false);show($("deleteRoomBtn"),false);await loadRooms();
};

$("roomsTab").onclick=()=>switchSide('rooms');$("dmTab").onclick=()=>switchSide('dm');
function switchSide(which){show($("roomsPane"),which==='rooms');show($("dmPane"),which==='dm');$("roomsTab").classList.toggle('active',which==='rooms');$("dmTab").classList.toggle('active',which==='dm');if(which==='dm')loadDmList();}
$("newDmBtn").onclick=()=>{show($("dmModal"),true);$("userSearch").value='';$("userSearchResults").innerHTML='';$("userSearch").focus();};
$("closeDmModal").onclick=()=>show($("dmModal"),false);
let searchTimer;
$("userSearch").oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchUsers($("userSearch").value),250);};
async function searchUsers(q){
  q=q.trim().replace(/^@/,'');if(q.length<2){$("userSearchResults").innerHTML='<p class="muted">اكتب حرفين على الأقل.</p>';return;}
  const {data}=await sb.from('profiles').select('id,display_name,username').neq('id',currentUser.id).or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(20);
  $("userSearchResults").innerHTML='';for(const u of data||[]){const row=document.createElement('div');row.className='searchUser';row.innerHTML=`<div><strong>${escapeHtml(u.display_name)}</strong><small class="userLine">@${escapeHtml(u.username)}</small></div><button class="primary" type="button">مراسلة</button>`;row.querySelector('button').onclick=()=>{show($("dmModal"),false);switchSide('dm');openDm(u);};$("userSearchResults").appendChild(row);}if(!(data||[]).length)$("userSearchResults").innerHTML='<p class="muted">لا توجد نتائج.</p>';
}

$("adminBtn").onclick=async()=>{if(myProfile.role!=='admin')return;show($("adminModal"),true);fillAdminSettings();await adminLoadUsers('');};
$("closeAdmin").onclick=()=>show($("adminModal"),false);
function fillAdminSettings(){
  $("adminWelcome").value=appSettings?.welcome_text||'';$("adminWelcomeEnabled").checked=!!appSettings?.welcome_enabled;$("adminMusicMode").value=appSettings?.music_mode||'off';$("adminMusicUrl").value=appSettings?.music_url||'';$("adminMusicTitle").value=appSettings?.music_title||'';
}
$("saveSettings").onclick=async()=>{
  const patch={welcome_text:$("adminWelcome").value.trim(),welcome_enabled:$("adminWelcomeEnabled").checked,music_mode:$("adminMusicMode").value,music_url:$("adminMusicUrl").value.trim(),music_title:$("adminMusicTitle").value.trim()};
  const {error}=await sb.from('app_settings').update(patch).eq('id',1);$("adminMsg").textContent=error?error.message:'تم حفظ الإعدادات.';if(!error){appSettings={...appSettings,...patch};renderSettings();}
};
let adminSearchTimer;$("adminUserSearch").oninput=()=>{clearTimeout(adminSearchTimer);adminSearchTimer=setTimeout(()=>adminLoadUsers($("adminUserSearch").value),250);};
async function adminLoadUsers(q){
  let req=sb.from('profiles').select('id,display_name,username,role,is_banned,created_at').order('created_at',{ascending:false}).limit(50);q=q.trim().replace(/^@/,'');if(q)req=req.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);const {data}=await req;
  $("adminUsers").innerHTML='';for(const u of data||[]){const row=document.createElement('div');row.className='adminUserRow';row.innerHTML=`<div><strong>${escapeHtml(u.display_name)}</strong><small>@${escapeHtml(u.username)} • ${u.role==='admin'?'مدير':'مستخدم'}${u.is_banned?' • موقوف':''}</small></div><div class="userActions"><button class="ghost dmAdmin" type="button">مراسلة</button>${u.id!==currentUser.id?`<button class="${u.is_banned?'ghost':'danger'} banAdmin" type="button">${u.is_banned?'فك الحظر':'حظر'}</button>`:''}</div>`;row.querySelector('.dmAdmin').onclick=()=>{show($("adminModal"),false);switchSide('dm');openDm(u);};const ban=row.querySelector('.banAdmin');if(ban)ban.onclick=async()=>{await sb.from('profiles').update({is_banned:!u.is_banned}).eq('id',u.id);adminLoadUsers($("adminUserSearch").value);};$("adminUsers").appendChild(row);}
}

$("musicBtn").onclick=()=>{if($("musicBtn").classList.contains('musicActive'))stopMusic();else startMusic();};
async function startMusic(){
  const mode=appSettings?.music_mode||'off';if(mode==='off')return toast('الموسيقى متوقفة من إعدادات الإدارة.');
  stopMusic(false);
  if(mode==='custom'&&appSettings?.music_url){const a=$("customAudio");a.src=appSettings.music_url;a.volume=.28;try{await a.play();$("musicBtn").classList.add('musicActive');$("musicBtn").textContent='♫ إيقاف';}catch{toast('تعذر تشغيل رابط الموسيقى.');}return;}
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();const master=audioCtx.createGain();master.gain.value=.035;master.connect(audioCtx.destination);
  const freqs=mode==='calm2'?[174.61,261.63,349.23]:[130.81,196,261.63];
  freqs.forEach((f,i)=>{const osc=audioCtx.createOscillator(),g=audioCtx.createGain();osc.type=i===0?'sine':'triangle';osc.frequency.value=f;g.gain.value=i===0?.7:.22;osc.connect(g);g.connect(master);osc.start();ambientNodes.push(osc,g);});
  $("musicBtn").classList.add('musicActive');$("musicBtn").textContent='♫ إيقاف';
}
function stopMusic(reset=true){const a=$("customAudio");a.pause();a.currentTime=0;ambientNodes.forEach(n=>{try{n.stop?.();}catch{}try{n.disconnect?.();}catch{}});ambientNodes=[];if(audioCtx){try{audioCtx.close();}catch{}audioCtx=null;}if(reset){$("musicBtn").classList.remove('musicActive');$("musicBtn").textContent='♫ موسيقى';}}

$("menuBtn").onclick=()=>$("sidePanel").classList.toggle('open');function closeMobileSidebar(){if(innerWidth<=760)$("sidePanel").classList.remove('open');}
function scrollBottom(){const x=$("messages");x.scrollTop=x.scrollHeight;}

document.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.add('hidden');});
sb.auth.getSession().then(({data})=>{if(data.session)boot(data.session.user);});
sb.auth.onAuthStateChange((_event,session)=>{if(session&&!currentUser)boot(session.user);});
