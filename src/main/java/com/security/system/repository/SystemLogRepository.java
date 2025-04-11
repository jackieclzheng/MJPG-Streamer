package com.security.system.repository;

import com.security.system.entity.SystemLog;
import com.security.system.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    
    Page<SystemLog> findByOrderByCreateTimeDesc(Pageable pageable);
    
    List<SystemLog> findByUserOrderByCreateTimeDesc(User user);
    
    List<SystemLog> findByTypeAndCreateTimeBetween(
        SystemLog.LogType type, LocalDateTime startTime, LocalDateTime endTime);
    
    List<SystemLog> findByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
}
