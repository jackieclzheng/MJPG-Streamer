package com.security.system.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

public class MacCameraUtil {
    private static final Logger logger = LoggerFactory.getLogger(MacCameraUtil.class);

    /**
     * 检查系统摄像头是否可用
     */
    public static boolean isCameraAvailable() {
        ProcessBuilder pb = new ProcessBuilder(
            "system_profiler", 
            "SPCameraDataType"
        );
        
        try {
            Process process = pb.start();
            
            // 读取命令输出
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                
                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
                
                // 等待进程完成
                int exitCode = process.waitFor();
                
                // 检查输出中是否包含摄像头信息
                boolean hasCamera = output.toString().contains("FaceTime") || 
                                  output.toString().contains("Camera");
                
                logger.debug("摄像头检查 - 退出码: {}, 发现摄像头: {}", exitCode, hasCamera);
                
                return exitCode == 0 && hasCamera;
            }
            
        } catch (IOException | InterruptedException e) {
            logger.error("检查摄像头状态时发生错误", e);
            return false;
        }
    }

    /**
     * 获取默认摄像头设备路径
     */
    public static String getDefaultCameraPath() {
        return "0"; // FFmpeg在Mac上使用的默认摄像头索引
    }
}