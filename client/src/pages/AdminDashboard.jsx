import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  BookOpen, Activity, Plus, LogOut, Clock, ExternalLink,
  CheckCircle, Users, BarChart2, Inbox, AlertCircle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

// Stat Card 
function StatCard({ label, value, icon: Icon, accent }) {
  const colors = {
    accent: 'text-accent bg-accent/10 border-accent/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-text-muted text-xs">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedSub, setExpandedSub] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes, groupRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/submissions'),
        api.get('/groups'),
      ]);
      setAssignments(assignRes.data);
      setSubmissions(subRes.data);
      setGroups(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
        onedrive_link: onedriveLink,
      });
      setTitle(''); setDescription(''); setDueDate(''); setOnedriveLink('');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const submittedCount = submissions.length;
  const pendingCount = assignments.length > 0
    ? (assignments.length * Math.max(1, [...new Set(submissions.map(s => s.group_id))].length)) - submittedCount
    : 0;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Professor Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Signed in as <span className="text-text-secondary font-medium">{user?.name}</span>
          </p>
        </div>
        
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Assignments" value={assignments.length} icon={BookOpen} accent="accent" />
        <StatCard label="Submissions Received" value={submittedCount} icon={CheckCircle} accent="success" />
        <StatCard label="Pending Confirmations" value={Math.max(0, pendingCount)} icon={Clock} accent="warning" />
      </div>

      {/* ── Create + Assignment List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Create Assignment Form */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-semibold text-text-primary">Post New Assignment</h2>
          </div>

          {formError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateAssignment} className="space-y-3">
            <div>
              <label className="input-label">Title</label>
              <input
                id="assignment-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. Project Report"
                required
              />
            </div>
            <div>
              <label className="input-label">Description <span className="text-text-muted">(optional)</span></label>
              <textarea
                id="assignment-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input-field resize-none"
                rows="3"
                placeholder="Assignment details…"
              />
            </div>
            <div>
              <label className="input-label">Due Date</label>
              <input
                id="assignment-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">OneDrive Submission Link</label>
              <input
                id="assignment-link"
                type="url"
                value={onedriveLink}
                onChange={e => setOnedriveLink(e.target.value)}
                className="input-field"
                placeholder="https://onedrive.live.com/…"
                required
              />
            </div>
            <button
              id="assignment-submit"
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-1"
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Plus className="h-4 w-4" /> Create Assignment</>
              }
            </button>
          </form>
        </div>

        {/* Assignments List */}
        <div className="card space-y-3 max-h-[560px] overflow-y-auto scrollbar-dark">
          <div className="flex items-center gap-2 mb-1 sticky top-0 bg-bg-card pb-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-semibold text-text-primary">Current Assignments</h2>
            <span className="badge-muted ml-auto">{assignments.length}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 text-accent animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Inbox className="h-8 w-8 text-text-muted" />
              <p className="text-text-muted text-sm">No assignments posted yet</p>
            </div>
          ) : (
            assignments.map(a => {
              const isPast = new Date(a.due_date) < new Date();
              return (
                <div key={a.id} className="p-4 rounded-xl border border-border bg-bg-elevated hover:border-border/80 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-text-primary text-sm">{a.title}</h3>
                    {isPast
                      ? <span className="badge-danger shrink-0 text-[10px]">Overdue</span>
                      : <span className="badge-success shrink-0 text-[10px]">Active</span>
                    }
                  </div>
                  {a.description && <p className="text-xs text-text-muted line-clamp-2">{a.description}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <a
                      href={a.onedrive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-accent hover:text-accent-hover text-xs transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> OneDrive
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Submission Tracking Table ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <h2 className="font-semibold text-text-primary">Submission Tracking</h2>
          <span className="badge-muted ml-auto">{submissions.length} submissions</span>
        </div>

        <div className="overflow-x-auto scrollbar-dark rounded-xl">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Group</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Assignment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center">
                    <Loader2 className="h-6 w-6 text-accent animate-spin mx-auto" />
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-6 w-6 text-text-muted" />
                      <p className="text-text-muted text-sm">No submissions yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map(sub => {
                  const isExpanded = expandedSub === sub.submission_id;
                  const groupInfo = groups.find(g => g.id === sub.group_id);
                  
                  return (
                    <React.Fragment key={sub.submission_id}>
                      <tr 
                        className="hover:bg-bg-elevated/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedSub(isExpanded ? null : sub.submission_id)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                              <span className="text-accent text-[10px] font-bold">{sub.group_name?.[0]?.toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-text-primary">{sub.group_name}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-text-muted ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-text-muted ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-text-secondary">{sub.assignment_title}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="badge-success">
                            <CheckCircle className="h-3 w-3" /> {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-text-muted">
                            {new Date(sub.submitted_at).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && groupInfo && (
                        <tr className="bg-bg-elevated/30">
                          <td colSpan="4" className="px-4 py-3 border-t border-border/50">
                            <div className="pl-8">
                              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Group Members</p>
                              <div className="flex flex-wrap gap-2">
                                {groupInfo.members && groupInfo.members.length > 0 ? (
                                  groupInfo.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-2.5 py-1.5">
                                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                        <span className="text-accent text-[9px] font-bold">{member.name?.[0]?.toUpperCase()}</span>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-text-primary">{member.name}</p>
                                        <p className="text-[10px] text-text-muted">{member.email}</p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-text-muted">No members found</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
