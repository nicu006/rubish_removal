# EcoClean API - Test script
# Ruleaza dupa ce backend-ul ruleaza: cd backend; npm start
# Usage: .\test-api.ps1

$base = "http://localhost:3000"

# Check if backend returns new API shape (pagination)
try {
    $check = Invoke-RestMethod -Uri "$base/api/messages" -Method Get -ErrorAction Stop
    if ($null -eq $check.PSObject.Properties["pagination"]) {
        Write-Host "ATENTIE: Backend-ul returnat nu are paginare. Reporneste backend-ul (Ctrl+C apoi npm start in backend/) si ruleaza din nou acest script.`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Eroare: Backend-ul nu raspunde la $base. Porneste-l cu: cd backend; npm start`n" -ForegroundColor Red
    exit 1
}
$passed = 0
$failed = 0

function Test-Name { param($name) Write-Host "`n=== $name ===" -ForegroundColor Cyan }
function Ok { param($msg) Write-Host "PASS: $msg" -ForegroundColor Green; $script:passed++ }
function Fail { param($msg) Write-Host "FAIL: $msg" -ForegroundColor Red; $script:failed++ }

# 1. Health
Test-Name "1. GET /api/health"
try {
    $h = Invoke-RestMethod -Uri "$base/api/health" -Method Get -ErrorAction Stop
    if ($h.status -eq "ok" -and $h.database -eq "connected") { Ok "health ok, database connected" }
    else { Fail "unexpected response" }
    if ($null -ne $h.PSObject.Properties["emailConfigured"]) { Ok "emailConfigured = $($h.emailConfigured)" }
} catch { Fail $_.Exception.Message }

# 2. GET messages (pagination)
Test-Name "2. GET /api/messages (pagination shape)"
try {
    $r = Invoke-RestMethod -Uri "$base/api/messages" -Method Get
    if ($r.PSObject.Properties["messages"] -and $r.PSObject.Properties["pagination"]) {
        Ok "response has messages and pagination"
    } else { Fail "expected { messages, pagination }" }
} catch { Fail $_.Exception.Message }

# 3. GET messages ?page=1&limit=2
Test-Name "3. GET /api/messages?page=1&limit=2"
try {
    $r = Invoke-RestMethod -Uri "$base/api/messages?page=1&limit=2" -Method Get
    $n = if ($r.messages) { $r.messages.Count } else { 0 }
    if ($r.pagination.limit -eq 2 -and $n -le 2) { Ok "limit=2, got $n messages" }
    else { Fail "pagination or count wrong" }
} catch { Fail $_.Exception.Message }

# 4. POST invalid service -> 400
Test-Name "4. POST invalid service (expect 400)"
$badBody = '{"timestamp":1730000000000,"data":{"name":"T","email":"t@t.com","service":"invalid","message":"At least ten chars here"}}'
try {
    Invoke-RestMethod -Uri "$base/api/messages" -Method Post -Body $badBody -ContentType "application/json" -ErrorAction Stop
    Fail "expected 400"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) { Ok "got 400" } else { Fail "got $($_.Exception.Response.StatusCode.value__)" }
}

# 5. PATCH invalid id (abc) -> 400
Test-Name "5. PATCH /api/messages/abc (expect 400)"
try {
    Invoke-RestMethod -Uri "$base/api/messages/abc" -Method Patch -Body '{"read":true}' -ContentType "application/json" -ErrorAction Stop
    Fail "expected 400"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) { Ok "got 400" } else { Fail "got $($_.Exception.Response.StatusCode.value__)" }
}

# 6. PATCH non-existent id -> 404
Test-Name "6. PATCH /api/messages/99999 (expect 404)"
try {
    Invoke-RestMethod -Uri "$base/api/messages/99999" -Method Patch -Body '{"read":true}' -ContentType "application/json" -ErrorAction Stop
    Fail "expected 404"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) { Ok "got 404" } else { Fail "got $($_.Exception.Response.StatusCode.value__)" }
}

# 7. DELETE invalid id (abc) -> 400
Test-Name "7. DELETE /api/messages/abc (expect 400)"
try {
    Invoke-RestMethod -Uri "$base/api/messages/abc" -Method Delete -ErrorAction Stop
    Fail "expected 400"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) { Ok "got 400" } else { Fail "got $($_.Exception.Response.StatusCode.value__)" }
}

# 8. POST valid message -> 201
Test-Name "8. POST valid message (expect 201)"
$goodBody = '{"timestamp":1730000000000,"data":{"name":"Test","email":"test@example.com","service":"residential","region":"Dublin 1","message":"Valid test message with more than ten characters"}}'
try {
    $r = Invoke-RestMethod -Uri "$base/api/messages" -Method Post -Body $goodBody -ContentType "application/json" -ErrorAction Stop
    if ($r.id -and $r.message) { Ok "201, id=$($r.id)" } else { Fail "missing id or message" }
} catch { Fail $_.Exception.Message }

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Rezultat: $passed PASS, $failed FAIL" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================`n" -ForegroundColor Cyan
