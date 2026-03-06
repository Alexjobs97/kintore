// exercises.js — Exercise database for FitTrack
// Each exercise has: id, name, category, muscles, emoji, desc, steps, tips, ytQuery

window.EXERCISES_DB = [
  {
    id: "pushup",
    name: "Flessioni (Push-up)",
    category: "strength",
    muscles: ["Petto", "Tricipiti", "Spalle"],
    emoji: "💪",
    desc: "Esercizio fondamentale per il petto, le spalle e i tricipiti. Costruisce forza funzionale e stabilità del core.",
    steps: [
      "Posizionati in plank: mani larghezza spalle, corpo dritto dalla testa ai talloni.",
      "Abbassa il petto verso il pavimento piegando i gomiti a ~45° (non a 90°).",
      "Scendi finché il petto sfiora quasi il pavimento.",
      "Spingi con forza verso l'alto, estendendo completamente le braccia.",
      "Mantieni il core contratto per tutta l'esecuzione."
    ],
    tips: "Se non riesci a fare 8 reps complete, inizia con le mani sul bordo di un divano (più facile) oppure esegui in ginocchio. L'obiettivo del mese 1 è arrivare a 3×10 reps complete.",
    ytQuery: "come fare flessioni correttamente tutorial",
    difficulty: 2
  },
  {
    id: "shoulder_press",
    name: "Shoulder Press (Manubri)",
    category: "strength",
    muscles: ["Spalle", "Tricipiti", "Trapezio"],
    emoji: "🏋️",
    desc: "Esercizio per lo sviluppo delle spalle e la stabilità del cingolo scapolare. Si esegue seduto o in piedi con i manubri da 5 kg.",
    steps: [
      "Siediti su una sedia o stai in piedi con la schiena dritta.",
      "Porta i manubri all'altezza delle spalle, gomiti a 90°, palme in avanti.",
      "Spingi i manubri verso l'alto fino a quasi estendere le braccia (non bloccare i gomiti).",
      "Abbassa lentamente i manubri tornando alla posizione di partenza (conta 2 secondi).",
      "Mantieni il core contratto e non arcuare la schiena."
    ],
    tips: "La fase di discesa (eccentrica) è altrettanto importante: prenditi 2 secondi per scendere. Non sbattere i manubri in alto.",
    ytQuery: "shoulder press manubri tutorial principianti",
    difficulty: 2
  },
  {
    id: "tricep_dips",
    name: "Tricep Dips (su sedia)",
    category: "strength",
    muscles: ["Tricipiti", "Petto", "Spalle anteriori"],
    emoji: "🪑",
    desc: "Esercizio efficace per i tricipiti che richiede solo una sedia. Attenzione alla posizione delle spalle.",
    steps: [
      "Siediti sul bordo di una sedia resistente, mani ai lati delle cosce, dita rivolte in avanti.",
      "Avanza con i piedi e solleva i glutei dalla sedia, restando con le braccia tese.",
      "Pega le ginocchia a 90° (più facile) o tienile quasi dritte (più difficile).",
      "Scendi lentamente piegando i gomiti fino a portarli a ~90°.",
      "Spingi verso l'alto tornando alla posizione iniziale."
    ],
    tips: "Tieni il busto vicino alla sedia mentre scendi — non uscire troppo in avanti o caricherai le spalle invece dei tricipiti. Le spalle devono restare abbassate.",
    ytQuery: "tricep dips sedia tutorial",
    difficulty: 2
  },
  {
    id: "pike_pushup",
    name: "Pike Push-up",
    category: "strength",
    muscles: ["Spalle", "Tricipiti", "Core"],
    emoji: "▲",
    desc: "Variante del push-up che isola le spalle. La posizione a V rovesciata sposta il carico dai pettorali ai deltoidi.",
    steps: [
      "Parti in posizione plank e solleva i fianchi verso il soffitto formando una V rovesciata.",
      "Mani larghezza spalle, talloni a terra (o sollevati se non arrivi).",
      "Piega i gomiti abbassando la testa verso il pavimento tra le mani.",
      "Scendi finché la testa sfiora quasi il pavimento.",
      "Spingi verso l'alto tornando alla V rovesciata."
    ],
    tips: "Più alzi i fianchi, più lavoreranno le spalle. Inizia con i fianchi a 90° e aumenta progressivamente l'altezza.",
    ytQuery: "pike push up spalle tutorial",
    difficulty: 3
  },
  {
    id: "plank",
    name: "Plank Frontale",
    category: "core",
    muscles: ["Core", "Addominali", "Lombari", "Spalle"],
    emoji: "⬛",
    desc: "Esercizio isometrico fondamentale per il core. Rinforza tutta la catena muscolare anteriore e posteriore del tronco.",
    steps: [
      "Posizionati sui gomiti e sulle punte dei piedi.",
      "Tieni il corpo in linea retta dalla testa ai talloni — niente sedere in su o in giù.",
      "Contrai gli addominali come se aspettassi un pugno allo stomaco.",
      "Guarda il pavimento, mantenendo il collo neutro.",
      "Respira normalmente e tieni la posizione per il tempo indicato."
    ],
    tips: "Se i fianchi cedono, riduci il tempo e fai più serie. È meglio un plank perfetto da 20 secondi che uno da 60 con i fianchi in su.",
    ytQuery: "plank frontale corretto tutorial core",
    difficulty: 2
  },
  {
    id: "ab_wheel",
    name: "Ab Wheel (Ruota Addominali)",
    category: "core",
    muscles: ["Addominali", "Lombari", "Dorsali", "Spalle"],
    emoji: "⭕",
    desc: "Uno degli esercizi più efficaci per il core. Richiede il controllo attivo di tutta la catena del tronco. Inizia in ginocchio.",
    steps: [
      "Inizia in ginocchio su un tappetino, tieni la ruota con entrambe le mani dinanzi alle ginocchia.",
      "Fai rotolare la ruota in avanti in modo lento e controllato.",
      "Avanza solo finché riesci a tornare indietro senza collassare (inizia con 30-40 cm).",
      "Contrai gli addominali e i glutei per non arcuare la schiena.",
      "Torna alla posizione iniziale contraendo fortemente il core."
    ],
    tips: "Il segreto è il ritorno: non 'cadere' in avanti, ma andare solo dove sei in grado di tornare con controllo. Aumenta il range gradualmente nel corso del mese.",
    ytQuery: "ab wheel addominali tutorial principianti",
    difficulty: 4
  },
  {
    id: "squat",
    name: "Squat a corpo libero",
    category: "strength",
    muscles: ["Quadricipiti", "Glutei", "Femorali", "Core"],
    emoji: "🦵",
    desc: "Il re degli esercizi per le gambe. Rinforza tutta la catena cinetica inferiore e migliora la mobilità dell'anca.",
    steps: [
      "Stai in piedi con i piedi larghezza spalle (o leggermente più larghi), punte leggermente verso l'esterno.",
      "Inizia il movimento spingendo i fianchi all'indietro, come se volessi sederti su una sedia.",
      "Scendi finché le cosce sono parallele al pavimento (o più in basso se la mobilità lo permette).",
      "Tieni il petto alto, le ginocchia sopra le punte dei piedi (non verso l'interno).",
      "Spingi con i talloni per tornare su, espira."
    ],
    tips: "Visualizza le tue ginocchia che \"aprono\" verso l'esterno. Se i talloni si sollevano, prova con i piedi più larghi o metti qualcosa di piatto sotto i talloni.",
    ytQuery: "squat corpo libero tecnica corretta tutorial",
    difficulty: 1
  },
  {
    id: "affondi",
    name: "Affondi Alternati (Lunge)",
    category: "strength",
    muscles: ["Quadricipiti", "Glutei", "Femorali", "Polpacci"],
    emoji: "🚶",
    desc: "Esercizio unilaterale per le gambe. Migliora l'equilibrio e corregge eventuali asimmetrie tra i due lati.",
    steps: [
      "Parti in piedi con i piedi uniti, mani sui fianchi o lungo i fianchi.",
      "Fai un passo lungo in avanti con la gamba destra.",
      "Abbassa il ginocchio sinistro verso il pavimento, senza toccarlo.",
      "Il ginocchio anteriore deve stare sopra la caviglia, non oltre le punte.",
      "Spingi con il tallone anteriore per tornare alla posizione iniziale e alterna la gamba."
    ],
    tips: "Il passo deve essere abbastanza lungo: se il ginocchio anteriore avanza troppo, il passo era troppo corto. Il busto resta sempre dritto.",
    ytQuery: "affondi alternati lunge tecnica corretta",
    difficulty: 2
  },
  {
    id: "rdl",
    name: "Romanian Deadlift (Manubri)",
    category: "strength",
    muscles: ["Femorali", "Glutei", "Lombari", "Core"],
    emoji: "🔽",
    desc: "Esercizio per la catena posteriore: femorali, glutei e lombari. Con i manubri da 5 kg è perfetto per iniziare.",
    steps: [
      "Stai in piedi con i manubri davanti alle cosce, piedi larghezza fianchi.",
      "Mantieni la schiena dritta e inizia il movimento \"spingendo\" i fianchi all'indietro.",
      "Abbassa i manubri lungo le gambe (quasi a sfiorarle) tenendo le ginocchia leggermente piegate.",
      "Scendi finché senti un allungamento nei femorali (di solito fino a metà stinco).",
      "Contrai i glutei per tornare alla posizione verticale, spingi i fianchi in avanti."
    ],
    tips: "Immagina di spingere il muro dietro di te con i fianchi. La schiena non si deve mai arrotondare: è l'anca che \"cerniera\", non la colonna.",
    ytQuery: "romanian deadlift manubri tutorial principianti",
    difficulty: 3
  },
  {
    id: "rematore",
    name: "Rematore con Manubrio (1 braccio)",
    category: "strength",
    muscles: ["Dorsali", "Bicipiti", "Romboidi", "Core"],
    emoji: "🚣",
    desc: "Esercizio fondamentale per i muscoli della schiena. Contrasta la postura sedentaria e sviluppa la forza di tirata.",
    steps: [
      "Posiziona il ginocchio e la mano dello stesso lato su una sedia o il bordo del letto (supporto).",
      "Con l'altra mano prendi il manubrio, braccio disteso verso il pavimento.",
      "Tira il manubrio verso il fianco, portando il gomito il più in alto possibile.",
      "Tieni il gomito vicino al busto (non aprire il braccio lateralmente).",
      "Abbassa lentamente il manubrio in 2 secondi, senza ruotare il busto."
    ],
    tips: "Immagina di \"schiacciare una noce\" tra la scapola e la colonna nella fase di salita. Evita di ruotare il busto per aumentare il range.",
    ytQuery: "rematore manubrio un braccio tecnica schiena",
    difficulty: 2
  },
  {
    id: "glute_bridge",
    name: "Glute Bridge",
    category: "strength",
    muscles: ["Glutei", "Femorali", "Core", "Lombari"],
    emoji: "🌉",
    desc: "Esercizio sottovalutato ma fondamentale per attivare i glutei e proteggere la zona lombare.",
    steps: [
      "Sdraiati a pancia su con le ginocchia piegate a ~90°, piedi piatti sul pavimento.",
      "Posiziona le braccia lungo i fianchi, palme verso il basso.",
      "Contrai i glutei e spingi i fianchi verso il soffitto.",
      "Tieni la posizione in alto per 2 secondi, stringendo forte i glutei.",
      "Abbassa lentamente i fianchi senza toccare completamente il pavimento tra una rep e l'altra."
    ],
    tips: "La pausa di 2 secondi in alto è fondamentale: molti la saltano e perdono il 50% del beneficio. Se senti i femorali invece dei glutei, avvicina i piedi.",
    ytQuery: "glute bridge glutei tutorial attivazione",
    difficulty: 1
  },
  {
    id: "superman",
    name: "Superman (Estensioni Dorsali)",
    category: "strength",
    muscles: ["Lombari", "Glutei", "Trapezio", "Estensori schiena"],
    emoji: "🦸",
    desc: "Rinforza la catena posteriore e contrasta i danni della postura sedentaria. Fondamentale per la salute della schiena.",
    steps: [
      "Sdraiati a pancia in giù su un tappetino, braccia tese davanti a te.",
      "Contemporaneamente, solleva le braccia, il petto e le gambe dal pavimento.",
      "Mantieni la posizione per 1-2 secondi, contraendo i glutei e i lombari.",
      "Abbassa lentamente tornando alla posizione iniziale.",
      "Variante: alza braccio destro e gamba sinistra in alternanza."
    ],
    tips: "Non stirare il collo verso l'alto: guarda sempre il pavimento. Solleva solo quanto riesci senza dolore nella zona lombare.",
    ytQuery: "superman esercizio schiena lombari tutorial",
    difficulty: 1
  },
  {
    id: "burpee",
    name: "Burpee (versione facilitata)",
    category: "cardio",
    muscles: ["Full Body", "Cardio"],
    emoji: "💥",
    desc: "Esercizio full-body ad alta intensità. La versione facilitata per principianti rimuove il salto plyometrico.",
    steps: [
      "Parti in piedi, piedi larghezza spalle.",
      "Abbassati e posiziona le mani a terra davanti a te.",
      "Salta (o cammina) con i piedi indietro fino alla posizione plank.",
      "Esegui una flessione (opzionale per la versione base).",
      "Salta (o cammina) con i piedi verso le mani, poi torna in piedi. Versione facilitata: nessun salto finale."
    ],
    tips: "Per la versione facilitata: cammina i piedi invece di saltarli. Aggiunge di intensità con i salti progressivamente nelle settimane successive.",
    ytQuery: "burpee principianti versione facile tutorial",
    difficulty: 3
  },
  {
    id: "curl_bicipiti",
    name: "Curl Bicipiti (Manubri)",
    category: "strength",
    muscles: ["Bicipiti", "Brachiale", "Avambracci"],
    emoji: "💪",
    desc: "Esercizio classico per i bicipiti. Con i 5 kg e la tecnica corretta, costruisce efficacemente la massa del braccio.",
    steps: [
      "Stai in piedi o siediti, manubri lungo i fianchi, palme rivolte in avanti.",
      "Tieni i gomiti fermi vicino ai fianchi per tutto il movimento.",
      "Piega le braccia portando i manubri verso le spalle.",
      "Contrai i bicipiti nella posizione alta per 1 secondo.",
      "Abbassa lentamente (conta 3 secondi) per massimizzare l'effetto."
    ],
    tips: "I gomiti sono il punto fisso: non devono avanzare durante il movimento. La fase di discesa lenta (3 secondi) è dove avviene la maggior parte della crescita muscolare.",
    ytQuery: "curl bicipiti manubri tecnica corretta",
    difficulty: 1
  },
  {
    id: "mountain_climbers",
    name: "Mountain Climbers",
    category: "cardio",
    muscles: ["Core", "Spalle", "Quadricipiti", "Cardio"],
    emoji: "🧗",
    desc: "Esercizio cardio-core eccellente. Lavora sugli addominali in modo dinamico con benefici cardiovascolari.",
    steps: [
      "Inizia in posizione plank su braccia tese, mani larghezza spalle.",
      "Porta il ginocchio destro verso il petto in modo rapido.",
      "Rimanda il piede destro indietro mentre porti il ginocchio sinistro verso il petto.",
      "Alterna le gambe in modo fluido (come se corrissi sul posto in plank).",
      "Mantieni il core contratto e i fianchi stabili (non su e giù)."
    ],
    tips: "I fianchi devono restare fermi — se si muovono su e giù, rallenta. Inizia lentamente con buona tecnica, poi aumenta la velocità gradualmente.",
    ytQuery: "mountain climbers tutorial core addominali",
    difficulty: 2
  },
  {
    id: "side_plank",
    name: "Side Plank (Plank Laterale)",
    category: "core",
    muscles: ["Obliqui", "Core laterale", "Gluteo medio", "Spalle"],
    emoji: "◢",
    desc: "Variante del plank che isola gli obliqui e il core laterale. Fondamentale per la stabilità della colonna.",
    steps: [
      "Sdraiati su un fianco, gomito sotto la spalla, corpo in linea retta.",
      "Solleva i fianchi da terra fino ad avere il corpo dritto dalla testa ai piedi.",
      "Tieni il braccio libero lungo il corpo o sul fianco.",
      "Mantieni la posizione per il tempo indicato senza cedere con i fianchi.",
      "Ripeti sull'altro lato."
    ],
    tips: "Versione facilitata: lascia le ginocchia a terra e solleva solo i fianchi. Se hai dolore al polso, usa il pugno chiuso invece della mano aperta.",
    ytQuery: "side plank laterale obliqui tutorial",
    difficulty: 2
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat (Manubri)",
    category: "strength",
    muscles: ["Quadricipiti", "Glutei", "Core", "Femorali"],
    emoji: "🏆",
    desc: "Variante dello squat con manubrio tenuto al petto. Migliora la profondità dello squat e rinforza il core.",
    steps: [
      "Tieni un manubrio verticalmente davanti al petto con entrambe le mani (o due manubri affiancati).",
      "Piedi larghezza spalle, punte leggermente verso l'esterno.",
      "Scendi in squat profondo, usando i gomiti per \"aprire\" le ginocchia verso l'esterno.",
      "Il manubrio al petto ti aiuterà a tenere il busto più verticale rispetto allo squat normale.",
      "Risali spingendo con talloni e glutei."
    ],
    tips: "Il manubrio funge da contrappeso: usalo per scendere più in profondità. Se hai difficoltà con la mobilità, è normale all'inizio — migliorerà.",
    ytQuery: "goblet squat manubrio tutorial tecnica",
    difficulty: 2
  },
  {
    id: "jumping_jacks",
    name: "Jumping Jacks",
    category: "warmup",
    muscles: ["Full Body", "Cardio"],
    emoji: "⭐",
    desc: "Esercizio di riscaldamento classico per attivare la circolazione e aumentare la temperatura corporea.",
    steps: [
      "Parti in piedi con i piedi uniti e le braccia lungo i fianchi.",
      "Salta aprendo le gambe (larghezza spalle) e portando le braccia sopra la testa.",
      "Salta di nuovo tornando alla posizione iniziale.",
      "Mantieni un ritmo costante e le ginocchia leggermente piegate all'atterraggio."
    ],
    tips: "Se hai problemi alle ginocchia, esegui la versione senza salto: apri le gambe alternandole lateralmente senza staccarti da terra.",
    ytQuery: "jumping jacks riscaldamento tutorial",
    difficulty: 1
  },
  {
    id: "cat_cow",
    name: "Gatto-Vacca (Cat-Cow)",
    category: "mobility",
    muscles: ["Colonna vertebrale", "Core", "Flessori anca"],
    emoji: "🐱",
    desc: "Esercizio di mobilità della colonna vertebrale. Ideale per il defaticamento e per sciogliere la zona lombare.",
    steps: [
      "Parti a quattro zampe: mani sotto le spalle, ginocchia sotto i fianchi.",
      "VACCA: inspira e lascia cadere il ventre verso il pavimento, alzando testa e coccige.",
      "GATTO: espira e arrotonda la schiena verso il soffitto, abbassando testa e coccige.",
      "Alterna le due posizioni lentamente, seguendo il ritmo del respiro.",
      "Esegui 10 respirazioni profonde, senza fretta."
    ],
    tips: "Questo esercizio si fa lentamente e non va forzato. Segui il respiro: inspira nella posizione vacca, espira nella posizione gatto.",
    ytQuery: "cat cow mobilità schiena tutorial",
    difficulty: 1
  },
  {
    id: "stretching_quadricipiti",
    name: "Stretching Quadricipiti",
    category: "cooldown",
    muscles: ["Quadricipiti"],
    emoji: "🦵",
    desc: "Stretching statico fondamentale da eseguire dopo ogni sessione che prevede squat e affondi.",
    steps: [
      "Stai in piedi vicino a un muro o una sedia per l'equilibrio.",
      "Piega il ginocchio portando il piede verso il gluteo.",
      "Afferra la caviglia con la mano dello stesso lato.",
      "Tieni le ginocchia vicine tra loro e il busto dritto.",
      "Mantieni per 30 secondi, poi cambia lato. Non forzare."
    ],
    tips: "Non tirare la gamba lateralmente — tieni le ginocchia allineate. Se non arrivi alla caviglia, usa un asciugamano come prolunga.",
    ytQuery: "stretching quadricipiti gambe dopo allenamento",
    difficulty: 1
  },
  {
    id: "stretching_femorali",
    name: "Stretching Femorali",
    category: "cooldown",
    muscles: ["Femorali", "Polpacci"],
    emoji: "🧘",
    desc: "Stretching statico per i femorali. Fondamentale per i corridori e dopo ogni sessione con squat e deadlift.",
    steps: [
      "Siediti sul pavimento con una gamba tesa davanti e l'altra piegata con il piede al fianco.",
      "Inclinati in avanti verso il piede teso mantenendo la schiena il più dritta possibile.",
      "Cerca di raggiungere il piede o la caviglia con le mani.",
      "Mantieni per 30 secondi senza rimbalzare. Espira lentamente.",
      "Cambia lato."
    ],
    tips: "Non arrotondare la schiena per arrivare più in basso: mantieni la schiena dritta e inclinati dall'anca, non dalla colonna.",
    ytQuery: "stretching femorali seduto tutorial",
    difficulty: 1
  },
  {
    id: "stretching_petto",
    name: "Stretching Petto (a muro)",
    category: "cooldown",
    muscles: ["Pettorali", "Spalla anteriore", "Bicipite"],
    emoji: "🙌",
    desc: "Stretching fondamentale dopo ogni sessione con push-up e press. Apre il petto e contrasta la postura curva.",
    steps: [
      "Avvicinati a un muro o allo stipite di una porta.",
      "Posiziona il braccio teso sul muro con la mano a livello della spalla o leggermente più in alto.",
      "Ruota lentamente il busto nella direzione opposta finché senti la tensione nel petto.",
      "Mantieni per 30 secondi respirando profondamente.",
      "Ripeti sull'altro lato."
    ],
    tips: "Più alta metti la mano sul muro, più lavoreranno le fibre superiori del petto. Abbassando la mano coinvolgi le fibre inferiori.",
    ytQuery: "stretching petto muro apertura torace",
    difficulty: 1
  }
];

// Protein sources for nutrition page
window.PROTEIN_SOURCES = [
  { name: "Seitan", prot: "25g/100g", note: "Molto proteico. Da evitare se hai intolleranza al glutine." },
  { name: "Tempeh", prot: "19g/100g", note: "Fermentato, più digeribile del tofu e molto proteico." },
  { name: "Legumi (lenticchie ecc.)", prot: "18g/100g", note: "Abbinali ai cereali per proteine complete." },
  { name: "Tofu (fermo)", prot: "12g/100g", note: "Versatile, prende il sapore dei condimenti." },
  { name: "Skyr / Yogurt greco", prot: "10-17g/100g", note: "Ottimo per colazione e spuntini." },
  { name: "Edamame", prot: "11g/100g", note: "Snack pratico e completo." },
  { name: "Uova", prot: "6g/uovo", note: "Proteine complete di alta qualità (se ovo-vegetariano)." },
  { name: "Quinoa", prot: "4g/100g cotta", note: "Unico cereale con tutti gli aminoacidi essenziali." },
  { name: "Parmigiano", prot: "36g/100g", note: "Usalo come condimento, non come base del pasto." },
];
