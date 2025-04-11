package com.security.system.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.security.system.dto.DeviceDTO;
import com.security.system.entity.Device;
import com.security.system.service.DeviceService;

@RestController
@RequestMapping("/api/device")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;
    
    @GetMapping("/list")
    public ResponseEntity<List<Device>> getAllDevices() {
        return ResponseEntity.ok(deviceService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Device> getDeviceById(@PathVariable Long id) {
        return deviceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Device> createDevice(@Valid @RequestBody DeviceDTO deviceDTO) {
        Device device = deviceService.createDevice(deviceDTO);
        return ResponseEntity.ok(device);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Device> updateDevice(@PathVariable Long id, @Valid @RequestBody DeviceDTO deviceDTO) {
        Device updatedDevice = deviceService.updateDevice(id, deviceDTO);
        return ResponseEntity.ok(updatedDevice);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDevice(@PathVariable Long id) {
        deviceService.deleteDevice(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/start")
    public ResponseEntity<Void> startDevice(@PathVariable Long id) {
        deviceService.startDevice(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/stop")
    public ResponseEntity<Void> stopDevice(@PathVariable Long id) {
        deviceService.stopDevice(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/restart")
    public ResponseEntity<Void> restartDevice(@PathVariable Long id) {
        deviceService.restartDevice(id);
        return ResponseEntity.ok().build();
    }
}
