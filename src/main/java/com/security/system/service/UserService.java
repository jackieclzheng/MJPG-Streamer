package com.security.system.service;

import com.security.system.entity.User;
import com.security.system.entity.SystemLog;
import com.security.system.repository.UserRepository;
import com.security.system.exception.BusinessException;
import com.security.system.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


public interface UserService {
    List<User> findAll();
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    User createUser(UserDTO userDTO);
    User updateUser(Long id, UserDTO userDTO);
    void deleteUser(Long id);
    void changePassword(Long id, String oldPassword, String newPassword);
    void updateLastLoginTime(Long id);
    boolean existsByUsername(String username);
}

