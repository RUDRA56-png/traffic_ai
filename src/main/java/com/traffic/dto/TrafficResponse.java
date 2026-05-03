package com.traffic.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TrafficResponse {
    private String road;        // road / route name
    private String location;    // alias for road (frontend uses both)
    private String alert;       // message
    private String level;       // HIGH / MEDIUM / LOW
    private String duration;    // predicted traffic duration
    private String trafficLevel; // alias for level (frontend uses both)
}
