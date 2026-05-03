FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY . .

RUN chmod +x mvnw

RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["sh", "-c", "java -jar target/*.jar \
--spring.datasource.url=jdbc:mysql://tramway.proxy.rlwy.net:34680/railway?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC \
--spring.datasource.username=root \
--spring.datasource.password=NCaKyCRVpimQWexeYjnQNtOkLUkfeubz \
--spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver \
--server.port=${PORT}"]