"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function dictra(context:TableContext):TableDefinition {
    var permitidoeditar = context.user.rol === 'admin'/*||context.puede.diccionarios.editar*/;
    return {
        name: 'dictra',
        elementName: 'dictra',
        editable: permitidoeditar,
        fields: [
            { name: "diccionario"    , typeName: "text"     , nullable:false  },
            { name: "origen"         , typeName: "text"     , nullable:false  },
            { name: "destino"        , typeName: "integer"                    },
            { name: "dictra_texto"   , typeName: "text"                       },
        ], 
        primaryKey: ['diccionario', 'origen'],
        foreignKeys:[
            {references:'diccionario'    , fields: [{source:'diccionario',target:'diccionario'}],displayFields:[]},
        ],
        /*
        constraints:[
            {   
                constraintType:'check', 
                consName:'texto de diccionario inválido', 
                expr:"(comun.cadena_valida(dictra_texto::text, 'castellano'::text)),"
            },
            {   
                constraintType:'check', 
                consName:'texto invalido en origen de tabla dictra', 
                expr:"(comun.cadena_valida(origen, 'castellano'::text)),"
            },
        ]
       */
    };
}