package com.security.system.service;

import com.security.system.entity.Device;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MjpgStreamerService {
    
    private static final Logger log = LoggerFactory.getLogger(MjpgStreamerService.class);
    
    @Value("${mjpg-streamer.binary-path:/usr/local/bin/mjpg_streamer}")
    private String mjpgStreamerBinaryPath;
    
    @Value("${mjpg-streamer.www-path:/usr/local/share/mjpg-streamer/www}")
    private String mjpgStreamerWwwPath;
    
    @Value("${mjpg-streamer.port-range.start:8081}")
    private int portRangeStart;
    
    @Value("${mjpg-streamer.port-range.end:8099}")
    private int portRangeEnd;
    
    @Autowired
    private com.security.system.repository.DeviceRepository deviceRepository;
    
    @Autowired
    private WebSocketService webSocketService;
    
    // 保存运行中的MJPG-Streamer进程
    private final Map<Long, ProcessInfo> runningProcesses = new ConcurrentHashMap<>();
    
    // 端口使用情况
    private final boolean[] portUsage;
    
    // 初始化端口使用数组
    public MjpgStreamerService() {
        this.portUsage = new boolean[portRangeEnd - portRangeStart + 1];
    }
    
    @PostConstruct
    public void init() {
        // 应用启动时恢复在线设备的MJPG-Streamer服务
        List<Device> onlineDevices = deviceRepository.findByStatus(Device.DeviceStatus.ONLINE);
        for (Device device : onlineDevices) {
            try {
                startStreaming(device);
            } catch (Exception e) {
                log.error("启动设备{}的MJPG-Streamer服务失败: {}", device.getId(), e.getMessage());
            }
        }
    }
    
    @PreDestroy
    public void cleanup() {
        // 应用关闭时停止所有MJPG-Streamer进程
        for (Map.Entry<Long, ProcessInfo> entry : runningProcesses.entrySet()) {
            try {
                stopStreaming(deviceRepository.findById(entry.getKey()).orElse(null));
            } catch (Exception e) {
                log.error("停止设备{}的MJPG-Streamer服务失败: {}", entry.getKey(), e.getMessage());
            }
        }
    }
    
    /**
     * 启动指定设备的MJPG-Streamer服务
     */
    public synchronized boolean startStreaming(Device device) {
        if (device == null) {
            return false;
        }

        try {
            // 分配端口
            int port = allocatePort();
            if (port == -1) {
                throw new RuntimeException("没有可用端口");
            }

            // MJPG-Streamer命令
            List<String> command = new ArrayList<>();
            command.add(mjpgStreamerBinaryPath);
            command.add("-i");
            command.add("input_uvc.so -d " + device.getDevicePath() + 
                       " -r " + device.getResolution() + 
                       " -f " + device.getFramerate());
            command.add("-o");
            command.add("output_http.so -p " + port + " -w " + mjpgStreamerWwwPath);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            log.info("已启动 MJPG-Streamer - 设备ID: {}, 端口: {}", device.getId(), port);

            // 保存进程信息
            runningProcesses.put(device.getId(), new ProcessInfo(process, port));

            // 更新设备状态
            device.setStatus(Device.DeviceStatus.ONLINE);
            device.setPort(port);
            deviceRepository.save(device);

            return true;
        } catch (Exception e) {
            log.error("启动设备{}的MJPG-Streamer失败: {}", device.getId(), e.getMessage());
            return false;
        }
    }
    
    /**
     * 停止指定设备的MJPG-Streamer服务
     */
    public synchronized boolean stopStreaming(Device device) {
        if (device == null) {
            return false;
        }
        
        Long deviceId = device.getId();
        ProcessInfo processInfo = runningProcesses.get(deviceId);
        if (processInfo == null) {
            log.warn("设备{}的MJPG-Streamer服务未运行", deviceId);
            return true;
        }
        
        try {
            // 获取进程
            Process process = processInfo.getProcess();
            
            // 停止进程
            process.destroy();
            boolean terminated = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            
            if (!terminated) {
                // 强制终止
                process.destroyForcibly();
                process.waitFor(2, java.util.concurrent.TimeUnit.SECONDS);
            }
            
            // 释放端口
            releasePort(processInfo.getPort());
            
            // 移除进程信息
            runningProcesses.remove(deviceId);
            
            log.info("已停止设备{}的MJPG-Streamer服务", deviceId);
            
            return true;
        } catch (Exception e) {
            log.error("停止设备{}的MJPG-Streamer服务失败: {}", deviceId, e.getMessage());
            return false;
        }
    }
    
    /**
     * 重启指定设备的MJPG-Streamer服务
     */
    public synchronized boolean restartStreaming(Device device) {
        if (device == null) {
            return false;
        }
        
        try {
            // 先停止
            stopStreaming(device);
            
            // 再启动
            return startStreaming(device);
        } catch (Exception e) {
            log.error("重启设备{}的MJPG-Streamer服务失败: {}", device.getId(), e.getMessage());
            return false;
        }
    }
    
    /**
     * 获取指定设备的流地址
     */
    public String getStreamUrl(Long deviceId) {
        ProcessInfo processInfo = runningProcesses.get(deviceId);
        if (processInfo == null) {
            return null;
        }
        
        return "http://localhost:" + processInfo.getPort() + "/?action=stream";
    }
    
    /**
     * 获取指定设备的快照
     */
    public byte[] getSnapshot(Long deviceId) throws IOException {
        ProcessInfo processInfo = runningProcesses.get(deviceId);
        if (processInfo == null) {
            throw new IllegalStateException("设备未运行MJPG-Streamer服务");
        }
        
        String snapshotUrl = "http://localhost:" + processInfo.getPort() + "/?action=snapshot";
        
        // 发送HTTP请求获取快照
        URL url = new URL(snapshotUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        
        int responseCode = connection.getResponseCode();
        if (responseCode != 200) {
            throw new IOException("获取快照失败，响应码: " + responseCode);
        }
        
        // 读取快照数据
        try (InputStream inputStream = connection.getInputStream();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            
            return outputStream.toByteArray();
        }
    }
    
    /**
     * 将MJPG-Streamer视频流转发到输出流
     */
    public void forwardVideoStream(Long deviceId, OutputStream outputStream) throws IOException {
        ProcessInfo processInfo = runningProcesses.get(deviceId);
        if (processInfo == null) {
            throw new IllegalStateException("设备未运行MJPG-Streamer服务");
        }
        
        String streamUrl = "http://localhost:" + processInfo.getPort() + "/?action=stream";
        
        // 发送HTTP请求获取视频流
        URL url = new URL(streamUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(0); // 无限读取超时
        
        int responseCode = connection.getResponseCode();
        if (responseCode != 200) {
            throw new IOException("获取视频流失败，响应码: " + responseCode);
        }
        
        // 读取Content-Type和boundary
        String contentType = connection.getHeaderField("Content-Type");
        if (contentType == null || !contentType.startsWith("multipart/x-mixed-replace")) {
            throw new IOException("不支持的Content-Type: " + contentType);
        }
        
        String boundary = extractBoundary(contentType);
        if (boundary == null) {
            throw new IOException("无法提取boundary: " + contentType);
        }
        
        // 设置输出流的响应头
        String responseHeader = "HTTP/1.0 200 OK\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                "Pragma: no-cache\r\n" +
                "Expires: 0\r\n\r\n";
        
        // 转发视频流
        try (InputStream inputStream = connection.getInputStream()) {
            // 转发响应头
            outputStream.write(responseHeader.getBytes());
            
            // 转发视频流
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                outputStream.flush();
            }
        } catch (IOException e) {
            log.error("转发视频流时出错: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * 构建MJPG-Streamer启动命令
     */
    private List<String> buildCommand(Device device, int port) {
        List<String> command = new ArrayList<>();
        command.add(mjpgStreamerBinaryPath);
        
        // 输入插件
        switch (device.getType()) {
            case USB:
                command.add("-i");
                command.add("input_uvc.so -d " + device.getDevicePath() + 
                        " -r " + device.getResolution() + 
                        " -f " + device.getFramerate());
                break;
            case RASPI:
                command.add("-i");
                command.add("input_raspicam.so -x " + 
                        device.getResolution().split("x")[0] + 
                        " -y " + device.getResolution().split("x")[1] + 
                        " -fps " + device.getFramerate());
                break;
            case IP:
            case RTSP:
                // 对于IP和RTSP摄像头，需要通过输入HTTP或RTSP流的方式来获取视频
                String streamUrl = buildStreamUrl(device);
                command.add("-i");
                command.add("input_http.so -U " + device.getUsername() + 
                        " -P " + device.getPassword() + 
                        " -u " + streamUrl);
                break;
            default:
                throw new IllegalArgumentException("不支持的设备类型: " + device.getType());
        }
        
        // 输出插件
        command.add("-o");
        String outputArgs = "output_http.so -p " + port + " -w " + mjpgStreamerWwwPath;
        
        // 如果设置了用户名和密码，添加认证参数
        if (device.getUsername() != null && !device.getUsername().isEmpty() && 
                device.getPassword() != null && !device.getPassword().isEmpty()) {
            outputArgs += " -c " + device.getUsername() + ":" + device.getPassword();
        }
        
        command.add(outputArgs);
        
        return command;
    }
    
    /**
     * 构建IP或RTSP摄像头的流URL
     */
    private String buildStreamUrl(Device device) {
        if (device.getType() == Device.DeviceType.RTSP) {
            // RTSP流格式
            return "rtsp://" + device.getIpAddress() + ":" + 
                    (device.getPort() != null ? device.getPort() : 554) + device.getDevicePath();
        } else {
            // HTTP流格式
            return "http://" + device.getIpAddress() + ":" + 
                    (device.getPort() != null ? device.getPort() : 80) + device.getDevicePath();
        }
    }
    
    /**
     * 从Content-Type中提取boundary
     */
    private String extractBoundary(String contentType) {
        String[] parts = contentType.split(";");
        for (String part : parts) {
            part = part.trim();
            if (part.startsWith("boundary=")) {
                return part.substring("boundary=".length());
            }
        }
        return null;
    }
    
    /**
     * 分配一个可用端口
     */
    private synchronized int allocatePort() {
        for (int i = 0; i < portUsage.length; i++) {
            if (!portUsage[i]) {
                portUsage[i] = true;
                return portRangeStart + i;
            }
        }
        return -1; // 沧有可用端口
    }
    
    /**
     * 释放端口
     */
    private synchronized void releasePort(int port) {
        if (port >= portRangeStart && port <= portRangeEnd) {
            portUsage[port - portRangeStart] = false;
        }
    }
    
    /**
     * MJPG-Streamer进程信息
     */
    private static class ProcessInfo {
        private final Process process;
        private final int port;
        
        public ProcessInfo(Process process, int port) {
            this.process = process;
            this.port = port;
        }
        
        public Process getProcess() {
            return process;
        }
        
        public int getPort() {
            return port;
        }
    }

    @Value("${mjpg-streamer.binary-path}")
    private String mjpgStreamerPath;
    
    public byte[] getFrame(String streamUrl) throws IOException {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(streamUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            
            try (InputStream in = conn.getInputStream();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                return out.toByteArray();
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
