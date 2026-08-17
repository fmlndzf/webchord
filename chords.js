/* =========================================================
   WebChord
   chords.js

   Motor musical:
   - Tonalidades
   - Escala mayor
   - Grados
   - Acordes diatónicos
   - Conversión de notas a frecuencias
   ========================================================= */


/* ---------------------------------------------------------
   Notas cromáticas
   --------------------------------------------------------- */

   const NOTAS = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];


/* ---------------------------------------------------------
   Escala mayor

   Semitonos desde la tónica:

   I     II    III   IV    V     VI    VII
   0     2     4     5     7     9     11
   --------------------------------------------------------- */

const ESCALA_MAYOR = [
    0,
    2,
    4,
    5,
    7,
    9,
    11
];


/* ---------------------------------------------------------
   Tipo de acorde de cada grado de una escala mayor
   --------------------------------------------------------- */

const TIPOS_ACORDE_MAYOR = [
    "",
    "m",
    "m",
    "",
    "",
    "m",
    "dim"
];


/* ---------------------------------------------------------
   Nombres de los grados
   --------------------------------------------------------- */

const NOMBRES_GRADOS = [
    "I",
    "ii",
    "iii",
    "IV",
    "V",
    "vi",
    "vii°"
];


/* ---------------------------------------------------------
   Obtener índice de una nota
   --------------------------------------------------------- */

function obtenerIndiceNota(nota) {

    return NOTAS.indexOf(nota);

}


/* ---------------------------------------------------------
   Obtener nota a partir de un índice cromático
   --------------------------------------------------------- */

function obtenerNota(indice) {

    const indiceNormalizado =
        ((indice % 12) + 12) % 12;

    return NOTAS[indiceNormalizado];

}


/* ---------------------------------------------------------
   Obtener la escala mayor de una tonalidad
   --------------------------------------------------------- */

function obtenerEscalaMayor(tonalidad) {

    const indiceTonica =
        obtenerIndiceNota(tonalidad);

    if (indiceTonica === -1) {
        return [];
    }


    return ESCALA_MAYOR.map(semitonos => {

        return obtenerNota(
            indiceTonica + semitonos
        );

    });

}


/* ---------------------------------------------------------
   Obtener información de los 7 acordes
   --------------------------------------------------------- */

function obtenerAcordesDiatonicos(tonalidad) {

    const indiceTonica =
        obtenerIndiceNota(tonalidad);

    if (indiceTonica === -1) {
        return [];
    }


    return ESCALA_MAYOR.map(
        (semitonos, grado) => {

            const indiceFundamental =
                indiceTonica + semitonos;


            const fundamental =
                obtenerNota(indiceFundamental);


            const tipo =
                TIPOS_ACORDE_MAYOR[grado];


            const tercera =
                obtenerNota(
                    indiceFundamental +
                    (tipo === "m" ? 3 : 4)
                );


            let quinta;

            if (tipo === "dim") {

                quinta =
                    obtenerNota(
                        indiceFundamental + 6
                    );

            } else {

                quinta =
                    obtenerNota(
                        indiceFundamental + 7
                    );

            }


            return {

                grado: grado,

                gradoRomano:
                    NOMBRES_GRADOS[grado],

                fundamental:
                    fundamental,

                tipo:
                    tipo,

                nombre:
                    fundamental + tipo,

                notas: [
                    fundamental,
                    tercera,
                    quinta
                ]

            };

        }
    );

}


/* ---------------------------------------------------------
   Obtener un acorde concreto
   --------------------------------------------------------- */

function obtenerAcorde(tonalidad, grado) {

    const acordes =
        obtenerAcordesDiatonicos(tonalidad);

    return acordes[grado] || null;

}


/* ---------------------------------------------------------
   Obtener frecuencia de una nota MIDI

   MIDI 69 = A4 = 440 Hz
   --------------------------------------------------------- */

function frecuenciaMIDI(midi) {

    return 440 *
        Math.pow(
            2,
            (midi - 69) / 12
        );

}


/* ---------------------------------------------------------
   Convertir nombre de nota + octava a MIDI

   Ejemplo:

   C4 = 60
   A4 = 69
   --------------------------------------------------------- */

function notaAMIDI(nota, octava = 4) {

    const indice =
        obtenerIndiceNota(nota);

    if (indice === -1) {
        return null;
    }


    return (octava + 1) * 12 + indice;

}


/* ---------------------------------------------------------
   Convertir nota + octava directamente a frecuencia
   --------------------------------------------------------- */

function notaAFrecuencia(nota, octava = 4) {

    const midi =
        notaAMIDI(nota, octava);

    if (midi === null) {
        return null;
    }


    return frecuenciaMIDI(midi);

}