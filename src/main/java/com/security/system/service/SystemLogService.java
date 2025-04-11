package com.security.system.service;

import com.security.system.entity.SystemLog;
import com.security.system.entity.User;
import com.security.system.repository.SystemLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SystemLogService {
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    /**
     * 添加系统日志
     */
    @Transactional
    public SystemLog addLog(User user, SystemLog.LogType type, String operation, String details) {
        SystemLog log = new SystemLog();
        log.setUser(user);
        log.setType(type);
        log.setOperation(operation);
        log.setDetails(details);
        log.setCreateTime(LocalDateTime.now());
        
        return systemLogRepository.save(log);
    }
    
    /**
     * 添加系统日志（带IP地址）
     */
    @Transactional
    public SystemLog addLog(User user, SystemLog.LogType type, String operation, String details, String ipAddress) {
        SystemLog log = new SystemLog();
        log.setUser(user);
        log.setType(type);
        log.setOperation(operation);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setCreateTime(LocalDateTime.now());
        
        return systemLogRepository.save(log);
    }
    
    /**
     * 分页查询系统日志
     */
    public Page<SystemLog> findLogs(Pageable pageable) {
        return systemLogRepository.findByOrderByCreateTimeDesc(pageable);
    }
    
    /**
     * 查询用户操作日志
     */
    public List<SystemLog> findLogsByUser(User user) {
        return systemLogRepository.findByUserOrderByCreateTimeDesc(user);
    }
    
    /**
     * 根据类型和时间范围查询日志
     */
    public List<SystemLog> findLogsByTypeAndTimeRange(
            SystemLog.LogType type, LocalDateTime startTime, LocalDateTime endTime) {
        return systemLogRepository.findByTypeAndCreateTimeBetween(type, startTime, endTime);
    }
    
    /**
     * 根据时间范围查询日志
     */
    public List<SystemLog> findLogsByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        return systemLogRepository.findByCreateTimeBetween(startTime, endTime);
    }
}
