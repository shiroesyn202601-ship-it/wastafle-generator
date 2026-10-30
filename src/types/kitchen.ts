export type ColumnType = 
  | 'drawers' 
  | 'door-single-left' 
  | 'door-single-right' 
  | 'door-double' 
  | 'open-shelves' 
  | 'gas-compartment' 
  | 'pullout-spice' 
  | 'sink-cabinet';

// Jenis isi tiap baris (segmen) dalam kolom bertipe 'drawers' (susunan bebas)
export type SectionKind =
  | 'drawer' // Laci geser
  | 'door-left' // Pintu engsel kiri
  | 'door-right' // Pintu engsel kanan
  | 'door-double' // Pintu ganda
  | 'open' // Rak terbuka (ada ambalan, tanpa muka)
  | 'empty' // Rongga kosong (tanpa muka & ambalan, mis. untuk tong sampah / oven)
  | 'false-panel'; // Panel mati (muka tetap, tidak bisa dibuka)

export const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  drawer: 'Laci',
  'door-left': 'Pintu (Engsel Kiri)',
  'door-right': 'Pintu (Engsel Kanan)',
  'door-double': 'Pintu Ganda',
  open: 'Rak Terbuka',
  empty: 'Kosong',
  'false-panel': 'Panel Mati',
};

export interface DrawerConfig {
  id: string;
  height: number; // in cm
  name?: string; // e.g. "Laci Sendok", "Laci Piring", "Laci Wajan"
  kind?: SectionKind; // default 'drawer'; urutan array = dari atas ke bawah
}

export interface ColumnConfig {
  id: string;
  width: number; // in cm
  type: ColumnType;
  drawerCount: number;
  drawers: DrawerConfig[];
  shelfCount: number; // For door cabinets / open shelves
}

export type SinkModel = 'single' | 'double' | 'bowl-and-drainer';
export type SinkMounting = 'undermount' | 'topmount';
export type FaucetType = 'gooseneck' | 'modern-flex' | 'square-black';
export type SinkFinish = 'stainless' | 'black-nano' | 'gold-brass';

export type SinkBrandModel = 
  | 'custom'
  | 'blanco-subline' // Blanco Subline 700-U Silgranit (Germany)
  | 'modena-massenza' // Modena Massenza KS 7270 SUS304 (Italy/ID)
  | 'franke-maris' // Franke Maris Fragranite + Drainer (Switzerland)
  | 'kohler-prolific' // Kohler Prolific Workstation (USA)
  | 'toto-deluxe'; // Toto Undermount Minimalist (Japan)

export interface SinkConfig {
  enabled: boolean;
  brandModel?: SinkBrandModel;
  posX: number; // distance in cm from left edge to sink center
  posY: number; // distance in cm from front edge to sink center
  width: number; // left-to-right span in cm (e.g. 60)
  length: number; // front-to-back span in cm (e.g. 45)
  bowlDepth: number; // depth of bowl in cm (e.g. 20)
  model: SinkModel;
  mounting: SinkMounting;
  faucet: FaucetType;
  finish: SinkFinish;
  showAccessories?: boolean; // cutting board & wire basket
}

export type StoveType = 'gas-2' | 'gas-3' | 'induction-2' | 'induction-4' | 'gas-1';

export type StoveBrandModel = 
  | 'custom'
  | 'rinnai-rb712n' // Rinnai RB-712N Schott Ceran Glass 2-Lotus (Japan/ID)
  | 'modena-crista' // Modena Crista BH 1725 L 2-Burner Wok (Italy/ID)
  | 'rinnai-rb773g' // Rinnai RB-773G 3-Lotus Brass Burners
  | 'bosch-serie8' // Bosch Serie 8 Induction Flex (Germany)
  | 'modena-esente'; // Modena Esente BI 1725 Induction Touch (Italy/ID)

