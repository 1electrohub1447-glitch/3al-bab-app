import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, XCircle, RefreshCw, Eye } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const navigate = useNavigate();

  // جلب سجل طلبات المستخدم
  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores ( name, logo_url ),
          order_items (
            id,
            quantity,
            price,
            products ( name )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('خطأ في جلب سجل الطلبات:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();

    // التحديث اللحظي لحالة الطلبات عند تغيرها من المتجر أو المندوب
    const channel = supabase
      .channel('customer-orders-history')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchOrderHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // تنسيق حالة الطلب بالعربية مع اللون المناسب
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'قيد الانتظار', bg: '#FEF3C7', color: '#D97706', icon: <Clock size={12} /> };
      case 'ACCEPTED':
      case 'PREPARING':
        return { label: 'قيد التجهيز', bg: '#E0F2FE', color: '#0284C7', icon: <RefreshCw size={12} /> };
      case 'ON_WAY':
      case 'DELIVERING':
        return { label: 'في الطريق', bg: '#E0E7FF', color: '#4F46E5', icon: <Clock size={12} /> };
      case 'DELIVERED':
      case 'COMPLETED':
        return { label: 'مكتمل', bg: '#DCFCE7', color: '#16A34A', icon: <CheckCircle2 size={12} /> };
      case 'CANCELLED':
        return { label: 'ملغى', bg: '#FEE2E2', color: '#DC2626', icon: <XCircle size={12} /> };
      default:
        return { label: status, bg: '#F1F5F9', color: '#64748B', icon: null };
    }
  };

  // تصفية القائمة بحسب التبويب المحدد
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'PREPARING', 'ON_WAY', 'DELIVERING'].includes(order.status);
    if (filterStatus === 'COMPLETED') return ['DELIVERED', 'COMPLETED'].includes(order.status);
    if (filterStatus === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#FF6A00', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
        جاري تحميل سجل الطلبات...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', paddingBottom: '30px', fontFamily: 'sans-serif' }} dir="rtl">
      
      {/* 🔹 الهيدر العلوي */}
      <div style={{ background: '#FF6A00', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '10px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowRight size={20} />
        </button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>سجل الطلبات</h3>
      </div>

      <div style={{ padding: '16px' }}>

        {/* 🔹 أزرار التصفية (Tabs) */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'ACTIVE', label: 'النشطة' },
            { id: 'COMPLETED', label: 'المكتملة' },
            { id: 'CANCELLED', label: 'الملغاة' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: filterStatus === tab.id ? '#FF6A00' : '#fff',
                color: filterStatus === tab.id ? '#fff' : '#64748B',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 🔹 قائمة الطلبات */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <ShoppingBag size={48} color="#94A3B8" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B' }}>لا توجد طلبات هنا</div>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>لم تقم بأي طلبات في هذه الفئة بعد</p>
            <button
              onClick={() => navigate('/')}
              style={{ marginTop: '12px', background: '#FF6A00', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              استكشف المتاجر
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const isLive = ['PENDING', 'ACCEPTED', 'PREPARING', 'ON_WAY', 'DELIVERING'].includes(order.status);
            const totalPrice = order.total_price || order.total_amount || 0;

            return (
              <div
                key={order.id}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  border: isLive ? '1px solid #FF6A00' : '1px solid #F1F5F9'
                }}
              >
                {/* رأس كارت الطلب */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F8FAFC', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B' }}>
                      {order.stores?.name || 'متجر عالباب'}
                    </span>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(order.created_at).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {badge.icon} {badge.label}
                  </span>
                </div>

                {/* عناصر الطلب */}
                <div style={{ marginBottom: '12px' }}>
                  {order.order_items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-frontend', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                      <span>{item.quantity} × {item.products?.name || 'منتج'}</span>
                      <span style={{ fontWeight: '500' }}>{(item.price * item.quantity).toLocaleString('ar-SY')} ل.س</span>
                    </div>
                  ))}
                </div>

                {/* المجموع والأزرار التفاعلية */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #F1F5F9', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>المبلغ الإجمالي:</span>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF6A00' }}>
                      {Number(totalPrice).toLocaleString('ar-SY')} ل.س
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isLive && (
                      <button
                        onClick={() => navigate(`/track/${order.id}`)}
                        style={{
                          background: '#FF6A00',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={14} /> تتبع الطلب
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}