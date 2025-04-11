// 全局变量
let recordings = [];
let devices = [];
let currentRecording = null;
let videoPlayer = null;
let isPlaying = false;
let currentTime = 0;
let totalDuration = 0;
let playbackSpeed = 1.0;
let volume = 0.7;
let isDraggingTimeline = false;
let isDraggingVolume = false;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    // 初始化日期选择器
    initDatePickers();
    
    // 加载设备列表
    loadDevices();
    
    // 加载录像列表
    loadRecordings();
    
    // 初始化播放器
    initPlayer();
    
    // 设置搜索和过滤事件
    document.getElementById('searchBtn').addEventListener('click', function() {
        loadRecordings();
    });
    
    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        resetFilters();
    });
    
    // 设置删除按钮事件
    document.getElementById('deleteBtn').addEventListener('click', function() {
        if (!currentRecording) return;
        
        document.getElementById('deleteRecordId').value = currentRecording.id;
        showModal('deleteConfirmModal');
    });
    
    // 设置下载按钮事件
    document.getElementById('downloadBtn').addEventListener('click', function() {
        if (!currentRecording) return;
        downloadRecording(currentRecording.id);
    });
    
    // 设置截图按钮事件
    document.getElementById('snapshotBtn').addEventListener('click', function() {
        if (!videoPlayer || videoPlayer.paused) return;
        takeSnapshot();
    });
    
    // 设置剪辑按钮事件
    document.getElementById('clipBtn').addEventListener('click', function() {
        if (!currentRecording) return;
        
        document.getElementById('clipRecordId').value = currentRecording.id;
        document.getElementById('clipName').value = currentRecording.deviceName + '_片段_' + formatDate(new Date(), 'yyyyMMdd_HHmmss');
        
        const currentTimeStr = formatTime(currentTime);
        const suggestedEndTime = Math.min(currentTime + 60, totalDuration);
        const endTimeStr = formatTime(suggestedEndTime);
        
        document.getElementById('clipStartTime').value = currentTimeStr;
        document.getElementById('clipEndTime').value = endTimeStr;
        
        showModal('clipModal');
    });
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

// 初始化日期选择器
function initDatePickers() {
    // 设置默认日期范围（最近7天）
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = weekAgo;
    
    // 设置默认时间范围（全天）
    document.getElementById('startTime').value = '00:00';
    document.getElementById('endTime').value = '23:59';
}

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
        } else if (response.status === 401) {
            window.location.href = 'login.html';
            throw new Error('认证失败');
        } else {
            throw new Error('获取设备列表失败');
        }
    })
    .then(data => {
        devices = data;
        
        // 填充设备下拉框
        const deviceFilter = document.getElementById('deviceFilter');
        deviceFilter.innerHTML = '<option value="">所有设备</option>';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = device.name;
            deviceFilter.appendChild(option);
        });
    })
    .catch(error => {
        console.error('加载设备错误:', error);
    });
}

