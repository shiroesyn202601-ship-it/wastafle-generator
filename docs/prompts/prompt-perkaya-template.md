PERKAYA KATEGORI & TEMPLATE FURNITUR RANGKA BESI — kerjakan dengan beberapa agent (use a workflow / fan out agents)

## Konteks repo
- Produk ada di `src/products/*.ts`, didaftarkan di `src/products/index.ts` (PRODUCTS, PRODUCT_LIST, CATEGORIES di Beranda) dan `ProductId` di `src/products/types.ts`.
- Aturan inti dari `types.ts`: **satu template (Preset) = satu STRUKTUR rangka**. Variasi yang hanya beda ukuran / warna / bahan / jumlah tingkat BUKAN template baru — masukkan ke `sizes` di template yang sama. Sub-kategori pakai `groups` + `preset.group`. Tiap produk wajib punya `signature(p)`, dan dua template dalam satu produk tidak boleh punya sidik yang sama.
- Pola yang ditiru: `rakBaju.ts`, `pembatas.ts`, `rak.ts`, `kursi.ts` (params, steps, build → members/boards/casters, checks, summary). Helper umum ada di `common.ts`.
- Produk yang SUDAH ADA (jangan dibuat ulang): meja, kursi, rak (termasuk sub-kategori rak-gudang, rak-sepatu, rak tangga), rak-tanaman, troli, meja-piknik, meja-dinding, meja-bar, booth, rak-dinding, papan-menu, pembatas, rak-baju, dipan.

## Warna bawaan (WAJIB untuk semua produk & template baru)
Sama seperti gambar contoh kursi bersandaran tangan:
- rangka hitam → `warna: '#1f2226'`
- papan coklat kayu → `papan: 'kayu'`
Jangan menimpa warna/papan di `params` preset kecuali memang struktur yang membutuhkan (mis. plat besi).

## Pembagian agent

### Agent 1 — Auditor (read-only, jalan PERTAMA)
Baca semua file `src/products/*.ts`. Buat daftar lengkap: tiap produk → group → template (id, nama, desc, ciri struktur rangka dalam 1 kalimat). Output ini jadi "daftar larangan" untuk agent lain. Tandai juga kategori yang hanya ada sebagai sub-kategori (mis. rak sepatu di dalam `rak`) supaya agent riset bisa memutuskan apakah layak dinaikkan jadi produk sendiri.

### Agent 2 — Riset kategori baru (jalan setelah Agent 1)
Cari kategori furnitur rangka besi hollow + papan kayu yang BELUM ADA. Contoh arah (bukan wajib, cek dulu ke daftar Agent 1):
rak partisi ruangan (room divider rak dua muka — beda dari `pembatas` tanaman), rak sepatu khusus (kalau layak jadi produk sendiri), rak TV / bufet, meja rias, nakas, rak piring & dapur, rak galon / dispenser, rak microwave & oven, rak handuk / kamar mandi, gantungan mantel berdiri, rak sepeda, rak display / gondola toko, lemari loker rangka, meja laptop sofa (C-table), kursi teras / lounge, ayunan / bangku gantung, rak kayu bakar, meja setrika/laundry.
Kriteria lolos: bisa dibuat tukang las (pipa kotak + papan), dipakai orang awam / UMKM Indonesia, dan TIDAK bisa dicapai hanya dengan mengubah parameter produk yang sudah ada.
Output: 5–8 kategori terpilih, masing-masing dengan alasan kenapa bukan duplikat produk lama, parameter utama, dan 2–4 sub-kategori (groups).

### Agent 3..N — Desainer template (satu agent per kategori baru, paralel)
Untuk kategorinya, kumpulkan sampai **20 template yang strukturnya benar-benar berbeda**. Tiap template wajib menyebut ciri struktur yang membedakannya (mis. "kaki A miring + palang X belakang", "tiang tunggal tengah + lengan kantilever", "rangka tangga bersandar", "gantung plafon", "beroda + pegangan dorong"). Lalu implementasikan:
- file `src/products/<kategori>.ts` + `signature()` yang benar,
- daftarkan di `types.ts` (ProductId), `index.ts` (PRODUCTS, PRODUCT_LIST, CATEGORIES Beranda dengan ikon SVG 60×40),
- ukuran umum masuk `sizes`, bukan template baru,
- `checks()` dengan peringatan bahasa awam + perbaikan satu ketuk.
Agent ini HANYA menulis file kategorinya sendiri; perubahan `types.ts`/`index.ts` dikumpulkan dan digabung oleh sesi utama supaya tidak bentrok.

### Agent terakhir — Penjaga keunikan (adversarial, jalan setelah desainer)
Periksa SEMUA template baru, terhadap sesama template di kategori itu DAN terhadap semua template lama di produk lain. Untuk tiap pasangan yang mirip, putuskan:
- sama struktur, beda ukuran/tingkat/warna/papan → gabungkan jadi `sizes`, hapus template-nya;
- sama dengan template di produk lain → HAPUS (jangan ditambahkan);
- ragu → hapus.
Cek juga `signature()` tidak ada yang kembar. Lebih baik 12 template unik daripada 20 yang mirip-mirip — angka 20 adalah target, bukan kewajiban.

## Selesai bila
- `npm run lint` dan `npm run build` lolos.
- Tiap template baru tampil benar di 3D dengan rangka hitam + papan coklat.
- Laporan akhir: tabel kategori baru → jumlah template → daftar template yang DIBUANG beserta alasannya (mirip dengan apa).
- Commit + push.
