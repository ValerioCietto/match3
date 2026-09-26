# Crying Baby

## Concept

Un quiz interattivo con elementi a tempo: il bambino piange e il giocatore deve capire di cosa ha bisogno prima che il tempo scada.

Il cuore del gioco è osservare gli indizi, interpretarli e scegliere come intervenire sotto pressione.

## Durata della sfida

La sfida dura una settimana: sette giorni consecutivi di tempo simulato, dalle 00:00 del giorno 1 alle 00:00 del giorno 8, per un totale di 168 ore. Ogni giornata dura 8 minuti reali di gioco attivo: l'intera settimana dura quindi 56 minuti, escluse pause e schermate di riepilogo. Un secondo reale corrisponde a 3 minuti simulati.

L'interfaccia mostra il giorno corrente, da 1 a 7, e l'ora. A mezzanotte cambiano le quote giornaliere, ma bisogni attivi, cluster in corso, contatori di pannolini e tutine e status del bambino proseguono senza azzerarsi.

Alla fine del settimo giorno la simulazione termina e mostra un riepilogo della settimana: bisogni risolti, errori, tempi di risposta e bisogni ancora aperti. Gli eventi previsti dal giorno 8 in poi non richiedono di prolungare la partita; un bisogno ancora aperto ma non scaduto non conta automaticamente come errore.

## Ciclo di gioco

1. Il bambino inizia a piangere e parte il conto alla rovescia.
2. Il giocatore osserva la scena e gli indizi disponibili.
3. Un quiz propone possibili bisogni o azioni da compiere.
4. Il giocatore sceglie una risposta entro il tempo limite.
5. Il gioco mostra l'esito e spiega quali indizi aiutavano a riconoscere il bisogno.
6. Si passa a una nuova situazione.

## Bisogni e risposte possibili

Fasce orarie e indizi per le situazioni di gioco. Gli indizi nella stessa cella sono separati da `;`. Dove non è prevista una restrizione, il bisogno può comparire a qualsiasi ora.

| Bisogno | Fascia oraria / condizione temporale | Indizi | Possibile risposta |
| --- | --- | --- | --- |
| Fame | 00:00–24:00; possibile cluster di 4 ore fra le 18:00 e le 02:00 successive | Diario dell'ultima poppata; animazione di ricerca del seno; mani portate alla bocca; richieste ravvicinate durante il cluster | Dare da mangiare |
| Sonno | 00:00–24:00; ritmo da definire | Sbadigli nell'animazione; occhi che si chiudono; diario dell'ultimo riposo | Aiutare il bambino ad addormentarsi |
| Pannolino da cambiare | 00:00–24:00; fra 30 e 120 minuti dall'inizio della poppata per gli eventi collegati | Pannolino sporco visibile all'ispezione; orario di inizio della poppata; diario dell'ultimo cambio | Cambiare il pannolino |
| Bisogno di coccole | 00:00–24:00; frequenza da definire | Braccia tese verso il giocatore; sguardo che segue il caregiver; reazione positiva alla sua vicinanza | Prendere in braccio e rassicurare |
| Troppi stimoli | 00:00–24:00; in presenza di stimoli ambientali | Televisore o giocattoli rumorosi accesi; luci intense nella scena; animazione del bambino che distoglie lo sguardo | Rendere l'ambiente più tranquillo |
| Ruttino | 00:00–24:00; subito dopo la fine della poppata; azione di 2–15 minuti | Poppata appena conclusa nel diario; ruttino non ancora registrato; animazione di irrequietezza dopo la poppata | Accompagnare il ruttino dopo la poppata |
| Pancino gonfio | 00:00–24:00; oltre 90 minuti dalla comparsa del bisogno di cambio | Bisogno di cambio irrisolto da oltre 90 minuti; pancino evidenziato nell'illustrazione; animazione delle gambe raccolte | Massaggio al pancino e sgambettamento |
| Naso da pulire | 00:00–24:00; 0–2 eventi casuali al giorno | Muco visibile nell'illustrazione; icona del naso da pulire; segnale sonoro accompagnato da un equivalente visivo | Lavaggio nasale |
| Tutina da cambiare | 00:00–24:00; dopo 3–4 cambi pannolino completati | Tutina visibilmente sporca; contatore dei cambi pannolino dall'ultima tutina; tutina pulita disponibile nella scena | Cambiare la tutina |
| Bagnetto | 10:00–18:00, fine esclusa; dopo 2–3 cambi tutina completati | Contatore delle tutine dall'ultimo bagnetto; promemoria del bagnetto disponibile; orologio nella fascia diurna prevista | Fare il bagnetto nella fascia diurna |

