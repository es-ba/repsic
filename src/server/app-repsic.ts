"use strict";

import * as procesamiento from "procesamiento";
import {ProceduresRepsic, updateProvisorioQuery} from "./procedures-repsic";

import {AppProcesamientoType, Response, TableContext} from "procesamiento";

import { FieldDefinition, MenuInfoBase, getDomicilioFields } from "dmencu";

import * as pg from "pg-promise-strict";
import * as miniTools from "mini-tools";
import * as fs from "fs-extra";

import * as yazl from "yazl";
import { NextFunction } from "express-serve-static-core";

import { adjuntos            } from "./table-adjuntos";
import { adjunto_categoria   } from "./table-adjunto_categoria";
import { casos               } from "./table-casos";
import { categorias_adjuntos } from "./table-categorias_adjuntos";
import { diccionario         } from "./table-diccionario";
import { dicvar              } from "./table-dicvar";
import { dictra              } from "./table-dictra";
import { grupo_personas      } from "./table-grupo_personas";
import { lugares             } from "./table-lugares";
import { personas            } from "./table-personas";
import { recorridos          } from "./table-recorridos";
import { recorridos_barrios  } from "./table-recorridos_barrios";
import { recorridos_puntos   } from "./table-recorridos_puntos";
import { coordinacion        } from "./table-coordinacion";
import { provisorio_recepcion} from "./table-provisorio_recepcion";
import { provisorio_recorridos} from "./table-provisorio_recorridos";
import { tipos_lugar         } from "./table-tipos_lugar";
import { tipos_recorrido     } from "./table-tipos_recorrido";
import { incompletas_dm_tem  } from "./table-incompletas_dm_tem";
import { puntos_gps          } from "./table-puntos_gps";

import {defConfig} from "./def-config"
import { Request } from "rel-enc";

import * as cookieParser from 'cookie-parser';

const APP_DM_VERSION="#30-04-25";

interface Context extends procesamiento.Context{
  puede:object
  superuser?:true
}

type MenuInfoMapa = {
  menuType:'mapa'
} & procesamiento.MenuInfoBase;

type MenuInfo = procesamiento.MenuInfo | MenuInfoMapa 
     | {menuType:'ingresarFormulario', label?:string, name:string} | {menuType:'menu', label?:string, name:string, menuContent:MenuInfo[]};
type MenuDefinition = {menu:MenuInfo[]}

