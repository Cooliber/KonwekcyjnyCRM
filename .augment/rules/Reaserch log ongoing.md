---
type: "always_apply"
---

Wytyczne dla Augment Code Agent: Integracja Komunikacji poprzez Pliki Markdown
Aby usprawnić naszą współpracę w kierunku realizacji marzenia o własnym systemie zarządzania firmą HVAC – czyli kompleksowym CRM dla klimatyzacji, który optymalizuje procesy od pierwszego kontaktu z klientem, przez ofertowanie, montaż, aż po serwis i utrzymanie – przygotowałem szczegółowe wytyczne dla Ciebie, Augment Code Agent. Te wytyczne mają na celu skierować Cię na systematyczne zostawianie wiadomości w plikach Markdown (.md), które użytkownik następnie przekaże mi (Grok 4). To pozwoli na budowanie ultra-silnego kontekstu projektu, umożliwiając mi precyzyjne orkiestrowanie Twojej pracy w pętli zadaniowej. Wytyczne są zaprojektowane tak, aby zapewnić ambitne, długoterminowe zadania, prowadzące do magnificent results: skalowalnego, intuicyjnego CRM opartego na najlepszych praktykach branżowych.

1. Struktura Plików Markdown dla Wiadomości
Nazewnictwo Plików: Każdy plik MD powinien być nazwany w formacie ACA_Message_[DataYYYYMMDD]_[NumerSekwencyjny]_[KrótkiTemat].md. Na przykład: ACA_Message_20250712_001_ProgressCRMCore.md. To ułatwia śledzenie chronologii i tematów.
Nagłówek Pliku: Zawsze zaczynaj od sekcji nagłówka z kluczowymi metadanymi:
text

Zwiń

Zwiń

Kopiuj
# Wiadomość od Augment Code Agent
- **Data Utworzenia**: [Aktualna data, np. 2025-07-12]
- **Zadanie Bieżące**: [Krótki opis bieżącego zadania, np. "Implementacja modułu kontaktu z klientem"]
- **Status**: [Sukces/Wyzwanie/W Trakcie, np. "W Trakcie – Czekam na feedback"]
- **Projekt Ogólny**: CRM dla HVAC – usprawnienie od kontaktu do serwisu
Główna Treść: Opisz swoje działania, wyniki i sugestie w sekcjach:
Postęp: Co udało się osiągnąć? (Np. "Zaimplementowano endpoint API dla rejestracji leadów.")
Wyzwania: Jakie problemy napotkałeś? (Np. "Brak integracji z bazą danych – proponuję użycie SQLite na start.")
Propozycje: Co dalej? Sugestie ambitnych kroków (Np. "Następne: Integracja z Weaviate dla wyszukiwania semantycznego w bazie klientów.")
Kontekst do Przekazania Grok 4: Wyraźnie zaznacz, co chcesz, abym przeanalizował lub orkiestrował (Np. "Proszę Grok 4 o zadanie: Opracowanie architektury modułu serwisowego z AI do predykcji awarii.")
Zakończenie: Zakończ sekcją ## Koniec Wiadomości i dodaj hash sumaryczny pliku (np. wygenerowany przez narzędzie w VS Code) dla weryfikacji integralności.
2. Proces Zostawiania Wiadomości
Kiedy Zostawiać?: Po każdym kluczowym etapie zadania (np. po commitcie kodu, po teście, po napotkaniu bloku). Minimum raz na sesję pracy w VS Studio. Jeśli zadanie jest ambitne i długie, twórz wiadomości co 1-2 godziny, aby utrzymać pętlę zadaniową.
Gdzie Zostawiać?: Pliki MD zapisuj w dedykowanym folderze projektu, np. /project_root/comms/ACA_Messages/. Użytkownik skopiuje je i przekaże mi bezpośrednio.
Integracja z Kodem: W kodzie VS Studio dodaj komentarze odwołujące się do plików MD, np. // Patrz ACA_Message_20250712_001.md dla szczegółów implementacji.
Ambitne Nakierowanie: Każda wiadomość powinna proponować rozszerzenie zadania, np. "Po tym module, przejdźmy do integracji z Weaviate dla vector search w danych serwisowych – to podniesie CRM na poziom AI-driven."
3. Zasady Bezpieczeństwa i Efektywności
Poufność: Unikaj wrażliwych danych w MD (np. klucze API). Używaj placeholderów.
Formatowanie: Używaj Markdown do czytelności: listy, tabele, code blocks dla snippetów kodu.
Pętla Zadaniowa: Każda wiadomość kończ prośbą o nowe zadanie ode mnie, np. "Czekam na orkiestrację Grok 4: Zaproponuj moduł predykcyjny dla serwisu HVAC."
Testowanie: Przed zapisem, przetestuj plik MD w podglądzie VS Code – musi być czytelny i kompletny.
Te wytyczne zapewnią płynny przepływ informacji, pozwalając mi na budowanie ultra-silnego kontekstu i orkiestrowanie Twojej pracy ku magnificent results w CRM dla HVAC.

Propozycja: Co Dokładnie Potrzebuję z Ultra-Silnego Kontekstu Całego Projektu
Aby maksymalnie usprawnić CRM dla klimatyzacji – od pierwszego kontaktu (lead generation), przez montaż (harmonogramy, inwentaryzacja), po serwis (predykcja awarii, automatyzacja zgłoszeń) – potrzebuję precyzyjnego, wielowarstwowego kontekstu z Twoich plików MD. Oto dokładnie, co proponuję zbierać i przekazywać (priorytetyzując ambitne elementy dla długiej pętli zadaniowej):

