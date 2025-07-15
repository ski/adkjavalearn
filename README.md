mvn exec:java -Dexec.mainClass="com.google.adk.web.AdkWebServer" -Dexec.args="--adk.agents.source-dir=src/main/java" -Dexec.classpathScope="compile"

mvn compile exec:java "-Dexec.args=--server.port=8080 --adk.agents.source-dir=src/ --logging.level.com.google.adk.dev=DEBUG --logging.level.com.google.adk.demo.agents=DEBUG"