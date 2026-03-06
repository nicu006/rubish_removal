# Setup Backend Local - EcoClean

Acest ghid te va ajuta să configurezi backend-ul Node.js/Express cu MySQL pentru site-ul EcoClean.

## ✅ Avantaje

- ✅ **Fără conturi externe** - totul rulează local pe computerul tău
- ✅ **Bază de date reală** - MySQL/PostgreSQL, nu localStorage
- ✅ **Control complet** - ai control total asupra datelor
- ✅ **Gratuit** - nu necesită servicii cloud plătite

## 📋 Cerințe

1. **Node.js** (v14 sau mai nou)
   - Descarcă de la: https://nodejs.org/
   - Verifică instalarea: `node --version`

2. **MySQL** sau **MariaDB**
   - **Opțiunea 1**: MySQL Server
     - Windows: https://dev.mysql.com/downloads/installer/
     - Mac: `brew install mysql`
     - Linux: `sudo apt-get install mysql-server`
   
   - **Opțiunea 2**: XAMPP/WAMP/MAMP (mai ușor pentru început)
     - XAMPP: https://www.apachefriends.org/
     - WAMP: https://www.wampserver.com/
     - MAMP: https://www.mamp.info/

## 🚀 Instalare Rapidă

### Pasul 1: Instalează dependențele

```bash
cd backend
npm install
```

### Pasul 2: Configurează MySQL

**Dacă ai MySQL instalat:**

1. Pornește MySQL:
   ```bash
   # Windows (ca serviciu)
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Creează baza de date (opțional - backend-ul o creează automat):
   ```bash
   mysql -u root -p < database.sql
   ```

**Dacă folosești XAMPP/WAMP/MAMP:**

1. Pornește MySQL din panoul de control
2. Deschide phpMyAdmin (de obicei: http://localhost/phpmyadmin)
3. Backend-ul va crea automat baza de date când pornește

### Pasul 3: Configurează conexiunea

Creează fișierul `.env` în folderul `backend`:

```bash
cd backend
cp .env.example .env
```

Editează `.env` cu datele tale MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola_ta_mysql
DB_NAME=ecoclean_db
PORT=3000
```

**Dacă nu ai parolă pentru MySQL (instalare nouă):**
```env
DB_PASSWORD=
```

**Dacă folosești XAMPP (de obicei fără parolă):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecoclean_db
PORT=3000
```

### Pasul 4: Pornește backend-ul

```bash
npm start
```

Ar trebui să vezi:
```
✅ Database connected successfully
✅ Table created/verified successfully
🚀 Server running on http://localhost:3000
```

### Pasul 5: Testează

1. Deschide browser-ul la: http://localhost:3000/api/health
2. Ar trebui să vezi: `{"status":"ok","database":"connected"}`

## 🎯 Utilizare

### Pornește backend-ul

În folderul `backend`:
```bash
npm start
```

### Pornește frontend-ul

1. Deschide `index.html` în browser
2. Sau folosește un server local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server -p 8000
   ```

3. Accesează: http://localhost:8000

## 🔧 Troubleshooting

### Eroare: "Cannot connect to MySQL"

**Soluție:**
1. Verifică că MySQL rulează:
   ```bash
   # Windows
   services.msc -> MySQL
   
   # Linux/Mac
   sudo systemctl status mysql
   ```

2. Verifică datele din `.env`:
   - `DB_HOST` = localhost
   - `DB_USER` = root (sau utilizatorul tău)
   - `DB_PASSWORD` = parola ta (sau gol dacă nu ai)

3. Testează conexiunea manual:
   ```bash
   mysql -u root -p
   ```

### Eroare: "Access denied for user"

**Soluție:**
1. Verifică username-ul și parola în `.env`
2. Încearcă să te conectezi manual:
   ```bash
   mysql -u root -p
   ```
3. Dacă nu funcționează, resetează parola MySQL sau creează un utilizator nou

### Eroare: "Port 3000 already in use"

**Soluție:**
1. Schimbă portul în `.env`:
   ```env
   PORT=3001
   ```

2. Actualizează URL-ul API în `public/js/config.js` dacă e nevoie (implicit folosește același origin).

### Eroare: "CORS" în browser

**Soluție:**
Backend-ul are CORS activat pentru toate originile. Dacă ai probleme:
1. Verifică că rulezi frontend-ul de pe același domeniu
2. Sau folosește un server local pentru frontend (nu `file://`)

### Backend nu pornește

**Soluție:**
1. Verifică că ai instalat dependențele: `npm install`
2. Verifică că ai Node.js instalat: `node --version`
3. Verifică erorile în consolă

## 📁 Structura Proiectului

```
rubish removal/
├── backend/
│   ├── server.js          # Server Express
│   ├── package.json       # Dependencies
│   ├── database.sql       # Script SQL
│   ├── .env.example       # Template configurare
│   └── README.md          # Documentație backend
├── public/
│   ├── index.html         # Pagina principală
│   ├── js/                # JavaScript modular
│   ├── styles.css         # Stiluri
│   └── images/            # Imagini
```

## 🔒 Securitate

Pentru producție:
1. Nu expune backend-ul direct pe internet fără HTTPS
2. Adaugă autentificare (JWT tokens)
3. Folosește variabile de mediu pentru date sensibile
4. Limitează rate-ul de request-uri
5. Validează și sanitizează toate input-urile

## 📚 Resurse

- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js Documentation](https://nodejs.org/docs/)

## ✅ Verificare Finală

După setup, verifică:

1. ✅ Backend rulează: http://localhost:3000/api/health
2. ✅ Baza de date există: verifică în MySQL/phpMyAdmin
3. ✅ Formularul funcționează: trimite un mesaj de test

**Gata!** Site-ul tău funcționează acum cu o bază de date reală, fără conturi externe! 🎉
