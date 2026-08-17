/* =========================================================
   WebChord
   app.js

   Control principal de la aplicación
   ========================================================= */


/* ---------------------------------------------------------
   Estado de la aplicación
   --------------------------------------------------------- */

   const estado = {

    tonalidad: "C",

    gradoActivo: null

};

/* ---------------------------------------------------------
   Acordes actualmente presionados
   --------------------------------------------------------- */

   const acordesPresionados = new Map();



const teclasAcordes = {
    a: 0,
    w: 1,
    s: 2,
    e: 3,
    d: 4,
    r: 5,
    f: 6
};

const teclasAcordesActivas = new Set();

/* ---------------------------------------------------------
   Elementos de la interfaz
   --------------------------------------------------------- */

const selectorTonalidad =
    document.getElementById(
        "tonalidad"
    );


const selectorOnda =
    document.getElementById(
        "onda"
    );


const controlVolumen =
    document.getElementById(
        "volumen"
    );


const tonalidadActual =
    document.getElementById(
        "tonalidadActual"
    );


const estadoTexto =
    document.getElementById(
        "estadoTexto"
    );


const botonesAcorde =
    document.querySelectorAll(
        ".acorde"
    );

const joystick =
    document.getElementById(
        "joystick"
    );


const joystickPalanca =
    document.getElementById(
        "joystickPalanca"
    );

/* ---------------------------------------------------------
   Actualizar los nombres de los botones
   --------------------------------------------------------- */

function actualizarBotonesAcordes() {

    const acordes =
        obtenerAcordesDiatonicos(
            estado.tonalidad
        );


    botonesAcorde.forEach(
        (boton, indice) => {

            const acorde =
                acordes[indice];


            if (!acorde) {
                return;
            }


            const nombre =
                boton.querySelector(
                    ".acorde__nombre"
                );


            if (nombre) {

                nombre.textContent =
                    acorde.nombre;

            }

        }
    );

}


/* ---------------------------------------------------------
   Actualizar indicador de tonalidad
   --------------------------------------------------------- */

function actualizarTonalidad() {

    tonalidadActual.textContent =
        estado.tonalidad;

}


/* ---------------------------------------------------------
   Mostrar estado
   --------------------------------------------------------- */

function mostrarEstado(texto) {

    estadoTexto.textContent =
        texto;

}


/* ---------------------------------------------------------
   Reproducir acorde
   --------------------------------------------------------- */

   async function tocarAcorde(grado) {

    const acorde =
        obtenerAcorde(
            estado.tonalidad,
            grado
        );

    if (!acorde) {
        return;
    }


    estado.gradoActivo = grado;


    // Guardamos siempre el acorde original
    acordeBaseActual = acorde;


    /*
     * Aplicar inmediatamente la posición
     * actual del joystick.
     */
    const acordeModificado =
        obtenerAcordeModificado(
            acordeBaseActual,
            joystickX,
            joystickY
        );


    mostrarEstado(
        `${acordeModificado.gradoRomano} · ` +
        `${acordeModificado.nombre}`
    );


    await reproducirAcorde(
        acordeModificado.notas
    );

}

