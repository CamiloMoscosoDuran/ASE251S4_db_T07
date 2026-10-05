package pe.edu.vallegrande.lab;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.bson.Document;

public final class Main {
  private static final ObjectMapper JSON = new ObjectMapper();
  private static final String MONGO_DATABASE = "AgroTecnoDB";
  private static final String SQL_DATABASE = "agroTecno_db";

  record VersionInfo(int contract, String change, String checksum, String release, String gitSha, String appliedAt) {}
  record Probe(boolean up, long latencyMs, String target, String validation, String error) {}

  private static String env(String name) {
    var value = System.getenv(name);
    if (value == null || value.isBlank()) throw new IllegalStateException("Falta " + name);
    return value;
  }

  private static String optionalEnv(String name, String fallback) {
    var value = System.getenv(name);
    return value == null || value.isBlank() ? fallback : value;
  }

  private static MongoClient mongoClient() {
    var password = URLEncoder.encode(env("MONGO_PASSWORD"), StandardCharsets.UTF_8);
    var authSource = optionalEnv("MONGO_AUTH_SOURCE", "admin");
    var uri = "mongodb://%s:%s@%s:27017/?authSource=%s".formatted(
        env("MONGO_USER"), password, env("MONGO_HOST"), authSource);
    return MongoClients.create(MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(uri))
        .applyToSocketSettings(settings -> settings.connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(3, TimeUnit.SECONDS))
        .applyToClusterSettings(settings -> settings.serverSelectionTimeout(3, TimeUnit.SECONDS))
        .build());
  }

  private static long elapsed(long started) {
    return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
  }

  private static String safeError(Exception error) {
    var message = error.getMessage();
    return error.getClass().getSimpleName()
        + (message == null ? "" : ": " + message.replaceAll("[\\r\\n]+", " "));
  }

  private static Probe sqlServerProbe() {
    long started = System.nanoTime();
    try (var connection = DriverManager.getConnection(env("SQL_URL"), env("SQL_USER"), env("SQL_PASSWORD"));
         var statement = connection.prepareStatement(
             "SELECT TOP (1) user_id FROM seguridad.[user] WHERE username = ?")) {
      statement.setString(1, optionalEnv("SQL_SEED_USERNAME", "admin_agro"));
      statement.setQueryTimeout(3);
      try (var result = statement.executeQuery()) {
        if (!result.next()) throw new IllegalStateException("La semilla SQL no es visible");
      }
      return new Probe(true, elapsed(started), env("SQL_URL"), "conexión y lectura de usuario semilla", null);
    } catch (Exception error) {
      return new Probe(false, elapsed(started), optionalEnv("SQL_URL", "SQL Server"),
          "conexión y lectura de usuario semilla", safeError(error));
    }
  }

  private static Probe mongoProbe() {
    long started = System.nanoTime();
    try (var client = mongoClient()) {
      var found = client.getDatabase(MONGO_DATABASE).getCollection("customers")
          .find(new Document("_id", optionalEnv("MONGO_SEED_CUSTOMER_ID", "CUS001")))
          .limit(1).first();
      if (found == null) throw new IllegalStateException("La semilla MongoDB no es visible");
      return new Probe(true, elapsed(started), env("MONGO_HOST") + "/" + MONGO_DATABASE,
          "conexión y lectura de customer semilla", null);
    } catch (Exception error) {
      return new Probe(false, elapsed(started), optionalEnv("MONGO_HOST", "MongoDB"),
          "conexión y lectura de customer semilla", safeError(error));
    }
  }

  private static VersionInfo sqlServerVersion() throws Exception {
    try (var connection = DriverManager.getConnection(env("SQL_URL"), env("SQL_USER"), env("SQL_PASSWORD"));
         var statement = connection.prepareStatement(
             "SELECT TOP (1) [sequence], change_id, checksum, release_version, git_sha, "
                 + "CONVERT(varchar(33), applied_at, 126) "
                 + "FROM dbo.schema_changes ORDER BY [sequence] DESC")) {
      statement.setQueryTimeout(3);
      try (var result = statement.executeQuery()) {
        if (!result.next()) throw new IllegalStateException("SQL Server sin historial");
        return new VersionInfo(result.getInt(1), result.getString(2), result.getString(3),
            result.getString(4), result.getString(5), result.getString(6));
      }
    }
  }

  private static VersionInfo mongoVersion() throws Exception {
    try (var client = mongoClient()) {
      var document = client.getDatabase(MONGO_DATABASE).getCollection("schema_changes")
          .find().sort(new Document("sequence", -1)).limit(1).first();
      if (document == null) throw new IllegalStateException("MongoDB sin historial");
      var appliedAt = document.getDate("appliedAt");
      return new VersionInfo(document.getInteger("sequence"), document.getString("changeId"),
          document.getString("checksum"), document.getString("releaseVersion"),
          document.getString("gitSha"), appliedAt == null ? null : appliedAt.toInstant().toString());
    }
  }

  private static boolean aligned(VersionInfo sql, VersionInfo mongo) {
    var expected = optionalEnv("TARGET_SCHEMA_VERSION", "latest");
    boolean requested = expected.equals("latest")
        || (sql.contract() == Integer.parseInt(expected) && mongo.contract() == Integer.parseInt(expected));
    return requested && sql.contract() == mongo.contract()
        && sql.release().equals(mongo.release()) && sql.gitSha().equals(mongo.gitSha());
  }

  private static Map<String, Object> versionInfo(VersionInfo version) {
    return map("contract", version.contract(), "lastChange", version.change(),
        "checksum", version.checksum(), "release", version.release(),
        "gitSha", version.gitSha(), "appliedAt", version.appliedAt());
  }

  private static Map<String, Object> versionJson() throws Exception {
    var sql = sqlServerVersion();
    var mongo = mongoVersion();
    var gitSha = optionalEnv("GIT_SHA", "local");
    return map("runningImage", map("requestedTag", optionalEnv("IMAGE_REFERENCE", "local"),
            "immutableTag", optionalEnv("RELEASE_VERSION", "development"),
            "fullGitSha", gitSha, "shortGitSha", shortSha(gitSha)),
        "expectedContract", optionalEnv("TARGET_SCHEMA_VERSION", "latest"),
        "aligned", aligned(sql, mongo),
        "engines", map("sqlserver", versionInfo(sql), "mongodb", versionInfo(mongo)));
  }

  private static Map<String, Object> sqlServerContract() throws Exception {
    var columns = new ArrayList<Map<String, Object>>();
    long users;
    long orders;
    try (var connection = DriverManager.getConnection(env("SQL_URL"), env("SQL_USER"), env("SQL_PASSWORD"))) {
      try (var statement = connection.prepareStatement(
          "SELECT column_name, data_type, character_maximum_length, is_nullable "
              + "FROM information_schema.columns WHERE table_schema = 'seguridad' "
              + "AND table_name = 'user' ORDER BY ordinal_position")) {
        try (var result = statement.executeQuery()) {
          while (result.next()) {
            columns.add(map("name", result.getString(1), "type", result.getString(2),
                "maxLength", result.getObject(3), "nullable", result.getString(4).equals("YES")));
          }
        }
      }
      users = count(connection, "SELECT COUNT_BIG(*) FROM seguridad.[user]");
      orders = count(connection, "SELECT COUNT_BIG(*) FROM ventas.sales_order");
    }
    return map("database", SQL_DATABASE, "schema", "seguridad", "table", "user",
        "columns", columns, "users", users, "orders", orders,
        "applicationUser", env("SQL_USER"), "access", "configured credentials");
  }

  private static long count(java.sql.Connection connection, String query) throws Exception {
    try (var statement = connection.createStatement()) {
      statement.setQueryTimeout(3);
      try (var result = statement.executeQuery(query)) {
        result.next();
        return result.getLong(1);
      }
    }
  }

  private static Map<String, Object> mongoContract() throws Exception {
    try (var client = mongoClient()) {
      var database = client.getDatabase(MONGO_DATABASE);
      var collectionName = "customers";
      var info = database.listCollections().filter(new Document("name", collectionName)).first();
      if (info == null) throw new IllegalStateException("Colección customers no encontrada");
      var options = info.get("options", Document.class);
      var validator = options == null ? null : options.get("validator", Document.class);
      var jsonSchema = validator == null ? null : validator.get("$jsonSchema", Document.class);
      var properties = jsonSchema == null ? null : jsonSchema.get("properties", Document.class);
      var idSchema = properties == null ? null : properties.get("_id", Document.class);
      var indexes = new ArrayList<String>();
      for (var index : database.getCollection(collectionName).listIndexes()) {
        indexes.add(index.getString("name"));
      }
      return map("database", MONGO_DATABASE, "collection", collectionName,
          "idPattern", idSchema == null ? null : idSchema.getString("pattern"),
          "fields", properties == null ? List.of() : new ArrayList<>(properties.keySet()),
          "indexes", indexes, "documents", database.getCollection(collectionName).countDocuments(),
          "applicationUser", env("MONGO_USER"), "access", "configured credentials");
    }
  }

  private static Map<String, Object> contractJson() throws Exception {
    var sql = sqlServerVersion();
    var mongo = mongoVersion();
    return map("aligned", aligned(sql, mongo),
        "sqlserver", sqlServerContract(), "mongodb", mongoContract());
  }

  private static Object mongoSample(String collection, String idField, String id) throws Exception {
    try (var client = mongoClient()) {
      var document = client.getDatabase(MONGO_DATABASE).getCollection(collection)
          .find(new Document(idField, id)).first();
      return document == null ? null : JSON.readValue(document.toJson(), Object.class);
    }
  }

  private static Map<String, Object> sqlSample() throws Exception {
    try (var connection = DriverManager.getConnection(env("SQL_URL"), env("SQL_USER"), env("SQL_PASSWORD"));
         var statement = connection.prepareStatement(
             "SELECT TOP (1) order_id, mongo_customer_id, total_order, order_status, "
                 + "CONVERT(varchar(33), entry_date, 126) "
                 + "FROM ventas.sales_order WHERE mongo_customer_id = ? ORDER BY order_id")) {
      statement.setString(1, optionalEnv("SQL_SEED_CUSTOMER_ID", "CUS001"));
      statement.setQueryTimeout(3);
      try (var result = statement.executeQuery()) {
        if (!result.next()) return null;
        return map("orderId", result.getInt(1), "customerId", result.getString(2),
            "total", result.getBigDecimal(3), "status", result.getString(4),
            "entryDate", result.getString(5));
      }
    }
  }

  private static Map<String, Object> samplesJson() throws Exception {
    return map("sqlserver", sqlSample(),
        "mongodb", mongoSample("customers", "_id", optionalEnv("MONGO_SEED_CUSTOMER_ID", "CUS001")));
  }

  private static String shortSha(String value) {
    return value.length() <= 8 ? value : value.substring(0, 8);
  }

  private static Map<String, Object> map(Object... values) {
    var result = new LinkedHashMap<String, Object>();
    for (int index = 0; index < values.length; index += 2) {
      result.put((String) values[index], values[index + 1]);
    }
    return result;
  }

  private static Map<String, Object> probeJson(Probe probe) {
    return map("status", probe.up() ? "UP" : "DOWN", "latencyMs", probe.latencyMs(),
        "target", probe.target(), "validation", probe.validation(), "error", probe.error());
  }

  private static void respond(HttpExchange exchange, int status, String type, Object body) throws IOException {
    var bytes = body instanceof String text
        ? text.getBytes(StandardCharsets.UTF_8) : JSON.writeValueAsBytes(body);
    exchange.getResponseHeaders().set("Content-Type", type);
    exchange.getResponseHeaders().set("Cache-Control", "no-store");
    exchange.sendResponseHeaders(status, bytes.length);
    try (var output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private static void route(HttpExchange exchange) throws IOException {
    if (!exchange.getRequestMethod().equals("GET")) {
      respond(exchange, 405, "application/json", map("error", "method not allowed"));
      return;
    }
    try {
      switch (exchange.getRequestURI().getPath()) {
        case "/", "/health" -> respond(exchange, 200, "application/json",
            map("status", "UP", "service", "ase251s4-db-checker",
                "requestedTag", optionalEnv("IMAGE_REFERENCE", "local"),
                "release", optionalEnv("RELEASE_VERSION", "development"),
                "gitSha", shortSha(optionalEnv("GIT_SHA", "local")),
                "checkedAt", Instant.now().toString()));
        case "/connections" -> {
          var sql = sqlServerProbe();
          var mongo = mongoProbe();
          boolean up = sql.up() && mongo.up();
          respond(exchange, up ? 200 : 503, "application/json",
              map("status", up ? "UP" : "DEGRADED", "checkedAt", Instant.now().toString(),
                  "engines", map("sqlserver", probeJson(sql), "mongodb", probeJson(mongo))));
        }
        case "/version" -> respond(exchange, 200, "application/json", versionJson());
        case "/contract" -> {
          var contract = contractJson();
          boolean aligned = Boolean.TRUE.equals(contract.get("aligned"));
          respond(exchange, aligned ? 200 : 503, "application/json", contract);
        }
        case "/samples" -> respond(exchange, 200, "application/json", samplesJson());
        case "/diagnostics" -> {
          var sql = sqlServerProbe();
          var mongo = mongoProbe();
          var version = versionJson();
          var contract = contractJson();
          boolean ok = sql.up() && mongo.up() && Boolean.TRUE.equals(version.get("aligned"))
              && Boolean.TRUE.equals(contract.get("aligned"));
          respond(exchange, ok ? 200 : 503, "application/json",
              map("status", ok ? "UP" : "DEGRADED", "checkedAt", Instant.now().toString(),
                  "connections", map("sqlserver", probeJson(sql), "mongodb", probeJson(mongo)),
                  "version", version, "contract", contract));
        }
        case "/openapi.json" -> respond(exchange, 200, "application/json", OPENAPI);
        case "/swagger-ui", "/swagger-ui/" -> respond(exchange, 200,
            "text/html; charset=utf-8", SWAGGER);
        default -> respond(exchange, 404, "application/json",
            map("error", "route not found", "documentation", "/swagger-ui"));
      }
    } catch (Exception error) {
      respond(exchange, 503, "application/json",
          map("status", "DOWN", "error", safeError(error), "checkedAt", Instant.now().toString()));
    }
  }

  private static final String OPENAPI = """
      {"openapi":"3.0.3","info":{"title":"ASE251S4 SQL Server + MongoDB Checker","version":"1.0","description":"Verifica conectividad, contrato, historial y datos del laboratorio."},"paths":{"/health":{"get":{"summary":"Estado del proceso","responses":{"200":{"description":"Checker activo"}}}},"/connections":{"get":{"summary":"Conectividad real y latencia por motor","responses":{"200":{"description":"Ambos motores responden"},"503":{"description":"Algún motor falló"}}}},"/version":{"get":{"summary":"Versión, Git SHA e historial aplicado","responses":{"200":{"description":"Metadatos de versión"}}}},"/contract":{"get":{"summary":"Estructura, índices y versiones","responses":{"200":{"description":"Contrato alineado"},"503":{"description":"Contrato no alineado"}}}},"/samples":{"get":{"summary":"Datos de ejemplo leídos desde ambos motores","responses":{"200":{"description":"Muestras encontradas"}}}},"/diagnostics":{"get":{"summary":"Diagnóstico consolidado","responses":{"200":{"description":"Laboratorio consistente"},"503":{"description":"Diagnóstico degradado"}}}}}}
      """;

  private static final String SWAGGER = """
      <!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASE251S4 Database Checker</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/openapi.json',dom_id:'#swagger-ui',deepLinking:true,displayRequestDuration:true,tryItOutEnabled:true});</script></body></html>
      """;

  public static void main(String[] args) throws Exception {
    var server = HttpServer.create(new InetSocketAddress(Integer.parseInt(optionalEnv("PORT", "8080"))), 0);
    server.createContext("/", Main::route);
    server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    server.start();
    System.out.println("Checker: /health /connections /version /contract /samples /diagnostics /swagger-ui");
  }
}
