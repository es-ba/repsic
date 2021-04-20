// hacer que la app se active para refresh
function elemento_existente(id){
    return document.getElementById(id);
}

function controlOffLine(){
    window.applicationCache.addEventListener('updateready', function(e) {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
            window.applicationCache.swapCache();
            confirmPromise('Hay una nueva versión, se actualizará ahora').then(function(){
                window.location.reload();
            });
        }
    }, false);
    window.applicationCache.addEventListener('error', function(e) {
        if(window.applicationCache.status!=1){
            var texto=document.createElement('div');
            texto.innerText='procediendo';
            main_layout.appendChild(texto);
        }
    }, false);
    mostrar_como_cachea();
}
    
    
function mostrar_como_cachea(){
    window.applicationCache.addEventListener('cached', function(e) {
        var texto=document.createElement('div');
        texto.innerText='Sistema cargado!';
        elemento_existente('main_layout').appendChild(texto);
    }, false);
    var cacheStatusValues = [];
    cacheStatusValues[0] = 'uncached';
    cacheStatusValues[1] = 'idle';
    cacheStatusValues[2] = 'checking';
    cacheStatusValues[3] = 'downloading';
    cacheStatusValues[4] = 'updateready';
    cacheStatusValues[5] = 'obsolete';
    var cachear={
        checking:{},
        downloading:{},
        error:{},
        noupdate:{},
        obsolete:{},
        progress:{},
        updateready:{},
    }
    for(var que_cachear in cachear){
        var message_ant;
        var texto;
        window.applicationCache.addEventListener(que_cachear, function(event) {
            var online, status, type, message;
            online = (navigator.onLine) ? 'sí' : 'no';
            status = cacheStatusValues[window.applicationCache.status];
            type = event.type;
            message = 'online: ' + online;
            message+= ', evento: ' + type;
            message+= ', estado: ' + status;
            var message_ok = 'online: sí, evento: progress, estado: downloading';
            if(message!==message_ok || message_ant!==message_ok || !texto){
                texto=document.createElement('div');
                elemento_existente('main_layout').appendChild(texto);
            }
            message_ant=message;
            if (type == 'error' && navigator.onLine) {
                message+= ' (!!)';
            }
            if(type=='progress'){
                message+=' '+event.loaded+'/'+event.total;
            }
            texto.className='log_manifest';
            texto.innerText=message;
            if(type!='progress'){
                var texto2=document.createElement('span');
                texto2.className='mensaje_alerta';
                texto2.textContent=' '+(event.message||event.url||'!');
                texto.appendChild(texto2);
            }
        }, false);
    }
}
    
