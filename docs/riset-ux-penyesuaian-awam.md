# Riset UX: dari "bisa lihat" ke "bisa ubah sendiri"

*20 November 2026 · lanjutan dari riset "Redesign Studio Rangka" (Desktop)*

## Ringkasan

Riset sebelumnya sudah diterapkan dengan baik: beranda "Mau bikin apa?", atur 4 langkah, slider + angka + tanda ukuran umum, peringatan dengan tombol perbaiki, potongan besi, dan bagikan ke WhatsApp. Orang awam sekarang **bisa memilih dan melihat**.

Celah yang tersisa ada di **mengubah**. Saat ini model 3D hanya untuk dilihat. Semua perubahan terjadi di panel kiri, yang isinya berupa daftar tulisan. Kalau ingin mengubah satu batang, pengguna dilempar ke tampilan 2D yang bentuknya seperti program CAD. Orang awam harus menerjemahkan sendiri "bagian yang saya mau ubah" menjadi "pilihan mana di panel" dan "langkah yang mana".

Arah perbaikannya: **bagian yang dilihat = bagian yang diubah.** Ketuk kaki, lalu pengaturan kaki muncul. Tarik panah tinggi, dan meja ikut meninggi. Setiap pilihan bergambar. Setiap perubahan disorot di 3D dan bisa dibatalkan dengan nama yang jelas.

| # | Perubahan | Dampak untuk orang awam | Usaha |
|---|---|---|---|
| 1 | Gambar kecil di setiap pilihan (model kaki, alas, bentuk) | Tidak perlu menebak arti "kaki U" atau "pedestal" | Kecil: mesin thumbnail sudah ada |
| 2 | Bagian yang berubah disorot sebentar di 3D | Langsung paham pilihan itu mengubah bagian mana | Kecil |
| 3 | Label ukuran (P × L × T) menempel di model 3D | Ukuran terlihat tanpa membaca panel | Kecil–sedang |
| 4 | Ketuk bagian di 3D untuk membuka pengaturannya | Tidak perlu mencari pilihan di 4 langkah | Sedang |
| 5 | Panah tarik di 3D untuk panjang/lebar/tinggi | Mengubah ukuran dengan menarik langsung, seperti benda nyata | Sedang |
| 6 | Pilihan yang tidak tersedia tetap tampil (abu-abu) dengan alasannya | Pengguna tidak bingung karena pilihan "hilang" | Kecil |
| 7 | Riwayat bernama + tombol "kembali ke contoh" per pilihan | Berani mencoba karena tahu caranya kembali | Kecil |
| 8 | "Ketik perubahan" (AI): *"tinggikan 10 cm, tambah rak bawah"* | Orang yang bingung dengan kontrol cukup menulis | Sedang: infrastruktur AI sudah ada |
| 9 | Ubah batang ringan langsung di 3D (geser palang naik/turun, ganti pipa) | Tidak perlu masuk ke tampilan 2D | Sedang–besar |
| 10 | Figur orang 165 cm sebagai pembanding skala | Bisa menilai "sepinggang", "terlalu tinggi" | Kecil |

---

## 1. Kondisi sekarang

Dicek dari kode (`ProductStudio.tsx`, `ParamControl.tsx`, `MemberSheet.tsx`, `ThreeProductScene.tsx`, `products/*.ts`) dan dari screenshot aplikasi yang sedang berjalan (PC 1440 px dan HP).

### Yang sudah bagus (pertahankan)
- **Mulai dari contoh**, bukan dari kosong. Ada 263 desain dan bisa dicari.
- **Kontrol angka**: slider, isian, tombol −/+, dan chip "Ukuran umum: kopi 80 · makan 4 org 120". Ini sudah sesuai riset (slider tidak berdiri sendiri).
- **Peringatan berbahasa awam** dengan tombol perbaiki satu ketuk.
- **Tips 3D** muncul sekali saja, tidak ada tur panjang.
- **Undo** dan simpan otomatis.

### Celah yang menghambat orang awam untuk *mengubah*

