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
                await my.ajax.generar_formularios_papel({
                    area: depot.row.area,
                    cant_encuestas: depot.row.cant_cues_definitivo
                });
                boton.textContent='ok'
            }catch(err){
                alertPromise(err.message)
                throw err;
            }finally{
                depot.manager.retrieveRowAndRefresh(depot)
                await sleep(2000);
                boton.disabled=false;
                boton.textContent=TEXTO_INICIAL_BOTON
            }
        }
    }
}

myOwn.clientSides.consistir = {
    prepare: function (depot: myOwn.Depot, fieldName: string) {
        var td = depot.rowControls[fieldName];
        var boton = html.button('consistir').create();
        td.innerHTML = "";
        td.appendChild(boton);
        var restaurarBoton = function () {
            boton.disabled = false;
            boton.textContent = "consistir";
            boton.style.backgroundColor = '';
        }

        boton.onclick = function () {
            boton.disabled = true;
            boton.textContent = 'procesando...';
            return myOwn.ajax.consistir_encuesta({
                operativo: depot.row.operativo,
                id_caso: depot.row.enc
            }).then(async function(result){
                if(result && typeof result === 'object' && 'ok' in result){
                    if(result.ok){
                        var grid=depot.manager;
                        await grid.retrieveRowAndRefresh(depot);
                        if (depot.detailControls.inconsistencias){
                            depot.detailControls.inconsistencias.forceDisplayDetailGrid({});
                        }  
                        boton.textContent =  result.message;
                        boton.title = result;
                        boton.style.backgroundColor = '#8F8';
                    }else{
                        throw new Error(result.message);
                    }
                }
                setTimeout(restaurarBoton, 2500);
            }, function (err) {
                boton.textContent = 'error';
                boton.style.backgroundColor = '#FF8';
                alertPromise(err.message);
            })
        }
        //if ((depot.row.consistido==null  && depot.row.rea!=null) || depot.row.modificado!=null && depot.row.consistido!=null && depot.row.modificado >depot.row.consistido){
        //    boton.style.backgroundColor='#8CF'
        //}
    }      
}

myOwn.clientSides.borrarEncuesta = {
    update:function(_depot:myOwn.Depot, _fieldname:string){
    },
    prepare:function(depot:myOwn.Depot, fieldName:string){
        var my=myOwn;
        var up = {
            operativo:depot.row.operativo,
            enc:depot.row.enc
        }
        let td=depot.rowControls[fieldName];
        const TEXTO_INICIAL_BOTON = 'borrar encuesta';
        let boton = html.button(TEXTO_INICIAL_BOTON).create();
        td.buttonGenerar=boton;
        td.innerHTML="";
        td.appendChild(boton);
        boton.onclick=async function(){
            boton.disabled=true;
            try{
                history.replaceState(null, '', `${location.origin+location.pathname}/../menu#menuType=proc&name=encuesta_borrar_previsualizar&i=varios,encuesta_borrar_previsualizar&up=${JSON.stringify(up)}`);
                location.reload();   
            }catch(err){
                alertPromise(err.message)
                throw err;
            }finally{
                depot.manager.retrieveRowAndRefresh(depot)
                await sleep(2000);
                boton.disabled=false;
                boton.textContent=TEXTO_INICIAL_BOTON
            }
        }
    }
}