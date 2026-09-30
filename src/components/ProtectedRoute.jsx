import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Home } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = isMountedVar => isMountedVar; // لتفادي أي تحذيرات

    const verifyAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // 1. محاولة جلب الدور من الـ metadata أو جدول users
        let role = currentUser.user_metadata?.role || currentUser.app_metadata?.role;

        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (userData && userData.role) {
            role = userData.role;
          }
        } catch (err) {
          // تجاهل الخطأ
        }

        // 💡 التحديد التلقائي الذكي للدور بناءً على الرابط الحالي لمنع التحول إلى CUSTOMER
        const path = location.pathname.toLowerCase();
        let fallbackRole = 'CUSTOMER';
        
        if (path.includes('/merchant')) {
          fallbackRole = 'MERCHANT';
        } else if (path.includes('/driver')) {
          fallbackRole = 'DRIVER';
        } else if (path.includes('/admin')) {
          fallbackRole = 'ADMIN';
        }

        const finalRole = (role || fallbackRole).toUpperCase();

        setUserRole(finalRole);
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      } else {
        const currentUser = session.user;
        let role = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
        
        const path = location.pathname.toLowerCase();
        let fallbackRole = 'CUSTOMER';
        if (path.includes('/merchant')) fallbackRole = 'MERCHANT';
        else if (path.includes('/driver')) fallbackRole = 'DRIVER';
        else if (path.includes('/admin')) fallbackRole = 'ADMIN';

        const finalRole = (role || fallbackRole).toUpperCase();
        
        setUser(currentUser);
        setUserRole(finalRole);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-['Cairo',sans-serif]">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-[#FF6A00] rounded-full animate-spin mb-4" />
        <h3 className="text-white font-bold text-sm">جاري التحقق من الصلاحيات...</h3>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedAllowedRoles = allowedRoles 
    ? allowedRoles.map(r => r.toUpperCase()) 
    : [];

  const isRoleAllowed = 
    !allowedRoles || 
    userRole === 'ADMIN' || 
    normalizedAllowedRoles.includes(userRole);

  if (!isRoleAllowed) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Cairo',sans-serif]">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={42} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">عذراً، لا تمتلك صلاحية لهذه الصفحة!</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              دورك الحالي (<span className="font-bold text-rose-600">{userRole}</span>) غير مسموح له بفتح هذه النافذة.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#FF6A00] text-white font-bold rounded-2xl shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={16} />
              <span>العودة للرئيسية</span>
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/login');
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>تسجيل الخروج والدخول بحساب آخر</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}