const NOTAS_CROMATICAS = [
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


function notaDesdeRaiz(
    raiz,
    semitonos
) {

    const indice =
        NOTAS_CROMATICAS.indexOf(
            raiz
        );

    if (indice === -1) {
        return raiz;
    }


    const nuevoIndice =
        (
            indice +
            semitonos
        ) % 12;


    return NOTAS_CROMATICAS[
        nuevoIndice
    ];

}

function notaSiguiente(
    nota,
    semitonos
) {

    return notaDesdeRaiz(
        nota,
        semitonos
    );

}

function obtenerAcordeModificado(
    acorde,
    x,
    y
) {

    if (!acorde) {
        return acorde;
    }


    // La raíz está en la primera nota
    const raiz =
        acorde.notas[0];


    /*
     * -----------------------------------------------------
     * Centro → acorde original
     * -----------------------------------------------------
     */

    if (
        Math.abs(x) < 0.25 &&
        Math.abs(y) < 0.25
    ) {

        return {
            ...acorde,
            notas: [...acorde.notas]
        };

    }


    /*
     * -----------------------------------------------------
     * Izquierda → menor
     * -----------------------------------------------------
     */

    if (x < -0.25) {

        return {
            ...acorde,

            notas:
                convertirAcordeMenor(
                    acorde
                ),

            nombre:
                `${raiz}m`
        };

    }


    /*
     * -----------------------------------------------------
     * Derecha → dominante 7
     * -----------------------------------------------------
     */

    if (x > 0.25) {

        return {
            ...acorde,

            notas:
                convertirAcorde7(
                    acorde
                ),

            nombre:
                `${raiz}7`
        };

    }


    /*
     * -----------------------------------------------------
     * Arriba → mayor 7
     * -----------------------------------------------------
     */

    if (y < -0.25) {

        return {
            ...acorde,

            notas:
                convertirAcordeMaj7(
                    acorde
                ),

            nombre:
                `${raiz}maj7`
        };

    }


    /*
     * -----------------------------------------------------
     * Abajo → sus4
     * -----------------------------------------------------
     */

    if (y > 0.25) {

        return {
            ...acorde,

            notas:
                convertirAcordeSus4(
                    acorde
                ),

            nombre:
                `${raiz}sus4`
        };

    }


    return acorde;
}

function convertirAcordeMenor(acorde) {

    const notas =
        [...acorde.notas];

    /*
     * Una tríada mayor:
     *
     * 1 - 3 - 5
     *
     * pasa a:
     *
     * 1 - b3 - 5
     */

    if (notas.length < 3) {
        return notas;
    }


    const tercera =
        notaSiguiente(
            notas[1],
            -1
        );


    return [
        notas[0],
        tercera,
        notas[2]
    ];

}

function convertirAcorde7(acorde) {

    const notas =
        [...acorde.notas];

    if (notas.length < 3) {
        return notas;
    }

    const raiz =
        notas[0];

    const septima =
        notaDesdeRaiz(
            raiz,
            10
        );

    return [
        ...notas,
        septima
    ];
}

function convertirAcordeMaj7(acorde) {

    const notas =
        [...acorde.notas];

    if (notas.length < 3) {
        return notas;
    }

    const raiz =
        notas[0];

    const septima =
        notaDesdeRaiz(
            raiz,
            11
        );

    return [
        ...notas,
        septima
    ];
}

function convertirAcordeSus4(acorde) {

    const notas =
        [...acorde.notas];

    if (notas.length < 3) {
        return notas;
    }

    const raiz =
        notas[0];

    const cuarta =
        notaDesdeRaiz(
            raiz,
            5
        );

    return [
        notas[0],
        cuarta,
        notas[2]
    ];
}



/* ---------------------------------------------------------
   Mover Joystick
   --------------------------------------------------------- */

function moverJoystick(evento) {

    const rect =
        joystick.getBoundingClientRect();


    const centroX =
        rect.left +
        rect.width / 2;


    const centroY =
        rect.top +
        rect.height / 2;


    let x =
        evento.clientX -
        centroX;


    let y =
        evento.clientY -
        centroY;


    const radio =
        rect.width / 2;


    const distancia =
        Math.sqrt(
            x * x +
            y * y
        );


    /*
     * Evitar que la palanca
     * salga del círculo.
     */

    if (distancia > radio) {

        const escala =
            radio / distancia;

        x *= escala;
        y *= escala;

    }


    /*
     * Convertir la posición
     * a valores entre -1 y +1.
     */

    joystickX =
        x / radio;

    joystickY =
        y / radio;


    /*
     * Mover visualmente
     * la palanca.
     */

    joystickPalanca.style.transform =
        `translate(${x}px, ${y}px)`;


    actualizarJoystick();
}

function actualizarJoystick() {

    /*
     * No hay ningún acorde presionado.
     *
     * El joystick simplemente mantiene su posición.
     */

    if (
        acordesPresionados.size === 0
    ) {

        mostrarEstado(
            `Joystick X: ${joystickX.toFixed(2)} · ` +
            `Y: ${joystickY.toFixed(2)}`
        );

        return;

    }


    /*
     * Modificar todos los acordes activos.
     */

    acordesPresionados.forEach(
        datos => {

            const acordeModificado =
                obtenerAcordeModificado(
                    datos.acorde,
                    joystickX,
                    joystickY
                );


            actualizarAcordeGrupo(
                datos.id,
                acordeModificado.notas
            );

        }
    );


    /*
     * Mostrar el último acorde como
     * referencia en el indicador de estado.
     */

    const acordes =
        Array.from(
            acordesPresionados.values()
        );


    const ultimo =
        acordes[
            acordes.length - 1
        ];


    if (ultimo) {

        const acordeModificado =
            obtenerAcordeModificado(
                ultimo.acorde,
                joystickX,
                joystickY
            );


        mostrarEstado(
            `${acordeModificado.gradoRomano} · ` +
            `${acordeModificado.nombre}`
        );

    }

}

function reiniciarJoystick() {

    joystickX = 0;

    joystickY = 0;


    joystickPalanca.style.transform =
        "translate(0px, 0px)";


    /*
     * Si no hay acordes presionados,
     * no hay nada que actualizar.
     */

    if (
        acordesPresionados.size === 0
    ) {
        return;
    }


    /*
     * Restaurar todos los acordes
     * a su versión original.
     */

    acordesPresionados.forEach(
        datos => {

            actualizarAcordeGrupo(
                datos.id,
                datos.acorde.notas
            );

        }
    );


    /*
     * Mostrar el último acorde.
     */

    const acordes =
        Array.from(
            acordesPresionados.values()
        );


    const ultimo =
        acordes[
            acordes.length - 1
        ];


    if (ultimo) {

        mostrarEstado(
            `${ultimo.acorde.gradoRomano} · ` +
            `${ultimo.acorde.nombre}`
        );

    }

}

/* ---------------------------------------------------------
   Eventos del Joystick
   --------------------------------------------------------- */
   joystick.addEventListener(
    "pointerdown",
    evento => {

        evento.preventDefault();

        joystickActivo = true;

        joystick.setPointerCapture(
            evento.pointerId
        );

        moverJoystick(evento);

    }
);


joystick.addEventListener(
    "pointermove",
    evento => {

        if (!joystickActivo) {
            return;
        }

        moverJoystick(evento);

    }
);


joystick.addEventListener(
    "pointerup",
    () => {

        joystickActivo = false;

        reiniciarJoystick();

    }
);


joystick.addEventListener(
    "pointercancel",
    () => {

        joystickActivo = false;

        reiniciarJoystick();

    }
);
/* ---------------------------------------------------------
   Eventos de los botones de acordes
   --------------------------------------------------------- */

   let joystickActivo = false;

    let joystickX = 0;

    let joystickY = 0;


    function activarBotonAcorde(boton) {

        if (!boton) {
            return;
        }
    
    
        const grado =
            Number(
                boton.dataset.grado
            );
    
    
        /*
         * Evitar activar nuevamente
         * un botón que ya está presionado.
         */
    
        if (
            acordesPresionados.has(boton)
        ) {
            return;
        }
    
    
        const acorde =
            obtenerAcorde(
                estado.tonalidad,
                grado
            );
    
    
        if (!acorde) {
            return;
        }
    
    
        /*
         * Cada botón tiene su propio ID.
         */
    
        const id =
            `acorde-${grado}`;
    
    
        /*
         * Guardamos el acorde original.
         *
         * Esto es importante porque el joystick
         * puede modificarlo posteriormente.
         */
    
        acordesPresionados.set(
            boton,
            {
                id: id,
                grado: grado,
                acorde: acorde
            }
        );
    
    
        /*
         * Activación visual.
         */
    
        boton.classList.add(
            "acorde--activo"
        );
    
    
        /*
         * Aplicar inmediatamente la posición
         * actual del joystick.
         */
    
        const acordeModificado =
            obtenerAcordeModificado(
                acorde,
                joystickX,
                joystickY
            );
    
    
        /*
         * Crear el grupo de voces correspondiente
         * exclusivamente a este botón.
         */
    
        reproducirAcordeGrupo(
            id,
            acordeModificado.notas
        );
    
    
        /*
         * Mostrar información del acorde.
         */
    
        mostrarEstado(
            `${acordeModificado.gradoRomano} · ` +
            `${acordeModificado.nombre}`
        );
    
    }
    
    function liberarBotonAcorde(boton) {

        if (!boton) {
            return;
        }
    
    
        const datos =
            acordesPresionados.get(
                boton
            );
    
    
        if (!datos) {
            return;
        }
    
    
        /*
         * Liberamos solamente el grupo
         * perteneciente a este botón.
         */
    
        soltarAcordeGrupo(
            datos.id
        );
    
    
        /*
         * Desactivar visualmente el botón.
         */
    
        boton.classList.remove(
            "acorde--activo"
        );
    
    
        /*
         * Eliminar el botón de los acordes activos.
         */
    
        acordesPresionados.delete(
            boton
        );
    
    }

    /* ---------------------------------------------------------
   Eventos de los botones de acordes
   --------------------------------------------------------- */

botonesAcorde.forEach(boton => {

    boton.addEventListener(
        "pointerdown",
        evento => {

            evento.preventDefault();


            boton.setPointerCapture(
                evento.pointerId
            );


            activarBotonAcorde(
                boton
            );

        }
    );


    boton.addEventListener(
        "pointerup",
        evento => {

            evento.preventDefault();


            liberarBotonAcorde(
                boton
            );

        }
    );


    boton.addEventListener(
        "pointercancel",
        () => {

            liberarBotonAcorde(
                boton
            );

        }
    );

});

    /* ---------------------------------------------------------
   Teclado físico
   --------------------------------------------------------- */

   document.addEventListener(
    "keydown",
    evento => {

        const elemento =
            document.activeElement;


        /*
         * No interceptar teclas cuando
         * el usuario está escribiendo.
         */

        if (
            elemento &&
            (
                elemento.tagName === "INPUT" ||
                elemento.tagName === "TEXTAREA" ||
                elemento.tagName === "SELECT"
            )
        ) {
            return;
        }


        const tecla =
            evento.key.toLowerCase();


        const indice =
            teclasAcordes[tecla];


        if (
            indice === undefined
        ) {
            return;
        }


        /*
         * Evitar repetición automática.
         */

        if (
            evento.repeat ||
            teclasAcordesActivas.has(tecla)
        ) {
            return;
        }


        evento.preventDefault();


        teclasAcordesActivas.add(
            tecla
        );


        const boton =
            botonesAcorde[indice];


        activarBotonAcorde(
            boton
        );

    }
);

document.addEventListener(
    "keyup",
    evento => {

        const tecla =
            evento.key.toLowerCase();


        const indice =
            teclasAcordes[tecla];


        if (
            indice === undefined
        ) {
            return;
        }


        evento.preventDefault();


        teclasAcordesActivas.delete(
            tecla
        );


        const boton =
            botonesAcorde[indice];


        liberarBotonAcorde(
            boton
        );

    }
);




/* ---------------------------------------------------------
   Cambiar tonalidad
   --------------------------------------------------------- */

selectorTonalidad.addEventListener(
    "change",
    evento => {

        estado.tonalidad =
            evento.target.value;


        actualizarTonalidad();

        actualizarBotonesAcordes();

        mostrarEstado(
            `Tonalidad: ${estado.tonalidad}`
        );


        detenerTodosLosSonidos();

    }
);


/* ---------------------------------------------------------
   Cambiar tipo de onda
   --------------------------------------------------------- */

selectorOnda.addEventListener(
    "change",
    evento => {

        establecerTipoOnda(
            evento.target.value
        );


        mostrarEstado(
            `Sonido: ${evento.target.value}`
        );

    }
);


/* ---------------------------------------------------------
   Cambiar volumen
   --------------------------------------------------------- */

controlVolumen.addEventListener(
    "input",
    evento => {

        establecerVolumen(
            evento.target.value
        );

    }
);


/* ---------------------------------------------------------
   Inicialización
   --------------------------------------------------------- */

function iniciarAplicacion() {

    actualizarTonalidad();

    actualizarBotonesAcordes();

    mostrarEstado(
        "Selecciona un acorde"
    );

}


/* ---------------------------------------------------------
   Iniciar
   --------------------------------------------------------- */

iniciarAplicacion();