package com.shopnest.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlPostProcessorTest {

    @Test
    void convertsProviderConnectionStringToJdbc() {
        var env = new MockEnvironment().withProperty("DB_URL",
                "postgresql://neondb_owner:p%40ss@ep-cool-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        new DatabaseUrlPostProcessor().postProcessEnvironment(env, null);

        assertThat(env.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://ep-cool-1.aws.neon.tech/neondb?sslmode=require");
        assertThat(env.getProperty("spring.datasource.username")).isEqualTo("neondb_owner");
        assertThat(env.getProperty("spring.datasource.password")).isEqualTo("p@ss");
    }

    @Test
    void leavesJdbcUrlsAlone() {
        var env = new MockEnvironment().withProperty("DB_URL", "jdbc:postgresql://localhost:5432/shopnest");

        new DatabaseUrlPostProcessor().postProcessEnvironment(env, null);

        assertThat(env.getPropertySources().contains("databaseUrl")).isFalse();
    }
}
