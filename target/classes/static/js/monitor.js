// 检查认证状态
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 全局变量
let devices = [];
let selectedDevice = null;
let currentLayout = 4;
let isRecording = false;
let activeDevices = [];

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    // 加载设备列表
    loadDevices();
    
    // 设置布局按钮事件
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layout = parseInt(this.getAttribute('data-layout'));
            setVideoLayout(layout);
            
            // 更新按钮状态
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 设置筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterDevices(filter);
            
            // 更新按钮状态
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 设置搜索框事件
    document.querySelector('.device-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchDevices(searchTerm);
    });
    
    // 设置操作按钮事件
    document.getElementById('snapshotBtn').addEventListener('click', captureSnapshot);
    document.getElementById('recordBtn').addEventListener('click', toggleRecording);
    document.getElementById('alarmBtn').addEventListener('click', showAlarmModal);
    
    // 定时刷新视频流（每分钟刷新一次，防止流断开）
    setInterval(refreshVideoStreams, 60000);
});

// 加载设备列表
function loadDevices() {
    fetch('/api/device/list', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取设备列表失败');
        }
    })
    .then(data => {
        devices = data;
        renderDeviceList(devices);
        
        // 默认选择第一个在线设备
        const onlineDevices = devices.filter(d => d.status === 'ONLINE');
        if (onlineDevices.length > 0) {
            selectDevice(onlineDevices[0].id);
        }
        
        // 初始化视频网格
        initVideoGrid();
    })
    .catch(error => {
        console.error('加载设备错误:', error);
    });
}

// 渲染设备列表
function renderDeviceList(deviceList) {
    const container = document.getElementById('deviceList');
    container.innerHTML = '';
    
    deviceList.forEach(device => {
        const div = document.createElement('div');
        div.className = 'device-item';
        div.setAttribute('data-id', device.id);
        div.setAttribute('data-status', device.status);
        
        const header = document.createElement('div');
        header.className = 'device-header';
        
        const name = document.createElement('div');
        name.className = 'device-name';
        name.textContent = device.name;
        
        const status = document.createElement('div');
        status.className = 'device-status ' + (device.status === 'ONLINE' ? 'status-online' : 'status-offline');
        status.textContent = device.status === 'ONLINE' ? '在线' : '离线';
        
        header.appendChild(name);
        header.appendChild(status);
        
        const info = document.createElement('div');
        info.className = 'device-info';
        info.innerHTML = `
            <div>分辨率: ${device.resolution || 'N/A'}</div>
            <div>帧率: ${device.frameRate || 'N/A'}</div>
        `;
        
        const controls = document.createElement('div');
        controls.className = 'device-controls';
        
        const configBtn = document.createElement('button');
        configBtn.className = 'device-btn';
        configBtn.textContent = '配置';
        configBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = `device-management.html?id=${device.id}`;
        });
        
        const recordBtn = document.createElement('button');
        recordBtn.className = 'device-btn';
        recordBtn.textContent = '录制';
        recordBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDeviceRecording(device.id);
        });
        
        const snapshotBtn = document.createElement('button');
        snapshotBtn.className = 'device-btn';
        snapshotBtn.textContent = '快照';
        snapshotBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            captureDeviceSnapshot(device.id);
        });
        
        controls.appendChild(configBtn);
        controls.appendChild(recordBtn);
        controls.appendChild(snapshotBtn);
        
        div.appendChild(header);
        div.appendChild(info);
        div.appendChild(controls);
        
        // 点击设备项选择设备
        div.addEventListener('click', function() {
            selectDevice(device.id);
        });
        
        container.appendChild(div);
    });
}

// 筛选设备
function filterDevices(filter) {
    let filteredDevices = [];
    
    switch (filter) {
        case 'online':
            filteredDevices = devices.filter(d => d.status === 'ONLINE');
            break;
        case 'offline':
            filteredDevices = devices.filter(d => d.status === 'OFFLINE');
            break;
        default:
            filteredDevices = devices;
            break;
    }
    
    renderDeviceList(filteredDevices);
}

// 搜索设备
function searchDevices(term) {
    if (!term) {
        renderDeviceList(devices);
        return;
    }
    
    const filteredDevices = devices.filter(d => 
        d.name.toLowerCase().includes(term) || 
        d.ip?.toLowerCase().includes(term)
    );
    
    renderDeviceList(filteredDevices);
}

