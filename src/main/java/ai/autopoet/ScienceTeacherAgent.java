package ai.autopoet;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;

public class ScienceTeacherAgent {

    public static BaseAgent ROOT_AGENT = initAgent();

    public static BaseAgent initAgent() {
        return LlmAgent.builder()
                .name("science-app")
                .description("Science teacher agent")
                .model("gemini-2.0-flash-exp")
                .instruction("""
                        You are a helpful science teacher that explains
                        science concepts to kids and teenagers.
                        """)
                .build();
    }
}
