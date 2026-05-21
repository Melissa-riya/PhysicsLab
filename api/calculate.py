from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import math

app = Flask(__name__)
CORS(app)

G = 9.8
L = 10.0

@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        alpha = float(data.get('alpha', 6.0))
        
        if alpha < 0 or alpha > 10:
            return jsonify({'error': 'Угол должен быть от 0° до 10°'}), 400
        
        alpha_rad = math.radians(alpha)
        a = G * math.sin(alpha_rad)
        
        if a > 0:
            t_max = math.sqrt(2 * L / a)
        else:
            t_max = 20.0
        
        dt = 0.01
        t_full = []
        s_full = []
        v_full = []
        
        t = 0
        while t <= t_max + dt:
            t_full.append(round(t, 4))
            s_full.append(round(0.5 * a * t * t, 6))
            v_full.append(round(a * t, 6))
            t += dt
        
        paths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        times = []
        speeds = []
        accels = []
        
        for s in paths:
            if s > L:
                break
            if a > 0:
                t_val = math.sqrt(2 * s / a)
                times.append(round(t_val, 4))
                speeds.append(round(a * t_val, 4))
                accels.append(round(2 * s / (t_val * t_val), 4))
            else:
                times.append(0)
                speeds.append(0)
                accels.append(0)
        
        return jsonify({
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
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