export interface StoveConfig {
  enabled: boolean;
  brandModel?: StoveBrandModel;
  posX: number; // distance in cm from left edge to stove center
  posY: number; // distance in cm from front edge to stove center
  width: number; // left-to-right span in cm (e.g. 73)
  length: number; // front-to-back span in cm (e.g. 43)
  recessDepth: number; // drop-in depth in cm (e.g. 7)
  type: StoveType;
  hasKnobs: boolean;
}

export const SINK_PRODUCER_PRESETS: Record<Exclude<SinkBrandModel, 'custom'>, {
  name: string;
  brand: string;
  origin: string;
  width: number;
  length: number;
  bowlDepth: number;
  model: SinkModel;
  mounting: SinkMounting;
  finish: SinkFinish;
  faucet: FaucetType;
  desc: string;
}> = {
  'blanco-subline': {
    name: 'Blanco Subline 700-U',
    brand: 'BLANCO',
    origin: 'Jerman',
    width: 73,
    length: 46,
    bowlDepth: 20,
    model: 'single',
    mounting: 'undermount',
    finish: 'black-nano',
    faucet: 'modern-flex',
    desc: 'Batu komposit Silgranit Anthracite, sudut radius R10 halus, pembuangan InFino tersembunyi',
  },
  'modena-massenza': {
    name: 'Modena Massenza KS 7270',
    brand: 'MODENA',
    origin: 'Italia / Indonesia',
    width: 72,
    length: 45,
    bowlDepth: 21,
    model: 'single',
    mounting: 'undermount',
    finish: 'stainless',
    faucet: 'gooseneck',
    desc: 'Stainless SUS304 handmade 1.2mm, peredam suara getar, bak ekstra dalam 21cm anti-ciprat',
  },
  'franke-maris': {
    name: 'Franke Maris MRG 611-78',
    brand: 'FRANKE',
    origin: 'Swiss',
    width: 78,
    length: 50,
    bowlDepth: 20,
    model: 'bowl-and-drainer',
    mounting: 'topmount',
    finish: 'black-nano',
    faucet: 'modern-flex',
    desc: 'Fragranite sanitised higienis anti-bakteri dengan sayap tirisan piring bergalur',
  },
  'kohler-prolific': {
    name: 'Kohler Prolific K-5540',
    brand: 'KOHLER',
    origin: 'Amerika Serikat',
    width: 84,
    length: 45,
    bowlDepth: 23,
    model: 'single',
    mounting: 'undermount',
    finish: 'stainless',
    faucet: 'modern-flex',
    desc: 'Workstation sink dengan rel tatakan talenan kayu geser & keranjang tirisan stainless',
  },
  'toto-deluxe': {
    name: 'TOTO SK-330 Kitchen Undermount',
    brand: 'TOTO',
    origin: 'Jepang',
    width: 60,
    length: 45,
    bowlDepth: 22,
    model: 'single',
    mounting: 'undermount',
    finish: 'stainless',
    faucet: 'square-black',
    desc: 'Desain minimalis Jepang, sudut bersih presisi dengan kemiringan lantai pembuangan cepat',
  },
};

