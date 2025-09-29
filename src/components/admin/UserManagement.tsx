import React, { useState } from 'react'
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react'
import { UserManagementProps, Notification } from '../../types'

interface StaffMember {
  id: number;
  badge_number: string;
  full_name: string;
  rank: string;
  role: 'staff' | 'admin';
  phone: string;
  email: string;
  department: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
}

interface NewUserForm {
  badge_number: string;
  full_name: string;
  rank: string;
  role: 'staff' | 'admin';
  phone: string;
  email: string;
  department: string;
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null)
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })

  const [newUser, setNewUser] = useState<NewUserForm>({
    badge_number: '',
    full_name: '',
    rank: 'Constable',
    role: 'staff',
    phone: '',
    email: '',
    department: 'General'
  })

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const staffMembers: StaffMember[] = [
    {
      id: 1,
      badge_number: 'STAFF001',
      full_name: 'Officer K. Singh',
      rank: 'Constable',
      role: 'staff',
      phone: '+91-9876543210',
      email: 'k.singh@police.gov',
      department: 'Traffic',
      is_active: true,
      created_at: '2024-01-15',
      last_login: '2024-01-20 09:30'
    },
    {
      id: 2,
      badge_number: 'STAFF002',
      full_name: 'Officer A. Khan',
      rank: 'SI',
      role: 'staff',
      phone: '+91-9876543211',
      email: 'a.khan@police.gov',
      department: 'Investigation',
      is_active: true,
      created_at: '2024-01-10',
      last_login: '2024-01-20 08:45'
    },
    {
      id: 3,
      badge_number: 'STAFF003',
      full_name: 'Officer R. Verma',
      rank: 'Constable',
      role: 'staff',
      phone: '+91-9876543212',
      email: 'r.verma@police.gov',
      department: 'Patrol',
      is_active: false,
      created_at: '2024-01-05',
      last_login: '2024-01-18 17:20'
    },
    {
      id: 4,
      badge_number: 'ADMIN001',
      full_name: 'Inspector J. Sharma',
      rank: 'Inspector',
      role: 'admin',
      phone: '+91-9876543213',
      email: 'j.sharma@police.gov',
      department: 'Administration',
      is_active: true,
      created_at: '2024-01-01',
      last_login: '2024-01-20 10:15'
    }
  ]

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.badge_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || staff.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    
    // Validate required fields
    if (!newUser.badge_number || !newUser.full_name || !newUser.email) {
      showNotification('Please fill in all required fields!', 'error')
      return
    }

    // Check if badge number already exists
    const badgeExists = staffMembers.some(staff => staff.badge_number === newUser.badge_number)
    if (badgeExists) {
      showNotification('Badge number already exists!', 'error')
      return
    }

    // Here you would add to Supabase
    showNotification(`User ${newUser.full_name} added successfully!`, 'success')
    
    // Reset form and close modal
    setNewUser({
      badge_number: '',
      full_name: '',
      rank: 'Constable',
      role: 'staff',
      phone: '',
      email: '',
      department: 'General'
    })
    setShowAddModal(false)
  }

  const handleEditUser = (user: StaffMember): void => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: StaffMember): void => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      showNotification(`User ${user.full_name} deleted successfully!`, 'success')
      // Here you would delete from Supabase
    }
  }

  const handleToggleActive = (user: StaffMember): void => {
    const action = user.is_active ? 'deactivated' : 'activated'
    showNotification(`User ${user.full_name} ${action} successfully!`, 'info')
    // Here you would update in Supabase
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

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        User Management
      </h2>

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
                <th>Last Login</th>
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
                      {new Date(staff.last_login).toLocaleDateString()}<br />
                      {new Date(staff.last_login).toLocaleTimeString()}
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
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
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