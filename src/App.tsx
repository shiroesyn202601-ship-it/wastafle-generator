import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { KitchenStudio } from './KitchenStudio';
import { HomeScreen } from './components/studio/HomeScreen';
import { ProductStudio } from './components/studio/ProductStudio';
import { FurnitureDesign, PRODUCTS, ProductId, newDesign, normalizeDesign } from './products';
import { Role } from './components/studio/MemberSheet';

type Route = 'home' | 'kitchen' | 'product';

const LS_ROUTE = 'studiorangka_route';
const LS_DESIGN = 'studiorangka_design';
const LS_LAST = 'studiorangka_last'; // 'product' | 'kitchen': desain yang terakhir dibuka
const LS_KITCHEN = 'kitchencraft_config'; // dipakai KitchenStudio

const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // penyimpanan browser tidak tersedia
  }
};

const isKitchenConfig = (d: any) => !!d && typeof d === 'object' && !!d.totalWidth && Array.isArray(d.columns);

function loadDesign(): FurnitureDesign | null {
  try {
    const raw = lsGet(LS_DESIGN);
    return raw ? normalizeDesign(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Link langsung ke produk: ?produk=troli&contoh=bengkel (dibaca sekali saat aplikasi dibuka) */
function designFromUrl(): FurnitureDesign | null {
  const q = new URLSearchParams(window.location.search);
  const id = q.get('produk') as ProductId | null;
  if (!id || !(id in PRODUCTS)) return null;
  return newDesign(id, q.get('contoh') || undefined);
}

export default function App() {
  const [design, setDesign] = useState<FurnitureDesign | null>(() => designFromUrl() || loadDesign());
  const [route, setRoute] = useState<Route>(() => {
    if (designFromUrl()) return 'product';
    if (new URLSearchParams(window.location.search).get('view')) return 'kitchen';
    const r = lsGet(LS_ROUTE) as Route | null;
    if (r === 'product' && !loadDesign()) return 'home';
    return r === 'kitchen' || r === 'product' ? r : 'home';
  });
  const [toast, setToast] = useState<string | null>(null);
  const [role, setRoleState] = useState<Role>(() => (lsGet('studiorangka_role') === 'tukang' ? 'tukang' : 'pemesan'));
  const setRole = (r: Role) => {
    setRoleState(r);
    lsSet('studiorangka_role', r);
  };

  useEffect(() => lsSet(LS_ROUTE, route), [route]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const updateDesign = (d: FurnitureDesign) => {
    setDesign(d);
    lsSet(LS_DESIGN, JSON.stringify(d));
    lsSet(LS_LAST, 'product');
  };

  const openProduct = (id: ProductId, presetId?: string) => {
    updateDesign(newDesign(id, presetId));
    setRoute('product');
  };

  const openKitchen = () => {
    lsSet(LS_LAST, 'kitchen');
    setRoute('kitchen');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const d = parsed?.app === 'studio-rangka' ? normalizeDesign(parsed.design) : normalizeDesign(parsed);
        if (d) {
          updateDesign(d);
          setRoute('product');
          showToast(`Desain ${PRODUCTS[d.product].name.toLowerCase()} dibuka.`);
        } else if (isKitchenConfig(parsed)) {
          lsSet(LS_KITCHEN, JSON.stringify(parsed));
          openKitchen();
          showToast('Desain meja dapur dibuka.');
        } else {
          showToast('File ini bukan desain Studio Rangka.');
        }
      } catch {
        showToast('File tidak bisa dibaca. Pastikan file .json dari aplikasi ini.');
      }
    });
  };

  const last = lsGet(LS_LAST);
  const resume =
    last === 'product' && design
      ? { title: PRODUCTS[design.product].name, subtitle: PRODUCTS[design.product].summary(design.params), onClick: () => setRoute('product') }
      : last === 'kitchen' && lsGet(LS_KITCHEN)
      ? { title: 'Meja dapur', subtitle: 'Desain meja dapur terakhir', onClick: openKitchen }
      : null;

  return (
    <>
      {route === 'home' && <HomeScreen onPick={openProduct} onKitchen={openKitchen} resume={resume} onImport={handleImport} role={role} onRole={setRole} />}
      {route === 'product' && design && (
        <ProductStudio design={design} onChange={updateDesign} onHome={() => setRoute('home')} onToast={showToast} role={role} />
      )}
      {route === 'kitchen' && <KitchenStudio onHome={() => setRoute('home')} />}

      {toast && (
        <div role="status" className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-[70] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm shadow-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
