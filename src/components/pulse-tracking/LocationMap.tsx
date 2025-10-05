import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  userName: string;
  timestamp?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  accuracy,
  userName,
  timestamp
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #0a1f44, #0f2951);
          color: white;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          border: 4px solid #d4af37;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          ${userName.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    markerRef.current = L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div style="padding: 10px; font-family: 'Inter', sans-serif;">
          <strong style="color: #0a1f44; font-size: 16px; display: block; margin-bottom: 8px;">
            ${userName}
          </strong>
          <div style="color: #6c757d; font-size: 13px; line-height: 1.6;">
            <div><strong>Location:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>
            ${accuracy ? `<div><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</div>` : ''}
            ${timestamp ? `<div><strong>Last Updated:</strong> ${new Date(timestamp).toLocaleString()}</div>` : ''}
          </div>
        </div>
      `)
      .openPopup();

    if (accuracy && accuracy > 0) {
      circleRef.current = L.circle([latitude, longitude], {
        color: '#d4af37',
        fillColor: '#d4af37',
        fillOpacity: 0.2,
        radius: accuracy,
      }).addTo(map);
    }

    map.setView([latitude, longitude], 15);

    return () => {
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      if (circleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
      }
    };
  }, [latitude, longitude, accuracy, userName, timestamp]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '15px',
        overflow: 'hidden',
        border: '2px solid #e9ecef',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        maxWidth: '100%'
      }}
    />
  );
};

export default LocationMap;
