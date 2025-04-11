package com.security.system.dto;

import com.security.system.entity.Device;
import lombok.Data;

@Data
public class DeviceDTO {
    private String name;
    private String description;
    private String devicePath;
    private String ipAddress;
    private Integer port;
    private String username;
    private String password;
    private String resolution;
    private Integer framerate;
    private Device.DeviceType type;
    private Boolean enableMotionDetection;
    private String motionDetectionConfig;
}
