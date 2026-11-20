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


---

# Putaran 2 (2026-11-20)

## 1. Kategori baru

| Produk | Nama | Template |
|---|---|---|
| alat-gym | Alat & rak gym | 11 |
| kandang | Kandang hewan | 10 |
| alat-bermain | Alat bermain anak | 10 |
| dudukan-toren | Dudukan toren & tangki air | 3 |
| kursi-tunggu | Kursi tunggu deret | 13 |
| podium | Podium & mimbar | 8 |
| stand-motor | Paddock & stand motor | 9 |

Total putaran 2: **7 kategori, 64 template**. Dudukan toren hanya tersisa 3 template setelah recheck, karena bentuk tower kaki 4 dan kaki ganda kembar dengan meja akuarium.

## 2. Template & bentuk rangka

### Alat & rak gym (alat-gym)

| id | Nama | Bentuk rangka |
|---|---|---|
| half-rack | Half rack | A 2 tiang tegak di tapak memanjang / B tegak + topang miring ke belakang / C diagonal belakang + palang ikat / D tanpa papan / E diam / F bebas / G J-hook + lengan pengaman kantilever ke depan + pull-up atas |
| power-tower | Power tower (pull-up + dip) | A 2 tiang di tapak memanjang / B tegak + topang miring depan & belakang / C diagonal ganda + tapak H / D busa sandaran punggung tegak + lengan busa / E diam / F bebas / G pull-up lebar + pegangan dip + sandaran |
| squat-stand | Squat stand sepasang | A sepasang tiang tunggal lepas / B tegak / C ring tapak persegi + 4 siku miring / D tanpa papan / E lepas/diatur jaraknya / F bebas / G J-hook + pasak plat |
| rack-lipat | Rack lipat dinding | A tempel dinding + menapak lantai / B tegak / C bingkai samping (tiang tembok + tiang depan + palang atas/bawah + miring) / D tanpa papan / E lipat (engsel di tembok) / F dibaut / G J-hook + pull-up lepas |
| pullup-dinding | Pull-up dinding + dip | A tempel dinding tanpa kaki lantai / B lengan menjorok / C topang miring / D tanpa papan / E pegangan dip berengsel lipat naik / F dibaut / G palang pull-up di ujung lengan + dip |
| dip-paralel | Dip paralel sepasang | A sepasang bingkai trapesium lepas / B kaki miring melebar ke bawah / C palang tengah + tapak H / D tanpa papan / E lepas / F bebas / G pegangan memanjang di puncak |
| bench-datar | Bench datar | A balok tengah tunggal 50x100 / B kaki T (ujung kaki) + kaki V di tapak lebar (ujung kepala) / C tanpa / D jok datar (papan + busa) / E diam / F bebas / G roller penahan kaki rendah |
| bench-incline | Bench incline (atur sudut) | A balok tengah / B kaki T + kaki V / C tanpa / D jok duduk + sandaran papan miring berengsel 0-80 derajat / E engsel / F bebas / G batang penyangga sudut + roller |
| bench-situp | Bench sit-up miring | A balok tengah MIRING tetap / B miring satu arah (kepala rendah, kaki tinggi) / C tanpa / D jok miring tetap / E diam / F bebas / G roller penahan kaki di atas ujung tinggi |
| bench-press | Bench press + tiang | A balok tengah menyatu dengan 2 tiang berlubang / B kaki T + tapak H di kepala / C palang ikat atas tiang / D jok datar / E diam / F bebas / G J-hook + lengan pengaman + roller + pasak |
| troli-plat | Troli plat beroda | A 2 tiang tengah di tapak persegi beroda / B tegak / C ring bawah + palang tengah / D tanpa papan / E roda / F bebas / G pasak plat bertingkat dua muka + pegangan dorong |

### Kandang hewan (kandang)

| id | Nama | Bentuk rangka |
|---|---|---|
| kelinci-panggung | Kandang kelinci panggung | A 4 kaki miring melebar terpisah dari tiang kandang / B melebar / C palang keliling di kaki / D 1 bidang, lantai kawat + baki tarik / E diam / F bebas / G atap miring satu arah berpapan. Model 'panggung'. |
| baterai-ayam | Baterai ayam kaki A (tangga) | A kaki A di kedua ujung / B miring / C siku dari kaki A ke tiap baris + palang puncak/bawah / D bertangga dua muka, sel bersekat / E diam / F bebas / G lantai kawat miring ke luar + talang telur plat + bibir, pintu engsel tiap sel. Model 'baterai'. |
| ayam-ark | Kandang ayam rangka A umbaran | A rel lantai (sled) keliling, diteruskan jadi pegangan angkat / B kasau miring bertemu di bubungan / C palang tengah lereng / D tanpa lantai (umbaran), loteng papan di bentang kanan / E bisa diangkat pindah / F bebas / G prisma segitiga berjeruji di kedua lereng & ujung, pintu di ujung segitiga (tanpa engsel 3D). Model 'ark'. |
| tembok-siku | Kandang tempel tembok | A tempel dinding: tiang tembok + dua siku miring ke tiang depan, tanpa kaki / B - / C rangka lantai & atas / D 1 bidang, lantai kawat + baki / E diam / F dibaut tembok / G jeruji 3 sisi + atap (belakang = tembok), pintu engsel. Model 'tembok'. |
| sangkar-gantung | Sangkar gantung plafon | A gantung plafon: satu batang dari puncak atap ke plat plafon / B - / C rusuk atap limas 4 sudut / D 1 bidang, lantai kawat + baki / E diam / F di plafon / G atap limas berjeruji memusat, tenggeran, pintu engsel. Model 'gantung'. |
| sangkar-tiang | Sangkar tiang tunggal | A kaki tunggal: satu tiang 40×40 di kaki silang datar, plat dudukan di pucuk / B tegak / C palang dudukan di atas plat / D 1 bidang / E diam / F bebas / G tenggeran, atap jeruji/papan, pintu engsel. Model 'tiang'. |
| kambing-panggung | Kandang kambing panggung | A tiang menerus dari tanah ke atap, berderet tiap ±1,6 m / B tegak / C silang X di kolong ujung + penguat miring belakang / D lantai bilah bercelah di kolong tinggi / E diam / F bebas / G atap miring berkasau, tangga naik (ramp) di depan pintu. Model 'ternak-panggung'. |
| kambing-koloni | Kandang kambing koloni deret | A tiang berplat dibaut lantai di tiap batas sel / B tegak / C rangka bawah & atas per sel / D deret sel bersekat di atas lantai semen (tanpa lantai) / E diam / F dibaut lantai / G jeruji kepala miring di antara palang leher + palung pakan menjulur di depan, pintu engsel tiap sel, atap miring. Model 'koloni'. |
| anjing-panel | Kandang anjing panel bongkar pasang | A 4 kaki pendek di bawah panel samping / B tegak / C 4 panel dinding berbingkai sendiri (tiang ganda di sudut) + panel atap menumpang / D 1 bidang, lantai jeruji + baki tarik di antara kaki / E bongkar pasang + roda / F bebas / G pintu engsel di panel depan. Model 'anjing'. |
| umbaran-walkin | Umbaran anjing walk-in | A panel modul berdiri tanpa tiang lepas (tiang ganda di tiap sambungan panel) / B tegak / C rangka bawah/tengah/atas tiap panel, balok atap di tiap sambungan / D tanpa lantai / E bongkar pasang / F bebas / G panel pintu orang (lebar 80, setinggi panel), atap jeruji + papan teduh setengah belakang. Model 'walkin'. |

