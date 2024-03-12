"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

import {grupo_personas} from "./table-grupo_personas";

export function casos(context:TableContext):TableDefinition {
    var tableDef=grupo_personas(context);
    tableDef.name='casos';
    tableDef.elementName='caso';
    tableDef.editable=false;
    tableDef.detailTables=[];
    tableDef.fields.unshift({ name: "consistir"     , label:'Consistir'             , typeName: 'boolean'   , editable:false, inTable: false, serverSide:true, clientSide:'correrConsistencias',});
    tableDef.fields.unshift({ name: "cambio_estado" , label:'cambiar a'             , typeName: 'jsonb'     , editable:false, inTable: false, serverSide:true, clientSide:'cambiarEstados'     ,}),
    tableDef.sql.isTable=false;
    tableDef.sql.fields.cambio_estado={
        expr:`proximo_estado_posible(operativo, id_caso)`
    };
    tableDef.sql.fields.consistir={
        expr:`(consistido is null or modificado>consistido)`
    };
    return tableDef;
}