export const STOVE_PRODUCER_PRESETS: Record<Exclude<StoveBrandModel, 'custom'>, {
  name: string;
  brand: string;
  origin: string;
  width: number;
  length: number;
  recessDepth: number;
  type: StoveType;
  hasKnobs: boolean;
  desc: string;
}> = {
  'rinnai-rb712n': {
    name: 'Rinnai RB-712N(GB)',
    brand: 'RINNAI',
    origin: 'Jepang',
    width: 73,
    length: 42,
    recessDepth: 7,
    type: 'gas-2',
    hasKnobs: true,
    desc: 'Kaca Schott Ceran beveled, Lotus Brass Burner ganda, pengaman gas bocor FFD, kenop zinc alloy',
  },
  'modena-crista': {
    name: 'Modena Crista BH 1725 L',
    brand: 'MODENA',
    origin: 'Italia / Indonesia',
    width: 73,
    length: 42,
    recessDepth: 7,
    type: 'gas-2',
    hasKnobs: true,
    desc: 'Tempered glass diamond black, Triple ring burner kuningan + adaptor wajan kuali, grid besi cor',
  },
  'rinnai-rb773g': {
    name: 'Rinnai RB-773G(GB) 3-Tungku',
    brand: 'RINNAI',
    origin: 'Jepang',
    width: 86,
    length: 51,
    recessDepth: 7,
    type: 'gas-3',
    hasKnobs: true,
    desc: '3 Tungku api Lotus kuningan (2 api besar untuk wajan + 1 api kecil tengah untuk rebus/simmer)',
  },
  'bosch-serie8': {
    name: 'Bosch Serie 8 Induction Hob',
    brand: 'BOSCH',
    origin: 'Jerman',
    width: 80,
    length: 52,
    recessDepth: 6,
    type: 'induction-4',
    hasKnobs: false,
    desc: 'DirectSelect Premium touch ring merah, 4 zona induksi otomatis deteksi panci, power boost',
  },
  'modena-esente': {
    name: 'Modena Esente BI 1725 Induction',
    brand: 'MODENA',
    origin: 'Italia / Indonesia',
    width: 73,
    length: 43,
    recessDepth: 6,
    type: 'induction-2',
    hasKnobs: false,
    desc: 'Kompor induksi kaca keramik 2 zona sentuh geser (slider touch), timer otomatis & child lock',
  },
};

export type CountertopMaterial = 
  | 'marble-black' 
  | 'marble-white' 
  | 'marble-calacatta'
  | 'granite-grey' 
  | 'quartz-black'
  | 'wood-oak' 
  | 'wood-teak'
  | 'concrete-grey'
  | 'terrazzo-white'
  | 'stainless-steel'
  | 'hpl'
  | 'wood-fjl'
  | 'custom';

// HPL (High Pressure Laminate): warna polos & motif
export type HplPattern = 'solid' | 'wood' | 'marble' | 'concrete' | 'linen' | 'terrazzo';
export type HplSurface = 'doff' | 'glossy' | 'texture';
export type HplGroup = 'Polos' | 'Motif Kayu' | 'Batu & Marmer' | 'Beton & Tekstur';

export interface HplSwatch {
  id: string;
  name: string;
  group: HplGroup;
  pattern: HplPattern;
  base: string; // hex warna dasar
  accent: string; // hex warna serat / urat / bintik
}

export interface HplSelection {
  swatchId: string;
  surface: HplSurface;
}

// Kayu FJL (Finger Joint Laminated) untuk top table
export type FjlSpecies = 'jati' | 'mahoni' | 'pinus' | 'karet' | 'meranti' | 'sungkai' | 'akasia';

export interface FjlSelection {
  species: FjlSpecies;
  coat: 'doff' | 'glossy';
}

// Kaki meja
export type LegType =
  | 'plinth' // Kaki stel tertutup papan plinth (kickboard)
  | 'feet' // Kaki stel terbuka tanpa plinth
  | 'frame'; // Kaki dibuat dari rangka sendiri (tiang sampai lantai, tanpa kaki stel)

export type CabinetFinish =
  | 'wood-natural' 
  | 'wood-walnut' 
  | 'wood-teak'
  | 'white-gloss' 
  | 'charcoal-matte' 
  | 'black-matte'
  | 'sage-green' 
  | 'navy-blue'
  | 'terracotta-warm'
  | 'sand-beige'
  | 'hpl'
  | 'custom';

export type FrameMaterial =
  | 'hollow-steel-black' 
  | 'hollow-steel-stainless' 
  | 'hollow-steel-gold' 
  | 'aluminium-profile' 
  | 'aluminium-black' 
  | 'plywood-box' 
  | 'solid-wood' 
  | 'custom';

export type FrameSupportType = 
  | 'sink-cradle' // Rangka penyangga bawah bak wastafel (cradle)
  | 'stove-cradle' // Rangka gelagar penahan kompor berat (crossbeams)
  | 'crossbeam-x' // Palang horizontal melintang panjang X
  | 'crossbeam-z' // Palang horizontal melintang dalam Z
  | 'vertical-post'; // Tiang vertikal tambahan Y

