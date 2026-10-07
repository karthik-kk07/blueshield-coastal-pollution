import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../types/navigation';
import { UserRole } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { User, Mail, Building2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { BlueShieldLogo } from '../components/ui/BlueShieldLogo';

interface RegisterPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VOLUNTEER');
  const [organization, setOrganization] = useState('');
  const [agreedToProtocol, setAgreedToProtocol] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!agreedToProtocol) {
      setLocalError('Please acknowledge the BlueShield Ground Truth Protocol.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(name, email, password, role, organization);
      setSuccess(true);
      setTimeout(() => {
        onNavigate('/dashboard');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setLocalError(msg);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-6 flex flex-col items-center">
        <BlueShieldLogo size="lg" theme="light" subtext="Visakhapatnam Marine Platform" className="mb-3" />
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create Your BlueShield Account
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Register to participate in human-verified coastal protection across the Bay of Bengal
        </p>
      </div>

      <Card className="w-full shadow-md">
        {success ? (
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Account Created Successfully</h3>
            <p className="text-xs text-slate-600">
              Welcome, {name}! Your profile has been stored in local session with role <strong>{role}</strong>. Directing to your dashboard...
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Account Registration</CardTitle>
              <CardDescription>
                Demonstration credentials and role assignment
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {(localError || error) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{localError || error}</span>
                </div>
              )}

              <Input
                label="Full Legal Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                placeholder="e.g. Suresh Naidu / Priya Sundaram"
              />

              <Input
                label="Official Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                placeholder="user@organization.in"
              />

              <Input
                label="Password (min 6 characters)"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={KeyRound}
                placeholder="••••••••••••"
              />

              <Select
                label="Participant Role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                options={[
                  { value: 'CITIZEN', label: 'CITIZEN — Beachgoer & Hazard Reporter' },
                  { value: 'VOLUNTEER', label: 'VOLUNTEER — Accredited Ground-Truth Inspector' },
                  { value: 'COORDINATOR', label: 'COORDINATOR — Municipal / Agency Dispatcher' },
                  { value: 'CLEANUP_TEAM', label: 'CLEANUP_TEAM — Field Sanitation Lead' },
                  { value: 'RESEARCHER', label: 'RESEARCHER — Marine Scientist (CMFRI / AU)' },
                ]}
              />

              <Input
                label="Affiliated Organization / Group"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                icon={Building2}
                placeholder="e.g. GVMC Sanitation, Andhra University, Rushikonda Eco Club"
                helperText="Volunteers and coordinators should list their regional organization"
              />

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToProtocol}
                    onChange={(e) => setAgreedToProtocol(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    required
                  />
                  <span className="text-slate-600 leading-tight">
                    I agree to the <strong>BlueShield Ground Truth Protocol</strong>: filing objective photographic evidence, strictly verifying shoreline coordinates, and ensuring non-invasive coastal inspections.
                  </span>
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={!agreedToProtocol}
                isLoading={isLoading}
              >
                Create Account
              </Button>
              <div className="text-center text-xs text-slate-500 mt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-teal-700 hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
