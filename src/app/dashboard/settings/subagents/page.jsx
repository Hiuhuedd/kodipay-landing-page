'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Mail, 
  Phone, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  Plus,
  X,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { 
  getSubagents, 
  createSubagent, 
  getProperties, 
  assignProperty, 
  unassignProperty 
} from '@/lib/api';

export default function SubagentsPage() {
  const [subagents, setSubagents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Form states
  const [newAgent, setNewAgent] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, propsRes] = await Promise.all([
        getSubagents(),
        getProperties()
      ]);
      setSubagents(agentsRes.data || []);
      setProperties(propsRes || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await createSubagent(newAgent);
      if (res.success) {
        setSubagents([...subagents, res.data]);
        setNewAgent({ name: '', email: '', phone: '' });
        setShowAddModal(false);
        setSuccess('Subagent invited successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Error creating subagent');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProperty = async (agent, propertyId) => {
    const isAssigned = agent.assignedProperties?.includes(propertyId);
    try {
      if (isAssigned) {
        await unassignProperty(agent.uid, propertyId);
        setSubagents(subagents.map(a => 
          a.uid === agent.uid 
          ? { ...a, assignedProperties: a.assignedProperties.filter(id => id !== propertyId) } 
          : a
        ));
      } else {
        await assignProperty(agent.uid, propertyId);
        setSubagents(subagents.map(a => 
          a.uid === agent.uid 
          ? { ...a, assignedProperties: [...(a.assignedProperties || []), propertyId] } 
          : a
        ));
      }
    } catch (err) {
      setError('Failed to update assignment');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Subagents</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your team and property assignments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Add Subagent
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm font-medium animate-in slide-in-from-top-2">
          {success}
        </div>
      )}

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-neutral-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : subagents.length === 0 ? (
        <div className="bg-neutral-50 border-2 border-dashed border-neutral-100 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="w-8 h-8 text-neutral-200" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No subagents yet</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">Add your team members to help you manage your properties more efficiently.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
          >
            Create your first subagent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subagents.map(agent => (
            <div key={agent.uid} className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <Shield className="w-6 h-6 text-neutral-400 group-hover:text-indigo-600" />
                </div>
                <button className="text-neutral-300 hover:text-neutral-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-4">
                <h3 className="font-bold text-neutral-900">{agent.name}</h3>
                <div className="space-y-1 mt-2">
                  {agent.email && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Mail className="w-3 h-3" /> {agent.email}
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Phone className="w-3 h-3" /> {agent.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Assigned</span>
                  <span className="text-sm font-bold text-indigo-600">{agent.assignedProperties?.length || 0} Properties</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAgent(agent);
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 bg-neutral-50 text-neutral-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">New Subagent</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Full Name</label>
                <input
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium"
                  value={newAgent.email}
                  onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Phone Number (Optional)</label>
                <input
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium"
                  value={newAgent.phone}
                  onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Invite Subagent'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">Assign Properties</h2>
                <p className="text-xs text-neutral-500">To {selectedAgent.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-neutral-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="mt-8 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {properties.length === 0 ? (
                <p className="text-center py-8 text-neutral-400 text-sm">No properties available to assign.</p>
              ) : (
                properties.map(property => {
                  const isAssigned = selectedAgent.assignedProperties?.includes(property.propertyId);
                  return (
                    <div 
                      key={property.propertyId} 
                      onClick={() => handleToggleProperty(selectedAgent, property.propertyId)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isAssigned 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-neutral-50 bg-neutral-50 hover:border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-400'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-900">{property.propertyName}</p>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{property.propertyLocation}</p>
                        </div>
                      </div>
                      {isAssigned ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-neutral-300" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={() => setShowAssignModal(false)}
              className="w-full mt-8 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
