const cpuChart = new Chart(document.getElementById('cpu-chart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Használat (%)',
            data: [],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointBackgroundColor: '#22c55e',
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#4a5568' },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
            tooltip: {
                backgroundColor: '#1a202c',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                position: 'nearest',
                caretSize: 5,
                caretPadding: 5,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                    }
                }
            },
        },
    },
});

const ramChart = new Chart(document.getElementById('ram-chart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'RAM Használat (%)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointBackgroundColor: '#3b82f6',
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#4a5568' },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
            tooltip: {
                backgroundColor: '#1a202c',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                position: 'nearest',
                caretSize: 5,
                caretPadding: 5,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                    }
                }
            },
        },
    },
});

const networkChart = new Chart(document.getElementById('network-chart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Bejövő (MB/s)',
                data: [],
                borderColor: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.3)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#facc15',
            },
            {
                label: 'Kimenő (MB/s)',
                data: [],
                borderColor: '#f472b6',
                backgroundColor: 'rgba(244, 114, 182, 0.3)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#f472b6',
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#4a5568' },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
            x: {
                grid: { display: false },
                ticks: { color: '#e2e8f0', font: { size: 10 } },
            },
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
            tooltip: {
                backgroundColor: '#1a202c',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                position: 'nearest',
                caretSize: 5,
                caretPadding: 5,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y} MB/s`;
                    }
                }
            },
        },
    },
});

// Resolution detection and layout adjustment
function adjustLayout() {
    const container = document.querySelector('.container');
    const body = document.body;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const isMobile = width <= 768;
    
    if (container && body) {
       
        container.style.transform = '';
        container.style.width = '';
        container.style.height = '';
        container.style.position = '';
        container.style.left = '';
        container.style.right = '';
        container.style.margin = '';
        body.style.overflow = '';
        
        if (isMobile) {
            container.style.width = '100%';
            container.style.height = 'auto';
            container.style.margin = '0';
            body.style.overflow = 'auto';
            container.style.transform = 'scale(1)';
        } else {
            const maxWidth = 1600; 
            const maxHeight = 900; 
            const scaleX = width / maxWidth;
            const scaleY = height / maxHeight;
            const scale = Math.min(scaleX, scaleY, 1); 
            
            container.style.width = `${maxWidth}px`;
            container.style.height = `${maxHeight}px`;
            container.style.position = 'absolute';
            container.style.left = '50%';
            container.style.transform = `translateX(-50%) scale(${scale})`;
            container.style.transformOrigin = 'center';
            body.style.overflow = 'hidden';
            
            body.style.height = `${height}px`;
        }
    }
}

window.addEventListener('load', adjustLayout);
window.addEventListener('resize', adjustLayout);

const cpuMetric = document.querySelector('.metric:nth-child(1)');
if (cpuMetric) {
    cpuMetric.addEventListener('click', () => {
        showCpuUsageAveragesModal();
    });
}

const ramMetric = document.querySelector('.metric:nth-child(2)');
if (ramMetric) {
    ramMetric.addEventListener('click', () => {
        showRamUsageAveragesModal();
    });
}

const networkMetric = document.querySelector('.metric:nth-child(3)');
if (networkMetric) {
    networkMetric.addEventListener('click', () => {
        showNetworkUsageAveragesModal();
    });
}

let statusHistory = [];
let lastNotifications = [];
let notificationCount = 0;
let prevNetwork = { in: 0, out: 0, time: Date.now() };
let serverAvailable = true;
let processedNotifications = new Set();

function createCircularProgress(uptime) {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - uptime / 100);

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    const gradientPercentage = Math.min(Math.max(uptime, 0), 100);

    return `
        <div class="circular-progress">
            <svg>
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${gradientPercentage === 0 ? '#ef4444' : `rgb(${255 - (2.55 * gradientPercentage)},${2.55 * gradientPercentage},0)`}" />
                        <stop offset="100%" style="stop-color:${gradientPercentage === 100 ? '#22c55e' : `rgb(${255 - (2.55 * gradientPercentage)},${2.55 * gradientPercentage},0)`}" />
                    </linearGradient>
                </defs>
                <circle class="background" cx="14" cy="14" r="${radius}" />
                <circle class="foreground" cx="14" cy="14" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="stroke:url(#${gradientId});" />
            </svg>
            <span class="uptime-text">${uptime}%</span>
        </div>
    `;
}

function showCpuUsageAveragesModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) {
        console.error('Modal body elem nem található');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    modalBody.innerHTML = `
        <h3>CPU Használat Átlagok</h3>
        <input type="date" id="datePicker" value="${today}" onchange="fetchCpuUsageAverages()">
        <canvas id="cpuUsageAveragesChart"></canvas>
    `;
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('show');
    }
    fetchCpuUsageAverages();
}

function showRamUsageAveragesModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) {
        console.error('Modal body elem nem található');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    modalBody.innerHTML = `
        <h3>RAM Használat Átlagok</h3>
        <input type="date" id="datePicker" value="${today}" onchange="fetchRamUsageAverages()">
        <canvas id="ramUsageAveragesChart"></canvas>
    `;
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('show');
    }
    fetchRamUsageAverages();
}

function showNetworkUsageAveragesModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) {
        console.error('Modal body elem nem található');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    modalBody.innerHTML = `
        <h3>Hálózat Használat Átlagok</h3>
        <input type="date" id="datePicker" value="${today}" onchange="fetchNetworkUsageAverages()">
        <canvas id="networkUsageAveragesChart"></canvas>
    `;
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('show');
    }
    fetchNetworkUsageAverages();
}

function fetchCpuUsageAverages() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) {
        console.error('DatePicker elem nem található');
        return;
    }
    const selectedDate = datePicker.value || new Date().toISOString().split('T')[0];
    fetch(`/api/cpu_usage?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('cpuUsageAveragesChart')?.getContext('2d');
            if (!ctx) {
                console.error('CpuUsageAveragesChart canvas nem található');
                return;
            }
            if (window.cpuUsageAveragesChartInstance) {
                window.cpuUsageAveragesChartInstance.destroy();
            }
            if (data.message === "Hiba történt") {
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }

            console.log('Szerver válasz (CPU):', data);

            const expectedHours = Array.from({ length: 24 }, (_, i) => i < 23 ? `${i}:00` : '23:59');
            const hours = data.hours && data.hours.length > 0 ? data.hours : expectedHours;

            const cpuAvg = new Array(24).fill(0);
            if (data.cpu_avg && data.cpu_avg.length > 0) {
                data.cpu_avg.forEach((value, index) => {
                    if (index < 24) cpuAvg[index] = value;
                });
            }

            window.cpuUsageAveragesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'CPU Használat (%)',
                        data: cpuAvg,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.3)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#22c55e',
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: '#4a5568' },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: '%',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: 'Óra',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                    },
                    plugins: {
                        legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
                        tooltip: {
                            backgroundColor: '#1a202c',
                            titleColor: '#e2e8f0',
                            bodyColor: '#e2e8f0',
                            position: 'nearest',
                            caretSize: 5,
                            caretPadding: 5,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                                }
                            }
                        },
                    },
                },
            });
        })
        .catch(error => {
            const ctx = document.getElementById('cpuUsageAveragesChart')?.getContext('2d');
            if (ctx) {
                if (window.cpuUsageAveragesChartInstance) {
                    window.cpuUsageAveragesChartInstance.destroy();
                }
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt a lekérdezés során', ctx.canvas.width / 2, ctx.canvas.height / 2);
            }
            console.error('Hiba a CPU átlagok lekérdezésekor:', error);
        });
}

