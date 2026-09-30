import React from 'react';
import { Home, Tag, ShoppingBag, Heart, User, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * مكون الهيكل العام (Layout) لتطبيق "عالباب - 3al-bab"
 * يغلف كافة شاشات التطبيق ويوفر شريط تنقل سفلي عصري ومحمي للزبائن.
 */
export default function Layout({ children, cartCount = 0, activeOrdersCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  // المسارات التي يجب فيها إخفاء شريط التنقل السفلي الخاص بالزبون
  const restrictedPaths = ['/driver', '/restaurant', '/merchant', '/admin', '/login', '/register', '/checkout'];
  
  const hideBottomNav = restrictedPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // قائمة التبويبات الرئيسية مع الشارات (Badges) الحية
  const navItems = [
    { id: 'home', path: '/', label: 'الرئيسية', icon: Home },
    { id: 'offers', path: '/offers', label: 'العروض', icon: Tag },
    { 
      id: 'orders', 
      path: '/orders', 
      label: 'الطلبات', 
      icon: ShoppingBag,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-emerald-500'
    },
    { id: 'favorites', path: '/favorites', label: 'المفضلة', icon: Heart },
    { id: 'profile', path: '/profile', label: 'حسابي', icon: User },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-['Cairo',sans-serif] text-slate-900 antialiased selection:bg-orange-500 selection:text-white flex flex-col items-center">
      
      {/* Container الرئيسي للتطبيق (محاكاة إطار الهاتف للزبائن، وعرض كامل للوحات الإدارة) */}
      <main 
        className={`w-full transition-all duration-300 ${
          hideBottomNav 
            ? 'max-w-full pb-0' 
            : 'max-w-md pb-24 shadow-2xl shadow-slate-200/50 bg-white min-h-screen relative border-x border-slate-100'
        }`}
      >
        {children}
      </main>

      {/* 📱 شريط التنقل السفلي الاحترافي - للزبائن فقط */}
      {!hideBottomNav && (
        <nav 
          aria-label="التنقل السفلي"
          className="fixed bottom-0 z-50 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around transition-all duration-300"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            // التحقق من المسار النشط (مع دعم المسار الرئيسي exact match)
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 select-none ${
                  isActive 
                    ? 'text-[#FF6A00]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {/* مؤشر علوي دقيق للتبويب النشط */}
                {isActive && (
                  <span className="absolute -top-2 w-8 h-1 bg-[#FF6A00] rounded-full transition-all duration-300" />
                )}

                {/* أيقونة التبويب مع الشارات */}
                <div className="relative">
                  <Icon 
                    size={22} 
                    className={`transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} 
                  />
                  
                  {/* شارة عدد الطلبات أو الأغراض */}
                  {item.badge && (
                    <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white animate-pulse ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* نص التبويب */}
                <span className={`text-[11px] mt-1 transition-all duration-200 ${
                  isActive ? 'font-bold text-[#FF6A00]' : 'font-medium text-slate-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}