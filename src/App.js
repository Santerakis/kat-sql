import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, ChevronLeft, FolderPlus, Tag,
  Trash2, Home, Folder, Package
} from 'lucide-react';

// --- ДАННЫЕ ДЛЯ ПЕРВОГО ЗАПУСКА (БАЗА КАТЕГОРИЙ) ---
const INITIAL_CATEGORIES = [
  {"id": 1, "name": "Электроника", "parent_id": null},
  {"id": 11, "name": "Смартфоны", "parent_id": 1},
  {"id": 111, "name": "Apple", "parent_id": 11},
  {"id": 1111, "name": "iPhone 15 Series", "parent_id": 111},
  {"id": 11111, "name": "iPhone 15 Pro Max", "parent_id": 1111},
  {"id": 12, "name": "Ноутбуки", "parent_id": 1},
  {"id": 121, "name": "Игровые", "parent_id": 12},
  {"id": 13, "name": "Фотокамеры", "parent_id": 1},
  {"id": 2, "name": "Транспорт", "parent_id": null},
  {"id": 21, "name": "Легковые авто", "parent_id": 2},
  {"id": 212, "name": "Внедорожники", "parent_id": 21},
  {"id": 2121, "name": "BMW", "parent_id": 212},
  {"id": 21211, "name": "BMW X5", "parent_id": 2121},
  {"id": 3, "name": "Недвижимость", "parent_id": null},
  {"id": 31, "name": "Квартиры", "parent_id": 3},
  {"id": 311, "name": "Продажа", "parent_id": 31},
  {"id": 3111, "name": "Новостройки", "parent_id": 311},
  {"id": 4, "name": "Дом и Сад", "parent_id": null},
  {"id": 41, "name": "Мебель", "parent_id": 4},
  {"id": 411, "name": "Диваны", "parent_id": 411},
  {"id": 5, "name": "Животные", "parent_id": null},
  {"id": 51, "name": "Собаки", "parent_id": 5},
  {"id": 52, "name": "Кошки", "parent_id": 5}
];

const INITIAL_ADS = [
  {"id": 101, "category_id": 11111, "title": "iPhone 15 Pro Max 1TB", "price": 145000, "attributes": {"Цвет": "Титан", "АКБ": "100%"}},
  {"id": 201, "category_id": 21211, "title": "BMW X5 G05 M-Sport", "price": 7500000, "attributes": {"Год": "2022", "Двигатель": "Дизель"}},
  {"id": 301, "category_id": 3111, "title": "3-к квартира 90м²", "price": 12000000, "attributes": {"ЖК": "Skyline"}},
  {"id": 501, "category_id": 51, "title": "Щенки Корги", "price": 45000, "attributes": {"Возраст": "2 мес"}}
];

