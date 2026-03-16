import { listMemoryFiles } from "./internal.js";

export type GraphEntityKind = "person" | "project" | "preference";

export type GraphEntity = {
  id: string;
  kind: GraphEntityKind;
  name: string;
  mentions: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  relation: "associated_with";
  weight: number;
};

export type MemoryGraphEvent = {
  id: string;
  path: string;
  line: number;
  text: string;
  date?: string;
  entities: Array<{ id: string; kind: GraphEntityKind; name: string }>;
  causal?: {
    cause: string;
    effect: string;
    connector: string;
    confidence: number;
  };
};

export type MemoryKnowledgeGraph = {
  workspaceDir: string;
  nodes: GraphEntity[];
  edges: GraphEdge[];
  events: MemoryGraphEvent[];
};

const TAGGED_ENTITY_RE = /\[\[(person|project|preference):([^\]]+)\]\]/gi;
const DATE_INLINE_RE = /\b(20\d{2}-\d{2}-\d{2})\b/;
const DATE_PATH_RE = /(?:^|\/)memory\/(20\d{2}-\d{2}-\d{2})\.md$/i;

const LABELED_PATTERNS: Array<{ kind: GraphEntityKind; re: RegExp }> = [
  { kind: "person", re: /(?:^|\s)(?:person|people|contact|人脉|联系人)\s*[:：]\s*([^,，。;；]+)/i },
  { kind: "project", re: /(?:^|\s)(?:project|项目)\s*[:：]\s*([^,，。;；]+)/i },
  { kind: "preference", re: /(?:^|\s)(?:preference|偏好)\s*[:：]\s*([^,，。;；]+)/i },
];

const CAUSE_THEN_EFFECT_PATTERNS: Array<{ re: RegExp; connector: string; confidence: number }> = [
  {
    re: /(.+?)\s*(?:led to|resulted in|caused|triggered|导致|引发)\s*(.+)/i,
    connector: "cause_to_effect",
    confidence: 0.82,
  },
  {
    re: /因为\s*(.+?)\s*[，,。\s]*所以\s*(.+)/i,
    connector: "because_so",
    confidence: 0.92,
  },
];

const EFFECT_THEN_CAUSE_PATTERNS: Array<{ re: RegExp; connector: string; confidence: number }> = [
  {
    re: /(.+?)\s*(?:because|due to|因为|由于)\s*(.+)/i,
    connector: "effect_because_cause",
    confidence: 0.76,
  },
];

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function entityId(kind: GraphEntityKind, name: string): string {
  return `${kind}:${normalizeName(name).toLowerCase()}`;
}

function normalizeRelPath(workspaceDir: string, absPath: string): string {
  const normalizedRoot = workspaceDir.replace(/\\/g, "/").replace(/\/$/, "");
  const normalizedAbs = absPath.replace(/\\/g, "/");
  if (normalizedAbs.startsWith(`${normalizedRoot}/`)) {
    return normalizedAbs.slice(normalizedRoot.length + 1);
  }
  return normalizedAbs;
}

function extractDate(relPath: string, line: string): string | undefined {
  const pathMatch = relPath.match(DATE_PATH_RE);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }
  const inlineMatch = line.match(DATE_INLINE_RE);
  return inlineMatch?.[1];
}

