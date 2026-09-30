import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import NotificationBanner from '../components/NotificationBanner';
import { 
  Navigation, Phone, MapPin, CheckCircle, Package, 
  RefreshCw, Send, Check, Volume2, VolumeX, Store, Award 
} from 'lucide-react';

export default function DriverPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [customPrices, setCustomPrices] = useState({});
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [driverStatus, setDriverStatus] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [driverPoints, setDriverPoints] = useState(0);

  const fetchDriverInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data: userData, error } = await supabase
        .from('users')
        .select('is_active, role, points')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        setDriverStatus('pending');
      } else {
        setDriverStatus(userData.is_active ? 'approved' : 'pending');
        setDriverPoints(userData.points || 0);
      }
    } catch (err) {
      console.error('Error checking driver status:', err);
      setDriverStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverInfo();
  }, []);

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch((err) => console.log('Audio autoplay blocked:', err));
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const toggleAudio = () => {
    if (!soundEnabled) {
      playNotificationSound();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  const updateDriverLocation = (orderId) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        await supabase
          .from('orders')
          .update({ 
            driver_lat: latitude, 
            driver_lng: longitude 
          })
          .eq('id', orderId);
      });
    }
  };

  const fetchAvailableOrders = async () => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`driver_id.is.null,driver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    if (driverStatus !== 'approved' || !currentUserId) return;

    fetchAvailableOrders();

    const channel = supabase
      .channel('driver-realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchAvailableOrders();

          if (payload.eventType === 'INSERT') {
            playNotificationSound();
            setNotification('🔔 وصل طلب جديد متاح للتوصيل!');
          } else if (payload.eventType === 'UPDATE') {
            setNotification('🔄 تم تحديث حالة الطلبات.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverStatus, currentUserId, soundEnabled]);

  useEffect(() => {
    let watchId;
    const activeOrder = orders.find(o => 
      (o.status === 'READY_FOR_PICKUP' || o.status === 'ON_THE_WAY' || o.status === 'DRIVER_ACCEPTED') && 
      o.driver_id === currentUserId
    );

    if (activeOrder && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          await supabase
            .from('orders')
            .update({
              driver_lat: latitude,
              driver_lng: longitude
            })
            .eq('id', activeOrder.id);
        },
        (error) => console.error('خطأ في تحديد الموقع:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [orders, currentUserId]);

  const handleAcceptOrder = async (orderId) => {
    if (!currentUserId) {
      alert('تعذر التحديد: لم يتم التعرف على حسابك');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'DRIVER_ACCEPTED',
          driver_id: currentUserId 
        })
        .eq('id', orderId)
        .is('driver_id', null)
        .select();

      if (error || !data || data.length === 0) {
        throw new Error('عذراً، قام مندوب آخر بقبول هذا الطلب قبلك!');
      }

      alert('✅ تم قبول الطلب بنجاح وهو الآن محجوز لك!');
      fetchAvailableOrders();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء قبول الطلب');
      fetchAvailableOrders();
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'DELIVERED') {
        const pointsToDeduct = 1;
        const newPoints = Math.max(0, driverPoints - pointsToDeduct);

        const { error: updatePointsError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', currentUserId);

        if (!updatePointsError) {
          setDriverPoints(newPoints);
          alert(`🎉 تم تسليم الطلب بنجاح! تم خصم ${pointsToDeduct} نقطة من رصيدك.`);
        }
      }

      if (newStatus === 'READY_FOR_PICKUP' || newStatus === 'ON_THE_WAY') {
        updateDriverLocation(orderId);
      }

      fetchAvailableOrders();
    } catch (err) {
      alert('حدث خطأ في التحديث: ' + err.message);
    }
  };

  const handleSetCustomPrice = async (orderId) => {
    const price = customPrices[orderId];
    if (!price || Number(price) <= 0) {
      alert('يرجى تحديد تكلفة توصيل صالحة');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_fee: Number(price),
          total_price: Number(price),
          driver_id: currentUserId,
          status: 'WAITING_CUSTOMER_APPROVAL'
        })
        .eq('id', orderId);

      if (error) throw error;
      alert('✅ تم إرسال سعر التوصيل للزبون وبانتظار موافقته');
      fetchAvailableOrders();
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    }
  };

  const openGoogleMaps = (address) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const callCustomer = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  const formatPrice = (val) => `${Number(val || 0).toLocaleString('ar-SY')} ل.س`;

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ACTIVE') {
      const isMyActive = order.driver_id === currentUserId && ['DRIVER_ACCEPTED', 'READY_FOR_PICKUP', 'ON_THE_WAY', 'WAITING_CUSTOMER_APPROVAL'].includes(order.status);
      const isAvailableGeneral = !order.driver_id && ['PENDING', 'PREPARING', 'PENDING_DRIVER', 'STORE_ACCEPTED'].includes(order.status);
      return isMyActive || isAvailableGeneral;
    }
    if (activeTab === 'COMPLETED') {
      return order.status === 'DELIVERED' && order.driver_id === currentUserId;
    }
    return true; 
  });

  const getStatusBadge = (status) => {
    const map = {
      PREPARING: { text: 'قيد التجهيز 👨‍🍳', bg: '#dbeafe', color: '#1e40af' },
      PENDING_DRIVER: { text: 'في انتظار المندوب 🛵', bg: '#fef3c7', color: '#b45309' },
      WAITING_CUSTOMER_APPROVAL: { text: 'في انتظار موافقة الزبون', bg: '#e0e7ff', color: '#4338ca' },
      STORE_ACCEPTED: { text: 'مقبول / جاهز', bg: '#dbeafe', color: '#1e40af' },
      DRIVER_ACCEPTED: { text: 'تم قبول الطلب 🛵', bg: '#dbeafe', color: '#1e40af' },
      READY_FOR_PICKUP: { text: 'جاري التوصيل 🛵', bg: '#fed7aa', color: '#c2410c' },
      ON_THE_WAY: { text: 'في الطريق للزبون 🛵', bg: '#fed7aa', color: '#c2410c' },
      DELIVERED: { text: 'تم التسليم 🎉', bg: '#dcfce7', color: '#15803d' },
      CANCELLED: { text: 'ملغى ❌', bg: '#fee2e2', color: '#b91c1c' },
    };
    const current = map[status] || { text: status, bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ background: current.bg, color: current.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
        {current.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: 'sans-serif', color: '#64748b' }}>
        جاري التحقق من حالة الحساب...
      </div>
    );
  }

  if (driverStatus === 'pending') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }} dir="rtl">
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '30px', borderRadius: '16px' }}>
          <Store size={54} color="#d97706" style={{ marginBottom: '10px' }} />
          <h2 style={{ color: '#b45309', margin: '10px 0' }}>حساب المندوب قيد المراجعة ⏳</h2>
          <p style={{ color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
            تم استلام طلب انضمامك كمندوب بنجاح. لا يمكنك الوصول إلى الطلبات أو التوصيل حتى تقوم الإدارة بالموافقة على الحساب وتفعيله.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '650px', margin: '0 auto', padding: '16px', paddingBottom: '60px', fontFamily: 'sans-serif' }} dir="rtl">
      
      {notification && (
        <NotificationBanner 
          message={notification} 
          onClose={() => setNotification(null)} 
        />
      )}

      <header style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛵 تطبيق المندوب
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>جاهز لاستلام الطلبات والتوصيل</p>
          </div>
          
          <div style={{ background: 'rgba(255, 107, 0, 0.150)', border: '1px solid #FF6B00', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} color="#FF6B00" />
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#cbd5e1' }}>رصيد النقاط</span>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{driverPoints} نقطة</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            onClick={toggleAudio}
            style={{ background: soundEnabled ? '#ef4444' : '#22c55e', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            {soundEnabled ? <VolumeX size={14} /> : <Volume2 size={14} />} 
            {soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
          </button>
          <button 
            onClick={fetchAvailableOrders} 
            style={{ background: '#334155', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <RefreshCw size={14} /> تحديث
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
        {[
          { id: 'ALL', label: 'الكل' },
          { id: 'ACTIVE', label: 'الطلبات النشطة 🛵' },
          { id: 'COMPLETED', label: 'المكتملة ✅' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#FF6B00' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Package size={48} color="#94a3b8" style={{ marginBottom: '8px' }} />
          <p style={{ color: '#64748b', margin: 0, fontWeight: 'bold' }}>لا توجد طلبات في هذه القائمة حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => (
            <div key={order.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>
                    طلب #{String(order.id).slice(0, 8)}
                  </span>
                  {order.order_type === 'CUSTOM' && (
                    <span style={{ marginRight: '8px', background: '#fff7ed', color: '#c2410c', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      🛵 مرسول (خاص)
                    </span>
                  )}
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>👤 الزبون:</strong> {order.customer_name || 'زبون عام'}</span>
                  {order.customer_phone && (
                    <button 
                      onClick={() => callCustomer(order.customer_phone)}
                      style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <Phone size={12} /> اتصال
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>📍 العنوان:</strong> {order.customer_address || 'غير المحدد'}</span>
                  {order.customer_address && (
                    <button 
                      onClick={() => openGoogleMaps(order.customer_address)}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                      <MapPin size={12} /> الخريطة
                    </button>
                  )}
                </div>

                <div>
                  <strong>💰 إجمالي المبلغ المطلوب جبايته:</strong> 
                  <span style={{ color: '#FF6B00', fontWeight: 'bold', fontSize: '14px', marginRight: '6px' }}>
                    {formatPrice(order.total_price)}
                  </span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '14px', border: '1px dashed #cbd5e1' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>📦 التفاصيل والمنتجات:</strong>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '13px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>• {item.name}</span>
                      <span style={{ fontWeight: 'bold' }}>x{item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{order.notes || 'لا توجد تفاصيل إضافية'}</p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {order.order_type === 'CUSTOM' && ['PENDING', 'PENDING_DRIVER'].includes(order.status) && !order.driver_id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      placeholder="أدخل سعر التوصيل المقترح (ل.س)" 
                      value={customPrices[order.id] || ''} 
                      onChange={(e) => setCustomPrices({ ...customPrices, [order.id]: e.target.value })}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button 
                      onClick={() => handleSetCustomPrice(order.id)}
                      style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      إرسال السعر <Send size={14} />
                    </button>
                  </div>
                )}

                {['PENDING', 'PREPARING', 'PENDING_DRIVER'].includes(order.status) && order.order_type !== 'CUSTOM' && !order.driver_id && (
                  <button 
                    onClick={() => handleAcceptOrder(order.id)}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Check size={18} /> قبول الطلب وحجزه
                  </button>
                )}

                {(order.status === 'STORE_ACCEPTED' || order.status === 'DRIVER_ACCEPTED') && order.driver_id === currentUserId && (
                  <button 
                    onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Navigation size={18} /> استلمت الطلب - جاري التوصيل للزبون
                  </button>
                )}

                {(order.status === 'READY_FOR_PICKUP' || order.status === 'ON_THE_WAY') && order.driver_id === currentUserId && (
                  <button 
                    onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                    style={{ background: '#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={18} /> تم التسليم للزبون بنجاح 🎉 (خصم نقطة)
                  </button>
                )}

                {['PENDING', 'PREPARING', 'PENDING_DRIVER', 'STORE_ACCEPTED', 'DRIVER_ACCEPTED'].includes(order.status) && order.driver_id === currentUserId && (
                  <button 
                    onClick={() => {
                      if (confirm('هل أنت متأكد من الاعتذار عن هذا الطلب؟')) {
                        handleUpdateStatus(order.id, 'CANCELLED');
                      }
                    }}
                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}
                  >
                    الاعتذار عن الطلب ✖
                  </button>
                )}

              </div>

            </div>
          ))}
        </div>
      )}
    </main>
  );
}