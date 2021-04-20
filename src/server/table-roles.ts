"use strict";

import {TableDefinition, TableContext} from "./types-repsic";

export function roles(context:TableContext):TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name:'roles',
        elementName:'role',
        editable:admin,
        fields:[
            {name:'rol'             , typeName:'text'      , nullable:false  , defaultValue: false},
            {name:'superuser'       , typeName:'boolean'   , nullable:false  , defaultValue: false},
        ],
        primaryKey:['rol'],
        detailTables:[
            {table:'roles_permisos'     , fields:['rol'], abr:'R', title:'Permisos para el rol'},
            {table:'usuarios'           , fields:['rol'], abr:'U'},
            {table:'estados_roles'      , fields:['rol'], abr:'E'}
        ],
    };
}

