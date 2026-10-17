# Stefania, la tua prima

Un micro-film interattivo per **Stefania D'Amore**, firmato **Amici Senza Budget Productions**. Un regalo di **Rafael, Federica, Andrea e Davide**: lo spettacolo è già scelto e resta una sorpresa, mentre la data si concorda insieme.

## Aprire e modificare

Serve Node.js 22.12 o successivo.

```sh
npm install
npm run dev
```

L'indirizzo di sviluppo è `http://localhost:5173/`.

```sh
npm test
npm run build
node scripts/serve-dist.mjs
```

L'anteprima della build è `http://localhost:4173/`. Su Windows, dopo la build, si può usare **Avvia anteprima.cmd**. Aprire `dist/index.html` direttamente dal filesystem non sostituisce il server HTTP.

## Il film effettivamente fornito

L'analisi di **1017.mp4** ha rilevato:

- durata totale 28,35 secondi; video H.264 Main, 1080 × 1920, 30 fps, 9:16;
- audio AAC stereo, 44,1 kHz;
- opening del monumento dorato nella prima parte;
- transizione alla sequenza Bollywood intorno a 20,3 secondi;
- busta dorata in primo piano nell'ultimo fotogramma.

Il file contiene quindi **entrambe le scene**, già montate. L'originale non è stato modificato. La copia web `trailer-mobile.mp4` conserva il montaggio continuo e l'audio, a 720 × 1280, circa 9,1 MB invece di 40 MB.

Sono disponibili anche i due slot sostituibili:

| File in `public/media/` | Uso |
| --- | --- |
| `intro-studios-mobile.mp4` | Opening dello studio, estratta dal montaggio |
| `bollywood-ticket-mobile.mp4` | Sequenza Bollywood, estratta dal montaggio |
| `trailer-mobile.mp4` | Riproduzione continua delle due scene, attualmente preferita |
| `intro-poster.webp` | Primo fotogramma della proiezione |
| `bollywood-poster.webp` | Poster della seconda scena |
| `envelope-final-frame.webp` | Ultimo fotogramma video effettivo, usato nel raccordo |

La configurazione centrale è **src/config.ts**. Lasciare `continuous` impostato per preservare il montaggio già continuo. Per sostituire i due film separatamente, impostare `continuous: null` e aggiornare gli slot `films`. Uno slot `src: null` mostra un'anteprima dichiarata, con avanzamento automatico; non viene presentato come film definitivo.

`envelopeMatch` descrive centro, larghezza e rotazione della busta in coordinate normalizzate del frame 9:16. Il raccordo mantiene la stessa area del fotogramma, con una passata di luce che maschera la sostituzione. Se cambia il video Bollywood, rigenerare il frame e adeguare queste coordinate.

Per ricavare nuovamente i media dall'originale:

```sh
node scripts/prepare-media.mjs "PERCORSO_ASSOLUTO/1017.mp4"
```

## Attivare Formspree

L'invio automatico è **disattivato finché manca un endpoint reale**. Copia e WhatsApp funzionano già; WhatsApp prepara il messaggio senza destinatario e richiede che la persona ne completi l'invio.

1. Creare o usare il proprio modulo Formspree.
2. Copiare `.env.example` in `.env.local`.
3. Impostare `VITE_FORMSPREE_ENDPOINT` sull'endpoint esatto del proprio modulo, nel formato `https://formspree.io/f/…`.
4. Riavviare lo sviluppo o ricostruire e pubblicare il sito. Le variabili `VITE_` vengono inserite al momento della build.

L'endpoint pubblico di un modulo non è una chiave segreta. Non inserire credenziali amministrative nella variabile.

L'invio avviene solo dopo **Invia le mie date → revisione → Conferma e invia**. Il payload include nome, date locali, etichette italiane, preferenza, messaggio, timestamp UTC e fuso del browser. Un esito HTTP positivo e una conferma JSON `ok: true` sono necessari per il finale “Date ricevute!”. Errori o timeout mantengono le selezioni. Non è stato eseguito alcun invio reale, perché non è stato fornito un endpoint.

Riferimento: [documentazione Formspree sulle richieste AJAX](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax).

## Pubblicare come sito statico

**Vercel:** importare questa cartella come progetto Vite; comando `npm run build`, directory di output `dist`. Configurare l'eventuale variabile Formspree nelle impostazioni prima della build.

**GitHub Pages o altro hosting statico:** pubblicare il contenuto della cartella `dist` come radice del sito. Il `base: './'` permette l'uso anche in una sottocartella. L'hosting deve servire MP4 con il MIME corretto e supportare le richieste byte-range per i player mobili. Usare HTTPS per copia negli appunti e condivisione nativa.

Il pacchetto **stefania-sito-statico.zip**, nella cartella superiore, contiene i file pubblicabili. Il pacchetto **stefania-sorgenti.zip** contiene i sorgenti e i media, senza `node_modules`.

Questa consegna è locale: il connettore Sites non era disponibile per la pubblicazione nella sessione. Nessun URL pubblico è stato creato.

## Regia e accessibilità

Il proiettore usa render 3D originali realizzati in Blender: due WebP per la posa iniziale e un atlas trasparente di 24 fotogrammi per la rotazione verso chi guarda (circa 453 KB complessivi). La scena nativa e gli script sono inclusi nei sorgenti. La regia è pensata prima di tutto per il telefono: la macchina accende la lampada, gira fisicamente verso lo spettatore e solo allora proietta. Una timeline GSAP di circa 3,8 secondi coordina spia, bobine, rotazione e apertura ottica. Il medesimo player inline si rivela con un iris centrato sulle coordinate reali della lente frontale; il film parte durante la proiezione e non viene riavviato al termine del movimento. L'atlas viene precaricato e decodificato prima della rotazione, con attesa limitata e fallback alla posa iniziale. L'audio viene preparato dal gesto iniziale tramite Web Audio. Il film usa `playsInline`; se il browser richiede un gesto ulteriore appare un comando esplicito per riprendere con audio.

La busta resta chiusa fino al tap. Il biglietto si estrae fisicamente; il suo invito conduce al sipario e al calendario. Il finale richiude e riapre il sipario, accende il palco e distingue ricevute, copie e condivisioni manuali. Il replay riparte dal suo stesso tap.

I suoni d'interfaccia sono sintesi originali locali: clic, motore, carta, sipario e applausi. Il nuovo motore comprende scatto del relè, trasporto intermittente che accelera fino a 24 cicli al secondo, ritorno meccanico, ronzio e ventilazione; si attenua quando inizia il film. Nessun audio d'interfaccia parte prima di un'interazione. I film conservano il loro audio originale. Il mute e il volume controllano entrambe le sorgenti.

Le date sono memorizzate come giorni locali, senza conversioni UTC che possano spostarle. Oggi e i giorni passati sono disabilitati. Non c'è un limite al numero di selezioni. Una bozza è conservata in `localStorage`, con fallback alla sola sessione se il browser non consente il salvataggio.

Sono previsti navigazione da tastiera, etichette accessibili, dialogo modale nativo, feedback di errore, `prefers-reduced-motion`, safe area, video non deformati e caricamento del film soltanto dopo il tap. Non si usa WebGL.

## Verifica

Vedere **VERIFICA.md** per i controlli eseguiti, i risultati e i limiti della verifica.
