/* DOM */
const resultBox=document.getElementById('resultBox');const copyBtn=document.getElementById('copyBtn');const copyToast=document.getElementById('copyToast');
const receiverName=document.getElementById('receiverName');const receiverCode=document.getElementById('receiverCode');const deputyName=document.getElementById('deputyName');const deputyCode=document.getElementById('deputyCode');const receiverErr=document.getElementById('receiverErr');const deputyErr=document.getElementById('deputyErr');
const dropArea=document.getElementById('dropArea');const imgInput=document.getElementById('imgInput');
const rowsEl=document.getElementById('rows');const addRowBtn=document.getElementById('addRowBtn');const clearBtn=document.getElementById('clearBtn');
const drawer=document.getElementById('drawer');const drawerBackdrop=document.getElementById('drawerBackdrop');const drawerClose=document.getElementById('drawerClose');const drawerSave=document.getElementById('drawerSave');const dState=document.getElementById('dState');const dLoc=document.getElementById('dLoc');
const membersWrap=document.getElementById('members');const addMemberBtn=document.getElementById('addMember');
let editingIndex=null;let rows=[];

const stateBadgeClass=s=>s==='في الميدان'?'state-midan':s==='مشغول'?'state-busy':s==='مشغول - تدريب'?'state-train':s==='مشغول - اختبار'?'state-test':s==='خارج الخدمة'?'state-off':'';
window.addEventListener('load',()=>{});

/* Intro kill */
document.addEventListener('DOMContentLoaded', ()=>{
  const intro = document.getElementById('intro');
  if (!intro) return;
  const kill = ()=>{ try{ intro.remove(); }catch(e){ intro.style.display='none'; } };
  intro.addEventListener('animationend', kill, { once:true });
  intro.addEventListener('click', kill);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') kill(); });
  setTimeout(kill, 2800); // hard timeout
});

function showToast(){copyToast.style.opacity='1';setTimeout(()=>copyToast.style.opacity='0',1200)};copyBtn.addEventListener('click',()=>{navigator.clipboard.writeText(resultBox.value||'').then(showToast)});
function checkNames(){const rOk=receiverName.value.trim()&&receiverCode.value.trim();const dOk=deputyName.value.trim()&&deputyCode.value.trim();receiverErr.style.display=rOk?'none':'block';deputyErr.style.display=dOk?'none':'block';return rOk&&dOk;}

/* Code parsing */
const CODE_RE=/\b([A-Za-z\u0621-\u064A]{1,3}-?\d{1,4})\b/;
function splitNameAndCode(text){let name=(text||'').trim();let code='';const m=name.match(CODE_RE);if(m){code=normalizeCode(m[1]);name=name.replace(m[1],'').replace(/\s{2,}/g,' ').trim()}return{name,code};}
function normalizeCode(t){if(!t)return'';t=String(t).toUpperCase().replace(/[Oo]/g,'0').replace(/[Il]/g,'1').replace(/[\s_.,-]+/g,'');const mm=t.match(/^([A-Z\u0621-\u064A]{1,3})(\d{1,4})$/);return mm?(mm[1]+mm[2]):'';}

