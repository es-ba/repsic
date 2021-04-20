"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function adjunto_categoria(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'adjunto_categoria',
        editable:admin,
        fields:[
            {name:'id_adjunto' , typeName:'integer'   , visible:false },
            {name:'categoria'  , typeName:'text'      },
        ],
        primaryKey:['id_adjunto','categoria'],
        foreignKeys:[
            {references:'categorias_adjuntos', fields:['categoria' ], onDelete:'cascade'},
            {references:'adjuntos'           , fields:['id_adjunto']},
        ]
    };
}

