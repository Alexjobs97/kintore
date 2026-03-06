// plan.js — Scheda mensile Marzo 2026
// Questo file viene rigenerato ogni mese da Claude.
// Puoi anche aggiornare il piano direttamente nell'app (Impostazioni → Carica piano).

window.DEFAULT_PLAN = {
  id: "marzo2026",
  month: "Marzo",
  year: 2026,
  note: "Primo mese di ripresa. Obiettivo: costruire la routine, non spingere al massimo. La costanza vale più dell'intensità.",

  // Mappa giorno della settimana (0=Dom, 1=Lun, ...) → tipo sessione
  weekSchedule: {
    1: { type: "strength", sessionId: "A", label: "Forza A · Spinta + Core", emoji: "💪", color: "#B8FF45" },
    2: { type: "cardio",   sessionId: "run", label: "Corsa",                  emoji: "🏃", color: "#FF8C42" },
    3: { type: "rest_active", sessionId: null, label: "Riposo Attivo",        emoji: "🧘", color: "#a78bfa" },
    4: { type: "strength", sessionId: "B", label: "Forza B · Gambe + Schiena",emoji: "🦵", color: "#B8FF45" },
    5: { type: "cardio",   sessionId: "run", label: "Corsa",                  emoji: "🏃", color: "#FF8C42" },
    6: { type: "strength", sessionId: "C", label: "Forza C · Full Body",      emoji: "🔥", color: "#B8FF45" },
    0: { type: "rest",     sessionId: null, label: "Riposo completo",          emoji: "😴", color: "#4A9EFF" },
  },

  // Progressione cardio settimana per settimana
  cardioByWeek: {
    1: { structure: "4 × (2' corsa + 1' camminata)", durationMin: "22–24", notes: "Ritmo conversazionale. Se non riesci a parlare, stai andando troppo forte." },
    2: { structure: "5 × (3' corsa + 1' camminata)", durationMin: "26–28", notes: "Aumenta il blocco di corsa, mantieni lo stesso ritmo della settimana scorsa." },
    3: { structure: "Corsa continua 20–25 min",        durationMin: "20–25", notes: "Primo tentativo di corsa continua. Vai piano, finisci il tempo." },
    4: { structure: "Corsa continua 28–32 min",        durationMin: "28–32", notes: "Stai riprendendo il ritmo. Bel lavoro!" },
  },

  sessions: {
    A: {
      name: "Forza A — Spinta + Core",
      durationLabel: "45–55 min",
      focus: ["Petto", "Spalle", "Tricipiti", "Core"],
      exercises: [
        {
          id: "warmup_a",
          name: "Riscaldamento",
          type: "warmup",
          isTimer: true,
          duration: 180,
          sets: null, reps: null, rest: 0,
          desc: "Jumping jacks leggeri, rotazioni delle spalle, rotazioni del bacino, mobilità generale delle articolazioni.",
          notes: ""
        },
        {
          id: "pushup",
          name: "Flessioni",
          type: "strength",
          sets: 3, reps: "8–12", rest: 75,
          desc: "Posizione plank, mani larghezza spalle. Scendi finché il petto sfiora il pavimento, spingi su. Mantieni il core contratto.",
          notes: "Se non riesci a fare 8 reps complete: esegui in ginocchio o con le mani sul bordo di un divano."
        },
        {
          id: "shoulder_press",
          name: "Shoulder Press",
          type: "strength",
          sets: 3, reps: "12–15", rest: 60,
          desc: "Seduto o in piedi, manubri da 5 kg all'altezza delle spalle. Spingi verso l'alto quasi estendendo le braccia, abbassa lentamente.",
          notes: "Schiena dritta, non arcuare nella zona lombare."
        },
        {
          id: "tricep_dips",
          name: "Tricep Dips",
          type: "strength",
          sets: 3, reps: "10–12", rest: 60,
          desc: "Sul bordo di una sedia, gambe piegate a 90°. Scendi piegando i gomiti a ~90°, spingi su mantenendo il busto vicino alla sedia.",
          notes: "Tieni le spalle abbassate. Se senti fastidio alle spalle, prova con le mani più vicine al busto."
        },
        {
          id: "pike_pushup",
          name: "Pike Push-up",
          type: "strength",
          sets: 2, reps: "8–10", rest: 60,
          desc: "Posizione a V rovesciata (fianchi alti). Piega i gomiti abbassando la testa tra le mani, poi spingi su.",
          notes: "Più alzi i fianchi, più lavorano le spalle."
        },
        {
          id: "plank",
          name: "Plank Frontale",
          type: "core",
          isTimer: true,
          sets: 3, reps: "30–45 sec", rest: 45,
          desc: "Sui gomiti e le punte dei piedi. Corpo dritto dalla testa ai talloni. Core contratto, respira normalmente.",
          notes: "Se i fianchi cedono, riduci il tempo e fai più serie."
        },
        {
          id: "ab_wheel",
          name: "Ab Wheel",
          type: "core",
          sets: 3, reps: "6–10", rest: 60,
          desc: "In ginocchio. Fai rotolare la ruota in avanti lentamente, torna contraendo il core. Inizia con 30–40 cm di range.",
          notes: "Vai solo dove riesci a tornare con controllo. Aumenta il range gradualmente nel mese."
        },
        {
          id: "cooldown_a",
          name: "Defaticamento",
          type: "cooldown",
          isTimer: true,
          duration: 300,
          sets: null, reps: null, rest: 0,
          desc: "Stretching statico: petto a muro (30 sec per lato), spalle, tricipiti. Respirazione diaframmatica profonda.",
          notes: ""
        }
      ]
    },

    B: {
      name: "Forza B — Gambe + Schiena",
      durationLabel: "45–55 min",
      focus: ["Quadricipiti", "Glutei", "Femorali", "Schiena"],
      exercises: [
        {
          id: "warmup_b",
          name: "Riscaldamento",
          type: "warmup",
          isTimer: true,
          duration: 180,
          sets: null, reps: null, rest: 0,
          desc: "Leg swing frontali e laterali (10 per gamba), squat a corpo libero lenti (10), rotazioni del bacino.",
          notes: ""
        },
        {
          id: "squat",
          name: "Squat a corpo libero",
          type: "strength",
          sets: 3, reps: "15–20", rest: 60,
          desc: "Piedi larghezza spalle, punte leggermente aperte. Scendi come per sederti su una sedia, cosce parallele al pavimento. Spingi coi talloni per tornare su.",
          notes: "Ginocchia allineate ai piedi — non verso l'interno."
        },
        {
          id: "affondi",
          name: "Affondi Alternati",
          type: "strength",
          sets: 3, reps: "10 per gamba", rest: 60,
          desc: "Passo lungo in avanti, abbassa il ginocchio posteriore verso il pavimento, poi spingi col tallone anteriore per tornare. Alterna le gambe.",
          notes: "Busto dritto. Il ginocchio anteriore non deve sorpassare le punte dei piedi."
        },
        {
          id: "rdl",
          name: "Romanian Deadlift",
          type: "strength",
          sets: 3, reps: "12–15", rest: 60,
          desc: "Manubri da 5 kg davanti alle cosce. Schiena dritta, spingi i fianchi all'indietro abbassando i manubri lungo le gambe. Ferma quando senti tensione nei femorali.",
          notes: "La schiena non si arrotonda mai. È l'anca che si piega, non la colonna."
        },
        {
          id: "rematore",
          name: "Rematore 1 braccio",
          type: "strength",
          sets: 3, reps: "12 per braccio", rest: 60,
          desc: "Ginocchio e mano di supporto su una sedia. Tira il manubrio verso il fianco portando il gomito in alto, abbassa lentamente.",
          notes: "Tieni il gomito vicino al busto. Non ruotare il busto per aumentare il range."
        },
        {
          id: "glute_bridge",
          name: "Glute Bridge",
          type: "strength",
          sets: 3, reps: "15–20", rest: 45,
          desc: "Sdraiato, ginocchia piegate, piedi piatti. Spingi i fianchi verso il soffitto contraendo i glutei. Pausa di 2 secondi in cima.",
          notes: "La pausa di 2 secondi in alto è fondamentale. Stringi forte i glutei."
        },
        {
          id: "superman",
          name: "Superman",
          type: "strength",
          sets: 3, reps: "12–15", rest: 45,
          desc: "A pancia in giù, braccia tese. Solleva contemporaneamente braccia, petto e gambe. Mantieni 1–2 secondi, abbassa lentamente.",
          notes: "Guarda il pavimento, non stirare il collo. Solleva solo quanto riesci senza dolore."
        },
        {
          id: "cooldown_b",
          name: "Defaticamento",
          type: "cooldown",
          isTimer: true,
          duration: 300,
          sets: null, reps: null, rest: 0,
          desc: "Stretching femorali seduto (30 sec/lato), piriforme (figura 4, 30 sec/lato), quadricipiti in piedi (30 sec/lato). Gatto-vacca 10 respirazioni.",
          notes: ""
        }
      ]
    },

    C: {
      name: "Forza C — Full Body + Metabolismo",
      durationLabel: "45–55 min",
      focus: ["Full Body", "Cardio", "Core"],
      exercises: [
        {
          id: "warmup_c",
          name: "Riscaldamento",
          type: "warmup",
          isTimer: true,
          duration: 180,
          sets: null, reps: null, rest: 0,
          desc: "Marcia sul posto (1 min), rotazioni delle braccia, rotazioni delle caviglie, squat aerei lenti (10 reps).",
          notes: ""
        },
        {
          id: "burpee",
          name: "Burpee (facilitato)",
          type: "cardio",
          sets: 3, reps: "6–8", rest: 75,
          desc: "Parti in piedi, abbassati, cammina i piedi indietro in plank, cammina i piedi in avanti, torna in piedi. Versione facilitata: senza salto.",
          notes: "Se ti sembra troppo difficile, separa le due fasi: prima scendi, poi plank, poi risali. Aggiungi il salto nelle settimane successive."
        },
        {
          id: "curl_bicipiti",
          name: "Curl Bicipiti",
          type: "strength",
          sets: 3, reps: "12–15", rest: 60,
          desc: "Manubri da 5 kg, gomiti fissi ai fianchi. Piega le braccia verso le spalle, contrai i bicipiti 1 secondo in alto, abbassa in 3 secondi.",
          notes: "I gomiti non devono avanzare. La discesa lenta (3 sec) è dove avviene la crescita."
        },
        {
          id: "mountain_climbers",
          name: "Mountain Climbers",
          type: "cardio",
          sets: 3, reps: "20 totali", rest: 60,
          desc: "In plank su braccia tese. Porta alternativamente le ginocchia verso il petto a ritmo moderato. Fianchi stabili, core contratto.",
          notes: "Inizia lentamente con buona tecnica, poi aumenta la velocità. I fianchi non devono ondeggiare."
        },
        {
          id: "side_plank",
          name: "Side Plank",
          type: "core",
          isTimer: true,
          sets: 2, reps: "25–35 sec per lato", rest: 45,
          desc: "Sul fianco, gomito sotto la spalla. Solleva i fianchi fino ad avere il corpo dritto. Tieni la posizione, poi cambia lato.",
          notes: "Versione facilitata: mantieni le ginocchia a terra e solleva solo i fianchi."
        },
        {
          id: "goblet_squat",
          name: "Goblet Squat",
          type: "strength",
          sets: 3, reps: "12–15", rest: 60,
          desc: "Tieni i manubri al petto con entrambe le mani. Scendi in squat profondo usando i gomiti per aprire le ginocchia. Risali con talloni e glutei.",
          notes: "Il manubrio funge da contrappeso: ti aiuta a scendere più in profondità rispetto allo squat normale."
        },
        {
          id: "ab_wheel_combo",
          name: "Ab Wheel + Plank Combo",
          type: "core",
          sets: 3, reps: "8 rip. + 30 sec plank", rest: 75,
          desc: "Esegui 8 ripetizioni di Ab Wheel, poi senza pausa mantieni il plank frontale per 30 secondi. Poi recupera.",
          notes: "Inizia con meno rip. di Ab Wheel se necessario. La combo è impegnativa: rispetta il recupero da 75 secondi."
        },
        {
          id: "cooldown_c",
          name: "Defaticamento",
          type: "cooldown",
          isTimer: true,
          duration: 300,
          sets: null, reps: null, rest: 0,
          desc: "Gatto-vacca (10 respirazioni), stretching dorsali seduto, spalle, tutta la catena posteriore. Respirazione diaframmatica.",
          notes: ""
        }
      ]
    }
  }
};
