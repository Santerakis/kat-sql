import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, Home, Folder, Package,
  Settings, Eye, Trash2, FolderPlus, Tag, ListPlus,
  CheckCircle2, ArrowLeft, ExternalLink, Plus
} from 'lucide-react';

// --- ИНИЦИАЛЬНЫЕ ДАННЫЕ ---
const generateInitialData = () => {
  const categories = [
    {
      id: 1,
      name: "Электроника",
      parent_id: null,
      attributesConfig: []
    },
    {
      id: 2,
      name: "Смартфоны",
      parent_id: 1,
      attributesConfig: [
        { name: "Бренд", options: ["Apple", "Samsung", "Xiaomi"] },
        { name: "Память", options: ["128GB", "256GB", "512GB"] }
      ]
    }
  ];
  return { categories, ads: [] };
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories_v6');
    return saved ? JSON.parse(saved) : generateInitialData().categories;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('db_ads_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState(null);
  const [selectedAdId, setSelectedAdId] = useState(null);

  useEffect(() => {
    localStorage.setItem('db_categories_v6', JSON.stringify(categories));
    localStorage.setItem('db_ads_v6', JSON.stringify(ads));
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
    if (!isAdmin) return; // Только для админа
    const name = prompt("Название категории:");
    if (!name) return;
    const isLeaf = window.confirm("Это конечная категория с фиксированными значениями?");
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
    // Теперь доступно и в обычном режиме
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
            <button onClick={() => setSelectedAdId(null)} className="flex items-center gap-2 mb-8 opacity-60 hover:opacity-100 transition-all font-black uppercase text-xs tracking-widest">
              <ArrowLeft size={18} /> Вернуться в каталог
            </button>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 p-10 rounded-[48px] shadow-2xl ${isAdmin ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="aspect-square bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 border-4 border-white">
                <Package size={140} strokeWidth={1} />
              </div>
              <div className="flex flex-col">
                <span className="bg-blue-600 text-white self-start px-3 py-1 rounded-full font-black uppercase tracking-tighter text-[9px] mb-4">Product Unit</span>
                <h1 className="text-5xl font-black mb-2 tracking-tighter leading-none">{selectedAd.title}</h1>
                <div className="text-4xl font-black text-blue-600 mb-10 tracking-tight">{selectedAd.price.toLocaleString()} ₽</div>

                <div className="space-y-2 mt-auto">
                  <p className="font-black text-[10px] opacity-30 uppercase tracking-[0.2em] mb-4">Specifications</p>
                  {Object.entries(selectedAd.attributes).map(([k, v]) => (
                      <div key={k} className={`flex justify-between items-center p-5 rounded-3xl border ${isAdmin ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <span className="opacity-40 font-bold text-sm uppercase tracking-tight">{k}</span>
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
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}
          <header className="flex justify-between items-center mb-10">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Store<span className="text-blue-500">Pro</span></h1>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Data Management System</span>
            </div>
            <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    isAdmin ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm border'
                }`}
            >
              {isAdmin ? <><Eye size={14}/> View Mode</> : <><Settings size={14}/> Admin Panel</>}
            </button>
          </header>

          {/* NAVIGATION */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
            <nav className={`flex-1 flex items-center gap-2 text-sm p-3.5 rounded-3xl shadow-sm overflow-x-auto ${isAdmin ? 'bg-slate-800' : 'bg-white'}`}>
              <button onClick={() => setCurrentId(null)} className="p-1.5 opacity-40 hover:opacity-100 hover:text-blue-500 transition-all"><Home size={20}/></button>
              {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight size={14} className="opacity-20 flex-shrink-0" />
                    <button onClick={() => setCurrentId(bc.id)} className="hover:text-blue-500 px-2 font-black tracking-tight whitespace-nowrap">{bc.name}</button>
                  </React.Fragment>
              ))}
            </nav>

            {/* Кнопка добавления товара в режиме ПРОСМОТРА */}
            {canCreateAd && !isAdmin && (
                <button
                    onClick={createAd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Plus size={18} /> Добавить товар
                </button>
            )}
          </div>

          {/* ADMIN ACTIONS */}
          {isAdmin && (
              <div className="flex gap-3 mb-8">
                {canCreateSubCategory && (
                    <button onClick={createCategory} className="flex-1 flex items-center justify-center gap-3 bg-slate-700 p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-slate-600 transition-all">
                      <FolderPlus size={20} /> Создать новую подкатегорию
                    </button>
                )}
                {canCreateAd && (
                    <button onClick={createAd} className="flex-1 flex items-center justify-center gap-3 bg-blue-600 p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-blue-500 transition-all">
                      <ListPlus size={20} /> Новый товар по шаблону
                    </button>
                )}
              </div>
          )}

          {/* CONTENT */}
          <div className="mb-4 flex items-end justify-between px-2">
            <h2 className="text-4xl font-black tracking-tighter">
              {currentCategory ? currentCategory.name : "Главный каталог"}
            </h2>
            {canCreateAd && (
                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Items: {currentAds.length}</span>
            )}
          </div>

          {/* CATEGORIES GRID */}
          {!hasAttributes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {subCats.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCurrentId(cat.id)}
                        className={`flex items-center justify-between p-7 rounded-[36px] transition-all border-2 border-transparent text-left relative group ${
                            isAdmin ? 'bg-slate-800 hover:border-slate-600' : 'bg-white hover:shadow-2xl hover:border-blue-500/10'
                        }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-[24px] ${cat.attributesConfig?.length > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400'}`}>
                          {cat.attributesConfig?.length > 0 ? <Tag size={24}/> : <Folder size={24}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xl tracking-tight leading-tight">{cat.name}</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-1">
                        {cat.attributesConfig?.length > 0 ? 'Terminal Leaf' : 'Group Folder'}
                    </span>
                        </div>
                      </div>
                      {isAdmin && (
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Удалить?")) setCategories(categories.filter(c => c.id !== cat.id)) }} className="absolute -right-1 -top-1 p-2.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-xl transition-all scale-75 group-hover:scale-100">
                            <Trash2 size={14} />
                          </button>
                      )}
                    </button>
                ))}
              </div>
          )}

          {/* PRODUCTS TABLE */}
          {hasAttributes && (
              <div className={`rounded-[40px] shadow-2xl overflow-hidden border-4 border-white ${isAdmin ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className={`text-[9px] font-black uppercase tracking-[0.2em] ${isAdmin ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                      <th className="p-8">Продукт</th>
                      <th className="p-8">Стоимость</th>
                      {currentCategory.attributesConfig.map(attr => (
                          <th key={attr.name} className="p-8">{attr.name}</th>
                      ))}
                      <th className="p-8 text-right">Детали</th>
                    </tr>
                    </thead>
                    <tbody className={`divide-y ${isAdmin ? 'divide-slate-700' : 'divide-slate-50'}`}>
                    {currentAds.map(ad => (
                        <tr
                            key={ad.id}
                            onClick={() => setSelectedAdId(ad.id)}
                            className="group cursor-pointer hover:bg-blue-600/[0.03] transition-colors"
                        >
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Package size={20} />
                              </div>
                              <span className="font-black text-lg tracking-tight">{ad.title}</span>
                            </div>
                          </td>
                          <td className="p-8">
                        <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl font-black text-sm">
                            {ad.price.toLocaleString()} ₽
                        </span>
                          </td>
                          {currentCategory.attributesConfig.map(attr => (
                              <td key={attr.name} className="p-8">
                                <span className="font-bold opacity-60 text-sm">{ad.attributes[attr.name] || '—'}</span>
                              </td>
                          ))}
                          <td className="p-8 text-right">
                            <div className="flex justify-end gap-3">
                              <div className="p-3 bg-slate-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">
                                <ExternalLink size={18} />
                              </div>
                              {isAdmin && (
                                  <button
                                      onClick={(e) => { e.stopPropagation(); setAds(ads.filter(a => a.id !== ad.id)); }}
                                      className="p-3 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all rounded-2xl"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                              )}
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                  {currentAds.length === 0 && (
                      <div className="py-32 text-center">
                        <Package className="mx-auto mb-6 opacity-10" size={80} strokeWidth={1} />
                        <p className="font-black uppercase text-[10px] tracking-[0.3em] opacity-30">No inventory detected</p>
                      </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}