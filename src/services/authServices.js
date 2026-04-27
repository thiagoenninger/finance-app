import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { CATEGORIA_CONSULTA } from "../constants/userCategories";

export async function loginWithEmail(email, password) {
  await setPersistence(auth, browserSessionPersistence);

  return signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  )
}

export function logoutCurrentUser() {
  return signOut(auth);
}

export function sendResetPasswordEmail(email) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function ensureUsuarioDocument(firebaseUser) {
  if (!firebaseUser) return;

  const ref = doc(db, "usuarios", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: firebaseUser.email ?? "",
      nome: "",
      criadoEm: serverTimestamp(),
      categoria: CATEGORIA_CONSULTA,
    });
  }
}
