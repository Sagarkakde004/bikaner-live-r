# Bikaner Branch — Production React App
**React + Vite + Firebase Auth + Realtime DB**

---

## 🗺️ Routes

| URL | Who uses it | Auth required |
|-----|-------------|---------------|
| `/scan?table=1` | Customers (QR scan) | No |
| `/menu?table=1` | Customers (ordering) | No |
| `/website` | Customers (brand page) | No |
| `/login` | Staff login | No |
| `/admin` | Owner / Manager / Waiter | Yes |
| `/kitchen` | Kitchen staff | Yes |

---

## 👤 Staff Roles & Access

| Role | Dashboard | Orders | Kitchen | Accounts | Menu |
|------|-----------|--------|---------|----------|------|
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **manager** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **kitchen** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **waiter** | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 🔐 First-Time Setup (Firebase Auth)

1. Go to **Firebase Console → bikanermenu project → Authentication**
2. Enable **Email/Password** sign-in method
3. Click **Add User** and create the owner account:
   - Email: `sagarkakade033@gmail.com` (or any email)
   - Password: your choice (min 6 chars)
4. Open the app → go to `/login` → sign in
5. The owner profile is created automatically in Realtime DB
6. From the **Accounts** panel, add kitchen/manager staff

---

## 📱 Admin Panel Features

### Dashboard
- Today's revenue, order count, active orders, avg order value
- 7-day revenue bar chart
- Top items sold today
- Live active orders summary

### All Orders
- Filter by status (New / Preparing / Ready / Done)
- Filter by date
- Search by customer name, phone, table number
- Expandable order detail with inline status updates

### Kitchen Display (embedded)
- Same real-time kitchen board as `/kitchen`
- Tab-based: New / Preparing / Ready / All Active
- Overdue alerts for orders waiting 10+ minutes

### Accounts
- List all staff members with role badges
- Add new staff (creates Firebase Auth account + DB profile)
- Change staff roles in real-time
- Remove staff from the panel

### Menu Items
- Add custom menu items to Firebase (extends the static menu)
- Edit / delete existing custom items
- Category grouping, veg/non-veg toggle

---

## 🚀 Deploy

### Netlify (Recommended — Free)
```bash
npm run build
# Drag & drop the /dist folder to netlify.com/drop
# OR:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```
Create `public/_redirects`:
```
/* /index.html 200
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to: dist
npm run build
firebase deploy
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 📧 Email Notifications

Edit `src/utils/notify.js`:
1. Sign up at **emailjs.com** (free — 200 emails/month)
2. Create Gmail service + template
3. Replace the three IDs in notify.js
4. Run `npm run build` again

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── LandingPage.jsx   — QR landing + game
│   ├── MenuPage.jsx      — Customer ordering
│   ├── KitchenPage.jsx   — Standalone kitchen display
│   ├── AdminPage.jsx     — Full admin dashboard
│   ├── WebsitePage.jsx   — Brand/website page
│   └── LoginPage.jsx     — Staff login
├── components/
│   ├── ProtectedRoute.jsx — Auth guard
│   ├── menu/
│   │   ├── MenuCard.jsx
│   │   ├── OrderFAB.jsx
│   │   └── OrderSheet.jsx
│   └── ui/index.jsx
├── context/
│   ├── AuthContext.jsx   — Firebase Auth + roles
│   ├── CartContext.jsx   — Cart state
│   └── ToastContext.jsx  — Notifications
├── data/menu.js          — Static menu items
└── utils/
    ├── firebase.js       — Firebase init (DB + Auth)
    └── notify.js         — Email notifications
```

---

## 🔧 Local Development

```bash
npm install
npm run dev
# App at http://localhost:5173
# Login at http://localhost:5173/login
# Admin at http://localhost:5173/admin
# Kitchen at http://localhost:5173/kitchen
```

---

## 📌 Firebase Console Setup Checklist

- [ ] Enable **Authentication → Email/Password**
- [ ] Create owner account in Authentication
- [ ] Set Realtime DB rules (start with test mode, then secure)
- [ ] Optionally add Firebase Hosting

### Recommended Realtime DB Rules
```json
{
  "rules": {
    "orders": {
      ".read": true,
      ".write": true
    },
    "staff": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "menu": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