Nessun pianto per bagnetto, tummy time e tutine. Gli indizi elencati sono proposte per il quiz; il motore deve mostrarli in modo coerente con lo stato effettivo della simulazione.

Gli indizi sono convenzioni del gioco e devono rendere comprensibile la risposta prevista: il quiz non pretende di insegnare a diagnosticare i bisogni di un bambino reale dal pianto.

## Attività durante la calma

Quando non ci sono bisogni attivi, il quiz lascia spazio a quattro opzioni volontarie. Tummy time e vitamina D si possono completare una volta per giornata; non generano mai eventi, arretrati o penalità per omissione. I pulsanti delle attività già completate restano visibili ma disabilitati fino al giorno successivo.

| Attività | Disponibilità | Durata iniziale simulata | Feedback al completamento |
| --- | --- | --- | --- |
| Tummy time | Bambino calmo; una volta al giorno | 15 minuti | Tummy time completato per oggi! |
| Vitamina D | Bambino calmo; una volta al giorno | 3 minuti | Vitamina D completata per oggi! |
| Doccia | Bambino calmo; ripetibile | 15 minuti | ti prendi una pausa per lavarti mentre il bimbo è tranquillo, batterie ricaricate! |
| Spesa | Bambino calmo; dalle 09:00 incluse alle 20:00 escluse; ripetibile | 45 minuti | ottieni importanti provviste per mangiare, pannolini, quadrotti, e salviette! |

Il tempo continua durante le attività. Se compare un bisogno attivo, l'attività si interrompe senza assegnare il completamento e torna il quiz. A mezzanotte Tummy time e vitamina D non ancora completati si interrompono e diventano nuovamente disponibili per la nuova giornata. La fascia della spesa limita l'avvio: una spesa già iniziata può terminare dopo le 20:00. Le durate sono parametri iniziali da bilanciare; i testi di doccia e spesa sono feedback narrativi, senza inventario o indicatore di energia.

## Elementi a tempo

- Il tempo del mondo avanza continuamente al rapporto di 3 minuti simulati per secondo reale durante il gioco attivo.
- L'irritazione aumenta ogni 10 secondi reali di bisogno irrisolto, secondo le regole dell'interfaccia qui sotto.

- Un timer visibile indica quanto tempo resta per rispondere.
- Una risposta corretta calma il bambino e conclude la situazione.
- Una risposta sbagliata lascia il bambino in pianto e consuma parte del tempo rimasto, consentendo un nuovo tentativo.
- Allo scadere del tempo, il gioco rivela la soluzione con una breve spiegazione.

Durata del timer e penalità sono da definire con le prime prove di gioco.

## Interfaccia del quiz mobile

L'interfaccia è progettata per smartphone in orientamento verticale. In alto mostra giorno corrente (`1/7`–`7/7`), ora simulata e tempo rimanente negli 8 minuti della giornata. Al centro presenta il bambino, la scena e gli indizi; sotto, la domanda e tre grandi pulsanti di risposta disposti verticalmente, facilmente raggiungibili con il pollice. Gli indizi restano leggibili senza dover scorrere la pagina durante la risposta.

Sul lato sinistro della scena è sempre visibile un indicatore verticale di **irritazione**, composto da tre segmenti. Numero, etichetta e icona identificano il livello anche senza audio e senza dipendere soltanto dal colore.

