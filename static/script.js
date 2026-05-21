const G = 9.8;
const L = 10;
const PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let alpha = 6;
let a = 0, tMax = 0;
let tFull = [], sFull = [], vFull = [];
let times = [], speeds = [], accels = [];
let animId = null, expTime = 0, expRun = false, expIdx = 0;
let sx, sy, ex, ey, railLen;
let chartST, chartVT, chartAT;

const API_URL = '/api/calculate';

async function calculateOnServer() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alpha: alpha })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }
        
        const data = await response.json();
        
        a = data.a;
        tMax = data.t_max;
        tFull = data.t_full;
        sFull = data.s_full;
        vFull = data.v_full;
        times = data.times;
        speeds = data.speeds;
        accels = data.accels;
        
        updateTable(-1);
        updateCharts();
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        alert('Ошибка подключения к серверу: ' + error.message);
        return null;
    }
}

function updateTable(highlightIdx = -1) {
    let timeHtml = '<td><strong>Время t,с</strong></td>';
    let speedHtml = '<td><strong>Скорость v,м/с</strong></td>';
    let accelHtml = '<td><strong>Ускорение a,м/с²</strong></td>';
    
    for (let i = 0; i < 10; i++) {
        if (i < times.length) {
            const highlight = highlightIdx === i ? ' style="color:#ea580c;font-weight:700"' : '';
            timeHtml += `<td${highlight}>${times[i].toFixed(2)}</td>`;
            speedHtml += `<td${highlight}>${speeds[i].toFixed(2)}</td>`;
            accelHtml += `<td${highlight}>${accels[i].toFixed(4)}</td>`;
        } else {
            timeHtml += '<td>---</td>';
            speedHtml += '<td>---</td>';
            accelHtml += '<td>---</td>';
        }
    }
    
    document.getElementById('rowTime').innerHTML = timeHtml;
    document.getElementById('rowSpeed').innerHTML = speedHtml;
    document.getElementById('rowAccel').innerHTML = accelHtml;
}

const canvas = document.getElementById('schemeCanvas');
const ctx = canvas.getContext('2d');

