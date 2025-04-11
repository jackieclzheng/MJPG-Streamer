package com.security.system.repository;

import com.security.system.entity.Record;
import com.security.system.entity.Device;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecordRepository extends JpaRepository<Record, Long> {
    
    List<Record> findByDeviceAndDeletedFalseOrderByStartTimeDesc(Device device);
    
    Page<Record> findByDeviceAndDeletedFalseOrderByStartTimeDesc(Device device, Pageable pageable);
    
    @Query("SELECT r FROM Record r WHERE r.device.id = ?1 AND r.startTime >= ?2 AND r.endTime <= ?3 AND r.deleted = false")
    List<Record> findByDeviceAndTimeRange(Long deviceId, LocalDateTime startTime, LocalDateTime endTime);
    
    List<Record> findByTypeAndDeletedFalse(Record.RecordType type);
}
