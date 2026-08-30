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
let presenceChannel = null;
let roomReceiptsChannel = null;
let appSettings = null;
let mediaRecorder=null, recordedChunks=[], recordStartedAt=0, recordTimer=null, recordedBlob=null, recordedDuration=0;
let audioCtx = null, ambientNodes = [];
let selectedMessageForAction = null;

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
async function doLogout(){stopMusic();await sb.auth.signOut();location.reload();}

async function boot(user){
  if(currentUser?.id===user.id && myProfile)return;
  currentUser=user;
  await ensureProfile();
  if(!myProfile){authMsg("تعذر تحميل الحساب.");return;}
  if(myProfile.is_banned){await sb.auth.signOut();alert("هذا الحساب موقوف من إدارة التطبيق.");return;}
  $("userLabel").textContent=`${myProfile.display_name} • @${myProfile.username}`;
  show($("authView"),false);show($("appView"),true);show($("adminBtn"),myProfile.role==="admin");show($("bottomNav"),true);
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
  $("musicBtn").title=appSettings?.music_title||'موسيقى هادئة';if($("musicTitleView"))$("musicTitleView").textContent=appSettings?.music_title||'موسيقى هادئة';
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
  history.pushState({chat:'room'},'','#room');
  setBottomActive('rooms');
  chatMode='room';currentRoom=room;currentDmUser=null;
  $("chatTitle").textContent=room.name;$("chatDesc").textContent=room.description||'';$("chatStatus").textContent='● روم عام';
  $("roomWelcomeTrack").textContent=room.welcome_text?`👋 ${room.welcome_text}`:'';
  show($("roomWelcomeNotice"),!!room.welcome_text);
  show($("roomOnlineCount"),true);
  show($("deleteRoomBtn"),room.created_by===currentUser.id||myProfile.role==='admin');
  enableComposer(true);await loadRoomMessages();await markRoomRead();await loadRooms();closeMobileSidebar();
  subscribeRoomPresence(room.id);
  if(messageChannel)await sb.removeChannel(messageChannel);
  messageChannel=sb.channel('room-messages-'+room.id)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`room_id=eq.${room.id}`},async p=>{
    const hidden=await getHiddenRoomIds();
    if(hidden.has(Number(p.new.id)))return;
    const m=await hydrateRoomMessage(p.new);appendMessage(m,true);
    if(m.user_id!==currentUser.id){playChatSound('receive');await markRoomRead();}
  })
  .on('postgres_changes',{event:'DELETE',schema:'public',table:'messages'},p=>{
    const el=$('messages').querySelector(`.bubble[data-message-id="${p.old.id}"]`);if(el)el.remove();
  })
  .subscribe();
  subscribeRoomReceipts(room.id);
}
async function hydrateRoomMessage(m){
  const {data}=await sb.from('profiles').select('display_name,username').eq('id',m.user_id).single();return {...m,profiles:data};
}

