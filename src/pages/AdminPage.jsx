import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Shield, Users, ShoppingBag, Truck, DollarSign, 
  CheckCircle, XCircle, RefreshCw, AlertCircle, Store, Layers 
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'merchants', 'orders', 'analytics'
  const [drivers, setDrivers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalDrivers: 0,
    totalMerchants: 0
  });
  const [loading, setLoading] = useState(true);

  // جلب البيانات الشاملة للوحة الإدارة
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. جلب المندوبين
      const { data: driversData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'DRIVER');
      setDrivers(driversData || []);

      // 2. جلب التجار
      const { data: merchantsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'MERCHANT');
      setMerchants(merchantsData || []);

      // 3. جلب الطلبات إن وجدت
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*');
      setOrders(ordersData || []);

      // حساب الإحصائيات
      const completed = (ordersData || []).filter(o => o.status === 'completed' || o.status === 'delivered').length;
      const active = (ordersData || []).filter(o => o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'cancelled').length;
      const revenue = (ordersData || []).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

      setStats({
        totalRevenue: revenue,
        activeOrders: active,
        completedOrders: completed,
        totalDrivers: (driversData || []).length,
        totalMerchants: (merchantsData || []).length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // تفعيل أو تعطيل حساب (مندوب أو تاجر)
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      alert('خطأ في تحديث حالة المستخدم: ' + err.message);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Cairo',sans-serif]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الترويسة الرئيسية */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center shadow-inner">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">لوحة الإدارة الشاملة (Admin Central)</h1>
              <p className="text-xs text-slate-500">تحكم كامل بالمتاجر، المناديب، الطلبات، والإحصائيات المالية للنظام.</p>
            </div>
          </div>
          <button 
            onClick={fetchAdminData}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* بطاقات الإحصائيات السريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1">إجمالي المبيعات</p>
              <h3 className="text-xl font-extrabold text-slate-900">{stats.totalRevenue} ل.س</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1">الطلبات النشطة حالياً</p>
              <h3 className="text-xl font-extrabold text-slate-900">{stats.activeOrders} طلب</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1">إجمالي المندوبين</p>
              <h3 className="text-xl font-extrabold text-slate-900">{stats.totalDrivers} مندوب</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Truck size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold mb-1">إجمالي المتاجر (التجار)</p>
              <h3 className="text-xl font-extrabold text-slate-900">{stats.totalMerchants} متجر</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Store size={24} />
            </div>
          </div>
        </div>

        {/* شريط التنقل بين أقسام الإدارة */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drivers' ? 'bg-[#FF6A00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck size={16} />
            <span>إدارة المناديب ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'merchants' ? 'bg-[#FF6A00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store size={16} />
            <span>إدارة المتاجر ({merchants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#FF6A00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers size={16} />
            <span>متابعة الطلبات ({orders.length})</span>
          </button>
        </div>

        {/* محتوى القسم النشط */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          
          {/* قسم إدارة المناديب */}
          {activeTab === 'drivers' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">قائمة مندوبي التوصيل وحالة التفعيل</h3>
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">لا يوجد مندوبون مسجلون حالياً.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {drivers.map(driver => (
                    <div key={driver.id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{driver.name || 'مندوب بدون اسم'}</h4>
                        <p className="text-[11px] text-slate-500">{driver.email} - {driver.phone || 'بدون هاتف'}</p>
                      </div>
                      <button
                        onClick={() => toggleUserStatus(driver.id, driver.status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          driver.status === 'active' 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {driver.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* قسم إدارة المتاجر */}
          {activeTab === 'merchants' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">قائمة المتاجر والتجار المسجلين</h3>
              {merchants.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">لا توجد متاجر مسجلة حالياً.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {merchants.map(merchant => (
                    <div key={merchant.id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{merchant.name || 'متجر بدون اسم'}</h4>
                        <p className="text-[11px] text-slate-500">{merchant.email} - {merchant.phone || 'بدون هاتف'}</p>
                      </div>
                      <button
                        onClick={() => toggleUserStatus(merchant.id, merchant.status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          merchant.status === 'active' 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {merchant.status === 'active' ? 'إيقاف المتجر' : 'تفعيل المتجر'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* قسم متابعة الطلبات */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm mb-4">سجل الطلبات العامة في النظام</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">لا توجد طلبات مسجلة حتى الآن.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3">رقم الطلب</th>
                        <th className="pb-3">الحالة</th>
                        <th className="pb-3">الإجمالي</th>
                        <th className="pb-3">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.map(order => (
                        <tr key={order.id} className="text-slate-700">
                          <td className="py-3 font-mono font-bold">#{order.id.slice(0, 8)}</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                              {order.status || 'جديد'}
                            </span>
                          </td>
                          <td className="py-3 font-bold">{order.total || 0} ل.س</td>
                          <td className="py-3 text-slate-400">{new Date(order.created_at || Date.now()).toLocaleDateString('ar-SY')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}