| Livello | Stato | Tempo reale dall'inizio dell'episodio irrisolto |
| --- | --- | --- |
| 1 | Versetti | Da 0 a meno di 10 secondi |
| 2 | Pianto | Da 10 a meno di 20 secondi |
| 3 | Pianto disperato | Da 20 secondi in poi |

Quando compare un bisogno, l'episodio parte dal livello 1. Ogni 10 secondi reali di gioco attivo il livello aumenta di uno, fino al massimo di 3. Il livello massimo persiste finché l'episodio non viene risolto; non introduce automaticamente una sconfitta.

Regola iniziale per i bisogni simultanei: l'indicatore è unico per il bambino. Una risposta errata o l'arrivo di un altro bisogno non azzerano il timer. Quando tutti i bisogni attivi che provocano irritazione sono risolti, l'indicatore si spegne e il timer si azzera; il successivo episodio riparte dai versetti. Tummy time e vitamina D restano promemoria e non aumentano da soli l'irritazione.

L'irritazione continua durante le azioni finché restano bisogni irrisolti. Una pausa esplicita ferma sia il tempo del mondo sia il timer dell'irritazione. Il conto alla rovescia del quiz, la cui durata resta da bilanciare, è distinto dall'indicatore e non deve interrompere implicitamente il tempo della giornata.

## Indizi e interazione

Gli indizi possono essere visivi, sonori o testuali: oggetti nella stanza, gesti del bambino e brevi informazioni su cosa è successo prima del pianto.

Per il primo prototipo, gli indizi essenziali sono mostrati subito e il giocatore sceglie tra tre risposte. In seguito si può introdurre la possibilità di ispezionare gli oggetti per ottenere informazioni, spendendo parte del tempo disponibile.

Le informazioni necessarie a rispondere devono essere comprensibili anche senza audio.

## Progressione proposta

- Giorno 1 solo fame e pannolino, Giorno 2 si aggiungono coccole e ruttino, giorno 3 si aggiungono vitamina d e tummy time, dal giorno 4 tutti i bisogni
- Situazioni successive: indizi meno espliciti e alternative più plausibili.

Un eventuale punteggio può premiare risposte corrette, rapidità e pochi tentativi.

## Primo prototipo

- Una schermata con il bambino, gli indizi, il timer e tre pulsanti di risposta.
- Cinque situazioni scritte a mano, una per ciascun bisogno iniziale.
- Feedback immediato per risposta corretta, errore e tempo scaduto.
- Una breve spiegazione alla fine di ogni situazione.
- Una sfida di sette giorni simulati, con riepilogo finale della settimana.

## Da definire

- gioco inizia alle ore 9:00 del giorno 1
- Tono del gioco: tenero, comico o caotico.
- Stile grafico e ambientazione.
- Durata delle situazioni e penalità del quiz, con giornata fissata a 8 minuti reali.
- Alle 8 di mattina, messaggio di congratulazione "sei sopravvissuto alla notte"
- Alle 20 messaggio "la notte sta arrivando"
- Sistema di punteggio e condizioni di vittoria. (ogni bisogno soddisfatto in livello di irritazione 0-1 100punti, livello 2 50 punti, pianto disperato 10 punti)
- Modalità rilassata con timer esteso o disattivato se parametro url (relaxMode=on).
una volta terminato gioco prima volta, offrire opzione di riprovare con timer o in relax mode senza timer

Le meccaniche oltre al concept di base sono proposte iniziali da affinare.

## Algoritmo dei bisogni

Queste sono regole della simulazione di gioco. Il diario del giorno 8 settembre 2026, con 10 pannolini e 19 attaccamenti, è un riferimento per il ritmo, non una sequenza da ripetere identica. Sonno, coccole e stimoli restano da modellare separatamente.

### Tempo e stato

