"use strict";

import { describe, it, before, beforeEach, afterEach, after } from 'mocha';

import assert = require('node:assert');
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as yaml from 'js-yaml';

import { defConfig } from '../server/def-config';

import * as pg from 'pg-promise-strict';
import { cargarAyuda } from 'dmencu/dist/server/ayuda';

import { updateProvisorioQuery, sqlPuntosTraer } from '../server/procedures-repsic';
import { sqlProvisorioRecorridos } from '../server/table-provisorio_recorridos';
import { sqlDatosDeRecorrido, sqlDatosDeTodosLosRecorridos } from '../server/datos-mapa';

function esRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// misma precedencia que backend-plus: local-config.yaml (no versionado) pisa a def-config.ts
function leerDb(origen: unknown): Record<string, unknown> {
    if (esRegistro(origen) && esRegistro(origen.db)) {
        return origen.db;
    }
    return {};
}

function configDeBase(): { database: string, user: string, password: string } {
    const defecto = leerDb(yaml.load(defConfig));
    const archivo = path.join(__dirname, '../../local-config.yaml');
    const local = fs.existsSync(archivo) ? leerDb(yaml.load(fs.readFileSync(archivo, 'utf8'))) : {};
    const db = { ...defecto, ...local };
    const password = process.env.REPSIC_TEST_DB_PASSWORD ?? db.password;
    return {
        database: String(db.database ?? ''),
        user: String(db.user ?? ''),
        password: typeof password === 'string' ? password : '',
    };
}

// Los tests de base usan la base de la configuración y revierten todo lo que escriben (cada test corre en una transacción que se deshace).
// Si no hay clave, los tests de base se saltean.
const CONFIG_BASE = configDeBase();
const DB_PARAMS: pg.ConnectParams = {
    motor: 'postgres',
    database: CONFIG_BASE.database,
    user: CONFIG_BASE.user,
    password: CONFIG_BASE.password,
};

describe('provisorio: cuestionarios y personas del celular', function () {
    var client: pg.Client;
    before(async function () {
        if (!DB_PARAMS.password) {
            this.skip();
        }
        client = await pg.connect(DB_PARAMS);
        await client.query('set search_path = base, public').execute();
    });
    beforeEach(async function () {
        await client.query('begin').execute();
    });
    afterEach(async function () {
        await client.query('rollback').execute();
    });
    after(function () {
        if (client) client.done();
    });
    async function encuestaDelCelular(enc: string, area: number, operativo: string, u8: number | null, autogenerada: boolean) {
        await client.query(
            `insert into tem (operativo, enc, habilitada, area, json_encuesta, enc_autogenerado_dm)
             values ($1, $2, true, $3, $4::jsonb, $5)`,
            [operativo, enc, area, JSON.stringify({ u8 }), autogenerada ? 'dm-' + enc : null]
        ).execute();
    }

    it('cuenta sólo las encuestas del celular con personas y suma sus personas', async function () {
        const area = await client.query('select operativo, area from provisorio_recepcion order by operativo, area limit 1').fetchUniqueRow();
        const { operativo } = area.row;
        const numeroArea = Number(area.row.area);
        await encuestaDelCelular('TEST-A', numeroArea, operativo, 3, true);
        await encuestaDelCelular('TEST-B', numeroArea, operativo, 0, true);
        await encuestaDelCelular('TEST-C', numeroArea, operativo, 5, false);

        await client.query(updateProvisorioQuery, []).execute();
        const resultado = await client.query(
            'select cues_dm, pers_dm from provisorio_recepcion where operativo = $1 and area = $2',
            [operativo, numeroArea]
        ).fetchUniqueRow();

        assert.equal(Number(resultado.row.cues_dm), 1, 'una sola encuesta con personas y del celular');
        assert.equal(Number(resultado.row.pers_dm), 3, 'las personas de las encuestas del celular');
    });

    it('la vista por recorrido suma lo de sus áreas', async function () {
        const area = await client.query(
            'select a.operativo, a.area, a.recorrido from areas a order by a.operativo, a.area limit 1'
        ).fetchUniqueRow();
        const { operativo, recorrido } = area.row;
        const numeroArea = Number(area.row.area);
        await encuestaDelCelular('TEST-D', numeroArea, operativo, 2, true);
        await encuestaDelCelular('TEST-E', numeroArea, operativo, 4, true);

        await client.query(updateProvisorioQuery, []).execute();
        const suma = await client.query(
            `select cues_dm, pers_dm from ${sqlProvisorioRecorridos} v where v.operativo = $1 and v.recorrido = $2`,
            [operativo, recorrido]
        ).fetchUniqueRow();

        assert.equal(Number(suma.row.cues_dm), 2, 'dos encuestas del celular con personas');
        assert.equal(Number(suma.row.pers_dm), 6, 'las personas de las dos encuestas');
    });

    it('no toca las áreas sin encuestas del celular', async function () {
        const otra = await client.query(
            `select operativo, area, cues_dm, pers_dm from provisorio_recepcion
             where not exists (select 1 from tem where tem.operativo = provisorio_recepcion.operativo and tem.area = provisorio_recepcion.area)
             order by operativo, area limit 1`
        ).fetchUniqueRow();
        const { operativo, area, cues_dm, pers_dm } = otra.row;

        await client.query(updateProvisorioQuery, []).execute();
        const despues = await client.query(
            'select cues_dm, pers_dm from provisorio_recepcion where operativo = $1 and area = $2',
            [operativo, area]
        ).fetchUniqueRow();

        assert.equal(despues.row.cues_dm, cues_dm);
        assert.equal(despues.row.pers_dm, pers_dm);
    });
});

