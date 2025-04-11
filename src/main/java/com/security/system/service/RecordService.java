package com.security.system.service;

import com.security.system.entity.Record;
import com.security.system.entity.Device;
import com.security.system.repository.RecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RecordService {
    
    @Autowired
    private RecordRepository recordRepository;
    
    /**
     * 保存录像记录
     */
    @Transactional
    public Record save(Record record) {
        return recordRepository.save(record);
    }
    
    /**
     * 根据ID查找录像记录
     */
    public Optional<Record> findById(Long id) {
        return recordRepository.findById(id);
    }
    
    /**
     * 查找设备的所有录像记录
     */
    public List<Record> findByDevice(Device device) {
        return recordRepository.findByDeviceAndDeletedFalseOrderByStartTimeDesc(device);
    }
    
    /**
     * 分页查询设备的录像记录
     */
    public Page<Record> findByDevice(Device device, Pageable pageable) {
        return recordRepository.findByDeviceAndDeletedFalseOrderByStartTimeDesc(device, pageable);
    }
    
    /**
     * 根据时间范围查询设备的录像记录
     */
    public List<Record> findByDeviceAndTimeRange(Long deviceId, LocalDateTime startTime, LocalDateTime endTime) {
        return recordRepository.findByDeviceAndTimeRange(deviceId, startTime, endTime);
    }
    
    /**
     * 根据类型查询录像记录
     */
    public List<Record> findByType(Record.RecordType type) {
        return recordRepository.findByTypeAndDeletedFalse(type);
    }
    
    /**
     * 逻辑删除录像记录
     */
    @Transactional
    public void deleteRecord(Long id) {
        Record record = recordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("录像记录不存在"));
        
        record.setDeleted(true);
        recordRepository.save(record);
    }
}
