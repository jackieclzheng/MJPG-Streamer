package com.security.system.service;

import com.security.system.entity.User;
import com.security.system.entity.SystemLog;
import com.security.system.repository.UserRepository;
import com.security.system.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private SystemLogService systemLogService;
    
    /**
     * 获取所有用户列表
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    /**
     * 根据ID查找用户
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * 根据用户名查找用户
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * 创建新用户
     */
    @Transactional
    public User createUser(UserDTO userDTO) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        if (userDTO.getEmail() != null && userRepository.existsByEmail(userDTO.getEmail())) {
            throw new BusinessException("邮箱已被使用");
        }
        
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setNickname(userDTO.getNickname());
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setRole(userDTO.getRole());
        user.setEnabled(true);
        user.setCreateTime(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.USER_OPERATION, 
                "创建用户: " + user.getUsername(), "创建成功");
        
        return savedUser;
    }
    
    /**
     * 更新用户信息
     */
    @Transactional
    public User updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 更新用户信息
        if (userDTO.getNickname() != null) {
            user.setNickname(userDTO.getNickname());
        }
        
        if (userDTO.getEmail() != null) {
            // 检查邮箱是否被其他用户使用
            if (!user.getEmail().equals(userDTO.getEmail()) && 
                    userRepository.existsByEmail(userDTO.getEmail())) {
                throw new BusinessException("邮箱已被使用");
            }
            user.setEmail(userDTO.getEmail());
        }
        
        if (userDTO.getPhone() != null) {
            user.setPhone(userDTO.getPhone());
        }
        
        if (userDTO.getRole() != null) {
            user.setRole(userDTO.getRole());
        }
        
        if (userDTO.getEnabled() != null) {
            user.setEnabled(userDTO.getEnabled());
        }
        
        User updatedUser = userRepository.save(user);
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.USER_OPERATION, 
                "更新用户: " + user.getUsername(), "更新成功");
        
        return updatedUser;
    }
    
    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("旧密码不正确");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // 记录系统日志
        systemLogService.addLog(user, SystemLog.LogType.USER_OPERATION, 
                "修改密码", "密码修改成功");
    }
    
    /**
     * 删除用户
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        userRepository.delete(user);
        
        // 记录系统日志
        systemLogService.addLog(null, SystemLog.LogType.USER_OPERATION, 
                "删除用户: " + user.getUsername(), "删除成功");
    }
    
    /**
     * 更新最后登录时间
     */
    @Transactional
    public void updateLastLoginTime(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
    }
}
