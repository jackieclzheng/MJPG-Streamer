package com.security.system.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.security.system.dto.SystemStatusDTO;
import com.security.system.service.SystemMonitorService;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Autowired
    private SystemMonitorService systemMonitorService;
    
    @GetMapping("/info")
    public ResponseEntity<SystemStatusDTO> getSystemInfo() {
        return ResponseEntity.ok(systemMonitorService.collectSystemStatus());
    }
}
