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
   Mostrar estado
   --------------------------------------------------------- */

function mostrarEstado(texto) {

    estadoTexto.textContent =
        texto;

}

/* ---------------------------------------------------------
   Mostrar todos los acordes activos
   --------------------------------------------------------- */

   function mostrarAcordesActivos() {

    if (acordesPresionados.size === 0) {

        mostrarEstado(
            ""
        );

        return;

    }


    const acordes =
        [...acordesPresionados.values()]
        .map(datos => {

            const acordeModificado =
                obtenerAcordeModificado(
                    datos.acorde,
                    joystickX,
                    joystickY
                );


            return (
                `${acordeModificado.gradoRomano} · ` +
                `${acordeModificado.nombre}`
            );

        });


    mostrarEstado(
        acordes.join("     ")
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
        obtenerIndiceNota(
            raiz
        );


    if (indice === -1) {
        return raiz;
    }


    return obtenerNota(
        indice + semitonos
    );

}

function notaSiguiente(
    nota,
    semitonos
) {

    const indice =
        obtenerIndiceNota(
            nota
        );


    if (indice === -1) {
        return nota;
    }


    return obtenerNota(
        indice + semitonos
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


    const raiz =
        acorde.notas[0];


    /*
     * -----------------------------------------------------
     * CENTRO
     * -----------------------------------------------------
     */

    if (
        Math.abs(x) < 0.25 &&
        Math.abs(y) < 0.25
    ) {

        return {

            ...acorde,

            notas:
                [...acorde.notas]

        };

    }


    /*
     * -----------------------------------------------------
     * ↖ ARRIBA - IZQUIERDA
     *
     * AUMENTADO
     *
     * C → Caug
     * -----------------------------------------------------
     */

    if (
        x < -0.25 &&
        y < -0.25
    ) {

        return {

            ...acorde,

            notas:
                convertirAcordeAumentado(
                    acorde
                ),

            nombre:
                `${raiz}aug`

        };

    }


    /*
     * -----------------------------------------------------
     * ↗ ARRIBA - DERECHA
     *
     * DOMINANTE 7
     *
     * C → C7
     * -----------------------------------------------------
     */

    if (
        x > 0.25 &&
        y < -0.25
    ) {

        return {

            ...acorde,

            notas:
                convertirAcordeDominante7(
                    acorde
                ),

            nombre:
                `${raiz}7`

        };

    }


    /*
     * -----------------------------------------------------
     * ↙ ABAJO - IZQUIERDA
     *
     * MAYOR → 6
     * MENOR → sus2
     * -----------------------------------------------------
     */

    if (
        x < -0.25 &&
        y > 0.25
    ) {

        const notas =
            convertirAcordeSextaSus2(
                acorde
            );


        const nombre =
            acorde.tipo === "m"

                ? `${raiz}sus2`

                : `${raiz}6`;


        return {

            ...acorde,

            notas:
                notas,

            nombre:
                nombre

        };

    }


    /*
     * -----------------------------------------------------
     * ↘ ABAJO - DERECHA
     *
     * 9ª
     *
     * C → Cadd9
     * -----------------------------------------------------
     */

    if (
        x > 0.25 &&
        y > 0.25
    ) {

        return {

            ...acorde,

            notas:
                convertirAcordeAdd9(
                    acorde
                ),

            nombre:
                `${raiz}add9`

        };

    }


    /*
     * -----------------------------------------------------
     * ↑ ARRIBA
     *
     * FLIP MAYOR ↔ MENOR
     * -----------------------------------------------------
     */

    if (
        Math.abs(x) <= 0.25 &&
        y < -0.25
    ) {

        /*
         * Si el acorde es mayor,
         * convertirlo en menor.
         */

        if (
            acorde.tipo === ""
        ) {

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
         * Si el acorde es menor,
         * convertirlo en mayor.
         */

        if (
            acorde.tipo === "m"
        ) {

            return {

                ...acorde,

                notas:
                    convertirAcordeMayor(
                        acorde
                    ),

                nombre:
                    `${raiz}`

            };

        }


        return acorde;

    }


    /*
     * -----------------------------------------------------
     * ← IZQUIERDA
     *
     * MAYOR → MENOR
     * MENOR → DISMINUIDO
     *
     * -----------------------------------------------------
     */

    if (
        x < -0.25 &&
        Math.abs(y) <= 0.25
    ) {

        /*
         * Mayor → menor
         */

        if (
            acorde.tipo === ""
        ) {

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
         * Menor → disminuido
         */

        if (
            acorde.tipo === "m"
        ) {

            return {

                ...acorde,

                notas:
                    convertirAcordeDisminuido(
                        acorde
                    ),

                nombre:
                    `${raiz}dim`

            };

        }


        return acorde;

    }


    /*
     * -----------------------------------------------------
     * → DERECHA
     *
     * MAYOR → Maj7
     * MENOR → m7
     * -----------------------------------------------------
     */

    if (
        x > 0.25 &&
        Math.abs(y) <= 0.25
    ) {

        return {

            ...acorde,

            notas:
                convertirAcorde7(
                    acorde
                ),

            nombre:

                acorde.tipo === "m"

                    ? `${raiz}m7`

                    : `${raiz}maj7`

        };

    }


    /*
     * -----------------------------------------------------
     * ↓ ABAJO
     *
     * SUS4
     * -----------------------------------------------------
     */

    if (
        Math.abs(x) <= 0.25 &&
        y > 0.25
    ) {

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

function convertirAcordeMayor(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    const tercera =
        notaSiguiente(
            notas[1],
            1
        );


    return [

        notas[0],

        tercera,

        notas[2]

    ];

}

function convertirAcordeDisminuido(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    const quinta =
        notaSiguiente(
            notas[2],
            -1
        );


    return [

        notas[0],

        notas[1],

        quinta

    ];

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

function convertirAcordeAumentado(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    const quinta =
        notaSiguiente(
            notas[2],
            1
        );


    return [

        notas[0],

        notas[1],

        quinta

    ];

}

function convertirAcordeDominante7(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    const septima =
        notaDesdeRaiz(
            notas[0],
            10
        );


    return [

        notas[0],

        notas[1],

        notas[2],

        septima

    ];

}

function convertirAcordeSextaSus2(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    /*
     * Menor → sus2
     */

    if (
        acorde.tipo === "m"
    ) {

        return [

            notas[0],

            notaDesdeRaiz(
                notas[0],
                2
            ),

            notas[2]

        ];

    }


    /*
     * Mayor → 6
     */

    return [

        notas[0],

        notas[1],

        notas[2],

        notaDesdeRaiz(
            notas[0],
            9
        )

    ];

}

function convertirAcordeAdd9(acorde) {

    const notas =
        [...acorde.notas];


    if (notas.length < 3) {
        return notas;
    }


    const novena =
        notaDesdeRaiz(
            notas[0],
            14
        );


    return [

        notas[0],

        notas[1],

        notas[2],

        novena

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
     

    if (
        acordesPresionados.size === 0
    ) {

        mostrarEstado(
            `Joystick X: ${joystickX.toFixed(2)} · ` +
            `Y: ${joystickY.toFixed(2)}`
        );

        return;

    }
*/

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
     * Mostrar todos los acordes que continúan
     * activos.
     */

    mostrarAcordesActivos();

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
     * Mostrar todos los acordes activos
     * en su estado original.
     */

    mostrarAcordesActivos();

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
    
        mostrarAcordesActivos();
    
    }
    
    function liberarBotonAcorde(boton) {

        const datos =
            acordesPresionados.get(
                boton
            );
    
        if (!datos) {
            return;
        }
    
    
        /*
         * Primero detener el sonido de ESTE acorde.
         */
    
        soltarAcordeGrupo(
            datos.id
        );
    
    
        /*
         * IMPORTANTE:
         * eliminarlo del Map antes de actualizar
         * la barra de estado.
         */
    
        acordesPresionados.delete(
            boton
        );
    
    
        /*
         * Quitar estado visual del botón.
         */
    
        boton.classList.remove(
            "acorde--activo"
        );
    
    
        /*
         * Ahora la barra de estado ya verá
         * solamente los acordes que siguen activos.
         */
    
        mostrarAcordesActivos();
    
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

        actualizarBotonesAcordes();

        mostrarEstado(
            `Tonalidad: ${estado.tonalidad}`
        );

        detenerTodosLosSonidos();

        quitarFocoControles();

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

        quitarFocoControles();

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


controlVolumen.addEventListener(
    "change",
    () => {

        controlVolumen.blur();

    }
);


controlVolumen.addEventListener(
    "pointerup",
    () => {

        controlVolumen.blur();

    }
);

/* ---------------------------------------------------------
   Quitar foco de los controles
   --------------------------------------------------------- */

   function quitarFocoControles() {

    const elementoActivo =
        document.activeElement;


    if (
        elementoActivo &&
        (
            elementoActivo === selectorTonalidad ||
            elementoActivo === selectorOnda ||
            elementoActivo === controlVolumen
        )
    ) {

        elementoActivo.blur();

    }

}

/* ---------------------------------------------------------
   Inicialización
   --------------------------------------------------------- */

function iniciarAplicacion() {

    actualizarBotonesAcordes();

    mostrarEstado(
        ""
    );

}


/* ---------------------------------------------------------
   Iniciar
   --------------------------------------------------------- */

iniciarAplicacion();