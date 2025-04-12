package com.security.system.config;

import com.security.system.dto.UserDTO;
import com.security.system.enums.UserRole;
import com.security.system.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;

import com.security.system.entity.User;
import com.security.system.enums.UserStatus;
import com.security.system.exception.InitializationException;

@Configuration
public class DataInitializationConfig {
    
    private final Logger logger = LoggerFactory.getLogger(DataInitializationConfig.class);
    
    private final UserService userService;

    @Autowired
    public DataInitializationConfig(UserService userService) {
        this.userService = userService;
    }
    
    @PostConstruct
    @Transactional
    public void init() {
        try {
            initializeAdminUser();
        } catch (Exception e) {
            String errorMsg = "系统初始化失败";
            logger.error(errorMsg, e);
            throw new InitializationException(errorMsg, e);
        }
    }

    private void initializeAdminUser() {
        if (!userService.existsByUsername("admin")) {
            try {
                UserDTO adminDTO = createAdminUserDTO();
                userService.createUser(adminDTO);
                logger.info("成功创建管理员账号: {}", adminDTO.getUsername());
            } catch (Exception e) {
                logger.error("创建管理员账号失败", e);
                throw new InitializationException("创建管理员账号失败", e);
            }
        } else {
            logger.info("管理员账号已存在，跳过创建");
        }
    }

    private User createAdminUser() {
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword("admin123"); // 将在 Service 层加密
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE); // 设置状态
        admin.setCreateTime(LocalDateTime.now());
        admin.setEmail("admin@example.com");
        admin.setPhone("13800138000");
        return admin;
    }

    private UserDTO createAdminUserDTO() {
        UserDTO adminDTO = new UserDTO();
        adminDTO.setUsername("admin");
        adminDTO.setPassword("admin123"); // 密码将在 UserService 中加密
        adminDTO.setRole(UserRole.ADMIN);
        adminDTO.setEmail("admin@example.com");
        adminDTO.setPhone("13800138000");
        return adminDTO;
    }
}