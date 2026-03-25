import { collection, getDocs } from "firebase/firestore";

function getDataPrevistaAsString(dataPrevistaPagamento) {
  if (!dataPrevistaPagamento) return null;

  const d = dataPrevistaPagamento;
  if (typeof d === "string" && d.includes("-")) return d;
  if (d?.toDate?.()) return d.toDate().toISOString().slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

export async function generateRelatoriosReportRows({
  db,
  filterPronac,
  filterDateMode,
  filterDate,
  filterDateStart,
  filterDateEnd,
}) {
  if (!db) {
    throw new Error("Firebase não inicializado");
  }

  const pronacNormalized = (filterPronac || "").trim();

  if (!pronacNormalized) return [];

  const [pagamentosSnapshot, projetosSnapshot] = await Promise.all([
    getDocs(collection(db, "pagamentos")),
    getDocs(collection(db, "projetos")),
  ]);

  const projetosById = new Map();
  projetosSnapshot.forEach((doc) => {
    projetosById.set(doc.id, { id: doc.id, ...doc.data() });
  });

  const pagamentosList = [];
  pagamentosSnapshot.forEach((doc) => {
    pagamentosList.push({ id: doc.id, ...doc.data() });
  });

  let filtered = pagamentosList.filter(
    (p) => (p.pronac || "").trim() === pronacNormalized
  );

  // Filtragem por data é opcional conforme o modo selecionado.
  if (filterDateMode === "unica") {
    if (filterDate) {
      filtered = filtered.filter((p) => {
        const dataStr = getDataPrevistaAsString(p.dataPrevistaPagamento);
        return dataStr === filterDate;
      });
    }
  } else if (filterDateMode === "periodo") {
    // Se o período estiver em branco (qualquer uma das datas), mostra tudo.
    if (filterDateStart && filterDateEnd) {
      filtered = filtered.filter((p) => {
        const dataStr = getDataPrevistaAsString(p.dataPrevistaPagamento);
        if (!dataStr) return false;
        return dataStr >= filterDateStart && dataStr <= filterDateEnd;
      });
    }
  }

  filtered.sort((a, b) => {
    const dateA = getDataPrevistaAsString(a.dataPrevistaPagamento);
    const dateB = getDataPrevistaAsString(b.dataPrevistaPagamento);
    return new Date(dateB || 0) - new Date(dateA || 0);
  });

  return filtered.map((p) => {
    const projeto = p.projetoId ? projetosById.get(p.projetoId) : null;
    const rubricas = projeto?.rubricas || [];

    const rubricaIndex =
      p.rubricaId !== null &&
      p.rubricaId !== undefined &&
      p.rubricaId !== ""
        ? parseInt(p.rubricaId, 10)
        : null;

    const rubrica =
      rubricaIndex !== null && !Number.isNaN(rubricaIndex)
        ? rubricas[rubricaIndex]
        : null;

    return {
      pronac: p.pronac || "-",
      rubrica: p.rubricaNome || "-",
      valorRubrica:
        rubrica && rubrica.valorAprovado !== undefined
          ? Number(rubrica.valorAprovado)
          : "-",
      fornecedor: p.fornecedorNome || "-",
      numeroNF: p.numeroNF || "-",
      valorNotaFiscal: p.valor !== undefined ? p.valor : "-",
    };
  });
}

