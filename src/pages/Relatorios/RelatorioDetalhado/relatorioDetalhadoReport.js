import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Normalise a dataPagamento value (string "YYYY-MM-DD", Firestore Timestamp,
 * or JS Date) into a plain "YYYY-MM-DD" string for comparison.
 */
function toDateString(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10);
  if (value?.toDate) return value.toDate().toISOString().slice(0, 10);
  const d = new Date(value);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

/**
 * Format a "YYYY-MM-DD" string to "DD/MM/YYYY" for display.
 */
function formatDateBR(value) {
  const s = toDateString(value);
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Fetch all report rows for RelatorioDetalhado.
 *
 * Logic:
 * 1. Fetch all pagamentos matching the given PRONAC.
 * 2. For each pagamento, query baixasPagamento where pagamentoId == pagamento.id.
 * 3. Fetch the fornecedor document once per unique fornecedorId to get CPF/CNPJ.
 * 4. Build one row per baixa (a pagamento with 2 baixas produces 2 rows).
 * 5. Filter by the optional date period using dataPagamento from the baixa.
 *
 * Returns an array of row objects sorted by dataPagamento descending.
 */
export async function generateRelatorioDetalhadoRows({
  db,
  filterPronac,
  filterDateStart,
  filterDateEnd,
}) {
  if (!db) throw new Error("Firebase não inicializado");

  const pronacNormalized = (filterPronac || "").trim();
  if (!pronacNormalized) return [];

  // ── 1. Fetch pagamentos for this PRONAC ───────────────────────────────────
  const pagamentosSnap = await getDocs(collection(db, "pagamentos"));
  const pagamentos = [];
  pagamentosSnap.forEach((d) => {
    const data = d.data();
    if ((data.pronac || "").trim() === pronacNormalized) {
      pagamentos.push({ id: d.id, ...data });
    }
  });

  if (pagamentos.length === 0) return [];

  // ── 2. Fetch baixas for each pagamento ────────────────────────────────────
  // Run all queries in parallel for performance.
  const baixasPerPagamento = await Promise.all(
    pagamentos.map(async (pag) => {
      const q = query(
        collection(db, "baixasPagamento"),
        where("pagamentoId", "==", pag.id)
      );
      const snap = await getDocs(q);
      const baixas = [];
      snap.forEach((d) => baixas.push({ id: d.id, ...d.data() }));
      return { pagamento: pag, baixas };
    })
  );

  // ── 3. Collect unique fornecedor IDs and fetch them once ──────────────────
  const fornecedorIds = [
    ...new Set(
      pagamentos
        .map((p) => p.fornecedorId)
        .filter(Boolean)
    ),
  ];

  const fornecedoresMap = new Map();
  await Promise.all(
    fornecedorIds.map(async (fId) => {
      const snap = await getDocs(
        query(collection(db, "fornecedores"), where("__name__", "==", fId))
      );
      if (!snap.empty) {
        const d = snap.docs[0];
        fornecedoresMap.set(fId, { id: d.id, ...d.data() });
      }
    })
  );

  // ── 4. Build rows ─────────────────────────────────────────────────────────
  const rows = [];

  for (const { pagamento, baixas } of baixasPerPagamento) {
    if (baixas.length === 0) continue; // skip pagamentos with no baixa

    const fornecedor = fornecedoresMap.get(pagamento.fornecedorId) || null;
    const documentoFornecedor = fornecedor
      ? `${fornecedor.tipoDocumento || ""}: ${fornecedor.documento || ""}`.trim()
      : pagamento.fornecedorNome || "-";

    for (const baixa of baixas) {
      const dateStr = toDateString(baixa.dataPagamento);

      // ── 5. Optional date period filter ────────────────────────────────────
      if (filterDateStart && filterDateEnd) {
        if (!dateStr) continue;
        if (dateStr < filterDateStart || dateStr > filterDateEnd) continue;
      }

      rows.push({
        pronac: pagamento.pronac || "-",
        rubrica: pagamento.rubricaNome || "-",
        documentoFornecedor,
        numeroNF: pagamento.numeroNF || "-",
        dataPagamento: formatDateBR(baixa.dataPagamento),
        dataPagamentoRaw: dateStr || "",
        numeroPagamento: baixa.numeroPagamento || "-",
        valorPago: baixa.valorPago !== undefined ? Number(baixa.valorPago) : "-",
        notaFiscalUrl: pagamento.notaFiscalUrl || null,
        notaFiscalFileName: pagamento.notaFiscalFileName || null,
      });
    }
  }

  // Sort by dataPagamento descending
  rows.sort((a, b) => {
    if (!a.dataPagamentoRaw) return 1;
    if (!b.dataPagamentoRaw) return -1;
    return b.dataPagamentoRaw.localeCompare(a.dataPagamentoRaw);
  });

  return rows;
}