Usare minuti assoluti dall'inizio della simulazione, mantenendo separati il tempo del mondo, i secondi concessi per rispondere al quiz e il timer reale dell'irritazione. Durante il gioco attivo, `minutiSimulati += secondiRealiTrascorsi * 3`. Le durate delle azioni sono espresse in tempo simulato e trascorrono nello stesso flusso continuo, senza aggiungere salti di tempo al completamento: un'azione di 15 minuti simulati dura 5 secondi reali. Gli orari del diario sono `HH:mm`; le durate delle poppate sono `mm:ss`.

Ogni bisogno contiene `id`, `tipo`, `attivoDa`, `stato`, `cause` e un eventuale tempo di completamento. Gli stati sono `programmato`, `attivo`, `in_corso` e `risolto`. Più bisogni possono essere attivi insieme.

Lo stato del bambino conserva anche il pannolino corrente, il conteggio dei cambi dall'ultima tutina, il conteggio delle tutine dall'ultimo bagnetto e le azioni già effettuate per il pancino gonfio. Questi dati non si azzerano a mezzanotte.

### Regole e parametri

| Evento | Regola |
| --- | --- |
| Attaccamenti | Estrarre un totale giornaliero intero fra 10 e 20 |
| Pannolini | Estrarre un totale giornaliero intero fra 10 e 14 |
| Cluster feeding | Possibile blocco di 4 ore interamente compreso fra le 18:00 e le 02:00 del giorno seguente |
| Cambio dopo poppata | Per ogni inizio poppata deve esistere un bisogno di cambio fra 30 e 120 minuti dopo |
| Ruttino | Si attiva alla fine di ogni poppata; l'azione per risolverlo dura da 2 a 15 minuti |
| Pancino gonfio | Si attiva se un bisogno di cambio resta irrisolto per più di 90 minuti |
| Lavaggio nasale | Estrarre da 0 a 2 eventi al giorno, a orari casuali distinti |
| Cambio tutina | Dopo 3 o 4 cambi pannolino completati |
| Bagnetto | Dopo 2 o 3 cambi tutina completati; eseguibile dalle 10:00 incluse alle 18:00 escluse |

Interpretazioni iniziali: i 2–15 minuti del ruttino sono la durata dell'azione, non il ritardo prima della sua comparsa. I 90 minuti del pancino partono dalla comparsa del bisogno di cambio, non dall'ultimo cambio effettuato.

### Generazione del calendario

Il generatore usa un seme casuale per ottenere giornate riproducibili. Prepara più giorni consecutivi, includendo gli eventi del giorno precedente che ricadono oggi e quelli di oggi che ricadono domani.

Per la sfida settimanale, generare i sette giorni giocabili e un margine tecnico prima e dopo per verificare i vincoli a cavallo dei confini. Il margine non è giocabile e non entra nel punteggio. Lo stato iniziale deve essere coerente con gli eventi precedenti, senza attribuire al giocatore errori o ritardi anteriori all'inizio della sfida. Le conseguenze delle ultime poppate possono essere pianificate oltre la fine della settimana senza estendere le 168 ore di gioco.

Le quote dei sette giorni producono complessivamente 70–140 attaccamenti, 70–98 eventi pannolino e 0–14 eventi di lavaggio nasale pianificati. Restano comunque obbligatorie le quote di ciascun giorno: un totale settimanale valido non compensa una giornata fuori limite.

