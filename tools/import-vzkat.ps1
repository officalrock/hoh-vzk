# =====================================================================
# import-vzkat.ps1 - Importiert den PVerkehr-Verkehrszeichenkatalog
# =====================================================================
# Konvertiert alle .OLE-Dateien eines Ordners nach PNG (assets\zeichen\)
# und erzeugt daraus js\data-zeichen.js mit den amtlichen Metadaten
# (VZ-Nr, Bezeichnung, Kategorie), die in jeder OLE-Datei stecken.
#
#   powershell -ExecutionPolicy Bypass -File tools\import-vzkat.ps1
#
# Parameter:
#   -Quelle   Ordner mit .OLE-Dateien (Standard: PVerkehr VZ-Ordner)
#   -Ziel     PNG-Ausgabe            (Standard: assets\zeichen)
#   -DataOut  Datendatei             (Standard: js\data-zeichen.js)
#   -Groesse  max. Kantenlaenge px   (Standard: 512)
# =====================================================================
param(
    [string]$Quelle  = "C:\Program Files\PVERKEHR\ZPROG\VZ-KAT\VZ",
    [string]$Ziel    = "C:\Users\npetri\VZK App\assets\zeichen",
    [string]$DataOut = "C:\Users\npetri\VZK App\js\data-zeichen.js",
    [int]$Groesse    = 512
)

Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public class MetaKandidat { public string Art; public byte[] Bytes; }

public static class OleVz {
    [DllImport("ole32.dll")] static extern int StgIsStorageFile([MarshalAs(UnmanagedType.LPWStr)] string n);
    [DllImport("ole32.dll")] static extern int StgOpenStorage([MarshalAs(UnmanagedType.LPWStr)] string n, IStorage p, uint m, IntPtr s, uint r, out IStorage o);
    [DllImport("gdi32.dll")] public static extern IntPtr SetWinMetaFileBits(uint n, byte[] b, IntPtr h, IntPtr p);

