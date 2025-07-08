// lib/auth.js
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"; // Add signOut to imports
import { app } from "./firebase";

const auth = getAuth(app);

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Clear client-side storage
    localStorage.clear();
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout. Please try again.");
  }
};

function getAuthErrorMessage(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
      return "Account disabled";
    case "auth/user-not-found":
      return "Account not found";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later";
    default:
      return "Login failed. Please try again";
  }
}
