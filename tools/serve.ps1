# Minimaler statischer HTTP-Server fuer die lokale Vorschau (nur Entwicklung).
param([int]$Port = 8417, [string]$Root = (Split-Path $PSScriptRoot))

$mime = @{
    '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
    '.js'='text/javascript; charset=utf-8'; '.json'='application/json'
    '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'
    '.pdf'='application/pdf'; '.ico'='image/x-icon'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
        $rel = [uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
        if (-not $rel) { $rel = 'index.html' }
        $path = Join-Path $Root $rel
        if ((Test-Path $path -PathType Leaf) -and ([System.IO.Path]::GetFullPath($path)).StartsWith([System.IO.Path]::GetFullPath($Root))) {
            $bytes = [System.IO.File]::ReadAllBytes($path)
            $ext = [System.IO.Path]::GetExtension($path).ToLower()
            if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $ctx.Response.StatusCode = 404
        }
    } catch { $ctx.Response.StatusCode = 500 }
    $ctx.Response.Close()
}
