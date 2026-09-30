import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, MapPin, Edit2, Save, X, ArrowRight, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: ''
  });

  const [newAddress, setNewAddress] = useState({
    label: 'المنزل',
    address_line1: '',
    city: '',
    district: '',
    is_default: false
  });

  useEffect(() => {
    fetchProfileAndAddresses();
  }, []);

  const fetchProfileAndAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      // جلب بيانات الملف الشخصي
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          bio: profileData.bio || ''
        });
      }

      // جلب العناوين المحفوظة
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (addressData) setAddresses(addressData);

    } catch (err) {
      console.error('خطأ أثناء جلب البيانات:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          updated_at: new Date()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('✅ تم تحديث الملف الشخصي بنجاح');
      setEditing(false);
      fetchProfileAndAddresses();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newAddress.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('addresses')
        .insert([{
          user_id: user.id,
          ...newAddress
        }]);

      if (error) throw error;

      alert('✅ تم إضافة العنوان بنجاح');
      setShowAddressForm(false);
      setNewAddress({ label: 'المنزل', address_line1: '', city: '', district: '', is_default: false });
      fetchProfileAndAddresses();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProfileAndAddresses();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: '#FF6A00', fontWeight: 'bold' }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', paddingBottom: '30px', fontFamily: 'sans-serif' }} dir="rtl">

      {/* 🔹 هيدر الصفحة مع زر الرجوع للرئيسية */}
      <div style={{ background: '#FF6A00', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '10px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowRight size={20} />
        </button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>الملف الشخصي</h3>
      </div>

      <div style={{ padding: '16px' }}>

        {/* 👤 كارت معلومات المستخدم / التعديل */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>معلومات الحساب</h4>
            <button 
              onClick={() => setEditing(!editing)}
              style={{ background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}
            >
              {editing ? <X size={14} /> : <Edit2 size={14} />}
              {editing ? ' إلغاء' : ' تعديل'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>الاسم الكامل</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>نبذة عني</label>
                <textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', height: '70px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ background: '#FF6A00', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Save size={16} /> حفظ التغييرات
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={18} color="#FF6A00" />
                <span><strong>الاسم:</strong> {profile?.full_name || 'غير محدد'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="#94A3B8" />
                <span><strong>البريد:</strong> {user?.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} color="#94A3B8" />
                <span><strong>الهاتف:</strong> {profile?.phone || 'غير محدد'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>🛡️</span>
                <span><strong>الدور:</strong> {profile?.role || 'CUSTOMER'}</span>
              </div>
              {profile?.bio && (
                <div style={{ marginTop: '4px', background: '#F8FAFC', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#64748B' }}>
                  <strong>نبذة:</strong> {profile.bio}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 📍 قسم العناوين */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A' }}>
              <MapPin size={18} color="#FF6A00" /> العناوين المحفوظة
            </span>
            <button 
              onClick={() => setShowAddressForm(!showAddressForm)}
              style={{ background: '#FF6A00', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> إضافة عنوان
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', marginBottom: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>تسمية العنوان</label>
                  <select 
                    value={newAddress.label} 
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="المنزل">المنزل</option>
                    <option value="العمل">العمل</option>
                    <option value="آخر">آخر</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>العنوان التفصيلي</label>
                  <input 
                    type="text" 
                    required 
                    value={newAddress.address_line1} 
                    onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box', background: '#fff' }}
                    placeholder="شارع الحمراء، بناية 15"
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>المدينة</label>
                    <input 
                      type="text" 
                      required 
                      value={newAddress.city} 
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box', background: '#fff' }}
                      placeholder="دمشق"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>المنطقة</label>
                    <input 
                      type="text" 
                      value={newAddress.district} 
                      onChange={(e) => setNewAddress({...newAddress, district: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box', background: '#fff' }}
                      placeholder="المزة"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <input 
                    type="checkbox" 
                    id="is_default" 
                    checked={newAddress.is_default} 
                    onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="is_default" style={{ fontSize: '12px', color: '#334155', cursor: 'pointer' }}>تعيين كعنوان افتراضي</label>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="submit" style={{ flex: 1, background: '#FF6A00', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                    حفظ العنوان
                  </button>
                  <button type="button" onClick={() => setShowAddressForm(false)} style={{ background: '#E2E8F0', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '12px 0', fontSize: '12px', margin: 0 }}>
              لا توجد عناوين محفوظة
            </p>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} style={{ borderBottom: '1px solid #F1F5F9', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {addr.label} {addr.is_default && <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '6px' }}>افتراضي</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{addr.address_line1}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{addr.city}{addr.district ? `، ${addr.district}` : ''}</div>
                </div>
                <button 
                  onClick={() => deleteAddress(addr.id)}
                  style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="حذف العنوان"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 🚪 زر تسجيل الخروج */}
        <button 
          onClick={handleLogout}
          style={{ width: '100%', background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <LogOut size={18} /> تسجيل الخروج
        </button>

      </div>
    </div>
  );
}