package com.security.system.service;

import com.security.system.entity.Alarm;
import com.security.system.repository.AlarmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AlarmService {
    
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private WebSocketService webSocketService;
    
    /**
     * 保存报警记录
     */
    @Transactional
    public Alarm saveAlarm(Alarm alarm) {
        Alarm savedAlarm = alarmRepository.save(alarm);
        
        // 通过WebSocket推送报警通知
        webSocketService.sendAlarmNotification(savedAlarm);
        
        return savedAlarm;
    }
    
    /**
     * 根据ID查找报警记录
     */
    public Optional<Alarm> findById(Long id) {
        return alarmRepository.findById(id);
    }
    
    /**
     * 分页查询报警记录
     */
    public Page<Alarm> findByStatus(Alarm.AlarmStatus status, Pageable pageable) {
        return alarmRepository.findByStatusOrderByCreateTimeDesc(status, pageable);
    }
    
    /**
     * 处理报警
     */
    @Transactional
    public Alarm handleAlarm(Long id, Alarm.AlarmStatus status, String handleResult) {
        Alarm alarm = alarmRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("报警记录不存在"));
        
        alarm.setStatus(status);
        alarm.setHandleResult(handleResult);
        
        return alarmRepository.save(alarm);
    }
}
