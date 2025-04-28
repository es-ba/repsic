"use strict";

import { ProcedureDef } from "./types-repsic";
import { ProcedureContext, CoreFunctionParameters, UploadedFileInfo, OperativoGenerator } from "procesamiento";
import {getOperativoActual, setGenerarIdEncFun, setMaxAgenerar, setHdrQuery} from "dmencu/dist/server/server/procedures-dmencu";
import {json, jsono} from "pg-promise-strict";
import { IdUnidadAnalisis } from "dmencu/dist/server/unlogged/tipos";
var fs = require('fs-extra');
var path = require('path');

setGenerarIdEncFun((area:number,index:number)=>area.toString() + ((index<9)?'0':'') + (index+1).toString());
setMaxAgenerar(99);
//setMaxEncPorArea(99);

export const updateProvisorioQuery = `
update provisorio_recepcion pr
    set cues_dm = t.cues_dm, pers_dm = t.pers_dm
    from (
        select
            operativo,
            area, 
            count(*) filter (where enc_autogenerado_dm is not null and coalesce((json_encuesta->>'u8')::integer,0) > 0 ) as cues_dm,
            sum(coalesce((json_encuesta->>'u8')::integer,0)) filter (where enc_autogenerado_dm is not null and json_encuesta is not null) as pers_dm
            from tem t 
            group by operativo, area
    ) as t
    where pr.operativo = t.operativo and pr.area =  t.area
`

setHdrQuery((quotedCondViv:string, context: ProcedureContext, unidadAnalisisPrincipal:IdUnidadAnalisis, permiteGenerarMuestra:boolean)=>{
    return `
    with ${context.be.db.quoteIdent(unidadAnalisisPrincipal)} as 
        (select t.enc, t.json_encuesta as respuestas, t.resumen_estado as "resumenEstado", 
            jsonb_build_object(
                'recorrido'        , recorrido         ,
                'tipo_recorrido'   , tipo_recorrido    ,
                'comuna_agrupada'  , comuna_agrupada   ,
                'barrios_agrupados', barrios_agrupados ,
                'dominio'          , dominio       ,
                'nomcalle'         , nomcalle      ,
                'sector'           , sector        ,
                'edificio'         , edificio      ,
                'entrada'          , entrada       ,
                'nrocatastral'     , nrocatastral  ,
                'piso'             , piso          ,
                'departamento'     , departamento  ,
                'habitacion'       , habitacion    ,
                'casa'             , casa          ,
                'prioridad'        , reserva+1     ,
                'observaciones'    , tt.carga_observaciones ,
                'cita'             , cita ,
                'carga'            , t.area         
            ) as tem, t.area,
            --TODO: GENERALIZAR
            jsonb_build_object(
                'tarea', tt.tarea,
                'fecha_asignacion', fecha_asignacion,
                'asignado', asignado,
                'main_form', main_form
            ) as tarea,
            min(fecha_asignacion) as fecha_asignacion
            from tem t left join tareas_tem tt on (t.operativo = tt.operativo and t.enc = tt.enc and t.tarea_actual = tt.tarea)
                       left join tareas ta on t.tarea_actual = ta.tarea
            where t.habilitada and ${quotedCondViv}
            group by t.enc, t.json_encuesta, t.resumen_estado, recorrido, tipo_recorrido, comuna_agrupada, barrios_agrupados, dominio, nomcalle,sector,edificio, entrada, nrocatastral, piso,departamento,habitacion,casa,reserva,tt.carga_observaciones, cita, t.area, tt.tarea, fecha_asignacion, asignado, main_form
        )
        select jsonb_build_object(
                ${context.be.db.quoteLiteral(unidadAnalisisPrincipal)}, ${jsono(
                    `select enc, respuestas, jsonb_build_object('resumenEstado',"resumenEstado") as otras from ${context.be.db.quoteIdent(unidadAnalisisPrincipal)}`,
                    'enc',
                    `otras || coalesce(respuestas,'{}'::jsonb)`
                )}
            ) as respuestas,
            ${json(`
                select a.area as carga, observaciones_hdr as observaciones, min(fecha_asignacion) as fecha, ta.recepcionista
                    from ${context.be.db.quoteIdent(unidadAnalisisPrincipal)} aux inner join areas a using (area) inner join tareas_areas ta on (a.area = ta.area and aux.tarea->>'tarea' = ta.tarea)
                    group by a.area, observaciones_hdr, ta.recepcionista 
                ${permiteGenerarMuestra?`
                    union -- este union permite visualizar areas asignadas sin encuestas generadas
                    select area as carga, null as observaciones, null as fecha, recepcionista
                        from tareas_areas where asignado = ${context.be.db.quoteLiteral(context.user.idper)} and tarea = 'encu'`:''}
                `,'fecha')} as cargas,
            ${jsono(
                `select enc, jsonb_build_object('tem', tem, 'tarea', tarea) as otras from ${context.be.db.quoteIdent(unidadAnalisisPrincipal)}`,
                 'enc',
                 `otras ||'{}'::jsonb`
                )}
            as "informacionHdr"
` 
})

