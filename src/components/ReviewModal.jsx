import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Star, X, Loader2, MessageSquarePlus, Sparkles } from 'lucide-react';

/**
 * نافذة إضافة تقييم ومراجعة للمتجر المطورة - تطبيق "عالباب"
 */
export default function ReviewModal({ orderId, storeId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const ratingLabels = {
    1: 'سيء 😞',
    2: 'ضعيف 😐',
    3: 'جيد 🙂',
    4: 'جيد جداً 👍',
    5: 'ممتاز 🔥'
  };

  // 💡 عبارات جاهزة سريعة لتعليقات المتاجر
  const quickTags = [
    'الطعام ساخن وطازج 🍔',
    'التغليف ممتاز ونظيف 📦',
    'الكمية مشبعة وراهية 💯',
    'طعم خيالي يستحق التجربة 😋',
    'خدمة ممتازة وسريعة ⏱️'
  ];

  const handleAddTag = (tag) => {
    setComment((prev) => (prev ? `${prev} - ${tag}` : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('يرجى اختيار عدد النجوم قبل الإرسال');
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('يرجى تسجيل الدخول أولاً للتقييم');

      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        order_id: orderId || null,
        store_id: storeId,
        rating: rating,
        comment: comment.trim() || null,
        type: 'STORE'
      });

      if (error) throw error;

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ خطأ في إرسال التقييم:', err);
      alert('خطأ: ' + (err.message || 'تعذر إرسال التقييم'));
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div dir="rtl" className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
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
          <div className="w-12 h-12 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
            <MessageSquarePlus size={26} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">تقييم المتجر</h3>
          <p className="text-xs text-slate-500 mt-0.5">شاركونا رأيكم بالوجبات وجودة التحضير</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار النجوم */}
          <div className="text-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex justify-center gap-2 mb-1.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-125 focus:outline-none"
                >
                  <Star
                    size={30}
                    className={
                      star <= currentDisplayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                </button>
              ))}
            </div>

            {/* النص التفسيري للتقييم */}
            <div className="h-5 text-xs font-bold text-[#FF6A00]">
              {currentDisplayRating > 0 ? ratingLabels[currentDisplayRating] : 'اختر التقييم المناسب'}
            </div>
          </div>

          {/* ⚡ وسوم التعليقات السريعة */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1.5">
              <Sparkles size={13} className="text-[#FF6A00]" />
              <span>عبارات جاهزة سريعة:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-[11px] bg-orange-50/60 hover:bg-orange-100 text-[#FF6A00] border border-orange-200/60 px-2.5 py-1 rounded-xl transition-all font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* صندوق التعليق */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تجربتك وملاحظاتك (اختياري)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب انطباعك عن الأكل والتغليف..."
              className="w-full h-20 p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* زر التقديم */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <span>إرسال التقييم ⭐</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}