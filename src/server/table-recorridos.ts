"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function recorridos(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'recorridos',
        elementName: 'recorrido',
        editable: admin,
        fields: [
            { name: "recorrido"          , typeName: "integer" },
            { name: "tipo_recorrido"     , typeName: "integer" }, 
            { name: "areas"              , typeName: "text" , editable:false, inTable: false}, 
            { name: "apellido"           , typeName: "text"    },
            { name: "nombre"             , typeName: "text"    },
            { name: "nombre_parador"     , typeName: "text"    },
            { name: "direccion_parador"  , typeName: "text"    },
            { name: "observaciones"      , typeName: "text"    },
            { name: "particion"          , typeName: "text"    },
            { name: "comuna"             , typeName: "text"    , editable:false, inTable: false},
            { name: "descripcion_barrio" , typeName: "text"    , editable:false, inTable: false},
            { name: "orden"              , typeName: "bigint"  },
            { name: "mapa"               , typeName: "text"    , editable:false, inTable: false, clientSide:'openMap', serverSide:true, title:'🌎'},
        ],
        hiddenColumns: ['nombre', 'apellido'],
        primaryKey: ['recorrido'],
        foreignKeys:[
            {references:'tipos_recorrido'    , fields: ['tipo_recorrido'] },
        ],
        detailTables:[
            {table:'recorridos_barrios', fields:['recorrido'], abr:'B', label:'barrios'},
            {table:'lugares'           , fields:['recorrido'], abr:'L'},
            {table:'adjuntos'          , fields:['recorrido'], abr:'A'},
        ],
        constraints:[
            {   
                constraintType:'check', 
                consName:'valor invalido en particion', 
                expr:"particion in ('entero', 'partido')"
            },
        ],
        sql:{
            fields:{
                comuna:{
                    expr:`(
                            select array_agg(distinct comuna order by comuna)::text 
                                from (select comuna
                                        from recorridos_barrios 
                                             left join barrios using (comuna, barrio) 
                                        where recorrido=recorridos.recorrido
                                      union 
                                      select comuna
                                        from lugares 
                                        where recorrido=recorridos.recorrido
                                ) x
                    )`
                },
                descripcion_barrio:{
                    expr:`(
                        select string_agg(nombre,', ' order by barrio) 
                            from (
                                select barrio,nombre
                                    from recorridos_barrios left join barrios using (comuna, barrio) 
                                    where recorrido=recorridos.recorrido
							    union
                                select barrio, nombre
                                    from lugares left join barrios using (comuna,barrio) 
                                    where recorrido=recorridos.recorrido
                            )
                    )`
                },
                mapa:{expr:'tipos_recorrido.abr'},
                areas:{expr:`(
                    select string_agg(area::text,', ')
                        from areas
                        where recorrido=recorridos.recorrido
                )`}
            }
        }
    };
}