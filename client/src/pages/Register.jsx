import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[82vh] py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-accent font-bold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
          <p className="text-text-muted text-sm mt-1">Join Joineazy to get started</p>
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">I am a</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { value: 'STUDENT', label: 'Student', desc: 'Join groups & submit' },
                  { value: 'ADMIN', label: 'Professor', desc: 'Post & track assignments' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 ${
                      role === opt.value
                        ? 'border-accent/50 bg-accent/10 text-text-primary'
                        : 'border-border bg-bg-elevated text-text-secondary hover:border-border'
                    }`}
                  >
                    <span className="font-medium text-sm">{opt.label}</span>
                    <span className="text-[11px] text-text-muted mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