describe('mapa: datos del recorrido', function () {
    var client: pg.Client;
    before(async function () {
        if (!DB_PARAMS.password) {
            this.skip();
        }
        client = await pg.connect(DB_PARAMS);
        await client.query('set search_path = base, public').execute();
    });
    after(function () {
        if (client) client.done();
    });

    it('un recorrido trae sus lugares con la descripción de su tipo', async function () {
        const r = await client.query('select recorrido from lugares order by recorrido limit 1').fetchUniqueRow();
        const datos = await client.query(sqlDatosDeRecorrido, [Number(r.row.recorrido)]).fetchUniqueRow();
        assert.ok(datos.row.lugares.length > 0, 'el recorrido tiene lugares');
        for (const lugar of datos.row.lugares) {
            assert.equal(typeof lugar.tipo_lugar_descripcion, 'string');
        }
    });

    it('sin recorrido trae los lugares de todos los recorridos', async function () {
        const cuenta = await client.query(
            'select count(*) as cantidad from lugares l inner join tipos_lugar tl using(tipo_lugar)'
        ).fetchUniqueRow();
        const datos = await client.query(sqlDatosDeTodosLosRecorridos).fetchUniqueRow();
        assert.equal(datos.row.lugares.length, Number(cuenta.row.cantidad));
    });

    it('un recorrido sin lugares no trae lugares', async function () {
        const sinLugares = await client.query(
            'select recorrido from recorridos where recorrido not in (select recorrido from lugares) order by recorrido limit 1'
        ).fetchOneRowIfExists();
        if (!sinLugares.row) {
            this.skip();
        }
        const datos = await client.query(sqlDatosDeRecorrido, [Number(sinLugares.row.recorrido)]).fetchOneRowIfExists();
        assert.equal(datos.row.lugares, null);
    });
});