async function getHiddenRoomIds(){
  const {data}=await sb.from('hidden_room_messages').select('message_id').eq('user_id',currentUser.id);
  return new Set((data||[]).map(x=>Number(x.message_id)));
}
async function getHiddenPrivateIds(){
  const {data}=await sb.from('hidden_private_messages').select('message_id').eq('user_id',currentUser.id);
  return new Set((data||[]).map(x=>Number(x.message_id)));
}
function messageAgeMinutes(m){
  return (Date.now()-new Date(m.created_at).getTime())/60000;
}
function canDeleteForEveryone(m){
  const mine=chatMode==='dm' ? m.sender_id===currentUser.id : m.user_id===currentUser.id;
  if(!mine)return false;
  if(chatMode==='room' && myProfile?.role==='admin')return true;
  return messageAgeMinutes(m)<=30;
}
function openMessageActions(m){
  selectedMessageForAction=m;
  const everyone=canDeleteForEveryone(m);
  show($('deleteForEveryoneBtn'),everyone);
  $('messageDeleteHint').textContent=everyone
    ? 'يمكنك حذف هذه الرسالة عند الجميع لأنها ضمن مدة 30 دقيقة.'
    : 'انتهت مدة الحذف عند الجميع. يمكنك حذفها من حسابك فقط.';
  show($('messageActionsModal'),true);
}
$('closeMessageActions').onclick=()=>{selectedMessageForAction=null;show($('messageActionsModal'),false);};
$('deleteForMeBtn').onclick=async()=>{
  const m=selectedMessageForAction;if(!m)return;
  let error;
  if(chatMode==='room'){
    ({error}=await sb.from('hidden_room_messages').upsert({user_id:currentUser.id,message_id:m.id},{onConflict:'user_id,message_id'}));
  }else{
    ({error}=await sb.from('hidden_private_messages').upsert({user_id:currentUser.id,message_id:m.id},{onConflict:'user_id,message_id'}));
  }
  if(error)return alert(error.message);
  const el=$('messages').querySelector(`.bubble[data-message-id="${m.id}"]`);
  if(el)el.remove();
  selectedMessageForAction=null;show($('messageActionsModal'),false);
  if(chatMode==='dm')await loadDmList();
};
$('deleteForEveryoneBtn').onclick=async()=>{
  const m=selectedMessageForAction;if(!m)return;
  if(!canDeleteForEveryone(m)){
    show($('deleteForEveryoneBtn'),false);
    $('messageDeleteHint').textContent='انتهت مدة 30 دقيقة. أصبح متاحًا حذفها عندك فقط.';
    return;
  }
  if(!confirm('حذف الرسالة عند الجميع؟'))return;
  let error;
  if(chatMode==='room'){
    ({error}=await sb.from('messages').delete().eq('id',m.id));
  }else{
    ({error}=await sb.from('private_messages').delete().eq('id',m.id));
  }
  if(error)return alert(error.message);
  const el=$('messages').querySelector(`.bubble[data-message-id="${m.id}"]`);
  if(el)el.remove();
  selectedMessageForAction=null;show($('messageActionsModal'),false);
  if(chatMode==='dm')await loadDmList();
};

async function loadRoomMessages(){
  $("messages").innerHTML="<div class='empty'>جاري التحميل...</div>";
  const [{data,error},hiddenIds]=await Promise.all([
    sb.from('messages').select('id,room_id,user_id,content,media_type,media_path,media_duration,created_at,profiles(display_name,username)').eq('room_id',currentRoom.id).order('created_at',{ascending:true}).limit(250),
    getHiddenRoomIds()
  ]);
  if(error){$("messages").innerHTML="<div class='empty'>تعذر تحميل الرسائل.</div>";return;}
  const visible=(data||[]).filter(m=>!hiddenIds.has(Number(m.id)));
  const ids=visible.filter(m=>m.user_id===currentUser.id).map(m=>m.id);
  let counts={};
  if(ids.length){
    const {data:r}=await sb.from('room_message_reads').select('message_id,user_id').in('message_id',ids).neq('user_id',currentUser.id);
    for(const x of r||[])counts[x.message_id]=(counts[x.message_id]||0)+1;
  }
  $("messages").innerHTML='';visible.forEach(m=>appendMessage({...m,read_count:counts[m.id]||0},false));scrollBottom();
}

async function loadDmList(){
  const [{data,error},hiddenIds]=await Promise.all([
    sb.from('private_messages').select('id,sender_id,receiver_id,content,media_type,media_path,media_duration,created_at,delivered_at,read_at,sender:profiles!private_messages_sender_id_fkey(display_name,username),receiver:profiles!private_messages_receiver_id_fkey(display_name,username)').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at',{ascending:false}).limit(300),
    getHiddenPrivateIds()
  ]);
  if(error){$("dmList").innerHTML="<p class='msg'>تعذر تحميل الخاص.</p>";return;}
  const map=new Map();
  for(const m of (data||[]).filter(x=>!hiddenIds.has(Number(x.id)))){
    const otherId=m.sender_id===currentUser.id?m.receiver_id:m.sender_id;
    if(!map.has(otherId))map.set(otherId,{id:otherId,profile:m.sender_id===currentUser.id?m.receiver:m.sender,last:m});
  }
  $("dmList").innerHTML='';
  for(const x of map.values()){
    const b=document.createElement('button');b.className='dmItem'+(currentDmUser?.id===x.id&&chatMode==='dm'?' active':'');
    const unread=x.last.receiver_id===currentUser.id&&!x.last.read_at;
    b.innerHTML=`<div class="dmMeta"><strong>${escapeHtml(x.profile?.display_name||'')}</strong><small class="userLine">@${escapeHtml(x.profile?.username||'')}</small><small>${escapeHtml(x.last.content)}</small></div>${unread?'<span class="badge">●</span>':''}`;
    b.onclick=()=>openDm({id:x.id,...x.profile});$("dmList").appendChild(b);
  }
  if(!map.size)$("dmList").innerHTML="<p class='muted'>لا توجد محادثات خاصة بعد.</p>";
}


