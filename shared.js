export const OWNER_EMAIL = 'gurzantsinghere@gmail.com';
export const STORAGE_KEY = 'gurzant_portfolio_content_v2';
export const DRIVE_FOLDER_KEY = 'gurzant_portfolio_drive_folder';
export const DEFAULT_CONTENT = {
  heroRole: 'Creative Lead · Brand Strategist',
  heroIntro: 'Creative direction, brand systems, packaging and e-commerce experiences. I connect strategy, visual storytelling and modern technology to build work that lasts.',
  aboutIntro: "I’m Gurzant Singh, a creative lead and brand strategist working across identity, packaging, e-commerce content and AI-assisted design systems. I build visual communication grounded in strategy, storytelling and practical execution.",
  contactEmail: OWNER_EMAIL,
  stats: ['2+', '50+', '5', '∞'],
  media: {},
  projects: [{
    slug: 'wavex',
    title: 'WAVEX — Designed for Every Adventure',
    category: 'Brand Identity · Packaging · Product Storytelling',
    year: '2026',
    cover: 'images/wavex-cover.svg',
    intro: 'An immersive product-world concept for WAVEX portable audio, built around freedom, outdoor discovery, and the idea that sound travels with you.',
    description: 'The project brings together product storytelling, premium packaging design, lifestyle art direction, and e-commerce presentation. The portable speaker is framed in cinematic outdoor environments and supported by distinctive black-and-orange retail packaging. The complete source project also contains an interactive WAVEX case-study website and a separate commerce-studio presentation. These assets are presented as a selected portfolio case study, not as a claim of commercial brand commissioning.',
    gallery: ['images/wavex-lifestyle.svg', 'images/wavex-packaging.svg', 'images/wavex-dieline.svg'],
    role: 'Creative direction / Packaging / Digital experience',
    deliverables: 'Product packaging, lifestyle renders, case-study website',
    website: '',
    repository: '',
    published: true
  }]
};

export const config = window.GURZANT_CONFIG || {};
export const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
export const googleConfigured = Boolean(config.googleOAuthClientId);
let clientPromise;
export async function getSupabase() {
  if (!configured) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2.75.1')
      .then(({ createClient }) => createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }));
  }
  return clientPromise;
}
export function mergeContent(data) {
  const val = data && typeof data === 'object' ? data : {};
  return {...DEFAULT_CONTENT, ...val, media: {...DEFAULT_CONTENT.media, ...(val.media || {})}, projects: [...DEFAULT_CONTENT.projects.filter(p=>!Array.isArray(val.projects)||!val.projects.some(q=>q.slug===p.slug)), ...(Array.isArray(val.projects)?val.projects:[])]};
}
export function getLocalContent() {
  try { return mergeContent(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch { return mergeContent(); }
}
export function setLocalContent(data) {
  const content = mergeContent(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  return content;
}
export function isOwner(user) {
  return Boolean(user && typeof user.email === 'string' && user.email.toLowerCase() === OWNER_EMAIL);
}
export async function fetchPublishedContent() {
  const supabase = await getSupabase();
  if (!supabase) return getLocalContent();
  const {data, error} = await supabase.from('gurzant_site_content').select('payload').eq('key', 'main').eq('status','published').maybeSingle();
  if (error) throw error;
  return mergeContent(data?.payload);
}
export function escapeHTML(raw) {
  return String(raw == null ? '' : raw).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function safeAssetUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  // Do not allow script URLs, embedded SVG/data HTML, or protocol-relative URLs.
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(trimmed)) return trimmed;
  if (/^images\/[a-zA-Z0-9_.\-/]+$/.test(trimmed)) return trimmed;
  return '';
}
export function sanitizeSlug(input) {
  return String(input||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
}