### Alat bermain anak (alat-bermain)

| id | Nama | Bentuk rangka |
|---|---|---|
| piramida | Piramida panjat | A=4 kaki miring dari sudut bertemu satu puncak, B=bersilang ke puncak, C=cincin tapak lantai, D=cincin palang persegi bertingkat mengecil, E=diam, G=pijakan semua muka. Beda dari gantungan:tripod (3 kaki, satu cincin, kait) dan gantungan:menara-4-muka (tiang tegak) di A/D/G. |
| monkey-a | Monkey bar kaki A | A=rangka A terpancung di dua ujung (berpalang panjat), C=siku miring ke rel, D=tangga mendatar di atas kepala (dua rel + anak tangga), G=pegangan gantung + pijakan. Beda dari rak-baju:rangka-a (satu pipa gantung) di D+G. |
| busur | Busur panjat | A=dua rel tangga menekuk naik-datar-turun yang sekaligus jadi kaki (busur segi), C=tapak melintang di ujung, D=anak tangga sepanjang busur. Ukuran balita (pikler arch 45 cm) sampai monkey busur 180 cm masuk sizes karena rangkanya sama. |
| swedia | Tangga Swedia + monkey bar | A=tempel dinding (tangga tegak dibaut tembok) + dua kaki depan, D=tangga tegak + tangga mendatar menjulur dari pucuk, F=dibaut tembok, G=pijakan + pegangan gantung, siku miring di kedua ujung. Bukan tangga bersandar (batasan 4). |
| perosotan | Perosotan mandiri | A=tangga miring belakang + dua tiang depan, D=panggung kecil + papan luncur miring, G=pagar panggung + pagar luncur + kaki ujung luncur. Tidak ada template lain berpapan luncur. |
| rumah-panggung | Rumah panggung + perosotan | A=4 tiang menerus sampai atap pelana (kuda-kuda + bubungan), D=lantai panggung tinggi berpagar jeruji + atap, G=tangga belakang + papan luncur depan. Beda dari gerobak-lapak:tenda-pelana (meja jualan, tanpa panggung/luncur) dan dipan:tingkat (dua alas, tanpa atap/luncur) di D+G. |
| playset | Menara + ayunan + perosotan | A=menara 4 tiang + balok ayunan menjulur ke samping dengan kaki A di ujung (kombinasi), D=panggung berpagar tanpa atap, G=ayunan + perosotan + tangga. Ayunan hanya menumpang di rangka kombinasi (batasan 1); beda dari rumah-panggung di A+G. |
| jungkit | Jungkat-jungkit | A=poros tengah di dua kaki A pendek bertapak lantai, D=balok tunggal panjang + dua dudukan, E=jungkit berporos, G=pegangan T di kedua ujung. |
| titian | Titian berpegangan | A=bingkai rel lantai (sled), D=titian rendah di tengah, G=dua pegangan sejajar di tiang (parallel bar anak). Beda dari kursi:bangku (dudukan lebar di 4 kaki) di A+G; balance beam polos tetap dilarang. |
| komidi | Komidi putar | A=satu poros di plat bundar, D=lantai bundar di atas lengan + cincin segi delapan, E=putar, G=pegangan jari-jari + tiang pegangan. Beda dari meja:bundar (diam, tanpa pegangan) di E+G, dari rak-gondola:rak-putar (nampan 4 muka bertingkat) di D+G. |

### Dudukan toren & tangki air (dudukan-toren)

| id | Nama | Bentuk rangka |
|---|---|---|
| tower-3-kaki | Tower toren 3 kaki | A 3 kaki · B melebar ke bawah · C ring segitiga bertingkat + silang X di tiga sisi, balok laba-laba ke tengah · D plat bundar di puncak · E diam · F berdiri bebas · G tangga monyet di satu sisi, pagar segitiga. Sizes: 520 L 2 m, 1000 L 3 m, 520 L 1 m. |
| atap-miring | Dudukan toren atap miring | A 4 kaki · B beda panjang (belakang pendek) di atas dua rel tapak yang mengikuti kemiringan atap · C ring + X, silang bawah depan + topang samping segitiga · D 1 plat datar · E diam · F dibaut ke kuda-kuda atap · G opsi pagar. Sizes: 520 L atap 20°, 1000 L atap 25°, 2×520 L spandek 15°. |
| tiang-tunggal | Tower tiang tunggal | A pedestal: satu tiang besar (2,5× pipa) di plat cor 12 mm + sirip dasar · B tegak · C empat topang miring dari tiang ke sudut ring atas, balok kepala silang · D 1 plat atas · E diam · F diangkur ke pondasi cor · G pasak panjat selang-seling di tiang, pagar keliling. Sizes: 520 L 2,5 m, 1000 L 3 m, 550 L 2 m. |

### Kursi tunggu deret (kursi-tunggu)

