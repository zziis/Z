const { createClient } = supabase;
const sb = createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = id => document.getElementById(id);
let signupMode = false;
let currentUser = null;
let currentRoom = null;
let messageChannel = null;
let roomsChannel = null;

function show(el, yes=true){ el.classList.toggle("hidden", !yes); }
function msg(text){ $("authMsg").textContent = text || ""; }

$("loginTab").onclick = () => { signupMode=false; updateAuth(); };
$("signupTab").onclick = () => { signupMode=true; updateAuth(); };

function updateAuth(){
  $("loginTab").classList.toggle("active", !signupMode);
  $("signupTab").classList.toggle("active", signupMode);
  show($("displayName"), signupMode);
  $("authSubmit").textContent = signupMode ? "إنشاء الحساب" : "دخول";
  msg("");
}

$("authForm").onsubmit = async e => {
  e.preventDefault(); msg("");
  const email = $("email").value.trim();
  const password = $("password").value;
  if(signupMode){
    const name = $("displayName").value.trim();
    if(!name) return msg("اكتب اسم المستخدم.");
    const {data,error} = await sb.auth.signUp({email,password,options:{data:{display_name:name}}});
    if(error) return msg(error.message);
    if(data.session) await boot(data.session.user);
    else msg("تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح بريدك ثم سجّل الدخول.");
  }else{
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) return msg(error.message);
    await boot(data.user);
  }
};

$("logoutBtn").onclick = async()=>{ await sb.auth.signOut(); location.reload(); };

async function boot(user){
  currentUser=user;
  $("userLabel").textContent = " • " + (user.user_metadata?.display_name || user.email);
  show($("authView"),false); show($("appView"),true);
  await ensureProfile();
  await loadRooms();
  subscribeRooms();
}

async function ensureProfile(){
  const name=currentUser.user_metadata?.display_name || currentUser.email.split("@")[0];
  await sb.from("profiles").upsert({id:currentUser.id,display_name:name},{onConflict:"id"});
}

async function loadRooms(){
  const {data,error}=await sb.from("rooms").select("*").order("created_at",{ascending:true});
  if(error){ $("roomsList").innerHTML="<p class='msg'>تعذر تحميل الرومات.</p>"; return; }
  renderRooms(data||[]);
}

function renderRooms(rooms){
  $("roomsList").innerHTML="";
  rooms.forEach(r=>{
    const b=document.createElement("button");
    b.className="roomItem"+(currentRoom?.id===r.id?" active":"");
    b.innerHTML=`<strong>🏠 ${escapeHtml(r.name)}</strong><small>${escapeHtml(r.description||"بدون وصف")}</small>`;
    b.onclick=()=>openRoom(r);
    $("roomsList").appendChild(b);
  });
  if(!rooms.length) $("roomsList").innerHTML="<p class='muted'>لا توجد رومات بعد.</p>";
}

function subscribeRooms(){
  roomsChannel=sb.channel("rooms-live")
    .on("postgres_changes",{event:"*",schema:"public",table:"rooms"},()=>loadRooms())
    .subscribe();
}

async function openRoom(room){
  currentRoom=room;
  $("roomTitle").textContent=room.name;
  $("roomDesc").textContent=room.description||"";
  $("messageInput").disabled=false; $("sendBtn").disabled=false;
  await loadMessages();
  renderActiveRoom();
  if(messageChannel) await sb.removeChannel(messageChannel);
  messageChannel=sb.channel("messages-"+room.id)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`room_id=eq.${room.id}`},
      payload=>appendMessage(payload.new,true))
    .subscribe();
}

function renderActiveRoom(){
  document.querySelectorAll(".roomItem").forEach(x=>x.classList.remove("active"));
  const buttons=[...document.querySelectorAll(".roomItem")];
  const i=buttons.findIndex(x=>x.textContent.includes(currentRoom.name));
  if(i>=0) buttons[i].classList.add("active");
}

async function loadMessages(){
  $("messages").innerHTML="<div class='empty'>جاري التحميل...</div>";
  const {data,error}=await sb.from("messages")
    .select("id,room_id,user_id,content,created_at,profiles(display_name)")
    .eq("room_id",currentRoom.id).order("created_at",{ascending:true}).limit(200);
  if(error){$("messages").innerHTML="<div class='empty'>تعذر تحميل الرسائل.</div>";return;}
  $("messages").innerHTML="";
  (data||[]).forEach(m=>appendMessage(m,false));
  scrollBottom();
}

function appendMessage(m,scroll){
  if($("messages").querySelector(".empty")) $("messages").innerHTML="";
  const d=document.createElement("div");
  d.className="bubble"+(m.user_id===currentUser.id?" me":"");
  const name=m.profiles?.display_name || (m.user_id===currentUser.id?"أنت":"مستخدم");
  d.innerHTML=`<b>${escapeHtml(name)}</b><span>${escapeHtml(m.content)}</span><small>${new Date(m.created_at).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}</small>`;
  $("messages").appendChild(d);
  if(scroll) scrollBottom();
}

$("messageForm").onsubmit=async e=>{
  e.preventDefault();
  if(!currentRoom)return;
  const content=$("messageInput").value.trim();
  if(!content)return;
  $("sendBtn").disabled=true;
  const {error}=await sb.from("messages").insert({room_id:currentRoom.id,user_id:currentUser.id,content});
  $("sendBtn").disabled=false;
  if(error) alert(error.message); else $("messageInput").value="";
};

$("newRoomBtn").onclick=()=>{show($("roomModal"),true);$("roomName").focus();};
$("cancelRoom").onclick=()=>show($("roomModal"),false);
$("createRoom").onclick=async()=>{
  $("roomMsg").textContent="";
  const name=$("roomName").value.trim(), description=$("roomDescription").value.trim();
  if(!name)return $("roomMsg").textContent="اكتب اسم الروم.";
  const {error}=await sb.from("rooms").insert({name,description,created_by:currentUser.id});
  if(error)return $("roomMsg").textContent=error.message;
  $("roomName").value="";$("roomDescription").value="";show($("roomModal"),false);
};

function scrollBottom(){const x=$("messages");x.scrollTop=x.scrollHeight;}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

sb.auth.getSession().then(({data})=>{if(data.session) boot(data.session.user);});
sb.auth.onAuthStateChange((_event,session)=>{ if(session && !currentUser) boot(session.user); });
