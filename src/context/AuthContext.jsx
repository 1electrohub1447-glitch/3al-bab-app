import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

/**
 * المزود العام لحالة المصادقة والصلاحيات - تطبيق "عالباب"
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب دور المستخدم من قاعدة البيانات
  const fetchUserRole = async (userId, userMetadata) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.role) {
        return data.role.toUpperCase();
      }
      
      // خيار بديل إذا لم يتوفر في الجدول
      return userMetadata?.role?.toUpperCase() || 'CUSTOMER';
    } catch (err) {
      console.error('❌ خطأ في جلب دور المستخدم:', err);
      return 'CUSTOMER';
    }
  };

  useEffect(() => {
    // 1. التحقق الأول عند تحميل التطبيق
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('❌ خطأ في تهيئة حالة الدخول:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. الاستماع التلقائي لتغيرات تسجيل الدخول والخروج
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
        setRole(userRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // دالة تسجيل الدخول بالبريد وكلمة المرور
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // دالة تسجيل الخروج
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: role === 'ADMIN',
    isDriver: role === 'DRIVER',
    isMerchant: role === 'MERCHANT' || role === 'RESTAURANT' || role === 'STORE',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook مخصص لاستهلاك معلومات المستخدم والصلاحيات بمرونة
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider');
  }
  return context;
}