import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { Pencil, Check, X } from "lucide-react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import {
  CATEGORIA_SIMPLES,
  CATEGORIA_COMPLETO,
  normalizeCategoria,
} from "../../constants/userCategories";
import "./style.css";

export default function Users() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingNome, setEditingNome] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editingCategoria, setEditingCategoria] = useState(CATEGORIA_SIMPLES);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError("");

    try {
      const snap = await getDocs(collection(db, "usuarios"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(list);
    } catch (err) {
      console.error("Erro ao carregar usuários: ", err);
      setError("Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleEdit = (usuario) => {
    setEditingId(usuario.id);
    setEditingNome(usuario.nome || "");
    setEditingCategoria(normalizeCategoria(usuario.categoria));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingNome("");
    setEditingCategoria(CATEGORIA_SIMPLES);
  };

  const handleSave = async (uid) => {
    const validationMessage = validateDisplayName(editingNome);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    const nomeLimpo = editingNome.trim()
    setSavingId(uid);
    setError("");
    
    try {
      const categoriaFinal = normalizeCategoria(editingCategoria);
      await setDoc(
        doc(db, "usuarios", uid),
        { nome: nomeLimpo, categoria: categoriaFinal },
        { merge: true },
      );
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === uid
            ? { ...u, nome: nomeLimpo, categoria: categoriaFinal }
            : u,
        ),
      );
      setEditingId(null);
      setEditingNome("");
      setEditingCategoria(CATEGORIA_SIMPLES);
    } catch (err) {
      console.error("Erro ao salvar nome: ", err);
      setError("Não foi possível salvar nome. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  function validateDisplayName(value) {
    const nome = value.trim();
    if (!nome) return "O nome não pode ficar vazio.";
    if (nome.length < 3) return "O nome deve ter pelo menos 3 caracteres.";
    if (nome.length > 30) return "O nome deve ter no máximo 30 caracteres.";
    return "";
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div className="users-header-content">
          <div className="users-header-text">
            <h1>Usuários</h1>
            <p>Gerencie nome de exibição e a categoria dos usuários</p>
          </div>
        </div>
      </div>
      {error && (
        <div className="users-error user-error-row">
          <span>{error}</span>
          <button
            type="button"
            className="user-retry-button"
            onClick={fetchUsuarios}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome de exibição</th>
              <th>E-mail</th>
              <th>Categoria</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="users-table-message">
                  Carregando...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="users-table-message">
                  Nenhum usuário encontrado. Faça login com cada conta para que
                  ela apareça aqui.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => {
                const isEditing = editingId === usuario.id;
                const isSavingThisRow = savingId === usuario.id;
                const isOwnRow = usuario.id === user?.uid;
                return (
                  <tr key={usuario.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="users-name-input"
                          value={editingNome}
                          onChange={(e) => setEditingNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(usuario.id);
                            if (e.key === "Escape") handleCancel();
                          }}
                          autoFocus
                          placeholder="Nome de exibição"
                        />
                      ) : (
                        <span className={!usuario.nome ? "users-no-name" : ""}>
                          {usuario.nome || "— sem nome —"}
                        </span>
                      )}
                    </td>
                    <td>{usuario.email || "—"}</td>
                    <td>
                      {isEditing ? (
                        <fieldset className="users-categoria-fieldset">
                          <legend className="users-categoria-legend">
                            Tipo de usuário
                          </legend>
                          <label className="users-categoria-label">
                            <input
                              type="radio"
                              name={`categoria-${usuario.id}`}
                              checked={editingCategoria === CATEGORIA_SIMPLES}
                              onChange={() =>
                                setEditingCategoria(CATEGORIA_SIMPLES)
                              }
                            />
                            Simples
                          </label>
                          <label className="users-categoria-label">
                            <input
                              type="radio"
                              name={`categoria-${usuario.id}`}
                              checked={editingCategoria === CATEGORIA_COMPLETO}
                              onChange={() =>
                                setEditingCategoria(CATEGORIA_COMPLETO)
                              }
                            />
                            Completo
                          </label>
                        </fieldset>
                      ) : (
                        <span
                          className={!usuario.categoria ? "users-no-name" : ""}
                        >
                          {normalizeCategoria(usuario.categoria)}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions-buttons">
                        {isEditing ? (
                          <>
                            <button
                              className="action-button action-button-edit"
                              onClick={() => handleSave(usuario.id)}
                              disabled={isSavingThisRow}
                              title="Salvar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="action-button action-button-delete"
                              onClick={handleCancel}
                              disabled={isSavingThisRow}
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : isOwnRow ? (
                          <button
                            className="action-button action-button-edit"
                            onClick={() => handleEdit(usuario)}
                            title="Editar meus dados"
                          >
                            <Pencil size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
