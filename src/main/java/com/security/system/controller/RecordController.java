package com.security.system.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.security.system.entity.Record;
import com.security.system.entity.Device;
import com.security.system.service.RecordService;
import com.security.system.service.DeviceService;
import com.security.system.service.VideoService;

@RestController
@RequestMapping("/api/record")
public class RecordController {

    @Autowired
    private RecordService recordService;
    
    @Autowired
    private DeviceService deviceService;
    
    @Autowired
    private VideoService videoService;
    
    @GetMapping("/list")
    public ResponseEntity<Page<Record>> getRecords(
            @RequestParam(required = false) Long deviceId,
            Pageable pageable) {
        
        if (deviceId != null) {
            Device device = deviceService.findById(deviceId)
                    .orElseThrow(() -> new RuntimeException("设备不存在"));
            return ResponseEntity.ok(recordService.findByDevice(device, pageable));
        }
        
        // 如果没有指定设备，返回空结果
        return ResponseEntity.ok(Page.empty(pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Record> getRecordById(@PathVariable Long id) {
        return recordService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/start")
    public ResponseEntity<Record> startRecording(@RequestParam Long deviceId) throws Exception {
        Record record = videoService.startRecording(deviceId);
        return ResponseEntity.ok(record);
    }
    
    @PostMapping("/stop")
    public ResponseEntity<Record> stopRecording(@RequestParam Long deviceId) {
        Record record = videoService.stopRecording(deviceId);
        return ResponseEntity.ok(record);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        recordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/camera/test")
    public ResponseEntity<Map<String, Object>> testCamera() {
        try {
            Process process = Runtime.getRuntime().exec("system_profiler SPCameraDataType");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                
                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("camera_info", output.toString());
                response.put("device_id", "DJH5296WCWXG1HPA0"); // 您系统中的摄像头ID
                
                return ResponseEntity.ok(response);
            }
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "检查摄像头失败: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/camera/view")
    public String cameraView() {
        return "camera-view.html";
    }
}
