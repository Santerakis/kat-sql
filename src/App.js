import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, Home, Folder, Package,
  Settings, Eye, Trash2, FolderPlus, Tag, ListPlus,
  CheckCircle2, ArrowLeft, ExternalLink, Info
} from 'lucide-react';

// --- ИНИЦИАЛЬНЫЕ ДАННЫЕ ---
const generateInitialData = () => {
  const categories = [
    {
      id: 1,
      name: "Одежда",
      parent_id: null,
      attributesConfig: [
        { name: "Материал", options: ["Хлопок", "Шерсть", "Шелк"] },
        { name: "Размер", options: ["S", "M", "L", "XL"] }
      ]
    }
  ];
  return { categories, ads: [] };
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories_v5');
    return saved ? JSON.parse(saved) : generateInitialData().categories;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('db_ads_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState(null);
  const [selectedAdId, setSelectedAdId] = useState(null);

  useEffect(() => {
    localStorage.setItem('db_categories_v5', JSON.stringify(categories));
    localStorage.setItem('db_ads_v5', JSON.stringify(ads));
  }, [categories, ads]);

  // Хелперы
  const subCats = useMemo(() => categories.filter(c => c.parent_id === currentId), [categories, currentId]);
  const currentAds = useMemo(() => ads.filter(a => a.category_id === currentId), [ads, currentId]);
  const currentCategory = useMemo(() => categories.find(c => c.id === currentId), [categories, currentId]);
  const selectedAd = useMemo(() => ads.find(a => a.id === selectedAdId), [ads, selectedAdId]);

  const hasAttributes = currentCategory?.attributesConfig && currentCategory.attributesConfig.length > 0;
  const canCreateSubCategory = !hasAttributes;
  const canCreateAd = hasAttributes;

  const breadcrumbs = useMemo(() => {
    const path = [];
    let tempId = currentId;
    while (tempId !== null) {
      const cat = categories.find(c => c.id === tempId);
      if (cat) { path.unshift(cat); tempId = cat.parent_id; } else break;
    }
    return path;
  }, [currentId, categories]);

  // --- ACTIONS ---
  const createCategory = () => {
    if (!canCreateSubCategory) return alert("В категории с атрибутами нельзя создавать подкатегории.");
    const name = prompt("Название категории:");
    if (!name) return;
    const isLeaf = window.confirm("Это конечная категория с фиксированными значениями характеристик?");
    let attributesConfig = [];
    if (isLeaf) {
      const attrsRaw = prompt("Формат: Цвет:Красный,Синий;Размер:S,M,L");
      if (attrsRaw) {
        attributesConfig = attrsRaw.split(';').map(part => {
          const [attrName, optionsRaw] = part.split(':');
          return { name: attrName.trim(), options: optionsRaw ? optionsRaw.split(',').map(o => o.trim()) : [] };
        });
      }
    }
    setCategories([...categories, { id: Date.now(), name, parent_id: currentId, attributesConfig }]);
  };

  const createAd = () => {
    const title = prompt("Название товара:");
    const price = parseInt(prompt("Цена:"), 10);
    if (!title || isNaN(price)) return;
    const dynamicAttributes = {};
    for (const attr of currentCategory.attributesConfig) {
      if (attr.options.length > 0) {
        const optionsList = attr.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
        const choice = prompt(`Выберите "${attr.name}":\n${optionsList}`);
        const index = parseInt(choice, 10) - 1;
        dynamicAttributes[attr.name] = attr.options[index] || attr.options[0];
      } else {
        dynamicAttributes[attr.name] = prompt(`Введите "${attr.name}":`) || "—";
      }
    }
    setAds([...ads, { id: Date.now(), category_id: currentId, title, price, attributes: dynamicAttributes }]);
  };

  // --- RENDERING ---

  // Карточка товара
  if (selectedAd) {
    return (
        <div className={`min-h-screen p-4 md:p-8 ${isAdmin ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setSelectedAdId(null)} className="flex items-center gap-2 mb-8 opacity-60 hover:opacity-100 transition-all font-bold">
              <ArrowLeft size={20} /> Назад к списку
            </button>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[40px] shadow-2xl ${isAdmin ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <Package size={120} />
              </div>
              <div>
                <span className="text-blue-500 font-black uppercase tracking-widest text-[10px]">Карточка товара</span>
                <h1 className="text-4xl font-black mt-2 mb-4 tracking-tighter">{selectedAd.title}</h1>
                <div className="text-3xl font-black text-blue-600 mb-8">{selectedAd.price.toLocaleString()} ₽</div>

                <div className="space-y-3">
                  <p className="font-bold text-xs opacity-40 uppercase tracking-widest">Характеристики</p>
                  {Object.entries(selectedAd.attributes).map(([k, v]) => (
                      <div key={k} className={`flex justify-between p-4 rounded-2xl border ${isAdmin ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <span className="opacity-50 font-bold">{k}</span>
                        <span className="font-black text-blue-500">{v}</span>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className={`min-h-screen p-4 md:p-8 font-sans ${isAdmin ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-5xl mx-auto">

          {/* HEADER */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Store<span className="text-blue-500">Pro</span></h1>
            <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    isAdmin ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm border'
                }`}
            >
              {isAdmin ? <><Eye size={14}/> Просмотр</> : <><Settings size={14}/> Админ</>}
            </button>
          </header>

          {/* NAVIGATION */}
          <nav className={`flex items-center gap-2 text-sm p-3 rounded-2xl shadow-sm mb-6 overflow-x-auto ${isAdmin ? 'bg-slate-800' : 'bg-white'}`}>
            <button onClick={() => setCurrentId(null)} className="p-1 opacity-50"><Home size={18}/></button>
            {breadcrumbs.map(bc => (
                <React.Fragment key={bc.id}>
                  <ChevronRight size={14} className="opacity-20 flex-shrink-0" />
                  <button onClick={() => setCurrentId(bc.id)} className="hover:text-blue-500 px-1 font-bold whitespace-nowrap">{bc.name}</button>
                </React.Fragment>
            ))}
          </nav>

          {isAdmin && (
              <div className="flex gap-2 mb-8">
                {canCreateSubCategory && (
                    <button onClick={createCategory} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 p-4 rounded-2xl font-bold text-xs text-white hover:bg-slate-600 transition-all">
                      <FolderPlus size={18} /> Новая папка
                    </button>
                )}
                {canCreateAd && (
                    <button onClick={createAd} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 p-4 rounded-2xl font-bold text-xs text-white hover:bg-blue-500 transition-all">
                      <ListPlus size={18} /> Добавить товар
                    </button>
                )}
              </div>
          )}

          {/* CATEGORIES LIST */}
          {!hasAttributes && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {subCats.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCurrentId(cat.id)}
                        className={`flex items-center justify-between p-6 rounded-3xl transition-all border border-transparent text-left relative group ${
                            isAdmin ? 'bg-slate-800 hover:border-slate-700' : 'bg-white hover:shadow-lg'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${cat.attributesConfig?.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {cat.attributesConfig?.length > 0 ? <Tag size={20}/> : <Folder size={20}/>}
                        </div>
                        <span className="font-bold text-lg leading-tight">{cat.name}</span>
                      </div>
                      {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Удалить?")) setCategories(categories.filter(c => c.id !== cat.id)) }} className="absolute -right-1 -top-1 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg">
                            <Trash2 size={12} />
                          </button>
                      )}
                    </button>
                ))}
              </div>
          )}

          {/* PRODUCTS TABLE */}
          {hasAttributes && (
              <div className={`rounded-3xl shadow-xl overflow-hidden border ${isAdmin ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                      <th className="p-6">Наименование</th>
                      <th className="p-6">Цена</th>
                      {currentCategory.attributesConfig.map(attr => (
                          <th key={attr.name} className="p-6">{attr.name}</th>
                      ))}
                      <th className="p-6 text-right">Действие</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/5">
                    {currentAds.map(ad => (
                        <tr
                            key={ad.id}
                            onClick={() => setSelectedAdId(ad.id)}
                            className="group cursor-pointer hover:bg-blue-500/5 transition-colors"
                        >
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <Package size={16} className="text-blue-500" />
                              <span className="font-bold">{ad.title}</span>
                            </div>
                          </td>
                          <td className="p-6 font-black text-blue-600">{ad.price.toLocaleString()} ₽</td>
                          {currentCategory.attributesConfig.map(attr => (
                              <td key={attr.name} className="p-6 opacity-60 text-sm">{ad.attributes[attr.name] || '—'}</td>
                          ))}
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500">
                                <ExternalLink size={16} />
                              </button>
                              {isAdmin && (
                                  <button
                                      onClick={(e) => { e.stopPropagation(); setAds(ads.filter(a => a.id !== ad.id)); }}
                                      className="p-2 text-red-500 opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                              )}
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                  {currentAds.length === 0 && (
                      <div className="p-20 text-center opacity-20">
                        <Package className="mx-auto mb-4" size={48} />
                        <p className="font-black uppercase text-xs tracking-widest">Нет данных для отображения</p>
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}