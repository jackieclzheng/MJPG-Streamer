package com.security.system.service;

import com.security.system.dto.AlarmNotificationDTO;
import com.security.system.dto.DeviceStatusDTO;
import com.security.system.dto.SystemStatusDTO;
import com.security.system.entity.Alarm;
import com.security.system.entity.Device;
import com.security.system.entity.Record;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 推送设备状态变化
     */
    public void sendDeviceStatusUpdate(Device device) {
        DeviceStatusDTO statusDTO = new DeviceStatusDTO();
        statusDTO.setId(device.getId());
        statusDTO.setName(device.getName());
        statusDTO.setStatus(device.getStatus());
        statusDTO.setLastUpdateTime(device.getLastOnlineTime());

        messagingTemplate.convertAndSend("/topic/device/status", statusDTO);
    }

    /**
     * 推送报警通知
     */
    public void sendAlarmNotification(Alarm alarm) {
        AlarmNotificationDTO notificationDTO = new AlarmNotificationDTO();
        notificationDTO.setId(alarm.getId());
        notificationDTO.setDeviceId(alarm.getDevice().getId());
        notificationDTO.setDeviceName(alarm.getDevice().getName());
        notificationDTO.setType(alarm.getType());
        notificationDTO.setLevel(alarm.getLevel());
        notificationDTO.setDetails(alarm.getDetails());
        notificationDTO.setCreateTime(alarm.getCreateTime());
        notificationDTO.setImagePath(alarm.getImagePath());

        messagingTemplate.convertAndSend("/topic/alarm", notificationDTO);
    }

    /**
     * 推送系统状态更新
     */
    public void sendSystemStatusUpdate(SystemStatusDTO statusDTO) {
        messagingTemplate.convertAndSend("/topic/system/status", statusDTO);
    }

    /**
     * 推送录像开始通知
     */
    public void sendRecordingStarted(Device device, Record record) {
        messagingTemplate.convertAndSend("/topic/recording/start", 
            Map.of("deviceId", device.getId(), "deviceName", device.getName(), "recordId", record.getId()));
    }

    /**
     * 推送录像结束通知
     */
    public void sendRecordingStopped(Device device, Record record) {
        messagingTemplate.convertAndSend("/topic/recording/stop", 
            Map.of("deviceId", device.getId(), "deviceName", device.getName(), "recordId", record.getId()));
    }
}
