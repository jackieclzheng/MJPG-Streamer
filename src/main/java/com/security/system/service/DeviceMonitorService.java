package com.security.system.service;

import com.security.system.entity.Device;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeviceMonitorService {

    @Autowired
    private com.security.system.repository.DeviceRepository deviceRepository;
    
    @Autowired
    private AlarmService alarmService;
    
    @Autowired
    private WebSocketService webSocketService;
    
    /**
     * 定时检查设备状态
     * 每30秒执行一次
     */
    @Scheduled(fixedRate = 30000)
    public void checkDeviceStatus() {
        List<Device> devices = deviceRepository.findAll();
        
        for (Device device : devices) {
            boolean isReachable = pingDevice(device);
            Device.DeviceStatus oldStatus = device.getStatus();
            
            if (isReachable) {
                if (oldStatus != Device.DeviceStatus.ONLINE) {
                    device.setStatus(Device.DeviceStatus.ONLINE);
                    device.setLastOnlineTime(LocalDateTime.now());
                    deviceRepository.save(device);
                    
                    // 推送设备状态变化
                    webSocketService.sendDeviceStatusUpdate(device);
                }
            } else {
                if (oldStatus == Device.DeviceStatus.ONLINE) {
                    device.setStatus(Device.DeviceStatus.OFFLINE);
                    deviceRepository.save(device);
                    
                    // 推送设备状态变化
                    webSocketService.sendDeviceStatusUpdate(device);
                    
                    // 触发设备离线报警
                    triggerOfflineAlarm(device);
                }
            }
        }
    }
    
    /**
     * 检测设备是否可达
     */
    private boolean pingDevice(Device device) {
        // 根据设备类型进行不同的检测
        switch (device.getType()) {
            case USB:
                // 检查USB设备是否存在
                return checkUsbDevice(device.getDevicePath());
            case RASPI:
                // 检查树莓派摄像头
                return checkRaspiCamera();
            case IP:
            case RTSP:
                // 检查IP摄像头或RTSP流是否可达
                return checkNetworkDevice(device.getIpAddress(), device.getPort());
            default:
                return false;
        }
    }
    
    /**
     * 检查USB设备
     */
    private boolean checkUsbDevice(String devicePath) {
        try {
            java.io.File file = new java.io.File(devicePath);
            return file.exists();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 检查树莓派摄像头
     */
    private boolean checkRaspiCamera() {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder("vcgencmd", "get_camera");
            Process process = processBuilder.start();
            process.waitFor();
            
            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                return line != null && line.contains("detected=1");
            }
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 检查网络设备
     */
    private boolean checkNetworkDevice(String ipAddress, Integer port) {
        if (ipAddress == null) {
            return false;
        }
        
        try {
            java.net.InetAddress address = java.net.InetAddress.getByName(ipAddress);
            boolean reachable = address.isReachable(3000); // 3秒超时
            
            // 如果有指定端口，还需要检查端口是否开放
            if (reachable && port != null) {
                try (java.net.Socket socket = new java.net.Socket()) {
                    socket.connect(new java.net.InetSocketAddress(ipAddress, port), 3000);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
            
            return reachable;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 触发设备离线报警
     */
    private void triggerOfflineAlarm(Device device) {
        com.security.system.entity.Alarm alarm = new com.security.system.entity.Alarm();
        alarm.setDevice(device);
        alarm.setType(com.security.system.entity.Alarm.AlarmType.DEVICE_OFFLINE);
        alarm.setLevel(com.security.system.entity.Alarm.AlarmLevel.IMPORTANT);
        alarm.setDetails("设备 " + device.getName() + " 已离线，最后在线时间: " + 
                device.getLastOnlineTime().toString());
        alarm.setCreateTime(LocalDateTime.now());
        alarm.setStatus(com.security.system.entity.Alarm.AlarmStatus.UNHANDLED);
        
        alarmService.saveAlarm(alarm);
    }
}
