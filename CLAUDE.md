# CLAUDE.md — repsic

@node_modules/dmencu/CLAUDE.md

Relevamiento de Personas en Situación de Calle. App que corre sobre Backend-Plus y PostgreSQL y **extiende `dmencu`** (dependencia npm, ver `package.json`) mediante la clase `AppRepsic` en `src/server/app-repsic.ts`. Funciona en dispositivos móviles mediante offline-first (PWA con service worker), igual que dmencu.

**Hay dos variantes que salen del mismo código**: el relevamiento de repsic (la app principal, con mapas y recorridos) y la app de **paradores** (`paradores: true` en la configuración, con su propio puerto y sin mapas). Ver [Variantes y configuración](#variantes-y-configuración-locales). Cualquier cambio en `src/` afecta a las dos, así que revisar si una regla aplica a una sola antes de tocarla.

Lo que es común a todos los relevamientos (hoja de ruta, asignaciones, motor de tareas, metadatos de formularios) vive en `dmencu`, `meta-enc` y `backend-plus`. Acá sólo van las diferencias de repsic. Antes de tocar comportamiento general, seguir las reglas de dmencu importadas arriba (`node_modules/dmencu/CLAUDE.md`).

---

## Estructura de archivos

- `src/server/` — backend. Cada tabla tiene su archivo `table-*.ts`.
  - `app-repsic.ts`: clase `AppRepsic` que extiende a la de dmencu (menús, tablas, procedimientos, ayuda propia). Sus temas de ayuda se suman a los de dmencu.
  - `def-config.ts`: configuración estática (`defConfig`), incluye los scripts de instalación de la base (`install.dump.scripts`).
  - `procedures-repsic.ts`: procedimientos propios; reutiliza los de dmencu (`dmencu/dist/server/server/procedures-dmencu`).
  - `datos-mapa.ts`, `types-repsic.ts`: consultas del mapa de recorridos y tipos propios.
- `src/client/` — cliente propio (`client.ts`, `menu.ts`, `mapa*.ts`, `adjuntos.ts`) y estilos en `css/`.
- `src/unlogged/` — formulario de relevamiento sin login y su plantilla.
  - `my-bypass-formulario.ts` y `my-render-formulario.tsx`: ganchos propios que se conectan a `dmencu/dist/unlogged/unlogged/*`. El `.tsx` es la pantalla de relevamiento en React.
  - `offline.jade`, `img/`: plantilla y recursos.
- `src/test/` — tests (`test.ts` importa `test-repsic.ts`).
- `install/` — scripts SQL de instalación y cambios de estructura.
- `operaciones/` — scripts SQL con fecha (`actualizar_AAAA_MM_DD.sql`) para aplicar cambios en bases ya existentes. Un cambio que haya que desplegar sobre datos reales se agrega acá, no sólo en `install/`.
- `ayuda/` — ayuda en línea propia de repsic (ver [Documentación](#documentación)).
- `dist/` — salida generada por el build. Está en `.gitignore`, no editar ni versionar.

---

> 📝 Antes de trabajar con cualquier tabla, leer su `table-*.ts`. Si una tabla de dmencu necesita un cambio para repsic, hacerlo con `be.appendToTableDefinition(...)` en `app-repsic.ts` antes que copiar el archivo entero.

---

### Stack

- **Base de datos**: PostgreSQL, esquema `base`. Hay dos usuarios: un owner (`repsic262_owner`) que crea tablas y procedimientos, y un admin (`repsic262_admin`) que usa el backend. Sus datos de configuración están en `def-config.ts` y en `local-config.yaml`.
- **Dependencias clave**: `dmencu`, `meta-enc`, `varcal`, `procesamiento`, `consistencias`, `datos-ext` y `operativos` (ver `package.json` e `install.dump.scripts` en `def-config.ts`). Al actualizar `dmencu`, revisar que los imports de `dmencu/dist/...` sigan existiendo.
- **Puerto y ruta**: `server.port` 3055 y `base-url` `/repsic262` en `def-config.ts`.

---

## Variantes y configuración locales

- `local-config.yaml` (y cualquier `local-*` o `*-local.*`) contiene credenciales y **no se versiona** (`.gitignore`). `example-local-config.yaml` es la plantilla.
- `def-config.ts` tiene los valores base; la configuración local los pisa. Los tests usan la misma precedencia.
- La variante se elige con la variable de entorno `BACKEND_PLUS_LOCAL_CONFIG`, que apunta al archivo de configuración local. `.vscode/launch.json` tiene un perfil por variante:
  - **Back office**: `local-config.yaml`.
  - **DM**: `local-config-dm.yaml`.
  - **Paradores**: `local-config-paradores.yaml` (puerto propio, `paradores: true`, sesiones en memoria, sin mapas).
  - Cada uno tiene una variante "Launch" (compila antes con `build-all`) y otra "Fast Launch" (no compila).
- `install.table-data-dir` en la configuración local apunta a datos fuera del repo (`../dmencu-data/...`). No copiar esos datos al repo.
- Para probar una variante, cambiar la variable de entorno o usar el perfil del `launch.json`; no editar `def-config.ts` para eso.

---

## Compilación

- `npm run build` compila en orden `src/unlogged`, `src/client`, `src/server` y luego corre `mixin-patch`. Cada paso se puede correr por separado (`build-client`, `build-server`, `build-unlogged`).
- `npm run dump` / `npm run bdump` regeneran la base desde la configuración; `bdump` compila antes.

---

## Contexto de base de datos — esquema `base`

Todos los objetos pertenecen al esquema `base`. Los nombres están en castellano.

### Lógica de negocio en PostgreSQL


Los scripts de esa lógica vienen de `dmencu`, `meta-enc`, `consistencias` y de los propios `install/` y se cargan desde `def-config.ts` (`install.dump.scripts.post-adapt`). Ejemplos: `sincronizacion_tem.sql`, `control_cargado_tareas_tem_trg.sql`, `generador_accion_cumple_condicion.sql`, `casilleros_orden_total_fun.sql`.


---

## Casos de prueba


### Framework y comando

- **Comando**: `npm run test` (compila `src/test` con `tsc -p src/test` a `dist/test/` y corre `mocha --bail --check-leaks dist/test/test.js`)
- **Archivo principal**: `src/test/test.ts`, que importa `src/test/test-repsic.ts`. Agregar nuevos archivos de test y enlazarlos desde `test.ts`.

### Tests de base

- Los tests de base usan la base de la configuración y **revierten todo lo que escriben**: cada test corre en una transacción que se deshace (`begin` / `rollback`). No dejar escrituras que sobrevivan al test.
- La clave sale de `REPSIC_TEST_DB_PASSWORD` o de `local-config.yaml`. Si no hay clave, los tests de base se saltean (`this.skip()`), así que un test salteado no es un test verde: avisarlo al reportar.

---

## Cómo se instancia la app

La app se arma por **composición de mixins**. Cada `emerge*` agrega una capa de funcionalidad a una clase base y devuelve una clase nueva. Se arma en `src/server/server-repsic.ts`, de adentro hacia afuera:

```ts
var AppRepsic = emergeAppRepsic(          // capa propia de repsic (app-repsic.ts)
    emergeAppDmEncu(                      // dmencu: hoja de ruta, tareas, DM
        emergeAppProcesamiento(
            emergeAppConsistencias(
                emergeAppDatosExt(
                    emergeAppMetaEnc(
                        emergeAppRelEnc(
                            emergeAppVarCal(
                                emergeAppOperativos(AppBackend)  // base: backend-plus
                            )
                        )
                    )
                )
            )
        )
    )
);
new AppRepsic().start();
```

- La capa **más externa** es la que sobreescribe; la más interna es la base (`AppBackend` de `meta-enc`, que a su vez viene de `backend-plus`). Un método de `AppRepsic` pisa al de dmencu, y así sucesivamente.
- Para agregar una capa, el mixin tiene que recibir una clase `Base` y devolver `class ... extends Base`. El tipo genérico de `emergeAppRepsic` restringe qué clase base acepta (`Constructor<dmencu.AppAppDmEncuType>`); si cambia el orden, el compilador lo marca.
- `OperativoGenerator.mainTD` y `mainTDPK` se fijan en `server-repsic.ts`, antes de instanciar. Son globales: cambiarlos afecta a todas las variantes.
- Las dos variantes (repsic y paradores) usan esta misma composición. La diferencia viene de la configuración (`server.paradores`), no de otra clase.

---

## Documentación

- La documentación para desarrolladores de la familia de apps está en el repo de `dmencu` (carpeta `docs/`). Acá no hay `docs/` propio.
- `ayuda/` es la ayuda en línea que ve la persona en el menú según rol, permisos y modo. Cómo se arma está documentado en `dmencu/docs/ayuda-online.md`. Los temas propios de repsic se cargan desde `app-repsic.ts` con el origen `repsic`.
