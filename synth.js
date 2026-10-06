/* =========================================================
   HiChord Web
   synth.js

   Motor de síntesis basado en Web Audio API

   Sistema:
   - Voces individuales
   - Grupos de acordes independientes
   - Polifonía entre botones
   - Compatibilidad con funciones anteriores
   ========================================================= */


/* ---------------------------------------------------------
   Variables del motor de audio
   --------------------------------------------------------- */

   let audioContext = null;

   let masterGain = null;
   
   
   /*
    * Todas las voces que están siendo reproducidas.
    *
    * Se utiliza principalmente para poder detener
    * completamente el motor cuando sea necesario.
    */
   
   let osciladoresActivos = [];
   
   
   /*
    * Acorde utilizado por las funciones antiguas
    * de compatibilidad.
    */
   
   let acordeActual = [];
   
   
   /*
    * ---------------------------------------------------------
    * GRUPOS DE ACORDES
    * ---------------------------------------------------------
    *
    * Cada botón tendrá su propio grupo:
    *
    * acorde-0
    * acorde-1
    * acorde-2
    * ...
    * acorde-6
    *
    * Cada grupo contiene un Map de voces.
    *
    * gruposAcordes
    *
    *     acorde-0 → Map(...)
    *     acorde-1 → Map(...)
    *     acorde-4 → Map(...)
    *
    * Esto permite que varios acordes suenen
    * simultáneamente y puedan liberarse
    * de forma independiente.
    * ---------------------------------------------------------
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
   
   
       /*
        * Comenzamos en silencio.
        */
   
       gain.gain.setValueAtTime(
   
           0,
   
           audioContext.currentTime
   
       );
   
   
       oscilador.connect(gain);
   
       gain.connect(masterGain);
   
   
       const ahora =
           audioContext.currentTime;
   
   
       /*
        * Ataque.
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
   
           voz.gain.gain.cancelScheduledValues(
               ahora
           );
   
   
           const volumenActual =
               Math.max(
   
                   voz.gain.gain.value,
   
                   0.001
   
               );
   
   
           voz.gain.gain.setValueAtTime(
   
               volumenActual,
   
               ahora
   
           );
   
   
           voz.gain.gain.exponentialRampToValueAtTime(
   
               0.001,
   
               ahora +
               SYNTH_CONFIG.liberacion
   
           );
   
   
           voz.oscilador.stop(
   
               ahora +
               SYNTH_CONFIG.liberacion +
               0.05
   
           );
   
   
           setTimeout(() => {
   
               const indice =
                   osciladoresActivos.indexOf(
                       voz
                   );
   
   
               if (indice !== -1) {
   
                   osciladoresActivos.splice(
   
                       indice,
   
                       1
   
                   );
   
               }
   
           }, (
   
               SYNTH_CONFIG.liberacion +
               0.1
   
           ) * 1000);
   
   
       } catch (error) {
   
           console.warn(
   
               "Error liberando voz:",
   
               error
   
           );
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Reproducir una nota individual
      --------------------------------------------------------- */
   
   async function reproducirNota(
   
       nota,
   
       octava =
           SYNTH_CONFIG.octava
   
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
   
   
   /* =========================================================
      SISTEMA DE GRUPOS DE ACORDES
      ========================================================= */
   
   
   /* ---------------------------------------------------------
      Reproducir un grupo de acorde
      --------------------------------------------------------- */
   
   async function reproducirAcordeGrupo(
   
       id,
   
       notas,
   
       octava =
           SYNTH_CONFIG.octava
   
   ) {
   
       await activarAudio();
   
   
       /*
        * Si el grupo ya existe,
        * liberamos solamente ese grupo.
        */
   
       if (
           gruposAcordes.has(id)
       ) {
   
           soltarAcordeGrupo(id);
   
       }
   
   
       const voces =
           new Map();
   
   
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
   
   
       gruposAcordes.set(
   
           id,
   
           voces
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Soltar un grupo de acorde
      --------------------------------------------------------- */
   
   function soltarAcordeGrupo(id) {
   
       const voces =
           gruposAcordes.get(id);
   
   
       if (!voces) {
           return;
       }
   
   
       /*
        * Primero eliminamos el grupo del Map.
        */
   
       gruposAcordes.delete(id);
   
   
       /*
        * Después liberamos únicamente
        * sus voces.
        */
   
       voces.forEach(
   
           voz => {
   
               liberarVoz(
                   voz
               );
   
           }
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Actualizar un grupo de acorde
      ---------------------------------------------------------
   
      Esta función permite cambiar las notas de un acorde
      mientras otros grupos continúan sonando.
   
      Ejemplo:
   
      acorde-0 → C E G
   
      cambia a:
   
      acorde-0 → C E G B
   
      Los demás grupos no son modificados.
      --------------------------------------------------------- */
   
   async function actualizarAcordeGrupo(
   
       id,
   
       notas,
   
       octava =
           SYNTH_CONFIG.octava
   
   ) {
   
       await activarAudio();
   
   
       const voces =
           gruposAcordes.get(id);
   
   
       /*
        * Si el grupo no existe,
        * no hacemos nada.
        */
   
       if (!voces) {
           return;
       }
   
   
       const nuevasNotas =
           notas.map(nota => ({
   
               nota: nota,
   
               octava: octava,
   
               clave:
                   claveNota(
   
                       nota,
   
                       octava
   
                   )
   
           }));
   
   
       const nuevasClaves =
           new Set(
   
               nuevasNotas.map(
   
                   item =>
                       item.clave
   
               )
   
           );
   
   
       /*
        * -----------------------------------------------------
        * 1. Liberar notas que ya no pertenecen
        *    al nuevo acorde.
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
        * 2. Crear las notas nuevas.
        * -----------------------------------------------------
        */
   
       nuevasNotas.forEach(item => {
   
           /*
            * Si la nota ya estaba sonando,
            * la conservamos.
            */
   
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
   
       });
   
   }
   
   
   /* =========================================================
      FUNCIONES DE COMPATIBILIDAD
      ========================================================= */
   
   
   /* ---------------------------------------------------------
      Actualizar acorde principal
      ---------------------------------------------------------
   
      Compatibilidad con el sistema anterior.
   
      Se utiliza un grupo especial:
   
      "acorde-principal"
      --------------------------------------------------------- */
   
   async function actualizarAcorde(
   
       notas,
   
       octava =
           SYNTH_CONFIG.octava
   
   ) {
   
       acordeActual =
           [...notas];
   
   
       await actualizarOReproducirGrupoCompatibilidad(
   
           "acorde-principal",
   
           notas,
   
           octava
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Reproducir acorde
      ---------------------------------------------------------
   
      Compatibilidad con código anterior.
      --------------------------------------------------------- */
   
   async function reproducirAcorde(
   
       notas,
   
       octava =
           SYNTH_CONFIG.octava
   
   ) {
   
       acordeActual =
           [...notas];
   
   
       await reproducirAcordeGrupo(
   
           "acorde-principal",
   
           notas,
   
           octava
   
       );
   
   }
   
   
   /* ---------------------------------------------------------
      Función auxiliar de compatibilidad
      --------------------------------------------------------- */
   
   async function actualizarOReproducirGrupoCompatibilidad(
   
       id,
   
       notas,
   
       octava
   
   ) {
   
       if (
           gruposAcordes.has(id)
       ) {
   
           await actualizarAcordeGrupo(
   
               id,
   
               notas,
   
               octava
   
           );
   
       } else {
   
           await reproducirAcordeGrupo(
   
               id,
   
               notas,
   
               octava
   
           );
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Soltar acorde principal
      ---------------------------------------------------------
   
      Compatibilidad con código anterior.
      --------------------------------------------------------- */
   
   function soltarAcorde(
   
       id =
           "acorde-principal"
   
   ) {
   
       soltarAcordeGrupo(
           id
       );
   
   
       /*
        * Si estamos liberando el grupo utilizado
        * por las funciones antiguas, limpiamos
        * también su estado.
        */
   
       if (
           id ===
           "acorde-principal"
       ) {
   
           acordeActual = [];
   
       }
   
   }
   
   
   /* ---------------------------------------------------------
      Detener todos los sonidos
      --------------------------------------------------------- */
   
   function detenerTodosLosSonidos() {
   
       if (!audioContext) {
           return;
       }
   
   
       /*
        * Copiamos los grupos antes de limpiarlos.
        */
   
       const grupos =
           [...gruposAcordes.values()];
   
   
       /*
        * Eliminamos todos los grupos.
        */
   
       gruposAcordes.clear();
   
   
       /*
        * Liberamos todas las voces.
        */
   
       grupos.forEach(
   
           voces => {
   
               voces.forEach(
   
                   voz => {
   
                       liberarVoz(
                           voz
                       );
   
                   }
   
               );
   
           }
   
       );
   
   
       acordeActual = [];
   
   }
   
   
   /* ---------------------------------------------------------
      Cambiar octava
      --------------------------------------------------------- */
   
   function establecerOctava(octava) {
   
       const nuevaOctava =
           Number(octava);
   
   
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
      Obtener notas actuales
      ---------------------------------------------------------
   
      Compatibilidad con código anterior.
      --------------------------------------------------------- */
   
   function obtenerNotasActuales() {
   
       return [
           ...acordeActual
       ];
   
   }