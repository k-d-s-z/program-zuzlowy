<p align="center">
  <a href="#-polski"><b>Polski</b></a> •
  <a href="#-english"><b>English</b></a>
</p>

---

<a name="-polski"></a>
# 🇵🇱 Program Żużlowy (Speedway Live Score & Program)

Aplikacja internetowa typu PWA (Progressive Web App) do śledzenia, prowadzenia i analizowania programu meczu żużlowego i zawodów indywidualnych na żywo.

🌐 **Aplikacja webowa:**  
👉 [https://k-d-s-z.github.io/program-zuzlowy/](https://k-d-s-z.github.io/program-zuzlowy/)

---

## 🚀 Funkcje

**Rodzaje zawodów**
- **Mecz ligowy:** składy drużyn, program biegów, punktacja, wykluczenia, zawodnik zastępowany (ZZ), rezerwy zwykłe (RZ) i taktyczne (RT), biegi dodatkowe.
- **Zawody indywidualne:** serie z własnymi listami uczestników (SGP, SEC, IMP, INNE oraz własne), tabela punktów, biegi, zastępstwa.
- **Zawody par (np. SoN, 7 lub 8 par):** drużyny narodowe lub ligowe, kaski, półfinały, baraż, finał, bieg dodatkowy i reguły rozstrzygania remisów wg FIM.
- **Czwórmecz (np. SWC):** 4 drużyny w stałych kolorach kasków, 20 biegów, punktacja 3-2-1-0, nominacje trenerów w biegach 17–20, rezerwa zwykła i taktyczna z limitami, bieg dodatkowy po remisie.

**Baza zawodników i drużyn**
- Wspólna baza zawodników (senior / junior), drużyny ligowe i narodowe oraz listy serii indywidualnych.
- **Import z arkusza (CSV/TSV/TXT):** kolumny Imię · Nazwisko · J/S · Drużyna ligowa · Drużyna narodowa · Rozgrywki; podgląd zmian przed zapisem, wzór pliku i eksport bazy do arkusza. Dwa tryby: **Scal z moją bazą** (dopisuje i zmienia przypisania) oraz **Zastąp (od zera)** (usuwa obecną bazę i wczytuje plik, np. na nowy sezon). Jest też przycisk „Wyczyść bazę zawodników”; import i czyszczenie można cofnąć.
- **Baza startowa:** plik `baza-startowa.csv` w repozytorium; aplikacja informuje o nowej wersji bazy i pozwala ją zaimportować (scalając lub zastępując bazę); zapisane zawody nigdy nie są zmieniane.

**Aplikacja**
- **PWA:** instalacja na telefonie lub komputerze, działa offline; powiadomienie o nowej wersji aplikacji.
- **Kopia zapasowa:** eksport i przywracanie danych (JSON), z historią zawodów lub bez; przypomnienie o kopii.
- **Dane lokalne:** wszystko zapisuje się na urządzeniu (localStorage przeglądarki), bez kont i serwera; aplikacja łączy się wyłącznie z własnym adresem (poza tym tylko plik bazy z repozytorium).
- **Responsywny interfejs** dla telefonów i ekranów desktopowych.

## 🛠️ Technologie

- HTML5 / CSS3 / JavaScript (ES6+)
- Service Worker & Web App Manifest (PWA)

## 📱 Instalacja (PWA)

1. Otwórz aplikację w przeglądarce: [https://k-d-s-z.github.io/program-zuzlowy/](https://k-d-s-z.github.io/program-zuzlowy/)
2. Kliknij przycisk **"Zainstaluj"** w pasku adresu lub wybierz opcję **"Dodaj do ekranu głównego"** w menu przeglądarki.
3. Aplikacja pojawi się na liście Twoich aplikacji na urządzeniu.

## 💻 Uruchomienie lokalne

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/k-d-s-z/program-zuzlowy.git
   ```
2. Otwórz plik `index.html` w dowolnej przeglądarce internetowej lub użyj lokalnego serwera (np. Live Server w VS Code).

## 📄 Licencja

Ten projekt jest udostępniany na licencji MIT.

---

<a name="-english"></a>
# 🇬🇧 Speedway Live Score & Program App

A Progressive Web App (PWA) for managing, tracking, and scoring speedway matches and tournaments live.

🌐 **Web App:**  
👉 [https://k-d-s-z.github.io/program-zuzlowy/](https://k-d-s-z.github.io/program-zuzlowy/)

---

## 🚀 Features

**Competition types**
- **League match:** team line-ups, heat programme, scoring, exclusions, substituted rider (ZZ), regular (RZ) and tactical (RT) reserves, extra heats.
- **Individual meetings:** series with their own rider lists (SGP, SEC, IMP, other and custom), points table, heats, substitutions.
- **Pairs events (e.g. 7 or 8 pairs):** national or league teams, helmets, semi-finals, run-off, final, extra heat and FIM tie-break rules.
- **Four-team event (e.g. Speedway World Cup):** 4 teams in fixed helmet colours, 20 heats, 3-2-1-0 scoring, team-manager nominations for heats 17–20, regular and tactical reserves with limits, extra heat after a tie.

**Rider and team database**
- Shared rider database (senior / junior), league and national teams, and individual-series lists.
- **Spreadsheet import (CSV/TSV/TXT):** columns First name · Last name · J/S · League team · National team · Series; preview before saving, a template file and export to a spreadsheet. Two modes: **Merge with my database** (adds and reassigns) and **Replace (from scratch)** (removes the current database and loads the file, e.g. for a new season). There is also a “Clear rider database” button; import and clearing can be undone.
- **Starter database:** `baza-startowa.csv` in the repository; the app announces a new version of the database and lets you import it (merge or replace); saved events are never changed.

**App**
- **PWA:** installable on phones and desktops, works offline; notification about a new app version.
- **Backup:** data export and restore (JSON), with or without event history; backup reminder.
- **Local data:** everything is stored on the device (browser localStorage), no accounts or server; the app connects only to its own origin (the starter database file).
- **Responsive UI** for phones, tablets and desktops.

## 🛠️ Tech Stack

- HTML5 / CSS3 / JavaScript (ES6+)
- Service Worker & Web App Manifest (PWA)

## 📱 Installation (PWA)

1. Open the app in your browser: [https://k-d-s-z.github.io/program-zuzlowy/](https://k-d-s-z.github.io/program-zuzlowy/)
2. Click the **"Install"** button in the address bar or select **"Add to Home Screen"** from the browser menu.
3. Launch the app directly from your home screen or application list.

## 💻 Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/k-d-s-z/program-zuzlowy.git
   ```
2. Open `index.html` in your web browser or use a local HTTP server (e.g., Live Server extension for VS Code).

## 📄 License

Distributed under the MIT License.

---

**Testy / Tests**

`node tests/run.js` — testy bez zależności (Node 18+): import bazy, tryby scal/zastąp, CSV, toasty wyników, pary, czwórmecz. Uruchamiają się też automatycznie na GitHubie (`.github/workflows/test.yml`).