// 加载录像列表
function loadRecordings() {
    // 构建查询参数
    const params = new URLSearchParams();
    
    // 添加过滤条件
    const deviceId = document.getElementById('deviceFilter').value;
    const recordType = document.getElementById('typeFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const searchTerm = document.getElementById('recordingSearch').value;
    
    if (deviceId) params.append('deviceId', deviceId);
    if (recordType) params.append('type', recordType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    if (searchTerm) params.append('search', searchTerm);
    
    fetch(`/api/record/list?${params.toString()}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取录像列表失败');
        }
    })
    .then(data => {
        recordings = data;
        renderRecordings();
    })
    .catch(error => {
        console.error('加载录像列表错误:', error);
    });
}

// 渲染录像列表
function renderRecordings() {
    const listContainer = document.getElementById('recordingList');
    listContainer.innerHTML = '';
    
    if (recordings.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '没有找到符合条件的录像';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '30px 0';
        emptyMessage.style.color = '#777';
        listContainer.appendChild(emptyMessage);
        return;
    }
    
    // 按日期分组
    const recordingsByDate = {};
    
    recordings.forEach(recording => {
        const date = recording.startTime.split('T')[0];
        if (!recordingsByDate[date]) {
            recordingsByDate[date] = [];
        }
        recordingsByDate[date].push(recording);
    });
    
    // 按日期排序（降序）
    const sortedDates = Object.keys(recordingsByDate).sort().reverse();
    
    sortedDates.forEach(date => {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'recording-date';
        dateHeader.textContent = formatDate(new Date(date));
        listContainer.appendChild(dateHeader);
        
        // 按时间排序（降序）
        const sortedRecordings = recordingsByDate[date].sort((a, b) => {
            return new Date(b.startTime) - new Date(a.startTime);
        });
        
        sortedRecordings.forEach(recording => {
            const recordingItem = createRecordingItem(recording);
            listContainer.appendChild(recordingItem);
        });
    });
}

// 创建录像项
function createRecordingItem(recording) {
    const item = document.createElement('div');
    item.className = 'recording-item';
    item.dataset.id = recording.id;
    
    // 如果是当前选中的录像，添加active类
    if (currentRecording && currentRecording.id === recording.id) {
        item.classList.add('active');
    }
    
    const header = document.createElement('div');
    header.className = 'recording-header';
    
    const deviceName = document.createElement('div');
    deviceName.className = 'recording-device';
    deviceName.textContent = getDeviceName(recording.deviceId);
    
    const duration = document.createElement('div');
    duration.className = 'recording-duration';
    duration.textContent = formatDuration(recording.duration);
    
    header.appendChild(deviceName);
    header.appendChild(duration);
    
    const time = document.createElement('div');
    time.className = 'recording-time';
    time.textContent = formatDateTime(recording.startTime);
    
    const type = document.createElement('div');
    type.className = 'recording-type type-' + recording.type.toLowerCase();
    type.textContent = getRecordTypeName(recording.type);
    
    item.appendChild(header);
    item.appendChild(time);
    item.appendChild(type);
    
    // 添加点击事件
    item.addEventListener('click', function() {
        // 移除其他项的active类
        document.querySelectorAll('.recording-item.active').forEach(el => {
            el.classList.remove('active');
        });
        
        // 添加active类
        item.classList.add('active');
        
        // 加载录像
        loadRecording(recording.id);
    });
    
    return item;
}

// 加载录像
function loadRecording(recordId) {
    fetch(`/api/record/detail?id=${recordId}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取录像详情失败');
        }
    })
    .then(recording => {
        currentRecording = recording;
        
        // 更新播放器
        updatePlayer(recording);
        
        // 更新信息面板
        updateInfoPanel(recording);
        
        // 加载缩略图
        loadThumbnails(recording.id);
    })
    .catch(error => {
        console.error('加载录像错误:', error);
    });
}

// 更新播放器
function updatePlayer(recording) {
    // 更新标题
    document.getElementById('playerTitle').textContent = getDeviceName(recording.deviceId) + ' - ' + formatDateTime(recording.startTime);
    
    // 更新视频源
    videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = `/api/record/stream?id=${recording.id}`;
    videoPlayer.style.display = 'block';
    
    // 隐藏空播放器提示
    document.querySelector('.empty-player').style.display = 'none';
    
    // 重置播放状态
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
    
    // 更新时间
    totalDuration = recording.duration;
    currentTime = 0;
    updateTimeDisplay();
    
    // 加载完成后自动播放
    videoPlayer.onloadedmetadata = function() {
        playVideo();
    };
    
    // 更新进度条
    videoPlayer.ontimeupdate = function() {
        if (!isDraggingTimeline) {
            currentTime = videoPlayer.currentTime;
            updateTimeDisplay();
            updateTimelinePosition();
        }
    };
    
    // 播放结束
    videoPlayer.onended = function() {
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶';
    };
}

