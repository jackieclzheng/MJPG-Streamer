package com.security.system.entity;

import com.security.system.enums.UserRole;
import com.security.system.enums.UserStatus;
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
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
    
    @Column(nullable = false)
    private boolean enabled = true;
    
    @Column(unique = true)
    private String email;
    
    private String phone;
    
    private String nickname;
    
    @Column(name = "create_time")
    private LocalDateTime createTime;
    
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_device_permissions",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "device_id")
    )
    private Set<Device> accessibleDevices;
}
