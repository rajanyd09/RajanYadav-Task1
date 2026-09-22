import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, Plus, Loader2, Users, Activity, FileText, CheckCircle, ChevronRight, User as UserIcon } from 'lucide-react';
import Alert from '../components/Alert';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection and details state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Course creation form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseSubmissions = async (courseId) => {
    setSubmissionsLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/all-submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    fetchCourseSubmissions(course.id);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/courses', { title, description });
      setTitle(''); setDescription(''); setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 sm:-mx-8">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-bg-base flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-border space-y-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Professor Dashboard</h1>
            <p className="text-text-muted text-xs mt-0.5">
              Signed in as <span className="text-text-secondary font-medium">{user?.name}</span>
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full justify-center py-2">
            <Plus className="h-4 w-4" /> {showForm ? 'Cancel Creation' : 'New Course'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-text-muted text-sm text-center mt-6">No courses created yet.</p>
          ) : (
            courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between group ${
                  selectedCourse?.id === course.id 
                    ? 'bg-accent/10 border border-accent/20' 
                    : 'bg-bg-elevated border border-transparent hover:border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md ${selectedCourse?.id === course.id ? 'bg-accent/20' : 'bg-border/50'}`}>
                    <BookOpen className={`h-4 w-4 ${selectedCourse?.id === course.id ? 'text-accent' : 'text-text-muted'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${selectedCourse?.id === course.id ? 'text-accent' : 'text-text-primary'}`}>
                      {course.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">{course.student_count || 0} Students</p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${selectedCourse?.id === course.id ? 'text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-bg-base overflow-y-auto p-6 md:p-8">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {showForm && (
          <div className="card max-w-xl mb-6">
            <h2 className="font-semibold text-text-primary mb-4">New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="input-label">Course Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="e.g. Advanced Data Structures" required />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field resize-none" rows="3" placeholder="Course overview..." />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        {!selectedCourse ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Select a Course</h2>
            <p className="text-text-muted text-sm">Choose a course from the sidebar to view its details, assignments, and submissions.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Course Header */}
            <div className="card flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">{selectedCourse.title}</h2>
                <p className="text-text-muted mb-4">{selectedCourse.description}</p>
                <div className="flex gap-4">
                  <div className="bg-bg-base px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 text-sm text-text-secondary">
                    <Users className="h-4 w-4 text-accent" /> {selectedCourse.student_count || 0} Students
                  </div>
                  <div className="bg-bg-base px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 text-sm text-text-secondary">
                    <Activity className="h-4 w-4 text-warning" /> {selectedCourse.submission_count || 0} Total Submissions
                  </div>
                </div>
              </div>
              <button onClick={() => navigate(`/course/${selectedCourse.id}`)} className="btn-secondary text-sm shrink-0">
                Manage Assignments <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Submissions Table */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-accent" />
                <h3 className="text-xl font-bold text-text-primary">Submissions Tracker</h3>
              </div>

              {submissionsLoading ? (
                <div className="flex justify-center py-10 card">
                  <Loader2 className="h-6 w-6 text-accent animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-text-muted">No submissions have been recorded for this course yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-border rounded-xl bg-bg-elevated shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-bg-base/50 text-text-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-medium">Assignment</th>
                          <th className="px-4 py-3 font-medium">Submitted By</th>
                          <th className="px-4 py-3 font-medium">Type</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {submissions.map((sub) => (
                          <tr key={sub.submission_id} className="hover:bg-bg-base/50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-text-primary">{sub.assignment_title}</span>
                            </td>
                            <td className="px-4 py-3">
                              {sub.submission_type === 'INDIVIDUAL' ? (
                                <div className="flex items-center gap-2 text-text-primary">
                                  <UserIcon className="h-3.5 w-3.5 text-accent" />
                                  <span>{sub.student_name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-text-primary">
                                  <Users className="h-3.5 w-3.5 text-warning" />
                                  <span>{sub.group_name}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                sub.submission_type === 'INDIVIDUAL' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
                              }`}>
                                {sub.submission_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-muted">
                              {new Date(sub.submitted_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge-success inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Submitted
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
