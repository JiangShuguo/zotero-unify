$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$build = Join-Path $root "build"
New-Item -ItemType Directory -Force -Path $build | Out-Null
$xpi = Join-Path $build "unify.xpi"
if (Test-Path $xpi) { Remove-Item $xpi -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Files to pack: relative path with forward slashes -> absolute path
# Flat layout matches bootstrap.js (loadSubScript rootURI + "venue-map.js" ...)
$files = @(
  @{ Rel = "manifest.json"; Abs = (Join-Path $root "manifest.json") },
  @{ Rel = "bootstrap.js"; Abs = (Join-Path $root "bootstrap.js") },
  @{ Rel = "icon.png"; Abs = (Join-Path $root "icon.png") },
  @{ Rel = "icon@2x.png"; Abs = (Join-Path $root "icon@2x.png") },
  @{ Rel = "JOURNAL_ALIASES.txt"; Abs = (Join-Path $root "JOURNAL_ALIASES.txt") },
  @{ Rel = "venue-map.js"; Abs = (Join-Path $root "src\venue-map.js") },
  @{ Rel = "usenix.js"; Abs = (Join-Path $root "src\usenix.js") },
  @{ Rel = "normalizer.js"; Abs = (Join-Path $root "src\normalizer.js") },
  @{ Rel = "unify.js"; Abs = (Join-Path $root "src\unify.js") }
)

$fs = [System.IO.File]::Open($xpi, [System.IO.FileMode]::Create)
try {
  $zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($f in $files) {
      if (-not (Test-Path $f.Abs)) { throw "Missing file: $($f.Abs)" }
      $entry = $zip.CreateEntry($f.Rel, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      try {
        $bytes = [System.IO.File]::ReadAllBytes($f.Abs)
        $entryStream.Write($bytes, 0, $bytes.Length)
      } finally {
        $entryStream.Dispose()
      }
      Write-Output ("+ {0}" -f $f.Rel)
    }
  } finally {
    $zip.Dispose()
  }
} finally {
  $fs.Dispose()
}

Write-Output "Built: $xpi"
# Verify forward slashes
$check = [System.IO.Compression.ZipFile]::OpenRead($xpi)
try {
  $check.Entries | ForEach-Object { Write-Output ("entry: {0}" -f $_.FullName) }
} finally {
  $check.Dispose()
}
Get-Item $xpi | Format-List FullName, Length
