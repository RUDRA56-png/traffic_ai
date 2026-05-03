package com.traffic.repository;

import com.traffic.model.TrafficData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrafficRepository extends JpaRepository<TrafficData, Long> {

    // 👇 VERY IMPORTANT (fixes your error)
    Optional<TrafficData> findTopByLocationOrderByTimestampDesc(String location);
}