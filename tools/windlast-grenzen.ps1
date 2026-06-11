# Bestimmt die exakten Moment-Grenzen der Aufstellklassen per Binaersuche.
# Nutzt ein freies Rechteckschild (VZ458) Hoehe 1000 mm bei Aufstellhoehe 2,0 m
# (out): M = 420 * (w/1000 * 1.0) * 2.5 = 1.05 * w[mm]  -> Moment monoton in Breite.
$ProgressPreference = 'SilentlyContinue'
$base = "https://www.ivst.de/windlast/"

function Get-Class {
    param([int]$w)
    $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-WebRequest -UseBasicParsing -WebSession $s ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{check='yes'} ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1='out';freeHeight='0'} ($base+"index.php?page=height") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1='2.0'} ($base+"index.php?page=size") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1='2'} ($base+"index.php?page=shields") | Out-Null
    $body = @{ shield1='458';shield2='101';shield3='101';numberOfShields='1';width1=$w;height1='1000';width2='1250';height2='1600';width3='1250';height3='1600' }
    $r = Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body $body ($base+"index.php?page=overview")
    $c = $r.Content
    $moment = ([regex]::Match($c, '<span>\s*([0-9][0-9.,]*)\s*Nm')).Groups[1].Value
    $klasse = ([regex]::Match($c, 'Aufstellklasse:\s*<span>\s*([^<]*?)\s*</span>')).Groups[1].Value
    [pscustomobject]@{ w=$w; moment=$moment; klasse=$klasse }
}

# Binaersuche: groesste Breite, deren Klasse == Klasse(wLo)
function Find-Boundary {
    param([int]$wLo, [int]$wHi)
    $kLo = (Get-Class $wLo).klasse
    while (($wHi - $wLo) -gt 1) {
        $mid = [int][Math]::Floor(($wLo + $wHi) / 2)
        $k = (Get-Class $mid).klasse
        if ($k -eq $kLo) { $wLo = $mid } else { $wHi = $mid }
    }
    $a = Get-Class $wLo
    $b = Get-Class $wHi
    "GRENZE: '{0}' bis M={1} (w={2})  ->  '{3}' ab M={4} (w={5})" -f $a.klasse,$a.moment,$a.w,$b.klasse,$b.moment,$b.w
}

# Brackets (Breite mm ~ M/1.05) je Klassenuebergang
Find-Boundary 60   130    # K1|K2     M ~ 81..127
Find-Boundary 130  260    # K2|K3     M ~ 236..260
Find-Boundary 300  360    # K3|K4     M ~ 348..363
Find-Boundary 360  560    # K4|K5     M ~ 462..556
Find-Boundary 500  620    # K5|K6     M ~ 556..630
Find-Boundary 620  820    # K6|K7     M ~ 702..836
Find-Boundary 790  1010   # K7|K8     M ~ 840..1050
Find-Boundary 1000 1090   # K8|K9     M ~ 1050..1134
Find-Boundary 1080 2010   # K9|2x..   M ~ 1134..2100
Find-Boundary 2000 4900   # 2x..|zuhoch
