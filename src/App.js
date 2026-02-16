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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('current_user_v1');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthMode, setIsAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ login: '', password: '' });
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

  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users_db_v1') || '[]');
    if (isAuthMode === 'register') {
      if (users.find(u => u.login === authForm.login)) return alert("Логин занят");
      const role = users.length === 0 ? 'admin' : 'user';
      const newUser = { ...authForm, role, id: Date.now() };
      localStorage.setItem('users_db_v1', JSON.stringify([...users, newUser]));
      setUser(newUser);
    } else {
      const found = users.find(u => u.login === authForm.login && u.password === authForm.password);
      if (found) setUser(found); else alert("Ошибка входа");
    }
  };

  const logout = () => { setUser(null); setIsAdminMode(false); setSelectedAdId(null); setCurrentId(null); };

  const deleteAd = (adId) => {
    if (window.confirm("Удалить этот товар?")) {
      setAds(ads.filter(a => a.id !== adId));
      setSelectedAdId(null);
    }
  };

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

    const readers = Array.from(e.target.files).map(file => new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(file);
    }));
    const images = await Promise.all(readers);

    const dynamicAttributes = {};
    if (currentCategory && currentCategory.attributesConfig) {
      for (const attr of currentCategory.attributesConfig) {
        if (attr.options && attr.options.length > 0) {
          const optionsList = attr.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
          const choice = prompt(`Выберите "${attr.name}":\n${optionsList}`);
          const index = parseInt(choice, 10) - 1;
          dynamicAttributes[attr.name] = attr.options[index] || attr.options[0];
        } else {
          dynamicAttributes[attr.name] = prompt(`Введите "${attr.name}":`) || "—";
        }
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
          <div className="bg-slate-800 p-8 rounded-[40px] w-full max-w-md shadow-2xl border border-slate-700 text-center">
            <h2 className="text-3xl font-black text-white mb-8 uppercase italic">Store<span className="text-blue-500">Pro</span></h2>
            <form onSubmit={handleAuth} className="space-y-4 text-left">
              <input className="w-full bg-slate-900 border-none rounded-2xl p-4 text-white outline-none" placeholder="Логин" value={authForm.login} onChange={e => setAuthForm({...authForm, login: e.target.value})} required />
              <input type="password" className="w-full bg-slate-900 border-none rounded-2xl p-4 text-white outline-none" placeholder="Пароль" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase mt-4">{isAuthMode === 'login' ? 'Войти' : 'Регистрация'}</button>
            </form>
            <button onClick={() => setIsAuthMode(isAuthMode === 'login' ? 'register' : 'login')} className="text-slate-500 mt-6 text-sm font-bold">{isAuthMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт?'}</button>
          </div>
        </div>
    );
  }

  if (selectedAd) {
    const isOwner = selectedAd.author === user.login || user.role === 'admin';
    return (
        <div className={`min-h-screen p-4 md:p-8 ${isAdminMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setSelectedAdId(null)} className="flex items-center gap-2 mb-8 font-bold opacity-60"><ArrowLeft size={20} /> Назад</button>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 rounded-[40px] shadow-2xl ${isAdminMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="grid grid-cols-2 gap-3">
                {selectedAd.images?.map((img, idx) => <img key={idx} src={img} className="w-full h-64 object-cover rounded-3xl" alt="" />)}
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h1 className="text-4xl font-black mb-4">{selectedAd.title}</h1>
                  <div className="text-3xl font-black text-blue-600 mb-8">{selectedAd.price.toLocaleString()} ₽</div>
                  {Object.entries(selectedAd.attributes).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-4 mb-2 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <span className="opacity-50 font-bold">{k}</span><span className="font-black text-blue-500">{v}</span>
                      </div>
                  ))}
                  <div className="mt-4 text-xs opacity-40 font-bold uppercase">Автор: {selectedAd.author}</div>
                </div>
                {isOwner && (
                    <button
                        onClick={() => deleteAd(selectedAd.id)}
                        className="mt-8 flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} /> Удалить объявление
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className={`min-h-screen p-4 md:p-8 ${isAdminMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-black uppercase italic">Store<span className="text-blue-500">Pro</span></h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs ${isAdminMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className={`p-1.5 rounded-lg ${user.role === 'admin' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="leading-none">{user.login}</span>
                  <span className="text-[9px] opacity-40 uppercase tracking-tighter">{user.role}</span>
                </div>
              </div>
              {user.role === 'admin' && (
                  <button
                      onClick={() => setIsAdminMode(!isAdminMode)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                  >
                    {isAdminMode ? 'В магазин' : 'Управление'}
                  </button>
              )}
              <button onClick={logout} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <nav className="flex items-center gap-2 text-sm p-3 rounded-2xl bg-white shadow-sm mb-6">
            <button onClick={() => setCurrentId(null)} className="opacity-50"><Home size={18}/></button>
            {breadcrumbs.map(bc => <React.Fragment key={bc.id}><ChevronRight size={14} className="opacity-20" /><button onClick={() => setCurrentId(bc.id)} className="font-bold">{bc.name}</button></React.Fragment>)}
          </nav>

          <div className="mb-8">
            {isAdminMode && canCreateSubCategory && <button onClick={createCategory} className="w-full bg-slate-700 p-4 rounded-2xl font-bold text-xs text-white">Создать подкатегорию</button>}
            {canCreateAd && <button onClick={() => fileInputRef.current.click()} className="w-full bg-blue-600 p-4 rounded-2xl font-bold text-xs text-white shadow-lg shadow-blue-500/20">Разместить свой товар</button>}
          </div>

          {!hasAttributes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(currentId === null ? mainCategories : subCats).map(cat => (
                    <button key={cat.id} onClick={() => setCurrentId(cat.id)} className="flex items-center justify-between p-6 rounded-3xl bg-white shadow-sm group relative text-left">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><Folder size={20}/></div>
                        <span className="font-bold text-lg">{cat.name}</span>
                      </div>
                      {isAdminMode && <Trash2 size={16} className="text-red-500 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); if(window.confirm("Удалить?")) setCategories(categories.filter(c => c.id !== cat.id)) }} />}
                    </button>
                ))}
              </div>
          ) : (
              <div className="rounded-3xl shadow-xl overflow-hidden border bg-white border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">
                    <th className="p-6 w-[80px]">Фото</th>
                    <th className="p-6">Наименование</th>
                    <th className="p-6">Цена</th>
                    {currentCategory.attributesConfig.map(attr => (
                        <th key={attr.name} className="p-6">{attr.name}</th>
                    ))}
                    {isAdminMode && <th className="p-6 text-right w-[50px]">Удалить</th>}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {currentAds.map(ad => (
                      <tr key={ad.id} onClick={() => setSelectedAdId(ad.id)} className="group hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="p-6" style={{ width: '82px' }}>
                          <div
                              style={{
                                width: '50px',
                                height: '40px',
                                minWidth: '50px',
                                minHeight: '40px',
                                maxWidth: '50px',
                                maxHeight: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9'
                              }}
                          >
                            {ad.images?.[0] ? (
                                <img
                                    src={ad.images[0]}
                                    style={{ width: '50px', height: '40px', objectFit: 'cover' }}
                                    alt=""
                                />
                            ) : (
                                <ImageIcon className="text-slate-300" size={16}/>
                            )}
                          </div>
                        </td>
                        <td className="p-6 font-bold">{ad.title}</td>
                        <td className="p-6 font-black text-blue-600">{ad.price.toLocaleString()} ₽</td>
                        {currentCategory.attributesConfig.map(attr => (
                            <td key={attr.name} className="p-6 opacity-60 text-sm">
                              {ad.attributes && ad.attributes[attr.name] ? ad.attributes[attr.name] : '—'}
                            </td>
                        ))}
                        {isAdminMode && (
                            <td className="p-6 text-right">
                              <Trash2
                                  size={16}
                                  className="text-red-500 inline hover:scale-125 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAd(ad.id);
                                  }}
                              />
                            </td>
                        )}
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none', position: 'absolute' }} multiple accept="image/*" onChange={onFileChange} />
      </div>
  );
}