function updateDmReceiptInDom(message){
  const bubble=$("messages").querySelector(`.bubble[data-message-id="${message.id}"]`);
  if(!bubble || message.sender_id!==currentUser.id)return;
  const receipt=bubble.querySelector(".receipt");
  const receiptText=bubble.querySelector(".receiptText");
  if(!receipt || !receiptText)return;
  const state=message.read_at?'read':(message.delivered_at?'delivered':'sent');
  receipt.textContent=state==='sent'?'✓':'✓✓';
  receipt.classList.toggle('read',state==='read');
  receiptText.textContent=state==='read'?'تمت القراءة':(state==='delivered'?'مستلم':'تم الإرسال');
  receiptText.classList.toggle('read',state==='read');
}

async function openDm(user){
  history.pushState({chat:'dm'},'','#dm');
  setBottomActive('dm');
  chatMode='dm';currentDmUser=user;currentRoom=null;
  $("chatTitle").textContent=user.display_name;$("chatDesc").textContent='@'+user.username;$("chatStatus").textContent='● رسالة خاصة';
  show($("roomOnlineCount"),false);show($("roomWelcomeNotice"),false);show($("deleteRoomBtn"),false);enableComposer(true);
  if(presenceChannel){await sb.removeChannel(presenceChannel);presenceChannel=null;}
  if(roomReceiptsChannel){await sb.removeChannel(roomReceiptsChannel);roomReceiptsChannel=null;}
  if(messageChannel)await sb.removeChannel(messageChannel);

  await loadDmMessages();
  await markDmDelivered(user.id);
  await markDmRead(user.id);
  await loadDmList();
  await updateUnreadBadge();
  closeMobileSidebar();

  messageChannel=sb.channel('dm-'+[currentUser.id,user.id].sort().join('-'))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages'},async p=>{
      const m=p.new;
      if(!((m.sender_id===currentUser.id&&m.receiver_id===user.id)||(m.sender_id===user.id&&m.receiver_id===currentUser.id)))return;
      const {data:full}=await sb.from('private_messages')
        .select('id,sender_id,receiver_id,content,media_type,media_path,media_duration,created_at,delivered_at,read_at,sender:profiles!private_messages_sender_id_fkey(display_name,username)')
        .eq('id',m.id).single();
      if(full && !$("messages").querySelector(`[data-message-id="${full.id}"]`))appendMessage(full,true);
      if(m.receiver_id===currentUser.id){
        await markDmDelivered(user.id);
        await markDmRead(user.id);
        playChatSound('receive');
      }
      await loadDmList();await updateUnreadBadge();
    })
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'private_messages'},p=>{
      const m=p.new;
      if((m.sender_id===currentUser.id&&m.receiver_id===user.id)||(m.sender_id===user.id&&m.receiver_id===currentUser.id)){
        updateDmReceiptInDom(m);
      }
    })
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'private_messages'},async p=>{
      const el=$('messages').querySelector(`.bubble[data-message-id="${p.old.id}"]`);if(el)el.remove();
      await loadDmList();
    })
    .subscribe();
}
async function hydrateDmMessage(m){
  const {data}=await sb.from('profiles').select('display_name,username').eq('id',m.sender_id).single();return {...m,user_id:m.sender_id,profiles:data};
}
async function loadDmMessages(){
  const previousScroll=$("messages").scrollTop;
  const [{data,error},hiddenIds]=await Promise.all([
    sb.from('private_messages')
      .select('id,sender_id,receiver_id,content,media_type,media_path,media_duration,created_at,delivered_at,read_at,sender:profiles!private_messages_sender_id_fkey(display_name,username)')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentDmUser.id}),and(sender_id.eq.${currentDmUser.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at',{ascending:true}).limit(250),
    getHiddenPrivateIds()
  ]);
  if(error){
    if(!$("messages").children.length)$("messages").innerHTML="<div class='empty'>تعذر تحميل الرسائل.</div>";
    return;
  }
  const visible=(data||[]).filter(m=>!hiddenIds.has(Number(m.id)));
  const wasNearBottom=($("messages").scrollHeight-$("messages").scrollTop-$("messages").clientHeight)<120;
  $("messages").innerHTML='';
  visible.forEach(m=>appendMessage(m,false));
  if(wasNearBottom || previousScroll===0)scrollBottom();
  else $("messages").scrollTop=previousScroll;
}
async function markDmDelivered(otherId){
  const now=new Date().toISOString();
  await sb.from('private_messages')
    .update({delivered_at:now})
    .eq('sender_id',otherId).eq('receiver_id',currentUser.id)
    .is('delivered_at',null);
}
async function markDmRead(otherId){
  const now=new Date().toISOString();
  await sb.from('private_messages')
    .update({delivered_at:now,read_at:now})
    .eq('sender_id',otherId).eq('receiver_id',currentUser.id)
    .is('read_at',null);
}
async function updateUnreadBadge(){
  const {count}=await sb.from('private_messages').select('id',{count:'exact',head:true}).eq('receiver_id',currentUser.id).is('read_at',null);
  const n=count||0;$("dmBadge").textContent=n;show($("dmBadge"),n>0);$("bottomDmBadge").textContent=n;show($("bottomDmBadge"),n>0);
  document.title=n?`(${n}) ZELZAL CHAT`:'ZELZAL CHAT';
}
function subscribeDm(){
  if(dmChannel)sb.removeChannel(dmChannel);
  dmChannel=sb.channel('dm-inbox-'+currentUser.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages',filter:`receiver_id=eq.${currentUser.id}`},async p=>{
    await markDmDelivered(p.new.sender_id);await loadDmList();await updateUnreadBadge();
    if(!(chatMode==='dm'&&currentDmUser?.id===p.new.sender_id)){playChatSound('receive');toast('📩 لديك رسالة خاصة جديدة');}
  }).subscribe();
}

