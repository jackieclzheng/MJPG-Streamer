package com.security.system.dto;

import com.security.system.entity.Alarm;
import java.time.LocalDateTime;

public class AlarmNotificationDTO {
    private Long id;
    private Long deviceId;
    private String deviceName;
    private Alarm.AlarmType type;
    private Alarm.AlarmLevel level;
    private String details;
    private LocalDateTime createTime;
    private String imagePath;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public Alarm.AlarmType getType() {
        return type;
    }

    public void setType(Alarm.AlarmType type) {
        this.type = type;
    }

    public Alarm.AlarmLevel getLevel() {
        return level;
    }

    public void setLevel(Alarm.AlarmLevel level) {
        this.level = level;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }
}