describe('mapa: puntos del recorrido', function () {
    var client: pg.Client;
    before(async function () {
        if (!DB_PARAMS.password) {
            this.skip();
        }
        client = await pg.connect(DB_PARAMS);
        await client.query('set search_path = base, public').execute();
    });
    beforeEach(async function () {
        await client.query('begin').execute();
    });
    afterEach(async function () {
        await client.query('rollback').execute();
    });
    after(function () {
        if (client) client.done();
    });

    async function puntoGps(recorrido: number, sesion: string, secuencial: number, timestamp: number) {
        await client.query(
            `insert into recorridos_puntos (recorrido, session, secuencial, p_latitud, p_longitud, timestamp, c_latitud, c_longitud, more_info)
             values ($1, $2, $3, -34.6, -58.4, $4, -34.6, -58.4, null)`,
            [recorrido, sesion, secuencial, timestamp]
        ).execute();
    }

    it('agrupa los puntos de una sesión con todos sus puntos', async function () {
        const r = await client.query('select recorrido from recorridos order by recorrido limit 1').fetchUniqueRow();
        const recorrido = Number(r.row.recorrido);
        await puntoGps(recorrido, 'TEST-SESION-1', 1, 1000);
        await puntoGps(recorrido, 'TEST-SESION-1', 2, 2000);
        await puntoGps(recorrido, 'TEST-SESION-1', 3, 3000);

        const grupos = await client.query(sqlPuntosTraer(pg.quoteLiteral, recorrido, null)).fetchAll();
        const delTest = grupos.rows.filter((grupo) => grupo.session === 'TEST-SESION-1');
        const total = delTest.map((grupo) => Number(grupo.cantidad)).reduce((suma: number, cantidad: number) => suma + cantidad, 0);
        assert.equal(total, 3, 'los tres puntos de la sesión');
        for (const grupo of delTest) {
            assert.equal(grupo.puntos.length, Number(grupo.cantidad), 'cada grupo trae todos sus puntos');
        }
    });

    it('sólo trae los puntos del recorrido pedido', async function () {
        const rs = await client.query('select recorrido from recorridos order by recorrido limit 2').fetchAll();
        const [primero, segundo] = rs.rows.map((fila) => Number(fila.recorrido));
        await puntoGps(segundo, 'TEST-SESION-2', 1, 1000);

        const grupos = await client.query(sqlPuntosTraer(pg.quoteLiteral, primero, null)).fetchAll();
        const delOtro = grupos.rows.filter((grupo) => grupo.session === 'TEST-SESION-2');
        assert.equal(delOtro.length, 0);
    });

    it('timestamp_desde deja afuera las sesiones que empezaron antes', async function () {
        const r = await client.query('select recorrido from recorridos order by recorrido limit 1').fetchUniqueRow();
        const recorrido = Number(r.row.recorrido);
        await puntoGps(recorrido, 'TEST-VIEJA', 1, 100);
        await puntoGps(recorrido, 'TEST-VIEJA', 2, 200);
        await puntoGps(recorrido, 'TEST-NUEVA', 1, 5000);

        const grupos = await client.query(sqlPuntosTraer(pg.quoteLiteral, recorrido, 1000)).fetchAll();
        const sesiones = grupos.rows.map((grupo) => grupo.session);
        assert.ok(!sesiones.includes('TEST-VIEJA'), 'la sesión vieja no entra');
        assert.ok(sesiones.includes('TEST-NUEVA'), 'la sesión nueva sí');
    });
});

// cierra el pool de conexiones para que mocha termine
after(async function () {
    await pg.shutdown(false);
});

describe('ayuda de repsic', function () {
    var temas = cargarAyuda([
        { origen: 'dmencu', carpeta: path.join(path.dirname(require.resolve('dmencu/package.json')), 'ayuda') },
        { origen: 'repsic', carpeta: path.join(__dirname, '../../ayuda') },
    ]);
    var ids = temas.map(tema => tema.id);

    it('incluye los temas propios de mapa, recorridos, provisorio, gráficos y papel', function () {
        for (const id of ['mapa', 'recorridos', 'provisorio', 'graficos', 'papel']) {
            assert.ok(ids.includes(id), 'falta el tema ' + id);
        }
    });

    it('oculta los temas de dmencu que no aplican a repsic', function () {
        assert.ok(!ids.includes('circuito-encuesta'));
        assert.ok(!ids.includes('supervision'));
    });

    it('reemplaza asignación con el texto de repsic', function () {
        const asignacion = temas.find(tema => tema.id === 'asignacion');
        assert.ok(asignacion);
        assert.equal(asignacion!.origen, 'repsic');
    });
});
