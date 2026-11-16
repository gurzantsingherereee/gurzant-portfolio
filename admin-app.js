import { OWNER_EMAIL, DRIVE_FOLDER_KEY, getSupabase, configured, googleConfigured, isOwner, getLocalContent, setLocalContent, mergeContent, STORAGE_KEY, safeAssetUrl, sanitizeSlug } from './shared.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let content = getLocalContent();
let projectEdit = -1;
let selectedSlot = '';
let slots = [];
let user = null;
let driveToken = '';
let currentView = 'overview';
let changed = false;
let toastTimer;

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}
function status(msg) { $('#save-status').textContent = msg; }
function markChanged() { changed=true;status('Unsaved changes — save draft or publish.'); }
function setView(view) {
  currentView=view;
  $$('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));
  $$('.side-nav button').forEach(btn=>btn.classList.toggle('selected',btn.dataset.view===view));
  $('#crumb').textContent=view.toUpperCase();
  window.scrollTo({top:0,behavior:'instant'});
  if(view==='media') renderMediaList();
  if(view==='projects') renderProjects();
  if(view==='overview') refreshSummary();
}
function refreshSummary(){
  $('#stat-projects').textContent=String(4+content.projects.filter(p=>p.published!==false).length).padStart(2,'0');
  $('#stat-media').textContent=String(Object.values(content.media).filter(Boolean).length).padStart(2,'0');
  $('#stat-backend').textContent=configured?'CLOUD':'LOCAL';
  $('#backend-detail').textContent=configured?'Supabase configured':'Browser preview only';
  $('#asset-counter').textContent=Object.values(content.media).filter(Boolean).length+' / '+slots.length+' mapped';
  $('#added-counter').textContent=String(content.projects.length).padStart(2,'0')+' ENTRIES';
  $('#conn-indicator').textContent=configured?'SUPABASE CONFIGURED':'LOCAL PREVIEW';
  $('#supabase-status').textContent=configured?'CONFIGURED':'NOT CONNECTED';
  $('#drive-status').textContent=driveToken?'CONNECTED':(googleConfigured?'READY TO CONNECT':'NOT CONNECTED');
}
function populateContentForm(){
  $('#hero-role').value=content.heroRole||'';
  $('#hero-intro').value=content.heroIntro||'';
  $('#about-intro').value=content.aboutIntro||'';
  $('#contact-email').value=OWNER_EMAIL;
  (content.stats||[]).forEach((value,i)=>{const el=$('#stat-'+i);if(el)el.value=value;});
}
function captureContentForm(){
  content.heroRole=$('#hero-role').value.trim();
  content.heroIntro=$('#hero-intro').value.trim();
  content.aboutIntro=$('#about-intro').value.trim();
  content.contactEmail=OWNER_EMAIL;
  content.stats=[0,1,2,3].map(i=>$('#stat-'+i).value.trim());
}
function renderProjects(){
  const container=$('#project-list');container.replaceChildren();
  if(!content.projects.length){
    const empty=document.createElement('div');empty.className='empty-state';empty.textContent='No additional projects yet. Your four original case studies are preserved above. Use “+ New Project” to add the first one.';
    container.append(empty);
  }
  content.projects.forEach((project,index)=>{
    const row=document.createElement('div');row.className='project-row';
    const safe=safeAssetUrl(project.cover);
    if(safe){const img=document.createElement('img');img.alt=project.title;img.src=safe;row.append(img);}
    else {const ph=document.createElement('div');ph.className='project-placeholder';ph.textContent='NO IMAGE';row.append(ph);}
    const main=document.createElement('div');main.className='project-main';
    const title=document.createElement('strong');title.textContent=project.title||'Untitled';
    const subtitle=document.createElement('span');subtitle.textContent=[project.category,project.year,project.published===false?'HIDDEN':'VISIBLE'].filter(Boolean).join(' · ');
    main.append(title,subtitle);row.append(main);
    const actions=document.createElement('div');actions.className='project-actions';
    const action=(label,func)=>{let btn=document.createElement('button');btn.className='small-btn';btn.textContent=label;btn.addEventListener('click',func);return btn;};
    actions.append(action('↑',()=>moveProject(index,-1)),action('↓',()=>moveProject(index,1)),action('EDIT ↗',()=>editProject(index)));
    row.append(actions);container.append(row);
  });
  $('#added-counter').textContent=String(content.projects.length).padStart(2,'0')+' ENTRIES';
}
function moveProject(index,offset){
  const next=index+offset;if(next<0||next>=content.projects.length)return;
  [content.projects[index],content.projects[next]]=[content.projects[next],content.projects[index]];
  markChanged();renderProjects();
}
function editProject(index){
  projectEdit=index;
  const project=index>=0?content.projects[index]:{title:'',category:'',year:'2026',cover:'',intro:'',description:'',gallery:[],website:'',repository:'',role:'',deliverables:'',published:false};
  $('#project-editor').classList.remove('hidden');
  $('#editor-title').textContent=index<0?'CREATE NEW CASE STUDY':'EDIT CASE STUDY';
  $('#proj-title').value=project.title||'';
  $('#proj-category').value=project.category||'';
  $('#proj-year').value=project.year||'';
  $('#proj-cover').value=project.cover||'';
  $('#proj-intro').value=project.intro||'';
  $('#proj-description').value=project.description||'';
  $('#proj-gallery').value=(project.gallery||[]).join('\n');
  $('#proj-website').value=project.website||'';
  $('#proj-repository').value=project.repository||'';
  $('#proj-role').value=project.role||'';
  $('#proj-deliverables').value=project.deliverables||'';
  $('#proj-visible').checked=project.published!==false;
  $('#delete-project').classList.toggle('hidden',index<0);
  $('#project-editor').scrollIntoView({behavior:'smooth',block:'start'});
}
function closeEditor(){$('#project-editor').classList.add('hidden');projectEdit=-1;}
function saveProject(){
  const title=$('#proj-title').value.trim();
  if(!title){toast('Project title is required.');$('#proj-title').focus();return;}
  const old=projectEdit>=0?content.projects[projectEdit]:null;
  let slug=old?.slug||sanitizeSlug(title);
  if(!slug)slug='new-project';
  if(!old){const base=slug;let num=2;while(content.projects.some(p=>p.slug===slug)||['home','work','about','cv','contact','bestor','urban','noise','threed'].includes(slug)){slug=base+'-'+num++;}}
  const project={slug,title,category:$('#proj-category').value.trim(),year:$('#proj-year').value.trim(),cover:$('#proj-cover').value.trim(),intro:$('#proj-intro').value.trim(),description:$('#proj-description').value.trim(),gallery:$('#proj-gallery').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),website:$('#proj-website').value.trim(),repository:$('#proj-repository').value.trim(),role:$('#proj-role').value.trim(),deliverables:$('#proj-deliverables').value.trim(),published:$('#proj-visible').checked};
  if(project.cover&&!safeAssetUrl(project.cover)){toast('Use an HTTPS image URL or local images/ path.');return;}
  if(project.gallery.some(url=>!safeAssetUrl(url))){toast('Gallery images must be valid HTTPS image URLs.');return;}
  for (const field of ['website','repository']) {if(project[field] && !/^https:\/\/[^\s]+$/i.test(project[field])){toast('The '+field+' URL must start with https://');return;}}
  if(old)content.projects[projectEdit]=project;else content.projects.push(project);
  markChanged();renderProjects();refreshSummary();closeEditor();toast('Project staged. Publish changes when ready.');
}
function deleteProject(){
  if(projectEdit<0)return;
  if(!confirm('Delete this added project from your staged content? This does not remove Drive files.'))return;
  content.projects.splice(projectEdit,1);closeEditor();renderProjects();markChanged();refreshSummary();toast('Project removed from draft.');
}
function filteredSlots(){
  const search=$('#media-search').value.toLowerCase().trim();
  const filter=$('#media-filter').value;
  return slots.filter(x=>{
    const matchesFilter=filter==='all'||x.key===filter||x.key.startsWith(filter+'-');
    return matchesFilter && (!search||(x.key+' '+x.name+' '+x.original).toLowerCase().includes(search));
  });
}
function renderMediaList(){
  const wrap=$('#media-list');wrap.replaceChildren();
  filteredSlots().forEach(item=>{
    const btn=document.createElement('button');btn.className='media-item'+(item.key===selectedSlot?' active':'');
    const thumb=document.createElement('div');thumb.className='media-thumb';
    const src=safeAssetUrl(content.media[item.key]);
    if(src){const img=document.createElement('img');img.src=src;img.alt='';thumb.append(img);}
    else thumb.textContent='◇';
    const meta=document.createElement('div');
    const name=document.createElement('b');name.textContent=item.name;
    const description=document.createElement('small');description.textContent=src?'CUSTOM IMAGE':item.original||'NO IMAGE';
    meta.append(name,description);btn.append(thumb,meta);
    btn.addEventListener('click',()=>selectSlot(item.key));wrap.append(btn);
  });
  if(!filteredSlots().length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent='No slots match your search.';wrap.append(empty);}
  refreshSummary();
}
function selectSlot(key){
  selectedSlot=key;const slot=slots.find(x=>x.key===key);
  $('#media-current').textContent=slot?.name||key;
  const src=content.media[key]||'';
  $('#media-url').value=src;
  showMediaPreview(src);
  renderMediaList();
}
function showMediaPreview(url){
  const el=$('#media-preview');el.replaceChildren();const safe=safeAssetUrl(url);
  if(safe){const img=document.createElement('img');img.src=safe;img.alt='Selected media preview';img.onerror=()=>{el.textContent='PREVIEW UNAVAILABLE';};el.append(img);}else el.textContent='IMAGE NOT UPLOADED';
}
function applyMedia(){
  if(!selectedSlot){toast('Select an image slot first.');return;}
  const url=$('#media-url').value.trim();
  if(url&&!safeAssetUrl(url)){toast('Image URL must be HTTPS or an approved local image path.');return;}
  if(url)content.media[selectedSlot]=url;else delete content.media[selectedSlot];
  markChanged();renderMediaList();showMediaPreview(url);toast('Image slot staged for publishing.');
}
function stageDraft(){
  captureContentForm();content=mergeContent(content);
  // Preview is kept in this browser, never a public cloud draft.
  try{localStorage.setItem('gurzant_preview_draft',JSON.stringify(content));}
  catch(e){toast('Browser storage is full. Use Drive to host large images.');throw e;}
}
async function saveDraft(){
  try{
    stageDraft();
    if(!configured){setLocalContent(content);changed=false;status('Saved locally in this browser. Not published online.');toast('Draft saved locally. Connect Supabase to publish to a live site.');return;}
    await requireOwner();
    const sb=await getSupabase();const {error}=await sb.from('gurzant_site_content').upsert({key:'draft',payload:content,status:'draft',updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error)throw error;
    changed=false;status('Private cloud draft saved.');toast('Draft saved to Supabase.');
  }catch(e){toast('Save failed: '+e.message);}
}
async function publish(){
  try{
    stageDraft();
    if(!configured){setLocalContent(content);changed=false;status('Local preview published to this browser only. Cloud is not configured.');toast('Saved locally — NOT live on the internet. Connect Supabase for live publishing.');return;}
    if (Object.values(content.media).some(url => typeof url === 'string' && url.startsWith('data:'))) throw new Error('Some images exist only as local browser previews. Upload or host those images before publishing online.');
    await requireOwner();const sb=await getSupabase();
    const {error}=await sb.from('gurzant_site_content').upsert({key:'main',payload:content,status:'published',updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error)throw error;
    const {error:historyError}=await sb.from('gurzant_content_revisions').insert({snapshot:content,action:'publish',created_by:user.id});
    if(historyError)console.warn('Revision history not saved:',historyError);
    changed=false;status('Published to Supabase. Website now loads this content.');toast('Published successfully. Open your site to view changes.');
  }catch(e){toast('Publish failed: '+e.message);}
}
async function requireOwner(){
  if(!configured)return;
  const {data:{user:current},error}=await (await getSupabase()).auth.getUser();
  if(error)throw error;
  if(!isOwner(current))throw new Error('Access restricted to '+OWNER_EMAIL);
  user=current;
}
async function initializeSession(){
  if(!configured){$('#auth-screen').classList.add('hidden');$('#app').classList.remove('hidden');await loadContent();return;}
  const sb=await getSupabase();const {data:{user:current}}=await sb.auth.getUser();
  if(!isOwner(current)){
    if(current) await sb.auth.signOut();
    $('#auth-screen').classList.remove('hidden');$('#app').classList.add('hidden');
    return;
  }
  user=current;$('#auth-screen').classList.add('hidden');$('#app').classList.remove('hidden');$('#signout').classList.remove('hidden');await loadContent();
}
async function loadContent(){
  if(configured){
    try{
      const sb=await getSupabase();const {data,error}=await sb.from('gurzant_site_content').select('key,payload').in('key',['draft','main']);
      if(error)throw error;
      const draft=data?.find(x=>x.key==='draft');const main=data?.find(x=>x.key==='main');
      content=mergeContent(draft?.payload||main?.payload);
      status(draft?'Loaded your last private draft.':'Loaded published content.');
    }catch(e){status('Database connection issue. '+e.message);toast('Database not ready: '+e.message);}
  }else content=getLocalContent();
  populateContentForm();renderProjects();renderMediaList();refreshSummary();
}
async function login(){
  const sb=await getSupabase();
  if(!sb){toast('Supabase is not configured.');return;}
  try{
    const {error}=await sb.auth.signInWithOtp({email:OWNER_EMAIL,options:{emailRedirectTo:new URL('./admin.html',location.href).href,shouldCreateUser:true}});
    if(error)throw error;
    $('#auth-note').textContent='Check '+OWNER_EMAIL+' for your secure sign-in link.';
    toast('Login link requested. Check your authorized Gmail inbox.');
  }catch(e){toast('Could not send login link: '+e.message);}
}
async function checkDatabase(){
  if(!configured){toast('Add your personal Supabase project URL and publishable key in public/config.js.');return;}
  try{await requireOwner();const sb=await getSupabase();const {error}=await sb.from('gurzant_site_content').select('key').limit(1);if(error)throw error;toast('Supabase connection verified.');}
  catch(e){toast('Database check failed: '+e.message);}
}
function loadGIS(){return new Promise((resolve,reject)=>{
  if(window.google?.accounts?.oauth2){resolve();return;}
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('Google sign-in library could not be loaded.'));document.head.append(script);
});}
async function connectDrive(){
  if(!googleConfigured){toast('Add your Google OAuth Client ID to public/config.js first.');return;}
  try{
    await loadGIS();
    const response=await new Promise((resolve,reject)=>{
      const tokenClient=google.accounts.oauth2.initTokenClient({
        client_id:window.GURZANT_CONFIG.googleOAuthClientId,
        scope:'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback:r=>r.error?reject(new Error(r.error)):resolve(r)
      });tokenClient.requestAccessToken({prompt:'select_account'});
    });
    const token=response.access_token;
    const info=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+token}});
    if(!info.ok)throw new Error('Google account verification failed.');
    const person=await info.json();
    if((person.email||'').toLowerCase()!==OWNER_EMAIL){
      driveToken='';throw new Error('Wrong Google account. Only '+OWNER_EMAIL+' is allowed.');
    }
    driveToken=token;refreshSummary();toast('Connected to the authorized Google Drive account.');
  }catch(e){driveToken='';refreshSummary();toast('Drive connection blocked: '+e.message);}
}
async function getDriveFolder(){
  if(!driveToken)throw new Error('Connect your Google Drive first.');
  let id=localStorage.getItem(DRIVE_FOLDER_KEY);
  if(id)return id;
  const r=await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name',{method:'POST',headers:{Authorization:'Bearer '+driveToken,'Content-Type':'application/json'},body:JSON.stringify({name:'GURZANT Portfolio CMS Uploads',mimeType:'application/vnd.google-apps.folder'})});
  if(!r.ok)throw new Error('Could not create Drive folder: '+r.status);
  const data=await r.json();id=data.id;localStorage.setItem(DRIVE_FOLDER_KEY,id);return id;
}
async function uploadToDrive(file){
  const folderId=await getDriveFolder();
  const boundary='gurzant_'+Math.random().toString(36).slice(2);
  const mime=file.type||'image/jpeg';
  const metadata={name:(new Date().toISOString().slice(0,10)+'-'+file.name).slice(0,180),parents:[folderId]};
  const blob=new Blob([
    '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),
    '\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n',file,
    '\r\n--'+boundary+'--'
  ],{type:'multipart/related; boundary='+boundary});
  const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',{method:'POST',headers:{Authorization:'Bearer '+driveToken},body:blob});
  if(!r.ok)throw new Error('Drive upload failed: HTTP '+r.status+' '+(await r.text()).slice(0,180));
  const result=await r.json();
  const perm=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(result.id)+'/permissions',{method:'POST',headers:{Authorization:'Bearer '+driveToken,'Content-Type':'application/json'},body:JSON.stringify({type:'anyone',role:'reader'})});
  if(!perm.ok)throw new Error('Uploaded, but Google Drive rejected public image access. Change file sharing in Drive before publishing.');
  return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(result.id)+'&sz=w1600';
}
async function compactLocalImage(file){
  if(file.size>12*1024*1024)throw new Error('Local preview limit is 12MB per input. Use Google Drive for full resolution.');
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,1150/Math.max(bitmap.width,bitmap.height));
  const cvs=document.createElement('canvas');cvs.width=Math.max(1,Math.round(bitmap.width*scale));cvs.height=Math.max(1,Math.round(bitmap.height*scale));
  cvs.getContext('2d').drawImage(bitmap,0,0,cvs.width,cvs.height);bitmap.close?.();
  return cvs.toDataURL('image/jpeg',.72);
}
async function onMediaFile(file){
  if(!file)return;
  if(!selectedSlot){toast('Choose a media slot before uploading.');return;}
  if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){toast('Upload PNG, JPG, WebP or GIF images only.');return;}
  $('#media-status').textContent='Processing '+file.name+'…';
  try{
    const url=driveToken ? await uploadToDrive(file) : await compactLocalImage(file);
    $('#media-url').value=url;
    $('#media-status').textContent=driveToken?'Uploaded to Google Drive.':'Local browser preview prepared (not in Drive).';
    applyMedia();
  }catch(e){$('#media-status').textContent=e.message;toast(e.message);}
  finally{$('#media-file').value='';}
}
function exportContent(){
  captureContentForm();const out=mergeContent(content);
  const blob=new Blob([JSON.stringify({version:'2.0',owner:OWNER_EMAIL,exportedAt:new Date().toISOString(),content:out},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Gurzant-Portfolio-Backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  toast('Backup JSON downloaded.');
}
async function importContent(file){
  try{
    if(!file || file.size>8*1024*1024)throw new Error('Choose a JSON backup smaller than 8MB.');
    const parsed=JSON.parse(await file.text());
    if(parsed.owner && parsed.owner!==OWNER_EMAIL)throw new Error('Backup owner does not match your approved email.');
    const data=parsed.content||parsed;
    content=mergeContent(data);content.contactEmail=OWNER_EMAIL;
    populateContentForm();renderProjects();renderMediaList();refreshSummary();markChanged();toast('Backup imported as draft. It has not been published.');
  }catch(e){toast('Import failed: '+e.message);}finally{$('#import-content').value='';}
}

function bindUI(){
  $$('.side-nav button').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
  $$('[data-goto]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.goto)));
  $('#add-project').addEventListener('click',()=>editProject(-1));
  $('#save-project').addEventListener('click',saveProject);
  $('#close-project').addEventListener('click',closeEditor);
  $('#cancel-project').addEventListener('click',closeEditor);
  $('#delete-project').addEventListener('click',deleteProject);
  $('#content-save').addEventListener('click',()=>{captureContentForm();markChanged();toast('Website copy staged. Save or publish above.');});
  $('#save-draft').addEventListener('click',saveDraft);
  $('#publish').addEventListener('click',publish);
  $('#preview').addEventListener('click',()=>{
    try{stageDraft();window.open(new URL('./?preview=1',location.href).href,'_blank','noopener');}catch{}
  });
  $('#media-search').addEventListener('input',renderMediaList);
  $('#media-filter').addEventListener('change',renderMediaList);
  $('#apply-media').addEventListener('click',applyMedia);
  $('#remove-media').addEventListener('click',()=>{$('#media-url').value='';applyMedia();});
  $('#media-url').addEventListener('input',e=>showMediaPreview(e.target.value));
  $('#media-file').addEventListener('change',e=>onMediaFile(e.target.files?.[0]));
  $('#login').addEventListener('click',login);
  $('#signout').addEventListener('click',async()=>{if(configured)await (await getSupabase()).auth.signOut();location.reload();});
  $('#database-check').addEventListener('click',checkDatabase);
  $('#connect-drive').addEventListener('click',connectDrive);
  $('#export-content').addEventListener('click',exportContent);
  $('#import-content').addEventListener('change',e=>importContent(e.target.files?.[0]));
  window.addEventListener('beforeunload',e=>{if(changed){e.preventDefault();e.returnValue='';}});
}
(async function init(){
  bindUI();
  try{const r=await fetch(new URL('./media-slots.json',location.href));slots=await r.json();}catch(e){toast('Media inventory could not load.');}
  try{await initializeSession();}catch(e){toast('Startup error: '+e.message);console.error(e);}
})();