package com.security.system.controller;

import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.security.system.dto.DeviceDTO;
import com.security.system.entity.Device;
import com.security.system.service.DeviceService;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class DeviceController {

    private final Logger logger = LoggerFactory.getLogger(DeviceController.class);

    @Autowired
    private DeviceService deviceService;

    // 设备列表接口
    @GetMapping("/device/list")
    public ResponseEntity<List<Device>> listDevices() {
        try {
            List<Device> devices = deviceService.findAll();
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            logger.error("获取设备列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 其他接口使用 /devices 前缀
    @RequestMapping("/devices")
    public class DeviceApiController {

        @PostMapping
        public ResponseEntity<Device> createDevice(@Valid @RequestBody DeviceDTO deviceDTO) {
            try {
                Device device = deviceService.createDevice(deviceDTO);
                return ResponseEntity.ok(device);
            } catch (Exception e) {
                logger.error("添加设备失败", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        @GetMapping
        public ResponseEntity<List<Device>> getAllDevices() {
            try {
                List<Device> devices = deviceService.findAll();
                return ResponseEntity.ok(devices);
            } catch (Exception e) {
                logger.error("获取设备列表失败", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        @GetMapping("/{id}")
        public ResponseEntity<Device> getDevice(@PathVariable Long id) {
            try {
                return deviceService.findById(id)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            } catch (Exception e) {
                logger.error("获取设备失败 - ID: {}", id, e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
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
}
