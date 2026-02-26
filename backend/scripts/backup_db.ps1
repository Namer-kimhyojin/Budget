# DB 자동 백업 스크립트
$src = "D:\Budget\backend\db.sqlite3"
$dir = "D:\Budget\backend\db_backups"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$dst = "$dir\db_$ts.sqlite3"
Copy-Item $src $dst
# 7일 이상 된 백업 삭제
Get-ChildItem $dir -Filter "*.sqlite3" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
Write-Host "백업 완료: $dst"
