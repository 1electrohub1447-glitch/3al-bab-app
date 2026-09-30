import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, X, ShoppingBag } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserAndFavorites();
  }, []);

  const getUserAndFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);
      await fetchFavorites(user.id);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchFavorites = async (userId) => {
    try {
      // جلب المنتجات المفضلة مع بيانات المتجر التابع للمنتج
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products:product_id (
            id,
            name,
            price,
            image_url,
            store_id,
            stores:store_id (
              id,
              name,
              logo_url
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(data || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    // تحديث متفائل للواجهة لإعطاء تجربة استخدام سريعة
    const previousFavorites = [...favorites];
    setFavorites(favorites.filter(f => f.id !== favoriteId));

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
      setFavorites(previousFavorites); // إعادة القائمة الأصلية في حال فشل الحذف
    }
  };

  const addToCart = async (product) => {
    if (!product) return;
    
    try {
      // يمكنك تعديل هذه المنطقة لتتطابق مع جدول أو آلية السلة لديك (مثلاً جدول cart أو LocalStorage)
      // مثال افتراضي لإضافة المنتج للسلة:
      const cartItem = {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        store_id: product.store_id,
        quantity: 1
      };

      // لو كنت تستخدم LocalStorage للسلة:
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const itemIndex = existingCart.findIndex(item => item.product_id === product.id);
      
      if (itemIndex > -1) {
        existingCart[itemIndex].quantity += 1;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      alert(`تم إضافة "${product.name}" إلى السلة بنجاح! 🛒`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('حدث خطأ أثناء الإضافة إلى السلة');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontFamily: 'sans-serif' }}>
        جاري التحميل...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontFamily: 'sans-serif' }}>
        يرجى تسجيل الدخول لعرض قائمة المفضلة.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }} dir="rtl">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Heart size={28} color="#ea580c" fill="#ea580c" />
        <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>المفضلة</h1>
        <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', color: '#64748b' }}>
          {favorites.length}
        </span>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Heart size={48} color="#cbd5e1" />
          <h3 style={{ color: '#1e293b', marginTop: '12px' }}>لا توجد مفضلات</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            أضف منتجاتك المفضلة لتجدها هنا
          </p>
        </div>
      ) : (
        /* Favorites List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favorites.map((fav) => {
            const product = fav.products;
            const store = product?.stores;
            
            return (
              <div key={fav.id} style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                
                {product?.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽️</div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{product?.name || 'منتج غير معروف'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {store?.name || 'متجر غير معروف'}
                  </div>
                  <div style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>
                    {product?.price ? Number(product.price).toLocaleString('ar-SY') : 0} ل.س
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => addToCart(product)}
                    style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                    title="إضافة للسلة"
                  >
                    <ShoppingBag size={16} />
                  </button>
                  <button 
                    onClick={() => removeFavorite(fav.id)}
                    style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="حذف من المفضلة"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}