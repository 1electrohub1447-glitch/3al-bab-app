import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, Route } from 'lucide-react';

// إنشاء أيقونات مخصصة ملونة واحترافية للمواقع الثلاثة
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

const storeIcon = createCustomIcon('#3B82F6', '🏪'); // أزرق للمطعم
const driverIcon = createCustomIcon('#FF6A00', '🛵'); // برتقالي للمندوب
const customerIcon = createCustomIcon('#10B981', '🏠'); // أخضر للزبون

// مكون داخلي لتعديل تركيز الخريطة ومجال الرؤية تلقائياً لتشمل كافة النقاط
function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

// دالة حساب المسافة التقريبية بين إحداثيات جغرافية (Haversine Formula) بالكيلومتر
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // نصف قطر الأرض بـ km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * مكون الخريطة التفاعلية المطور لتتبع الطلب - تطبيق "عالباب"
 */
export default function OrderMap({ lat, lng, storeLoc, customerLoc }) {
  const validDriverLat = Number(lat);
  const validDriverLng = Number(lng);
  const hasDriver = !isNaN(validDriverLat) && !isNaN(validDriverLng) && validDriverLat !== 0;

  const validStoreLat = storeLoc ? Number(storeLoc.lat) : null;
  const validStoreLng = storeLoc ? Number(storeLoc.lng) : null;
  const hasStore = !isNaN(validStoreLat) && !isNaN(validStoreLng) && validStoreLat !== null;

  const validCustomerLat = customerLoc ? Number(customerLoc.lat) : null;
  const validCustomerLng = customerLoc ? Number(customerLoc.lng) : null;
  const hasCustomer = !isNaN(validCustomerLat) && !isNaN(validCustomerLng) && validCustomerLat !== null;

  // في حال عدم توفر أي إحداثيات
  if (!hasDriver && !hasStore && !hasCustomer) {
    return (
      <div className="w-full h-52 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 border border-dashed border-slate-300 my-3">
        <MapPin size={32} className="mb-2 text-slate-300 animate-bounce" />
        <span className="text-xs font-bold text-slate-500">جاري تحديد الموقع على الخريطة...</span>
        <span className="text-[10px] text-slate-400 mt-1">سيتم تفعيل الخريطة فور انطلاق المندوب</span>
      </div>
    );
  }

  const allPositions = [];
  if (hasStore) allPositions.push([validStoreLat, validStoreLng]);
  if (hasDriver) allPositions.push([validDriverLat, validDriverLng]);
  if (hasCustomer) allPositions.push([validCustomerLat, validCustomerLng]);

  const defaultCenter = allPositions[0] || [33.5138, 36.2765];

  // حساب المسافة المتبقية ووقت الوصول التقديري (ETA) إذا توفر موقع المندوب والزبون
  let distanceKm = null;
  let estimatedMinutes = null;
  if (hasDriver && hasCustomer) {
    distanceKm = calculateDistance(validDriverLat, validDriverLng, validCustomerLat, validCustomerLng);
    // افتراض سرعة متوسطة داخل المدينة 25 كم/ساعة + 5 دقائق تحضير إضافية
    estimatedMinutes = Math.max(3, Math.round((distanceKm / 25) * 60));
  }

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm my-3 z-0">
      
      {/* شريط معلومات علوي ذكي يوضح المسافة والوقت التقديري */}
      <div className="absolute top-2 right-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <Navigation size={15} className="text-[#FF6A00] animate-spin" />
          <span>تتبع مسار التوصيل الحي</span>
        </div>

        {estimatedMinutes !== null ? (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
              <Route size={12} className="text-[#FF6A00]" />
              {distanceKm.toFixed(1)} كم
            </span>
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <Clock size={12} />
              حوالي {estimatedMinutes} دقيقة
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            مباشر
          </span>
        )}
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={14} 
        scrollWheelZoom={false}
        touchZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPositions.length > 1 && <ChangeView bounds={allPositions} />}

        {/* 🛣️ رسم خط سير الرحلة المتبادل بين المطعم والمندوب والزبون */}
        {hasStore && hasDriver && (
          <Polyline 
            positions={[[validStoreLat, validStoreLng], [validDriverLat, validDriverLng]]} 
            color="#3B82F6" 
            weight={3} 
            dashArray="6, 6" 
          />
        )}
        {hasDriver && hasCustomer && (
          <Polyline 
            positions={[[validDriverLat, validDriverLng], [validCustomerLat, validCustomerLng]]} 
            color="#FF6A00" 
            weight={4} 
          />
        )}

        {/* 1. نقطة موقع المطعم */}
        {hasStore && (
          <Marker position={[validStoreLat, validStoreLng]} icon={storeIcon}>
            <Popup dir="rtl">
              <div className="font-bold text-xs">🏪 المطعم</div>
              <div className="text-[11px] text-slate-500">{storeLoc.name || 'موقع استلام الوجبة'}</div>
            </Popup>
          </Marker>
        )}

        {/* 2. نقطة موقع المندوب */}
        {hasDriver && (
          <Marker position={[validDriverLat, validDriverLng]} icon={driverIcon}>
            <Popup dir="rtl">
              <div className="font-bold text-xs text-[#FF6A00]">🛵 المندوب في الطريق</div>
              <div className="text-[11px] text-slate-500">موقع المندوب المباشر الان</div>
            </Popup>
          </Marker>
        )}

        {/* 3. نقطة موقع الزبون */}
        {hasCustomer && (
          <Marker position={[validCustomerLat, validCustomerLng]} icon={customerIcon}>
            <Popup dir="rtl">
              <div className="font-bold text-xs text-emerald-600">🏠 موقع التسليم</div>
              <div className="text-[11px] text-slate-500">{customerLoc.name || 'عنوان الزبون'}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}