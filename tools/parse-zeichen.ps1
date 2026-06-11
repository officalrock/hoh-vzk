# Parst die Wikipedia-Bildtafel (Wikitext) zu einem JS-Datenmodul fuer die VZK-App.
param(
    [string]$InFile = "C:\Users\npetri\VZK App\tools\bildtafel_wikitext.txt",
    [string]$OutFile = "C:\Users\npetri\VZK App\js\data-zeichen.js"
)

$lines = Get-Content -Encoding UTF8 $InFile

# Abschnitte, die in den Katalog uebernommen werden (Top-Level == Ueberschriften)
$sectionMap = @{
    'Gefahrzeichen nach Anlage 1 (zu § 40 Absatz 6 und 7 StVO)'   = 'Gefahrzeichen'
    'Vorschriftzeichen nach Anlage 2 (zu § 41 Absatz 1 StVO)'      = 'Vorschriftzeichen'
    'Richtzeichen nach Anlage 3 (zu § 42 Absatz 2 StVO)'           = 'Richtzeichen'
    'Verkehrseinrichtungen nach Anlage 4 (zu § 43 Absatz 3 StVO)'  = 'Verkehrseinrichtungen'
    'Sonstige Zeichen'                                              = 'Sonstige Zeichen'
    'Nicht mehr verordnete, aber gültige Zeichen'                   = 'Sonstige Zeichen'
    'Zusatzzeichen'                                                 = 'Zusatzzeichen'
    'Nachträgliche Änderungen und Ergänzungen zu den Verkehrszeichen' = '__NACHTRAG__'
}

function Clean-WikiText([string]$s) {
    $s = $s -replace '<ref[^>]*>.*?</ref>', ''
    $s = $s -replace '<ref[^>]*/>', ''
    $s = $s -replace '\{\{[^{}]*\}\}', ''
    # [[Ziel|Text]] -> Text ; [[Text]] -> Text  (auch geschachtelt einfach)
    while ($s -match '\[\[([^\[\]|]*)\|([^\[\]]*)\]\]') { $s = $s -replace '\[\[([^\[\]|]*)\|([^\[\]]*)\]\]', '$2' }
    while ($s -match '\[\[([^\[\]]*)\]\]')              { $s = $s -replace '\[\[([^\[\]]*)\]\]', '$1' }
    $s = $s -replace "'''", '' -replace "''", ''
    $s = $s -replace '<br\s*/?>', ' '
    $s = $s -replace '&shy;', '' -replace '&nbsp;', ' ' -replace '&#8239;', ' '
    $s = $s -replace '<[^>]+>', ''
    $s = $s -replace '\s+', ' '
    return $s.Trim()
}

function CategoryByNumber([string]$num) {
    $main = [int]($num -replace '^(\d+).*$', '$1')
    if ($main -ge 1000) { return 'Zusatzzeichen' }
    if ($main -ge 600)  { return 'Verkehrseinrichtungen' }
    if ($main -ge 300)  { return 'Richtzeichen' }
    if ($main -ge 200)  { return 'Vorschriftzeichen' }
    return 'Gefahrzeichen'
}

$items = [System.Collections.Generic.List[object]]::new()
$cat = $null; $sub = ''

foreach ($line in $lines) {
    if ($line -match '^==\s*([^=].*?)\s*==\s*$') {
        $h = $matches[1]
        if ($sectionMap.ContainsKey($h)) { $cat = $sectionMap[$h] } else { $cat = $null }
        $sub = ''
        continue
    }
    if ($line -match '^===\s*(.*?)\s*===\s*$') {
        $sub = Clean-WikiText ($matches[1] -replace '\[\[#[^\]]*\|\(([^)]*)\)\]\]', '')
        $sub = ($sub -replace '\((\d{2}\.\d{2}\.\d{4})\)', '').Trim()
        continue
    }
    if (-not $cat) { continue }
    # Galerie-Eintrag: Datei.svg|'''(Zusatz)Zeichen NUM'''<br />Name...
    if ($line -match "^(?<file>[^|]+?\.(svg|png|jpg))\|(?<rest>.*'''(Zusatzzeichen|Zeichen)\s+(?<num>\d{3,4}(?:\.\d+)?(?:-\d+)?)'''.*)$") {
        $file = $matches['file'].Trim()
        $num  = $matches['num']
        $rest = $matches['rest']
        # Name = alles nach dem fett gesetzten "Zeichen NUM"
        $name = $rest -replace "^.*?'''(Zusatzzeichen|Zeichen)\s+$([regex]::Escape($num))[^']*'''", ''
        $name = Clean-WikiText $name
        $name = $name -replace '^[\s:–\-]+', ''
        if (-not $name) { $name = $sub }
        $isZusatz = $rest -match "'''Zusatzzeichen"
        $catFinal = $cat
        if ($cat -eq '__NACHTRAG__') { if ($isZusatz) { $catFinal = 'Zusatzzeichen' } else { $catFinal = CategoryByNumber $num } }
        elseif ($isZusatz) { $catFinal = 'Zusatzzeichen' }

        $items.Add([pscustomobject]@{
            nummer    = $num
            name      = $name
            kategorie = $catFinal
            gruppe    = $sub
            bild      = $file
        })
    }
}

# Duplikate: letzter Eintrag gewinnt (Nachtraege ueberschreiben Altstand)
$byNum = [ordered]@{}
foreach ($it in $items) { $byNum[$it.nummer] = $it }
$final = $byNum.Values | Sort-Object { ($_.nummer -replace '[.-].*$','') -as [int] }, nummer

Write-Host ("Eintraege: " + $final.Count)

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine('// Automatisch generiert aus der Wikipedia-Bildtafel der Verkehrszeichen (VzKat 2017 ff.)')
[void]$sb.AppendLine('// Bilder: Wikimedia Commons (amtliche Werke, § 5 UrhG). Stand: ' + (Get-Date -Format 'yyyy-MM-dd'))
[void]$sb.AppendLine('const VZ_DATA = [')
foreach ($it in $final) {
    $j = ($it | ConvertTo-Json -Compress -Depth 3)
    [void]$sb.AppendLine($j + ',')
}
[void]$sb.AppendLine('];')

New-Item -ItemType Directory -Force (Split-Path $OutFile) | Out-Null
[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), [System.Text.UTF8Encoding]::new($true))
Write-Host "Geschrieben: $OutFile"