1. Estrae i totali giornalieri di attaccamenti, pannolini e lavaggi nasali.
2. Decide se attivare il cluster con una probabilità configurabile, inizialmente proposta al 50%. Estrae l'inizio fra le 18:00 e le 22:00; la fine cade quattro ore dopo, eventualmente oltre mezzanotte.
3. Distribuisce gli inizi delle poppate aumentando la densità nel cluster: peso iniziale proposto 3 nel cluster e 1 fuori. Verifica che il blocco contenga almeno due poppate e che l'intervallo medio fra inizi consecutivi interni sia inferiore a quello esterno. Il cluster redistribuisce gli attaccamenti, senza aggiungerli oltre il totale giornaliero.
4. Assegna una durata a ogni poppata, inizialmente campionandola dalle durate del diario fornito. Esclude sovrapposizioni fra poppate e riserva dopo ciascuna lo spazio per un ruttino di 2–15 minuti. Le altre durate delle azioni sono parametri ancora da bilanciare.
5. Per ogni inizio poppata `f`, costruisce la finestra di cambio `[f + 30, f + 120]`.
6. Cerca orari di pannolino che coprano tutte le finestre e rispettino i totali giornalieri, contando ogni evento nel giorno in cui compare. Uno stesso evento può coprire più finestre sovrapposte.
7. Aggiunge i lavaggi nasali e verifica tutti i vincoli prima di usare il calendario. Tummy time e vitamina D non entrano nel calendario degli eventi.

Per costruire la copertura iniziale dei pannolini, ordinare le finestre per fine crescente: se una finestra non contiene già un evento, inserirlo alla sua fine. Questo produce una copertura minima senza quote giornaliere. Successivamente, spostare o aggiungere eventi per soddisfare le quote, verificando nuovamente ogni finestra; le aggiunte possono rappresentare pannolini indipendenti dalle poppate. Se non si trova una soluzione, rigenerare gli orari o usare una ricerca con ritorno sui passi precedenti. La verifica finale, comprese le quote a cavallo della mezzanotte, è obbligatoria.

Limitare la ricerca a un numero configurabile di tentativi: se fallisce, restituire un errore di generazione con i vincoli non soddisfatti, senza pubblicare una giornata non valida. La verifica riguarda anche lo spazio disponibile per completare le azioni nel percorso senza errori.

**Un cambio può soddisfare più poppate.** Per esempio, con poppate alle 18:00 e alle 18:40, un bisogno di cambio alle 19:15 ricade rispettivamente dopo 75 e 35 minuti. È un solo pannolino. Questa condivisione permette di conciliare fino a 20 attaccamenti con un massimo di 14 pannolini.

### Calendario e azioni del giocatore

Le quote indicano gli eventi pianificati di una giornata giocata senza ritardi. Non possono garantire il numero di azioni effettivamente completate se il giocatore ignora i bisogni.

Il calendario è il percorso previsto. Quando una poppata inizia davvero a un orario diverso, ricalcolare la sua finestra di cambio dall'inizio effettivo e ripianificare solo gli eventi futuri coinvolti. Il ruttino nasce dalla fine effettiva della poppata. Non spostare eventi già avvenuti e non eliminare bisogni attivi per recuperare le quote.

Se i ritardi rendono impossibile mantenere contemporaneamente quote e finestre, conservare i legami causali e registrare lo scostamento nel riepilogo: il limite giornaliero è un obiettivo del generatore, non una ragione per negare un bisogno conseguente alle azioni del giocatore.

Se arriva un altro evento di pannolino mentre quello corrente è ancora sporco, aggiungere la causa al bisogno esistente. Non creare due cambi simultanei e non riavviare il conteggio dei 90 minuti. Un cambio completato incrementa il contatore tutina una sola volta.

### Bisogni derivati dalle azioni

- **Ruttino:** alla fine della poppata si attiva il bisogno. Quando il giocatore sceglie l'azione corretta, questa occupa la durata estratta; il bisogno si risolve al completamento.
- **Pancino gonfio:** dopo più di 90 minuti senza il cambio dovuto, attivare uno status persistente. Per risolverlo servono sia massaggio sia sgambettamento, in qualsiasi ordine. Il cambio risolve il pannolino ma non cancella lo status. Una stessa attesa genera una sola attivazione, evitando che lo status ricompaia a ogni aggiornamento.
- **Tutina:** estrarre una soglia di 3 o 4 cambi. Al raggiungimento, attivare un solo bisogno di tutina. Al cambio tutina completato, azzerare il contatore pannolini ed estrarre la soglia successiva. I cambi aggiuntivi durante l'attesa non creano una coda di tutine arretrate.
- **Bagnetto:** estrarre una soglia di 2 o 3 tutine. Al raggiungimento, registrare un solo bisogno di bagnetto. Se è fuori fascia, programmarne l'attivazione alla successiva apertura delle 10:00. Alle 18:00 un bisogno irrisolto torna in attesa della finestra successiva. Al bagnetto completato, azzerare il contatore tutine ed estrarre una nuova soglia. Il bagnetto non conta automaticamente come cambio tutina o pannolino.
- **Lavaggio nasale:** ciascun evento attiva il bisogno; se è già presente, accodare la causa senza duplicare l'azione richiesta.

