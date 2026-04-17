"use strict";

import {TableDefinition, TableContext} from "./types-repsic";
const str_sql_anterior= `( 
    with x as(
        select id_caso, u1 as recorrido,u2,u3,u4 as barrio, lugar_nombre, lugar_codigo
              ,u5 as calle,u6 as altura,u7 interseccion,u8, u9 
              ,u9j.*, g.obs 
              --, replace(replace(replace(value::text, quote_literal('\\\\'), quote_literal('\\'), quote_literal('\"'), quote_literal('"')),quote_literal('\\b'), quote_literal('\b')) u9elem_sin_escapado 
              ,replace(replace(replace(value::text, '\\\\\', '\\\'), '\\"', '"'),'\\\b', '\\b') u9elem_sin_escapado
            from grupo_personas g
              join tem t on t.enc=id_caso and resumen_estado is distinct from 'vacio'
               , jsonb_array_elements(u9::jsonb) u9j
            where enc_autogenerado_dm is not null
            order by 1
    ), x1 as (
        select *, (substr(u9elem_sin_escapado,2,length(u9elem_sin_escapado)-2))::jsonb u9elem_json
            from  x  
            where u9elem_sin_escapado~'coords'
    )
    select *,(u9elem_json#>>'{coords,accuracy}')::numeric cprecision
        , (u9elem_json#>>'{coords,latitude}')::numeric latitud
        , (u9elem_json#>>'{coords,longitude}')::numeric longitud
        ,to_timestamp((u9elem_json#>>'{timestamp}')::numeric/1000)::timestamp without time zone as cuando 
        from x1 
    order by id_caso,(u9elem_json#>>'{timestamp}')::numeric 
)`;

const CONTRABARRA='chr(92)';

export const getSqlFrom = () => `( 
with json_enc_carto as(
        select enc id_caso, u1 as recorrido,u2,u3,u4 as barrio, lugar_nombre, lugar_codigo
           ,u5 as calle,u6 as altura,u7 interseccion,u8, u9 , gru_pers.obs
           , enc_autogenerado_dm
           , resumen_estado
           , replace(replace(replace(replace(replace(u9, lpad('',2,${CONTRABARRA})||'"', '"'),${CONTRABARRA}||'"','"'),'""','"'),'"{','{'),'}"','}') u9_limpio
            from tem, jsonb_to_record(json_encuesta) as gru_pers(
                id_caso text ,
                u1 integer,
                u2 integer,
                u3 text ,
                u4 text ,
                lugar_nombre  text,
                lugar_codigo integer,
                u5 text ,
                u6 integer,
                u7 text ,
                u8 integer,
                u9 text ,
                obs text
            )
    ) 
    ,x as(
        select g.* 
                --,u9j.*
                --,replace(replace(replace(value::text, '\\\\\', '\\\'), '\\"', '"'),'\\\b', '\\b') u9elem_sin_escapado
                --, replace(replace(value::text, '\""', '"'),'""','"') u9elem_sin_escapado2
                , value u9elem_json
            from json_enc_carto g
                , jsonb_array_elements(u9_limpio::jsonb) u9j
            where enc_autogenerado_dm is not null
                and resumen_estado is distinct from 'vacio'
                and u9 is not null
                and value?'coords'
            order by 1
)
    select *,(u9elem_json#>>'{coords,accuracy}')::numeric cprecision
        , (u9elem_json#>>'{coords,latitude}')::numeric latitud
        , (u9elem_json#>>'{coords,longitude}')::numeric longitud
        ,to_timestamp((u9elem_json#>>'{timestamp}')::numeric/1000)::timestamp without time zone as cuando 
        from x 
        order by id_caso,(u9elem_json#>>'{timestamp}')::numeric )`

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
            { name: "cuando"       , typeName: "timestamp"}
        ],
        primaryKey: ['id_caso', 'cuando'],
        /*
        foreignKeys: [
            { references: 'recorridos', fields: ['recorrido'], displayAllFields:true},
        ],
        */
        sql:{
            isTable:false,
            from: getSqlFrom()
        }
    };
}