function appendMessage(m,scroll){
  if($("messages").querySelector('.empty'))$("messages").innerHTML='';
  const mine=(chatMode==='dm' ? m.sender_id===currentUser.id : m.user_id===currentUser.id);
  const d=document.createElement('div');d.className='bubble'+(mine?' me':'');d.dataset.messageId=m.id||'';
  const profile=m.profiles||m.sender;
  const name=profile?.display_name || (mine?myProfile.display_name:'عضو');
  const username=profile?.username || (mine?myProfile.username:'');
  let receipt='';
  if(mine){
    if(chatMode==='dm'){
      const state=m.read_at?'read':(m.delivered_at?'delivered':'sent');
      const icon=state==='sent'?'✓':'✓✓';
      const label=state==='read'?'تمت القراءة':(state==='delivered'?'مستلم':'تم الإرسال');
      receipt=`<span class="receipt ${state==='read'?'read':''}">${icon}</span><span class="receiptText ${state==='read'?'read':''}">${label}</span>`;
    }else{
      const readCount=Number(m.read_count||0);
      receipt=`<span class="receipt ${readCount>0?'read':''}">${readCount>0?'✓✓':'✓'}</span>`;
    }
  }
  const caption=(m.content && !['[صورة]','[رسالة صوتية]'].includes(m.content)) ? `<span class="mediaCaption">${escapeHtml(m.content)}</span>` : '';
  d.innerHTML=`<b>${escapeHtml(name)}</b><i class="username">@${escapeHtml(username)}</i>
    <div class="messageBody">${caption}<div class="mediaHost"></div></div>
    <small>${new Date(m.created_at).toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}${receipt}</small>`;
  const menu=document.createElement('button');
  menu.className='msgMenuBtn';menu.type='button';menu.textContent='⋮';menu.setAttribute('aria-label','خيارات الرسالة');
  menu.onclick=e=>{e.stopPropagation();openMessageActions(m);};
  d.appendChild(menu);
  $("messages").appendChild(d);
  if(m.media_path && m.media_type) renderMessageMedia(d.querySelector('.mediaHost'),m);
  else if(!caption) d.querySelector('.messageBody').innerHTML=`<span>${escapeHtml(m.content||'')}</span>`;
  if(scroll)scrollBottom();
}

