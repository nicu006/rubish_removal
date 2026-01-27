# EcoClean Backend API

Backend Node.js/Express cu MySQL pentru site-ul EcoClean.

## Cerințe

- Node.js (v14 sau mai nou)
- MySQL (v5.7 sau mai nou) sau MariaDB (v10.3 sau mai nou)
- npm sau yarn

## Instalare

### 1. Instalează dependențele

```bash
cd backend
npm install
```

### 2. Configurează MySQL

**Opțiunea 1: MySQL instalat local**

1. Asigură-te că MySQL rulează:
   ```bash
   # Windows (ca serviciu)
   # Linux/Mac
   sudo systemctl start mysql
   # sau
   sudo service mysql start
   ```

2. Creează baza de date (opțional - backend-ul o creează automat):
   ```bash
   mysql -u root -p < database.sql
   ```

**Opțiunea 2: XAMPP/WAMP/MAMP**

1. Pornește MySQL din panoul de control
2. Deschide phpMyAdmin sau MySQL Workbench
3. Rulează scriptul `database.sql` sau lasă backend-ul să creeze baza de date automat

### 3. Configurează conexiunea la baza de date

Creează fișierul `.env` în folderul `backend`:

```bash
cp .env.example .env
```

Editează `.env` cu datele tale:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola_ta_mysql
DB_NAME=ecoclean_db
PORT=3000
```

**Dacă nu ai parolă pentru MySQL:**
```env
DB_PASSWORD=
```

### 4. Pornește serverul

**Modul development (cu auto-reload):**
```bash
npm run dev
```

**Modul production:**
```bash
npm start
```

Serverul va rula pe `http://localhost:3000`

## API Endpoints

### GET /api/messages
Obține toate mesajele, sortate după timestamp (cel mai recent primul).

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": 1706284800000,
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "123456789",
      "service": "residential",
      "message": "Need rubbish removal..."
    },
    "read": false
  }
]
```

### POST /api/messages
Creează un mesaj nou.

**Request Body:**
```json
{
  "timestamp": 1706284800000,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123456789",
    "service": "residential",
    "message": "Need rubbish removal..."
  },
  "read": false
}
```

**Response:**
```json
{
  "id": 1,
  "message": "Message saved successfully"
}
```

### PATCH /api/messages/:id
Actualizează statusul de citit al unui mesaj.

**Request Body:**
```json
{
  "read": true
}
```

**Response:**
```json
{
  "message": "Message updated successfully"
}
```

### DELETE /api/messages/:id
Șterge un mesaj.

**Response:**
```json
{
  "message": "Message deleted successfully"
}
```

### GET /api/health
Verifică statusul serverului și conexiunea la baza de date.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

## Configurare Frontend

După ce ai pornit backend-ul, actualizează `script.js` și `dashboard.html`:

În ambele fișiere, găsește:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Dacă rulezi backend-ul pe alt port sau alt host, schimbă URL-ul.

## Troubleshooting

### Eroare: "Cannot connect to MySQL"
- Verifică că MySQL rulează
- Verifică că datele din `.env` sunt corecte
- Verifică că utilizatorul MySQL are permisiuni

### Eroare: "Access denied for user"
- Verifică username-ul și parola în `.env`
- Încearcă să te conectezi manual: `mysql -u root -p`

### Eroare: "Database doesn't exist"
- Backend-ul ar trebui să creeze automat baza de date
- Sau rulează manual: `mysql -u root -p < database.sql`

### Port 3000 deja folosit
- Schimbă portul în `.env`: `PORT=3001`
- Sau oprește procesul care folosește portul 3000

### CORS errors în browser
- Backend-ul are CORS activat pentru toate originile
- Dacă ai probleme, verifică că rulezi frontend-ul de pe același domeniu sau adaugă origin-ul tău în `server.js`

## Structura Bazei de Date

Tabelul `messages`:
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `timestamp` - BIGINT (Unix timestamp în milisecunde)
- `name` - VARCHAR(100)
- `email` - VARCHAR(254)
- `phone` - VARCHAR(20) NULL
- `service` - VARCHAR(50)
- `message` - TEXT
- `read_status` - BOOLEAN (default FALSE)
- `created_at` - TIMESTAMP (auto-generat)

## Securitate

Pentru producție, recomandări:
1. Folosește variabile de mediu pentru date sensibile
2. Adaugă autentificare (JWT tokens)
3. Validează și sanitizează toate input-urile
4. Folosește HTTPS
5. Limitează rate-ul de request-uri (rate limiting)
6. Folosește prepared statements (deja implementat)

## Dezvoltare

Pentru development cu auto-reload:
```bash
npm run dev
```

Necesită `nodemon` instalat global sau ca dev dependency.
