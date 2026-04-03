import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/common/Spinner';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+86', country: 'China' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi' },
  { code: '+55', country: 'Brazil' },
  { code: '+234', country: 'Nigeria' },
  { code: '+27', country: 'South Africa' },
  { code: '+82', country: 'South Korea' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = method === 'email'
        ? { email }
        : { phoneNumber: phone, suffix: countryCode };

      const data = await authAPI.sendOtp(body);
      if (data.success) {
        setStep('verify');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = method === 'email'
        ? { email, code: otp }
        : { phoneNumber: phone, code: otp, suffix: countryCode };

      const data = await authAPI.verifyOtp(body);
      if (data.success) {
        login(data.user);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col" id="login-page">
      {/* Top green bar */}
      <div className="h-[222px] bg-wa-teal relative">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.15"/>
            <path d="M34.6 13.4C31.8 10.5 28 9 24 9c-8.3 0-15 6.7-15 15 0 2.6.7 5.2 2 7.5L9 39l7.7-2c2.2 1.2 4.7 1.8 7.3 1.8 8.3 0 15-6.7 15-15 0-4-1.6-7.8-4.4-10.6z" fill="white" fillOpacity="0.3"/>
          </svg>
          <span className="text-white text-lg font-medium tracking-wide uppercase">WhatsApp</span>
        </div>
      </div>

      {/* Bottom grey */}
      <div className="flex-1 dark:bg-wa-d-bg-deeper bg-wa-l-bg" />

      {/* Card centered */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-md dark:bg-wa-d-panel bg-white rounded-lg shadow-2xl
          overflow-hidden animate-fade-in-up">
          {/* Card content */}
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-wa-green/10 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="24" fill="#00a884"/>
                  <path d="M34.6 13.4C31.8 10.5 28 9 24 9c-8.3 0-15 6.7-15 15 0 2.6.7 5.2 2 7.5L9 39l7.7-2c2.2 1.2 4.7 1.8 7.3 1.8 8.3 0 15-6.7 15-15 0-4-1.6-7.8-4.4-10.6zM24 36.2c-2.2 0-4.4-.6-6.3-1.7l-.5-.3-4.6 1.2 1.2-4.4-.3-.5c-1.2-2-1.9-4.3-1.9-6.5 0-6.9 5.6-12.5 12.5-12.5 3.3 0 6.5 1.3 8.8 3.7 2.3 2.3 3.7 5.5 3.7 8.8-.1 6.8-5.7 12.2-12.6 12.2z" fill="white"/>
                </svg>
              </div>
            </div>

            <h1 className="text-center dark:text-wa-d-text text-wa-l-text text-xl font-medium mb-1">
              {step === 'input' ? 'Welcome to WhatsApp' : 'Verify your account'}
            </h1>
            <p className="text-center dark:text-wa-d-text-secondary text-wa-l-text-secondary text-sm mb-6">
              {step === 'input'
                ? 'Enter your email or phone number to get started'
                : `Enter the OTP sent to your ${method}`}
            </p>

            {/* Method toggle */}
            {step === 'input' && (
              <div className="flex rounded-lg overflow-hidden mb-6 border dark:border-wa-d-border border-wa-l-border">
                <button
                  onClick={() => { setMethod('email'); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer
                    ${method === 'email'
                      ? 'bg-wa-green text-white'
                      : 'dark:bg-wa-d-bg bg-wa-l-bg dark:text-wa-d-text text-wa-l-text'
                    }`}
                  id="email-tab"
                >
                  Email
                </button>
                <button
                  onClick={() => { setMethod('phone'); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer
                    ${method === 'phone'
                      ? 'bg-wa-green text-white'
                      : 'dark:bg-wa-d-bg bg-wa-l-bg dark:text-wa-d-text text-wa-l-text'
                    }`}
                  id="phone-tab"
                >
                  Phone
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={step === 'input' ? handleSendOtp : handleVerifyOtp}>
              {step === 'input' ? (
                <>
                  {method === 'email' ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 rounded-lg border dark:border-wa-d-border border-wa-l-border
                        dark:bg-wa-d-input bg-wa-l-search outline-none
                        dark:text-wa-d-text text-wa-l-text text-sm
                        focus:border-wa-green transition-colors
                        dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary"
                      id="email-input"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-3 rounded-lg border dark:border-wa-d-border border-wa-l-border
                          dark:bg-wa-d-input bg-wa-l-search outline-none
                          dark:text-wa-d-text text-wa-l-text text-sm
                          focus:border-wa-green transition-colors cursor-pointer"
                        id="country-code-select"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} {c.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                        className="flex-1 px-4 py-3 rounded-lg border dark:border-wa-d-border border-wa-l-border
                          dark:bg-wa-d-input bg-wa-l-search outline-none
                          dark:text-wa-d-text text-wa-l-text text-sm
                          focus:border-wa-green transition-colors
                          dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary"
                        id="phone-input"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg border dark:border-wa-d-border border-wa-l-border
                      dark:bg-wa-d-input bg-wa-l-search outline-none
                      dark:text-wa-d-text text-wa-l-text text-center text-2xl tracking-[0.5em] font-mono
                      focus:border-wa-green transition-colors
                      dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary"
                    autoFocus
                    id="otp-input"
                  />
                  <button
                    type="button"
                    onClick={() => { setStep('input'); setOtp(''); setError(''); }}
                    className="mt-2 text-wa-green text-sm hover:underline cursor-pointer"
                  >
                    ← Change {method}
                  </button>
                </>
              )}

              {error && (
                <p className="mt-3 text-red-400 text-sm text-center animate-fade-in">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 py-3 bg-wa-green hover:bg-wa-green-hover text-white
                  rounded-lg font-medium text-sm transition-colors disabled:opacity-50
                  disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                id="submit-btn"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : step === 'input' ? (
                  'Send OTP'
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 dark:bg-wa-d-bg bg-wa-l-bg border-t dark:border-wa-d-border border-wa-l-border">
            <p className="text-center dark:text-wa-d-text-secondary text-wa-l-text-secondary text-xs">
              Your personal messages are end-to-end encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
