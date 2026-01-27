# 🚀 Cum să pornești proiectul

## Pasul 1: Pornește Backend-ul

```bash
cd backend
npm install          # Doar prima dată
npm start
```

Backend-ul va rula pe: **http://localhost:3000**

## Pasul 2: Accesează site-ul

Backend-ul servește automat și frontend-ul pe același port!

- **Pe laptop**: http://localhost:3000
- **Pe telefon** (pe aceeași WiFi): http://192.168.1.7:3000
- **Dashboard admin**: http://localhost:3000/dashboard.html?key=4WatRWY0IDMy4WYlx2YvNWZ

**Notă:** Frontend-ul este servit din backend pentru a evita problemele CORS pe mobile (același origin = fără probleme).

## ⚠️ Important

1. **MySQL trebuie să ruleze** înainte de a porni backend-ul
2. **Backend-ul trebuie să ruleze** înainte de a folosi formularul
3. Verifică configurația MySQL în `backend/.env`

## 📚 Documentație

- Setup detaliat: `docs/BACKEND-SETUP.md`
- Documentație completă: `docs/README.md`
