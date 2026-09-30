import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingBag, Clock, CheckCircle2, Bike, Store, AlertTriangle, RefreshCw, ChevronLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * شاشة سجل الطلبات وتتبع الطلبات النشطة للزبون - تطبيق "عالباب"
 */
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();

    // 🔄 الاشتراك في التحديثات اللحظية للطلبات (Supabase Realtime)
    let channel;
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`public:orders:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setOrders((prev) => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setOrders((prev) =>
                prev.map((order) => (order.id === payload.new.id ? payload.new : order))
              );
            } else if (payload.eventType === 'DELETE') {
              setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (name, logo_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // قاموس الحالات وتنسيق الألوان والأيقونات
  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'في انتظار موافقة المطعم',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock
        };
      case 'STORE_ACCEPTED':
      case 'PREPARING':
        return {
          label: 'المطعم يجهز طلبك الان 🍳',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: Store
        };
      case 'READY_FOR_PICKUP':
        return {
          label: 'جاهز وفي انتظار المندوب 🚴',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: Bike
        };
      case 'IN_DELIVERY':
        return {
          label: 'المندوب في الطريق إليك 🛵',
          bg: 'bg-orange-50 text-[#FF6A00] border-orange-200',
          dot: 'bg-[#FF6A00]',
          icon: Bike
        };
      case 'DELIVERED':
        return {
          label: 'تم التسليم بنجاح ✅',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          label: 'تم إلغاء الطلب',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertTriangle
        };
      default:
        return {
          label: status || 'قيد المعالجة',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          icon: Clock
        };
    }
  };

  // 1. شاشات التحميل المبدئية (Skeleton Loader)
  if (loading) {
    return (
      <div dir="rtl" className="p-4 space-y-4 max-w-md mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 rounded"></div>
              <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
            </div>
            <div className="h-4 w-40 bg-slate-100 rounded"></div>
            <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 max-w-md mx-auto">
      {/* 🏷️ الهيدر الرئيسي */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="text-[#FF6A00]" size={24} />
            طلباتي
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">تابع حالة طلباتك الحالية وتاريخ المشتريات</p>
        </div>

        {/* زر التحديث اليدوي */}
        <button
          onClick={handleRefresh}
          className={`p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all ${
            refreshing ? 'animate-spin text-[#FF6A00]' : ''
          }`}
          title="تحديث البيانات"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* 📦 قائمة الطلبات أو شاشة الفراغ */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm my-8">
          <div className="w-20 h-20 bg-orange-50 text-[#FF6A00] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={36} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد لديك طلبات حتى الآن</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            استكشف أشهر المطاعم والمحلات واطلب وجبتك المفضلة الآن!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm"
          >
            تصفح المطاعم
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* الجزء العلوي: المطعم ورمز الطلب */}
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200/60 flex items-center justify-center text-[#FF6A00] font-bold shadow-xs shrink-0 overflow-hidden">
                      {order.restaurants?.logo_url ? (
                        <img src={order.restaurants.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {order.restaurants?.name || 'مطعم عالباب'}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{order.id?.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* السعر الإجمالي */}
                  <div className="text-left">
                    <div className="text-sm font-extrabold text-[#FF6A00]">
                      {Number(order.total_price || 0).toLocaleString()} ل.س
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('ar-SA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* شارة حالة الطلب */}
                <div className="px-4 pt-3">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold ${statusConfig.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-ping ${statusConfig.dot}`} />
                      <span>{statusConfig.label}</span>
                    </div>
                    <StatusIcon size={16} />
                  </div>
                </div>

                {/* تفاصيل الاصناف المسجلة */}
                {items.length > 0 && (
                  <div className="px-4 py-3 text-xs text-slate-600 space-y-1">
                    {items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="truncate max-w-[200px]">
                          • {item.name || item.title}
                        </span>
                        <span className="font-medium text-slate-400">×{item.quantity || 1}</span>
                      </div>
                    ))}
                    {items.length > 2 && (
                      <div className="text-[11px] text-slate-400 italic pt-1">
                        + {items.length - 2} أصناف أخرى...
                      </div>
                    )}
                  </div>
                )}

                {/* عنوان التسليم إن وجد */}
                {order.delivery_address && (
                  <div className="px-4 pb-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{order.delivery_address}</span>
                  </div>
                )}

                {/* الجزء السفلي: تفاصيل إضافية وزر التتبع */}
                <div className="px-4 py-3 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    طريقة الدفع: <strong className="text-slate-700">{order.payment_method || 'نقداً عند الاستلام'}</strong>
                  </span>

                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex items-center gap-1 text-[#FF6A00] font-bold hover:underline"
                  >
                    <span>تفاصيل الطلب</span>
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}