const G = 9.8;
const L = 10;
const PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Секретные коды
const SECRET_CODES = {
    "2077": { name: "Cyberpunk 2077", color: "#00ff00", colorName: "неоново-зеленый" },
    "1337": { name: "LEET", color: "#ff00ff", colorName: "неоново-розовый" },
    "4200": { name: "Ответ на все", color: "#00ffff", colorName: "голубой" },
    "8888": { name: "Бесконечность", color: "#ffd700", colorName: "золотой" },
    "1234": { name: "Последовательность", color: "#ff4500", colorName: "оранжевый" },
    "9999": { name: "Максимум", color: "#9400d3", colorName: "фиолетовый" },
    "0000": { name: "Ноль", color: "#ffffff", colorName: "белый" },
    "7777": { name: "Удача", color: "#ff69b4", colorName: "розовый" }
};

let alpha = 6;
let a = 0, tMax = 0;
let tFull = [], sFull = [], vFull = [];
let times = [], speeds = [], accels = [];
let animId = null, expTime = 0, expRun = false;
let sx, sy, ex, ey, railLen;
let chartST, chartVT, chartAT;
let currentColor = "#ef4444";
let currentMode = null;
let rulerCode = [];
let logoClickCount = 0;
let logoClickTimer = null;

// Для хранения измерений
let measureTimes = [];
let measurePaths = [];
let measureSpeeds = [];

// ЛОКАЛЬНЫЙ РАСЧЕТ
function calculateLocally() {
    console.log("Calculating locally for alpha:", alpha);
    
    const alphaRad = alpha * Math.PI / 180;
    a = G * Math.sin(alphaRad);
    
    if (a > 0) {
        tMax = Math.sqrt(2 * L / a);
    } else {
        tMax = 20.0;
    }
    
    console.log("a =", a, "tMax =", tMax);
    
    // Генерируем точки для графиков
    tFull = [];
    sFull = [];
    vFull = [];
    
    for (let t = 0; t <= tMax + 0.01; t += 0.01) {
        tFull.push(parseFloat(t.toFixed(4)));
        sFull.push(parseFloat((0.5 * a * t * t).toFixed(6)));
        vFull.push(parseFloat((a * t).toFixed(6)));
    }
    
    // Вычисляем теоретические времена для каждого пути
    times = [];
    speeds = [];
    accels = [];
    
    for (const pathS of PATHS) {
        if (pathS > L) continue;
        if (a > 0 && pathS > 0) {
            const tVal = Math.sqrt(2 * pathS / a);
            times.push(parseFloat(tVal.toFixed(4)));
            speeds.push(parseFloat((a * tVal).toFixed(4)));
            accels.push(parseFloat((2 * pathS / (tVal * tVal)).toFixed(4)));
        } else {
            times.push(0);
            speeds.push(0);
            accels.push(0);
        }
    }
    
    console.log("Times calculated:", times);
    
    updateCharts();
    
    return { a, tMax, times };
}

function activateSecretMode(code, secretInfo) {
    currentMode = {
        code: code,
        name: secretInfo.name,
        color: secretInfo.color,
        colorName: secretInfo.colorName
    };
    currentColor = secretInfo.color;
    
    const modeBadge = document.getElementById('modeBadge');
    const modeName = document.getElementById('modeName');
    if (modeBadge) {
        modeName.textContent = `🎮 Режим: ${secretInfo.name} (${secretInfo.colorName} шарик)`;
        modeBadge.style.display = 'block';
        modeBadge.style.background = secretInfo.color;
        modeBadge.style.color = '#000';
        
        modeBadge.style.animation = 'none';
        setTimeout(() => {
            modeBadge.style.animation = 'pulse 1s ease-in-out';
        }, 10);
    }
    
    redraw();
    
    alert(`🔓 Секретный код ${code} активирован!\nРежим: ${secretInfo.name}\nЦвет шарика изменен на ${secretInfo.colorName}.`);
}

function checkSecretCode() {
    if (rulerCode.length >= 4) {
        const codeStr = rulerCode.join('');
        if (SECRET_CODES[codeStr] && (!currentMode || currentMode.code !== codeStr)) {
            activateSecretMode(codeStr, SECRET_CODES[codeStr]);
            rulerCode = [];
            return true;
        }
        if (rulerCode.length === 4) {
            rulerCode.shift();
        }
    }
    return false;
}

function onRulerNumberClick(number) {
    rulerCode.push(number.toString());
    const canvas = document.getElementById('schemeCanvas');
    if (canvas) {
        canvas.style.transform = 'scale(0.99)';
        setTimeout(() => { canvas.style.transform = 'scale(1)'; }, 100);
    }
    checkSecretCode();
}

