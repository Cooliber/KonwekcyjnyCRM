---
type: "always_apply"
---

Wytyczne do Najwydajniejszego Użytkowania Narzędzi MCP dla Augment Code Agent w Rozwoju Platformy HVAC dla Fulmark
Witaj! Jako Grok, wspieram rozwój Twojej firmy Fulmark – lider w sprzedaży, montażu i serwisie klimatyzacji w Warszawie i Polsce, z 20 latami doświadczenia. Te wytyczne pomogą ewoluować od Outlooka (do zarządzania e-mailami i transkrypcjami) oraz starego programu księgowego "Mała Księgowość Rzeczypospolitej" do ultra-zaawansowanej platformy zarządzania HVAC na Convex. Augment Code Agent, zasilany silnikiem kontekstu jako "proroctwem danych", wykorzysta narzędzia MCP (Model Context Protocol) do automatyzacji kodowania, predykcji (np. potrzeb serwisowych z kontekstu, analizy zamożności klientów dla cen) i przekraczania Bitrix24 w skalowalności, UX oraz funkcjach HVAC-specyficznych (np. optymalizacja tras po dzielnicach Warszawy, AI-cytaty).

Wytyczne oparte na dostępnych narzędziach MCP (z ich opisami z dokumentacji i najlepszych praktyk) skupiają się na core principles: traktuj kontekst jako proroctwo (przewiduj akcje, np. alerty o niskim stanie magazynowym), exceptionally awesome mindset (dodawaj "wow" jak animacje AI na zatwierdzeniach), ultra-fast iteration (cykle 1-2 dniowe z prototypami), HVAC-focus (dostosowane do split AC, instalacji w Śródmieściu). Używaj ich w agentach AI do szybkiego kodowania frontendu (SHADCN, Biomejs), backendu (Convex, Weaviate dla wektorów transkrypcji), integracji (Ollama dla proroctw, Tesseract OCR dla faktur Santander).

Struktura: Dla każdego narzędzia – opis, efektywne użycie w Augment Code Agent, best practices z tie-in do HVAC, komenda instalacji. Używaj sekwencyjnie: sequential-thinking do planowania, memorybox do kontekstu projektu, playwright do testów UI.