async function renderMessageMedia(host,m){
  host.innerHTML='<span class="mediaLoading">جاري تحميل المرفق...</span>';
  const {data,error}=await sb.storage.from('chat-media').createSignedUrl(m.media_path,3600);
  if(error||!data?.signedUrl){host.innerHTML='<span class="mediaLoading">تعذر تحميل المرفق</span>';return;}
  if(m.media_type==='image'){
    const img=document.createElement('img');img.className='mediaImage';img.alt='صورة مرسلة';img.src=data.signedUrl;
    img.onclick=()=>window.open(data.signedUrl,'_blank');host.innerHTML='';host.appendChild(img);
  }else if(m.media_type==='audio'){
    const audio=document.createElement('audio');audio.className='mediaAudio';audio.controls=true;audio.preload='metadata';audio.src=data.signedUrl;
    host.innerHTML='';host.appendChild(audio);
  }
}

$("messageForm").onsubmit=async e=>{
  e.preventDefault();const content=$("messageInput").value.trim();if(!content)return;$("sendBtn").disabled=true;
  let error;
  if(chatMode==='room'&&currentRoom)({error}=await sb.from('messages').insert({room_id:currentRoom.id,user_id:currentUser.id,content}));
  else if(chatMode==='dm'&&currentDmUser)({error}=await sb.from('private_messages').insert({sender_id:currentUser.id,receiver_id:currentDmUser.id,content}));
  $("sendBtn").disabled=false;if(error)alert(error.message);else{playChatSound('send');$("messageInput").value='';if(chatMode==='dm')loadDmList();}
};
function enableComposer(on){
  $("messageInput").disabled=!on;
  $("sendBtn").disabled=!on;
  $("imageBtn").disabled=true;
  $("voiceBtn").disabled=true;
}


function currentMediaTarget(){
  if(chatMode==='room'&&currentRoom)return {kind:'room',id:currentRoom.id};
  if(chatMode==='dm'&&currentDmUser)return {kind:'dm',id:currentDmUser.id};
  return null;
}
function safeExt(name,fallback){
  const m=(name||'').toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?m[1]:fallback;
}
async function sendMediaFile(file,type,duration=0){
  const target=currentMediaTarget();if(!target)return alert('اختر رومًا أو محادثة خاصة أولًا.');
  const max=type==='image'?8*1024*1024:12*1024*1024;
  if(file.size>max)return alert(type==='image'?'حجم الصورة يجب أن يكون أقل من 8MB.':'حجم الرسالة الصوتية يجب أن يكون أقل من 12MB.');
  const ext=type==='image'?safeExt(file.name,'jpg'):(file.type.includes('ogg')?'ogg':file.type.includes('mp4')?'m4a':'webm');
  const path=`${target.kind}/${currentUser.id}/${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}.${ext}`;
  showUploadStatus(type==='image'?'جاري رفع الصورة...':'جاري رفع الرسالة الصوتية...');
  const {error:upErr}=await sb.storage.from('chat-media').upload(path,file,{contentType:file.type||undefined,upsert:false});
  if(upErr){hideUploadStatus();return alert('فشل رفع الملف: '+upErr.message);}
  const content=type==='image'?'[صورة]':'[رسالة صوتية]';
  let error;
  if(target.kind==='room'){
    ({error}=await sb.from('messages').insert({room_id:currentRoom.id,user_id:currentUser.id,content,media_type:type,media_path:path,media_duration:duration||null}));
  }else{
    ({error}=await sb.from('private_messages').insert({sender_id:currentUser.id,receiver_id:currentDmUser.id,content,media_type:type,media_path:path,media_duration:duration||null}));
  }
  hideUploadStatus();
  if(error){
    await sb.storage.from('chat-media').remove([path]);
    return alert('تعذر إرسال المرفق: '+error.message);
  }
  playChatSound('send');
}
function showUploadStatus(text){
  let el=$('uploadProgress');
  if(!el){el=document.createElement('div');el.id='uploadProgress';el.className='uploadProgress';document.body.appendChild(el);}
  el.textContent=text;show(el,true);
}
function hideUploadStatus(){const el=$('uploadProgress');if(el)show(el,false);}

$("imageBtn").onclick=()=>toast("🖼️ إرسال الصور قريبًا");
$("imageInput").onchange=e=>{e.target.value="";};

$("voiceBtn").onclick=()=>toast("🎙️ الرسائل الصوتية قريبًا");

