package com.security.system.dto;

public class SystemStatusDTO {
    private double cpuUsage;
    private long memoryUsed;
    private long memoryTotal;
    private int memoryUsagePercent;
    private long storageUsed;
    private long storageTotal;
    private int storageUsagePercent;

    public double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public long getMemoryUsed() {
        return memoryUsed;
    }

    public void setMemoryUsed(long memoryUsed) {
        this.memoryUsed = memoryUsed;
    }

    public long getMemoryTotal() {
        return memoryTotal;
    }

    public void setMemoryTotal(long memoryTotal) {
        this.memoryTotal = memoryTotal;
    }

    public int getMemoryUsagePercent() {
        return memoryUsagePercent;
    }

    public void setMemoryUsagePercent(int memoryUsagePercent) {
        this.memoryUsagePercent = memoryUsagePercent;
    }

    public long getStorageUsed() {
        return storageUsed;
    }

    public void setStorageUsed(long storageUsed) {
        this.storageUsed = storageUsed;
    }

    public long getStorageTotal() {
        return storageTotal;
    }

    public void setStorageTotal(long storageTotal) {
        this.storageTotal = storageTotal;
    }

    public int getStorageUsagePercent() {
        return storageUsagePercent;
    }

    public void setStorageUsagePercent(int storageUsagePercent) {
        this.storageUsagePercent = storageUsagePercent;
    }
}
