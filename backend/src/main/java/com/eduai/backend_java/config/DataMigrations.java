package com.eduai.backend_java.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time data migrations for schema changes that Hibernate's ddl-auto=update
 * cannot backfill on its own. Legacy assessments predate the INTERNAL/PLACEMENT
 * split — they were all created by admins, so they default to PLACEMENT and
 * stay published so students keep seeing them.
 */
@Component
public class DataMigrations implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public DataMigrations(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.update("UPDATE assessments SET assessment_category = 'PLACEMENT' WHERE assessment_category IS NULL");
            jdbc.update("UPDATE assessments SET published = TRUE WHERE published IS NULL");
            jdbc.update(
                "UPDATE assessments a JOIN system_users u ON a.created_by = u.username " +
                "SET a.creator_role = u.role WHERE a.creator_role IS NULL AND a.created_by IS NOT NULL");
        } catch (Exception e) {
            System.err.println("[DataMigrations] skipped: " + e.getMessage());
        }
    }
}