export interface FrameSupport {
  id: string;
  name: string;
  type: FrameSupportType;
  posX: number; // in cm from left edge
  posY: number; // in cm height from floor
  posZ: number; // in cm from front edge (center)
  length?: number; // length in cm
  tubeSize?: number; // tube size in mm
  enabled: boolean;
}

export type FrameAxis = 'x' | 'y' | 'z';
export type FrameMemberRole = 'post' | 'rail-x' | 'rail-z' | 'sink-cradle' | 'stove-cradle' | 'custom';

// Satu batang rangka (pipa hollow) lurus searah sumbu.
// Koordinat dalam cm, titik awal garis as (centerline):
//   x = dari sisi kiri meja, y = dari lantai, z = dari sisi belakang (dinding).
// Batang memanjang ke arah + sumbunya sepanjang `length`.
export interface FrameMember {
  id: string;
  axis: FrameAxis;
  x: number;
  y: number;
  z: number;
  length: number;
  role: FrameMemberRole;
  label?: string;
  tubeSize?: number; // mm, default frame.tubeSize
}

export interface FrameConfig {
  material: FrameMaterial;
  tubeSize: number; // 30, 40, or 50 mm
  customColor: string; // hex
  customRoughness: number;
  customMetalness: number;
  supports?: FrameSupport[];
  paintColor?: string | null; // warna cat / powder coating rangka (null = warna bawaan material)
  customLayout?: boolean; // true = rangka diedit manual lewat Editor Rangka 2D
  members?: FrameMember[]; // dipakai saat customLayout = true
  cornerJoint?: 'butt' | 'miter'; // sambungan sudut atas rangka otomatis: potong lurus 90° (default) / miter 45°
}

export type HandleStyle = 
  | 'profile-j' 
  | 'bar-black' 
  | 'bar-gold' 
  | 'edge-pull' 
  | 'knob-minimal';

export type AmbientTemperature = 'warm' | 'natural' | 'cool' | 'evening-mood';

export interface LightingConfig {
  ledStripEnabled: boolean;
  ledStripColor: string; // hex code
  ledStripBrightness: number; // 0 to 100
  ledStripPosition: 'under-counter' | 'under-plinth' | 'both';
  ambientTemperature: AmbientTemperature;
  ambientIntensity: number; // 0.4 to 1.6
}

export interface KitchenConfig {
  // Overall Dimensions (in cm)
  // Default: panjang (width) 270cm, lebar/kedalaman (depth) 60cm, tinggi (height) 85cm
  totalWidth: number; // 90 to 400 cm
  totalDepth: number; // 50 to 80 cm
  totalHeight: number; // 75 to 100 cm (ergonomic height)
  countertopThickness: number; // 2 to 6 cm
  plinthHeight: number; // 0 to 30 cm (kaki/kickboard), 0 = tanpa kaki
  legType?: LegType; // default 'plinth'
  countertopOverhangFront: number; // 0 to 4 cm
  backsplashEnabled: boolean;
  backsplashHeight: number; // 10 to 60 cm

  // Cabinet Structure
  columns: ColumnConfig[];
  
  // Appliances
  sink: SinkConfig;
  stove: StoveConfig;

  // Materials & Finishes
  countertopMaterial: CountertopMaterial;
  customCountertopColor?: string;
  countertopHpl?: HplSelection;
  countertopFjl?: FjlSelection;
  cabinetFinish: CabinetFinish;
  customCabinetColor?: string;
  cabinetHpl?: HplSelection;
  frame: FrameConfig;
  handleStyle: HandleStyle;

  // Lighting & Atmosphere
  lighting: LightingConfig;

  // Inspection & Simulation
  showFrameOnly: boolean; // Fitur "Lihat Hanya Rangka" (tanpa laci & pintu)
  drawersOpenPercent: number; // 0 (closed) to 100 (fully pulled out)
  doorsOpenPercent: number; // 0 (closed) to 100 (fully rotated open)
  showXRayWireframe: boolean;
  showDimensions3D: boolean;
  showSafetyClearance: boolean;
}

