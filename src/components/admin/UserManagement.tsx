import React, { useState, useEffect } from 'react'
import { UserPlus, CreditCard as Edit, Trash2, Search, ListFilter as Filter, Shield, Phone, Mail, MapPin, Calendar, RefreshCw } from 'lucide-react'
import { UserManagementProps, Notification } from '../../types'
import { supabase } from '../../lib/supabase'

interface StaffMember {
  id: string;
  badge_number: string;
  full_name: string;
  rank: string;
  role: 'staff' | 'admin';
  phone: string | null;
  email: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

interface NewUserForm {
  badge_number: string;
  full_name: string;
  rank: string;
  role: 'staff' | 'admin';
  phone: string;
  email: string;
  department: string;
  password: string;
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null)
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [newUser, setNewUser] = useState<NewUserForm>({
    badge_number: '',
    full_name: '',
    rank: 'Constable',
    role: 'staff',
    phone: '',
    email: '',
    department: 'General',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaffMembers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showNotification('Error loading users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.badge_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || staff.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!newUser.badge_number || !newUser.full_name || !newUser.email || !newUser.password) {
      showNotification('Please fill in all required fields!', 'error')
      return
    }

    const badgeExists = staffMembers.some(staff => staff.badge_number === newUser.badge_number)
    if (badgeExists) {
      showNotification('Badge number already exists!', 'error')
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            badge_number: newUser.badge_number,
            full_name: newUser.full_name,
            rank: newUser.rank,
            role: newUser.role
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: newUser.phone || null,
            department: newUser.department || null
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError
      }

      showNotification(`User ${newUser.full_name} added successfully!`, 'success')

      setNewUser({
        badge_number: '',
        full_name: '',
        rank: 'Constable',
        role: 'staff',
        phone: '',
        email: '',
        department: 'General',
        password: ''
      })
      setShowAddModal(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Error adding user:', error)
      showNotification(error.message || 'Error adding user', 'error')
    }
  }

  const handleEditUser = (user: StaffMember): void => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (user: StaffMember): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (error) throw error

        showNotification(`User ${user.full_name} deleted successfully!`, 'success')
        fetchUsers()
      } catch (error: any) {
        console.error('Error deleting user:', error)
        showNotification('Error deleting user', 'error')
      }
    }
  }

  const handleToggleActive = async (user: StaffMember): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error

      const action = user.is_active ? 'deactivated' : 'activated'
      showNotification(`User ${user.full_name} ${action} successfully!`, 'info')
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user status:', error)
      showNotification('Error updating user status', 'error')
    }
  }

  const getRankBadgeColor = (rank: string): string => {
    switch (rank) {
      case 'Inspector':
        return 'var(--golden)'
      case 'SI':
        return 'var(--navy-blue)'
      case 'Constable':
        return 'var(--dark-gray)'
      default:
        return 'var(--dark-gray)'
    }
  }

  const getRoleBadgeColor = (role: string): string => {
    return role === 'admin' ? 'var(--red)' : 'var(--green)'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading users...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--navy-blue)', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          User Management
        </h2>
        <button
          onClick={fetchUsers}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '250px' }}>
              <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-gray)' }} />
              <input
                type="text"
                placeholder="Search by name or badge..."
                className="form-control"
                style={{ paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div style={{ position: 'relative', minWidth: '150px' }}>
              <Filter size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dark-gray)' }} />
              <select
                className="form-control"
                style={{ paddingLeft: '40px' }}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Add User Button */}
          <button 
            className="btn btn-golden"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="card">
        <h3 className="card-title">Staff Members ({filteredStaff.length})</h3>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Badge</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Role</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="profile-img">
                        {staff.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <strong>{staff.badge_number}</strong>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600' }}>{staff.full_name}</div>
                      <small style={{ color: 'var(--dark-gray)' }}>{staff.email}</small>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: `${getRankBadgeColor(staff.rank)}20`, 
                        color: getRankBadgeColor(staff.rank),
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {staff.rank}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: `${getRoleBadgeColor(staff.role)}20`, 
                        color: getRoleBadgeColor(staff.role),
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}
                    >
                      {staff.role === 'admin' && <Shield size={12} style={{ marginRight: '3px' }} />}
                      {staff.role}
                    </span>
                  </td>
                  <td>{staff.department}</td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                        <Phone size={12} />
                        {staff.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={12} />
                        {staff.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: staff.is_active ? '#d5f4e6' : '#fadbd8', 
                        color: staff.is_active ? 'var(--green)' : 'var(--red)',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <small style={{ color: 'var(--dark-gray)' }}>
                      {new Date(staff.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        onClick={() => handleEditUser(staff)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className={`btn ${staff.is_active ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        onClick={() => handleToggleActive(staff)}
                      >
                        {staff.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                        onClick={() => handleDeleteUser(staff)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--navy-blue)' }}>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Badge Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., STAFF004"
                    value={newUser.badge_number}
                    onChange={(e) => setNewUser({...newUser, badge_number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Officer Full Name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Rank</label>
                  <select
                    className="form-control"
                    value={newUser.rank}
                    onChange={(e) => setNewUser({...newUser, rank: e.target.value})}
                  >
                    <option value="Constable">Constable</option>
                    <option value="SI">SI</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Role</label>
                  <select
                    className="form-control"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="officer@police.gov"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Minimum 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91-9876543210"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Department</label>
                  <select
                    className="form-control"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Investigation">Investigation</option>
                    <option value="Patrol">Patrol</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-golden">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default UserManagement