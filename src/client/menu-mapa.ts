myOwn.wScreens={
    proc:{
        result:{}
    }
}

window.addEventListener('load', function(){
    var tl=document.getElementById('total-layout');
    tl.innerHTML='<div id=main_layout>abriendo...</div>';
    var conRecorrido=false;
    // TODO: sacar el recorrido de la cookie, si no hay recorrido ni token poner "sin recorrido"
    window.location.hash.replace(/^.*recorrido=(\d*)\b/,function(_,recorrido){
        conRecorrido=!!recorrido;
        if(conRecorrido){
            myOwn.wScreens.mapa({fullscreen:true, recorrido});
        }
    })
    if(!conRecorrido){
        tl.innerHTML='<div id=main_layout>sin recorrido</div>';
    }
    myOwn.autoSetup();
});