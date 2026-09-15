// Figli duplicati (M11.3b): criteri puri, usati dal server. Due schede dello
// stesso genitore sono possibili duplicati se hanno lo stesso codice fiscale,
// oppure lo stesso nome, cognome e data di nascita. I gruppi sono transitivi:
// se A somiglia a B e B a C, A, B e C stanno nello stesso gruppo.

export type ChildCandidate = {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  fiscalCode: string | null;
  createdAt: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function fiscalKey(child: ChildCandidate): string | null {
  const cf = (child.fiscalCode ?? "").trim().toUpperCase();
  return cf ? `${child.parentId}|cf|${cf}` : null;
}

export function identityKey(child: ChildCandidate): string {
  return `${child.parentId}|id|${normalizeText(child.firstName)}|${normalizeText(child.lastName)}|${child.birthDate}`;
}

// Restituisce solo i gruppi con almeno due schede, ordinate dalla più vecchia.
export function findDuplicateGroups<T extends ChildCandidate>(children: T[]): T[][] {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // compressione del percorso
    let node = id;
    while (parent.get(node) !== root) {
      const next = parent.get(node)!;
      parent.set(node, root);
      node = next;
    }
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const c of children) parent.set(c.id, c.id);

  const firstByKey = new Map<string, string>();
  for (const c of children) {
    for (const key of [fiscalKey(c), identityKey(c)]) {
      if (!key) continue;
      const seen = firstByKey.get(key);
      if (seen) union(seen, c.id);
      else firstByKey.set(key, c.id);
    }
  }

  const groups = new Map<string, T[]>();
  for (const c of children) {
    const root = find(c.id);
    const list = groups.get(root) ?? [];
    list.push(c);
    groups.set(root, list);
  }

  return [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => [...g].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}
