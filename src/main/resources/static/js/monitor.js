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
let videoStream = null;
let macVideoStream = null;
let activeVideoPanel = null;

// 页面加载完成后的初始化函数
document.addEventListener('DOMContentLoaded', async function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    try {
        await initializeVideoGrid();
        setupEventListeners();
    } catch (error) {
        console.error('初始化失败:', error);
        showError('初始化失败: ' + error.message);
    }
});

async function initializeVideoGrid() {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        throw new Error('找不到视频网格元素');
    }

    // 创建并添加Mac摄像头面板
    const macPanel = createVideoPanel(0);
    videoGrid.appendChild(macPanel);
    activeVideoPanel = macPanel;

    // 启动Mac摄像头
    await startMacCamera(macPanel.querySelector('video'));

    // 添加其他空面板
    for (let i = 1; i < 4; i++) {
        videoGrid.appendChild(createEmptyPanel(i));
    }
}

function createVideoPanel(index) {
    const panel = document.createElement('div');
    panel.className = 'video-panel';
    panel.innerHTML = `
        <video id="video-${index}" autoplay playsinline></video>
        <div class="video-label">Mac摄像头</div>
        <div class="video-controls-overlay">
            <button class="video-btn" onclick="takeSnapshot(${index})">
                <i class="fas fa-camera"></i>
            </button>
            <button class="video-btn record" onclick="toggleRecording(${index})">
                <i class="fas fa-circle"></i>
            </button>
        </div>
    `;
    return panel;
}

function createEmptyPanel(index) {
    const panel = document.createElement('div');
    panel.className = 'video-panel empty';
    panel.innerHTML = `
        <div class="empty-panel">
            <i class="fas fa-video-slash"></i>
            <span>未连接</span>
        </div>
    `;
    return panel;
}

async function startMacCamera(videoElement) {
    try {
        if (macVideoStream) {
            macVideoStream.getTracks().forEach(track => track.stop());
        }

        macVideoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        videoElement.srcObject = macVideoStream;
        await videoElement.play();
        console.log('Mac摄像头已启动');
    } catch (error) {
        console.error('启动Mac摄像头失败:', error);
        throw error;
    }
}

function setupEventListeners() {
    // 布局切换按钮
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止默认行为
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 拍照按钮
    document.getElementById('snapshotBtn').addEventListener('click', () => {
        if (activeVideoPanel) {
            takeSnapshot(0);
        }
    });
}

// 初始化摄像头
async function initializeCamera(videoElement) {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480
            }
        });
        videoElement.srcObject = videoStream;
        console.log('Mac摄像头已启动');
    } catch (error) {
        console.error('摄像头访问失败:', error);
        showError('无法访问Mac摄像头: ' + error.message);
    }
}

// 初始化视频网格
async function initVideoGrid() {
    const videoGrid = document.getElementById('videoGrid');
    
    // 创建第一个视频面板（Mac摄像头）
    const macPanel = createVideoPanel(0, 'Mac摄像头');
    videoGrid.appendChild(macPanel);
    
    // 初始化Mac摄像头
    await initializeMacCamera(macPanel.querySelector('video'));
    
    // 创建其他三个视频面板
    for (let i = 1; i < 4; i++) {
        const panel = createVideoPanel(i, `摄像头 ${i}`);
        videoGrid.appendChild(panel);
    }
}

// 创建视频面板
function createVideoPanel(index, label) {
    const panel = document.createElement('div');
    panel.className = 'video-panel';
    
    const video = document.createElement('video');
    video.id = `video-${index}`;
    video.autoplay = true;
    video.playsInline = true;
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'video-label';
    labelDiv.textContent = label;
    
    const controls = document.createElement('div');
    controls.className = 'video-controls-overlay';
    controls.innerHTML = `
        <button class="video-btn" onclick="takeSnapshot(${index})">
            <i class="fas fa-camera"></i>
        </button>
    `;
    
    panel.appendChild(video);
    panel.appendChild(labelDiv);
    panel.appendChild(controls);
    
    return panel;
}

// 初始化Mac摄像头
async function initializeMacCamera(videoElement) {
    try {
        macVideoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720
            }
        });
        videoElement.srcObject = macVideoStream;
        console.log('Mac摄像头已启动');
    } catch (error) {
        console.error('摄像头访问失败:', error);
        showError(`无法访问Mac摄像头: ${error.message}`);
    }
}

// 初始化视频网格
function initializeVideoGrid() {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = ''; // 清空现有内容

    // 创建4个视频面板
    for (let i = 0; i < 4; i++) {
        const videoPanel = document.createElement('div');
        videoPanel.className = 'video-panel';
        
        const video = document.createElement('video');
        video.id = `video-${i}`;
        video.autoplay = true;
        video.playsInline = true;
        
        // 第一个面板使用Mac摄像头
        if (i === 0) {
            initializeCamera(video);
            
            // 添加标签
            const label = document.createElement('div');
            label.className = 'video-label';
            label.textContent = 'Mac摄像头';
            videoPanel.appendChild(label);
        } else {
            // 其他面板显示离线状态
            const placeholder = document.createElement('div');
            placeholder.className = 'video-placeholder';
            placeholder.textContent = '未连接';
            videoPanel.appendChild(placeholder);
        }
        
        videoPanel.appendChild(video);
        videoGrid.appendChild(videoPanel);
    }
}

// 切换布局
function switchLayout(layout) {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.className = `video-grid grid-${layout}`;
    // 保持Mac摄像头在切换布局后继续工作
}