| Temuan | Bukti di aplikasi | Akibat untuk orang awam |
|---|---|---|
| **3D hanya untuk dilihat.** Mengetuk batang hanya menampilkan info (panjang, ukuran pipa, tinggi dari lantai) dan dua tombol: *Hapus batang* atau *Ubah di 2D*. | `MemberSheet.tsx` | Pengguna mengetuk kaki karena ingin mengubah kaki, tetapi yang muncul data teknis. Satu-satunya aksi yang mudah justru yang paling merusak (hapus). |
| **Pilihan bentuk hanya berupa tulisan.** "Model kaki", "Alas", "Bentuk daun" tampil sebagai kartu teks. | `ParamControl.tsx` (tipe `choice`), `ParamDef` tidak punya gambar | Istilah seperti *pedestal*, *kaki U*, *tiang ganda*, atau *kaki Z* tidak dipahami orang awam. Mereka harus mencoba satu per satu. |
| **Langkah "Kaki" pada meja berisi hingga 14 pilihan**, dan pilihan muncul atau hilang tergantung pilihan lain (`showIf`). Meja, kursi, dan rak partisi berisi 13–14 pilihan per langkah. | `meja.ts` baris 48, `kursi.ts`, `rakPartisi.ts` | Daftar panjang dan berubah-ubah. Pilihan yang dicari (mis. "Kaki tengah") bisa hilang tanpa penjelasan. |
| **Tidak ada tanda bagian mana yang berubah.** Mengubah "Tinggi rak bawah" dari 15 ke 20 cm hanya terlihat sebagai pergeseran kecil di 3D. | `ThreeProductScene.tsx` | Pengguna tidak yakin apakah pilihan itu bekerja, dan tidak belajar hubungan antara pilihan dan bagiannya. |
| **Ukuran tidak terlihat di 3D.** Ukuran hanya ada di judul ("120 × 75 × 75 cm") dan di panel. | Screenshot 3D | Saat memutar model, pengguna tidak bisa mengaitkan angka dengan bagian. |
| **Lompatan besar ke tampilan 2D.** Isinya: *Magnet ON*, *Grid 1 cm*, *Palang kiri–kanan*, *Batang miring*, daftar "Y 72.5 / X 108 / Z 63", dan label *OTOMATIS*. Begitu satu batang diubah, rangka tidak lagi mengikuti pengaturan ukuran. | Screenshot 2D, `FrameEditor2D.tsx` | Bagi orang awam ini adalah tembok. Tidak ada jalan tengah antara "pilih dari daftar" dan "gambar teknik". |
| **Undo tanpa nama.** Tombol Undo ada, tetapi pengguna tidak tahu langkah apa yang akan dibatalkan. Tidak ada cara kembali ke nilai contoh untuk satu pilihan saja. | Header studio | Pengguna takut mencoba-coba. |
| **3D kecil di HP**: tinggi 38% layar, dan panel pengaturan perlu digulir. | `h-[38dvh]` di `ProductStudio.tsx` | Riset menyarankan area 3D minimal sekitar 50%. Saat menggeser slider, pengguna tidak melihat hasilnya kalau panel sudah digulir. |
| **Tidak ada pembanding skala** (orang, kursi). | `ThreeProductScene.tsx` | Sulit menilai apakah 105 cm itu "setinggi perut" atau "setinggi dada". |

> Catatan: screenshot HP dari Chrome headless terlihat terpotong di kanan. Penyebabnya adalah batas lebar jendela minimum Chrome headless di Windows (±500 px), bukan bug aplikasi.

---

## 2. Apa kata riset

**Direct manipulation (manipulasi langsung).** Menurut NN/g, pengguna bertindak langsung pada objek yang terlihat, dengan aksi yang bertahap, bisa dibatalkan, dan hasilnya langsung tampak. Konsep ini dicetuskan Shneiderman pada awal 1980-an. Manfaatnya: lebih sedikit yang perlu dipelajari, ada umpan balik instan, dan pengguna terdorong untuk bereksplorasi. Kelemahannya: butuh ketelitian, sehingga **harus selalu ada cara lain yang presisi** (isian angka). → Panah tarik di 3D *ditambah* isian angka yang sudah ada, bukan menggantikannya.

