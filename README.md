# nextcloud-collectives-mcp

Ein MCP-Server (Model Context Protocol) für den Zugriff auf die [Nextcloud Collectives](https://github.com/nextcloud/collectives) App. Damit können MCP-Clients (z.B. Claude Code) Collectives (Team-Wikis), deren Seiten und Tags auflisten, lesen und bearbeiten.

## Voraussetzungen

- Node.js 22+
- Eine Nextcloud-Instanz mit installierter und aktivierter Collectives-App
- Ein App-Passwort für den Nextcloud-Benutzer

## App-Passwort erzeugen

1. In Nextcloud einloggen → **Einstellungen** → **Sicherheit**
2. Unter "Geräte & Sitzungen" ein neues App-Passwort erzeugen (beliebiger Name, z.B. `nextcloud-collectives-mcp`)
3. Das generierte Passwort notieren (wird nur einmal angezeigt)

## Installation & Nutzung

### Methode A: Direkt über `npx` ausführen (Empfohlen)

Es ist kein manuelles Klonen oder Bauen nötig. Der MCP-Server kann direkt über `npx` von GitHub gestartet werden. Fügen Sie dazu einfach den folgenden Eintrag in Ihrer MCP-Client-Konfiguration (z.B. `claude_desktop_config.json` oder per `claude mcp add`) hinzu:

```json
{
  "mcpServers": {
    "nextcloud-collectives": {
      "command": "npx",
      "args": ["-y", "github:BamButz/nextcloud-collectives-mcp"],
      "env": {
        "NEXTCLOUD_BASE_URL": "https://cloud.example.com",
        "NEXTCLOUD_USERNAME": "alice",
        "NEXTCLOUD_APP_PASSWORD": "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
      }
    }
  }
}
```

*Hinweis: Beim Start lädt `npx` das Repository herunter und baut es automatisch über das `prepare`-Skript im Hintergrund.*

### Methode B: Manuelle lokale Installation (z.B. für Entwicklung)

1. Repository klonen und in den Ordner wechseln.
2. Abhängigkeiten installieren und bauen:
   ```bash
   npm install
   npm run build
   ```
3. In der MCP-Server-Konfiguration eintragen:
   ```json
   {
     "mcpServers": {
       "nextcloud-collectives-local": {
         "command": "node",
         "args": ["/pfad/zu/nextcloud-collectives-mcp/dist/index.js"],
         "env": {
           "NEXTCLOUD_BASE_URL": "https://cloud.example.com",
           "NEXTCLOUD_USERNAME": "alice",
           "NEXTCLOUD_APP_PASSWORD": "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
         }
       }
     }
   }
   ```

## Verfügbare Tools

**Collectives**
- `list_collectives` — alle sichtbaren Collectives auflisten
- `create_collective` — neues Collective anlegen
- `delete_collective` — Collective in den Papierkorb verschieben

**Seiten**
- `list_pages` — vollständigen Seitenbaum eines Collectives auflisten (nur Metadaten)
- `get_page` — Metadaten und Markdown-Inhalt einer Seite abrufen
- `create_page` — neue Seite unter einer übergeordneten Seite anlegen
- `update_page_content` — Markdown-Inhalt einer Seite ersetzen
- `rename_page` — Seite umbenennen
- `move_page` — Seite zu einer neuen übergeordneten Seite verschieben
- `delete_page` — Seite in den Papierkorb verschieben

**Tags**
- `list_tags` — alle Tags eines Collectives auflisten
- `create_tag` — neuen Tag anlegen
- `add_tag_to_page` — Tag an eine Seite anhängen
- `remove_tag_from_page` — Tag von einer Seite entfernen

## Entwicklung

```bash
npm test          # Tests einmalig ausführen
npm run test:watch
npm run coverage   # Tests + Code-Coverage-Bericht (Text + HTML unter coverage/index.html)
npm run typecheck
npm run dev        # Server direkt mit tsx starten (liest Env-Vars aus der Shell)
```

## Implementierungshinweis

Dieses Projekt wurde vollständig mithilfe von Künstlicher Intelligenz (**Gemini 3.5 (Flash)**) von Google DeepMind im Rahmen eines agentischen Coding-Workflows implementiert und getestet.