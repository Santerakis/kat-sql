import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, ChevronLeft, FolderPlus, Tag,
  Trash2, Home, Folder, Package, Search
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

    // Уровень 2 (5 подкатегорий в каждой главной)
    subNames.forEach(subName => {
      const subId = catIdCounter++;
      categories.push({ id: subId, name: `${rootName} - ${subName}`, parent_id: rootId });

      // Уровень 3 (Еще 5 подкатегорий - Итого 125 "листьев")
      leafNames.forEach(leafName => {
        const leafId = catIdCounter++;
        categories.push({ id: leafId, name: `${subName} ${leafName}`, parent_id: subId });

        // Добавляем по 3 объявления в каждый "лист" (Итого 375 объявлений)
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
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories');
    if (saved) return JSON.parse(saved);
    const data = generateMassiveData();
    localStorage.setItem('db_ads', JSON.stringify(data.ads)); // Сразу сохраняем сгенерированные объявления
    return data.categories;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('db_ads');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- СОХРАНЕНИЕ ---
  useEffect(() => {
    localStorage.setItem('db_categories', JSON.stringify(categories));
    localStorage.setItem('db_ads', JSON.stringify(ads));
  }, [categories, ads]);

  // --- ЛОГИКА ---
  const subCats = useMemo(() => categories.filter(c => c.parent_id === currentId), [categories, currentId]);
  const currentAds = useMemo(() => ads.filter(a => a.category_id === currentId), [ads, currentId]);
  const isLeaf = subCats.length === 0 && currentId !== null;

  // Хлебные крошки
  const breadcrumbs = useMemo(() => {
    const path = [];
    let tempId = currentId;
    while (tempId !== null) {
      const cat = categories.find(c => c.id === tempId);
      if (cat) { path.unshift(cat); tempId = cat.parent_id; } else break;
    }
    return path;
  }, [currentId, categories]);

  // Поиск по всей базе
  const filteredAds = useMemo(() => {
    if (!searchQuery) return [];
    return ads.filter(ad => ad.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
  }, [searchQuery, ads]);

  return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-2xl mx-auto">

          {/* ПОИСК */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="Поиск по всем 375 объявлениям..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                <div className="absolute top-16 left-0 w-full bg-white rounded-2xl shadow-xl z-50 p-2 border border-slate-100">
                  {filteredAds.length > 0 ? filteredAds.map(ad => (
                      <div key={ad.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between">
                        <span className="font-medium">{ad.title}</span>
                        <span className="text-blue-600 font-bold">{ad.price} ₽</span>
                      </div>
                  )) : <div className="p-4 text-center text-gray-400 text-sm">Ничего не найдено</div>}
                </div>
            )}
          </div>

          {/* НАВИГАЦИЯ */}
          <nav className="flex items-center gap-2 mb-6 text-sm bg-white p-3 rounded-xl shadow-sm overflow-x-auto whitespace-nowrap">
            <button onClick={() => setCurrentId(null)} className="p-1 hover:text-blue-600"><Home size={18}/></button>
            {breadcrumbs.map(bc => (
                <React.Fragment key={bc.id}>
                  <ChevronRight size={14} className="text-slate-300" />
                  <button onClick={() => setCurrentId(bc.id)} className="hover:text-blue-600 px-1">{bc.name}</button>
                </React.Fragment>
            ))}
          </nav>

          {/* СПИСОК КАТЕГОРИЙ */}
          <div className="grid gap-2 mb-8">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {currentId ? categories.find(c => c.id === currentId)?.name : "Каталог"}
              </h2>
              <span className="text-xs font-bold text-slate-400">{subCats.length} разделов</span>
            </div>

            {subCats.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setCurrentId(cat.id)}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl hover:shadow-md transition-all border border-transparent hover:border-blue-200 group text-left"
                >
                  <div className="flex items-center gap-4">
                    <Folder className="text-blue-400 group-hover:text-blue-600 transition-colors" size={24} />
                    <span className="font-bold text-slate-700">{cat.name}</span>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
            ))}
          </div>

          {/* ОБЪЯВЛЕНИЯ (ЛИСТ) */}
          {isLeaf && (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Объявления в этой категории</h2>
                {currentAds.map(ad => (
                    <div key={ad.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-extrabold text-xl text-slate-800">{ad.title}</h3>
                        <div className="text-2xl font-black text-blue-600">{ad.price.toLocaleString()} ₽</div>
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(ad.attributes).map(([k,v]) => (
                            <span key={k} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">{k}: {v}</span>
                        ))}
                      </div>
                    </div>
                ))}
              </div>
          )}

          {/* СБРОС */}
          <div className="mt-20 text-center border-t border-slate-200 pt-10">
            <button
                onClick={() => { if(window.confirm("Очистить всё?")) { localStorage.clear(); window.location.reload(); } }}
                className="text-[10px] font-black text-slate-300 hover:text-red-400 tracking-widest uppercase transition-colors"
            >
              Удалить базу данных (125 категорий)
            </button>
          </div>
        </div>
      </div>
  );
}
