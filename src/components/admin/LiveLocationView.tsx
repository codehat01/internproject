import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { supabase } from '../../lib/supabase'
import { MapPin, Users, Clock, AlertCircle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

interface UserLocation {
  id: string
  user_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: string
  is_active: boolean
  profile: {
    full_name: string
    badge_number: string
    rank: string
    role: string
  }
  attendance_status?: 'present' | 'absent' | 'on_leave'
  last_check_in?: string
}

const userIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const adminIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

const LiveLocationView: React.FC = () => {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.209])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'present' | 'absent' | 'on_leave'>('all')

  useEffect(() => {
    fetchUserLocations()

    const channel = supabase
      .channel('user-locations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations'
        },
        () => {
          fetchUserLocations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUserLocations = async () => {
    try {
      setLoading(true)

      const { data: locationsData, error: locationsError } = await supabase
        .from('user_locations')
        .select(`
          *,
          profiles:user_id (
            full_name,
            badge_number,
            rank,
            role
          )
        `)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })

      if (locationsError) throw locationsError

      const uniqueUserLocations = new Map<string, any>()
      locationsData?.forEach(location => {
        if (!uniqueUserLocations.has(location.user_id)) {
          uniqueUserLocations.set(location.user_id, location)
        }
      })

      const locationsArray = Array.from(uniqueUserLocations.values())

      const enrichedLocations = await Promise.all(
        locationsArray.map(async (location) => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const { data: todayAttendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', location.user_id)
            .gte('timestamp', today.toISOString())
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle()

          const { data: activeLeave } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_id', location.user_id)
            .eq('status', 'approved')
            .lte('start_date', new Date().toISOString().split('T')[0])
            .gte('end_date', new Date().toISOString().split('T')[0])
            .maybeSingle()

          let attendance_status: 'present' | 'absent' | 'on_leave' = 'absent'
          if (activeLeave) {
            attendance_status = 'on_leave'
          } else if (todayAttendance && todayAttendance.punch_type === 'IN') {
            attendance_status = 'present'
          }

          return {
            ...location,
            profile: Array.isArray(location.profiles) ? location.profiles[0] : location.profiles,
            attendance_status,
            last_check_in: todayAttendance?.timestamp
          }
        })
      )

      setUserLocations(enrichedLocations)

      if (enrichedLocations.length > 0) {
        const firstLocation = enrichedLocations[0]
        setMapCenter([firstLocation.latitude, firstLocation.longitude])
      }
    } catch (error) {
      console.error('Error fetching user locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLocations = userLocations.filter(location => {
    if (selectedFilter === 'all') return true
    return location.attendance_status === selectedFilter
  })

  const stats = {
    total: userLocations.length,
    present: userLocations.filter(l => l.attendance_status === 'present').length,
    absent: userLocations.filter(l => l.attendance_status === 'absent').length,
    on_leave: userLocations.filter(l => l.attendance_status === 'on_leave').length
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading live locations...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
        Live Location Tracking
      </h2>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid #0a1f44',
            cursor: 'pointer',
            opacity: selectedFilter === 'all' ? 1 : 0.6
          }}
          onClick={() => setSelectedFilter('all')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Active Users</div>
            </div>
            <Users size={48} style={{ color: '#0a1f44', marginLeft: 'auto' }} />
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid #28a745',
            cursor: 'pointer',
            opacity: selectedFilter === 'present' ? 1 : 0.6
          }}
          onClick={() => setSelectedFilter('present')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="stat-number">{stats.present}</div>
              <div className="stat-label">Present</div>
            </div>
            <MapPin size={48} style={{ color: '#28a745', marginLeft: 'auto' }} />
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid #dc3545',
            cursor: 'pointer',
            opacity: selectedFilter === 'absent' ? 1 : 0.6
          }}
          onClick={() => setSelectedFilter('absent')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="stat-number">{stats.absent}</div>
              <div className="stat-label">Absent</div>
            </div>
            <AlertCircle size={48} style={{ color: '#dc3545', marginLeft: 'auto' }} />
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid #d4af37',
            cursor: 'pointer',
            opacity: selectedFilter === 'on_leave' ? 1 : 0.6
          }}
          onClick={() => setSelectedFilter('on_leave')}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="stat-number">{stats.on_leave}</div>
              <div className="stat-label">On Leave</div>
            </div>
            <Clock size={48} style={{ color: '#d4af37', marginLeft: 'auto' }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ height: '600px', padding: '20px' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', borderRadius: '10px' }}
        >
          <MapUpdater center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={location.profile?.role === 'admin' ? adminIcon : userIcon}
            >
              <Popup>
                <div style={{ padding: '10px', minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--navy-blue)', fontSize: '16px' }}>
                    {location.profile?.full_name}
                  </h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Badge:</strong> {location.profile?.badge_number}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Rank:</strong> {location.profile?.rank}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Status:</strong>{' '}
                    <span
                      style={{
                        color:
                          location.attendance_status === 'present'
                            ? '#28a745'
                            : location.attendance_status === 'on_leave'
                            ? '#d4af37'
                            : '#dc3545',
                        fontWeight: 'bold'
                      }}
                    >
                      {location.attendance_status?.toUpperCase()}
                    </span>
                  </p>
                  {location.last_check_in && (
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>Last Check-in:</strong>{' '}
                      {new Date(location.last_check_in).toLocaleTimeString()}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    <strong>Updated:</strong> {new Date(location.timestamp).toLocaleString()}
                  </p>
                  {location.accuracy && (
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                      <strong>Accuracy:</strong> {location.accuracy.toFixed(0)}m
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default LiveLocationView
