// 全局变量
let devices = [];
let currentPage = 0;
let pageSize = 12;
let totalPages = 0;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    if (!checkAuth()) return;
    
    // 加载设备列表
    loadDevices();
    
    // 设置搜索和过滤事件
    document.getElementById('deviceSearch').addEventListener('input', function() {
        filterDevices();
    });
    
    document.getElementById('typeFilter').addEventListener('change', function() {
        filterDevices();
    });
    
    document.getElementById('statusFilter').addEventListener('change', function() {
        filterDevices();
    });
    
    // 设置设备类型选择事件
    document.getElementById('deviceType').addEventListener('change', function() {
        toggleDeviceFields(this.value);
    });
    
    document.getElementById('editDeviceType').addEventListener('change', function() {
        toggleEditDeviceFields(this.value);
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
        renderDevices(devices);
    })
    .catch(error => {
        console.error('加载设备错误:', error);
    });
}

// 渲染设备列表
function renderDevices(deviceList) {
    const grid = document.getElementById('deviceGrid');
    grid.innerHTML = '';
    
    // 计算分页
    totalPages = Math.ceil(deviceList.length / pageSize);
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, deviceList.length);
    
    // 如果当前页没有数据但总页数大于0，回到上一页
    if (startIndex >= deviceList.length && currentPage > 0 && deviceList.length > 0) {
        currentPage--;
        renderDevices(deviceList);
        return;
    }
    
    // 显示当前页的设备
    const currentPageDevices = deviceList.slice(startIndex, endIndex);
    
    if (currentPageDevices.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '没有找到符合条件的设备';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '30px';
        emptyMessage.style.gridColumn = '1 / -1';
        grid.appendChild(emptyMessage);
    } else {
        currentPageDevices.forEach(device => {
            const card = createDeviceCard(device);
            grid.appendChild(card);
        });
    }
    
    // 更新分页
    renderPagination();
}

// 创建设备卡片
function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    
    const preview = document.createElement('div');
    preview.className = 'device-preview';
    
    // 设备预览图
    const img = document.createElement('img');
    if (device.status === 'ONLINE') {
        img.src = `/api/video/snapshot/${device.id}?t=${new Date().getTime()}`;
    } else {
        img.src = 'images/offline-device.jpg';
    }
    img.alt = device.name;
    
    // 状态指示器
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'device-status-indicator';
    
    if (device.status === 'ONLINE') {
        statusIndicator.classList.add('status-online');
    } else if (device.status === 'ERROR') {
        statusIndicator.classList.add('status-error');
    } else {
        statusIndicator.classList.add('status-offline');
    }
    
    preview.appendChild(img);
    preview.appendChild(statusIndicator);
    
    // 设备信息
    const info = document.createElement('div');
    info.className = 'device-info';
    
    const header = document.createElement('div');
    header.className = 'device-header';
    
    const name = document.createElement('div');
    name.className = 'device-name';
    name.textContent = device.name;
    
    const type = document.createElement('div');
    type.className = 'device-type';
    type.textContent = getDeviceTypeName(device.type);
    
    header.appendChild(name);
    header.appendChild(type);
    
    const details = document.createElement('div');
    details.className = 'device-details';
    
    // 添加设备详情
    if (device.ip) {
        const ipDiv = document.createElement('div');
        ipDiv.textContent = `IP地址: ${device.ip}`;
        details.appendChild(ipDiv);
    }
    
    if (device.resolution) {
        const resolutionDiv = document.createElement('div');
        resolutionDiv.textContent = `分辨率: ${device.resolution}`;
        details.appendChild(resolutionDiv);
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.textContent = `状态: ${getStatusName(device.status)}`;
    details.appendChild(statusDiv);
    
    if (device.lastOnlineTime) {
        const timeDiv = document.createElement('div');
        timeDiv.textContent = `最后在线时间: ${formatDateTime(device.lastOnlineTime)}`;
        details.appendChild(timeDiv);
    }
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'device-actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn';
    viewBtn.textContent = '查看';
    viewBtn.addEventListener('click', function() {
        viewDevice(device.id);
    });
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn primary';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function() {
        editDevice(device.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function() {
        showDeleteConfirm(device.id);
    });
    
    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    info.appendChild(header);
    info.appendChild(details);
    info.appendChild(actions);
    
    card.appendChild(preview);
    card.appendChild(info);
    
    return card;
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
            renderDevices(getFilteredDevices());
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
                renderDevices(getFilteredDevices());
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
            renderDevices(getFilteredDevices());
        });
    }
    pagination.appendChild(nextBtn);
}

