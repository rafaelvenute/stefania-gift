# Verifica della prima versione — 17 ottobre 2026

## Revisione del proiettore

La regia mobile ora usa una rotazione 3D reale in 24 fotogrammi: il proiettore si gira verso lo spettatore e la lente frontale diventa l'origine dell'iris che rivela il film. Eliminato il piccolo schermo sospeso sopra la macchina. Verificati nel browser la rotazione, l'origine dell'apertura sulla lente, la riproduzione durante la scena `starting` (0,16 s osservati), il successivo passaggio a `film` senza riavvio e la console senza errori. Il nuovo suono meccanico è sintetizzato localmente con relè, trasporto intermittente, motore e ventilazione; un test controlla valori finiti, livello di picco e assenza di offset DC. I test sono nove.

## Testi del regalo

Il biglietto indica “Spettacolo: A sorpresa” e chiarisce che lo spettacolo è già scelto, mentre la data va concordata. Il calendario e il suggerimento del messaggio rispettano questa premessa. Rafael, Federica, Andrea e Davide firmano il biglietto e il finale. Entrambe le firme sono state controllate visivamente a 375 × 667, senza sovrapposizioni. La disponibilità temporanea usata per controllare il finale è stata deselezionata dall'interfaccia.

## Percorso reale nel browser

Verificato nel browser Chromium integrato, con viewport mobile:

- accensione del proiettore dopo tap;
- riproduzione inline e audio sbloccato dal gesto;
- intero montaggio fino alla fine naturale: 28,350998 s;
- passaggio automatico dalla sigla a Bollywood, senza secondo Play;
- pausa, ripresa e mute;
- skip alla busta;
- caricamento del frame conclusivo ed esposizione della busta chiusa;
- apertura soltanto dopo tap, estrazione del biglietto e accesso al calendario;
- selezione di sette disponibilità, senza limite a sei;
- deselezione, cambio mese e selezioni fra ottobre e novembre;
- preferenza Sera e messaggio facoltativo;
- persistenza dopo ricaricamento dell'app e replay;
- copia effettiva del testo negli appunti;
- generazione del collegamento WhatsApp con date, preferenza e messaggio, senza destinatario;
- invio automatico disabilitato in assenza di Formspree;
- finale “Date copiate!”, senza dichiarare una ricezione inesistente;
- replay che avvia nuovamente il film con un solo tap;
- ritorno al calendario con le selezioni conservate.

I dati di prova sono stati rimossi tramite l'interfaccia. Il progetto viene consegnato con disponibilità vuote.

## Layout

Controllati 360 × 800, 375 × 667, 390 × 844 e 430 × 932. Nessun overflow orizzontale rilevato. Il biglietto resta nel viewport anche a 375 × 667; il calendario può scorrere senza scorrimento orizzontale. Il video conserva le proporzioni 9:16 e l'intera inquadratura. Verificata anche la composizione desktop.

## Controlli di codice

- `npm run check`: TypeScript senza errori.
- `npm run build`: build statica Vite completata.
- `npm test`: 9 test superati su audio senza clipping o offset DC, giorni locali e cambio d'ora, date future valide, recupero e sanitizzazione delle bozze, testo di condivisione, mancata configurazione del servizio, payload, risposte non confermanti ed errori di rete.
- Il contratto Formspree è verificato con risposte controllate nei test, **senza contattare un modulo reale**.
- Nessun errore o avviso applicativo rilevato nella console durante il percorso principale.
- Build finale aperta su `http://localhost:4173/`, con un ulteriore passaggio proiettore → film → busta → biglietto → calendario, senza errori in console e con zero date di prova.
- Server statico: HTML 200, MP4 con byte-range 206, range impossibile 416, fotogramma WebP 200 e MIME corretti.

## Limiti espliciti

- Safari su iPhone e Chrome su Android fisici non sono stati eseguiti. Sono implementati i percorsi di compatibilità e i fallback, ma la verifica su un dispositivo reale resta necessaria prima di distribuire il regalo.
- Formspree non è configurato: nessuna consegna reale al gruppo è stata dichiarata o simulata.
- WhatsApp non è stato usato per inviare messaggi. È stato verificato il collegamento precompilato; la copia manuale è stata eseguita nel browser.
- La modalità reduced motion è implementata e controllata nel codice; le impostazioni del sistema dell'utente non sono state modificate per forzarla.
- Il raccordo della busta usa una transizione di luce e una ricostruzione 2.5D, non una corrispondenza 3D fotogrammetrica.
- Nessuna pubblicazione remota: il connettore Sites non era disponibile. La build e i pacchetti locali sono pronti.

## Ritmo e spaziatura mobile

Apertura rallentata da circa 2,4 a 3,8 secondi, con durata del motore adeguata senza alterarne il timbro. Nel browser la macchina è ancora nella scena iniziale dopo due secondi e il film parte in continuità alla fine dell'apertura. Corretti gli spazi fra le parole nei titoli che nascondono i ritorni a capo su mobile: “Il vero colpo di scena?” e “Riuscire a organizzarci.” Il titolo mobile usa una dimensione fluida per mantenere leggibili le due frasi complete.
