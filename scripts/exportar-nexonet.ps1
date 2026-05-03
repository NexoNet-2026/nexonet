# exportar-nexonet.ps1
# Ejecutar desde la raíz del proyecto: .\exportar-nexonet.ps1

$proyecto = "C:\Users\Usuario\Desktop\nexonet"
$salida = "$env:USERPROFILE\Downloads\nexonet-contexto.txt"

$extensiones = @("*.tsx", "*.ts", "*.sql", "*.json", "*.md")
$excluir = @("node_modules", ".next", ".git", "package-lock.json")

$resultado = ""

Get-ChildItem -Path "$proyecto\src" -Recurse -Include $extensiones |
  Where-Object { $excluir | ForEach-Object { $_.FullName -notlike "*\$_\*" } | Where-Object { $_ } } |
  ForEach-Object {
    $ruta = $_.FullName.Replace($proyecto, "")
    $contenido = [System.IO.File]::ReadAllText($_.FullName)
    $resultado += "`n`n# ===== $ruta =====`n$contenido"
  }

# Agregar SQL también
Get-ChildItem -Path "$proyecto\sql" -Recurse -Include "*.sql" -ErrorAction SilentlyContinue |
  ForEach-Object {
    $ruta = $_.FullName.Replace($proyecto, "")
    $contenido = [System.IO.File]::ReadAllText($_.FullName)
    $resultado += "`n`n# ===== $ruta =====`n$contenido"
  }

$resultado | Out-File -FilePath $salida -Encoding UTF8
Write-Host "Exportado en: $salida" -ForegroundColor Green
