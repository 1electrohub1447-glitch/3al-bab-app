import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * مكون نظام الإشعارات العائمة الاحترافي لتطبيق "عالباب - 3al-bab"
 * @param {string} message - نص الإشعار المراد عرضه
 * @param {string} type - نوع الإشعار: 'info' | 'success' | 'error' | 'warning'
 * @param {number} duration - المدة بالمللي ثانية قبل الإغلاق التلقائي (افتراضي 4000ms)
 * @param {function} onClose - دالة تُستدعى عند إغلاق الإشعار
 */
export default function NotificationBanner({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose 
}) {
  const [progress, setProgress] = useState(100);

  // إعداد أنماط الألوان والأيقونات حسب نوع الإشعار
  const config = {
    info: {
      bg: 'bg-slate-900',
      border: 'border-[#FF6A00]',
      iconBg: 'bg-[#FF6A00]',
      progressBg: 'bg-[#FF6A00]',
      Icon: Bell
    },
    success: {
      bg: 'bg-slate-900',
      border: 'border-emerald-500',
      iconBg: 'bg-emerald-500',
      progressBg: 'bg-emerald-500',
      Icon: CheckCircle2
    },
    error: {
      bg: 'bg-slate-900',
      border: 'border-rose-500',
      iconBg: 'bg-rose-500',
      progressBg: 'bg-rose-500',
      Icon: AlertCircle
    },
    warning: {
      bg: 'bg-slate-900',
      border: 'border-amber-500',
      iconBg: 'bg-amber-500',
      progressBg: 'bg-amber-500',
      Icon: Info
    }
  };

  const currentConfig = config[type] || config.info;
  const IconComponent = currentConfig.Icon;

  // الإغلاق التلقائي وتحديث شريط التقدم الزمني
  useEffect(() => {
    if (!message) return;

    // إعادة ضبط شريط التقدم عند ظهور إشعار جديد
    setProgress(100);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingProgress = Math.max(0, 100 - (elapsedTime / duration) * 100);
      setProgress(remainingProgress);

      if (elapsedTime >= duration) {
        clearInterval(interval);
        if (onClose) onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div 
      dir="rtl"
      className="fixed top-4 left-4 right-4 z-[9999] max-w-md mx-auto transition-all duration-300 ease-out transform translate-y-0 animate-in fade-in slide-in-from-top-4"
    >
      <div className={`relative overflow-hidden ${currentConfig.bg} text-white p-3.5 pr-4 rounded-2xl shadow-2xl border ${currentConfig.border} flex items-center justify-between gap-3 backdrop-blur-md`}>
        
        {/* محتوى الإشعار */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`${currentConfig.iconBg} p-2 rounded-xl text-white shrink-0 shadow-md`}>
            <IconComponent size={20} className="animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-100 truncate leading-relaxed">
            {message}
          </p>
        </div>

        {/* زر الإغلاق اليدوي */}
        <button
          onClick={onClose}
          aria-label="إغلاق الإشعار"
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors duration-150 hover:bg-slate-800 shrink-0"
        >
          <X size={18} />
        </button>

        {/* شريط تقدم زمني سفلي ناعم */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div 
            className={`h-full ${currentConfig.progressBg} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}