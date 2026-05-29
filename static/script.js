const G = 9.8;
const L = 10;
const PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Секретные коды (как в Python версии)
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
let animId = null, expTime = 0, expRun = false, expIdx = 0;
let sx, sy, ex, ey, railLen;
let chartST, chartVT, chartAT;
let currentColor = "#ef4444";
let currentMode = null;
let rulerCode = [];
let logoClickCount = 0;
let logoClickTimer = null;

const API_URL = '/api/calculate';

async function calculateOnServer() {
    try {
        const payload = { alpha: alpha };
        if (currentMode) {
            payload.secret_code = currentMode.code;
        }
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
        
        if (data.secret && !currentMode) {
            activateSecretMode(data.secret.code || Object.keys(SECRET_CODES).find(k => SECRET_CODES[k].name === data.secret.name), data.secret);
        }
        
        updateTable(-1);
        updateCharts();
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        alert('Ошибка подключения к серверу: ' + error.message);
        return null;
    }
}

function activateSecretMode(code, secretInfo) {
    currentMode = {
        code: code,
        name: secretInfo.name,
        color: secretInfo.color,
        colorName: secretInfo.colorName
    };
    currentColor = secretInfo.color;
    
    // Показываем бейдж с режимом
    const modeBadge = document.getElementById('modeBadge');
    const modeName = document.getElementById('modeName');
    modeName.textContent = `🎮 Режим: ${secretInfo.name} (${secretInfo.colorName} шарик)`;
    modeBadge.style.display = 'block';
    modeBadge.style.background = secretInfo.color;
    modeBadge.style.color = '#000';
    
    // Анимация появления
    modeBadge.style.animation = 'none';
    setTimeout(() => {
        modeBadge.style.animation = 'pulse 1s ease-in-out';
    }, 10);
    
    // Перерисовываем схему с новым цветом
    redraw();
    
    alert(`🔓 Секретный код ${code} активирован!\nРежим: ${secretInfo.name}\nЦвет шарика изменен на ${secretInfo.colorName}.\nНаслаждайтесь экспериментом!`);
}

function checkSecretCode() {
    if (rulerCode.length >= 4) {
        const codeStr = rulerCode.join('');
        if (SECRET_CODES[codeStr] && (!currentMode || currentMode.code !== codeStr)) {
            activateSecretMode(codeStr, SECRET_CODES[codeStr]);
            rulerCode = [];
            return true;
        }
        // Если код не подошел, удаляем первый символ и продолжаем
        if (rulerCode.length === 4) {
            rulerCode.shift();
        }
    }
    return false;
}

function onRulerNumberClick(number) {
    rulerCode.push(number.toString());
    
    // Визуальная обратная связь
    const canvas = document.getElementById('schemeCanvas');
    canvas.style.transform = 'scale(0.99)';
    setTimeout(() => { canvas.style.transform = 'scale(1)'; }, 100);
    
    checkSecretCode();
}

function onLogoClick() {
    if (logoClickTimer) clearTimeout(logoClickTimer);
    
    logoClickCount++;
    
    if (logoClickCount >= 3) {
        logoClickCount = 0;
        // Показываем "секретную анимацию" - просто уведомление для веб-версии
        alert('🦊 Wolf.Fox приветствует вас!\nСекрет: нажмите на числа на линейке (0-10) в правильной последовательности!');
    } else {
        logoClickTimer = setTimeout(() => {
            logoClickCount = 0;
        }, 1000);
    }
}

function updateTable(highlightIdx = -1) {
    let timeHtml = '<td><strong>Время t,с</strong></td>';
    let speedHtml = '<td><strong>Скорость v,м/с</strong></td>';
    let accelHtml = '<td><strong>Ускорение a,м/с²</strong></td>';
    
    for (let i = 0; i < 10; i++) {
        if (i < times.length) {
            const highlight = highlightIdx === i ? ' class="highlight"' : '';
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
    
    // Фон с легкой текстурой
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, W, H);
    
    sx = 60;
    sy = 50;
    ex = sx + railLen * Math.cos(rad);
    ey = sy + railLen * Math.sin(rad);
    
    // Тень под желобом
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    
    // Основной желоб
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    // Блестящие края
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
    
    // Центральная линия
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    // Деления линейки (с возможностью клика)
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = sx + railLen * t * Math.cos(rad);
        const y = sy + railLen * t * Math.sin(rad);
        
        // Черточка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y + 15);
        ctx.stroke();
        
        // Подсветка
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 1, y - 14);
        ctx.lineTo(x - 1, y + 14);
        ctx.stroke();
        
        // Промежуточные деления (0.5 м)
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
        
        // Цифры с эффектом
        const numberText = i.toString();
        let textX = x, textY = y - 22;
        if (i === 0) textX = x - 1;
        if (i === 10) textX = x + 1;
        
        // Тень цифры
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(numberText, textX + 1, textY + 1);
        
        // Цифра
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
    
    // Блик
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
    ctx.fillRect(canvas.width/2 - 150, 45, 300, 30);
    ctx.strokeRect(canvas.width/2 - 150, 45, 300, 30);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(titleText, canvas.width/2, 65);
    
    // Сохраняем координаты для кликов по цифрам
    window.rulerClickAreas = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = sx + railLen * t * Math.cos(rad);
        const y = sy + railLen * t * Math.sin(rad);
        window.rulerClickAreas.push({ x, y, number: i });
    }
}

function drawBall(x, y) {
    // Рисуем шарик с градиентом
    const radius = 12;
    const gradient = ctx.createRadialGradient(x - 4, y - 4, 3, x, y, radius);
    gradient.addColorStop(0, currentColor);
    gradient.addColorStop(1, '#991b1b');
    
    ctx.shadowBlur = 3;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Блик
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
    } else {
        drawBall(sx, sy);
    }
}

// Обработчик кликов по канвасу для секретного кода
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
        document.getElementById('infoTime').textContent = 't=' + tMax.toFixed(2) + 'с (финиш)';
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

document.getElementById('leftLogo').onclick = onLogoClick;

createCharts();
calculateOnServer().then(() => {
    redraw();
    window.currentBallX = sx;
    window.currentBallY = sy;
});