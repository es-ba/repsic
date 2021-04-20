"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function recorridos_puntos(context:TableContext):TableDefinition {
    var admin=context.user.rol==='admin';
    return {
        name:'recorridos_puntos',
        elementName:'punto del recorrido',
        allow:{insert:true},
        editable:false,
        fields:[
            {name:"recorrido"             , typeName:'integer'                      },
            {name:"session"               , typeName:'text'                         },
            {name:"secuencial"            , typeName:'integer'                      },
            {name:"p_latitud"             , typeName:'decimal'                      },
            {name:"p_longitud"            , typeName:'decimal'                      },
            {name:"timestamp"             , typeName:'bigint'                       },
            {name:"c_latitud"             , typeName:'decimal'                      },
            {name:"c_longitud"            , typeName:'decimal'                      },
            {name:"id_punto"              , typeName:'bigint', sequence:{name:'punto_seq', firstValue:1}},
            {name:"more_info"             , typeName:'jsonb'                        }
        ],
        // primaryKey:['recorrido','session','secuencial'],
        primaryKey:['recorrido','session','secuencial','id_punto'],
        foreignKeys:[
            {references:'recorridos', fields:['recorrido']},
        ],
    };
}
