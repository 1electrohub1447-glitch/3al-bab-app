import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle2, Clock, Truck, MapPin, ArrowRight, Package, XCircle, Loader2, PhoneCall, Star, AlertTriangle } from 'lucide-react';
import OrderMap from '../components/OrderMap';

export default function CustomerOrderTrack() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    fetchOrder();

    // الاستماع للتحديثات اللحظية (Realtime) على الطلب
    const channel = supabase
      .channel(`order-track-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, stores(name, phone)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
      if (data?.rating) {
        setRating(data.rating);
        setRated(true);
      }
    } catch (err) {
      console.error('خطأ في جلب بيانات الطلب:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('هل أنت متكد من رغبتك في إلغاء الطلب؟')) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

      if (error) throw error;
      setOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      console.error('خطأ أثناء إلغاء الطلب:', err.message);
      alert('فشل إلغاء الطلب، يجدر المحاولة لاحقاً.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRateOrder = async (selectedRating) => {
    setRating(selectedRating);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ rating: selectedRating })
        .eq('id', id);

      if (error) throw error;
      setRated(true);
    } catch (err) {
      console.error('خطأ في حفظ التقييم:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 font-sans" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6A00]" />
        <span className="text-sm font-bold">جاري تحميل تفاصيل الطلب...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-sans" dir="rtl">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">الطلب غير موجود</h3>
        <p className="text-xs text-slate-500 mb-6">يرجى التأكد من رقم الطلب والمحاولة مرة أخرى.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-[#FF6A00] hover:bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'قيد الانتظار', icon: Clock },
    { key: 'ACCEPTED', label: 'تم قبول الطلب', icon: Package },
    { key: 'ON_THE_WAY', label: 'في الطريق', icon: Truck },
    { key: 'DELIVERED', label: 'تم التوصيل', icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => {
    switch (order.status) {
      case 'PENDING': return 0;
      case 'ACCEPTED': return 1;
      case 'ON_THE_WAY': return 2;
      case 'DELIVERED': return 3;
      default: return -1;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 font-sans text-slate-800" dir="rtl">
      {/* زر العودة */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          <span>العودة للمتاجر</span>
        </button>

        {/* زر الاتصال بالمتجر إن وجد */}
        {order.stores?.phone && (
          <a 
            href={`tel:${order.stores.phone}`}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-emerald-200"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>اتصال بالمتجر ({order.stores.name})</span>
          </a>
        )}
      </div>

      {/* بطاقة الحالة والمراحل */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">رمز الطلب</span>
            <h2 className="text-lg font-black text-slate-900">#{order.id.slice(0, 8)}</h2>
          </div>
          
          <span className={`px-3 py-1.5 rounded-full text-xs font-black ${
            isCancelled 
              ? 'bg-rose-100 text-rose-700' 
              : order.status === 'DELIVERED' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-orange-100 text-[#FF6A00]'
          }`}>
            {isCancelled ? 'تم إلغاء الطلب' : (steps[currentStepIndex]?.label || order.status)}
          </span>
        </div>

        {/* خط المراحل المباشر */}
        {!isCancelled ? (
          <div className="relative my-8 px-2">
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-0">
              <div 
                className="h-full bg-[#FF6A00] transition-all duration-500" 
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            <div className="flex justify-between relative z-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-[#FF6A00] text-white shadow-md shadow-orange-500/30' 
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] mt-2 text-center font-bold transition-colors ${
                      isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 text-center text-xs font-bold my-4">
            تنبيه: تم إلغاء هذا الطلب. يمكنك التواصل مع الدعم أو المتجر لمزيد من التفاصيل.
          </div>
        )}

        {/* زر الإلغاء إذا كان الطلب قيد الانتظار */}
        {order.status === 'PENDING' && !isCancelled && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-rose-200"
            >
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>إلغاء الطلب</span>
            </button>
          </div>
        )}
      </div>

      {/* خريطة تتبع المندوب */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 mb-6 shadow-sm overflow-hidden">
        <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF6A00]" />
          <span>موقع المندوب لحظياً</span>
        </h3>
        <div className="h-72 rounded-2xl overflow-hidden border border-slate-100">
          <OrderMap orderId={order.id} />
        </div>
      </div>

      {/* تقييم الطلب عند الاكتمال */}
      {order.status === 'DELIVERED' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-6 shadow-sm text-center">
          <h3 className="text-xs font-bold text-slate-700 mb-2">كيف كانت تجربتك مع التوصيل والطلب؟</h3>
          <div className="flex justify-center gap-2 my-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRateOrder(star)}
                className={`p-1 transition-transform hover:scale-110 ${
                  star <= rating ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
          {rated && <p className="text-[11px] text-emerald-600 font-bold mt-1">شكراً لتقييمك!</p>}
        </div>
      )}

      {/* تفاصيل الفاتورة */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 mb-4 pb-2 border-b border-slate-100">
          تفاصيل الفاتورة
        </h3>

        <div className="space-y-3 mb-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-dashed border-slate-100">
              <span className="text-slate-700 font-medium">
                {item.name} <span className="text-slate-400 font-bold mr-1">× {item.quantity}</span>
              </span>
              <span className="font-bold text-slate-900">{item.price * item.quantity} ل.س</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100 font-black text-sm">
          <span className="text-slate-900">المجموع الكلي:</span>
          <span className="text-[#FF6A00] text-base">{order.total_price} ل.س</span>
        </div>
      </div>
    </div>
  );
}