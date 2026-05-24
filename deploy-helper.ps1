# MDD Care Deploy Helper
# ใช้สำหรับ push โค้ดขึ้น GitHub แบบรวดเร็ว

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀  MDD Care - Deploy Helper                            ║" -ForegroundColor Cyan
Write-Host "║   Push โค้ดขึ้น GitHub ใน 1 นาที                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. ตรวจ git
try { git --version | Out-Null } catch {
  Write-Host "✗ git ไม่ได้ติดตั้ง - https://git-scm.com/download/win" -ForegroundColor Red
  exit 1
}

# 2. เช็ค git config
$gitUser = git config --global user.name
$gitEmail = git config --global user.email
if (-not $gitUser) {
  $name = Read-Host "กรอกชื่อ (สำหรับ git commit)"
  git config --global user.name "$name"
}
if (-not $gitEmail) {
  $email = Read-Host "กรอก email (ใช้ email ของ GitHub)"
  git config --global user.email "$email"
}

# 3. Init repo ถ้ายังไม่มี
if (-not (Test-Path ".git")) {
  Write-Host "→ git init" -ForegroundColor Yellow
  git init -b main
} else {
  Write-Host "✓ git repo มีอยู่แล้ว" -ForegroundColor Green
}

# 4. Add + commit
Write-Host "→ git add + commit" -ForegroundColor Yellow
git add .
$status = git status --porcelain
if ($status) {
  git commit -m "Deploy: MDD Care psychiatric patient management system"
  Write-Host "✓ Committed" -ForegroundColor Green
} else {
  Write-Host "✓ ไม่มีอะไรเปลี่ยน - skip commit" -ForegroundColor Green
}

# 5. ถาม GitHub username
Write-Host ""
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "⚠ ก่อนทำต่อ ต้องสร้าง empty repo ที่:" -ForegroundColor Yellow
Write-Host "  https://github.com/new   ชื่อ: mdd-care" -ForegroundColor White
Write-Host "  ❗ อย่ากด 'Add README' (ต้องว่าง)" -ForegroundColor Red
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
$ghUser = Read-Host "GitHub username ของคุณ"
if (-not $ghUser) { Write-Host "ยกเลิก"; exit 0 }

$repoUrl = "https://github.com/$ghUser/mdd-care.git"

# 6. ตั้ง remote
$existing = git remote -v 2>$null
if ($existing -match "origin") {
  git remote set-url origin $repoUrl
} else {
  git remote add origin $repoUrl
}
Write-Host "✓ remote: $repoUrl" -ForegroundColor Green

# 7. Push
Write-Host "→ git push -u origin main ..." -ForegroundColor Yellow
Write-Host "  (ถ้า GitHub ขอ login จะเปิด browser ให้ authorize)" -ForegroundColor DarkGray
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
  Write-Host "║   ✅  Push สำเร็จ!                                        ║" -ForegroundColor Green
  Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
  Write-Host ""
  Write-Host "🎯 ขั้นตอนต่อไป (เปิดในเบราว์เซอร์):" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  1. MongoDB Atlas → https://cloud.mongodb.com" -ForegroundColor White
  Write-Host "     - Build Database (M0 Free, Singapore region)"
  Write-Host "     - Copy connection string"
  Write-Host ""
  Write-Host "  2. Render Blueprint Deploy:" -ForegroundColor White
  Write-Host "     https://render.com/deploy?repo=$repoUrl" -ForegroundColor Yellow
  Write-Host "     - กรอก MONGO_URI จากข้อ 1"
  Write-Host ""
  Write-Host "  3. Vercel Frontend Deploy:" -ForegroundColor White
  Write-Host "     https://vercel.com/new/clone?repository-url=$repoUrl&root-directory=frontend" -ForegroundColor Yellow
  Write-Host "     - Environment Variables:"
  Write-Host "       NEXT_PUBLIC_API_URL    = (URL จาก Render)"
  Write-Host "       NEXT_PUBLIC_SOCKET_URL = (URL จาก Render เดียวกัน)"
  Write-Host ""
  Write-Host "📖 รายละเอียดเต็มที่ DEPLOY.md" -ForegroundColor DarkGray
} else {
  Write-Host ""
  Write-Host "✗ Push ล้มเหลว - เช็ค error ด้านบน" -ForegroundColor Red
  Write-Host ""
  Write-Host "วิธีแก้ที่พบบ่อย:" -ForegroundColor Yellow
  Write-Host "  - Repo บน GitHub ต้องว่าง (ไม่มี README/license)"
  Write-Host "  - ตรวจ GitHub username สะกดถูกไหม"
  Write-Host "  - อาจต้อง install GitHub CLI หรือ git credential manager"
}
