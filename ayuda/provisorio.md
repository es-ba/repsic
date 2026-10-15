---
id: provisorio
titulo: Provisorio
orden: 12
permisos: [campo.editar]
menu: [provisorio/provisorio_recorridos, provisorio/provisorio_recepcion]
---
En **provisorio** se ve cómo viene el relevamiento de cada recorrido, antes de que las encuestas pasen a procesamiento. Son cifras de avance: se cuentan cuestionarios y personas, y se separan según vengan del **celular** (dm) o del **papel**.

- **recorridos resumen** (sólo administración): un renglón por recorrido, con los totales de cuestionarios y de personas, los del celular, los de papel y el total. La columna **verif** indica si el recorrido ya fue verificado. Es la vista que alimenta los [gráficos](ayuda:graficos).
- **subcoordinación**: un renglón por área, con quién la relevó (código, nombre y apellido), los cuestionarios y personas del celular y de papel, la hora de salida y de regreso, la verificación y las observaciones.

Los datos del celular se actualizan solos cada vez que sincroniza un dispositivo. Los datos de papel, la verificación, las horas y las observaciones los cargan los usuarios autorizados de coordinación, subcoordinación y recepción.

Si un número no coincide con lo que esperabas, revisá primero que los celulares hayan sincronizado. Las cifras de papel no se actualizan solas: se cargan a mano en la subcoordinación.
