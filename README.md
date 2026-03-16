# Gurzant Singh — Visual Designer Portfolio

## 🚀 Quick Start

### Step 1: Install Node.js
Download LTS from https://nodejs.org and install it.

### Step 2: Open in VS Code
1. Open VS Code
2. `File → Open Folder` → select this portfolio folder
3. Open Terminal: `Ctrl + `` ` ``

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start Dev Server

**Option A — Live Server (Easiest)**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Click "Open with Live Server"
4. Opens at http://127.0.0.1:5500

**Option B — Vite**
```bash
npm run dev
```
Opens at http://localhost:5173 (auto-reloads on save)

---

## 📝 Personalization Checklist

Find and replace these in `index.html`:

1. **Email** (line ~725)
   - Find: `gurzant@bestorindia.com`
   - Replace with: `gurzantsinghere@gmail.com`

2. **Social Links** (search for `href="#"`)
   - Behance: `https://www.behance.net/YOUR_USERNAME`
   - LinkedIn: `https://linkedin.com/in/YOUR_USERNAME`
   - Instagram: `https://instagram.com/YOUR_USERNAME`

3. **CV Download**
   - Place your CV as `cv.pdf` in the portfolio root
   - Update button: `onclick="window.open('cv.pdf')"`

4. **Contact Info** (update all instances)
   - Name: Gurzant Singh
   - Company: Bestor India Pvt. Ltd.
   - Location: Delhi, India
   - Role: Lead Visual Designer

---

## 🖼️ Image Setup

Add your images to these folders using **exact filenames**:

- `images/hero/gurzant-photo.jpg` — Profile photo
- `images/work/` — Cover images for projects
- `images/bestor/` — Bestor project images
- `images/urban/` — Urban Squad project images
- `images/noise/` — Noise Rebranding project images
- `images/threed/` — 3D Experiments images
- `images/threed/motion-reel.mp4` — Optional video (motion section)

**Image Specs for Best Performance:**
| Type | Format | Max Size | Dimensions |
|---|---|---|---|
| Covers | JPG | 200KB | 1920×1080px |
| Gallery | JPG | 150KB | 1200×900px |
| Squares | JPG | 150KB | 1000×1000px |
| Tall (9:16) | JPG | 150KB | 900×1600px |
| Logos | PNG | 100KB | 1200×900px |

Use https://squoosh.app for fast compression.

---

## 🌐 Deploy Online (Free)

### Netlify
1. Go to https://netlify.com
2. Sign up free
3. Drag your portfolio folder into Netlify
4. Live in 30 seconds

### GitHub Pages
```bash
git init
git add .
git commit -m "Portfolio launch"
# Push to GitHub, enable Pages in repo Settings
```

---

## 🔧 VS Code Shortcuts

| Action | Shortcut |
|---|---|
| Find & Replace | `Ctrl + H` |
| Search All Files | `Ctrl + Shift + F` |
| Format HTML | `Shift + Alt + F` |
| Toggle Terminal | `Ctrl + `` ` `` |

---

## ✅ Project Structure

```
Portfolio/
├── index.html
├── package.json
├── vite.config.js
├── cv.pdf (your CV file)
├── images/
│   ├── hero/
│   ├── work/
│   ├── bestor/
│   ├── urban/
│   ├── noise/
│   └── threed/
└── dist/ (created after `npm run build`)
```

---

**Ready? Start with Step 3 above!** 🔥
