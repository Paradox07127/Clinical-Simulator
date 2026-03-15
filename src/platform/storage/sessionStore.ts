/**
 * Generic localStorage persistence wrapper.
 * Domain-agnostic - modules provide their own record types.
 */

const MAX_STORED_ENTRIES = 50;

export function saveToStorage<T>(key: string, data: T): void {
  try {
    const existing = loadFromStorage<T[]>(key) || [];
    const arr = Array.isArray(existing) ? [...existing, data] : [data];
    // Cap storage to prevent unbounded localStorage growth
    const trimmed = arr.slice(-MAX_STORED_ENTRIES);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable
  }
}

export function loadFromStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

export function loadConfig<T>(key: string, defaultValue: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function saveConfig<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Training History
// ---------------------------------------------------------------------------

const TRAINING_HISTORY_KEY = 'training_history';

export interface SessionSummary {
  id: string;
  module: 'INTERVIEW' | 'CPR';
  timestamp: number;
  score: number;
  headline: string;
  caseOrScenarioName: string;
}

export function getRecentSessions(limit: number = 5): SessionSummary[] {
  const all = loadFromStorage<SessionSummary[]>(TRAINING_HISTORY_KEY);
  if (!all || !Array.isArray(all)) return [];
  return all
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function saveInterviewResult(
  caseOrScenarioName: string,
  score: number,
  headline: string,
): void {
  const entry: SessionSummary = {
    id: `interview_${Date.now()}`,
    module: 'INTERVIEW',
    timestamp: Date.now(),
    score,
    headline,
    caseOrScenarioName,
  };
  saveToStorage(TRAINING_HISTORY_KEY, entry);
}

export function saveCprResult(
  caseOrScenarioName: string,
  score: number,
  headline: string,
): void {
  const entry: SessionSummary = {
    id: `cpr_${Date.now()}`,
    module: 'CPR',
    timestamp: Date.now(),
    score,
    headline,
    caseOrScenarioName,
  };
  saveToStorage(TRAINING_HISTORY_KEY, entry);
}
