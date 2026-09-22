import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, BookOpen, Clock, ExternalLink, Loader2, CheckCircle, Users, User as UserIcon, Edit, Eye } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Alert from '../components/Alert';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Student specific
  const [submitMsg, setSubmitMsg] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, assignmentId: null });
  const [animatingSubmission, setAnimatingSubmission] = useState(null);

  // Admin specific
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');
  const [submissionType, setSubmissionType] = useState('GROUP');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  
  const [viewSubmissionsModal, setViewSubmissionsModal] = useState({ isOpen: false, assignment: null, data: [] });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SUBMITTED, PENDING

  useEffect(() => {
    fetchCourseDetails();
    if (user?.role === 'STUDENT') {
      fetchStudentGroup();
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
      setAssignments(res.data.assignments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGroup = async () => {
    try {
      const res = await api.get('/groups/my-group');
      if (res.data) setGroup(res.data);
    } catch (err) {
      console.log('User has no group');
    }
  };

  const handleConfirmClick = (assignmentId) => {
    setConfirmModal({ isOpen: true, assignmentId });
  };

  const processSubmission = async () => {
    const { assignmentId } = confirmModal;
    if (!assignmentId) return;
    
    setConfirmModal({ isOpen: false, assignmentId: null });
    setAnimatingSubmission(assignmentId);
    
    try {
      await api.post(`/submissions/${assignmentId}/confirm`);
      // Simulate network delay for animation effect
      setTimeout(() => {
        setSubmitMsg(prev => ({ ...prev, [assignmentId]: true }));
        setAnimatingSubmission(null);
      }, 800);
    } catch (err) {
      setAnimatingSubmission(null);
      alert(err.response?.data?.error || 'Failed to confirm submission');
    }
  };

  const handleOpenAssignForm = (assign = null) => {
    if (assign) {
      setEditingAssignmentId(assign.id);
      setTitle(assign.title);
      setDescription(assign.description || '');
      setDueDate(assign.due_date.split('T')[0]);
      setOnedriveLink(assign.onedrive_link);
      setSubmissionType(assign.submission_type || 'GROUP');
    } else {
      setEditingAssignmentId(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setOnedriveLink('');
      setSubmissionType('GROUP');
    }
    setShowAssignForm(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setSubmittingAssign(true);
    try {
      const payload = {
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
        onedrive_link: onedriveLink,
        submission_type: submissionType,
        course_id: id
      };
      
      if (editingAssignmentId) {
        await api.put(`/assignments/${editingAssignmentId}`, payload);
      } else {
        await api.post('/assignments', payload);
      }
      
      setShowAssignForm(false);
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setViewSubmissionsModal({ isOpen: true, assignment, data: [] });
    setSubmissionsLoading(true);
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      setViewSubmissionsModal({ isOpen: true, assignment, data: res.data });
    } catch (err) {
      alert('Failed to load submissions');
      setViewSubmissionsModal({ isOpen: false, assignment: null, data: [] });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!course) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <button 
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-2 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="card space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{course.title}</h1>
        </div>
        <p className="text-text-muted">{course.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h2 className="text-xl font-bold text-text-primary">Assignments</h2>
          {user.role === 'ADMIN' && (
            <button onClick={() => handleOpenAssignForm()} className="btn-primary text-xs">
              {showAssignForm && !editingAssignmentId ? 'Cancel' : 'Post Assignment'}
            </button>
          )}
        </div>

        {showAssignForm && user.role === 'ADMIN' && (
          <div className="card space-y-4 mb-4 border border-accent/20">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-text-primary">{editingAssignmentId ? 'Edit Assignment' : 'New Assignment'}</h3>
              <button onClick={() => setShowAssignForm(false)} className="text-text-muted hover:text-text-primary text-xs font-medium">Cancel</button>
            </div>
            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="input-label">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field resize-none" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Submission Type</label>
                  <select 
                    value={submissionType} 
                    onChange={e => setSubmissionType(e.target.value)} 
                    className="input-field"
                    disabled={!!editingAssignmentId}
                  >
                    <option value="GROUP">Group</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">OneDrive Submission Link</label>
                <input type="url" value={onedriveLink} onChange={e => setOnedriveLink(e.target.value)} className="input-field" placeholder="https://onedrive.live.com/..." required />
              </div>
              <button type="submit" disabled={submittingAssign} className="btn-primary w-full mt-1">
                {submittingAssign ? 'Saving...' : 'Save Assignment'}
              </button>
            </form>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-muted">No assignments posted for this course.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(a => {
              const isSubmitted = !!submitMsg[a.id] || a.is_submitted;
              const isPast = new Date(a.due_date) < new Date();
              const isAnimating = animatingSubmission === a.id;
              const typeLabel = a.submission_type === 'INDIVIDUAL' ? 'Individual' : 'Group';
              
              let canSubmit = true;
              let submitTooltip = '';
              
              if (user.role === 'STUDENT') {
                if (a.submission_type === 'GROUP') {
                  if (!group) {
                    canSubmit = false;
                    submitTooltip = 'You must join a group first';
                  } else if (group.creator_id !== user.id) {
                    canSubmit = false;
                    submitTooltip = 'Only the Group Leader can submit';
                  }
                } else if (a.submission_type === 'INDIVIDUAL') {
                  // Any enrolled student can submit an individual assignment
                  canSubmit = true;
                }
              }

              return (
                <div key={a.id} className={`card-hover transition-all duration-500 ${isSubmitted ? 'border-success/40 bg-success/5' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-text-primary">{a.title}</h3>
                        
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.submission_type === 'INDIVIDUAL' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                          {a.submission_type === 'INDIVIDUAL' ? <UserIcon className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {typeLabel}
                        </span>

                        {user.role === 'STUDENT' && (
                          <>
                            {isSubmitted && <span className="badge-success">Submitted</span>}
                            {!isSubmitted && isPast && <span className="badge-danger">Overdue</span>}
                            {!isSubmitted && !isPast && <span className="badge-warning">Pending</span>}
                          </>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-sm text-text-muted mb-3 line-clamp-2">{a.description}</p>
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
                      
                      {user.role === 'STUDENT' && (
                        <div className="relative">
                          {!isSubmitted ? (
                            <button
                              onClick={() => handleConfirmClick(a.id)}
                              disabled={!canSubmit || isAnimating}
                              className={`text-xs w-full justify-center transition-all duration-300 ${!canSubmit ? 'btn-secondary opacity-60 cursor-not-allowed' : 'btn-success'}`}
                              title={submitTooltip}
                            >
                              {isAnimating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <><CheckCircle className="h-3.5 w-3.5" /> Confirm Submission</>
                              )}
                            </button>
                          ) : (
                            <button disabled className="btn-success text-xs w-full justify-center bg-success/20 text-success border-success/30 cursor-not-allowed">
                              <CheckCircle className="h-3.5 w-3.5" /> Done
                            </button>
                          )}
                          {!canSubmit && !isSubmitted && (
                            <p className="text-[10px] text-warning text-center mt-1 absolute -bottom-5 left-0 w-full whitespace-nowrap">
                              {submitTooltip}
                            </p>
                          )}
                        </div>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <button onClick={() => handleOpenAssignForm(a)} className="btn-secondary text-xs w-full justify-center">
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button onClick={() => handleViewSubmissions(a)} className="btn-success text-xs w-full justify-center">
                            <Eye className="h-3.5 w-3.5" /> Submissions
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {user.role === 'STUDENT' && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex justify-between items-center text-xs text-text-muted mb-1">
                        <span>Status</span>
                        <span className={isSubmitted ? 'text-success font-medium' : ''}>{isSubmitted ? '100% Complete' : 'Action Required'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${isSubmitted ? 'bg-success w-full' : 'bg-warning w-1/12'}`} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, assignmentId: null })}
        onConfirm={processSubmission}
        title="Confirm Submission"
        message="You are about to confirm that you have successfully uploaded the assignment to OneDrive. This action will notify the professor."
      />

      {/* Submissions Viewer Modal (Admin) */}
      {viewSubmissionsModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-bg-base border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-text-primary">Submissions Tracker</h3>
                <p className="text-sm text-text-muted">{viewSubmissionsModal.assignment?.title}</p>
              </div>
              <button onClick={() => setViewSubmissionsModal({ isOpen: false, assignment: null, data: [] })} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            
            <div className="p-4 bg-bg-elevated border-b border-border flex items-center gap-3">
              <span className="text-sm text-text-muted font-medium">Filter by Status:</span>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field py-1 text-sm bg-bg-base w-auto"
              >
                <option value="ALL">All Recorded</option>
                <option value="SUBMITTED">Submitted</option>
              </select>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {submissionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 text-accent animate-spin" />
                </div>
              ) : viewSubmissionsModal.data.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-text-muted">No submissions have been recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewSubmissionsModal.data
                    .filter(sub => statusFilter === 'ALL' || sub.status === statusFilter)
                    .map(sub => (
                    <div key={sub.submission_id} className="p-3 bg-bg-elevated border border-border rounded-lg flex justify-between items-center">
                      <div>
                        {sub.student_name ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-accent" />
                            <p className="font-semibold text-text-primary text-sm">{sub.student_name}</p>
                            <span className="text-xs text-text-muted">({sub.student_email})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-warning" />
                            <p className="font-semibold text-text-primary text-sm">{sub.group_name}</p>
                          </div>
                        )}
                        <p className="text-xs text-text-muted mt-1">Submitted at: {new Date(sub.submitted_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="badge-success text-xs">Submitted</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
