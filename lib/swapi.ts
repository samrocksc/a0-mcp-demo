// The data plane: reads against swapi.info, now served from inside the Next app.
// swapi.info is the maintained Star Wars API mirror. It has no native search,
// so searchPeople fetches the full roster once and filters locally.

const BASE = process.env.SWAPI_BASE ?? "https://swapi.info/api";

export interface Person {
  name: string;
  height: string;
  mass: string;
  homeworld: string;
  films: string[];
  url: string;
}

export interface Film {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  release_date: string;
  url: string;
}

export interface Planet {
  name: string;
  diameter: string;
  climate: string;
  terrain: string;
  population: string;
  url: string;
}

export interface PersonRef {
  id: number;
  name: string;
}

const cache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 60_000;

async function fetchJson<T>(path: string): Promise<T> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && now - hit.at < TTL_MS) {
    return hit.body as T;
  }

  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`SWAPI ${path} returned ${res.status}`);
  }
  const body = (await res.json()) as T;
  cache.set(path, { at: now, body });
  return body;
}

const idFromUrl = (url: string): number => Number(url.match(/\/(\d+)$/)?.[1]);

export async function getPerson(id: number): Promise<Person> {
  return fetchJson<Person>(`/people/${id}`);
}

export async function getFilm(id: number): Promise<Film> {
  return fetchJson<Film>(`/films/${id}`);
}

export async function getPlanet(id: number): Promise<Planet> {
  return fetchJson<Planet>(`/planets/${id}`);
}

export async function searchPeople(term: string): Promise<PersonRef[]> {
  const all = await fetchJson<Person[]>("/people");
  const q = term.trim().toLowerCase();
  return all
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 8)
    .map((p) => ({ id: idFromUrl(p.url), name: p.name }));
}