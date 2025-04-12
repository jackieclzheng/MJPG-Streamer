package com.security.system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.security.system.entity.User;
import com.security.system.service.UserService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        logger.debug("登录请求 - 用户名: {}", username);

        // 添加调试代码
        userService.findByUsername(username).ifPresent(user -> {
            logger.debug("用户信息 - 用户名: {}, 角色: {}, 原始角色值: {}", 
                user.getUsername(), 
                user.getRole(),
                user.getRole().toString());
        });

        // 验证请求参数
        if (username == null || password == null) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Username and password are required");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            logger.debug("认证成功 - 用户: {}", username);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // 更新最后登录时间
            userService.findByUsername(username).ifPresent(user -> {
                userService.updateLastLoginTime(user.getId());
            });

            // 创建token (简化版，实际应使用JWT)
            String token = generateSimpleToken();

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", userDetails.getUsername());
            response.put("roles", userDetails.getAuthorities());

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            logger.error("认证失败 - 用户: {} - 原因: {}", username, e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (DisabledException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Account is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "An error occurred during authentication: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String generateSimpleToken() {
        // 简单实现，实际应使用JWT库生成token
        return "token-" + System.currentTimeMillis();
    }
}