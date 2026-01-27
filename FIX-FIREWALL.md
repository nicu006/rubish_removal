# 🔥 Fix Firewall pentru Acces Mobile

## Problema: "Cannot connect to backend" de pe telefon

Backend-ul rulează dar telefonul nu poate să se conecteze din cauza firewall-ului Mac.

## Soluție Rapidă:

### Opțiunea 1: Oprește temporar firewall-ul (pentru test)

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**⚠️ ATENȚIE:** Oprește firewall-ul doar pentru test! Activează-l din nou după:

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### Opțiunea 2: Permite Node.js prin firewall (RECOMANDAT)

```bash
# Găsește calea către Node.js
which node

# Adaugă Node.js la firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# Permite Node.js prin firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node

# Verifică statusul
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

### Opțiunea 3: Permite portul 3000 prin firewall

```bash
# Permite conexiuni pe portul 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /System/Library/PrivateFrameworks/ApplePushService.framework/apsd
```

## Verificare:

După ce ai configurat firewall-ul:

1. **Testează de pe telefon:**
   ```
   http://192.168.1.7:3000/api/health
   ```
   Ar trebui să vezi: `{"status":"ok","database":"connected"}`

2. **Testează formularul:**
   - Accesează `http://192.168.1.7:8000` de pe telefon
   - Apasă butonul "Test Backend Connection"
   - Ar trebui să vezi "✅ SUCCESS"

## Dacă încă nu funcționează:

1. **Verifică că backend-ul rulează:**
   ```bash
   cd backend
   npm start
   ```

2. **Verifică că frontend-ul rulează cu acces din rețea:**
   ```bash
   cd public
   python3 -m http.server 8000 --bind 0.0.0.0
   ```

3. **Verifică IP-ul:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **Verifică că telefonul este pe aceeași WiFi**

## Soluție Alternativă: Folosește ngrok (pentru test)

Dacă firewall-ul este prea complicat, poți folosi ngrok pentru a expune backend-ul:

```bash
# Instalează ngrok
brew install ngrok

# Expune backend-ul
ngrok http 3000

# Folosește URL-ul public din ngrok în script.js
```
