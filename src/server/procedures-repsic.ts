"use strict";

import { ProcedureDef } from "./types-repsic";
import { changing } from "best-globals";
import { ProcedureContext, coreFunctionParameters, UploadedFileInfo } from "procesamiento";

var fs = require('fs-extra');
var path = require('path');
var sqlTools = require('sql-tools');

var discrepances = require('discrepances');

const pkPersonas = [{fieldName:'operativo'}, {fieldName:'id_caso'}, {fieldName:'p0'}];
const fkPersonas = [{target:'operativo', source:'operativo'}, {target:'id_caso', source:'id_caso'}];
const pkGrupoPersonas = [{fieldName:'operativo'},{fieldName:'id_caso'}];
const formPrincipal = 'F:F1';
const OPERATIVO = 'repsic241';

var struct_personas={
    tableName:'personas',
    pkFields:pkPersonas,
    childTables:[],
};

var struct_grupo_personas={
    tableName:'grupo_personas',
    pkFields:pkGrupoPersonas,
    childTables:[
        changing(struct_personas,{fkFields: fkPersonas})
    ]
};

export const ProceduresRepsic : ProcedureDef[] = [
    {
        action:'generar_formularios',
        parameters:[
            {name:'recorrido', typeName:'integer', references:'recorridos'}
        ],
        coreFunction:async function(context:ProcedureContext, parameters: coreFunctionParameters){
            var be=context.be;
            let resultUA = await context.client.query(
                `select *
                   from unidad_analisis
                   where principal = true and operativo = $1
                `,
                [OPERATIVO]
            ).fetchOneRowIfExists();
            if (resultUA.rowCount === 0){
                throw new Error('No se configuró una unidad de analisis como principal');
            }
            let row = resultUA.row;
            console.log('xxxxxxxxxxxxxxxxxxxxxxxxx resultUA',resultUA)
            console.log('xxxxxxxxxxxxxxxxxxxxxxxxx row',row)
            let resultPreguntas = await be.procedure.preguntas_ua_traer.coreFunction(context, row)
            var contenedorVacio:{[key:string]:any} = {};
            resultPreguntas.forEach(function(defPregunta:{[key:string]:any}){
                contenedorVacio[defPregunta.var_name] = defPregunta.unidad_analisis?[]:null;
            });
            contenedorVacio['u1'] = parameters.recorrido;
            
            var result = await context.client.query(
                `select debe_haber.id_caso
                from (select recorrido, armar_id(recorrido, s) as id_caso
                    from (select recorrido, cant_cues from supervision where recorrido=$1) r, lateral generate_series(1,cant_cues) s
                ) debe_haber left join grupo_personas hay on hay.id_caso::integer = debe_haber.id_caso and hay.operativo=$2
                where hay.id_caso is null`,
                [parameters.recorrido, OPERATIVO]
            ).fetchAll();
            var params = {operativo: OPERATIVO};
            for(var i=0; i < result.rowCount; i++){
                await be.procedure.caso_guardar.coreFunction(context, changing(params,{id_caso:result.rows[i].id_caso, datos_caso:contenedorVacio}))
            }
            return {agregadas:result.rowCount}
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
        coreFunction:async function(context:ProcedureContext, parameters: coreFunctionParameters){
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
        action:'caso_guardar',
        parameters:[
            {name:'operativo'   , typeName:'text', references:'operativos'},
            {name:'id_caso'     , typeName:'text'      },
            {name:'datos_caso'  , typeName:'jsonb'     },
        ],
        definedIn: 'repsic',
        coreFunction:async function(context:ProcedureContext, parameters: coreFunctionParameters){
            var client=context.client;
            parameters.datos_caso['operativo'] = parameters.operativo;
            parameters.datos_caso['id_caso'] = parameters.id_caso;

            var queries = sqlTools.structuredData.sqlWrite(parameters.datos_caso, struct_grupo_personas);
            console.log("#############",queries)
            return await queries.reduce(function(promise:Promise<any>, query:string){
                return promise.then(function() {
                    return client.query(query).execute().then(function(){
                        return 'ok';
                    });
                });
            },Promise.resolve()).then(function(){
                return "ok";
            }).catch(function(err:Error){
                console.log("ENTRA EN EL CATCH: ",err)
                throw err
            })
           
        }
    },
    {
        action: 'caso_traer',
        parameters: [
            {name:'operativo'     ,references:'operativos',  typeName:'text'},
            {name:'id_caso'       ,typeName:'text'},
        ],
        resultOk: 'goToEnc',
        definedIn: 'repsic',
        coreFunction: async function(context:ProcedureContext, parameters: coreFunctionParameters){
            var client=context.client;
            return client.query(
                sqlTools.structuredData.sqlRead({operativo: parameters.operativo, id_caso:parameters.id_caso}, struct_grupo_personas)
            ).fetchUniqueValue().then(function(result){
                var response:{[key:string]:any} = {};
                response['operativo'] = parameters.operativo;
                response['id_caso'] = parameters.id_caso;
                response['datos_caso'] = result.value;
                response['formulario'] = formPrincipal;
                return response;
            }).catch(function(err){
                console.log('ERROR',err.message);
                throw err;
            });
        }
    },
    {
        action:'pasar_json2ua',
        parameters:[
        ],
        coreFunction:async function(context:ProcedureContext, _parameters: coreFunctionParameters){
            /* GENERALIZAR: */
            var be=context.be;
            let mainTable=be.db.quoteIdent('grupo_personas');
            /* FIN-GENERALIZAR: */
            let resultMain = await context.client.query(`SELECT * FROM ${mainTable} LIMIT 1`).fetchAll();
            if(resultMain.rowCount>0){
                console.log('HAY DATOS',resultMain.rows)
                throw new Error('HAY DATOS. NO SE PUEDE INICIAR EL PASAJE');
            }
            let resultJson = await context.client.query(
                `SELECT operativo, id_caso, datos_caso FROM formularios_json WHERE operativo=$1`,
                [OPERATIVO]
            ).fetchAll();
            var procedureGuardar = be.procedure.caso_guardar;
            if(procedureGuardar.definedIn!='repsic'){
                throw new Error('hay que sobreescribir caso_guardar');
            }
            console.log('xxxxxxxxxxxxxx',resultJson.rows)
            return Promise.all(resultJson.rows.map(async function(row){
                await procedureGuardar.coreFunction(context, row)
                if(!('r4_esp' in row.datos_caso)){
                    row.datos_caso.r4_esp = null;
                }
                var {datos_caso, id_caso, operativo} = await be.procedure.caso_traer.coreFunction(context, {operativo:row.operativo, id_caso:row.id_caso})
                var verQueGrabo = {datos_caso, id_caso, operativo}
                try{
                    discrepances.showAndThrow(verQueGrabo,row)
                }catch(err){
                    console.log(verQueGrabo,row)
                }
                return 'Ok!';
            })).catch(function(err){
                throw err;
            }).then(function(result){
                console.log('xxxxxxxx TERMINO LOS PROMISE.ALL')
                return result;
            })
        }
    },
    {
        action:'puntos_traer',
        parameters:[
            {name:'recorrido'       , typeName:'integer'},
            {name:'timestamp_desde' , typeName:'bigint' }
        ],
        progress:true,
        coreFunction:async function(context:ProcedureContext, parameters: coreFunctionParameters){
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
        action:'actualizar_estado',
        parameters:[
            {name:'operativo'         ,references:'operativos',  typeName:'text'},
            {name:'id_caso'                                   ,  typeName:'text'},
            {name:'estado_actual'                             ,  typeName:'text'},
            {name:'proximo_estado'                            ,  typeName:'text'},
        ],
        progress:true,
        coreFunction:async function(context:ProcedureContext, parameters: coreFunctionParameters){
            let be=context.be;
            await context.client.query(`
                update grupo_personas
                set estado=$4
                where operativo=$1 and id_caso=$2 and estado=$3`,
                [parameters.operativo, parameters.id_caso, parameters.estado_actual, parameters.proximo_estado]
            ).execute();
            return 'estado_cambiado';
        },
    },
    {
        action:'recorridos_controlables',
        parameters:[],
        progress:true,
        coreFunction:async function(context:ProcedureContext, _parameters: coreFunctionParameters){
            return (await context.client.query(`
                select recorrido from recorridos where orden is not null order by orden`,
                []
            ).fetchAll()).rows;
        }
    }
/* */
];

//export {ProceduresRepsic};