// 筛选设备
function filterDevices() {
    const filteredDevices = getFilteredDevices();
    currentPage = 0; // 重置为第一页
    renderDevices(filteredDevices);
}

// 获取筛选后的设备列表
function getFilteredDevices() {
    const searchTerm = document.getElementById('deviceSearch').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    return devices.filter(device => {
        // 搜索条件
        const matchesSearch = !searchTerm || 
            device.name.toLowerCase().includes(searchTerm) || 
            (device.ip && device.ip.toLowerCase().includes(searchTerm));
        
        // 类型条件
        const matchesType = !typeFilter || device.type === typeFilter;
        
        // 状态条件
        const matchesStatus = !statusFilter || device.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });
}

// 显示添加设备模态框
function showAddDeviceModal() {
    // 重置表单
    document.getElementById('addDeviceForm').reset();
    
    // 隐藏所有设备字段
    document.getElementById('networkDeviceFields').style.display = 'none';
    document.getElementById('usbDeviceFields').style.display = 'none';
    
    // 显示模态框
    document.getElementById('addDeviceModal').classList.add('show');
}

// 显示编辑设备模态框
function editDevice(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    
    // 填充表单
    document.getElementById('editDeviceId').value = device.id;
    document.getElementById('editDeviceName').value = device.name;
    document.getElementById('editDeviceType').value = device.type;
    
    // 根据设备类型显示相应字段
    toggleEditDeviceFields(device.type);
    
    // 填充网络设备字段
    if (device.type === 'IP' || device.type === 'RTSP') {
        document.getElementById('editIpAddress').value = device.ip || '';
        document.getElementById('editPort').value = device.port || '';
        document.getElementById('editStreamUrl').value = device.streamUrl || '';
        document.getElementById('editUsername').value = device.username || '';
        // 密码字段留空，表示不修改
    }
    
    // 填充USB设备字段
    if (device.type === 'USB' || device.type === 'RASPI') {
        document.getElementById('editDevicePath').value = device.devicePath || '';
    }
    
    // 填充通用字段
    document.getElementById('editResolution').value = device.resolution || '';
    document.getElementById('editFrameRate').value = device.frameRate || '';
    document.getElementById('editDescription').value = device.description || '';
    
    // 显示模态框
    document.getElementById('editDeviceModal').classList.add('show');
}

// 查看设备
function viewDevice(deviceId) {
    window.location.href = `monitor.html?device=${deviceId}`;
}

// 显示删除确认模态框
function showDeleteConfirm(deviceId) {
    document.getElementById('deleteDeviceId').value = deviceId;
    document.getElementById('deleteConfirmModal').classList.add('show');
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 切换设备字段显示
function toggleDeviceFields(deviceType) {
    const networkFields = document.getElementById('networkDeviceFields');
    const usbFields = document.getElementById('usbDeviceFields');
    
    if (deviceType === 'IP' || deviceType === 'RTSP') {
        networkFields.style.display = 'block';
        usbFields.style.display = 'none';
    } else if (deviceType === 'USB' || deviceType === 'RASPI') {
        networkFields.style.display = 'none';
        usbFields.style.display = 'block';
    } else {
        networkFields.style.display = 'none';
        usbFields.style.display = 'none';
    }
}

// 切换编辑设备字段显示
function toggleEditDeviceFields(deviceType) {
    const networkFields = document.getElementById('editNetworkDeviceFields');
    const usbFields = document.getElementById('editUsbDeviceFields');
    
    if (deviceType === 'IP' || deviceType === 'RTSP') {
        networkFields.style.display = 'block';
        usbFields.style.display = 'none';
    } else if (deviceType === 'USB' || deviceType === 'RASPI') {
        networkFields.style.display = 'none';
        usbFields.style.display = 'block';
    } else {
        networkFields.style.display = 'none';
        usbFields.style.display = 'none';
    }
}

// 添加设备
function addDevice() {
    const deviceName = document.getElementById('deviceName').value;
    const deviceType = document.getElementById('deviceType').value;
    
    if (!deviceName || !deviceType) {
        alert('请填写必填字段');
        return;
    }
    
    // 构建设备数据
    const deviceData = {
        name: deviceName,
        type: deviceType,
        description: document.getElementById('description').value,
        resolution: document.getElementById('resolution').value,
        frameRate: document.getElementById('frameRate').value
    };
    
    // 根据设备类型添加特定字段
    if (deviceType === 'IP' || deviceType === 'RTSP') {
        deviceData.ip = document.getElementById('ipAddress').value;
        deviceData.port = document.getElementById('port').value;
        deviceData.streamUrl = document.getElementById('streamUrl').value;
        deviceData.username = document.getElementById('username').value;
        deviceData.password = document.getElementById('password').value;
    } else if (deviceType === 'USB' || deviceType === 'RASPI') {
        deviceData.devicePath = document.getElementById('devicePath').value;
    }
    
    // 发送请求
    fetch('/api/device/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify(deviceData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('添加设备失败');
        }
    })
    .then(data => {
        // 关闭模态框
        closeModal('addDeviceModal');
        
        // 重新加载设备列表
        loadDevices();
    })
    .catch(error => {
        console.error('添加设备错误:', error);
        alert('添加设备失败: ' + error.message);
    });
}

