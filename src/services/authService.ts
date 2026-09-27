import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "../firebase";

const googleProvider = new GoogleAuthProvider();

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Register a new farmer using Email & Password.
 * Automatically sends verification email.
 */
export async function registerWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn("Could not send verification email:", err);
  }
  return cred.user;
}

/**
 * Sign in using Email & Password.
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign in with Google (Opens real Google OAuth popup flow).
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  googleProvider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Initializes invisible or visible RecaptchaVerifier for Phone Auth.
 */
export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  // Clear any existing instance on window if needed
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {}
  }
  const verifier = new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("Recaptcha expired, resetting...");
    }
  });
  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends real SMS OTP to the farmer's mobile phone number using Firebase.
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // Format Indian phone numbers with country code if missing
  let formatted = phoneNumber.trim();
  if (!formatted.startsWith("+")) {
    if (formatted.length === 10) {
      formatted = `+91${formatted}`;
    } else {
      formatted = `+${formatted}`;
    }
  }
  return await signInWithPhoneNumber(auth, formatted, verifier);
}

/**
 * Verifies the 6-digit OTP code against the Firebase ConfirmationResult.
 */
export async function verifyPhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<FirebaseUser> {
  const result = await confirmationResult.confirm(otpCode.trim());
  return result.user;
}

/**
 * Signs out the current farmer session.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Deletes the authenticated user account.
 */
export async function deleteCurrentUserAccount(): Promise<void> {
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}

/**
 * Retrieves the current Firebase ID token for attaching to API requests.
 */
export async function getCurrentAuthToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken(false);
}

/**
 * Subscribes to Firebase Authentication state.
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Formats user-friendly error messages from Firebase error codes.
 */
export function getFriendlyAuthErrorMessage(err: any): string {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please register.";
    case "auth/wrong-password":
      return "Incorrect password. Please verify or use Forgot Password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-verification-code":
      return "The OTP entered is incorrect. Please re-check.";
    case "auth/code-expired":
      return "The OTP has expired. Please request a new OTP.";
    case "auth/invalid-phone-number":
      return "Invalid mobile number. Please enter a valid 10-digit Indian phone number.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few moments and try again.";
    case "auth/popup-closed-by-user":
      return "Google Sign-In was cancelled.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    default:
      return err?.message || "An authentication error occurred. Please try again.";
  }
}