Le soglie si estraggono alla creazione del contatore e dopo il suo azzeramento, mai a ogni aggiornamento.

### Aggiornamento della simulazione

```text
inizializza(seme):
    crea calendario e verifica vincoli
    sogliaTutina = casualeIntero(3, 4)
    sogliaBagnetto = casualeIntero(2, 3)

avanzaTempo(finoA):
    processa in ordine cronologico tutti gli eventi fino a finoA
    applica completamenti delle azioni e aggiorna i contatori
    attiva o unisci i bisogni programmati
    verifica ritardo pannolino e attivazione pancino
    aggiorna disponibilità del bagnetto secondo l'orario
    seleziona la situazione da presentare nel quiz

completaAzione(azione):
    risolvi solo i bisogni coperti dall'azione
    aggiorna cause, contatori e status derivati
    ripianifica eventuali conseguenze future
    rivaluta i bisogni ancora attivi
```

Se un'azione fa avanzare il tempo di diversi minuti, elaborare anche tutti gli eventi intermedi. Per eventi allo stesso istante, applicare prima i completamenti delle azioni, poi le nuove attivazioni. Un cambio esattamente al minuto 90 evita lo status, che richiede un ritardo strettamente maggiore.

### Collegamento al quiz

Il motore conserva tutti i bisogni attivi. Come prima regola di presentazione, proporre prima il pannolino scaduto e il pancino gonfio, poi gli altri bisogni ordinati per tempo di attesa; questa priorità è di gioco ed è da bilanciare.

Quando più risposte corrispondono a bisogni reali, accettarle tutte oppure formulare una domanda riferita a un indizio specifico. Una risposta corretta risolve il bisogno relativo, ma il bambino può continuare a piangere se ne restano altri. Il feedback deve esplicitare il motivo.

### Casi da verificare nell'implementazione

- Ogni giornata generata rispetta 10–20 attaccamenti, 10–14 eventi pannolino e 0–2 eventi nasali.
- Ogni inizio poppata ha un evento pannolino nella finestra inclusiva di 30–120 minuti, anche dopo mezzanotte.
- Due poppate vicine possono condividere un pannolino senza contarlo due volte.
- Un cluster dalle 22:00 alle 02:00 dura 240 minuti e rispetta le quote di entrambe le date.
- Il pancino non si attiva a 90 minuti esatti, si attiva oltre 90 e richiede entrambe le azioni per risolversi.
- Un bagnetto maturato alle 19:00 diventa disponibile alle 10:00 successive; i contatori sopravvivono alla mezzanotte.
- Un salto temporale durante un'azione non perde ruttini, eventi o scadenze intermedie.
- La sfida termina esattamente dopo 168 ore simulate, senza azzeramenti di stato fra i sette giorni e senza prolungarsi per gli eventi del giorno 8.
- Una giornata dura 480 secondi di gioco attivo e la settimana 3.360 secondi; le pause non consumano tempo e le azioni non fanno avanzare due volte l'orologio.
- L'irritazione passa da versetti a pianto a 10 secondi e a pianto disperato a 20 secondi, resta al livello 3 e si azzera alla risoluzione dell'episodio.
- Nuovi bisogni ed errori non riavviano il timer dell'irritazione; Tummy time e vitamina D da soli non lo attivano.