| id | Nama | Bentuk rangka |
|---|---|---|
| kaki-t | Kursi tunggu kaki T | A kaki T terbalik · B tegak · C tanpa · D dudukan terpisah di balok · E diam · F bebas · G sandaran per orang. Tiap penopang berupa satu tiang di tapak melintang dan memikul balok 40x40 bersama. Tiap dudukan punya lengan 20x40 dan satu tiang sandaran miring. Opsi: sandaran tangan, meja kecil di ujung atau tengah, jok papan/plat/busa. |
| kaki-u | Kursi tunggu kaki U tertutup | A kaki U · B tegak · C rangka tertutup per penopang · D dudukan terpisah · E diam · F bebas · G sandaran. Tiap penopang berupa loop rel lantai depan-belakang, dua tiang, dan palang atas di bawah balok. Kaki U hanya menopang balok bersama, tidak per dudukan. |
| kaki-x | Kursi tunggu kaki silang X | A kaki X · B bersilang · C palang atas · D dudukan terpisah · E diam · F bebas · G sandaran. Tiap penopang dua kaki bersilang X dilihat dari samping, palang atas memikul balok. |
| kaki-a | Kursi tunggu kaki A | A kaki A · B melebar · C palang perenggang dekat lantai · D dudukan terpisah · E diam · F bebas · G sandaran. Dari bawah balok turun dua kaki miring ke depan dan ke belakang. |
| kantilever | Kursi tunggu kantilever belakang | A kantilever · B tegak satu sisi · C tanpa · D dudukan menjulur · E diam · F bebas · G sandaran. Balok di belakang, tiang hanya di belakang dengan tapak menjorok ke depan, tanpa kaki depan. |
| tiang-plat | Kursi tunggu tiang plat (stasiun) | A pedestal plat · B tegak · C tanpa · D dudukan terpisah · E diam · F dibaut lantai · G sandaran. Tiang tunggal berdiri di plat besi 8 mm yang dibaut ke lantai, satu tiang tiap 2 dudukan. Bawaan jok plat besi. |
| kaki-tengah | Kursi tunggu kaki tengah | A pedestal tengah · B melebar (4 kaki miring menyebar) · C tanpa · D 2-3 dudukan di balok pendek · E diam · F berdiri bebas · G sandaran. Hanya satu tiang di tengah balok. |
| tembok-kantilever | Kursi tunggu tempel tembok | A tempel dinding · B - · C tiang tembok + rel atas · D dudukan menjulur · E diam · F dibaut tembok · G sandaran miring bersandar di rel atas. Balok di depan tiang tembok, tanpa kaki lantai (wall: true). |
| tembok-lipat | Kursi tembok dudukan lipat | A tempel dinding · C tiang tembok + 2 rel sandaran · D dudukan berengsel · E lipat (engsel per lengan dudukan, papan attachTo lengan) · F dibaut tembok · G sandaran berupa papan rata menempel di rel tembok, tanpa tiang sandaran. |
| punggung | Kursi tunggu punggung-ke-punggung | A kaki T panjang · D dua muka · C satu balok tengah bersama · E diam · F bebas · G dua sandaran saling membelakangi. Lengan dudukan dua deret berangkat dari satu balok tengah, tapak kaki T sepanjang kedua deret. |
| sudut-l | Kursi tunggu sudut L + meja | A meja sudut 4 kaki + kaki T di ujung luar · D L/sudut · C ring meja atas-bawah · E diam · F bebas · G meja menyatu + sandaran tegak. Dua balok bertemu siku di rangka meja sudut. |
| pulau | Kursi tunggu pulau 4 muka | A kaki T per deret · D 4 muka berputar (pinwheel) menghadap keluar · C - · E diam · F bebas · G papan ambalan tengah di atas palang sandaran atas. |
| aula-lipat | Kursi aula dudukan lipat | A panel/rangka samping (rel lantai + tiang belakang & depan + sandaran tangan) di kedua ujung dan tiap 2 dudukan · C rangka samping tertutup · D dudukan berengsel · E lipat · F bebas · G sandaran tangan menyatu di rangka samping + sandaran miring. Celah di rangka samping dilebarkan. |

### Podium & mimbar (podium)

| id | Nama | Bentuk rangka |
|---|---|---|
| panel-kotak | Podium panel kotak | A=4 kaki tegak (tiang belakang pendek, depan tinggi) / B=tegak / C=rangka kotak (ring bawah, ring atas, ring rak) / D=papan baca miring di atas seluruh rangka + rak dalam / E=diam / F=berdiri bebas / G=panel depan & samping untuk logo, bibir penahan |
| tiang-miring | Podium tiang miring | A=kantilever: tiang condong ke depan dari tapak T lantai / B=miring satu arah / C=penguat miring tiang ke tapak / D=kepala papan baca miring menjorok / E=diam / F=bebas / G=bibir |
| beroda | Podium beroda | A=dua tiang di tapak H / B=tegak / C=palang tapak tengah / D=papan baca miring + rak di antara tiang / E=roda / F=bebas / G=pegangan dorong belakang, panel depan. Beda dari rak-tv:standing (tiang tunggal + braket TV) |
| podium-meja | Podium meja | A=tanpa kaki, ditaruh di atas meja (rangka baji) / B=- / C=alas keliling bawah / D=papan miring di atas sisi segitiga / E=jinjing / F=di atas meja / G=panel depan logo. Beda dari papan-menu:easel (3 kaki, panel bersandar) |
| mimbar-tangga | Mimbar bertangga | A=tangga berdiri (anak tangga dari belakang naik ke lantai pijak depan) / B=tegak / C=rel lantai + rangka anak tangga / D=susun bertangga + lantai pijak + papan baca miring di tepi depan / E=diam / F=bebas / G=pegangan miring + pagar jeruji, dudukan khatib di sisi, panel depan |
| mimbar-atap | Mimbar beratap | Seperti mimbar bertangga, tetapi 4 tiang sudut lantai pijak naik ke ring atap + papan atap datar (C: rangka kotak tinggi, G: atap). Beda 2 sumbu dari mimbar-tangga |
| mimbar-kotak | Mimbar kotak beroda | A=tangga berdiri / C=sisi kiri & kanan tertutup panel (bertangga mengikuti pegangan) tanpa jeruji / E=roda / G=panel depan selalu, tanpa dudukan. Beda dari mimbar-tangga di C, E, G |
| panggung-podium | Panggung pijak + podium | A=panggung rendah berkaki pendek (6 kaki bila lebar >100) + podium dua tiang dari lantai di depan tepi panggung / C=ring panggung / D=lantai panggung + 1 anak tangga belakang (opsional) + papan baca miring ditahan siku / E=diam / G=panel depan, rak podium; tanpa pagar & dudukan |

### Paddock & stand motor (stand-motor)

| id | Nama | Bentuk rangka |
|---|---|---|
| paddock-belakang | Paddock belakang | A tuas U beroda (berporos di 2 roda depan) · B lengan mendatar + gagang miring ke belakang · C palang belakang + siku miring tiang-lengan · D tanpa papan, kait L berbibir di pucuk 2 tiang pendek · E roda/tuas · F berdiri bebas · G pegangan tuas, kait swing arm. Depan terbuka (ban masuk di antara tiang). |
| paddock-depan | Paddock depan pin komstir | A tuas U beroda · B tegak tinggi · C bingkai tertutup (palang atas + palang tengah) · D tanpa papan · E roda/tuas · F bebas · G satu pin tegak di tengah palang atas masuk ke komstir. Beda dari paddock belakang di C dan G. |
| dolly | Dolly geser parkir | A dua palang melintang beroda putar (4 roda) · B rendah rata · C tanpa · D talang panjang (2 bibir + alas papan) untuk kedua roda · E roda · F bebas · G penahan ban U di kedua ujung (depan tinggi, belakang rendah). Bukan troli:platform karena talang + penahan, tanpa pegangan dorong. |
| meja-lift | Meja lift + ramp lipat | A 6 kaki tegak · B tegak · C palang bawah keliling + melintang · D 1 bidang platform panjang + papan ramp miring · E ramp berengsel dilipat naik · F bebas · G penjepit roda depan (2 tiang + lingkar atas + topang miring + bibir samping). |
| lift-gunting | Meja lift gunting | A kaki gunting X berporos (naik-turun) di rangka lantai keliling · B bersilang dilihat dari samping · C rangka kotak lantai + poros tengah/atas/bawah · D platform + ramp lepas rata di lantai · E naik-turun (batang pendorong dongkrak + tuas pompa injak) · F bebas · G penjepit roda depan. |
| ramp-cuci | Ramp cuci tembus | A 4 tiang di bawah jembatan + rel tanjakan menapak lantai di kedua ujung · B tegak + miring dua arah · C palang bawah keliling + silang samping · D lantai jeruji melintang (tanpa papan), naik-datar-turun · E diam · F bebas · G jeruji anti-slip di tanjakan. Rendah 30–50 cm, ditopang tiang (beda dari alat-bermain:busur yang tanpa tiang). |
| ramp-pikap | Ramp naik pikap lipat | A bersandar ke bak mobil + kaki penopang di tengah · B miring satu arah · C palang engsel + palang kaki · D talang palang pijak berjajar (tanpa papan) · E lipat di tengah (engsel kunci) · F bersandar (tembok = bak/tailgate) · G kait berbibir di ujung atas. Beda dari tangga bersandar di E, G, dan kaki penopang. |
| penjepit-roda | Penjepit roda depan | A tapak lantai kotak berplat besi 3 mm · B rendah · C rangka kotak tapak · D tanpa papan kayu · E buaian berporos (jungkit) di telinga poros · F bebas · G lingkar penahan ban 2 tiang + palang atas bertopang miring ke depan, bibir pengunci di buaian. Satuan, bukan deret sisir. |
| stand-mesin | Stand mesin putar | A tiang tunggal di tapak T (palang belakang + tulang depan), 3 roda · B tegak · C topang miring tulang-tiang · D plat putar besi 8 mm · E roda + poros putar 360° · F bebas · G lengan mendatar berporos dengan 4 lengan baut berjari + pen pengunci. Bukan rak-tv:standing (bukan kaki H, ada lengan berporos). |

