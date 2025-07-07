import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