function fetchRamUsageAverages() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) {
        console.error('DatePicker elem nem található');
        return;
    }
    const selectedDate = datePicker.value || new Date().toISOString().split('T')[0];
    fetch(`/api/ram_usage?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('ramUsageAveragesChart')?.getContext('2d');
            if (!ctx) {
                console.error('RamUsageAveragesChart canvas nem található');
                return;
            }
            if (window.ramUsageAveragesChartInstance) {
                window.ramUsageAveragesChartInstance.destroy();
            }
            if (data.message === "Hiba történt") {
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }

            console.log('Szerver válasz (RAM):', data);

            const expectedHours = Array.from({ length: 24 }, (_, i) => i < 23 ? `${i}:00` : '23:59');
            const hours = data.hours && data.hours.length > 0 ? data.hours : expectedHours;

            const ramAvg = new Array(24).fill(0);
            if (data.ram_avg && data.ram_avg.length > 0) {
                data.ram_avg.forEach((value, index) => {
                    if (index < 24) ramAvg[index] = value;
                });
            }

            window.ramUsageAveragesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'RAM Használat (%)',
                        data: ramAvg,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.3)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#3b82f6',
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: '#4a5568' },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: '%',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: 'Óra',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                    },
                    plugins: {
                        legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
                        tooltip: {
                            backgroundColor: '#1a202c',
                            titleColor: '#e2e8f0',
                            bodyColor: '#e2e8f0',
                            position: 'nearest',
                            caretSize: 5,
                            caretPadding: 5,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                                }
                            }
                        },
                    },
                },
            });
        })
        .catch(error => {
            const ctx = document.getElementById('ramUsageAveragesChart')?.getContext('2d');
            if (ctx) {
                if (window.ramUsageAveragesChartInstance) {
                    window.ramUsageAveragesChartInstance.destroy();
                }
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt a lekérdezés során', ctx.canvas.width / 2, ctx.canvas.height / 2);
            }
            console.error('Hiba a RAM átlagok lekérdezésekor:', error);
        });
}

function fetchNetworkUsageAverages() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) {
        console.error('DatePicker elem nem található');
        return;
    }
    const selectedDate = datePicker.value || new Date().toISOString().split('T')[0];
    fetch(`/api/network_usage?date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('networkUsageAveragesChart')?.getContext('2d');
            if (!ctx) {
                console.error('NetworkUsageAveragesChart canvas nem található');
                return;
            }
            if (window.networkUsageAveragesChartInstance) {
                window.networkUsageAveragesChartInstance.destroy();
            }
            if (data.message === "Hiba történt") {
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt', ctx.canvas.width / 2, ctx.canvas.height / 2);
                return;
            }

            console.log('Szerver válasz (Hálózat):', data);

            const expectedHours = Array.from({ length: 24 }, (_, i) => i < 23 ? `${i}:00` : '23:59');
            const hours = data.hours && data.hours.length > 0 ? data.hours : expectedHours;

            const inAvg = new Array(24).fill(0);
            const outAvg = new Array(24).fill(0);
            if (data.in_avg && data.out_avg && data.in_avg.length > 0 && data.out_avg.length > 0) {
                data.in_avg.forEach((value, index) => {
                    if (index < 24) inAvg[index] = value;
                });
                data.out_avg.forEach((value, index) => {
                    if (index < 24) outAvg[index] = value;
                });
            }

            window.networkUsageAveragesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [
                        {
                            label: 'Bejövő (MB/s)',
                            data: inAvg,
                            borderColor: '#facc15',
                            backgroundColor: 'rgba(250, 204, 21, 0.3)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                            pointBackgroundColor: '#facc15',
                        },
                        {
                            label: 'Kimenő (MB/s)',
                            data: outAvg,
                            borderColor: '#f472b6',
                            backgroundColor: 'rgba(244, 114, 182, 0.3)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                            pointBackgroundColor: '#f472b6',
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#4a5568' },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: 'MB/s',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#e2e8f0', font: { size: 10 } },
                            title: {
                                display: true,
                                text: 'Óra',
                                color: '#e2e8f0',
                                font: { size: 12 }
                            }
                        },
                    },
                    plugins: {
                        legend: { labels: { color: '#e2e8f0', font: { size: 10 } } },
                        tooltip: {
                            backgroundColor: '#1a202c',
                            titleColor: '#e2e8f0',
                            bodyColor: '#e2e8f0',
                            position: 'nearest',
                            caretSize: 5,
                            caretPadding: 5,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} MB/s`;
                                }
                            }
                        },
                    },
                },
            });
        })
        .catch(error => {
            const ctx = document.getElementById('networkUsageAveragesChart')?.getContext('2d');
            if (ctx) {
                if (window.networkUsageAveragesChartInstance) {
                    window.networkUsageAveragesChartInstance.destroy();
                }
                ctx.canvas.height = 200;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText('Hiba történt a lekérdezés során', ctx.canvas.width / 2, ctx.canvas.height / 2);
            }
            console.error('Hiba a hálózati átlagok lekérdezésekor:', error);
        });
}

function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    if (modal && modalBody) {
        modalBody.innerHTML = content;
        modal.classList.add('show');
    } else {
        console.error('Modal vagy modal-body elem nem található');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('show');
        if (window.cpuUsageAveragesChartInstance) {
            window.cpuUsageAveragesChartInstance.destroy();
            window.cpuUsageAveragesChartInstance = null;
        }
        if (window.ramUsageAveragesChartInstance) {
            window.ramUsageAveragesChartInstance.destroy();
            window.ramUsageAveragesChartInstance = null;
        }
        if (window.networkUsageAveragesChartInstance) {
            window.networkUsageAveragesChartInstance.destroy();
            window.networkUsageAveragesChartInstance = null;
        }
    }
}

const modalClose = document.querySelector('.modal-close');
if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
}

async function fetchStatusHistory() {
    try {
        const response = await fetch('/api/status_history');
        const history = await response.json();
        statusHistory = history;

        const statusBars = document.getElementById('status-bars');
        if (statusBars) {
            statusBars.innerHTML = '';
            statusHistory.forEach((entry, index) => {
                const bar = document.createElement('div');
                bar.className = `status-bar status-bar-${entry.status}`;
                bar.innerHTML = `<span class="status-bar-tooltip">${entry.tooltip}</span>`;
                if (entry.status === 'partial') {
                    bar.addEventListener('click', () => {
                        const downtimes = entry.downtimes.length > 0 ? entry.downtimes.map(dt => `<div class="log-entry">Elérhetetlen: ${dt}</div>`).join('') : '<p>Nincs részletes adat.</p>';
                        showModal(`<h3>Leállási Napló: ${entry.hour}</h3>${downtimes}`);
                    });
                }
                statusBars.appendChild(bar);
            });
        }
    } catch (error) {
        console.error('Hiba az állapot előzmények lekérdezésekor:', error);
    }
}

async function fetchNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();
        const notificationList = document.getElementById('notification-list');
        const dropdown = document.getElementById('notification-dropdown');
        const popup = document.getElementById('popup-notification');

        if (!notificationList || !dropdown || !popup) {
            console.error('Értesítési elemek nem találhatók');
            return;
        }

        let hasNew = false;
        notifications.forEach(notification => {
            const notificationKey = `${notification.id}-${notification.message}`;
            if (!processedNotifications.has(notificationKey)) {
                processedNotifications.add(notificationKey);
                notificationCount++;
                hasNew = true;
                const audio = document.getElementById('notification-sound');
                if (audio) {
                    audio.play().catch(err => console.log('Hang lejátszási hiba:', err));
                }
                popup.textContent = notification.message;
                popup.classList.add('show');
                setTimeout(() => popup.classList.remove('show'), 3000);
            }
        });

        if (hasNew && !dropdown.classList.contains('show')) {
            dropdown.classList.add('alert');
        }

        lastNotifications = notifications;
        const notificationCountElement = document.getElementById('notification-count');
        if (notificationCountElement) {
            notificationCountElement.textContent = notificationCount;
        }

        notificationList.innerHTML = '';
        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div class="notification-content">
                    <div class="timestamp">${notification.timestamp}</div>
                    <div class="message">${notification.message}</div>
                </div>
                <button onclick="deleteNotification(${notification.id})">Törlés</button>
            `;
            notificationList.appendChild(item);
        });
    } catch (error) {
        console.error('Hiba az értesítések lekérdezésekor:', error);
    }
}

