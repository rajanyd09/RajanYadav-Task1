import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, Users, Plus, Loader2, ArrowRight, UserPlus, LogOut, UserMinus } from 'lucide-react';
import Alert from '../components/Alert';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Group state
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrolledRes, allRes, groupRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/all'),
        api.get('/groups/my-group').catch(() => ({ data: null }))
      ]);
      setEnrolledCourses(enrolledRes.data);
      setAllCourses(allRes.data);
      if (groupRes.data) setGroup(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${group.id}/members`, { email: newMemberEmail });
      setNewMemberEmail('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
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
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  // Find courses not yet enrolled in
  const availableCourses = allCourses.filter(ac => !enrolledCourses.find(ec => ec.id === ac.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Student Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome back, <span className="text-text-secondary font-medium">{user?.name}</span>
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-semibold text-text-primary">Enrolled Courses</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 text-accent animate-spin" />
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-text-muted">You are not enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enrolledCourses.map(course => (
                <div 
                  key={course.id} 
                  className="card-hover cursor-pointer flex flex-col"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary mb-1">{course.title}</h3>
                    <p className="text-text-muted text-xs line-clamp-2">{course.description}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-accent text-xs font-medium">
                    View Assignments <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-1 mt-8">
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-success" />
            </div>
            <h2 className="font-semibold text-text-primary">Available Courses</h2>
          </div>
          
          {availableCourses.length === 0 && !loading ? (
            <div className="card text-center py-6">
              <p className="text-text-muted text-sm">No new courses available to enroll.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableCourses.map(course => (
                <div key={course.id} className="card flex flex-col justify-between">
                  <div className="mb-3">
                    <h3 className="font-bold text-text-primary mb-1">{course.title}</h3>
                    <p className="text-text-muted text-xs line-clamp-2">{course.description}</p>
                  </div>
                  <button 
                    onClick={() => handleEnroll(course.id)} 
                    className="btn-primary text-xs py-1.5 w-full"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Panel */}
        <div className="lg:col-span-1">
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
                  <p className="text-text-muted text-sm">You're not in a group yet.</p>
                  <p className="text-text-muted text-xs">A group is required to submit assignments.</p>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="input-field text-sm py-2"
                    placeholder="Group name…"
                    required
                  />
                  <button type="submit" className="btn-primary w-full py-2">
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
                        <li key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-bg-elevated border border-border/50">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                            <span className="text-accent text-[10px] font-bold">{m.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-text-primary truncate">
                              {m.name} {isCreator && <span className="text-[9px] bg-accent/20 text-accent px-1 py-0.5 rounded ml-1">Creator</span>}
                            </p>
                          </div>
                          {canRemove && !isCreator && (
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shrink-0"
                              title="Remove member"
                            >
                              <UserMinus className="h-3 w-3" />
                            </button>
                          )}
                          {user.id === m.id && !isCreator && (
                            <button 
                              onClick={() => handleRemoveMember(m.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shrink-0"
                              title="Leave group"
                            >
                              <LogOut className="h-3 w-3" />
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
                    className="input-field text-sm py-2"
                    placeholder="student@example.com"
                    required
                  />
                  <button type="submit" className="btn-secondary w-full py-2">
                    <UserPlus className="h-4 w-4" /> Add Member
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
