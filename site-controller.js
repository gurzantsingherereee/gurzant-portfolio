import { fetchPublishedContent, DEFAULT_CONTENT, mergeContent, safeAssetUrl, configured, getSupabase, isOwner } from './shared.js';

function text(selector, value) {
  const el = document.querySelector(selector);
  if (el && value != null && String(value).trim()) el.textContent = value;
}
function applyAssets(media = {}) {
  Object.entries(media).forEach(([key, url]) => {
    const safe = safeAssetUrl(url);
    if (!safe) return;
    document.querySelectorAll('[data-img]').forEach(slot => {
      if (slot.getAttribute('data-img') !== key) return;
      const imgs = [...slot.querySelectorAll('img')];
      if (!imgs.length) {
        const img = document.createElement('img');
        img.alt = key;
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
        slot.prepend(img);
        imgs.push(img);
      }
      imgs.forEach(img => {
        img.style.display = 'block';
        img.style.opacity = '1';
        img.src = safe;
        img.onerror = () => { img.style.display='none'; };
      });
    });
  });
}
function projectCard(proj) {
  const item = document.createElement('div');
  item.className='work-item';
  item.setAttribute('data-hover','VIEW');
  item.addEventListener('click',() => window.goPage('custom-' + proj.slug));
  const imgWrap = document.createElement('div'); imgWrap.className='work-item-img';
  const bg = document.createElement('div'); bg.className='work-item-bg';
  bg.style.cssText='position:relative;overflow:hidden;height:100%';
  const url=safeAssetUrl(proj.cover);
  if (url) {
    const img=document.createElement('img'); img.src=url; img.alt=proj.title || 'Project';
    img.loading='lazy'; img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; bg.append(img);
  } else { const placeholder=document.createElement('div');placeholder.className='work-bg-txt';placeholder.textContent=(proj.title||'PROJECT').slice(0,18);bg.append(placeholder); }
  imgWrap.append(bg);
  const ov=document.createElement('div');ov.className='work-overlay';imgWrap.append(ov);
  const info=document.createElement('div');info.className='work-info';
  [['work-arrow','↗'],['work-tag',proj.category||'Selected Work'],['work-title',proj.title||'Untitled'],['work-year',proj.year||'2026']].forEach(([cls,value])=>{
    const el=document.createElement('div');el.className=cls;el.textContent=value;info.append(el);
  });
  item.append(imgWrap,info);return item;
}
function projectPage(proj) {
  const page=document.createElement('div');page.className='page';page.id='pg-custom-'+proj.slug;
  page.innerHTML=`<section class="section" style="padding-top:145px"><div class="container">
    <div class="sec-label" data-num="NEW">CASE STUDY</div>
    <button class="btn btn-ghost" type="button" data-back style="margin-bottom:40px">← All Projects</button>
    <h1 class="big-title" data-title style="max-width:950px;line-height:0.95"></h1>
    <div class="case-subtitle" data-category style="margin:28px 0;color:var(--y);font-family:var(--f-mono)"></div>
    <div data-meta style="font-size:13px;letter-spacing:.05em;color:var(--w60);line-height:1.9;margin:16px 0"></div>
    <div data-links style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 36px"></div>
    <p data-intro style="font-size:19px;line-height:1.8;max-width:700px;color:var(--w60)"></p>
    <div data-hero style="margin-top:65px;min-height:380px;background:var(--bg2);position:relative;overflow:hidden"></div>
    <div data-description style="white-space:pre-wrap;max-width:770px;margin:72px 0;font-size:18px;line-height:1.8;color:var(--w60)"></div>
    <div data-gallery style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px"></div>
  </div></section><div class="divider"></div><footer class="site-footer"><div class="footer-l">GS<em>.</em></div><div class="footer-c">© 2026 Gurzant Singh</div><div class="footer-r"><a href="mailto:gurzantsinghere@gmail.com">CONTACT ↗</a></div></footer>`;
  page.querySelector('[data-back]').addEventListener('click',()=>window.goPage('work'));
  page.querySelector('[data-title]').textContent=(proj.title||'UNTITLED PROJECT').toUpperCase();
  page.querySelector('[data-category]').textContent=[proj.category,proj.year].filter(Boolean).join(' · ');
  page.querySelector('[data-meta]').textContent=[proj.role,proj.deliverables].filter(Boolean).join('  /  ');
  [['website','VIEW LIVE PROJECT ↗'],['repository','VIEW SOURCE ↗']].forEach(([key,label]) => {
    const href=proj[key];
    if(!href || !/^https:\/\/[^\s]+$/i.test(href))return;
    const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-ghost';a.textContent=label;
    page.querySelector('[data-links]').append(a);
  });
  page.querySelector('[data-intro]').textContent=proj.intro||'';
  page.querySelector('[data-description]').textContent=proj.description||'';
  const safe=safeAssetUrl(proj.cover);
  if (safe) {
    const cover=document.createElement('img');cover.src=safe;cover.alt=proj.title||'Project cover';cover.style.cssText='width:100%;max-height:660px;object-fit:cover;display:block';
    page.querySelector('[data-hero]').append(cover);
  }
  (proj.gallery||[]).forEach(src=>{
    const safe=safeAssetUrl(src); if (!safe) return;
    const frame=document.createElement('div');frame.style.cssText='background:var(--bg2);aspect-ratio:4/3;overflow:hidden';
    const img=document.createElement('img');img.src=safe;img.alt=proj.title||'Project image';img.loading='lazy';img.style.cssText='width:100%;height:100%;object-fit:cover';
    frame.append(img);page.querySelector('[data-gallery]').append(frame);
  });
  return page;
}
function applyProjects(projects=[]) {
  const masonry=document.querySelector('#pg-work .work-masonry');
  if (!masonry) return;
  document.querySelectorAll('[data-dynamic-project]').forEach(el=>el.remove());
  projects.filter(proj=>proj && proj.published!==false && /^[a-z0-9-]+$/.test(proj.slug||'')).forEach(proj=>{
    if (document.getElementById('pg-'+proj.slug) || document.getElementById('pg-custom-'+proj.slug)) return;
    const card=projectCard(proj);card.setAttribute('data-dynamic-project','1');
    const page=projectPage(proj);page.setAttribute('data-dynamic-project','1');
    masonry.append(card);document.body.append(page);
  });
}
function applyContent(data) {
  const c=mergeContent(data);
  text('#pg-home .hero-badge',c.heroRole);
  text('#pg-home .hero-desc',c.heroIntro);
  text('#pg-about .about-body',c.aboutIntro);
  document.querySelectorAll('.c-val, .cv-contact-row').forEach(el=>{
    if ((el.textContent||'').includes('gurzantsinghere@gmail.com')) el.textContent=el.classList.contains('cv-contact-row') ? '✉ '+c.contactEmail : c.contactEmail;
  });
  document.querySelectorAll('#pg-home .stat-n').forEach((el,i)=>{if(c.stats?.[i])el.textContent=c.stats[i]});
  applyProjects(c.projects);
  applyAssets(c.media);
  const btn=document.querySelector('#pg-contact .contact-form .btn');
  if(btn && !btn.dataset.contactEnabled){
    btn.dataset.contactEnabled='1';
    btn.addEventListener('click',()=>{
      const get = id => document.getElementById(id)?.value?.trim()||'';
      const subject=encodeURIComponent('[Portfolio] '+get('f-sub'));
      const body=encodeURIComponent(`Name: ${get('f-name')}\nEmail: ${get('f-email')}\n\n${get('f-msg')}`);
      window.location.href=`mailto:${c.contactEmail}?subject=${subject}&body=${body}`;
    });
  }
}

window.addEventListener('load', async () => {
  try {
    // Allow original portfolio's onload image injector to run first.
    await new Promise(resolve=>setTimeout(resolve,40));
    let content=await fetchPublishedContent();
    if (configured && new URLSearchParams(location.search).get('preview')==='1'){
      const sb=await getSupabase(); const {data:{user}}=await sb.auth.getUser();
      if (isOwner(user)) {
        try {const draft=JSON.parse(localStorage.getItem('gurzant_preview_draft')||'null');if(draft)content=draft;}catch{}
      }
    }
    applyContent(content);
  } catch(e){
    console.warn('Portfolio dynamic content unavailable; showing original master site:',e);
  }
});