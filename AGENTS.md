# AGENTS.md

Kontext für AI-Agenten an diesem Projekt.

## Was ist das

MCP-Server gibt MCP-Client (z.B. Claude Code/Desktop) Zugriff auf **Nextcloud Collectives** App (Team-Wikis mit Markdown-Seiten). Läuft lokal per stdio-Transport.

Nutzer-Doku (Setup, Env-Vars, MCP-Client-Konfig, Tool-Liste): siehe [README.md](README.md).

## Architektur

Collectives trennt Metadaten und Inhalt über zwei Nextcloud-APIs, daher zwei Clients:

- **`src/nextcloud/ocsClient.ts`** (`OcsClient`) — JSON-REST gegen `{baseUrl}/ocs/v2.php/apps/collectives/api/v1.0/...` für Collective-/Seiten-/Tag-Metadaten. Entpackt äußere OCS-Envelope (`{ ocs: { meta, data } }`), gibt `data` unverändert zurück. Wirft `OcsError` bei nicht-2xx HTTP-Status.
- **`src/nextcloud/webdavClient.ts`** (`WebdavClient`) — `GET`/`PUT` gegen `{baseUrl}/remote.php/dav/files/{username}/...` für Markdown-Inhalt einer Seite. Wirft `WebdavError` mit Meldungen bei 404/423/507.

**Besonderheiten:**

- **OCS-Endpoints wrappen Antwort unter Ressourcen-Key** — `data` nie nacktes Objekt/Array, sondern z.B. `{ collectives: [...] }`, `{ collective: {...} }`, `{ pages: [...] }`, `{ page: {...} }`, `{ tag: {...}, info: "" }`. Tool-Handler in `collectives.ts`/`pages.ts`/`tags.ts` müssen Key explizit destrukturieren (`const { page } = await ocs.get(...)`). `OcsClient` kennt Keys nicht — verifiziert per PHP-Quellcode von `CollectiveController`/`PageController`/`TagController` im [nextcloud/collectives](https://github.com/nextcloud/collectives)-Repo. Neuer Endpoint = neuen Wrapper-Key nachschauen, nicht raten.
- **`filePath` ist nur Ordnerpfad *innerhalb* Collectives, nie voller Dateipfad** (leer für Seiten auf oberster Ebene). Realer WebDAV-Pfad ist `{collectivePath}/{filePath}/{fileName}` — siehe `src/nextcloud/pagePath.ts` (`resolvePageFilePath`). `collectivePath` sprachabhängig (z.B. `.Kollektive/Engineering` auf deutscher Instanz, nicht `Collectives/Engineering`) — nie hart annehmen, aus API übernehmen.

Tool-Handler (`src/tools/*.ts`) sind reine Funktionen, die `OcsClient`/`WebdavClient`-Instanzen injiziert bekommen (kein Singleton, keine globalen Clients) — in Tests direkt mit echten Client-Instanzen gegen gemockte HTTP-Server (msw) testbar.

`src/tools/toolResult.ts` (`toToolResult`) übersetzt Fehler (`OcsError`, `WebdavError`, andere) in MCP-`CallToolResult` mit `isError: true`. Jeder in `src/tools/index.ts` registrierte Tool-Handler nutzt diese Funktion.

```
src/
  index.ts              # Server-Entry: lädt Config, registriert Tools, startet stdio-Transport
  config.ts             # Env-Var-Validierung (fail fast, siehe loadConfig)
  nextcloud/
    ocsClient.ts         # OCS-REST-Client (entpackt nur die äußere Envelope, nicht den Ressourcen-Key)
    webdavClient.ts       # WebDAV-Client für Seiteninhalt (GET/PUT, kennt keine Pfad-Semantik)
    pagePath.ts            # resolvePageFilePath() — collectivePath+filePath+fileName → WebDAV-Pfad
    types.ts                 # Collective, PageInfo, Tag, JsonValue
  tools/
    collectives.ts        # list/create/delete_collective
    pages.ts               # list/get/create_page, update_page_content, rename/move/delete_page
    tags.ts                 # list/create_tag, add/remove_tag_to/from_page
    toolResult.ts            # Fehler → CallToolResult Mapping
    index.ts                  # registriert alle Tools am McpServer
test/                    # 1:1 Spiegel von src/, vitest
```

## Wichtige Konventionen (bitte einhalten)

- **Kein `any`, kein `unknown`** in `src/` / `test/` — Vorgabe von Projektinhaber. Beliebige JSON-Bodies: Typ `JsonValue` (`src/nextcloud/types.ts`). MCP-Tool-Rückgabetyp: `CallToolResult` direkt aus SDK statt eigenem `unknown`-haltigem Interface.
- **Test-Driven Development (TDD) strikt**: Erst Test schreiben, RED verifizieren, minimalen Code schreiben, GREEN verifizieren. Existierende Tests als Vorlage nutzen.
- **Keine Mock-Objekte für eigene Clients in Tests.** `test/tools/*.test.ts` instanziieren echte `OcsClient`/`WebdavClient`, mocken HTTP per `msw` (`setupServer`, `http.get/post/put/delete`). Umgeht TS-Problem: generische Methoden (`get<T>`, `post<T>`, ...) ohne `any`/`unknown`-Casts faken, testet realistischer.
- **Ein MCP-Tool pro Operation**, keine generischen "call any endpoint"-Tools (siehe Plan-Datei).
- Tool-Handler-Funktionen (`createCollectivesTools`, `createPagesTools`, `createTagsTools`) geben reine Objekte mit async-Methoden zurück, unabhängig von MCP-SDK. `server.registerTool(...)`-Verdrahtung mit Zod-Schemas in `src/tools/index.ts`.

## Befehle

```bash
npm install
npm test           # vitest run — alle Tests
npm run test:watch
npm run coverage    # vitest run --coverage (v8-Provider), Bericht unter coverage/index.html
npm run typecheck   # tsc --noEmit, deckt auch test/ ab (tsconfig include: ["src","test"])
npm run build        # tsup → dist/index.js (+ .d.ts)
npm run dev            # tsx src/index.ts — Server direkt starten (braucht NEXTCLOUD_* Env-Vars)
```

`tsconfig.json` hat kein `rootDir`, damit `tsc --noEmit` auch `test/` einschließt ohne TS6059-Fehler. Build läuft separat über `tsup` (nur `src/index.ts` als Entry), ignoriert `outDir`-Konflikte mit `test/`.