    [ComImport, Guid("0000000B-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IStorage {
        void CreateStream(string n, uint m, uint a, uint b, out IStream s);
        void OpenStream(string n, IntPtr r, uint m, uint b, out IStream s);
        void CreateStorage(string n, uint m, uint a, uint b, out IStorage s);
        void OpenStorage(string n, IStorage p, uint m, IntPtr e, uint r, out IStorage s);
        void CopyTo(uint c, IntPtr i, IntPtr s, IStorage d);
        void MoveElementTo(string n, IStorage d, string w, uint f);
        void Commit(uint f); void Revert();
        void EnumElements(uint r1, IntPtr r2, uint r3, out IEnumSTATSTG e);
        void DestroyElement(string n); void RenameElement(string o, string w);
        void SetElementTimes(string n, IntPtr a, IntPtr b, IntPtr c);
        void SetClass(ref Guid c); void SetStateBits(uint s, uint m);
        void Stat(out System.Runtime.InteropServices.ComTypes.STATSTG s, uint f);
    }
    [ComImport, Guid("0000000D-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IEnumSTATSTG {
        [PreserveSig] int Next(uint c, [MarshalAs(UnmanagedType.LPArray, SizeParamIndex=0), Out] System.Runtime.InteropServices.ComTypes.STATSTG[] e, out uint f);
        void Skip(uint c); void Reset(); void Clone(out IEnumSTATSTG e);
    }
    const uint RX = 0x00000010;

    static int Cfb(byte[] d) {
        for (int i = 0; i + 8 <= d.Length; i++)
            if (d[i]==0xD0&&d[i+1]==0xCF&&d[i+2]==0x11&&d[i+3]==0xE0&&d[i+4]==0xA1&&d[i+5]==0xB1&&d[i+6]==0x1A&&d[i+7]==0xE1) return i;
        return -1;
    }
    public static Dictionary<string,byte[]> ReadStreams(string path) {
        var dict = new Dictionary<string,byte[]>(); string open = path; string tmp = null;
        try {
            var raw = File.ReadAllBytes(path);
            if (raw.Length > 8 && raw[0]==0xD0 && raw[1]==0xCF) { /* direkt CFB */ }
            else { int off = Cfb(raw); if (off > 0) { tmp = Path.GetTempFileName(); var inner = new byte[raw.Length-off]; Array.Copy(raw,off,inner,0,inner.Length); File.WriteAllBytes(tmp, inner); open = tmp; } else { dict["(roh)"] = raw; return dict; } }
            IStorage root; int hr = StgOpenStorage(open, null, RX, IntPtr.Zero, 0, out root);
            if (hr != 0) { dict["(roh)"] = File.ReadAllBytes(path); return dict; }
            try { Walk(root, "", dict); } finally { Marshal.ReleaseComObject(root); }
            return dict;
        } finally { if (tmp != null) { try { File.Delete(tmp); } catch {} } }
    }
    static void Walk(IStorage stg, string pre, Dictionary<string,byte[]> dict) {
        IEnumSTATSTG en; stg.EnumElements(0, IntPtr.Zero, 0, out en);
        try {
            var a = new System.Runtime.InteropServices.ComTypes.STATSTG[1]; uint f;
            while (en.Next(1, a, out f)==0 && f==1) {
                var st = a[0];
                if (st.type==2) { IStream s; stg.OpenStream(st.pwcsName, IntPtr.Zero, RX, 0, out s);
                    try { var buf = new byte[(int)st.cbSize]; if (buf.Length>0) s.Read(buf, buf.Length, IntPtr.Zero); dict[pre+st.pwcsName] = buf; }
                    finally { Marshal.ReleaseComObject(s); } }
                else if (st.type==1) { IStorage sub; stg.OpenStorage(st.pwcsName, null, RX, IntPtr.Zero, 0, out sub);
                    try { Walk(sub, pre+st.pwcsName+"/", dict); } finally { Marshal.ReleaseComObject(sub); } }
            }
        } finally { Marshal.ReleaseComObject(en); }
    }
    public static List<MetaKandidat> FindMetafiles(byte[] d) {
        var res = new List<MetaKandidat>();
        for (int i = 0; i + 4 <= d.Length; i++) {
            if (i>=40 && d[i]==0x20&&d[i+1]==0x45&&d[i+2]==0x4D&&d[i+3]==0x46) {
                int s=i-40; if (s+52<=d.Length && BitConverter.ToUInt32(d,s)==1) { uint nb=BitConverter.ToUInt32(d,s+48);
                    if (nb>=88 && s+nb<=d.Length) { var b=new byte[nb]; Array.Copy(d,s,b,0,(int)nb); res.Add(new MetaKandidat{Art="emf",Bytes=b}); i=s+(int)nb-1; continue; } } }
            if (d[i]==0x9A&&d[i+1]==0xC6&&d[i+2]==0xCD&&d[i+3]==0xD7) {
                int w=i+22; if (w+18<=d.Length) { uint ms=BitConverter.ToUInt32(d,w+6); long t=22+(long)ms*2;
                    if (ms>9 && i+t<=d.Length) { var b=new byte[t]; Array.Copy(d,i,b,0,(int)t); res.Add(new MetaKandidat{Art="wmf-placeable",Bytes=b}); i=i+(int)t-1; continue; } } }
            if ((d[i]==1||d[i]==2) && i+18<=d.Length && d[i+1]==0&&d[i+2]==9&&d[i+3]==0&&d[i+4]==0&&d[i+5]==3) {
                uint ms=BitConverter.ToUInt32(d,i+6); long t=(long)ms*2;
                if (ms>9 && i+t<=d.Length) { var b=new byte[t]; Array.Copy(d,i,b,0,(int)t); res.Add(new MetaKandidat{Art="wmf",Bytes=b}); } }
        }
        return res;
    }
}
"@ -ReferencedAssemblies System.Drawing

function Lade-Metafile($k) {
    switch ($k.Art) {
        "emf" { return New-Object System.Drawing.Imaging.Metafile((New-Object System.IO.MemoryStream(, $k.Bytes))) }
        "wmf-placeable" {
            try { return New-Object System.Drawing.Imaging.Metafile((New-Object System.IO.MemoryStream(, $k.Bytes))) }
            catch { $n = $k.Bytes[22..($k.Bytes.Length-1)]; $h = [OleVz]::SetWinMetaFileBits($n.Length,$n,[IntPtr]::Zero,[IntPtr]::Zero); return New-Object System.Drawing.Imaging.Metafile($h,$true) }
        }
        "wmf" { $h = [OleVz]::SetWinMetaFileBits($k.Bytes.Length,$k.Bytes,[IntPtr]::Zero,[IntPtr]::Zero); return New-Object System.Drawing.Imaging.Metafile($h,$true) }
    }
}

function Get-MetaRatio($k) {
    try {
        $d = $k.Bytes
        if ($k.Art -eq "emf") {
            $l=[BitConverter]::ToInt32($d,24);$t=[BitConverter]::ToInt32($d,28);$r=[BitConverter]::ToInt32($d,32);$b=[BitConverter]::ToInt32($d,36)
            if (($r-$l) -gt 0 -and ($b-$t) -gt 0) { return ($r-$l)/($b-$t) }; return $null
        }
        $off = 0
        if ($d.Length -gt 22 -and $d[0]-eq 0xD7 -and $d[1]-eq 0xCD -and $d[2]-eq 0xC6 -and $d[3]-eq 0x9A) { $off = 22 }
        $p = $off + 18; $eX=$null;$eY=$null
        while ($p + 6 -le $d.Length) {
            $rs=[BitConverter]::ToUInt32($d,$p); if ($rs -lt 3) { break }
            if ([BitConverter]::ToUInt16($d,$p+4) -eq 0x020C) { $eY=[BitConverter]::ToInt16($d,$p+6); $eX=[BitConverter]::ToInt16($d,$p+8) }
            $p += $rs*2
        }
        if ($eX -and $eY -and $eY -ne 0) { return [Math]::Abs([double]$eX/$eY) }
    } catch {}
    return $null
}

function Rendere-Png($mf, $ausgabe, $maxDim, $ratio) {
    $w=[double]$mf.Width; $h=[double]$mf.Height
    if ($w -le 0 -or $h -le 0) { throw "keine Abmessungen" }
    if ($ratio -and $ratio -gt 0) { $w=$ratio; $h=1.0 }
    $sk = $maxDim / [Math]::Max($w,$h)
    $bw=[Math]::Max(1,[int][Math]::Round($w*$sk)); $bh=[Math]::Max(1,[int][Math]::Round($h*$sk))
    $bmp = New-Object System.Drawing.Bitmap($bw,$bh,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.PixelOffsetMode='HighQuality'
        $g.DrawImage($mf, (New-Object System.Drawing.Rectangle(0,0,$bw,$bh)))
    } finally { $g.Dispose() }
    $bmp.Save($ausgabe,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

# Extrahiert ein Feld aus dem UTF-8-"Strings"-Block (Key=Value, Ende bei Steuerbyte).
function Get-MetaFeld([byte[]]$d, [string]$key) {
    $marker = [System.Text.Encoding]::ASCII.GetBytes($key + "=")
    for ($i = 0; $i -le $d.Length - $marker.Length; $i++) {
        $treffer = $true
        for ($j = 0; $j -lt $marker.Length; $j++) { if ($d[$i+$j] -ne $marker[$j]) { $treffer = $false; break } }
        if ($treffer) {
            $start = $i + $marker.Length; $end = $start
            while ($end -lt $d.Length -and $d[$end] -ge 0x20) { $end++ }
            if ($end -gt $start) { return [System.Text.Encoding]::UTF8.GetString($d[$start..($end-1)]).Trim() }
            return ""
        }
    }
    return ""
}

function Saubere-Kategorie([string]$k) {
    if (-not $k) { return "Sonstige" }
    if ($k -match 'Gefahr')      { return "Gefahrzeichen" }
    if ($k -match 'Vorschrift')  { return "Vorschriftzeichen" }
    if ($k -match 'Richt')       { return "Richtzeichen" }
    if ($k -match 'Zusatz')      { return "Zusatzzeichen" }
    if ($k -match 'Verkehrsein') { return "Verkehrseinrichtungen" }
    return $k
}

function Datei-Sicher([string]$s) { return ($s -replace '[\\/:*?"<>|]', '_') }

# ---------------------------------------------------------------------
if (-not (Test-Path $Ziel)) { New-Item -ItemType Directory -Force $Ziel | Out-Null }
$dateien = Get-ChildItem -Path $Quelle -Filter *.OLE -File | Sort-Object Name
$prio = @{ "emf"=0; "wmf-placeable"=1; "wmf"=2 }

$eintraege = [System.Collections.Generic.List[object]]::new()
$ok = 0; $fehler = 0; $i = 0
foreach ($datei in $dateien) {
    $i++
    if ($i % 200 -eq 0) { Write-Host "  ... $i / $($dateien.Count)" }
    try {
        $roh = [System.IO.File]::ReadAllBytes($datei.FullName)
        $nummer = Get-MetaFeld $roh "VZ-Nr."
        $name   = Get-MetaFeld $roh "Bezeichnung"
        $kat    = Saubere-Kategorie (Get-MetaFeld $roh "Kategorie")
        if (-not $nummer) { $nummer = [System.IO.Path]::GetFileNameWithoutExtension($datei.Name) }

        $streams = [OleVz]::ReadStreams($datei.FullName)
        $kand = New-Object System.Collections.Generic.List[MetaKandidat]
        foreach ($e in $streams.Values) { foreach ($k in [OleVz]::FindMetafiles($e)) { $kand.Add($k) } }
        if (-not $kand.Count) { throw "kein Metafile" }
        $sortiert = $kand | Sort-Object @{e={$prio[$_.Art]}}, @{e={$_.Bytes.Length};Descending=$true}

        $pngName = (Datei-Sicher $nummer) + ".png"
        $gerendert = $false
        foreach ($k in $sortiert) {
            try {
                $mf = Lade-Metafile $k
                Rendere-Png $mf (Join-Path $Ziel $pngName) $Groesse (Get-MetaRatio $k)
                $mf.Dispose(); $gerendert = $true; break
            } catch {}
        }
        if (-not $gerendert) { throw "Render fehlgeschlagen" }

        $eintraege.Add([pscustomobject]@{ nummer=$nummer; name=$name; kategorie=$kat; gruppe=""; bild=$pngName })
        $ok++
    } catch {
        Write-Host ("FEHLER {0}: {1}" -f $datei.Name, $_) -ForegroundColor DarkYellow
        $fehler++
    }
}

# Duplikate (gleiche Nummer): erster gewinnt
$gesehen = @{}; $final = [System.Collections.Generic.List[object]]::new()
foreach ($e in $eintraege) { if (-not $gesehen.ContainsKey($e.nummer)) { $gesehen[$e.nummer] = $true; $final.Add($e) } }

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("// Automatisch generiert aus dem PVerkehr-Verkehrszeichenkatalog (import-vzkat.ps1).")
[void]$sb.AppendLine("// Bilder: assets/zeichen/<nummer>.png  Stand: " + (Get-Date -Format 'yyyy-MM-dd'))
[void]$sb.AppendLine("const VZ_DATA = [")
foreach ($e in $final) { [void]$sb.AppendLine(($e | ConvertTo-Json -Compress -Depth 3) + ",") }
[void]$sb.AppendLine("];")
[System.IO.File]::WriteAllText($DataOut, $sb.ToString(), [System.Text.UTF8Encoding]::new($true))

Write-Host ""
Write-Host "Fertig: $ok konvertiert, $fehler fehlgeschlagen, $($final.Count) Katalogeintraege."
Write-Host "PNGs:   $Ziel"
Write-Host "Daten:  $DataOut"
