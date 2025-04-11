package com.security.system.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_logs")
public class SystemLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // 关联用户
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogType type; // 日志类型
    
    @Column(nullable = false, length = 255)
    private String operation; // 操作内容
    
    @Column(length = 50)
    private String ipAddress; // IP地址
    
    @Column(nullable = false)
    private LocalDateTime createTime = LocalDateTime.now(); // 创建时间
    
    @Column(length = 500)
    private String details; // 详细信息
    
    public enum LogType {
        USER_LOGIN("用户登录"),
        USER_LOGOUT("用户登出"),
        USER_OPERATION("用户操作"),
        SYSTEM_OPERATION("系统操作"),
        DEVICE_OPERATION("设备操作"),
        ALARM_OPERATION("报警操作"),
        ERROR("错误日志");
        
        private final String description;
        
        LogType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
