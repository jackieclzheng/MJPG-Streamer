package com.security.system.service;

import com.security.system.entity.Device;
import com.security.system.entity.SystemLog;
import com.security.system.repository.DeviceRepository;
import com.security.system.exception.BusinessException;
import com.security.system.dto.DeviceDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DeviceService {
    
    private final Logger logger = LoggerFactory.getLogger(DeviceService.class);
    
    @Autowired
    private DeviceRepository deviceRepository;
    
    @Autowired
    private MjpgStreamerService mjpgStreamerService;
    
    @Autowired
    private SystemLogService systemLogService;
    
    /**
     * 获取所有设备列表
     */
    public List<Device> findAll() {
        return deviceRepository.findAll();
    }
    
    /**
     * 根据ID查找设备
     */
    public Optional<Device> findById(Long id) {
        return deviceRepository.findById(id);
    }
    
    /**
     * 根据状态查找设备
     */
    public List<Device> findByStatus(Device.DeviceStatus status) {
        return deviceRepository.findByStatus(status);
    }
    
    /**
     * 查找在线设备
     */
    public List<Device> findOnlineDevices() {
        return deviceRepository.findByStatus(Device.DeviceStatus.ONLINE);
    }
    
    /**
     * 创建新设备
     */
    @Transactional
    public Device createDevice(DeviceDTO deviceDTO) {
        Device device = new Device();
        device.setName(deviceDTO.getName());
        device.setDescription(deviceDTO.getDescription());
        device.setDevicePath(deviceDTO.getDevicePath());
        device.setIpAddress(deviceDTO.getIpAddress());
        device.setPort(deviceDTO.getPort());
        device.setUsername(deviceDTO.getUsername());
        device.setPassword(deviceDTO.getPassword());
        device.setResolution(deviceDTO.getResolution());
        device.setFramerate(deviceDTO.getFramerate());
        device.setType(deviceDTO.getType());
        device.setStatus(Device.DeviceStatus.OFFLINE);
        device.setCreateTime(LocalDateTime.now());
        
        Device savedDevice = deviceRepository.save(device);
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                "添加设备: " + device.getName(), "添加成功");
        
        return savedDevice;
    }
    
    /**
     * 更新设备信息
     */
    @Transactional
    public Device updateDevice(Long id, DeviceDTO deviceDTO) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 更新设备信息
        if (deviceDTO.getName() != null) {
            device.setName(deviceDTO.getName());
        }
        
        if (deviceDTO.getDescription() != null) {
            device.setDescription(deviceDTO.getDescription());
        }
        
        if (deviceDTO.getDevicePath() != null) {
            device.setDevicePath(deviceDTO.getDevicePath());
        }
        
        if (deviceDTO.getIpAddress() != null) {
            device.setIpAddress(deviceDTO.getIpAddress());
        }
        
        if (deviceDTO.getPort() != null) {
            device.setPort(deviceDTO.getPort());
        }
        
        if (deviceDTO.getUsername() != null) {
            device.setUsername(deviceDTO.getUsername());
        }
        
        if (deviceDTO.getPassword() != null) {
            device.setPassword(deviceDTO.getPassword());
        }
        
        if (deviceDTO.getResolution() != null) {
            device.setResolution(deviceDTO.getResolution());
        }
        
        if (deviceDTO.getFramerate() != null) {
            device.setFramerate(deviceDTO.getFramerate());
        }
        
        if (deviceDTO.getType() != null) {
            device.setType(deviceDTO.getType());
        }
        
        if (deviceDTO.getEnableMotionDetection() != null) {
            device.setEnableMotionDetection(deviceDTO.getEnableMotionDetection());
        }
        
        if (deviceDTO.getMotionDetectionConfig() != null) {
            device.setMotionDetectionConfig(deviceDTO.getMotionDetectionConfig());
        }
        
        Device updatedDevice = deviceRepository.save(device);
        
        // 如果设备在线，需要重启流服务以应用新配置
        if (device.getStatus() == Device.DeviceStatus.ONLINE) {
            restartDevice(id);
        }
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                "更新设备: " + device.getName(), "更新成功");
        
        return updatedDevice;
    }
    
    /**
     * 删除设备
     */
    @Transactional
    public void deleteDevice(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 如果设备在线，先停止流服务
        if (device.getStatus() == Device.DeviceStatus.ONLINE) {
            stopDevice(id);
        }
        
        deviceRepository.delete(device);
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                "删除设备: " + device.getName(), "删除成功");
    }
    
    /**
     * 启动设备
     */
    @Transactional
    public void startDevice(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 启动MJPG-Streamer服务
        boolean success = mjpgStreamerService.startStreaming(device);
        
        if (success) {
            device.setStatus(Device.DeviceStatus.ONLINE);
            device.setLastOnlineTime(LocalDateTime.now());
            deviceRepository.save(device);
            
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "启动设备: " + device.getName(), "启动成功");
        } else {
            device.setStatus(Device.DeviceStatus.ERROR);
            deviceRepository.save(device);
            
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "启动设备: " + device.getName(), "启动失败");
            
            throw new BusinessException("设备启动失败");
        }
    }
    
    /**
     * 停止设备
     */
    @Transactional
    public void stopDevice(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 停止MJPG-Streamer服务
        boolean success = mjpgStreamerService.stopStreaming(id);  // 修改这里，传入设备ID
        
        if (success) {
            device.setStatus(Device.DeviceStatus.OFFLINE);
            deviceRepository.save(device);
            
            // 记录系统日志
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "停止设备: " + device.getName(), "停止成功");
        } else {
            // 记录系统日志
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "停止设备: " + device.getName(), "停止失败");
            
            throw new BusinessException("设备停止失败");
        }
    }
    
    /**
     * 重启设备
     */
    @Transactional
    public void restartDevice(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 重启MJPG-Streamer服务
        boolean success = mjpgStreamerService.restartStreaming(device);
        
        if (success) {
            device.setStatus(Device.DeviceStatus.ONLINE);
            device.setLastOnlineTime(LocalDateTime.now());
            deviceRepository.save(device);
            
            // 记录系统日志
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "重启设备: " + device.getName(), "重启成功");
        } else {
            device.setStatus(Device.DeviceStatus.ERROR);
            deviceRepository.save(device);
            
            // 记录系统日志
            systemLogService.addLog(null, SystemLog.LogType.DEVICE_OPERATION, 
                    "重启设备: " + device.getName(), "重启失败");
            
            throw new BusinessException("设备重启失败");
        }
    }
    
    public Device addDevice(Device device) {
        try {
            // 设置默认值
            device.setCreateTime(LocalDateTime.now());
            device.setStatus(Device.DeviceStatus.OFFLINE);
            
            // 根据设备类型设置默认配置
            if (device.getType() == Device.DeviceType.USB || 
                device.getType() == Device.DeviceType.RASPI) {
                if (device.getDevicePath() == null) {
                    device.setDevicePath("/dev/video0");
                }
                if (device.getResolution() == null) {
                    device.setResolution("1280x720");
                }
                if (device.getFramerate() == null) {
                    device.setFramerate(30);
                }
            }
            
            Device savedDevice = deviceRepository.save(device);
            logger.info("成功添加设备: {}", savedDevice.getName());
            return savedDevice;
            
        } catch (Exception e) {
            logger.error("添加设备失败: {}", e.getMessage());
            throw new RuntimeException("添加设备失败", e);
        }
    }
}