export const FRAME_MATERIAL_LABELS: Record<FrameMaterial, { name: string; desc: string; color: string }> = {
  'hollow-steel-black': { name: 'Besi Hollow Hitam Doff', desc: 'Besi hollow kotak 40x40 powder coated industrial', color: '#1e2124' },
  'hollow-steel-stainless': { name: 'Besi Hollow Stainless SUS304', desc: 'Anti-karat mengkilap kokoh higienis', color: '#cdd3db' },
  'hollow-steel-gold': { name: 'Besi Hollow Kuningan Gold', desc: 'Aksen emas mewah glamor modern', color: '#d4af37' },
  'aluminium-profile': { name: 'Aluminium Spandrel Silver', desc: 'Ringan, 100% anti-rayap & anti-air', color: '#9fa6b2' },
  'aluminium-black': { name: 'Aluminium Anodized Hitam', desc: 'Profil aluminium arang anti-korosi', color: '#26292d' },
  'plywood-box': { name: 'Multiplex Box 18mm', desc: 'Konstruksi bodi kabinet kayu olahan standar', color: '#8c6239' },
  'solid-wood': { name: 'Kayu Solid Balok Jati', desc: 'Rangka kayu alami kokoh bertekstur', color: '#664228' },
  'custom': { name: 'Warna Kustom (Custom)', desc: 'Pilih warna & karakter logam sendiri', color: '#3b82f6' },
};

export const MATERIAL_LABELS: Record<CountertopMaterial, { name: string; desc: string; color: string }> = {
  'marble-black': { name: 'Marmer Nero Marquina', desc: 'Hitam mewah urat putih', color: '#1a1a1a' },
  'marble-white': { name: 'Marmer Carrara Putih', desc: 'Putih bersih urat abu-abu', color: '#f0f0f2' },
  'marble-calacatta': { name: 'Marmer Calacatta Gold', desc: 'Putih mewah urat emas hangat', color: '#f5f0e6' },
  'granite-grey': { name: 'Granit Abu Modern', desc: 'Doff industrial minimalis', color: '#555555' },
  'quartz-black': { name: 'Quartz Hitam Supermatte', desc: 'Hitam pekat padat anti-gores', color: '#111214' },
  'wood-oak': { name: 'Kayu Solid Oak Alami', desc: 'Hangat natural anti-bakteri', color: '#b08453' },
  'wood-teak': { name: 'Kayu Jati Solid Teak', desc: 'Serat jati emas elegan klasik', color: '#8b5a2b' },
  'concrete-grey': { name: 'Beton / Semen Ekspos', desc: 'Gaya industrial raw kontemporer', color: '#7a8088' },
  'terrazzo-white': { name: 'Terrazzo Cor Modern', desc: 'Batu komposit bintik marmer unik', color: '#e5e7eb' },
  'stainless-steel': { name: 'Stainless Steel Komersil', desc: 'Higienis tahan panas & minyak', color: '#c5c8cc' },
  'hpl': { name: 'HPL (Warna & Motif)', desc: 'Multiplex dilapis HPL, puluhan pilihan', color: '#7c8a6e' },
  'wood-fjl': { name: 'Kayu FJL (Finger Joint)', desc: 'Papan sambung kayu solid laminasi', color: '#b07a45' },
  'custom': { name: 'Warna Top Table Kustom', desc: 'Sesuaikan warna hex sendiri', color: '#8b5cf6' },
};

