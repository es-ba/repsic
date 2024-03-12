"use strict";

import "dialog-promise";

import {html} from "js-to-html";

import * as myOwn from "myOwn";

var my = myOwn;

myOwn.clientSides.subirAdjunto = {
    prepare: function(depot:myOwn.Depot, fieldName:string){
        var boton = html.button('Cargar archivo').create();
        depot.rowControls[fieldName].appendChild(boton);
        boton.addEventListener('click', function(){
            var showWithMiniMenu = false;
            var messages = {
                importDataFromFile: 'Seleccione un archivo',
                import: 'Cargar'
            };
            my.dialogUpload(
                ['upload_file'], 
                {
                    id_adjunto: depot.row.id_adjunto?depot.row.id_adjunto:null,
                    nombre: depot.row.nombre?depot.row.nombre:null
                },
                function(result:any){
                    depot.rowControls.nombre.setTypedValue(result.nombre);
                    depot.rowControls.nombre_original.setTypedValue(result.nombre_original);
                    depot.rowControls.ext.setTypedValue(result.ext);
                    depot.rowControls.fecha.setTypedValue(result.fecha);
                    depot.rowControls.hora.setTypedValue(result.hora);
                    return result.message;
                },
                showWithMiniMenu,
                messages
            )    
        });
        return boton;  
    }
}

myOwn.clientSides.bajarAdjunto = {
    update:function(depot:myOwn.Depot, fieldName:string):void{
        let td=depot.rowControls[fieldName];
        td.style.visibility=depot.row.fecha?'visible':'hidden';
    },
    prepare:function(depot:myOwn.Depot, fieldName:string):void{
        let td=depot.rowControls[fieldName];
        let fileName=depot.row.nombre+'.'+depot.row.ext;
        let bajar = html.a({href:'file?id_adjunto='+depot.row.id_adjunto, download:fileName},"bajar").create();
        td.appendChild(bajar);
    }
}