function onLogoClick() {
    if (logoClickTimer) clearTimeout(logoClickTimer);
    logoClickCount++;
    if (logoClickCount >= 3) {
        logoClickCount = 0;
        alert('🦊 Wolf.Fox приветствует вас!\nСекрет: нажмите на числа на линейке (0-10) в правильной последовательности!');
    } else {
        logoClickTimer = setTimeout(() => {
            logoClickCount = 0;
        }, 1000);
    }
}

// ОБНОВЛЕНИЕ ТАБЛИЦЫ
function updateTable() {
    for (let i = 0; i < 10; i++) {
        const timeLabel = document.getElementById(`time_${i}`);
        const speedLabel = document.getElementById(`speed_${i}`);
        const accelLabel = document.getElementById(`accel_${i}`);
        
        if (timeLabel && speedLabel && accelLabel) {
            const index = measurePaths.indexOf(PATHS[i]);
            if (index !== -1) {
                timeLabel.textContent = measureTimes[index].toFixed(3);
                timeLabel.style.color = '#ea580c';
                timeLabel.style.fontWeight = 'bold';
                speedLabel.textContent = measureSpeeds[index].toFixed(3);
                speedLabel.style.color = '#ea580c';
                speedLabel.style.fontWeight = 'bold';
                accelLabel.textContent = a.toFixed(4);
                accelLabel.style.color = '#16a34a';
                accelLabel.style.fontWeight = 'bold';
            } else {
                timeLabel.textContent = '---';
                timeLabel.style.color = '#888';
                timeLabel.style.fontWeight = 'normal';
                speedLabel.textContent = '---';
                speedLabel.style.color = '#888';
                speedLabel.style.fontWeight = 'normal';
                accelLabel.textContent = '---';
                accelLabel.style.color = '#888';
                accelLabel.style.fontWeight = 'normal';
            }
        }
    }
        updateCharts();
}

