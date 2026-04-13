import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { registerUser } from '../services/api';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal info, 2 = password

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  function handleNext(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('உங்கள் பெயரை உள்ளிடவும்');
      return;
    }
    if (!form.email.trim()) {
      setError('மின்னஞ்சலை உள்ளிடவும்');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('சரியான மின்னஞ்சலை உள்ளிடவும்');
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.password) {
      setError('கடவுச்சொல்லை உள்ளிடவும்');
      return;
    }
    if (form.password.length < 6) {
      setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('கடவுச்சொற்கள் பொருந்தவில்லை');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <>
      <Head>
        <title>புதிய கணக்கு — தமிழ் AI பயண திட்டமிடுபவர்</title>
        <meta name="description" content="Register for Tamil AI Travel Planner" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={pageStyle}>
        {/* Animated background orbs */}
        <div style={orb1Style}></div>
        <div style={orb2Style}></div>
        <div style={orb3Style}></div>

        <div style={cardContainerStyle}>
          {/* Logo / Brand */}
          <div style={brandStyle}>
            <div style={logoCircleStyle}>✈️</div>
            <h1 style={brandTitleStyle}>தமிழ் AI பயண திட்டமிடுபவர்</h1>
            <p style={brandSubStyle}>Tamil AI Travel Planner</p>
          </div>

          {/* Register Card */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>புதிய கணக்கு உருவாக்கு</h2>
            <p style={cardDescStyle}>உங்கள் பயணத்தை இன்றே தொடங்குங்கள்</p>

            {/* Step Indicator */}
            <div style={stepIndicatorStyle}>
              <div style={stepDotStyle(step >= 1, true)}>
                <span style={stepNumStyle}>1</span>
              </div>
              <div style={stepLineStyle(step >= 2)}></div>
              <div style={stepDotStyle(step >= 2, step === 2)}>
                <span style={stepNumStyle}>2</span>
              </div>
            </div>
            <div style={stepLabelsStyle}>
              <span style={stepLabelStyle(step >= 1)}>தனிப்பட்ட தகவல்</span>
              <span style={stepLabelStyle(step >= 2)}>கடவுச்சொல்</span>
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <form onSubmit={handleNext} style={{ marginTop: 20 }}>
                {/* Name */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>👤 பெயர்</label>
                  <input
                    id="register-name"
                    type="text"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="உங்கள் முழுப் பெயர்"
                    style={inputStyle}
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                {/* Email */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>📧 மின்னஞ்சல்</label>
                  <input
                    id="register-email"
                    type="email"
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="example@email.com"
                    style={inputStyle}
                    autoComplete="email"
                  />
                </div>

                {/* Phone */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>📱 தொலைபேசி <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>(விருப்பம்)</span></label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                    autoComplete="tel"
                  />
                </div>

                {error && <div style={errorStyle}>⚠️ {error}</div>}

                <button id="register-next" type="submit" style={submitBtnStyle(false)}>
                  அடுத்து →
                </button>
              </form>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                {/* Summary */}
                <div style={summaryBoxStyle}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>பதிவு செய்யப்படுகிறது:</div>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>{form.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{form.email}</div>
                </div>

                {/* Password */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>🔒 கடவுச்சொல்</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => updateField('password', e.target.value)}
                      placeholder="குறைந்தது 6 எழுத்துகள்"
                      style={{ ...inputStyle, paddingRight: 48 }}
                      autoComplete="new-password"
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={eyeBtnStyle}
                      tabIndex={-1}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={strengthBarBgStyle}>
                        <div style={strengthBarFillStyle(passwordStrength)}></div>
                      </div>
                      <div style={{ fontSize: 12, color: strengthColor(passwordStrength), marginTop: 4 }}>
                        {strengthLabel(passwordStrength)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>🔒 கடவுச்சொல் உறுதிப்படுத்தல்</label>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => updateField('confirmPassword', e.target.value)}
                    placeholder="கடவுச்சொல்லை மீண்டும் உள்ளிடவும்"
                    style={inputStyle}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
                      ❌ கடவுச்சொற்கள் பொருந்தவில்லை
                    </div>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <div style={{ fontSize: 12, color: '#2ecc71', marginTop: 4 }}>
                      ✅ கடவுச்சொற்கள் பொருந்துகின்றன
                    </div>
                  )}
                </div>

                {error && <div style={errorStyle}>⚠️ {error}</div>}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    style={backBtnStyle}
                    disabled={loading}
                  >
                    ← பின்
                  </button>
                  <button
                    id="register-submit"
                    type="submit"
                    style={{ ...submitBtnStyle(loading), flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={spinnerStyle}></span>
                        பதிவு செய்கிறது…
                      </span>
                    ) : (
                      '🎉 கணக்கு உருவாக்கு'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Login link */}
            <div style={linkSectionStyle}>
              <p style={{ margin: 0, color: '#8e99a4', fontSize: 14 }}>
                ஏற்கனவே கணக்கு உள்ளதா?{' '}
                <a
                  href="/login"
                  onClick={e => { e.preventDefault(); router.push('/login'); }}
                  style={linkStyle}
                >
                  உள்நுழைக →
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={footerStyle}>
            © 2026 Tamil AI Travel Planner — அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(25px, -40px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.08); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15) !important;
          outline: none;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4) !important;
        }
      `}</style>
    </>
  );
}

// ─── Helper functions ────────────────────────────────────────────────────────

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function strengthColor(s) {
  return ['#ff4757', '#ff6b6b', '#ffa502', '#2ed573', '#2ecc71'][s] || '#666';
}

function strengthLabel(s) {
  return ['மிகவும் பலவீனம்', 'பலவீனம்', 'சுமார்', 'நல்லது', 'மிகவும் நல்லது'][s] || '';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
};

const orb1Style = {
  position: 'absolute',
  width: 400,
  height: 400,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(102,126,234,0.25) 0%, transparent 70%)',
  top: '-10%',
  left: '-5%',
  animation: 'float1 12s ease-in-out infinite',
  pointerEvents: 'none',
};

const orb2Style = {
  position: 'absolute',
  width: 350,
  height: 350,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(118,75,162,0.3) 0%, transparent 70%)',
  bottom: '-8%',
  right: '-3%',
  animation: 'float2 15s ease-in-out infinite',
  pointerEvents: 'none',
};

const orb3Style = {
  position: 'absolute',
  width: 200,
  height: 200,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(46,213,115,0.15) 0%, transparent 70%)',
  top: '40%',
  left: '70%',
  animation: 'float3 10s ease-in-out infinite',
  pointerEvents: 'none',
};

const cardContainerStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 440,
  animation: 'fadeInUp 0.6s ease-out',
};

const brandStyle = {
  textAlign: 'center',
  marginBottom: 24,
};

const logoCircleStyle = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 36,
  margin: '0 auto 16px',
  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
};

const brandTitleStyle = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
  letterSpacing: '0.5px',
};

const brandSubStyle = {
  color: 'rgba(255,255,255,0.55)',
  fontSize: 13,
  marginTop: 6,
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 20,
  padding: '36px 32px 28px',
  boxShadow: '0 16px 64px rgba(0, 0, 0, 0.3)',
};

const cardTitleStyle = {
  color: '#fff',
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
  textAlign: 'center',
};

const cardDescStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: 14,
  textAlign: 'center',
  marginTop: 6,
  marginBottom: 0,
};

const stepIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 24,
  gap: 0,
};

function stepDotStyle(active, current) {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: active
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'rgba(255,255,255,0.1)',
    border: current ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
  };
}

const stepNumStyle = {
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
};

function stepLineStyle(active) {
  return {
    width: 60,
    height: 2,
    background: active
      ? 'linear-gradient(90deg, #667eea, #764ba2)'
      : 'rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
  };
}

const stepLabelsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 48,
  marginTop: 8,
};

function stepLabelStyle(active) {
  return {
    fontSize: 11,
    color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.3s ease',
  };
}

const fieldGroupStyle = {
  marginBottom: 20,
};

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.85)',
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.07)',
  color: '#fff',
  fontSize: 15,
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

const eyeBtnStyle = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  padding: 4,
};

const summaryBoxStyle = {
  background: 'rgba(102, 126, 234, 0.1)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  borderRadius: 12,
  padding: '12px 16px',
  marginBottom: 20,
};

const strengthBarBgStyle = {
  width: '100%',
  height: 4,
  borderRadius: 4,
  background: 'rgba(255,255,255,0.1)',
  overflow: 'hidden',
};

function strengthBarFillStyle(strength) {
  const widths = ['20%', '40%', '60%', '80%', '100%'];
  const colors = ['#ff4757', '#ff6b6b', '#ffa502', '#2ed573', '#2ecc71'];
  return {
    width: widths[strength] || '0%',
    height: '100%',
    borderRadius: 4,
    background: colors[strength] || '#666',
    transition: 'all 0.3s ease',
  };
}

const errorStyle = {
  marginBottom: 16,
  padding: '12px 16px',
  background: 'rgba(231, 76, 60, 0.15)',
  border: '1px solid rgba(231, 76, 60, 0.3)',
  borderRadius: 12,
  color: '#ff6b6b',
  fontSize: 14,
};

function submitBtnStyle(loading) {
  return {
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    border: 'none',
    background: loading
      ? 'rgba(102, 126, 234, 0.5)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
  };
}

const backBtnStyle = {
  padding: '16px 20px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.3s ease',
};

const spinnerStyle = {
  display: 'inline-block',
  width: 18,
  height: 18,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
};

const linkSectionStyle = {
  textAlign: 'center',
  marginTop: 24,
  paddingTop: 20,
  borderTop: '1px solid rgba(255,255,255,0.08)',
};

const linkStyle = {
  color: '#a78bfa',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s',
};

const footerStyle = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.3)',
  fontSize: 12,
  marginTop: 24,
};
