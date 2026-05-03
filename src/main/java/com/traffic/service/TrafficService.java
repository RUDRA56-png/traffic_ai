package com.traffic.service;

import com.traffic.dto.TrafficRequest;
import com.traffic.dto.TrafficResponse;
import com.traffic.model.TrafficData;
import com.traffic.repository.TrafficRepository;
import com.traffic.util.TrafficAI;
import com.traffic.alert.AlertService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrafficService {

    private final TrafficRepository repo;
    private final TrafficAI ai;
    private final AlertService alertService;

    // 🔐 ADMIN: Add traffic data
    public TrafficResponse processTraffic(TrafficRequest request) {

        TrafficData data = TrafficData.builder()
                .location(request.getLocation())
                .vehicleCount(request.getVehicleCount())
                .avgSpeed(request.getAvgSpeed())
                .timestamp(LocalDateTime.now())
                .build();

        repo.save(data);

        TrafficResponse response = buildResponse(
                request.getLocation(),
                request.getVehicleCount(),
                request.getAvgSpeed()
        );

        alertService.sendAlert(response.getAlert());

        return response;
    }

    // 👤 USER: Get latest prediction by road
    public TrafficResponse getPredictionByRoad(String location) {

        TrafficData data = repo
                .findTopByLocationOrderByTimestampDesc(location)
                .orElse(null);

        if (data == null) {
            return noDataResponse(location);
        }

        return buildResponse(
                location,
                data.getVehicleCount(),
                data.getAvgSpeed()
        );
    }

    // 🚗 ROUTE: Prediction from A → B
    public TrafficResponse getRoutePrediction(String start, String end) {

        String route = start + " → " + end;

        TrafficData data = repo
                .findTopByLocationOrderByTimestampDesc(start)
                .orElse(null);

        if (data == null) {
            // Try end location if start not found
            data = repo.findTopByLocationOrderByTimestampDesc(end).orElse(null);
        }

        if (data == null) {
            return noDataResponse(route);
        }

        return buildResponse(
                route,
                data.getVehicleCount(),
                data.getAvgSpeed()
        );
    }

    // 📊 Get all raw data
    public List<TrafficData> getAllTraffic() {
        return repo.findAll();
    }

    // 🔥 AUTO TIME DETECTION
    private String getCurrentTimeCategory() {
        int hour = LocalTime.now().getHour();
        if (hour >= 6 && hour < 10) return "MORNING";
        else if (hour >= 10 && hour < 16) return "AFTERNOON";
        else if (hour >= 16 && hour < 21) return "EVENING";
        else return "NIGHT";
    }

    // ✅ COMMON RESPONSE BUILDER - populates ALL fields frontend expects
    private TrafficResponse buildResponse(String road, int vehicleCount, double avgSpeed) {

        String time = getCurrentTimeCategory();
        String result = ai.predict(vehicleCount, avgSpeed, time);
        String duration = ai.predictDuration(vehicleCount, avgSpeed, time);

        String level = result.contains("HIGH") ? "HIGH"
                : result.contains("MEDIUM") ? "MEDIUM"
                : "LOW";

        return TrafficResponse.builder()
                .road(road)
                .location(road)           // FIX: populate location so frontend can use either field
                .alert(result + " (" + time + ")")
                .level(level)
                .trafficLevel(level)      // FIX: populate trafficLevel so frontend can use either field
                .duration(duration)
                .build();
    }

    // ✅ NO DATA RESPONSE
    private TrafficResponse noDataResponse(String road) {
        return TrafficResponse.builder()
                .road(road)
                .location(road)
                .alert("No traffic data available for this location")
                .level("UNKNOWN")
                .trafficLevel("UNKNOWN")
                .duration("N/A")
                .build();
    }
}
