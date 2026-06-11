# =====================================================================
# convert-ole.ps1 - Konvertiert CorelDRAW-OLE-Dateien (.ole) nach PNG
# =====================================================================
# Verwendung:
#   1. .ole-Dateien nach assets\zeichen-ole\ legen
#      (Dateiname = Zeichennummer, z. B. "274-30.ole")
#   2. Rechtsklick auf diese Datei -> "Mit PowerShell ausfuehren"
#      oder:  powershell -ExecutionPolicy Bypass -File tools\convert-ole.ps1
#   3. Ergebnis landet als PNG in assets\zeichen\ - die App nutzt es automatisch.
#
# Funktionsweise: OLE-Objekte aus CorelDRAW enthalten neben den nativen
# CDR-Daten eine Metafile-Darstellung (WMF/EMF). Das Skript oeffnet die
# OLE-Compound-Datei, durchsucht alle Streams nach Metafiles und rendert
# das beste Ergebnis mit GDI+ als PNG mit transparentem Hintergrund.
#
# Parameter:
#   -Quelle  Ordner mit .ole-Dateien   (Standard: assets\zeichen-ole)
#   -Ziel    Ausgabeordner fuer PNGs   (Standard: assets\zeichen)
#   -Groesse maximale Kantenlaenge px  (Standard: 512)
#   -Detail  zeigt je Datei alle gefundenen Streams/Metafiles an
# =====================================================================
param(
    [string]$Quelle = "",
    [string]$Ziel = "",
    [int]$Groesse = 512,
    [switch]$Detail
)

$projekt = Split-Path $PSScriptRoot
if (-not $Quelle) { $Quelle = Join-Path $projekt "assets\zeichen-ole" }
if (-not $Ziel)   { $Ziel   = Join-Path $projekt "assets\zeichen" }

Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public class MetaKandidat {
    public string Art;      // emf | wmf-placeable | wmf
    public string Stream;
    public byte[] Bytes;
}

public static class OleVz {

    [DllImport("ole32.dll")]
    static extern int StgIsStorageFile([MarshalAs(UnmanagedType.LPWStr)] string pwcsName);
    [DllImport("ole32.dll")]
    static extern int StgOpenStorage([MarshalAs(UnmanagedType.LPWStr)] string pwcsName,
        IStorage pstgPriority, uint grfMode, IntPtr snbExclude, uint reserved, out IStorage ppstgOpen);
    [DllImport("gdi32.dll")]
    static extern IntPtr SetWinMetaFileBits(uint nSize, byte[] lpMeta, IntPtr hdcRef, IntPtr lpMFP);

