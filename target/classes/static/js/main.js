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

// 检查认证状态
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 加载系统状态数据
function loadSystemStatus() {
    fetch('/api/system/info', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 401) {
            // 认证失败，重定向到登录页
            window.location.href = 'login.html';
            throw new Error('认证失败');
        } else {
            throw new Error('获取系统状态失败');
        }
    })
    .then(data => {
        // 更新存储状态
        document.getElementById('storagePercent').textContent = data.storageUsagePercent + '%';
        document.getElementById('storageTotal').textContent = formatBytes(data.storageTotal);
        document.getElementById('storageAvailable').textContent = formatBytes(data.storageTotal - data.storageUsed);
        
        // 更新CPU和内存状态
        document.getElementById('userTotal').textContent = data.onlineUsers || '0';
        document.getElementById('userOperator').textContent = data.operatorUsers || '0';
        document.getElementById('userNormal').textContent = data.normalUsers || '0';
    })
    .catch(error => {
        console.error('加载系统状态错误:', error);
    });
}

// 加载设备状态数据
function loadDeviceStatus() {
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
    .then(devices => {
        // 更新设备统计
        const total = devices.length;
        const online = devices.filter(d => d.status === 'ONLINE').length;
        const offline = total - online;
        
        document.getElementById('deviceTotal').textContent = total;
        document.getElementById('deviceOnline').textContent = '在线: ' + online;
        document.getElementById('deviceOffline').textContent = '离线: ' + offline;
        
        // 更新设备列表
        const deviceList = document.getElementById('deviceStatusList');
        deviceList.innerHTML = '';
        
        // 只显示前5个设备
        const displayDevices = devices.slice(0, 5);
        
        displayDevices.forEach(device => {
            const li = document.createElement('li');
            li.className = 'device-item';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'device-name';
            nameDiv.textContent = device.name;
            
            const statusDiv = document.createElement('div');
            statusDiv.className = 'device-status ' + (device.status === 'ONLINE' ? 'status-online' : 'status-offline');
            statusDiv.textContent = device.status === 'ONLINE' ? '在线' : '离线';
            
            li.appendChild(nameDiv);
            li.appendChild(statusDiv);
            deviceList.appendChild(li);
        });
        
        // 加载视频预览
        loadVideoPreview(devices.filter(d => d.status === 'ONLINE').slice(0, 4));
    })
    .catch(error => {
        console.error('加载设备状态错误:', error);
    });
}

// 加载视频预览
function loadVideoPreview(devices) {
    const videoGrid = document.getElementById('videoPreviewGrid');
    videoGrid.innerHTML = '';
    
    devices.forEach(device => {
        const div = document.createElement('div');
        div.className = 'video-item';
        
        // 使用设备快照作为预览图
        const img = document.createElement('img');
        img.src = `/api/video/snapshot/${device.id}?t=${new Date().getTime()}`; // 添加时间戳防止缓存
        img.alt = device.name;
        
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.textContent = device.name;
        
        div.appendChild(img);
        div.appendChild(overlay);
        
        // 点击跳转到监控页面
        div.addEventListener('click', () => {
            window.location.href = `monitor.html?device=${device.id}`;
        });
        
        videoGrid.appendChild(div);
    });
}

// 加载报警数据
function loadAlarmData() {
    fetch('/api/alarm/list?status=UNHANDLED', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取报警列表失败');
        }
    })
    .then(data => {
        const alarms = data.content || [];
        
        // 更新报警统计
        const total = alarms.length;
        const urgent = alarms.filter(a => a.level === 'URGENT').length;
        const unhandled = alarms.filter(a => a.status === 'UNHANDLED').length;
        
        document.getElementById('alarmTotal').textContent = total;
        document.getElementById('alarmUrgent').textContent = '紧急: ' + urgent;
        document.getElementById('alarmUnhandled').textContent = unhandled;
        
        // 更新报警列表
        const alarmList = document.getElementById('recentAlarmList');
        alarmList.innerHTML = '';
        
        // 只显示最近5个报警
        const recentAlarms = alarms.slice(0, 5);
        
        recentAlarms.forEach(alarm => {
            const li = document.createElement('li');
            li.className = 'alarm-item';
            
            const deviceDiv = document.createElement('div');
            deviceDiv.className = 'alarm-device';
            deviceDiv.textContent = alarm.deviceName;
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'alarm-info';
            
            const typeDiv = document.createElement('div');
            typeDiv.className = 'alarm-type';
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'alarm-icon';
            iconSpan.textContent = getAlarmIcon(alarm.type);
            
            const typeSpan = document.createElement('span');
            typeSpan.textContent = getAlarmTypeName(alarm.type);
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'alarm-time';
            timeDiv.textContent = formatTime(alarm.createTime);
            
            typeDiv.appendChild(iconSpan);
            typeDiv.appendChild(typeSpan);
            infoDiv.appendChild(typeDiv);
            infoDiv.appendChild(timeDiv);
            
            li.appendChild(deviceDiv);
            li.appendChild(infoDiv);
            alarmList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('加载报警数据错误:', error);
    });
}

// 获取报警图标
function getAlarmIcon(type) {
    switch (type) {
        case 'MOTION_DETECT':
            return '🚨';
        case 'AREA_INTRUSION':
            return '⚠️';
        case 'DEVICE_OFFLINE':
            return '📴';
        default:
            return '🔔';
    }
}

// 获取报警类型名称
function getAlarmTypeName(type) {
    switch (type) {
        case 'MOTION_DETECT':
            return '移动侦测';
        case 'AREA_INTRUSION':
            return '区域入侵';
        case 'DEVICE_OFFLINE':
            return '设备离线';
        default:
            return '未知报警';
    }
}

// 格式化时间
function formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60 * 1000) {
        return '刚刚';
    }
    // 小于1小时
    else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 小于24小时
    else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 大于24小时
    else {
        return date.getFullYear() + '-' + 
               padZero(date.getMonth() + 1) + '-' + 
               padZero(date.getDate()) + ' ' + 
               padZero(date.getHours()) + ':' + 
               padZero(date.getMinutes());
    }
}

// 数字补零
function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// 格式化字节大小
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    // 加载数据
    loadSystemStatus();
    loadDeviceStatus();
    loadAlarmData();
    
    // 设置定时刷新（每30秒刷新一次）
    setInterval(() => {
        loadSystemStatus();
        loadDeviceStatus();
        loadAlarmData();
    }, 30000);
});
