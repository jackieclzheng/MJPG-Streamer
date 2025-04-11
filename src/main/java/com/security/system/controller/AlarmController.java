package com.security.system.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.security.system.entity.Alarm;
import com.security.system.service.AlarmService;

@RestController
@RequestMapping("/api/alarm")
public class AlarmController {

    @Autowired
    private AlarmService alarmService;
    
    @GetMapping("/list")
    public ResponseEntity<Page<Alarm>> getAlarms(
            @RequestParam(required = false) Alarm.AlarmStatus status,
            Pageable pageable) {
        
        return ResponseEntity.ok(alarmService.findByStatus(status, pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Alarm> getAlarmById(@PathVariable Long id) {
        return alarmService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{id}/handle")
    public ResponseEntity<Alarm> handleAlarm(
            @PathVariable Long id,
            @RequestParam Alarm.AlarmStatus status,
            @RequestParam(required = false) String handleResult) {
        
        Alarm alarm = alarmService.handleAlarm(id, status, handleResult);
        return ResponseEntity.ok(alarm);
    }
}
