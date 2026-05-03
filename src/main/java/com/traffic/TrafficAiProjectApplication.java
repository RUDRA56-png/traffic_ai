package com.traffic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrafficAiProjectApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrafficAiProjectApplication.class, args);
    }
}