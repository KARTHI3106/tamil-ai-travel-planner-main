import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { loginUser } from '../services/api';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('அனைத்து புலங்களையும் நிரப்பவும்');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser({ email: form.email, password: form.password });
      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      router.push('/planner');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>உள்நுழைவு — தமிழ் AI பயண திட்டமிடுபவர்</title>
        <meta name="description" content="தமிழ் AI பயண திட்டமிடுபவரில் உள்நுழைக" />
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
            <div style={logoCircleStyle}>
              <i className="ri-plane-fill" style={{ color: '#fff', fontSize: '32px' }}></i>
            </div>
            <h1 style={brandTitleStyle}>தமிழ் AI பயண திட்டமிடுபவர்</h1>
            <p style={brandSubStyle}>தமிழ் AI பயண திட்டமிடுபவர்</p>
          </div>

          {/* Login Card */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>உள்நுழைவு</h2>
            <p style={cardDescStyle}>உங்கள் கணக்கில் உள்நுழையுங்கள்</p>

            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              {/* Email */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}><i className="ri-mail-line" style={{ marginRight: '8px' }}></i>மின்னஞ்சல்</label>
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="உதாரணம்@email.com"
                  style={inputStyle}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}><i className="ri-lock-line" style={{ marginRight: '8px' }}></i>கடவுச்சொல்</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => updateField('password', e.target.value)}
                    placeholder="குறைந்தது 6 எழுத்துகள்"
                    style={{ ...inputStyle, paddingRight: 48 }}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={eyeBtnStyle}
                    tabIndex={-1}
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} style={{ color: '#0a0a0a' }}></i>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={errorStyle}>
                  <i className="ri-error-warning-line" style={{ marginRight: '8px' }}></i>{error}
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                style={submitBtnStyle(loading)}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={spinnerStyle}></span>
                    உள்நுழைகிறது…
                  </span>
                ) : (
                  <>
                    <i className="ri-login-circle-line" style={{ marginRight: '8px' }}></i>
                    உள்நுழைக
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <div style={linkSectionStyle}>
              <p style={{ margin: 0, color: '#8e99a4', fontSize: 14 }}>
                கணக்கு இல்லையா?{' '}
                <a
                  href="/register"
                  onClick={e => { e.preventDefault(); router.push('/register'); }}
                  style={linkStyle}
                >
                  புதிய கணக்கு உருவாக்கு →
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={footerStyle}>
            © 2026 தமிழ் AI பயண திட்டமிடுபவர் — அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle = {
  minHeight: '100vh',
  background: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'DM Sans', 'Noto Sans Tamil', sans-serif",
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
};

const orb1Style = {
  position: 'absolute',
  width: 400,
  height: 400,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(40,135,255,0.15) 0%, transparent 70%)',
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
  background: 'radial-gradient(circle, rgba(40,135,255,0.1) 0%, transparent 70%)',
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
  background: 'radial-gradient(circle, rgba(40,135,255,0.05) 0%, transparent 70%)',
  top: '50%',
  left: '60%',
  animation: 'float3 10s ease-in-out infinite',
  pointerEvents: 'none',
};

const cardContainerStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 420,
  animation: 'fadeInUp 0.6s ease-out',
};

const brandStyle = {
  textAlign: 'center',
  marginBottom: 28,
};

const logoCircleStyle = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: '#2887ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 36,
  margin: '0 auto 16px',
  boxShadow: '0 8px 32px rgba(40, 135, 255, 0.4)',
};

const brandTitleStyle = {
  color: '#0a0a0a',
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
  letterSpacing: '0.5px',
};

const brandSubStyle = {
  color: '#737373',
  fontSize: 13,
  marginTop: 6,
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  borderRadius: 20,
  padding: '36px 32px 28px',
  boxShadow: '5px 5px 20px rgba(0, 0, 0, 0.1)',
};

const cardTitleStyle = {
  color: '#0a0a0a',
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
  textAlign: 'center',
};

const cardDescStyle = {
  color: '#737373',
  fontSize: 14,
  textAlign: 'center',
  marginTop: 6,
  marginBottom: 0,
};

const fieldGroupStyle = {
  marginBottom: 20,
};

const labelStyle = {
  display: 'block',
  color: '#0a0a0a',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '5rem',
  border: '1px solid #ddd',
  background: '#ffffff',
  color: '#0a0a0a',
  fontSize: 15,
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

const eyeBtnStyle = {
  position: 'absolute',
  right: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  padding: 4,
};

const errorStyle = {
  marginBottom: 16,
  padding: '12px 16px',
  background: '#fde8e8',
  border: '1px solid #f5c6c6',
  borderRadius: '5rem',
  color: '#c0392b',
  fontSize: 14,
};

function submitBtnStyle(loading) {
  return {
    width: '100%',
    padding: '16px',
    borderRadius: '5rem',
    border: 'none',
    background: loading ? '#aaa' : '#2887ff',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    marginTop: 4,
  };
}

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
  color: '#2887ff',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s',
};

const footerStyle = {
  textAlign: 'center',
  color: '#737373',
  fontSize: 12,
  marginTop: 24,
};
