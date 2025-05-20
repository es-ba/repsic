"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function puntos_gps(context:TableContext):TableDefinition {
    var admin = context.user.rol === 'admin';
    return {
        name: 'puntos_gps',
        elementName: 'punto_gps',
        editable: false,
        fields: [
            { name: "id_caso"     , typeName: "text"    },
            { name: "recorrido"   , typeName: "integer" },
            { name: "barrio"      , typeName: "text"    },
            { name: "calle"       , typeName: "text"    },
            { name: "altura"      , typeName: "integer" },
            { name: "interseccion", typeName: "text"    },
            { name: "lugar_nombre", typeName: "text"    },
            { name: "latitud"     , typeName: "decimal" },
            { name: "longitud"    , typeName: "decimal" },
            { name: "cprecision"  , typeName: "decimal" },
            { name: "orden"       , typeName: "decimal"}
        ],
        primaryKey: ['id_caso', 'orden'],
        /*
        foreignKeys: [
            { references: 'recorridos', fields: ['recorrido'], displayAllFields:true},
        ],
        */
        sql:{
            isTable:false,
            from:`( 
                with x as(
                    select id_caso, u1 as recorrido,u2,u3,u4 as barrio, lugar_nombre, lugar_codigo
                        ,u5 as calle,u6 as altura,u7 interseccion,u8, u9 
                        ,u9j.*, g.obs 
                        --, replace(replace(replace(value::text, quote_literal('\\\\'), quote_literal('\\'), quote_literal('\"'), quote_literal('"')),quote_literal('\\b'), quote_literal('\b')) u9elem_sin_escapado 
                        ,replace(replace(replace(value::text, '\\\\\', '\\\'), '\\"', '"'),'\\\b', '\\b') u9elem_sin_escapado
                        from grupo_personas g
                        join tem t on t.enc=id_caso and resumen_estado is distinct from 'vacio'
                        , jsonb_array_elements(u9::jsonb) u9j
                        where token_autogenerado_dm is not null
                        order by 1
                ), x1 as (
                    select *, (substr(u9elem_sin_escapado,2,length(u9elem_sin_escapado)-2))::jsonb u9elem_json
                        from  x  
                        where u9elem_sin_escapado~'coords'
                )
                    select *,(u9elem_json#>>'{coords,accuracy}')::numeric cprecision
                        , (u9elem_json#>>'{coords,latitude}')::numeric latitud
                        , (u9elem_json#>>'{coords,longitude}')::numeric longitud
                        ,(u9elem_json#>>'{timestamp}')::numeric as orden 
                        from x1 
                    order by id_caso,(u9elem_json#>>'{timestamp}')::numeric 
            )`
        }               
    };
}