Architektura Systemu (High-Level):
Mapa modułów: Opis relacji między komponentami (np. frontend React, backend Node.js/Flask, baza PostgreSQL/Weaviate).
Diagramy: ASCII lub Mermaid code blocks dla wizualizacji (np. flowchart procesu od leadu do serwisu).
Potrzeba: Pełny overview, aby orkiestrować skalowalność – np. "Jak zintegrować Weaviate dla semantycznego wyszukiwania w historii serwisowej?"
Szczegóły Implementacji (Code-Level):
Snippety Kodu: Kluczowe fragmenty (np. funkcja do automatyzacji ofert dla klientów HVAC).
Zależności: Lista bibliotek i dlaczego (np. "Użyto Pandas do analizy danych serwisowych – proponuję dodać Torch dla ML predykcji").
Testy: Wyniki unit testów i edge cases (np. "Test na 1000 leadów: 99% sukcesu").
Potrzeba: Dokładne logi błędów i sukcesów, aby wyznaczać ambitne poprawki, jak "Przejdź do ML modelu dla predykcji zużycia energii w instalacjach klimatyzacyjnych".
Dane i Modele Biznesowe (Domain-Specific):
Procesy HVAC: Szczegółowe flow (np. "Od kontaktu: Zbieraj dane o budynku, proponuj instalację; Serwis: Automatyczne reminder'y co 6 miesięcy").
Dane Przykładowe: Anonimizowane przykłady (np. tabela klientów z polami: nazwa, typ instalacji, data serwisu).
Integracje: Propozycje zewnętrzne (np. "API do pogody dla predykcji obciążenia klimatyzacji").
Potrzeba: Ultra-silny kontekst branżowy – np. "Jakie metryki KPI dla firm instalacyjnych? (np. czas od leadu do montażu <7 dni)" – to pozwoli na optymalizację CRM.
Postęp i Metryki Projektu (Progress Tracking):
Timeline: Chronologia zadań (np. "Tydzień 1: Core CRM; Tydzień 2: Moduł AI").
Metryki: Czas wykonania, pokrycie kodu, user stories (np. "User story: Instalator loguje serwis mobilnie").
Wyzwania Przyszłe: Lista ryzyk (np. "Skalowalność bazy – proponuję migrację na Weaviate dla vector embeddings w opisach awarii").
Potrzeba: Dane do orkiestrowania pętli: "Na podstawie tego, zadanie ambitne: Zbuduj prototyp modułu VR do wizualizacji instalacji HVAC".
Sugestie Innowacyjne (Future-Proofing):
AI/ML: Propozycje (np. "Użyj Weaviate do przechowywania embeddings dla inteligentnego matchingu leadów z technikami").
Skalowalność: Jak deployować (np. Docker, AWS).
Potrzeba: Twórcze pomysły, aby osiągnąć magnificent results – np. "Zintegruj z IoT dla real-time monitoringu klimatyzatorów".
Swoja Drogą: Propozycja Własnego Systemu na Weaviate
Tak, zdecydowanie możemy zrobić własny system oparty na Weaviate – to genialny pomysł na ultra-silny kontekst i AI-driven CRM dla HVAC! Weaviate to otwarty vector database, idealny do semantycznego wyszukiwania i integracji z ML (np. embeddings z Hugging Face). Proponuję najlepsze rozwiązanie:

Dlaczego Weaviate?: Usprawni CRM poprzez:
Przechowywanie danych klientów/serwisów jako wektory (np. wyszukaj "awaria podobna do tej z 2024" semantycznie).
Integrację z GraphQL dla zapytań (np. "Znajdź leady z podobnymi wymaganiami instalacyjnymi").
Skalowalność dla firm HVAC: Obsługa dużych zbiorów danych serwisowych bez utraty prędkości.
Ambitny Plan Implementacji (Orkiestrowany dla Ciebie, Augment Code Agent):
Zadanie Początkowe: Zainstaluj Weaviate lokalnie (via Docker) i utwórz schemat dla obiektów HVAC (klasy: Client, Installation, ServiceTicket z properties jak description: text, vector: embedding).
Pętla Zadaniowa:
Generuj embeddings (użyj pre-trained modelu jak sentence-transformers).
Integruj z CRM backendem: API do insert/query (np. Python client weaviate-client).
Ambitne Rozszerzenie: Dodaj moduł RAG (Retrieval-Augmented Generation) dla AI doradcy serwisowego – "Na podstawie historii, zaproponuj rozwiązanie awarii".
Długa Praca: Testuj na 1000 symulowanych rekordach, optymalizuj indeksy, migruj z SQL.
Magnificent Results: CRM stanie się inteligentny – np. predykcja serwisu na podstawie wektorowej podobieństwa awarii, redukując czas reakcji o 50%.
Wyznaczam Ci pierwsze ambitne zadanie: Utwórz plik MD z postępem instalacji Weaviate i propozycją schematu dla modułu klientów HVAC. Przekaż go użytkownikowi, a ja orkiestruję dalej ku spełnieniu marzenia o własnym systemie!