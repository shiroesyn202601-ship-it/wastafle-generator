import { KitchenConfig, FrameMember, FrameMemberRole, SECTION_KIND_LABELS } from '../types/kitchen';
import { getFrameMembers, getFootMembers, getMemberEndCuts, describeEndCut, endCutShapeKey, EndCut, FRAME_ROLE_LABELS, AXIS_LABELS } from './frameLayout';
import { describeCountertop, describeCabinetFinish, describeFrame } from './finishes';

export interface HollowCutPiece {
  id: string;
  category: 'tiang-vertikal' | 'gelagar-panjang' | 'palang-kedalaman' | 'penyangga-wastafel' | 'penyangga-kompor' | 'kustom';
  label: string;
  qty: number;
  lengthCm: number;
  tubeSizeMm: number;
  notes: string;
  weldPosition?: string;
  memberIds?: string[]; // id batang rangka dalam kelompok ini (untuk gambar posisi)
  endCuts?: [EndCut, EndCut]; // bentuk potongan ujung awal & akhir
}

export interface PanelCutPiece {
  id: string;
  name: string;
  qty: number;
  widthCm: number;
  heightCm: number;
  thickMm: number;
  material: string;
  notes: string;
}

export interface CutListReport {
  totalSteelLengthM: number;
  standard6mBarsNeeded: number;
  wastePercentage: number;
  levelingFeetCount: number;
  hollowPieces: HollowCutPiece[];
  panelPieces: PanelCutPiece[];
}

/**
 * Calculates exact cutting list of hollow steel tubes and cabinetry panels
 */
