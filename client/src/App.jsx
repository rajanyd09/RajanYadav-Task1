import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetails from './pages/CourseDetails';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">J</span>
          </div>
          <span className="font-semibold text-text-primary text-base tracking-tight">Joineazy</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-text-secondary mr-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {user.name}
                <span className="badge-accent text-[10px] py-0.5 px-2">{user.role}</span>
              </span>
              <Link
                to={user.role === 'ADMIN' ? '/admin' : '/student'}
                className="btn-ghost text-xs"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="btn-danger text-xs px-3 py-1.5"
              >
                Logout
              </button>
            </>
          ) : (
            !isAuthPage && (
              <>
                <Link to="/login" className="btn-ghost text-xs">Sign In</Link>
                <Link to="/register" className="btn-primary text-xs px-3 py-1.5">Get Started</Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route
              path="/"
              element={
                user
                  ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace />
                  : <Navigate to="/login" replace />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute role="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id"
              element={
                <ProtectedRoute>
                  <CourseDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