export const CABINET_FINISH_LABELS: Record<CabinetFinish, { name: string; desc: string; color: string }> = {
  'wood-natural': { name: 'Oak Alami (Woodgrain)', desc: 'Serat kayu cerah Skandinavia', color: '#d9b48f' },
  'wood-walnut': { name: 'Walnut Gelap Elegan', desc: 'Kayu gelap premium & hangat', color: '#523a28' },
  'wood-teak': { name: 'Kayu Jati Tua Berurat', desc: 'Tekstur kayu eksotis tropis', color: '#68452b' },
  'white-gloss': { name: 'Putih Bersih (HPL)', desc: 'Lapang & modern minimalis', color: '#ffffff' },
  'charcoal-matte': { name: 'Abu-Abu Arang Doff', desc: 'Modern maskulin elegan', color: '#2b2e33' },
  'black-matte': { name: 'Hitam Supermatte Doff', desc: 'Full black ultra sleek', color: '#151618' },
  'sage-green': { name: 'Sage Green Japandi', desc: 'Warna tren lembut & menenangkan', color: '#7a8c78' },
  'navy-blue': { name: 'Navy Midnight Mewah', desc: 'Aksen mewah berani', color: '#1e2d42' },
  'terracotta-warm': { name: 'Terracotta Earthy', desc: 'Hangat bernuansa tanah liat Mediterania', color: '#b85d43' },
  'sand-beige': { name: 'Sand Beige Japandi', desc: 'Krem netral hangat dan tenang', color: '#d4c7b8' },
  'hpl': { name: 'Katalog HPL (Warna & Motif)', desc: 'Pilih warna polos, motif kayu, marmer, beton', color: '#8a6a4a' },
  'custom': { name: 'Warna Kabinet Kustom', desc: 'Pilih warna finishing sendiri', color: '#10b981' },
};

// Konfigurasi default: desain meja 270cm (kompor kiri, wastafel kanan, kaki dari rangka, top table kayu FJL jati)
export const DEFAULT_KITCHEN_CONFIG: KitchenConfig = {
  "totalWidth": 270,
  "totalDepth": 60,
  "totalHeight": 85,
  "countertopThickness": 3,
  "plinthHeight": 3,
  "legType": "frame",
  "countertopOverhangFront": 2,
  "backsplashEnabled": true,
  "backsplashHeight": 20,
  "columns": [
    {
      "id": "col-4",
      "width": 80,
      "type": "gas-compartment",
      "drawerCount": 0,
      "drawers": [],
      "shelfCount": 1
    },
    {
      "id": "col-3",
      "width": 80,
      "type": "drawers",
      "drawerCount": 2,
      "drawers": [
        {
          "id": "d-3a",
          "height": 10,
          "name": "Laci Sendok & Garpu"
        },
        {
          "id": "d-3b",
          "height": 26,
          "name": "Laci Piring & Mangkok",
          "kind": "door-right"
        },
        {
          "id": "d-3c",
          "height": 30,
          "name": "Laci Panci & Wajan"
        }
      ],
      "shelfCount": 0
    },
    {
      "id": "col-2",
      "width": 40,
      "type": "pullout-spice",
      "drawerCount": 1,
      "drawers": [
        {
          "id": "d-2",
          "height": 71,
          "name": "Rak Botol & Bumbu Tarik"
        }
      ],
      "shelfCount": 2
    },
    {
      "id": "col-1",
      "width": 70,
      "type": "door-single-right",
      "drawerCount": 1,
      "drawers": [
        {
          "id": "d-1",
          "height": 16,
          "name": "Panel Sifon Wastafel"
        }
      ],
      "shelfCount": 1
    }
  ],
  "sink": {
    "enabled": true,
    "posX": 232,
    "posY": 30,
    "width": 60,
    "length": 44,
    "bowlDepth": 20,
    "model": "single",
    "mounting": "undermount",
    "faucet": "gooseneck",
    "finish": "stainless"
  },
  "stove": {
    "enabled": true,
    "posX": 42,
    "posY": 30,
    "width": 74,
    "length": 44,
    "recessDepth": 7,
    "type": "gas-2",
    "hasKnobs": true
  },
  "countertopMaterial": "wood-fjl",
  "customCountertopColor": "#1c1d21",
  "countertopHpl": {
    "swatchId": "wood-walnut",
    "surface": "doff"
  },
  "countertopFjl": {
    "species": "jati",
    "coat": "doff"
  },
  "cabinetFinish": "navy-blue",
  "customCabinetColor": "#c49a6c",
  "cabinetHpl": {
    "swatchId": "solid-sage",
    "surface": "doff"
  },
  "frame": {
    "material": "hollow-steel-black",
    "tubeSize": 40,
    "customColor": "#1e2124",
    "customRoughness": 0.35,
    "customMetalness": 0.85,
    "supports": [
      {
        "id": "supp-sink",
        "name": "Besi Penyangga Wastafel",
        "type": "sink-cradle",
        "posX": 232,
        "posY": 62,
        "posZ": 30,
        "length": 68,
        "tubeSize": 40,
        "enabled": true
      },
      {
        "id": "supp-stove",
        "name": "Besi Penyangga Kompor",
        "type": "stove-cradle",
        "posX": 42,
        "posY": 76,
        "posZ": 30,
        "length": 80,
        "tubeSize": 40,
        "enabled": true
      }
    ]
  },
  "handleStyle": "profile-j",
  "lighting": {
    "ledStripEnabled": true,
    "ledStripColor": "#ffc87a",
    "ledStripBrightness": 85,
    "ledStripPosition": "both",
    "ambientTemperature": "warm",
    "ambientIntensity": 1
  },
  "showFrameOnly": false,
  "drawersOpenPercent": 0,
  "doorsOpenPercent": 0,
  "showXRayWireframe": false,
  "showDimensions3D": true,
  "showSafetyClearance": true
};

