# Exploration: identifiziert die LZSS-Variante der RSAXCDRC-Kompression
# durch Known-Plaintext-Angriff auf den OLE-Compound-Header.
param([string]$Datei = "C:\Users\npetri\VZK App\assets\zeichen-ole\StVO4551-31.OLE")

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;

public static class CdrcProbe {

    // Bekannte Bytes des Klartexts (OLE-Compound-Header, -1 = beliebig)
    public static int[] Constraints() {
        var p = new int[76];
        for (int i = 0; i < p.Length; i++) p[i] = -1;
        int[] sig = {0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1};
        for (int i = 0; i < 8; i++) p[i] = sig[i];
        for (int i = 8; i < 24; i++) p[i] = 0;          // CLSID = 0
        p[24]=0x3E; p[25]=0; p[26]=3; p[27]=0;          // Version 3.62
        p[28]=0xFE; p[29]=0xFF;                          // Byte-Order
        p[30]=9; p[31]=0; p[32]=6; p[33]=0;             // Sektor-Shifts
        for (int i = 34; i < 44; i++) p[i] = 0;          // reserved + csectDir(v3)
        for (int i = 52; i < 56; i++) p[i] = 0;          // Transaktionssignatur
        p[56]=0; p[57]=0x10; p[58]=0; p[59]=0;          // MiniSectorCutoff 4096
        for (int i = 72; i < 76; i++) p[i] = 0;          // csectDif
        return p;
    }

    public static byte[] Decode(byte[] src, int start, bool flagWord, bool lsbFirst,
                                bool oneIsLiteral, int refMode, int minLen,
                                bool absolute, int winInit, int wpStart, int outLimit) {
        var outBuf = new List<byte>();
        var win = new byte[4096];
        for (int i = 0; i < 4096; i++) win[i] = (byte)winInit;
        int wp = wpStart;
        int pos = start;
        while (pos < src.Length && outBuf.Count < outLimit) {
            uint flags; int nItems;
            if (flagWord) {
                if (pos + 1 >= src.Length) break;
                flags = (uint)(src[pos] | (src[pos+1] << 8)); pos += 2; nItems = 16;
            } else { flags = src[pos]; pos += 1; nItems = 8; }
            for (int b = 0; b < nItems && pos < src.Length && outBuf.Count < outLimit; b++) {
                bool bit = lsbFirst ? ((flags >> b) & 1) == 1 : ((flags >> (nItems-1-b)) & 1) == 1;
                if (bit == oneIsLiteral) {
                    byte c = src[pos++];
                    outBuf.Add(c); win[wp & 0xFFF] = c; wp++;
                } else {
                    if (pos + 1 >= src.Length) { pos = src.Length; break; }
                    int b1 = src[pos], b2 = src[pos+1]; pos += 2;
                    int dist, len;
                    switch (refMode) {
                        case 0: dist = b1 | ((b2 & 0xF0) << 4); len = (b2 & 0x0F) + minLen; break;
                        case 1: dist = ((b1 & 0xF0) << 4) | b2; len = (b1 & 0x0F) + minLen; break;
                        case 2: dist = b1 | ((b2 & 0x0F) << 8); len = ((b2 >> 4) & 0x0F) + minLen; break;
                        case 3: dist = b2 | ((b1 & 0x0F) << 8); len = ((b1 >> 4) & 0x0F) + minLen; break;
                        case 4: dist = b1 + 1; len = b2 + minLen; break;
                        case 5: dist = b2 + 1; len = b1 + minLen; break;
                        default: dist = 1; len = minLen; break;
                    }
                    if (absolute) {
                        for (int k = 0; k < len; k++) {
                            byte c = win[(dist + k) & 0xFFF];
                            outBuf.Add(c); win[wp & 0xFFF] = c; wp++;
                        }
                    } else {
                        if (dist <= 0) dist = 1;
                        for (int k = 0; k < len; k++) {
                            int p = outBuf.Count - dist;
                            byte c = p >= 0 ? outBuf[p] : (byte)winInit;
                            outBuf.Add(c); win[wp & 0xFFF] = c; wp++;
                        }
                    }
                }
            }
        }
        return outBuf.ToArray();
    }

    public static List<string> BruteForce(byte[] src) {
        var constraints = Constraints();
        var res = new List<string>();
        int[] starts = {28, 30};
        int[] refModes = {0,1,2,3,4,5};
        int[] minLens = {1,2,3};
        int[] winInits = {0x00, 0x20};
        foreach (int start in starts)
        foreach (bool flagWord in new[]{false,true})
        foreach (bool lsb in new[]{false,true})
        foreach (bool oneLit in new[]{false,true})
        foreach (int rm in refModes)
        foreach (int ml in minLens)
        foreach (bool abs in new[]{false,true})
        foreach (int wi in winInits)
        foreach (int wp in abs ? new[]{0, 4078} : new[]{0}) {
            byte[] outBuf;
            try { outBuf = Decode(src, start, flagWord, lsb, oneLit, rm, ml, abs, wi, wp, 76); }
            catch { continue; }
            if (outBuf.Length < 60) continue;
            int score = 0, total = 0;
            for (int i = 0; i < outBuf.Length && i < constraints.Length; i++) {
                if (constraints[i] < 0) continue;
                total++;
                if (outBuf[i] == constraints[i]) score++;
            }
            if (total > 0 && score >= total - 4) {
                res.Add(string.Format(
                    "TREFFER score={0}/{1} start={2} flagWord={3} lsb={4} oneIsLit={5} refMode={6} minLen={7} abs={8} winInit={9} wpStart={10}",
                    score, total, start, flagWord, lsb, oneLit, rm, ml, abs, wi, wp));
            }
        }
        return res;
    }
}
"@

$b = [System.IO.File]::ReadAllBytes($Datei)
$src = $b[0..([Math]::Min($b.Length, 4000) - 1)]
$treffer = [CdrcProbe]::BruteForce($src)
if ($treffer.Count) { $treffer } else { "Keine Parametrisierung erfuellt die Klartext-Bedingungen." }