**Pemula butuh panduan, ahli butuh kebebasan.** Panduan konfigurator untuk pelanggan langsung menyebut bahwa mayoritas pengunjung adalah pengguna pertama kali. Mereka butuh panduan, bukan fitur untuk pengguna mahir. Konfigurasi bebas paling cocok untuk ahli. → Langkah-langkah tetap jadi jalur utama. Ketuk di 3D menjadi jalan pintas ke langkah yang tepat, dan 2D tetap menjadi "mode bengkel".

**Jelaskan pilihan yang tidak tersedia.** Konfigurator yang baik membuat aksi berikutnya jelas. Jika suatu pilihan tidak tersedia, sampaikan dan jelaskan alasannya dengan bahasa sederhana. → Ganti `showIf` (menyembunyikan) dengan "nonaktif + alasan" untuk pilihan penting.

**Pilihan visual lebih baik daripada teks.** Pengujian Baymard menunjukkan bahwa variasi visual sebaiknya tampil sebagai gambar atau contoh warna, bukan teks, supaya mudah dibandingkan. → Gambar kecil untuk setiap pilihan bentuk.

**Kapan memakai slider.** Slider cocok untuk nilai kontinu yang ingin dicoba bolak-balik sambil melihat hasilnya langsung. Untuk sedikit pilihan, tampilkan semua pilihan sekaligus. Slider di layar sentuh kurang presisi. → Pola sekarang sudah benar. Untuk angka kecil seperti "Jumlah tingkat 1–6", tombol angka (1 2 3 4 5 6) lebih mudah daripada slider.

**Hotspot pada model.** Pola umum di Vectary, Epicor, dan Unity Forma: penanda 2D menempel di bagian model, selalu menghadap kamera, dan saat diketuk membuka panel pilihan tanpa meninggalkan tampilan. → Ini dasar fitur "ketuk bagian untuk mengubah".

**Umpan balik instan.** Cylindo menyarankan perubahan dipicu saat jari menyentuh layar (touch-down), bukan saat dilepas, agar terasa langsung. Kecepatan juga penting: konfigurator yang sempurna tapi lambat akan ditinggalkan (Smashing Magazine).

**Undo mendorong eksplorasi.** Aturan emas Shneiderman: aksi yang bisa dibatalkan mengurangi kecemasan dan mendorong pengguna mencoba pilihan yang belum dikenal. Syaratnya, undo harus selalu bisa diandalkan. → Riwayat bernama dan tombol kembali ke contoh.

**Bahasa alami untuk *maksud*, angka untuk *besaran*.** Riset ParSEL (pengeditan bentuk dengan bahasa) menyimpulkan bahwa bahasa bagus untuk menyampaikan *apa* yang diubah, tetapi buruk untuk *seberapa banyak*. Solusinya: teks menentukan pilihan mana yang berubah, lalu angkanya ditampilkan untuk diatur. Marxent bahkan mematenkan konfigurator berbasis chat. → "Ketik perubahan" menghasilkan *usulan perubahan* yang bisa dicek, bukan langsung mengubah desain.

**Pelajaran dari IKEA Planner.** Peserta studi pemula menyukai bisa mengubah panjang dan posisi dinding dengan mudah, tetapi kurang puas saat harus mengubah atau memperbaiki denah. Keluhan umum lainnya: fitur sulit ditemukan, dan panel pengisi ditambahkan otomatis tanpa pemberitahuan. → Setiap perubahan otomatis harus diumumkan dan bisa dibatalkan.

---

## 3. Rancangan perbaikan

