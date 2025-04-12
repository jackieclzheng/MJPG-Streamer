package com.security.system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.security.system.service.VideoService;
import com.security.system.service.MjpgStreamerService;
import com.security.system.entity.Device;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class VideoWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoWebSocketController.class);
    
    @Autowired
    private VideoService videoService;
    
    @Autowired
    private MjpgStreamerService mjpgStreamerService;
    
    @MessageMapping("/connect/{deviceId}")
    @SendTo("/topic/video/{deviceId}")
    public byte[] streamVideo(Long deviceId) {
        try {
            Device device = videoService.getDevice(deviceId);
            if (!isDeviceOnline(device)) {
                logger.warn("设备离线: {}", deviceId);
                return new byte[0];
            }
            
            String streamUrl = String.format("http://%s:%d/?action=snapshot",
                device.getIpAddress(), device.getPort());
                
            return mjpgStreamerService.getFrame(streamUrl);
            
        } catch (Exception e) {
            logger.error("视频流传输错误 - 设备ID: " + deviceId, e);
            return new byte[0];
        }
    }

    private boolean isDeviceOnline(Device device) {
        return device != null && "ONLINE".equals(device.getStatus());
    }
}