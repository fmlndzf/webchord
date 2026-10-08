const CACHE_NAME = "webchord-v2";

const ARCHIVOS_APP = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./chords.js",
    "./synth.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// ─────────────────────────────────────
// INSTALACIÓN
// ─────────────────────────────────────

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ARCHIVOS_APP);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );

});


// ─────────────────────────────────────
// ACTIVACIÓN
// ─────────────────────────────────────

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))

            );

        }).then(() => {

            return self.clients.claim();

        })

    );

});


// ─────────────────────────────────────
// SOLICITUDES
// ─────────────────────────────────────

self.addEventListener("fetch", event => {

    // Solo solicitudes GET
    if (event.request.method !== "GET") {
        return;
    }


    const url = new URL(event.request.url);


    // Solo archivos del mismo origen
    if (url.origin !== self.location.origin) {
        return;
    }


    event.respondWith(

        caches.match(event.request)
            .then(respuestaCache => {

                // Si existe en caché, utilizarla
                if (respuestaCache) {
                    return respuestaCache;
                }


                // Si no existe, descargarla
                return fetch(event.request)
                    .then(respuesta => {

                        // No guardar respuestas inválidas
                        if (
                            !respuesta ||
                            respuesta.status !== 200 ||
                            respuesta.type !== "basic"
                        ) {
                            return respuesta;
                        }


                        // Guardar una copia
                        const copia = respuesta.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    event.request,
                                    copia
                                );
                            });


                        return respuesta;

                    });

            })

    );

});