### 3.1 Gambar di setiap pilihan bentuk *(prioritas 1)*
- Tambahkan `preview?: boolean` pada `ParamDef` bertipe `choice`. Gambar kecil dibuat otomatis dengan `build({...params, [key]: option.value})` memakai `three/thumbnails.ts` yang sudah dipakai untuk kartu beranda. Tidak perlu menggambar manual, dan langsung berlaku untuk ke-30 produk.
- Kartu pilihan menjadi: gambar (±72 px) + nama + satu baris keterangan.
- Gambar disimpan di cache per `(produk, sidik rangka, nilai)` supaya tidak dirender ulang.

### 3.2 Sorot bagian yang berubah *(prioritas 1)*
- Saat pilihan berubah, bandingkan daftar batang lama dan baru (posisi/panjang). Batang yang berubah atau baru diberi warna sorot (biru/oranye) selama ±1 detik, lalu memudar.
- Arahkan pandangan ke langkah "Tinggi rak bawah": kamera tidak digerakkan, cukup bagiannya yang disorot.
- Di PC: saat kursor berada di atas kartu pilihan, bagian terkait ikut disorot (*hover preview*).

### 3.3 Label ukuran menempel di 3D *(prioritas 1)*
- Garis ukuran P, L, dan T di sekitar model (seperti gambar 2D, tetapi di 3D), dengan label yang selalu menghadap kamera.
- Bisa disembunyikan lewat tombol "Ukuran" di bilah tampilan (3D / Depan / Samping / …).

### 3.4 Ketuk bagian → buka pengaturannya *(prioritas 2)*
- Setiap batang sudah punya `role` (kaki, rangka atas, palang, rak, dll.). Petakan role ke pilihan: `kaki → modelKaki, tinggi, sudutKaki`; `papan → papan, warna`; `rak → jumlah tingkat, jarak`; `roda → ukuranRoda, remRoda`.
- Kartu yang muncul saat bagian diketuk diubah dari "info teknis + Hapus" menjadi:
  - **Judul awam**: "Kaki meja"
  - **2–4 pilihan terkait langsung di kartu**, memakai `ParamControl` yang sama
  - "Info bengkel" (panjang potong, ukuran pipa) dilipat kecil di bawah
  - "Hapus batang" dan "Ubah di mode bengkel" dipindah ke menu ⋯
- Di HP, kartu menjadi panel bawah setengah layar (non-modal), 3D tetap terlihat di atasnya.

### 3.5 Panah tarik untuk ukuran utama *(prioritas 2)*
- Tiga pegangan bulat di ujung garis ukuran (kanan = panjang, depan = lebar, atas = tinggi). Tarik untuk mengubah. Nilai mengikuti `step` dan menempel ke tanda "Ukuran umum" (mis. tinggi menempel ke 75 "makan").
- Angka tampil besar selama menarik ("Tinggi 82 cm"). Isian di panel tetap sebagai cara presisi.
- Kamera berhenti berputar selama pegangan ditarik. Di HP, pegangan minimal 44 px.

### 3.6 Pilihan nonaktif dengan alasan *(prioritas 1)*
- Tambahkan `disabledIf?: (p) => string | null` di samping `showIf`. Pilihan penting yang tidak berlaku tetap tampil abu-abu dengan alasannya, misalnya *"Kaki tengah — hanya untuk kaki lurus. [Ganti ke kaki lurus]"*.
- `showIf` tetap dipakai untuk sub-pilihan yang jelas, seperti "Tinggi rak bawah" yang hanya muncul jika "Rak bawah" menyala.

### 3.7 Langkah panjang dibagi "Utama" dan "Lainnya" *(prioritas 2)*
- Maksimal 5–6 pilihan terlihat. Sisanya ada di "Pilihan lainnya (8)" yang bisa dibuka. Ini tetap hanya dua tingkat, sesuai batas NN/g.
- Angka kecil (jumlah tingkat, jumlah papan) memakai tombol angka 1–6, bukan slider.

