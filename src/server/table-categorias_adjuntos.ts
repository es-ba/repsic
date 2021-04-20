"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function categorias_adjuntos(context:TableContext):TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name:'categorias_adjuntos',
        elementName:'categoria de adjuntos',
        editable:admin,
        fields:[
            {name:'categoria'       , typeName:'text'   },
            {name:'descripcion'     , typeName:'text'   },
        ],
        primaryKey:['categoria'],
        detailTables:[
            {table:'adjunto_categoria' , fields:['categoria'], abr:'A', title:'Archivos'},
        ],
    };
}