    [ComImport, Guid("0000000B-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IStorage {
        void CreateStream([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, uint grfMode, uint r1, uint r2, out IStream ppstm);
        void OpenStream([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, IntPtr r1, uint grfMode, uint r2, out IStream ppstm);
        void CreateStorage([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, uint grfMode, uint r1, uint r2, out IStorage ppstg);
        void OpenStorage([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, IStorage pstgPriority, uint grfMode, IntPtr snbExclude, uint reserved, out IStorage ppstg);
        void CopyTo(uint ciidExclude, IntPtr rgiidExclude, IntPtr snbExclude, IStorage pstgDest);
        void MoveElementTo([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, IStorage pstgDest, [MarshalAs(UnmanagedType.LPWStr)] string pwcsNewName, uint grfFlags);
        void Commit(uint grfCommitFlags);
        void Revert();
        void EnumElements(uint reserved1, IntPtr reserved2, uint reserved3, out IEnumSTATSTG ppenum);
        void DestroyElement([MarshalAs(UnmanagedType.LPWStr)] string pwcsName);
        void RenameElement([MarshalAs(UnmanagedType.LPWStr)] string pwcsOldName, [MarshalAs(UnmanagedType.LPWStr)] string pwcsNewName);
        void SetElementTimes([MarshalAs(UnmanagedType.LPWStr)] string pwcsName, IntPtr pctime, IntPtr patime, IntPtr pmtime);
        void SetClass(ref Guid clsid);
        void SetStateBits(uint grfStateBits, uint grfMask);
        void Stat(out System.Runtime.InteropServices.ComTypes.STATSTG pstatstg, uint grfStatFlag);
    }

    [ComImport, Guid("0000000D-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IEnumSTATSTG {
        [PreserveSig]
        int Next(uint celt, [MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 0), Out] System.Runtime.InteropServices.ComTypes.STATSTG[] rgelt, out uint pceltFetched);
        void Skip(uint celt);
        void Reset();
        void Clone(out IEnumSTATSTG ppenum);
    }

    const uint STGM_READ_EXCL = 0x00000010; // STGM_READ | STGM_SHARE_EXCLUSIVE

    static string Lesbar(string name) {
        var sb = new System.Text.StringBuilder();
        foreach (char c in name) sb.Append(c < ' ' ? '_' : c);
        return sb.ToString();
    }

    // Sucht die Signatur einer OLE-Compound-Datei (D0 CF 11 E0 A1 B1 1A E1).
    // Manche Exporte (z. B. RSAX-Wrapper) betten das Compound File mit Versatz ein.
    static int FindCfbOffset(byte[] d) {
        for (int i = 0; i + 8 <= d.Length; i++) {
            if (d[i] == 0xD0 && d[i+1] == 0xCF && d[i+2] == 0x11 && d[i+3] == 0xE0 &&
                d[i+4] == 0xA1 && d[i+5] == 0xB1 && d[i+6] == 0x1A && d[i+7] == 0xE1) return i;
        }
        return -1;
    }

    // Liest alle Streams einer OLE-Compound-Datei (rekursiv).
    // Faellt zurueck auf: eingebettetes Compound File mit Versatz, dann Rohdaten.
    public static Dictionary<string, byte[]> ReadStreams(string path) {
        var dict = new Dictionary<string, byte[]>();
        string openPath = path;
        string tempPath = null;
        try {
            if (StgIsStorageFile(path) != 0) {
                var raw = File.ReadAllBytes(path);
                int off = FindCfbOffset(raw);
                if (off > 0) {
                    tempPath = Path.GetTempFileName();
                    var inner = new byte[raw.Length - off];
                    Array.Copy(raw, off, inner, 0, inner.Length);
                    File.WriteAllBytes(tempPath, inner);
                    openPath = tempPath;
                } else {
                    dict["(rohdatei)"] = raw;
                    return dict;
                }
            }
            IStorage root;
            int hr = StgOpenStorage(openPath, null, STGM_READ_EXCL, IntPtr.Zero, 0, out root);
            if (hr != 0) { dict["(rohdatei)"] = File.ReadAllBytes(path); return dict; }
            try { Walk(root, "", dict); } finally { Marshal.ReleaseComObject(root); }
            return dict;
        } finally {
            if (tempPath != null) { try { File.Delete(tempPath); } catch {} }
        }
    }

    static void Walk(IStorage stg, string prefix, Dictionary<string, byte[]> dict) {
        IEnumSTATSTG en;
        stg.EnumElements(0, IntPtr.Zero, 0, out en);
        try {
            var arr = new System.Runtime.InteropServices.ComTypes.STATSTG[1];
            uint fetched;
            while (en.Next(1, arr, out fetched) == 0 && fetched == 1) {
                var st = arr[0];
                if (st.type == 2) { // STGTY_STREAM
                    IStream s;
                    stg.OpenStream(st.pwcsName, IntPtr.Zero, STGM_READ_EXCL, 0, out s);
                    try {
                        var buf = new byte[(int)st.cbSize];
                        if (buf.Length > 0) s.Read(buf, buf.Length, IntPtr.Zero);
                        dict[prefix + Lesbar(st.pwcsName)] = buf;
                    } finally { Marshal.ReleaseComObject(s); }
                } else if (st.type == 1) { // STGTY_STORAGE
                    IStorage sub;
                    stg.OpenStorage(st.pwcsName, null, STGM_READ_EXCL, IntPtr.Zero, 0, out sub);
                    try { Walk(sub, prefix + Lesbar(st.pwcsName) + "/", dict); }
                    finally { Marshal.ReleaseComObject(sub); }
                }
            }
        } finally { Marshal.ReleaseComObject(en); }
    }

    // Sucht in einem Byte-Strom nach eingebetteten Metafiles (EMF/WMF).
    public static List<MetaKandidat> FindMetafiles(byte[] d, string streamName) {
        var res = new List<MetaKandidat>();
        for (int i = 0; i + 4 <= d.Length; i++) {
            // EMF: Signatur " EMF" liegt bei Offset 40 des Header-Records
            if (i >= 40 && d[i] == 0x20 && d[i+1] == 0x45 && d[i+2] == 0x4D && d[i+3] == 0x46) {
                int s = i - 40;
                if (s + 52 <= d.Length && BitConverter.ToUInt32(d, s) == 1) {
                    uint nBytes = BitConverter.ToUInt32(d, s + 48);
                    if (nBytes >= 88 && s + nBytes <= d.Length) {
                        var b = new byte[nBytes];
                        Array.Copy(d, s, b, 0, (int)nBytes);
                        res.Add(new MetaKandidat { Art = "emf", Stream = streamName, Bytes = b });
                        i = s + (int)nBytes - 1;
                        continue;
                    }
                }
            }
            // Placeable WMF (Aldus-Header)
            if (d[i] == 0x9A && d[i+1] == 0xC6 && d[i+2] == 0xCD && d[i+3] == 0xD7) {
                int w = i + 22;
                if (w + 18 <= d.Length) {
                    uint mtSize = BitConverter.ToUInt32(d, w + 6);
                    long total = 22 + (long)mtSize * 2;
                    if (mtSize > 9 && i + total <= d.Length) {
                        var b = new byte[total];
                        Array.Copy(d, i, b, 0, (int)total);
                        res.Add(new MetaKandidat { Art = "wmf-placeable", Stream = streamName, Bytes = b });
                        i = i + (int)total - 1;
                        continue;
                    }
                }
            }
            // Standard-WMF: mtType 1/2, mtHeaderSize 9, mtVersion 0x0300
            if ((d[i] == 1 || d[i] == 2) && i + 18 <= d.Length &&
                d[i+1] == 0 && d[i+2] == 9 && d[i+3] == 0 && d[i+4] == 0 && d[i+5] == 3) {
                uint mtSize = BitConverter.ToUInt32(d, i + 6);
                long total = (long)mtSize * 2;
                if (mtSize > 9 && i + total <= d.Length) {
                    var b = new byte[total];
                    Array.Copy(d, i, b, 0, (int)total);
                    res.Add(new MetaKandidat { Art = "wmf", Stream = streamName, Bytes = b });
                }
            }
        }
        return res;
    }

    // Standard-WMF -> EMF-Handle (fuer GDI+)
    public static IntPtr WmfZuEmf(byte[] wmf) {
        return SetWinMetaFileBits((uint)wmf.Length, wmf, IntPtr.Zero, IntPtr.Zero);
    }
}
"@ -ReferencedAssemblies System.Drawing

function Lade-Metafile([MetaKandidat]$k) {
    switch ($k.Art) {
        "emf" {
            $ms = New-Object System.IO.MemoryStream(, $k.Bytes)
            return New-Object System.Drawing.Imaging.Metafile($ms)
        }
        "wmf-placeable" {
            $ms = New-Object System.IO.MemoryStream(, $k.Bytes)
            try { return New-Object System.Drawing.Imaging.Metafile($ms) }
            catch {
                # Fallback: Placeable-Header abschneiden und ueber GDI konvertieren
                $nackt = $k.Bytes[22..($k.Bytes.Length - 1)]
                $h = [OleVz]::WmfZuEmf($nackt)
                if ($h -eq [IntPtr]::Zero) { throw "SetWinMetaFileBits fehlgeschlagen" }
                return New-Object System.Drawing.Imaging.Metafile($h, $true)
            }
        }
        "wmf" {
            $h = [OleVz]::WmfZuEmf($k.Bytes)
            if ($h -eq [IntPtr]::Zero) { throw "SetWinMetaFileBits fehlgeschlagen" }
            return New-Object System.Drawing.Imaging.Metafile($h, $true)
        }
    }
}

# Ermittelt das echte Seitenverhaeltnis (Breite/Hoehe) direkt aus dem Metafile.
# PVerkehr rendert WMFs in eine verzerrte 16:9-Geraetebox; die wahre Proportion
# steht im logischen Fenster (WMF: SetWindowExt-Record 0x020C; EMF: rclFrame).
function Get-MetaRatio([MetaKandidat]$k) {
    try {
        $d = $k.Bytes
        if ($k.Art -eq "emf") {
            # EMF-Header: rclFrame (.01mm) bei Offset 24..39 = left,top,right,bottom
            $l = [BitConverter]::ToInt32($d, 24); $t = [BitConverter]::ToInt32($d, 28)
            $r = [BitConverter]::ToInt32($d, 32); $b = [BitConverter]::ToInt32($d, 36)
            $w = $r - $l; $h = $b - $t
            if ($w -gt 0 -and $h -gt 0) { return $w / $h }
            return $null
        }
        # WMF: ggf. 22-Byte Aldus-Header (placeable) ueberspringen
        $off = 0
        if ($d.Length -gt 22 -and $d[0] -eq 0xD7 -and $d[1] -eq 0xCD -and $d[2] -eq 0xC6 -and $d[3] -eq 0x9A) { $off = 22 }
        $p = $off + 18  # nach dem Standard-WMF-Header beginnen die Records
        $extX = $null; $extY = $null
        while ($p + 6 -le $d.Length) {
            $rsize = [BitConverter]::ToUInt32($d, $p)   # Recordgroesse in WORDs
            if ($rsize -lt 3) { break }
            $func = [BitConverter]::ToUInt16($d, $p + 4)
            if ($func -eq 0x020C) {                      # META_SETWINDOWEXT: y, x
                $extY = [BitConverter]::ToInt16($d, $p + 6)
                $extX = [BitConverter]::ToInt16($d, $p + 8)
            }
            $p += $rsize * 2
        }
        if ($extX -and $extY -and $extY -ne 0) { return [Math]::Abs([double]$extX / $extY) }
    } catch {}
    return $null
}

function Rendere-Png([System.Drawing.Imaging.Metafile]$mf, [string]$ausgabe, [int]$maxDim, $ratio) {
    $w = [double]$mf.Width; $h = [double]$mf.Height
    if ($w -le 0 -or $h -le 0) { throw "Metafile ohne Abmessungen" }
    # Wenn ein echtes Seitenverhaeltnis bekannt ist, dieses verwenden
    # (korrigiert verzerrte WMF-Bounding-Boxen, z. B. Kreis statt Ellipse).
    if ($ratio -and $ratio -gt 0) { $w = $ratio; $h = 1.0 }
    $skala = $maxDim / [Math]::Max($w, $h)
    $bw = [Math]::Max(1, [int][Math]::Round($w * $skala))
    $bh = [Math]::Max(1, [int][Math]::Round($h * $skala))

    $bmp = New-Object System.Drawing.Bitmap($bw, $bh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($mf, (New-Object System.Drawing.Rectangle(0, 0, $bw, $bh)))
    } finally { $g.Dispose() }
    $bmp.Save($ausgabe, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    return "$bw x $bh px"
}

# ---------------------------------------------------------------------

if (-not (Test-Path $Quelle)) { New-Item -ItemType Directory -Force $Quelle | Out-Null }
if (-not (Test-Path $Ziel))   { New-Item -ItemType Directory -Force $Ziel | Out-Null }

$dateien = Get-ChildItem -Path $Quelle -Filter *.ole -File | Sort-Object Name
if (-not $dateien) {
    Write-Host "Keine .ole-Dateien in '$Quelle' gefunden." -ForegroundColor Yellow
    Write-Host "Dateien dort ablegen (Dateiname = Zeichennummer, z. B. 274-30.ole) und Skript erneut starten."
    exit 0
}

$ok = 0; $fehler = 0
foreach ($datei in $dateien) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($datei.Name)
    try {
        $streams = [OleVz]::ReadStreams($datei.FullName)
        $kandidaten = New-Object System.Collections.Generic.List[MetaKandidat]
        foreach ($eintrag in $streams.GetEnumerator()) {
            foreach ($k in [OleVz]::FindMetafiles($eintrag.Value, $eintrag.Key)) { $kandidaten.Add($k) }
        }
        if ($Detail) {
            Write-Host "--- $($datei.Name): Streams = $($streams.Keys -join ', ')"
            foreach ($k in $kandidaten) { Write-Host "    Kandidat: $($k.Art) in '$($k.Stream)' ($($k.Bytes.Length) Bytes)" }
        }
        if (-not $kandidaten.Count) { throw "kein WMF/EMF in der Datei gefunden" }

        # Bester Kandidat: EMF vor WMF, dann groesster zuerst
        $prio = @{ "emf" = 0; "wmf-placeable" = 1; "wmf" = 2 }
        $sortiert = $kandidaten | Sort-Object @{e={ $prio[$_.Art] }}, @{e={ $_.Bytes.Length }; Descending=$true}

        $gerendert = $false
        foreach ($k in $sortiert) {
            try {
                $mf = Lade-Metafile $k
                $ratio = Get-MetaRatio $k
                $ausgabe = Join-Path $Ziel ($name + ".png")
                $masse = Rendere-Png $mf $ausgabe $Groesse $ratio
                $mf.Dispose()
                Write-Host ("OK      {0}  ->  {1}.png  ({2}, aus {3})" -f $datei.Name, $name, $masse, $k.Art) -ForegroundColor Green
                $gerendert = $true
                break
            } catch {
                if ($Detail) { Write-Host "    Kandidat $($k.Art) fehlgeschlagen: $_" -ForegroundColor DarkYellow }
            }
        }
        if (-not $gerendert) { throw "alle Metafile-Kandidaten liessen sich nicht rendern" }
        $ok++
    } catch {
        Write-Host ("FEHLER  {0}: {1}" -f $datei.Name, $_) -ForegroundColor Red
        $fehler++
    }
}

Write-Host ""
Write-Host "Fertig: $ok konvertiert, $fehler fehlgeschlagen. Ausgabe: $Ziel"
if ($fehler -gt 0) { Write-Host "Tipp: mit -Detail erneut ausfuehren, um die Dateistruktur zu sehen." }
