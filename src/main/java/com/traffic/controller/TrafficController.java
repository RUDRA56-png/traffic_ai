package com.traffic.controller;

import com.traffic.dto.RouteRequest;
import com.traffic.dto.TrafficRequest;
import com.traffic.dto.TrafficResponse;
import com.traffic.model.TrafficData;
import com.traffic.service.TrafficService;

import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traffic")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // allow all (can restrict later)
@Validated
public class TrafficController {

    private final TrafficService service;

    
    // 🔐 ADMIN → Add traffic data
    @PostMapping("/add")
    public TrafficResponse addTraffic(@RequestBody TrafficRequest request) {
        return service.processTraffic(request);
    }

    // 👤 USER → Get prediction by road
    @GetMapping("/predict/{location}")
    public TrafficResponse getPrediction(@PathVariable String location) {
        return service.getPredictionByRoad(location);
    }

    // 🚗 ROUTE → Predict from A → B
    @PostMapping("/route")
    public TrafficResponse routePrediction(@RequestBody RouteRequest request) {
        return service.getRoutePrediction(request.getStart(), request.getEnd());
    }

    // 📊 ADMIN → Get all traffic data
    @GetMapping("/all")
    public List<TrafficData> getAllTraffic() {
        return service.getAllTraffic();

        
    }
}