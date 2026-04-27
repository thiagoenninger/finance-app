import { createContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  loginWithEmail,
  logoutCurrentUser,
  ensureUsuarioDocument,
} from "../services/authServices";
import {
  CATEGORIA_CONSULTA,
  CATEGORIA_SIMPLIFICADO,
  CATEGORIA_FINANCEIRO,
  CATEGORIA_ADMINISTRADOR,
  normalizeCategoria,
} from "../constants/userCategories";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [perfil, setPerfil] = useState(undefined);
  const [authError, setAuthError] = useState(null)

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
        setAuthError("Erro ao carregar perfil. Recarregue a página.")
        setPerfil({nome: "", categoria: CATEGORIA_CONSULTA })
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
  const isConsulta = categoria === CATEGORIA_CONSULTA;
  const isSimplificado = categoria === CATEGORIA_SIMPLIFICADO;
  const isFinanceiro = categoria === CATEGORIA_FINANCEIRO;
  const isAdministrador = categoria === CATEGORIA_ADMINISTRADOR;

  const value = useMemo(() => ({
  user, perfil, categoria, isConsulta, isSimplificado, isFinanceiro, isAdministrador, loading, login, logout, authError
}), [user, perfil, categoria, isConsulta, isSimplificado, isFinanceiro, isAdministrador, loading, authError])

  return (
    <AuthContext.Provider
      value={value}>
      {children}
    </AuthContext.Provider>
  );
}
