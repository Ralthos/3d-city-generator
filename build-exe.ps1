# Builds "release\3D Procedural City Generator.exe" with the C# compiler built into Windows.
# Every file in dist\ is embedded in the .exe, so the .exe runs on its own (no Node.js needed).
# Run again after editing anything in dist\:
#   powershell -ExecutionPolicy Bypass -File build-exe.ps1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw 'The .NET Framework 4 C# compiler (csc.exe) was not found.' }

$release = Join-Path $root 'release'
New-Item -ItemType Directory -Force $release | Out-Null
$exe = Join-Path $release '3D Procedural City Generator.exe'

# A response file avoids PowerShell quoting problems with the spaces in the folder name.
$lines = @('/nologo', '/optimize+', '/target:exe', "/out:`"$exe`"")
foreach ($file in Get-ChildItem (Join-Path $root 'dist') -File) {
    $lines += "/resource:`"$($file.FullName)`",dist/$($file.Name)"
}
$lines += "`"$(Join-Path $root 'launcher\CityLauncher.cs')`""
$rsp = Join-Path $env:TEMP 'city-launcher-build.rsp'
Set-Content -Path $rsp -Value $lines -Encoding ascii

& $csc "@$rsp"
if ($LASTEXITCODE -ne 0) { throw "Build failed (csc exit code $LASTEXITCODE)." }
Remove-Item $rsp
Write-Host "Built: $exe"
