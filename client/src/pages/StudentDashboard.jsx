import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import {
  Users, BookOpen, CheckCircle, Plus, LogOut, UserPlus,
  Clock, ExternalLink, AlertCircle, Inbox, Activity, UserMinus, Loader2
} from 'lucide-react';

// Stat pill 
function StatPill({ label, value, color = 'accent' }) {
  const colors = {
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
  };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${colors[color]}`}>
      <span className="text-text-muted text-xs">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// Main Component 
export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, assignmentId: null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupRes, assignRes] = await Promise.all([
        api.get('/groups/my-group').catch(() => ({ data: null })),
        api.get('/assignments'),
      ]);
      if (groupRes.data) setGroup(groupRes.data);
      setAssignments(assignRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${group.id}/members`, { email: newMemberEmail });
      setNewMemberEmail('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/groups/${group.id}/members/${memberId}`);
      if (memberId === user.id) {
        setGroup(null);
      } else {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleConfirmClick = (assignmentId) => {
    setConfirmModal({ isOpen: true, assignmentId });
  };

  const processSubmission = async () => {
    const { assignmentId } = confirmModal;
    if (!assignmentId) return;
    
    try {
      await api.post(`/submissions/${assignmentId}/confirm`);
      setSubmitMsg(prev => ({ ...prev, [assignmentId]: true }));
      setConfirmModal({ isOpen: false, assignmentId: null });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm submission');
      setConfirmModal({ isOpen: false, assignmentId: null });
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const totalAssignments = assignments.length;
  const submittedCount = Object.values(submitMsg).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Student Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome back, <span className="text-text-secondary font-medium">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatPill label="Assignments" value={totalAssignments} color="accent" />
          {group && <StatPill label="Submitted" value={submittedCount} color="success" />}
          
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Group Panel */}
        <div className="md:col-span-1">
          <div className="card h-full space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <h2 className="font-semibold text-text-primary">My Group</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 text-accent animate-spin" />
              </div>
            ) : !group ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center py-4 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
                    <Users className="h-5 w-5 text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">You're not in a group yet</p>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="input-field"
                    placeholder="Group name…"
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    <Plus className="h-4 w-4" /> Create Group
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-bg-elevated rounded-xl border border-border">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Group</p>
                  <p className="font-semibold text-text-primary">{group.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Members</p>
                  <ul className="space-y-1.5">
                    {group.members?.map(m => {
                      const canRemove = user.id === group.creator_id || user.id === m.id;
                      const isCreator = m.id === group.creator_id;
                      
                      return (
                        <li key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-elevated border border-border/50">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                            <span className="text-accent text-[10px] font-bold">{m.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {m.name} {isCreator && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1">Creator</span>}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">{m.email}</p>
                          </div>
                          {canRemove && !isCreator && (
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shrink-0"
                              title="Remove member"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                          {user.id === m.id && !isCreator && (
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shrink-0"
                              title="Leave group"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <form onSubmit={handleAddMember} className="space-y-2 pt-1">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Invite Member</p>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    className="input-field"
                    placeholder="student@example.com"
                    required
                  />
                  <button type="submit" className="btn-secondary w-full">
                    <UserPlus className="h-4 w-4" /> Add Member
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-semibold text-text-primary">Assignments</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 text-accent animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
                <Inbox className="h-6 w-6 text-text-muted" />
              </div>
              <div>
                <p className="font-medium text-text-secondary">No assignments yet</p>
                <p className="text-text-muted text-sm">Your professor hasn't posted any assignments.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => {
                const isSubmitted = !!submitMsg[a.id];
                const isPast = new Date(a.due_date) < new Date();
                return (
                  <div key={a.id} className="card-hover">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-semibold text-text-primary">{a.title}</h3>
                          {isSubmitted && <span className="badge-success">Submitted</span>}
                          {!isSubmitted && isPast && <span className="badge-danger">Overdue</span>}
                          {!isSubmitted && !isPast && <span className="badge-warning">Pending</span>}
                        </div>
                        {a.description && (
                          <p className="text-sm text-text-muted mb-2 line-clamp-2">{a.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <a
                          href={a.onedrive_link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary text-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> OneDrive
                        </a>
                        {!isSubmitted ? (
                          <button
                            onClick={() => handleConfirmClick(a.id)}
                            className="btn-success text-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Confirm
                          </button>
                        ) : (
                          <button disabled className="btn-success text-xs opacity-60 cursor-not-allowed">
                            <CheckCircle className="h-3.5 w-3.5" /> Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, assignmentId: null })}
        onConfirm={processSubmission}
        title="Confirm Submission"
        message="You are about to confirm that your group has successfully uploaded the assignment to OneDrive. This action will notify the professor."
      />
    </div>
  );
}
