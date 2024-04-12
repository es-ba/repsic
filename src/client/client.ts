import * as formStructure from "rel-enc/dist/client/form-structure";
import {html} from "js-to-html";
import * as myOwn from "myOwn";
import * as TypedControls from "typed-controls";
import {sleep} from "best-globals"

var my = myOwn;

const USAR_GUIONES = true;

function checkIdCasoToGuion(id:string|number){ 
    if(id === null){
        return null
    }
    if(USAR_GUIONES){
        var n = id.toString();
        var corte = n[0] == '9' ? 3 : 2 - n.length % 2; 
        return Number(n.substring(0,corte)) + "-" + Number(n.substring(corte)) 
    }else{
        return Number(id)
    }
}

function checkGuionToIdCaso(idIngresado:string){ 
    if(idIngresado === null){
        return null
    }
    if(USAR_GUIONES){
        var partes = idIngresado.split('-');
        if(partes.length !== 2){
            var mensaje = 'el id caso debe tener la forma "recorrido-numero".';
            alertPromise(mensaje);
            throw Error(mensaje);
        }
        partes[1] = partes[1].length % 2 == 1?'0'.concat(partes[1]):partes[1];
        var nuevoId = partes[0].concat(partes[1]);
        return  nuevoId
    }else{
        return idIngresado
    }
}
myOwn.clientSides.parseIDPapel={
    update:function(_depot:myOwn.Depot, _fieldName:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var idCaso = depot.row['id_caso'] || depot.row['enc'];
        var idCasoPapel = checkIdCasoToGuion(idCaso)
        depot.rowControls[fieldName].setTypedValue(idCasoPapel);
    }
}

myOwn.clientSides.generarRelevamiento={
    update:function(depot:myOwn.Depot, fieldName:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var my=myOwn;
        let td=depot.rowControls[fieldName];
        const TEXTO_INICIAL_BOTON = "generar";
        let boton = html.button(TEXTO_INICIAL_BOTON).create();
        td.buttonGenerar=boton;
        td.innerHTML="";
        td.appendChild(boton);
        boton.onclick=async function(){
            boton.textContent='generando'
            boton.disabled=true;
            try{
                await my.ajax.generar_formularios({
                    recorrido:depot.row.recorrido,
                    cant_encuestas: depot.row.cant_cues
                });
                boton.textContent='ok'
                await sleep(2000);
            }catch(err){
                alertPromise(err.message)
                throw err;
            }finally{
                boton.disabled=false;
                boton.textContent=TEXTO_INICIAL_BOTON
            }
        }
    }
}