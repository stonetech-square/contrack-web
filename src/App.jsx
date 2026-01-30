import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('loading') 
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setStatus('error')
        setErrorMessage('Invalid or expired invitation link. Please contact your administrator.')
        return
      }

      if (session) {
        setStatus('ready')
      } else {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (errorCode) {
          setStatus('error')
          if (errorCode === 'otp_expired') {
            setErrorMessage('Your invitation link has expired. Please contact your administrator to send a new invitation.')
          } else {
            setErrorMessage(errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'Authentication failed. Please contact your administrator.')
          }
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (setSessionError) {
            setStatus('error')
            setErrorMessage('Failed to verify your invitation. Please try again or contact support.')
          } else {
            setStatus('ready')
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } else {
          setStatus('error')
          setErrorMessage('Invalid invitation link. Please use the link sent to your email.')
        }
      }
    }

    checkSession()
  }, [])

  const validatePassword = () => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validatePassword()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setStatus('ready')
        setErrorMessage(error.message || 'Failed to set password. Please try again.')
        return
      }

      setStatus('success')
    } catch (err) {
      setStatus('ready')
      setErrorMessage('An unexpected error occurred. Please try again.')
    }
  }

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    return { strength, label: labels[strength] }
  }

  const { strength, label } = getPasswordStrength()

  if (status === 'loading') {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Verifying your invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="card">
          <div className="error-state">
            <div className="error-icon">!</div>
            <h2>Something went wrong</h2>
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success' || status === 'downloads') {
    return (
      <div className="container">
        <div className="card">
          <div className="success-state">
            <div className="success-icon">{status === 'success' ? '✓' : '↓'}</div>
            <h2>{status === 'success' ? 'Account Setup Complete!' : 'Download Contrak ERGP'}</h2>
            <p>
              {status === 'success'
                ? 'Your password has been set successfully. Download the Contrak ERGP app and sign in with your email and new password.'
                : 'Download the app for your platform and sign in with your email and password.'}
            </p>
          </div>
          <div className="download-section">
            <h3>Available Downloads</h3>
            <div className="download-buttons">
              <a href="https://ymwljegqufoyonilnoie.supabase.co/storage/v1/object/public/instalations/contrack.exe" className="download-btn windows">
                <span className="download-icon">⊞</span>
                <span className="download-text">
                  <span className="download-label">Download for</span>
                  <span className="download-platform">Windows</span>
                </span>
              </a>
              <a href="https://ymwljegqufoyonilnoie.supabase.co/storage/v1/object/public/instalations/contrack.dmg" className="download-btn mac">
                <span className="download-icon"></span>
                <span className="download-text">
                  <span className="download-label">Download for</span>
                  <span className="download-platform">macOS</span>
                </span>
              </a>
              {/* <a href="#" className="download-btn linux">
                <span className="download-icon">⬡</span>
                <span className="download-text">
                  <span className="download-label">Download for</span>
                  <span className="download-platform">Linux</span>
                </span>
              </a> */}
            </div>
          </div>
          {status === 'downloads' && (
            <button
              type="button"
              className="back-link-btn"
              onClick={() => setStatus('ready')}
            >
              Back to password setup
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>Complete Your Account</h1>
          <p>Create a secure password to finish setting up your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={status === 'submitting'}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className={`strength-fill strength-${strength}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  ></div>
                </div>
                <span className={`strength-label strength-${strength}`}>{label}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={status === 'submitting'}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span className="field-error">Passwords do not match</span>
            )}
            {confirmPassword && password === confirmPassword && (
              <span className="field-success">Passwords match</span>
            )}
          </div>

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}

          <div className="requirements">
            <p>Password must contain:</p>
            <ul>
              <li className={password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(password) ? 'met' : ''}>One uppercase letter</li>
              <li className={/[a-z]/.test(password) ? 'met' : ''}>One lowercase letter</li>
              <li className={/[0-9]/.test(password) ? 'met' : ''}>One number</li>
            </ul>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={status === 'submitting' || !password || !confirmPassword}
          >
            {status === 'submitting' ? (
              <>
                <span className="btn-spinner"></span>
                Setting up...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>

        <div className="download-link-section">
          <p>Already set up your password?</p>
          <button
            type="button"
            className="download-link-btn"
            onClick={() => setStatus('downloads')}
          >
            Download the App
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
