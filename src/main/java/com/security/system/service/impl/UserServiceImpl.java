package com.security.system.service.impl;

import com.security.system.entity.User;
import com.security.system.entity.SystemLog;
import com.security.system.repository.UserRepository;
import com.security.system.exception.BusinessException;
import com.security.system.dto.UserDTO;
import com.security.system.service.UserService;
import com.security.system.service.SystemLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private SystemLogService systemLogService;
    
    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    @Override
    @Transactional
    public User createUser(UserDTO userDTO) {
        // 检查用户名是否存在
        if (existsByUsername(userDTO.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword())); // 加密密码
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setRole(userDTO.getRole());
        user.setEnabled(true);
        user.setCreateTime(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    @Override
    @Transactional
    public User updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("用户不存在"));
            
        // 如果修改了用户名，检查新用户名是否已存在
        if (!user.getUsername().equals(userDTO.getUsername()) && 
            existsByUsername(userDTO.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        
        user.setUsername(userDTO.getUsername());
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setRole(userDTO.getRole());
        
        return userRepository.save(user);
    }
    
    @Override
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("用户不存在"));
            
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("旧密码错误");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("用户不存在"));
            
        userRepository.delete(user);
    }
    
    @Override
    @Transactional
    public void updateLastLoginTime(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("用户不存在"));
            
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
    }
}