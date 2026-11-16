# GURZANT — Portfolio Master / Phase 1

This is a faithful copy of the uploaded `gurzant-portfolio-master.zip` website, plus a separate CMS/admin interface. The original website markup, CSS, animation scripts and case-study structure are retained. New content is appended through `site-controller.js`, not through edits to the original sections.

**Owner account ONLY:** `gurzantsinghere@gmail.com`. Do not use office, Fifth Signal or Apoorva accounts.

## Files

- `index.html`: Original website — Home, Work, About, CV, Contact and four original case studies.
- `admin.html`: Separate Control Studio dashboard.
- `site-controller.js`: Safe additions to the original site for managed content.
- `admin-app.js`, `shared.js`, `admin.css`: Dashboard, local drafts, future cloud sync.
- `public/media-slots.json`: Inventory of existing image slots.
- `public/config.js`: Public OAuth/client configuration (currently intentionally blank).
- `supabase/schema.sql`: Isolated, owner-only CMS tables. For a **new verified personal Supabase project only**.
- `cv.pdf` and `public/cv.pdf`: Existing CV from source.

## Run locally

The prebuilt static files in `webroot/` **must be served through HTTP**, not opened as `file://`, because they use JavaScript ES modules and a local media inventory.

```bash
cd webroot
python -m http.server 5173
```

Then visit `http://localhost:5173/` for the website and `http://localhost:5173/admin.html` for the dashboard.

`npm run dev` and `npm run build` are also available once dependencies are installed.

## What works without cloud credentials

- Original portfolio navigation, responsive pages, original animations and existing case studies.
- Add, reorder, hide, edit and delete **new** projects; attach live project and GitHub links, role, deliverables, cover and case-study gallery. New projects default to unpublished.
- Map media slots, edit hero/about/contact copy and homepage counters.
- Save JSON backup, import backup, save browser-local drafts, preview in the same browser.
- Uploaded preview images are local to that browser; they are not uploaded to any cloud service.

Without Supabase, "Publish" means **local browser preview only**; it will NOT update a public website.

## Cloud integration — NOT LIVE YET

1. Sign into a dedicated Supabase account/project owned by `gurzantsinghere@gmail.com`.
2. Apply `supabase/schema.sql` **only to that verified portfolio project**.
3. Insert the project URL and public publishable key (NEVER secret/service-role) in `public/config.js`.
4. Enable email OTP/magic link auth for the approved owner and allow the deployed admin redirect URL in Supabase Auth.
5. Create a Google OAuth web client in a Cloud project controlled by the approved Gmail. Set only the OAuth client ID in `public/config.js`, configure authorized JavaScript origins and use Google's identity flow.
6. The dashboard checks the Google user email equals the approved account. Uploads from its OAuth client use `drive.file` to create a separate folder called `GURZANT Portfolio CMS Uploads`; this does **not** edit pre-existing files.
7. The previously verified existing media folder remains at https://drive.google.com/drive/folders/1ahJ3HghZYckihI9DE87YzJCR4tMHx3pm . Its already-existing images remain private and unchanged.
8. Google Drive can act as an owner archive, but image hotlinks/thumbnail URLs are not a guaranteed reliable CDN. Before going live, verify that the published images load anonymously, or serve approved images through an appropriate dedicated image delivery endpoint.
9. Cloudflare deploy must use the personally authorized `gurzantsinghere@gmail.com` account. No such connected Cloudflare account was available during this build. **Do not deploy through office or Fifth Signal Cloudflare.**

## Database isolation

Tables are named `gurzant_site_content` and `gurzant_content_revisions` and use RLS restricted to verified logged-in owner; anonymous clients can only read rows with `status='published'`. Nothing is configured to connect to the existing Apoorva project.

## Original project preservation

The ZIP source supplied by the user did not contain its referenced image directory. All reference paths and slots remain intact. The admin can add images once they are available. No original project was deleted or overwritten, and no cloud infrastructure has been changed.

## GitHub upgrade branch

This source is proposed for `upgrade/portfolio-control-studio-v2` in `gurzantsingherereee/gurzant-portfolio`. Its default `master` and GitHub Pages deployment remain unchanged until the PR is reviewed and merged. Extra projects can be created as unpublished drafts in the dashboard before their URL or content is finalized.

## Added: WAVEX / MUTANTISHERE

The separate user-supplied MUTANTISHERE project is represented in this portfolio as WAVEX. It includes responsive image assets derived from its original renders and packaging; source images and original ZIP remain unchanged. The WAVEX entry is editable in the dashboard. No deployment or write to third-party cloud projects is implied.