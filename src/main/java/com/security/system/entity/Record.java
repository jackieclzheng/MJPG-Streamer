package com.security.system.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "records")
public class Record {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device; // 关联设备
    
    @Column(nullable = false)
    private LocalDateTime startTime; // 开始时间
    
    @Column
    private LocalDateTime endTime; // 结束时间
    
    @Column(nullable = false, length = 255)
    private String filePath; // 文件路径
    
    @Column(length = 255)
    private String thumbnailPath; // 缩略图路径
    
    @Column
    private Long fileSize; // 文件大小，单位字节
    
    @Column
    private Integer duration; // 时长，单位秒
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordType type = RecordType.MANUAL; // 录像类型
    
    @Column(nullable = false)
    private boolean deleted = false; // 是否已删除
    
    public enum RecordType {
        MANUAL, // 手动录制
        SCHEDULED, // 定时录制
        ALARM // 报警录制
    }
}
