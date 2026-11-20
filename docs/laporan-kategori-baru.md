# Laporan: kategori & template baru

Tanggal: 2026-11-20. Dijalankan dari [prompts/prompt-perkaya-template.md](prompts/prompt-perkaya-template.md).

## 1. Kategori baru

| Produk | Nama | Sub-kategori | Template |
|---|---|---|---|
| rak-tv | Rak TV / bufet | bufet-rendah, bufet-panel, stand-tv | 5 |
| rak-partisi | Rak partisi / sekat ruangan | partisi-rak, partisi-bilah, partisi-plafon | 10 |
| gantungan-berdiri | Gantungan berdiri | tiang-tunggal, hall-tree, dinding-bersandar | 13 |
| rak-gondola | Rak display toko / gondola | gondola-tengah, gondola-dinding, display-miring, rak-kasir | 7 |
| gerobak-lapak | Gerobak & meja lapak | gerobak-dorong, booth-bazar, meja-lapak, warung-tenda | 13 |
| rak-sepeda | Rak sepeda & parkir | parkir-lantai, sepeda-dinding, rak-garasi | 11 |
| jemuran | Jemuran & rak handuk | jemuran-berdiri, jemuran-lipat, jemuran-dinding, rak-handuk | 9 |
| rak-kamar-mandi | Rak kamar mandi & laundry | atas-objek, sudut-sela | 9 |
| rak-dapur | Rak dapur: piring, microwave & galon | rak-piring, rak-microwave, rak-bumbu, rak-galon | 7 |

Total: **9 kategori, 84 template**. Semua bawaan rangka hitam #1f2226 + papan kayu.

## 2. Template & DNA rangka

### Rak TV / bufet (rak-tv)

| id | Nama | Bentuk rangka |
|---|---|---|
| kubus | Bufet di atas dua kubus | Dua kotak rangka kubus berpapan berdiri di lantai di kedua ujung, satu papan panjang dibentangkan di atas keduanya, ruang di antara kubus terbuka sampai lantai. |
| menara | Bufet + menara samping | Rak rendah memanjang yang salah satu ujungnya diteruskan ke atas menjadi kolom rak sempit tinggi, tampak depan berbentuk L. |
| bingkai | Bingkai TV (dua menara + jembatan) | Dua kolom rak tinggi di kedua ujung disatukan papan menerus di puncak, rak rendah di antaranya, membentuk bukaan persegi di tengah; punggung kolom diberi silang X. |
| standing | Standing TV beroda | Satu tiang tegak di tengah kaki berbentuk H beroda, di pucuknya rangka palang kecil untuk layar dan di tengah tiang dua lengan pendek menjulur ke depan memikul papan kecil. |
| sandar | Rak TV bersandar tembok | Dua batang panjang miring dari lantai depan sampai menyentuh tembok di atas, di bawahnya satu-dua papan ditopang lengan mendatar dan kaki belakang pendek, di bagian atas dipasang palang mendatar untuk layar. |

### Rak partisi / sekat ruangan (rak-partisi)

| id | Nama | Bentuk rangka |
|---|---|---|
| kotak-tapak | Partisi kotak-kotak | Rak kotak-kotak terbuka dua muka, tiang di setiap batas kolom; hanya tiang paling ujung yang berdiri di batang kaki melintang depan-belakang, tiang tengah menumpu di palang bawah yang menerus. |
| segitiga | Partisi rangka segitiga | Empat tiang di dua ujung berdiri di kaki melintang, papan selebar penuh tiap tingkat, dan di muka depan & belakang batang miring naik-turun membentuk deretan segitiga di antara papan. |
| kubus-tumpuk | Partisi kubus tumpuk | Modul kotak berangka 12 rusuk yang masing-masing berpapan alas, ditumpuk berselang setengah kotak seperti susunan bata sehingga tepi kiri-kanan bergerigi. |
| tiang-berjajar | Partisi tiang berjajar | Deretan tiang tunggal sebaris yang masing-masing berdiri di plat besi, dihubungkan rel atas dan bawah, dengan papan pendek bertumpu lengan kecil di antara dua tiang dan tingginya berselang-seling dari kolom ke kolom. |
| bilah-ambalan | Partisi bilah tegak + ambalan | Dua tiang tunggal di ujung yang berdiri di kaki melintang, rel atas dan bawah, bilah tegak rapat di bidang tengah, dan papan ambalan kecil menempel di kedua sisi bilah. |
| jalusi | Partisi papan miring (jalusi) | Empat tiang di dua ujung berdiri di kaki melintang, di antaranya papan sempit dipasang miring berderet dari bawah sampai atas di atas siku besi miring, seperti kisi jendela nako. |
| panel-lipat | Partisi panel lipat | Dua sampai lima bingkai tegak berisi bilah yang saling disambung engsel di tiang tepinya dan berdiri karena dibuka zig-zag. |
| jepit-plafon | Partisi jepit plafon + rak | Tiang di setiap batas kolom memanjang dari lantai sampai plafon dengan plat di kedua ujung, rak kotak hanya di bagian bawah, dan di atasnya tiang terbuka sampai ring palang dekat plafon. |
| bilah-plafon | Partisi bilah lantai-plafon | Rel lantai dan rel plafon di antara dua tiang ujung yang dijepit, diisi bilah tegak menerus dari lantai sampai plafon, dengan ambalan kecil di kedua sisi. |
| gantung-plafon | Partisi gantung plafon | Bingkai panel berisi bilah tegak yang melayang di atas lantai atau konter dan tergantung dari plafon oleh dua atau tiga batang. |

### Gantungan berdiri (gantungan-berdiri)

| id | Nama | Bentuk rangka |
|---|---|---|
| tiang-plat | Tiang plat bundar | Satu tiang tegak berdiri di atas plat besi bundar, dengan kait pendek menyebar ke segala arah di pucuknya. |
| tripod | Gantungan tripod | Tiga kaki miring dari lantai bertemu di satu titik atas, diteruskan tiang pendek berkait, dan diikat palang segitiga di sepertiga tinggi. |
| pohon | Gantungan pohon bercabang | Tiang tengah ditopang empat kaki miring bentuk bintang, dengan batang cabang miring ke atas di dua sampai tiga tingkat. |
| tiang-helm | Tiang pasak helm | Tiang tengah berdiri di atas tiga kaki datar bentuk Y, dengan pasak panjang mendatar yang berselang arah di tiap tingkat dan papan bundar kecil di pucuk. |
| tiang-payung | Tiang + wadah payung | Kotak rangka rendah dengan dua cincin palang dan plat dasar, serta satu tiang tinggi di tengah sisi belakang kotak yang kaitnya menghadap depan dan samping. |
| jepit-plafon | Tiang jepit plafon | Satu tiang dari lantai sampai plafon yang dijepit plat persegi di kedua ujung, tanpa kaki, dengan kait melingkar di beberapa tingkat. |
| panel-kait | Panel kait hall tree | Dua tiang tegak di atas kaki melintang depan–belakang membentuk bingkai dengan papan punggung tegak, palang mendatar berkait, dan papan atas di atas siku miring. |
| kisi-dua-muka | Kisi kait dua muka | Dua tiang tegak di atas kaki melintang dengan bidang kisi dari jeruji tegak dan palang mendatar terpotong, kait mencuat ke depan dan ke belakang. |
| siku-pojok | Gantungan siku pojok | Tiga tiang tegak membentuk siku L dengan dua sayap palang mendatar berkait yang saling tegak lurus, ditutup papan persegi di atas tiang pojok. |
| menara-4-muka | Menara kait 4 muka | Menara empat tiang ramping berpenampang bujur sangkar dengan cincin palang keliling bertingkat dan kait yang mencuat keluar di keempat sisi, ditutup papan atas. |
| panel-dinding | Panel kait tempel dinding | Bingkai persegi yang dibaut ke tembok di depan papan tegak, dengan palang mendatar berkait dan papan atas di atas siku miring, tanpa menyentuh lantai. |
| tangga-bersandar | Tangga kait bersandar | Dua batang miring bersandar ke tembok dengan anak tangga mendatar yang diberi kait, serta papan datar di pucuk yang menempel tembok. |
| tiang-tembok | Tiang tembok lengan menyebar | Satu tiang dari plat lantai yang menempel tembok, dengan dua sampai tiga lengan mendatar menyebar seperti kipas ke depan di beberapa tingkat. |

