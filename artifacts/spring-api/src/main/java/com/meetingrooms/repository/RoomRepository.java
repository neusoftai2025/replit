package com.meetingrooms.repository;

import com.meetingrooms.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {

    @Query("SELECT r FROM Room r WHERE (:floor IS NULL OR r.floor = :floor) AND (:capacity IS NULL OR r.capacity >= :capacity)")
    List<Room> findByFilters(@Param("floor") Integer floor, @Param("capacity") Integer capacity);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.available = true")
    long countAvailable();
}
