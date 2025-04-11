package com.security.system.repository;

import com.security.system.entity.AlarmRule;
import com.security.system.entity.Device;
import com.security.system.entity.Alarm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlarmRuleRepository extends JpaRepository<AlarmRule, Long> {
    
    List<AlarmRule> findByDeviceAndEnabledTrue(Device device);
    
    List<AlarmRule> findByDeviceAndTypeAndEnabledTrue(Device device, Alarm.AlarmType type);
}
