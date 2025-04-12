package com.security.system.dto;

import com.security.system.enums.UserRole;
import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class UserDTO {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 4, max = 50, message = "用户名长度必须在4-50个字符之间")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度必须在6-100个字符之间")
    private String password;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    private String phone;
    
    private String nickname;
    
    private UserRole role;
    
    private Boolean enabled = true;
}