export interface KitchenPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  config: Partial<KitchenConfig>;
}

export const KITCHEN_PRESETS: KitchenPreset[] = [
  {
    id: 'industrial-hollow-270',
    name: 'Industrial Hollow 270cm',
    tagline: 'Rangka Besi Hollow Hitam 40x40 & Marmer Hitam',
    description: 'Konstruksi rangka besi hollow industrial kokoh dengan sink undermount, 3 laci tengah, rak bumbu, dan kompartemen gas LPG.',
    config: DEFAULT_KITCHEN_CONFIG,
  },
  {
    id: 'compact-studio',
    name: 'Compact Studio 140cm',
    tagline: 'Solusi apartemen & rumah mungil',
    description: '2 Kolom efisien: wastafel cuci piring 1 bak di kiri, laci sendok + kompor tanam 2-tungku di kanan.',
    config: {
      totalWidth: 140,
      totalDepth: 60,
      totalHeight: 85,
      columns: [
        {
          id: 'c1',
          width: 70,
          type: 'sink-cabinet',
          drawerCount: 1,
          drawers: [{ id: 'cd-1', height: 16, name: 'Panel False Front' }],
          shelfCount: 1,
        },
        {
          id: 'c2',
          width: 70,
          type: 'drawers',
          drawerCount: 3,
          drawers: [
            { id: 'cd-2', height: 14, name: 'Laci Sendok' },
            { id: 'cd-3', height: 26, name: 'Laci Piring' },
            { id: 'cd-4', height: 31, name: 'Laci Panci' },
          ],
          shelfCount: 0,
        },
      ],
      sink: {
        enabled: true,
        posX: 35,
        posY: 30,
        width: 48,
        length: 42,
        bowlDepth: 18,
        model: 'single',
        mounting: 'undermount',
        faucet: 'gooseneck',
        finish: 'stainless',
      },
      stove: {
        enabled: true,
        posX: 105,
        posY: 30,
        width: 52,
        length: 38,
        recessDepth: 6,
        type: 'gas-2',
        hasKnobs: true,
      },
      countertopMaterial: 'marble-white',
      cabinetFinish: 'white-gloss',
      frame: {
        material: 'hollow-steel-black',
        tubeSize: 40,
        customColor: '#1e2124',
        customRoughness: 0.35,
        customMetalness: 0.85,
      },
    },
  },
  {
    id: 'family-standard-210',
    name: 'Dapur Keluarga 210cm',
    tagline: 'Paling populer & ergonomis seimbang',
    description: '3 Kolom: Kabinet wastafel + 3 laci tengah soft-close + kompartemen gas LPG aman di bawah kompor.',
    config: {
      totalWidth: 210,
      totalDepth: 60,
      totalHeight: 85,
      columns: [
        {
          id: 'col-1',
          width: 70,
          type: 'sink-cabinet',
          drawerCount: 1,
          drawers: [{ id: 'd-1', height: 16, name: 'Panel Pipa Wastafel' }],
          shelfCount: 1,
        },
        {
          id: 'col-2',
          width: 65,
          type: 'drawers',
          drawerCount: 3,
          drawers: [
            { id: 'd-2a', height: 15, name: 'Laci Sendok & Garpu' },
            { id: 'd-2b', height: 26, name: 'Laci Piring & Mangkok' },
            { id: 'd-2c', height: 30, name: 'Laci Panci & Wajan' },
          ],
          shelfCount: 0,
        },
        {
          id: 'col-3',
          width: 75,
          type: 'gas-compartment',
          drawerCount: 0,
          drawers: [],
          shelfCount: 1,
        },
      ],
      sink: {
        enabled: true,
        posX: 38,
        posY: 30,
        width: 58,
        length: 44,
        bowlDepth: 20,
        model: 'single',
        mounting: 'undermount',
        faucet: 'gooseneck',
        finish: 'stainless',
      },
      stove: {
        enabled: true,
        posX: 166,
        posY: 30,
        width: 73,
        length: 43,
        recessDepth: 7,
        type: 'gas-2',
        hasKnobs: true,
      },
      countertopMaterial: 'marble-black',
      cabinetFinish: 'wood-natural',
      frame: {
        material: 'plywood-box',
        tubeSize: 40,
        customColor: '#1e2124',
        customRoughness: 0.35,
        customMetalness: 0.85,
      },
    },
  },
  {
    id: 'chef-island',
    name: 'Chef Luxury Island 280cm',
    tagline: 'Mewah 4 kolom dengan double sink & 4 laci besar',
    description: 'Layout koki profesional dengan double bowl sink, kompor gas 3-tungku, rak bumbu tarik, dan deretan laci luas.',
    config: {
      totalWidth: 280,
      totalDepth: 65,
      totalHeight: 88,
      countertopThickness: 5,
      columns: [
        {
          id: 'col-1',
          width: 85,
          type: 'sink-cabinet',
          drawerCount: 1,
          drawers: [{ id: 'd-1', height: 18, name: 'Pipa Wastafel' }],
          shelfCount: 1,
        },
        {
          id: 'col-2',
          width: 35,
          type: 'pullout-spice',
          drawerCount: 1,
          drawers: [{ id: 'd-2', height: 71, name: 'Rak Botol & Bumbu' }],
          shelfCount: 2,
        },
        {
          id: 'col-3',
          width: 80,
          type: 'drawers',
          drawerCount: 3,
          drawers: [
            { id: 'd-3a', height: 16, name: 'Laci Alat Masak' },
            { id: 'd-3b', height: 26, name: 'Laci Piring Saji' },
            { id: 'd-3c', height: 29, name: 'Laci Wajan Granit' },
          ],
          shelfCount: 0,
        },
        {
          id: 'col-4',
          width: 80,
          type: 'gas-compartment',
          drawerCount: 0,
          drawers: [],
          shelfCount: 1,
        },
      ],
      sink: {
        enabled: true,
        posX: 45,
        posY: 32,
        width: 78,
        length: 46,
        bowlDepth: 22,
        model: 'double',
        mounting: 'undermount',
        faucet: 'modern-flex',
        finish: 'black-nano',
      },
      stove: {
        enabled: true,
        posX: 225,
        posY: 32,
        width: 86,
        length: 48,
        recessDepth: 7,
        type: 'gas-3',
        hasKnobs: true,
      },
      countertopMaterial: 'marble-calacatta',
      cabinetFinish: 'charcoal-matte',
      handleStyle: 'bar-gold',
      frame: {
        material: 'hollow-steel-gold',
        tubeSize: 40,
        customColor: '#d4af37',
        customRoughness: 0.25,
        customMetalness: 0.9,
      },
    },
  },
];
