# PROMPT — Perkaya Kategori & Template Furnitur Rangka Besi

> Kerjakan dengan **workflow multi-agent** (use a workflow / fan out agents).
> Tujuan: aplikasi punya **banyak kategori baru** dan **banyak template yang bentuk rangkanya benar-benar berbeda**, tanpa satu pun desain kembar, di dalam satu kategori maupun antar kategori.

---

## 0. Konteks repo (baca dulu, jangan ditebak)

| Hal | Lokasi |
|---|---|
| Satu produk = satu file | `src/products/<id>.ts` (contoh pola: `rakBaju.ts`, `pembatas.ts`, `rak.ts`, `kursi.ts`) |
| Daftar produk & menu Beranda | `src/products/index.ts` → `PRODUCTS`, `PRODUCT_LIST`, `CATEGORIES` |
| Tipe | `src/products/types.ts` → `ProductId`, `Preset`, `PresetGroup`, `signature` |
| Helper | `src/products/common.ts` → `memberFactory()`, `casterSet()`, opsi pipa/papan/warna |
| Bentuk batang | `FrameMember` di `src/types/kitchen.ts` |

**Kemampuan generator (batas desain yang boleh dibuat):**
- batang pipa kotak / persegi panjang (20×20, 20×40, 30×30, 40×40 …), **tegak, mendatar, atau miring** (`end`);
- papan datar **kotak atau bundar**, boleh diputar miring (`rotX`), boleh ikut engsel (`attachTo`), boleh plat besi (`steelMm`) atau warna khusus (busa jok);
- roda (`casters`), engsel lipat (`hinges`), menempel tembok (`wall: true`).

Bentuk lengkung, anyaman rotan, laci tertutup, pintu kaca, dan ukiran **tidak bisa dibuat**. Desain yang butuh itu tidak boleh dipakai, atau harus disederhanakan jadi batang lurus + papan.

**Produk yang sudah ada:** meja, kursi, rak (sub: rak-gudang, rak-sepatu, tangga), rak-tanaman, troli, meja-piknik, meja-dinding, meja-bar, booth, rak-dinding, papan-menu, pembatas, rak-baju, dipan.

---

## 1. Aturan mutlak

1. **Warna bawaan** sama dengan contoh kursi bersandaran tangan: rangka hitam `warna: '#1f2226'`, papan coklat kayu `papan: 'kayu'`. Semua `defaults` produk baru pakai ini. Preset tidak boleh menimpanya kecuali strukturnya memang butuh (mis. plat besi).
2. **1 template = 1 struktur rangka.** Beda ukuran, jumlah tingkat, warna, papan, atau pipa **bukan** template baru. Itu masuk `sizes` di template yang sama.
3. **1 desain = 1 kategori.** Satu bentuk rangka hanya boleh ada di satu produk di seluruh aplikasi. Dua desain di kategori berbeda yang bentuknya sama (hanya beda nama atau fungsi) adalah duplikat: pilih satu kategori, hapus yang lain. Jalan pintas Beranda (`{ product, preset }`) boleh dipakai sebagai pengganti, asal bukan salinan template.
4. **Ragu = buang.** Lebih baik 12 template yang jelas beda daripada 20 yang mirip-mirip. Angka 20 adalah target, bukan kewajiban.
5. Bahasa di UI: Indonesia sehari-hari untuk orang awam dan tukang las (nama, `desc`, `help`, `checks`).
6. **Sambungan harus bisa dilas tukang las sungguhan.** Dua batang tidak boleh menempati ruang yang sama.
   - Ujung batang menempel RATA di sisi batang lain (butt joint), tidak masuk ke dalamnya dan tidak menonjol keluar.
   - Dua batang yang bersilangan di ketinggian/bidang sama: satu menerus, yang lain dipotong dua dan dilas di kedua sisinya, ATAU satu diletakkan di atas/samping yang lain.
   - Utamakan batang sejajar sumbu. Batang miring hanya bila bentuknya memang miring (kaki A, kaki X, sandaran), dan ujungnya dipotong rata dengan lantai / sisi batang yang ditemui.
   - Tiang yang berdiri di atas lengan: ujung lengan rata dengan sisi luar tiang.
   - Wajib lolos `npx tsx scripts/cek-sambungan.ts <productId>` (0 sambungan tembus).

---

## 2. Definisi "unik": DNA rangka