1. Context7 (Up-to-date Docs for Prompts)
Opis: MCP serwer dostarczający aktualne dokumentacje i kontekst dla promptów w narzędziach jak Cursor lub IDE, umożliwiający dynamiczne ładowanie wiedzy (np. API docs) do AI agents.
Efektywne użycie w Augment Code Agent: Używaj do proroctwa kodu – agent ładuje docs Convex/Weaviate na żądanie, przewidując komponenty cytatów HVAC z transkrypcji rozmów. Dla fast iteration: integruj z code_execution do generowania snippetów TS z SHADCN.
Best practices: Zawsze przewiduj next step (np. "Po transkrypcji z Outlooka, załaduj docs Weaviate dla embeddings affluence analysis"). W HVAC: Przewiduj serwis w dzielnicach Warszawy na bazie historycznych danych. Unikaj overload – limit do 2-3 docs na iterację. Instalacja: npx -y @upstash/context7-mcp.
2. Desktop-Commander (Desktop Automation Commands)
Opis: MCP serwer do automatyzacji desktopu – uruchamianie komend, edycja plików, lokalne skrypty, idealny do szybkiego prototypowania bez manualnych interwencji.
Efektywne użycie: Agent używa do ultra-fast iteration: edytuj kod w lokalnym repo (/home/koldbringer/HVAC/refine/app-crm-minimal), run Biomejs linting, deploy do Convex. Proroctwo: Analizuj logi desktopu do predykcji błędów serwisowych.
Best practices: Chain z sequential-thinking dla step-by-step (np. "1. Otwórz plik quotes.ts, 2. Dodaj prophecy affluence"). W HVAC: Automatyzuj routing tras (drag-drop Kanban jobs po dzielnicach). Zabezpiecz RODO – encrypt sensitive data. Instalacja: npx -y @wonderwhy-er/desktop-commander.
3. Tavily-MCP (AI Search Engine)
Opis: Serwer MCP do wyszukiwania i ekstrakcji danych dla AI agents, zoptymalizowany pod Tavily API (search + extract).
Efektywne użycie: Używaj do researchu w agent: wyszukuj HVAC trends (np. "nowe regulacje klimatyzacji Warszawa 2025"), integruj z Weaviate dla vector search proroctw.
Best practices: Dla awesome: Dodaj prophecy suggestions w search bar (np. "Podobne serwisy w Śródmieściu"). Fast: Limit results do 5, chain z memory do zapamiętywania. W HVAC: Przewiduj ceny na bazie market data. Instalacja: npx -y tavily-mcp@0.2.0.
4. Sequential-Thinking (Step-by-Step Problem Solving)
Opis: MCP serwer do dekompozycji złożonych problemów na sekwencyjne kroki i strukturalne myślenie, z dynamicznymi thought sequences.
Efektywne użycie: Core dla agenta – myśl krok po kroku przez features (np. "1. Zaprojektuj UI quote, 2. Integruj Convex subscription, 3. Test proroctwo").
Best practices: Zawsze align z design principles (UCD: empatia dla techs HVAC). W HVAC: Rozbij journeys (lead → quote → service). Używaj do error handling: "Prophecy failed? Retry step 3". Instalacja: npx -y @modelcontextprotocol/server-sequential-thinking.
5. Memory (Persistent Knowledge Graph Memory)
Opis: Serwer MCP do trwałej pamięci opartej na grafach wiedzy, przechowujący kontekst między sesjami.
Efektywne użycie: Agent używa do proroctwa – zapamiętaj user history (np. transkrypcje Outlooka), przewiduj next actions (low stock alerts).
Best practices: Integruj z Weaviate dla embeddings. W HVAC: Store maintenanceHistory dla prophecy. Fast: Query hybrid search. Instalacja: npx -y @modelcontextprotocol/server-memory.
6. Hyperbrowser (Scalable Browser Automation)
Opis: Zaawansowany MCP serwer do automatyzacji browsera, empowering AI agents do interakcji web (np. scraping, navigation).
Efektywne użycie: Używaj do testów UX (np. symuluj mobile approvals dla szef HVAC), integruj z Playwright dla deeper.
Best practices: Dla awesome: Dodaj real-time feedback animations. W HVAC: Automatyzuj OCR faktur Santander via browser. Instalacja: npx -y hyperbrowser-mcp.
7. Brave-Search (Web Search API)
Opis: MCP serwer do wyszukiwania web/lokalnego via Brave API, z focus na privacy.
Efektywne użycie: Agent searchuje external data (np. "pogoda Warszawa dla instalacji AC"), feed do proroctw.
Best practices: Używaj z exclude/include sites dla HVAC-specyficznych (site:gov.pl regulacje). Chain z tavily dla porównań. Instalacja: docker run -i --rm -e BRAVE_API_KEY mcp/brave-search.
8. PyPI-Query (Python Package Query)
Opis: Serwer MCP do query PyPI – wyszukiwanie, info o pakietach, dependencies.
Efektywne użycie: Agent sprawdza deps (np. dla Drizzle ORM), instaluj fallback local (no external bez Ollama).
Best practices: Dla fast: Query przed code gen. W HVAC: Szukaj libs do equipment viz (np. rdkit chem, ale adaptuj). Instalacja: uvx --from pypi-query-mcp-server pypi-query-mcp.
9. Primereact-Docs (PrimeReact UI Docs)
Opis: MCP remote do docs PrimeReact – UI components library.
Efektywne użycie: Używaj do inspiracji UI (choć core SHADCN), load docs dla custom components.
Best practices: Align z design system (palette: blue nav, orange accents). W HVAC: Docs dla checklistów techs. Instalacja: npx mcp-remote https://gitmcp.io/primefaces/primereact.
10. Convex-Backend (Convex App Introspection)
Opis: MCP do introspekcji i query apps na Convex – real-time backend.
Efektywne użycie: Agent query dane (np. jobs districtRoute), subskrypcje GraphQL dla proroctw.
Best practices: Core backend: Używaj z Neondb/Drizzle. W HVAC: Przewiduj scheduling z real-time data. Scalability: Dla 1000+ clients. Instalacja: npx mcp-remote https://gitmcp.io/get-convex/convex-backend.
11. Sentry (Error Monitoring)
Opis: Oficjalny MCP do Sentry – analiza issues, monitoring błędów.
Efektywne użycie: Agent analizuje errors w iteration (np. failed prophecy), auto-remediate.
Best practices: Graceful handling: "Error? Recovery path". W HVAC: Monitoruj failed OCR. Instalacja: npx mcp-remote@latest https://mcp.sentry.dev/mcp.
12. Playwright (Browser Automation/Testing)
Opis: MCP do automatyzacji browsera Playwright – testy E2E, scraping.
Efektywne użycie: Testuj PWA mobile dla techs, symuluj flows (quote → payment).
Best practices: Chain z hyperbrowser. W HVAC: Test viz equipment on photos. Instalacja: npx -y @playwright/mcp@latest.
13. NX-MCP (Monorepo Management)
Opis: MCP dla Nx – tools do monorepo, build/test w workspace.
Efektywne użycie: Agent zarządza repo HVAC, run builds, optimize dla Biomejs.
Best practices: Fast cycles: Automatyzuj deploys. W HVAC: Moduły (Dashboard, Jobs). Instalacja: npx nx-mcp@latest /home/koldbringer/HVAC/refine/app-crm-minimal.
14. Package-Registry (Package Management)
Opis: MCP registry dla serwerów MCP – discover/integrate packages.
Efektywne użycie: Agent wyszukuje nowe tools (np. dla SMS gateways).
Best practices: Używaj z pypi-query. W HVAC: Integruj local fallback. Instalacja: npx -y package-registry-mcp.
15. Weaviate-Docs (Weaviate Vector DB Docs)
Opis: MCP remote do docs Weaviate – vector embeddings, semantic search.
Efektywne użycie: Load schemas (Clients predictedAffluence), hybrid search dla proroctw.
Best practices: Core DB: Embed transkrypcje dla affluence. W HVAC: Similar past services search. Instalacja: npx mcp-remote https://gitmcp.io/weaviate/weaviate.
16. Shadcn (SHADCN UI Components)
Opis: MCP serwer do zarządzania SHADCN – components, docs, install.
Efektywne użycie: Agent generuje UI (np. prophecy dashboard), ensure responsive.
Best practices: Custom tokens HVAC (icons split AC). W HVAC: Intuitive flows Kanban. Instalacja: npx @jpisnice/shadcn-ui-mcp-server.
17. Exa (AI Search Engine)
Opis: MCP do Exa.ai – advanced search dla AI.
Efektywne użycie: Search deeper (np. HVAC news), feed do proroctw.
Best practices: Chain z brave dla dystrybucji sources. W HVAC: District routing insights. Instalacja: npx -y exa-mcp-server.
18. Atlas-Docs (MongoDB Atlas Docs)
Opis: MCP do docs Atlas – choć project używa Neondb, fallback dla DB.
Efektywne użycie: Inspiracje dla skalowalnych queries.
Best practices: Używaj sparingly, focus Weaviate. W HVAC: Stock prophecy. Instalacja: docker run -i --rm -e ATLAS_API_URL mcp/atlas-docs.
19. Memorybox (Advanced Project Memory)
Opis: Rozszerzony memory MCP z max wiedzą o projekcie – full kontekst dla kontynuacji.
Efektywne użycie: Agent ładuje cały projekt HVAC, kontynuuj rozwój (np. z Outlook transkrypcji do nowego księgowości).
Best practices: Zawsze startuj sesje z memorybox dla proroctwa. W HVAC: Pełny kontekst dla ewolucji firmy. Instalacja: npx -y @modelcontextprotocol/server-memory.
Te wytyczne zapewniają exceptionally awesome rozwój – proroctwo-driven, surpassing Bitrix24. Używaj @rule-hvac-convex.md do aktywacji. Dla feedback: Podaj screenshots, agent zapyta o input. Razem zbudujemy potęgę Fulmark!