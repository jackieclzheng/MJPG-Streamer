// 全局变量
let alarms = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let devices = [];
let currentAlarmId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    // 初始化日期选择器
    initDatePickers();
    
    // 加载设备列表
    loadDevices();
    
    // 加载报警统计
    loadAlarmStats();
    
    // 加载报警列表
    loadAlarms();
    
    // 设置搜索和过滤事件
    document.getElementById('searchBtn').addEventListener('click', function() {
        currentPage = 0;
        loadAlarms();
    });
    
    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        resetFilters();
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

// 加载报警统计
function loadAlarmStats() {
    fetch('/api/alarm/stats', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取报警统计失败');
        }
    })
    .then(data => {
        document.getElementById('urgentCount').textContent = data.urgent || 0;
        document.getElementById('importantCount').textContent = data.important || 0;
        document.getElementById('normalCount').textContent = data.normal || 0;
    })
    .catch(error => {
        console.error('加载报警统计错误:', error);
    });
}

// 加载报警列表
function loadAlarms() {
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('size', pageSize);
    
    // 添加过滤条件
    const deviceId = document.getElementById('deviceFilter').value;
    const alarmType = document.getElementById('typeFilter').value;
    const alarmLevel = document.getElementById('levelFilter').value;
    const alarmStatus = document.getElementById('statusFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (deviceId) params.append('deviceId', deviceId);
    if (alarmType) params.append('type', alarmType);
    if (alarmLevel) params.append('level', alarmLevel);
    if (alarmStatus) params.append('status', alarmStatus);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    fetch(`/api/alarm/list?${params.toString()}`, {
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
        alarms = data.content || [];
        totalPages = data.totalPages || 0;
        totalItems = data.totalElements || 0;
        
        renderAlarms();
        renderPagination();
        updatePaginationInfo();
    })
    .catch(error => {
        console.error('加载报警列表错误:', error);
    });
}

// 渲染报警列表
function renderAlarms() {
    const tableBody = document.getElementById('alarmTableBody');
    tableBody.innerHTML = '';
    
    if (alarms.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 7;
        emptyCell.textContent = '没有找到符合条件的报警记录';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '30px 0';
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
        return;
    }
    
    alarms.forEach(alarm => {
        const row = document.createElement('tr');
        
        // 设备名称
        const deviceCell = document.createElement('td');
        deviceCell.textContent = getDeviceName(alarm.deviceId);
        row.appendChild(deviceCell);
        
        // 报警类型
        const typeCell = document.createElement('td');
        const typeIcon = document.createElement('span');
        typeIcon.className = 'type-icon';
        typeIcon.textContent = getAlarmTypeIcon(alarm.type);
        
        const typeText = document.createTextNode(getAlarmTypeName(alarm.type));
        typeCell.appendChild(typeIcon);
        typeCell.appendChild(typeText);
        row.appendChild(typeCell);
        
        // 报警级别
        const levelCell = document.createElement('td');
        const levelBadge = document.createElement('span');
        levelBadge.className = 'level-badge level-' + alarm.level.toLowerCase();
        levelBadge.textContent = getAlarmLevelName(alarm.level);
        levelCell.appendChild(levelBadge);
        row.appendChild(levelCell);
        
        // 报警时间
        const timeCell = document.createElement('td');
        timeCell.textContent = formatDateTime(alarm.createTime);
        row.appendChild(timeCell);
        
        // 处理状态
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = 'status-badge status-' + alarm.status.toLowerCase();
        statusBadge.textContent = getAlarmStatusName(alarm.status);
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // 处理人
        const handlerCell = document.createElement('td');
        handlerCell.textContent = alarm.handlerName || '-';
        row.appendChild(handlerCell);
        
        // 操作
        const actionCell = document.createElement('td');
        const actionDiv = document.createElement('div');
        actionDiv.className = 'table-actions';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view';
        viewBtn.textContent = '查看';
        viewBtn.addEventListener('click', function() {
            viewAlarmDetail(alarm.id);
        });
        
        actionDiv.appendChild(viewBtn);
        
        // 只有未处理的报警才显示处理和忽略按钮
        if (alarm.status === 'UNHANDLED') {
            const handleBtn = document.createElement('button');
            handleBtn.className = 'action-btn handle';
            handleBtn.textContent = '处理';
            handleBtn.addEventListener('click', function() {
                currentAlarmId = alarm.id;
                showModal('handleAlarmModal');
                document.getElementById('handleAlarmId').value = alarm.id;
            });
            
            const ignoreBtn = document.createElement('button');
            ignoreBtn.className = 'action-btn ignore';
            ignoreBtn.textContent = '忽略';
            ignoreBtn.addEventListener('click', function() {
                currentAlarmId = alarm.id;
                showModal('ignoreAlarmModal');
                document.getElementById('ignoreAlarmId').value = alarm.id;
            });
            
            actionDiv.appendChild(handleBtn);
            actionDiv.appendChild(ignoreBtn);
        }
        
        actionCell.appendChild(actionDiv);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // 上一页按钮
    const prevBtn = document.createElement('div');
    prevBtn.className = 'page-item' + (currentPage === 0 ? ' disabled' : '');
    prevBtn.textContent = '«';
    if (currentPage > 0) {
        prevBtn.addEventListener('click', function() {
            currentPage--;
            loadAlarms();
        });
    }
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    // 调整startPage，确保显示maxVisiblePages个页码
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 0) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-item' + (i === currentPage ? ' active' : '');
        pageBtn.textContent = i + 1;
        
        if (i !== currentPage) {
            pageBtn.addEventListener('click', function() {
                currentPage = i;
                loadAlarms();
            });
        }
        
        pagination.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('div');
    nextBtn.className = 'page-item' + (currentPage >= totalPages - 1 ? ' disabled' : '');
    nextBtn.textContent = '»';
    if (currentPage < totalPages - 1) {
        nextBtn.addEventListener('click', function() {
            currentPage++;
            loadAlarms();
        });
    }
    pagination.appendChild(nextBtn);
}

// 更新分页信息
function updatePaginationInfo() {
    const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
}

// 重置过滤条件
function resetFilters() {
    document.getElementById('deviceFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('levelFilter').value = '';
    document.getElementById('statusFilter').value = '';
    
    // 重置日期为最近7天
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = weekAgo;
    
    // 重新加载数据
    currentPage = 0;
    loadAlarms();
}

// 查看报警详情
function viewAlarmDetail(alarmId) {
    fetch(`/api/alarm/detail?id=${alarmId}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('获取报警详情失败');
        }
    })
    .then(alarm => {
        currentAlarmId = alarm.id;
        
        // 填充报警详情
        document.getElementById('detailDeviceName').textContent = getDeviceName(alarm.deviceId);
        document.getElementById('detailTime').textContent = formatDateTime(alarm.createTime);
        document.getElementById('detailType').textContent = getAlarmTypeName(alarm.type);
        document.getElementById('detailLevel').textContent = getAlarmLevelName(alarm.level);
        document.getElementById('detailInfo').textContent = alarm.details || '无详细信息';
        document.getElementById('detailStatus').textContent = getAlarmStatusName(alarm.status);
        
        // 处理人信息
        const handlerContainer = document.getElementById('detailHandlerContainer');
        const handleTimeContainer = document.getElementById('detailHandleTimeContainer');
        const handleNoteContainer = document.getElementById('detailHandleNoteContainer');
        
        if (alarm.status === 'HANDLED' || alarm.status === 'IGNORED') {
            handlerContainer.style.display = 'block';
            handleTimeContainer.style.display = 'block';
            handleNoteContainer.style.display = 'block';
            
            document.getElementById('detailHandler').textContent = alarm.handlerName || '-';
            document.getElementById('detailHandleTime').textContent = formatDateTime(alarm.handleTime) || '-';
            document.getElementById('detailHandleNote').textContent = alarm.handleNote || '-';
        } else {
            handlerContainer.style.display = 'none';
            handleTimeContainer.style.display = 'none';
            handleNoteContainer.style.display = 'none';
        }
        
        // 报警图片
        const imagesContainer = document.getElementById('detailImages');
        imagesContainer.innerHTML = '';
        
        if (alarm.images && alarm.images.length > 0) {
            alarm.images.forEach(imagePath => {
                const img = document.createElement('img');
                img.className = 'alarm-preview-image';
                img.src = imagePath;
                img.alt = '报警图片';
                imagesContainer.appendChild(img);
            });
        } else {
            imagesContainer.innerHTML = '<p>无报警图片</p>';
        }
        
        // 处理和忽略按钮
        const handleBtn = document.getElementById('handleAlarmBtn');
        const ignoreBtn = document.getElementById('ignoreAlarmBtn');
        
        if (alarm.status === 'UNHANDLED') {
            handleBtn.style.display = 'block';
            ignoreBtn.style.display = 'block';
        } else {
            handleBtn.style.display = 'none';
            ignoreBtn.style.display = 'none';
        }
        
        // 显示模态框
        showModal('alarmDetailModal');
    })
    .catch(error => {
        console.error('获取报警详情错误:', error);
        alert('获取报警详情失败');
    });
}

// 显示处理报警模态框
function showHandleModal() {
    closeModal('alarmDetailModal');
    document.getElementById('handleNote').value = '';
    document.getElementById('handleAlarmId').value = currentAlarmId;
    showModal('handleAlarmModal');
}

// 显示忽略报警模态框
function showIgnoreModal() {
    closeModal('alarmDetailModal');
    document.getElementById('ignoreReason').value = 'FALSE_ALARM';
    document.getElementById('ignoreNote').value = '';
    document.getElementById('ignoreAlarmId').value = currentAlarmId;
    showModal('ignoreAlarmModal');
}

// 处理报警
function handleAlarm() {
    const alarmId = document.getElementById('handleAlarmId').value;
    const handleNote = document.getElementById('handleNote').value;
    
    if (!alarmId) {
        closeModal('handleAlarmModal');
        return;
    }
    
    fetch('/api/alarm/handle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify({
            id: alarmId,
            note: handleNote
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('处理报警失败');
        }
    })
    .then(data => {
        closeModal('handleAlarmModal');
        
        // 重新加载报警列表和统计
        loadAlarms();
        loadAlarmStats();
    })
    .catch(error => {
        console.error('处理报警错误:', error);
        alert('处理报警失败: ' + error.message);
    });
}

// 忽略报警
function ignoreAlarm() {
    const alarmId = document.getElementById('ignoreAlarmId').value;
    const ignoreReason = document.getElementById('ignoreReason').value;
    const ignoreNote = document.getElementById('ignoreNote').value;
    
    if (!alarmId) {
        closeModal('ignoreAlarmModal');
        return;
    }
    
    fetch('/api/alarm/ignore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify({
            id: alarmId,
            reason: ignoreReason,
            note: ignoreNote
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('忽略报警失败');
        }
    })
    .then(data => {
        closeModal('ignoreAlarmModal');
        
        // 重新加载报警列表和统计
        loadAlarms();
        loadAlarmStats();
    })
    .catch(error => {
        console.error('忽略报警错误:', error);
        alert('忽略报警失败: ' + error.message);
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

// 获取报警类型图标
function getAlarmTypeIcon(type) {
    switch (type) {
        case 'MOTION_DETECT':
            return '🚨';
        case 'AREA_INTRUSION':
            return '⚠️';
        case 'DEVICE_OFFLINE':
            return '📴';
        case 'MANUAL':
            return '👤';
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
        case 'MANUAL':
            return '手动触发';
        default:
            return '未知类型';
    }
}

// 获取报警级别名称
function getAlarmLevelName(level) {
    switch (level) {
        case 'URGENT':
            return '紧急';
        case 'IMPORTANT':
            return '重要';
        case 'NORMAL':
            return '普通';
        default:
            return '未知级别';
    }
}

// 获取报警状态名称
function getAlarmStatusName(status) {
    switch (status) {
        case 'UNHANDLED':
            return '未处理';
        case 'HANDLING':
            return '处理中';
        case 'HANDLED':
            return '已处理';
        case 'IGNORED':
            return '已忽略';
        default:
            return '未知状态';
    }
}

// 格式化日期时间
function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    return date.getFullYear() + '-' + 
           padZero(date.getMonth() + 1) + '-' + 
           padZero(date.getDate()) + ' ' + 
           padZero(date.getHours()) + ':' + 
           padZero(date.getMinutes()) + ':' + 
           padZero(date.getSeconds());
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