/* Build result excluding receiver from list but counting them */
function membersToDisplayExcludingReceiver(r, recName, recCode){
  const cleaned = r.members.filter(m=> (m.name||'').trim()!==recName || (m.code||'').trim()!==recCode );
  const txt = cleaned.map(m=>`${(m.name||'—')} ${(m.code||'').trim()}`.trim()).join(' + ');
  return {arr: cleaned, text: txt};
}
function buildResult(){
  if(!checkNames()) return;
  const recName=receiverName.value.trim(), recCode=receiverCode.value.trim();
  const inField=[], offField=[];
  rows.forEach(r=>{
    const {arr,text}=membersToDisplayExcludingReceiver(r, recName, recCode);
    if(!arr.length) return; // unit only receiver -> skip showing
    const locTxt=r.loc&&r.loc!=='— لا شيء —'?` | ( ${r.loc} )`:'';
    if(r.state==='خارج الخدمة') offField.push(text); else {const st=r.state!=='في الميدان'?` ( ${r.state} )`:''; inField.push(`${text}${st}${locTxt}`);}
  });
  const totalCount = rows.length + 1; // receiver counted
  const out=[
    '📌 استلام العمليات 📌','',
    `المستلم : ${recName} | ${recCode}`,'',
    `النائب : ${deputyName.value.trim()} | ${deputyCode.value.trim()}`,'',
    `عدد و اسماء الوحدات الاسعافيه في الميدان :{${totalCount}}`,
    ...(inField.length?inField:['—']), '',
    `خارج الخدمة : (${offField.length})`,
    ...(offField.length?offField:['—']), '',
    '🎙️ تم استلام العمليات و جاهزون للتعامل مع البلاغات','',
    'الملاحظات : تحديث'
  ].join('\n');
  resultBox.value=out;
}

/* Render rows */
function renderRows(){rowsEl.innerHTML='';rows.forEach((r,i)=>{const row=document.createElement('div');row.className='row-item';const s=document.createElement('div');s.className=`state-badge ${stateBadgeClass(r.state)}`;s.textContent=r.state;const c=document.createElement('div');c.className='chip';c.textContent=r.members.map(m=>m.code||'—').join(' + ');const n=document.createElement('div');n.className='chip';n.textContent=r.members.map(m=>m.name||'—').join(' + ');const l=document.createElement('div');l.className='chip';l.textContent=r.loc||'—';const e=document.createElement('button');e.className='btn';e.textContent='تعديل';e.onclick=()=>openDrawer(i);const d=document.createElement('button');d.className='btn del';d.textContent='حذف';d.onclick=()=>{rows.splice(i,1);renderRows();buildResult();};row.append(s,c,n,l,e,d);rowsEl.appendChild(row);});}

/* Drawer members */
function memberRow(nameVal='',codeVal=''){const wrap=document.createElement('div');wrap.className='member';const name=document.createElement('input');name.className='input m-name';name.placeholder='الاسم';name.value=nameVal;const code=document.createElement('input');code.className='input m-code';code.placeholder='الكود';code.value=codeVal;const rm=document.createElement('button');rm.className='btn remove';rm.textContent='حذف';rm.onclick=()=>{if(membersWrap.querySelectorAll('.member').length>1) wrap.remove();};name.onblur=()=>{if(!code.value){const sp=splitNameAndCode(name.value);name.value=sp.name;code.value=sp.code||code.value;}};code.onblur=()=>{code.value=normalizeCode(code.value)};wrap.append(name,code,rm);return wrap;}
function fillMembersUI(list){membersWrap.innerHTML='';(list&&list.length?list:[{name:'',code:''}]).forEach(m=>membersWrap.appendChild(memberRow(m.name,m.code)));}
addMemberBtn.addEventListener('click',()=>membersWrap.appendChild(memberRow()));

/* Add/Edit */
addRowBtn.addEventListener('click',()=>openDrawer(null));
function openDrawer(index){editingIndex=index;if(index==null){fillMembersUI([{name:'',code:''}]);dState.value='في الميدان';dLoc.value='— لا شيء —';}else{const r=rows[index];fillMembersUI(r.members);dState.value=r.state;dLoc.value=r.loc;}drawer.classList.add('open');drawerBackdrop.classList.add('show');}
function closeDrawer(){drawer.classList.remove('open');drawerBackdrop.classList.remove('show');}
drawerClose.addEventListener('click',closeDrawer);drawerBackdrop.addEventListener('click',closeDrawer);
drawerSave.addEventListener('click',()=>{const members=[...membersWrap.querySelectorAll('.member')].map(el=>{const name=el.querySelector('.m-name').value;let code=el.querySelector('.m-code').value;const sp=splitNameAndCode(name);const finalName=sp.name||name;if(!code) code=sp.code||'';code=normalizeCode(code);return{name:finalName,code};}).filter(m=>m.name||m.code);if(members.length===0) members.push({name:'',code:''});const r={members,state:dState.value,loc:dLoc.value};if(editingIndex==null) rows.push(r);else rows[editingIndex]=r;closeDrawer();renderRows();buildResult();});