$("newRoomBtn").onclick=()=>{show($("roomModal"),true);$("roomName").focus();};
$("cancelRoom").onclick=()=>show($("roomModal"),false);
$("createRoom").onclick=async()=>{
  $("roomMsg").textContent='';const name=$("roomName").value.trim(),description=$("roomDescription").value.trim(),welcome_text=$("roomWelcome").value.trim();
  if(!name)return $("roomMsg").textContent='اكتب اسم الروم.';
  const {error}=await sb.from('rooms').insert({name,description,welcome_text,created_by:currentUser.id});
  if(error)return $("roomMsg").textContent=error.message;$("roomName").value='';$("roomDescription").value='';$("roomWelcome").value='';show($("roomModal"),false);
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

$("musicBtn").onclick=()=>{ $("musicTitleView").textContent=appSettings?.music_title||'موسيقى هادئة'; show($("musicModal"),true); };
$("closeMusic").onclick=()=>show($("musicModal"),false);
$("musicToggleLarge").onclick=()=>{if($("musicBtn").classList.contains('musicActive'))stopMusic();else startMusic();};
async function startMusic(){
  const mode=appSettings?.music_mode||'off';if(mode==='off')return toast('الموسيقى متوقفة من إعدادات الإدارة.');
  stopMusic(false);
  if(mode==='custom'&&appSettings?.music_url){const a=$("customAudio");a.src=appSettings.music_url;a.volume=.28;try{await a.play();$("musicBtn").classList.add('musicActive');$("musicBtn").textContent='♫ تشغيل';$("musicToggleLarge").textContent='⏸ إيقاف';}catch{toast('تعذر تشغيل رابط الموسيقى.');}return;}
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();const master=audioCtx.createGain();master.gain.value=.035;master.connect(audioCtx.destination);
  const freqs=mode==='calm2'?[174.61,261.63,349.23]:[130.81,196,261.63];
  freqs.forEach((f,i)=>{const osc=audioCtx.createOscillator(),g=audioCtx.createGain();osc.type=i===0?'sine':'triangle';osc.frequency.value=f;g.gain.value=i===0?.7:.22;osc.connect(g);g.connect(master);osc.start();ambientNodes.push(osc,g);});
  $("musicBtn").classList.add('musicActive');$("musicBtn").textContent='♫ تشغيل';$("musicToggleLarge").textContent='⏸ إيقاف';
}
function stopMusic(reset=true){const a=$("customAudio");a.pause();a.currentTime=0;ambientNodes.forEach(n=>{try{n.stop?.();}catch{}try{n.disconnect?.();}catch{}});ambientNodes=[];if(audioCtx){try{audioCtx.close();}catch{}audioCtx=null;}if(reset){$("musicBtn").classList.remove('musicActive');$("musicBtn").textContent='♫ موسيقى';if($("musicToggleLarge"))$("musicToggleLarge").textContent='▶ تشغيل';}}


function playChatSound(kind){
  try{
    const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=kind==='send'?640:440;
    g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.05,c.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.11);
    o.start();o.stop(c.currentTime+.12);o.onended=()=>c.close();
  }catch{}
}
function setBottomActive(which){
  ['navRooms','navDm','navAccount'].forEach(id=>$(id).classList.remove('active'));
  if(which==='rooms')$('navRooms').classList.add('active');
  if(which==='dm')$('navDm').classList.add('active');
  if(which==='account')$('navAccount').classList.add('active');
}
$('navRooms').onclick=()=>{setBottomActive('rooms');switchSide('rooms');$('sidePanel').classList.add('open');};
$('navDm').onclick=()=>{setBottomActive('dm');switchSide('dm');$('sidePanel').classList.add('open');};
$('navAccount').onclick=()=>openAccount();
$('chatBackBtn').onclick=()=>goBackToList();

