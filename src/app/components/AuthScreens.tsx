import React, { useState, useEffect, useRef } from "react";
import {
  Mail, Lock, Phone, User, Eye, EyeOff, Sprout, ArrowRight,
  ShieldCheck, RefreshCw, AlertTriangle, MapPin, Check, Sparkles
} from "lucide-react";
import { ConfirmationResult } from "firebase/auth";
import {
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  loginWithGoogle,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  getFriendlyAuthErrorMessage
} from "../../services/authService";
import { db } from "../../services/db";
import { apiClient } from "../../services/apiClient";
import { UserState } from "../App";

const P = "#2E7D32";
const PD = "#1B5E20";
const BG = "#F4F7F4";

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

export function LoginScreen({
  onSuccess,
  onNavigateRegister,
  showToast
}: {
  onSuccess: (user: UserState) => void;
  onNavigateRegister: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}) {
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const recaptchaVerifierRef = useRef<any>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clean up recaptcha container on mount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password", "error");
      return;
    }
    setLoading(true);
    try {
      const fbUser = await loginWithEmail(email, password);
      showToast("Signed in successfully!", "success");
      // Check or load profile
      await checkAndLoadFarmerProfile(fbUser.uid, fbUser.email || "", fbUser.displayName || "");
    } catch (err: any) {
      showToast(getFriendlyAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast("Please enter your email address to reset password", "warning");
      return;
    }
    try {
      await resetPassword(email);
      showToast(`Password reset link sent to ${email}`, "info");
    } catch (err: any) {
      showToast(getFriendlyAuthErrorMessage(err), "error");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      showToast("Google authentication successful!", "success");
      await checkAndLoadFarmerProfile(fbUser.uid, fbUser.email || "", fbUser.displayName || "");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        showToast(getFriendlyAuthErrorMessage(err), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const rawNumber = phoneNumber.trim();
    if (!rawNumber || rawNumber.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    setLoading(true);
    try {
      const verifier = setupRecaptcha("recaptcha-container");
      recaptchaVerifierRef.current = verifier;
      const conf = await sendPhoneOtp(rawNumber, verifier);
      setConfirmationResult(conf);
      setOtpSent(true);
      setResendCooldown(60);
      showToast(`OTP sent to ${rawNumber}`, "success");
    } catch (err: any) {
      showToast(getFriendlyAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otpCode.trim() || otpCode.trim().length !== 6) {
      showToast("Please enter the 6-digit OTP received via SMS", "error");
      return;
    }
    setLoading(true);
    try {
      const fbUser = await verifyPhoneOtp(confirmationResult, otpCode);
      showToast("Phone verified successfully!", "success");
      await checkAndLoadFarmerProfile(fbUser.uid, fbUser.phoneNumber || phoneNumber, "Farmer");
    } catch (err: any) {
      showToast(getFriendlyAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const checkAndLoadFarmerProfile = async (uid: string, contact: string, defaultName: string) => {
    try {
      // 1. Check local Dexie IndexedDB
      const localProfile = await db.profiles.get(`profile-${uid}`);
      if (localProfile && localProfile.data) {
        onSuccess(localProfile.data as any);
        return;
      }

      // 2. Check Backend API
      try {
        const remoteUser = await apiClient.getProfile();
        if (remoteUser && remoteUser.profile) {
          const profileData: UserState = {
            name: remoteUser.full_name || defaultName || "Farmer",
            phone: remoteUser.phone || "",
            email: remoteUser.email || contact || "",
            village: remoteUser.profile.village || "Kinathukadavu",
            district: remoteUser.profile.district || "Coimbatore",
            stateName: remoteUser.profile.state || "Tamil Nadu",
            farmSize: "2.0",
            soilType: "Clay Loam",
            primaryCrop: "Paddy (Rice)",
            cropVariety: "Ponni (CO 51)",
            cropStage: "Tillering Stage",
            sowingDate: new Date().toISOString().split("T")[0],
            irrigationType: "Canal + Borewell",
            farmingMethod: "Integrated",
            waterSource: "Canal",
            mainCrops: "Paddy, Vegetables",
            language: (remoteUser.profile.preferred_language as any) || "English"
          };
          await db.profiles.put({
            id: `profile-${uid}`,
            userId: uid,
            data: profileData as any,
            updatedAt: new Date().toISOString(),
            synced: true
          });
          onSuccess(profileData);
          return;
        }
      } catch {}

      // 3. New User without Profile -> Pass minimal state to trigger Onboarding
      onSuccess({
        name: defaultName || "",
        phone: contact.includes("@") ? "" : contact,
        email: contact.includes("@") ? contact : "",
        village: "",
        district: "",
        stateName: "Tamil Nadu",
        farmSize: "",
        soilType: "",
        primaryCrop: "",
        cropVariety: "",
        cropStage: "",
        sowingDate: "",
        irrigationType: "",
        farmingMethod: "Integrated",
        waterSource: "",
        mainCrops: "",
        language: "English"
      });

    } catch (e) {
      console.error("Error loading profile:", e);
    }
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      {/* Invisible container for phone auth recaptcha */}
      <div id="recaptcha-container"></div>

      {/* Header Banner */}
      <div
        className="h-48 flex flex-col justify-end px-6 pb-6 text-white"
        style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)`, borderRadius: "0 0 32px 32px" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Sprout size={24} color="#fff" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-wide leading-none">THINAI</h1>
            <p className="text-[10px] text-white/80 font-medium">Agricultural Decision Intelligence</p>
          </div>
        </div>
        <p className="text-xs text-white/90">Sign in to access your farm intelligence & advisory.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {/* Auth Method Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-2xl">
          <button
            onClick={() => setTab("email")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === "email" ? "bg-white text-green-900 shadow-xs" : "text-gray-600"
            }`}>
            Email & Password
          </button>
          <button
            onClick={() => setTab("phone")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === "phone" ? "bg-white text-green-900 shadow-xs" : "text-gray-600"
            }`}>
            Mobile Phone OTP
          </button>
        </div>

        {tab === "email" ? (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-600">
                <Mail size={16} className="text-gray-400 mr-2" />
                <input
                  type="email"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs outline-hidden text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-green-700 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-600">
                <Lock size={16} className="text-gray-400 mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs outline-hidden text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 ml-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-green-900 active:scale-98 transition-all disabled:opacity-50 mt-1">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Sign In with Email</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (India)</label>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-green-600">
                <Phone size={16} className="text-gray-400 mr-2" />
                <span className="text-xs font-bold text-gray-600 mr-1.5">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  disabled={otpSent}
                  className="w-full text-xs outline-hidden text-gray-900"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || phoneNumber.length !== 10}
                className="w-full py-3 bg-green-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-green-900 active:scale-98 transition-all disabled:opacity-50">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>Send Verification OTP</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleSendOtp}
                      className="text-[11px] font-bold text-green-700 disabled:text-gray-400">
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-widest text-lg font-black p-2.5 bg-white border border-gray-200 rounded-xl outline-hidden focus:border-green-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 bg-green-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-green-900 active:scale-98 transition-all disabled:opacity-50">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Verify OTP & Sign In</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-[11px] font-medium text-gray-400 uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-3 shadow-2xs hover:bg-gray-50 active:scale-98 transition-all">
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
          <span>Sign In with Google</span>
        </button>

        {/* Footer Link */}
        <p className="text-xs text-center text-gray-500 mt-2">
          New farmer to THINAI?{" "}
          <button
            onClick={onNavigateRegister}
            className="font-bold text-green-800 underline">
            Register Account
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── REGISTER SCREEN ──────────────────────────────────────────────────────────

export function RegisterScreen({
  onSuccess,
  onNavigateLogin,
  showToast
}: {
  onSuccess: (user: UserState) => void;
  onNavigateLogin: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const fbUser = await registerWithEmail(email, password);
      showToast("Account created! A verification link has been sent to your email.", "success");
      // Advance to Onboarding to collect farm profile
      onSuccess({
        name,
        email,
        phone: "",
        village: "",
        district: "",
        stateName: "Tamil Nadu",
        farmSize: "",
        soilType: "",
        primaryCrop: "",
        cropVariety: "",
        cropStage: "",
        sowingDate: "",
        irrigationType: "",
        farmingMethod: "Integrated",
        waterSource: "",
        mainCrops: "",
        language: "English"
      });
    } catch (err: any) {
      showToast(getFriendlyAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div
        className="h-36 flex flex-col justify-end px-6 pb-4 text-white"
        style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)`, borderRadius: "0 0 28px 28px" }}>
        <h1 className="font-black text-2xl tracking-wide">Register Account</h1>
        <p className="text-xs text-white/80">Join THINAI to receive personalized farm decision intelligence.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <User size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="e.g. Selvam Murugan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs outline-hidden text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <Mail size={16} className="text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs outline-hidden text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Create Password (Min 6 chars)</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-xs outline-hidden text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Confirm Password</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full text-xs outline-hidden text-gray-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-green-900 active:scale-98 transition-all disabled:opacity-50 mt-2">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            <span>Create Farmer Account</span>
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-2">
          Already registered?{" "}
          <button
            onClick={onNavigateLogin}
            className="font-bold text-green-800 underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── ONBOARDING SCREEN (12 REQUIRED FIELDS) ───────────────────────────────────

export function OnboardingScreen({
  initialUser,
  onComplete,
  showToast
}: {
  initialUser: Partial<UserState>;
  onComplete: (user: UserState) => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}) {
  const [name, setName] = useState(initialUser.name || "");
  const [contact, setContact] = useState(initialUser.phone || initialUser.email || "");
  const [stateName, setStateName] = useState(initialUser.stateName || "Tamil Nadu");
  const [district, setDistrict] = useState(initialUser.district || "Coimbatore");
  const [village, setVillage] = useState(initialUser.village || "Kinathukadavu");
  const [farmSize, setFarmSize] = useState(initialUser.farmSize || "2.0");
  const [soilType, setSoilType] = useState(initialUser.soilType || "Clay Loam");
  const [primaryCrop, setPrimaryCrop] = useState(initialUser.primaryCrop || "Paddy (Rice)");
  const [cropVariety, setCropVariety] = useState(initialUser.cropVariety || "Ponni (CO 51)");
  const [sowingDate, setSowingDate] = useState(initialUser.sowingDate || new Date().toISOString().split("T")[0]);
  const [cropStage, setCropStage] = useState(initialUser.cropStage || "Tillering Stage");
  const [irrigationType, setIrrigationType] = useState(initialUser.irrigationType || "Canal + Borewell");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter your name", "error");
      return;
    }
    if (!farmSize || parseFloat(farmSize) <= 0) {
      showToast("Please enter a valid farm holding size", "error");
      return;
    }

    setLoading(true);
    const completeUser: UserState = {
      name,
      phone: contact.includes("@") ? "" : contact,
      email: contact.includes("@") ? contact : "",
      stateName,
      district,
      village,
      farmSize,
      soilType,
      primaryCrop,
      cropVariety,
      sowingDate,
      cropStage,
      irrigationType,
      farmingMethod: "Integrated Nutrient Management",
      waterSource: irrigationType,
      mainCrops: `${primaryCrop}, Pulses`,
      language: initialUser.language || "English"
    };

    try {
      // 1. Save locally in Dexie IndexedDB
      const uid = (window as any)._currentFirebaseUid || "local-uid";
      await db.profiles.put({
        id: `profile-${uid}`,
        userId: uid,
        data: completeUser as any,
        updatedAt: new Date().toISOString(),
        synced: false
      });

      // 2. Sync to Backend FastAPI
      try {
        await apiClient.updateProfile({
          state: stateName,
          district: district,
          village: village,
          preferred_language: completeUser.language,
          experience_years: 5,
          kcc_holder: false
        });
      } catch (apiErr) {
        console.warn("Backend profile sync queued offline:", apiErr);
      }

      showToast("Farm profile configured successfully!", "success");
      onComplete(completeUser);
    } catch (err: any) {
      showToast(`Error saving profile: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div
        className="h-32 flex flex-col justify-end px-6 pb-3 text-white"
        style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)`, borderRadius: "0 0 28px 28px" }}>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={16} className="text-amber-300" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Farmer Setup</span>
        </div>
        <h1 className="font-black text-xl tracking-wide">Configure Farm Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <p className="text-[11px] text-gray-600">
          Please provide your agro-climatic parameters to calibrate the decision engine.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pb-6">
          {/* 1. Name */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">1. Farmer Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
              required
            />
          </div>

          {/* 2. Contact */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">2. Contact (Mobile / Email)</label>
            <input
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
            />
          </div>

          {/* 3 & 4. State & District */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">3. State</label>
              <select
                value={stateName}
                onChange={e => setStateName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Punjab">Punjab</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">4. District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="e.g. Coimbatore"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
                required
              />
            </div>
          </div>

          {/* 5 & 6. Farm Size & Village */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">5. Farm Size (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={e => setFarmSize(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">6. Village / Location</label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="e.g. Kinathukadavu"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* 7. Soil Type */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">7. Soil Type</label>
            <select
              value={soilType}
              onChange={e => setSoilType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
              <option value="Clay Loam">Clay Loam</option>
              <option value="Red Sandy Loam">Red Sandy Loam</option>
              <option value="Black Cotton Soil">Black Cotton Soil</option>
              <option value="Alluvial Soil">Alluvial Soil</option>
            </select>
          </div>

          {/* 8 & 9. Primary Crop & Variety */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">8. Primary Crop</label>
              <select
                value={primaryCrop}
                onChange={e => setPrimaryCrop(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
                <option value="Paddy (Rice)">Paddy (Rice)</option>
                <option value="Tomato">Tomato</option>
                <option value="Wheat">Wheat</option>
                <option value="Maize">Maize</option>
                <option value="Cotton">Cotton</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">9. Crop Variety</label>
              <input
                type="text"
                value={cropVariety}
                onChange={e => setCropVariety(e.target.value)}
                placeholder="e.g. Ponni CO 51"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* 10. Sowing Date */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">10. Sowing Date</label>
            <input
              type="date"
              value={sowingDate}
              onChange={e => setSowingDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white"
            />
          </div>

          {/* 11. Crop Stage */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">11. Current Crop Stage</label>
            <select
              value={cropStage}
              onChange={e => setCropStage(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
              <option value="Sowing / Nursery">Sowing / Nursery</option>
              <option value="Tillering Stage">Tillering Stage</option>
              <option value="Panicle Initiation">Panicle Initiation</option>
              <option value="Flowering Stage">Flowering Stage</option>
              <option value="Grain Filling Stage">Grain Filling Stage</option>
              <option value="Harvesting Stage">Harvesting Stage</option>
            </select>
          </div>

          {/* 12. Irrigation Type */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">12. Irrigation Source</label>
            <select
              value={irrigationType}
              onChange={e => setIrrigationType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
              <option value="Canal + Borewell">Canal + Borewell</option>
              <option value="Drip Irrigation">Drip Irrigation</option>
              <option value="Sprinkler Irrigation">Sprinkler Irrigation</option>
              <option value="Rainfed (No Irrigation)">Rainfed (No Irrigation)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-green-900 active:scale-98 transition-all disabled:opacity-50 mt-2 shadow-md">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            <span>Save Profile & Enter THINAI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