/* Clear */
clearBtn.addEventListener('click',()=>{if(!confirm('سيتم مسح جميع البيانات والنتيجة. هل أنت متأكد؟')) return;receiverName.value='';receiverCode.value='';deputyName.value='';deputyCode.value='';rows=[];renderRows();resultBox.value='';});


/* ===== HUD for OCR progress ===== */
function setOCRHUD(show, pct){
  const hud = document.getElementById('ocrHud');
  const scan = document.querySelector('#dropArea .scanner');
  const dots = document.querySelector('#dropArea .dots');
  if (!hud || !scan || !dots) return;
  if (show){
    hud.style.display='block'; scan.style.display='block'; dots.style.display='flex';
    hud.textContent = (pct!=null? (Math.max(0,Math.min(100, Math.round(pct))) + '%') : hud.textContent);
  }else{
    hud.style.display='none'; scan.style.display='none'; dots.style.display='none';
  }
}

/* OCR */
function handleFiles(files){const f=files?.[0];if(f) runOCR(f);}imgInput.addEventListener('change',e=>handleFiles(e.target.files));
window.addEventListener('paste',e=>{const items=e.clipboardData?.items||[];for(const it of items){if(it.type?.startsWith('image/')){handleFiles([it.getAsFile()]);e.preventDefault();break;}}});
['dragenter','dragover'].forEach(ev=>{dropArea.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dropArea.classList.add('dragging');},false)});
['dragleave','drop'].forEach(ev=>{dropArea.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dropArea.classList.remove('dragging');},false)});
dropArea.addEventListener('drop',e=>handleFiles(e.dataTransfer?.files));
async function runOCR(file){dropArea.textContent='... جاري استخراج النص ...'; setOCRHUD(true, 0);const mode=document.querySelector('input[name="mergeMode"]:checked')?.value||'replace';try{const pre=await preprocessImage(file);const {data}=await Tesseract.recognize(pre,'ara+eng',{logger:m=>{if(m.status==='recognizing text'){ const p=Math.round(m.progress*100); dropArea.textContent=`... جاري الاستخراج ${p}%`; setOCRHUD(true, p);} }});const lines=(data.text||'').split('\n').map(cleanLine).filter(Boolean);const parsed=lines.map(parseLine).filter(p=>p && p.members && p.members.length);if(mode==='replace') rows=parsed;else rows=rows.concat(parsed);renderRows();buildResult();}catch(e){console.error(e);alert('تعذّر استخراج النص. جرّب صورة أوضح.');}finally{dropArea.innerHTML=`اسحب وأفلت صورة هنا، أو الصقها بـ <b>Ctrl+V</b>`;}}
function cleanLine(s){s=s.replace(/[\u200E\u200F\u202A-\u202E]/g,'');s=s.replace(/[“”\"';:،؛]/g,' ').replace(/\s+/g,' ').trim();return s;}
function parseLine(line){const sp=splitNameAndCode(line);return{members:[{name:sp.name,code:normalizeCode(sp.code)}],state:'في الميدان',loc:'— لا شيء —'};}
function preprocessImage(file){return new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height,maxW=1600;if(w>maxW){h=Math.round(h*(maxW/w));w=maxW;}const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);const data=ctx.getImageData(0,0,w,h);const d=data.data;for(let i=0;i<d.length;i+=4){const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];d[i]=d[i+1]=d[i+2]=g;}ctx.putImageData(data,0,0);c.toBlob(b=>{URL.revokeObjectURL(url);resolve(b);},'image/png',0.95);};img.onerror=e=>{URL.revokeObjectURL(url);reject(e);};img.src=url;});}
[receiverName,receiverCode,deputyName,deputyCode].forEach(el=>el.addEventListener('input',buildResult));