### 3.8 Riwayat bernama + kembali ke contoh *(prioritas 1)*
- Riwayat undo menyimpan label, misalnya "Tinggi 75 → 85 cm" atau "Rak bawah: nyala". Tombol Undo menampilkan tooltip/toast "Batalkan: Tinggi 75 → 85 cm".
- Ikon ↺ kecil di samping pilihan yang nilainya berbeda dari contoh yang dipilih: "kembali ke 75 cm".
- Tombol "Bandingkan dengan contoh awal": tekan dan tahan untuk melihat versi awal di 3D.

### 3.9 Ketik perubahan (AI) *(prioritas 3)*
- Kotak "Mau diubah apa?" di atas panel: *"lebih tinggi 10 cm, kakinya pakai roda, warna putih"*.
- AI (provider di `src/ai/` yang sudah dipakai untuk foto) menerima daftar `params` + nilai sekarang, lalu mengembalikan `{ key: nilai }` yang dibersihkan dengan `cleanParams` yang sudah ada.
- Hasilnya **ditampilkan dulu sebagai usulan**: "Tinggi 75 → 85 cm · Pakai roda: nyala · Warna: putih", dengan tombol [Terapkan] dan [Batal]. Bagian terkait disorot di 3D. Teks menyampaikan maksud, sedangkan angkanya tetap bisa diatur sebelum diterapkan (pendekatan ParSEL).

### 3.10 Ubah batang ringan tanpa ke 2D *(prioritas 3)*
- Untuk batang yang dipilih: **geser naik/turun** (palang, rak) dengan panah ▲▼ di 3D, **ganti ukuran pipa batang ini**, **hapus**, dan **cerminkan ke sisi lain**.
- Perubahan ini disimpan sebagai *penyesuaian* di atas rangka otomatis, bukan mengubah seluruh rangka menjadi manual. Dengan begitu, slider ukuran tetap bekerja. Ini perubahan arsitektur terbesar, sehingga dikerjakan terakhir.
- Tampilan 2D diberi nama **"Mode bengkel"** dan istilahnya dirapikan: *Magnet* → "Tempel ke batang lain", *Grid* → "Langkah geser", koordinat X/Y/Z → "tinggi dari lantai / jarak dari kiri".

### 3.11 Figur skala *(prioritas 2)*
- Siluet orang 165 cm (dan kursi untuk meja) di samping model, bisa disembunyikan. Riset sebelumnya juga menyarankan ini, tetapi belum dikerjakan.

### 3.12 HP
- Area 3D minimal 50% saat pengguna mengubah ukuran. Panel bisa diciutkan ke "mode intip" yang hanya menampilkan pilihan aktif (mis. hanya slider Tinggi).
- Tombol Kembali di HP menutup panel/kartu, bukan meninggalkan studio.

---

## 4. Urutan pengerjaan

| Fase | Isi | Kenapa duluan |
|---|---|---|
| **1 · Paham apa yang diubah** | 3.1 gambar pilihan · 3.2 sorot perubahan · 3.3 label ukuran 3D · 3.6 nonaktif + alasan · 3.8 riwayat bernama & ↺ | Usaha kecil, berlaku untuk 30 produk sekaligus, tanpa mengubah struktur data desain |
| **2 · Ubah langsung di 3D** | 3.4 ketuk bagian · 3.5 panah tarik · 3.7 Utama/Lainnya · 3.11 figur skala · 3.12 HP | Inti dari "tidak cuma melihat". Membutuhkan pemetaan role → pilihan per produk |
| **3 · Jalan pintas** | 3.9 ketik perubahan (AI) | Infrastruktur AI sudah ada. Sebaiknya setelah fase 1, supaya hasilnya bisa disorot |
| **4 · Mode bengkel ramah** | 3.10 ubah batang ringan · ganti istilah di 2D | Menyentuh format data `frame` dan logika otomatis/manual. Paling berisiko |

---

## 5. Cara menguji dengan orang awam

Lima orang yang belum pernah memakai aplikasi ini (bukan tukang las). Satu sesi per orang, ±20 menit, rekam layar, dan minta mereka berpikir sambil bersuara.

