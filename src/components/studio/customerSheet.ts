import { CostReport, rupiah } from '../../products/common';
import { barsNeeded } from '../../products/cutting';
import { PriceSettings } from '../../products/pricing';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Lembar A4 untuk pemesan: gambar 3D, ukuran, rincian biaya, belanja bahan (dicetak lewat dialog Simpan sebagai PDF) */
export function customerSheetHtml(opts: {
  title: string;
  summary: string;
  image: string | null;
  cost: CostReport;
  prices: PriceSettings;
  url: string;
}): string {
  const { title, summary, image, cost, prices, url } = opts;
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = cost.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.label)}<div class="g">${l.group}</div></td><td class="n">${l.qty.toLocaleString('id-ID')} ${l.unit}</td><td class="n">${rupiah(l.price)}</td><td class="n b">${rupiah(l.subtotal)}</td></tr>`
    )
    .join('');
  const bars = cost.plan.map((p) => `${barsNeeded(p, prices.stockCm)} batang hollow ${p.profile} mm`).join(' · ');
  const hasLabor = cost.total !== cost.materialTotal;

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)} - Ringkasan</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}body{font-family:"Segoe UI",Arial,sans-serif;color:#1c1917;font-size:11pt;margin:0}
h1{font-size:20pt;margin:0 0 2mm}.sub{color:#57534e;margin:0 0 6mm}
.top{display:flex;gap:8mm;align-items:flex-start}.img{flex:1;border:1px solid #d6d3d1;border-radius:3mm;overflow:hidden;background:#eeece7}
.img img{width:100%;display:block}.facts{width:62mm}
.total{font-size:22pt;font-weight:700;margin:1mm 0}.k{color:#78716c;font-size:9pt;text-transform:uppercase;letter-spacing:.06em}
.stat{border-top:1px solid #e7e5e4;padding:2mm 0}.stat b{display:block;font-size:12pt}
table{width:100%;border-collapse:collapse;margin-top:6mm}th{text-align:left;font-size:8.5pt;color:#78716c;text-transform:uppercase;border-bottom:1.5px solid #a8a29e;padding:2mm}
td{border-bottom:1px solid #e7e5e4;padding:2mm;vertical-align:top}.n{text-align:right;white-space:nowrap}.b{font-weight:700}.g{font-size:8pt;color:#a8a29e}
tfoot td{font-weight:700;border-top:1.5px solid #a8a29e}.note{font-size:8.5pt;color:#78716c;margin-top:4mm}
.foot{margin-top:6mm;font-size:8.5pt;color:#78716c;word-break:break-all}
</style></head><body>
<h1>${esc(title)}</h1><p class="sub">${esc(summary)} · ${date}</p>
<div class="top">
  <div class="img">${image ? `<img src="${image}" alt="Gambar 3D">` : '<div style="padding:30mm;text-align:center;color:#a8a29e">Gambar 3D tidak tersedia</div>'}</div>
  <div class="facts">
    <div class="k">Perkiraan biaya${hasLabor ? '' : ' bahan'}</div><div class="total">± ${rupiah(cost.total)}</div>
    <div class="stat">Belanja pipa<b>${bars}</b></div>
    <div class="stat">Berat rangka<b>± ${cost.weightKg.toLocaleString('id-ID')} kg</b></div>
    <div class="stat">Titik sambungan las<b>${cost.weldJoints}</b></div>
    <div class="stat">Luas yang dicat<b>${cost.paintM2.toLocaleString('id-ID')} m²</b></div>
  </div>
</div>
<table><thead><tr><th>Barang</th><th class="n">Jumlah</th><th class="n">Harga satuan</th><th class="n">Subtotal</th></tr></thead>
<tbody>${rows}</tbody><tfoot><tr><td colspan="3">Total</td><td class="n">${rupiah(cost.total)}</td></tr></tfoot></table>
<p class="note">Perkiraan dari harga pasar 2024–2025 (atau harga yang diisi bengkel). Harga bisa berbeda per daerah${hasLabor ? '' : '; belum termasuk ongkos las dan ongkos kirim'}.</p>
<p class="foot">Desain dibuat dengan Studio Rangka. Buka desain: ${esc(url)}</p>
</body></html>`;
}
