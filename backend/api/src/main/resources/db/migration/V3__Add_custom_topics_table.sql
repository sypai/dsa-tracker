CREATE TABLE user_custom_topics (
    user_id BIGINT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_custom_topics 
        FOREIGN KEY (user_id) 
        REFERENCES users (id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_user_topics_user_id ON user_custom_topics(user_id);