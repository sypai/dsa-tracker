# Step 1: Use a Maven image to build the project
FROM maven:3.9.6-eclipse-temurin-21 AS build
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Use a lightweight Java runtime to run the app
FROM eclipse-temurin:21-jre
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]