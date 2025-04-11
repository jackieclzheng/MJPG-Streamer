package com.security.system.repository;

import com.security.system.entity.Alarm;
import com.security.system.entity.Device;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlarmRepository extends JpaRepository<Alarm, Long>, JpaSpecificationExecutor<Alarm> {
    
    List<Alarm> findByDeviceOrderByCreateTimeDesc(Device device);
    
    Page<Alarm> findByStatusOrderByCreateTimeDesc(Alarm.AlarmStatus status, Pageable pageable);
    
    List<Alarm> findByDeviceAndStatusAndCreateTimeBetween(
        Device device, Alarm.AlarmStatus status, LocalDateTime startTime, LocalDateTime endTime);
    
    List<Alarm> findByLevelAndStatusOrderByCreateTimeDesc(
        Alarm.AlarmLevel level, Alarm.AlarmStatus status);
}
