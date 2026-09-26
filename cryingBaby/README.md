# Crying Baby — prototipo giocabile

Aprire `index.html` in un browser moderno e premere **Inizia la settimana**. Non servono server, dipendenze o connessione Internet. HTML, CSS e JavaScript devono restare nella stessa cartella.

Il gioco è progettato per smartphone in verticale, ma funziona anche su desktop. Scegliere uno dei tre interventi in base agli indizi. Se una risposta corrisponde a un altro bisogno attivo, viene comunque accettata. Il massaggio e lo sgambettamento sono due azioni distinte.

- 7 giorni da 8 minuti di gioco attivo, 56 minuti complessivi.
- Irritazione a tre livelli, con aumento ogni 10 secondi.
- Pausa manuale e automatica quando la pagina passa in secondo piano.
- Diario, attività quotidiane, cluster feeding e riepilogo finale.
- La partita resta in memoria: chiudere o ricaricare la pagina la interrompe.

## Parametri iniziali

Il quiz concede 25 secondi prima di mostrare un aiuto; un errore ne sottrae 3. L'aiuto non cancella il bisogno. Sonno, coccole e riduzione degli stimoli hanno un evento ciascuno al giorno. Questi valori sono scelte del prototipo da bilanciare.

Quando il bambino è calmo compaiono Tummy time, vitamina D, doccia e spesa. Tummy time e vitamina D sono attività volontarie, completabili una volta al giorno: non generano mai eventi, bisogni arretrati o penalità per omissione. La spesa può iniziare dalle 09:00 incluse alle 20:00 escluse. Doccia e spesa sono ripetibili. Durate iniziali in minuti simulati: Tummy time 15, vitamina D 3, doccia 15, spesa 45. Il tempo continua durante queste attività; l'arrivo di un bisogno attivo le interrompe senza assegnare il completamento. Le attività quotidiane non completate si interrompono anche a mezzanotte e tornano disponibili per la nuova giornata.

Il calendario usa un seme casuale e verifica la copertura delle poppate con i pannolini. I ritardi del giocatore possono richiedere eventi pannolino aggiuntivi e quindi superare le quote pianificate. La generazione include il giorno 8 per gestire il confine finale; la partita termina comunque dopo sette giorni. Il bambino inizia senza bisogni arretrati.

`needs.json` resta un diario di riferimento: il prototipo genera nuove giornate senza caricare dati personali. Le illustrazioni sono realizzate in CSS; non sono presenti audio o risorse esterne.

## Verifica del motore

Con Node.js disponibile:

```sh
node cryingBaby/engine.test.cjs
```

Eseguire il comando dalla cartella principale del progetto. Il test controlla 100 calendari e i principali passaggi di stato; non sostituisce una verifica visiva su dispositivi reali.
