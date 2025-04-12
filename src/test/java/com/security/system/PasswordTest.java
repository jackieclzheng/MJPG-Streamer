import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123";
        
        // 使用新生成的密码进行验证
        String newDbPassword = "$2a$10$bFpQ0iqbnzGLeP.WX/5Tt.tpQsl3V3PqcaW0rbsXgLyghGFhwWjeu";
        boolean matches = encoder.matches(rawPassword, newDbPassword);
        System.out.println("新密码验证结果: " + matches);
        
        if (matches) {
            System.out.println("密码验证成功！");
        } else {
            System.out.println("密码验证失败！");
        }
    }
}