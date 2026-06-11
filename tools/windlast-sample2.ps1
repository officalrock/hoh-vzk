$ProgressPreference = 'SilentlyContinue'
$base = "https://www.ivst.de/windlast/"

function Invoke-Windlast {
    param([string]$place,[string]$height,[string]$size,[string]$shield,[int]$w,[int]$h,[string]$freeQ='0')
    $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-WebRequest -UseBasicParsing -WebSession $s ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{check='yes'} ($base+"index.php") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$place;freeHeight=$freeQ} ($base+"index.php?page=height") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$height} ($base+"index.php?page=size") | Out-Null
    Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body @{group1=$size} ($base+"index.php?page=shields") | Out-Null
    $body = @{ shield1=$shield;shield2='101';shield3='101';numberOfShields='1';width1=$w;height1=$h;width2='1250';height2='1600';width3='1250';height3='1600' }
    $r = Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post -Body $body ($base+"index.php?page=overview")
    $c = $r.Content
    # Umlaut-freie Muster: q endet auf "kN", Moment auf "Nm", Klasse nach "Aufstellklasse:"
    $q      = ([regex]::Match($c, '<span>\s*([0-9][0-9.,]*)\s*kN')).Groups[1].Value
    $moment = ([regex]::Match($c, '<span>\s*([0-9][0-9.,]*)\s*Nm')).Groups[1].Value
    $pole   = ([regex]::Match($c, 'id="linie_oben"[^>]*>\s*([0-9.,]+)')).Groups[1].Value
    $klasse = ([regex]::Match($c, 'Aufstellklasse:\s*<span>\s*([^<]*?)\s*</span>')).Groups[1].Value
    $img    = ([regex]::Match($c, 'plattenbox[\s\S]*?<img[^>]*src="\./drawable/([^"]+)"')).Groups[1].Value
    "{0,-3} h={1,-4} sz={2} vz={3,-4} {4,4}x{5,-4} q={6,-5} M={7,-9} pole={8,-6} {9,-14} img={10}" -f $place,$height,$size,$shield,$w,$h,$q,$moment,$pole,$klasse,$img
}

"## Hoehe (VZ101 out Gr2) -> Momentskalierung mit Hebelarm + K-Grenzen ##"
foreach ($ht in '0.6','1.0','1.5','2.0','2.2','4.5') { Invoke-Windlast -place 'out' -height $ht -size '2' -shield '101' -w 1250 -h 1600 }
"## Groesse (VZ101 out h2.0) ##"
foreach ($sz in '1','2','3') { Invoke-Windlast -place 'out' -height '2.0' -size $sz -shield '101' -w 1250 -h 1600 }
"## Ort (VZ101 Gr2 h2.0) ##"
foreach ($pl in 'in','out') { Invoke-Windlast -place $pl -height '2.0' -size '2' -shield '101' -w 1250 -h 1600 }
"## Schildtyp (out Gr2 h2.0) -> Standardflaechen je Typ ##"
foreach ($sh in '101','205','206','220','250','306','357','454','455','457','501') { Invoke-Windlast -place 'out' -height '2.0' -size '2' -shield $sh -w 1250 -h 1600 }
"## Freies Schild (VZ458 out h2.0) -> reine Flaechen-/Klassenkennlinie ##"
foreach ($d in @(300,300),@(500,500),@(600,600),@(750,1050),@(1000,1000),@(1250,1600),@(1500,1500),@(2000,2000)) {
    Invoke-Windlast -place 'out' -height '2.0' -size '2' -shield '458' -w $d[0] -h $d[1]
}
"## Freies Schild Hoehe variieren bei fester Flaeche (VZ458 1x1m) ##"
foreach ($ht in '0.6','1.0','1.5','2.0','2.2','4.5') { Invoke-Windlast -place 'out' -height $ht -size '2' -shield '458' -w 1000 -h 1000 }
