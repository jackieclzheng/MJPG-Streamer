package com.security.system.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alarm_rules")
public class AlarmRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name; // 规则名称
    
    @Column(length = 200)
    private String description; // 规则描述
    
    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device; // 关联设备
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Alarm.AlarmType type; // 报警类型
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Alarm.AlarmLevel level; // 报警级别
    
    @Column(nullable = false)
    private boolean enabled = true; // 是否启用
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String ruleConfig; // 规则配置，JSON格式
    
    @Column(columnDefinition = "TEXT")
    private String notificationConfig; // 通知配置，JSON格式
    
    @Column(nullable = false)
    private LocalDateTime createTime = LocalDateTime.now(); // 创建时间
    
    @Column
    private LocalDateTime updateTime; // 更新时间
}
