/* =========================================================
   WebChord
   synth.js

   Motor de síntesis basado en Web Audio API
   Soporte para múltiples acordes simultáneos
   ========================================================= */


/* ---------------------------------------------------------
   Variables del motor de audio
   --------------------------------------------------------- */

   let audioContext = null;

   let masterGain = null;
   
   let osciladoresActivos = [];
   
   
   /*
    * Cada acorde tiene su propio grupo de voces.
    *
    * Ejemplo:
    *
    * gruposAcordes
    *   ├── boton-0 → C E G
    *   ├── boton-1 → D F A
    *   └── boton-4 → G B D
    *
    */
   
   const gruposAcordes = new Map();
   
   
   /* ---------------------------------------------------------
      Configuración
      --------------------------------------------------------- */
   
   const SYNTH_CONFIG = {
   
       volumen: 0.5,
   
       tipoOnda: "triangle",
   
       ataque: 0.02,
   
       liberacion: 0.25,
   
       octava: 4
   
   };
   
   
   /* ---------------------------------------------------------
      Inicializar AudioContext
      --------------------------------------------------------- */
   
   function inicializarAudio() {
   
       if (audioContext) {
           return;
       }
   
   
       audioContext =
           new (
               window.AudioContext ||
               window.webkitAudioContext
           )();
   
   
       masterGain =
           audioContext.createGain();
   
   
       masterGain.gain.value =
           SYNTH_CONFIG.volumen;
   
   
       masterGain.connect(
           audioContext.destination
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Activar el motor de audio
      --------------------------------------------------------- */
   
   async function activarAudio() {
   
       inicializarAudio();
   
   
       if (
           audioContext.state ===
           "suspended"
       ) {
   
           await audioContext.resume();
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Cambiar volumen
      --------------------------------------------------------- */
   
   function establecerVolumen(valor) {
   
       SYNTH_CONFIG.volumen =
           Number(valor);
   
   
       if (!masterGain) {
           return;
       }
   
   
       masterGain.gain.setTargetAtTime(
   
           SYNTH_CONFIG.volumen,
   
           audioContext.currentTime,
   
           0.01
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Cambiar tipo de onda
      --------------------------------------------------------- */
   
   function establecerTipoOnda(tipo) {
   
       const tiposPermitidos = [
   
           "triangle",
   
           "sine",
   
           "square",
   
           "sawtooth"
   
       ];
   
   
       if (
           tiposPermitidos.includes(tipo)
       ) {
   
           SYNTH_CONFIG.tipoOnda =
               tipo;
   
       }
   
   }
 
   
   /* ---------------------------------------------------------
      Crear una voz individual
      --------------------------------------------------------- */
   
   function crearVoz(frecuencia) {
   
       const oscilador =
           audioContext.createOscillator();
   
   
       const gain =
           audioContext.createGain();
   
   
       oscilador.type =
           SYNTH_CONFIG.tipoOnda;
   
   
       oscilador.frequency.value =
           frecuencia;
   
   
       gain.gain.setValueAtTime(
   
           0,
   
           audioContext.currentTime
   
       );
   
   
       oscilador.connect(
           gain
       );
   
   
       gain.connect(
           masterGain
       );
   
   
       const ahora =
           audioContext.currentTime;
   
   
       /*
        * Ataque
        */
   
       gain.gain.linearRampToValueAtTime(
   
           0.32,
   
           ahora +
           SYNTH_CONFIG.ataque
   
       );
   
   
       oscilador.start(
           ahora
       );
   
   
       return {
   
           oscilador,
   
           gain
   
       };
   
   }
   
   
   /* ---------------------------------------------------------
      Reproducir una nota individual
      --------------------------------------------------------- */
   
   async function reproducirNota(
   
       nota,
   
       octava = SYNTH_CONFIG.octava
   
   ) {
   
       await activarAudio();
   
   
       const frecuencia =
           notaAFrecuencia(
               nota,
               octava
           );
   
   
       if (!frecuencia) {
           return null;
       }
   
   
       const voz =
           crearVoz(
               frecuencia
           );
   
   
       osciladoresActivos.push(
           voz
       );
   
   
       return voz;
   
   }
   
   
   /* ---------------------------------------------------------
      Reproducir un acorde independiente
      --------------------------------------------------------- */
   
   async function reproducirAcordeGrupo(
   
       id,
   
       notas,
   
       octava = SYNTH_CONFIG.octava
   
   ) {
   
       await activarAudio();
   
   
       /*
        * Si este grupo ya existe,
        * liberarlo antes de reconstruirlo.
        */
   
       if (
           gruposAcordes.has(id)
       ) {
   
           soltarAcordeGrupo(
               id
           );
   
       }
   
   
       const voces =
           new Map();
   
   
       /*
        * Crear las voces correspondientes
        * a las notas del acorde.
        */
   
       for (
           const nota of notas
       ) {
   
           const frecuencia =
               notaAFrecuencia(
                   nota,
                   octava
               );
   
   
           if (!frecuencia) {
               continue;
           }
   
   
           const voz =
               crearVoz(
                   frecuencia
               );
   
   
           const clave =
               claveNota(
                   nota,
                   octava
               );
   
   
           voces.set(
               clave,
               voz
           );
   
   
           osciladoresActivos.push(
               voz
           );
   
       }
   
   
       /*
        * Guardar el grupo completo.
        */
   
       gruposAcordes.set(
   
           id,
   
           voces
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Liberar un acorde específico
      --------------------------------------------------------- */
   
   function soltarAcordeGrupo(id) {
   
       const voces =
           gruposAcordes.get(
               id
           );
   
   
       if (!voces) {
           return;
       }
   
   
       gruposAcordes.delete(
           id
       );
   
   
       voces.forEach(
           voz => {
   
               liberarVoz(
                   voz
               );
   
           }
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Actualizar un acorde específico
      ---------------------------------------------------------
   
      Esta función mantiene las voces que continúan
      siendo necesarias y solamente crea o libera
      las notas que cambian.
   
      Ejemplo:
   
      C E G
   
      pasa a:
   
      C E G B
   
      solamente se crea B.
   
      --------------------------------------------------------- */
   
   async function actualizarAcordeGrupo(
   
       id,
   
       notas,
   
       octava = SYNTH_CONFIG.octava
   
   ) {
   
       await activarAudio();
   
   
       /*
        * Buscar el grupo actual.
        */
   
       let voces =
           gruposAcordes.get(
               id
           );
   
   
       /*
        * Si todavía no existe,
        * simplemente crear el acorde.
        */
   
       if (!voces) {
   
           await reproducirAcordeGrupo(
   
               id,
   
               notas,
   
               octava
   
           );
   
           return;
   
       }
   
   
       /*
        * Construir las nuevas notas.
        */
   
       const nuevasNotas =
           notas.map(
               nota => ({
   
                   nota: nota,
   
                   octava: octava,
   
                   clave:
                       claveNota(
                           nota,
                           octava
                       )
   
               })
           );
   
   
       const nuevasClaves =
           new Set(
   
               nuevasNotas.map(
                   item =>
                       item.clave
               )
   
           );
   
   
       /*
        * -----------------------------------------------------
        * 1. Liberar notas que ya no pertenecen al acorde
        * -----------------------------------------------------
        */
   
       for (
           const [clave, voz]
           of voces
       ) {
   
           if (
               !nuevasClaves.has(
                   clave
               )
           ) {
   
               liberarVoz(
                   voz
               );
   
   
               voces.delete(
                   clave
               );
   
           }
   
       }
   
   
       /*
        * -----------------------------------------------------
        * 2. Crear solamente las notas nuevas
        * -----------------------------------------------------
        */
   
       nuevasNotas.forEach(
           item => {
   
               if (
                   voces.has(
                       item.clave
                   )
               ) {
   
                   return;
   
               }
   
   
               const frecuencia =
                   notaAFrecuencia(
   
                       item.nota,
   
                       item.octava
   
                   );
   
   
               if (!frecuencia) {
                   return;
               }
   
   
               const voz =
                   crearVoz(
                       frecuencia
                   );
   
   
               voces.set(
   
                   item.clave,
   
                   voz
   
               );
   
   
               osciladoresActivos.push(
                   voz
               );
   
           }
       );
   
   
       /*
        * Guardar nuevamente el grupo.
        */
   
       gruposAcordes.set(
   
           id,
   
           voces
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Reproducir un acorde
      ---------------------------------------------------------
   
      Compatibilidad con el código anterior.
   
      Esta función representa ahora un acorde
      independiente identificado por un ID opcional.
   
      --------------------------------------------------------- */
   
   async function reproducirAcorde(
   
       notas,
   
       octava = SYNTH_CONFIG.octava,
   
       id = "acorde-principal"
   
   ) {
   
       await reproducirAcordeGrupo(
   
           id,
   
           notas,
   
           octava
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Actualizar un acorde
      ---------------------------------------------------------
   
      Compatibilidad con el código anterior.
   
      --------------------------------------------------------- */
   
   async function actualizarAcorde(
   
       notas,
   
       octava = SYNTH_CONFIG.octava,
   
       id = "acorde-principal"
   
   ) {
   
       await actualizarAcordeGrupo(
   
           id,
   
           notas,
   
           octava
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Soltar acorde principal
      ---------------------------------------------------------
   
      Compatibilidad con código anterior.
   
      --------------------------------------------------------- */
   
   function soltarAcorde(
       id = "acorde-principal"
   ) {
   
       soltarAcordeGrupo(
           id
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Cambiar octava
      --------------------------------------------------------- */
   
   function establecerOctava(octava) {
   
       const nuevaOctava =
           Number(
               octava
           );
   
   
       if (
   
           nuevaOctava >= 1 &&
   
           nuevaOctava <= 7
   
       ) {
   
           SYNTH_CONFIG.octava =
               nuevaOctava;
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Convertir nota en clave
      --------------------------------------------------------- */
   
   function claveNota(
       nota,
       octava
   ) {
   
       return `${nota}${octava}`;
   
   }
   
   
   /* ---------------------------------------------------------
      Liberar una voz
      --------------------------------------------------------- */
   
   function liberarVoz(voz) {
   
       if (
           !audioContext ||
           !voz
       ) {
   
           return;
   
       }
   
   
       const ahora =
           audioContext.currentTime;
   
   
       try {
   
           /*
            * Cancelar automatizaciones anteriores.
            */
   
           voz.gain.gain.cancelScheduledValues(
               ahora
           );
   
   
           /*
            * Obtener el volumen actual.
            */
   
           const volumenActual =
               Math.max(
   
                   voz.gain.gain.value,
   
                   0.001
   
               );
   
   
           voz.gain.gain.setValueAtTime(
   
               volumenActual,
   
               ahora
   
           );
   
   
           /*
            * Liberación.
            */
   
           voz.gain.gain.exponentialRampToValueAtTime(
   
               0.001,
   
               ahora +
               SYNTH_CONFIG.liberacion
   
           );
   
   
           /*
            * Detener el oscilador después
            * de terminar la liberación.
            */
   
           voz.oscilador.stop(
   
               ahora +
   
               SYNTH_CONFIG.liberacion +
   
               0.05
   
           );
   
   
           /*
            * Retirar la voz de la lista
            * de osciladores activos.
            */
   
           setTimeout(
   
               () => {
   
                   const indice =
                       osciladoresActivos.indexOf(
                           voz
                       );
   
   
                   if (
                       indice !== -1
                   ) {
   
                       osciladoresActivos.splice(
   
                           indice,
   
                           1
   
                       );
   
                   }
   
               },
   
               (
                   SYNTH_CONFIG.liberacion +
                   0.1
               ) * 1000
   
           );
   
   
       } catch (error) {
   
           console.warn(
   
               "Error liberando voz:",
   
               error
   
           );
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Obtener notas actuales
      ---------------------------------------------------------
   
      Ahora devuelve todas las notas que están
      sonando en todos los grupos.
   
      --------------------------------------------------------- */
   
   function obtenerNotasActuales() {
   
       const notas = [];
   
   
       gruposAcordes.forEach(
           voces => {
   
               voces.forEach(
                   (_, clave) => {
   
                       notas.push(
                           clave
                       );
   
                   }
               );
   
           }
       );
   
   
       return notas;
   
   }