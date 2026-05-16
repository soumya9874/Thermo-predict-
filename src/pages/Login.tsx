import React, { useState } from "react"
import { Flame, Lock, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../lib/firebase"

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showMfaScreen, setShowMfaScreen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [mfaCode, setMfaCode] = useState("")

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaCode.length < 6) {
      setError("Please enter a valid 6-digit code.")
      return
    }
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Email and password are required to continue.")
      return
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    
    setLoading(true)
    if (isAdminMode) {
       if ((email === "admin@company.com" || email === "demo@company.com") && password === "demo123") {
          if (localStorage.getItem("2fa_enabled") === "true") {
             setShowMfaScreen(true)
             setLoading(false)
             return
          }
          navigate('/dashboard')
          setLoading(false)
          return
       } else {
          setError("Invalid admin credentials.")
          setLoading(false)
          return
       }
    } else if (!isSignUp) {
       try {
          await signInWithEmailAndPassword(auth, email, password)
          if (localStorage.getItem("2fa_enabled") === "true") {
             setShowMfaScreen(true)
             setLoading(false)
             return
          }
          navigate('/dashboard')
       } catch (err: any) {
          setError(err.message || "Invalid email or password.")
       }
    } else {
       try {
          await createUserWithEmailAndPassword(auth, email, password)
          navigate('/dashboard')
       } catch (err: any) {
          setError(err.message || "Failed to create account.")
       }
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      if (localStorage.getItem("2fa_enabled") === "true") {
         setShowMfaScreen(true)
         return
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.")
    }
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address to reset password.")
      return
    }
    if (isAdminMode) {
      setError("Cannot reset password for demo admin account.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setError("Password reset email sent. Please check your inbox.")
    } catch (err: any) {
      setError(`Failed to send password reset: ${err.message}`)
    }
  }

  return (
    <div className="dark-grid min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center mb-8">
        <Flame className="w-10 h-10 text-cyan-400 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">
          Therma<span className="text-amber-500">Predict</span>
        </h1>
        <p className="text-slate-400 text-sm">Predictive maintenance for industrial systems.</p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        {showMfaScreen ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400">Please enter the 6-digit code from your authenticator app.</p>
            </div>
            {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Authentication Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="000000" 
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#1e293b] text-center tracking-widest text-lg border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full login-btn-glow text-slate-900 font-semibold rounded-lg py-2.5 mt-2 transition-transform hover:scale-[1.02]"
            >
              Verify Code
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowMfaScreen(false)
                setError("")
              }}
              className="w-full text-slate-400 text-sm hover:text-white transition-colors mt-4"
            >
              Back to login
            </button>
          </form>
        ) : (
          <>
            <div className="flex bg-[#1e293b] rounded-lg p-1 mb-6">
              <button 
                onClick={() => { setIsSignUp(false); setIsAdminMode(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  !isSignUp && !isAdminMode ? 'text-white bg-slate-900 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign in
              </button>
              <button 
                onClick={() => { setIsSignUp(true); setIsAdminMode(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  isSignUp && !isAdminMode ? 'text-white bg-slate-900 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign up
              </button>
              <button 
                onClick={() => { setIsAdminMode(true); setIsSignUp(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  isAdminMode ? 'text-amber-500 bg-slate-900 shadow' : 'text-slate-400 hover:text-amber-500/80'
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdminMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center mb-4">
                  <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-bold text-amber-500 mb-1">Admin Portal</h3>
                  <p className="text-xs text-slate-400">Restricted area. Use your administrative credentials to continue.</p>
                </div>
              )}
          {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{isAdminMode ? "Admin Email" : "Email"}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
              <input 
                type="email" 
                placeholder={isAdminMode ? "demo@company.com" : "you@company.com"} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 ${isAdminMode ? 'focus:ring-amber-500' : 'focus:ring-cyan-500'} placeholder:text-slate-500`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              {!isSignUp && <a href="#" onClick={handleForgotPassword} className={`text-xs ${isAdminMode ? 'text-amber-500' : 'text-cyan-500'} hover:underline`}>Forgot?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 ${isAdminMode ? 'focus:ring-amber-500' : 'focus:ring-cyan-500'} placeholder:text-slate-500`}
              />
            </div>
          </div>

          {isSignUp && !isAdminMode && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full ${isAdminMode ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'login-btn-glow text-slate-900'} font-semibold rounded-lg py-2.5 mt-2 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : (isAdminMode ? 'Login as Admin' : (isSignUp ? 'Create Account' : 'Sign in'))}
          </button>
        </form>

        {!isAdminMode && (
          <>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-xs text-slate-500 font-medium">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full mt-6 bg-[#1e293b] border border-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </>
        )}
        </>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-500">
        By continuing, you agree to our terms and privacy policy.
      </p>
    </div>
  )
}
