package com.security.system.repository;

import com.security.system.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    
    List<Device> findByStatus(Device.DeviceStatus status);
    
    @Query("SELECT d FROM Device d JOIN d.users u WHERE u.id = ?1")
    List<Device> findByUserId(Long userId);
    
    List<Device> findByTypeAndStatus(Device.DeviceType type, Device.DeviceStatus status);
    
    @Query("SELECT d FROM Device d WHERE d.enableMotionDetection = true")
    List<Device> findMotionDetectionEnabled();
}
