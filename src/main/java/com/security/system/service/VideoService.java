package com.security.system.service;

import com.security.system.entity.Device;
import com.security.system.entity.Record;
import com.security.system.exception.BusinessException;
import com.security.system.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VideoService {

    @Autowired
    private DeviceRepository deviceRepository;
    
    @Autowired
    private MjpgStreamerService mjpgStreamerService;
    
    @Autowired
    private RecordService recordService;
    
    @Autowired
    private WebSocketService webSocketService;
    
    @Value("${video.storage.path:/data/recordings}")
    private String storageBasePath;
    
    // 当前正在录制的设备
    private final Map<Long, Long> recordingDevices = new ConcurrentHashMap<>();
    
    /**
     * 转发视频流
     */
    public void forwardVideoStream(Long deviceId, OutputStream outputStream) throws IOException {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        if (device.getStatus() != Device.DeviceStatus.ONLINE) {
            throw new BusinessException("设备不在线");
        }
        
        mjpgStreamerService.forwardVideoStream(deviceId, outputStream);
    }
    
    /**
     * 获取设备快照
     */
    public byte[] getSnapshot(Long deviceId) throws IOException {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        if (device.getStatus() != Device.DeviceStatus.ONLINE) {
            throw new BusinessException("设备不在线");
        }
        
        return mjpgStreamerService.getSnapshot(deviceId);
    }
    
    /**
     * 开始录制
     */
    public Record startRecording(Long deviceId) throws IOException {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        if (device.getStatus() != Device.DeviceStatus.ONLINE) {
            throw new BusinessException("设备不在线");
        }
        
        // 检查是否已经在录制
        if (recordingDevices.containsKey(deviceId)) {
            throw new BusinessException("设备已经在录制中");
        }
        
        // 创建存储目录
        String deviceDir = storageBasePath + File.separator + deviceId;
        File dir = new File(deviceDir);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("无法创建存储目录: " + deviceDir);
        }
        
        // 生成文件名
        LocalDateTime now = LocalDateTime.now();
        String fileName = now.format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".mp4";
        String filePath = deviceDir + File.separator + fileName;
        
        // 创建录像记录
        Record record = new Record();
        record.setDevice(device);
        record.setStartTime(now);
        record.setFilePath(filePath);
        record.setType(Record.RecordType.MANUAL);
        record.setDeleted(false);
        
        Record savedRecord = recordService.save(record);
        
        // 开始录制
        // 这里应该启动一个线程或进程来执行实际的录制操作
        // 为简化示例，这里只是记录录制状态
        recordingDevices.put(deviceId, savedRecord.getId());
        
        // 通知前端
        webSocketService.sendRecordingStarted(device, savedRecord);
        
        return savedRecord;
    }
    
    /**
     * 停止录制
     */
    public Record stopRecording(Long deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new BusinessException("设备不存在"));
        
        // 检查是否正在录制
        Long recordId = recordingDevices.get(deviceId);
        if (recordId == null) {
            throw new BusinessException("设备未在录制中");
        }
        
        // 获取录像记录
        Record record = recordService.findById(recordId)
                .orElseThrow(() -> new BusinessException("录像记录不存在"));
        
        // 停止录制
        // 这里应该停止录制线程或进程
        // 为简化示例，这里只是更新录制状态
        record.setEndTime(LocalDateTime.now());
        
        // 计算时长（秒）
        if (record.getStartTime() != null && record.getEndTime() != null) {
            record.setDuration((int) java.time.Duration.between(
                    record.getStartTime(), record.getEndTime()).getSeconds());
        }
        
        // 更新文件大小
        File file = new File(record.getFilePath());
        if (file.exists()) {
            record.setFileSize(file.length());
        }
        
        // 生成缩略图
        try {
            String thumbnailPath = record.getFilePath().replace(".mp4", ".jpg");
            // 这里应该实现生成缩略图的逻辑
            // 为简化示例，这里只是设置缩略图路径
            record.setThumbnailPath(thumbnailPath);
        } catch (Exception e) {
            // 生成缩略图失败，不影响主流程
        }
        
        Record updatedRecord = recordService.save(record);
        
        // 移除录制状态
        recordingDevices.remove(deviceId);
        
        // 通知前端
        webSocketService.sendRecordingStopped(device, updatedRecord);
        
        return updatedRecord;
    }
}
