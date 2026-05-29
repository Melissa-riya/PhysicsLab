from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import math
import os

app = Flask(__name__, static_folder='../static')
CORS(app)

G = 9.8
L = 10.0

# Секретные коды и их эффекты (как в Python версии)
SECRET_CODES = {
    "2077": {"name": "Cyberpunk 2077", "color": "#00ff00", "color_name": "неоново-зеленый"},
    "1337": {"name": "LEET", "color": "#ff00ff", "color_name": "неоново-розовый"},
    "4200": {"name": "Ответ на все", "color": "#00ffff", "color_name": "голубой"},
    "8888": {"name": "Бесконечность", "color": "#ffd700", "color_name": "золотой"},
    "1234": {"name": "Последовательность", "color": "#ff4500", "color_name": "оранжевый"},
    "9999": {"name": "Максимум", "color": "#9400d3", "color_name": "фиолетовый"},
    "0000": {"name": "Ноль", "color": "#ffffff", "color_name": "белый"},
    "7777": {"name": "Удача", "color": "#ff69b4", "color_name": "розовый"},
}

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        alpha = float(data.get('alpha', 6.0))
        secret_code = data.get('secret_code', '')
        
        if alpha < 0 or alpha > 10:
            return jsonify({'error': 'Угол должен быть от 0° до 10°'}), 400
        
        alpha_rad = math.radians(alpha)
        a = G * math.sin(alpha_rad)
        
        if a > 0:
            t_max = math.sqrt(2 * L / a)
        else:
            t_max = 20.0
        
        # Генерируем точки для графиков
        dt = 0.01
        t_full = []
        s_full = []
        v_full = []
        
        t = 0.0
        while t <= t_max + 0.001:
            t_full.append(round(t, 4))
            s_full.append(round(0.5 * a * t * t, 6))
            v_full.append(round(a * t, 6))
            t += dt
        
        # Вычисляем времена для каждого пути (1-10 м)
        paths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        times = []
        speeds = []
        accels = []
        
        for path_s in paths:
            if path_s > L:
                continue
            if a > 0 and path_s > 0:
                t_val = math.sqrt(2 * path_s / a)
                times.append(round(t_val, 4))
                speeds.append(round(a * t_val, 4))
                accels.append(round(2 * path_s / (t_val * t_val), 4))
            else:
                times.append(0.0)
                speeds.append(0.0)
                accels.append(0.0)
        
        response = {
            'status': 'ok',
            'alpha': alpha,
            'a': round(a, 6),
            't_max': round(t_max, 4),
            't_full': t_full,
            's_full': s_full,
            'v_full': v_full,
            'paths': paths[:len(times)],
            'times': times,
            'speeds': speeds,
            'accels': accels
        }
        
        # Добавляем информацию о секретном коде, если он активирован
        if secret_code in SECRET_CODES:
            response['secret'] = SECRET_CODES[secret_code]
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# Для локального запуска
if __name__ == '__main__':
    app.run(debug=True)