// 更新信息面板
function updateInfoPanel(recording) {
    document.getElementById('infoDevice').textContent = getDeviceName(recording.deviceId);
    document.getElementById('infoType').textContent = getRecordTypeName(recording.type);
    document.getElementById('infoStartTime').textContent = formatDateTime(recording.startTime);
    document.getElementById('infoEndTime').textContent = formatDateTime(recording.endTime);
    document.getElementById('infoDuration').textContent = formatDuration(recording.duration);
    document.getElementById('infoSize').textContent = formatFileSize(recording.fileSize);
    document.getElementById('infoResolution').textContent = recording.resolution || '未知';
}

// 加载缩略图
function loadThumbnails(recordId) {
    fetch(`/api/record/thumbnails?id=${recordId}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取缩略图失败');
        }
    })
    .then(thumbnails => {
        const grid = document.getElementById('thumbnailGrid');
        grid.innerHTML = '';
        
        if (thumbnails.length === 0) {
            grid.innerHTML = '<p>无缩略图</p>';
            return;
        }
        
        thumbnails.forEach(thumbnail => {
            const img = document.createElement('img');
            img.className = 'thumbnail';
            img.src = thumbnail.url;
            img.alt = '缩略图';
            img.dataset.time = thumbnail.time;
            
            img.addEventListener('click', function() {
                if (videoPlayer) {
                    videoPlayer.currentTime = parseFloat(thumbnail.time);
                }
            });
            
            grid.appendChild(img);
        });
    })
    .catch(error => {
        console.error('加载缩略图错误:', error);
        document.getElementById('thumbnailGrid').innerHTML = '<p>加载缩略图失败</p>';
    });
}

// 初始化播放器
function initPlayer() {
    // 播放/暂停按钮
    document.getElementById('playBtn').addEventListener('click', function() {
        togglePlay();
    });
    
    // 快退按钮
    document.getElementById('rewindBtn').addEventListener('click', function() {
        if (!videoPlayer) return;
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
    });
    
    // 快进按钮
    document.getElementById('forwardBtn').addEventListener('click', function() {
        if (!videoPlayer) return;
        videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
    });
    
    // 上一段按钮
    document.getElementById('prevBtn').addEventListener('click', function() {
        playPreviousRecording();
    });
    
    // 下一段按钮
    document.getElementById('nextBtn').addEventListener('click', function() {
        playNextRecording();
    });
    
    // 播放速度选择
    document.getElementById('speedSelect').addEventListener('change', function() {
        if (!videoPlayer) return;
        playbackSpeed = parseFloat(this.value);
        videoPlayer.playbackRate = playbackSpeed;
    });
    
    // 时间轴拖动
    const timeSlider = document.getElementById('timeSlider');
    const timeHandle = document.getElementById('timeHandle');
    
    timeSlider.addEventListener('mousedown', function(e) {
        if (!videoPlayer) return;
        
        isDraggingTimeline = true;
        updateTimelineFromMouse(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDraggingTimeline) {
            updateTimelineFromMouse(e);
        }
        
        if (isDraggingVolume) {
            updateVolumeFromMouse(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDraggingTimeline) {
            isDraggingTimeline = false;
            if (videoPlayer) {
                videoPlayer.currentTime = currentTime;
            }
        }
        
        if (isDraggingVolume) {
            isDraggingVolume = false;
        }
    });
    
    // 音量控制
    const volumeSlider = document.getElementById('volumeSlider');
    
    volumeSlider.addEventListener('mousedown', function(e) {
        if (!videoPlayer) return;
        
        isDraggingVolume = true;
        updateVolumeFromMouse(e);
    });
}

// 播放/暂停切换
function togglePlay() {
    if (!videoPlayer) return;
    
    if (isPlaying) {
        videoPlayer.pause();
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶';
    } else {
        playVideo();
    }
}

// 播放视频
function playVideo() {
    if (!videoPlayer) return;
    
    videoPlayer.play()
        .then(() => {
            isPlaying = true;
            document.getElementById('playBtn').textContent = '⏸';
        })
        .catch(error => {
            console.error('播放失败:', error);
        });
}

// 播放上一段录像
function playPreviousRecording() {
    if (!currentRecording) return;
    
    const currentIndex = recordings.findIndex(r => r.id === currentRecording.id);
    if (currentIndex > 0) {
        const prevRecording = recordings[currentIndex - 1];
        
        // 更新UI选中状态
        document.querySelectorAll('.recording-item.active').forEach(el => {
            el.classList.remove('active');
        });
        
        const prevItem = document.querySelector(`.recording-item[data-id="${prevRecording.id}"]`);
        if (prevItem) {
            prevItem.classList.add('active');
            prevItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // 加载录像
        loadRecording(prevRecording.id);
    }
}

// 播放下一段录像
function playNextRecording() {
    if (!currentRecording) return;
    
    const currentIndex = recordings.findIndex(r => r.id === currentRecording.id);
    if (currentIndex < recordings.length - 1) {
        const nextRecording = recordings[currentIndex + 1];
        
        // 更新UI选中状态
        document.querySelectorAll('.recording-item.active').forEach(el => {
            el.classList.remove('active');
        });
        
        const nextItem = document.querySelector(`.recording-item[data-id="${nextRecording.id}"]`);
        if (nextItem) {
            nextItem.classList.add('active');
            nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // 加载录像
        loadRecording(nextRecording.id);
    }
}

// 从鼠标位置更新时间轴
function updateTimelineFromMouse(e) {
    if (!videoPlayer) return;
    
    const timeSlider = document.getElementById('timeSlider');
    const rect = timeSlider.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    
    // 限制在0-1范围内
    const clampedPosition = Math.max(0, Math.min(1, position));
    
    // 更新当前时间
    currentTime = clampedPosition * totalDuration;
    
    // 更新UI
    updateTimeDisplay();
    updateTimelinePosition();
}

// 从鼠标位置更新音量
function updateVolumeFromMouse(e) {
    if (!videoPlayer) return;
    
    const volumeSlider = document.getElementById('volumeSlider');
    const rect = volumeSlider.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    
    // 限制在0-1范围内
    volume = Math.max(0, Math.min(1, position));
    
    // 更新视频音量
    videoPlayer.volume = volume;
    
    // 更新UI
    updateVolumePosition();
}

// 更新时间显示
function updateTimeDisplay() {
    document.getElementById('currentTime').textContent = formatTime(currentTime);
    document.getElementById('totalTime').textContent = formatTime(totalDuration);
    document.getElementById('playerTime').textContent = formatTime(currentTime) + ' / ' + formatTime(totalDuration);
}

// 更新时间轴位置
function updateTimelinePosition() {
    const progress = document.getElementById('timeProgress');
    const handle = document.getElementById('timeHandle');
    
    const position = (totalDuration > 0) ? (currentTime / totalDuration * 100) : 0;
    
    progress.style.width = position + '%';
    handle.style.left = position + '%';
}

// 更新音量位置
function updateVolumePosition() {
    const level = document.getElementById('volumeLevel');
    const handle = document.getElementById('volumeHandle');
    
    const position = volume * 100;
    
    level.style.width = position + '%';
    handle.style.left = position + '%';
}

// 重置过滤条件
function resetFilters() {
    document.getElementById('deviceFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('recordingSearch').value = '';
    
    // 重置日期为最近7天
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = weekAgo;
    
    // 重置时间为全天
    document.getElementById('startTime').value = '00:00';
    document.getElementById('endTime').value = '23:59';
    
    // 重新加载数据
    loadRecordings();
}

// 下载录像
function downloadRecording(recordId) {
    window.location.href = `/api/record/download?id=${recordId}&token=${localStorage.getItem('auth_token')}`;
}

// 截取画面
function takeSnapshot() {
    if (!videoPlayer || !currentRecording) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoPlayer.videoWidth;
    canvas.height = videoPlayer.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
    
    // 转换为图片
    const dataUrl = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `snapshot_${currentRecording.deviceName}_${formatDate(new Date(), 'yyyyMMdd_HHmmss')}.png`;
    a.click();
}

// 保存剪辑片段
function saveClip() {
    const recordId = document.getElementById('clipRecordId').value;
    const clipName = document.getElementById('clipName').value;
    const startTime = document.getElementById('clipStartTime').value;
    const endTime = document.getElementById('clipEndTime').value;
    const description = document.getElementById('clipDesc').value;
    
    if (!recordId || !clipName) {
        alert('请填写必填字段');
        return;
    }
    
    // 解析时间
    const startSeconds = parseTimeString(startTime);
    const endSeconds = parseTimeString(endTime);
    
    if (startSeconds >= endSeconds) {
        alert('结束时间必须大于开始时间');
        return;
    }
    
    fetch('/api/record/clip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify({
            recordId: recordId,
            name: clipName,
            startTime: startSeconds,
            endTime: endSeconds,
            description: description
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('剪辑片段失败');
        }
    })
    .then(data => {
        closeModal('clipModal');
        alert('剪辑成功，新片段ID: ' + data.id);
        
        // 重新加载录像列表
        loadRecordings();
    })
    .catch(error => {
        console.error('剪辑片段错误:', error);
        alert('剪辑片段失败: ' + error.message);
    });
}

// 删除录像
function deleteRecord() {
    const recordId = document.getElementById('deleteRecordId').value;
    
    if (!recordId) {
        closeModal('deleteConfirmModal');
        return;
    }
    
    fetch(`/api/record/delete?id=${recordId}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('删除录像失败');
        }
    })
    .then(data => {
        closeModal('deleteConfirmModal');
        
        // 清除当前播放
        if (currentRecording && currentRecording.id === recordId) {
            currentRecording = null;
            videoPlayer.src = '';
            videoPlayer.style.display = 'none';
            document.querySelector('.empty-player').style.display = 'flex';
            document.getElementById('playerTitle').textContent = '未选择录像';
            document.getElementById('playerTime').textContent = '00:00:00 / 00:00:00';
            
            // 清空信息面板
            document.getElementById('infoDevice').textContent = '--';
            document.getElementById('infoType').textContent = '--';
            document.getElementById('infoStartTime').textContent = '--';
            document.getElementById('infoEndTime').textContent = '--';
            document.getElementById('infoDuration').textContent = '--';
            document.getElementById('infoSize').textContent = '--';
            document.getElementById('infoResolution').textContent = '--';
            
            // 清空缩略图
            document.getElementById('thumbnailGrid').innerHTML = '';
        }
        
        // 重新加载录像列表
        loadRecordings();
    })
    .catch(error => {
        console.error('删除录像错误:', error);
        alert('删除录像失败: ' + error.message);
        closeModal('deleteConfirmModal');
    });
}