Tiap template wajib diberi **DNA rangka**, yaitu nilai di 7 sumbu berikut. Nama dan fungsi **tidak** termasuk DNA.

| Sumbu | Contoh nilai |
|---|---|
| A. Penopang | 4 kaki · kaki tunggal/pedestal · kaki A · kaki U/sled · kaki X · panel samping · tangga bersandar · gantung plafon · tempel dinding · kantilever |
| B. Geometri kaki | tegak · melebar · miring satu arah · bersilang |
| C. Penguat | tanpa · palang H · palang keliling bawah · X belakang · diagonal samping · rangka kotak tertutup |
| D. Susunan papan | 1 bidang · susun rata · susun bertangga · zig-zag/selang-seling · dua muka · L/sudut · papan miring · gantungan (tanpa papan) |
| E. Mobilitas | diam · roda · lipat · bongkar pasang · putar |
| F. Tumpuan tembok | berdiri bebas · bersandar · dibaut ke tembok · di plafon |
| G. Elemen khusus | sandaran · pijakan · pegangan dorong · pipa gantung · pagar/rel pinggir · lubang/slot · meja menyatu |

**Dua template dianggap BEDA bila DNA-nya berbeda di minimal 2 sumbu, atau di sumbu A saja.** Kalau tidak, gabungkan jadi `sizes`. `signature(p)` di kode harus mencerminkan sumbu-sumbu ini.

---

## 3. Cara mencari kategori baru

Jangan langsung menebak dari ingatan. Agent riset wajib menyisir **tiga lensa** berikut lalu menggabungkannya:

**Lensa 1 — Ruang × Kegiatan.** Buat matriks:
- Ruang rumah: teras, ruang tamu, ruang makan, dapur, kamar tidur, kamar anak, kamar mandi, tempat cuci/jemur, garasi, taman, rooftop.
- Ruang usaha: cafe, warung/angkringan, minimarket, butik, salon/barbershop, bengkel, laundry, kantor, sekolah, klinik, hotel/kos, gudang, pasar/lapak, food court.
- Kegiatan: menyimpan · memajang · duduk · bekerja · makan · menggantung · membatasi ruang · mengangkut · merawat tanaman/hewan.

Isi tiap sel dengan furnitur rangka besi + papan yang dipakai di situ.

**Lensa 2 — Kata kunci pasar.** Cari istilah yang benar-benar dipakai penjual dan pembeli, misalnya: "rak besi hollow", "meja industrial", "rak partisi", "rak display", "rak galon", "rak microwave", "rak helm", "rak sepeda", "gantungan mantel berdiri", "meja rias minimalis", "nakas besi", "rak TV industrial", "rak piring besi", "rak handuk berdiri", "rak bumbu", "meja laptop sofa", "rak loker", "rak pot susun".

**Lensa 3 — Celah katalog.** Bandingkan hasil lensa 1–2 dengan daftar Auditor, lalu temukan apa yang belum ada.

**Contoh arah** (cek dulu ke daftar Auditor): rak partisi ruangan (dua muka, beda dari `pembatas` tanaman), rak sepatu sebagai produk sendiri, rak TV/bufet, meja rias, nakas, rak piring & dapur, rak galon/dispenser, rak microwave/oven, rak handuk & kamar mandi, gantungan mantel berdiri, rak helm & sepeda, gondola/display toko, rak loker, meja laptop sofa (C-table), kursi teras/lounge, ayunan/bangku gantung, rak jemuran, rak kayu bakar, meja setrika/laundry, rak hewan (kandang/rak akuarium), rak bengkel/perkakas.

**Skor tiap kandidat (0–3 per butir), lolos bila total ≥ 10 dan tidak ada butir bernilai 0:**
1. Bisa dibuat dengan batas generator (bagian 0).
2. Dicari orang awam / UMKM Indonesia (lensa 2).
3. **Tidak** bisa dicapai hanya dengan mengubah parameter produk lama.
4. Punya cukup ruang variasi struktur (minimal 10 DNA berbeda terbayang).
5. Parameternya jelas untuk orang awam (ukuran standar, pemakaian).

**Target:** 8–12 kategori baru. Masing-masing punya 2–5 sub-kategori (`groups`) berdasarkan pemakaian.

---

## 4. Cara mencari template di satu kategori