export const ProceduresRepsic : ProcedureDef[] = [
    {
        action:'generar_formularios',
        parameters:[
            {name:'area'            , typeName:'integer'},
            {name:'cant_encuestas'  , typeName:'integer'}
        ],
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            var be=context.be;
            const {area, cant_encuestas} = parameters;
            const OPERATIVO = await getOperativoActual(context);
            await be.procedure.muestra_generar.coreFunction(context, {
                operativo: OPERATIVO, 
                area, 
                dominio:3, 
                cant_encuestas: parameters.cant_encuestas,
                tarea_actual: null
            });
            return "ok";
        }
    },
    {
        action:'generar_formularios_papel',
        parameters:[
            {name:'area'            , typeName:'integer'},
            {name:'cant_encuestas'  , typeName:'integer'}
        ],
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            if(!context.user.idper){
                throw Error ('debe configurar un idper para su usuario')
            }
            var be=context.be;
            const OPERATIVO = await getOperativoActual(context);
            const {area, cant_encuestas} = parameters;
            let cantidad = (await context.client.query(`
                select count(*) as cantidad
                    from tem
                    where operativo = $1 and area = $2 and enc_autogenerado_dm is null
            `,[OPERATIVO,area]).fetchUniqueValue()).value;
            await be.procedure.muestra_agregar.coreFunction(context, {
                operativo: OPERATIVO, 
                area, 
                dominio:3, 
                cant_encuestas: cant_encuestas - cantidad,
                tarea_actual: 'ingr'
            });
            await context.client.query(`
                UPDATE tareas_tem tt
                    set recepcionista = $3, asignado = $4
                    where operativo=$1 and tarea= $2 and recepcionista is null and asignado is null and
					(select enc_autogenerado_dm from tem t where t.operativo = tt.operativo and t.enc = tt.enc) is null
                    returning *
            `,[OPERATIVO, 'encu',context.user.idper,context.user.idper]).fetchAll();
            await context.client.query(`
                UPDATE tareas_tem tt
                    set verificado = '1', estado = 'V'
                    where operativo=$1 and tarea= $2 and
					(select enc_autogenerado_dm from tem t where t.operativo = tt.operativo and t.enc = tt.enc) is null
                    returning *
            `,[OPERATIVO, 'encu']).fetchAll();
            return "ok";
        }
    },
    {
        action:'upload_file',
        progress: true,
        parameters:[
            {name: 'id_adjunto', typeName: 'integer'},
            {name: 'nombre', typeName: 'text'},
        ],
        files:{count:1},
        coreFunction:function(context, parameters, files){
            let be=context.be;
            let client=context.client;
            context.informProgress({message:be.messages.fileUploaded});
            let file = (<UploadedFileInfo[]>files)[0]
            let ext = path.extname(file.path).substr(1);
            let originalFilename = file.originalFilename.slice(0,-(ext.length+1));
            let filename= parameters.nombre || originalFilename;
            let newPath = 'local-attachments/file-';
            var createResponse = function createResponse(adjuntoRow:{[key:string]:any}){
                let resultado = {
                    message: 'La subida se realizó correctamente (update)',
                    nombre: adjuntoRow.nombre,
                    nombre_original: adjuntoRow.nombre_original,
                    ext: adjuntoRow.ext,
                    fecha: adjuntoRow.fecha,
                    hora: adjuntoRow.hora,
                    id_adjunto: adjuntoRow.id_adjunto
                }
                return resultado
            }
            var moveFile = function moveFile(file:{path:string}, id_adjunto:string, extension:string){
                fs.move(file.path, newPath + id_adjunto + '.' + extension, { overwrite: true });
            }
            return Promise.resolve().then(function(){
                if(parameters.id_adjunto){
                    return context.client.query(`update adjuntos set nombre= $1,nombre_original = $2, ext = $3, ruta = concat('local-attachments/file-',$4::text,'.',$3::text), fecha = now(), hora = date_trunc('seconds',current_timestamp-current_date)
                        where id_adjunto = $4 returning *`,
                        [filename, originalFilename, ext, parameters.id_adjunto]
                    ).fetchUniqueRow().then(function(result){
                        return createResponse(result.row)
                    }).then(function(resultado){
                        moveFile(file,resultado.id_adjunto,resultado.ext);
                        return resultado
                    });
                }else{
                    return context.client.query(`insert into adjuntos (nombre, nombre_original, ext, fecha, hora) values ($1,$2,$3,now(), date_trunc('seconds',current_timestamp-current_date)) returning *`,
                        [filename, originalFilename, ext]
                    ).fetchUniqueRow().then(function(result){
                        return context.client.query(`update adjuntos set ruta = concat('local-attachments/file-',id_adjunto::text,'.',ext)
                            where id_adjunto = $1 returning *`,
                            [result.row.id_adjunto]
                        ).fetchUniqueRow().then(function(result){
                            return createResponse(result.row)
                        }).then(function(resultado){
                            moveFile(file,resultado.id_adjunto,resultado.ext);
                            return resultado
                        });
                    });
                }
            }).catch(function(err){
                console.log('ERROR',err.message);
                throw err;
            });
        }
    },
    {
        action:'subir_puntos',
        parameters:[
            {name:'recorrido'       , typeName:'integer', references:'recorridos'},
            {name:'puntos'          , typeName:'jsonb'                           },
        ],
        // encode:'JSON', no existe, cambiar después de la 212
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            console.log('xxxxxxxxxxxxx')
            console.log(parameters)
            console.log(typeof parameters.puntos)
            console.log(JSON.stringify(parameters.puntos))
            var be=context.be;
            let result = await context.client.query(
                `insert into recorridos_puntos (recorrido, session, secuencial, p_latitud, p_longitud, timestamp, c_latitud, c_longitud, more_info)
                   select $1 as recorrido, $2 as session, p.*
                     from jsonb_to_recordset($3 :: jsonb) 
                       as p(secuencial integer, p_latitud decimal, p_longitud decimal, timestamp bigint, c_latitud decimal, c_longitud decimal, more_info jsonb);
                `,
                [parameters.recorrido, context.session.install||be.getMachineId(), JSON.stringify(parameters.puntos)]
            ).fetchAll();
            return result.rowCount;
        }
    },
    {
        action:'puntos_traer',
        parameters:[
            {name:'recorrido'       , typeName:'integer'},
            {name:'timestamp_desde' , typeName:'bigint' }
        ],
        progress:true,
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            let be=context.be;
            let whereCond = parameters.recorrido?`where recorrido = ` + be.db.quoteLiteral(parameters.recorrido):` `;
            await context.client.query(`
                select recorrido, 
                    session, 
                    id_punto/(select gra_tx_puntos from parametros where unico_registro) as grupo, 
                    min(timestamp) as start, 
                    max(timestamp)-min(timestamp) as duracion, 
                    count(*) as cantidad, 
                    json_agg(json_build_object('p_latitud', p_latitud, 'p_longitud', p_longitud, 'c_latitud', c_latitud, 'c_longitud', c_longitud, 'more_info', more_info) order by timestamp) as puntos
                from recorridos_puntos ` +
                whereCond + ` 
                group by recorrido, session, grupo 
                ${parameters.timestamp_desde?' having min(timestamp) > '+ be.db.quoteLiteral(parameters.timestamp_desde):' '}
                order by start, 1,2,3;
            `).onRow(function(row){
                context.informProgress({row:row});
            })
            return 'ok';
        }
    },
    {
        action:'recorridos_controlables',
        parameters:[],
        progress:true,
        coreFunction:async function(context:ProcedureContext, _parameters: CoreFunctionParameters){
            return (await context.client.query(`
                select recorrido from recorridos where orden is not null order by orden`,
                []
            ).fetchAll()).rows;
        }
    },
    {
        action:'area_agregar',
        parameters:[
            {name:'operativo'   , typeName:'text', references:'operativos'   },
            {name:'recorrido'   , typeName:'integer', references:'recorridos'},
            {name:'area'        , typeName:'integer'                         },
        ],
        roles:['admin'],
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            await context.client.query(
                `insert into areas (operativo, recorrido, area) 
                    values ($1, $2, $3) 
                    returning *`,
                [parameters.operativo, parameters.recorrido, parameters.area]
            ).fetchUniqueRow();
            await context.client.query(
                `insert into tareas_areas(operativo, tarea, area, asignado, recepcionista, obs_recepcion)
                    select * 
                        from (select a.operativo, t.tarea, area, case when tarea='encu' then encuestador else null end asignado, recepcionista, obs_recepcionista
                            from areas a ,(select t.operativo, t.tarea 
                                from tareas t join parametros p on unico_registro and t.operativo=p.operativo
                            ) t
                        ) n
                        where not exists (select 1 from tareas_areas t where t.operativo= n.operativo and t.tarea=n.tarea and t.area=n.area)
                    order by 1,2,3`,
                []
            ).execute();
            await context.client.query(
                `insert into provisorio_recepcion (operativo, area) 
                    values ($1, $2) 
                    returning *`,
                [parameters.operativo, parameters.area]
            ).fetchUniqueRow();
            return `se agregó correctamente el área ${parameters.area} al recorrido ${parameters.recorrido}`;
        }
    }
    {
        action:'encuesta_capa_a_prod_pasar',
        parameters:[
            {name:'operativo'   , typeName:'text', references:'operativos'   },
            {name:'enc'         , typeName:'text'},
        ],
        roles:['admin'],
        coreFunction:async function(context:ProcedureContext, parameters: CoreFunctionParameters){
            (await context.client.query(
                `update tem
                    set enc_autogenerado_dm = enc_autogenerado_dm_capa, enc_autogenerado_dm_capa = null
                    where operativo = $1 and enc = $2 and enc_autogenerado_dm_capa is not null
                    returning *`,
                [parameters.operativo, parameters.enc]
            ).fetchUniqueRow()).row;
            await context.client.query(updateProvisorioQuery,[]).fetchAll();
            return `se movió la encuesta ${parameters.enc} a producción, se actualizó le provisorio`;
        }
    }
/* */
];

//export {ProceduresRepsic};