## 3. Kandidat kategori yang ditolak

| Kandidat | Alasan |
|---|---|
| rak-hidroponik (A+B digabung) | Skor 9. Hampir semua DNA-nya sudah dipakai produk lain: NFT rangka A = rak:rangka-a / rak-tanaman:piramida, NFT tangga bersandar = rak:tangga / rak-tanaman:tangga, tower tiang tengah = rak-tanaman:pohon, talang di siku tembok = rak-dinding:siku, gantung plafon = rak-dinding:gantung / jemuran:gantung-plafon, meja DFT bak di kaki tinggi = pembatas:pot-kaki, rak semai = rak:susun. Talang menggantikan papan hanya mengubah sumbu D, jadi variasi aslinya kurang dari 5. |
| kolam-terpal | Pasarnya kuat (skor pasar 3), tetapi bentuknya kembar: kolam kotak rendah = pembatas:kotak (kotak berangka berdinding papan di lantai), dan kolam panggung = pembatas:pot-kaki. Kolam bulat segi banyak tidak bisa dibuat karena papan hanya bisa diputar rotX. Variasi aslinya kurang dari 8, jadi skor variasi 1. Cadangan untuk putaran berikut kalau generator mendukung dinding poligon. |
| menara-kucing | Tumpang tindih: papan selang-seling di tiang = rak:tulang / rak-tanaman:pohon, tiang jepit plafon = 4 produk lama, cat shelf dinding = rak-dinding:siku/kisi, tangga bersandar = rak:tangga. Kandang kucing berjeruji sudah masuk kategori kandang. Skor bukan-parameter 1. |
| panggung & tribun | Deck 4 kaki + palang H = meja:lurus, deck lipat = meja:lipat, deck kaki X = meja:kaki-x, riser bertrap = rak-tanaman:tangga, podium juara = pembatas:kotak. Yang tersisa sebagian besar beda ukuran, jadi skor bukan-parameter 1. |
| perlengkapan-lapangan | Skor 10, tetapi variasinya sekitar 7. Rak bola = troli:kandang, papan skor = papan-menu:a-frame, gawang U berderet mendekati rak-sepeda:gawang-u, tiang net plat mendekati papan-menu:poster. Cadangan bila slot kategori tersisa. |
| stand-alat-musik | Stand keyboard kaki X = meja:kaki-x, kaki Z = meja:kaki-z, model 2 tingkat = meja:rak-atas, rak gitar dinding = rak-dinding:rel, stand ampli miring = rak-tv:sandar. Stand partitur dipindah ke podium. Skor bukan-parameter 1. |
| pergola & teralis | Pergola 4 tiang beratap = gerobak-lapak:kanopi-miring / tenda-pelana / kanopi-kantilever, teralis = rak-tanaman:teralis dan rak-partisi. Bedanya hanya skala (ukuran = sizes). |
| pagar-pengaman | Panel jeruji berdiri = pembatas:pagar, lipat akordeon = rak-partisi:panel-lipat, playpen = panel berengsel. Variasi kurang dari 6 dan skor bukan-parameter 1. |
| rak-sampah | Kandang sampah jeruji berkaki tinggi bertutup kembar dengan kategori kandang (panggung jeruji + atap). Dudukan tong di rel lantai = rak-gondola:bak-promo, tiang tunggal keranjang = papan-menu:gantung. Kalau dipilih bersama kandang, keduanya tumpang tindih. |
| rak-ban | Tingkat dari pasangan rel tanpa papan = rak:susun (beda D saja), rak ban dinding = rak-dinding:rel/siku, putar = rak-gondola:rak-putar, sudut = rak:sudut, plafon = rak-dinding:gantung. Skor bukan-parameter 1. |
| rak-kayu-bakar | Skor 10, tetapi bingkai tegak + alas = rak-baju:rak-bawah / rak:susun, keranjang beroda = troli, rangka A = rak:rangka-a, beratap miring = gerobak-lapak:lapak-miring. Variasi aslinya kurang dari 6. |
| cockpit-gaming | Variasi terbatas (kurang dari 8). Stand setir kaki X = meja:kaki-x, rak konsol + monitor = rak-tv:bingkai/menara, riser monitor = meja kecil. Pasarnya niche, skor pasar 1. |
| kuda-kuda las / stand pipa | Kaki A dengan V di pucuk = meja:trestle / gantungan:tripod. Variasinya sangat sempit, jadi tidak dimasukkan ke stand-motor. |
| tiang infus beroda | Tiang tunggal di kaki beroda = rak-tv:standing / gantungan:tiang-helm. Variasi lemah. |
| rak buku anak miring + bak | Kembar dengan rak-gondola:bak-promo dan troli:buku. |
| nakas, meja-rias, meja-kapster, ayunan (tunggal), meja-bengkel, tangga-kerja, stand whiteboard, meja-prasmanan, meja-laundry, meja-dapur-usaha, rak-sepatu, ranjang-susun | Ditolak di putaran 1 dan tidak ada alasan baru yang kuat. Catatan: ayunan hanya boleh muncul sebagai bagian rangka kombinasi di alat-bermain, tangga hanya sebagai elemen G pada dudukan-toren, dan rak dumbel/plat tidak boleh meniru rak:sepatu-miring. |

## 4. Dieliminasi saat recheck lintas kategori