### Rak display toko / gondola (rak-gondola)

| id | Nama | Bentuk rangka |
|---|---|---|
| gondola-tengah | Gondola tengah dua muka | Deretan tiang tunggal di garis tengah, masing-masing berdiri di atas satu kaki lantai yang menjorok ke depan dan ke belakang; papan tegak di antara tiang; papan dasar di atas kaki di kedua sisi; lengan mendatar/miring menjulur dari tiang ke depan dan ke belakang membawa papan dengan batang bibir di tepi luar. |
| gondola-dinding | Gondola dinding satu muka | Deretan tiang di garis belakang, tiap tiang berdiri di atas kaki lantai yang hanya menjorok ke depan; papan tegak di antara tiang; papan dasar di atas kaki; lengan menjulur ke depan saja membawa papan berbibir; tanpa tiang depan. |
| gondola-sudut | Gondola sudut (pojok) | Dua deret tiang belakang yang bertemu tegak lurus di satu tiang pojok, tiap tiang di atas kaki lantai yang menjorok ke dalam ruangan; papan tegak di kedua garis belakang; lengan menjulur dari tiang membawa papan berbibir yang bersambung membentuk huruf L. |
| display-miring | Display miring bertingkat | Tiap sisi berupa segitiga dari satu tiang tegak di belakang, satu batang miring dari lantai depan ke puncak tiang dan palang lantai; nampan-nampan miring turun ke depan dibentang dari batang miring ke tiang belakang, makin ke atas makin pendek, masing-masing dengan batang bibir di depan. |
| bak-promo | Bak promo (keranjang) | Dua rel lantai di ujung kiri dan kanan, masing-masing dengan dua tiang; cincin palang di tengah ketinggian membawa papan alas, cincin palang di atas sebagai bibir; keempat sisi di antara kedua cincin diisi batang tegak kecil berjarak ±10 cm. |
| rak-rokok | Rak rokok dinding | Kotak empat tiang pendek yang menggantung di tembok di atas lantai; di dalamnya banyak susun papan pendek yang miring turun ke depan, dibagi kolom oleh tiang sekat tipis di belakang dan batang sekat kecil di depan; papan datar menutup atas. |
| rak-putar | Rak putar kasir | Satu tiang tegak di atas dudukan putar dan plat bundar di lantai; di beberapa ketinggian, empat lengan pendek menjulur dari tiang ke bingkai kotak yang membawa papan di keempat sisi tiang, dengan bibir keliling di tepi tiap nampan. |

### Gerobak & meja lapak (gerobak-lapak)

| id | Nama | Bentuk rangka |
|---|---|---|
| angkringan | Gerobak angkringan | Empat tiang menerus dari rangka lantai sampai atap datar. Dua tiang belakang turun jadi kaki, gagang menjorok di belakang, dan as roda besar ada di bawah 2/3 panjang badan. |
| etalase | Gerobak etalase | Badan kotak pendek berdinding papan dengan kotak pajang kecil di atasnya. Hanya dua tiang belakang yang naik dan memikul kasau atap yang menjorok ke depan dengan siku. Roda besar ada di bawah badan, gagang di belakang. |
| gerobak-pelana | Gerobak display pelana | Empat tiang di atas empat roda putar dengan papan miring turun ke depan dan bibir penahan. Kuda-kuda pelana dan bubungan ada di atas tiang, gagang menjorok dari sisi kiri. |
| booth-kotak | Booth kotak | Empat tiang setinggi atap dengan ring bawah dan ring atap. Meja hanya ada di separuh depan, ditopang dua kaki pendek dan ditutup papan depan, sehingga bagian belakang kosong untuk orang berdiri. Papan tegak dipasang di bawah atap depan. |
| booth-backdrop | Booth backdrop | Dua tiang tinggi di belakang menahan papan tegak lebar dan tritisan pendek bersiku. Dua rel lantai menyambung tiang itu ke kotak meja empat kaki pendek di depan. |
| bazar-lipat | Meja bazar kaki X + spanduk | Meja dengan kaki silang di tiap ujung dan palang di titik silang. Dua tiang tegak menempel di belakang rangka meja, memikul papan tegak dan atap pendek bersiku di pucuk. |
| lapak-miring | Lapak display miring | Kaki depan pendek dan tiang belakang tinggi dengan palang bawah bentuk H. Papan miring turun ke depan dan berbibir. Kasau miring menjorok dari pucuk tiang belakang lewat kaki depan, ditahan siku. |
| lapak-tembok | Lapak tempel tembok | Tiang dibaut ke tembok tanpa kaki lantai. Di tengah tiang ada lengan mendatar bersiku miring yang memikul papan, dan di pucuknya kasau miring bersiku memikul atap yang menjorok melewati papan. |
| lapak-sled | Lapak kaki U beratap | Rel lantai panjang melintang di tiap ujung. Dua tiang per ujung tegak dari rel sampai atap datar, dengan meja dan rak bawah membentang penuh di antara keempat tiang. |
| lapak-payung | Lapak tiang tengah beratap | Satu tiang tebal di plat bundar. Di tengah tiang ada palang silang + bingkai kotak bersiku yang memikul papan kotak kecil, dan di pucuknya bingkai kotak besar bersiku yang memikul papan atap. |
| kanopi-miring | Kanopi atap miring | Empat tiang (enam bila lebar) di plat kaki, tiang depan lebih tinggi dari tiang belakang. Kasau miring menghubungkan keduanya dengan siku di setiap pucuk, dan di atasnya ada satu bidang atap miring tanpa papan lain di bawah. |
| tenda-pelana | Tenda pelana + meja | Empat tiang sama tinggi di plat kaki dengan balok ikat, kuda-kuda dan bubungan pelana di atasnya. Papan memanjang di antara tiang depan ditopang lengan bersiku yang menjorok ke dalam. |
| kanopi-kantilever | Kanopi menjorok (tanpa tiang depan) | Dua tiang (tiga bila lebar) berdiri di tapak lantai panjang bersiku depan-belakang. Kasau miring menjorok jauh ke depan dari pucuk tiang dengan siku, dan bagian depan bebas tanpa tiang. |

### Rak sepeda & parkir (rak-sepeda)

| id | Nama | Bentuk rangka |
|---|---|---|
| sisir | Slot sisir lantai | Dua rel di lantai memanjang, di atasnya berjajar pasangan segitiga tegak (alas melintang, batang tegak, batang miring turun ke depan) yang membentuk celah sempit. |
| dua-sisi | Slot dua sisi | Bingkai persegi di lantai dengan satu tiang di tiap ujung memikul balok atas di tengah; pasangan batang miring naik dari rel depan dan rel belakang secara bergantian menuju balok. |
| gelombang | Rak gelombang zig-zag | Satu garis batang miring naik-turun membentuk gigi gergaji di bidang tegak, tiap titik bawahnya menapak pada batang pendek melintang di lantai. |
| gawang-u | Gawang U berjajar | Beberapa bingkai U terbalik berdiri melintang (dua tiang, palang atas, palang tengah) berjajar dan diikat dua rel lantai memanjang di bawahnya. |
| bintang | Rak bintang melingkar | Tiang pendek di tengah kaki silang memikul cincin kecil di atas; pasangan batang miring memancar turun dari cincin kecil ke cincin besar di lantai. |
| dua-tingkat | Parkir dua tingkat | Empat tiang memikul dua balok atas memanjang; pasangan batang panjang berbaring di lantai dan di atas balok secara bergantian sebagai talang. |
| tiang-dinding | Tiang dinding + kait tegak | Dua tiang menempel tembok dari lantai, palang atas dengan batang pendek menjulur berujung tegak, palang bawah dengan pasangan batang pendek, opsional papan di atas dua lengan pendek. |
| lengan-dinding | Lengan dinding mendatar | Dua tiang pendek menempel tembok diikat palang atas-bawah, dari tiap tiang keluar lengan sedikit menanjak dengan siku miring di bawahnya, bertumpuk beberapa tingkat. |
| plafon | Gantung plafon | Dua balok sejajar menempel plafon diikat palang di ujungnya, dari balok turun batang-batang tegak berpasangan yang ujung bawahnya berkait pendek mengarah ke dalam. |
| lantai-plafon | Tiang lantai–plafon | Dua tiang tegak berdekatan berplat di lantai dan plafon, diikat palang mendatar, dengan lengan bersiku menjulur ke depan dan ke belakang di beberapa ketinggian. |
| gravitasi | Stand tegak (gravitasi) | Bingkai persegi di lantai dengan dua tiang yang condong ke belakang memikul palang atas berkait menjulur, pasangan batang pendek di atas bingkai lantai, opsional papan di puncak. |

