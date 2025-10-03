import React, { useState, useEffect } from 'react'
import { useShifts } from '../../hooks/useShifts'
import { supabase } from '../../lib/supabase'
import { Calendar, Clock, Users, Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  badge_number: string
  rank: string
  role: string
}

interface ShiftFormData {
  station_id: string
  shift_name: string
  shift_start: string
  shift_end: string
  assigned_users: string[]
}

const ShiftManagementView: React.FC<{ userId: string }> = ({ userId }) => {
  const { shifts, loading, createShift, updateShift, deleteShift, assignUsersToShift } = useShifts()
  const [showForm, setShowForm] = useState(false)
  const [editingShift, setEditingShift] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [formData, setFormData] = useState<ShiftFormData>({
    station_id: '',
    shift_name: '',
    shift_start: '',
    shift_end: '',
    assigned_users: []
  })
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false
  })

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, badge_number, rank, role')
        .eq('is_active', true)
        .eq('role', 'staff')
        .order('full_name')

      if (error) throw error
      setAllUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.station_id || !formData.shift_name || !formData.shift_start || !formData.shift_end) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    const shiftData = {
      ...formData,
      created_by: userId
    }

    if (editingShift) {
      const { error } = await updateShift(editingShift, shiftData)
      if (error) {
        showNotification('Failed to update shift', 'error')
      } else {
        showNotification('Shift updated successfully', 'success')
        resetForm()
      }
    } else {
      const { error } = await createShift(shiftData)
      if (error) {
        showNotification('Failed to create shift', 'error')
      } else {
        showNotification('Shift created successfully', 'success')
        resetForm()
      }
    }
  }

  const handleEdit = (shift: any) => {
    setEditingShift(shift.id)
    setFormData({
      station_id: shift.station_id,
      shift_name: shift.shift_name,
      shift_start: new Date(shift.shift_start).toISOString().slice(0, 16),
      shift_end: new Date(shift.shift_end).toISOString().slice(0, 16),
      assigned_users: shift.assigned_users
    })
    setShowForm(true)
  }

  const handleDelete = async (shiftId: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      const { error } = await deleteShift(shiftId)
      if (error) {
        showNotification('Failed to delete shift', 'error')
      } else {
        showNotification('Shift deleted successfully', 'success')
      }
    }
  }

  const handleAssignUsers = async (shiftId: string, userIds: string[]) => {
    const { error } = await assignUsersToShift(shiftId, userIds)
    if (error) {
      showNotification('Failed to assign users', 'error')
    } else {
      showNotification('Users assigned successfully', 'success')
    }
  }

  const resetForm = () => {
    setFormData({
      station_id: '',
      shift_name: '',
      shift_start: '',
      shift_end: '',
      assigned_users: []
    })
    setEditingShift(null)
    setShowForm(false)
  }

  const toggleUserAssignment = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }))
  }

  const groupShiftsByDate = () => {
    const grouped: { [key: string]: any[] } = {}
    shifts.forEach(shift => {
      const date = new Date(shift.shift_start).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(shift)
    })
    return grouped
  }

  const groupedShifts = groupShiftsByDate()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading shifts...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--navy-blue)', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          Shift Management
        </h2>
        <button
          className="btn"
          style={{ background: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Create Shift'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 className="card-title">{editingShift ? 'Edit Shift' : 'Create New Shift'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
                  Station/Department *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.station_id}
                  onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                  placeholder="e.g., HQ, Station A"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
                  Shift Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.shift_name}
                  onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                  placeholder="e.g., Morning Shift"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
                  Shift Start *
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.shift_start}
                  onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
                  Shift End *
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.shift_end}
                  onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: 'var(--navy-blue)', fontWeight: '500' }}>
                Assign Staff Members
              </label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
                {allUsers.map(user => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      background: formData.assigned_users.includes(user.id) ? 'var(--light-gray)' : 'transparent',
                      borderRadius: '5px',
                      marginBottom: '5px'
                    }}
                    onClick={() => toggleUserAssignment(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assigned_users.includes(user.id)}
                      onChange={() => {}}
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500' }}>{user.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {user.badge_number} - {user.rank}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" style={{ background: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={20} />
                {editingShift ? 'Update Shift' : 'Create Shift'}
              </button>
              <button type="button" className="btn" onClick={resetForm} style={{ background: '#6c757d', color: 'white' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} />
          Calendar View
        </h3>

        {Object.keys(groupedShifts).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <Calendar size={48} style={{ margin: '0 auto 20px' }} />
            <p>No shifts scheduled yet. Create your first shift to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {Object.entries(groupedShifts).map(([date, dateShifts]) => (
              <div key={date}>
                <h4 style={{ color: 'var(--navy-blue)', marginBottom: '15px', fontSize: '18px' }}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {dateShifts.map(shift => (
                    <div
                      key={shift.id}
                      style={{
                        background: 'var(--light-gray)',
                        borderRadius: '10px',
                        padding: '20px',
                        borderLeft: '5px solid var(--navy-blue)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: '0 0 10px 0', color: 'var(--navy-blue)', fontSize: '18px' }}>
                            {shift.shift_name}
                          </h5>
                          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={16} />
                              {new Date(shift.shift_start).toLocaleTimeString()} - {new Date(shift.shift_end).toLocaleTimeString()}
                            </div>
                            <div>Station: {shift.station_id}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Users size={16} />
                              {shift.assigned_users.length} assigned
                            </div>
                          </div>
                          {shift.profiles && shift.profiles.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {shift.profiles.map((profile: any) => (
                                <div
                                  key={profile.id}
                                  style={{
                                    background: 'white',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    border: '1px solid #ddd'
                                  }}
                                >
                                  {profile.full_name} ({profile.badge_number})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn"
                            style={{ background: 'var(--golden)', color: 'white', padding: '8px 12px' }}
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '8px 12px' }}
                            onClick={() => handleDelete(shift.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default ShiftManagementView
