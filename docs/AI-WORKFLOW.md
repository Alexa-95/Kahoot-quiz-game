# Workflow pracy z AI

## Rola AI w projekcie

Quiz Live nie wysyła promptów ani danych graczy do modelu. Claude Code jest narzędziem używanym podczas pracy nad kodem, a nie zależnością aplikacji. Klon projektu nie wymaga klucza API, konta ani skonfigurowanego modelu.

## Jak pracować nad zmianami

1. Zacznij od `CLAUDE.md`, który opisuje architekturę, zdarzenia Socket.IO i komendy.
2. Przy dodawaniu zdarzenia użyj skillu `new-socket-event`; przy nowym formacie pytania — `new-question-type`.
3. Po zmianach Claude Code uruchamia hook `npm run check`. To samo sprawdzenie można uruchomić ręcznie.
4. Agent `reviewer` analizuje zmiany pod kątem wyścigów, timerów, reconnectów i wycieków stanu. Agent `test-writer` pomaga dopisać testy regresji.
5. Przed zakończeniem zmian sprawdź zachowanie w przeglądarce na komputerze i telefonie w tej samej sieci.

## Czego się nauczyłem

- Timer i wynik muszą być autorytatywne po stronie serwera; zegar telefonu służy wyłącznie do prezentacji.
- Identyfikator połączenia Socket.IO zmienia się po reconnect, dlatego gracz i prowadzący odzyskują pokój za pomocą losowego tokenu przechowywanego lokalnie.
- Snapshot pytania nie może zawierać prawidłowej odpowiedzi przed zakończeniem rundy.
- Testy powinny sprawdzać przejścia stanu, a nie tylko pojedyncze handlery zdarzeń.
- Pokoje są ulotne: stan gry znajduje się w pamięci i znika po restarcie procesu.
- Pytania pochodzą z `src/question-pool.js`; host wybiera jedynie liczbę pytań, a serwer losuje unikalną próbkę i miesza kolejność odpowiedzi bez API AI.