### Jemuran & rak handuk (jemuran)

| id | Nama | Bentuk rangka |
|---|---|---|
| rangka-kotak | Jemuran rangka kotak | Empat tiang tegak dengan ring atas yang diisi banyak batang sejajar memanjang, ring kedua opsional di bawahnya, ring keliling dekat lantai. |
| tiang-t | Jemuran tiang T rooftop | Dua sampai empat tiang berjajar di atas plat besi, tiap pucuk punya lengan melintang bertopang miring, batang panjang sejajar diletakkan di atas lengan-lengan itu. |
| payung-putar | Jemuran payung putar | Satu tiang tengah di plat bundar, empat lengan miring naik ke arah sudut dengan topang dari tiang, beberapa cincin persegi bertingkat diikat ke lengan. |
| sayap-x | Jemuran sayap kaki X | Kaki menyilang di kedua ujung menopang bingkai atas berisi batang sejajar, di depan dan belakangnya menempel bingkai sayap berengsel yang bisa ditekuk turun. |
| lengan-dinding | Jemuran lengan dinding lipat | Bingkai kecil dua rel menempel tembok, dari rel atas menjulur beberapa batang tegak lurus tembok yang masing-masing berengsel di pangkalnya. |
| gunting-dinding | Jemuran gunting dinding | Rel tembok di kiri-kanan, dari situ menjulur rangka silang berderet seperti gunting, batang memanjang dipasang di setiap simpul atas silang. |
| gantung-plafon | Jemuran gantung plafon | Dua rel menempel plafon, empat batang tegak turun ke dua bingkai ujung, banyak batang sejajar memanjang di atas bingkai itu. |
| handuk-trapesium | Rak handuk trapesium | Dua rangka samping tertutup berbentuk trapesium, lebar di lantai dan sempit di atas, batang melintang menempel bergantian di kaki depan dan kaki belakang. |
| handuk-kantilever | Rak handuk kantilever | Satu tiang di atas kaki bentuk T, beberapa batang mendatar bertingkat menjulur hanya ke satu sisi seperti sisir, di atas kaki memanjang. |

### Rak kamar mandi & laundry (rak-kamar-mandi)

| id | Nama | Bentuk rangka |
|---|---|---|
| atas-kloset | Rak melangkahi 4 kaki | Empat batang tegak tinggi tanpa palang bawah, ruang kosong besar di bawah, beberapa bidang datar hanya di bagian atas, batang miring pendek di sudut atas ruang kosong dan silang X di belakang. |
| bingkai-samping | Rak melangkahi bingkai samping | Dua bingkai tegak tertutup di kiri dan kanan yang menapak dengan batang lantai depan-belakang, dihubungkan hanya oleh bidang-bidang datar di bagian atas. |
| kaki-silang | Rak melangkahi kaki silang X | Di tiap sisi dua batang miring menyilang dari lantai sampai setengah tinggi, lalu batang tegak pendek di atasnya menopang bidang-bidang datar. |
| kaki-t | Rak melangkahi kaki T | Satu batang tegak di tengah tiap sisi berdiri di batang lantai melintang, bidang datar di atas ditopang lengan yang menjulur ke depan dan belakang dari batang tegak itu. |
| kaki-depan | Rak melangkahi kaki depan + tembok | Hanya dua batang tegak di depan yang sampai lantai, di belakang batang tegak menempel tembok yang mulai di atas ruang kosong, bidang datar bertingkat di atasnya. |
| menara-samping | Rak menara samping (Γ) | Kolom sempit empat batang tegak berisi bidang datar dari lantai, dari puncaknya bidang-bidang datar menjulur ke samping di atas ruang kosong dan ujungnya digantung di tembok, tampak depan seperti huruf Γ. |
| lantai-plafon | Rak tiang lantai–plafon | Dua batang tegak dari lantai sampai langit-langit dengan plat di kedua ujung, lengan-lengan menjulur ke satu arah di bagian atas menopang bidang datar. |
| sudut-segitiga | Rak sudut segitiga 3 kaki | Tiga batang tegak membentuk segitiga siku di pojok, tiap tingkat dua palang menempel tembok dan satu palang miring di depan, diisi bilah papan yang makin pendek. |
| sela-beroda | Rak sela sempit beroda | Bentuk tipis memanjang ke depan: dua batang tegak hanya di belakang berdiri di batang lantai memanjang beroda, bidang datar menjulur ke depan, batang pegangan di depan atas. |

### Rak dapur: piring, microwave & galon (rak-dapur)

| id | Nama | Bentuk rangka |
|---|---|---|
| piring-jeruji | Rak piring rel lantai | Dua rangka samping masing-masing berdiri di satu rel lantai yang menjorok depan-belakang, dihubungkan palang keliling per susun; susun paling atas tanpa papan dengan dua deret batang tegak pendek (belakang tinggi, depan rendah), susun bawah berpapan. |
| piring-lipat-x | Rak piring kaki silang (lipat) | Di kedua ujung dua batang miring bersilang membentuk X dengan poros mendatar di titik silang; dua palang atas depan-belakang membawa deret batang tegak pendek, dua palang rendah di antara kaki miring menopang satu papan sempit. |
| microwave-susun | Rak microwave susun | Empat tiang tegak dengan papan rata di tiap susun, dua batang miring bersilang di bidang belakang dari susun bawah ke susun atas, batang tipis mendatar beberapa cm di atas tiap papan di sisi belakang dan samping, kait pendek menonjol di sisi kanan. |
| bumbu-rel | Rel + keranjang bumbu | Satu sampai tiga batang mendatar diberi dudukan pendek ke tembok; pada tiap batang menggantung beberapa kotak rangka kecil terpisah (alas papan, bibir keliling) yang tiang belakangnya menekuk ke belakang di atas batang sebagai kait. |
| bumbu-pintu | Rak bumbu gantung pintu | Dua tiang ramping yang pucuknya menekuk ke belakang lalu turun membentuk kait terbalik; di antara tiang ada nampan sempit bertingkat, masing-masing berlengan pendek ke depan dengan batang bibir di depan. |
| galon-tidur | Rak galon tidur + dispenser | Tiang tegak di tiap batas kolom, tiap susun berupa bingkai palang dengan sepasang batang depan-belakang yang berdekatan per kolom sebagai buaian benda bulat berbaring dan batang penahan tipis di belakang; puncaknya satu papan penuh. |
| galon-x | Dudukan galon kran (silang) | Dua bingkai X (satu di depan, satu di belakang) dihubungkan batang depan-belakang di titik silang dan dua batang depan-belakang di lengan atas silang, sehingga lekuk V di atas silang menjadi buaian benda bulat berbaring. |

## 3. Kandidat kategori yang ditolak