function goBackToList(){
  enableComposer(false);currentRoom=null;currentDmUser=null;
  $('chatTitle').textContent='اختر محادثة';$('chatDesc').textContent='';$('chatStatus').textContent='● جاهز';
  $('messages').innerHTML='<div class="empty">اختر رومًا أو محادثة خاصة للبدء</div>';
  show($('roomWelcomeNotice'),false);$('roomWelcomeTrack').textContent='';show($('roomOnlineCount'),false);show($('deleteRoomBtn'),false);
  if(presenceChannel){sb.removeChannel(presenceChannel);presenceChannel=null;}
  if(roomReceiptsChannel){sb.removeChannel(roomReceiptsChannel);roomReceiptsChannel=null;}
  if(innerWidth<=760)$('sidePanel').classList.add('open');
}
function openAccount(){
  setBottomActive('account');
  $('accountDisplayName').value=myProfile?.display_name||'';
  $('accountUsername').value=myProfile?.username||'';
  $('accountEmail').value=currentUser?.email||'';
  $('accountMsg').textContent='';
  show($('accountModal'),true);
}
$('closeAccount').onclick=()=>{show($('accountModal'),false);setBottomActive(chatMode==='dm'?'dm':'rooms');};
$('accountLogout').onclick=doLogout;
$('saveAccount').onclick=async()=>{
  const display_name=$('accountDisplayName').value.trim();
  const username=$('accountUsername').value.trim().replace(/^@/,'').toLowerCase();
  $('accountMsg').textContent='';
  if(!display_name)return $('accountMsg').textContent='اكتب الاسم الظاهر.';
  if(!/^[a-z0-9_]{3,24}$/.test(username))return $('accountMsg').textContent='اليوزر من 3 إلى 24 حرفًا إنجليزيًا/رقمًا أو _ فقط.';
  const {error}=await sb.from('profiles').update({display_name,username}).eq('id',currentUser.id);
  if(error)return $('accountMsg').textContent=error.message.includes('duplicate')?'هذا اليوزر مستخدم.':error.message;
  myProfile={...myProfile,display_name,username};$('userLabel').textContent=`${display_name} • @${username}`;
  $('accountMsg').textContent='تم حفظ التعديل.';await loadRooms();await loadDmList();
};
$('deleteAccount').onclick=async()=>{
  if(!confirm('هل أنت متأكد من حذف الحساب نهائيًا؟ لا يمكن التراجع.'))return;
  const typed=prompt('اكتب DELETE للتأكيد');
  if(typed!=='DELETE')return;
  const {error}=await sb.rpc('delete_my_account');
  if(error)return alert(error.message);
  await sb.auth.signOut();location.reload();
};

async function subscribeRoomPresence(roomId){
  if(presenceChannel)await sb.removeChannel(presenceChannel);
  presenceChannel=sb.channel('presence-room-'+roomId,{config:{presence:{key:currentUser.id}}});
  presenceChannel.on('presence',{event:'sync'},()=>{
    const state=presenceChannel.presenceState();
    const count=Object.keys(state).length;
    $('roomOnlineCount').textContent=`👥 ${count} متصل`;
    show($('roomOnlineCount'),true);
  });
  presenceChannel.subscribe(async status=>{
    if(status==='SUBSCRIBED')await presenceChannel.track({user_id:currentUser.id,username:myProfile.username,online_at:new Date().toISOString()});
  });
}
async function markRoomRead(){
  if(!currentRoom)return;
  const {data}=await sb.from('messages').select('id').eq('room_id',currentRoom.id).neq('user_id',currentUser.id).order('created_at',{ascending:false}).limit(100);
  if(!(data||[]).length)return;
  const rows=data.map(m=>({message_id:m.id,user_id:currentUser.id}));
  await sb.from('room_message_reads').upsert(rows,{onConflict:'message_id,user_id',ignoreDuplicates:true});
}
function subscribeRoomReceipts(roomId){
  if(roomReceiptsChannel)sb.removeChannel(roomReceiptsChannel);
  roomReceiptsChannel=sb.channel('room-receipts-'+roomId).on('postgres_changes',{event:'INSERT',schema:'public',table:'room_message_reads'},async()=>{if(chatMode==='room'&&currentRoom?.id===roomId)await loadRoomMessages();}).subscribe();
}
window.addEventListener('popstate',()=>{
  const openModal=document.querySelector('.modal:not(.hidden)');
  if(openModal){openModal.classList.add('hidden');return;}
  if(currentRoom||currentDmUser)goBackToList();
});

$("menuBtn").onclick=()=>$("sidePanel").classList.toggle('open');function closeMobileSidebar(){if(innerWidth<=760)$("sidePanel").classList.remove('open');}
function scrollBottom(){const x=$("messages");x.scrollTop=x.scrollHeight;}

document.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.add('hidden');});
sb.auth.getSession().then(({data})=>{if(data.session)boot(data.session.user);});
sb.auth.onAuthStateChange((_event,session)=>{if(session&&!currentUser)boot(session.user);});
