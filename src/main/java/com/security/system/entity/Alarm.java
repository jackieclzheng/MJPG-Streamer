package com.security.system.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alarms")
public class Alarm {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device; // 关联设备
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlarmType type; // 报警类型
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlarmLevel level; // 报警级别
    
    @Column(nullable = false, length = 255)
    private String details; // 报警详情
    
    @Column(length = 255)
    private String imagePath; // 报警图片路径
    
    @Column(length = 255)
    private String videoPath; // 报警视频路径
    
    @Column(nullable = false)
    private LocalDateTime createTime = LocalDateTime.now(); // 创建时间
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlarmStatus status = AlarmStatus.UNHANDLED; // 处理状态
    
    @Column
    private LocalDateTime handleTime; // 处理时间
    
    @ManyToOne
    @JoinColumn(name = "handler_id")
    private User handler; // 处理人
    
    @Column(length = 500)
    private String handleResult; // 处理结果
    
    public enum AlarmType {
        MOTION_DETECTED("移动侦测"),
        CAMERA_OCCLUSION("摄像头遮挡"),
        AREA_INTRUSION("区域入侵"),
        DEVICE_OFFLINE("设备离线"),
        OTHER("其他");
        
        private final String description;
        
        AlarmType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum AlarmLevel {
        URGENT("紧急"),
        IMPORTANT("重要"),
        NORMAL("普通");
        
        private final String description;
        
        AlarmLevel(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum AlarmStatus {
        UNHANDLED("未处理"),
        HANDLING("处理中"),
        HANDLED("已处理"),
        IGNORED("已忽略");
        
        private final String description;
        
        AlarmStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
