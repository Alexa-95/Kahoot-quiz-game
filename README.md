# Quiz Live

Quiz na żywo dla prowadzącego i graczy — działa w przeglądarce, na komputerze i telefonach. Claude generuje nowe pytanie podczas każdej rundy.

## Uruchomienie

Wymagany jest Node.js 20 lub nowszy.

```bash
npm install
npm run dev
```

Przed uruchomieniem ustaw klucz Anthropic API po stronie serwera. W PowerShellu:

```powershell
$env:ANTHROPIC_API_KEY="twój-klucz"
npm run dev
```

Otwórz **http://localhost:3000**. Prowadzący wybiera liczbę pytań; pierwsze pytanie powstaje przy tworzeniu pokoju, a każde następne dopiero po zakończeniu bieżącej rundy. Gracze dołączają kodem pokoju. Każde pytanie wymaga osobnego wywołania Anthropic API i może wiązać się z opłatą zależną od Twojego planu.

Klucz jest używany wyłącznie przez serwer i nie wolno umieszczać go w kodzie przeglądarki ani commitować do repozytorium. Opcjonalnie można ustawić `ANTHROPIC_MODEL`; domyślnie używany jest `claude-haiku-4-5-20251001`.

W PowerShellu na Windows, jeśli polityka uruchamiania blokuje skrypt `npm.ps1`, użyj:

```powershell
npm.cmd install
npm.cmd run dev
```

## Gra na kilku telefonach

1. Podłącz komputer i telefony do tej samej sieci Wi-Fi.
2. Uruchom serwer na komputerze.
3. Otwórz na komputerze adres `http://localhost:3000` i utwórz quiz.
4. Sprawdź lokalny adres IP komputera (np. `192.168.1.15`) i w telefonie otwórz `http://192.168.1.15:3000` albo zeskanuj QR z ekranu prowadzącego.
5. Jeśli system zapyta, zezwól Node.js na połączenia w sieci prywatnej.

Do publicznej gry przez internet potrzebny jest host obsługujący długotrwałe połączenia WebSocket, np. Render, Railway lub Fly.io. Aplikacja nie używa funkcji serverless do utrzymywania pokoi.

Na wdrożeniu ustaw `PUBLIC_URL` na publiczny adres aplikacji (np. `https://quiz.example.com`), aby kod QR prowadził pod właściwy adres. Lokalnie QR wybiera adres IPv4 komputera.

## Funkcje

- Prowadzący wybiera liczbę pytań (5, 10, 15, 20 lub 25); Claude generuje je na bieżąco, unikając wcześniejszych pytań z tej samej gry.
- Kolejność odpowiedzi jest losowana na serwerze. Odpowiedzi pozostają ukryte dla graczy aż do końca rundy.
- Pokoje z pięcioznakowym kodem, linkiem i kodem QR.
- Synchronizacja pytań i 15-sekundowego limitu czasu przez Socket.IO.
- Punkty zależne od poprawności i szybkości odpowiedzi.
- Wyniki po każdej rundzie i ranking końcowy.
- Ponowne połączenie gracza lub prowadzącego po odświeżeniu strony.
- Responsywny interfejs po polsku.

## Rozwój

```bash
npm test          # testy logiki gry
npm run typecheck # sprawdzenie JavaScript przez TypeScript checkJs
npm run check     # typecheck + testy
npm start         # serwer bez trybu watch
```

`npm run dev` uruchamia serwer Express, Socket.IO i Vite z automatycznym restartem. `npm start` najpierw buduje Reactowy interfejs do `public/build/`, a następnie uruchamia serwer. Komponenty interfejsu znajdują się w `client/`.

Architektura, kontrakty zdarzeń i workflow Claude Code są opisane w [CLAUDE.md](./CLAUDE.md) i [docs/AI-WORKFLOW.md](./docs/AI-WORKFLOW.md).

## Dane i prywatność

Stan pokoi i wyniki są przechowywane wyłącznie w pamięci procesu serwera. Restart serwera usuwa pokoje. Tożsamość gracza/hosta jest zapisywana w localStorage przeglądarki, aby umożliwić ponowne połączenie. Pytania są generowane przez Anthropic API; klucz API pozostaje po stronie serwera.