| Kandidat | Alasan |
|---|---|
| nakas | Skor 3/2/1/1/3 = 10 tapi bukanParamLama dan ruangVariasi lemah: kubus 4 kaki susun rata = rak/susun dengan ukuran kecil, nakas pedestal bundar = meja/bundar, nakas kaki X = meja/kaki-x + rak, nakas dinding = rak-dinding/siku. Hampir semua DNA sudah ada; cukup jalan pintas Beranda ke rak/susun ukuran 40x35x55. Ragu = buang. |
| meja-rias | Skor 3/3/1/1/3 = 11, tapi ciri utama (cermin) hanya papan tegak di atas meja = meja/rak-atas atau meja/konsol + papan; varian kaki X, pedestal, lipat dinding sudah milik meja dan meja-dinding. Ruang variasi DNA baru < 10. Ditolak; bisa jadi jalan pintas preset meja. |
| meja-kapster (salon & barbershop) | Digabung dengan meja-rias (DNA sama: meja + panel cermin tegak) lalu ikut ditolak. Rak handuk salon masuk jemuran/rak-handuk; station punggung-ke-punggung terlalu dekat dengan meja/rak-atas dua muka. |
| rak-galon (kandidat rumah dan usaha) | Tidak ditolak isinya: digabung ke rak-dapur sebagai group rak-galon. Sebagai kategori sendiri ruang variasinya sempit (palang tidur, pagar, dispenser) dan bertumpang tindih dengan rak susun. |
| rak-microwave | Digabung ke rak-dapur (group rak-microwave). Rak jembatan melangkahi kompor diserahkan ke rak-kamar-mandi (pemilik semua rangka melangkahi). |
| rak-piring | Menjadi inti rak-dapur (digabung, bukan dibuang). Rak atas wastafel diserahkan ke rak-kamar-mandi/atas-objek. |
| rak-mesin-cuci | Digabung ke rak-kamar-mandi: rangka melangkahi mesin cuci sama dengan melangkahi kloset, beda hanya ukuran kolong (sizes). Meja lipat laundry milik meja-dinding. |
| rak-parkir | Kandidat usaha yang sama dengan rak-sepeda rumah; digabung jadi rak-sepeda. Rak helm tiang/pasak dipindah ke gantungan-berdiri. |
| ranjang-susun (kandidat usaha) | Duplikat id dengan kandidat rumah; digabung jadi satu kategori ranjang-susun (group asrama menampung kebutuhan usaha). |
| ayunan | Skor 2/2/3/1/2 = 10 tetapi ruangVariasi rendah: rangka kaki A + palang atas hampir selalu sama, kursi gantung lengkung tidak bisa dibuat, dan dudukan gantung (rantai/tali) tidak didukung generator selain batang tegak kaku. Kaki A tinggi juga berbenturan dengan jemuran tenda. Ragu = buang. |
| meja-bengkel / workbench | Skor 3/2/1/2/3 = 11, tapi bukanParamLama lemah: workbench 4 kaki + rak bawah + plat besi = meja/lurus dengan rak bawah + steelMm; panel alat = troli/perkakas tanpa roda; meja tempel tembok = meja/konsol; kuda-kuda kaki A = meja/trestle. Tidak masuk 10 terbaik karena tumpang tindih. |
| kursi-tunggu deret | Skor 3/2/3/2/3 = 13 dan lolos, tetapi tidak masuk 10 terbaik: struktur balok-pemikul dengan kaki T di ujung dekat dengan meja/tiang-ganda dan meja-bar/jendela, dan varian deret tanpa sandaran = kursi/bangku. Cadangan pertama bila slot kategori ditambah. |
| tangga-kerja / step stool | Skor 3/2/3/1/3 = 12 tetapi variasi DNA terbatas (step stool, kaki A lipat, platform beroda) dan beban pijak orang butuh perhitungan kekuatan yang tidak dicek generator. Cadangan kedua. |
| stand-papan (whiteboard, mading) | Skor 3/2/1/2/3 = 11, tapi tumpang tindih dengan papan-menu (produk papan berdiri sudah ada); lebih tepat menambah template di papan-menu daripada kategori baru. Stand banner tanpa papan = rak-baju/gawang. |
| meja-prasmanan | Skor 3/2/1/2/2 = 10, tetapi riser bertingkat = rak-tanaman/tangga di atas meja, meja + pelindung atap = gerobak-lapak/warung-tenda, rel nampan = pagar pinggir. Hampir semua DNA milik kategori lain. |
| meja-laundry | Skor 3/2/1/2/2 = 10, tetapi meja sortir = meja/lurus tinggi, rak keranjang miring = rak/sepatu-miring, gantungan hasil = rak-baju, troli keranjang = troli/kandang, meja lipat dinding = meja-dinding. Tidak ada DNA baru yang cukup. |
| meja-dapur-usaha (meja kompor) | Skor 3/3/1/2/3 = 12, tetapi meja kompor rendah plat besi = meja/lurus dengan steelMm + tinggi 60; rak oven/bumbu/panci masuk rak-dapur; rak gantung plafon = rak-dinding/gantung. Bukan kategori sendiri. |
| rak-sepatu (dinaikkan dari sub-kategori rak) | Sudah ada sebagai group rak/rak-sepatu dengan 3 template (sepatu-miring, bangku-gantung, dapur). Ruang variasi tambahan kebanyakan beda ukuran/tingkat (sizes), sehingga tidak memenuhi syarat 'ruang variasi besar'; tidak dinaikkan. Catatan: rak/bangku-gantung lebih cocok dipindah ke gantungan-berdiri bila hall tree berbangku dibuat. |
| ranjang-susun | Dibatalkan setelah seleksi: dipan sudah punya template tingkat (ranjang susun & loft). |

## 4. Template dieliminasi saat recheck lintas kategori

| Kelompok kembar | Dipertahankan | Tindakan |
|---|---|---|
| rak-dinding/backbar (LAMA) / rak-kamar-mandi/keranjang-dinding | rak-dinding/backbar | Hapus rak-kamar-mandi/keranjang-dinding (DNA sama di semua sumbu; pipa handuk cuma tambahan kecil). Group 'dinding-mandi' yang jadi kosong ikut dihapus. |
| rak/susun (LAMA) / rak-kamar-mandi/kolong-wastafel | rak/susun | Hapus rak-kamar-mandi/kolong-wastafel (hanya beda di sumbu G, lubang/celah) |
| rak-dinding/tiang (LAMA) / rak-dapur/piring-dinding | rak-dinding/tiang | Hapus rak-dapur/piring-dinding (hanya beda di sumbu G, jeruji piring) |
| rak-baju/rangka-a (LAMA) / jemuran/tenda-a | rak-baju/rangka-a | Hapus jemuran/tenda-a (batang jemur di lereng hanya tambahan; DNA sama) |
| gerobak-lapak/kanopi-miring / jemuran/para-para / (mirip juga gerobak-lapak/lapak-miring) | gerobak-lapak/kanopi-miring | Hapus jemuran/para-para (keduanya produk baru; 'kanopi' lebih banyak dicari orang awam; bidang jeruji maupun atap sama-sama satu bidang miring) |
| jemuran/lengan-dinding / rak-sepeda/kait-lipat | jemuran/lengan-dinding | Hapus rak-sepeda/kait-lipat (bentuknya identik; 'jemuran dinding lipat' lebih banyak dicari) |
| rak-sepeda/lengan-dinding / gantungan-berdiri/pasak-dinding | rak-sepeda/lengan-dinding | Hapus gantungan-berdiri/pasak-dinding (hanya beda di sumbu C, siku penguat) |
| gantungan-berdiri/tangga-bersandar / rak-sepeda/bersandar | gantungan-berdiri/tangga-bersandar | Hapus rak-sepeda/bersandar (hanya beda di siku penguat lengan; 'gantungan tangga' lebih banyak dicari) |
| rak-tanaman/teralis (LAMA) / rak-tv/panel | rak-tanaman/teralis | Hapus rak-tv/panel (hanya beda isi panel, braket TV vs kisi, di sumbu G) |
| rak-dinding/backbar & rak-dinding/tiang (LAMA) / rak-tv/dinding | rak-dinding/backbar (+ rak-dinding/tiang) | Hapus rak-tv/dinding (hanya beda palang braket TV, sumbu G). Group 'tv-dinding' yang jadi kosong ikut dihapus. |
| rak-tv/bingkai / rak-partisi/gapura | rak-tv/bingkai | Hapus rak-partisi/gapura (keduanya produk baru; 'rak TV' jauh lebih banyak dicari; beda hanya silang X & papan bawah tengah) |
| rak-partisi/bilah-ambalan / rak-partisi/kisi-diagonal | rak-partisi/bilah-ambalan | Hapus rak-partisi/kisi-diagonal (satu produk; isi bilah tegak vs kisi diagonal dan alas kaki tapak vs plat hanya beda pola, ragu = buang; tidak bisa jadi sizes karena sidiknya berubah) |

