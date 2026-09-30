import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bike, Store, ShieldCheck, LogOut, LogIn, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * شريط التنقل العلوي بين الواجهات والمصادقة المطور - تطبيق "عالباب"
 */
export default function TopRoleBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. جلب معلومات الجلسة والدور الحالي
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      
      if (isMounted) {
        setUser(currentUser);
        if (currentUser) {
          fetchUserRole(currentUser.id, currentUser);
        }
      }
    };

    initAuth();

    // 2. الاستماع لتغير حالة المصادقة بشكل لحظي وآمن
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      if (isMounted) {
        setUser(currentUser);
        if (currentUser) {
          fetchUserRole(currentUser.id, currentUser);
        } else {
          setUserRole(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId, currentUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.role) {
        setUserRole(data.role.toUpperCase());
      } else {
        setUserRole(currentUser?.user_metadata?.role?.toUpperCase() || 'CUSTOMER');
      }
    } catch (err) {
      console.error('Error fetching role in TopRoleBar:', err);
      setUserRole('CUSTOMER');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    navigate('/login');
  };

  // قائمة جميع الروابط المتاحة
  const allLinks = [
    { path: '/', label: 'واجهة الزبون', icon: ShoppingCart, roles: ['CUSTOMER', 'ADMIN', 'DRIVER', 'RESTAURANT'] },
    { path: '/driver', label: 'واجهة المندوب', icon: Bike, roles: ['DRIVER', 'ADMIN'] },
    { path: '/merchant', label: 'واجهة المطعم', icon: Store, roles: ['RESTAURANT', 'ADMIN'] },
    { path: '/admin', label: 'لوحة الأدمن', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  // تصفية الروابط المرئية
  const visibleLinks = allLinks.filter(({ roles }) => {
    if (!userRole) return true; // عرض الكل في حالة التجربة بدون تسجيل
    return roles.includes(userRole) || userRole === 'ADMIN';
  });

  // استخراج اسم المستخدم الأنيق
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مستخدم عالباب';

  return (
    <header dir="rtl" className="bg-slate-900 border-b-2 border-[#FF6A00] text-white px-4 py-2.5 shadow-md sticky top-0 z-[5000]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* 1. أزرار التنقل بين الواجهات */}
        <nav className="flex items-center gap-1.5 flex-wrap">
          {visibleLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF6A00] text-white shadow-md shadow-orange-500/20 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={14} className={isActive ? 'animate-pulse text-white' : 'text-slate-400'} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 2. منطقة معلومات الحساب والتسجيل */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl text-[11px] text-slate-300 border border-slate-700">
                <User size={12} className="text-[#FF6A00]" />
                <span className="truncate max-w-[130px] font-medium">
                  {displayName}
                </span>
                {userRole && (
                  <span className="bg-orange-500/20 text-[#FF6A00] px-1.5 py-0.5 rounded font-bold text-[10px]">
                    {userRole}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-500/20"
                title="تسجيل الخروج"
              >
                <LogOut size={14} />
                <span className="hidden xs:inline">خروج</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#FF6A00] hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
            >
              <LogIn size={14} />
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}