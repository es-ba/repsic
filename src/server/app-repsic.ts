"use strict";

import * as procesamiento from "procesamiento";
import {ProceduresRepsic} from "./procedures-repsic";

import {AppProcesamientoType, Response, TableContext} from "procesamiento";

import * as pg from "pg-promise-strict";
import * as miniTools from "mini-tools";
import * as fs from "fs-extra";

import * as yazl from "yazl";
import { NextFunction } from "express-serve-static-core";

import { adjuntos            } from "./table-adjuntos";
import { adjunto_categoria   } from "./table-adjunto_categoria";
import { barrios             } from "./table-barrios";
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
import { supervision         } from "./table-supervision";
import { tipos_lugar         } from "./table-tipos_lugar";
import { tipos_recorrido     } from "./table-tipos_recorrido";

import {defConfig} from "./def-config"
import { Request } from "rel-enc";

import * as cookieParser from 'cookie-parser';

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
        var procedimientoAReemplazar=["caso_guardar","caso_traer"];
        var parentProc = await super.getProcedures();
        parentProc = parentProc.filter((procedure:any) => !procedimientoAReemplazar.includes(procedure.action));
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
        be.app.get('/manifest.manifest', async function(req:Request, res:Response, next:NextFunction){
            miniTools.serveFile('dist/client/manifest.manifest',{})(req,res);
        });
        be.app.get(`/web-manifest.webmanifest`, async function(req, res, next){
            try{
                let isTestEnvironment = !!be.config['client-setup']['test-environment']
                const content = {
                  "name": `Repsic Progressive Web App ${isTestEnvironment?'(Test)':''}`,
                  "short_name": `REPSIC PWA ${isTestEnvironment?'(Test)':''}`,
                  "description": `Progressive Web App for Repsic ${isTestEnvironment?'(Test)':''}.`,
                  "icons": [
                    {
                      "src": `./img/logo_dm_32${isTestEnvironment?'_test':''}.png`,
                      "sizes": "32x32",
                      "type": "image/png"
                    },
                    {
                      "src": `./img/logo_dm_48${isTestEnvironment?'_test':''}.png`,
                      "sizes": "48x48",
                      "type": "image/png"
                    },
                    {
                      "src": `./img/logo_dm_64${isTestEnvironment?'_test':''}.png`,
                      "sizes": "64x64",
                      "type": "image/png"
                    },
                    {
                      "src": `./img/logo_dm_72${isTestEnvironment?'_test':''}.png`,
                      "sizes": "72x72",
                      "type": "image/png"
                    },
                    {
                      "src": `./img/logo_dm_192${isTestEnvironment?'_test':''}.png`,
                      "sizes": "192x192",
                      "type": "image/png"
                    },
                    {
                      "src": `./img/logo_dm_512${isTestEnvironment?'_test':''}.png`,
                      "sizes": "512x512",
                      "type": "image/png"
                    }
                  ],
                  "start_url": "mapa",
                  "display": "standalone",
                  "theme_color": "#000000",
                  "background_color": `${isTestEnvironment?'#EAAD3F':'#F86AF5'}`
                }
                miniTools.serveText(JSON.stringify(content), 'application/json')(req,res);
            }catch(err){
                console.log(err);
                miniTools.serveErr(req, res, next)(err);
            }
        });
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
            {type:'js' , src:'client/mapa.js'   },
            {type:'js' , src:'client/client.js' },
            {type:'css', file:'mapa.css'        },
            {type:'css', file:'guijarro.css', module: 'guijarro'    },
            {type:'css', file:'repsic.css'     },
        ])
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
    getMenu(context:Context){
        let menuDef:MenuDefinition = super.getMenu(context);
        if(this.config.server.policy=='web'){
            menuDef.menu.push({menuType:'mapa', name:'mapa'});
        }else{
            menuDef.menu = menuDef.menu.concat([
                {menuType:'menu', name:'ingresar', menuContent:[
                    {menuType:'table'             , name:'supervision'        , label:'supervisión'              },
                    {menuType:'ingresarFormulario', name:'cargar_enc'         , label:'relevamiento'             },
                    // {menuType:'table'             , name:'hoja_ruta_paradores', label:'hoja de ruta de paradores'},
                ]},
                {menuType:'mapa', name:'mapa'},
                {menuType:'menu', name:'carto', label:'recorridos y cartografía', menuContent:[
                    {menuType:'table', name:'barrios'},
                    {menuType:'table', name:'recorridos'},
                    {menuType:'table', name:'recorridos_barrios'},
                    {menuType:'table', name:'tipos_recorrido'},
                    {menuType:'table', name:'lugares'},
                    {menuType:'table', name:'tipos_lugar'},
                    {menuType:'table', name:'parametros'},
                ]},
                {menuType:'menu', name:'materiales', menuContent:[
                    {menuType:'table', name:'adjuntos'           },
                    {menuType:'table', name:'categorias_adjuntos', label:'categorías'},
                    {menuType:'table', name:'adjunto_categoria'  , label:'adjunto-categoría'},
                ]},
            ])
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
            , barrios             
            , lugares             
            , personas            
            , recorridos          
            , recorridos_barrios  
            , recorridos_puntos   
            , grupo_personas
            , casos
            , supervision
            , diccionario
            , dicvar
            , dictra        
        }
        
        be.appendToTableDefinition('inconsistencias',function(tableDef, context){
            tableDef.sql={...tableDef.sql, isTable:true};
            tableDef.fields.splice(2,0,
                {name:'id_caso', typeName:'text'   , label:'caso'   , editable: false},
                {name:'p0'     , typeName:'integer', label:'persona', editable: false}
            );
            tableDef.editable=tableDef.editable || (<TableContext>context).puede.encuestas.justificar;
            tableDef.fields.forEach(function(field){
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
    }
  }
}