async function deleteNotification(id) {
    try {
        const response = await fetch(`/api/notifications/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            processedNotifications = new Set([...processedNotifications].filter(key => !key.startsWith(`${id}-`)));
            await fetchNotifications();
        } else {
            console.error('Értesítés törlése sikertelen:', result.error);
        }
    } catch (error) {
        console.error('Hiba az értesítés törlésekor:', error);
    }
}

async function clearAllNotifications() {
    try {
        for (const notification of lastNotifications) {
            await fetch(`/api/notifications/delete/${notification.id}`, { method: 'DELETE' });
        }
        processedNotifications.clear();
        notificationCount = 0;
        await fetchNotifications();
    } catch (error) {
        console.error('Hiba az összes értesítés törlésekor:', error);
    }
}

async function fetchStorage(firstRefresh = false) {
    try {
        const response = await fetch('/api/storage');
        const storageList = await response.json();
        if (storageList.error) throw new Error(storageList.error);

        const storageContainer = document.getElementById('storage-list');
        if (!storageContainer) {
            console.error('Storage-list elem nem található');
            return;
        }

        storageContainer.innerHTML = '';
        storageList.forEach(storage => {
            const storageItem = document.createElement('div');
            storageItem.className = `storage-item ${storage.availability === 'unmounted' ? 'unmounted' : ''}`;
            const uptime = storage.uptime !== undefined ? storage.uptime : 0;
            if (!serverAvailable || storage.availability !== 'available') {
                storageItem.innerHTML = `
                    <i class="fas fa-hdd"></i>
                    <div class="storage-details">
                        <p>${storage.name}: ${storage.availability === 'unmounted' ? 'Unmounted' : 'Nem elérhető'}</p>
                    </div>
                    ${createCircularProgress(uptime)}
                `;
            } else {
                storageItem.innerHTML = `
                    <i class="fas fa-hdd"></i>
                    <div class="storage-details">
                        <p>${storage.name}: ${storage.used.toFixed(2)} GB / ${storage.total.toFixed(2)} GB (${storage.percent.toFixed(1)}%)</p>
                        <div class="progress-bar">
                            <div class="progress-bar-fill ${storage.status}" style="width: ${storage.percent}%"></div>
                        </div>
                    </div>
                    ${createCircularProgress(uptime)}
                `;
            }
            storageContainer.appendChild(storageItem);
        });
    } catch (error) {
        console.error('Hiba a tárolók lekérdezésekor:', error);
        const storageContainer = document.getElementById('storage-list');
        if (storageContainer) {
            storageContainer.innerHTML = '<p>Hiba a tárolók betöltésekor.</p>';
        }
    }
}

async function fetchTemperature() {
    try {
        const response = await fetch('/api/temperature');
        const data = await response.json();
        const tempElement = document.getElementById('temperature');
        if (tempElement) {
            if (data.temp_avg === 0) {
                tempElement.textContent = 'Hőmérséklet: Nem elérhető';
            } else {
                tempElement.textContent = `Hőmérséklet: ${data.temp_avg} °C`;
            }
        }
    } catch (error) {
        console.error('Hiba a hőmérséklet lekérdezésekor:', error);
        const tempElement = document.getElementById('temperature');
        if (tempElement) {
            tempElement.textContent = 'Hőmérséklet: Nem elérhető';
        }
    }
}

async function fetchData() {
    let wasServerAvailable = serverAvailable;
    try {
        const nodeResponse = await fetch('/api/node');
        const nodeData = await nodeResponse.json();
        if (nodeData.error) throw new Error(nodeData.error);

        serverAvailable = true;

        const cpuUsage = (nodeData.cpu * 100).toFixed(2);
        const ramUsage = ((nodeData.memory_used / nodeData.memory_total) * 100).toFixed(2);
        const nodeNameElement = document.getElementById('node-name');
        const cpuUsageElement = document.getElementById('cpu-usage');
        const ramUsageElement = document.getElementById('ram-usage');
        const ramDetailsElement = document.getElementById('ram-details');
        const networkInElement = document.getElementById('network-in');
        const networkOutElement = document.getElementById('network-out');
        const lastUpdateElement = document.getElementById('last-update');
        const statusIndicatorElement = document.getElementById('status-indicator');

        if (nodeNameElement) nodeNameElement.textContent = nodeData.node_name;
        if (cpuUsageElement) cpuUsageElement.textContent = `${cpuUsage}%`;
        if (ramUsageElement) ramUsageElement.textContent = `${ramUsage}%`;
        if (ramDetailsElement) {
            const usedGB = (nodeData.memory_used / 1024 / 1024 / 1024).toFixed(2);
            const totalGB = (nodeData.memory_total / 1024 / 1024 / 1024).toFixed(2);
            ramDetailsElement.textContent = `${usedGB} GB / ${totalGB} GB`;
        }
        const currentTime = Date.now();
        const timeDiff = Math.max((currentTime - prevNetwork.time) / 1000, 0.1);
        const networkIn = Math.max(((nodeData.network_out - prevNetwork.out) / timeDiff / 1024 / 1024), 0).toFixed(2);
        const networkOut = Math.max(((nodeData.network_in - prevNetwork.in) / timeDiff / 1024 / 1024), 0).toFixed(2);
        prevNetwork = { in: nodeData.network_in, out: nodeData.network_out, time: currentTime };

        if (networkInElement) networkInElement.textContent = `${networkIn} MB/s`;
        if (networkOutElement) networkOutElement.textContent = `${networkOut} MB/s`;

        cpuChart.data.labels.push(new Date().toLocaleTimeString());
        cpuChart.data.datasets[0].data.push(cpuUsage);
        if (cpuChart.data.labels.length > 10) {
            cpuChart.data.labels.shift();
            cpuChart.data.datasets[0].data.shift();
        }
        cpuChart.update();

        ramChart.data.labels.push(new Date().toLocaleTimeString());
        ramChart.data.datasets[0].data.push(ramUsage);
        if (ramChart.data.labels.length > 10) {
            ramChart.data.labels.shift();
            ramChart.data.datasets[0].data.shift();
        }
        ramChart.update();

        networkChart.data.labels.push(new Date().toLocaleTimeString());
        networkChart.data.datasets[0].data.push(networkIn);
        networkChart.data.datasets[1].data.push(networkOut);
        if (networkChart.data.labels.length > 10) {
            networkChart.data.labels.shift();
            networkChart.data.datasets[0].data.shift();
            networkChart.data.datasets[1].data.shift();
        }
        networkChart.update();

        const vmsResponse = await fetch('/api/vms');
        const vms = await vmsResponse.json();
        if (vms.error) throw new Error(vms.error);

        const vmTableBody = document.getElementById('vm-table-body');
        if (vmTableBody) {
            vmTableBody.innerHTML = '';
            vms.forEach(vm => {
                const days = Math.floor(vm.uptime / (3600 * 24));
                const hours = Math.floor((vm.uptime % (3600 * 24)) / 3600);
                const minutes = Math.floor((vm.uptime % 3600) / 60);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vm.type}</td>
                    <td>${vm.name}</td>
                    <td><span class="${vm.status === 'running' ? 'status-up' : 'status-down'}">${vm.status === 'running' ? 'Fut' : 'Leállítva'}</span></td>
                    <td>${(vm.cpu * 100).toFixed(2)}%</td>
                    <td>${((vm.mem / vm.maxmem) * 100).toFixed(2)}%</td>
                    <td>${days} nap, ${hours} óra, ${minutes} perc</td>
                `;
                row.addEventListener('click', () => {
                    let totalDiskGB = 0;
                    const config = vm.config;
                    for (const [key, value] of Object.entries(config)) {
                        if (key.startsWith(('sata', 'scsi', 'ide', 'virtio')) && typeof value === 'string') {
                            const match = value.match(/size=(\d+)([GT])/i);
                            if (match) {
                                let size = parseInt(match[1], 10);
                                const unit = match[2].toUpperCase();
                                if (unit === 'T') size *= 1024;
                                totalDiskGB += size;
                            }
                        }
                    }
                    if (vm.type === 'CT') {
                        if (config.rootfs) {
                            const match = config.rootfs.match(/size=(\d+)([GT])/i);
                            if (match) {
                                let size = parseInt(match[1], 10);
                                const unit = match[2].toUpperCase();
                                if (unit === 'T') size *= 1024;
                                totalDiskGB += size;
                            }
                        }
                        for (let i = 0; i <= 9; i++) {
                            const mpKey = `mp${i}`;
                            if (config[mpKey]) {
                                const match = config[mpKey].match(/size=(\d+)([GT])/i);
                                if (match) {
                                    let size = parseInt(match[1], 10);
                                    const unit = match[2].toUpperCase();
                                    if (unit === 'T') size *= 1024;
                                    totalDiskGB += size;
                                }
                            }
                        }
                    }

                    const cpuCores = vm.cores || 'N/A';
                    const memoryMB = config.memory ? parseInt(config.memory, 10) : (vm.maxmem / 1024 / 1024).toFixed(2);

                    const details = `
                        <div class="vm-details-container">
                            <h3>${vm.type}: ${vm.name}</h3>
                            <div class="vm-details-grid">
                                <div class="vm-detail-card">
                                    <h4>Állapot</h4>
                                    <p class="${vm.status === 'running' ? 'status-up' : 'status-down'}">${vm.status === 'running' ? 'Fut' : 'Leállítva'}</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>CPU Használat</h4>
                                    <p>${(vm.cpu * 100).toFixed(2)}%</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>CPU Magok</h4>
                                    <p>${cpuCores}</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>RAM Kiosztás</h4>
                                    <p>${memoryMB} MB</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>RAM Használat</h4>
                                    <p>${(vm.mem / 1024 / 1024).toFixed(2)} MB / ${(vm.maxmem / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>Tárhely</h4>
                                    <p>${totalDiskGB.toFixed(2)} GB</p>
                                </div>
                                <div class="vm-detail-card">
                                    <h4>Futási Idő</h4>
                                    <p>${days} nap, ${hours} óra, ${minutes} perc</p>
                                </div>
                            </div>
                        </div>
                    `;
                    showModal(details);
                });
                vmTableBody.appendChild(row);
            });
        }

        const uptimeResponse = await fetch('/api/uptime');
        const uptimeData = await uptimeResponse.json();
        if (uptimeData.error) throw new Error(uptimeData.error);

        const uptime = uptimeData.uptime;
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement) {
            uptimeElement.textContent = `${days} nap, ${hours} óra`;
        }

        if (statusIndicatorElement) {
            statusIndicatorElement.textContent = 'Elérhető';
            statusIndicatorElement.classList.remove('status-down', 'status-partial');
            statusIndicatorElement.classList.add('status-up');
        }

        if (lastUpdateElement) {
            lastUpdateElement.textContent = nodeData.last_update;
        }

        if (!wasServerAvailable && serverAvailable) {
            await fetchStorage(true);
        }

        await fetchTemperature();
    } catch (error) {
        console.error('Hiba az adatok lekérdezésekor:', error);
        serverAvailable = false;
        const statusIndicatorElement = document.getElementById('status-indicator');
        const nodeNameElement = document.getElementById('node-name');
        const cpuUsageElement = document.getElementById('cpu-usage');
        const ramUsageElement = document.getElementById('ram-usage');
        const ramDetailsElement = document.getElementById('ram-details');
        const networkInElement = document.getElementById('network-in');
        const networkOutElement = document.getElementById('network-out');
        const uptimeElement = document.getElementById('uptime');
        const vmTableBody = document.getElementById('vm-table-body');
        const lastUpdateElement = document.getElementById('last-update');
        const tempElement = document.getElementById('temperature');

        if (statusIndicatorElement) {
            statusIndicatorElement.textContent = 'Nem elérhető';
            statusIndicatorElement.classList.remove('status-up', 'status-partial');
            statusIndicatorElement.classList.add('status-down');
        }
        if (nodeNameElement) nodeNameElement.textContent = 'N/A';
        if (cpuUsageElement) cpuUsageElement.textContent = 'N/A';
        if (ramUsageElement) ramUsageElement.textContent = 'N/A';
        if (ramDetailsElement) ramDetailsElement.textContent = 'N/A';
        if (networkInElement) networkInElement.textContent = 'N/A';
        if (networkOutElement) networkOutElement.textContent = 'N/A';
        if (uptimeElement) uptimeElement.textContent = 'N/A';
        if (vmTableBody) vmTableBody.innerHTML = '<tr><td colspan="6">Hiba a VM-ek/CT-k betöltésekor.</td></tr>';
        if (lastUpdateElement) lastUpdateElement.textContent = 'N/A';
        if (tempElement) tempElement.textContent = 'Hőmérséklet: Nem elérhető';
    }

    await fetchStatusHistory();
    await fetchNotifications();
}

const notificationBell = document.querySelector('.notification-bell');
if (notificationBell) {
    notificationBell.addEventListener('click', () => {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                notificationCount = 0;
                const notificationCountElement = document.getElementById('notification-count');
                if (notificationCountElement) {
                    notificationCountElement.textContent = '0';
                }
                dropdown.classList.remove('alert');
            }
        }
    });
}

const clearAllNotificationsButton = document.getElementById('clear-all-notifications');
if (clearAllNotificationsButton) {
    clearAllNotificationsButton.addEventListener('click', clearAllNotifications);
}

const darkModeToggle = document.querySelector('.dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

fetchData();
setInterval(fetchData, 5000);

fetchStorage(true);
setInterval(() => fetchStorage(false), 600000);