import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Star, X, Loader2, HeartHandshake, Sparkles } from 'lucide-react';

/**
 * نافذة تقييم الخدمة والمندوب والمطبخ المطورة - تطبيق "عالباب"
 */
export default function RatingModal({ order, onClose, onSuccess }) {
  const [driverStars, setDriverStars] = useState(5);
  const [hoverDriverStars, setHoverDriverStars] = useState(0);

  const [storeStars, setStoreStars] = useState(5);
  const [hoverStoreStars, setHoverStoreStars] = useState(0);

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  // 💡 إضافات تطورية: عبارات جاهزة سريعة للتقييم بنقرة واحدة
  const quickTags = [
    'الطعام ساخن ولذيذ 🍔',
    'المندوب محترم وسريع 🛵',
    'التوصيل كان في الموعد ⏰',
    'الكمية ممتازة وتستحق 💯',
    'تجربة رائعة وتكرر بالتأكيد ⭐'
  ];

  const handleAddTag = (tag) => {
    setComment((prev) => (prev ? `${prev} - ${tag}` : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // جلب اسم المستخدم الحالي احتياطياً لضمان سلامة الإدخال
      const { data: { user } } = await supabase.auth.getUser();
      const finalCustomerName = order.customer_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'زبون عالباب';

      const { error } = await supabase.from('ratings').insert([
        {
          order_id: order.id,
          store_id: order.store_id || order.restaurant_id || null,
          driver_id: order.driver_id || null,
          customer_name: finalCustomerName,
          driver_rating: driverStars,
          store_rating: (order.store_id || order.restaurant_id) ? storeStars : null,
          comment: comment.trim() || null
        }
      ]);

      if (error) throw error;

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ خطأ في حفظ التقييم:', err);
      alert('حدث خطأ أثناء حفظ التقييم: ' + (err.message || 'يرجى المحاولة لاحقاً'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        {/* الهيدر */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <HeartHandshake size={30} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">شاركنا رأيك بالخدمة 🌟</h3>
          <p className="text-xs text-slate-500 mt-1">تقييمك يساهم في رفع جودة التوصيل والمطاعم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 🛵 تقييم المندوب */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              تقييم المندوب <span className="text-[#FF6A00]">({order.driver_name || 'المندوب'})</span>
            </label>
            <div className="flex justify-center gap-1.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeStar = hoverDriverStars ? star <= hoverDriverStars : star <= driverStars;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setDriverStars(star)}
                    onMouseEnter={() => setHoverDriverStars(star)}
                    onMouseLeave={() => setHoverDriverStars(0)}
                    className="p-1 transition-transform active:scale-125 focus:outline-none"
                  >
                    <Star
                      size={26}
                      className={activeStar ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🏪 تقييم المتجر/المطعم */}
          {(order.store_id || order.restaurant_id) && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                تقييم جودة الوجبات والمطعم
              </label>
              <div className="flex justify-center gap-1.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = hoverStoreStars ? star <= hoverStoreStars : star <= storeStars;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setStoreStars(star)}
                      onMouseEnter={() => setHoverStoreStars(star)}
                      onMouseLeave={() => setHoverStoreStars(0)}
                      className="p-1 transition-transform active:scale-125 focus:outline-none"
                    >
                      <Star
                        size={26}
                        className={activeStar ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ⚡ عبارات جاهزة سريعة */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-2">
              <Sparkles size={13} className="text-[#FF6A00]" />
              <span>أوسمة جاهزة (انقر لإضافتها):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addTagHandler ? null : handleAddTag(tag)}
                  className="text-[11px] bg-orange-50/60 hover:bg-orange-100 text-[#FF6A00] border border-orange-200/60 px-2.5 py-1 rounded-xl transition-all font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* صندوق ملاحظات */}
          <div>
            <textarea
              rows={3}
              placeholder="اكتب أي ملاحظة أو اقتراح لتحسين تجربتك (اختياري)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>إرسال التقييم</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}