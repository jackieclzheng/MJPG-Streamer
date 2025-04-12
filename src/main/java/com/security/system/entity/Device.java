package com.security.system.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@Table(name = "devices")
@NoArgsConstructor
@AllArgsConstructor
public class Device {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    @Column(length = 200)
    private String description;
    
    @Column(nullable = false, length = 100)
    private String devicePath; // 设备路径，如 /dev/video0
    
    @Column(length = 50)
    private String ipAddress; // 设备IP地址
    
    @Column
    private Integer port; // 设备端口
    
    @Column(length = 50)
    private String username; // 设备认证用户名
    
    @Column(length = 50)
    private String password; // 设备认证密码
    
    @Column(length = 20)
    private String resolution = "1280x720"; // 分辨率
    
    @Column
    private Integer framerate = 30; // 帧率
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status = DeviceStatus.OFFLINE; // 设备状态
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType type = DeviceType.USB; // 设备类型
    
    @Column(nullable = false)
    private LocalDateTime createTime = LocalDateTime.now(); // 创建时间
    
    @Column
    private LocalDateTime lastOnlineTime; // 最后在线时间
    
    @Column
    private boolean enableMotionDetection = false; // 是否启用移动侦测
    
    @Column
    private String motionDetectionConfig; // 移动侦测配置，JSON格式
    
    @ManyToMany(mappedBy = "accessibleDevices")
    private Set<User> users; // 可访问此设备的用户
    
    // 添加 streamUrl 字段
    @Column(name = "stream_url")
    private String streamUrl = "/stream";
    
    public enum DeviceStatus {
        ONLINE, // 在线
        OFFLINE, // 离线
        ERROR // 错误
    }
    
    public enum DeviceType {
        USB, // USB摄像头
        RASPI, // 树莓派摄像头
        IP, // IP摄像头
        RTSP // RTSP流摄像头
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public Integer getPort() {
        return port;
    }
    
    public String getDevicePath() {
        return devicePath;
    }
    
    // ...other getters and setters...
}
