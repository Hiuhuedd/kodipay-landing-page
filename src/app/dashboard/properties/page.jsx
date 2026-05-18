'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Users, Home, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { getProperties, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, EmptyState } from '@/components/ui';

export default function PropertiesPage() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProperties = useCallback(() => {
        getProperties()
            .then(d => setProperties(d?.data || d || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    if (loading) return <LoadingPage />;

    const totalUnits = properties.reduce((s, p) => s + (p.propertyUnitsTotal || 0), 0);
    const totalOccupied = properties.reduce((s, p) => s + (p.propertyOccupiedUnits || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header & Portfolio KPIs ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Portfolio Overview</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">{properties.length} Active Properties</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard/properties/new" className="bg-[#007AFF] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Plus size={14} /> Add Property
                    </Link>
                </div>
            </div>

            {/* Summary KPIs */}
            {properties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F0F6FF] flex items-center justify-center text-[#007AFF]">
                                <Building2 size={16} />
                            </div>
                            <span className="text-xs font-medium text-[#64748B] uppercase tracking-widest">Total Properties</span>
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">{properties.length}</h3>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
                                <Home size={16} />
                            </div>
                            <span className="text-xs font-medium text-[#64748B] uppercase tracking-widest">Total Units</span>
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">{totalUnits}</h3>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                                <Users size={16} />
                            </div>
                            <span className="text-xs font-medium text-[#64748B] uppercase tracking-widest">Total Tenants</span>
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#16A34A]">{totalOccupied}</h3>
                    </div>
                </div>
            )}

            {/* Properties Table */}
            {properties.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col items-center justify-center py-16 shadow-sm">
                    <EmptyState icon="🏢" title="No properties yet" desc="Add your first property to start managing your portfolio." />
                </div>
            ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em]">Property</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em]">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] text-center">Total Units</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] text-center">Occupied</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] text-center">Vacant</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {properties.map(p => {
                                    const occupied = p.propertyOccupiedUnits || 0;
                                    const total = p.propertyUnitsTotal || 0;
                                    const vacant = p.propertyVacantUnits || (total - occupied);

                                    return (
                                        <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] group-hover:bg-[#E0E7FF] group-hover:text-[#007AFF] transition-colors">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[#0F172A] leading-none">{p.propertyName}</p>
                                                        <p className="text-[10px] text-[#94A3B8] mt-1 uppercase tracking-widest font-medium">ID: {p.id.slice(-6).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-[#64748B]">
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-[#94A3B8]" />
                                                    {p.location || p.address || 'Not specified'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[13px] font-bold text-[#0F172A]">{total}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[13px] font-bold text-[#16A34A]">{occupied}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[13px] font-bold ${vacant > 0 ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>{vacant}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/dashboard/properties/${p.id}`}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B] hover:text-[#007AFF] uppercase tracking-widest transition-colors"
                                                >
                                                    Manage <ArrowRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
