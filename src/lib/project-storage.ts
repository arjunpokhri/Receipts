import { SAMPLE_PROJECT, DEFAULT_CLEAN_PROJECT, type ProjectData } from "./sample-data";

export const RECEIPTS_PROJECTS_KEY = "receipts-custom-projects";
export const RECEIPTS_ACTIVE_PROJECT_KEY = "receipts-active-project-id";

/**
 * Loads all available projects: bundled demo project + any user-created custom projects
 */
export function loadAllProjects(): ProjectData[] {
  if (typeof window === "undefined") {
    return [DEFAULT_CLEAN_PROJECT, SAMPLE_PROJECT];
  }

  try {
    const raw = localStorage.getItem(RECEIPTS_PROJECTS_KEY);
    if (!raw) {
      return [DEFAULT_CLEAN_PROJECT, SAMPLE_PROJECT];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_CLEAN_PROJECT, SAMPLE_PROJECT];
    }
    const hasClean = parsed.some((p) => p.id === DEFAULT_CLEAN_PROJECT.id);
    const hasSample = parsed.some((p) => p.id === SAMPLE_PROJECT.id);
    let result = parsed;
    if (!hasClean) result = [DEFAULT_CLEAN_PROJECT, ...result];
    if (!hasSample) result = [...result, SAMPLE_PROJECT];
    return result;
  } catch {
    return [DEFAULT_CLEAN_PROJECT, SAMPLE_PROJECT];
  }
}

/**
 * Retrieves the currently active project ID, defaulting to SAMPLE_PROJECT.id
 */
export function getActiveProjectId(): string {
  if (typeof window === "undefined") {
    return SAMPLE_PROJECT.id;
  }
  try {
    return localStorage.getItem(RECEIPTS_ACTIVE_PROJECT_KEY) || SAMPLE_PROJECT.id;
  } catch {
    return SAMPLE_PROJECT.id;
  }
}

/**
 * Persists a newly created or updated project to localStorage
 */
export function saveProject(project: ProjectData): ProjectData[] {
  if (typeof window === "undefined") return [project];

  try {
    const current = loadAllProjects();
    const existingIndex = current.findIndex((p) => p.id === project.id);
    let updated: ProjectData[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = project;
    } else {
      updated = [...current, project];
    }

    localStorage.setItem(RECEIPTS_PROJECTS_KEY, JSON.stringify(updated));
    localStorage.setItem(RECEIPTS_ACTIVE_PROJECT_KEY, project.id);
    return updated;
  } catch {
    return [SAMPLE_PROJECT];
  }
}

/**
 * Sets the active project ID in localStorage
 */
export function setActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECEIPTS_ACTIVE_PROJECT_KEY, id);
  } catch {
    // ignore storage exceptions
  }
}
