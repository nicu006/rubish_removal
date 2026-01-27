# 🔧 Troubleshooting - Probleme Mobile

## Problema: Nu pot trimite mesaje de pe telefon

### Verificări pas cu pas:

#### 1. Verifică că backend-ul rulează
```bash
curl http://192.168.1.7:3000/api/health
```
Ar trebui să vezi: `{"status":"ok","database":"connected"}`

#### 2. Verifică că frontend-ul rulează cu acces din rețea
```bash
cd public
python3 -m http.server 8000 --bind 0.0.0.0
```

#### 3. Verifică că telefonul este pe aceeași WiFi
- Telefonul și computerul trebuie să fie pe aceeași rețea WiFi
- Nu funcționează pe date mobile sau WiFi diferit

#### 4. Verifică consola browser pe telefon
- Chrome: Settings → More tools → Developer tools → Console
- Safari: Settings → Advanced → Web Inspector
- Caută erori roșii sau mesaje de debug

#### 5. Verifică firewall-ul pe Mac

**Oprește temporar firewall-ul pentru test:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Sau permite Node.js prin firewall:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

#### 6. Testează manual de pe telefon

Deschide în browser pe telefon:
- `http://192.168.1.7:3000/api/health` → ar trebui să vezi JSON
- `http://192.168.1.7:8000` → ar trebui să vezi site-ul

#### 7. Verifică IP-ul computerului

IP-ul poate să se schimbe când te reconectezi la WiFi:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Actualizează URL-ul în browser dacă IP-ul s-a schimbat.

### Mesaje de eroare comune:

**"Failed to fetch" sau "Network error"**
- Backend-ul nu este accesibil de pe telefon
- Verifică firewall-ul
- Verifică că backend-ul rulează pe `0.0.0.0`

**"CORS error"**
- Backend-ul are CORS activat, nu ar trebui să fie problema
- Verifică că folosești `http://` nu `https://`

**"Error saving message"**
- Verifică consola pentru detalii
- Verifică că backend-ul rulează
- Verifică că baza de date este conectată

### Soluție rapidă:

1. Oprește toate serverele
2. Pornește backend-ul: `cd backend && npm start`
3. Pornește frontend-ul: `cd public && python3 -m http.server 8000 --bind 0.0.0.0`
4. Verifică IP-ul: `ifconfig | grep "inet " | grep -v 127.0.0.1`
5. Accesează de pe telefon: `http://IP_TU:8000`