// ИНИЦИАЛИЗАЦИЯ ТАБЛИЦЫ
function initTable() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Путь s, м</th>
                    ${PATHS.map(s => `<th>${s}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Время t, с</strong></td>
                    ${PATHS.map((_, i) => `<td id="time_${i}">---</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Скорость v, м/с</strong></td>
                    ${PATHS.map((_, i) => `<td id="speed_${i}">---</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Ускорение a, м/с²</strong></td>
                    ${PATHS.map((_, i) => `<td id="accel_${i}">---</td>`).join('')}
                </tr>
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = html;
}

function clearTableData() {
    measureTimes = [];
    measurePaths = [];
    measureSpeeds = [];
    for (let i = 0; i < 10; i++) {
        const timeLabel = document.getElementById(`time_${i}`);
        const speedLabel = document.getElementById(`speed_${i}`);
        const accelLabel = document.getElementById(`accel_${i}`);
        if (timeLabel) {
            timeLabel.textContent = '---';
            timeLabel.style.color = '#888';
            timeLabel.style.fontWeight = 'normal';
        }
        if (speedLabel) {
            speedLabel.textContent = '---';
            speedLabel.style.color = '#888';
            speedLabel.style.fontWeight = 'normal';
        }
        if (accelLabel) {
            accelLabel.textContent = '---';
            accelLabel.style.color = '#888';
            accelLabel.style.fontWeight = 'normal';
        }
    }
}

const canvas = document.getElementById('schemeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function drawScheme() {
    if (!ctx) return;
    
    const W = canvas.width, H = canvas.height;
    const rad = alpha * Math.PI / 180;
    railLen = Math.min(W - 120, 380);
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, W, H);
    
    sx = 60;
    sy = 50;
    ex = sx + railLen * Math.cos(rad);
    ey = sy + railLen * Math.sin(rad);
    
    // Тень
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    
    // Желоб
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(ex, ey - 4);
    ctx.stroke();
    
    ctx.strokeStyle = '#757575';
    ctx.beginPath();
    ctx.moveTo(sx, sy + 4);
    ctx.lineTo(ex, ey + 4);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    // Деления линейки
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = sx + railLen * t * Math.cos(rad);
        const y = sy + railLen * t * Math.sin(rad);
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y + 15);
        ctx.stroke();
        
        if (i < 10) {
            const midT = t + 0.05;
            const midX = sx + railLen * midT * Math.cos(rad);
            const midY = sy + railLen * midT * Math.sin(rad);
            ctx.strokeStyle = '#5d6d7e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(midX, midY - 7);
            ctx.lineTo(midX, midY + 7);
            ctx.stroke();
        }
        
        const numberText = i.toString();
        let textX = x, textY = y - 22;
        if (i === 0) textX = x - 1;
        if (i === 10) textX = x + 1;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(numberText, textX + 1, textY + 1);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(numberText, textX, textY);
    }
    
    // Упор
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#5d6d7e';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(ex, ey, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 5, ey - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('УПОР', ex, ey + 22);
    
    ctx.shadowBlur = 0;
    
    // Заголовок
    let titleText = `Линейка (α = ${alpha.toFixed(1)}°, L = ${L} м)`;
    if (currentMode) titleText += ` | Режим: ${currentMode.name}`;
    
    ctx.fillStyle = '#d5d8dc';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.fillRect(W/2 - 150, 85, 300, 30);
    ctx.strokeRect(W/2 - 150, 85, 300, 30);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(titleText, W/2, 100);
    
    // Сохраняем координаты для кликов
    window.rulerClickAreas = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = sx + railLen * t * Math.cos(rad);
        const y = sy + railLen * t * Math.sin(rad);
        window.rulerClickAreas.push({ x, y, number: i });
    }
}

function drawBall(x, y) {
    if (!ctx) return;
    const radius = 12;
    const gradient = ctx.createRadialGradient(x - 4, y - 4, 3, x, y, radius);
    gradient.addColorStop(0, currentColor);
    gradient.addColorStop(1, '#991b1b');
    
    ctx.shadowBlur = 3;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function redraw() {
    drawScheme();
    if (window.currentBallX !== undefined && window.currentBallY !== undefined) {
        drawBall(window.currentBallX, window.currentBallY);
    } else if (sx !== undefined && sy !== undefined) {
        drawBall(sx, sy);
    }
}

// Обработчик кликов по канвасу
if (canvas) {
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        if (window.rulerClickAreas) {
            for (const area of window.rulerClickAreas) {
                const dx = mouseX - area.x;
                const dy = mouseY - area.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 20) {
                    onRulerNumberClick(area.number);
                    break;
                }
            }
        }
    });
}

// ЗАПУСК ЭКСПЕРИМЕНТА
function startExperiment() {
    if (expRun) return;
    
    calculateLocally();
    
    if (a === 0 || tMax === 0) {
        alert('Ошибка: ускорение равно 0. Увеличьте угол наклона (сейчас α = ' + alpha + '°)');
        return;
    }
    
    console.log("Starting experiment: a=" + a + ", tMax=" + tMax);
    
    measureTimes = [];
    measurePaths = [];
    measureSpeeds = [];
    clearTableData();
    
    expTime = 0;
    expRun = true;
    animate();
}

// АНИМАЦИЯ
function animate() {
    if (!expRun) return;
    
    if (a === 0 || tMax === 0 || typeof sx === 'undefined') {
        console.error("Invalid animation state:", {a, tMax, sx});
        expRun = false;
        return;
    }
    
    if (expTime <= tMax) {
        let s = 0.5 * a * expTime * expTime;
        if (s > L) s = L;
        const v = a * expTime;
        const t = Math.min(s / L, 1);
        const rad = alpha * Math.PI / 180;
        
        const ballX = sx + railLen * t * Math.cos(rad);
        const ballY = sy + railLen * t * Math.sin(rad);
        
        window.currentBallX = ballX;
        window.currentBallY = ballY;
        
        redraw();
        
        document.getElementById('infoTime').textContent = 't=' + expTime.toFixed(2) + 'с';
        document.getElementById('infoPath').textContent = 's=' + s.toFixed(2) + 'м';
        document.getElementById('infoSpeed').textContent = 'v=' + v.toFixed(2) + 'м/с';
        
        // ЗАПИСЬ ИЗМЕРЕНИЙ
        for (let i = 0; i < PATHS.length; i++) {
            const targetS = PATHS[i];
            if (s >= targetS - 0.05 && !measurePaths.includes(targetS)) {
                measureTimes.push(expTime);
                measurePaths.push(targetS);
                measureSpeeds.push(v);
                
                console.log(`Измерение: путь ${targetS}м, время ${expTime.toFixed(3)}с, скорость ${v.toFixed(3)}м/с`);
                
                updateTable();
                break;
            }
        }


    if (!measurePaths.includes(10) && s >= 9.95) {
        measureTimes.push(expTime);
        measurePaths.push(10);
        measureSpeeds.push(v);
        console.log(`Измерение: путь 10м (финиш), время ${expTime.toFixed(3)}с`);
        updateTable();
    }
            
        expTime += 0.03;
        animId = requestAnimationFrame(animate);
    } else {
        expRun = false;
        if (animId) cancelAnimationFrame(animId);
        
        document.getElementById('infoTime').textContent = 't=' + tMax.toFixed(2) + 'с (финиш)';
        document.getElementById('infoPath').textContent = 's=' + L.toFixed(2) + 'м';
        document.getElementById('infoSpeed').textContent = 'v=' + (a * tMax).toFixed(2) + 'м/с';
        
        alert('Финиш!\nВремя: ' + tMax.toFixed(2) + 'с\nУскорение: ' + a.toFixed(4) + 'м/с²');
    }
}

function resetExperiment() {
    expRun = false;
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    expTime = 0;
    
    measureTimes = [];
    measurePaths = [];
    measureSpeeds = [];
    
    window.currentBallX = sx;
    window.currentBallY = sy;
    redraw();
    
    document.getElementById('infoTime').textContent = 't=0.00с';
    document.getElementById('infoPath').textContent = 's=0.00м';
    document.getElementById('infoSpeed').textContent = 'v=0.00м/с';
    
    clearTableData();
    clearPlots();
}

function clearPlots() {
    if (chartST) {
        chartST.data.datasets[0].data = [];
        chartST.data.datasets[1].data = [];
        chartST.update();
    }
    if (chartVT) {
        chartVT.data.datasets[0].data = [];
        chartVT.data.datasets[1].data = [];
        chartVT.update();
    }
    if (chartAT) {
        chartAT.data.datasets[0].data = [];
        chartAT.data.datasets[1].data = [];
        chartAT.update();
    }
}

function createCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top' } },
        scales: { x: { title: { display: true, text: 't, с' } }, y: { title: { display: true, text: '' }, min: 0 } }
    };
    
    const ctxST = document.getElementById('chartST')?.getContext('2d');
    const ctxVT = document.getElementById('chartVT')?.getContext('2d');
    const ctxAT = document.getElementById('chartAT')?.getContext('2d');
    
    if (ctxST) {
        chartST = new Chart(ctxST, {
            type: 'scatter',
            data: { datasets: [
                { label: 'Теория s(t)', data: [], borderColor: '#2563eb', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
                { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 6, showLine: false }
            ] },
            options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 's, м' }, min: 0, max: L + 1 } } }
        });
    }
    
    if (ctxVT) {
        chartVT = new Chart(ctxVT, {
            type: 'scatter',
            data: { datasets: [
                { label: 'Теория v(t)', data: [], borderColor: '#eab308', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
                { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 6, showLine: false }
            ] },
            options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 'v, м/с' }, min: 0 } } }
        });
    }
    
    if (ctxAT) {
        chartAT = new Chart(ctxAT, {
            type: 'scatter',
            data: { datasets: [
                { label: 'Теория a(t)', data: [], borderColor: '#16a34a', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
                { label: 'Точки измерений', data: [], borderColor: '#ea580c', backgroundColor: '#ea580c', borderWidth: 0, pointRadius: 6, showLine: false }
            ] },
            options: { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { text: 'a, м/с²' }, min: 0 } } }
        });
    }
}

function updateCharts() {
    if (!chartST || !chartVT || !chartAT) return;
    
    const sData = tFull.map((t, i) => ({ x: t, y: sFull[i] }));
    const vData = tFull.map((t, i) => ({ x: t, y: vFull[i] }));
    const aData = tFull.map(t => ({ x: t, y: a }));
    
    chartST.data.datasets[0].data = sData;
    chartVT.data.datasets[0].data = vData;
    chartAT.data.datasets[0].data = aData;
    
    const measureDataST = measureTimes.map((t, i) => ({ x: t, y: measurePaths[i] }));
    const measureDataVT = measureTimes.map((t, i) => ({ x: t, y: measureSpeeds[i] }));
    const measureDataAT = measureTimes.map((t, i) => ({ x: t, y: a }));
    
    chartST.data.datasets[1].data = measureDataST;
    chartVT.data.datasets[1].data = measureDataVT;
    chartAT.data.datasets[1].data = measureDataAT;
    
    chartST.update();
    chartVT.update();
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


// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    initTable();
    createCharts();
    calculateLocally();
    redraw();
    window.currentBallX = sx;
    window.currentBallY = sy;
    
    const btnSet = document.getElementById('btnSet');
    const btnStart = document.getElementById('btnStart');
    const btnReset = document.getElementById('btnReset');
    const btnBuild = document.getElementById('btnBuild');
    const leftLogo = document.getElementById('leftLogo');
    const angleInput = document.getElementById('angleInput');
    
    if (btnSet) {
        btnSet.onclick = () => {
            const v = parseFloat(angleInput?.value || 6);
            if (isNaN(v) || v < 0 || v > 10) {
                alert('Угол должен быть от 0° до 10°!');
                return;
            }
            alpha = v;
            calculateLocally();
            redraw();
            resetExperiment();
            alert(`α=${alpha.toFixed(1)}°\na=${a.toFixed(4)}м/с²\nt=${tMax.toFixed(2)}с`);
        };
    }
    
    if (btnStart) btnStart.onclick = startExperiment;
    if (btnReset) btnReset.onclick = resetExperiment;
    if (leftLogo) leftLogo.onclick = onLogoClick;
    
    console.log("Initialized with alpha=" + alpha + ", a=" + a + ", tMax=" + tMax);
});
