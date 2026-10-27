# Quiz Live

Quiz na żywo dla prowadzącego i graczy — działa w przeglądarce, na komputerze i telefonach. Bez kluczy API, logowania, zewnętrznej bazy danych i płatnych usług.

## Uruchomienie

Wymagany jest Node.js 20 lub nowszy.

```bash
npm install
npm run dev
```

Otwórz **http://localhost:3000**. Prowadzący wybiera liczbę pytań, a aplikacja losuje je z lokalnej puli; gracze dołączają kodem pokoju.

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

- Prowadzący wybiera wyłącznie liczbę pytań (5, 10, 15, 20 lub 25); pytania losują się z lokalnej puli bez powtórek w jednej grze.
- Losowana jest także kolejność odpowiedzi. Pula zawiera pytania wielokrotnego wyboru i prawda/fałsz.
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

`npm run dev` uruchamia serwer Express i Socket.IO z automatycznym restartem po zmianach. Interfejs przeglądarkowy znajduje się w `public/`.

Architektura, kontrakty zdarzeń i workflow Claude Code są opisane w [CLAUDE.md](./CLAUDE.md) i [docs/AI-WORKFLOW.md](./docs/AI-WORKFLOW.md).

## Dane i prywatność

Stan pokoi i wyniki są przechowywane wyłącznie w pamięci procesu serwera. Restart serwera usuwa pokoje. Tożsamość gracza/hosta jest zapisywana w localStorage przeglądarki, aby umożliwić ponowne połączenie. Pytania pochodzą z `src/question-pool.js`; nie ma połączeń z usługami AI.
