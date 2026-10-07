import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../types/navigation';
import { UserRole } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { KeyRound, Mail, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { BlueShieldLogo } from '../components/ui/BlueShieldLogo';

interface LoginPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, register, loginWithGoogle, isLoading, error, providerNotice, clearError } = useAuth();
  const [email, setEmail] = useState('karthikkaranam2004@gmail.com');
  const [password, setPassword] = useState('BlueShield@2026');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [localError, setLocalError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'ADMIN' as UserRole,
      title: 'Platform Administrator',
      email: 'karthikkaranam2004@gmail.com',
      name: 'Karthik Karanam',
      desc: 'Superadmin with full regulatory authority across Bay of Bengal',
    },
    {
      role: 'COORDINATOR' as UserRole,
      title: 'Capt. Rajesh Kakarla',
      email: 'rajesh.kakarla@coastguard.gov.in',
      name: 'Capt. Rajesh Kakarla',
      desc: 'Municipal & Coast Guard Dispatch Coordinator',
    },
    {
      role: 'VOLUNTEER' as UserRole,
      title: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@cmfri.res.in',
      name: 'Dr. Ananya Sharma',
      desc: 'CMFRI Marine Biologist / Ground-Truth Inspector',
    },
    {
      role: 'CLEANUP_TEAM' as UserRole,
      title: 'Sanitation Lead',
      email: 'sanitation.lead@gvmc.gov.in',
      name: 'M. Venkat Rao',
      desc: 'GVMC Rapid Shoreline Sanitation Squad Lead',
    },
    {
      role: 'RESEARCHER' as UserRole,
      title: 'Prof. S. Narayana',
      email: 'marine.researcher@andhrauniv.edu.in',
      name: 'Prof. S. Narayana',
      desc: 'Andhra University Department of Marine Living Resources',
    },
    {
      role: 'CITIZEN' as UserRole,
      title: 'Suresh Naidu',
      email: 'suresh.naidu@vizagcity.in',
      name: 'Suresh Naidu',
      desc: 'Resident & Surfer, RK Beach Sector',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      onNavigate('/dashboard');
    } catch (err: unknown) {
      // If user doesn't exist yet, automatically register them as a test convenience
      try {
        const matchingDemo = demoAccounts.find((d) => d.email.toLowerCase() === email.toLowerCase());
        const nameToUse = matchingDemo ? matchingDemo.name : email.split('@')[0];
        await register(nameToUse, email, password, selectedRole);
        onNavigate('/dashboard');
      } catch (regErr: unknown) {
        const msg = regErr instanceof Error ? regErr.message : 'Authentication failed';
        setLocalError(msg);
      }
    }
  };

  const handleSelectDemo = (acct: typeof demoAccounts[0]) => {
    setSelectedRole(acct.role);
    setEmail(acct.email);
    setPassword('BlueShield@2026');
    setLocalError(null);
    clearError();
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-6 flex flex-col items-center">
        <BlueShieldLogo size="lg" theme="light" subtext="Visakhapatnam Marine Platform" className="mb-3" />
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Sign In to BlueShield
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Demonstration Mode — Role-Based Access Control
        </p>
      </div>

      <Card className="w-full shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Account Credentials</CardTitle>
          <CardDescription>
            Select a verified persona or enter your email to proceed
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {(localError || error) && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{localError || error}</span>
              </div>
            )}

            {providerNotice && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Demonstration Access Notice:</span>
                {providerNotice}
              </div>
            )}

            {/* Quick Persona Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Select Demo Account:</span>
                <span className="text-[10px] text-teal-700 font-mono">1-Click Auto Provision</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acct) => (
                  <button
                    key={acct.role}
                    type="button"
                    onClick={() => handleSelectDemo(acct)}
                    className={`p-2 rounded text-left border text-xs transition-colors flex flex-col justify-between ${
                      selectedRole === acct.role && email === acct.email
                        ? 'border-teal-600 bg-teal-50/70 text-[#0B2545] font-semibold ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="truncate">{acct.title}</span>
                      {selectedRole === acct.role && email === acct.email && (
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {acct.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

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
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={KeyRound}
              placeholder="••••••••••••"
            />

            <div className="p-2.5 rounded bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Demonstration Mode active. Sessions and roles managed locally in browser.</span>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2.5">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In to Platform
            </Button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                  onNavigate('/dashboard');
                } catch {
                  // Handled in context
                }
              }}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google Account</span>
            </button>

            <div className="text-center text-xs text-slate-500 mt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-teal-700 hover:underline font-semibold"
              >
                Register a new account
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
