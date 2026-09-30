import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  PlusCircle, 
  Trash2, 
  Package, 
  Utensils, 
  Store, 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Edit3,
  Power,
  ShieldAlert,
  CreditCard,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// 1. مكون التحقق من اشتراك المطعم (مع الشهر التجريبي المجاني الأول)
function StoreSubscriptionWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب أحدث اشتراك للمطعم
      let { data, error } = await supabase
        .from('store_subscriptions')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // إذا لم يكن لديه اشتراك مسبق، نقوم بمنحه اشتراك تجريبي مجاني لشهر تلقائياً!
      if (!data && !error) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // شهر مجاني

        const { data: newSub, error: insertError } = await supabase
          .from('store_subscriptions')
          .insert([
            {
              store_id: user.id,
              plan_type: 'MONTHLY',
              status: 'TRIAL',
              is_trial: true,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString()
            }
          ])
          .select()
          .single();

        if (!insertError) {
          data = newSub;
        }
      }

      if (data) {
        setSubscription(data);
        const now = new Date();
        const expiry = new Date(data.end_date);
        if (now > expiry) {
          setIsExpired(true);
        }
      }
    } catch (err) {
      console.error('❌ خطأ في التحقق من الاشتراك:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '14px' }}>
        جاري التحقق من باقة الاشتراك...
      </div>
    );
  }

  // إذا انتهى الاشتراك أو فترة التجربة
  if (isExpired || subscription?.status === 'EXPIRED') {
    return (
      <div dir="rtl" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', maxWidth: '420px', width: '100%', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', background: '#fff7ed', color: '#FF6A00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <ShieldAlert size={36} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
            انتهت فترة الاشتراك المجاني! 🛑
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
            لقد انتهت فترة التجربة المجانية الخاصة بمتجرك. لتستمر في استقبال الطلبات وعرض منتجاتك للزبائن، يرجى تجديد الاشتراك.
          </p>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>الباقات المتاحة:</span>
            <span style={{ fontWeight: 'bold', color: '#FF6A00' }}>شهري / 3 شهور / سنوي</span>
          </div>

          <button
            onClick={() => alert('سيتم تحويلك لصفحة الدفع وتفعيل الباقة قريباً!')}
            style={{ width: '100%', padding: '12px', background: '#FF6A00', color: '#fff', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CreditCard size={16} />
            <span>تجديد الاشتراك الآن</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* شريط تنبيهي لطيف يوضح للمطعم أنه في الفترة التجريبية */}
      {subscription?.is_trial && (
        <div dir="rtl" style={{ background: 'linear-gradient(to right, #f97316, #f59e0b)', color: '#fff', padding: '8px 16px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <Sparkles size={14} />
            <span>أنت تستمتع الآن بالشهر التجريبي المجاني الأول لتطبيق "عالباب"!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.95, fontFamily: 'monospace' }}>
            <Clock size={12} />
            <span>ينتهي في: {new Date(subscription.end_date).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// 2. المكون الأساسي للوحة التحكم
export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'وجبات',
    description: '',
    image_url: '',
    is_available: true
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    let channel = null;

    const initDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_active')
          .eq('id', user.id)
          .single();

        if (userError || !userData || !userData.is_active) {
          setLoading(false);
          return;
        }

        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (storeData) {
          setStore(storeData);

          await Promise.all([
            fetchProducts(storeData.id),
            fetchOrders(storeData.id)
          ]);

          channel = supabase
            .channel(`store:orders:${storeData.id}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeData.id}` },
              () => {
                fetchOrders(storeData.id);
                toast.success('📦 وردك طلب جديد!');
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error('Error initializing dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async (storeId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data);
  };

  const fetchOrders = async (storeId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('✅ تم تحديث حالة الطلب');
    } catch (err) {
      toast.error('خطأ في تحديث الحالة: ' + err.message);
    }
  };

  const toggleStoreStatus = async () => {
    if (!store) return;
    setTogglingStore(true);
    try {
      const newStatus = !store.is_open;
      const { error } = await supabase
        .from('stores')
        .update({ is_open: newStatus })
        .eq('id', store.id);

      if (error) throw error;

      setStore(prev => ({ ...prev, is_open: newStatus }));
      toast.success(newStatus ? '🟢 تم فتح المتجر بنجاح' : '🔴 تم إغلاق المتجر مؤقتاً');
    } catch (err) {
      toast.error('خطأ في تغيير حالة المتجر: ' + err.message);
    } finally {
      setTogglingStore(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      toast.error('فشل رفع الصورة: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('يرجى إدخال اسم المنتج والسعر');
      return;
    }

    if (!store) {
      toast.error('ليس لديك متجر!');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newProduct.image_url;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          description: newProduct.description,
          image_url: imageUrl || 'https://via.placeholder.com/150',
          is_available: newProduct.is_available
        }).eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('✅ تم تعديل المنتج بنجاح!');
      } else {
        const { error } = await supabase.from('products').insert([{
          store_id: store.id,
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          description: newProduct.description,
          image_url: imageUrl || 'https://via.placeholder.com/150',
          is_available: newProduct.is_available
        }]);

        if (error) throw error;
        toast.success('✅ تم إضافة المنتج بنجاح!');
      }

      closeModal();
      fetchProducts(store.id);
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setNewProduct({
      name: prod.name,
      price: prod.price,
      category: prod.category || 'وجبات',
      description: prod.description || '',
      image_url: prod.image_url || '',
      is_available: prod.is_available
    });
    setImagePreview(prod.image_url || null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({ name: '', price: '', category: 'وجبات', description: '', image_url: '', is_available: true });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
      toast.success('تم التحديث بنجاح');
    } catch (err) {
      toast.error('خطأ: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('🗑️ تم حذف المنتج');
    } catch (err) {
      toast.error('خطأ: ' + err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const formatPrice = (val) => `${Number(val || 0).toLocaleString('ar-SY')} ل.س`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PREPARING':
        return { label: 'قيد التجهيز', bg: '#eff6ff', color: '#2563eb' };
      case 'READY_FOR_PICKUP':
        return { label: 'جاهز للتوصيل', bg: '#ecfdf5', color: '#059669' };
      case 'DELIVERED':
        return { label: 'تم التوصيل', bg: '#f0fdf4', color: '#16a34a' };
      default:
        return { label: 'قيد الانتظار', bg: '#fff7ed', color: '#ea580c' };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '14px' }}>
        جاري التحميل...
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }} dir="rtl">
        <Store size={64} color="#94a3b8" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#1e293b', fontSize: '20px', margin: '0 0 8px 0' }}>ليس لديك متجر بعد</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>يرجى التواصل مع الإدارة لإنشاء متجرك الخاص</p>
      </div>
    );
  }

  return (
    <StoreSubscriptionWrapper>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }} dir="rtl">
        <Toaster position="top-center" />

        {/* Header */}
        <header style={{ background: '#0f172a', color: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={22} /> {store.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {store.category}
                </span>
                <button
                  onClick={toggleStoreStatus}
                  disabled={togglingStore}
                  style={{
                    background: store.is_open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: store.is_open ? '#10b981' : '#ef4444',
                    border: `1px solid ${store.is_open ? '#10b981' : '#ef4444'}`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Power size={12} /> {store.is_open ? 'مفتوح (اضغط للإغلاق)' : 'مغلق (اضغط للفتح)'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#FF6B00',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(255,107,0,0.2)'
              }}
            >
              <PlusCircle size={16} /> إضافة منتج
            </button>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'orders' ? '#FF6B00' : '#f1f5f9',
              color: activeTab === 'orders' ? '#fff' : '#475569',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShoppingBag size={18} /> الطلبات الواردة ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'products' ? '#FF6B00' : '#f1f5f9',
              color: activeTab === 'products' ? '#fff' : '#475569',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Utensils size={18} /> قائمة المنتجات ({products.length})
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <section>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', background: '#fff', padding: '48px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Package size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>لا توجد طلبات واردة حتى الآن</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((ord) => {
                  const statusBadge = getStatusBadge(ord.status);
                  return (
                    <div key={ord.id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>
                          طلب #{ord.id?.toString().slice(0, 8)}
                        </span>
                        <span style={{ background: statusBadge.bg, color: statusBadge.color, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#475569', margin: '8px 0' }}>
                        الزبون: <strong>{ord.customer_name || 'غير معروف'}</strong> | المجموع: <strong style={{ color: '#FF6B00', fontSize: '14px' }}>{formatPrice(ord.total_price)}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                          style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          قيد التجهيز 👨‍🍳
                        </button>
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                          style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          جاهز للتوصيل 📦
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Products */}
        {activeTab === 'products' && (
          <section>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', background: '#fff', padding: '48px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Utensils size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>لا توجد منتجات مضافة بعد</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {products.map((prod) => (
                  <div key={prod.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', opacity: prod.is_available ? 1 : 0.6, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '150px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={36} />
                      </div>
                    )}

                    <div style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{prod.name}</span>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>{prod.category}</span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px 0', height: '32px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.description || 'لا يوجد وصف'}
                      </p>

                      <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '14px', marginBottom: '10px' }}>
                        {formatPrice(prod.price)}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => toggleAvailability(prod.id, prod.is_available)}
                          style={{
                            flex: 1,
                            background: prod.is_available ? '#dcfce7' : '#fee2e2',
                            color: prod.is_available ? '#166534' : '#991b1b',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {prod.is_available ? '✅ متاح' : '❌ غير متوفر'}
                        </button>

                        <button
                          onClick={() => openEditModal(prod)}
                          style={{
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="تعديل المنتج"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fca5a5',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="حذف المنتج"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Modal إضافة أو تعديل منتج */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  {editingProduct ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}
                </h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    placeholder="مثال: شاورما عربي"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>السعر (ل.س) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      placeholder="25000"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>القسم</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="وجبات">وجبات</option>
                      <option value="مشروبات">مشروبات</option>
                      <option value="حلويات">حلويات</option>
                      <option value="مقبلات">مقبلات</option>
                      <option value="سندويش">سندويش</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>وصف المنتج</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '60px', fontSize: '13px', boxSizing: 'border-box' }}
                    placeholder="مكونات ووصف المنتج..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>صورة المنتج</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, marginTop: 8, objectFit: 'cover' }} />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: '#FF6B00',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? '⏳ جاري المعالجة...' : editingProduct ? '💾 حفظ التعديلات' : '📦 حفظ ونشر المنتج'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </StoreSubscriptionWrapper>
  );
}