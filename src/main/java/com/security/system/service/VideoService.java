package com.security.system.service;

import com.security.system.entity.Device;
import com.security.system.entity.Record;
import com.security.system.exception.BusinessException;
import com.security.system.repository.DeviceRepository;
import com.security.system.util.MacCameraUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;

@Service
@Slf4j
public class VideoService {
    
    private final DeviceService deviceService;
    private final MjpgStreamerService mjpgStreamerService;
    private final SimpMessagingTemplate messagingTemplate;
    private final DeviceRepository deviceRepository;
    private final RecordService recordService;
    private final WebSocketService webSocketService;
    
    @Value("${video.frame.quality:0.8}")
    private float frameQuality;
    
    // 记录活跃的录制任务
    private final Map<Long, Record> activeRecordings = new ConcurrentHashMap<>();
    
    @Autowired
    public VideoService(
            DeviceService deviceService,
            MjpgStreamerService mjpgStreamerService,
            SimpMessagingTemplate messagingTemplate,
            DeviceRepository deviceRepository,
            RecordService recordService,
            WebSocketService webSocketService) {
        this.deviceService = deviceService;
        this.mjpgStreamerService = mjpgStreamerService;
        this.messagingTemplate = messagingTemplate;
        this.deviceRepository = deviceRepository;
        this.recordService = recordService;
        this.webSocketService = webSocketService;
    }
    
    private List<Long> getActiveDevices() {
        return deviceService.findOnlineDevices()
                .stream()
                .map(Device::getId)
                .collect(Collectors.toList());
    }
    
    @Value("${video.storage.path:/data/recordings}")
    private String storageBasePath;
    
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);
    
    // 当前正在录制的设备
    private final Map<Long, Long> recordingDevices = new ConcurrentHashMap<>();

    public Device getDevice(Long deviceId) {
        return deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("设备未找到: " + deviceId));
    }
    
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
    
    // 定时推送视频帧
    @Scheduled(fixedRate = 33) // 约30fps
    public void pushVideoFrames() {
        // 获取所有活跃的设备连接
        List<Long> activeDevices = getActiveDevices();
        
        for (Long deviceId : activeDevices) {
            try {
                byte[] frame = getSnapshot(deviceId);
                messagingTemplate.convertAndSend(
                    "/topic/video/" + deviceId,
                    frame
                );
            } catch (Exception e) {
                logger.error("推送视频帧失败: deviceId=" + deviceId, e);
            }
        }
    }

    public void startCamera(Long deviceId) throws IOException {
        Device device = getDevice(deviceId);
        
        // 检查摄像头是否可用
        if (!MacCameraUtil.isCameraAvailable()) {
            throw new BusinessException("摄像头不可用");
        }
        
        // 启动摄像头流
        mjpgStreamerService.startStreaming(device);
        
        // 更新设备状态
        device.setStatus(Device.DeviceStatus.ONLINE);
        deviceRepository.save(device);
    }

    public void pushVideoFrames(Long deviceId) {
        try {
            byte[] frame = mjpgStreamerService.getSnapshot(deviceId);
            // 处理视频帧
            processVideoFrame(deviceId, frame);
        } catch (IllegalStateException e) {
            log.warn("设备 {} 未启动视频流服务", deviceId);
            // 尝试自动启动服务
            tryStartStreaming(deviceId);
        } catch (Exception e) {
            log.error("推送视频帧失败，设备ID: " + deviceId, e);
        }
    }

    private void tryStartStreaming(Long deviceId) {
        try {
            Device device = deviceService.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("设备不存在"));
            mjpgStreamerService.startStreaming(device);
        } catch (Exception e) {
            log.error("自动启动视频流失败，设备ID: " + deviceId, e);
        }
    }

    /**
     * 处理视频帧
     * @param deviceId 设备ID
     * @param frame 视频帧数据
     */
    private void processVideoFrame(Long deviceId, byte[] frame) {
        try {
            if (frame == null || frame.length == 0) {
                log.warn("设备 {} 的视频帧为空", deviceId);
                return;
            }

            // 发送帧数据到WebSocket客户端
            messagingTemplate.convertAndSend(
                "/topic/video/" + deviceId, 
                frame
            );

            // 如果正在录制，保存帧数据
            Record activeRecord = activeRecordings.get(deviceId);
            if (activeRecord != null) {
                try (FileOutputStream fos = new FileOutputStream(
                        activeRecord.getFilePath(), true)) {
                    fos.write(frame);
                    fos.flush();
                }
            }
        } catch (IOException e) {
            log.error("处理视频帧失败，设备ID: {}", deviceId, e);
        }
    }
}
