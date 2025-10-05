import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet'
import { MapPin, Save, Plus, Trash2, Edit2, X } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geofenceService, type Geofence } from '../../lib/geofenceService'

interface GeofenceManagementViewProps {
  userId: string
}

interface PolygonCoordinate {
  lat: number
  lng: number
}

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

const GeofenceManagementView: React.FC<GeofenceManagementViewProps> = ({ userId }) => {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [polygonPoints, setPolygonPoints] = useState<PolygonCoordinate[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean }>({
    message: '',
    type: 'info',
    show: false
  })

  const [formData, setFormData] = useState({
    stationId: '',
    stationName: '',
    radiusMeters: 500
  })

  useEffect(() => {
    loadGeofences()
  }, [])

  const loadGeofences = async () => {
    try {
      const data = await geofenceService.getActiveGeofences()
      setGeofences(data)
    } catch (error) {
      console.error('Error loading geofences:', error)
      showNotification('Failed to load geofences', 'error')
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!isCreating && !isEditing) return

    setPolygonPoints(prev => [...prev, { lat, lng }])
  }

  const handleRemovePoint = (index: number) => {
    setPolygonPoints(prev => prev.filter((_, i) => i !== index))
  }

  const calculateCenter = (points: PolygonCoordinate[]) => {
    if (points.length === 0) return { latitude: 0, longitude: 0 }

    const sum = points.reduce(
      (acc, point) => ({
        lat: acc.lat + point.lat,
        lng: acc.lng + point.lng
      }),
      { lat: 0, lng: 0 }
    )

    return {
      latitude: sum.lat / points.length,
      longitude: sum.lng / points.length
    }
  }

  const handleStartCreate = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedGeofence(null)
    setPolygonPoints([])
    setFormData({
      stationId: '',
      stationName: '',
      radiusMeters: 500
    })
  }

  const handleStartEdit = (geofence: Geofence) => {
    setSelectedGeofence(geofence)
    setIsEditing(true)
    setIsCreating(false)

    if (geofence.boundary_coordinates?.coordinates?.[0]) {
      const coords = geofence.boundary_coordinates.coordinates[0].map(([lng, lat]: [number, number]) => ({
        lat,
        lng
      }))
      setPolygonPoints(coords)
    }

    setFormData({
      stationId: geofence.station_id,
      stationName: geofence.station_name,
      radiusMeters: geofence.radius_meters || 500
    })

    setMapCenter([geofence.center_latitude, geofence.center_longitude])
  }

  const handleSaveGeofence = async () => {
    try {
      if (polygonPoints.length < 3) {
        showNotification('Please add at least 3 points to create a geofence', 'error')
        return
      }

      if (!formData.stationId || !formData.stationName) {
        showNotification('Please fill in all required fields', 'error')
        return
      }

      const center = calculateCenter(polygonPoints)

      const boundaryCoordinates = {
        type: 'Polygon',
        coordinates: [
          polygonPoints.map(point => [point.lng, point.lat])
        ]
      }

      const geofenceData = {
        station_id: formData.stationId,
        station_name: formData.stationName,
        boundary_coordinates: boundaryCoordinates,
        center_latitude: center.latitude,
        center_longitude: center.longitude,
        radius_meters: formData.radiusMeters,
        is_active: true,
        created_by: userId
      }

      if (isEditing && selectedGeofence) {
        const success = await geofenceService.updateGeofence(selectedGeofence.id, geofenceData)
        if (success) {
          showNotification('Geofence updated successfully', 'success')
          await loadGeofences()
          handleCancel()
        } else {
          showNotification('Failed to update geofence', 'error')
        }
      } else {
        const result = await geofenceService.createGeofence(geofenceData)
        if (result) {
          showNotification('Geofence created successfully', 'success')
          await loadGeofences()
          handleCancel()
        } else {
          showNotification('Failed to create geofence', 'error')
        }
      }
    } catch (error) {
      console.error('Error saving geofence:', error)
      showNotification('An error occurred while saving the geofence', 'error')
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
    setSelectedGeofence(null)
    setPolygonPoints([])
    setFormData({
      stationId: '',
      stationName: '',
      radiusMeters: 500
    })
  }

  const handleDeleteGeofence = async (geofenceId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this geofence?')) return

    try {
      const success = await geofenceService.updateGeofence(geofenceId, { is_active: false })
      if (success) {
        showNotification('Geofence deactivated successfully', 'success')
        await loadGeofences()
      } else {
        showNotification('Failed to deactivate geofence', 'error')
      }
    } catch (error) {
      console.error('Error deleting geofence:', error)
      showNotification('An error occurred while deleting the geofence', 'error')
    }
  }

  const handleViewGeofence = (geofence: Geofence) => {
    setMapCenter([geofence.center_latitude, geofence.center_longitude])
    setSelectedGeofence(geofence)

    if (geofence.boundary_coordinates?.coordinates?.[0]) {
      const coords = geofence.boundary_coordinates.coordinates[0].map(([lng, lat]: [number, number]) => ({
        lat,
        lng
      }))
      setPolygonPoints(coords)
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Geofence Management
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3 className="card-title">Existing Geofences</h3>
          <div style={{ marginBottom: '15px' }}>
            <button
              className="btn btn-primary"
              onClick={handleStartCreate}
              disabled={isCreating || isEditing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Create New Geofence
            </button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {geofences.length === 0 ? (
              <p style={{ color: 'var(--dark-gray)', textAlign: 'center', padding: '20px' }}>
                No geofences found. Create one to get started.
              </p>
            ) : (
              geofences.map(geofence => (
                <div
                  key={geofence.id}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: selectedGeofence?.id === geofence.id ? '#e3f2fd' : 'var(--light-gray)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedGeofence?.id === geofence.id ? '2px solid var(--navy-blue)' : '1px solid transparent'
                  }}
                  onClick={() => handleViewGeofence(geofence)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)', marginBottom: '5px' }}>
                        {geofence.station_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>
                        Station ID: {geofence.station_id}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>
                        Radius: {geofence.radius_meters}m
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(geofence)
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        disabled={isCreating || isEditing}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGeofence(geofence.id)
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        disabled={isCreating || isEditing}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">
            {isCreating ? 'Create New Geofence' : isEditing ? 'Edit Geofence' : 'Geofence Details'}
          </h3>
          {(isCreating || isEditing) ? (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Station ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.stationId}
                  onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                  placeholder="e.g., HQ001"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Station Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.stationName}
                  onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                  placeholder="e.g., Police Headquarters"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Radius (meters)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.radiusMeters}
                  onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) || 500 })}
                  min="100"
                  max="10000"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Boundary Points ({polygonPoints.length})
                </label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                  {polygonPoints.length === 0 ? (
                    <p style={{ color: 'var(--dark-gray)', fontSize: '12px', textAlign: 'center' }}>
                      Click on the map to add points
                    </p>
                  ) : (
                    polygonPoints.map((point, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '5px',
                          marginBottom: '5px',
                          background: 'white',
                          borderRadius: '4px'
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>
                          Point {index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                        </span>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemovePoint(index)}
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveGeofence}
                  disabled={polygonPoints.length < 3}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  {isEditing ? 'Update' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedGeofence ? (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Station Name:</strong> {selectedGeofence.station_name}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Station ID:</strong> {selectedGeofence.station_id}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Radius:</strong> {selectedGeofence.radius_meters}m
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Center:</strong> {selectedGeofence.center_latitude.toFixed(6)}, {selectedGeofence.center_longitude.toFixed(6)}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Boundary Points:</strong> {selectedGeofence.boundary_coordinates?.coordinates?.[0]?.length || 0}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Status:</strong>{' '}
                <span style={{ color: selectedGeofence.is_active ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>
                  {selectedGeofence.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--dark-gray)', textAlign: 'center', padding: '20px' }}>
              Select a geofence to view details or create a new one
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Interactive Map</h3>
        <div style={{ marginBottom: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--navy-blue)' }}>
            {isCreating || isEditing
              ? 'Click on the map to add boundary points. You need at least 3 points to create a geofence.'
              : 'Select a geofence from the list to view it on the map, or click "Create New Geofence" to start.'}
          </p>
        </div>
        <div style={{ height: 'min(500px, 60vh)', width: '100%', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={mapCenter} />
            {(isCreating || isEditing) && <MapClickHandler onMapClick={handleMapClick} />}
            {polygonPoints.map((point, index) => (
              <Marker
                key={index}
                position={[point.lat, point.lng]}
                icon={customMarkerIcon}
              />
            ))}
            {polygonPoints.length >= 3 && (
              <Polygon
                positions={polygonPoints.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: isCreating || isEditing ? 'red' : 'blue',
                  fillColor: isCreating || isEditing ? 'red' : 'blue',
                  fillOpacity: 0.2
                }}
              />
            )}
            {!isCreating && !isEditing && selectedGeofence && selectedGeofence.boundary_coordinates?.coordinates?.[0] && (
              <Polygon
                positions={selectedGeofence.boundary_coordinates.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng])}
                pathOptions={{
                  color: 'green',
                  fillColor: 'green',
                  fillOpacity: 0.2
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default GeofenceManagementView