// 显示模态框
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 获取设备名称
function getDeviceName(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : '未知设备';
}

// 获取录像类型名称
function getRecordTypeName(type) {
    switch (type) {
        case 'MANUAL':
            return '手动录制';
        case 'SCHEDULED':
            return '定时录制';
        case 'ALARM':
            return '报警录制';
        default:
            return '未知类型';
    }
}

// 格式化日期时间
function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    return formatDate(date) + ' ' + 
           padZero(date.getHours()) + ':' + 
           padZero(date.getMinutes()) + ':' + 
           padZero(date.getSeconds());
}

// 格式化日期
function formatDate(date, format) {
    if (format === 'yyyyMMdd_HHmmss') {
        return date.getFullYear() +
               padZero(date.getMonth() + 1) +
               padZero(date.getDate()) + '_' +
               padZero(date.getHours()) +
               padZero(date.getMinutes()) +
               padZero(date.getSeconds());
    }
    
    return date.getFullYear() + '-' + 
           padZero(date.getMonth() + 1) + '-' + 
           padZero(date.getDate());
}

// 格式化时间
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return padZero(hours) + ':' + padZero(minutes) + ':' + padZero(secs);
}

// 解析时间字符串为秒数
function parseTimeString(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

// 格式化时长
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return hours + '小时 ' + minutes + '分钟';
    } else if (minutes > 0) {
        return minutes + '分钟 ' + secs + '秒';
    } else {
        return secs + '秒';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes) return '未知';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return size.toFixed(2) + ' ' + units[unitIndex];
}

// 数字补零
function padZero(num) {
    return num < 10 ? '0' + num : num;
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