| Tugas | Berhasil jika |
|---|---|
| "Buat meja makan untuk 6 orang, tingginya seperti meja makan biasa." | Panjang ±180 dan tinggi ±75 tercapai tanpa bantuan |
| "Tambahkan tempat menaruh barang di bawah meja." | Menemukan "Rak bawah" kurang dari 1 menit |
| "Ganti kakinya jadi satu tiang di tengah." | Memilih pedestal tanpa mencoba-coba lebih dari 2 pilihan |
| "Naikkan palang bawah sedikit." | Berhasil tanpa masuk tampilan 2D (setelah fase 4) |
| "Kembalikan seperti semula." | Memakai Undo/↺ dengan yakin |
| "Kirim desain ini ke tukang las lewat WA." | Menemukan tombol bagikan |

Yang dicatat untuk setiap tugas: berhasil/tidak, waktu, jumlah salah ketuk, dan kalimat bingung yang diucapkan. Ulangi tes setelah setiap fase. Target: 4 dari 5 orang menyelesaikan setiap tugas tanpa bantuan.

---

## Sumber

- NN/g — Direct Manipulation: https://www.nngroup.com/articles/direct-manipulation/
- Nielsen — Direct Manipulation (kelemahan & alternatif presisi): https://www.uxtigers.com/post/direct-manipulation
- NN/g — Progressive Disclosure: https://www.nngroup.com/videos/progressive-disclosure/
- IxDF — Progressive Disclosure (staged disclosure / wizard): https://ixdf.org/encyclopedia/progressive_disclosure.html
- NN/g — Customization Usability (laporan): https://www.nngroup.com/reports/customization-features/
- CPQ — How to Design 3D Configurators for Direct Customer Use: https://cpqhelp.zendesk.com/hc/en-us/articles/25665072099853-How-to-Design-3D-Configurators-for-Direct-Customer-Use
- CPQ — Hotspots: https://cpqhelp.zendesk.com/hc/en-us/articles/25664978839053-Hotspots
- Vectary — Hotspots: https://help.vectary.com/documentation/3d-configurator/hotspots
- Unity Forma — Hotspots: https://docs.unity3d.com/Packages/com.unity.industrial.forma@4.3/manual/forma-hotspots.html
- Baymard — Mobile interactive color swatches: https://baymard.com/blog/mobile-interactive-color-swatches
- ShapeDiver — Sliders in product configurators: https://shapediver.com/blog/sliders-in-product-configurators
- Smashing Magazine — Designing A Perfect Configurator UX: https://smashingmagazine.com/2018/02/designing-a-perfect-responsive-configurator
- Cylindo — Anatomy of a high-converting product configurator: https://blog.cylindo.com/the-anatomy-of-a-high-converting-product-configurator
- commerce-ui — 5 best product configurator experiences (ulasan Tylko): https://commerce-ui.com/insights/5-best-product-configurator-experiences-with-examples
- ar-range — Structuring a configurator UI for mobile: https://www.ar-range.app/solutions/knowledge-base/how-to-structure-a-configurator-ui-for-mobile-devices
- Onshape — Mastering gestures on mobile: https://www.onshape.com/en/resource-center/tech-tips/tech-tip-mastering-gestures-mobile
- ICS — Shneiderman Golden Rule 6 (easy reversal): https://www.ics.com/blog/eight-golden-rules-rule-6-permit-easy-reversal-actions-0
- Alan Dix — risiko undo: https://alandix.com/academic/talks/risk/
- ParSEL — Parameterized Shape Editing with Language: https://arxiv.org/pdf/2405.20319
- Marxent — Chat based product configurator (paten): https://patents.justia.com/patent/12614218
- Eurographics 2006 — studi pemula IKEA Office Planner: https://diglib7.eg.org/bitstream/handle/10.2312/pt20061557/225-228.pdf
- House Digest — tips IKEA Kitchen Planner: https://housedigest.com/1632701/how-use-ikea-kitchen-planner-tips-home-design
- Pratt IxD — Design critique IKEA Kreativ: https://ixd.prattsi.org/2024/02/design-critique-ikea-kreativ-ios-app/
