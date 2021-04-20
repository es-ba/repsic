"use strict";

import "dialog-promise";

import {html} from "js-to-html";

import * as myOwn from "myOwn";

import * as likeAr from "like-ar";

import {guijarro, Nodo} from "guijarro";

var my = myOwn;

interface AddrParams extends myOwn.AddrParams{
    fullscreen?:boolean
    recorrido?:number
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
        idLayout='map-layout';
        let buttonCambiar=html.button({id:'cambiar'},'cambiar').create();
        var inputRecorrido=html.input({style:'width:40px',id:'recorrido',type:'number',value:addrParams.recorrido||0}).create();
        buttonCambiar.onclick=function(){
            location.href='menu#w=mapa&recorrido='+inputRecorrido.value;
        }
        let buttonInstalar=html.button({id:'instalar'},'instalar').create();
        let divInstalando=html.div().create();
        buttonInstalar.onclick=function(){
            divInstalando.textContent='instalando...';
            AjaxBestPromise.get({
                url:'token/recorrido',
                data:{recorrido:inputRecorrido.value||0}
            }).then(function(){
                location.href='mapa#recorrido='+inputRecorrido.value;
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
                location.href='mapa#recorrido=0';
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
        let hidePointsChecked = localStorage.getItem('hide-points') == 'true';
        let hidePointsCheckBox=html.input({type:'checkbox',id:'hide-points', checked:hidePointsChecked}).create();
        hidePointsCheckBox.onchange=function(){
            localStorage.setItem('hide-points',hidePointsCheckBox.checked.toString());
            let recorrido = inputRecorrido.value || 0
            location.href='menu#w=mapa&recorrido='+ recorrido;
        }
        let animatePointsChecked = localStorage.getItem('animate-points') == 'true';
        let animatePointsCheckBox=html.input({type:'checkbox',id:'animate-points', checked:animatePointsChecked}).create();
        animatePointsCheckBox.onchange=function(){
            localStorage.setItem('animate-points',animatePointsCheckBox.checked.toString());
            let recorrido = inputRecorrido.value || 0
            location.href='menu#w=mapa&recorrido='+ recorrido;
        }
        let barLayout = html.div({class:'bar-layout'},[
            html.div('Recorrido '+addrParams.recorrido),
            html.div([inputRecorrido, buttonCambiar]),
            html.br(),
            html.hr(),
            html.br(),
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
    mapLayout=document.getElementById(idLayout);
    var imgLoading=html.img({class:"main-loading", src: my.path.img+"main-loading.gif"}).create();
    mapLayout.appendChild(imgLoading);
    await loadOpenLayer();
    imgLoading.style.display='none';
    var leaveTrace = addrParams.fullscreen;
    var granularidadPuntos;
    if(addrParams.fullscreen){
        granularidadPuntos = 25;
    }else{
        var parametros = await my.ajax.table_data({
            table:'parametros',
            fixedFields: [{fieldName: 'unico_registro', value:true}]
        });
        parametros = parametros[0];
        granularidadPuntos = (parseInt(inputRecorrido.value) || 0)?parametros['gra_puntos_por_recorrido']:parametros['gra_puntos_todos_recorridos'];
    }
    let mapa = guijarro(idLayout,leaveTrace,null,granularidadPuntos);
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
    if(datosRecorrido.adjuntos){
        datosRecorrido.adjuntos.forEach(function(adjunto){
            var styles:any = {};
            styles['contorno'] = new ol.style.Style({
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
            });
            styles['contorno-adv'] = new ol.style.Style({
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
            });
            styles['exclusion'] = new ol.style.Style({
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
            });
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
                if(transmitirHasta>transmitidoDesde){
                    await my.ajax.subir_puntos({
                        recorrido:addrParams.recorrido||0,
                        puntos:tiraPuntos
                    })
                    transmitidoDesde=transmitirHasta
                }
            },Math.random()*2000)
        },5000)
        var buttonPFun=function(){
            if(mapa.posiciones.length){
                var puntoPedido: number = parseInt((localStorage.getItem('punto-pedido') || 0)) + 1;
                var nodo:Nodo = mapa.posiciones[mapa.posiciones.length-1];
                var buttonSecFun=function(){
                    var cantCuesInput = html.input({id:'cant-cuestionarios', type:'number'}).create();
                    var cantPerInput = html.input({id:'cant-personas', type:'number'}).create();
                    var saveButton={
                        label:'Grabar',
                        attributes:{'save-button':true, 'enter-clicks':true}
                    };
                    Object.defineProperty(saveButton, 'value', { get: function(){ 
                        return {cantCues:cantCuesInput.value, cantPer:cantPerInput.value}; 
                    }});
                    return simpleFormPromise({elementsList:[
                        html.h2('Ingrese cantidades').create(),
                        html.label('Cant. cuestionarios ').create(),
                        cantCuesInput,
                        html.br().create(),
                        html.label('Cant. de personas ').create(),
                        cantPerInput,
                        html.br({}).create(),
                        saveButton,
                        {label:'Cancelar', value:false, attributes:{delete:true, 'enter-clicks':true}}
                    ],reject:false, 
                        withCloseButton: true
                    }).then(function(respuesta){
                        if(respuesta){
                            localStorage.setItem('punto-pedido',puntoPedido.toString());
                            var moreInfo = {
                                punto_pedido: puntoPedido,
                                cant_cues: respuesta.cantCues,
                                cant_personas: respuesta.cantPer
                            }
                            var nuevoNodo = changing(nodo,{timestamp:new Date().getTime(), secuencial: mapa.posiciones.length ,more_info:moreInfo});
                            mapa.addNodo(nuevoNodo);
                        };
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
        let hidePoints = localStorage.getItem('hide-points') == 'true';
        if(!hidePoints){
            let miRecorrido:number = parseInt(inputRecorrido.value)||0;
            var executionSec = 0;
            myOwn.ajax.puntos_traer({recorrido:miRecorrido}, {informProgress: function(received){
                executionSec++;
                var {row}=received; 
                var ultimoNodo:Nodo=null;
                row.puntos.forEach(function(punto:any, i){
                    let nodo:Nodo = {
                        posicion: [punto.p_longitud, punto.p_latitud],
                        coordinates: [punto.c_longitud, punto.c_latitud],
                        timestamp: punto.timestamp
                    }
                    var colocarFun = function colocarFun(){
                        ultimoNodo = mapa.colocarNodo(nodo, ultimoNodo);
                    }
                    let animatePoints = localStorage.getItem('animate-points') == 'true';
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
    // myOwn.autoSetup();
});