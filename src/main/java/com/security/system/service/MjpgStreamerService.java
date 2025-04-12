package com.security.system.service;

import lombok.extern.slf4j.Slf4j;
import com.security.system.entity.Device;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class MjpgStreamerService {

    @Value("${mjpg-streamer.binary-path}")
    private String mjpgStreamerPath;

    @Value("${mjpg-streamer.port-range.start:8081}")
    private int portRangeStart;

    @Value("${mjpg-streamer.port-range.end:8099}")
    private int portRangeEnd;

    private int currentPort = -1;

    private Map<Long, Process> runningProcesses = new ConcurrentHashMap<>();
    private Map<Long, Integer> devicePorts = new ConcurrentHashMap<>();

    /**
     * 启动视频流服务
     * @param device 设备信息
     * @return 启动是否成功
     */
    public boolean startStreaming(Device device) {
        try {
            if (isStreamingRunning(device.getId())) {
                log.warn("设备 {} 的视频流已经在运行", device.getId());
                return true;
            }

            int port = allocatePort();
            List<String> command = buildCommand(device, port);
            
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            
            Process process = processBuilder.start();
            runningProcesses.put(device.getId(), process);
            devicePorts.put(device.getId(), port);
            
            // 启动日志监控
            monitorProcessOutput(process, device.getId());
            
            // 等待服务启动
            Thread.sleep(2000);
            
            if (process.isAlive()) {
                log.info("设备 {} 的 MJPG-Streamer 服务已启动，端口: {}", device.getId(), port);
                return true;
            } else {
                cleanup(device.getId());
                return false;
            }
        } catch (Exception e) {
            log.error("启动 MJPG-Streamer 失败，设备ID: " + device.getId(), e);
            cleanup(device.getId());
            return false;
        }
    }

    /**
     * 停止视频流服务
     * @param deviceId 设备ID
     * @return 是否成功停止
     */
    public boolean stopStreaming(Long deviceId) {
        try {
            Process process = runningProcesses.get(deviceId);
            if (process == null) {
                log.warn("设备 {} 的视频流未运行", deviceId);
                return true;
            }

            process.destroy();
            cleanup(deviceId);
            log.info("设备 {} 的 MJPG-Streamer 服务已停止", deviceId);
            return true;
        } catch (Exception e) {
            log.error("停止 MJPG-Streamer 失败，设备ID: " + deviceId, e);
            return false;
        }
    }

    /**
     * 重启视频流服务
     * @param device 设备信息
     * @return 重启是否成功
     */
    public boolean restartStreaming(Device device) {
        try {
            // 先停止当前运行的服务
            stopStreaming(device.getId());
            
            // 等待一段时间确保服务完全停止
            Thread.sleep(1000);
            
            // 重新启动服务
            return startStreaming(device);
        } catch (Exception e) {
            log.error("重启 MJPG-Streamer 失败，设备: {}", device.getName(), e);
            return false;
        }
    }

    public byte[] getSnapshot(Long deviceId) {
        if (!isStreamingRunning(deviceId)) {
            throw new IllegalStateException("设备未运行MJPG-Streamer服务");
        }

        int port = devicePorts.get(deviceId);
        String snapshotUrl = String.format("http://localhost:%d/?action=snapshot", port);

        try {
            URL url = new URL(snapshotUrl);
            return IOUtils.toByteArray(url);
        } catch (IOException e) {
            log.error("获取快照失败，设备ID: " + deviceId, e);
            throw new RuntimeException("获取快照失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定设备的视频帧
     * @param deviceId 设备ID
     * @return 视频帧数据
     * @throws IOException 如果获取失败
     */
    public byte[] getFrame(String deviceId) throws IOException {
        Long id = Long.parseLong(deviceId);
        if (!isStreamingRunning(id)) {
            throw new IllegalStateException("设备未运行MJPG-Streamer服务");
        }

        int port = devicePorts.get(id);
        String snapshotUrl = String.format("http://localhost:%d/?action=snapshot", port);

        try {
            URL url = new URL(snapshotUrl);
            try (InputStream inputStream = url.openStream()) {
                return IOUtils.toByteArray(inputStream);
            }
        } catch (IOException e) {
            log.error("获取视频帧失败，设备ID: " + deviceId, e);
            throw new IOException("获取视频帧失败: " + e.getMessage());
        }
    }

    /**
     * 转发视频流
     * @param deviceId 设备ID
     * @param outputStream 输出流
     * @throws IOException 如果发生IO错误
     */
    public void forwardVideoStream(Long deviceId, OutputStream outputStream) throws IOException {
        if (!isStreamingRunning(deviceId)) {
            throw new IllegalStateException("设备未运行MJPG-Streamer服务");
        }

        int port = devicePorts.get(deviceId);
        String streamUrl = String.format("http://localhost:%d/?action=stream", port);

        try (InputStream inputStream = new URL(streamUrl).openStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                outputStream.flush();
            }
        } catch (IOException e) {
            log.error("转发视频流失败，设备ID: " + deviceId, e);
            throw new IOException("转发视频流失败: " + e.getMessage());
        }
    }

    private boolean isStreamingRunning(Long deviceId) {
        Process process = runningProcesses.get(deviceId);
        return process != null && process.isAlive();
    }

    private void cleanup(Long deviceId) {
        runningProcesses.remove(deviceId);
        devicePorts.remove(deviceId);
    }

    private void monitorProcessOutput(Process process, Long deviceId) {
        new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("MJPG-Streamer [{}]: {}", deviceId, line);
                }
            } catch (IOException e) {
                log.error("读取进程输出失败", e);
            }
        }).start();
    }

    private synchronized int allocatePort() {
        if (currentPort == -1) {
            currentPort = portRangeStart;
        } else {
            currentPort++;
            if (currentPort > portRangeEnd) {
                currentPort = portRangeStart;
            }
        }
        return currentPort;
    }

    private List<String> buildCommand(Device device, int port) {
        List<String> command = new ArrayList<>();
        command.add(mjpgStreamerPath);
        command.add("-i");

        // 根据设备类型构建输入参数
        switch (device.getType()) {
            case USB:
            case RASPI:
                command.add(String.format("input_uvc.so -d %s -r %s -f %d",
                    device.getDevicePath(),
                    device.getResolution(),
                    device.getFramerate()));
                break;
            case IP:
            case RTSP:
                String streamUrl = String.format("rtsp://%s:%s@%s:%d%s",
                    device.getUsername(),
                    device.getPassword(),
                    device.getIpAddress(),
                    device.getPort(),
                    device.getStreamUrl());
                command.add("input_uvc.so -r " + device.getResolution() + 
                          " -f " + device.getFramerate() + 
                          " --url " + streamUrl);
                break;
            default:
                throw new IllegalArgumentException("不支持的设备类型: " + device.getType());
        }

        // 添加输出参数
        command.add("-o");
        command.add(String.format("output_http.so -w /usr/local/share/mjpg-streamer/www -p %d", port));

        return command;
    }
    
}
