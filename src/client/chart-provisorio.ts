type Recorrido = {
    recorrido: number;
    pers_dm: number;
    pers_papel: number;
    cues_dm: number;
    cues_papel: number;
}

const buildChart = (modo: 'pers' | 'cues') => async function () {
    const mainLayout = document.getElementById('main_layout')!;

    const canvas = document.createElement('canvas');
    canvas.id = 'chart';
    canvas.style.width = '100%';
    canvas.style.height = '500px';
    mainLayout.appendChild(canvas);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = async () => {
        const Chart = (window as any).Chart;

        const chart = new Chart(document.getElementById('chart'), {
            type: 'bar',
            options: {
                scale: { ticks: { precision: 0 } },
                scales: {
                    y: { stacked: true, },
                    x: { stacked: true, },
                }
            },
        });

        const updateChartData = async () => {
            const rows: Recorrido[] = await my.ajax.table_data({ table: 'provisorio_recorridos' });
            const recorridos: string[] = [];
            const total_dm: number[] = [];
            const total_papel: number[] = [];

            rows.forEach(row => {
                recorridos.push(row.recorrido.toString());
                total_dm.push(modo === 'pers' ? row.pers_dm : row.cues_dm);
                total_papel.push(modo === 'pers' ? row.pers_papel : row.cues_papel);
            });

            chart.data = {
                labels: recorridos,
                datasets: [{
                    label: modo === 'pers' ? 'Personas DM' : 'Cuestionarios DM',
                    data: total_dm,
                },{
                    label: modo === 'pers' ? 'Personas Papel' : 'Cuestionarios Papel',
                    data: total_papel,
                }]
            };
            chart.update('none');
        }

        updateChartData();

        const windowRefresh = window as any;
        if (windowRefresh.currentAutofrefresh) clearInterval(windowRefresh.currentAutofrefresh);
        windowRefresh.currentAutofrefresh = setInterval(() => {
            updateChartData();
        }, 5000);
    }
    mainLayout.appendChild(script);
};

myOwn.wScreens.chart_personas = buildChart('pers');
myOwn.wScreens.chart_cuestionarios = buildChart('cues');