export default function App() {
  // --- СОСТОЯНИЕ ---
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('db_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [currentId, setCurrentId] = useState(null);

  // --- СОХРАНЕНИЕ ---
  useEffect(() => {
    localStorage.setItem('db_categories', JSON.stringify(categories));
    localStorage.setItem('db_ads', JSON.stringify(ads));
  }, [categories, ads]);

  // --- ВЫЧИСЛЕНИЯ ---
  const subCats = useMemo(() => categories.filter(c => c.parent_id === currentId), [categories, currentId]);
  const currentAds = useMemo(() => ads.filter(a => a.category_id === currentId), [ads, currentId]);
  const isLeaf = subCats.length === 0 && currentId !== null;

  const breadcrumbs = useMemo(() => {
    const path = [];
    let tempId = currentId;
    while (tempId !== null) {
      const cat = categories.find(c => c.id === tempId);
      if (cat) {
        path.unshift(cat);
        tempId = cat.parent_id;
      } else break;
    }
    return path;
  }, [currentId, categories]);

  // --- ДЕЙСТВИЯ ---
  const addCategory = () => {
    const name = window.prompt("Название подкатегории:");
    if (!name) return;
    setCategories([...categories, { id: Date.now(), name, parent_id: currentId }]);
  };

  const addAd = () => {
    const title = window.prompt("Заголовок:");
    const priceStr = window.prompt("Цена:");
    if (!title || !priceStr) return;
    const price = parseInt(priceStr.replace(/\s/g, '')) || 0;
    setAds([...ads, {
      id: Date.now(),
      category_id: currentId,
      title,
      price,
      attributes: { "Создано": new Date().toLocaleDateString() }
    }]);
  };

  const deleteCategory = (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Удалить категорию и всё внутри неё?")) return;

    const getAllChildren = (parentId) => {
      let ids = [parentId];
      categories.filter(c => c.parent_id === parentId).forEach(child => {
        ids = [...ids, ...getAllChildren(child.id)];
      });
      return ids;
    };

    const toDelete = getAllChildren(id);
    setCategories(categories.filter(c => !toDelete.includes(c.id)));
    setAds(ads.filter(a => !toDelete.includes(a.category_id)));
  };

  return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
        <div className="max-w-2xl mx-auto">

          {/* ХЛЕБНЫЕ КРОШКИ */}
          <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm text-slate-500 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <button
                onClick={() => setCurrentId(null)}
                className={`p-1 rounded hover:bg-slate-100 transition-colors ${currentId === null ? 'text-blue-600' : ''}`}
            >
              <Home size={18} />
            </button>
            {breadcrumbs.map((bc, index) => (
                <React.Fragment key={bc.id}>
                  <ChevronRight size={14} className="text-slate-300" />
                  <button
                      onClick={() => setCurrentId(bc.id)}
                      className={`px-2 py-1 rounded hover:bg-slate-50 transition-colors ${index === breadcrumbs.length - 1 ? 'font-bold text-blue-600' : ''}`}
                  >
                    {bc.name}
                  </button>
                </React.Fragment>
            ))}
          </nav>

          {/* ЗАГОЛОВОК */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              {currentId ? categories.find(c => c.id === currentId)?.name : "Главный каталог"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isLeaf ? "Список объявлений в этом разделе" : "Выберите интересующий вас подраздел"}
            </p>
          </div>

          {/* СПИСОК КАТЕГОРИЙ */}
          <div className="grid gap-3 mb-10">
            {subCats.map(cat => (
                <div key={cat.id} className="group flex items-center">
                  <button
                      onClick={() => setCurrentId(cat.id)}
                      className="flex-1 flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <Folder size={22} fill="currentColor" fillOpacity={0.1} />
                      </div>
                      <span className="font-semibold text-lg">{cat.name}</span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                      onClick={(e) => deleteCategory(cat.id, e)}
                      className="ml-2 p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Удалить"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
            ))}

            <button
                onClick={addCategory}
                className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-300 flex items-center justify-center gap-2 transition-all bg-white hover:bg-blue-50/30"
            >
              <FolderPlus size={20} />
              <span className="font-bold">Добавить подкатегорию</span>
            </button>
          </div>

          {/* СПИСОК ОБЪЯВЛЕНИЙ */}
          {isLeaf && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Объявления</h2>
                  <span className="text-xs font-bold text-slate-400">{currentAds.length} предложений</span>
                </div>

                <div className="grid gap-4">
                  {currentAds.map(ad => (
                      <div key={ad.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-xl text-slate-800 leading-tight">{ad.title}</h3>
                          <div className="text-xl font-black text-blue-600">
                            {ad.price.toLocaleString()} ₽
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ad.attributes).map(([k, v]) => (
                              <div key={k} className="px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                {k}: <span className="text-slate-900">{v}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                  ))}

                  <button
                      onClick={addAd}
                      className="w-full py-6 bg-blue-600 text-white rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                  >
                    <Tag size={20} />
                    Разместить своё объявление
                  </button>
                </div>
              </div>
          )}

          {/* ПУСТОЕ СОСТОЯНИЕ */}
          {!isLeaf && subCats.length === 0 && (
              <div className="text-center py-20 text-slate-300">
                <Package size={64} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">Здесь пока нет подразделов</p>
              </div>
          )}

          {/* FOOTER */}
          <footer className="mt-24 py-8 border-t border-slate-200 text-center">
            <button
                onClick={() => { if(window.confirm("Полностью очистить базу данных и вернуть заводские настройки?")) { localStorage.clear(); window.location.reload(); } }}
                className="text-[10px] font-black text-slate-300 hover:text-red-400 uppercase tracking-[0.2em] transition-colors"
            >
              Сбросить базу данных
            </button>
          </footer>
        </div>
      </div>
  );
}