// 拍照功能
function takeSnapshot(index) {
    const video = document.getElementById(`video-${index}`);
    if (!video.srcObject) {
        showError('该摄像头未启动');
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 保存图片
    const link = document.createElement('a');
    link.download = `snapshot-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 页面关闭时清理资源
window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    if (macVideoStream) {
        macVideoStream.getTracks().forEach(track => track.stop());
    }
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

// 显示错误消息
function showError(message) {
    // 可以根据需要实现错误提示UI
    alert(message);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initVideoGrid);

// 初始化函数
async function initializeMonitor() {
    console.log('正在初始化监控页面...');
    await setupVideoGrid();
}

// 设置视频网格
async function setupVideoGrid() {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('找不到视频网格元素');
        return;
    }

    // 清空现有内容
    videoGrid.innerHTML = '';

    // 创建第一个视频面板（Mac摄像头）
    const macPanel = createVideoPanel();
    videoGrid.appendChild(macPanel);

    // 初始化Mac摄像头
    try {
        await initializeMacCamera(macPanel.querySelector('video'));
    } catch (error) {
        console.error('初始化Mac摄像头失败:', error);
    }

    // 添加其他三个空面板
    for (let i = 0; i < 3; i++) {
        const emptyPanel = createEmptyPanel();
        videoGrid.appendChild(emptyPanel);
    }
}

// 创建视频面板
function createVideoPanel() {
    const panel = document.createElement('div');
    panel.className = 'video-panel';
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    
    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = 'Mac摄像头';
    
    const controls = document.createElement('div');
    controls.className = 'video-controls-overlay';
    controls.innerHTML = `
        <button class="video-btn" onclick="takeSnapshot(this)">
            <i class="fas fa-camera"></i>
        </button>
        <button class="video-btn record" onclick="toggleRecording(this)">
            <i class="fas fa-circle"></i>
        </button>
    `;
    
    panel.appendChild(video);
    panel.appendChild(label);
    panel.appendChild(controls);
    
    return panel;
}

// 创建空面板
function createEmptyPanel() {
    const panel = document.createElement('div');
    panel.className = 'video-panel';
    
    const empty = document.createElement('div');
    empty.className = 'empty-panel';
    empty.innerHTML = `
        <div class="empty-icon">
            <i class="fas fa-video-slash"></i>
        </div>
        <div>未连接</div>
    `;
    
    panel.appendChild(empty);
    return panel;
}

// 初始化Mac摄像头
async function initializeMacCamera(videoElement) {
    try {
        console.log('正在请求摄像头权限...');
        macVideoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        videoElement.srcObject = macVideoStream;
        console.log('Mac摄像头已成功初始化');
        
        // 添加视频播放事件监听
        videoElement.onplay = () => console.log('视频开始播放');
        videoElement.onerror = (e) => console.error('视频播放错误:', e);
    } catch (error) {
        console.error('访问摄像头失败:', error);
        throw error;
    }
}

// 切换布局
function switchLayout(type) {
    // 更新布局按钮状态
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.querySelector('span').textContent.includes(getLayoutText(type))) {
            btn.classList.add('active');
        }
    });

    // 更新视频网格布局
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.className = `video-grid grid-${type}`;
    
    // 根据布局类型调整视频面板
    adjustPanels(type);
}

// 获取布局文本
function getLayoutText(type) {
    switch(type) {
        case '1': return '单屏';
        case '4': return '四分屏';
        case '9': return '九分屏';
        default: return '';
    }
}

// 调整视频面板数量
function adjustPanels(type) {
    const videoGrid = document.getElementById('videoGrid');
    const currentPanels = videoGrid.children.length;
    const targetPanels = parseInt(type);
    
    // 如果需要添加面板
    while (videoGrid.children.length < targetPanels) {
        const index = videoGrid.children.length;
        const panel = index === 0 ? createVideoPanel(0) : createEmptyPanel(index);
        videoGrid.appendChild(panel);
    }
    
    // 如果需要移除面板
    while (videoGrid.children.length > targetPanels) {
        videoGrid.removeChild(videoGrid.lastChild);
    }
    
    // 确保第一个面板始终显示Mac摄像头
    if (!videoGrid.querySelector('video')) {
        const firstPanel = createVideoPanel(0);
        videoGrid.insertBefore(firstPanel, videoGrid.firstChild);
        initializeMacCamera(firstPanel.querySelector('video'));
    }
}

// 设置页面加载时的初始布局
document.addEventListener('DOMContentLoaded', () => {
    switchLayout('4'); // 默认四分屏
});

// 拍照功能
function takeSnapshot(button) {
    const panel = button.closest('.video-panel');
    const video = panel.querySelector('video');
    
    if (!video || !video.srcObject) {
        alert('摄像头未启动');
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    
    // 保存图片
    const link = document.createElement('a');
    link.download = `snapshot-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeMonitor);

// 页面关闭前清理资源
window.addEventListener('beforeunload', () => {
    if (macVideoStream) {
        macVideoStream.getTracks().forEach(track => track.stop());
    }
});

// 导出布局切换函数
window.switchLayout = switchLayout;
window.takeSnapshot = takeSnapshot;

// 设置事件监听器
function setupEventListeners() {
    // 布局按钮事件
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layout = parseInt(this.getAttribute('data-layout'));
            setVideoLayout(layout);
            this.classList.add('active');
        });
    });
    
    // 其他事件监听器设置...
}