function extractEntities(line: string): Array<{ kind: GraphEntityKind; name: string }> {
  const entities: Array<{ kind: GraphEntityKind; name: string }> = [];
  const seen = new Set<string>();

  for (const match of line.matchAll(TAGGED_ENTITY_RE)) {
    const kind = (match[1] ?? "").toLowerCase() as GraphEntityKind;
    const name = normalizeName(match[2] ?? "");
    if (!name) {
      continue;
    }
    const key = `${kind}:${name.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entities.push({ kind, name });
  }

  for (const pattern of LABELED_PATTERNS) {
    const labelMatch = line.match(pattern.re);
    const rawName = normalizeName(labelMatch?.[1] ?? "");
    if (!rawName) {
      continue;
    }
    const key = `${pattern.kind}:${rawName.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entities.push({ kind: pattern.kind, name: rawName });
  }

  return entities;
}

function extractCausal(line: string):
  | {
      cause: string;
      effect: string;
      connector: string;
      confidence: number;
    }
  | undefined {
  for (const pattern of CAUSE_THEN_EFFECT_PATTERNS) {
    const match = line.match(pattern.re);
    if (!match) {
      continue;
    }
    const cause = normalizeName(match[1] ?? "");
    const effect = normalizeName(match[2] ?? "");
    if (cause && effect) {
      return { cause, effect, connector: pattern.connector, confidence: pattern.confidence };
    }
  }

  for (const pattern of EFFECT_THEN_CAUSE_PATTERNS) {
    const match = line.match(pattern.re);
    if (!match) {
      continue;
    }
    const effect = normalizeName(match[1] ?? "");
    const cause = normalizeName(match[2] ?? "");
    if (cause && effect) {
      return { cause, effect, connector: pattern.connector, confidence: pattern.confidence };
    }
  }

  return undefined;
}

export async function buildMemoryKnowledgeGraph(params: {
  workspaceDir: string;
  readFile: (relPath: string) => Promise<string>;
}): Promise<MemoryKnowledgeGraph> {
  const files = await listMemoryFiles(params.workspaceDir);

  const nodeMap = new Map<string, GraphEntity>();
  const edgeMap = new Map<string, GraphEdge>();
  const events: MemoryGraphEvent[] = [];

  for (const absPath of files) {
    const relPath = normalizeRelPath(params.workspaceDir, absPath);
    let text = "";
    try {
      text = await params.readFile(relPath);
    } catch {
      continue;
    }

    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index] ?? "";
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const entities = extractEntities(line);
      const causal = extractCausal(line);
      const date = extractDate(relPath, line);
      const lineNo = index + 1;

      const eventEntities = entities.map((entry) => {
        const id = entityId(entry.kind, entry.name);
        const existing = nodeMap.get(id);
        if (existing) {
          existing.mentions += 1;
        } else {
          nodeMap.set(id, {
            id,
            kind: entry.kind,
            name: entry.name,
            mentions: 1,
          });
        }
        return { id, kind: entry.kind, name: entry.name };
      });

      for (let left = 0; left < eventEntities.length; left += 1) {
        for (let right = left + 1; right < eventEntities.length; right += 1) {
          const a = eventEntities[left].id;
          const b = eventEntities[right].id;
          const from = a < b ? a : b;
          const to = a < b ? b : a;
          const key = `${from}::${to}`;
          const existing = edgeMap.get(key);
          if (existing) {
            existing.weight += 1;
          } else {
            edgeMap.set(key, { from, to, relation: "associated_with", weight: 1 });
          }
        }
      }

      events.push({
        id: `${relPath}#L${lineNo}`,
        path: relPath,
        line: lineNo,
        text: line,
        date,
        entities: eventEntities,
        causal,
      });
    }
  }

  return {
    workspaceDir: params.workspaceDir,
    nodes: [...nodeMap.values()].toSorted(
      (a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name),
    ),
    edges: [...edgeMap.values()].toSorted((a, b) => b.weight - a.weight),
    events: events.toSorted((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      if (da !== db) {
        return da.localeCompare(db);
      }
      if (a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }
      return a.line - b.line;
    }),
  };
}

export function queryTimeline(params: {
  graph: MemoryKnowledgeGraph;
  subject?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
}): MemoryGraphEvent[] {
  const subject = normalizeName(params.subject ?? "").toLowerCase();
  const entityTypeRaw = normalizeName(params.entityType ?? "").toLowerCase();
  const from = normalizeName(params.from ?? "");
  const to = normalizeName(params.to ?? "");
  const limit = Number.isFinite(params.limit)
    ? Math.max(1, Math.min(200, Number(params.limit)))
    : 30;

  const filtered = params.graph.events.filter((event) => {
    if (from && event.date && event.date < from) {
      return false;
    }
    if (to && event.date && event.date > to) {
      return false;
    }
    if (entityTypeRaw) {
      const hasKind = event.entities.some((entry) => entry.kind === entityTypeRaw);
      if (!hasKind) {
        return false;
      }
    }
    if (!subject) {
      return true;
    }
    const inText = event.text.toLowerCase().includes(subject);
    const inEntity = event.entities.some((entry) => entry.name.toLowerCase().includes(subject));
    return inText || inEntity;
  });

  return filtered.slice(-limit).toReversed();
}

export type CausalQueryMatch = {
  cause: string;
  effect: string;
  connector: string;
  confidence: number;
  path: string;
  line: number;
  date?: string;
  snippet: string;
};

export function queryCausality(params: {
  graph: MemoryKnowledgeGraph;
  effect: string;
  limit?: number;
}): CausalQueryMatch[] {
  const effectNeedle = normalizeName(params.effect).toLowerCase();
  const limit = Number.isFinite(params.limit)
    ? Math.max(1, Math.min(100, Number(params.limit)))
    : 20;

  const matches = params.graph.events
    .filter((event) => event.causal)
    .map((event) => ({ event, causal: event.causal! }))
    .filter(({ event, causal }) => {
      const effectText = causal.effect.toLowerCase();
      const eventText = event.text.toLowerCase();
      return effectText.includes(effectNeedle) || eventText.includes(effectNeedle);
    })
    .map(({ event, causal }) => ({
      cause: causal.cause,
      effect: causal.effect,
      connector: causal.connector,
      confidence: causal.confidence,
      path: event.path,
      line: event.line,
      date: event.date,
      snippet: event.text,
    }))
    .toSorted((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      if (da !== db) {
        return db.localeCompare(da);
      }
      return b.line - a.line;
    });

  return matches.slice(0, limit);
}