| Kelompok kembar | Dipertahankan | Tindakan |
|---|---|---|
| meja/akuarium-kotak (LAMA) / rak/susun (LAMA) / alat-gym/power-rack | meja/akuarium-kotak | Hapus alat-gym/power-rack. Di kode rangkanya sama persis dengan meja akuarium kotak: tapak keliling di lantai, 4 tiang, dan ring atas keliling. Yang berbeda hanya tambahan di sumbu G (J-hook, bar pengaman, lengan pull-up, pasak) ditambah papan lantai. |
| rak-gondola/display-miring (LAMA) / alat-gym/rak-dumbel | rak-gondola/display-miring | Hapus alat-gym/rak-dumbel. Keduanya rangka samping dengan tiang belakang tinggi, tapak lantai, topang miring, dan tingkat bertangga. Bedanya hanya isi tingkat (rel pelana dibanding nampan papan berbibir), jadi hanya beda di sumbu G. |
| rak/susun beroda (LAMA) / troli/kandang (LAMA) / kandang/kucing-tingkat | rak/susun | Hapus kandang/kucing-tingkat. Rangkanya 4 tiang menerus beroda dengan ring dan lantai di tiap tingkat, sama dengan rak susun beroda. Jeruji, pintu, dan lubang loncat hanya isi bidang dan tambahan di sumbu G. Group 'kecil' tidak kosong karena masih ada kelinci-panggung. |
| rak-kamar-mandi/sudut-segitiga (LAMA) / kandang/pojok-segitiga | rak-kamar-mandi/sudut-segitiga | Hapus kandang/pojok-segitiga. Keduanya 3 tiang di pojok, denah segitiga bertingkat, dengan palang diagonal di muka. Bedanya hanya jeruji dan pintu, yaitu sumbu G. |
| papan-menu/a-frame (LAMA) / alat-bermain/pikler | papan-menu/a-frame | Hapus alat-bermain/pikler. Keduanya dua bingkai miring yang bertemu di puncak dan bisa dilipat di engsel puncak. Anak tangga di pikler dan panel di papan menu hanya beda isi muka (sumbu G). |
| rak-baju/rangka-a (LAMA) / alat-bermain/dinding-panjat | rak-baju/rangka-a | Hapus alat-bermain/dinding-panjat. Rangkanya kaki A tetap di kedua ujung dengan palang puncak. Papan panjat dan anak tangga di lereng hanya isi muka. Ini sama dengan preseden jemuran/tenda-a yang dulu dihapus karena kembar dengan rak-baju/rangka-a. |
| gantungan-berdiri/menara-4-muka (LAMA) / rak/susun (LAMA) / alat-bermain/jungle-gym | gantungan-berdiri/menara-4-muka | Hapus alat-bermain/jungle-gym. Keduanya 4 tiang tegak dengan cincin palang bertingkat di keempat sisi. Kisi atas, lantai setengah, dan pijakan hanya isi atau tambahan (sumbu G). |
| meja/akuarium-silang (LAMA) / dudukan-toren/tower-4-kaki | meja/akuarium-silang | Hapus dudukan-toren/tower-4-kaki. Bawaannya kaki tegak (lebarKaki 0) dengan 4 tiang, ring atas-bawah, silang X di sisi, dan plat atas, sama dengan meja akuarium bersilang. Jumlah tingkat silang termasuk sizes, sedangkan tangga monyet dan pagar adalah sumbu G (sebagian ukurannya bahkan tanpa tangga). |
| meja/akuarium-silang 6 kaki (LAMA) / dudukan-toren/tower-ganda | meja/akuarium-silang | Hapus dudukan-toren/tower-ganda. Varian rata (selisih 0) adalah rangka akuarium bersilang dua bentang dengan 6 kaki dan tiang tengah bersama. Varian beda tinggi hanya beda di sumbu D, ditambah tangga (G). Group 'tower-ganda' jadi kosong dan ikut dihapus. |
| meja/sled (LAMA) / dudukan-toren/rel-dak | meja/sled | Hapus dudukan-toren/rel-dak. Keduanya 4 kaki tegak di dua rel lantai (kaki U/sled) dengan satu bidang di atas. Bedanya hanya penguat (silang X dan topang dari ujung rel), jadi beda satu sumbu C. Ini sama dengan preseden gantungan-berdiri/pasak-dinding. Group 'dudukan-khusus' diganti nama dan deskripsinya (kata 'dak' dibuang). |
| meja/lurus melebar + rak bawah (LAMA) / podium/kaki-meruncing | meja/lurus | Hapus podium/kaki-meruncing. Keduanya 4 kaki melebar ke bawah dengan palang dan rak bawah. Bedanya hanya bidang atas yang miring (sumbu D) dan bibir kecil. |
| papan-menu/poster (LAMA) / meja/bundar (LAMA) / podium/tiang-plat | papan-menu/poster | Hapus podium/tiang-plat. Keduanya satu tiang tegak di plat besi dengan bidang di pucuk. Bedanya hanya bidang miring dibanding panel tegak (sumbu D). |
| meja/trestle (LAMA) / podium/kaki-a | meja/trestle | Hapus podium/kaki-a. Keduanya kaki A di kiri dan kanan dengan palang penghubung. Bedanya hanya papan miring dibanding datar (sumbu D). Laporan desainer sendiri hanya menyebut beda D. |
| meja/pedestal-bintang (LAMA) / podium/stand-partitur | meja/pedestal-bintang | Hapus podium/stand-partitur. Keduanya tiang tunggal di tengah dengan kaki miring menyebar ke lantai. Jumlah kaki 3 atau 4 hanya detail, dan papan miring di pucuk adalah sumbu D saja. Ragu, jadi dibuang. |
| rak-dapur/piring-lipat-x (LAMA) / podium/rehal-lipat | rak-dapur/piring-lipat-x | Hapus podium/rehal-lipat. Keduanya kaki silang X berporos baut di kedua ujung, bisa dilipat, dengan palang penghubung. Papan miring dibanding jeruji dan nampan hanya isi (sumbu G). Group 'stand-baca' jadi kosong dan ikut dihapus. |
| rak-baju/rangka-a (LAMA) / stand-motor/stand-body | rak-baju/rangka-a | Hapus stand-motor/stand-body. Keduanya kaki A di dua ujung dengan palang puncak. Palang berpasak bertingkat di lereng dan nampan bawah hanya tambahan, sama dengan preseden jemuran/tenda-a. |
| alat-gym/squat-stand / stand-motor/stand-velg | alat-gym/squat-stand | Hapus stand-motor/stand-velg. Keduanya produk baru. Tiap unitnya satu tiang tegak di tapak persegi dengan 4 siku miring. J-hook dibanding garpu U hanya sumbu G, dan as roda yang berputar adalah benda kerja, bukan rangka. 'Squat stand/rack' lebih banyak dicari orang awam. Group 'stand-komponen' tetap ada karena masih ada stand-mesin. |

## 5. Kandidat dibuang oleh desainer

