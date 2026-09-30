import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // customer, merchant, driver
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // 1. تسجيل الدخول
        const { data: authData, error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        if (error) throw error;

        // جلب دور المستخدم من جدول users أو profiles لتوجيهه للصفحة الصحيحة
        const userId = authData.user.id;
        let userRole = 'CUSTOMER';

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userData?.role) {
          userRole = userData.role.toUpperCase();
        } else {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
          if (profileData?.role) userRole = profileData.role.toUpperCase();
        }

        // التوجيه بناءً على الدور الحقيقي
        if (userRole === 'MERCHANT') {
          navigate('/merchant');
        } else if (userRole === 'DRIVER') {
          navigate('/driver');
        } else if (userRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }

      } else {
        // 2. إنشاء حساب جديد
        const formattedRole = role.toUpperCase();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: formattedRole
            }
          }
        });
        
        if (signUpError) throw signUpError;

        if (data?.user) {
          const payload = {
            id: data.user.id,
            full_name: fullName,
            phone: phone,
            role: formattedRole,
            email: email.trim()
          };

          const { error: usersError } = await supabase.from('users').insert([payload]);
          if (usersError) {
            await supabase.from('profiles').insert([payload]);
          }
        }

        // التوجيه بعد التسجيل الجديد حسب الدور المختار
        if (formattedRole === 'MERCHANT') navigate('/merchant');
        else if (formattedRole === 'DRIVER') navigate('/driver');
        else navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء عملية المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#FF6A00]">
            {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isLogin ? 'تسجيل الدخول إلى عالباب' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin ? 'أهلاً بك مجدداً! أدخل بياناتك للمتابعة' : 'انضم إلينا اليوم للاستفادة من كافة الخدمات'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-5 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="مثال: أحمد محمد"
                    required 
                    className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="09XXXXXXXX"
                    required 
                    className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحساب</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6A00] font-bold text-slate-700"
                >
                  <option value="customer">زبون (Customer)</option>
                  <option value="merchant">صاحب مطعم / متجر (Merchant)</option>
                  <option value="driver">مندوب توصيل (Driver)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com"
                required 
                className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
                className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* زر تسجيل الدخول المعدل بستايل مباشر لضمان ظهوره بشكل بارز وثابت */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ backgroundColor: '#FF6A00', color: '#ffffff' }}
            className="w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التنفيذ...</span>
              </>
            ) : (
              <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Button */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            {isLogin ? 'ليس لديك حساب؟ انشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>

      </div>
    </div>
  );
}