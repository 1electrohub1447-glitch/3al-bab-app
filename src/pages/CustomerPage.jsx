import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Search, Plus, Minus, Trash2, 
  Clock, Star, User, Bell, X,
  Home, Tag, ShoppingBag, Heart,
  Utensils, ShoppingCart, Pill, Flower2, Store
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CustomerPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [selectedService, setSelectedService] = useState('مطاعم');
  const [selectedStore, setSelectedStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['الكل']);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  const [cart, setCart] = useState([]);
  const [cartStoreId, setCartStoreId] = useState(null); // لتتبع المتجر الحالي المرتبط بالسلة
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // 👤 حالة اسم المستخدم
  const [userName, setUserName] = useState('عميل عالباب');

  // 🔔 حالة ونوافذ الإشعارات
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'مرحباً بك في عالباب! 🚪', desc: 'استمتع بكود الخصم 3ALBAB لتوصيل مجاني.', time: 'منذ قليل', unread: true },
    { id: 2, title: 'عروض المطاعم 🔥', desc: 'خصومات تصل إلى 30% على وجبات الغداء اليوم.', time: 'منذ ساعة', unread: true }
  ]);
  
  const navigate = useNavigate();
  const location = useLocation();

  const mainServices = [
    { id: 'مطاعم', name: 'مطاعم', icon: <Utensils size={22} /> },
    { id: 'سوبرماركت', name: 'سوبر ماركت', icon: <ShoppingCart size={22} /> },
    { id: 'صيدليات', name: 'صيدليات', icon: <Pill size={22} /> },
    { id: 'زهور', name: 'زهور', icon: <Flower2 size={22} /> },
    { id: 'متاجر محلية', name: 'متاجر محلية', icon: <Store size={22} /> },
  ];

  useEffect(() => {
    fetchUserData();
    fetchStores();
  }, []);

  // إغلاق قائمة التنبيهات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (profile?.name) {
          setUserName(profile.name);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.log('تعذر جلب اسم المستخدم، سيتم استخدام الافتراضي');
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      
      const allStores = data || [];
      setStores(allStores);
      filterStoresByService(allStores, 'مطاعم');
    } catch (err) {
      console.error('خطأ في جلب المتاجر:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterStoresByService = (allStores, serviceId) => {
    setSelectedService(serviceId);
    setProducts([]); 
    setSelectedCategory('الكل');

    const matched = allStores.filter(s => {
      const storeCat = (s.category || '').trim().toLowerCase();
      const targetCat = serviceId.trim().toLowerCase();
      return storeCat === targetCat || storeCat.includes(targetCat);
    });

    setFilteredStores(matched);

    if (matched.length > 0) {
      handleSelectStore(matched[0]);
    } else {
      setSelectedStore(null);
      setProducts([]);
      setCategories(['الكل']);
    }
  };

  const handleSelectStore = async (store) => {
    if (!store) return;
    setSelectedStore(store);
    setSelectedCategory('الكل');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id);

      if (error) throw error;
      
      const fetchedProducts = data || [];
      setProducts(fetchedProducts);

      const uniqueCats = ['الكل', ...new Set(fetchedProducts.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCats);
    } catch (err) {
      console.error('خطأ في جلب المنتجات:', err.message);
    }
  };

  // 🛒 تعديل إضافة السلة للتحقق من أن المنتجات من نفس المتجر
  const addToCart = (product) => {
    if (cartStoreId && cartStoreId !== selectedStore.id) {
      const confirmChange = window.confirm('تحتوي سلتك على منتجات من متجر آخر. هل تريد إفراغ السلة وإضافة منتج من هذا المتجر؟');
      if (!confirmChange) return;
      setCart([{ ...product, quantity: 1 }]);
      setCartStoreId(selectedStore.id);
      return;
    }

    setCartStoreId(selectedStore.id);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, itemNotes: '' }];
    });
  };

  const updateQuantity = (id, amount) => {
    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + amount;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
      
      if (updated.length === 0) {
        setCartStoreId(null);
      }
      return updated;
    });
  };

  const removeItem = (id) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setCartStoreId(null);
      }
      return updated;
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('⚠️ السلة فارغة!');
    if (!deliveryAddress.trim()) return alert('⚠️ يرجى إدخال عنوان التوصيل أولاً!');

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user?.id || null,
            store_id: cartStoreId || selectedStore.id,
            total_price: totalAmount,
            status: 'PENDING',
            items: cart,
            delivery_address: deliveryAddress,
            notes: orderNotes
          }
        ])
        .select()
        .single();

      if (error) throw error;

      alert('🚀 تم إرسال طلبك بنجاح!');
      setCart([]);
      setCartStoreId(null);
      setOrderNotes('');
      setShowCartDrawer(false);
      navigate(`/orders`);
    } catch (err) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#FF6A00', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
        <h2>جاري تحميل تطبيق عالباب... 🚪</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '90px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Cairo, system-ui, sans-serif', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }} dir="rtl">
      
      {/* 🔴 الهيدر العلوي */}
      <div style={{ background: '#FF6A00', padding: '16px 20px 24px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', color: '#fff', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6A00', fontWeight: 'bold' }}>
              <User size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>مرحباً بك 👋</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{userName}</div>
            </div>
          </div>

          {/* 🔔 التنبيهات */}
          <div style={{ position: 'relative' }} ref={notificationRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setNotifications(notifications.map(n => ({ ...n, unread: false })));
              }} 
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px', borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#fff', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #FF6A00' }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '48px', left: '0', width: '280px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '12px', zIndex: 110, color: '#222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>التنبيهات</span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={16} /></button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>لا توجد تنبيهات حالية</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FF6A00' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{n.desc}</div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🔍 شريط البحث */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="ابحث عن طعام، منتج أو متجر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 42px 12px 16px',
              borderRadius: '14px',
              border: 'none',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
            }}
          />
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '12px' }} />
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '-12px' }}>
        
        {/* 🥖 البنر العروضي */}
        <div style={{ background: 'linear-gradient(135deg, #FF6A00 0%, #ff8c3b 100%)', borderRadius: '18px', padding: '16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', boxShadow: '0 6px 16px rgba(255,106,0,0.25)' }}>
          <div>
            <span style={{ background: '#222222', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>عرض خاص</span>
            <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px' }}>توصيل مجاني لطلبك الأول!</h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>استخدم الكود: <strong>3ALBAB</strong></p>
          </div>
          <div style={{ fontSize: '36px' }}>🎁</div>
        </div>

        {/* 🏪 الأقسام الرئيسية */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#222222' }}>الأقسام الرئيسية</h3>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {mainServices.map((service) => {
              const isSelected = selectedService === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => filterStoresByService(stores, service.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    minWidth: '72px',
                    padding: '10px 8px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #FF6A00' : '1px solid #E2E8F0',
                    background: isSelected ? '#FFF5EE' : '#fff',
                    color: isSelected ? '#FF6A00' : '#475569',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ color: isSelected ? '#FF6A00' : '#64748B' }}>
                    {service.icon}
                  </div>
                  <span>{service.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🏬 قائمة المتاجر */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#222222' }}>
            المتاجر القريبة ({filteredStores.length})
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {filteredStores.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 0' }}>لا توجد متاجر متاحة في هذا القسم حالياً</div>
            ) : (
              filteredStores.map((s) => {
                const isSelected = selectedStore?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStore(s)}
                    style={{
                      minWidth: '150px',
                      padding: '12px',
                      borderRadius: '16px',
                      background: isSelected ? '#FFF5EE' : '#fff',
                      border: isSelected ? '2px solid #FF6A00' : '1px solid #E2E8F0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: isSelected ? '#FF6A00' : '#222222', marginBottom: '4px' }}>
                      {s.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#EAB308', fontWeight: 'bold' }}>
                        <Star size={12} fill="#EAB308" /> {s.rating || '4.8'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={12} /> {s.delivery_time || '20-35 د'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 🏷️ فئات الأصناف */}
        {selectedStore && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCategory === cat ? '#FF6A00' : '#fff',
                  color: selectedCategory === cat ? '#fff' : '#64748B',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 🍕 قائمة الأصناف والمنتجات */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!selectedStore ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '20px 0' }}>يرجى اختيار متجر لعرض المنتجات</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', padding: '20px 0' }}>لا توجد منتجات متاحة لهذا المتجر حالياً</div>
            ) : (
              filteredProducts.map((prod) => (
                <div key={prod.id} style={{ background: '#fff', borderRadius: '16px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                  <img 
                    src={prod.image_url || 'https://via.placeholder.com/100'} 
                    alt={prod.name} 
                    style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} 
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#222222' }}>{prod.name}</h4>
                    <p style={{ margin: '0 0 6px 0', color: '#64748B', fontSize: '11px', lineHeight: '1.3' }}>
                      {prod.description || 'منتج طازج عالي الجودة متوفر لدى المتجر.'}
                    </p>
                    <div style={{ fontWeight: 'bold', color: '#FF6A00', fontSize: '14px' }}>
                      {prod.price} ل.س
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    style={{
                      background: '#FF6A00',
                      color: '#fff',
                      border: 'none',
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 🛒 شريط السلة العائم */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '70px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '448px', zIndex: 90 }}>
          <button
            onClick={() => setShowCartDrawer(true)}
            style={{
              width: '100%',
              background: '#FF6A00',
              color: '#fff',
              border: 'none',
              padding: '14px 20px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 20px rgba(255,106,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#fff', color: '#FF6A00', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                {totalItemsCount}
              </span>
              <span>عرض السلة</span>
            </div>
            <span>{totalAmount} ل.س</span>
          </button>
        </div>
      )}

      {/* 📄 نافذة السلة السفلية */}
      {showCartDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#222222' }}>سلة الطلبات</h3>
              <button onClick={() => setShowCartDrawer(false)} style={{ background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>إغلاق ✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #F1F5F9', paddingBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#FF6A00' }}>{(Number(item.price) || 0) * item.quantity} ل.س</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ background: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><Minus size={12} /></button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ background: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /></button>
                    <button onClick={() => removeItem(item.id)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#222222', display: 'block', marginBottom: '4px' }}>📍 عنوان التوصيل</label>
              <input
                type="text"
                placeholder="أدخل عنوانك بالتفصيل"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#222222', display: 'block', marginBottom: '4px' }}>💬 ملاحظات للطلب</label>
              <input
                type="text"
                placeholder="أيها المندوب، الاتصال عند الوصول..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '16px' }}>
              <span>المجموع:</span>
              <span style={{ color: '#FF6A00' }}>{totalAmount} ل.س</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              style={{
                width: '100%',
                background: '#34A853',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب 🚀'}
            </button>

          </div>
        </div>
      )}

      {/* 📱 شريط التنقل السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: 80 }}>
        <div 
          onClick={() => navigate('/')} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname === '/' ? '#FF6A00' : '#94A3B8', fontSize: '11px', fontWeight: location.pathname === '/' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          <Home size={20} />
          <span>الرئيسية</span>
        </div>
        
        <div 
          onClick={() => navigate('/offers')} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname === '/offers' ? '#FF6A00' : '#94A3B8', fontSize: '11px', fontWeight: location.pathname === '/offers' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          <Tag size={20} />
          <span>العروض</span>
        </div>

        <div 
          onClick={() => navigate('/orders')} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname === '/orders' ? '#FF6A00' : '#94A3B8', fontSize: '11px', fontWeight: location.pathname === '/orders' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          <ShoppingBag size={20} />
          <span>الطلبات</span>
        </div>

        <div 
          onClick={() => navigate('/favorites')} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname === '/favorites' ? '#FF6A00' : '#94A3B8', fontSize: '11px', fontWeight: location.pathname === '/favorites' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          <Heart size={20} />
          <span>المفضلة</span>
        </div>

        <div 
          onClick={() => navigate('/profile')} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname === '/profile' ? '#FF6A00' : '#94A3B8', fontSize: '11px', fontWeight: location.pathname === '/profile' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          <User size={20} />
          <span>حسابي</span>
        </div>
      </div>

    </div>
  );
}