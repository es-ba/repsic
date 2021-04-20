"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function adjuntos(context:TableContext):TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name:'adjuntos',
        elementName:'archivo',
        editable:admin,
        fields:[
            {name:'id_adjunto'      , typeName:'integer'   , visible:false  , nullable:true, sequence:{name:'adjunto_seq'}},
            {name:'nombre'          , typeName:'text'      , nullable:false , isName:true  },
            {name:'nombre_original' , typeName:'text'      , editable:false                },
            {name:'ext'             , typeName:'text'      , editable:false , isName:true  },
            {name:'ruta'            , typeName:'text'      , visible:false  },
            {name:'subir'           , typeName:'text'      , editable:false, clientSide:'subirAdjunto'},
            {name:'bajar'           , typeName:'text'      , editable:false, clientSide:'bajarAdjunto'},
            {name:'fecha'           , typeName:'date'      , editable:false },
            {name:'hora'            , typeName:'interval'  , editable:false , timeUnit:'hours'},
            {name:'recorrido'       , typeName:'integer'   },
            {name:'estilo'          , typeName:'text'     },
        ],
        primaryKey:['id_adjunto'],
        foreignKeys:[
            { references: 'recorridos'   , fields: ['recorrido'], displayFields:[] },
        ],
        constraints:[
            {constraintType:'unique', fields:['nombre', 'ext']},
        ],
        detailTables:[
            {table:'adjunto_categoria' , fields:['id_adjunto'], abr:'C', title:'Categorías del adjunto'},
        ],
    };
};

