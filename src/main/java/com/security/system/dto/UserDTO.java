package com.security.system.dto;

import com.security.system.entity.User;
import lombok.Data;

@Data
public class UserDTO {
    private String username;
    private String password;
    private String nickname;
    private String email;
    private String phone;
    private User.UserRole role;
    private Boolean enabled;
}
