import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  loginWithEmail,
  logoutCurrentUser,
  ensureUsuarioDocument,
} from "../services/authServices";
import {
  CATEGORIA_SIMPLES,
  CATEGORIA_COMPLETO,
  normalizeCategoria,
} from "../constants/userCategories";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [perfil, setPerfil] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setPerfil(null);
        return;
      }

      try {
        await ensureUsuarioDocument(firebaseUser);

        const snap = await getDoc(doc(db, "usuarios", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};

        setPerfil({
          nome: data.nome || "",
          categoria: normalizeCategoria(data.categoria),
        });
      } catch (error) {
        console.error("Auth bootstrap error: ", error);
        setPerfil({
          nome: "",
          categoria: CATEGORIA_SIMPLES,
        });
      } finally {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => loginWithEmail(email, password);
  const logout = () => logoutCurrentUser();

  const loading = user === undefined || (user && perfil === undefined);
  const categoria = perfil?.categoria || null;
  const isSimples = categoria === CATEGORIA_SIMPLES;
  const isCompleto = categoria === CATEGORIA_COMPLETO;

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        categoria,
        isSimples,
        isCompleto,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
