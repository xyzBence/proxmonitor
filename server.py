from flask import Flask, jsonify, send_from_directory, request
import requests
from proxmoxer import ProxmoxAPI
import mysql.connector
import os
from datetime import datetime, timedelta
import threading
import time
import logging
import psutil
import json
import re
import subprocess
import paramiko

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

def load_config():
    try:
        with open('config.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Hiba a config.json betöltésekor: {str(e)}")
        raise

config = load_config()
proxmox = None

def init_proxmox():
    global proxmox
    try:
        proxmox = ProxmoxAPI(
            config['proxmox']['host'],
            user=config['proxmox']['user'],
            password=config['proxmox']['password'],
            verify_ssl=False
        )
        logger.info("Proxmox hitelesítés sikeres")
    except Exception as e:
        logger.error(f"Proxmox hitelesítés sikertelen: {str(e)}")
        proxmox = None

def reauthenticate():
    while True:
        time.sleep(300)  
        try:
            init_proxmox()
        except Exception as e:
            logger.error(f"Re-autentikáció sikertelen: {str(e)}")

# MySQL database
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'lbence123',
    'database': 'proxmox'
}

def init_db():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS server_status (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME NOT NULL,
            status BOOLEAN NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME NOT NULL,
            message VARCHAR(255) NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS storage_status (
            id INT AUTO_INCREMENT PRIMARY KEY,
            storage_name VARCHAR(100) NOT NULL,
            timestamp DATETIME NOT NULL,
            uptime FLOAT NOT NULL,
            UNIQUE KEY unique_storage_time (storage_name, timestamp)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            hour INTEGER NOT NULL,
            in_avg FLOAT NOT NULL,
            out_avg FLOAT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            UNIQUE KEY unique_date_hour (date, hour)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ram_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            hour INTEGER NOT NULL,
            ram_avg FLOAT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            UNIQUE KEY unique_date_hour (date, hour)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cpu_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            hour INTEGER NOT NULL,
            cpu_avg FLOAT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            UNIQUE KEY unique_date_hour (date, hour)
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

def update_network_usage(in_usage, out_usage):
    current_time = datetime.now()
    hour = current_time.hour
    date = current_time.strftime('%Y-%m-%d')
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("SELECT in_avg, out_avg, count FROM network_usage WHERE date = %s AND hour = %s", (date, hour))
        result = cursor.fetchone()
        
        if result:
            prev_in, prev_out, count = result
            new_in = (prev_in * count + in_usage) / (count + 1)
            new_out = (prev_out * count + out_usage) / (count + 1)
            cursor.execute(
                "UPDATE network_usage SET in_avg = %s, out_avg = %s, count = %s WHERE date = %s AND hour = %s",
                (new_in, new_out, count + 1, date, hour)
            )
        else:
            cursor.execute(
                "INSERT INTO network_usage (date, hour, in_avg, out_avg, count) VALUES (%s, %s, %s, %s, %s)",
                (date, hour, in_usage, out_usage, 1)
            )
        
        conn.commit()
    except Exception as e:
        logger.error(f"Hiba a hálózati használat frissítésekor: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def update_ram_usage(ram_percent):
    current_time = datetime.now()
    hour = current_time.hour
    date = current_time.strftime('%Y-%m-%d')
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("SELECT ram_avg, count FROM ram_usage WHERE date = %s AND hour = %s", (date, hour))
        result = cursor.fetchone()
        
        if result:
            prev_ram, count = result
            new_ram = (prev_ram * count + ram_percent) / (count + 1)
            cursor.execute(
                "UPDATE ram_usage SET ram_avg = %s, count = %s WHERE date = %s AND hour = %s",
                (new_ram, count + 1, date, hour)
            )
        else:
            cursor.execute(
                "INSERT INTO ram_usage (date, hour, ram_avg, count) VALUES (%s, %s, %s, %s)",
                (date, hour, ram_percent, 1)
            )
        
        conn.commit()
    except Exception as e:
        logger.error(f"Hiba a RAM használat frissítésekor: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def update_cpu_usage(cpu_percent):
    current_time = datetime.now()
    hour = current_time.hour
    date = current_time.strftime('%Y-%m-%d')
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("SELECT cpu_avg, count FROM cpu_usage WHERE date = %s AND hour = %s", (date, hour))
        result = cursor.fetchone()
        
        if result:
            prev_cpu, count = result
            new_cpu = (prev_cpu * count + cpu_percent) / (count + 1)
            cursor.execute(
                "UPDATE cpu_usage SET cpu_avg = %s, count = %s WHERE date = %s AND hour = %s",
                (new_cpu, count + 1, date, hour)
            )
        else:
            cursor.execute(
                "INSERT INTO cpu_usage (date, hour, cpu_avg, count) VALUES (%s, %s, %s, %s)",
                (date, hour, cpu_percent, 1)
            )
        
        conn.commit()
    except Exception as e:
        logger.error(f"Hiba a CPU használat frissítésekor: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def collect_data():
    global prevNetwork
    prevNetwork = None
    while True:
        try:
            current_time = time.time()
            net_io = psutil.net_io_counters()
            ram_percent = psutil.virtual_memory().percent
            cpu_percent = psutil.cpu_percent(interval=1)
            
            if prevNetwork is not None:
                time_diff = max(current_time - prevNetwork['time'], 0.1)
                in_usage = max((net_io.bytes_recv - prevNetwork['in']) / time_diff / 1024 / 1024, 0)
                out_usage = max((net_io.bytes_sent - prevNetwork['out']) / time_diff / 1024 / 1024, 0)
                update_network_usage(in_usage, out_usage)
            
            prevNetwork = {'in': net_io.bytes_recv, 'out': net_io.bytes_sent, 'time': current_time}
            
            update_ram_usage(ram_percent)
            
            update_cpu_usage(cpu_percent)
            
        except Exception as e:
            logger.error(f"Hiba az adatgyűjtés során: {str(e)}")
        time.sleep(60)  

def cleanup_old_data():
    while True:
        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM server_status WHERE timestamp < NOW() - INTERVAL 365 DAY')
            cursor.execute('DELETE FROM notifications WHERE timestamp < NOW() - INTERVAL 365 DAY')
            cursor.execute('DELETE FROM storage_status WHERE timestamp < NOW() - INTERVAL 365 DAY')
            cursor.execute('DELETE FROM network_usage WHERE date < CURDATE() - INTERVAL 365 DAY')
            cursor.execute('DELETE FROM ram_usage WHERE date < CURDATE() - INTERVAL 365 DAY')
            cursor.execute('DELETE FROM cpu_usage WHERE date < CURDATE() - INTERVAL 365 DAY')
            conn.commit()
            logger.info("Régi adatok törölve")
        except Exception as e:
            logger.error(f"Hiba a régi adatok törlésekor: {str(e)}")
        finally:
            cursor.close()
            conn.close()
        time.sleep(86400)  

last_status_log = None
def log_server_status(status):
    global last_status_log
    now = datetime.now()
    if last_status_log is None or (now - last_status_log).total_seconds() >= 300:  
        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            cursor.execute('INSERT INTO server_status (timestamp, status) VALUES (NOW(), %s)', (status,))
            conn.commit()
            last_status_log = now
        except Exception as e:
            logger.error(f"Hiba a szerver állapot logolásakor: {str(e)}")
        finally:
            cursor.close()
            conn.close()

def log_storage_status(storage_name, uptime):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO storage_status (storage_name, timestamp, uptime)
            VALUES (%s, NOW(), %s)
            ON DUPLICATE KEY UPDATE uptime = %s
        ''', (storage_name, uptime, uptime))
        conn.commit()
    except Exception as e:
        logger.error(f"Hiba a tároló állapot logolásakor: {str(e)}")
    finally:
        cursor.close()
        conn.close()

last_server_state = None
last_error_message = None
def add_notification(message):
    global last_server_state, last_error_message
    is_unavailable = message.startswith("Szerver elérhetetlenné vált")
    current_state = 'unavailable' if is_unavailable else 'available'
    
    if last_server_state != current_state:
        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            cursor.execute('INSERT INTO notifications (timestamp, message) VALUES (NOW(), %s)', (message,))
            conn.commit()
            last_server_state = current_state
            last_error_message = message if is_unavailable else None
        except Exception as e:
            logger.error(f"Hiba az értesítés hozzáadásakor: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    elif is_unavailable and last_error_message != message:
        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            cursor.execute('INSERT INTO notifications (timestamp, message) VALUES (NOW(), %s)', (message,))
            conn.commit()
            last_error_message = message
        except Exception as e:
            logger.error(f"Hiba az értesítés hozzáadásakor: {str(e)}")
        finally:
            cursor.close()
            conn.close()

def get_server_status_history():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour_start,
                   MIN(timestamp) as start_time,
                   MAX(timestamp) as end_time,
                   AVG(status) as avg_status,
                   GROUP_CONCAT(CASE WHEN status = 0 THEN timestamp END) as downtimes
            FROM server_status
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
            ORDER BY hour_start DESC
            LIMIT 24
        ''')
        history = cursor.fetchall()
        return history
    except Exception as e:
        logger.error(f"Hiba a szerver állapot előzmények lekérdezésekor: {str(e)}")
        return []
    finally:
        cursor.close()
        conn.close()

def get_storage_uptime(storage_name):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT AVG(uptime) * 100
            FROM storage_status
            WHERE storage_name = %s AND timestamp >= NOW() - INTERVAL 24 HOUR
        ''', (storage_name,))
        result = cursor.fetchone()
        return round(result[0], 1) if result[0] is not None else 100.0
    except Exception as e:
        logger.error(f"Hiba a tároló uptime lekérdezésekor: {str(e)}")
        return 100.0
    finally:
        cursor.close()
        conn.close()

def get_notifications():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('SELECT id, timestamp, message FROM notifications ORDER BY timestamp DESC LIMIT 10')
        notifications = cursor.fetchall()
        return notifications
    except Exception as e:
        logger.error(f"Hiba az értesítések lekérdezésekor: {str(e)}")
        return []
    finally:
        cursor.close()
        conn.close()

def delete_notification(notification_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM notifications WHERE id = %s', (notification_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"Hiba az értesítés törlésekor: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/node')
def get_node():
    if not proxmox:
        log_server_status(0)
        add_notification("Szerver elérhetetlenné vált: Hálózati hiba")
        return jsonify({'error': 'Szerver nem elérhető'}), 500
    try:
        nodes = list(proxmox.nodes.get())
        if not nodes:
            log_server_status(0)
            add_notification("Szerver elérhetetlenné vált: Nincs elérhető node")
            return jsonify({'error': 'Nincs elérhető node'}), 500

        node = nodes[0]
        node_status = proxmox.nodes(node['node']).status.get()

        try:
            net_io = psutil.net_io_counters()
            netin = net_io.bytes_recv
            netout = net_io.bytes_sent
        except Exception as e:
            logger.warning(f"Hiba a hálózati adatok lekérdezésekor: {str(e)}")
            netin = 0
            netout = 0

        data = {
            'node_name': node['node'],
            'cpu': node_status['cpu'],
            'memory_used': node_status['memory']['used'],
            'memory_total': node_status['memory']['total'],
            'network_in': netin,
            'network_out': netout,
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        log_server_status(1)
        add_notification("Szerver elérhető")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Hiba a /api/node végpontban: {str(e)}")
        log_server_status(0)
        add_notification(f"Szerver elérhetetlenné vált: {str(e)}")
        return jsonify({'error': 'Szerver nem elérhető'}), 500

def calculate_disk_size(config):
    total_size = 0
    for key, value in config.items():
        if key.startswith(('sata', 'scsi', 'ide', 'virtio')) and isinstance(value, str):
            match = re.search(r'size=(\d+)([GT])', value)
            if match:
                size = int(match.group(1))
                unit = match.group(2)
                if unit == 'T':
                    size *= 1024  
                total_size += size
    return total_size * 1024 * 1024 * 1024 

@app.route('/api/vms')
def get_vms():
    if not proxmox:
        return jsonify({'error': 'Szerver nem elérhető'}), 500
    try:
        nodes = list(proxmox.nodes.get())
        if not nodes:
            return jsonify({'error': 'Nincs elérhető node'}), 500

        node = nodes[0]['node']
        vm_list = []
        for vm in proxmox.nodes(node).qemu.get():
            vm_status = proxmox.nodes(node).qemu(vm['vmid']).status.current.get()
            vm_config = proxmox.nodes(node).qemu(vm['vmid']).config.get()
            maxdisk = calculate_disk_size(vm_config)
            vm_list.append({
                'type': 'VM',
                'name': vm['name'],
                'status': vm_status['status'],
                'cpu': vm_status.get('cpu', 0),
                'mem': vm_status.get('mem', 0),
                'maxmem': vm_status.get('maxmem', 0),
                'uptime': vm_status.get('uptime', 0),
                'cores': vm_config.get('cores', 'N/A'),
                'maxdisk': maxdisk,
                'config': vm_config
            })
        for ct in proxmox.nodes(node).lxc.get():
            ct_status = proxmox.nodes(node).lxc(ct['vmid']).status.current.get()
            ct_config = proxmox.nodes(node).lxc(ct['vmid']).config.get()
            maxdisk = calculate_disk_size(ct_config)
            vm_list.append({
                'type': 'CT',
                'name': ct['name'],
                'status': ct_status['status'],
                'cpu': ct_status.get('cpu', 0),
                'mem': ct_status.get('mem', 0),
                'maxmem': ct_status.get('maxmem', 0),
                'uptime': ct_status.get('uptime', 0),
                'cores': ct_config.get('cores', 'N/A'),
                'maxdisk': maxdisk,
                'config': ct_config
            })
        return jsonify(vm_list)
    except Exception as e:
        logger.error(f"Hiba a /api/vms végpontban: {str(e)}")
        return jsonify({'error': 'Szerver nem elérhető'}), 500

# storages
last_storage_states = {}
@app.route('/api/storage')
def get_storage():
    global last_storage_states
    try:
        result = []
        if proxmox:
            nodes = list(proxmox.nodes.get())
            if nodes:
                node = nodes[0]['node']
                for storage in proxmox.nodes(node).storage.get():
                    if 'content' in storage and 'used' in storage and 'total' in storage:
                        used = storage['used'] / 1024 / 1024 / 1024  # GB
                        total = storage['total'] / 1024 / 1024 / 1024  # GB
                        percent = (used / total) * 100 if total > 0 else 0
                        status = 'green' if percent < 70 else 'yellow' if percent < 90 else 'red'
                        availability = 'available' if total > 0 or used > 0 else 'unmounted' if storage['storage'] == 'pbs' else 'unavailable'
                        if availability != 'available':
                            status = 'grey'
                        uptime = get_storage_uptime(storage['storage'])
                        prev_state = last_storage_states.get(storage['storage'], 'empty')
                        if prev_state == 'available' and availability != 'available':
                            add_notification(f"Tároló elérhetetlenné vált: {storage['storage']}")
                        elif prev_state != 'available' and availability == 'available':
                            add_notification(f"Tároló újra elérhető: {storage['storage']}")
                        last_storage_states[storage['storage']] = availability
                        log_storage_status(storage['storage'], 1.0 if availability == 'available' else 0.0)
                        result.append({
                            'name': storage['storage'],
                            'used': used,
                            'total': total,
                            'percent': percent,
                            'status': status,
                            'availability': availability,
                            'uptime': uptime
                        })
        return jsonify(result)
    except Exception as e:
        logger.error(f"Hiba a /api/storage végpontban: {str(e)}")
        return jsonify({'error': 'Szerver nem elérhető'}), 500

# Uptime 
@app.route('/api/uptime')
def get_uptime():
    if not proxmox:
        return jsonify({'error': 'Szerver nem elérhető'}), 500
    try:
        nodes = list(proxmox.nodes.get())
        if not nodes:
            return jsonify({'error': 'Nincs elérhető node'}), 500
        node = nodes[0]['node']
        status = proxmox.nodes(node).status.get()
        return jsonify({'uptime': status['uptime']})
    except Exception as e:
        logger.error(f"Hiba a /api/uptime végpontban: {str(e)}")
        return jsonify({'error': 'Szerver nem elérhető'}), 500

# Szerver status
@app.route('/api/status_history')
def get_status_history():
    history = get_server_status_history()
    result = []
    for entry in history:
        hour_start, start_time, end_time, avg_status, downtimes = entry
        status = 'down'
        tooltip = f'Elérhetetlen: {hour_start[:13]}:00 - {hour_start[:13]}:59'
        downtimes_list = downtimes.split(',') if downtimes else []
        if avg_status > 0.99:
            status = 'up'
            tooltip = 'Elérhető'
        elif avg_status > 0.01:
            status = 'partial'
            tooltip = f'Részben elérhetetlen: {hour_start[:13]}:00 - {hour_start[:13]}:59'
        result.append({
            'status': status,
            'tooltip': tooltip,
            'downtimes': downtimes_list,
            'hour': hour_start
        })
    while len(result) < 24:
        result.insert(0, {
            'status': 'down',
            'tooltip': 'Elérhetetlen (nincs adat)',
            'downtimes': [],
            'hour': ''
        })
    return jsonify(result)

# notify
@app.route('/api/notifications')
def get_notifications_endpoint():
    notifications = get_notifications()
    return jsonify([{
        'id': id,
        'timestamp': str(timestamp),
        'message': message
    } for id, timestamp, message in notifications])

@app.route('/api/notifications/delete/<int:id>', methods=['DELETE'])
def delete_notification_endpoint(id):
    try:
        delete_notification(id)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Hiba az értesítés törlésekor: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network_usage')
def get_network_usage():
    date = request.args.get('date', default=datetime.now().strftime('%Y-%m-%d'))
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT hour, in_avg, out_avg FROM network_usage WHERE date = %s ORDER BY hour",
            (date,)
        )
        rows = cursor.fetchall()
        
        hours = [f"{h}:00" if h < 23 else "23:59" for h in range(24)]
        in_avg = [0.0] * 24
        out_avg = [0.0] * 24
        
        if rows:
            for row in rows:
                hour, in_val, out_val = row
                if 0 <= hour < 24:  
                    in_avg[hour] = float(in_val) if in_val is not None else 0.0
                    out_avg[hour] = float(out_val) if out_val is not None else 0.0
        else:
            logger.warning(f"No data found for date {date} in network_usage table")

        
        if date == datetime.now().strftime('%Y-%m-%d'):
            current_hour = datetime.now().hour
            hours = hours[:current_hour + 1]
            in_avg = in_avg[:current_hour + 1]
            out_avg = out_avg[:current_hour + 1]
        
        return jsonify({"hours": hours, "in_avg": in_avg, "out_avg": out_avg})
    except mysql.connector.Error as db_error:
        logger.error(f"Database error in get_network_usage: {str(db_error)}")
        return jsonify({"hours": [], "in_avg": [], "out_avg": [], "message": f"Adatbázis hiba: {str(db_error)}"})
    except Exception as e:
        logger.error(f"Unexpected error in get_network_usage: {str(e)}")
        return jsonify({"hours": [], "in_avg": [], "out_avg": [], "message": "Hiba történt"})
    finally:
        cursor.close()
        conn.close()

# RAM Usage Endpoint
@app.route('/api/ram_usage')
def get_ram_usage():
    date = request.args.get('date', default=datetime.now().strftime('%Y-%m-%d'))
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT hour, ram_avg FROM ram_usage WHERE date = %s ORDER BY hour",
            (date,)
        )
        rows = cursor.fetchall()
        
        
        hours = [f"{h}:00" if h < 23 else "23:59" for h in range(24)]
        ram_avg = [0.0] * 24
        
        if rows:
            for row in rows:
                hour, ram_val = row
                if 0 <= hour < 24:  
                    ram_avg[hour] = float(ram_val) if ram_val is not None else 0.0
        else:
            logger.warning(f"No data found for date {date} in ram_usage table")

        if date == datetime.now().strftime('%Y-%m-%d'):
            current_hour = datetime.now().hour
            hours = hours[:current_hour + 1]
            ram_avg = ram_avg[:current_hour + 1]
        
        return jsonify({"hours": hours, "ram_avg": ram_avg})
    except mysql.connector.Error as db_error:
        logger.error(f"Database error in get_ram_usage: {str(db_error)}")
        return jsonify({"hours": [], "ram_avg": [], "message": f"Adatbázis hiba: {str(db_error)}"})
    except Exception as e:
        logger.error(f"Unexpected error in get_ram_usage: {str(e)}")
        return jsonify({"hours": [], "ram_avg": [], "message": "Hiba történt"})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/cpu_usage')
def get_cpu_usage():
    date = request.args.get('date', default=datetime.now().strftime('%Y-%m-%d'))
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT hour, cpu_avg FROM cpu_usage WHERE date = %s ORDER BY hour",
            (date,)
        )
        rows = cursor.fetchall()
        
        hours = [f"{h}:00" if h < 23 else "23:59" for h in range(24)]
        cpu_avg = [0.0] * 24
        
        if rows:
            for row in rows:
                hour, cpu_val = row
                if 0 <= hour < 24:  
                    cpu_avg[hour] = float(cpu_val) if cpu_val is not None else 0.0
        else:
            logger.warning(f"No data found for date {date} in cpu_usage table")

        if date == datetime.now().strftime('%Y-%m-%d'):
            current_hour = datetime.now().hour
            hours = hours[:current_hour + 1]
            cpu_avg = cpu_avg[:current_hour + 1]
        
        return jsonify({"hours": hours, "cpu_avg": cpu_avg})
    except mysql.connector.Error as db_error:
        logger.error(f"Database error in get_cpu_usage: {str(db_error)}")
        return jsonify({"hours": [], "cpu_avg": [], "message": f"Adatbázis hiba: {str(db_error)}"})
    except Exception as e:
        logger.error(f"Unexpected error in get_cpu_usage: {str(e)}")
        return jsonify({"hours": [], "cpu_avg": [], "message": "Hiba történt"})
    finally:
        cursor.close()
        conn.close()

@app.route('/api/temperature')
def get_temperature():
    temp_url = 'http://192.168.1.84:8080/avg_temp.txt'
    try:
        response = requests.get(temp_url, timeout=5)
        response.raise_for_status()  
        temp_avg = int(response.text.strip() or 0)
        return jsonify({'temp_avg': temp_avg})
    except requests.RequestException as e:
        logger.error(f"Hiba a hőmérséklet lekérdezésekor a {temp_url} címről: {str(e)}")
        return jsonify({'temp_avg': 0})

if __name__ == '__main__':
    init_proxmox()
    init_db()
    threading.Thread(target=reauthenticate, daemon=True).start()
    threading.Thread(target=cleanup_old_data, daemon=True).start()
    threading.Thread(target=collect_data, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=True)