function drawScheme() {
    const W = canvas.width, H = canvas.height;
    const rad = alpha * Math.PI / 180;
    railLen = Math.min(W - 120, 380);
    
    ctx.clearRect(0, 0, W, H);
    
    sx = 60;
    sy = 50;
    ex = sx + railLen * Math.cos(rad);
    ey = sy + railLen * Math.sin(rad);
    
    // Жёлоб
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(ex, ey - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy + 4);
    ctx.lineTo(ex, ey + 4);
    ctx.stroke();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    // Деления
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = sx + railLen * t * Math.cos(rad);
        const y = sy + railLen * t * Math.sin(rad);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i, x, y - 14);
    }
    
    // Упор
    ctx.fillStyle = '#888';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('УПОР', ex, ey - 20);
    
    // Подписи
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('0', sx - 10, sy + 4);
    ctx.textAlign = 'left';
    ctx.fillText(L + ' м', ex + 15, ey + 4);
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Жёлоб (α=${alpha.toFixed(1)}°, L=${L}м)`, sx + railLen / 2, sy - 25);
    
    // Подставка
    ctx.fillStyle = '#999';
    ctx.fillRect(25, sy + 25, 20, ey - 40);
    ctx.fillRect(10, ey - 20, 50, 15);
}

function drawBall(x, y) {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
}

function redraw() {
    drawScheme();
    if (window.currentBallX !== undefined && window.currentBallY !== undefined) {
        drawBall(window.currentBallX, window.currentBallY);
    } else {
        drawBall(sx, sy);
    }
}

async function startExperiment() {
    if (expRun) return;
    await calculateOnServer();
    expTime = 0;
    expIdx = 0;
    expRun = true;
    updateTable(-1);
    animate();
}

function animate() {
    if (!expRun) return;
    
    if (expTime <= tMax) {
        let s = 0.5 * a * expTime * expTime;
        if (s > L) s = L;
        const v = a * expTime;
        const t = Math.min(s / L, 1);
        const rad = alpha * Math.PI / 180;
        
        window.currentBallX = sx + railLen * t * Math.cos(rad);
        window.currentBallY = sy + railLen * t * Math.sin(rad);
        redraw();
        
        document.getElementById('infoTime').textContent = 't=' + expTime.toFixed(2) + 'с';
        document.getElementById('infoPath').textContent = 's=' + s.toFixed(2) + 'м';
        document.getElementById('infoSpeed').textContent = 'v=' + v.toFixed(2) + 'м/с';
        
        for (let i = expIdx; i < PATHS.length; i++) {
            if (s >= PATHS[i] - 0.05) {
                expIdx = i + 1;
                updateTable(i);
            }
        }
        
        expTime += 0.03;
        animId = requestAnimationFrame(animate);
    } else {
        expRun = false;
        updateTable(9);
        document.getElementById('infoTime').textContent = 't=' + tMax.toFixed(2) + 'с';
        document.getElementById('infoPath').textContent = 's=' + L.toFixed(2) + 'м';
        document.getElementById('infoSpeed').textContent = 'v=' + (a * tMax).toFixed(2) + 'м/с';
        alert('Финиш!\nВремя: ' + tMax.toFixed(2) + 'с\nУскорение: ' + a.toFixed(4) + 'м/с²');
    }
}

function resetExperiment() {
    expRun = false;
    if (animId) cancelAnimationFrame(animId);
    expTime = 0;
    expIdx = 0;
    window.currentBallX = sx;
    window.currentBallY = sy;
    redraw();
    document.getElementById('infoTime').textContent = 't=0.00с';
    document.getElementById('infoPath').textContent = 's=0.00м';
    document.getElementById('infoSpeed').textContent = 'v=0.00м/с';
    updateTable(-1);
}

function createCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top' } },
        scales: { x: { title: { display: true, text: 't, с' } }, y: { title: { display: true, text: '' }, min: 0 } }
    };
    
    chartST = new Chart(document.getElementById('chartST'), {
        type: 'scatter',
        data: { datasets: [
            { label: 'Теория s(t)', data: [], borderColor: '#2563eb', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
            { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 5, showLine: false }
        ] },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 's, м' }, min: 0, max: L + 1 } } }
    });
    
    chartVT = new Chart(document.getElementById('chartVT'), {
        type: 'scatter',
        data: { datasets: [
            { label: 'Теория v(t)', data: [], borderColor: '#eab308', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
            { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 5, showLine: false }
        ] },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 'v, м/с' }, min: 0 } } }
    });
    
    chartAT = new Chart(document.getElementById('chartAT'), {
        type: 'scatter',
        data: { datasets: [
            { label: 'Теория a(t)', data: [], borderColor: '#16a34a', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
            { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 5, showLine: false }
        ] },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 'a, м/с²' }, min: 0 } } }
    });
}

function updateCharts() {
    if (!chartST) return;
    
    const sData = tFull.map((t, i) => ({ x: t, y: sFull[i] }));
    const measureData = times.map((t, i) => ({ x: t, y: PATHS[i] }));
    chartST.data.datasets[0].data = sData;
    chartST.data.datasets[1].data = measureData;
    chartST.update();
    
    const vData = tFull.map((t, i) => ({ x: t, y: vFull[i] }));
    const speedData = times.map((t, i) => ({ x: t, y: speeds[i] }));
    chartVT.data.datasets[0].data = vData;
    chartVT.data.datasets[1].data = speedData;
    chartVT.update();
    
    const aData = tFull.map(t => ({ x: t, y: a }));
    const accelData = times.map((t, i) => ({ x: t, y: accels[i] }));
    chartAT.data.datasets[0].data = aData;
    chartAT.data.datasets[1].data = accelData;
    chartAT.update();
    
    if (tMax > 0) {
        chartST.options.scales.x.max = tMax + 0.5;
        chartVT.options.scales.x.max = tMax + 0.5;
        chartAT.options.scales.x.max = tMax + 0.5;
        chartVT.options.scales.y.max = a * tMax + 1;
        chartAT.options.scales.y.max = a * 1.5;
        chartST.update();
        chartVT.update();
        chartAT.update();
    }
}

// Инициализация
document.getElementById('btnSet').onclick = async () => {
    const v = parseFloat(document.getElementById('angleInput').value);
    if (isNaN(v) || v < 0 || v > 10) {
        alert('Угол должен быть от 0° до 10°!');
        return;
    }
    alpha = v;
    await calculateOnServer();
    updateTable(-1);
    redraw();
    resetExperiment();
    alert(`α=${alpha.toFixed(1)}°\na=${a.toFixed(4)}м/с²\nt=${tMax.toFixed(2)}с`);
};

document.getElementById('btnStart').onclick = startExperiment;
document.getElementById('btnReset').onclick = resetExperiment;

createCharts();
calculateOnServer().then(() => {
    redraw();
    window.currentBallX = sx;
    window.currentBallY = sy;
});