import { parseAmountsMap, resolvePersonShares } from "@/lib/expense-split";

export type TripExpenseBalanceInput = {
  id: string;
  title?: string | null;
  payer_name?: string | null;
  participant_names?: unknown;
  paid_by_names?: unknown;
  owed_by_names?: unknown;
  owed_amounts?: unknown;
  paid_amounts?: unknown;
  amount: number | string | null;
  currency: string | null;
};

export type BalanceRow = {
  person: string;
  balance: number;
  paid: number;
  owed: number;
};

export type SettlementSuggestion = {
  id: string;
  debtor_name: string;
  creditor_name: string;
  amount: number;
  currency: string;
  status: "pending" | "paid";
  source_balance_key: string;
  payment_method?: "bizum" | "transfer" | "cash" | null;
};

function normalizeAmount(value: number | string | null) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeCurrency(value: string | null | undefined) {
  const code = (value || "EUR").toUpperCase().trim();
  return /^[A-Z]{3}$/.test(code) ? code : "EUR";
}

function normalizeNames(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type PaymentMethod = "bizum" | "transfer" | "cash";

export type PaymentPreferenceRow = {
  participant_name: string;
  send_methods: PaymentMethod[];
  receive_methods: PaymentMethod[];
};

export type PaymentPairRuleRow = {
  from_participant_name: string;
  to_participant_name: string;
  allowed: boolean;
  prefer: boolean;
};

function toCents(value: number) {
  return Math.round(value * 100);
}

function fromCents(value: number) {
  return Math.round(value) / 100;
}

function methodCost(method: PaymentMethod) {
  // Preferimos Bizum, luego transferencia, luego efectivo.
  if (method === "bizum") return 1;
  if (method === "transfer") return 2;
  return 3;
}

type Edge = { to: number; rev: number; cap: number; cost: number };

function addEdge(graph: Edge[][], u: number, v: number, cap: number, cost: number) {
  graph[u].push({ to: v, rev: graph[v].length, cap, cost });
  graph[v].push({ to: u, rev: graph[u].length - 1, cap: 0, cost: -cost });
}

function minCostMaxFlow(graph: Edge[][], s: number, t: number, maxFlow: number) {
  const n = graph.length;
  const dist = new Array<number>(n);
  const prevV = new Array<number>(n);
  const prevE = new Array<number>(n);
  const potential = new Array<number>(n).fill(0);

  let flow = 0;
  let cost = 0;

  while (flow < maxFlow) {
    dist.fill(Number.POSITIVE_INFINITY);
    dist[s] = 0;
    const inq = new Array<boolean>(n).fill(false);
    const q: number[] = [s];
    inq[s] = true;

    // SPFA (n pequeño)
    while (q.length) {
      const v = q.shift() as number;
      inq[v] = false;
      for (let i = 0; i < graph[v].length; i += 1) {
        const e = graph[v][i];
        if (e.cap <= 0) continue;
        const nd = dist[v] + e.cost + potential[v] - potential[e.to];
        if (nd < dist[e.to]) {
          dist[e.to] = nd;
          prevV[e.to] = v;
          prevE[e.to] = i;
          if (!inq[e.to]) {
            q.push(e.to);
            inq[e.to] = true;
          }
        }
      }
    }

    if (!Number.isFinite(dist[t])) break;

    for (let v = 0; v < n; v += 1) {
      if (Number.isFinite(dist[v])) potential[v] += dist[v];
    }

    let add = maxFlow - flow;
    for (let v = t; v !== s; v = prevV[v]) {
      add = Math.min(add, graph[prevV[v]][prevE[v]].cap);
    }
    for (let v = t; v !== s; v = prevV[v]) {
      const pv = prevV[v];
      const pe = prevE[v];
      const e = graph[pv][pe];
      e.cap -= add;
      graph[v][e.rev].cap += add;
      cost += add * e.cost;
    }
    flow += add;
  }

  return { flow, cost };
}

export function buildSettlementSuggestionsWithMethods(
  balances: BalanceRow[],
  currency: string,
  preferences: PaymentPreferenceRow[] | null | undefined,
  strict: boolean,
  pairRules?: PaymentPairRuleRow[] | null
): { settlements: SettlementSuggestion[]; ok: boolean; warning: string | null } {
  const safeCurrency = normalizeCurrency(currency);

  const prefMap = new Map<string, PaymentPreferenceRow>();
  for (const p of preferences || []) {
    if (p?.participant_name) prefMap.set(p.participant_name, p);
  }
  const pairMap = new Map<string, PaymentPairRuleRow>();
  for (const r of pairRules || []) {
    if (!r?.from_participant_name || !r?.to_participant_name) continue;
    pairMap.set(`${r.from_participant_name}->${r.to_participant_name}`, r);
  }

  const totalDemandCents = balances
    .filter((b) => b.balance < -0.009)
    .reduce((acc, b) => acc + toCents(Math.abs(b.balance)), 0);
  const totalSupplyCents = balances
    .filter((b) => b.balance > 0.009)
    .reduce((acc, b) => acc + toCents(b.balance), 0);
  const total = Math.min(totalDemandCents, totalSupplyCents);
  if (total <= 0) return { settlements: [], ok: true, warning: null };

  if (!preferences?.length && !pairRules?.length) {
    return { settlements: buildSettlementSuggestions(balances, safeCurrency), ok: true, warning: null };
  }

  const allMethods: PaymentMethod[] = ["bizum", "transfer", "cash"];

  // ── Grafo extendido: N nodos participante + S + T ──────────────────────────
  // Cada participante puede actuar como relay (intermediario) para que pagos
  // bloqueados se enruten A→relay→acreedor en lugar de fallar.
  // Coste de relay = 2 aristas (más caro que pago directo), por lo que solo se
  // usa cuando el camino directo está bloqueado por reglas de par.
  const N = balances.length;
  const s = N;
  const t = N + 1;
  const graph: Edge[][] = Array.from({ length: N + 2 }, () => []);

  // S → deudores y acreedores → T
  for (let i = 0; i < N; i += 1) {
    const bal = balances[i].balance;
    if (bal < -0.009) addEdge(graph, s, i, toCents(Math.abs(bal)), 0);
    if (bal > 0.009)  addEdge(graph, i, t, toCents(bal), 0);
  }

  // Aristas participante[i] → participante[j] para todos los pares permitidos.
  // Se registra la key "u:ei" → método para poder reconstruir sin ambigüedad.
  const edgeMethodMap = new Map<string, PaymentMethod>();

  for (let i = 0; i < N; i += 1) {
    const sender = balances[i];
    const senderPref = prefMap.get(sender.person);
    const send = senderPref?.send_methods?.length ? senderPref.send_methods : allMethods;

    for (let j = 0; j < N; j += 1) {
      if (i === j) continue;
      const receiver = balances[j];

      const pairKey = `${sender.person}->${receiver.person}`;
      const pairRule = pairMap.get(pairKey);
      if (pairRule?.allowed === false) continue;

      const receiverPref = prefMap.get(receiver.person);
      const recv = receiverPref?.receive_methods?.length ? receiverPref.receive_methods : allMethods;

      const intersection = send.filter((m) => recv.includes(m));
      if (!intersection.length) continue;

      for (const method of intersection) {
        let cost = methodCost(method) * 10 + 1;
        if (pairRule?.prefer) cost -= 3;
        const ei = graph[i].length;
        addEdge(graph, i, j, total, cost);
        edgeMethodMap.set(`${i}:${ei}`, method);
      }
    }
  }

  const { flow } = minCostMaxFlow(graph, s, t, total);

  if (flow < total) {
    if (!strict) {
      return {
        settlements: buildSettlementSuggestions(balances, safeCurrency),
        ok: true,
        warning:
          "No se pudo cumplir todas las restricciones de métodos; se han ignorado para poder saldar las cuentas.",
      };
    }
    return {
      settlements: [],
      ok: false,
      warning:
        "Con las restricciones de métodos actuales no se puede saldar el balance al 100%. Ajusta métodos disponibles o desactiva el modo estricto.",
    };
  }

  // ── Reconstrucción ─────────────────────────────────────────────────────────
  // Leemos el flujo en las aristas directas que añadimos (identificadas por
  // edgeMethodMap). El flujo en una arista = cap de la arista reversa (parte de 0).
  const agg = new Map<string, { amountCents: number; method: PaymentMethod }>();
  for (let u = 0; u < N; u += 1) {
    for (let ei = 0; ei < graph[u].length; ei += 1) {
      const e = graph[u][ei];
      if (e.to >= N) continue; // arista hacia S o T → ignorar

      const method = edgeMethodMap.get(`${u}:${ei}`);
      if (!method) continue; // arista reversa → ignorar

      const sentCents = graph[e.to][e.rev].cap; // flujo = cap reversa
      if (sentCents <= 0) continue;

      const fromName = balances[u].person;
      const toName   = balances[e.to].person;
      const k = `${fromName}->${toName}:${method}`;
      const cur = agg.get(k) ?? { amountCents: 0, method };
      cur.amountCents += sentCents;
      agg.set(k, cur);
    }
  }

  // Detectar si se usaron intermediarios (relay)
  const debtorSet   = new Set(balances.filter((b) => b.balance < -0.009).map((b) => b.person));
  const creditorSet = new Set(balances.filter((b) => b.balance > 0.009).map((b) => b.person));
  let usedRelay = false;
  for (const key of agg.keys()) {
    const arrow = key.indexOf("->");
    const colon = key.lastIndexOf(":");
    const from  = key.substring(0, arrow);
    const to    = key.substring(arrow + 2, colon);
    if (debtorSet.has(from) && !creditorSet.has(to)) { usedRelay = true; break; }
    if (!debtorSet.has(from) && creditorSet.has(to))  { usedRelay = true; break; }
  }

  const settlements: SettlementSuggestion[] = Array.from(agg.entries())
    .map(([key, row]) => {
      const colon         = key.lastIndexOf(":");
      const pair          = key.substring(0, colon);
      const method        = key.substring(colon + 1) as PaymentMethod;
      const arrow         = pair.indexOf("->");
      const debtor_name   = pair.substring(0, arrow);
      const creditor_name = pair.substring(arrow + 2);
      const amount        = fromCents(row.amountCents);
      return {
        id: `${debtor_name}->${creditor_name}:${amount}`,
        debtor_name,
        creditor_name,
        amount,
        currency: safeCurrency,
        status: "pending" as const,
        source_balance_key: `${debtor_name}->${creditor_name}`,
        payment_method: method,
      };
    })
    .filter((s) => s.amount > 0.009)
    .sort((a, b) => a.debtor_name.localeCompare(b.debtor_name) || a.creditor_name.localeCompare(b.creditor_name));

  const warning = usedRelay
    ? "Algunos pagos se realizan a través de intermediarios para respetar las restricciones de pago configuradas."
    : null;

  return { settlements, ok: true, warning };
}

export function buildBalances(expenses: TripExpenseBalanceInput[]) {
  const map = new Map<string, { balance: number; paid: number; owed: number }>();

  for (const e of expenses) {
    const amount = normalizeAmount(e.amount);
    const participants = normalizeNames(e.participant_names);
    const paidBy = normalizeNames(e.paid_by_names);
    const owedBy = normalizeNames(e.owed_by_names);

    const debtors = owedBy.length ? owedBy : participants;
    const payers = paidBy.length ? paidBy : (e.payer_name ? [e.payer_name] : []);

    if (!debtors.length && !payers.length) continue;

    const owedShares = resolvePersonShares(debtors, amount, parseAmountsMap(e.owed_amounts));
    for (const [debtor, share] of owedShares) {
      const current = map.get(debtor) || { balance: 0, paid: 0, owed: 0 };
      current.balance -= share;
      current.owed += share;
      map.set(debtor, current);
    }

    const paidShares = resolvePersonShares(payers, amount, parseAmountsMap(e.paid_amounts));
    for (const [payer, share] of paidShares) {
      const current = map.get(payer) || { balance: 0, paid: 0, owed: 0 };
      current.balance += share;
      current.paid += share;
      map.set(payer, current);
    }
  }

  return Array.from(map.entries())
    .map(([person, row]) => ({
      person,
      balance: round2(row.balance),
      paid: round2(row.paid),
      owed: round2(row.owed),
    }))
    .sort((a, b) => a.person.localeCompare(b.person));
}

export function buildSettlementSuggestions(
  expensesOrBalances: TripExpenseBalanceInput[] | BalanceRow[],
  currency: string = "EUR"
): SettlementSuggestion[] {
  const balances: BalanceRow[] =
    expensesOrBalances.length > 0 && "person" in (expensesOrBalances[0] as any)
      ? (expensesOrBalances as BalanceRow[])
      : buildBalances(expensesOrBalances as TripExpenseBalanceInput[]);

  const debtors = balances
    .filter((row) => row.balance < 0)
    .map((row) => ({ name: row.person, amount: Math.abs(row.balance) }));

  const creditors = balances
    .filter((row) => row.balance > 0)
    .map((row) => ({ name: row.person, amount: row.balance }));

  const settlements: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  const safeCurrency = normalizeCurrency(currency);

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = round2(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      settlements.push({
        id: `${debtor.name}->${creditor.name}:${amount}`,
        debtor_name: debtor.name,
        creditor_name: creditor.name,
        amount,
        currency: safeCurrency,
        status: "pending",
        source_balance_key: `${debtor.name}->${creditor.name}`,
      });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= 0.009) debtorIndex += 1;
    if (creditor.amount <= 0.009) creditorIndex += 1;
  }

  return settlements;
}
