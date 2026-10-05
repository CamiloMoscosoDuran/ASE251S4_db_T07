FROM maven:3.9.16-eclipse-temurin-21-noble AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-noble
ARG RELEASE_VERSION=development
ARG GIT_SHA=unknown
ENV RELEASE_VERSION=$RELEASE_VERSION GIT_SHA=$GIT_SHA
LABEL org.opencontainers.image.title="ASE251S4 SQL Server MongoDB Checker" \
      org.opencontainers.image.version="$RELEASE_VERSION" \
      org.opencontainers.image.revision="$GIT_SHA"
WORKDIR /app
COPY --from=build --chown=10001:10001 /src/target/check.jar /app/check.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/check.jar"]