// 选择设备
function selectDevice(deviceId) {
    selectedDevice = devices.find(d => d.id === deviceId);
    
    // 更新设备列表选中状态
    document.querySelectorAll('.device-item').forEach(item => {
        if (item.getAttribute('data-id') == deviceId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 如果设备在线，添加到视频网格
    if (selectedDevice && selectedDevice.status === 'ONLINE') {
        addDeviceToGrid(selectedDevice);
    }
}

// 设置视频布局
function setVideoLayout(layout) {
    currentLayout = layout;
    const grid = document.getElementById('videoGrid');
    
    // 移除旧的布局类
    grid.classList.remove('grid-1', 'grid-4', 'grid-9');
    
    // 添加新的布局类
    grid.classList.add(`grid-${layout}`);
    
    // 重新初始化视频网格
    initVideoGrid();
}

// 初始化视频网格
function initVideoGrid() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    // 创建视频面板
    for (let i = 0; i < currentLayout; i++) {
        const panel = document.createElement('div');
        panel.className = 'video-panel';
        panel.id = `panel-${i}`;
        
        const emptyPanel = document.createElement('div');
        emptyPanel.className = 'empty-panel';
        emptyPanel.innerHTML = `
            <div class="empty-icon">📹</div>
            <div>点击设备列表添加视频</div>
        `;
        
        panel.appendChild(emptyPanel);
        grid.appendChild(panel);
    }
    
    // 重置活跃设备列表
    activeDevices = [];
}

// 添加设备到视频网格
function addDeviceToGrid(device) {
    // 如果设备已经在网格中，不重复添加
    if (activeDevices.includes(device.id)) {
        return;
    }
    
    // 找到第一个空闲的面板
    let targetPanel = null;
    for (let i = 0; i < currentLayout; i++) {
        const panel = document.getElementById(`panel-${i}`);
        if (!panel.querySelector('img.video-frame')) {
            targetPanel = panel;
            break;
        }
    }
    
    // 如果没有空闲面板，使用第一个面板
    if (!targetPanel) {
        targetPanel = document.getElementById('panel-0');
    }
    
    // 清空面板
    targetPanel.innerHTML = '';
    
    // 创建视频流
    const img = document.createElement('img');
    img.className = 'video-frame';
    img.src = `/api/video/live/${device.id}`;
    img.alt = device.name;
    
    // 创建视频信息覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    
    const title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = device.name;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'video-timestamp';
    timestamp.id = `timestamp-${device.id}`;
    updateTimestamp(timestamp);
    
    overlay.appendChild(title);
    overlay.appendChild(timestamp);
    
    // 创建控制按钮覆盖层
    const controlsOverlay = document.createElement('div');
    controlsOverlay.className = 'video-controls-overlay';
    
    const snapshotBtn = document.createElement('button');
    snapshotBtn.className = 'video-btn';
    snapshotBtn.innerHTML = '📷';
    snapshotBtn.title = '拍照';
    snapshotBtn.addEventListener('click', function() {
        captureDeviceSnapshot(device.id);
    });
    
    const recordBtn = document.createElement('button');
    recordBtn.className = 'video-btn';
    recordBtn.id = `record-btn-${device.id}`;
    recordBtn.innerHTML = '⏺';
    recordBtn.title = '录制';
    recordBtn.addEventListener('click', function() {
        toggleDeviceRecording(device.id);
    });
    
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'video-btn';
    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.title = '全屏';
    fullscreenBtn.addEventListener('click', function() {
        setVideoLayout(1);
        addDeviceToGrid(device);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'video-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = '关闭';
    closeBtn.addEventListener('click', function() {
        removeDeviceFromGrid(device.id);
    });
    
    controlsOverlay.appendChild(snapshotBtn);
    controlsOverlay.appendChild(recordBtn);
    controlsOverlay.appendChild(fullscreenBtn);
    controlsOverlay.appendChild(closeBtn);
    
    // 添加到面板
    targetPanel.appendChild(img);
    targetPanel.appendChild(overlay);
    targetPanel.appendChild(controlsOverlay);
    
    // 添加到活跃设备列表
    activeDevices.push(device.id);
    
    // 定时更新时间戳
    setInterval(() => {
        const timestampElement = document.getElementById(`timestamp-${device.id}`);
        if (timestampElement) {
            updateTimestamp(timestampElement);
        }
    }, 1000);
}

// 从视频网格移除设备
function removeDeviceFromGrid(deviceId) {
    // 从活跃设备列表中移除
    activeDevices = activeDevices.filter(id => id !== deviceId);
    
    // 找到包含该设备的面板
    for (let i = 0; i < currentLayout; i++) {
        const panel = document.getElementById(`panel-${i}`);
        const overlay = panel.querySelector('.video-overlay');
        
        if (overlay && overlay.querySelector(`#timestamp-${deviceId}`)) {
            // 清空面板
            panel.innerHTML = '';
            
            // 添加空面板提示
            const emptyPanel = document.createElement('div');
            emptyPanel.className = 'empty-panel';
            emptyPanel.innerHTML = `
                <div class="empty-icon">📹</div>
                <div>点击设备列表添加视频</div>
            `;
            
            panel.appendChild(emptyPanel);
            break;
        }
    }
}

// 更新时间戳
function updateTimestamp(element) {
    const now = new Date();
    element.textContent = now.toLocaleTimeString();
}

// 刷新视频流
function refreshVideoStreams() {
    activeDevices.forEach(deviceId => {
        const panels = document.querySelectorAll('.video-panel');
        
        panels.forEach(panel => {
            const overlay = panel.querySelector('.video-overlay');
            if (overlay && overlay.querySelector(`#timestamp-${deviceId}`)) {
                const img = panel.querySelector('img.video-frame');
                if (img) {
                    // 添加时间戳参数刷新图像
                    img.src = `/api/video/live/${deviceId}?t=${new Date().getTime()}`;
                }
            }
        });
    });
}

// 拍照
function captureSnapshot() {
    if (!selectedDevice || selectedDevice.status !== 'ONLINE') {
        alert('请先选择一个在线设备');
        return;
    }
    
    captureDeviceSnapshot(selectedDevice.id);
}

// 为指定设备拍照
function captureDeviceSnapshot(deviceId) {
    // 打开新窗口显示快照
    window.open(`/api/video/snapshot/${deviceId}?t=${new Date().getTime()}`, '_blank');
    
    // 保存快照到服务器
    fetch(`/api/video/snapshot/${deviceId}/save`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('保存快照失败');
        }
    })
    .then(data => {
        console.log('快照已保存:', data.path);
    })
    .catch(error => {
        console.error('保存快照错误:', error);
    });
}

// 切换录制状态
function toggleRecording() {
    if (!selectedDevice || selectedDevice.status !== 'ONLINE') {
        alert('请先选择一个在线设备');
        return;
    }
    
    toggleDeviceRecording(selectedDevice.id);
}

// 切换指定设备的录制状态
function toggleDeviceRecording(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status !== 'ONLINE') {
        return;
    }
    
    const isCurrentlyRecording = document.getElementById(`record-btn-${deviceId}`)?.classList.contains('record');
    
    if (isCurrentlyRecording) {
        // 停止录制
        fetch(`/api/record/stop?deviceId=${deviceId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('停止录制失败');
            }
        })
        .then(data => {
            console.log('录制已停止:', data);
            
            // 更新按钮状态
            const recordBtn = document.getElementById(`record-btn-${deviceId}`);
            if (recordBtn) {
                recordBtn.classList.remove('record');
                recordBtn.innerHTML = '⏺';
                recordBtn.title = '录制';
            }
        })
        .catch(error => {
            console.error('停止录制错误:', error);
        });
    } else {
        // 开始录制
        fetch(`/api/record/start?deviceId=${deviceId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('开始录制失败');
            }
        })
        .then(data => {
            console.log('录制已开始:', data);
            
            // 更新按钮状态
            const recordBtn = document.getElementById(`record-btn-${deviceId}`);
            if (recordBtn) {
                recordBtn.classList.add('record');
                recordBtn.innerHTML = '⏹';
                recordBtn.title = '停止';
            }
        })
        .catch(error => {
            console.error('开始录制错误:', error);
        });
    }
}

// 显示报警模态框
function showAlarmModal() {
    if (!selectedDevice || selectedDevice.status !== 'ONLINE') {
        alert('请先选择一个在线设备');
        return;
    }
    
    document.getElementById('alarmModal').classList.add('show');
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 触发报警
function triggerAlarm() {
    if (!selectedDevice) {
        closeModal('alarmModal');
        return;
    }
    
    fetch('/api/alarm/trigger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify({
            deviceId: selectedDevice.id,
            type: 'MANUAL',
            level: 'IMPORTANT',
            details: '用户手动触发报警'
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('触发报警失败');
        }
    })
    .then(data => {
        console.log('报警已触发:', data);
        closeModal('alarmModal');
    })
    .catch(error => {
        console.error('触发报警错误:', error);
        closeModal('alarmModal');
    });
}

// 用户菜单切换
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// 关闭用户菜单（点击其他区域时）
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (!userMenu.contains(event.target) && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});
