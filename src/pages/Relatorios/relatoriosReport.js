import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

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

  const pagamentosSnapshot = await getDocs(
    query(collection(db, "pagamentos"), where("pronac", "==", pronacNormalized))
  );

  let filtered = [];
  pagamentosSnapshot.forEach((d) => {
    filtered.push({ id: d.id, ...d.data() });
  });

  const projetoIds = [...new Set(filtered.map((p) => p.projetoId).filter(Boolean))];
  const projetosDocs = await Promise.all(projetoIds.map((id) => getDoc(doc(db, "projetos", id))));
  const projetosById = new Map(
    projetosDocs.filter((d) => d.exists()).map((d) => [d.id, { id: d.id, ...d.data() }])
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
      valorRubrica: (() => {
        if (!rubrica) return "-"
        const val = rubrica.valorReadequado != null ? rubrica.valorReadequado : rubrica.valorAprovado
        return val !== undefined ? Number(val) : "-"
      })(),
      fornecedor: p.fornecedorNome || "-",
      numeroNF: p.numeroNF || "-",
      valorNotaFiscal: p.valor !== undefined ? p.valor : "-",
    };
  });
}

