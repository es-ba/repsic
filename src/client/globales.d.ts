// Declaraciones de las librerías que el cliente carga como scripts globales o desde CDN
// (ver mapa.ts). Sólo cubren lo que usa repsic.

// OpenLayers 5.3 (cargado desde CDN en mapa.ts)
declare namespace ol {
    namespace style {
        class Fill {
            constructor(opts: { color: string })
        }
        class Stroke {
            constructor(opts: { color: string, width: number })
        }
        class Text {
            constructor(opts: { font: string, fill: Fill, stroke: Stroke })
        }
        class Style {
            constructor(opts: { fill?: Fill, stroke?: Stroke, text?: Text })
        }
    }
}

// AjaxBestPromise se carga como script global (lib/ajax-best-promise.js)
declare var AjaxBestPromise: typeof import("ajax-best-promise");

// guijarro publica un .ts sin archivo de declaraciones (lib/guijarro.d.ts no existe)
declare module "guijarro" {
    export type Nodo = {
        posicion: [number, number]
        coordinates: [number, number]
        timestamp: number
        more_info?: any
    }
    export type Opts = {
        letter: string
        position: string
        zoom: number | null
        target?: any
        handler?: () => void
        classSufix?: string
        withTouchStartEvent?: boolean
    }
    export type GuijarroOpts = {
        centerZone?: [number, number]
        currentZoom?: number
        epsilonShow?: number
        storePointsFunctions?: {
            get: (storageKey: string) => Promise<Nodo[]>
            set: (storageKey: string, nodos: Nodo[]) => Promise<void>
        } | null
    }
    export function guijarro(targetDiv: string, leaveTrace: boolean, opts?: GuijarroOpts): Promise<{
        addMark: (lat: number, long: number, abr: string, title: string, template?: any) => void
        addLayer: (url: string, stlye?: any) => void
        colocarNodo: (nodo: Nodo, ultimoNodoColocado: Nodo | null) => Nodo
        addNodo: (nodo: Nodo) => Promise<void>
        addButton: (opts: Opts) => void
        getCenter: () => [number, number]
        getZoom: () => number
        posiciones: Nodo[]
    }>
}

// funciones y pantallas de myOwn que usa repsic y que no están en las declaraciones de types.d.ts
declare namespace myOwn {
    function autoSetup(): void
    // pantalla del mapa (mapa.ts), con los parámetros propios de repsic
    interface AddrParamsMapa extends AddrParams {
        fullscreen?: boolean
        recorrido?: number
        position?: string
        zoom?: number
    }
    interface WScreens {
        mapa: (addrParams: AddrParamsMapa) => Promise<void>
    }
    // botón que abre la pantalla del mapa de un recorrido
    function createForkeableButton(addrParams: { w: 'mapa', recorrido: string, class?: string }, opts: string | { label: string, class?: string }): HTMLButtonElement
}

// simpleFormPromise acepta botones con atributos booleanos y sin hotkey (ver dialog-promise.js)
declare function simpleFormPromise(
    params: {
        elementsList: (string | HTMLElement | { label: string, value?: any, attributes?: Record<string, string> })[],
        reject?: boolean,
        withCloseButton?: boolean
    }, opts?: DialogOptions
): Promise<any>
