# Proxmonitor

Proxmonitor is a **beta** web-based monitoring tool for Proxmox VE environments. It offers real-time insights into node status, VM/CT metrics, storage usage, and server availability through a user-friendly dashboard.

**⚠️ Important Note**: This is a **work-in-progress beta project**. Many features are incomplete or unstable. Use with caution, as bugs are expected.

## Features
- Monitor Proxmox node metrics (CPU, RAM, network usage).
- Track VM and container statuses.
- Visualize storage usage and uptime.
- Display server availability history and notifications.
- Responsive design with dark mode support.

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Configure `config.json` with your Proxmox API credentials.
3. Set up a MySQL database and update `server.py` with your database credentials.
4. Run the server: `python server.py`
5. Access the dashboard at `http://localhost:5000`

## Requirements
The following Python packages are required:

| Package                | Description                              |
|------------------------|------------------------------------------|
| Flask                 | Web framework for the server             |
| requests              | HTTP requests for API calls              |
| proxmoxer             | Proxmox VE API interaction               |
| mysql-connector-python| MySQL database connectivity              |
| psutil                | System resource monitoring               |
| paramiko              | SSH connections (not actively used)      |

## Known Issues
- 1-2 graph rendering errors.
- 1-2 database query inconsistencies.
- Visual, calculation, and logical errors in detailed VM/CT information displays.
- Notification system malfunctions.
- Server availability indicator inaccuracies.

