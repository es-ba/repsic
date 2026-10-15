---
id: recorridos
titulo: Recorridos
orden: 40
permisos: [campo.administrar]
menu: [carto/recorridos, carto/recorridos_barrios, carto/tipos_recorrido, carto/lugares, carto/tipos_lugar, carto/materiales, varios/area_agregar]
---
Un **recorrido** es una ruta de trabajo del relevamiento. Cada uno tiene un número, un **tipo** (por ejemplo, entero o partido), el nombre y la dirección del parador, y las observaciones. La **comuna** del recorrido y su descripción de barrio se calculan solos a partir de los barrios y lugares cargados.

En **carto → recorridos** se ven todos los recorridos. Al desplegar uno aparecen sus solapas:

- **barrios**: los barrios que cubre el recorrido.
- **lugares**: los paradores y otros lugares del recorrido, cada uno con su tipo.
- **adjuntos**: los archivos de cartografía del recorrido. Cada archivo tiene una categoría y un estilo, que define cómo se dibuja en el [mapa](ayuda:mapa).

Otras opciones de la misma carpeta:

- **recorridos barrios**: la lista de barrios por recorrido, para revisar todo junto.
- **tipos de recorrido** y **tipos de lugar**: las categorías que después se eligen al cargar recorridos y lugares.
- **materiales**: los archivos de cartografía y sus categorías, en un solo lugar.

Para agregar un área a un recorrido, usá **varios → agregar area a un recorrido**. El área queda asociada al recorrido y se ve en el [provisorio](ayuda:provisorio).

Sólo el administrador puede cambiar los recorridos y sus datos. Los cambios se ven en el mapa y en el provisorio en cuanto se guardan.
