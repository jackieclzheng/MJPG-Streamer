package com.security.system.dto;

import com.security.system.entity.Device;
import java.time.LocalDateTime;

public class DeviceStatusDTO {
    private Long id;
    private String name;
    private Device.DeviceStatus status;
    private LocalDateTime lastUpdateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Device.DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(Device.DeviceStatus status) {
        this.status = status;
    }

    public LocalDateTime getLastUpdateTime() {
        return lastUpdateTime;
    }

    public void setLastUpdateTime(LocalDateTime lastUpdateTime) {
        this.lastUpdateTime = lastUpdateTime;
    }
}