## 5. Kandidat dibuang oleh desainer (mirip template lain)

<details><summary>rak-tv (35 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Bufet 4 kaki 2–3 susun polos (dengan/tanpa kolom sekat) | Rangkanya sama dengan rak/susun (4 tiang, papan rata, bisa bersekat). Sesuai batasan cukup jalan pintas Beranda ke ukuran rak/susun. |
| Bufet 3 ruang dengan papan tengah selang-seling tingginya | Hanya beda di sumbu D dari rak/susun ber-kolom. Ragu, jadi dibuang. |
| Bufet kaki melebar (mid-century) + rak bawah | Sama dengan meja/lurus (kaki melebar + palang H + rak bawah). |
| Bufet kaki hairpin / kaki V | Milik meja/hairpin, dilarang batasan. |
| Bufet kaki silang X | Milik meja/kaki-x dan bangku-silang. |
| Bufet kaki U / sled / rangka ujung kotak tertutup + papan bawah | Sama dengan kursi/bangku-rak (sisi bingkai kotak tertutup + papan di bawah) dan meja/sled. |
| Bufet kaki A (trestle) 2 susun | Meja/trestle + papan bawah. Beda hanya di jumlah papan. |
| Bufet kaki Z | Meja/kaki-z. |
| Bufet kaki trapesium (tertutup) | Meja/trapesium; versi terbalik mirip rangka A rak/rangka-a. |
| Bufet tiang tengah ganda (kaki T) | Meja/tiang-ganda. |
| Bufet konsol 2 kaki depan + dibaut tembok (tegak atau miring) | Meja/konsol, dilarang batasan. Versi kaki miring hanya beda di sumbu B. |
| Bufet + tiang belakang sudut naik ke rak di atas TV | Sama dengan meja/rak-atas (tiang belakang naik, papan di atas meja). |
| Bufet sudut L rendah 6 tiang | Rangkanya rak/sudut, hanya lebih pendek (beda tinggi = sizes). Ragu, jadi dibuang walau batasan mengizinkan. |
| Rak TV pojok segitiga | Generator tidak bisa membuat papan segitiga (papan hanya kotak/bundar dan cuma bisa diputar rotX). |
| Bufet waterfall (papan menerus sampai lantai di ujung) + rak tengah | Sama dengan meja-bar/island (rangka O di ujung ditutup papan) ditambah satu papan. |
| Bufet + layar kisi/bilah tinggi di belakang | Konsepnya sama dengan pembatas/layar (kotak + layar bilah di atasnya). Beda dari panel hanya di sumbu G. |
| Bufet dua kubus menara kembar tanpa jembatan / bufet tengah turun | Tampak depan bertangga yang sama dengan menara samping (D sama). Dijadikan pilihan letak menara, bukan template. |
| Bufet tumpuk (papan atas lebih pendek di atas alas panjang) | Bertangga lebar-ke-atas, mirip menara dan rak-tanaman/piramida. Ragu. |
| Bufet papan bawah digantung batang dari papan atas | Beda rangka terlalu halus dari meja + rak bawah. Ragu. |
| Bufet pipa industrial (pipa menembus papan, tanpa palang) | Tetap 4 tiang + papan rata, beda hanya di sumbu C. Mirip rak-dinding/pipa versi lantai. |
| Bufet sayap kantilever (papan atas menjulur di kedua ujung dengan siku) | Ragu: rangka dasarnya tetap rak/susun, kuota sumbu A 4 kaki sudah terpakai. |
| Bufet + meja kerja menyatu di satu ujung | Tampak depan bertangga yang sama dengan menara. Ragu. |
| Bufet dua muka rendah di belakang sofa | Punggung tengah dua muka mirip gondola tengah. Ragu. |
| Kotak bufet melayang dibaut tembok | Sama dengan rak-dinding/kotak. |
| Ambalan TV dinding siku polos | Milik rak-dinding/siku (dilarang batasan tanpa ciri TV). |
| Rak TV tiang lantai menempel tembok + lengan | Sama dengan meja-dinding/tiang. |
| Rak TV gantung plafon 4 batang | Sama dengan rak-dinding/gantung. |
| Tiang TV jepit lantai–plafon | Bentuk jepit lantai-plafon milik rak-partisi (partisi-plafon). |
| Standing TV easel (2 kaki depan miring + kaki belakang) | Sama dengan papan-menu/easel. |
| Standing TV rangka A dua ujung + palang puncak | Sama dengan rak-baju/rangka-a. |
| Standing TV dua tiang di kaki melintang (gawang) | Sama dengan rak-baju gawang (dua tiang di kaki melintang + palang atas). |
| Standing TV kaki tripod / bintang | Sama dengan meja/pedestal-bintang dan papan-menu easel. |
| Rak TV tangga bersandar dengan papan bertingkat | Sama dengan rak/tangga. |
| Troli TV bufet beroda + pegangan | Milik troli/dorong. |
| Rak TV lipat / putar / bongkar-pasang modular | Hanya beda di sumbu E dari model lain, atau tidak bisa dibuat generator (poros putar). |

</details>

<details><summary>rak-partisi (17 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Partisi berundak (kolom beda tinggi) sebagai template sendiri | DNA sama dengan kotak-tapak (hanya beda D bertangga), jadi bentuk itu disatukan sebagai param 'undak' (naik / puncak tengah) di sizes kotak-tapak. Kalau dibuat berkaki tegak, sumbu A-nya sama dengan rak/susun dan sumbu D-nya sama dengan rak-tanaman/tangga. |
| Partisi kotak selang-seling (checkerboard) di 4 kaki | Beda dengan rak/susun hanya di sumbu D (4 kaki, palang per tingkat). Bentuk selang-seling sudah ada lewat kubus-tumpuk (beda sumbu A). |
| Partisi menempel tembok samping (satu ujung dibaut, ujung lain bertiang) | Rangkanya tetap 4 tiang + palang per tingkat (rak/susun yang diputar 90° lalu dibaut). Ragu, jadi dibuang. |
| Partisi siku L berdiri bebas | Rangkanya L 6 tiang, sama dengan rak/sudut. |
| Partisi papan penuh di tengah + ambalan dua sisi | Punggung tengah tegak dengan rak dua muka di kaki tapak adalah ciri gondola tengah (rak-gondola). |
| Partisi dorong beroda dengan panel penuh + pegangan | Panel di rangka beroda terlalu dekat dengan papan-menu/ayun dan poster. Roda cukup jadi pilihan (sizes) di template kaki tapak. |
| Partisi + meja/ledge menyatu | Tiang belakang naik di atas meja sama dengan meja/rak-atas. Daun menjorok dua sisi di atas lengan sama dengan meja-bar/satu-tingkat. |
| Partisi + bangku dua sisi | Dua dudukan yang berbagi sandaran tengah sama dengan booth/ganda. |
| Partisi kantilever (menara satu ujung, rak menjulur ke samping) | Prinsip tiang + lengan menjulur sama dengan rak/kantilever, hanya beda arah. Ragu, jadi dibuang. |
| Bingkai gawang (2 tiang + palang atas) dengan rak digantung batang | Rangka 2 tiang di kaki melintang + palang atas = rak-baju/gawang. Bedanya hanya isian, jadi ragu. |
| Partisi trapesium / kaki melebar dua muka | Sama dengan rak/rangka-a (param dalamAtas sudah membuatnya trapesium). |
| Partisi rak bawah + layar bilah di atas | Mirip rak-tanaman/teralis (rak rendah + kisi naik di belakang) dan pembatas/layar. Ambalan tembus di bilah-ambalan sudah mencakup porsi rak + bilah. |
| Partisi kisi kotak (bilah tegak + mendatar) sebagai template sendiri | Beda pola isian saja (seperti polaLayar di pembatas), jadi bukan rangka baru. |
| Partisi silang (+) empat sayap / tiang tengah totem | Jarang dicari. Totem kotak menjulur 4 arah mirip rak-tanaman/menara & pohon. |
| Partisi berpot / bak tanaman | Milik pembatas (batasan kategori). |
| Partisi 4 tiang dua muka + silang X samping | Dilarang oleh batasan (sama dengan pembatas/rak-sekat). |
| Partisi zig-zag tetap (tanpa engsel) | Hanya beda sumbu E dari panel-lipat, jadi dianggap ukuran/varian. |

</details>

<details><summary>gantungan-berdiri (21 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Hall tree bangku duduk + rak sepatu + kait + rak topi | Sama dengan rak/bangku-gantung (4 tiang, bangku, tiang belakang tinggi berkait). Saya tidak boleh memindah template lama, jadi bentuk ini tidak dibuat. |
| Hall tree 4 tiang dengan rak sepatu bawah + panel kait belakang | Papan rak sepatu hanyalah bangku yang lebih rendah, jadi DNA-nya sama dengan rak/bangku-gantung (A 4 kaki, D susun rata, G kait + rak topi). |
| Tiang tunggal berkaki silang + kait di pucuk | Hanya beda sumbu G (kait vs lengan T) dari rak-baju/tiang-t dan papan-menu/gantung (tiang + kaki silang). Alasnya saya ganti jadi plat bundar, Y, bintang miring, dan kotak payung. |
| Siku tembok + papan atas + rel berkait di bawahnya | Sama dengan rak-baju/dinding (siku + papan atas + pipa gantung di bawah), hanya pipa diganti kait (beda 1 sumbu). |
| Rangka A di kedua ujung + palang kait di puncak | Sama dengan rak-baju/rangka-a dan meja/trestle. |
| Cincin kait putar di pucuk tiang | Sama dengan rak-baju/lingkar (tiang tengah + cincin segi delapan). |
| Gawang 2 tiang di kaki melintang + satu palang kait di atas | Sama dengan rak-baju/gawang (rel diganti kait = beda 1 sumbu). Juga mirip rak-tanaman/gantung. |
| 4 tiang kanopi dengan rak atas + palang kait di bawahnya | Sama dengan rak-baju/kanopi. |
| Kolom rak samping + panel kait | Sama dengan rak-baju/lemari (kolom rak + area gantung), hanya beda G. |
| Gantungan kaki X lipat | Kaki X lipat milik jemuran (batasan jemuran-lipat). Juga mirip meja/kaki-x dan kursi-silang. |
| Tangga bersandar palang polos tanpa kait/papan | Milik jemuran (tangga handuk). Versi saya punya kait di anak tangga dan papan di pucuk. |
| Easel 2 kaki depan + 1 kaki belakang berkait | Sama dengan papan-menu/easel. |
| Panel bersandar dengan papan punggung | Hanya beda sumbu D/C dari tangga-bersandar dan beda sumbu F dari panel-kait. Ragu, jadi dibuang. |
| Rangka kait gantung plafon (4 batang turun) | Mirip rak-dinding/gantung, dan tidak berdiri. |
| Gantungan daun pintu (kait di atas pintu) | Tidak ada tumpuan lantai atau tembok di 3D, jadi akan tampak melayang. Juga bukan gantungan berdiri. |
| Valet stand (rangka bahu + palang celana + baki kecil) | Kalau disederhanakan jadi batang lurus, hasilnya dua tiang di kaki melintang + palang + papan. Itu terlalu dekat dengan panel-kait dan rak-baju/gawang. |
| Gantungan beroda (tiang/panel kait + roda) | Roda hanya sumbu E (cukup jadi opsi), dan bentuk beroda sudah ada di troli serta rak-baju/gawang. |
| Panel kait + meja konsol menyatu | Sama dengan meja/rak-atas (tiang belakang naik di atas meja) dan meja/konsol. |
| Dua tiang kembar di satu alas H, tanpa palang atas | Hanya beda tipis dari rak-baju/gawang dan panel-kait. Ragu, jadi dibuang. |
| Kait dinding lipat berengsel | Engsel kait kecil tidak bisa dibuat secara wajar oleh generator, dan bentuk dasarnya sama dengan panel-dinding. |
| Tiang + cincin wadah payung di bawah, alas kaki silang | Kaki silang = rak-baju/tiang-t. Diganti menjadi tiang-payung dengan kotak dasar berplat. |

</details>

<details><summary>rak-gondola (20 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Rak toko panel samping tertutup (apotek) | Rangka besinya = 4 tiang + palang keliling seperti rak/susun; bedanya hanya papan samping/punggung (papan, bukan rangka). Ragu, jadi dibuang. |
| Rak majalah / brosur (satu bidang miring berbibir di rangka segitiga) | Rangka segitiganya sama dengan display-miring, dan nampan berbibir sepanjang batang miring sama saja dengan satu bidang miring berbibir. Digabung jadi size 'Majalah / brosur' di display-miring. |
| Rak keranjang miring (batang tanpa papan, pagar keranjang) | 4 tiang dengan tingkat miring dari batang + penahan depan = rak/sepatu-miring versi papan 'none'. |
| Rak kasir kaki tinggi + nampan miring bertangga di atas | Bagian bawahnya rangka meja 4 kaki seperti rak/dapur, bagian atasnya sama dengan gondola-dinding miring yang makin dangkal. Ragu, dibuang. |
| Rak rokok meja (kotak berdiri di atas meja, papan miring bersekat) | Kotak 4 tiang + tingkat miring + penahan depan hampir sama dengan rak/sepatu-miring; beda hanya sekat. |
| Display bundar bertingkat mengecil (tiang tengah + nampan bundar) | Tiang tunggal + nampan bundar bertingkat terlalu dekat dengan rak-tanaman/pohon (nampan bundar di lengan pada satu tiang). |
| Gondola pulau 4 muka (kolom tengah + punggung silang) | Penopang tiang tengah dan susunan 4 muka sama dengan rak-putar; bedanya hanya ukuran dan punggung. Ragu, dibuang. |
| Gondola tengah dengan end-cap di ujung | Hanya gondola-tengah ditambah sayap ujung (bisa jadi parameter); bentuknya tidak cukup beda. |
| Gondola punggung kisi + kait berderet (rak sachet) | Panel tegak berkait di atas kaki = hall tree milik gantungan-berdiri; kait/pasak dipegang kategori itu. |
| Gondola rangka A / display tenda dua muka | Sama dengan rak/rangka-a dan troli/buku; dilarang oleh batasan kategori. |
| Display bertingkat dua muka (piramida) | Sama dengan rak-tanaman/piramida. |
| Display tangga lantai berpapan miring (tiang bertingkat) | Tiang bertingkatnya sama dengan rak-tanaman/tangga; papan miring + bibir saja tidak cukup mengubah rangka. Diganti rangka segitiga. |
| Rak kantilever dua muka tanpa punggung | Sama dengan rak/kantilever; gondola tengah wajib punya punggung papan + kaki tapak + papan dasar + bibir. |
| Gondola dinding dibaut tembok tanpa kaki tapak | Sama dengan rak-dinding/tiang (tiang tegak di tembok + rak). |
| Gondola beroda / rak loyang roti beroda | Rak beroda milik troli; rak loyang 4 tiang + rel juga meragukan, dibuang. |
| Bak promo beroda berjeruji | Sama dengan troli/kandang (lantai beroda, pagar jeruji). |
| Display meja lapak miring satu bidang | Meja jualan dengan display miring milik gerobak-lapak. |
| Rak tower segitiga 3 tiang | Terlalu dekat dengan rak sudut segitiga milik rak-kamar-mandi. |
| Rak display lipat kaki silang X (bazar) | Rangka X ujung + papan atas/bawah terlalu dekat dengan meja/kaki-x + rak bawah; bentuk X juga membuat tingkat tengah tidak bisa dipakai. |
| Gondola miring (gondola dinding dengan papan miring) sebagai template sendiri | Beda hanya di sumbu D; dijadikan parameter 'miring' + size 'Rendah papan miring' di gondola-tengah. |

</details>

<details><summary>gerobak-lapak (17 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Gerobak sayap lipat (2 roda + daun lipat kiri-kanan) | Bentuk sayapnya sama dengan troli/saji-lipat (daun lipat di lengan siku). Bedanya dari angkringan cuma sayap. Ragu, jadi dibuang. |
| Gerobak payung (2 roda + tiang payung tengah) | Hanya beda atap (payung vs 4 tiang) dari angkringan, jadi cuma satu sumbu yang berbeda. |
| Gerobak 2 roda atap miring satu arah | Hanya bentuk atap yang beda dari angkringan (satu sumbu G). Cukup jadi pilihan, bukan template. |
| Booth kopi 4 roda kecil + atap datar | Sama dengan booth-kotak ditambah roda. Roda adalah ukuran/tambahan, bukan rangka baru. |
| Booth panel samping (dinding papan kiri-kanan) | Rangkanya sama dengan booth-kotak, hanya ditambah papan dinding. Ragu, jadi dibuang. |
| Booth sudut L | Hanya susunan meja yang beda dari booth-kotak. Bentuk counter L juga sudah ada di meja-bar/counter-l. |
| Meja promosi kaki A + papan nama | Meja kaki A sudah ada (meja/trestle). Bila ditambah header, hasilnya mirip bazar-lipat. Dipilih satu saja, yaitu kaki X. |
| Meja lapak lipat kaki X dengan papan miring | Kaki X tidak stabil untuk papan miring, dan kategorinya bertumpuk dengan bazar-lipat (sama-sama kaki X, lipat). |
| Lapak bertangga 2-3 undakan + atap | Undakannya sama dengan rak-tanaman/tangga, dan undakan dua muka sama dengan rak-tanaman/piramida. Hanya atap yang membedakan. Ragu, jadi dibuang. |
| Lapak dua tingkat (meja + rak miring di atas, tiang belakang naik) | Rangkanya sama dengan meja/rak-atas. |
| Lapak dua muka punggung tengah | Itu milik rak-gondola (gondola tengah, punggung papan tegak). |
| Lapak gantung (pipa gantung di atas meja bertiang) | Pipa gantung di 2 tiang adalah rak-baju/gawang, dan rak-baju/kanopi sudah ada. |
| Kanopi 6 tiang panjang (tenda bazar 3x6) | Itu hanya ukuran kanopi-miring/tenda-pelana. Tiang tengah sudah ditambahkan otomatis bila lebar lebih dari 250 cm. |
| Kios kotak tertutup 4 sisi | Rangka booth-kotak ditambah dinding. Tidak ada bentuk rangka baru. |
| Kanopi datar 4 tiang tanpa meja | 4 tiang + ring atas + papan atas hampir sama dengan rak-baju/kanopi dan dipan/kanopi. Diganti kanopi atap miring dengan tiang beda tinggi dan siku pucuk. |
| Gerobak sepeda / roda tiga | Generator tidak bisa membuat sepeda, roda berbeda sumbu, dan bentuk lengkung. |
| Gerobak 4 roda besar dengan display miring ke samping | Roda di 3D hanya bisa menggelinding searah sumbu z dan papan hanya bisa miring lewat rotX, jadi display ke samping tidak bisa dibuat. Diganti gerobak-pelana dengan roda putar dan display ke depan. |

</details>

<details><summary>rak-sepeda (19 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Rak sepeda rangka A dua sisi (sepeda digantung di sadel pada palang puncak) | Rangka sama dengan rak-baju/rangka-a (dua kaki miring bertemu di puncak, palang di atas). |
| Menara gantung 2 tiang di kaki melintang + lengan dua sisi | Penopang sama dengan rak-baju/gawang (dua tiang di kaki melintang); beda hanya lengan vs pipa gantungan, jadi ragu dan dibuang. |
| Menara 4 tiang ramping + lengan sepeda kiri-kanan | Sama dengan rak-tanaman/menara (4 tiang ramping, lengan menjulur dengan penguat miring). |
| Rak garasi 4 tiang dengan rak helm penuh di atas sepeda (kanopi) | Rangka sama dengan rak-baju/kanopi (4 tiang, rak penuh di atas). |
| Rak garasi kolom rak samping + ruang sepeda | Sama dengan rak-baju/lemari (kolom rak di kiri, ruang terbuka ke tiang kanan). |
| Siku dinding + papan atas, kait sepeda di bawah papan | Sama dengan rak-baju/dinding (siku tembok + papan atas, gantungan di bawah). |
| Tiang tunggal T beralas plat untuk sandaran 2 sepeda | Sama dengan papan-menu/gantung dan rak-baju/tiang-t (tiang tunggal berlengan T). |
| Tiang tunggal berpasak helm | Batasan: milik gantungan-berdiri. |
| Slot sisir lipat (engsel) | Bentuk sama dengan slot sisir, beda hanya sumbu E: masuk 'ragu = buang'. |
| Stand slot satu sepeda | Slot sisir dengan jumlah 1, jadi masuk ukuran (sizes), bukan template. |
| Plafon kait tegak deret (sepeda menggantung vertikal dari plafon) | Sumbu A sama dengan gantung plafon, beda hanya arah kait (1 sumbu). |
| Slot serong 45° (sepeda parkir diagonal) | Sama dengan sisir, hanya celah diputar (beda 1 sumbu B). |
| Shelter parkir beratap | Atap/tiang atap milik gerobak-lapak; ragu = buang. |
| Rak garasi 4 kaki + palang H + papan susun untuk helm | Batasan: rak/susun dan rak/palet. |
| Troli / rak sepeda beroda | Batasan: milik troli. |
| Bingkai jeruji kotak (roda diselipkan di antara jeruji tegak) | Beda kurang dari 2 sumbu dari slot sisir & slot dua sisi. |
| Slot lantai yang dibaut ke tembok | Slot sisir + F dibaut saja (1 sumbu). |
| Balok tengah berplat dengan buaian roda bergantian | Mirip pembatas/pagar (tiang di plat dasar + palang mendatar). |
| Panel pegboard dinding sepeda + perkakas | Mirip troli/perkakas dan rak-dinding/kisi. |

</details>

<details><summary>jemuran (21 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| A-frame dengan satu palang di puncak + tingkat bawah | Sama dengan rak-baju/rangka-a. |
| Tenda A bersayap mendatar | Beda dengan tenda-a hanya pada tambahan sayap (1 sumbu). Ragu, jadi dibuang. |
| Tangga handuk A sempit | Rangkanya sama dengan tenda-a, jadi masuk sizes ('Handuk / balkon'). |
| Jemuran sayap 4 kaki tegak | Hampir sama dengan sayap-x. Dipilih versi kaki X yang bisa dilipat. |
| Jemuran 4 kaki palang bertangga (undakan) | Bentuk samping bertangganya mirip rak/tangga dan rak-tanaman/tangga, hanya papannya diganti palang. |
| Jemuran 4 kaki atap pelana | Gabungan kotak + tenda. Konstruksinya janggal dan ragu, jadi dibuang. |
| Rangka kotak beroda / alas keranjang / rooftop tinggi / menara 3 lapis | Hanya beda roda, papan, ukuran atau jumlah lapis, jadi masuk sizes/toggle rangka-kotak. |
| Tiang tunggal dengan lengan mendatar menyebar (handuk putar) | Mirip gantungan-berdiri (pasak bertingkat, cabang) dan rak-tanaman/pohon. |
| Tiang Y rooftop | Sama dengan tiang-t, hanya beda bentuk lengan. |
| Plafon katrol per batang | Sama dengan gantung-plafon. |
| Dinding bingkai palang lipat turun dengan batang penahan | Rangka daun berengsel di rel tembok sama dengan meja-dinding/lipat dan kotak. |
| Rel handuk dinding bertingkat | Mirip gantungan-berdiri jeruji dinding dan rak-dinding/rel. |
| Tiang lantai menempel tembok + lengan | Sama dengan meja-dinding/tiang dan gantungan-berdiri tiang tembok berlengan. |
| Siku segitiga luar jendela + palang (jemuran jendela) | Siku tembok + penguat miring sama dengan rak-dinding/siku dan backbar, hanya papannya diganti palang. Ragu, jadi dibuang. |
| Tangga handuk bersandar tembok | Rangkanya sama dengan tangga bersandar milik gantungan-berdiri (dua ibu tangga + anak tangga). |
| Panel samping persegi (4 tiang) + palang bertangga (sled) | Tidak jelas bedanya dari rangka-kotak dan handuk-trapesium. |
| Gawang ganda dihubungkan palang panjang | Bentuknya rak-baju/gawang. |
| Jemuran pagar balkon (kait di railing) | Penopang berupa pagar tidak bisa digambar, sehingga rangka tampak melayang di 3D. |
| Pintu (gantung di atas daun pintu) | Penopangnya tidak bisa digambar, dan kaitnya milik gantungan-berdiri. |
| Kaki X gunting lipat (handuk sawhorse) | Sama dengan sayap-x tanpa sayap. |
| Pagar tiang plat dengan palang tersusun tegak | Sama dengan pembatas/pagar. |

</details>

<details><summary>rak-kamar-mandi (16 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Rak melangkahi kaki A (sisi rangka A) | Sisi berupa rangka A sama dengan rak/rangka-a dan rak-baju/rangka-a; hanya beda letak papan. |
| Rak melangkahi kaki melebar / trapesium | Hanya beda kemiringan kaki dari atas-kloset 4 kaki; tampak hampir sama (ragu = buang). |
| Rak kloset tangga bersandar (2 ibu tangga miring, papan di atas) | Rangkanya sama dengan rak-sepeda/bersandar (dua tiang miring bersandar + lengan per tingkat) dan mirip rak/tangga. |
| Rak 2 mesin cuci 6 tiang | Hanya beda lebar kolong; jadi ukuran 'Dua mesin cuci' (tiang tengah otomatis) di atas-kloset dan kaki-t. |
| Rak gantung kait atas pintu | Rangka sama dengan keranjang-dinding, hanya beda kait gantung; tidak cukup beda. |
| Rak sudut dinding tanpa kaki | Sama dengan sudut-segitiga yang kakinya dipotong; terlalu mirip. |
| Rak sela beroda 4 tiang + pegangan | Sama dengan troli/dorong (rak bertingkat 4 tiang beroda + pegangan); diganti sela-beroda dengan 2 tiang belakang di tapak. |
| Rak pemilah cucian (rangka berkeranjang kain) | Tanpa kain rangkanya sama dengan rak/susun dengan papan 'none' dan beberapa kolom. |
| Nampan bathtub (bertumpu di tepi bak) | Bentuknya unik, tapi di 3D melayang setinggi tepi bak tanpa penopang; gagal cek tidak melayang. |
| Menara handuk tiang tunggal + nampan bundar | Mirip rak-tanaman/pohon, rak-baju/lingkar, dan gantungan-berdiri/plat. |
| Tiang jepit pojok shower + keranjang | Sama dengan gantungan-berdiri/plafon dan lantai-plafon yang sudah ada di kategori ini. |
| Rak handuk berdiri tanpa papan / tangga handuk | Milik jemuran menurut batasan. |
| Rak atas wastafel berkaki pendek di meja | Milik rak-dapur (rak di atas meja berkaki pendek). |
| Rak gantung plafon atas mesin cuci | Sama dengan rak-dinding/gantung (digantung 4 batang dari plafon). |
| Meja lipat laundry dinding | Milik meja-dinding/lipat. |
| Dudukan mesin cuci (alas rendah, beroda / tidak) | Sama dengan meja 4 kaki pendek atau troli/platform. |

</details>

<details><summary>rak-dapur (28 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Gantungan panci plafon (rangka kotak digantung 4 batang + kait, tanpa papan) | Rangkanya sama dengan rak-dinding/gantung (4 batang gantung + ring per tingkat) bila papan 'none'; beda hanya kait = 1 sumbu. |
| Rak gelas/piring gantung bawah lemari (papan + rel gelas digantung batang pendek) | Sama dengan rak-dinding/gantung (+ opsi gantungan gelas); beda panjang batang gantung = ukuran. |
| Rak galon piramida 3-2-1 (kaki A, galon tidur) | Rangka sama dengan rak/rangka-a (kaki depan-belakang miring, tingkat melebar ke bawah); hanya papan diganti palang. Batasan rak-gondola juga melarang bentuk rangka-A dua muka. |
| Dudukan galon beroda (platform rendah + cincin pagar) | Hanya beda 1 sumbu dari troli/platform (pegangan diganti cincin); cincin tinggi = troli/kandang. |
| Rak galon berdiri 2 susun bersekat + cincin pagar | Sama dengan rak/susun bersekat (kolom); hanya tambahan pagar = 1 sumbu. |
| Rak jembatan atas meja kaki U + menara bumbu satu sisi | Mirip rak-tv/kubus (papan atas di atas kotak kolom ujung) dan meja/sled; beda hanya pagar & asimetri. Ragu = buang. |
| Rak microwave atas meja kaki U 1 papan + pagar | Sama dengan meja cafe/sled (rangka U, 1 bidang); beda hanya pagar. |
| Rak microwave dinding (siku + batang miring + pagar) | Sama dengan rak-dinding/backbar (siku + penguat miring + bibir). |
| Rak microwave 2 tiang belakang + kaki tapak menjorok (tanpa tiang depan) | Sama dengan rak-gondola/dinding kecuali punggung papan = 1 sumbu. |
| Rak microwave sisi segitiga (tiang belakang + batang miring ke depan) | Sama dengan rak-gondola/segitiga; beda papan datar vs miring saja. |
| Rak microwave + daun lipat depan berengsel | Terlalu dekat troli/saji-lipat dan meja-dinding/lipat; ragu = buang. |
| Rak bumbu putar (tiang tengah + nampan bundar berpagar di alas plat) | Sama dengan rak-gondola/putar (tiang di alas plat bundar, nampan mengelilingi tiang) dan rak-tanaman/pohon. |
| Rak bumbu bertangga atas meja | Sama dengan rak-tanaman/tangga (satu muka, makin ke belakang makin tinggi). |
| Rak bumbu ambalan dinding berpagar | Sama dengan rak-dinding/siku dengan opsi bibir. |
| Rak bumbu tiang tengah, nampan bergantian kiri-kanan | Sama dengan rak/tulang. |
| Rak bumbu tangga bersandar / rak dapur tangga bersandar | Sama dengan rak/tangga. |
| Rak sayur keranjang miring bertingkat | Sama dengan rak/sepatu-miring (tingkat miring + penahan). |
| Rak celah sempit beroda (antara kulkas & tembok) | Pada dasarnya troli/dorong ramping (rak beroda + pegangan); batasan melarang troli polos. |
| Rak dispenser + tiang belakang naik + rak gelas atas | Rangka sama dengan meja/rak-atas, hanya lebih pendek. |
| Pohon gelas/mug (tiang tunggal + lengan kait di alas plat) | Sama dengan gantungan-berdiri/plat & pohon. |
| Rak gelas berdiri kantilever (tapak, tiang belakang, lengan rel gelas) | Profil C sama dengan meja/samping-c; juga dekat rak/kantilever. |
| Rak tirisan miring (papan/jeruji miring) di rak 4 tiang atau di dinding | Dekat rak/sepatu-miring (4 tiang) atau rak-dinding/backbar & meja-dinding/lipat (dinding); ragu = buang. |
| Rak piring kaki A dua muka (piring bersandar di bubungan) | Rangka sama dengan rak-baju/rangka-a / rak/rangka-a dalam ukuran kecil. |
| Rak piring sled kedua dan rak piring 4 kaki (selain piring-jeruji) | Rangka hampir sama dengan piring-jeruji; jadi pilihan ukuran saja. |
| Rak sudut segitiga dapur | Batasan: rak sudut segitiga/sempit milik rak-kamar-mandi. |
| Rak atas wastafel / atas kompor berkaki lantai | Batasan: rak yang melangkahi objek di lantai milik rak-kamar-mandi; diganti jalan pintas Beranda. |
| Rak kolong wastafel (susun atas terbelah mengitari pipa) | Bersinggungan dengan konsep 'melangkahi' milik rak-kamar-mandi; ragu = buang. |
| Meja dapur + rak atas | Batasan: milik rak/dapur dan meja/rak-atas. |

</details>

## 6. Duplikat di katalog lama

Ditangani sesi lain dalam commit c293b4e (rework semua produk lama: sekarang 118 template unik, masing-masing dengan signature). Hasil recheck: tidak ada template baru yang kembar dengan template lama. Kalau ada yang kembar, template baru yang dihapus.
