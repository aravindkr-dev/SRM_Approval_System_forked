'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../lib/types';
import PasswordInput from '../../components/PasswordInput';

const roleOptions = [
  { value: UserRole.REQUESTER, label: 'Requester/HOD' },
  { value: UserRole.INSTITUTION_MANAGER, label: 'Institution Manager' },
  { value: UserRole.SOP_VERIFIER, label: 'SOP Verifier' },
  { value: UserRole.ACCOUNTANT, label: 'Accountant' },
  { value: UserRole.VP, label: 'Vice President' },
  { value: UserRole.HEAD_OF_INSTITUTION, label: 'Head of Institution' },
  { value: UserRole.DEAN, label: 'Dean' },
  { value: UserRole.MMA, label: 'MMA' },
  { value: UserRole.HR, label: 'HR' },
  { value: UserRole.AUDIT, label: 'Audit' },
  { value: UserRole.IT, label: 'IT' },
  { value: UserRole.CHIEF_DIRECTOR, label: 'Chief Director' },
  { value: UserRole.CHAIRMAN, label: 'Chairman' },
];

const rolesWithDepartment = [
  UserRole.REQUESTER,
  UserRole.DEAN,
  UserRole.HEAD_OF_INSTITUTION
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.REQUESTER);
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const inputClass = 
    "mt-1 block w-full border border-gray-400 rounded-lg px-3 py-2 " +
    "bg-white shadow-sm placeholder-gray-500 text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const isDepartmentRequired = rolesWithDepartment.includes(selectedRole);

    if (!name || !email || !password || !empId || !college || (isDepartmentRequired && !department)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          empId,
          email,
          password,
          role: selectedRole,
          college,
          department: isDepartmentRequired ? department : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/login?message=Signup successful. Please login.');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 animate-fadeIn">
      <div className="max-w-md w-full space-y-8">

        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-gray-600 text-sm">
            Sign up for SRM-RMP Institutional Approval System
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignup}>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
              <input
                type="text"
                required
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="EMP12345"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                required
                value={selectedRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setSelectedRole(newRole);
                  if (!rolesWithDepartment.includes(newRole)) setDepartment('');
                }}
                className={inputClass}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">College *</label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Enter your college name"
                className={inputClass}
              />
            </div>

            {rolesWithDepartment.includes(selectedRole) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enter your department name"
                  className={inputClass}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-medium shadow-md transition"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
