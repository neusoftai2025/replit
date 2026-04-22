package com.meetingrooms.repository;

import com.meetingrooms.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    @Query("SELECT r FROM Reservation r WHERE " +
           "(:roomId IS NULL OR r.roomId = :roomId) AND " +
           "(:date IS NULL OR r.date = :date) AND " +
           "(:userId IS NULL OR r.userId = :userId)")
    List<Reservation> findByFilters(
            @Param("roomId") Integer roomId,
            @Param("date") String date,
            @Param("userId") Integer userId);

    List<Reservation> findByDate(String date);

    @Query("SELECT r FROM Reservation r WHERE r.roomId = :roomId AND r.date = :date AND " +
           "NOT (r.endTime <= :startTime OR r.startTime >= :endTime)")
    List<Reservation> findConflicting(
            @Param("roomId") Integer roomId,
            @Param("date") String date,
            @Param("startTime") String startTime,
            @Param("endTime") String endTime);

    @Query("SELECT r FROM Reservation r WHERE r.roomId = :roomId AND r.date = :date AND r.id <> :excludeId AND " +
           "NOT (r.endTime <= :startTime OR r.startTime >= :endTime)")
    List<Reservation> findConflictingExcluding(
            @Param("roomId") Integer roomId,
            @Param("date") String date,
            @Param("startTime") String startTime,
            @Param("endTime") String endTime,
            @Param("excludeId") Integer excludeId);

    @Query("SELECT r.roomId, COUNT(r) FROM Reservation r GROUP BY r.roomId ORDER BY COUNT(r) DESC")
    List<Object[]> findRoomUsageStats();
}
