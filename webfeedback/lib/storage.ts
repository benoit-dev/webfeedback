import type { Annotation } from '../types';

const STORAGE_KEY_PREFIX = 'webfeedback_annotation_';
const STORAGE_KEY_MAPPINGS = 'webfeedback_mappings';

export interface AnnotationMapping {
  elementSelector: string;
  issueNumber: number;
  issueUrl: string;
  createdAt: string;
  pageUrl: string;
}

export function saveAnnotationMapping(mapping: AnnotationMapping): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_KEY_PREFIX}${mapping.elementSelector}_${mapping.pageUrl}`;
  localStorage.setItem(key, JSON.stringify(mapping));

  // Also store in mappings list for easy retrieval
  const mappings = getAllMappings();
  const existingIndex = mappings.findIndex(
    (m) =>
      m.elementSelector === mapping.elementSelector &&
      m.pageUrl === mapping.pageUrl
  );

  if (existingIndex >= 0) {
    mappings[existingIndex] = mapping;
  } else {
    mappings.push(mapping);
  }

  localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(mappings));
}

export function getAnnotationMapping(
  elementSelector: string,
  pageUrl: string
): AnnotationMapping | null {
  if (typeof window === 'undefined') return null;

  const key = `${STORAGE_KEY_PREFIX}${elementSelector}_${pageUrl}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function getAllMappings(): AnnotationMapping[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEY_MAPPINGS);
  return data ? JSON.parse(data) : [];
}

export function getMappingsForPage(pageUrl: string): AnnotationMapping[] {
  return getAllMappings().filter((m) => m.pageUrl === pageUrl);
}

export function removeAnnotationMapping(
  elementSelector: string,
  pageUrl: string
): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_KEY_PREFIX}${elementSelector}_${pageUrl}`;
  localStorage.removeItem(key);

  const mappings = getAllMappings().filter(
    (m) => !(m.elementSelector === elementSelector && m.pageUrl === pageUrl)
  );
  localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(mappings));
}