export type Constructor<T> = new(...args: any[]) => T;
export function emergeAppRepsic<T extends Constructor<AppProcesamientoType>>(Base:T){
  return class AppRepsic extends Base{
    /*myProcedures: procesamiento.ProcedureDef[] = ProceduresRepsic;
    permisosRol:{superuser?:boolean, [key:string]:any}
    permisosRolSoloTrue:object
    permisosSuperuser:object
    modulosEspecialesRepsic:procesamiento.ClientModuleDefinition[]=[];
    definicionEstructural:{
        grupo_personas:{
            source:'grupo_personas',
            target:'grupo_personas_cal',
            where:'grupo_personas_cal.id_caso = grupo_personas.id_caso and grupo_personas_cal.operativo = grupo_personas.operativo ',
        }
    }*/
    constructor(...args:any[]){ 
        super(args); 
    }
    
    async getProcedures(){
        var parentProc = await super.getProcedures();
        var be = this;
        parentProc = parentProc.map(procDef=>{
            if(['dm_sincronizar','dm_backup','dm_blanquear'].includes(procDef.action)){
                var coreFunctionInterno = procDef.coreFunction;
                procDef.coreFunction = async function(context:procesamiento.ProcedureContext, parameters:any){
                    var result = await coreFunctionInterno(context, parameters);
                    var actualizadas = await context.client.query(updateProvisorioQuery,[]).fetchAll();
                    console.log(`se actualizó el provisorio, ${actualizadas.rowCount} areas actualizadas`)
                    return result;
                }
            }
            return procDef;
        })
        return parentProc.concat(ProceduresRepsic);
    }

    async controlLoggedOrTokenDevolverRecorrido(req:Request):Promise<number>{
        console.log('control');
        console.log('req.user',req.user)
        console.log('req.session.recorrido',(req.session||{}).recorrido,req.session);
        if(!req.user && (!req.session || !req.session.recorrido)){
            var err=new Error("Unauthorized");
            err.code=401;
            throw err;
        }
        if(req.session && req.session.recorrido){
            return Number(req.session.recorrido);
        }
        return Number(req.query.recorrido);
    }
    addSchrödingerServices(mainApp:procesamiento.Express, baseUrl:string){
        let be=this;
        super.addSchrödingerServices(mainApp, baseUrl);
        mainApp.use(cookieParser());
        mainApp.use(function(req:Request,res:Response, next:NextFunction){
            if(req.session && !req.session.install){
                req.session.install=Math.random().toString().replace('.','');
            }
            next();
        })
        mainApp.get(baseUrl+'/datos/recorrido', async function(req:Request,res:Response, next:NextFunction){
            try{
                let recorrido=await be.controlLoggedOrTokenDevolverRecorrido(req);
                console.log('recorrido obtenido',recorrido)
                let row = await be.inDbClient(req, async function(client:pg.Client){
                    if(recorrido){
                        let result = await client.query(
                            `SELECT r.*, 
                                (SELECT jsonb_agg(to_jsonb(x.*)) FROM (SELECT l.*, tl.descripcion as tipo_lugar_descripcion FROM lugares l INNER JOIN tipos_lugar tl USING(tipo_lugar) WHERE l.recorrido = r.recorrido )x) as lugares,
                                (SELECT jsonb_agg(to_jsonb(a.*)) FROM adjuntos a INNER JOIN adjunto_categoria ca USING (id_adjunto) WHERE a.recorrido = r.recorrido AND ca.categoria = 'carto') as adjuntos
                            FROM recorridos r 
                            WHERE recorrido = $1
                            `,
                            [recorrido]
                        ).fetchOneRowIfExists();
                        return result.row;
                    }else{
                        let result = await client.query(
                            `SELECT 
                                (SELECT jsonb_agg(to_jsonb(x.*)) FROM (SELECT l.*, tl.descripcion as tipo_lugar_descripcion FROM lugares l INNER JOIN tipos_lugar tl USING(tipo_lugar) )x) as lugares,
                                (SELECT jsonb_agg(to_jsonb(a.*)) FROM adjuntos a INNER JOIN adjunto_categoria ca USING (id_adjunto) WHERE ca.categoria = 'carto') as adjuntos
                            `
                        ).fetchUniqueRow();
                        return result.row;
                    }
                });
                miniTools.serveJson(row)(req,res,next);
            }catch(err){
                miniTools.serveErr(req,res,next)(err)
            }
        });
        mainApp.get(baseUrl+'/token/recorrido', async function(req:Request, res:Response, next:NextFunction){
            try{
                let recorrido=Number(req.query.recorrido);
                if(!req.user){
                    throw new Error("Unauthorized");
                }
                if(recorrido<=0 || recorrido>99){
                    throw new Error("Error en el numero de recorrido");
                }
                if (req.session) { req.session.recorrido=recorrido; }
                res.cookie('recorrido',recorrido.toString(), { maxAge: 1000*60*60*24*30});
                console.log('/token/recorrido',recorrido)
                res.send('ok')
                res.end()
            }catch(err){
                miniTools.serveErr(req,res,next)(err)
            }
        });
        mainApp.get(baseUrl+'/token/limpiar', async function(req:Request, res:Response, next:NextFunction){
            try{
                if(!req.user){
                    throw new Error("Unauthorized");
                }
                if (req.session) { req.session.recorrido=0; }
                res.cookie('recorrido','0', { maxAge: 1000*60*60*24*30 });
                console.log('/token/limpiar')
                res.send('ok')
                res.end()
            }catch(err){
                miniTools.serveErr(req,res,next)(err)
            }
        });
    }
    addLoggedServices(){
        var be = this;
        super.addLoggedServices();
        be.app.get('/mapa', async function(req:Request, res:Response, next:NextFunction){
            try{
                let isTestEnvironment = !!be.config['client-setup']['test-environment']
                await be.controlLoggedOrTokenDevolverRecorrido(req);
                let hayRecorridoCookie = !!Number(req.cookies.recorrido);
                let context = be.getContext(req);
                if(!hayRecorridoCookie && context.user.rol == 'relevador' && context.user.recorrido){
                    res.cookie('recorrido',context.user.recorrido.toString(), { maxAge: 1000*60*60*24*30});
                }
                miniTools.serveFile('dist/client/mapa.html',{})(req,res);
            }catch(err){
                miniTools.serveErr(req,res,next)(err)
            }
        });
        this.app.get('/file', async function(req:Request,res:Response){
            let result = await be.inTransaction(req, 
                async (client:pg.Client)=>
                client.query("select ruta from adjuntos where id_adjunto = $1",[req.query.id_adjunto])
                .fetchUniqueValue()
            );
            var path = result.value;
            miniTools.serveFile(path,{})(req,res);
        });
        this.app.get('/download/all',async function(req:Request, res:Response, next:()=>void){
            if(req.user==null || req.user.rol!='admin'){
                console.log('no está autorizado a bajarse todo',req.user)
                return next();
            }
            let zip = new yazl.ZipFile();
            zip.outputStream.pipe(res);
            let base = 'local-attachments'
            let files = await fs.readdir(base);
            await Promise.all(files.map(async function(fileName){
                var path = base+'/'+fileName;
                var stat = await fs.stat(path);
                if(stat.isFile){
                    zip.addFile(path,fileName);
                }
            }));
            zip.end();
        })
    }
    postConfig(){
        super.postConfig();
        var be:AppRepsic=this;
        return be.inTransaction(null,function(client:pg.Client){
            return Promise.all([
                client.query(`
                    SELECT jsonb_object_agg(r.rol,jsonb_build_object('superuser',r.superuser,'puede',(
                          SELECT jsonb_object_agg(rp.permiso,(
                                SELECT jsonb_object_agg(rpa.accion,rpa.habilitado)
                                  FROM roles_permisos rpa
                                  WHERE rpa.rol=rp.rol AND rpa.permiso=rp.permiso
                            ))
                            FROM roles_permisos rp
                            WHERE rp.rol=r.rol
                      )))
                      FROM roles r
                `).fetchUniqueValue(),
                client.query(`
                    SELECT jsonb_object_agg(r.rol,jsonb_build_object('superuser',r.superuser,'puede',(
                          SELECT jsonb_object_agg(rp.permiso,(
                                SELECT jsonb_object_agg(rpa.accion,rpa.habilitado)
                                  FROM roles_permisos rpa
                                  WHERE rpa.rol=rp.rol AND rpa.permiso=rp.permiso AND rpa.habilitado
                            ))
                            FROM roles_permisos rp
                            WHERE rp.rol=r.rol AND rp.habilitado
                      )))
                      FROM roles r
                `).fetchUniqueValue(),
                client.query(`
                    SELECT jsonb_object_agg(permiso,(
                        SELECT jsonb_object_agg(accion,true)
                          FROM permisos pa
                          WHERE pa.permiso=p.permiso
                      ))
                      FROM permisos p
                `).fetchUniqueValue()
            ]).then(function(results){
                be.permisosRol=results[0].value;
                be.permisosRolSoloTrue=results[1].value;
                be.permisosSuperuser=results[2].value;
                console.dir(be.permisosRolSoloTrue,{depth:9});
                console.dir(be.permisosSuperuser,{depth:9});
            });
        });
    }
    configStaticConfig(){
        super.configStaticConfig();
        this.setStaticConfig(defConfig);
    }

    clientIncludes(req:Request, hideBEPlusInclusions?:boolean){
        return super.clientIncludes(req, hideBEPlusInclusions).concat([
            {type:'js' , src:'lib/guijarro.js'  , module:'guijarro', ts:{url:'src', path:'../src'}},
            {type:'js' , src:'adjuntos.js'      },
            {type:'js' , src:'mapa.js'   },
            {type:'js' , src:'client.js' },
            {type:'js' , src:'my-render-formulario.js' },
            {type:'js' , src:'my-bypass-formulario.js' },
            {type:'css', file:'mapa.css'        },
            {type:'css', file:'guijarro.css', module: 'guijarro'    },
            {type:'css', file:'repsic.css'     },
        ])
    }

    createResourcesForCacheJson(parameters:Record<string,any>){
        var be = this;
        var jsonResult:any = super.createResourcesForCacheJson(parameters);
        jsonResult.version = APP_DM_VERSION;
        jsonResult.appName = 'repsic';
        jsonResult.cache=jsonResult.cache.concat([
            "my-render-formulario.js",
            'my-bypass-formulario.js'
        ])
        return jsonResult
    }
    getColorsJson(sufijo:'_test'|'_capa'|''){
        let miSufijo: '_prod'|'_test'|'_capa' = sufijo || '_prod';
        let coloresEntornos = {
            "_prod":"#067DB5",
            "_test":"#C47208",
            "_capa":"#880996",
        }
        return {
            "start_url": "../campo",
            "display": "standalone",
            "theme_color": "#3F51B5",
            "background_color": coloresEntornos[miSufijo]
        }
    }

    getContext(req:Request):Context{
        var be = this;
        var fatherContext = super.getContext(req);
        if(fatherContext.user){
            if(req.user && be.permisosRol[req.user.rol].superuser){
                return {superuser:true, puede: be.permisosSuperuser, ...fatherContext}
            }else{
                return {puede: be.permisosRol[req.user.rol].puede, ...fatherContext}
            }
        }
        return {puede:{}, ...fatherContext};
    }
    getMenuVarios(context:Context){
        let menuVarios = super.getMenuVarios(context);
        menuVarios.menuContent = menuVarios.menuContent.filter((menuInfo)=>!['abrir_encuesta','hoja_ruta'].includes(menuInfo.name));
        menuVarios.menuContent.push({menuType:'proc', name:'area_agregar', label: 'agregar area a un recorrido'})
        return menuVarios;
    }
    getMenuControles(context:Context){
        let menuControles = super.getMenuControles(context);
        menuControles.push({menuType:'table', name:'encuestas_incompletas_dm', table:'incompletas_dm_tem'},
        )
        return menuControles;
    }
    getMenuAsignacion(context:Context, modo:'papel'|'dm'){
        let filtroRecepcionista = context.user.rol=='recepcionista' ? {recepcionista: context.user.idper} : {};
        return modo=='dm'?
                { menuType: 'table', name: 'asig_encuestador', label:'asignacion', table: 't_encu_areas', ff: { tarea: 'encu', ...filtroRecepcionista } }
            :
                { menuType: 'table', name: 'asig_ingresador', label:'asignacion', table: 't_ingr_areas', ff: { tarea: 'ingr', ...filtroRecepcionista } }
    }
        
    getMenuRecepcion(context:Context, modo:'papel'|'dm'){
        return modo=='dm'?
            {menuType:'table', name:'recep_encuestador', label:'recepción/subcordinación', table:'encuestadores_asignados'}
        :
            {menuType:'table', name:'recep_ingresador', label:'recepción', table:'ingresadores_asignados'}
    }

    getMenuCarto(context:Context) {
        if(context.puede?.campo?.administrar){
            let menuCarto = super.getMenuCarto(context);
            if(menuCarto){
                menuCarto.menuContent.push(
                    {menuType:'table', name:'puntos_gps'},
                    {menuType:'table', name:'recorridos'},
                    {menuType:'table', name:'recorridos_barrios'},
                    {menuType:'table', name:'tipos_recorrido'},
                    {menuType:'table', name:'lugares'},
                    {menuType:'table', name:'tipos_lugar'},
                    {menuType:'menu', name:'materiales', menuContent:[
                        {menuType:'table', name:'adjuntos'           },
                        {menuType:'table', name:'categorias_adjuntos', label:'categorías'},
                        {menuType:'table', name:'adjunto_categoria'  , label:'adjunto-categoría'},
                    ]}
                )
            }
            return menuCarto
        }
        return null
    }

    getMenu(context:Context){
        let menuDef:MenuDefinition = super.getMenu(context);
        if(this.config.server.policy=='web'){
            //menuDef.menu.push({menuType:'mapa', name:'mapa'});
        }else{
            //oculto menu de asignacion y recepcion para redefinirlo en repsic
            menuDef.menu = menuDef.menu.filter((menuInfo:MenuInfo)=>!['supervision','asig_encuestador','asig_ingresador','recep_encuestador','recep_ingresador'].includes(menuInfo.name));
            if (context.puede?.campo?.administrar) {
                menuDef.menu.unshift({ menuType: 'table', name: 'general', label:'asignacion gral', table: 'areas_asignacion_general' });
            }
            let menuProvisorio: MenuInfo = {menuType:'menu'  , name:'provisorio', menuContent:[]};
            let menuDM: MenuInfo = {menuType:'menu'  , name:'dm', menuContent:[]};
            let menuPapel: MenuInfo = {menuType:'menu'  , name:'papel', menuContent:[]};
            menuPapel.menuContent.push({menuType:'table' , name:'ingresar', label:'ingreso', table:'tareas_tem_ingreso', ff:{tarea:'ingr', asignado:context.user.idper }})
            if(context.puede?.campo?.editar){
                menuDM.menuContent.push(this.getMenuAsignacion(context,'dm'));
                menuDM.menuContent.push(this.getMenuRecepcion(context,'dm'));
                menuPapel.menuContent.unshift(this.getMenuAsignacion(context,'papel'));
                menuPapel.menuContent.push(this.getMenuRecepcion(context,'papel'));
                menuProvisorio.menuContent.push({menuType:'table' , name:'provisorio_recepcion', label:'subcoordinación' });
                menuDef.menu.splice(1,0,menuProvisorio,menuDM,menuPapel);
                if(context.puede?.campo?.administrar){
                    menuProvisorio.menuContent.unshift(
                        {menuType:'table' , name:'provisorio_recorridos', label:'recorridos resumen' },
                    );
                    menuPapel.menuContent.unshift(
                        {menuType:'table' , name:'coordinacion'         , label:'generar casos papel' },
                    );
                    /*menuDef.menu.push(
                        //{menuType:'mapa'  , name:'mapa'},
                        {menuType:'menu'  , name:'carto', label:'materiales carto', menuContent:[
                            {menuType:'table', name:'puntos_gps'},
                            {menuType:'table', name:'barrios'},
                            {menuType:'table', name:'recorridos'},
                            {menuType:'table', name:'recorridos_barrios'},
                            {menuType:'table', name:'tipos_recorrido'},
                            {menuType:'table', name:'lugares'},
                            {menuType:'table', name:'tipos_lugar'},
                            {menuType:'menu', name:'materiales', menuContent:[
                                {menuType:'table', name:'adjuntos'           },
                                {menuType:'table', name:'categorias_adjuntos', label:'categorías'},
                                {menuType:'table', name:'adjunto_categoria'  , label:'adjunto-categoría'},
                            ]}
                        ]},
                    )*/
                }
            //usuario ingresador
            }else{
                menuDef.menu.splice(1,0,menuPapel);
            }
            if(this.getMenuVarios(context).menuContent.length == 0){
                menuDef.menu = menuDef.menu.filter((menuInfo:MenuInfo)=>!['varios'].includes(menuInfo.name));
            }
        }
        return menuDef;
    }
    prepareGetTables(){
        var be=this;
        super.prepareGetTables();
        this.getTableDefinition={
            ...this.getTableDefinition
            , adjuntos            
            , categorias_adjuntos 
            , adjunto_categoria
            , tipos_lugar         
            , tipos_recorrido     
            , lugares             
            , personas            
            , recorridos          
            , recorridos_barrios  
            , recorridos_puntos   
            , grupo_personas
            , casos
            , coordinacion
            , provisorio_recepcion
            , provisorio_recorridos
            , diccionario
            , dicvar
            , dictra
            , incompletas_dm_tem
            , puntos_gps
        }
        delete(this.getTableDefinition.viviendas);
        delete(this.getTableDefinition.personas_sup);
        delete(this.getTableDefinition.hogares);
        delete(this.getTableDefinition.hogares_sup);
        delete(this.getTableDefinition.visitas);
        delete(this.getTableDefinition.visitas_sup);
        
        be.appendToTableDefinition('inconsistencias',function(tableDef, context){
            tableDef.sql={...tableDef.sql, isTable:true};
            tableDef.fields.splice(2,0,
                {name:'id_caso', typeName:'text'   , label:'caso'   , editable: false},
            );
            tableDef.editable=tableDef.editable || (<TableContext>context).puede.encuestas.justificar;

            tableDef.fields=tableDef.fields.filter(f=>![/*'vivienda',*/'hogar','visita'].includes(f.name ))
            tableDef.fields.forEach(function(field){
                if(field.name=='vivienda'){
                    field.visible=false;
                }
                if(field.name=='pk_integrada'){
                    field.visible=false;
                }
                if(field.name=='justificacion'){
                    field.editable=(<TableContext>context).forDump || (<TableContext>context).puede.encuestas.justificar;
                }
            })
        })
        be.appendToTableDefinition('parametros',function(tableDef){
            tableDef.fields.push(
                {name:'gra_tx_puntos'                 , typeName:'integer'   , label:'granularidad transmision puntos'      , editable: true, nullable: false, defaultDbValue:1000},
                {name:'gra_puntos_por_recorrido'      , typeName:'integer'   , label:'granularidad puntos por recorrido'    , editable: true, nullable: false, defaultDbValue:75  },
                {name:'gra_puntos_todos_recorridos'   , typeName:'integer'   , label:'granularidad puntos todos recorridos' , editable: true, nullable: false, defaultDbValue:1000 },
                {name:'velocidad_animacion_puntos_ms' , typeName:'integer'   , label:'vel. animación puntos (ms)'           , editable: true, nullable: false, defaultDbValue:10  }
            );
        })
        be.appendToTableDefinition('usuarios', function (tableDef,context) {
            tableDef.fields.push(
                {name:'recorrido'  , typeName:'integer',  editable:true}
            );
            tableDef.foreignKeys=tableDef.foreignKeys || [];
            tableDef.foreignKeys.push(
                {references:'recorridos'    , fields: ['recorrido'] },
            )
        });
        be.appendToTableDefinition('areas', function (tableDef,context) {
            tableDef.fields.splice(2,0,
                {name:'recorrido'  , typeName:'integer',  editable:true, nullable: false}
            );
            tableDef.foreignKeys=tableDef.foreignKeys || [];
            tableDef.foreignKeys.push(
                {references:'recorridos'    , fields: ['recorrido'] },
            )
            tableDef.constraints = tableDef.constraints || [];
            tableDef.constraints.push(
                {constraintType:'unique', fields:['operativo', 'recorrido','area']},
            )
        });
        be.appendToTableDefinition('t_encu_areas', function (tableDef,context) {
            let fkAreas = tableDef.foreignKeys!.find((fk)=>fk.references=='areas')!;
            fkAreas.displayAllFields=false;
            fkAreas.displayAfterFieldName='area';
            fkAreas.displayFields=['recorrido'];
        });
        be.appendToTableDefinition('tareas_tem_ingreso', function (tableDef,context) {
            let domicilioFieldNames:string[] = getDomicilioFields().map((fieldDef)=>fieldDef.name);
            tableDef.fields.splice(2,0,
                { name: "id_caso_papel" , label:'id papel'              , typeName: "text"    , editable:false, inTable:false, clientSide:"parseIDPapel"       },
            );
            tableDef.hiddenColumns = tableDef.hiddenColumns?.concat([...domicilioFieldNames,'telefono']);
        });
        be.appendToTableDefinition('areas_asignacion_general', function (tableDef,context) {
            let forExclude: string[] = [];
            for(let t of ['recu', 'supe']){
                for(let f of tableDef.tareasFields){
                    forExclude.push(`${f.prefijo}_${t}`);
                    forExclude.push(`${f.prefijo}_${t}_nombre`);
                    forExclude.push(`${f.prefijo}_${t}_apellido`);
                    forExclude.push(`${f.prefijo}_${t}_dispositivo`);
                }
            }
            tableDef.fields = tableDef.fields.filter((fieldDef:FieldDefinition)=>!forExclude.includes(fieldDef.name));
            tableDef.fields.splice(1,0,
                {name:'recorrido'  , typeName:'integer',  editable:false, inTable:false}
            );

            tableDef.foreignKeys=tableDef.foreignKeys || [];
            tableDef.softForeignKeys=tableDef.softForeignKeys || [];
            tableDef.softForeignKeys.push(
                {references:'recorridos'    , fields: ['recorrido'] },
            )
            
            if (!tableDef.hiddenColumns) tableDef.hiddenColumns = [];
            tableDef.hiddenColumns.push('ausentes', 'otras_causas_hogar', 'otras_causas_vivienda', 'rechazos');
        });
        be.appendToTableDefinition('tem', function (tableDef,context) {
            tableDef.fields.splice(9,0,
                {name:'recorrido'        , typeName:'integer',  editable:false},
                {name:'tipo_recorrido'   , typeName:'integer',  editable:false},
                {name:'comuna_agrupada'  , typeName:'text'   ,  editable:false},
                {name:'barrios_agrupados', typeName:'text'   ,  editable:false},
            );
            tableDef.fields;
            tableDef.sql!.from = tableDef.sql!.from?.replace(
                't."operativo",t."enc"',
                't."operativo",t."enc",t."recorrido", t."tipo_recorrido", t."comuna_agrupada", t."barrios_agrupados"');
        });
        be.appendToTableDefinition('barrios',function(tableDef){
            tableDef.detailTables = tableDef.detailTables || [];
            tableDef.detailTables.push(
                {table:'recorridos_barrios',fields:['comuna','barrio'], abr:'R'}
            );
        })
    }
  }
}