<details><summary>alat-gym (22 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Pull-up berdiri gawang (2 tiang di kaki melintang + palang atas) | Rangkanya sama dengan rak-baju:rak-bawah (rak baju gawang). |
| Pull-up / ayunan rangka A polos | Sama dengan rak-baju:rangka-a, yang juga dilarang untuk alat-bermain. |
| Pull-up gantung plafon (2 batang turun + palang) | Tumpang tindih dengan rak-sepeda:plafon, jemuran:gantung-plafon dan rak-dinding:gantung. |
| Dip tembok siku segitiga tanpa pull-up | Sama dengan meja-dinding:siku dan rak-sepeda:lengan-dinding. Dip hanya dipertahankan di dalam template pull-up-dinding, yang punya palang ujung dan engsel lipat. |
| Plate tree tiang tunggal berpasak | Dilarang batasan (3) karena sama dengan gantungan-berdiri:tiang-helm. |
| Rak plat rangka A dengan pasak di kedua muka | Bentuk itu milik kategori stand-motor (stand body rangka A berpasak). Diganti dengan troli-plat. |
| Rak dumbel nampan miring berbibir | Dilarang batasan (2) karena sama dengan rak-gondola:display-miring. |
| Rak dumbel menara tiang tunggal | Variasi tiang tunggal berlengan, tumpang tindih dengan gantungan:tiang-helm. Ragu, jadi dibuang. |
| Rak barbel tegak (kotak tabung + tiang belakang bersisir) | Kotak wadah + tiang belakang hampir sama dengan gantungan-berdiri:tiang-payung. Ragu, jadi dibuang. |
| Rak barbel mendatar (gun rack) lantai/dinding | Tiang + lengan pendek bertingkat sama dengan rak:kantilever, rak-dinding:siku dan rak-sepeda:lengan-dinding. |
| Bench datar 4 kaki + palang H | Dilarang batasan (1) karena sama dengan kursi:bangku. |
| Bench lipat (kaki T berengsel) | Hanya beda sumbu E dari bench-datar, sedangkan aturannya butuh beda minimal 2 sumbu. Lagi pula mirip meja:lipat. |
| Hyperextension / roman chair 45 derajat | Balok miring di tapak T terlalu dekat dengan bench-situp (beda hanya di bantalan). Ragu, jadi dibuang. |
| Preacher curl (tiang tunggal + bantalan miring di pucuk) | Papan miring di tiang tunggal adalah bentuk inti kategori podium. |
| Squat stand tiang tunggal di kaki H beroda | Dilarang batasan (5) karena sama dengan rak-tv:standing. |
| Monkey bar / tangga mendatar | Dilarang batasan (4) karena milik alat-bermain. |
| Tiang jepit lantai-plafon dengan lengan pull-up | Dilarang batasan (6) karena sudah ada di 4 produk. |
| Parallettes rendah / parallel bar anak | Dilarang batasan (7) karena masuk alat-bermain. |
| Rak kettlebell / rak matras papan bertingkat | Sama dengan rak:susun. |
| Power rack 6 tiang / rack ekstensi | Hanya lebih panjang, jadi masuk sizes, bukan template baru. |
| Lat pulldown / cable tower / smith / leg press | Butuh katrol, rel luncur atau tuas yang tidak bisa dibuat generator. |
| Landmine (tabung berporos di plat lantai) | Terlalu kecil dan rangkanya minim. Tidak ada struktur yang layak dijadikan template. |

</details>

<details><summary>kandang (15 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Baterai susun lurus 4 tiang (lantai miring, sel berderet) | Sumbu A dan D sama dengan kucing-tingkat (4 tiang + susun rata). Bedanya hanya lantai dan sekat, jadi sumbu A tetap sama; kurang dari 2 sumbu berbeda. Dipilih baterai kaki A. |
| Kandang kambing dua muka + lorong pakan tengah | Hanya cermin dua baris kambing-panggung/koloni. Beda satu sumbu (D dua muka), sedangkan atap pelana tergolong tambahan. Ragu, jadi dibuang. |
| Kandang lipat koper (wire crate lipat) | Rangkanya kotak di rel lantai, mirip anjing-panel, dan beda hanya cara lipat. Engsel lipat dinding tidak bisa dibuat bersih: carry ikut menyeret panel lain dan atap, sehingga muncul batang yang melintasi garis engsel. |
| Kandang sel bersekat beroda pet shop (grid 2×3) | Sama dengan kucing-tingkat ditambah sekat tegak, beda satu sumbu. Bisa jadi sizes (pintu 2). |
| Kandang ayam panggung + umbaran berjeruji di kolong (coop) | Rangkanya kambing-panggung dengan kolong ditutup jeruji. Ragu, jadi dibuang. |
| Aviary pelana beroda 4 tiang | Akan menjadi template ke-5 bersumbu A '4 tiang' (melanggar batas ≤4), dan 1 tingkatnya sama dengan kucing-tingkat. |
| Kandang modular kubus tumpuk | Sama dengan rak-partisi:kubus-tumpuk. |
| Kandang di atas kaki silang X | Kotak di atas meja:kaki-x, tidak lazim di pasar. Ragu, jadi dibuang. |
| Kandang anjing + rumah berdinding papan | Dinding papan melanggar syarat wajib tertutup jeruji di semua sisi dinding. |
| Sangkar burung tempel tembok berlengan siku | Sumbu A dan F sama dengan tembok-siku, beda hanya ukuran. Dimasukkan ke sizes tembok-siku ('Burung kicau'). |
| Sangkar kubah / bundar | Bentuk lengkung tidak bisa dibuat generator. Disederhanakan menjadi atap limas di sangkar-gantung. |
| Keranjang / kandang angkut ayam di boncengan motor | Penopang rel lantai sama dengan ark, dan tidak punya pintu engsel yang jelas. Ragu, jadi dibuang. |
| Kandang kucing kantilever / balkon menjorok | Tidak masuk akal secara konstruksi untuk beban hewan, dan terlalu dekat dengan tembok-siku. |
| Ramp miring di dalam kandang kucing bertingkat | rotX hanya bisa miring depan–belakang. Kedalaman 50 cm membuatnya terlalu curam, jadi diganti lubang naik + papan loncat (bukan template terpisah). |
| Menara kucing (cat tree) / playpen panel tanpa atap / sarang ayam kotak terbuka / keranjang di rel tembok / bak kisi tanpa atap | Dilarang oleh batasan kategori (masing-masing = cat tree ditolak, pembatas:pagar, rak:susun / rak-partisi:kubus-tumpuk, rak-dapur:bumbu-rel, rak-gondola:bak-promo). |

</details>

<details><summary>alat-bermain (21 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Ayunan rangka A polos | Batasan 1: sama dengan rak-baju:rangka-a. Ayunan hanya ada di template playset. |
| Monkey bar dengan gawang tegak di kedua ujung | Hanya sumbu A yang beda dari monkey-a, bentuknya hampir sama (ragu = buang). |
| Monkey bar gantung plafon | Rangkanya sama dengan jemuran:gantung-plafon (rel plafon, 4 batang turun, bingkai palang mendatar). |
| Busur pikler (rocker) balita | Rangkanya sama dengan busur panjat. Dijadikan ukuran 'Busur balita' di template busur. |
| Perosotan lipat | Hanya beda kecil dari perosotan mandiri, jadi ukuran saja. |
| Kubus pikler balita | Rangkanya sama dengan jungle gym. Dijadikan ukuran 'Kubus balita'. |
| Balance beam / balok rendah di kaki | Batasan 2: sama dengan kursi:bangku. Diganti titian berpegangan. |
| Parallel bar polos tanpa titian | Sama dengan dua rak-baju:gawang yang dirangkai. Hanya versi titian berpegangan yang dipakai. |
| Terowongan bingkai kotak berderet | Batasan 3: sama dengan rak-sepeda:gawang-u. |
| Kotak pasir beratap / meja main pasir | Batasan 5: sama dengan gerobak-lapak:kanopi-miring / pembatas:pot-kaki. |
| Dinding panjat / tangga bersandar tembok, papan panjat lipat dari tembok | Batasan 4: sama dengan rak:tangga / gantungan:tangga-bersandar. Versi lipat dinding juga diragukan. |
| Jungkat-jungkit 4 dudukan (balok bersilang) | Satu poros dengan jungkit biasa. Variasinya diragukan, pasarnya kecil. |
| Menara tripod panjat 3 kaki | Sama dengan gantungan-berdiri:tripod. |
| Tiang panjat tunggal di plat | Sama dengan gantungan-berdiri:tiang-plat. |
| Learning tower (bangku panggung balita berpagar) | Lebih dekat ke kursi bar berkaki melebar + pagar. Bukan alat bermain, jadi dibuang. |
| Ring basket anak / gawang bola mini | Tumpang tindih dengan papan-menu:poster. Juga di luar groups yang ditetapkan. |
| Rumah-rumahan berdinding papan | Kotak tertutup + atap sama dengan gerobak-lapak:etalase / booth-kotak. |
| Jembatan tangga di antara dua segitiga pikler | Gabungan dua template yang sudah ada, bukan rangka baru. |
| Easel lukis anak, meja main lego | Sama dengan papan-menu:easel dan meja. |
| Pull-up anak, dip station, rak berlubang J-hook | Batasan 7: milik alat-gym. |
| Kubah panjat (dome), kuda goyang, perahu goyang, jaring/tangga tali, trapeze | Butuh bentuk lengkung atau tali, di luar kemampuan generator. |

</details>

<details><summary>dudukan-toren (15 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Tower 4 kaki melebar sebagai template terpisah | Hanya beda sumbu B dari tower 4 kaki tegak. Melebar = lebarKaki > 0, jadi masuk sizes tower-4-kaki. |
| Tower bertingkat dengan tingkat pompa/filter | Hanya beda jumlah tingkat/papan. Jadi toggle 'pompa' di tower-4-kaki dan tower-ganda. |
| Tower ganda rata (6 kaki) dan tower bertangga beda tinggi sebagai dua template | Selisih 0 menghasilkan rangka yang sama dengan versi bertangga. Digabung jadi satu template tower-ganda dengan param selisih di sizes. |
| Tower 2 toren 4 kaki plat memanjang | Hanya lebih panjang (batasan 4), jadi masuk sizes tower-4-kaki dan rel-dak (jumlah = 2). |
| Tower tempel tembok (2 kaki depan + angkur tembok) | Ragu: terlalu dekat dengan rak-kamar-mandi:kaki-depan dan meja:konsol. |
| Portal dua tiang di plat cor + lengan + siku | Ragu: mirip meja:tiang-ganda (dua tiang + lengan T) dan rak-kamar-mandi:kaki-t. |
| Dudukan kantilever (deck menjorok dari 2 tiang belakang) | Konstruksinya meragukan untuk beban 1–2 ton, dan bentuknya mirip gerobak-lapak:kanopi-kantilever. |
| Balok jembatan di antara dua tembok (di atas gang) | Generator hanya menampilkan satu tembok (z = 0). Ragu. |
| Variasi penguat K / diagonal tunggal | Hanya beda sumbu C, jadi tidak dibuat template sendiri. |
| Tower bongkar pasang bersegmen flens | Hanya beda sumbu E dari tower 4 kaki. |
| Tower dengan tangga miring ber-railing | Hanya beda sumbu G. |
| Tower kaki X (silang di elevasi) | Sama dengan meja:kaki-x / kursi:bangku-silang. |
| Tower segi delapan 8 kaki | Ragu: pada dasarnya tower ring + X dengan kaki lebih banyak. |
| Tower beratap peneduh UV | Mendekati gerobak-lapak (tiang + atap), dan hanya menambah elemen G. |
| Dudukan rendah rangka kotak / konsol dua siku / kaki A tangki tidur / rak pompa tanpa toren / tangga kerja | Dilarang di batasan kategori (= meja:akuarium-kotak, meja-dinding:siku, meja:trestle / rak-dapur:galon-x, rak:susun, tangga-kerja). |

</details>

<details><summary>kursi-tunggu (25 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Kaki trapesium tertutup per penopang | Hanya beda sumbu B dari kaki-u, dan rangkanya sama dengan meja:trapesium. |
| Kaki Z per penopang | Rangka sampingnya sama dengan meja:kaki-z. |
| Kaki Π (2 kaki depan-belakang tanpa rel lantai) | Hanya beda sumbu C dari kaki-u. |
| Kaki V hairpin per penopang | Mirip kaki-a dan meja:hairpin. |
| Tribun deret bertingkat (2 lapis di rangka samping bertangga) | Rangka samping bertangga sama dengan rak-tanaman:tangga. Ragu, jadi dibuang. |
| Deret beroda (kaki T + roda) | Hanya beda sumbu E, cukup jadi opsi. Kursi tunggu beroda juga jarang dicari. |
| Deret kaki T lipat (kaki dilipat ke bawah balok) | Hanya beda sumbu E dari kaki-t. |
| Deret + meja kecil di sela | Hanya beda sumbu G, jadi param `meja` (ujung/tengah) di template satu deret. |
| Deret + sandaran tangan | Tambahan kecil, jadi param `lengan`. |
| Deret tanpa sandaran | Batasan (2): hanya boleh sebagai ukuran. Masuk sizes kantilever (sandaran:false) dan toggle `sandaran`. |
| Satu papan duduk menerus | Batasan (1): itu kursi:bangku / bangku-sandar. |
| 4 kaki per dudukan / kaki U sled per dudukan | Batasan wajib dan (4): itu kursi:kursi-sled. |
| Deret tinggi di kaki T + pijakan | Batasan (5): itu meja-bar:jendela. |
| Bidang rendah berpunggung tinggi menempel tembok | Batasan (3): itu booth:tunggal. |
| Tiang lantai menempel tembok + lengan | Sudah ada di meja-dinding:tiang dan gantungan-berdiri:tiang-tembok. |
| Deret tembok di siku segitiga | Siku segitiga sama dengan meja-dinding:siku dan rak-dinding:backbar. |
| Deret tembok lipat berkaki depan | Sama dengan meja-dinding:kaki-depan. |
| Deret di atas rel lantai menerus memanjang | Mirip meja-piknik:kotak dan kaki-u. |
| Deret di rangka kotak samping + rak bawah dudukan | Sama dengan kursi:bangku-rak. |
| Deret di atas kotak loker / rak sepatu | Sama dengan rak:bangku-gantung dan kursi:bangku-rak. |
| Balok jembatan di antara dua kotak pot | Ujungnya sama dengan pembatas:kotak. Ragu, jadi dibuang. |
| Deret melingkar segi banyak | Papan sandaran tidak bisa dimiringkan di sumbu selain x, konstruksi rumit. Ragu, jadi dibuang. |
| Deret gantung plafon | Tidak masuk akal untuk tempat duduk. |
| Deret + meja tulis lipat per dudukan (kuliah) | Hanya beda sumbu G dan engsel kecil, bukan struktur baru. |
| Punggung-ke-punggung + pot tengah | Mirip pembatas:layar. Inti tengah sudah diwakili ambalan di template pulau. |

</details>

<details><summary>podium (16 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Podium tiang tunggal kaki bintang / kaki silang | Hanya beda geometri kaki (sumbu B) dari podium tiang plat; dibuang, cukup satu template tiang tunggal |
| Podium panel kotak beroda | Sama dengan panel-kotak + roda; diganti template beroda yang strukturnya lain (dua tiang di tapak H) |
| Podium panel samping trapesium | Tumpang tindih dengan kaki meruncing (B melebar) dan panel kotak (panel); ragu, dibuang |
| Podium tempel dinding siku miring | Rangkanya sama dengan meja-dinding:siku / rak-dinding:backbar, hanya papannya miring; pasarnya juga kecil |
| Podium tempel dinding lipat (daun di rel tembok) | Dilarang batasan (5), sama dengan meja-dinding:lipat |
| Podium tiang ganda di tapak melintang (diam) | Sama dengan rak-baju:rak-bawah / gantungan:panel-kait ditambah papan miring; hanya versi beroda + pegangan yang dipertahankan |
| Podium kaki U / sled dan kaki Z | Sama dengan meja:sled / meja:kaki-z, hanya papannya miring; ragu, dibuang |
| Podium + sayap meja laptop menyatu | Hanya tambahan papan samping di template yang sudah ada, bukan struktur baru |
| Stand baca kaki C samping sofa/ranjang | Rangkanya sama dengan meja:samping-c, ditambah papan miring; mirip juga dengan podium tiang miring |
| Rehal kaki X sebagai template terpisah dari podium lipat X | Strukturnya sama; digabung jadi satu template rehal-lipat, dengan ukuran 'Podium lipat' sebagai size |
| Mimbar tangga samping (bentuk L) vs tangga belakang | Hanya beda arah tangga, rangkanya sama; ragu, dibuang |
| Mimbar gaya Nabawi (tangga dari depan, dudukan di puncak) | Papan baca di depan khatib akan menutup jalan tangga, jadi tidak bisa memenuhi aturan wajib papan baca di pucuk |
| Rak Quran bertingkat miring | Dilarang batasan (4), sama dengan rak-gondola:display-miring / rak:sepatu-miring |
| Stand papan tegak berbingkai di tiang plat | Dilarang batasan (1), sama dengan papan-menu:poster |
| Stand easel 3 kaki dengan papan bersandar | Dilarang batasan (3), sama dengan papan-menu:easel |
| Meja ngaji rendah bidang datar | Dilarang batasan (7), masuk produk meja |

</details>

<details><summary>stand-motor (18 kandidat)</summary>

| Kandidat | Alasan |
|---|---|
| Dongkrak gunting kecil (jack matic) | Rangkanya sama dengan meja lift gunting, hanya lebih kecil. Seharusnya masuk sizes, jadi digabung dan tidak dibuat template sendiri. |
| Meja lift tiang tengah (pedestal) | Tidak masuk akal secara konstruksi untuk platform 200 cm, dan mirip meja:pedestal. |
| Ramp cuci tanjakan segitiga (rangka samping segitiga + talang miring) | Bentuknya netral sama dengan rak-gondola:display-miring (rangka samping segitiga + bidang miring) dan alat-gym:bench-situp. |
| Ramp cuci satu arah (naik-datar) | Hanya ramp-cuci tembus tanpa tanjakan turun, jadi beda ukuran saja, bukan template. |
| Ramp naik trotoar / baji garasi | Sama dengan podium:podium-meja (rangka baji bersisi segitiga tanpa kaki). |
| Stand velg dua rangka A (balancing) | Ujung A + as di puncak sama dengan meja:trestle / rak-baju:rangka-a. |
| Stand velg dua tiang di kaki melintang | Siluetnya sama dengan rak-baju:rak-bawah (gawang 2 tiang + pipa atas). |
| Stand balancing velg tiang tunggal as menjulur | Sama dengan jemuran:handuk-kantilever (tiang di kaki T, batang menjulur satu sisi). |
| Stand trail/MX kaki tiga melebar + plat atas | Sama dengan dudukan-toren:tower-3-kaki dan gantungan:tripod. |
| Stand trail/MX 4 kaki + plat (box stand) | Sama dengan kursi:bar / stool 4 kaki + pijakan. Versi tuas cam belum jelas strukturnya, jadi dibuang (ragu = buang). |
| Paddock depan pengait garpu bawah (L-pad) | Strukturnya sama dengan paddock belakang (tuas U + 2 tiang berkait), jadi cukup lewat parameter lebar/tinggi. |
| Paddock swing arm tunggal (pin samping) | Pasarnya terlalu sempit, dan rangkanya hampir sama dengan paddock depan berpin. |
| Lift dongkrak tuas lantai (dongkrak buaya) | Strukturnya tumpang tindih dengan paddock (tuas berporos) dan lift gunting. Ragu, jadi dibuang. |
| Display motor putar showroom (cincin rendah + plat bundar) | Niche, dan hanya berbeda dari rak-gondola:rak-putar / meja:bundar secara samar. |
| Rak gantung motor dinding, rak knalpot, rak helm | Dilarang batasan (rak-dinding:rel / gantungan:tiang-tembok / tiang-helm). |
| Deret slot roda lantai | Dilarang batasan (5), karena itu rak-sepeda:sisir. |
| Stand body rangka A polos tanpa pasak | Dilarang batasan (6), karena itu rak-baju:rangka-a. |
| Meja bengkel datar + plat, kuda-kuda las, rak ban | Sudah ditolak di putaran 1 dan masuk batasan (7) dan (8). |

</details>

## 6. Catatan auditor: kemiripan di template lama (belum diubah)

: template lama yang sudah hampir kembar lintas produk (perlu dicek fase recheck, belum diubah): - Tiang jepit lantai-plafon muncul di 4 produk: rak-sepeda:lantai-plafon (2 tiang, lengan dua muka) dan rak-kamar-mandi:lantai-plafon (2 tiang, lengan satu muka) hanya beda sumbu D. Lalu gantungan-berdiri:jepit-plafon dan rak-partisi:jepit-plafon. - Tiang lantai menempel tembok + lengan menjorok: meja-dinding:tiang, rak-dinding:tiang, gantungan-berdiri:tiang-tembok. - Gantung plafon + bidang mendatar: rak-dinding:gantung (papan) dan jemuran:gantung-plafon (bingkai palang) beda di sumbu D saja. - Bingkai kotak samping + rel lantai: kursi:stool-kotak, kursi:bangku-rak, rak-kamar-mandi:bingkai-samping. - Tiang tengah di tapak + lengan depan-belakang: rak:kantilever, rak-kamar-mandi:kaki-t, rak-gondola:gondola-tengah (yang terakhir punya papan punggung). - Loop trapesium samping: meja:trapesium dan jemuran:handuk-trapesium. - V miring: meja:hairpin dan dipan:kaki-v. - Bersandar tembok miring: rak:tangga, rak-tv:sandar, gantungan:tangga-bersandar. - Siku pojok tiga tiang: rak:sudut, gantungan:siku-pojok, rak-kamar-mandi:sudut-segitiga. - Kisi tegak di rel/roda: rak-gondola:bak-promo dan troli:kandang.
