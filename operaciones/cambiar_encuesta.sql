--script para pasar encuesta a otra (no intercambia) ej. contenido de 92201 a 93001 y blanqueo de 92201

update tem set json_encuesta = (select json_encuesta from tem where operativo = 'REPSIC_252' and enc = '92201')
where operativo = 'REPSIC_252' and enc = '93001';

update tareas_tem set estado = 'D'
where operativo = 'REPSIC_252' and enc = '93001' and tarea = 'ingr';


update tareas_tem set estado = 'A'
where operativo = 'REPSIC_252' and enc = '92201' and tarea = 'ingr';


update tem set json_encuesta = null
where operativo = 'REPSIC_252' and enc = '92201';

--abrir encuestas y cambiar algun dato (ambas) y guardar para que se calcule nuevamente el resumen estado y demás