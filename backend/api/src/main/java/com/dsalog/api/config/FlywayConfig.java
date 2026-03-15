package com.dsalog.api.config;

import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;
import jakarta.annotation.PostConstruct;

@Configuration
public class FlywayConfig {

    private final DataSource dataSource;

    // Spring Boot will automatically hand us your Supabase database connection here
    public FlywayConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void runFlywayMigration() {
        System.out.println("IGNITING MANUAL FLYWAY MIGRATION...");

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas("dsalog") // Matches your Supabase schema
                .defaultSchema("dsalog")
                .baselineOnMigrate(true)
                .baselineVersion("1")
                .load();

        flyway.migrate();

        System.out.println("FLYWAY MIGRATION COMPLETE!");
    }
}