import React, { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import InputField from '../components/ui/InputField'

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'Jane Designer',
      email: 'jane@example.com',
      wallet: '0x742d35Cc6634C893292',
      role: 'Designer',
      defaultSplit: 40,
      joined: '2024-01-01'
    },
    {
      id: 2,
      name: 'Mike Developer',
      email: 'mike@example.com',
      wallet: '0x893292Cc6634C742d35',
      role: 'Developer',
      defaultSplit: 60,
      joined: '2024-01-01'
    }
  ])

  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    wallet: '',
    role: '',
    defaultSplit: ''
  })

  const addTeamMember = () => {
    if (!newMember.name || !newMember.email || !newMember.wallet) {
      alert('Please fill in all required fields')
      return
    }

    const member = {
      id: Date.now(),
      ...newMember,
      defaultSplit: parseFloat(newMember.defaultSplit) || 0,
      joined: new Date().toISOString().split('T')[0]
    }

    setTeamMembers(prev => [...prev, member])
    setNewMember({ name: '', email: '', wallet: '', role: '', defaultSplit: '' })
    setIsAddingMember(false)
  }

  const removeTeamMember = (id) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id))
  }

  const updateDefaultSplit = (id, split) => {
    setTeamMembers(prev => prev.map(member =>
      member.id === id ? { ...member, defaultSplit: parseFloat(split) } : member
    ))
  }

  const totalSplit = teamMembers.reduce((sum, member) => sum + member.defaultSplit, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Team Management
        </h1>
        <p className="text-gray-600">
          Manage your team members and their payment splits.
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {teamMembers.length}
            </div>
            <div className="text-sm font-medium text-secondary">
              Team Members
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-2">
              {totalSplit}%
            </div>
            <div className="text-sm font-medium text-secondary">
              Total Allocation
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-2">
              {teamMembers.filter(m => m.defaultSplit > 0).length}
            </div>
            <div className="text-sm font-medium text-secondary">
              Active Members
            </div>
          </div>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-secondary">
            Team Members
          </h2>
          <Button onClick={() => setIsAddingMember(true)}>
            + Add Member
          </Button>
        </div>

        {/* Add Member Form */}
        {isAddingMember && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-secondary mb-4">
              Add New Team Member
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InputField
                label="Full Name"
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
              <InputField
                label="Email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
              <InputField
                label="Wallet Address"
                value={newMember.wallet}
                onChange={(e) => setNewMember(prev => ({ ...prev, wallet: e.target.value }))}
                placeholder="0x..."
              />
              <InputField
                label="Role"
                value={newMember.role}
                onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Designer, Developer"
              />
              <InputField
                label="Default Split %"
                type="number"
                step="0.01"
                value={newMember.defaultSplit}
                onChange={(e) => setNewMember(prev => ({ ...prev, defaultSplit: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={addTeamMember}>
                Add Member
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingMember(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Member</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Wallet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Default Split</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-background">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-secondary">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-secondary">{member.role}</td>
                  <td className="py-3 px-4">
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      {member.wallet.slice(0, 8)}...{member.wallet.slice(-6)}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        value={member.defaultSplit}
                        onChange={(e) => updateDefaultSplit(member.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(member.joined).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="text-error hover:text-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Split Summary */}
        {teamMembers.length > 0 && (
          <div className="mt-6 p-4 bg-background rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-secondary">Total Allocation:</span>
              <span className={`font-semibold ${
                Math.abs(totalSplit - 100) < 0.01 ? 'text-success' : 'text-error'
              }`}>
                {totalSplit.toFixed(2)}%
                {Math.abs(totalSplit - 100) < 0.01 ? ' ✓' : ' (Should be 100%)'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Split Templates */}
      <Card>
        <h3 className="text-lg font-semibold text-secondary mb-4">
          Quick Split Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Equal Split', splits: Array(teamMembers.length).fill((100/teamMembers.length).toFixed(2)) },
            { name: 'Design Heavy', splits: [60, 40] },
            { name: 'Dev Heavy', splits: [40, 60] }
          ].map((template, index) => (
            <button
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-background transition-colors text-left"
            >
              <div className="font-medium text-secondary mb-2">{template.name}</div>
              <div className="text-sm text-gray-500">
                {template.splits.slice(0, 3).map((split, i) => (
                  <span key={i} className="mr-2">
                    {split}%
                  </span>
                ))}
                {template.splits.length > 3 && '...'}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default TeamManagement