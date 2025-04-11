package com.security.system.controller;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.security.system.service.VideoService;

import java.util.Map;

@RestController
@RequestMapping("/api/video")
public class VideoController {

    @Autowired
    private VideoService videoService;
    
    @GetMapping("/live/{deviceId}")
    public void getLiveStream(
            @PathVariable Long deviceId,
            HttpServletResponse response) throws IOException {
        
        // 设置响应头
        response.setContentType("multipart/x-mixed-replace; boundary=--myboundary");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        
        // 转发MJPG-Streamer流
        videoService.forwardVideoStream(deviceId, response.getOutputStream());
    }
    
    @GetMapping("/snapshot/{deviceId}")
    public void getSnapshot(
            @PathVariable Long deviceId,
            HttpServletResponse response) throws IOException {
        
        // 设置响应头
        response.setContentType("image/jpeg");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        
        // 获取并输出快照
        byte[] snapshot = videoService.getSnapshot(deviceId);
        response.getOutputStream().write(snapshot);
    }
}
