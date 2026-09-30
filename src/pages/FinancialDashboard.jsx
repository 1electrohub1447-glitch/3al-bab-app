import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { DollarSign, ShoppingBag, Bike, TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancialDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH

  // نسبة عمولة التطبيق (10%)
  const APP_COMMISSION_PERCENTAGE = 0.10;

  useEffect(() => {
    fetchFinancialData();
  }, [timeFilter]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', 'DELIVERED') // نحسب المبيعات من الطلبات المكتملة فقط
        .order('created_at', { ascending: true });

      // تطبيق الفلترة الزمنية إن وجدت
      if (timeFilter === 'TODAY') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        query = query.gte('created_at', todayStart.toISOString());
      } else if (timeFilter === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeFilter === 'MONTH') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetchedOrders = data || [];
      setOrders(fetchedOrders);

      // تجميع البيانات حسب التاريخ للرسم البياني
      const groupedData = {};
      fetchedOrders.forEach((order) => {
        const price = Number(order.total_price || 0);
        const dateKey = order.created_at
          ? new Date(order.created_at).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })
          : 'غير محدد';

        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { date: dateKey, revenue: 0, commission: 0 };
        }
        groupedData[dateKey].revenue += price;
        groupedData[dateKey].commission += price * APP_COMMISSION_PERCENTAGE;
      });

      setChartData(Object.values(groupedData));
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // الحسابات المالية الإجمالية
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
  const appCommission = totalRevenue * APP_COMMISSION_PERCENTAGE;
  const netDriversEarnings = totalRevenue - appCommission;

  const formatPrice = (val) => `${Number(val || 0).toLocaleString('ar-SY')} ل.س`;

  return (
    <main style={{ maxWidth: '650px', margin: '0 auto', padding: '16px', paddingBottom: '40px', fontFamily: 'sans-serif' }} dir="rtl">
      
      {/* هيدر الصفحة */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '20px', borderRadius: '24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp color="#10b981" size={24} /> التقارير المالية والحسابات
          </h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>ملخص الأرباح والطلبات المكتملة</span>
        </div>
        <button 
          onClick={fetchFinancialData} 
          style={{ background: '#1e293b', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <RefreshCw size={14} /> تحديث
        </button>
      </header>

      {/* أزرار التصفية الزمنية */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
        {[
          { id: 'ALL', label: 'الكل' },
          { id: 'TODAY', label: 'اليوم' },
          { id: 'WEEK', label: 'آخر أسبوع' },
          { id: 'MONTH', label: 'آخر شهر' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeFilter(tab.id)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              background: timeFilter === tab.id ? '#10b981' : 'transparent',
              color: timeFilter === tab.id ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        
        {/* إجمالي دخل المبيعات */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
            <DollarSign size={18} color="#10b981" /> إجمالي التداول
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginTop: '8px' }}>
            {formatPrice(totalRevenue)}
          </div>
        </div>

        {/* صافي عمولة التطبيق */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
            <TrendingUp size={18} color="#FF6B00" /> عمولة التطبيق (10%)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF6B00', marginTop: '8px' }}>
            {formatPrice(appCommission)}
          </div>
        </div>

        {/* أرباح المناديب / المتاجر */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
            <Bike size={18} color="#0284c7" /> صافي المتاجر والمناديب
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0284c7', marginTop: '8px' }}>
            {formatPrice(netDriversEarnings)}
          </div>
        </div>

        {/* عدد الطلبات المكتملة */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
            <ShoppingBag size={18} color="#8b5cf6" /> الطلبات المكتملة
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6', marginTop: '8px' }}>
            {orders.length} طلبات
          </div>
        </div>

      </section>

      {/* الرسم البياني للتداول */}
      <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>📈 منحنى نمو المبيعات</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>جاري تحميل البيانات البيانية...</p>
        ) : chartData.length > 0 ? (
          <div style={{ width: '100%', height: 220 }} dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(value) => [formatPrice(value), 'الإيراد']}
                  contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>لا توجد بيانات متاحة للرسم البياني في هذه الفترة.</p>
        )}
      </section>

      {/* سجل أحدث السحوبات والعمليات */}
      <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>📑 سجل الطلبات المكتملة</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>جاري تحميل البيانات...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>لا توجد طلبات مكتملة حتى الآن.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block', color: '#334155' }}>طلب #{String(o.id).slice(0, 8)}</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>الزبون: {o.customer_name || 'غير معروف'}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981', display: 'block' }}>+{formatPrice(o.total_price)}</span>
                <span style={{ fontSize: '11px', color: '#FF6B00' }}>عمولة: {formatPrice(Number(o.total_price || 0) * APP_COMMISSION_PERCENTAGE)}</span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}