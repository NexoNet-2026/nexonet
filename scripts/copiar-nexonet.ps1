# ─────────────────────────────────────────────────────────────────
#  NexoNet — Copiar archivos actualizados al proyecto
#  Ejecutar desde cualquier carpeta con:
#  .\copiar-nexonet.ps1
# ─────────────────────────────────────────────────────────────────

$proyecto   = "C:\Users\Usuario\Desktop\nexonet"
$descargas  = "$env:USERPROFILE\Downloads"

# Mapa: archivo descargado → ruta destino en el proyecto
$archivos = @{
  "home-page.tsx"         = "src\app\page.tsx"
  "PopupCompra.tsx"       = "src\components\PopupCompra.tsx"
  "Header.tsx"            = "src\components\Header.tsx"
  "buscar-page.tsx"       = "src\app\buscar\page.tsx"
  "mis-anuncios-page.tsx" = "src\app\mis-anuncios\page.tsx"
  "anuncio-id-page.tsx"   = "src\app\anuncios\[id]\page.tsx"
  "usuario-page.tsx"      = "src\app\usuario\page.tsx"
  "mapa-page.tsx"         = "src\app\mapa\page.tsx"
  "publicar-page.tsx"     = "src\app\publicar\page.tsx"
  "registro-page.tsx"     = "src\app\registro\page.tsx"
  "promotor-page.tsx"     = "src\app\promotor\page.tsx"
  "admin-page.tsx"        = "src\app\admin\page.tsx"
  "admin-login-page.tsx"  = "src\app\admin\login\page.tsx"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  NexoNet — Copiando archivos al proyecto" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$ok    = 0
$error = 0

foreach ($nombre in $archivos.Keys) {
  $origen  = Join-Path $descargas $nombre
  $destino = Join-Path $proyecto  $archivos[$nombre]

  if (Test-Path $origen) {
    $dir = Split-Path $destino
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -Path $origen -Destination $destino -Force
    Write-Host "  ✅  $nombre" -ForegroundColor Green
    $ok++
  } else {
    Write-Host "  ⚠️   $nombre  ← no encontrado en Descargas" -ForegroundColor Yellow
    $error++
  }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  $ok copiados   $error no encontrados" -ForegroundColor White
Write-Host ""

if ($ok -gt 0) {
  Write-Host "  Ahora ejecutá:" -ForegroundColor White
  Write-Host ""
  Write-Host '  cd C:\Users\Usuario\Desktop\nexonet' -ForegroundColor Yellow
  Write-Host '  git add -A' -ForegroundColor Yellow
  Write-Host '  git commit -m "feat: notificaciones + sliders + permuto + geo"' -ForegroundColor Yellow
  Write-Host '  git push' -ForegroundColor Yellow
  Write-Host ""
}

Read-Host "  Presioná Enter para cerrar"
