# Sampelt den IVST-Windlastrechner, um Formel + Klassenschwellen zu rekonstruieren.
$ProgressPreference = 'SilentlyContinue'
$base = "https://www.ivst.de/windlast/"

function Invoke-Windlast {
    param([string]$place, [string]$height, [string]$size, [string]$shield, [int]$w, [int]$h, [string]$freeQ = '0')
    $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-WebRequest -UseBasicParsing -WebSession $s ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{check='yes'} ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$place;freeHeight=$freeQ} ($base+"index.php?page=height") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$height} ($base+"index.php?page=size") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$size} ($base+"index.php?page=shields") | Out-Null
    $body = @{ shield1=$shield;shield2='101';shield3='101';numberOfShields='1';width1=$w;height1=$h;width2='1250';height2='1600';width3='1250';height3='1600' }
    $r = Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body $body ($base+"index.php?page=overview")
    $c = $r.Content
    $klasse = ([regex]::Match($c, 'Aufstellklasse:\s*<span>\s*([^<]*?)\s*</span>')).Groups[1].Value
    $q      = ([regex]::Match($c, 'Ausgewählte Windlast:\s*<span>\s*([^<]*?)\s*</span>')).Groups[1].Value
    $moment = ([regex]::Match($c, 'Windlast beträgt:\s*<span>\s*([^<]*?)\s*</span>')).Groups[1].Value
    $pole   = ([regex]::Match($c, 'id="linie_oben"[^>]*>\s*([0-9.,]+)')).Groups[1].Value
    [pscustomobject]@{ place=$place; height=$height; size=$size; shield=$shield; w=$w; h=$h; q=$q; moment=$moment; pole=$pole; klasse=$klasse }
}

"### A) Höhe variieren (VZ101, out, Größe2) ###"
foreach ($ht in '0.6','1.0','1.5','2.0','2.2','4.5') { Invoke-Windlast -place 'out' -height $ht -size '2' -shield '101' -w 1250 -h 1600 }

"### B) Größe variieren (VZ101, out, Höhe2.0) ###"
foreach ($sz in '1','2','3') { Invoke-Windlast -place 'out' -height '2.0' -size $sz -shield '101' -w 1250 -h 1600 }

"### C) Ort variieren (VZ101, Größe2, Höhe2.0) ###"
foreach ($pl in 'in','out') { Invoke-Windlast -place $pl -height '2.0' -size '2' -shield '101' -w 1250 -h 1600 }

"### D) Schildtyp variieren (out, Größe2, Höhe2.0) ###"
foreach ($sh in '101','205','206','250','306','454','455','458') { Invoke-Windlast -place 'out' -height '2.0' -size '2' -shield $sh -w 1250 -h 1600 }

"### E) Freies Schild Größe variieren (VZ458, out, Höhe2.0) ###"
foreach ($dim in @(500,500),@(1000,1000),@(1250,1600),@(2000,2000)) {
    Invoke-Windlast -place 'out' -height '2.0' -size '2' -shield '458' -w $dim[0] -h $dim[1]
}
