export const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/invalid-email": "E-mail inválido.",
};

export function getAuthErrorMessage(code, fallback) {
    return AUTH_ERROR_MESSAGES[code] || fallback
}