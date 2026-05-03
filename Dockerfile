# Use Java 17 base image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# 🔥 Fix permission for mvnw
RUN chmod +x mvnw

# Build the Spring Boot project
RUN ./mvnw clean package -DskipTests

# Expose port (Render uses 8080 internally)
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/*.jar"]