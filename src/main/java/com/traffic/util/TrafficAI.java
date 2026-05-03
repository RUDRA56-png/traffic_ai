package com.traffic.util;

import org.springframework.stereotype.Component;

@Component
public class TrafficAI {

    public String predict(int vehicleCount, double avgSpeed, String time) {

        double congestion = vehicleCount / avgSpeed;

        // 🔥 Time-based boost
        if (time.equals("MORNING") || time.equals("EVENING")) {
            congestion += 2;
        }

        if (congestion > 6) {
            return "🚗 HIGH TRAFFIC - Heavy congestion!";
        } else if (congestion > 3) {
            return "🚕 MEDIUM TRAFFIC - Moderate flow.";
        } else {
            return "🚦 LOW TRAFFIC - Smooth flow.";
        }
    }

    public String predictDuration(int vehicleCount, double avgSpeed, String time) {

        if (time.equals("MORNING") || time.equals("EVENING")) {
            return "Traffic for next 30 minutes";
        } else if (time.equals("AFTERNOON")) {
            return "Traffic for next 15 minutes";
        } else {
            return "Traffic for next 5 minutes";
        }
    }
}