export function calculateFabricationCutList(config: KitchenConfig): CutListReport {
  const W = config.totalWidth;
  const D = config.totalDepth;
  const H = config.totalHeight;
  const topThick = config.countertopThickness || 4;
  const plinthH = (config.plinthHeight ?? 10);
  const tubeMm = config.frame?.tubeSize || 40;
  const tubeCm = tubeMm / 10;
  const colCount = config.columns.length;

  const hollowPieces: HollowCutPiece[] = [];

  // Kelompokkan batang rangka (otomatis / hasil Editor Rangka 2D) berdasarkan fungsi, sumbu, panjang & ukuran pipa
  const members = getFrameMembers(config);
  const endCuts = getMemberEndCuts(config, members);
  const groups = new Map<string, FrameMember[]>();
  members.forEach((m) => {
    const cutKey = endCutShapeKey(endCuts.get(m.id)!);
    const key = `${m.role}|${m.axis}|${m.length.toFixed(1)}|${m.tubeSize || tubeMm}|${cutKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  });

  const roleOrder: FrameMemberRole[] = ['post', 'rail-x', 'rail-z', 'sink-cradle', 'stove-cradle', 'custom'];
  const categoryOf: Record<FrameMemberRole, HollowCutPiece['category']> = {
    post: 'tiang-vertikal',
    'rail-x': 'gelagar-panjang',
    'rail-z': 'palang-kedalaman',
    'sink-cradle': 'penyangga-wastafel',
    'stove-cradle': 'penyangga-kompor',
    custom: 'kustom',
  };
  const fmtPos = (m: FrameMember) => `X=${m.x} Y=${m.y} Z=${m.z}`;

  [...groups.entries()]
    .sort((ga, gb) => {
      const ra = roleOrder.indexOf(ga[1][0].role);
      const rb = roleOrder.indexOf(gb[1][0].role);
      return ra !== rb ? ra - rb : gb[1][0].length - ga[1][0].length;
    })
    .forEach(([key, list], idx) => {
      const first = list[0];
      const names = [...new Set(list.map((m) => m.label).filter(Boolean))];
      const positions = list.slice(0, 6).map(fmtPos).join('; ') + (list.length > 6 ? ` … (+${list.length - 6})` : '');
      const cuts = endCuts.get(first.id)!;
      const cutText = `Ujung: ${describeEndCut(cuts[0], first.axis)} / ${describeEndCut(cuts[1], first.axis)}.`;
      hollowPieces.push({
        id: `grp-${idx}-${key}`,
        category: categoryOf[first.role],
        label: `${FRAME_ROLE_LABELS[first.role]} – ${AXIS_LABELS[first.axis]}`,
        qty: list.length,
        lengthCm: Number(first.length.toFixed(1)),
        tubeSizeMm: first.tubeSize || tubeMm,
        notes: `${names.length > 0 ? names.slice(0, 4).join(', ') + (names.length > 4 ? ', …' : '') + '. ' : ''}Pipa ${first.tubeSize || tubeMm}×${first.tubeSize || tubeMm} mm. ${cutText}`,
        weldPosition: `Titik awal as (cm, X dari kiri, Y dari lantai, Z dari belakang): ${positions}`,
        memberIds: list.map((m) => m.id),
        endCuts: cuts,
      });
    });

  // Calculate total meters and 6m bars
  const totalLengthCm = hollowPieces.reduce((sum, item) => sum + item.qty * item.lengthCm, 0);
  const totalSteelLengthM = Number((totalLengthCm / 100).toFixed(2));
  const wastePercentage = 12; // 12% kerugian pemotongan
  const standard6mBarsNeeded = Math.ceil((totalSteelLengthM * (1 + wastePercentage / 100)) / 6);
  const levelingFeetCount = getFootMembers(config, members).length;


  // Panel Cutting List (Multiplex 18mm & 9mm)
  const cabinetFinishName = describeCabinetFinish(config);
  const panelPieces: PanelCutPiece[] = [];
  const carcaseH = H - topThick - plinthH;
  const carcaseD = D - (config.countertopOverhangFront || 2);

  // 1. End Cover Panels (2 pcs)
  panelPieces.push({
    id: 'panel-sides',
    name: 'Panel Penutup Samping Luar (Kiri & Kanan)',
    qty: 2,
    widthCm: Number((carcaseD + 2).toFixed(1)),
    heightCm: Number(carcaseH.toFixed(1)),
    thickMm: 18,
    material: 'Multiplex 18mm + Laminasi HPL Luar & Dalam',
    notes: 'Menutup penuh rangka samping hingga rata muka laci (flush finish)',
  });

  // 2. Bottom Carcase Panel
  panelPieces.push({
    id: 'panel-bottom',
    name: 'Panel Alas Bawah Kabinet',
    qty: 1,
    widthCm: Number((W - 4).toFixed(1)),
    heightCm: Number(carcaseD.toFixed(1)),
    thickMm: 18,
    material: 'Multiplex 18mm + HPL Putih / Melaminto',
    notes: 'Dipasang di atas gelagar rangka bawah',
  });

  // 3. Sekat Vertikal Antar Kolom
  if (colCount > 1) {
    panelPieces.push({
      id: 'panel-dividers',
      name: 'Panel Sekat Pembatas Vertikal Kolom',
      qty: colCount - 1,
      widthCm: Number((carcaseD - 1).toFixed(1)),
      heightCm: Number((carcaseH - 2).toFixed(1)),
      thickMm: 18,
      material: 'Multiplex 18mm + Melaminto',
      notes: 'Pemisah antar kompartemen laci & pintu',
    });
  }

  // 4. Panel Muka Laci (Drawer Faces)
  config.columns.forEach((col, idx) => {
    if (col.type === 'drawers' && col.drawers) {
      col.drawers.forEach((dr, dIdx) => {
        const kind = dr.kind || 'drawer';
        if (kind === 'open' || kind === 'empty') return;
        const isDouble = kind === 'door-double';
        panelPieces.push({
          id: `drawer-face-${col.id}-${dr.id}`,
          name: `${kind === 'drawer' ? 'Muka Laci' : SECTION_KIND_LABELS[kind]} Kolom ${idx + 1} (${dr.name || `Baris #${dIdx + 1}`})`,
          qty: isDouble ? 2 : 1,
          widthCm: Number((isDouble ? (col.width - 0.6) / 2 : col.width - 0.4).toFixed(1)),
          heightCm: Number((dr.height - 0.4).toFixed(1)),
          thickMm: 18,
          material: `Multiplex 18mm + ${cabinetFinishName}`,
          notes:
            kind === 'drawer'
              ? `Edging keliling 2mm. Celah antar muka laci disetel 3mm.`
              : kind === 'false-panel'
              ? 'Panel mati dipasang tetap (tidak dibuka)'
              : `Engsel sendok slow motion ${isDouble ? '2 pasang' : '1 pasang'}`,
        });
      });
    } else if (col.type === 'door-double' || col.type === 'sink-cabinet') {
      panelPieces.push({
        id: `door-double-${col.id}`,
        name: `Pintu Ganda Kolom ${idx + 1} (Kiri & Kanan)`,
        qty: 2,
        widthCm: Number(((col.width - 0.6) / 2).toFixed(1)),
        heightCm: Number((carcaseH - 0.4).toFixed(1)),
        thickMm: 18,
        material: `Multiplex 18mm + ${cabinetFinishName}`,
        notes: `Engsel sendok slow motion 2 pasang`,
      });
    } else if (col.type.startsWith('door-single') || col.type === 'gas-compartment') {
      panelPieces.push({
        id: `door-single-${col.id}`,
        name: `Pintu Tunggal Kolom ${idx + 1}`,
        qty: 1,
        widthCm: Number((col.width - 0.4).toFixed(1)),
        heightCm: Number((carcaseH - 0.4).toFixed(1)),
        thickMm: 18,
        material: `Multiplex 18mm + ${cabinetFinishName}`,
        notes: `Bukaan swing sesuai tipe kolom`,
      });
    }
  });

  return {
    totalSteelLengthM,
    standard6mBarsNeeded,
    wastePercentage,
    levelingFeetCount,
    hollowPieces,
    panelPieces,
  };
}

/**
 * Builds standard compliant HTML document content for Word (.doc) export
 */
export function generateDocHtml(config: KitchenConfig): string {
  const cutList = calculateFabricationCutList(config);
  const W = config.totalWidth;
  const D = config.totalDepth;
  const H = config.totalHeight;
  const topThick = config.countertopThickness || 4;
  const plinthH = (config.plinthHeight ?? 10);
  const tubeMm = config.frame?.tubeSize || 40;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const clearanceGap = Math.round(
    config.stove.posX > config.sink.posX
      ? config.stove.posX - config.stove.width / 2 - (config.sink.posX + config.sink.width / 2)
      : config.sink.posX - config.sink.width / 2 - (config.stove.posX + config.stove.width / 2)
  );

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>SURAT PERINTAH KERJA (SPK) & MANUAL FABRIKASI MEJA WASTAFEL</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    @page WordSection1 {
      size: 21cm 29.7cm;
      margin: 1.2cm 1.2cm 1.2cm 1.2cm;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #222222;
      background-color: #ffffff;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 {
      font-size: 18pt;
      color: #0f172a;
      margin: 0 0 4pt 0;
      font-weight: bold;
      border-bottom: 2pt solid #2563eb;
      padding-bottom: 6pt;
    }
    h2 {
      font-size: 13pt;
      color: #1e3a8a;
      margin: 18pt 0 6pt 0;
      border-bottom: 1pt solid #cbd5e1;
      padding-bottom: 3pt;
    }
    h3 {
      font-size: 11pt;
      color: #0f172a;
      margin: 12pt 0 4pt 0;
    }
    p, li {
      margin: 0 0 6pt 0;
    }
    .badge {
      display: inline-block;
      padding: 2pt 6pt;
      background-color: #eff6ff;
      border: 1pt solid #93c5fd;
      border-radius: 4pt;
      font-size: 9pt;
      font-weight: bold;
      color: #1d4ed8;
    }
    .alert-box {
      background-color: #f8fafc;
      border-left: 4pt solid #2563eb;
      padding: 8pt 12pt;
      margin: 10pt 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0 14pt 0;
      font-size: 10pt;
    }
    th, td {
      border: 1pt solid #cbd5e1;
      padding: 6pt 8pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .highlight {
      background-color: #fef3c7 !important;
      font-weight: bold;
    }
    .num {
      text-align: right;
      font-family: 'Consolas', monospace;
    }
    .footer-note {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 24pt;
      border-top: 1pt solid #e2e8f0;
      padding-top: 6pt;
    }
    .sign-block {
      width: 100%;
      margin-top: 30pt;
      page-break-inside: avoid;
    }
    .sign-block td {
      border: none;
      text-align: center;
      padding: 10pt;
      width: 33%;
    }
  </style>
</head>
<body>
<div class="WordSection1">

  <!-- KOP DOKUMEN -->
  <div style="text-align: right; font-size: 9pt; color: #64748b; margin-bottom: 8pt;">
    Dokumen Kontrak & Fabrikasi Teknik | Tanggal: <strong>${currentDate}</strong>
  </div>

  <h1>SURAT PERINTAH KERJA (SPK) & MANUAL PEMBUATAN MEJA WASTAFEL & KOMPOR</h1>
  <p style="color: #475569; font-size: 10.5pt; margin-bottom: 12pt;">
    Dokumen acuan resmi untuk Bengkel Las Rangka Besi Hollow, Bengkel Finishing Kabinet Plywood/HPL, dan Pemasangan Top Table Marmer/Granit.
  </p>

  <div class="alert-box">
    <strong>RINGKASAN UTAMA UKURAN MEJA DAPUR:</strong><br/>
    • <strong>Panjang Total (Width):</strong> ${W} cm (${(W / 100).toFixed(2)} meter)<br/>
    • <strong>Kedalaman Meja (Depth):</strong> ${D} cm (Standar ergonomis: 60 cm)<br/>
    • <strong>Tinggi Meja (Height):</strong> ${H} cm (Tinggi kerja nyaman dari lantai)<br/>
    • <strong>Tebal Top Table:</strong> ${topThick} cm | <strong>Tinggi Kaki / Plinth:</strong> ${plinthH > 0 ? `${plinthH} cm (${config.legType === 'frame' ? 'kaki dari rangka' : config.legType === 'feet' ? 'kaki stel terbuka' : 'plinth tertutup'})` : 'tanpa kaki'}<br/>
    • <strong>Rangka Utama:</strong> ${describeFrame(config)}${config.frame?.customLayout ? ' (layout rangka manual)' : ''} ukuran <strong>${tubeMm}×${tubeMm} mm</strong><br/>
    • <strong>Finishing Kabinet:</strong> ${describeCabinetFinish(config)} | <strong>Top Table:</strong> ${describeCountertop(config)}
  </div>

  <!-- BAGIAN 1: DAFTAR POTONGAN BESI HOLLOW (CUTTING LIST BENGKEL LAS) -->
  <h2>1. DAFTAR POTONGAN BESI HOLLOW (CUTTING LIST BENGKEL LAS)</h2>
  <p>
    Gunakan profil pipa <strong>Besi Hollow Kotak ${tubeMm}×${tubeMm} mm</strong> (Tebal plat minimal disarankan 1.4 mm – 1.6 mm agar kuat menahan beban marmer dan air wastafel).
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 30%;">Bagian / Komponen Rangka</th>
        <th style="width: 10%; text-align: center;">Jumlah (Pcs)</th>
        <th style="width: 15%; text-align: right;">Panjang Tiap Potongan</th>
        <th style="width: 40%;">Posisi Pemasangan & Keterangan Pengelasan</th>
      </tr>
    </thead>
    <tbody>
      ${cutList.hollowPieces
        .map(
          (piece, idx) => `
        <tr ${piece.category.startsWith('penyangga') ? 'class="highlight"' : ''}>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${piece.label}</strong></td>
          <td style="text-align: center; font-weight: bold;">${piece.qty} pcs</td>
          <td class="num"><strong>${piece.lengthCm} cm</strong> (${piece.lengthCm * 10} mm)</td>
          <td>${piece.notes}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
    <tfoot>
      <tr style="background-color: #f1f5f9; font-weight: bold;">
        <td colspan="2" style="text-align: right;">TOTAL ESTIMASI PANJANG BESI:</td>
        <td colspan="2" class="num" style="color: #2563eb; font-size: 11pt;">${cutList.totalSteelLengthM} meter</td>
        <td>
          Dibutuhkan <strong>${cutList.standard6mBarsNeeded} batang</strong> standar 6 meter (faktor sisa potongan/waste ±${cutList.wastePercentage}%).
        </td>
      </tr>
    </tfoot>
  </table>

  <div class="alert-box" style="border-left-color: #d97706; background-color: #fffbeb;">
    <strong>CATATAN KHUSUS BENGKEL LAS (PENGELASAN & LEVELING):</strong><br/>
    1. Pastikan setiap sudut sambungan di-las penuh (full weld) dan di-gerinda rata (flush grind) di sisi atas agar tidak mengganjal marmer.<br/>
    2. ${cutList.levelingFeetCount > 0 ? `Pada bagian bawah tiang vertikal (${cutList.levelingFeetCount} titik tiang), las pelat tutup mur tanam (M10/M12) untuk memasang <strong>${cutList.levelingFeetCount} unit Kaki Adjuster Leveler Stainless/Karet</strong>.` : 'Tidak memakai kaki adjuster: ujung bawah tiang ditutup plat/dop karet langsung menapak lantai.'}<br/>
    3. Oleskan <strong>Epoxy Zinc-Chromate Primer 2 lapis</strong> sebagai lapisan dasar anti-karat sebelum finishing cat doff / powder coating.
  </div>

  <!-- BAGIAN 2: SPESIFIKASI COAKAN TOP TABLE (UNTUK TUKANG MARMER / GRANIT) -->
  <h2>2. GAMBAR ACUAN COAKAN MEJA (UNTUK TUKANG MARMER / TOP TABLE)</h2>
  <p>
    Instruksi lubang CNC / potong basah (waterjet) pada slab marmer/granit ukuran <strong>${W} cm × ${D} cm</strong>:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Perangkat</th>
        <th style="width: 25%;">Dimensi Lubang Bersih</th>
        <th style="width: 25%;">Titik Acuan Dari Sisi Kiri (X)</th>
        <th style="width: 25%;">Tipe Pemasangan & Radius</th>
      </tr>
    </thead>
    <tbody>
      ${
        config.sink.enabled
          ? `
        <tr>
          <td>
            <strong>Wastafel Cuci Piring</strong><br/>
            Model: ${config.sink.model}<br/>
            ${config.sink.brandModel ? `Brand: ${config.sink.brandModel}` : ''}
          </td>
          <td>
            Lebar (P): <strong>${config.sink.width} cm</strong><br/>
            Panjang (L): <strong>${config.sink.length} cm</strong><br/>
            Kedalaman Bak: <strong>${config.sink.bowlDepth} cm</strong>
          </td>
          <td>
            As Pusat: <strong>${config.sink.posX} cm</strong> dari sisi kiri<br/>
            Bibir Kiri Lubang: <strong>${Math.round(config.sink.posX - config.sink.width / 2)} cm</strong><br/>
            As Kedalaman: <strong>${config.sink.posY} cm</strong> dari depan
          </td>
          <td>
            Metode: <strong>${config.sink.mounting === 'undermount' ? 'Undermount (Di bawah marmer, bibir di-bevel halus R10)' : 'Topmount (Drop-in bibir atas)'}</strong><br/>
            Finishing: ${config.sink.finish}<br/>
            Keran: ${config.sink.faucet}
          </td>
        </tr>
      `
          : ''
      }
      ${
        config.stove.enabled
          ? `
        <tr>
          <td>
            <strong>Kompor Tanam (Cooktop)</strong><br/>
            Tipe: ${config.stove.type}<br/>
            ${config.stove.brandModel ? `Brand: ${config.stove.brandModel}` : ''}
          </td>
          <td>
            Lebar Coakan: <strong>${config.stove.width} cm</strong><br/>
            Panjang Coakan: <strong>${config.stove.length} cm</strong><br/>
            Tebal Tanam: <strong>${config.stove.recessDepth} cm</strong>
          </td>
          <td>
            As Pusat: <strong>${config.stove.posX} cm</strong> dari sisi kiri<br/>
            Bibir Kiri Lubang: <strong>${Math.round(config.stove.posX - config.stove.width / 2)} cm</strong><br/>
            As Kedalaman: <strong>${config.stove.posY} cm</strong> dari depan
          </td>
          <td>
            Metode: Drop-in Built-in<br/>
            Kontrol: ${config.stove.hasKnobs ? 'Kenop Logam' : 'Touch Sensor'}<br/>
            Sediakan celah ventilasi bawah kompor minimal 20mm
          </td>
        </tr>
      `
          : ''
      }
    </tbody>
  </table>

  <p>
    <strong>Jarak Aman (Clearance Gap) Antara Lubang Wastafel & Kompor:</strong> 
    <span class="badge">${clearanceGap} cm</span> 
    ${
      clearanceGap >= 40
        ? '(Lolos standar keamanan K3 dapur: cukup aman dari cipratan air ke kompor)'
        : '(PERHATIAN: Jarak wastafel dan kompor cukup dekat, disarankan gunakan sekat akrilik penahan cipratan air)'
    }
  </p>

  <!-- BAGIAN 3: RINCIAN PEMBAGIAN KOLOM LACI & KABINET -->
  <h2>3. RINCIAN PEMBAGIAN KOLOM LACI & KABINET BAWAH</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Kolom</th>
        <th style="width: 18%;">Lebar Kolom</th>
        <th style="width: 25%;">Jenis Modul</th>
        <th style="width: 47%;">Rincian Laci / Rak & Aksesoris</th>
      </tr>
    </thead>
    <tbody>
      ${config.columns
        .map(
          (col, i) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">#${i + 1}</td>
          <td class="num"><strong>${col.width} cm</strong></td>
          <td><strong>${col.type.toUpperCase()}</strong></td>
          <td>
            ${
              col.type === 'drawers' && col.drawers
                ? `Susunan ${col.drawers.length} baris (atas ke bawah):<br/>` +
                  col.drawers
                    .map(
                      (d, di) =>
                        `• ${di + 1}. ${SECTION_KIND_LABELS[d.kind || 'drawer']} (${d.name || '-'}): Tinggi <strong>${d.height} cm</strong>`
                    )
                    .join('<br/>')
                : col.type === 'sink-cabinet'
                ? 'Kompartemen bawah wastafel (pintu ganda), ruang pipa afur & siphon air kotor'
                : col.type === 'gas-compartment'
                ? 'Ruang tabung gas LPG 3kg/12kg, lantai diperkuat & lubang ventilasi belakang'
                : col.type === 'pullout-spice'
                ? 'Rak tarik botol bumbu & minyak goreng (2 tingkat)'
                : `Kabinet pintu dengan ${col.shelfCount || 1} ambalan rak`
            }
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- BAGIAN 4: DAFTAR POTONGAN PANEL PLYWOOD 18MM (UNTUK TUKANG KAYU) -->
  <h2>4. DAFTAR POTONGAN PANEL MULTIPLEX / KABINET (TUKANG KAYU)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 35%;">Nama Panel</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 20%; text-align: right;">Ukuran (Panjang × Tinggi)</th>
        <th style="width: 30%;">Bahan & Finishing</th>
      </tr>
    </thead>
    <tbody>
      ${cutList.panelPieces
        .map(
          (panel, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${panel.name}</strong></td>
          <td style="text-align: center;">${panel.qty} pcs</td>
          <td class="num">${panel.widthCm} × ${panel.heightCm} cm</td>
          <td>${panel.material}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- BAGIAN 5: STANDAR OPERASIONAL PROSEDUR (SOP) PERAKITAN DI BENGKEL -->
  <h2>5. STANDAR OPERASIONAL PROSEDUR (SOP) FABRIKASI & PERAKITAN</h2>
  <ol style="padding-left: 18pt;">
    <li>
      <strong>Pengelasan Rangka (Welding & Leveling):</strong> Rakit rangka utama di atas meja jig rata. Cek kesikuan diagonal 90 derajat dengan mistar siku. Pasang tiang sudut, tiang sekat, dan gelagar memanjang.
    </li>
    <li>
      <strong>Pemasangan Besi Penyangga Wastafel & Kompor:</strong> Las palang penyangga wastafel pada ketinggian sesuai kedalaman bak (${config.sink.bowlDepth} cm) agar bibir wastafel duduk sempurna pada klem marmer. Pasang penyangga kompor tanam.
    </li>
    <li>
      <strong>Anti-Karat & Finishing Rangka:</strong> Lakukan degreasing, ampelas halus, dan semprot Epoxy Primer anti karat. Lanjutkan dengan cat akhir hitam doff / powder coating oven tahan gores.
    </li>
    <li>
      <strong>Fabrikasi Box Laci & Pemasangan Rel:</strong> Gunakan rel laci slow-motion (soft close). Pastikan jarak celah (gap) antar muka laci presisi 2.5 mm – 3.0 mm untuk estetika minimalis modern.
    </li>
    <li>
      <strong>Pemasangan Top Table & Sanitasi:</strong> Berikan lem sealant silikon anti-jamur (kitchen & sanitary grade) di sekeliling sambungan wastafel dan marmer untuk mencegah rembesan air ke dalam laci bawah.
    </li>
  </ol>

  <!-- LEMBAR TANDA TANGAN -->
  <table class="sign-block">
    <tr>
      <td>
        Disetujui Oleh Pemilik:<br/><br/><br/><br/>
        ( _______________________ )<br/>
        Klien / Owner
      </td>
      <td>
        Penanggung Jawab Las Rangka:<br/><br/><br/><br/>
        ( _______________________ )<br/>
        Kepala Bengkel Las
      </td>
      <td>
        Pemasang Kabinet & Top Table:<br/><br/><br/><br/>
        ( _______________________ )<br/>
        Tukang Kayu & Interior
      </td>
    </tr>
  </table>

  <div class="footer-note">
    Dokumen ini dicetak otomatis dari KitchenCraft 3D Studio Studio Desain Wastafel & Meja Kompor Kustom. Ukuran dan toleransi fabrikasi mengacu pada standar SNI mebel interior (±2mm).
  </div>

</div>
</body>
</html>`;
}

/**
 * Prints the same SPK document used for the .doc export through a hidden iframe,
 * so the PDF/print output is a clean paged document instead of the on-screen modal.
 */
export function printDocFile(config: KitchenConfig): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(generateDocHtml(config));
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  setTimeout(() => {
    win.addEventListener('afterprint', () => setTimeout(cleanup, 0));
    win.focus();
    win.print();
    // fallback for browsers that don't fire afterprint
    setTimeout(cleanup, 60000);
  }, 250);
}

/**
 * Initiates download of the formatted .doc file directly in browser
 */
export function downloadDocFile(config: KitchenConfig, filename?: string): void {
  const htmlContent = generateDocHtml(config);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `SPK-Manual-Fabrikasi-Wastafel-${config.totalWidth}cm.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
