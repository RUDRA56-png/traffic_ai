package com.traffic.dto;

import lombok.Data;

@Data
public class TrafficRequest {
    private String location;
    private int vehicleCount;
    private double avgSpeed;
}