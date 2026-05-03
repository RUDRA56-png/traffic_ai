package com.traffic.alert;

import org.springframework.stereotype.Service;

@Service
public class AlertService {

    public void sendAlert(String message) {
        System.out.println("🔔 ALERT: " + message);
    }
}