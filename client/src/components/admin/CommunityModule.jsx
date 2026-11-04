import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareWarning, Megaphone, Plus, Search, RefreshCw, Edit3, Eye,
  MapPin, Calendar, Ban, X
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AdminPageHeader, StatusBadge, LoadingState, EmptyState, formatISTDate,
  COIMBATORE_WARDS
} from './AdminSharedUI';

const COMPLAINT_CATEGORIES = [
  'Overflowing Public Bins',
  'Missed Garbage Collection',
  'Illegal Dumping',
  'Waste Left in Public Spaces',
  'Damaged Waste Collection Infrastructure',
  'Uncollected Hazardous Waste',
  'Other Sanitation Issues'
];

const COMPLAINT_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const COMPLAINT_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const CAMPAIGN_TYPES = [
  'Awareness Drive',
  'Clean-up Event',
  'E-Waste Collection Drive',
  'Plastic-Free Campaign',
  'Composting Workshop',
  'School Programme',
  'Special Collection Notice',
  'Service Announcement'
];

const CAMPAIGN_STATUSES = ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'];

export default function CommunityModule({ initialTab = 'complaints', toast }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Data state
  const [complaints, setComplaints] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Complaint Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintUpdateForm, setComplaintUpdateForm] = useState({
    status: 'Under Review',
    priority: 'Normal',
    assignedWorkerId: '',
    assignedDepartment: 'Solid Waste Management',
    internalNote: '',
    resolutionNotes: ''
  });
  const [newComplaintModal, setNewComplaintModal] = useState(false);
  const [newComplaintForm, setNewComplaintForm] = useState({
    title: '',
    category: 'Overflowing Public Bins',
    description: '',
    ward: 'Ward 24 - RS Puram',
    locality: 'RS Puram',
    address: 'DB Road, RS Puram, Coimbatore',
    priority: 'Medium'
  });

  // Campaign Modal
  const [campaignModal, setCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    campaignType: 'Awareness Drive',
    description: '',
    ward: 'All Wards',
    locality: 'Coimbatore',
    venue: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    targetAudience: 'All Citizens',
    organizer: 'Coimbatore City Municipal Corporation',
    contactPhone: '+91 422 239 0261',
    status: 'Published',
    isPublished: true
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintsRes, campaignsRes, workersRes] = await Promise.all([
        api.getComplaints(),
        api.getCampaigns(),
        api.getWorkers()
      ]);
      setComplaints(Array.isArray(complaintsRes) ? complaintsRes : complaintsRes?.complaints || []);
      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : campaignsRes?.campaigns || []);
      setWorkers(Array.isArray(workersRes) ? workersRes : workersRes?.workers || []);
    } catch (err) {
      toast?.error(err.message || 'Failed to load community records');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open complaint review modal
  const openComplaintReview = (c) => {
    setSelectedComplaint(c);
    setComplaintUpdateForm({
      status: c.status || 'Under Review',
      priority: c.priority || 'Normal',
      assignedWorkerId: c.assignedWorkerId?._id || c.assignedWorkerId || '',
      assignedDepartment: c.assignedDepartment || 'Solid Waste Management',
      internalNote: '',
      resolutionNotes: c.resolutionNotes || ''
    });
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      await api.updateComplaint(selectedComplaint._id, complaintUpdateForm);
      toast?.success('Complaint record updated and logged');
      setSelectedComplaint(null);
      loadData();
    } catch (err) {
      toast?.error(err.message || 'Failed to update complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createComplaint(newComplaintForm);
      toast?.success('Civic complaint logged successfully');
      setNewComplaintModal(false);
      setNewComplaintForm({
        title: '',
        category: 'Overflowing Bin',
        description: '',
        ward: 'Ward 24 - RS Puram',
        locality: 'RS Puram',
        address: '',
        priority: 'Normal'
      });
      loadData();
    } catch (err) {
      toast?.error(err.message || 'Failed to create complaint');
    } finally {
      setSubmitting(false);
    }
  };

  // Campaign handlers
  const openCampaignModal = (camp = null) => {
    if (camp) {
      setEditingCampaign(camp);
      setCampaignForm({
        title: camp.title || '',
        campaignType: camp.campaignType || 'Awareness Drive',
        description: camp.description || '',
        ward: camp.ward || 'All Wards',
        locality: camp.locality || 'Coimbatore',
        venue: camp.venue || '',
        startDate: camp.startDate ? new Date(camp.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        endDate: camp.endDate ? new Date(camp.endDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        startTime: camp.startTime || '09:00 AM',
        endTime: camp.endTime || '01:00 PM',
        targetAudience: camp.targetAudience || 'All Citizens',
        organizer: camp.organizer || 'Coimbatore City Municipal Corporation',
        contactPhone: camp.contactPhone || '+91 422 239 0261',
        status: camp.status || 'Published',
        isPublished: camp.isPublished !== false
      });
    } else {
      setEditingCampaign(null);
      setCampaignForm({
        title: '',
        campaignType: 'Awareness Drive',
        description: '',
        ward: 'All Wards',
        locality: 'Coimbatore',
        venue: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        targetAudience: 'All Citizens',
        organizer: 'Coimbatore City Municipal Corporation',
        contactPhone: '+91 422 239 0261',
        status: 'Published',
        isPublished: true
      });
    }
    setCampaignModal(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...campaignForm,
        isPublished: campaignForm.status === 'Published' || campaignForm.status === 'Ongoing'
      };
      if (editingCampaign) {
        await api.updateCampaign(editingCampaign._id, payload);
        toast?.success('Campaign updated successfully');
      } else {
        await api.createCampaign(payload);
        toast?.success('Campaign created and published');
      }
      setCampaignModal(false);
      loadData();
    } catch (err) {
      toast?.error(err.message || 'Failed to save campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelCampaign = async (camp) => {
    try {
      await api.cancelCampaign(camp._id);
      toast?.success('Campaign cancelled');
      loadData();
    } catch (err) {
      toast?.error(err.message || 'Failed to cancel campaign');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (wardFilter && c.ward !== wardFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (priorityFilter && c.priority !== priorityFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.locality?.toLowerCase().includes(q) ||
        c.citizenName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCampaigns = campaigns.filter((c) => {
    if (wardFilter && c.ward !== wardFilter && c.ward !== 'All Wards') return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.campaignType?.toLowerCase().includes(q) ||
        c.locality?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          activeSubTab === 'campaigns'
            ? 'Community Campaigns & Public Announcements'
            : 'Civic Complaints & Issue Resolution'
        }
        subtitle={
          activeSubTab === 'campaigns'
            ? 'Publish Coimbatore clean-up drives, e-waste collection camps, composting workshops, and ward service notices.'
            : 'Track, assign, and resolve public sanitation complaints (overflowing bins, missed street sweeps, illegal dumping).'
        }
        actions={
          <>
            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {activeSubTab === 'complaints' ? (
              <button
                onClick={() => setNewComplaintModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} /> Log Civic Issue
              </button>
            ) : (
              <button
                onClick={() => openCampaignModal()}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} /> Create Campaign / Notice
              </button>
            )}
          </>
        }
      />

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('complaints'); setStatusFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'complaints' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquareWarning size={15} /> Complaints & Issues ({complaints.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('campaigns'); setStatusFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'campaigns' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone size={15} /> Campaigns & Announcements ({campaigns.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeSubTab === 'complaints'
                ? 'Search by complaint title, citizen, locality...'
                : 'Search campaigns by title, type, locality...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
        >
          <option value="">All Wards</option>
          {COIMBATORE_WARDS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        {activeSubTab === 'complaints' ? (
          <>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
            >
              <option value="">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
            >
              <option value="">All Priorities</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
            >
              <option value="">All Statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        ) : (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
          >
            <option value="">All Campaign Statuses</option>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading community data..." />
      ) : activeSubTab === 'complaints' ? (
        /* COMPLAINTS VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon={MessageSquareWarning}
              title="No civic complaints matching criteria"
              description="Citizens or administrators can log street sanitation issues for rapid municipal action."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Issue & Category</th>
                    <th className="py-3.5 px-4">Ward & Location</th>
                    <th className="py-3.5 px-4">Reported By</th>
                    <th className="py-3.5 px-4">Priority & Status</th>
                    <th className="py-3.5 px-4">Assigned To</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredComplaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.title}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {c.category}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 max-w-xs">{c.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{c.ward}</div>
                        <div className="text-[11px] text-slate-500">{c.locality}</div>
                        {c.address && <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{c.address}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.citizenName || c.citizenId?.name || 'Citizen'}</div>
                        <div className="text-[11px] text-slate-400">{formatISTDate(c.createdAt, true)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={c.priority || 'Normal'} />
                          <StatusBadge status={c.status || 'Submitted'} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.assignedWorkerName || c.assignedWorkerId?.name ? (
                          <div>
                            <div className="font-semibold text-slate-800">{c.assignedWorkerName || c.assignedWorkerId?.name}</div>
                            <div className="text-[11px] text-slate-500">{c.assignedDepartment}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openComplaintReview(c)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CAMPAIGNS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200/80">
              <EmptyState
                icon={Megaphone}
                title="No campaigns or public announcements found"
                description="Create a municipal awareness drive, e-waste camp, or service announcement for Coimbatore residents."
                action={
                  <button
                    onClick={() => openCampaignModal()}
                    className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                  >
                    Create First Campaign
                  </button>
                }
              />
            </div>
          ) : (
            filteredCampaigns.map((camp) => (
              <div
                key={camp._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {camp.campaignType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={camp.status} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{camp.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin size={13} className="text-emerald-700" /> {camp.ward} ({camp.locality || 'Coimbatore'})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-emerald-700" /> {formatISTDate(camp.startDate)} – {formatISTDate(camp.endDate)}
                    </span>
                  </div>
                  {camp.venue && (
                    <div className="text-[11px] text-slate-500">
                      <strong>Venue:</strong> {camp.venue} • {camp.startTime} - {camp.endTime}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">Audience: {camp.targetAudience}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCampaignModal(camp)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      {camp.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelCampaign(camp)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1"
                        >
                          <Ban size={12} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review & Update Complaint Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review & Resolve Civic Issue</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.ward} • {selectedComplaint.category}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="font-bold text-slate-900">{selectedComplaint.title}</div>
              <p className="text-slate-600">{selectedComplaint.description}</p>
              <div className="text-[11px] text-slate-500 pt-1">
                Location: {selectedComplaint.address || selectedComplaint.locality} • Reported by {selectedComplaint.citizenName || 'Citizen'}
              </div>
            </div>

            <form onSubmit={handleUpdateComplaint} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lifecycle Status *</label>
                  <select
                    value={complaintUpdateForm.status}
                    onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COMPLAINT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={complaintUpdateForm.priority}
                    onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Field Worker</label>
                  <select
                    value={complaintUpdateForm.assignedWorkerId}
                    onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, assignedWorkerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Unassigned --</option>
                    {workers.filter((w) => w.isActive !== false).map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.assignedWard || 'All Wards'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={complaintUpdateForm.assignedDepartment}
                    onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, assignedDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Summary (Visible to Citizen)</label>
                <textarea
                  rows={2}
                  value={complaintUpdateForm.resolutionNotes}
                  onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, resolutionNotes: e.target.value })}
                  placeholder="Describe action taken (e.g. Bin cleared and disinfected by morning squad)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Add Internal Admin Note</label>
                <input
                  type="text"
                  value={complaintUpdateForm.internalNote}
                  onChange={(e) => setComplaintUpdateForm({ ...complaintUpdateForm, internalNote: e.target.value })}
                  placeholder="Optional internal audit note..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {selectedComplaint.internalNotes?.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-700 text-[11px]">Internal Notes History:</div>
                  {selectedComplaint.internalNotes.map((n, i) => (
                    <div key={i} className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">{n.authorName || 'Admin'}:</span> {n.note}{' '}
                      <span className="text-slate-400">({formatISTDate(n.createdAt, true)})</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Resolution Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log New Complaint Modal */}
      {newComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Municipal Sanitation Issue</h3>
              <button onClick={() => setNewComplaintModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={newComplaintForm.title}
                  onChange={(e) => setNewComplaintForm({ ...newComplaintForm, title: e.target.value })}
                  placeholder="e.g. Overflowing community bin near DB Road junction"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newComplaintForm.category}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority *</label>
                  <select
                    value={newComplaintForm.priority}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ward *</label>
                  <select
                    value={newComplaintForm.ward}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COIMBATORE_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality *</label>
                  <input
                    type="text"
                    required
                    value={newComplaintForm.locality}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newComplaintForm.description}
                  onChange={(e) => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                  placeholder="Provide street details and severity..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewComplaintModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900"
                >
                  {submitting ? 'Logging...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Create/Edit Modal */}
      {campaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCampaign ? 'Edit Campaign / Announcement' : 'Create Public Campaign / Notice'}
              </h3>
              <button onClick={() => setCampaignModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCampaign} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    placeholder="e.g. RS Puram Zero-Plastic Sunday Drive"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campaign Type *</label>
                  <select
                    value={campaignForm.campaignType}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaignType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Details / Instructions *</label>
                <textarea
                  rows={3}
                  required
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Describe participation instructions, items accepted, and citizen guidelines..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Ward</label>
                  <select
                    value={campaignForm.ward}
                    onChange={(e) => setCampaignForm({ ...campaignForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="All Wards">All Wards (City-Wide)</option>
                    {COIMBATORE_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality</label>
                  <input
                    type="text"
                    value={campaignForm.locality}
                    onChange={(e) => setCampaignForm({ ...campaignForm, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status *</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {CAMPAIGN_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={campaignForm.startTime}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={campaignForm.endTime}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue / Meeting Point</label>
                  <input
                    type="text"
                    value={campaignForm.venue}
                    onChange={(e) => setCampaignForm({ ...campaignForm, venue: e.target.value })}
                    placeholder="e.g. VOC Park Grounds / Ward Office"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={campaignForm.targetAudience}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetAudience: e.target.value })}
                    placeholder="All Citizens / RWA Associations / Schools"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCampaignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900"
                >
                  {submitting ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Publish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
