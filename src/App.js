import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronRight, Home, Folder, Package,
  Trash2, FolderPlus, Tag, ArrowLeft,
  Image as ImageIcon, Upload, LogOut, User, Lock, ShieldCheck, PlusCircle
} from 'lucide-react';

const generateInitialData = () => {
  const categories = [
    { id: 1, name: "Одежда", parent_id: null, attributesConfig: [] },
    {
      id: 2,
      name: "Мужская",
      parent_id: 1,
      attributesConfig: [
        { name: "Материал", options: ["Хлопок", "Шерсть"] },
        { name: "Размер", options: ["M", "L", "XL"] }
      ]
    },
    {
      id: 3,
      name: "Женская",
      parent_id: 1,
      attributesConfig: [
        { name: "Материал", options: ["Шелк", "Хлопок"] }
      ]
    }
  ];
  return { categories, ads: [] };
};

export default function App() {
  // Auth States
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('current_user_v1');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthMode, setIsAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ login: '', password: '' });

  // App States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('db_categories_v13');
    return saved ? JSON.parse(saved) : generateInitialData().categories;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('db_ads_v13');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentId, setCurrentId] = useState(null);
  const [selectedAdId, setSelectedAdId] = useState(null);

  useEffect(() => {
    localStorage.setItem('db_categories_v13', JSON.stringify(categories));
    localStorage.setItem('db_ads_v13', JSON.stringify(ads));
    localStorage.setItem('current_user_v1', JSON.stringify(user));
  }, [categories, ads, user]);

  const mainCategories = useMemo(() => categories.filter(c => c.parent_id === null), [categories]);
  const subCats = useMemo(() => categories.filter(c => c.parent_id === currentId), [categories, currentId]);
  const currentAds = useMemo(() => ads.filter(a => a.category_id === currentId), [ads, currentId]);
  const currentCategory = useMemo(() => categories.find(c => c.id === currentId), [categories, currentId]);
  const selectedAd = useMemo(() => ads.find(a => a.id === selectedAdId), [ads, selectedAdId]);

  const hasAttributes = currentCategory?.attributesConfig && currentCategory.attributesConfig.length > 0;
  const canCreateSubCategory = !hasAttributes;
  const canCreateAd = hasAttributes; // Теперь доступно всем юзерам в конечной категории

  const breadcrumbs = useMemo(() => {
    const path = [];
    let tempId = currentId;
    while (tempId !== null) {
      const cat = categories.find(c => c.id === tempId);
      if (cat) { path.unshift(cat); tempId = cat.parent_id; } else break;
    }
    return path;
  }, [currentId, categories]);

  // Auth Handlers
  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users_db_v1') || '[]');

    if (isAuthMode === 'register') {
      if (users.find(u => u.login === authForm.login)) return alert("Логин занят");
      const role = users.length === 0 ? 'admin' : 'user';
      const newUser = { ...authForm, role, id: Date.now() };
      localStorage.setItem('users_db_v1', JSON.stringify([...users, newUser]));
      setUser(newUser);
      alert(role === 'admin' ? "Вы Админ!" : "Регистрация успешна");
    } else {
      const found = users.find(u => u.login === authForm.login && u.password === authForm.password);
      if (found) setUser(found);
      else alert("Ошибка входа");
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdminMode(false);
    setSelectedAdId(null);
    setCurrentId(null);
  };

  // Content Handlers
  const createCategory = () => {
    if (user?.role !== 'admin') return;
    const name = prompt("Название категории:");
    if (!name) return;
    const isLeaf = window.confirm("Это конечная категория с характеристиками?");
    let attributesConfig = [];
    if (isLeaf) {
      const attrsRaw = prompt("Формат: Цвет:Красный,Синий;Размер:S,M,L");
      if (attrsRaw) {
        attributesConfig = attrsRaw.split(';').map(part => {
          const [attrName, optionsRaw] = part.split(':');
          return { name: attrName?.trim(), options: optionsRaw ? optionsRaw.split(',').map(o => o.trim()) : [] };
        });
      }
    }
    setCategories([...categories, { id: Date.now(), name, parent_id: currentId, attributesConfig }]);
  };

  const onFileChange = async (e) => {
    if (!e.target.files.length) return;
    const title = prompt("Название товара:");
    const priceStr = prompt("Цена:");
    if (!title || !priceStr) { e.target.value = ''; return; }

    const readers = Array.from(e.target.files).map(file => {
      return new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(file);
      });
    });
    const images = await Promise.all(readers);

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
    setAds([...ads, {
      id: Date.now(),
      category_id: currentId,
      title,
      price: parseInt(priceStr, 10),
      attributes: dynamicAttributes,
      images,
      author: user.login
    }]);
    e.target.value = '';
  };

  if (!user) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-[40px] w-full max-w-md shadow-2xl border border-slate-700">
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">
              Store<span className="text-blue-500">Pro</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest">
              {isAuthMode === 'login' ? 'Авторизация' : 'Регистрация'}
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-500" size={20} />
                <input
                    className="w-full bg-slate-900 border-none rounded-2xl p-4 pl-12 text-white focus:ring-2 ring-blue-500 transition-all outline-none"
                    placeholder="Логин"
                    value={authForm.login}
                    onChange={e => setAuthForm({...authForm, login: e.target.value})}
                    required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
                <input
                    type="password"
                    className="w-full bg-slate-900 border-none rounded-2xl p-4 pl-12 text-white focus:ring-2 ring-blue-500 transition-all outline-none"
                    placeholder="Пароль"
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    required
                />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest mt-4">
                {isAuthMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>
            <button
                onClick={() => setIsAuthMode(isAuthMode === 'login' ? 'register' : 'login')}
                className="w-full text-slate-500 mt-6 text-sm font-bold hover:text-white transition-colors"
            >
              {isAuthMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт?'}
            </button>
          </div>
        </div>
    );
  }

  if (selectedAd) {
    return (
        <div className={`min-h-screen p-4 md:p-8 ${isAdminMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setSelectedAdId(null)} className="flex items-center gap-2 mb-8 opacity-60 hover:opacity-100 transition-all font-bold">
              <ArrowLeft size={20} /> Назад
            </button>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 rounded-[40px] shadow-2xl ${isAdminMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="space-y-4">
                {selectedAd.images?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAd.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-full h-64 object-cover rounded-3xl shadow-sm" />
                      ))}
                    </div>
                ) : (
                    <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                      <Package size={120} />
                    </div>
                )}
              </div>
              <div>
                <span className="text-blue-500 font-black uppercase tracking-widest text-[10px]">Информация</span>
                <h1 className="text-4xl font-black mt-2 mb-4 tracking-tighter">{selectedAd.title}</h1>
                <div className="text-3xl font-black text-blue-600 mb-2">{selectedAd.price.toLocaleString()} ₽</div>
                <div className="text-[10px] opacity-40 font-bold mb-8 uppercase tracking-widest">Продавец: {selectedAd.author || 'Система'}</div>
                <div className="space-y-3">
                  {Object.entries(selectedAd.attributes).map(([k, v]) => (
                      <div key={k} className={`flex justify-between p-4 rounded-2xl border ${isAdminMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
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
      <div className={`min-h-screen p-4 md:p-8 font-sans ${isAdminMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Store<span className="text-blue-500">Pro</span></h1>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest mt-1">
                <span className="opacity-50 uppercase">{user.login}</span>
                {user.role === 'admin' && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck size={10}/> ADMIN</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {user.role === 'admin' && (
                  <button
                      onClick={() => setIsAdminMode(!isAdminMode)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm border'}`}
                  >
                    {isAdminMode ? 'В магазин' : 'Управление'}
                  </button>
              )}
              <button onClick={logout} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <nav className={`flex items-center gap-2 text-sm p-3 rounded-2xl shadow-sm mb-6 ${isAdminMode ? 'bg-slate-800' : 'bg-white'}`}>
            <button onClick={() => setCurrentId(null)} className="p-1 opacity-50"><Home size={18}/></button>
            {breadcrumbs.map(bc => (
                <React.Fragment key={bc.id}>
                  <ChevronRight size={14} className="opacity-20" />
                  <button onClick={() => setCurrentId(bc.id)} className="hover:text-blue-500 px-1 font-bold">{bc.name}</button>
                </React.Fragment>
            ))}
          </nav>

          {/* Панель действий */}
          <div className="mb-8">
            {isAdminMode && user.role === 'admin' && canCreateSubCategory && (
                <button onClick={createCategory} className="w-full flex items-center justify-center gap-2 bg-slate-700 p-4 rounded-2xl font-bold text-xs text-white">
                  <FolderPlus size={18} /> Создать подкатегорию
                </button>
            )}

            {/* Кнопка добавления товара: доступна ВСЕМ в конечной категории */}
            {!isAdminMode && canCreateAd && (
                <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 p-4 rounded-2xl font-bold text-xs text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <PlusCircle size={18} /> Разместить свой товар
                </button>
            )}

            {isAdminMode && user.role === 'admin' && canCreateAd && (
                <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 bg-blue-600 p-4 rounded-2xl font-bold text-xs text-white">
                  <Upload size={18} /> Добавить товар (Admin)
                </button>
            )}
          </div>

          {currentId === null ? (
              <div className="space-y-8">
                {mainCategories.map(mainCat => {
                  const children = categories.filter(c => c.parent_id === mainCat.id);
                  return (
                      <div key={mainCat.id} className={`p-6 rounded-[32px] ${isAdminMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-100/10">
                          <button
                              onClick={() => setCurrentId(mainCat.id)}
                              className="text-2xl font-black tracking-tight hover:text-blue-500 transition-colors flex items-center gap-2"
                          >
                            <Folder className="text-blue-500" size={24} />
                            {mainCat.name}
                          </button>
                          {isAdminMode && user.role === 'admin' && (
                              <button onClick={() => { if(window.confirm("Удалить?")) setCategories(categories.filter(c => c.id !== mainCat.id)) }} className="text-red-500 opacity-50 hover:opacity-100">
                                <Trash2 size={18} />
                              </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 pl-8">
                          {children.length > 0 ? children.map(child => (
                              <button
                                  key={child.id}
                                  onClick={() => setCurrentId(child.id)}
                                  className="text-left py-1 font-bold opacity-70 hover:opacity-100 hover:text-blue-500 transition-all flex items-center gap-2 group"
                              >
                                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">•</span>
                                {child.name}
                              </button>
                          )) : <span className="text-xs opacity-30 italic">Пусто</span>}
                        </div>
                      </div>
                  );
                })}
              </div>
          ) : !hasAttributes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subCats.map(cat => (
                    <button key={cat.id} onClick={() => setCurrentId(cat.id)} className={`flex items-center justify-between p-6 rounded-3xl relative group ${isAdminMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${cat.attributesConfig?.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {cat.attributesConfig?.length > 0 ? <Tag size={20}/> : <Folder size={20}/>}
                        </div>
                        <span className="font-bold text-lg">{cat.name}</span>
                      </div>
                      {isAdminMode && user.role === 'admin' && (
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Удалить?")) setCategories(categories.filter(c => c.id !== cat.id)) }} className="absolute -right-1 -top-1 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 z-10">
                            <Trash2 size={12} />
                          </button>
                      )}
                    </button>
                ))}
              </div>
          ) : (
              <div className={`rounded-3xl shadow-xl overflow-hidden border ${isAdminMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest ${isAdminMode ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                      <th className="p-6">Фото</th>
                      <th className="p-6">Наименование</th>
                      <th className="p-6">Цена</th>
                      {currentCategory.attributesConfig.map(attr => <th key={attr.name} className="p-6">{attr.name}</th>)}
                      {isAdminMode && user.role === 'admin' && <th className="p-6 text-right">Удалить</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/5">
                    {currentAds.map(ad => (
                        <tr key={ad.id} onClick={() => setSelectedAdId(ad.id)} className="group hover:bg-blue-500/5 cursor-pointer transition-colors">
                          <td className="p-6">
                            <div className="w-12 h-10 rounded-md overflow-hidden bg-slate-100">
                              {ad.images?.[0] ? <img src={ad.images[0]} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="m-auto text-slate-300" size={14}/>}
                            </div>
                          </td>
                          <td className="p-6 font-bold">{ad.title}</td>
                          <td className="p-6 font-black text-blue-600">{ad.price.toLocaleString()} ₽</td>
                          {currentCategory.attributesConfig.map(attr => <td key={attr.name} className="p-6 opacity-60 text-sm">{ad.attributes[attr.name] || '—'}</td>)}
                          {isAdminMode && user.role === 'admin' && (
                              <td className="p-6 text-right">
                                <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Удалить?")) setAds(ads.filter(a => a.id !== ad.id)); }} className="p-2 text-red-500">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                          )}
                        </tr>
                    ))}
                    </tbody>
                  </table>
                  {currentAds.length === 0 && (
                      <div className="p-20 text-center opacity-20 font-bold uppercase tracking-widest">Товаров пока нет</div>
                  )}
                </div>
              </div>
          )}
        </div>

        <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none', position: 'absolute', width: 0, height: 0, opacity: 0 }}
            multiple
            accept="image/*"
            onChange={onFileChange}
        />
      </div>
  );
}