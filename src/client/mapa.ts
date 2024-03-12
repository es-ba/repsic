"use strict";

import "dialog-promise";

import {html} from "js-to-html";

import * as myOwn from "myOwn";

import {coalesce, changing} from "best-globals";

import {guijarro, Nodo, GuijarroOpts} from "guijarro";

var my = myOwn;

interface AddrParams extends myOwn.AddrParams{
    fullscreen?:boolean
    recorrido?:number
    position?:string
    zoom?:number
}

var loadOpenLayer=function(){
    const ID_OPENLAYER_SCRIPT='id-script-ol';
    return new Promise(function(resolve, reject){
        if(document.getElementById(ID_OPENLAYER_SCRIPT)){
            resolve(true);
        }else{
            var script=document.createElement('script');
            script.id=ID_OPENLAYER_SCRIPT;
            script.src='https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js'
            script.onload=resolve;
            script.onerror=function(event:Event|UIEvent|ErrorEvent){
                if('error' in event){
                    reject(event.error);
                }else{
                    reject(event);
                }
            };
            document.body.appendChild(script);
        }
    });
}

myOwn.wScreens.mapa = async function(addrParams:AddrParams){
    var idLayout;
    let layout = document.getElementById('main_layout');
    layout.style.margin='0px';
    layout.innerHTML="";
    var mapLayout;
    if(addrParams.fullscreen){
        idLayout = 'total-layout';
        layout = document.getElementById('total-layout');
        layout.style.height='100%';
    }else{
        var recorridosArr:{recorrido:number}[] = await myOwn.ajax.recorridos_controlables({});
        var indiceRecorridoActual = recorridosArr.findIndex((rec)=>rec.recorrido == addrParams.recorrido || 0);
        idLayout='map-layout';
        let buttonCambiar=html.button({id:'cambiar'},'cambiar').create();
        var inputRecorrido=html.input({style:'width:40px',id:'recorrido',type:'number',value:addrParams.recorrido||0}).create();
        var refreshMap = function refreshMap(keepPositionAndZoom: boolean){
            if(keepPositionAndZoom){
                location.href='menu#w=mapa&recorrido='+inputRecorrido.value+"&position="+JSON.stringify(mapa.getCenter())+"&zoom="+mapa.getZoom();
            }else{
                location.href='menu#w=mapa&recorrido='+inputRecorrido.value;
            }
        }
        buttonCambiar.onclick=function(){
            refreshMap(true);
        }
        var seleccionRecorrido = (indexSum:1|-1)=>{
            inputRecorrido.value = recorridosArr[indiceRecorridoActual+indexSum]?
                recorridosArr[indiceRecorridoActual+indexSum].recorrido.toString()
            :
                (indexSum==-1?
                    recorridosArr[recorridosArr.length-1].recorrido.toString()
                :'0')
            refreshMap(true);
        }
        let buttonAnteriorRecorrido=html.button({id:'cambiar'},'<').create();
        let buttonSiguienteRecorrido=html.button({id:'cambiar'},'>').create();
        buttonAnteriorRecorrido.onclick=function(){
            seleccionRecorrido(-1);
        }
        buttonSiguienteRecorrido.onclick=function(){
            seleccionRecorrido(1);
        }
        let buttonInstalar=html.button({id:'instalar'},'instalar').create();
        let divInstalando=html.div().create();
        buttonInstalar.onclick=function(){
            divInstalando.textContent='instalando...';
            AjaxBestPromise.get({
                url:'token/recorrido',
                data:{recorrido:inputRecorrido.value||0}
            }).then(function(){
                location.href='mapa';
            }).catch(function(err:Error){
                divInstalando.textContent=err.message;
            });
        }
        let buttonNoToken=html.button({id:'no-token'},'No Token').create();
        buttonNoToken.onclick=function(){
            divInstalando.textContent='instalando...';
            AjaxBestPromise.get({
                url:'token/limpiar',
                data:{}
            }).then(function(){
                location.href='mapa';
            }).catch(function(err:Error){
                divInstalando.textContent=err.message;
            });
        }
        let buttonProbarGPS=html.button({id:'GPS'},'GPS').create();
        let divProbarGPS=html.div().create();
        buttonProbarGPS.onclick=function(){
            divProbarGPS.textContent='buscando...';
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    divProbarGPS.textContent='punto GPS:';
                    console.log(position);
                    divProbarGPS.appendChild(html.table([
                        html.tr([html.td('lat'), html.td(position.coords.latitude+'°')]),
                        html.tr([html.td('long'), html.td(position.coords.longitude+'°')]),
                        html.tr([html.td('accy'), html.td(position.coords.accuracy+'')]),
                    ]).create());
                },function(error) {
                    var errores=[
                       'unknown error',
                       'permission denied',
                       'position unavailable',
                       'timed out',
                    ]
                    divProbarGPS.textContent='Error: ' + error.code;
                    divProbarGPS.textContent+=' '+(errores[error.code]||null);
                });
                divProbarGPS.textContent='sin soporte GPS';
            } else {
                divProbarGPS.textContent='sin soporte GPS';
            }
        }
        let resetMapButton=html.button({id:'center-map-button'},'Centrar').create();
        resetMapButton.onclick=function(){
            refreshMap(false);
        }
        let hidePointsChecked = my.getLocalVar('hide-points') == 'true';
        let hidePointsCheckBox=html.input({type:'checkbox',id:'hide-points', checked:hidePointsChecked}).create();
        hidePointsCheckBox.onchange=function(){
            my.setLocalVar('hide-points',hidePointsCheckBox.checked.toString());
            refreshMap(true);
        }
        let animatePointsChecked = my.getLocalVar('animate-points') == 'true';
        let animatePointsCheckBox=html.input({type:'checkbox',id:'animate-points', checked:animatePointsChecked}).create();
        animatePointsCheckBox.onchange=function(){
            my.setLocalVar('animate-points',animatePointsCheckBox.checked.toString());
            refreshMap(true);
        }
        let barLayout = html.div({class:'bar-layout'},[
            html.div('Recorrido '+addrParams.recorrido),
            html.div([inputRecorrido, buttonCambiar]),
            html.div([buttonAnteriorRecorrido, buttonSiguienteRecorrido]),
            html.br(),
            html.hr(),
            html.br(),
            html.div([
                resetMapButton,
            ]),
            html.div([
                html.label({for:'hide-points'},'ocultar puntos'),
                hidePointsCheckBox,
            ]),
            html.div([
                html.label({for:'animate-points'},'animar recorrido/s'),
                animatePointsCheckBox,
            ]),
            html.div([
                buttonNoToken,
            ]),
            html.div([
                buttonInstalar,
            ]),
            divInstalando,
            html.div([
                buttonProbarGPS,
            ]),
            divProbarGPS,
        ]).create();
        mapLayout = html.div({id:idLayout}).create();
        layout.appendChild(barLayout);
        layout.appendChild(mapLayout);
    }
    //TODO backend-plus para que setup se prefije
    let isTestEnvironment = JSON.parse(localStorage.getItem('setup')).config['test-environment']
    mapLayout=document.getElementById(idLayout);
    mapLayout.setAttribute('mapa-test', isTestEnvironment?'si':'no');
    if(isTestEnvironment){
        mapLayout!.appendChild(html.div({id:'cartel-test'}, 'TEST').create());
    }
    var imgLoading=html.img({class:"main-loading", src: my.path.img+"main-loading.gif"}).create();
    mapLayout.appendChild(imgLoading);
    await loadOpenLayer();
    imgLoading.style.display='none';
    var leaveTrace = addrParams.fullscreen;
    var granularidadPuntos;
    if(addrParams.fullscreen){
        granularidadPuntos = 10;
    }else{
        window.onbeforeunload = function(e) {
            my.setSessionVar('zoom', mapa.getZoom());
            my.setSessionVar('position', mapa.getCenter());
          };
        var parametros = await my.ajax.table_data({
            table:'parametros',
            fixedFields: [{fieldName: 'unico_registro', value:true}]
        });
        parametros = parametros[0];
        granularidadPuntos = (parseInt(inputRecorrido.value) || 0)?parametros['gra_puntos_por_recorrido']:parametros['gra_puntos_todos_recorridos'];
    }
    let myPosition=coalesce(my.getSessionVar('position'),JSON.parse(addrParams.position||null));
    let myZoom=coalesce(my.getSessionVar('zoom'),addrParams.zoom,null);
    my.removeSessionVar('position');
    my.removeSessionVar('zoom');
    var opts: GuijarroOpts = {
        epsilonShow:granularidadPuntos,
        storePointsFunctions:{
            get:async (storageKey:string)=>my.getLocalVar(storageKey),
            set:async (storageKey:string, posiciones:Nodo[])=>my.setLocalVar(storageKey,posiciones)
        }
    }
    if(myPosition){
        opts.centerZone=myPosition;
    }
    if(myZoom){
        opts.currentZoom=myZoom;
    }
    let mapa = await guijarro(idLayout,leaveTrace,opts);
    function recorrido(addrParams:AddrParams){
        return AjaxBestPromise.get({
            url:'datos/recorrido',
            data:{recorrido:addrParams.recorrido||0}
        }).then(function(resultJson:string){
            return JSON.parse(resultJson);
        })
    }
    let datosRecorrido= await recorrido(addrParams);
    if(datosRecorrido.lugares){
        datosRecorrido.lugares.forEach(function(lugar){
            mapa.addMark(lugar.latitud, lugar.longitud, lugar.tipo_lugar_descripcion[0], lugar.lugar);
        });
    }
    const styles={
        ['contorno']: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(239, 172, 44, 0.3)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(239, 172, 44, 0.6)',
                width: 6
            }),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            })
        }),
        ['contorno-adv']: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.8)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(242, 226, 91, 0.6)',
                width: 6
            }),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            })
        }),
        ['exclusion']: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(100, 100, 150, 0.5)'
            }),
            stroke: new ol.style.Stroke({
                color: '#FF0000',
                width: 2
            }),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            })
        })
    }
    if(datosRecorrido.adjuntos){
        datosRecorrido.adjuntos.forEach(function(adjunto){
            var style = styles[adjunto.estilo] || null;
            mapa.addLayer('file?id_adjunto='+adjunto.id_adjunto,style)
        });
    }
    var transmitidoDesde=0;
    if(addrParams.fullscreen){
        setInterval(function(){
            setTimeout(async function(){
                let transmitirHasta=mapa.posiciones.length;
                let tiraPuntos=mapa.posiciones.slice(transmitidoDesde,transmitirHasta).map(function(nodo: Nodo, i){
                    return {
                        p_latitud :nodo.posicion[1],
                        p_longitud:nodo.posicion[0],
                        c_latitud :nodo.coordinates[1],
                        c_longitud:nodo.coordinates[0],
                        timestamp :nodo.timestamp,
                        more_info: nodo.more_info || null,
                        secuencial:transmitidoDesde+i
                    }
                })
                if(transmitirHasta>transmitidoDesde && Number(addrParams.recorrido)>0){
                    await my.ajax.subir_puntos({
                        recorrido:addrParams.recorrido,
                        puntos:tiraPuntos
                    })
                    transmitidoDesde=transmitirHasta
                }
            },Math.random()*2000)
        },5000)
        var buttonPFun=function(){
            if(mapa.posiciones.length){
                var puntoPedido: number = parseInt((my.getLocalVar('punto-pedido') || 0)) + 1;
                var nodo:Nodo = mapa.posiciones[mapa.posiciones.length-1];
                var buttonSecFun=function(){
                    var cantCuesInput = html.input({id:'cant-cuestionarios', type:'number'}).create();
                    var cantPerInput = html.input({id:'cant-personas', type:'number'}).create();
                    var obsInput = html.input({id:'observaciones', type:'text'}).create();
                    var saveButton={
                        label:'guardar',
                        attributes:{id:'save-button','save-button':true, 'enter-clicks':true}
                    };
                    Object.defineProperty(saveButton, 'value', { get: function(){ 
                        return {cantCues:cantCuesInput.value, cantPer:cantPerInput.value, obs: obsInput.value}; 
                    }});
                    return simpleFormPromise({
                        elementsList:[
                            html.h1('información del punto').create(),
                            html.label({for:'cant-cuestionarios', id:'cant-cuestionarios-label'},'cant. cuestionarios ').create(),
                            cantCuesInput,
                            html.br().create(),
                            html.label({for:'cant-personas', id:'cant-personas-label'},'cant. de personas ').create(),
                            cantPerInput,
                            html.br({}).create(),
                            html.label({for:'observaciones', id:'obs-label'},'obsevaciones ').create(),
                            obsInput,
                            html.br({}).create(),
                            saveButton,
                            {label:'cancelar', value:false, attributes:{id: 'cancel-button', delete:true, 'enter-clicks':true}}
                        ],
                        reject:false, 
                        withCloseButton: true
                    }).then(function(respuesta){
                        my.setLocalVar('punto-pedido',puntoPedido.toString());
                        var moreInfo = {
                            punto_pedido: puntoPedido,
                            cant_cues: respuesta.cantCues,
                            cant_personas: respuesta.cantPer,
                            observaciones: respuesta.obs
                        }
                        var nuevoNodo = changing(nodo,{timestamp:new Date().getTime(), secuencial: mapa.posiciones.length ,more_info:moreInfo});
                        mapa.colocarNodo(nuevoNodo, null)
                        mapa.addNodo(nuevoNodo);
                    })
                }
                var borrarPedidosDePuntosFun = function(){
                    Array.prototype.slice.call(document.querySelectorAll('.ubicate-control-sec')).forEach(function(element:HTMLDivElement){
                        element.style.display = 'none';
                    })
                }
                borrarPedidosDePuntosFun();
                mapa.addButton({letter:'#'+puntoPedido, position:'current' , zoom:null  , handler:buttonSecFun, classSufix:'sec', withTouchStartEvent:false});
                setTimeout(function(){
                    borrarPedidosDePuntosFun();                    
                }, 10000);
            }else{
                alertPromise('Ubicación aún no disponible, espere un momento e intente nuevamente. ');
            }
        }
        mapa.addButton({letter:'P', position:'current' , zoom:null  , handler:buttonPFun});
    }else{
        let hidePoints = my.getLocalVar('hide-points') == 'true';
        if(!hidePoints){
            let miRecorrido:number = parseInt(inputRecorrido.value)||0;
            var executionSec = 0;
            var lastTimestamp:number|null = null;
            var traerPuntos = async ()=>{
                await myOwn.ajax.puntos_traer({recorrido:miRecorrido, timestamp_desde:lastTimestamp}, {informProgress: function(received){
                    executionSec++;
                    var {row}=received; 
                    //lastTimestamp=row.start;
                    var ultimoNodo:Nodo=null;
                    row.puntos.forEach(function(punto:any, i){
                        let nodo:Nodo = {
                            posicion: [punto.p_longitud, punto.p_latitud],
                            coordinates: [punto.c_longitud, punto.c_latitud],
                            timestamp: punto.timestamp,
                            more_info: punto.more_info
                        }
                        var colocarFun = function colocarFun(){
                            ultimoNodo = mapa.colocarNodo(nodo, ultimoNodo);
                        }
                        let animatePoints = my.getLocalVar('animate-points') == 'true';
                        if(animatePoints){
                            setTimeout(function(){
                                colocarFun();
                            },parametros['velocidad_animacion_puntos_ms'] * executionSec);
                        }else{
                            colocarFun();
                        }
                    })
                }});
            }
            await traerPuntos();
            //chequea cada 30 segundos si hay puntos nuevos
            //setInterval(traerPuntos,30*1000)
        }
    }
}

myOwn.clientSides.openMap = {
    update:function(depot:myOwn.Depot, fieldName:string):void{
    },
    prepare:function(depot:myOwn.Depot, fieldName:string):void{
        let td=depot.rowControls[fieldName];
        // let ver = html.a({href:'menu?w=mapa&recorrido='+depot.row.recorrido},depot.row[fieldName]).create();
        let ver = my.createForkeableButton({w:'mapa',recorrido:depot.row.recorrido.toString(),"class":'table-button'}, depot.row[fieldName]);
        td.innerHTML="";
        td.appendChild(ver);
    }
}

window.addEventListener('load',function(){
    console.log(myOwn);
    myOwn.autoSetup();
    var newHash;
    if(!location.hash){
        newHash=my.getSessionVar('backend-plus-hash-redirect');
        my.removeSessionVar('backend-plus-hash-redirect');
        if(newHash){
            // alert(location.origin+location.pathname+location.search+newHash)
            history.replaceState(null, null, location.origin+location.pathname+location.search+newHash);
        }
    }
});