// 更新设备
function updateDevice() {
    const deviceId = document.getElementById('editDeviceId').value;
    const deviceName = document.getElementById('editDeviceName').value;
    const deviceType = document.getElementById('editDeviceType').value;
    
    if (!deviceId || !deviceName || !deviceType) {
        alert('请填写必填字段');
        return;
    }
    
    // 构建设备数据
    const deviceData = {
        id: deviceId,
        name: deviceName,
        type: deviceType,
        description: document.getElementById('editDescription').value,
        resolution: document.getElementById('editResolution').value,
        frameRate: document.getElementById('editFrameRate').value
    };
    
    // 根据设备类型添加特定字段
    if (deviceType === 'IP' || deviceType === 'RTSP') {
        deviceData.ip = document.getElementById('editIpAddress').value;
        deviceData.port = document.getElementById('editPort').value;
        deviceData.streamUrl = document.getElementById('editStreamUrl').value;
        deviceData.username = document.getElementById('editUsername').value;
        
        // 只有在填写了密码时才更新密码
        const password = document.getElementById('editPassword').value;
        if (password) {
            deviceData.password = password;
        }
    } else if (deviceType === 'USB' || deviceType === 'RASPI') {
        deviceData.devicePath = document.getElementById('editDevicePath').value;
    }
    
    // 发送请求
    fetch('/api/device/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        },
        body: JSON.stringify(deviceData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('更新设备失败');
        }
    })
    .then(data => {
        // 关闭模态框
        closeModal('editDeviceModal');
        
        // 重新加载设备列表
        loadDevices();
    })
    .catch(error => {
        console.error('更新设备错误:', error);
        alert('更新设备失败: ' + error.message);
    });
}

// 删除设备
function deleteDevice() {
    const deviceId = document.getElementById('deleteDeviceId').value;
    
    if (!deviceId) {
        closeModal('deleteConfirmModal');
        return;
    }
    
    // 发送请求
    fetch(`/api/device/delete?id=${deviceId}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('删除设备失败');
        }
    })
    .then(data => {
        // 关闭模态框
        closeModal('deleteConfirmModal');
        
        // 重新加载设备列表
        loadDevices();
    })
    .catch(error => {
        console.error('删除设备错误:', error);
        alert('删除设备失败: ' + error.message);
        closeModal('deleteConfirmModal');
    });
}

// 获取设备类型名称
function getDeviceTypeName(type) {
    switch (type) {
        case 'USB':
            return 'USB摄像头';
        case 'RASPI':
            return '树莓派摄像头';
        case 'IP':
            return 'IP摄像头';
        case 'RTSP':
            return 'RTSP流摄像头';
        default:
            return '未知类型';
    }
}

// 获取状态名称
function getStatusName(status) {
    switch (status) {
        case 'ONLINE':
            return '在线';
        case 'OFFLINE':
            return '离线';
        case 'ERROR':
            return '错误';
        default:
            return '未知状态';
    }
}

// 格式化日期时间
function formatDateTime(timestamp) {
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
