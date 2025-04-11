package com.security.system.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(length = 50)
    private String nickname;
    
    @Column(length = 100)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;
    
    @Column(nullable = false)
    private boolean enabled = true;
    
    @Column(nullable = false)
    private LocalDateTime createTime = LocalDateTime.now();
    
    @Column
    private LocalDateTime lastLoginTime;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_device_permissions",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "device_id")
    )
    private Set<Device> accessibleDevices;
    
    public enum UserRole {
        ADMIN, // 管理员
        OPERATOR, // 操作员
        USER; // 普通用户
    }
}