1. **Daftar ukuran standar dulu** (mis. galon 27×27×50, microwave 50×40×30, TV 43"/55"). Ukuran masuk `sizes`, bukan template.
2. **Bangkitkan kandidat dari sumbu DNA**, bukan dari nama. Mulai dari tiap nilai sumbu A (penopang), lalu kombinasikan dengan D (susunan papan) dan E/F/G. Tulis 30–40 kandidat.
3. **Saring:** buang yang tidak bisa dibuat generator, tidak masuk akal secara konstruksi, atau DNA-nya sama dengan kandidat lain atau template lama di produk mana pun.
4. **Pilih maksimal 20** dengan sebaran seluas mungkin. Sumbu A minimal 5 nilai berbeda di satu kategori, dan tidak boleh lebih dari 4 template dengan nilai sumbu A yang sama.
5. Tiap template wajib punya: `id` kebab-case, `name` pendek, `desc` = ciri struktur dalam 1 kalimat (bukan ukuran), `params`, `sizes` (1–4 ukuran umum), `group`.

---

## 5. Pembagian agent & urutan

| Fase | Agent | Tugas | Menulis file? |
|---|---|---|---|
| 1 | **Auditor** | Data semua produk → group → template, lengkap dengan DNA 7 sumbu. Tandai template lama yang sudah kembar antar produk. Output = "daftar larangan". | Tidak |
| 2 | **Riset kategori** | Bagian 3: tiga lensa + skor. Output: 8–12 kategori lolos (id, nama, tagline, alasan bukan duplikat, parameter utama, groups) + daftar kandidat yang DITOLAK beserta alasannya. | Tidak |
| 3 | **Desainer** (1 agent per kategori, paralel) | Bagian 4, lalu implementasi `src/products/<id>.ts` lengkap: params, steps (ukuran/bentuk/bahan/tambahan), defaults (warna hitam + kayu), presets, groups, `signature`, `build`, `checks` (peringatan awam + perbaikan satu ketuk), `summary`. Kembalikan juga potongan untuk `types.ts` & `index.ts` (termasuk ikon SVG 60×40). | Hanya file kategorinya sendiri |
| 4 | **Penjaga keunikan** (bukan desainer) | Bandingkan DNA template baru antar sesama dan terhadap daftar larangan. Gabungkan ke `sizes`, hapus, atau pindahkan sesuai aturan 1–4. | Ya |
| 5 | **Sesi utama** | Gabungkan `types.ts`, `index.ts`, dan menu Beranda (`CATEGORIES`: kelompokkan ke judul yang pas atau buat judul baru, mis. "Dapur & kamar mandi", "Toko & display"). | Ya |
| 6 | **Recheck lintas kategori** (agent baru, belum pernah melihat desainnya) | Dari nol, untuk SEMUA template lama + baru: tulis bentuk rangka dalam 1 kalimat netral tanpa nama fungsi → kelompokkan yang sama/hampir sama → sisakan 1 per kelompok sesuai aturan 3 → ulangi sampai bersih. Lalu cek `signature()` tidak ada yang kembar dalam satu produk. | Ya |
| 7 | **Verifikasi** | `npm run lint` + `npm run build`. Buka tiap template baru di 3D: rangka hitam, papan coklat, tidak ada batang melayang/tembus, papan menempel di rangka. | Perbaikan saja |

**Cara memilih kategori yang dipertahankan saat ada duplikat:** (1) nama yang paling dicari orang awam untuk bentuk itu, (2) kalau seri, kategori yang lebih lama, (3) yang dihapus boleh diganti jalan pintas Beranda.

---

## 6. Selesai bila

- [ ] Ada 8–12 kategori baru, masing-masing 2–5 groups, dan idealnya 12–20 template unik.
- [ ] Semua `defaults` memakai `warna: '#1f2226'` + `papan: 'kayu'`.
- [ ] Tidak ada dua template (lama maupun baru) yang DNA/bentuknya sama, baik dalam satu kategori maupun lintas kategori.
- [ ] `npm run lint` dan `npm run build` lolos, dan semua template tampil benar di 3D.
- [ ] Laporan akhir berisi:
  1. tabel kategori baru → groups → jumlah template;
  2. tabel template → DNA 7 sumbu;
  3. kandidat kategori yang ditolak + alasannya;
  4. template yang dibuang/digabung + "mirip dengan apa, di kategori mana";
  5. duplikat lama yang ditemukan saat recheck + keputusannya.
- [ ] Commit + push.
