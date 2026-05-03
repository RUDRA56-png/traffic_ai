FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY . .

RUN chmod +x mvnw

# Build the project
RUN ./mvnw clean package -DskipTests

# 🔥 Pass environment variables
ENV DB_URL=${DB_URL}
ENV DB_USERNAME=${DB_USERNAME}
ENV DB_PASSWORD=${DB_PASSWORD}

EXPOSE 8080

CMD ["sh", "-c", "java -jar target/*.jar"]