package com.security.system.service;

import com.security.system.dto.SystemStatusDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;

@Service
public class SystemMonitorService {

    @Autowired
    private WebSocketService webSocketService;
    
    /**
     * 定时收集系统状态信息并推送
     * 每60秒执行一次
     */
    @Scheduled(fixedRate = 60000)
    public void collectAndPushSystemStatus() {
        SystemStatusDTO status = collectSystemStatus();
        webSocketService.sendSystemStatusUpdate(status);
    }
    
    /**
     * 收集系统状态信息
     */
    public SystemStatusDTO collectSystemStatus() {
        SystemStatusDTO status = new SystemStatusDTO();
        
        // 获取CPU使用率
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        status.setCpuUsage(Math.round(osBean.getSystemLoadAverage() * 100) / 100.0);
        
        // 获取内存使用情况
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed() + memoryBean.getNonHeapMemoryUsage().getUsed();
        long maxMemory = memoryBean.getHeapMemoryUsage().getMax() + memoryBean.getNonHeapMemoryUsage().getMax();
        status.setMemoryUsed(usedMemory);
        status.setMemoryTotal(maxMemory);
        status.setMemoryUsagePercent(Math.round((usedMemory * 100.0f) / maxMemory));
        
        // 获取存储空间使用情况
        File storageDir = new File("/data/recordings"); // 实际应用中应该使用配置的存储路径
        if (storageDir.exists()) {
            long totalSpace = storageDir.getTotalSpace();
            long freeSpace = storageDir.getFreeSpace();
            long usedSpace = totalSpace - freeSpace;
            
            status.setStorageTotal(totalSpace);
            status.setStorageUsed(usedSpace);
            status.setStorageUsagePercent(Math.round((usedSpace * 100.0f) / totalSpace));
        }
        
        return status;
    }
}
