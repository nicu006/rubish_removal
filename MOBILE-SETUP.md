# 📱 Accesare de pe Telefon

Pentru a accesa site-ul de pe telefon și a trimite mesaje, trebuie să urmezi acești pași:

## 🔧 Setup pentru Acces Mobile

### Pasul 1: Găsește IP-ul Computerului

**Pe Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Pe Windows:**
```bash
ipconfig
# Caută "IPv4 Address" sub "Wireless LAN adapter" sau "Ethernet adapter"
```

**Pe Linux:**
```bash
hostname -I
```

Exemplu IP: `192.168.1.7`

### Pasul 2: Pornește Backend-ul

```bash
cd backend
npm start
```

Backend-ul trebuie să ruleze pe: `http://localhost:3000` (sau `http://192.168.1.7:3000`)

### Pasul 3: Pornește Frontend-ul cu IP-ul Local

**Opțiunea 1: Python (recomandat)**
```bash
cd public
python3 -m http.server 8000 --bind 0.0.0.0
```

**Opțiunea 2: Node.js**
```bash
cd public
npx http-server -p 8000 -a 0.0.0.0
```

**Opțiunea 3: Manual**
Dacă folosești un server care rulează doar pe localhost, trebuie să-l configurezi să asculte pe toate interfețele (0.0.0.0).

### Pasul 4: Accesează de pe Telefon

1. Asigură-te că telefonul este pe **aceeași rețea WiFi** ca computerul
2. Deschide browser-ul pe telefon
3. Accesează: `http://192.168.1.7:8000` (înlocuiește cu IP-ul tău)

### Pasul 5: Verifică Backend-ul

Backend-ul trebuie să fie accesibil de pe telefon. Testează:
```
http://192.168.1.7:3000/api/health
```

Dacă nu funcționează, verifică firewall-ul:

**Pe Mac:**
```bash
# Verifică firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Dacă este activat, permite Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

## 🔍 Troubleshooting

### Eroare: "Error saving message"

**Cauze posibile:**
1. Backend-ul nu rulează
2. Telefonul nu este pe aceeași rețea WiFi
3. Firewall-ul blochează conexiunea
4. IP-ul este greșit

**Soluții:**
1. Verifică că backend-ul rulează: `http://192.168.1.7:3000/api/health`
2. Verifică că telefonul este pe aceeași WiFi
3. Verifică firewall-ul
4. Verifică IP-ul computerului: `ifconfig` sau `ipconfig`

### Site-ul se încarcă dar formularul nu funcționează

Codul detectează automat IP-ul din URL. Dacă accesezi site-ul prin IP (ex: `http://192.168.1.7:8000`), va folosi automat același IP pentru backend.

### Backend-ul nu răspunde de pe telefon

1. Verifică că backend-ul rulează pe `0.0.0.0` sau pe IP-ul local
2. Verifică firewall-ul
3. Verifică că portul 3000 nu este blocat

## ✅ Verificare Rapidă

1. ✅ Backend rulează: `http://localhost:3000/api/health` → `{"status":"ok"}`
2. ✅ Frontend accesibil: `http://192.168.1.7:8000` → se încarcă site-ul
3. ✅ Backend accesibil de pe telefon: `http://192.168.1.7:3000/api/health` → `{"status":"ok"}`
4. ✅ Telefonul pe aceeași WiFi

Dacă toate sunt ✅, formularul ar trebui să funcționeze!
