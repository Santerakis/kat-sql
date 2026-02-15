import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, Home, Folder, Package, Search, ArrowLeft
} from 'lucide-react';

// --- ГЕНЕРАТОР БОЛЬШОЙ БАЗЫ ДАННЫХ ---
const generateMassiveData = () => {
  const categories = [];
  const ads = [];
  let catIdCounter = 1;
  let adIdCounter = 1;

  const rootNames = ["Электроника", "Транспорт", "Недвижимость", "Дом и Сад", "Услуги"];
  const subNames = ["Альфа", "Бета", "Гамма", "Дельта", "Эпсилон"];
  const leafNames = ["Модель А", "Модель B", "Модель C", "Модель D", "Модель E"];

  rootNames.forEach(rootName => {
    const rootId = catIdCounter++;
    categories.push({ id: rootId, name: rootName, parent_id: null });

    subNames.forEach(subName => {
      const subId = catIdCounter++;
      categories.push({ id: subId, name: `${rootName} - ${subName}`, parent_id: rootId });

      leafNames.forEach(leafName => {
        const leafId = catIdCounter++;
        categories.push({ id: leafId, name: `${subName} ${leafName}`, parent_id: subId });

        for (let i = 1; i <= 3; i++) {
          ads.push({
            id: adIdCounter++,
            category_id: leafId,
            title: `Товар #${adIdCounter} (${leafName})`,
            price: Math.floor(Math.random() * 100000) + 1000,
            attributes: { "Артикул": `ABC-${adIdCounter}`, "Наличие": "Склад" }
          });
        }
      });
    });
  });

  return { categories, ads };
};

export default function App() {
  // --- ИНИЦИАЛИЗАЦИЯ ---
  const [categories] = useState(() => {
    const saved = localStorage.getItem('db_categories');
    if (saved) return JSON.parse(saved);
    const data = generateMassiveData();
    localStorage.setItem('db_categories', JSON.stringify(data.categories));
    localStorage.setItem('db_ads', JSON.stringify(data.ads));
    return data.categories;
  });

  const [ads] = useState(() => {
    const saved = localStorage.getItem('db_ads');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- ЛОГИКА ---
  const subCats = useMemo(() => categories.filter(c => c.parent_id === currentId), [categories, currentId]);
  const currentAds = useMemo(() => ads.filter(a => a.category_id === currentId), [ads, currentId]);
  const isLeaf = subCats.length === 0 && currentId !== null;

  const breadcrumbs = useMemo(() => {
    const path = [];
    let tempId = currentId;
    while (tempId !== null) {
      const cat = categories.find(c => c.id === tempId);
      if (cat) { path.unshift(cat); tempId = cat.parent_id; } else break;
    }
    return path;
  }, [currentId, categories]);

  const filteredAds = useMemo(() => {
    if (!searchQuery) return [];
    return ads.filter(ad => ad.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
  }, [searchQuery, ads]);

  const goBack = () => {
    if (currentId === null) return;
    const current = categories.find(c => c.id === currentId);
    setCurrentId(current ? current.parent_id : null);
  };

  return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-2xl mx-auto">

          {/* ПОИСК */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="Поиск по товарам..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                <div className="absolute top-16 left-0 w-full bg-white rounded-2xl shadow-xl z-50 p-2 border border-slate-100 max-h-96 overflow-y-auto">
                  {filteredAds.length > 0 ? filteredAds.map(ad => (
                      <div
                          key={ad.id}
                          onClick={() => { setCurrentId(ad.category_id); setSearchQuery(""); }}
                          className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-medium text-slate-700">{ad.title}</span>
                        <span className="text-blue-600 font-bold">{ad.price.toLocaleString()} ₽</span>
                      </div>
                  )) : <div className="p-4 text-center text-gray-400 text-sm">Ничего не найдено</div>}
                </div>
            )}
          </div>

          {/* НАВИГАЦИЯ */}
          <div className="flex items-center gap-2 mb-6">
            <button
                onClick={goBack}
                disabled={currentId === null}
                className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>

            <nav className="flex-1 flex items-center gap-2 text-sm bg-white p-3 rounded-xl shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button onClick={() => setCurrentId(null)} className="p-1 hover:text-blue-600 transition-colors text-slate-400"><Home size={18}/></button>
              {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    <button onClick={() => setCurrentId(bc.id)} className="hover:text-blue-600 px-1 font-medium text-slate-600">{bc.name}</button>
                  </React.Fragment>
              ))}
            </nav>
          </div>

          {/* СПИСОК КАТЕГОРИЙ */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                {currentId ? categories.find(c => c.id === currentId)?.name : "Каталог"}
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {subCats.length > 0 ? `${subCats.length} разделов` : "Товары"}
            </span>
            </div>

            <div className="grid gap-2">
              {subCats.map(cat => (
                  <button
                      key={cat.id}
                      onClick={() => setCurrentId(cat.id)}
                      className="w-full flex items-center justify-between p-5 bg-white rounded-2xl hover:shadow-md transition-all border border-transparent hover:border-blue-100 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Folder size={20} />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{cat.name}</span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
              ))}
            </div>
          </div>

          {/* ОБЪЯВЛЕНИЯ (ЛИСТ) */}
          {isLeaf && (
              <div className="space-y-4">
                {currentAds.length > 0 ? currentAds.map(ad => (
                    <div key={ad.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-xl text-slate-800">{ad.title}</h3>
                          <div className="flex gap-2 mt-3">
                            {Object.entries(ad.attributes).map(([k,v]) => (
                                <span key={k} className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                          {k}: {v}
                        </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-2xl font-black text-blue-600 leading-none">
                          {ad.price.toLocaleString()} ₽
                        </div>
                      </div>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <Package className="mx-auto text-slate-200 mb-2" size={48} />
                      <p className="text-slate-400 font-bold">В этой категории нет товаров</p>
                    </div>
                )}
              </div>
          )}

          {/* СЕРВИСНАЯ ИНФОРМАЦИЯ */}
          <div className="mt-20 text-center border-t border-slate-200 pt-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Режим просмотра базы данных
            </p>
          </div>
        </div>
      </div>
  );
}